/**
 * OpenArcade Game Rating Widget
 *
 * Drop-in: add <script src="../rating.js"></script> to any game page.
 * Detects game-over state, shows a non-obtrusive 5-star rating bar.
 * If user rates, expands to optional text feedback.
 * Sends data to POST /api/events/rating on the ingest hub.
 * Shows AI classification response and email collection for actionable feedback.
 * Does NOT block game restart — widget sits outside the overlay.
 */
(function () {
  'use strict';

  // ── Config ──────────────────────────────────────────────
  var RATING_URL = '/api/events/rating';
  var EMAIL_URL = '/api/events/feedback-email';
  var SHOW_DELAY_MS = 800; // delay after game-over before showing widget

  // ── State ───────────────────────────────────────────────
  var gameName = detectGameName();
  var visitorId = localStorage.getItem('arcade_collector_id') || 'anon';
  var sessionRated = false;
  var widget = null;
  var currentRating = 0;
  var widgetVisible = false;

  function detectGameName() {
    var path = window.location.pathname;
    var parts = path.split('/').filter(Boolean);
    // e.g. /tetris/index.html -> tetris
    for (var i = parts.length - 1; i >= 0; i--) {
      if (parts[i] !== 'index.html' && parts[i] !== 'keypad.html' && parts[i] !== 'v2.html' && parts[i] !== 'autoplay.html') return parts[i];
    }
    return 'unknown';
  }

  // ── Global keyboard blocker (capture phase) ────────────
  // When the widget is visible, intercept ALL keyboard events at the
  // document level during the capture phase so they never reach game listeners.
  function blockGameKeys(e) {
    if (!widgetVisible) return;
    // Allow Escape to dismiss
    if (e.key === 'Escape') {
      hideWidget();
      sessionRated = true;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // Only block keys when user is actively typing in widget's textarea or email input.
    // Otherwise let keys through so the game can restart, and auto-dismiss the widget.
    var active = document.activeElement;
    var isTyping = widget && widget.contains(active) &&
                   (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT');
    if (!isTyping) {
      hideWidget();
      return;
    }
    // Typing in widget — block events from reaching the game
    e.stopPropagation();
    e.stopImmediatePropagation();
  }

  ['keydown', 'keyup', 'keypress'].forEach(function (evt) {
    document.addEventListener(evt, blockGameKeys, true); // capture phase
  });

  // ── Build widget DOM ────────────────────────────────────
  function createWidget() {
    var container = document.createElement('div');
    container.id = 'arcade-rating';
    container.innerHTML =
      '<div class="ar-prompt">Rate this game</div>' +
      '<div class="ar-stars">' +
        '<span class="ar-star" data-v="1">&#9733;</span>' +
        '<span class="ar-star" data-v="2">&#9733;</span>' +
        '<span class="ar-star" data-v="3">&#9733;</span>' +
        '<span class="ar-star" data-v="4">&#9733;</span>' +
        '<span class="ar-star" data-v="5">&#9733;</span>' +
      '</div>' +
      '<div class="ar-feedback" style="display:none;">' +
        '<textarea class="ar-textarea" placeholder="Any suggestions to make the game better? Bugs? Anything else?" rows="3" maxlength="500"></textarea>' +
        '<button class="ar-submit">Send</button>' +
      '</div>' +
      '<div class="ar-ai-response" style="display:none;"></div>' +
      '<div class="ar-email-prompt" style="display:none;">' +
        '<p class="ar-email-text"></p>' +
        '<div class="ar-email-row">' +
          '<input type="email" class="ar-email-input" placeholder="your@email.com">' +
          '<button class="ar-email-submit">Notify me</button>' +
        '</div>' +
      '</div>' +
      '<div class="ar-thanks" style="display:none;">Thanks!</div>' +
      '<button class="ar-dismiss">&times;</button>';

    // Inject styles
    var style = document.createElement('style');
    style.textContent =
      '#arcade-rating {' +
        'position: fixed; bottom: 20px; right: 20px; z-index: 9999;' +
        'background: #16213e; border: 1px solid #0f3460; border-radius: 12px;' +
        'padding: 14px 18px; font-family: "Courier New", monospace;' +
        'box-shadow: 0 4px 24px rgba(0,0,0,0.5); max-width: 300px;' +
        'opacity: 0; transform: translateY(20px);' +
        'transition: opacity 0.3s, transform 0.3s;' +
      '}' +
      '#arcade-rating.ar-visible { opacity: 1; transform: translateY(0); }' +
      '#arcade-rating.ar-hidden { display: none; }' +
      '.ar-prompt { color: #888; font-size: 0.8rem; margin-bottom: 6px; }' +
      '.ar-stars { display: flex; gap: 4px; }' +
      '.ar-star {' +
        'font-size: 1.6rem; color: #333; cursor: pointer;' +
        'transition: color 0.15s, transform 0.15s;' +
      '}' +
      '.ar-star:hover, .ar-star.ar-hover { color: #fd0; transform: scale(1.15); }' +
      '.ar-star.ar-active { color: #fd0; }' +
      '.ar-feedback { margin-top: 10px; }' +
      '.ar-textarea {' +
        'width: 100%; background: #0d1a33; border: 1px solid #0f3460;' +
        'border-radius: 6px; color: #e0e0e0; padding: 8px; font-size: 0.8rem;' +
        'font-family: "Courier New", monospace; resize: none; outline: none;' +
        'box-sizing: border-box;' +
      '}' +
      '.ar-textarea:focus { border-color: #0ff; }' +
      '.ar-submit {' +
        'margin-top: 6px; padding: 6px 16px; background: rgba(0,255,255,0.1);' +
        'border: 1px solid #0ff; border-radius: 6px; color: #0ff;' +
        'font-family: "Courier New", monospace; font-size: 0.8rem;' +
        'cursor: pointer; transition: background 0.2s;' +
      '}' +
      '.ar-submit:hover { background: rgba(0,255,255,0.2); }' +
      '.ar-ai-response {' +
        'margin-top: 10px; padding: 10px; background: #0d1a33;' +
        'border: 1px solid #0f3460; border-radius: 6px;' +
        'font-size: 0.78rem; color: #ccc; line-height: 1.4;' +
      '}' +
      '.ar-ai-response .ar-ai-tag {' +
        'display: inline-block; font-size: 0.65rem; padding: 2px 6px;' +
        'border-radius: 3px; margin-bottom: 6px; font-weight: bold;' +
        'letter-spacing: 0.5px;' +
      '}' +
      '.ar-ai-tag-feature { background: rgba(0,255,255,0.15); color: #0ff; border: 1px solid rgba(0,255,255,0.3); }' +
      '.ar-ai-tag-bug { background: rgba(255,80,80,0.15); color: #f55; border: 1px solid rgba(255,80,80,0.3); }' +
      '.ar-ai-tag-feedback { background: rgba(136,136,255,0.15); color: #88f; border: 1px solid rgba(136,136,255,0.3); }' +
      '.ar-email-prompt { margin-top: 10px; }' +
      '.ar-email-text { color: #0f8; font-size: 0.78rem; margin: 0 0 8px 0; line-height: 1.4; }' +
      '.ar-email-row { display: flex; gap: 6px; }' +
      '.ar-email-input {' +
        'flex: 1; background: #0d1a33; border: 1px solid #0f3460;' +
        'border-radius: 6px; color: #e0e0e0; padding: 6px 8px; font-size: 0.75rem;' +
        'font-family: "Courier New", monospace; outline: none;' +
      '}' +
      '.ar-email-input:focus { border-color: #0f8; }' +
      '.ar-email-submit {' +
        'padding: 6px 12px; background: rgba(0,255,136,0.1);' +
        'border: 1px solid #0f8; border-radius: 6px; color: #0f8;' +
        'font-family: "Courier New", monospace; font-size: 0.75rem;' +
        'cursor: pointer; white-space: nowrap;' +
      '}' +
      '.ar-email-submit:hover { background: rgba(0,255,136,0.2); }' +
      '.ar-fork-row { margin-top: 10px; }' +
      '.ar-fork-btn {' +
        'display: block; text-align: center; padding: 7px 12px;' +
        'background: rgba(139,92,246,0.12); border: 1px solid rgba(139,92,246,0.4);' +
        'border-radius: 6px; color: #a78bfa; font-family: "Courier New", monospace;' +
        'font-size: 0.75rem; text-decoration: none; transition: background 0.2s;' +
      '}' +
      '.ar-fork-btn:hover { background: rgba(139,92,246,0.22); }' +
      '.ar-thanks { color: #0f8; font-size: 0.9rem; margin-top: 8px; }' +
      '.ar-dismiss {' +
        'position: absolute; top: 6px; right: 8px; background: none;' +
        'border: none; color: #555; font-size: 1.1rem; cursor: pointer;' +
        'line-height: 1; padding: 2px 4px;' +
      '}' +
      '.ar-dismiss:hover { color: #aaa; }' +
      '.ar-spinner {' +
        'display: inline-block; width: 12px; height: 12px;' +
        'border: 2px solid rgba(0,255,255,0.3); border-top-color: #0ff;' +
        'border-radius: 50%; animation: ar-spin 0.6s linear infinite;' +
        'vertical-align: middle; margin-right: 6px;' +
      '}' +
      '@keyframes ar-spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
    document.body.appendChild(container);

    // Wire up stars
    var stars = container.querySelectorAll('.ar-star');
    stars.forEach(function (star) {
      star.addEventListener('mouseenter', function () {
        var v = parseInt(star.getAttribute('data-v'));
        stars.forEach(function (s) {
          s.classList.toggle('ar-hover', parseInt(s.getAttribute('data-v')) <= v);
        });
      });
      star.addEventListener('mouseleave', function () {
        stars.forEach(function (s) { s.classList.remove('ar-hover'); });
      });
      star.addEventListener('click', function () {
        currentRating = parseInt(star.getAttribute('data-v'));
        stars.forEach(function (s) {
          s.classList.toggle('ar-active', parseInt(s.getAttribute('data-v')) <= currentRating);
        });
        // Show feedback area
        container.querySelector('.ar-feedback').style.display = 'block';
        sendRatingBeacon(currentRating, '');
        // Focus the textarea so the user can start typing immediately
        setTimeout(function () {
          container.querySelector('.ar-textarea').focus();
        }, 50);
      });
    });

    // Wire up submit feedback — uses fetch to get AI classification response
    container.querySelector('.ar-submit').addEventListener('click', function () {
      var textarea = container.querySelector('.ar-textarea');
      var feedback = textarea.value.trim();
      if (!feedback) {
        // No text — just close with thanks
        container.querySelector('.ar-feedback').style.display = 'none';
        container.querySelector('.ar-thanks').style.display = 'block';
        sessionRated = true;
        setTimeout(function () { hideWidget(); }, 1500);
        return;
      }
      // Show spinner while waiting for AI classification
      var submitBtn = container.querySelector('.ar-submit');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="ar-spinner"></span>Analyzing...';

      sendRatingWithResponse(currentRating, feedback, function (data) {
        container.querySelector('.ar-feedback').style.display = 'none';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send';

        if (data && data.classification && data.classification !== 'invalid') {
          showAIResponse(container, data);
        } else {
          container.querySelector('.ar-thanks').style.display = 'block';
          sessionRated = true;
          setTimeout(function () { hideWidget(); }, 2000);
        }
      });
    });

    // Wire up email submit
    container.querySelector('.ar-email-submit').addEventListener('click', function () {
      var emailInput = container.querySelector('.ar-email-input');
      var email = emailInput.value.trim();
      if (!email || email.indexOf('@') === -1) {
        emailInput.style.borderColor = '#f55';
        return;
      }
      sendEmail(email);
      container.querySelector('.ar-email-prompt').style.display = 'none';
      container.querySelector('.ar-thanks').style.display = 'block';
      container.querySelector('.ar-thanks').textContent = "We'll email you when it's live!";
      sessionRated = true;
      setTimeout(function () { hideWidget(); }, 2500);
    });

    // Wire up dismiss
    container.querySelector('.ar-dismiss').addEventListener('click', function () {
      hideWidget();
      sessionRated = true; // don't show again this session
    });

    return container;
  }

  function showAIResponse(container, data) {
    var aiDiv = container.querySelector('.ar-ai-response');
    var cls = data.classification;
    var tagClass = cls === 'feature_suggestion' ? 'ar-ai-tag-feature'
      : cls === 'bug_report' ? 'ar-ai-tag-bug'
      : 'ar-ai-tag-feedback';
    var tagLabel = cls === 'feature_suggestion' ? 'FEATURE IDEA'
      : cls === 'bug_report' ? 'BUG REPORT'
      : 'FEEDBACK';

    aiDiv.innerHTML =
      '<span class="ar-ai-tag ' + tagClass + '">' + tagLabel + '</span>' +
      '<div>' + (data.message || 'Thanks for the feedback!') + '</div>' +
      '<div class="ar-fork-row"><a class="ar-fork-btn" href="/game-builder/?fork=' + encodeURIComponent(gameName) + '&seed=' + encodeURIComponent(data.feedback || '') + '">\uD83C\uDFAE Fork &amp; Modify This Game \u2192</a></div>';
    aiDiv.style.display = 'block';

    // For actionable feedback (feature/bug), show email collection
    if (cls === 'feature_suggestion' || cls === 'bug_report') {
      var emailPrompt = container.querySelector('.ar-email-prompt');
      var emailText = container.querySelector('.ar-email-text');
      emailText.textContent = "We're using AI to build this — should be ready in ~15 min. Want to be notified?";
      emailPrompt.style.display = 'block';
      setTimeout(function () {
        container.querySelector('.ar-email-input').focus();
      }, 100);
    } else {
      // General feedback — auto-dismiss after a bit
      sessionRated = true;
      setTimeout(function () { hideWidget(); }, 4000);
    }
  }

  function showWidget() {
    if (sessionRated) return;
    if (!widget) widget = createWidget();
    widget.classList.remove('ar-hidden');
    widgetVisible = true;
    // Reset state
    currentRating = 0;
    widget.querySelectorAll('.ar-star').forEach(function (s) { s.classList.remove('ar-active'); });
    widget.querySelector('.ar-feedback').style.display = 'none';
    widget.querySelector('.ar-ai-response').style.display = 'none';
    widget.querySelector('.ar-email-prompt').style.display = 'none';
    widget.querySelector('.ar-thanks').style.display = 'none';
    widget.querySelector('.ar-thanks').textContent = 'Thanks!';
    // Trigger animation
    requestAnimationFrame(function () {
      widget.classList.add('ar-visible');
    });
  }

  function hideWidget() {
    if (!widget) return;
    widgetVisible = false;
    widget.classList.remove('ar-visible');
    setTimeout(function () { widget.classList.add('ar-hidden'); }, 300);
  }

  // Fire-and-forget rating (for initial star click, no text feedback)
  function sendRatingBeacon(rating, feedback) {
    var payload = {
      event: 'game_rating',
      game: gameName,
      rating: rating,
      feedback: feedback || '',
      visitor_id: visitorId,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      user_agent: navigator.userAgent
    };
    try {
      navigator.sendBeacon(RATING_URL, JSON.stringify(payload));
    } catch (e) { /* silent */ }
  }

  // Send rating with feedback text — use fetch to get AI classification response
  function sendRatingWithResponse(rating, feedback, callback) {
    var payload = {
      event: 'game_rating',
      game: gameName,
      rating: rating,
      feedback: feedback,
      visitor_id: visitorId,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      user_agent: navigator.userAgent
    };
    fetch(RATING_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function (r) { return r.json(); })
    .then(function (data) { callback(data); })
    .catch(function () { callback(null); });
  }

  // Save email for notification
  function sendEmail(email) {
    var payload = {
      game: gameName,
      email: email,
      visitor_id: visitorId,
      timestamp: new Date().toISOString()
    };
    try {
      navigator.sendBeacon(EMAIL_URL, JSON.stringify(payload));
    } catch (e) { /* silent */ }
  }

  // ── Detect game-over via overlay visibility ─────────────
  // All OpenArcade games show the #overlay div on game-over
  function watchForGameOver() {
    var overlay = document.getElementById('overlay');
    if (!overlay) return;

    var lastState = overlay.style.display;
    var observer = new MutationObserver(function () {
      var nowVisible = overlay.style.display === 'flex';
      var wasHidden = lastState !== 'flex';
      lastState = overlay.style.display;

      if (nowVisible && wasHidden) {
        // Check if it's game-over (not the initial waiting screen)
        var title = overlay.querySelector('#overlayTitle');
        if (title && /game over|you (win|lose|died|crashed)|time.?s up|final|score/i.test(title.textContent)) {
          setTimeout(showWidget, SHOW_DELAY_MS);
        }
      } else if (!nowVisible) {
        // Game restarted — hide widget
        hideWidget();
      }
    });

    observer.observe(overlay, { attributes: true, attributeFilter: ['style'] });
  }

  // ── Init ────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watchForGameOver);
  } else {
    watchForGameOver();
  }

})();

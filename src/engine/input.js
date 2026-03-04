const KEY_ALIASES = {
  ' ': 'Space',
  Spacebar: 'Space',
  Esc: 'Escape',
  Left: 'ArrowLeft',
  Right: 'ArrowRight',
  Up: 'ArrowUp',
  Down: 'ArrowDown',
  Del: 'Delete',
  OS: 'Meta',
};

const CODE_TO_KEY = {
  Space: 'Space',
  ArrowLeft: 'ArrowLeft',
  ArrowRight: 'ArrowRight',
  ArrowUp: 'ArrowUp',
  ArrowDown: 'ArrowDown',
  KeyA: 'a',
  KeyD: 'd',
  KeyW: 'w',
  KeyS: 's',
  ShiftLeft: 'Shift',
  ShiftRight: 'Shift',
  Enter: 'Enter',
  Escape: 'Escape',
};

const KEYCODE_TO_KEY = {
  32: 'Space',
  37: 'ArrowLeft',
  38: 'ArrowUp',
  39: 'ArrowRight',
  40: 'ArrowDown',
  65: 'a',
  68: 'd',
  83: 's',
  87: 'w',
  13: 'Enter',
  16: 'Shift',
  27: 'Escape',
};

const KEYIDENTIFIER_TO_KEY = {
  Left: 'ArrowLeft',
  Right: 'ArrowRight',
  Up: 'ArrowUp',
  Down: 'ArrowDown',
  U+0020: 'Space',
  U+001B: 'Escape',
  U+000D: 'Enter',
};

const BROWSER_FEATURES = (() => {
  if (typeof KeyboardEvent === 'undefined') {
    return {
      code: false,
      key: false,
      keyIdentifier: false,
      keyCode: false,
      passiveEvents: false,
    };
  }

  const proto = KeyboardEvent.prototype;
  const features = {
    code: 'code' in proto,
    key: 'key' in proto,
    keyIdentifier: 'keyIdentifier' in proto,
    keyCode: 'keyCode' in proto,
    passiveEvents: false,
  };

  try {
    const opts = Object.defineProperty({}, 'passive', {
      get() {
        features.passiveEvents = true;
        return false;
      },
    });

    window.addEventListener('openarcade-passive-test', null, opts);
    window.removeEventListener('openarcade-passive-test', null, opts);
  } catch {
    features.passiveEvents = false;
  }

  return features;
})();

function normalizeKeyName(key) {
  if (typeof key !== 'string' || key.length === 0) return '';
  if (KEY_ALIASES[key]) return KEY_ALIASES[key];
  if (key.length === 1) return key.toLowerCase();
  return key;
}

function getLegacyCode(evt) {
  const code = Number(evt?.keyCode ?? evt?.which ?? evt?.charCode);
  if (!Number.isFinite(code)) return '';
  return KEYCODE_TO_KEY[code] || '';
}

function shouldIgnoreTarget(target) {
  if (!target || typeof target !== 'object') return false;
  if (target.isContentEditable) return true;

  const tag = typeof target.tagName === 'string' ? target.tagName.toLowerCase() : '';
  return tag === 'input' || tag === 'textarea' || tag === 'select';
}

function eventKeys(evt) {
  const resolved = new Set();

  if (BROWSER_FEATURES.code && typeof evt.code === 'string' && evt.code) {
    resolved.add(evt.code);
    const fromCode = CODE_TO_KEY[evt.code];
    if (fromCode) resolved.add(fromCode);
  }

  if (BROWSER_FEATURES.key && typeof evt.key === 'string' && evt.key && evt.key !== 'Unidentified') {
    resolved.add(normalizeKeyName(evt.key));
  }

  if (BROWSER_FEATURES.keyIdentifier && typeof evt.keyIdentifier === 'string' && evt.keyIdentifier) {
    const fromIdentifier = KEYIDENTIFIER_TO_KEY[evt.keyIdentifier];
    if (fromIdentifier) resolved.add(fromIdentifier);
  }

  if (BROWSER_FEATURES.keyCode) {
    const legacyKey = getLegacyCode(evt);
    if (legacyKey) resolved.add(legacyKey);
  }

  if (!resolved.size) {
    resolved.add(normalizeKeyName(evt?.key || ''));
  }

  return Array.from(resolved).filter(Boolean);
}

function isPreventDefaultKey(key) {
  return key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight' || key === 'Space';
}

export class Input {
  constructor({ target = document, clearOnVisibilityChange = true } = {}) {
    this._target = target;
    this._down = new Set();
    this._pressed = new Set();
    this._released = new Set();
    this._destroyed = false;

    this.features = { ...BROWSER_FEATURES };

    this._onKeyDown = (evt) => {
      if (this._destroyed) return;
      if (evt?.isComposing || evt?.keyCode === 229) return;
      if (shouldIgnoreTarget(evt?.target)) return;

      const keys = eventKeys(evt);
      if (!keys.length) return;

      if (keys.some(isPreventDefaultKey) && evt.cancelable) {
        evt.preventDefault();
      }

      for (const key of keys) {
        if (!this._down.has(key)) this._pressed.add(key);
        this._down.add(key);
      }
    };

    this._onKeyUp = (evt) => {
      if (this._destroyed) return;
      const keys = eventKeys(evt);
      for (const key of keys) {
        this._down.delete(key);
        this._released.add(key);
      }

      if (keys.includes('Meta') || keys.includes('MetaLeft') || keys.includes('MetaRight')) {
        this.clear();
      }
    };

    this._onBlur = () => this.clear();
    this._onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') this.clear();
    };

    const opts = this.features.passiveEvents ? { passive: false } : false;
    this._target.addEventListener('keydown', this._onKeyDown, opts);
    this._target.addEventListener('keyup', this._onKeyUp, opts);

    window.addEventListener('blur', this._onBlur);
    if (clearOnVisibilityChange) {
      document.addEventListener('visibilitychange', this._onVisibilityChange);
    }

    this._clearOnVisibilityChange = clearOnVisibilityChange;
  }

  _resolveQueryKeys(key) {
    const query = normalizeKeyName(key);
    const out = new Set([query]);

    if (query in CODE_TO_KEY) out.add(CODE_TO_KEY[query]);
    if (query in KEY_ALIASES) out.add(KEY_ALIASES[query]);

    if (query === 'Space') {
      out.add(' ');
      out.add('Spacebar');
      out.add('U+0020');
    }

    return Array.from(out).filter(Boolean);
  }

  isDown(key) {
    for (const candidate of this._resolveQueryKeys(key)) {
      if (this._down.has(candidate)) return true;
    }
    return false;
  }

  wasPressed(key) {
    for (const candidate of this._resolveQueryKeys(key)) {
      if (this._pressed.has(candidate)) return true;
    }
    return false;
  }

  wasReleased(key) {
    for (const candidate of this._resolveQueryKeys(key)) {
      if (this._released.has(candidate)) return true;
    }
    return false;
  }

  endFrame() {
    this._pressed.clear();
    this._released.clear();
  }

  clear() {
    this._down.clear();
    this._pressed.clear();
    this._released.clear();
  }

  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;

    this._target.removeEventListener('keydown', this._onKeyDown);
    this._target.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('blur', this._onBlur);

    if (this._clearOnVisibilityChange) {
      document.removeEventListener('visibilitychange', this._onVisibilityChange);
    }

    this.clear();
  }
}

export default Input;
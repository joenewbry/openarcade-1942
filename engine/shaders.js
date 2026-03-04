// engine/shaders.js — GLSL shaders for WebGL 2 sprite batcher + bloom post-process

// ── Main batch shader: renders rects, circles, lines as instanced quads ──
export const batchVert = `#version 300 es
precision highp float;

// Per-vertex (unit quad: 0,0 → 1,1)
in vec2 a_pos;

// Per-instance
in vec4 a_rect;      // x, y, w, h
in vec4 a_color;     // r, g, b, a
in vec4 a_params;    // shape(0=rect,1=circle,2=line), glow, borderRadius, lineWidth

uniform vec2 u_resolution;

out vec2 v_uv;
out vec4 v_color;
out vec4 v_params;
out vec2 v_size;

void main() {
  vec2 size = a_rect.zw;
  vec2 pos = a_rect.xy + a_pos * size;

  // Convert to clip space: [0, resolution] → [-1, 1]
  vec2 clip = (pos / u_resolution) * 2.0 - 1.0;
  clip.y = -clip.y; // flip Y to match canvas coords (top-left origin)

  gl_Position = vec4(clip, 0.0, 1.0);
  v_uv = a_pos;
  v_color = a_color;
  v_params = a_params;
  v_size = size;
}
`;

export const batchFrag = `#version 300 es
precision highp float;

in vec2 v_uv;
in vec4 v_color;
in vec4 v_params;
in vec2 v_size;

out vec4 fragColor;

void main() {
  float shape = v_params.x;
  float glow = v_params.y;

  if (shape > 0.5 && shape < 1.5) {
    // Circle: distance from center
    vec2 center = v_uv - 0.5;
    float dist = length(center);
    float radius = 0.5;
    float aa = fwidth(dist);
    float alpha = 1.0 - smoothstep(radius - aa, radius, dist);
    if (alpha < 0.01) discard;
    fragColor = vec4(v_color.rgb, v_color.a * alpha);
  } else {
    // Rect (or line rendered as thin rect)
    fragColor = v_color;
  }

  // Tag glow intensity in alpha for bloom extraction
  // Glow > 0 means this primitive should bloom
  if (glow > 0.0) {
    // Boost RGB slightly and ensure minimum alpha for bloom pass
    fragColor.rgb *= (1.0 + glow * 0.3);
  }
}
`;

// ── Dashed line shader: renders center-line with configurable dash pattern ──
export const dashedVert = `#version 300 es
precision highp float;

in vec2 a_pos;
in float a_dist; // distance along the line

uniform vec2 u_resolution;

out float v_dist;

void main() {
  vec2 clip = (a_pos / u_resolution) * 2.0 - 1.0;
  clip.y = -clip.y;
  gl_Position = vec4(clip, 0.0, 1.0);
  v_dist = a_dist;
}
`;

export const dashedFrag = `#version 300 es
precision highp float;

in float v_dist;
uniform vec4 u_color;
uniform float u_dashLen;
uniform float u_gapLen;

out vec4 fragColor;

void main() {
  float cycle = u_dashLen + u_gapLen;
  float pos = mod(v_dist, cycle);
  if (pos > u_dashLen) discard;
  fragColor = u_color;
}
`;

// ── Text shader: textured quads from bitmap font atlas ──
export const textVert = `#version 300 es
precision highp float;

in vec2 a_pos;
in vec2 a_texCoord;
in vec4 a_color;

uniform vec2 u_resolution;

out vec2 v_texCoord;
out vec4 v_color;

void main() {
  vec2 clip = (a_pos / u_resolution) * 2.0 - 1.0;
  clip.y = -clip.y;
  gl_Position = vec4(clip, 0.0, 1.0);
  v_texCoord = a_texCoord;
  v_color = a_color;
}
`;

export const textFrag = `#version 300 es
precision highp float;

in vec2 v_texCoord;
in vec4 v_color;

uniform sampler2D u_texture;

out vec4 fragColor;

void main() {
  // Sample red channel — atlas is white text on black background (alpha=1 everywhere)
  float alpha = texture(u_texture, v_texCoord).r;
  if (alpha < 0.1) discard;
  fragColor = vec4(v_color.rgb, v_color.a * alpha);
}
`;

// ── Vertex-colored triangle shader (for lines, polygons, filled shapes) ──
export const triVert = `#version 300 es
precision highp float;

in vec2 a_pos;
in vec4 a_color;

uniform vec2 u_resolution;

out vec4 v_color;

void main() {
  vec2 clip = (a_pos / u_resolution) * 2.0 - 1.0;
  clip.y = -clip.y;
  gl_Position = vec4(clip, 0.0, 1.0);
  v_color = a_color;
}
`;

export const triFrag = `#version 300 es
precision highp float;

in vec4 v_color;
out vec4 fragColor;

void main() {
  fragColor = v_color;
}
`;

// ── Bloom shaders: extract bright → blur → composite ──
export const bloomExtractFrag = `#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_texture;
uniform float u_threshold;

out vec4 fragColor;

void main() {
  vec4 color = texture(u_texture, v_uv);
  float brightness = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
  if (brightness > u_threshold) {
    fragColor = color;
  } else {
    fragColor = vec4(0.0);
  }
}
`;

export const bloomBlurFrag = `#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_texture;
uniform vec2 u_direction; // (1/w, 0) or (0, 1/h)
uniform float u_radius;

out vec4 fragColor;

void main() {
  vec4 sum = vec4(0.0);
  float total = 0.0;

  for (float i = -6.0; i <= 6.0; i += 1.0) {
    float weight = exp(-0.5 * (i * i) / (u_radius * u_radius));
    sum += texture(u_texture, v_uv + u_direction * i) * weight;
    total += weight;
  }

  fragColor = sum / total;
}
`;

// Fullscreen quad vertex shader (for bloom passes)
export const fullscreenVert = `#version 300 es
precision highp float;

in vec2 a_pos;
out vec2 v_uv;

void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

// ── Sprite shader: renders textured quads with alpha modulation ──
export const spriteVert = `#version 300 es
precision highp float;

in vec2 a_pos;
in vec2 a_texCoord;

uniform vec2 u_resolution;

out vec2 v_texCoord;

void main() {
  vec2 clip = (a_pos / u_resolution) * 2.0 - 1.0;
  clip.y = -clip.y;
  gl_Position = vec4(clip, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`;

export const spriteFrag = `#version 300 es
precision highp float;

in vec2 v_texCoord;

uniform sampler2D u_texture;
uniform float u_alpha;

out vec4 fragColor;

void main() {
  vec4 color = texture(u_texture, v_texCoord);
  if (color.a < 0.01) discard;
  fragColor = vec4(color.rgb, color.a * u_alpha);
}
`;

export const bloomCompositeFrag = `#version 300 es
precision highp float;

in vec2 v_uv;
uniform sampler2D u_scene;
uniform sampler2D u_bloom;
uniform float u_intensity;

out vec4 fragColor;

void main() {
  vec4 scene = texture(u_scene, v_uv);
  vec4 bloom = texture(u_bloom, v_uv);
  fragColor = scene + bloom * u_intensity;
  fragColor.a = 1.0;
}
`;

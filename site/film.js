// The app's two film looks (FilmFilterPipeline.swift), for the camera on the desk.
//   B&W 400 (cinematic_bw_400): Core Image's CIPhotoEffectNoir. Apple doesn't publish its formula, so this is an
//     approximation: Rec.709 luma with a 1.35 contrast around mid-grey. No grain, vignette or blur.
//   COLOR PRINT 200 (color_print_200): the Digicam grade (DigicamGrade.swift, ported exactly), then a 0.6 px
//     Gaussian blur, luminance sharpen 0.4 and a vignette (intensity 0.5, radius 1.5), in that order.
// It runs on the GPU (WebGL) so the live viewfinder stays smooth and the preview and the photo go through the
// same steps. Without WebGL it falls back to a per-pixel canvas version (grade and vignette only).

const NOIR_CONTRAST = 1.35;
const BLUR_SIGMA = 0.6;          // CIGaussianBlur radius
const SHARPNESS = 0.4;           // CISharpenLuminance sharpness
const SHARPEN_RADIUS = 1.69;     // CISharpenLuminance default radius
const VIG_DARK = 0.42;           // how dark the corners get (approximates CIVignette 0.5 / 1.5)

const GRADE_GLSL = `
float toLin(float x){ return x <= 0.04045 ? x / 12.92 : pow((x + 0.055) / 1.055, 2.4); }
float toSRGB(float x){ x = clamp(x, 0.0, 1.0); return x <= 0.0031308 ? x * 12.92 : 1.055 * pow(x, 1.0 / 2.4) - 0.055; }
float curve(float x){ return clamp(x + 0.18 * sin(3.14159265 * x) * (x - 0.4) * 1.6, 0.0, 1.0); }
const vec3 REC709 = vec3(0.2126, 0.7152, 0.0722);
vec3 noir(vec3 c){ float y = clamp((dot(c, REC709) - 0.5) * ${NOIR_CONTRAST.toFixed(2)} + 0.5, 0.0, 1.0); return vec3(y); }
vec3 digicam(vec3 c){
  float gain = exp2(-0.6);                                         // exposure -0.6 EV, in linear light
  c = vec3(curve(toSRGB(toLin(c.r) * gain)), curve(toSRGB(toLin(c.g) * gain)), curve(toSRGB(toLin(c.b) * gain)));
  c.b *= mix(0.5, 0.85, smoothstep(0.1, 0.8, dot(c, REC709)));    // warm: less blue in the shadows
  float grey = dot(c, REC709);
  c = clamp(grey + (c - grey) * 1.2, 0.0, 1.0);                    // saturation 1.2
  return mix(vec3(0.03), vec3(0.9), c);                            // lifted blacks, cream whites
}`;

const VS = `attribute vec2 p; varying vec2 v; void main(){ v = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;
const FS = {
  // the source, cover-cropped (and mirrored for a selfie), through the film's grade
  grade: `precision highp float; varying vec2 v; uniform sampler2D t; uniform vec4 rect; uniform float mirror; uniform float color;
${GRADE_GLSL}
void main(){
  vec2 uv = vec2(mirror > 0.5 ? 1.0 - v.x : v.x, v.y);
  vec3 c = texture2D(t, rect.xy + uv * rect.zw).rgb;
  gl_FragColor = vec4(color > 0.5 ? digicam(c) : noir(c), 1.0);
}`,
  // one direction of the Gaussian blur
  blur: `precision highp float; varying vec2 v; uniform sampler2D t; uniform vec2 dir; uniform vec3 w;
void main(){
  vec3 c = texture2D(t, v).rgb * w.x
    + (texture2D(t, v + dir).rgb + texture2D(t, v - dir).rgb) * w.y
    + (texture2D(t, v + 2.0 * dir).rgb + texture2D(t, v - 2.0 * dir).rgb) * w.z;
  gl_FragColor = vec4(c, 1.0);
}`,
  // luminance sharpen (unsharp mask on luma, added to every channel), then the vignette
  finish: `precision highp float; varying vec2 v; uniform sampler2D t; uniform vec2 px; uniform vec2 size;
const vec3 REC709 = vec3(0.2126, 0.7152, 0.0722);
float luma(vec2 o){ return dot(texture2D(t, v + o * px).rgb, REC709); }
void main(){
  vec3 c = texture2D(t, v).rgb;
  float r = ${SHARPEN_RADIUS.toFixed(2)}, d = r * 0.7071;
  float l = dot(c, REC709);
  float soft = l * 0.25
    + (luma(vec2(r, 0.0)) + luma(vec2(-r, 0.0)) + luma(vec2(0.0, r)) + luma(vec2(0.0, -r))) * 0.125
    + (luma(vec2(d, d)) + luma(vec2(-d, d)) + luma(vec2(d, -d)) + luma(vec2(-d, -d))) * 0.0625;
  c = clamp(c + ${SHARPNESS.toFixed(2)} * (l - soft), 0.0, 1.0);
  float dist = length((v - 0.5) * size), inner = 0.3 * min(size.x, size.y), outer = 0.56 * length(size);
  c *= 1.0 - ${VIG_DARK.toFixed(2)} * clamp((dist - inner) / (outer - inner), 0.0, 1.0);
  gl_FragColor = vec4(c, 1.0);
}`,
};

// Gaussian weights for taps 0, 1, 2 at sigma 0.6
const BLUR_W = (() => { const k = [0, 1, 2].map(i => Math.exp(-(i * i) / (2 * BLUR_SIGMA * BLUR_SIGMA))); const s = k[0] + 2 * (k[1] + k[2]); return k.map(x => x / s); })();

function makeGL() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, premultipliedAlpha: false, antialias: false });
  if (!gl) return null;
  const compile = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const vs = compile(gl.VERTEX_SHADER, VS);
  const prog = {};
  for (const [k, src] of Object.entries(FS)) {
    const p = gl.createProgram(); gl.attachShader(p, vs); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, src));
    gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}; for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) { const a = gl.getActiveUniform(p, i); u[a.name] = gl.getUniformLocation(p, a.name); }
    prog[k] = { p, u };
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const tex = () => {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };
  const src = tex();
  const targets = [0, 1].map(() => ({ t: tex(), fb: gl.createFramebuffer(), w: 0, h: 0 }));
  function sized(tg, w, h) {
    if (tg.w === w && tg.h === h) return tg;
    gl.bindTexture(gl.TEXTURE_2D, tg.t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, tg.fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tg.t, 0);
    tg.w = w; tg.h = h; return tg;
  }
  function pass(name, input, output, set) {
    const { p, u } = prog[name];
    gl.useProgram(p);
    gl.bindFramebuffer(gl.FRAMEBUFFER, output ? output.fb : null);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, input); gl.uniform1i(u.t, 0);
    set(u);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  return function draw(source, sw, sh, film, w, h, mirror) {
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
    gl.bindTexture(gl.TEXTURE_2D, src);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    const s = Math.max(w / sw, h / sh), cw = w / s / sw, ch = h / s / sh;
    const color = film === 'color';
    const [a, b] = targets.map(tg => sized(tg, w, h));
    pass('grade', src, color ? a : null, u => { gl.uniform4f(u.rect, (1 - cw) / 2, (1 - ch) / 2, cw, ch); gl.uniform1f(u.mirror, mirror ? 1 : 0); gl.uniform1f(u.color, color ? 1 : 0); });
    if (color) {
      pass('blur', a.t, b, u => { gl.uniform2f(u.dir, 1 / w, 0); gl.uniform3f(u.w, ...BLUR_W); });
      pass('blur', b.t, a, u => { gl.uniform2f(u.dir, 0, 1 / h); gl.uniform3f(u.w, ...BLUR_W); });
      pass('finish', a.t, null, u => { gl.uniform2f(u.px, 1 / w, 1 / h); gl.uniform2f(u.size, w, h); });
    }
    return canvas;
  };
}

/* ---------- canvas fallback ---------- */
const DIGI = (() => {
  const a = new Float32Array(256), gain = 2 ** -0.6;
  for (let i = 0; i < 256; i++) {
    let x = i / 255;
    x = x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    x = Math.min(1, x * gain);
    x = x <= 0.0031308 ? x * 12.92 : 1.055 * x ** (1 / 2.4) - 0.055;
    a[i] = Math.min(1, Math.max(0, x + 0.18 * Math.sin(Math.PI * x) * (x - 0.4) * 1.6));
  }
  return a;
})();
const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
function gradePixels(d, film) {
  for (let i = 0; i < d.length; i += 4) {
    if (film === 'bw') {
      const y = Math.min(1, Math.max(0, ((0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255 - 0.5) * NOIR_CONTRAST + 0.5));
      d[i] = d[i + 1] = d[i + 2] = y * 255;
    } else {
      let r = DIGI[d[i]], g = DIGI[d[i + 1]], b = DIGI[d[i + 2]];
      b *= 0.5 + 0.35 * smooth(0.1, 0.8, 0.2126 * r + 0.7152 * g + 0.0722 * b);
      const y = 0.2126 * r + 0.7152 * g + 0.0722 * b, c = v => 0.03 + 0.87 * Math.min(1, Math.max(0, y + (v - y) * 1.2));
      d[i] = c(r) * 255; d[i + 1] = c(g) * 255; d[i + 2] = c(b) * 255;
    }
  }
}
function vignette(g, w, h) {
  const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.hypot(w, h) * 0.56);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${VIG_DARK})`);
  g.fillStyle = v; g.fillRect(0, 0, w, h);
}

let gpu;
// Draw `source` (an image or a playing video), cover-cropped to the target canvas, through the film.
// Returns false when the source has no pixels yet.
export function develop(ctx, source, film, { mirror = false } = {}) {
  const sw = source.videoWidth || source.naturalWidth, sh = source.videoHeight || source.naturalHeight;
  if (!sw || !sh) return false;
  const { width: w, height: h } = ctx.canvas;
  if (gpu === undefined) { try { gpu = makeGL(); } catch (e) { console.warn('film: no WebGL, using canvas', e); gpu = null; } }
  if (gpu) {
    ctx.drawImage(gpu(source, sw, sh, film, w, h, mirror), 0, 0);
    return true;
  }
  const s = Math.max(w / sw, h / sh);
  ctx.save();
  if (mirror) { ctx.translate(w, 0); ctx.scale(-1, 1); }
  ctx.drawImage(source, (w - sw * s) / 2, (h - sh * s) / 2, sw * s, sh * s);
  ctx.restore();
  const px = ctx.getImageData(0, 0, w, h); gradePixels(px.data, film); ctx.putImageData(px, 0, 0);
  if (film === 'color') vignette(ctx, w, h);
  return true;
}

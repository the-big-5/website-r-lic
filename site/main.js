// rèlic — one scroll, one camera over one flat-lay desk.
// The desk always fills the screen; scrolling moves the camera from one part of it to the next.
import { AW, AH, BOX, BOX_NARROW } from './layout.js';
import { buildFlat } from './flat.js';

const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const params = new URLSearchParams(location.search);

if (reduceMotion.matches) root.classList.add('static');
else start();

function start() {
  const stage = document.getElementById('stage');
  const sceneEl = document.getElementById('scene');
  const board = document.getElementById('board');
  const notes = [...document.querySelectorAll('.note')];
  const flat = buildFlat(board, { go: i => go(i) });

  /* ---------- the scroll timeline: 8 shots ---------- */
  // w = share of scroll, hold = part of the segment where the camera rests
  const SEG = [
    { w: 1, hold: 0.3 },    // 0 the whole desk
    { w: 1, hold: 0.3 },    // 1 problem
    { w: 1.5, hold: 0.5 },  // 2 start a roll + share the code
    { w: 1, hold: 0.3 },    // 3 shoot
    { w: 1.7, hold: 0.55 }, // 4 make it together (toolbox + iPad)
    { w: 3, hold: 0.86 },   // 5 flip through the book, then it closes
    { w: 1, hold: 0.35 },   // 6 stack
    { w: 0.9, hold: 1 },    // 7 coming soon
  ];
  const SHOTS = ['hero', 'problem', 'create', 'shoot', 'together', 'flip', 'stack', 'end'];
  const FLIP = 5, LAST = SHOTS.length - 1;
  const FLIP_OPEN = 0.66, CLOSE_AT = 0.7, CLOSE_LEN = 0.12;   // inside segment 5: flip pages, then close the book
  let SHOT_BOX = SHOTS.map(k => BOX[k]);
  const TOTAL = SEG.reduce((a, s) => a + s.w, 0);
  sceneEl.style.setProperty('--units', TOTAL);

  const ease = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const glide = x => (1 - Math.cos(Math.PI * x)) / 2;   // the camera's own curve: gentle at both ends, no rush in the middle
  const clamp01 = x => Math.min(1, Math.max(0, x));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  function locate(u) {
    let acc = 0; const x = u * TOTAL;
    for (let i = 0; i < SEG.length; i++) {
      if (x <= acc + SEG[i].w || i === SEG.length - 1) return { i, f: clamp01((x - acc) / SEG[i].w) };
      acc += SEG[i].w;
    }
  }
  function uOf(i, f) { let acc = 0; for (let k = 0; k < i; k++) acc += SEG[k].w; return (acc + f * SEG[i].w) / TOTAL; }

  /* ---------- framing: the subject sits in the part of the screen the notepad leaves free ---------- */
  let vw = 1, vh = 1, cover = 1, free = { x0: 0, y0: 0, x1: 1, y1: 1 }, dirty = true;
  const fitScale = b => Math.max(cover, Math.min((free.x1 - free.x0) / b[2], (free.y1 - free.y0) / b[3]));
  function measure() {
    vw = stage.clientWidth; vh = stage.clientHeight;
    cover = Math.max(vw / AW, vh / AH);           // never smaller than this: the desk always fills the screen
    const nav = 72;
    const padH = Math.max(...notes.map(n => n.offsetHeight));
    if (vw >= 1100) free = { x0: 24 + Math.min(500, vw - 48) + 16, y0: nav, x1: vw - 24, y1: vh - 24 };
    else free = { x0: 16, y0: nav, x1: vw - 16, y1: Math.max(nav + 160, vh - padH - 40) };
    SHOT_BOX = SHOTS.map(k => (vw < 700 && BOX_NARROW[k]) || BOX[k]);
    dirty = true;
  }

  // a view is the board point at the centre of the free area (cx, cy) and the zoom (s)
  function viewOf(a, b, e) {
    const sa = fitScale(a), sb = fitScale(b);
    return { s: Math.exp(Math.log(sa) + (Math.log(sb) - Math.log(sa)) * e), cx: a[0] + (b[0] - a[0]) * e, cy: a[1] + (b[1] - a[1]) * e };
  }
  const mix = (a, b, k) => ({ s: Math.exp(Math.log(a.s) + (Math.log(b.s) - Math.log(a.s)) * k), cx: a.cx + (b.cx - a.cx) * k, cy: a.cy + (b.cy - a.cy) * k });
  function render(v) {
    const s = Math.max(cover, v.s);
    const fcx = (free.x0 + free.x1) / 2, fcy = (free.y0 + free.y1) / 2;
    // keep the desk edge to edge: never show past the board
    const tx = clamp(fcx - v.cx * s, vw - AW * s, 0);
    const ty = clamp(fcy - v.cy * s, vh - AH * s, 0);
    board.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${s.toFixed(5)})`;
  }
  let want = null, shown = null, jump = null;

  /* ---------- notes ---------- */
  let activeShot = 0;
  function setShot(n) {
    if (n === activeShot) return;
    const prev = notes[activeShot];
    prev.classList.remove('is-active'); prev.classList.add('is-leaving');
    setTimeout(() => prev.classList.remove('is-leaving'), 340);
    notes[n].classList.add('is-active');
    notes.forEach((el, j) => { el.inert = j !== n; });
    activeShot = n;
    board.dataset.shot = n;
  }
  notes.forEach((el, j) => { el.inert = j !== 0; });
  board.dataset.shot = 0;

  /* ---------- flipping: buttons and swipe drive the scroll position ---------- */
  const SPREADS = 4;
  const prevBtn = document.getElementById('flip-prev'), nextBtn = document.getElementById('flip-next');
  const flipA = n => n === 0 ? 0.02 : (n - 1) / 3 + 0.32;
  function spreadNow(a) { let n = 0; for (let k = 1; k < SPREADS; k++) if (a >= (k - 1) / 3 + 0.28) n = k; return n; }
  function goSpread(n) {
    n = Math.max(0, Math.min(SPREADS - 1, n));
    const u = uOf(FLIP, flipA(n) * FLIP_OPEN);
    scrollTo({ top: sceneEl.offsetTop + u * (sceneEl.offsetHeight - innerHeight), behavior: 'smooth' });
  }
  let curSpread = 0;
  prevBtn.addEventListener('click', () => goSpread(curSpread - 1));
  nextBtn.addEventListener('click', () => goSpread(curSpread + 1));
  let sx = null;
  stage.addEventListener('pointerdown', e => { sx = activeShot === FLIP ? e.clientX : null; });
  stage.addEventListener('pointerup', e => { if (sx !== null && Math.abs(e.clientX - sx) > 50) goSpread(curSpread + (e.clientX < sx ? 1 : -1)); sx = null; });

  document.querySelector('.skip').addEventListener('click', e => {
    e.preventDefault();
    scrollTo({ top: sceneEl.offsetTop + sceneEl.offsetHeight - innerHeight });
    notes[LAST].querySelector('a')?.focus();
  });

  /* ---------- scroll ---------- */
  let target = 0, current = 0, pinned = false;
  const readScroll = () => {
    if (pinned) return;
    target = clamp01((scrollY - sceneEl.offsetTop) / (sceneEl.offsetHeight - innerHeight));
  };
  addEventListener('scroll', readScroll, { passive: true });
  addEventListener('resize', () => { measure(); readScroll(); });

  function apply(u) {
    const { i, f } = locate(u);
    const hold = SEG[i].hold;
    const moving = f > hold && i < SEG.length - 1;
    const e = moving ? glide((f - hold) / (1 - hold)) : 0;
    want = viewOf(SHOT_BOX[i], SHOT_BOX[i + 1] || SHOT_BOX[i], e);
    setShot(Math.min(LAST, e > 0.5 ? i + 1 : i));

    /* what happens on the desk */
    const t = i + f;
    const a5 = i === FLIP ? clamp01(f / FLIP_OPEN) : i > FLIP ? 1 : 0;
    const shut = i === FLIP ? clamp01((f - CLOSE_AT) / CLOSE_LEN) : i > FLIP ? 1 : 0;
    // the book closes as one stack, the top leaf a touch ahead of the cover
    const closeK = k => 1 - ease(clamp01((shut - (3 - k) * 0.08) / 0.76));
    curSpread = spreadNow(a5);
    prevBtn.disabled = curSpread === 0;
    nextBtn.disabled = curSpread === SPREADS - 1;
    flat.update({
      spill: t > 0.75,
      mode: t < 1.65 ? 'roll' : t < 2.4 ? 'create' : t < 2.75 ? 'room' : t < 3.65 ? 'camera' : 'done',
      shot: activeShot,
      together: t > 3.62,
      cover: ease(clamp01((t - 4.66) / 0.32)) * closeK(0),
      leaves: [1, 2, 3].map(k => ease(clamp01((a5 - (k - 1) / 3 - 0.04) / 0.24)) * closeK(k)),
      shelved: shut >= 1 && (i > FLIP || f > CLOSE_AT + CLOSE_LEN + 0.02),
      soon: t > 6.55,
    });
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const moving = Math.abs(target - current) > 0.00002;
    current = moving ? current + (target - current) * (1 - Math.exp(-dt * 4.5)) : target;
    if (moving || dirty) { apply(current); dirty = false; }
    let v = want;
    if (jump) {
      const p = Math.min(1, (now - jump.t0) / jump.dur);
      v = mix(jump.from, want, glide(p));
      if (p >= 1) jump = null;
    }
    if (v !== shown) { render(v); shown = v; }
    requestAnimationFrame(frame);
  }

  /* ---------- tap a big object: one glide straight to its shot, and the page scrolls there with it ---------- */
  function go(i) {
    const u = uOf(i, i === FLIP ? flipA(0) * FLIP_OPEN : SEG[i].hold * 0.4);
    const from = shown;
    if (!pinned) scrollTo({ top: sceneEl.offsetTop + u * (sceneEl.offsetHeight - innerHeight), behavior: 'instant' });
    target = current = u; apply(current);
    if (!from) return;
    const d = Math.hypot(want.cx - from.cx, want.cy - from.cy) * Math.max(from.s, want.s);   // screen px to travel
    jump = { from, t0: performance.now(), dur: Math.min(1700, 850 + d * 0.3) };
  }

  // jump straight to a point (used when checking shots)
  window.relicJump = (i, f = 0) => {
    const u = uOf(i, f);
    if (!pinned) scrollTo(0, sceneEl.offsetTop + u * (sceneEl.offsetHeight - innerHeight));
    target = current = u; apply(current);
  };

  reduceMotion.addEventListener?.('change', ev => { if (ev.matches) location.reload(); });
  document.fonts.ready.then(() => { measure(); dirty = true; });
  measure(); readScroll(); current = target; apply(current);

  // dev aids: ?at=6.5 freezes the camera at segment 6, halfway; ?bare hides the nav and notepad (for stills)
  if (params.has('bare')) root.classList.add('bare');
  const at = params.get('at');
  if (at !== null) { pinned = true; if (!params.has('live')) root.classList.add('snap'); const i = Math.floor(+at), f = +at - i; target = current = uOf(i, f); apply(current); }
  requestAnimationFrame(frame);
}

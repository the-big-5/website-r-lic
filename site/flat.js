// The 2D flat-lay desk, drawn from the Figma assets.
import { AW, AH, L, FILL, OY } from './layout.js';

const CODE = 'N4B13L';

const IMG = 'assets/img/';
const el = (tag, cls, html = '') => { const e = document.createElement(tag); if (cls) e.className = cls; e.innerHTML = html; return e; };

// place an element by its centre in board px
function place(e, { x, y, w, h, r = 0 }) {
  e.style.left = x + 'px'; e.style.top = y + 'px';
  if (w) { e.style.width = w + 'px'; e.style.setProperty('--w', w + 'px'); }
  if (h) e.style.height = h + 'px';
  e.style.setProperty('--r', r + 'deg');
  return e;
}
function img(src, spec, cls = '') {
  const i = el('img', 'it ' + cls);
  i.src = IMG + src; i.alt = ''; i.decoding = 'async'; i.draggable = false;
  return place(i, spec);
}
function polaroid(photo, spec, cls = '', caption = '') {
  const f = el('figure', 'it pol ' + cls, `<img src="${IMG}${photo}" alt="" decoding="async" draggable="false">${caption ? `<figcaption>${caption}</figcaption>` : ''}`);
  return place(f, spec);
}
// a paper ticket stub, drawn (no image background)
function ticket(text, spec, c) {
  const t = place(el('div', 'it ticket', `<b>${text}</b>`), { ...spec, h: Math.round(spec.w * 0.42) });
  t.style.setProperty('--c', c); return t;
}
// a strip of washi tape, drawn
function tape(spec, c) { const t = place(el('div', 'it tape-strip'), { ...spec, h: Math.round(spec.w * 0.3) }); t.style.setProperty('--c', c); return t; }
// items that fly in: start offset (fx, fy) and start rotation
function flyer(node, { fx = 0, fy = 0, fr = 0, fs = 0.7 } = {}) {
  node.classList.add('fly');
  node.style.setProperty('--fx', fx + 'px'); node.style.setProperty('--fy', fy + 'px');
  node.style.setProperty('--fr', fr + 'deg'); node.style.setProperty('--fs', fs);
  return node;
}

const root = document.documentElement;

export function buildFlat(board, { go = () => {} } = {}) {
  board.style.width = AW + 'px'; board.style.height = AH + 'px';
  const add = n => { board.appendChild(n); return n; };
  const loose = [];   // small things anyone can pick up and move
  // the big objects take you to their part of the story; at their own shot they do their own thing
  const goTo = (node, shot) => {
    node.dataset.go = shot;
    node.addEventListener('click', e => { if (+board.dataset.shot === shot) return; e.stopPropagation(); go(shot); });
    return node;
  };

  /* ---------- the desk ---------- */
  add(el('div', 'desk-wood'));

  /* ---------- the lived-in layer: fills every corner of the desk ---------- */
  const fill = f => {
    let n;
    if (f.kind === 'img') n = img(f.src, f);
    else if (f.kind === 'pol') n = polaroid(f.photo + '.webp', f);
    else if (f.kind === 'roll') { n = place(el('div', 'it taperoll'), { ...f, h: f.w }); n.style.setProperty('--c', f.c); }
    else if (f.kind === 'booth') n = place(el('div', 'it booth', f.photos.map(p => `<img src="${IMG}${p}.webp" alt="" draggable="false">`).join('')), f);
    else if (f.kind === 'note') { n = place(el('div', 'it paper-note', f.text), f); n.style.setProperty('--c', f.c); }
    else if (f.kind === 'ticket') n = ticket(f.text, f, f.c);
    else if (f.kind === 'tape') n = tape(f, f.c);
    if (n) loose.push(add(n));
  };
  FILL.filter(f => !f.onMat).forEach(fill);

  const mat = add(place(el('div', 'mat'), L.mat));
  mat.innerHTML = '<span class="mat-num mat-top">1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34</span>';
  FILL.filter(f => f.onMat).forEach(fill);

  /* ---------- clutter (always there) ---------- */
  loose.push(
    add(img('notebook-yellow.webp', L.notebook)),
    add(img('pencil-green.webp', L.pencilG)),
    add(img('pencil-orange.webp', L.pencilO)),
    add(img('crayon.webp', L.crayon)),
    add(img('cutter.webp', L.cutter)),
    add(ticket('ROW F · 12', L.ticket, '#9CC9E4')),
    add(img('film-rolls.webp', L.rolls)),
  );

  /* ---------- the book stack (your shelf) ---------- */
  const stack = goTo(add(place(el('div', 'it stack'), { x: L.stack.x, y: L.stack.y, w: 520, h: 600 })), 6);
  [['Kos 4B', '#2F6B4F', -9, -40, 20], ['Grad night', '#C79A2E', 6, 30, -10], ['Bandung', '#2A231E', -3, -10, -30], ['Kepedesan', '#6B2230', 4, 20, -50]]
    .forEach(([t, c, r, dx, dy], i) => {
      const b = el('div', 'sbook', `<span class="sbook-label">${t}</span>`);
      b.style.background = c; b.style.setProperty('--r', r + 'deg');
      b.style.left = 260 + dx + 'px'; b.style.top = 300 + dy - i * 6 + 'px';
      stack.appendChild(b);
    });

  /* ---------- the phone ---------- */
  const phone = goTo(add(place(el('div', 'it phone'), L.phone)), 2);
  phone.innerHTML = `
    <div class="screen"><div class="ph-status"><b>9:41</b><i class="ph-sig"></i><i class="ph-wifi"></i><i class="ph-bat"></i></div>
      <section data-mode="roll" class="ph-lib">${photosLibrary()}</section>
      <section data-mode="create" class="ph-fig"><img class="ph-figimg" src="${IMG}roll-screen.webp" alt="" draggable="false">
        <span class="cr-name"><span class="typed">Bali '27</span></span>
        <img class="cr-chip c24" src="${IMG}roll-chip24.webp" alt="" draggable="false"><img class="cr-chip c36" src="${IMG}roll-chip36.webp" alt="" draggable="false">
        <span class="cr-press"></span><span class="cr-tap"></span></section>
      <section data-mode="room" class="ph-room"><span class="rm-back"></span><b class="rm-title">Bali '27</b><small class="rm-sub">36 shots · share the code so friends can join</small>
        <p class="rm-label">Roll code</p><div class="rm-code">${CODE.split('').map((c, i) => `<span style="--i:${i}"><i>${'X7QK2RD9M5PZ'[i * 2]}</i><i>${'X7QK2RD9M5PZ'[i * 2 + 1]}</i><i>${'HUVW8T3EJ6YF'[i]}</i><i>${c}</i></span>`).join('')}</div>
        <p class="rm-label">In this roll</p><div class="rm-friends">${[['photo-05', 'you'], ['photo-10', 'leps'], ['photo-09', 'chang'], ['photo-03', 'biel']].map(([p, n], i) => `<figure style="--i:${i}"><img src="${IMG}${p}.webp" alt="" draggable="false"><figcaption>${n}</figcaption></figure>`).join('')}</div>
        <span class="rm-btn">Share code</span></section>
      <section data-mode="camera" class="dark"><div class="ph-view"></div><span class="ph-shutter"></span></section>
      <section data-mode="done"><b class="ph-h">Developed!</b><small>36 photos · 5 friends</small><div class="ph-grid big">${Array.from({ length: 9 }, (_, i) => `<i style="--c:${['#9DB4C0', '#C9A27E', '#A6B58C', '#C98B6B', '#7FA38A', '#D8B25A'][i % 6]}"></i>`).join('')}</div></section>
    </div>`;

  /* ---------- shot 2: a pile of prints spills out of the phone; you can push them around ---------- */
  const PILE = [
    ['photo-06', 800, 1190, 210, -12], ['photo-01', 940, 1175, 220, 9], ['photo-07', 1080, 1200, 200, 5],
    ['photo-04', 860, 1360, 210, 12], ['photo-08', 1010, 1345, 230, -4],
    ['photo-03', 790, 1505, 200, -9], ['photo-10', 940, 1515, 200, 6], ['photo-02', 1090, 1490, 220, -13],
  ];
  const spill = PILE.map(([ph, x, y0, w, r], _, __, y = y0 + OY) => add(flyer(polaroid(ph + '.webp', { x, y, w, r }, 'spill'), { fx: L.phone.x - x, fy: L.phone.y - y, fr: 0, fs: 0.4 })));
  draggable(spill, board);
  draggable(loose, board);

  /* ---------- shoot: the camera. Tap it and it turns over into the app's camera ---------- */
  const cam = buildCamera(add, board, go);

  /* ---------- the scrapbook ---------- */
  const book = goTo(add(place(el('div', 'it book'), { x: L.book.x, y: L.book.y, w: L.book.pw * 2, h: L.book.ph })), 5);
  const pages = buildPages();
  // leaves: [front, back]; leaf 0 is the cover
  const leafDefs = [
    [`<div class="cover"><img src="${IMG}book-memories.webp" alt="" draggable="false"></div>`, pages.Aleft],
    [pages.Aright, pages.Bleft],
    [pages.Bright, pages.Cleft],
    [pages.Cright, pages.Dleft],
  ];
  const base = el('div', 'page base', pages.Dright); book.appendChild(base);
  const leaves = leafDefs.map(([front, back], k) => {
    const lf = el('div', 'leaf', `<div class="face front ${k === 0 ? 'is-cover' : 'page'}">${front}</div><div class="face back page">${back}</div>`);
    book.appendChild(lf); return lf;
  });
  // the closed book that goes to the stack at the end
  const shelved = add(place(el('div', 'it shelved', `<img src="${IMG}book-memories.webp" alt="" draggable="false"><span class="sbook-label">the big five</span>`), { x: L.book.x + L.book.pw / 2, y: L.book.y, w: L.book.pw, h: L.book.ph }));
  shelved.style.setProperty('--to-x', (L.stack.x - (L.book.x + L.book.pw / 2)) + 'px');
  shelved.style.setProperty('--to-y', (L.stack.y - 40 - L.book.y) + 'px');

  /* ---------- make it together: tools go into the toolbox, the iPad page builds itself live ---------- */
  const together = buildTogether(add, pages);
  goTo(together.box, 4); goTo(together.ipad, 4);

  /* ---------- the ending ---------- */
  const soon = add(flyer(place(el('div', 'it soon', `<span class="soon-tape"></span><b class="soon-write">coming soon</b><small>rèlic · on the App Store</small>`), { x: L.book.x, y: L.book.y, w: 760, h: 470, r: -3 }), { fy: -120, fr: -8, fs: 1.08 }));

  /* ---------- state ---------- */
  let last = {};
  function set(key, on, node) { if (last[key] !== on) { last[key] = on; [].concat(node).forEach(n => n.classList.toggle('on', on)); } }
  function stagger(key, on, nodes, step = 90) {
    if (last[key] === on) return; last[key] = on;
    nodes.forEach((n, i) => { clearTimeout(n._t); n._t = setTimeout(() => n.classList.toggle('on', on), on ? i * step : 0); });
  }

  return {
    update(s) {
      stagger('spill', s.spill, spill, 110);
      if (last.mode !== s.mode) {
        last.mode = s.mode; phone.dataset.mode = s.mode;
        // after Next is tapped, the room opens on its own
        clearTimeout(phone._t);
        if (s.mode === 'create') phone._t = setTimeout(() => { if (last.mode === 'create') phone.dataset.mode = 'room'; }, root.classList.contains('snap') ? 0 : 3100);
      }
      if (last.shot !== s.shot) { last.shot = s.shot; if (s.shot !== 3) cam.close(); }
      if (last.together !== s.together) { last.together = s.together; together.play(s.together); }
      // page angles
      const angles = [s.cover, ...s.leaves];
      angles.forEach((a, k) => {
        const lf = leaves[k];
        lf.style.setProperty('--a', (-180 * a).toFixed(2) + 'deg');
        lf.style.zIndex = a > 0.5 ? 10 + k : 10 + (leaves.length - k);
        lf.classList.toggle('turning', a > 0.001 && a < 0.999);
      });
      book.classList.toggle('closed', s.cover < 0.001);
      set('bookGone', s.shelved, book);
      set('shelved', s.shelved, shelved);
      set('soon', s.soon, soon);
    },
    spreadCount: 4,
  };
}

/* ---------- the phone's camera roll: the iPhone Photos app, Library tab (iOS 26), on the team's photos ---------- */
// photo: [file number, width / height]
const LIB_PHOTOS = { 1: 0.75, 2: 1.5, 3: 1.333, 4: 0.667, 5: 1.333, 6: 1.778, 7: 1.778, 8: 1.778, 9: 0.75, 10: 0.5625 };
const LIB_ORDER = [3, 7, 1, 10, 5, 2, 8, 4, 6, 9, 3, 5, 1, 7, 2, 10, 4, 8, 6, 3, 9, 5, 2, 7, 1, 10, 8, 4, 6, 2, 5, 9, 3];
const LIB_VIDEO = { 5: '0:08', 14: '0:15', 27: '0:03' };
const LIB_ICON = {
  cloud: '<svg viewBox="0 0 24 18"><path d="M6.5 16.5h11a5 5 0 0 0 .6-10A6.5 6.5 0 0 0 5.6 7.6 4.5 4.5 0 0 0 6.5 16.5z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7.5v6m-2.6-2.6L12 13.5l2.6-2.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  filter: '<svg viewBox="0 0 24 24"><path d="M4 7h16M7 12h10M10 17h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  library: '<svg viewBox="0 0 28 24"><rect x="5" y="1.5" width="21" height="16" rx="3.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M2 6.5v11A4.5 4.5 0 0 0 6.5 22H21" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M8 15l4.5-5 3.5 3.5 2.5-2.5 4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="20" cy="6" r="1.8" fill="currentColor"/></svg>',
  collections: '<svg viewBox="0 0 24 24"><rect x="2" y="9" width="20" height="13" rx="3" fill="currentColor"/><path d="M4.5 6.5h15M7 3.5h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M15.5 15.5l5 5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
};
function photosLibrary() {
  // each photo fits its square cell, like the Photos grid in "aspect ratio" mode
  const tiles = LIB_ORDER.map((n, i) => {
    const a = LIB_PHOTOS[n], w = a >= 1 ? 100 : a * 100, h = a >= 1 ? 100 / a : 100;
    const v = LIB_VIDEO[i] ? `<em>${LIB_VIDEO[i]}</em>` : '';
    return `<i><span style="width:${w.toFixed(1)}%;height:${h.toFixed(1)}%"><img src="${IMG}photo-${String(n).padStart(2, '0')}.webp" alt="" decoding="async" draggable="false">${v}</span></i>`;
  }).join('');
  return `<div class="pl-grid">${tiles}</div><i class="pl-edge"></i>
    <b class="pl-title">Library</b><span class="pl-sync">${LIB_ICON.cloud}Syncing 1 Item…</span>
    <i class="pl-glass pl-filter">${LIB_ICON.filter}</i><i class="pl-glass pl-select">Select</i>
    <div class="pl-glass pl-tabs"><span class="on">${LIB_ICON.library}<b>Library</b></span><span>${LIB_ICON.collections}<b>Collections</b><em>1</em></span></div>
    <i class="pl-glass pl-search">${LIB_ICON.search}</i>`;
}

/* ---------- doodles drawn on the first spread (page px, 500 × 740) ---------- */
const svgD = paths => `<svg class="doodle" viewBox="0 0 500 740" aria-hidden="true">${paths.map(d => `<path pathLength="1" d="${d}"/>`).join('')}</svg>`;
const DOODLE_L = svgD(['M150 196 C200 186 260 204 310 192 S370 188 390 194']);
const DOODLE_R = svgD([
  'M432 520 C474 488 478 446 444 428', 'M444 428 l22 4 M444 428 l4 22',            // arrow from the note to the photo
  'M62 470 C32 444 44 414 62 434 C80 414 94 444 62 470 Z',                          // heart
  'M474 40 v34 M457 57 h34 M458 186 v20 M448 196 h20',                              // sparkles
]);

/* ---------- sample scrapbook pages (the team's own material) ---------- */
function buildPages() {
  const P = (photo, x, y, w, r, cap = '') => `<figure class="it pol" style="left:${x}px;top:${y}px;width:${w}px;--w:${w}px;--r:${r}deg"><img src="${IMG}${photo}" alt="" draggable="false">${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>`;
  const I = (src, x, y, w, r, cls = '') => `<img class="it ${cls}" src="${IMG}${src}" alt="" draggable="false" style="left:${x}px;top:${y}px;width:${w}px;--r:${r}deg">`;
  const K = (text, x, y, w, r, c) => `<div class="it ticket" style="left:${x}px;top:${y}px;width:${w}px;height:${Math.round(w * 0.42)}px;--w:${w}px;--r:${r}deg;--c:${c}"><b>${text}</b></div>`;
  const W = (x, y, w, r, c) => `<div class="it tape-strip" style="left:${x}px;top:${y}px;width:${w}px;height:${Math.round(w * 0.3)}px;--r:${r}deg;--c:${c}"></div>`;
  const T = (cls, html, x, y, w, r) => `<div class="it ${cls}" style="left:${x}px;top:${y}px;width:${w}px;--r:${r}deg">${html}</div>`;
  return {
    Aleft: DOODLE_L + T('title-l', 'the big five<br><span>vol. 3</span>', 250, 112, 400, -3)
      + P('photo-03.webp', 240, 395, 320, 4)
      + K('AQUARIUM', 330, 590, 230, -10, '#EBC86A')
      + T('byline', 'page by: biel', 130, 620, 200, -2),
    Aright: P('photo-02.webp', 250, 250, 330, -4)
      + I('washi-teal.svg', 140, 90, 150, -24, 'washi')
      + I('sticker-flower.webp', 420, 120, 110, 10, 'sticker')
      + T('scrawl-l', 'remember the<br>WWDC night? wkwk', 230, 520, 380, -3)
      + I('washi-tri.svg', 370, 410, 140, 18, 'washi')
      + T('byline', 'page by: chang', 360, 615, 220, -2)
      + DOODLE_R,
    Bleft: P('photo-01.webp', 210, 300, 290, -5)
      + T('paper-note joke', '“remember the WWDC tragedy? what a crazy night!”', 395, 530, 190, 6)
      + W(210, 95, 130, -6, '#EBC86A')
      + T('byline', 'page by: leps', 140, 625, 200, 2),
    Bright: P('photo-07.webp', 255, 210, 400, 3)
      + T('scrawl-l', 'wifi:<br>TheBigFive', 250, 480, 300, -4)
      + I('sticker-flower.webp', 430, 600, 80, 0)
      + T('byline', 'page by: leps', 330, 625, 200, -1),
    Cleft: P('photo-04.webp', 170, 300, 250, 6)
      + K('ROW F · 12', 380, 160, 200, 12, '#9CC9E4')
      + T('scrawl-l', 'rolls by<br>sanny ✶', 380, 420, 200, -6)
      + T('byline', 'page by: sanny', 340, 620, 220, 1),
    Cright: P('photo-08.webp', 250, 200, 400, -2)
      + P('photo-06.webp', 290, 470, 300, 5)
      + I('washi-teal.svg', 120, 345, 140, 70)
      + T('byline', 'page by: nabiel', 130, 630, 220, -2),
    Dleft: T('letter', ['dear future us,', 'same table,', 'next week?', '— the big five'].map((l, i) => `<span style="--i:${i}">${l}</span>`).join(''), 250, 215, 400, -2)
      + svgD(['M118 340 C190 330 260 350 360 334'])
      + P('photo-05.webp', 250, 530, 290, -3),
    Dright: P('photo-10.webp', 250, 300, 340, 3)
      + I('washi-tri.svg', 250, 110, 150, -8, 'washi')
      + T('scrawl-l', 'see you<br>next roll ✶', 250, 560, 300, -4)
      + T('byline', 'page by: all of us', 330, 640, 240, 1),
    // the iPad's left page: three friends build it live
    Live: DOODLE_L + T('title-l', 'the big five<br><span>vol. 3</span>', 250, 112, 400, -3)
      + P('photo-03.webp', 240, 395, 320, 4)
      + I('washi-teal.svg', 120, 225, 140, -32, 'washi')
      + I('sticker-flower.webp', 425, 300, 100, 12, 'sticker')
      + K('AQUARIUM', 345, 560, 210, -10, '#EBC86A')
      + T('byline', 'page by: biel', 125, 600, 200, -2)
      + svgD(['M62 520 C32 494 44 464 62 484 C80 464 94 494 62 520 Z', 'M474 40 v34 M457 57 h34 M450 196 v20 M440 206 h20']),
    // the iPad's right page: blank, for whoever is looking
    Blank: '<canvas class="draw" width="1000" height="1480"></canvas>'
      + T('try', 'try drawing ✎<small>this page is yours</small>', 250, 330, 380, -2),
  };
}

/* ---------- make it together: the toolbox fills up, then the iPad page is built live by three friends ---------- */
// toolbox parts and where they sit, from the app (InteractiveToolboxView: centre and size as a share of the 768 × 1024 box)
const TOOLS = [
  ['tb-ruler', .65104, .44971, .10677, .41113, [520, 760, -70]],
  ['tb-pencils', .59701, .46875, .07682, .35938, [380, 820, 50]],
  ['tb-cutter', .36198, .37012, .07812, .22852, [700, 640, -40]],
  ['tb-scissors', .46354, .40674, .17969, .31543, [600, 900, 60]],
  ['tb-eraser', .36719, .70166, .05729, .11426, [820, 520, 90]],
  ['tb-tape-pink', .45182, .73145, .10417, .09766, [460, 700, -120]],
  ['tb-tape-blue', .45703, .64062, .09635, .09961, [740, 760, 140]],
  ['tb-notes', .62956, .76221, .16016, .11621, [560, 600, -30]],
];
// the iPad tray (Figma frame, 1210 × 834): left, top, width of each tool
const TRAY = [['scissors', 404.7, 731.9, 51.2], ['pen', 454.8, 736, 57.6], ['stickers', 510.5, 744, 77.9], ['photo', 586, 743.1, 79.6], ['washi', 625.7, 734.7, 128], ['letter', 738.5, 742.7, 68.2]];
const PRE = ['tb-ruler', 'tb-pencils', 'tb-tape-blue', 'tb-notes'];   // already in the box before the section
const FRIENDS = { biel: '#C79A2E', chang: '#3FA7A0', leps: '#D9667E' };

function buildTogether(add, pages) {
  /* the toolbox, empty until the tools come in */
  const tb = L.toolbox, tbH = tb.w * 1024 / 768;
  const box = add(place(el('div', 'it toolbox', `<img class="tb-base" src="${IMG}tb-base.webp" alt="" draggable="false">`), { ...tb, h: tbH }));
  const tools = TOOLS.map(([src, cx, cy, w, h, [fx, fy, fr]]) => {
    const t = el('span', 'tb-tool' + (PRE.includes(src) ? ' pre' : ''), `<img src="${IMG}${src}.webp" alt="" draggable="false">`);
    Object.assign(t.style, { left: cx * 100 + '%', top: cy * 100 + '%', width: w * 100 + '%', height: h * 100 + '%' });
    t.style.setProperty('--fx', fx + 'px'); t.style.setProperty('--fy', fy + 'px'); t.style.setProperty('--fr', fr + 'deg');
    box.appendChild(t); return t;
  }).filter(t => !t.classList.contains('pre'));
  tools.forEach((t, i) => t.style.setProperty('--d', i * 130 + 'ms'));

  /* the iPad, lying on the mat */
  const ip = L.ipad, bezel = 18, sw = ip.w - bezel * 2, k = sw / 1210;
  const ipad = add(place(el('div', 'it ipad'), { ...ip, h: Math.round(834 * k + bezel * 2) }));
  ipad.innerHTML = `<div class="ip-screen"><div class="ip-space" style="--k:${k}">
      <img class="ip-base" src="${IMG}ipad-screen.webp" alt="" draggable="false">
      <div class="ip-page" style="left:27px">${pages.Live}</div><div class="ip-page ip-blank" style="left:631px">${pages.Blank}</div>
      <div class="ip-live">${['photo-03', 'photo-09', 'photo-10'].map(p => `<i style="background-image:url(${IMG}${p}.webp)"></i>`).join('')}<b>3 editing</b></div>
      ${TRAY.map(([n, x, y, w], i) => `<img class="ip-tray" src="${IMG}tray-${n}.webp" alt="" draggable="false" style="left:${x - 6}px;top:${y - 6}px;width:${w + 12}px;--d:${i * 90}ms">`).join('')}
      ${Object.entries(FRIENDS).map(([n, c]) => `<div class="ip-cur" data-who="${n}" style="--c:${c}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 2v19l5.2-5.1 3.4 7.6 3.3-1.5-3.4-7.4H19z"/></svg><b>${n}</b></div>`).join('')}
    </div></div>`;
  const pg = [...ipad.querySelectorAll('.ip-page')];
  const L_ = pg[0].querySelectorAll(':scope > .it');
  const dL = [...pg[0].querySelectorAll('.doodle path')];
  L_.forEach(n => n.classList.add('ip-step', ...(n.matches('.title-l,.scrawl-l') ? ['ip-w'] : [])));
  dL.forEach(n => n.classList.add('ip-draw'));
  // who adds what, in order. L_ = title, photo-03, washi, sticker, ticket, byline; dL = underline, heart, sparkles
  const STEPS = [
    ['biel', [L_[0], dL[0]]],
    ['chang', [L_[1]]],
    ['leps', [L_[2]]],
    ['chang', [L_[3], dL[2]]],
    ['leps', [dL[1]]],
    ['biel', [L_[4], L_[5]]],
  ];
  // the right page is blank: anyone looking can draw on it
  drawPad(pg[1].querySelector('.draw'), pg[1].querySelector('.try'), ip.r);
  const curs = Object.fromEntries([...ipad.querySelectorAll('.ip-cur')].map(c => [c.dataset.who, c]));
  const live = ipad.querySelector('.ip-live');
  // where a page item sits on the iPad (Figma px); the pages are scaled 1.1 from 500 × 740
  const spot = n => {
    const page = n.closest('.ip-page'), px = parseFloat(page.style.left);
    const it = n.closest('.it') || n;
    if (n.tagName === 'path') { const b = n.getBBox(); return [px + (b.x + b.width / 2) * 1.1, 30 + (b.y + b.height / 2) * 1.1]; }
    return [px + parseFloat(it.style.left) * 1.1, 30 + parseFloat(it.style.top) * 1.1];
  };
  let timers = [];
  function play(on) {
    timers.forEach(clearTimeout); timers = [];
    const all = [...tools, live, ...STEPS.flatMap(s => s[1]), ...Object.values(curs)];
    if (!on) { all.forEach(n => n.classList.remove('on')); box.classList.remove('hop'); return; }
    const instant = root.classList.contains('snap');
    const at = (ms, fn) => instant ? fn() : timers.push(setTimeout(fn, ms));
    tools.forEach(t => at(0, () => t.classList.add('on')));
    at(1150, () => box.classList.add('hop'));
    at(1300, () => live.classList.add('on'));
    STEPS.forEach(([who, nodes], i) => {
      const t0 = 1700 + i * 600, c = curs[who];
      at(t0 - 380, () => { const [x, y] = spot(nodes[0]); c.style.transform = `translate(${x + 14}px,${y + 18}px)`; c.classList.add('on'); });
      nodes.forEach((n, j) => at(t0 + j * 160, () => n.classList.add('on')));
    });
  }
  return { play, box, ipad };
}

/* ---------- the camera: tap it, it turns over into the app's camera, try both films ---------- */
// The back is the app's camera screen (CaptureSessionView): an 874 × 402 canvas, viewfinder 424 × 318 in a 444 × 337 bezel.
// Both films are the app's own looks (FilmFilterPipeline): B&W 400 = photo-effect noir, Color Print 200 = the Digicam grade.
const FILMS = {
  bw: { name: 'PRO 35 B&W 400', cap: 'pro 35 b&w 400', can: 'can-bw.png' },
  color: { name: 'COLOR PRINT 200', cap: 'color print 200', can: 'can-color.png' },
};
const SCENES = ['photo-03', 'photo-05', 'photo-07'];
const SRC_W = 800, SRC_H = 600;                       // each sample photo is graded once at this size
const PRINT_SPOTS = [[-30, 300, -6], [150, 330, 4], [300, 280, -3]];   // where prints land, from the camera's centre

// Digicam grade (DigicamGrade.swift): −0.6 EV in linear light, S-curve 0.18 around 0.4, warm shadows, saturation 1.2, 0.03–0.9 output
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
function grade(d, film) {
  for (let i = 0; i < d.length; i += 4) {
    if (film === 'bw') {
      let l = (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
      l = Math.min(1, Math.max(0, 0.5 + (l - 0.52) * 1.45));
      l = 0.6 * l + 0.4 * l * l * (3 - 2 * l);
      d[i] = d[i + 1] = d[i + 2] = l * 255;
    } else {
      let r = DIGI[d[i]], g = DIGI[d[i + 1]], b = DIGI[d[i + 2]];
      b *= 0.5 + 0.35 * smooth(0.1, 0.8, 0.2126 * r + 0.7152 * g + 0.0722 * b);
      const y = 0.2126 * r + 0.7152 * g + 0.0722 * b, c = v => 0.03 + 0.87 * Math.min(1, Math.max(0, y + (v - y) * 1.2));
      d[i] = c(r) * 255; d[i + 1] = c(g) * 255; d[i + 2] = c(b) * 255;
    }
  }
}
// CIVignette (intensity 0.5, radius 1.5), drawn over the frame
function vignette(g, w, h) {
  const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.hypot(w, h) * 0.56);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.42)');
  g.fillStyle = v; g.fillRect(0, 0, w, h);
}

const ICON = {
  signal: '<svg viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>',
  wifi: '<svg viewBox="0 0 16 12"><path d="M8 2.6c2.4 0 4.6.9 6.2 2.5l1.3-1.3A10.6 10.6 0 0 0 8 .8 10.6 10.6 0 0 0 .5 3.8l1.3 1.3A8.8 8.8 0 0 1 8 2.6zm0 3.6c1.4 0 2.7.5 3.7 1.5L13 6.4a7 7 0 0 0-10 0l1.3 1.3c1-1 2.3-1.5 3.7-1.5zm0 3.5c-.5 0-1 .2-1.3.6L8 11.6l1.3-1.3c-.3-.4-.8-.6-1.3-.6z"/></svg>',
  cam: '<svg viewBox="0 0 24 24"><path d="M4 7.5h3.2L9 5h6l1.8 2.5H20a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8.5a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="13" r="3.6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
  turn: '<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.4-5.7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M3.5 3.5v5h5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

function buildCamera(add, board, go) {
  const D = L.dispo, BW = 620, k = BW / 874;
  const cam = add(place(el('div', 'it cam'), { x: D.x, y: D.y, w: BW, h: Math.round(402 * k), r: D.r }));
  cam.innerHTML = `
    <img class="cam-face cam-front" src="${IMG}dispo.webp" alt="" draggable="false" style="width:${D.w}px">
    <div class="cam-face cam-back" style="--k:${k}">
      <img class="cb-body" src="${IMG}cam-body.jpg" alt="" draggable="false">
      <div class="cb-status"><b>9:41</b><i class="cb-island"></i><span>${ICON.signal}${ICON.wifi}<i class="cb-bat"></i></span></div>
      <button class="cb-back" type="button" tabindex="-1" aria-label="Turn the camera back over">${ICON.turn}</button>
      <div class="cb-bezel"><div class="cb-view"><canvas width="636" height="477"></canvas><i class="cb-vig"></i><i class="cb-flash"></i><b class="cb-name"></b>
        <b class="cb-live">LIVE</b>
        <button class="cb-use" type="button" tabindex="-1">${ICON.cam}<span>Use my camera</span></button>
        <b class="cb-note">No camera access, so here's a sample photo</b></div></div>
      <p class="cb-label">FILM</p>
      <div class="cb-toggle" data-film="bw"><i class="cb-knob"></i>${Object.keys(FILMS).map(f => `<button type="button" tabindex="-1" data-film="${f}">${f === 'bw' ? 'B&amp;W' : 'COLOR'}</button>`).join('')}</div>
      <button class="cb-shutter" type="button" tabindex="-1" aria-label="Take a photo"><i></i></button>
      ${Object.entries(FILMS).map(([f, v]) => `<img class="cb-can${f === 'bw' ? ' on' : ''}" data-film="${f}" src="${IMG}${v.can}" alt="" draggable="false">`).join('')}
    </div>`;
  // the flash on the front, fired on a loop while the camera waits to be picked up
  add(place(el('div', 'it flash'), { x: D.x + D.w * 0.115, y: D.y - D.w * 0.135, w: D.w * 0.77, h: D.w * 0.77 }));

  const back = cam.querySelector('.cam-back'), cv = back.querySelector('canvas'), g = cv.getContext('2d');
  const toggle = back.querySelector('.cb-toggle'), nameTag = back.querySelector('.cb-name'), useBtn = back.querySelector('.cb-use');
  let film = 'bw', scene = 0, stream = null, raf = 0, busy = false, shots = 0, saved = 0;
  const photos = [], graded = {}, prints = [];

  function load() {
    if (photos.length) return;
    SCENES.forEach((s, i) => { const im = new Image(); im.decoding = 'async'; im.src = `${IMG}${s}.webp`; photos[i] = im; });
  }
  // a sample photo as the chosen film sees it; graded once, then kept
  function source(i, f) {
    const key = i + f;
    if (graded[key]) return graded[key];
    const im = photos[i];
    if (!im || !im.complete || !im.naturalWidth) return null;
    const c = document.createElement('canvas'); c.width = SRC_W; c.height = SRC_H;
    const x = c.getContext('2d', { willReadFrequently: true });
    const s = Math.max(SRC_W / im.naturalWidth, SRC_H / im.naturalHeight);
    x.drawImage(im, (SRC_W - im.naturalWidth * s) / 2, (SRC_H - im.naturalHeight * s) / 2, im.naturalWidth * s, im.naturalHeight * s);
    const px = x.getImageData(0, 0, SRC_W, SRC_H); grade(px.data, f); x.putImageData(px, 0, 0);
    return (graded[key] = c);
  }
  // without the visitor's camera the viewfinder holds a still sample photo
  function render() {
    if (stream) return;
    const src = source(scene, film);
    if (src) g.drawImage(src, 0, 0, cv.width, cv.height);
    else if (photos[scene]) photos[scene].addEventListener('load', render, { once: true });
  }

  /* the visitor's own camera (front camera), only after they press "Use my camera"; nothing leaves the browser */
  const video = document.createElement('video');
  video.muted = true; video.playsInline = true; video.setAttribute('playsinline', '');
  const live = document.createElement('canvas'); live.width = 480; live.height = 360;
  const lg = live.getContext('2d', { willReadFrequently: true });
  // one camera frame, cropped to 4:3 and mirrored like a selfie, through the chosen film
  function frame(x, w, h) {
    const vw = video.videoWidth, vh = video.videoHeight;
    if (!vw || !vh) return false;
    const s = Math.max(w / vw, h / vh);
    x.save(); x.translate(w, 0); x.scale(-1, 1);
    x.drawImage(video, (w - vw * s) / 2, (h - vh * s) / 2, vw * s, vh * s);
    x.restore();
    const px = x.getImageData(0, 0, w, h); grade(px.data, film); x.putImageData(px, 0, 0);
    return true;
  }
  function loop() {
    if (!stream) { raf = 0; return; }
    if (frame(lg, live.width, live.height)) g.drawImage(live, 0, 0, cv.width, cv.height);
    raf = requestAnimationFrame(loop);
  }
  async function startCamera() {
    if (stream || back.dataset.cam === 'asking') return;
    back.dataset.cam = 'asking';
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('no camera');
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false });
      if (!cam.classList.contains('open')) { s.getTracks().forEach(t => t.stop()); delete back.dataset.cam; return; }   // put down while asking
      stream = s; video.srcObject = s;
      await video.play();
      back.dataset.cam = 'live';
      if (!raf) raf = requestAnimationFrame(loop);
    } catch {
      stopCamera(); back.dataset.cam = 'denied'; render();
    }
  }
  function stopCamera() {
    if (stream) stream.getTracks().forEach(t => t.stop());
    stream = null; video.srcObject = null;
    cancelAnimationFrame(raf); raf = 0;
    delete back.dataset.cam;
    render();
  }

  function setFilm(f) {
    if (f === film) return;
    film = f; toggle.dataset.film = f; back.dataset.film = f;
    back.querySelectorAll('.cb-can').forEach(c => c.classList.toggle('on', c.dataset.film === f));
    nameTag.textContent = FILMS[f].name;
    nameTag.classList.remove('show'); void nameTag.offsetWidth; nameTag.classList.add('show');
    render();
  }
  function shoot() {
    if (busy) return;
    const out = document.createElement('canvas'), o = out.getContext('2d', { willReadFrequently: true });
    if (stream) {
      out.width = 960; out.height = 720;
      if (!frame(o, out.width, out.height)) return;
    } else {
      const src = source(scene, film);
      if (!src) return;
      out.width = SRC_W; out.height = SRC_H; o.drawImage(src, 0, 0);
    }
    if (film === 'color') vignette(o, out.width, out.height);
    busy = true;
    back.classList.remove('fire'); void back.offsetWidth; back.classList.add('fire');
    const f = film;
    if (!stream) setTimeout(() => { scene = (scene + 1) % SCENES.length; render(); }, 140);   // the next sample comes up under the flash
    setTimeout(() => { printOut(out, f); busy = false; }, 320);
  }
  // the shot slides out from under the camera and develops on the desk; hold it to save it
  function printOut(canvas, f) {
    const [dx, dy, r] = PRINT_SPOTS[shots++ % PRINT_SPOTS.length];
    const p = place(el('figure', 'it pol shot-print', `<figcaption>${FILMS[f].cap}</figcaption>`), { x: D.x + dx, y: D.y + dy, w: 210, r });
    p.prepend(canvas);
    p.style.setProperty('--fx', -dx + 'px'); p.style.setProperty('--fy', -dy * 0.7 + 'px');
    board.insertBefore(p, cam);
    p.addEventListener('animationend', e => { if (e.target === p && e.animationName === 'eject') p.classList.add('landed'); });
    draggable([p], board);
    let hold = 0, hx = 0, hy = 0;
    p.addEventListener('pointerdown', e => { hx = e.clientX; hy = e.clientY; clearTimeout(hold); hold = setTimeout(() => save(p, canvas, f), 650); });
    p.addEventListener('pointermove', e => { if (Math.hypot(e.clientX - hx, e.clientY - hy) > 8) clearTimeout(hold); });
    p.addEventListener('pointerup', () => clearTimeout(hold));
    p.addEventListener('pointercancel', () => clearTimeout(hold));
    p.addEventListener('contextmenu', e => e.preventDefault());
    prints.push(p);
    if (prints.length > PRINT_SPOTS.length) { const old = prints.shift(); old.classList.add('gone'); setTimeout(() => old.remove(), 400); }
    requestAnimationFrame(() => p.classList.add('on'));
  }
  function save(p, canvas, f) {
    p.classList.remove('saved'); void p.offsetWidth; p.classList.add('saved');
    canvas.toBlob(b => {
      if (!b) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b); a.download = `relic-${f === 'bw' ? 'bw-400' : 'color-200'}-${++saved}.jpg`;
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }, 'image/jpeg', 0.9);
  }

  function open() {
    if (cam.classList.contains('open') || board.dataset.shot !== '3') return;
    load(); render();
    cam.classList.add('open'); cam.classList.remove('lift'); void cam.offsetWidth; cam.classList.add('lift');
  }
  // putting the camera down always turns the visitor's camera off
  function close() {
    stopCamera();
    if (!cam.classList.contains('open')) return;
    cam.classList.remove('open', 'lift'); void cam.offsetWidth; cam.classList.add('lift');
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden && stream) stopCamera(); });
  cam.addEventListener('animationend', e => { if (e.animationName === 'camLift') cam.classList.remove('lift'); });
  const tap = fn => e => { e.stopPropagation(); fn(e); };
  cam.dataset.go = 3;
  cam.querySelector('.cam-front').addEventListener('click', tap(() => board.dataset.shot === '3' ? open() : go(3)));
  back.querySelector('.cb-back').addEventListener('click', tap(close));
  back.querySelector('.cb-shutter').addEventListener('click', tap(shoot));
  useBtn.addEventListener('click', tap(startCamera));
  toggle.addEventListener('click', tap(e => {
    const b = e.target.closest('button');
    setFilm(b ? b.dataset.film : film === 'bw' ? 'color' : 'bw');
  }));
  return { close };
}

/* ---------- pick things up and move them: a mouse drags at once, a finger holds for a moment first ---------- */
// (so a normal swipe over the desk still scrolls the page on a phone)
let dragTop = 50;
function draggable(nodes, board) {
  nodes.forEach(n => {
    n.classList.add('drag');
    let pid = null, armed = false, hold = 0, sx = 0, sy = 0, x0 = 0, y0 = 0, k = 1;
    const lift = () => { armed = true; n.style.zIndex = ++dragTop; n.classList.add('held'); };
    n.addEventListener('pointerdown', e => {
      if (e.button > 0) return;
      e.stopPropagation();
      pid = e.pointerId; sx = e.clientX; sy = e.clientY; armed = false;
      x0 = parseFloat(n.style.left); y0 = parseFloat(n.style.top);
      k = board.getBoundingClientRect().width / AW;           // screen px per board px
      const grab = () => { try { n.setPointerCapture(pid); } catch {} lift(); };
      if (e.pointerType === 'mouse') { e.preventDefault(); grab(); }
      else hold = setTimeout(grab, 280);
    });
    n.addEventListener('pointermove', e => {
      if (e.pointerId !== pid) return;
      if (!armed) { if (Math.hypot(e.clientX - sx, e.clientY - sy) > 6) { clearTimeout(hold); pid = null; } return; }
      n.style.left = x0 + (e.clientX - sx) / k + 'px'; n.style.top = y0 + (e.clientY - sy) / k + 'px';
    });
    const end = e => {
      if (e.pointerId !== pid) return;
      clearTimeout(hold); pid = null;
      if (armed) { armed = false; n.classList.remove('held'); }
    };
    n.addEventListener('pointerup', end); n.addEventListener('pointercancel', end);
    // once a finger has picked something up, moving it must not scroll the page
    n.addEventListener('touchmove', e => { if (armed) e.preventDefault(); }, { passive: false });
  });
}

/* ---------- the blank iPad page: draw on it ---------- */
// deg = how far the iPad is turned on the desk, so strokes land right under the pointer
function drawPad(cv, hint, deg = 0) {
  const g = cv.getContext('2d');
  g.lineCap = g.lineJoin = 'round'; g.strokeStyle = '#6B2230'; g.lineWidth = 9;
  let pts = null;
  const th = deg * Math.PI / 180, cos = Math.cos(th), sin = Math.sin(th);
  const at = e => {
    const b = cv.getBoundingClientRect(), W = cv.offsetWidth, H = cv.offsetHeight;
    const S = b.width / (W * Math.abs(cos) + H * Math.abs(sin));          // screen px per page px
    const dx = e.clientX - (b.left + b.width / 2), dy = e.clientY - (b.top + b.height / 2);
    const x = (dx * cos + dy * sin) / S + W / 2, y = (-dx * sin + dy * cos) / S + H / 2;
    return [x / W * cv.width, y / H * cv.height];
  };
  cv.addEventListener('pointerdown', e => {
    e.stopPropagation(); e.preventDefault();
    cv.setPointerCapture(e.pointerId); pts = [at(e)];
    hint.classList.add('gone');
    g.beginPath(); g.arc(pts[0][0], pts[0][1], g.lineWidth / 2, 0, 7); g.fillStyle = g.strokeStyle; g.fill();
  });
  cv.addEventListener('pointermove', e => {
    if (!pts) return;
    const p = at(e), [a, b] = [pts[pts.length - 1], p];
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], prev = pts.length > 1 ? pts[pts.length - 2] : a;
    g.beginPath(); g.moveTo((prev[0] + a[0]) / 2, (prev[1] + a[1]) / 2); g.quadraticCurveTo(a[0], a[1], m[0], m[1]); g.stroke();
    pts.push(p);
  });
  const end = e => { if (pts) { e.stopPropagation(); pts = null; } };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
}

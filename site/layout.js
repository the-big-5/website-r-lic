// Where everything sits on the desk, in board pixels.
// The board is one big flat-lay desk; the camera only ever shows part of it, edge to edge.
export const AW = 3200, AH = 2700;

// x, y = centre; w = width; r = rotation in degrees (clockwise)
// Real-world scale, from the phone (7 cm wide = 190 px): about 27 px per cm. A pencil is 17 cm, scissors 17 cm, a disposable camera 15 cm.
export const L = {
  toolbox:  { x: 420,  y: 430,  w: 640, r: -3 },   // the 768 × 1024 canvas from the app; the box itself is a bit smaller
  notebook: { x: 250,  y: 1110, w: 230, r: -4 },
  phone:    { x: 1300, y: 1270, w: 190, h: 394, r: 3 },   // right of the notepad, so it shows on the first screen
  ipad:     { x: 1090, y: 690,  w: 780, r: -1.5 },  // up and left, clear of the journal when it opens
  mat:      { x: 1730, y: 1000, w: 1900, h: 1320 },
  book:     { x: 2140, y: 940,  pw: 500, ph: 740 },   // x = spine
  dispo:    { x: 2770, y: 330,  w: 500, r: -6 },    // a size above the cutter so it reads as the hero
  rolls:    { x: 3060, y: 790,  w: 240, r: 4 },
  stack:    { x: 2920, y: 1300 },
  pencilG:  { x: 1920, y: 1578, w: 239, r: 96 },    // the art is a slanted pencil in the top 2/3 of a tall canvas: 239 wide = 450 long, laid flat
  pencilO:  { x: 2070, y: 1625, w: 40, r: -89 },    // 450 long, lying next to the green one
  crayon:   { x: 2260, y: 195,  w: 48, r: 86 },
  cutter:   { x: 3140, y: 450,  w: 105, r: 176 },  // blade up, beside the camera (prints land below it)
  ticket:   { x: 3120, y: 1120, w: 230, r: 88 },
};

// Extra things on the desk: kept in loose rows with small angles, so it reads lived-in but tidy.
// Nothing sits below the cutting mat. kind: img | pol | roll | booth | note | ticket | tape
export const FILL = [
  // top row, above the mat
  { kind: 'booth', x: 1260, y: 190, w: 150, r: 88, photos: ['photo-05', 'photo-10', 'photo-09'] },
  { kind: 'note', x: 1790, y: 185, w: 280, r: -2, c: '#F4B6C2', text: 'scrapbook night<br>fri · 7pm' },
  // left column
  { kind: 'roll', x: 345, y: 1415, w: 160, c: '#3FA7A0' },
  { kind: 'img', src: 'roll-kodak.webp', x: 175, y: 1405, w: 120, r: -3 },
  // on the mat: one row under the iPad
  { kind: 'ticket', x: 1700, y: 1580, w: 230, r: 3, c: '#EBC86A', text: 'AQUARIUM', onMat: true },
  { kind: 'note', x: 1730, y: 1385, w: 260, r: -2, c: '#D9EBC8', text: '36 photos ✓<br>5 pages to go', onMat: true },
  { kind: 'img', src: 'scissors.webp', x: 1625, y: 700, w: 190, r: -12, onMat: true },   // 17 cm
  { kind: 'tape', x: 1990, y: 1420, w: 160, r: 6, c: '#EBC86A', onMat: true },
  { kind: 'pol', x: 2420, y: 1430, w: 190, r: 3, photo: 'photo-05', onMat: true },
  // under the closed book: seen once it goes to the shelf
  { kind: 'pol', x: 2390, y: 870, w: 220, r: -4, photo: 'photo-01', onMat: true },
  { kind: 'tape', x: 2310, y: 750, w: 140, r: -10, c: '#9CC9E4', onMat: true },
  { kind: 'note', x: 2400, y: 1245, w: 220, r: 3, c: '#FFF3B0', text: 'next roll:<br>bandung?', onMat: true },
];

// Camera framing for each shot: [centre x, centre y, width, height] of what must be in view
export const BOX = {
  hero:     [1700, 950, 2600, 1500],
  problem:  [1020, 1340, 760, 640],   // the phone and the prints spilling out of it (to its left)
  create:   [1300, 1270, 300, 450],
  shoot:    [2830, 455, 780, 620],    // the camera, and room below it for the prints it makes
  together: [1000, 650, 1120, 820],
  flip:     [2140, 940, 1080, 790],
  stack:    [2920, 1300, 760, 620],
  end:      [1800, 950, 2600, 1500],
};
// phones (under 700 px wide): one subject at a time, centred in the space above the notepad
export const BOX_NARROW = {
  hero:     [2580, 760, 1000, 1200],   // the camera and the scrapbook
  problem:  [1060, 1340, 760, 640],    // the phone with its prints
  shoot:    [2780, 360, 660, 520],     // the camera, prints land just below
  together: [1090, 690, 820, 600],     // the iPad, full width, for drawing
  flip:     [2140, 940, 1030, 760],
  stack:    [2920, 1300, 620, 620],
  end:      [2140, 940, 820, 560],      // the coming soon note, exactly centred
};

// The whole desk sits OY px down from the board's top edge: a strip of bare wood above it lets
// things near the top (the camera, the toolbox) be centred on a phone without showing past the board.
export const OY = 300;
Object.values(L).forEach(o => { o.y += OY; });
FILL.forEach(o => { o.y += OY; });
[BOX, BOX_NARROW].forEach(b => Object.values(b).forEach(v => { v[1] += OY; }));

# rèlic website

A one-page landing site for rèlic. The whole page is one flat-lay desk made from the Figma assets.
It always fills the screen; scrolling moves the camera from one part of the desk to the next,
through 8 shots to a "coming soon" ending. All copy sits in `index.html` (one note per shot).

## Run it

Any static server works. From this folder:

```bash
python3 -m http.server 8766
```

Then open http://localhost:8766. (Opening `index.html` straight from Finder will not work:
browsers block module scripts on `file://`.)

## Files

| File | What it does |
|---|---|
| `index.html` | Page, nav, the 8 notes (copy), footer |
| `style.css` | All styling: notepad, flat-lay desk, phone screens, scrapbook pages |
| `layout.js` | Where everything sits on the desk (`L`, plus the extra props in `FILL`) and each shot's camera framing (`BOX`) |
| `flat.js` | Builds the 2D desk and the sample scrapbook pages |
| `film.js` | The camera's two film looks (B&W 400 and Color Print 200), ported from the app's `FilmFilterPipeline`; runs on WebGL, with a canvas fallback |
| `main.js` | The scroll timeline: which shot, camera moves, what happens on the desk |
| `assets/img/` | Web-sized assets exported from Figma (WebP), and the full-desk still used for reduced motion. `roll-*` = the Create Roll screen, `ipad-screen` + `tray-*` = the iPad canvas (both from Figma), `tb-*` = the toolbox and its tools, `cam-body.jpg` + `can-*.png` = the app's camera screen and film canisters, `join-*` + `lobby-deco.webp` = the Join Roll illustration and lobby header (all from the app's asset catalog), `avatar-*` = lobby avatars cropped from an app screenshot |
| `share.jpg` | Link preview image (og:image) |

Full-size Figma exports live next to the site, in `../figma-sources/`, so they are not deployed (and are left out of git).
The toolbox tool positions in `flat.js` (`TOOLS`) copy `InteractiveToolboxView.swift` from the app.

## Common edits

- **Copy:** edit the `<article class="note">` blocks in `index.html`.
- **Scrapbook pages:** `buildPages()` at the bottom of `flat.js`.
- **Move or add an object on the desk:** change `L` or `FILL` in `layout.js`. Keep every part of the desk covered: the camera shows it edge to edge.
- **Logo:** replace the `.logo-ph` placeholder in the nav and footer.

## Checking a shot

Two URL switches help when checking or re-making images:

- `?at=5.1` opens the page frozen at shot 6 (segment 5, 10% in), with animations off. Add `&live` to keep
  the animations running (handy for the phone and iPad sequences).
- `?bare&at=7` hides the nav and notepad, for stills. `assets/img/still-desk.webp` (shown when
  "Reduce motion" is on) is `?bare&at=7` captured at 1600×1350 and cropped to the top 1000 px; `share.jpg` is `?at=0` at 1200×630.
  Re-make both after moving things on the desk.

## Interactions

- Small things on the desk (pencils, notes, polaroids, tape, film rolls, the notebook…) can be picked up and moved:
  a mouse drags at once, a finger holds for about 0.3 s first so a normal swipe still scrolls the page.
- The big objects jump to their part of the story in one glide: phone → Start a roll, camera → Shoot,
  toolbox and iPad → Make it together, book → The scrapbook, book stack → Your shelf. At their own shot
  they do their own thing (the camera turns over, the iPad takes drawing).
- Sizes follow real life at about 27 board px per cm (the phone is 7 cm = 190 px); see `layout.js`.

## Deploy

Upload this folder as is to Vercel, Netlify or any static host. No build step.

The camera in the "Shoot" shot can use the visitor's front camera ("Use my camera"). Browsers only allow
that on `https://` (or `localhost`), so serve the site over https. Photos stay in the visitor's browser;
holding a print saves it as a JPG: the photo in its white polaroid frame with "@craftwithrelic" written underneath.

## Still to come

- Canonical domain for the share tags

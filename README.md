# rèlic web

The landing site for rèlic, a shared disposable camera and scrapbook app (Apple Academy final challenge).

| Folder / file | What it is |
|---|---|
| `site/` | The website itself. This is the folder to deploy. See [site/README.md](site/README.md) for running, editing and deploying it. |
| `plan.html` | The planning page: direction, page structure and shot list. |
| `figma-sources/` | Full-size Figma exports the site's images were made from. Kept locally only (it is in `.gitignore`, about 92 MB). |

## Run it

```bash
cd site
python3 -m http.server 8766
```

Then open http://localhost:8766.

## Deploy

On Vercel or Netlify, set the root (publish) directory to `site`. There is no build step.

# Stolperbank

Pattern-bank editor for the Stolperbeats Eurorack sequencer.

## GitHub Pages

1. Create a GitHub repository and push this project (`main` or `master`).
2. In the repository, open **Settings → Pages → Build and deployment** and set **Source** to **GitHub Actions**.
3. The workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml) builds a static site and publishes it. The run prints the URL when it finishes.

It works as a project site (`https://<user>.github.io/<repo>/`) and as a user site (`https://<user>.github.io/`). No database is required. Patterns stay in the browser.

Node.js 22 is required if you build locally:

```bash
npm install
GITHUB_PAGES=true npm run build || test -s .output/public/index.html
node scripts/finalize-github-pages.mjs
```

The site files are written to `.output/public`.

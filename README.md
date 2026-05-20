# Da Hompeg

A minimalist browser startpage — static, zero-dependency, hostable anywhere.

## Features

| | |
|---|---|
| 🕐 **Live clock** | Configurable 12 h / 24 h, optional seconds |
| 🔍 **Multi-engine search** | DuckDuckGo · Google · Bing · Brave · Ecosia · Startpage |
| 🔖 **Editable bookmarks** | Add, rename, delete — favicons loaded automatically |
| 🌤️ **Weather widget** | Optional, via [Open-Meteo](https://open-meteo.com/) (free, no API key) |
| 🌙 **Dark / light theme** | Toggles with a single click, persisted to `localStorage` |
| 🎨 **Accent colour** | Six presets + custom colour picker |
| ⚙️ **Settings panel** | Clock format, weather units, new-tab search |
| ⌨️ **Keyboard shortcuts** | `/` focuses search · `Esc` dismisses dropdowns / modals |

Everything is stored in `localStorage` — no backend, no build step.

---

## Getting started

```sh
# Clone or download
git clone https://github.com/you/Da_Hompeg.git
cd Da_Hompeg

# Just open the file — no server needed for basic use
open index.html
```

For the weather widget to work you need to serve the file over HTTP/HTTPS
(browsers block geolocation on `file://` URLs). Any static host will do:

```sh
# Quick local server (Python)
python3 -m http.server 3000

# Or use any static host:
#   GitHub Pages · Vercel · Netlify · Cloudflare Pages
```

### Set as your browser's homepage / new-tab page

| Browser | How |
|---|---|
| **Firefox** | Settings → Home → Homepage → Custom URLs → paste your URL |
| **Chrome** | Settings → On startup → Open a specific page → paste your URL |
| **Edge** | Settings → Start, home and new tabs → paste your URL |

For new-tab replacement in Chrome/Edge you'll need a small extension
(e.g. *Custom New Tab URL*) that points to your hosted page.

---

## Hosting on GitHub Pages

1. Push the repo to GitHub.
2. Settings → Pages → Branch: `main` / `(root)` → Save.
3. Your page will be live at `https://<user>.github.io/<repo>/`.

A single `index.html` at the repo root is all GitHub Pages needs.

---

## File structure

```
Da_Hompeg/
├── index.html   — semantic HTML shell
├── style.css    — CSS custom properties, dark/light themes, animations
├── app.js       — vanilla JS: clock, weather, search, bookmarks, settings
└── README.md
```

---

## Customisation

All state lives in `localStorage` under the key `startpage`.  
You can edit it directly in DevTools → Application → Local Storage, or use the
built-in **Settings** panel (⚙ icon, top-right).

To change the **default bookmarks** that appear for first-time visitors, edit
the `DEFAULT_BOOKMARKS` array at the top of `app.js`.

To change the **default accent colour**, edit `accentColor` inside
`DEFAULT_SETTINGS` in `app.js`.

---

## Privacy

- Weather uses [Open-Meteo](https://open-meteo.com/) (no API key, no tracking).
- Location name uses [Nominatim / OpenStreetMap](https://nominatim.openstreetmap.org/).
- Favicons are fetched from DuckDuckGo's CDN (`icons.duckduckgo.com`).
- No analytics, no cookies, no external fonts.

---

## License

[MIT](https://choosealicense.com/licenses/mit/) — do whatever you want with it.

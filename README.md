# 📄 CV Maker — Dashboard CV

> A powerful, fully client-side CV builder with live preview, multi-layout templates, 60+ curated themes, and pixel-perfect A4 PDF export. No backend. No sign-up. Runs entirely in your browser.

![Tech](https://img.shields.io/badge/Vanilla_JS-ES6+-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Tech](https://img.shields.io/badge/CSS3-Theming-1572B6?style=flat&logo=css3)
![Tech](https://img.shields.io/badge/Vite-Dev_Server-646CFF?style=flat&logo=vite&logoColor=white)
![Tech](https://img.shields.io/badge/License-MIT-green?style=flat)

---

## ✨ Feature Overview

### 🚀 Smart Tools (new)
- **CV Score (0–100)** — live analysis of contact info, summary length, action verbs, quantified results, skills, length & readability, with prioritized tips (*Score* tab and top bar).
- **Job-offer matcher** — paste a job description, get keyword coverage (ATS-style) with missing/present keywords.
- **Fit to 1 / 2 pages** — auto-tunes font size, line height, margins and spacing.
- **Undo / Redo** — `Ctrl+Z` / `Ctrl+Shift+Z` (also covers import, reset, version loading). `Ctrl+S` exports a JSON backup.
- **My CVs** — keep several named versions (one per target job) in the browser; open, update, duplicate, delete.
- **Template gallery** — visual picker for the 6 layouts.
- **Reorder entries** — ▲▼ buttons on experiences, projects, education, languages and skill categories.
- **Safer & faster** — all user text is HTML-escaped (imports can't inject markup), photos are downscaled, storage-full errors are reported, previews are debounced.

> New code lives in `features.js` / `features.css` (loaded after `app.js`).

---

### 🗂 Multi-Layout Templates
Choose from **8 professionally designed CV layouts**, each with its own visual language:

| Layout | Style | Best For |
|---|---|---|
| 🎨 **Designed** | Dark background, gold accents, full-bleed | Creative / Developer |
| 💼 **Professional** | Classic white, navy header bar | Corporate / Finance |
| 📑 **Sidebar** | Two-column split, colored left panel | Modern / Tech |
| 🗃 **Minimalist** | Clean, ultra-light, Swiss-inspired | Academic / Research |
| 📋 **Europass** | Standard European CV format | EU Job Applications |
| 🧭 **Timeline** | Vertical career timeline with dots | Career progression |
| 🏛 **Executive** | Colored header band + tinted side column | Impact / senior profiles |
| ✨ **Modern** | Project cards, skill tags, bold accent | Tech & startups |

> Timeline, Executive and Modern share the Corporate accent colour and theme presets. Layout code: `layouts.js` / `layouts.css`.

---

### 🎨 60+ Curated Themes (Per Layout)
Every layout comes with **20 hand-crafted preset themes**. Each theme applies a complete set of design tokens simultaneously:

- **Background & Accent Colors** — the base palette
- **Text Colors** — Name, Title, Section Headings, Body text, and Muted info all adapt
- **Typography** — Each theme ships with a paired Google Font (Inter, Montserrat, Playfair Display, Lora, Merriweather, Oswald, Roboto, and more)
- **Heading Styles** — Border style, text transform (uppercase/capitalize/none), letter spacing, font weight

**Examples:** *Midnight Gold*, *Slate & Cyan*, *Forest & Gold*, *Void & Fuchsia*, *Corporate Navy*, *Wet Asphalt*, *GitHub Dark & Mint*, and 50+ more.

> Click any swatch in the **"Thèmes Prédéfinis"** grid to apply the full theme instantly. Or hit **"Palette Aléatoire"** for a random pick.

---

### ✏️ Full In-Line Field Styling
Every field in the editor has a **palette button** that opens a Figma-like pop-up panel to customize:

- Font size, weight, style (bold, italic, underline)
- Text color, text transform, letter spacing, text alignment
- Section headings: border style, padding, capitalization
- Paragraph fields: word-wrap behavior, line height

Changes apply **instantly** to the live preview.

---

### 👤 Profile Photo
- Upload any image file directly from your device
- Controls: size (60px–180px), border radius (circle / rounded / square), border width & color, drop shadow, opacity, horizontal and vertical offset
- Camera icon to upload · Trash icon to remove

---

### 📐 Design System Controls
The **Design** tab provides global controls:

- **Font Family** — choose from 10+ Google Fonts
- **Base Font Size** — scales all text proportionally
- **Line Height** — adjust readability
- **Page Margin** — controls printed margin in `mm`
- **Section Spacing** — global gap between CV sections
- **Page Numbers** — toggle on/off
- **Photo Visibility** — show/hide profile picture

---

### 📄 Smart A4 Pagination
The built-in pagination engine:
- Measures every element's physical height in real `mm` units
- Injects invisible spacers before elements that would cross a page boundary
- Guarantees **no sliced text, no orphaned headings** in the exported PDF

---

### 🔗 Clickable PDF Links
All contact fields (email, phone, LinkedIn, GitHub, website) render as real `<a>` hyperlinks — they stay **clickable inside the exported PDF**.

---

### 💾 Data Management
- **Auto-Save** — every change is persisted to `localStorage` automatically
- **Export JSON** — download your full CV data as a portable `.json` backup file
- **Import JSON** — restore any previously saved `.json` file instantly
- **Reset** — wipe to default sample data with one click

---

### 🌍 Section Customization
- All section **titles are editable** — rename "Expérience Professionnelle" to anything you want, directly in the preview
- Individual sections can be **shown or hidden** via the eye icon
- Individual **fields within entries** can also be hidden (e.g., hide a company name or a date)

---

## 🚀 Getting Started

### With Vite (Recommended)
```bash
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### Direct File (Offline)
Double-click `index.html` to open directly in Chrome/Edge/Firefox — no server needed.

---

## 🖨 Exporting to PDF

1. Click **"Imprimer / PDF"** in the top bar
2. In the print dialog:
   - **Paper size:** A4
   - **Margins:** None (the app controls margins internally)
   - **Background graphics:** Enabled (required for colors & themes)
   - **Destination:** Save as PDF
3. Click Save — output is pixel-perfect A4.

> Tested and confirmed working in Chrome, Edge, and Brave.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 (Semantic) |
| Styles | Vanilla CSS3, CSS Variables, Flexbox/Grid, `@media print` |
| Logic | Vanilla JavaScript (ES6+), no frameworks |
| Fonts | Google Fonts via `@import` in CSS |
| Dev Server | Vite |
| State | `localStorage` (auto-persist) |
| Export | Browser native print → PDF |

---

## 📁 Project Structure

```
CV_Maker/
├── index.html       # Main UI — editor panels, tab system, design controls
├── app.js           # All logic — state, rendering, themes, pagination, events
├── style.css        # All styles — design system, layouts, components, print rules
├── data.json        # Default sample CV data (loaded on first visit)
├── vite.config.js   # Vite dev server configuration
├── package.json     # NPM dependencies
└── README.md        # This file
```

---

## ⌨️ UI Quick Reference

| Action | How |
|---|---|
| Switch layout | Layout dropdown in **Design** tab |
| Apply theme | Click a swatch in **Thèmes Prédéfinis** |
| Random theme | **Palette Aléatoire** button |
| Style a field | Click the palette icon next to any input |
| Hide a field/section | Click the eye icon next to any input |
| Zoom preview | **−** / **+** buttons in the top bar |
| Export PDF | **Imprimer / PDF** button |
| Export data | **Exporter** button (bottom bar) |
| Import data | **Importer** button (bottom bar) |

---

## 🔒 Privacy & Multi-user Deployment

CV Maker is a **static site** (works on Vercel, Netlify, GitHub Pages…). There is no server and no database:

- Every visitor's CV is stored **only in their own browser** (`localStorage`). Two people opening the same URL never see each other's data.
- Nothing is uploaded. Photos are resized locally; PDF export uses the browser's print engine.
- On a shared computer, use **Mes CV → Effacer toutes mes données** after exporting your JSON.
- The public default (`data.json`, `dist/data.js`) is a **fictional sample CV**. Keep your real CVs in the git-ignored `private/` folder and load them with **Importer**.
- Limits: data does not sync across devices/browsers (use **Exporter**/**Importer** to move it). Clearing site data deletes it.

---

## 📝 License

MIT © [Abdelli Hassen](https://github.com/Abdelli-Hassen)

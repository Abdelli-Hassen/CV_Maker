# 📄 CV Maker (Générateur de CV)

A purely static, client-side web application to build, customize, and export professional A4-optimized CVs. This tool runs entirely in your browser without requiring a backend server, making it fast, private, and easy to use.

## ✨ Features

- **Live Preview & Editor:** Edit your CV details in a structured form and instantly see the results in a live, real-time A4 preview.
- **Multiple Layouts:** Choose from 3 distinct, professional templates:
  - 🎨 *Designed* (Dark & Gold)
  - 💼 *Professional* (Classic Navy)
  - 📑 *Sidebar* (Modern Split Layout)
- **Customizable Themes:** Tweak the primary, secondary, and background colors for each specific layout to match your personal brand.
- **Smart A4 Pagination:** The printing engine uses a bulletproof algorithm to calculate heights and inject dynamic spacers. This guarantees pixel-perfect PDF exports with no sliced text lines or orphaned headers.
- **Data Persistence:** Automatically saves your progress to your browser's `localStorage` so you never lose your work.
- **Import / Export JSON:** Download your CV data as a `.json` file for backups, and import it back anytime to pick up where you left off.
- **100% Offline Capable:** Runs directly from `file:///` without CORS issues, thanks to the `data.js` local script fallback.

## 🚀 How to Use (Manual)

### 1. Getting Started
Simply double-click on `index.html` to open the application in your preferred web browser (Chrome, Edge, Firefox, etc.). No installation or web server is required. 

*Note: On first load, the app will automatically inject sample data from `data.js` so you have a working template.*

### 2. Editing Your Information
Use the left-hand **"Éditeur de CV" (Editor)** panel to modify your information.
- **Informations Personnelles:** Your name, title, email, and social links. You can also paste a Base64 image string or an image URL for your profile picture.
- **Expériences / Projets / Compétences / etc.:** Use the accordion menus to expand sections. You can add new entries using the `+ Ajouter` buttons, edit existing ones, or delete them. Every change you make updates the preview immediately.

### 3. Changing Layouts & Colors
- **Layouts:** Use the 3 large layout buttons at the top of the editor to instantly switch the visual structure of your CV.
- **Colors:** Below the layout buttons, you will find color pickers. Clicking them allows you to adjust the specific color tokens (e.g., Background, Primary Accent, Secondary Accent) for the currently active layout.

### 4. Saving and Loading Data
- **Auto-Save:** Your data is automatically saved in your browser. If you refresh the page, your data remains intact.
- **Export (Télécharger JSON):** Click this button to download your exact CV structure as a `data.json` file. Keep this file safe as your master backup.
- **Import (Importer JSON):** Click this button and select your previously saved `data.json` file to restore your CV.
- **Reset (Réinitialiser):** Wipes your changes and restores the default example template.

### 5. Exporting to PDF
When your CV is ready:
1. Click the **"🖨 Imprimer / PDF"** button.
2. The browser's native print dialog will appear.
3. Set the destination to **"Save as PDF"**.
4. Ensure the paper size is set to **A4**.
5. Enable **"Background graphics"** (Graphiques d'arrière-plan) so the colors and themes render correctly.
6. Make sure margins are set to **Default** or **None** depending on your browser.
7. Save your pixel-perfect PDF!

## 🛠 Tech Stack

- **HTML5:** Semantic structure.
- **CSS3:** Vanilla CSS with CSS Variables for dynamic theming, Flexbox/Grid for layouts, `@media print` rules, and a top-level `@page { size: A4; margin: 0; }` for pixel-accurate A4 PDF export.
- **JavaScript (ES6):** Vanilla JS for state management, DOM manipulation, dynamic spacer injection (in physical `mm` units for print fidelity), and local storage syncing.

## 🔧 Changelog

### Session — 2026-07-16

#### Features Added
- **5 layout templates** (was 3): Added *Minimalist Swiss* and *Europass* templates.
- **Image Design Controls:** Profile picture shape (circle / rounded / square), border width, border color, shadow, opacity, and horizontal/vertical offset — all live in the Design panel.
- **Design Panel:** Font family, base font size, line height, page margin slider, section spacing, photo visibility toggle, and page number toggle.
- **Debounced Layout Recalculation (400ms):** Layout-affecting sliders (page margin, font size, line height, section spacing) now trigger a clean `renderPreview()` after sliding stops — no lag, no stale pagination.
- **Clickable PDF Links:** All contact fields (email, phone, LinkedIn, GitHub, website) are wrapped in real `<a>` hyperlinks that remain clickable inside the exported PDF.
- **Default layout changed to Corporate Professional** (`professional`) for fresh loads with no saved `localStorage` preference.

#### Bug Fixes

- **Print/PDF Double Margin (Major Fix):** Every layout body (`.cv-prof-body`, `.cv-sidebar-body`, etc.) had its own `padding: 12–15mm` that is invisible on screen (clipped by `overflow: hidden`) but fully visible during print, stacking on top of the wrapper margin. Fixed by adding `padding: 0 !important; margin: 0 !important; min-height: 0 !important;` to all layout bodies inside `@media print`.

- **`@page` Rule Discarded in Brave:** `@page { margin: 0 !important; }` was nested inside `@media print`. Brave's engine discards the entire `@page` rule when `!important` is used inside it. Fixed by moving `@page { size: A4; margin: 0; }` to the top level of `style.css`.

- **CSS Variables Fail to Resolve During Print in Brave:** Brave's print sandbox does not resolve CSS custom properties set via `document.documentElement.style.setProperty()`. Page margin fell back to its CSS default. Fixed by setting all page wrapper dimensions and margins as hardcoded inline styles from the resolved JS `marginMm` value.

- **Pagination Unit Mismatch (`px` vs `mm`):** Spacer heights and `translateY` offsets were in `px`. Print DPI differs from screen DPI, so page breaks were physically incorrect in PDFs. Fixed by converting all spacer heights and offsets to `mm` via `pxPerMm = pageHeightPx / 297`.

- **Double Margin from `.a4-page-sheet` Padding:** `.a4-page-sheet` had `padding: var(--page-margin)` while `.a4-page-content-wrapper` used `top: var(--page-margin)`. Absolute positions are relative to the parent's padding box — this doubled the margin. Fixed by setting `padding: 0` on `.a4-page-sheet`.

- **Absolute Positioning Mismatch During Print:** `.a4-page-content-wrapper` used `position: absolute` with `top`/`left`, which print engines reference against the viewport rather than the parent element. Fixed by switching to `margin-top` / `margin-left`.

- **All Layout Wrappers Flattened During Print:** `#app-container`, `.preview-container`, and `#a4-page` retained flexbox properties during print, adding centering offsets. Fixed by forcing `display: block !important` with all margins/padding zeroed in `@media print`.

- **Screen Zoom Affecting Print Scale:** The active screen zoom level (e.g. 70%) was inherited during print, shrinking the PDF output. Fixed by adding `zoom: 1 !important` on `#screen-preview-container` inside `@media print`.

#### Improvements
- `@import` for Google Fonts added directly to `style.css` to ensure font rendering in print/PDF sandboxes.
- `@page { size: A4; }` added to force A4 paper dimensions regardless of system default.

### Printing Instructions (Updated)
When exporting to PDF (Brave / Chrome / Edge):
1. Click **Imprimer / PDF**.
2. Set **Marges → Aucune** (None). The app handles margins internally.
3. Enable **Graphiques d'arrière-plan** (Background graphics) for correct color/theme rendering.
4. Save — output is pixel-perfect A4.

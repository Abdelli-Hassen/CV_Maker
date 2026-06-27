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
- **CSS3:** Vanilla CSS with CSS Variables for dynamic theming, Flexbox/Grid for layouts, and complex `@media print` rules for A4 pagination.
- **JavaScript (ES6):** Vanilla JS for state management, DOM manipulation, dynamic spacer injection, and local storage syncing.

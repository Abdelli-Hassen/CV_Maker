const fs = require('fs');

// 1. Update index.html
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(
  '            <button id="design-btn-random" class="btn-action" onclick="applyRandomPalette()"\r\n              style="width: 100%; justify-content: center; margin-top: 0.25rem;">\r\n              🎨 Palette Aléatoire\r\n            </button>\r\n          </div>\r\n        </div>',
  `            <button id="design-btn-random" class="btn-action" onclick="applyRandomPalette()"\r\n              style="width: 100%; justify-content: center; margin-top: 0.25rem;">\r\n              🎨 Palette Aléatoire\r\n            </button>\r\n            \r\n            <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 1rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Thèmes Prédéfinis</div>\r\n            <div id="theme-swatches" class="theme-swatches"></div>\r\n          </div>\r\n        </div>`
);
// Also support LF instead of CRLF just in case
html = html.replace(
  '            <button id="design-btn-random" class="btn-action" onclick="applyRandomPalette()"\n              style="width: 100%; justify-content: center; margin-top: 0.25rem;">\n              🎨 Palette Aléatoire\n            </button>\n          </div>\n        </div>',
  `            <button id="design-btn-random" class="btn-action" onclick="applyRandomPalette()"\n              style="width: 100%; justify-content: center; margin-top: 0.25rem;">\n              🎨 Palette Aléatoire\n            </button>\n            \n            <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 1rem; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Thèmes Prédéfinis</div>\n            <div id="theme-swatches" class="theme-swatches"></div>\n          </div>\n        </div>`
);
fs.writeFileSync('index.html', html, 'utf8');


// 2. Update style.css
let css = fs.readFileSync('style.css', 'utf8');
const newCss = `
.theme-swatches {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(28px, 1fr));
  gap: 0.5rem;
  margin-top: 0.25rem;
}
.theme-swatch {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
}
.theme-swatch:hover {
  transform: scale(1.15) translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), 0 0 0 1.5px rgba(255, 255, 255, 0.3);
  z-index: 10;
}
.theme-swatch:active {
  transform: scale(0.95);
}
.theme-swatch::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 110%;
  left: 50%;
  transform: translateX(-50%);
  background: #0f172a;
  color: #f8fafc;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.65rem;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  border: 1px solid rgba(255,255,255,0.1);
  z-index: 20;
}
.theme-swatch:hover::after {
  opacity: 1;
  visibility: visible;
}
`;
if (!css.includes('.theme-swatches {')) {
  fs.writeFileSync('style.css', css + newCss, 'utf8');
}

// 3. Update app.js to add renderThemeSwatches()
let js = fs.readFileSync('app.js', 'utf8');
if (!js.includes('function renderThemeSwatches')) {
  // Inject function
  const renderFn = `
function renderThemeSwatches() {
    const container = document.getElementById('theme-swatches');
    if (!container) return;
    
    let list = [];
    if (currentLayout === 'designed') list = PRESETS.designed;
    else if (currentLayout === 'professional') list = PRESETS.professional;
    else if (currentLayout === 'sidebar') list = PRESETS.sidebar;
    
    if (list.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = list.map(theme => {
        let bgStyle = '';
        if (currentLayout === 'designed') {
            bgStyle = \`background: linear-gradient(135deg, \${theme.bg} 50%, \${theme.gold} 50%);\`;
        } else if (currentLayout === 'professional') {
            bgStyle = \`background: \${theme.navy};\`;
        } else if (currentLayout === 'sidebar') {
            bgStyle = \`background: linear-gradient(135deg, \${theme.bg} 50%, \${theme.accent} 50%);\`;
        }
        
        return \`<div class="theme-swatch" style="\${bgStyle}" data-tooltip="\${theme.name || 'Thème'}" onclick="applySpecificTheme('\${encodeURIComponent(JSON.stringify(theme))}')"></div>\`;
    }).join('');
}

function applySpecificTheme(encodedTheme) {
    const theme = JSON.parse(decodeURIComponent(encodedTheme));
    if (currentLayout === 'designed') {
        cvData.themes.designed.bg_color = theme.bg;
        cvData.themes.designed.gold_primary = theme.gold;
        cvData.themes.designed.gold_dark = darkenColor(theme.gold, 15);
        
        const p1 = document.getElementById('design-picker-bg');
        const p2 = document.getElementById('design-picker-gold');
        if (p1) p1.value = theme.bg;
        if (p2) p2.value = theme.gold;
    } else if (currentLayout === 'professional') {
        cvData.themes.professional.navy_primary = theme.navy;
        const p = document.getElementById('design-picker-navy');
        if (p) p.value = theme.navy;
    } else if (currentLayout === 'sidebar') {
        if (!cvData.themes.sidebar) cvData.themes.sidebar = {};
        cvData.themes.sidebar.sidebar_bg = theme.bg;
        cvData.themes.sidebar.sidebar_accent = theme.accent;
        const p1 = document.getElementById('design-picker-sidebar-bg');
        const p2 = document.getElementById('design-picker-sidebar-accent');
        if (p1) p1.value = theme.bg;
        if (p2) p2.value = theme.accent;
    }
    
    saveAndSync();
    renderPreview();
}
`;
  js = js.replace('function applyRandomPalette()', renderFn + '\nfunction applyRandomPalette()');
  
  // Call it on changeLayout and populateFormInputs
  js = js.replace('function changeLayout(newLayout) {', 'function changeLayout(newLayout) {\n    renderThemeSwatches();');
  js = js.replace('function populateFormInputs() {', 'function populateFormInputs() {\n    setTimeout(renderThemeSwatches, 100);');
  
  fs.writeFileSync('app.js', js, 'utf8');
}
console.log('UI for theme swatches generated');

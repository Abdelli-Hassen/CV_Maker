const fs = require('fs');
let js = fs.readFileSync('app.js', 'utf8');

const renderThemeSwatchesFunc = `
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

function applyRandomPalette() {`;

js = js.replace('function applyRandomPalette() {', renderThemeSwatchesFunc);

fs.writeFileSync('app.js', js, 'utf8');
console.log('Restored renderThemeSwatches!');

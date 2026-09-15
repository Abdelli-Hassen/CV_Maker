const fs = require('fs');

let js = fs.readFileSync('app.js', 'utf8');

const updatedThemeScript = `
function applySpecificTheme(encodedTheme) {
    const theme = JSON.parse(decodeURIComponent(encodedTheme));
    
    // 1. Base Colors
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
    
    // 2. Global Typography & Texts
    if (theme.font) {
        if (!cvData.design) cvData.design = {};
        cvData.design.font_family = theme.font;
        const fontPicker = document.getElementById('design-font-family');
        if (fontPicker) fontPicker.value = theme.font;
    }
    
    // 3. Section Overrides (Headings)
    if (theme.headingStyles) {
        if (!cvData.design) cvData.design = {};
        if (!cvData.design.overrides) cvData.design.overrides = {};
        
        // Define common paths for section titles based on layouts
        const headingPaths = [
            'heading.profile', 'heading.experiences', 'heading.formations',
            'heading.skills', 'heading.projects', 'heading.education',
            'heading.certifications', 'heading.activities', 'heading.languages',
            'heading.interests'
        ];
        
        // Apply the styles to all headings
        headingPaths.forEach(path => {
            if (!cvData.design.overrides[path]) cvData.design.overrides[path] = {};
            
            if (theme.headingStyles.textTransform) {
                cvData.design.overrides[path]['textTransform'] = theme.headingStyles.textTransform;
            }
            if (theme.headingStyles.textAlign) {
                cvData.design.overrides[path]['textAlign'] = theme.headingStyles.textAlign;
            }
            if (theme.headingStyles.borderBottom) {
                cvData.design.overrides[path]['borderBottom'] = theme.headingStyles.borderBottom.replace('{accent}', theme.gold || theme.navy || theme.accent);
            }
            if (theme.headingStyles.letterSpacing) {
                cvData.design.overrides[path]['letterSpacing'] = theme.headingStyles.letterSpacing;
            }
            if (theme.headingStyles.fontWeight) {
                cvData.design.overrides[path]['fontWeight'] = theme.headingStyles.fontWeight;
            }
        });
    }

    saveAndSync();
    renderPreview();
}
`;

// Replace applySpecificTheme
const applySpecificThemeRegex = /function applySpecificTheme\(encodedTheme\) \{[\s\S]*?renderPreview\(\);\r?\n\}/;
js = js.replace(applySpecificThemeRegex, updatedThemeScript.trim());

// Now upgrade PRESETS to have typography and heading styles
const presetsRegex = /const PRESETS = \{[\s\S]*?\n\};\n\nfunction applyRandomPalette\(\) \{/;

const extendedPresetsStr = `const PRESETS = {
    designed: [
        { bg: "#0b0f19", gold: "#f59e0b", name: "Midnight Gold", font: "Playfair Display", headingStyles: { textTransform: "uppercase", letterSpacing: "1px", textAlign: "center", borderBottom: "1px solid {accent}" } },
        { bg: "#0f172a", gold: "#38bdf8", name: "Slate & Cyan", font: "Montserrat", headingStyles: { textTransform: "uppercase", fontWeight: "700", borderBottom: "3px solid {accent}" } },
        { bg: "#18181b", gold: "#f43f5e", name: "Zinc & Rose", font: "Lora", headingStyles: { textTransform: "none", textAlign: "left", borderBottom: "1px dashed {accent}" } },
        { bg: "#064e3b", gold: "#fbbf24", name: "Forest & Gold", font: "Merriweather", headingStyles: { textTransform: "capitalize", borderBottom: "2px solid {accent}" } },
        { bg: "#1e1b4b", gold: "#a855f7", name: "Indigo & Purple", font: "Oswald", headingStyles: { textTransform: "uppercase", letterSpacing: "2px", textAlign: "center", borderBottom: "none" } },
        { bg: "#1c1917", gold: "#2dd4bf", name: "Stone & Teal", font: "Inter", headingStyles: { textTransform: "none", fontWeight: "600", borderBottom: "2px solid {accent}" } },
        { bg: "#0c1a2e", gold: "#f97316", name: "Abyss & Flame", font: "Roboto", headingStyles: { textTransform: "uppercase", textAlign: "left", borderBottom: "1px solid #ccc" } },
        { bg: "#09090b", gold: "#22d3ee", name: "Obsidian & Ice", font: "Lato", headingStyles: { textTransform: "none", borderBottom: "none" } }
    ],
    professional: [
        { navy: "#1e3a8a", name: "Corporate Navy", font: "Merriweather", headingStyles: { textTransform: "uppercase", borderBottom: "2px solid {accent}" } },
        { navy: "#0f766e", name: "Teal", font: "Inter", headingStyles: { textTransform: "none", borderBottom: "1px solid #ddd" } },
        { navy: "#1c1917", name: "Graphite", font: "Montserrat", headingStyles: { textTransform: "uppercase", letterSpacing: "1px", borderBottom: "3px solid {accent}" } },
        { navy: "#881337", name: "Maroon", font: "Playfair Display", headingStyles: { textTransform: "none", textAlign: "center", borderBottom: "1px double {accent}" } },
        { navy: "#312e81", name: "Indigo", font: "Roboto", headingStyles: { textTransform: "capitalize", borderBottom: "2px solid {accent}" } }
    ],
    sidebar: [
        { bg: "#1e293b", accent: "#3b82f6", name: "Slate & Blue", font: "Inter", headingStyles: { textTransform: "uppercase", borderBottom: "2px solid {accent}" } },
        { bg: "#0f172a", accent: "#f43f5e", name: "Navy & Rose", font: "Montserrat", headingStyles: { textTransform: "none", borderBottom: "none" } },
        { bg: "#1c1917", accent: "#f97316", name: "Charcoal & Orange", font: "Lora", headingStyles: { textTransform: "capitalize", borderBottom: "1px solid {accent}" } },
        { bg: "#14532d", accent: "#eab308", name: "Forest & Gold", font: "Merriweather", headingStyles: { textTransform: "uppercase", textAlign: "center", borderBottom: "1px dashed {accent}" } },
        { bg: "#3b0764", accent: "#14b8a6", name: "Eggplant & Teal", font: "Playfair Display", headingStyles: { textTransform: "none", borderBottom: "2px solid {accent}" } }
    ]
};

function applyRandomPalette() {`;

js = js.replace(presetsRegex, extendedPresetsStr);
fs.writeFileSync('app.js', js, 'utf8');

console.log('Successfully upgraded applySpecificTheme and PRESETS with typography and section styles.');

const fs = require('fs');

let js = fs.readFileSync('app.js', 'utf8');

// Replace PRESETS robustly
const presetsRegex = /const PRESETS = \{[\s\S]*?\r?\n\};\r?\n[\s\S]*?function applyRandomPalette\(\) \{/m;

const extendedPresetsStr = `const PRESETS = {
    designed: [
        // Dark backgrounds with white text
        { bg: "#0b0f19", gold: "#f59e0b", name: "Midnight Gold", font: "Playfair Display", textColors: { name: "#ffffff", title: "#d1d5db", heading: "#f59e0b", body: "#e2e8f0", muted: "#94a3b8" }, headingStyles: { textTransform: "uppercase", letterSpacing: "2px", textAlign: "center", borderBottom: "1px solid {accent}" } },
        { bg: "#0f172a", gold: "#38bdf8", name: "Slate & Cyan", font: "Montserrat", textColors: { name: "#f8fafc", title: "#cbd5e1", heading: "#38bdf8", body: "#f1f5f9", muted: "#94a3b8" }, headingStyles: { textTransform: "uppercase", fontWeight: "700", borderBottom: "3px solid {accent}" } },
        { bg: "#18181b", gold: "#f43f5e", name: "Zinc & Rose", font: "Lora", textColors: { name: "#ffffff", title: "#d4d4d8", heading: "#f43f5e", body: "#e4e4e7", muted: "#a1a1aa" }, headingStyles: { textTransform: "none", textAlign: "left", borderBottom: "1px dashed {accent}" } },
        { bg: "#064e3b", gold: "#fbbf24", name: "Forest & Gold", font: "Merriweather", textColors: { name: "#ecfdf5", title: "#a7f3d0", heading: "#fbbf24", body: "#d1fae5", muted: "#6ee7b7" }, headingStyles: { textTransform: "capitalize", borderBottom: "2px solid {accent}" } },
        { bg: "#1e1b4b", gold: "#a855f7", name: "Indigo & Purple", font: "Oswald", textColors: { name: "#ffffff", title: "#e0e7ff", heading: "#a855f7", body: "#c7d2fe", muted: "#818cf8" }, headingStyles: { textTransform: "uppercase", letterSpacing: "2px", textAlign: "center", borderBottom: "none" } },
        { bg: "#1c1917", gold: "#2dd4bf", name: "Stone & Teal", font: "Inter", textColors: { name: "#fafaf9", title: "#d6d3d1", heading: "#2dd4bf", body: "#e7e5e4", muted: "#a8a29e" }, headingStyles: { textTransform: "none", fontWeight: "600", borderBottom: "2px solid {accent}" } },
        { bg: "#0c1a2e", gold: "#f97316", name: "Abyss & Flame", font: "Roboto", textColors: { name: "#ffffff", title: "#bfdbfe", heading: "#f97316", body: "#dbeafe", muted: "#93c5fd" }, headingStyles: { textTransform: "uppercase", textAlign: "left", borderBottom: "1px solid #ccc" } },
        { bg: "#09090b", gold: "#22d3ee", name: "Obsidian & Ice", font: "Lato", textColors: { name: "#ffffff", title: "#d4d4d8", heading: "#22d3ee", body: "#f4f4f5", muted: "#a1a1aa" }, headingStyles: { textTransform: "none", borderBottom: "none" } },
        { bg: "#0d1117", gold: "#79f2b0", name: "GitHub Dark & Mint", font: "Open Sans", textColors: { name: "#c9d1d9", title: "#8b949e", heading: "#79f2b0", body: "#c9d1d9", muted: "#8b949e" }, headingStyles: { textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid {accent}" } },
        { bg: "#150926", gold: "#e879f9", name: "Void & Fuchsia", font: "Playfair Display", textColors: { name: "#f3e8ff", title: "#d8b4fe", heading: "#e879f9", body: "#e9d5ff", muted: "#c084fc" }, headingStyles: { textTransform: "capitalize", textAlign: "center", borderBottom: "2px solid {accent}" } },
        { bg: "#0a0a0a", gold: "#facc15", name: "Carbon & Neon Yellow", font: "Montserrat", textColors: { name: "#fafafa", title: "#a3a3a3", heading: "#facc15", body: "#e5e5e5", muted: "#737373" }, headingStyles: { textTransform: "uppercase", fontWeight: "800", borderBottom: "none" } },
        { bg: "#1a0533", gold: "#fb923c", name: "Midnight Grape & Sunset", font: "Lora", textColors: { name: "#fff5f5", title: "#fed7aa", heading: "#fb923c", body: "#ffedd5", muted: "#fdba74" }, headingStyles: { textTransform: "none", borderBottom: "1px dashed {accent}" } },
        { bg: "#012030", gold: "#4ade80", name: "Deep Ocean & Lime", font: "Inter", textColors: { name: "#f0fdf4", title: "#bbf7d0", heading: "#4ade80", body: "#dcfce7", muted: "#86efac" }, headingStyles: { textTransform: "uppercase", textAlign: "left", borderBottom: "2px solid {accent}" } },
        { bg: "#0f1923", gold: "#f0abfc", name: "Noir & Lavender", font: "Merriweather", textColors: { name: "#fae8ff", title: "#e879f9", heading: "#f0abfc", body: "#f5d0fe", muted: "#c084fc" }, headingStyles: { textTransform: "capitalize", borderBottom: "1px solid {accent}" } },
        { bg: "#1a1a2e", gold: "#e94560", name: "Deep Blue & Crimson", font: "Oswald", textColors: { name: "#ffffff", title: "#e2e8f0", heading: "#e94560", body: "#f8fafc", muted: "#cbd5e1" }, headingStyles: { textTransform: "uppercase", letterSpacing: "2px", borderBottom: "3px solid {accent}" } },
        // Light backgrounds with dark text
        { bg: "#ffffff", gold: "#0f172a", name: "Minimalist Light", font: "Inter", textColors: { name: "#0f172a", title: "#475569", heading: "#0f172a", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid #e2e8f0" } },
        { bg: "#f8fafc", gold: "#3b82f6", name: "Clean Slate", font: "Roboto", textColors: { name: "#1e293b", title: "#64748b", heading: "#3b82f6", body: "#334155", muted: "#94a3b8" }, headingStyles: { textTransform: "none", borderBottom: "2px solid {accent}" } },
        { bg: "#fafaf9", gold: "#1c1917", name: "Warm Stone", font: "Lora", textColors: { name: "#1c1917", title: "#57534e", heading: "#1c1917", body: "#44403c", muted: "#78716c" }, headingStyles: { textTransform: "capitalize", textAlign: "center", borderBottom: "1px double #1c1917" } },
        { bg: "#f0fdf4", gold: "#15803d", name: "Mint Fresh", font: "Montserrat", textColors: { name: "#14532d", title: "#166534", heading: "#15803d", body: "#166534", muted: "#22c55e" }, headingStyles: { textTransform: "uppercase", borderBottom: "2px solid {accent}" } },
        { bg: "#fffbeb", gold: "#b45309", name: "Cream & Amber", font: "Playfair Display", textColors: { name: "#78350f", title: "#92400e", heading: "#b45309", body: "#92400e", muted: "#d97706" }, headingStyles: { textTransform: "none", borderBottom: "1px dashed {accent}" } }
    ],
    professional: [
        // Professional uses light backgrounds by default, so text should be dark
        { navy: "#1e3a8a", name: "Corporate Navy", font: "Merriweather", textColors: { name: "#1e3a8a", title: "#475569", heading: "#1e3a8a", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", borderBottom: "2px solid {accent}" } },
        { navy: "#0f766e", name: "Teal", font: "Inter", textColors: { name: "#0f766e", title: "#475569", heading: "#0f766e", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "none", borderBottom: "1px solid #ddd" } },
        { navy: "#1c1917", name: "Graphite", font: "Montserrat", textColors: { name: "#1c1917", title: "#57534e", heading: "#1c1917", body: "#44403c", muted: "#78716c" }, headingStyles: { textTransform: "uppercase", letterSpacing: "1px", borderBottom: "3px solid {accent}" } },
        { navy: "#881337", name: "Maroon", font: "Playfair Display", textColors: { name: "#881337", title: "#475569", heading: "#881337", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "none", textAlign: "center", borderBottom: "1px double {accent}" } },
        { navy: "#312e81", name: "Indigo", font: "Roboto", textColors: { name: "#312e81", title: "#475569", heading: "#312e81", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "capitalize", borderBottom: "2px solid {accent}" } },
        { navy: "#1d4ed8", name: "Electric Blue", font: "Open Sans", textColors: { name: "#1d4ed8", title: "#475569", heading: "#1d4ed8", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", borderBottom: "1px solid {accent}" } },
        { navy: "#065f46", name: "Emerald", font: "Lato", textColors: { name: "#065f46", title: "#475569", heading: "#065f46", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", textAlign: "center", borderBottom: "2px solid {accent}" } },
        { navy: "#6b21a8", name: "Royal Purple", font: "Lora", textColors: { name: "#6b21a8", title: "#475569", heading: "#6b21a8", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "none", borderBottom: "1px dashed {accent}" } },
        { navy: "#7c2d12", name: "Terracotta", font: "Oswald", textColors: { name: "#7c2d12", title: "#475569", heading: "#7c2d12", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", letterSpacing: "2px", borderBottom: "2px solid {accent}" } },
        { navy: "#1a202c", name: "Slate Black", font: "Inter", textColors: { name: "#1a202c", title: "#475569", heading: "#1a202c", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", borderBottom: "3px solid {accent}" } },
        { navy: "#4c0519", name: "Dark Burgundy", font: "Merriweather", textColors: { name: "#4c0519", title: "#475569", heading: "#4c0519", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "capitalize", borderBottom: "1px double {accent}" } },
        { navy: "#14532d", name: "Forest Green", font: "Montserrat", textColors: { name: "#14532d", title: "#475569", heading: "#14532d", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", fontWeight: "700", borderBottom: "2px solid {accent}" } },
        { navy: "#1d2d6b", name: "Prussian Blue", font: "Playfair Display", textColors: { name: "#1d2d6b", title: "#475569", heading: "#1d2d6b", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "none", textAlign: "center", borderBottom: "1px solid {accent}" } },
        { navy: "#4b2c20", name: "Espresso", font: "Lora", textColors: { name: "#4b2c20", title: "#475569", heading: "#4b2c20", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "capitalize", borderBottom: "1px dashed {accent}" } },
        { navy: "#374151", name: "Storm Grey", font: "Inter", textColors: { name: "#374151", title: "#475569", heading: "#374151", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "none", borderBottom: "1px solid #e5e7eb" } },
        { navy: "#00695c", name: "Eucalyptus", font: "Roboto", textColors: { name: "#00695c", title: "#475569", heading: "#00695c", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", borderBottom: "2px solid {accent}" } },
        { navy: "#004d61", name: "Petrol Blue", font: "Open Sans", textColors: { name: "#004d61", title: "#475569", heading: "#004d61", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", letterSpacing: "1px", borderBottom: "2px solid {accent}" } },
        { navy: "#5b2333", name: "Wine Red", font: "Merriweather", textColors: { name: "#5b2333", title: "#475569", heading: "#5b2333", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "capitalize", borderBottom: "1px solid {accent}" } },
        { navy: "#2c3e50", name: "Wet Asphalt", font: "Lato", textColors: { name: "#2c3e50", title: "#475569", heading: "#2c3e50", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "none", borderBottom: "3px solid {accent}" } },
        { navy: "#1a1a2e", name: "Cosmic Blue", font: "Oswald", textColors: { name: "#1a1a2e", title: "#475569", heading: "#1a1a2e", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", borderBottom: "none" } }
    ],
    sidebar: [
        { bg: "#1e293b", accent: "#3b82f6", name: "Slate & Blue", font: "Inter", textColors: { name: "#1e293b", title: "#475569", heading: "#1e293b", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", borderBottom: "2px solid {accent}" } },
        { bg: "#0f172a", accent: "#f43f5e", name: "Navy & Rose", font: "Montserrat", textColors: { name: "#0f172a", title: "#475569", heading: "#0f172a", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "none", borderBottom: "none" } },
        { bg: "#1c1917", accent: "#f97316", name: "Charcoal & Orange", font: "Lora", textColors: { name: "#1c1917", title: "#57534e", heading: "#1c1917", body: "#44403c", muted: "#78716c" }, headingStyles: { textTransform: "capitalize", borderBottom: "1px solid {accent}" } },
        { bg: "#14532d", accent: "#eab308", name: "Forest & Gold", font: "Merriweather", textColors: { name: "#14532d", title: "#475569", heading: "#14532d", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", textAlign: "center", borderBottom: "1px dashed {accent}" } },
        { bg: "#3b0764", accent: "#14b8a6", name: "Eggplant & Teal", font: "Playfair Display", textColors: { name: "#3b0764", title: "#475569", heading: "#3b0764", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "none", borderBottom: "2px solid {accent}" } },
        { bg: "#0c1a2e", accent: "#f59e0b", name: "Abyss & Amber", font: "Roboto", textColors: { name: "#0c1a2e", title: "#475569", heading: "#0c1a2e", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", borderBottom: "1px solid {accent}" } },
        { bg: "#150926", accent: "#67e8f9", name: "Grape & Cyan", font: "Open Sans", textColors: { name: "#150926", title: "#475569", heading: "#150926", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", letterSpacing: "1px", borderBottom: "2px solid {accent}" } },
        { bg: "#1a0533", accent: "#4ade80", name: "Midnight & Lime", font: "Lato", textColors: { name: "#1a0533", title: "#475569", heading: "#1a0533", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "none", borderBottom: "3px solid {accent}" } },
        { bg: "#09090b", accent: "#e879f9", name: "Black & Fuchsia", font: "Oswald", textColors: { name: "#09090b", title: "#475569", heading: "#09090b", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", letterSpacing: "2px", borderBottom: "none" } },
        { bg: "#012030", accent: "#fb923c", name: "Ocean & Flame", font: "Merriweather", textColors: { name: "#012030", title: "#475569", heading: "#012030", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "capitalize", borderBottom: "1px double {accent}" } },
        { bg: "#231942", accent: "#fbbf24", name: "Cosmic & Gold", font: "Playfair Display", textColors: { name: "#231942", title: "#475569", heading: "#231942", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "none", textAlign: "center", borderBottom: "1px solid {accent}" } },
        { bg: "#1b0000", accent: "#34d399", name: "Blood & Mint", font: "Inter", textColors: { name: "#1b0000", title: "#475569", heading: "#1b0000", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", borderBottom: "2px solid {accent}" } },
        { bg: "#002b36", accent: "#2dd4bf", name: "Solarized Teal", font: "Montserrat", textColors: { name: "#002b36", title: "#475569", heading: "#002b36", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", fontWeight: "700", borderBottom: "3px solid {accent}" } },
        { bg: "#0a192f", accent: "#64ffda", name: "Deep Navy & Jade", font: "Lora", textColors: { name: "#0a192f", title: "#475569", heading: "#0a192f", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "capitalize", borderBottom: "1px dashed {accent}" } },
        { bg: "#16213e", accent: "#f9a8d4", name: "Midnight & Pink", font: "Roboto", textColors: { name: "#16213e", title: "#475569", heading: "#16213e", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "none", borderBottom: "2px solid {accent}" } },
        { bg: "#1b1b2f", accent: "#a78bfa", name: "Noir & Violet", font: "Merriweather", textColors: { name: "#1b1b2f", title: "#475569", heading: "#1b1b2f", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", borderBottom: "1px solid {accent}" } },
        { bg: "#0d1117", accent: "#58a6ff", name: "GitHub & Blue", font: "Open Sans", textColors: { name: "#0d1117", title: "#475569", heading: "#0d1117", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "none", borderBottom: "1px solid #e5e7eb" } },
        { bg: "#0e2323", accent: "#fde68a", name: "Dark Teal & Cream", font: "Playfair Display", textColors: { name: "#0e2323", title: "#475569", heading: "#0e2323", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "capitalize", borderBottom: "1px double {accent}" } },
        { bg: "#101820", accent: "#ff6b6b", name: "Charcoal & Coral", font: "Lato", textColors: { name: "#101820", title: "#475569", heading: "#101820", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", borderBottom: "2px solid {accent}" } },
        { bg: "#1f1300", accent: "#86efac", name: "Espresso & Sage", font: "Montserrat", textColors: { name: "#1f1300", title: "#475569", heading: "#1f1300", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid {accent}" } }
    ]
};

function applyRandomPalette() {`;

js = js.replace(presetsRegex, extendedPresetsStr);

// Also robustly replace applySpecificTheme
const applySpecificThemeRegex = /function applySpecificTheme\(encodedTheme\) \{[\s\S]*?renderPreview\(\);\r?\n\}/;
const applySpecificThemeReplace = `function applySpecificTheme(encodedTheme) {
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
    
    // 2. Global Typography & Fonts
    if (theme.font) {
        if (!cvData.design) cvData.design = {};
        cvData.design.font_family = theme.font;
        const fontPicker = document.getElementById('design-font-family');
        if (fontPicker) fontPicker.value = theme.font;
    }
    
    // 3. Text Colors (This fixes the "black always" issue)
    if (theme.textColors) {
        if (!cvData.design) cvData.design = {};
        if (!cvData.design.typography) cvData.design.typography = {};
        ['name', 'title', 'heading', 'body', 'muted'].forEach(type => {
            if (!cvData.design.typography[type]) cvData.design.typography[type] = {};
            if (theme.textColors[type]) {
                cvData.design.typography[type].color = theme.textColors[type];
            }
        });
    }
    
    // 4. Section Overrides (Headings)
    if (theme.headingStyles) {
        if (!cvData.design) cvData.design = {};
        if (!cvData.design.overrides) cvData.design.overrides = {};
        
        const headingPaths = [
            'heading.profile', 'heading.experiences', 'heading.formations',
            'heading.skills', 'heading.projects', 'heading.education',
            'heading.certifications', 'heading.activities', 'heading.languages',
            'heading.interests'
        ];
        
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
}`;

js = js.replace(applySpecificThemeRegex, applySpecificThemeReplace);

// Let's also fix applyRandomPalette to call applySpecificTheme logic so random button works properly
const randomPaletteRegex = /function applyRandomPalette\(\) \{[\s\S]*?renderThemeSwatches\(\);\r?\n\}/;
const randomPaletteReplace = `function applyRandomPalette() {
    let list = [];
    if (currentLayout === 'designed') list = PRESETS.designed;
    else if (currentLayout === 'professional') list = PRESETS.professional;
    else if (currentLayout === 'sidebar') list = PRESETS.sidebar;
    
    if (list.length > 0) {
        const choice = list[Math.floor(Math.random() * list.length)];
        applySpecificTheme(encodeURIComponent(JSON.stringify(choice)));
    }
}`;

js = js.replace(randomPaletteRegex, randomPaletteReplace);

fs.writeFileSync('app.js', js, 'utf8');
console.log('Fixed themes logic permanently.');

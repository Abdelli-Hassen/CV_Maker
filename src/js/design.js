function updateThemeColor(type, hex) {
    if (type === 'bg') {
        window.App.cvData.themes.designed.bg_color = hex;
        document.documentElement.style.setProperty('--design-bg', hex);
        const p = document.getElementById('design-picker-bg');
        if (p) p.value = hex;
    } else if (type === 'gold') {
        window.App.cvData.themes.designed.gold_primary = hex;
        const dark = darkenColor(hex, 15);
        window.App.cvData.themes.designed.gold_dark = dark;
        document.documentElement.style.setProperty('--design-gold', hex);
        document.documentElement.style.setProperty('--design-gold-dark', dark);
        const p = document.getElementById('design-picker-gold');
        if (p) p.value = hex;
    } else if (type === 'navy') {
        window.App.cvData.themes.professional.navy_primary = hex;
        document.documentElement.style.setProperty('--prof-navy', hex);
        const p = document.getElementById('design-picker-navy');
        if (p) p.value = hex;
    } else if (type === 'sidebar-bg') {
        if (!window.App.cvData.themes.sidebar) window.App.cvData.themes.sidebar = {};
        window.App.cvData.themes.sidebar.sidebar_bg = hex;
        document.documentElement.style.setProperty('--sidebar-bg', hex);
        const p = document.getElementById('design-picker-sidebar-bg');
        if (p) p.value = hex;
    } else if (type === 'sidebar-accent') {
        if (!window.App.cvData.themes.sidebar) window.App.cvData.themes.sidebar = {};
        window.App.cvData.themes.sidebar.sidebar_accent = hex;
        document.documentElement.style.setProperty('--sidebar-accent', hex);
        const p = document.getElementById('design-picker-sidebar-accent');
        if (p) p.value = hex;
    }
}
function updateTextColor(type, hex) {
    if (!window.App.cvData.design) window.App.cvData.design = {};
    if (!window.App.cvData.design.text_colors) window.App.cvData.design.text_colors = {};
    window.App.cvData.design.text_colors[type] = hex;

    const cssVarMap = {
        name: '--text-color-name',
        title: '--text-color-title',
        heading: '--text-color-heading',
        body: '--text-color-body',
        muted: '--text-color-muted'
    };

    if (cssVarMap[type]) {
        document.documentElement.style.setProperty(cssVarMap[type], hex);
        const picker = document.getElementById(`design-picker-text-${type}`);
        if (picker) picker.value = hex;
        const badge = document.getElementById(`badge-color-text-${type}`);
        if (badge) badge.style.backgroundColor = hex;
    }

    saveAndSync();
}
function resetTextColors() {
    if (window.App.cvData.design && window.App.cvData.design.text_colors) {
        delete window.App.cvData.design.text_colors;
    }
    const cssVars = ['--text-color-name', '--text-color-title', '--text-color-heading', '--text-color-body', '--text-color-muted'];
    cssVars.forEach(v => document.documentElement.style.removeProperty(v));
    syncTextColorPickers();
    saveAndSync();
}
function getDefaultTextColorForLayout(layout, key) {
    if (layout === 'professional') {
        const navy = window.App.cvData.themes?.professional?.navy_primary || '#1e3a8a';
        const map = { name: '#0f172a', title: '#334155', heading: navy, body: '#1e293b', muted: '#475569' };
        return map[key] || '#1e293b';
    } else if (layout === 'designed') {
        const gold = window.App.cvData.themes?.designed?.gold_primary || '#f59e0b';
        const map = { name: '#ffffff', title: gold, heading: gold, body: '#cbd5e1', muted: '#94a3b8' };
        return map[key] || '#cbd5e1';
    } else if (layout === 'ats') {
        const map = { name: '#000000', title: '#333333', heading: '#000000', body: '#1f2937', muted: '#4b5563' };
        return map[key] || '#1f2937';
    } else if (layout === 'sidebar') {
        const accent = window.App.cvData.themes?.sidebar?.sidebar_accent || '#3b82f6';
        const map = { name: '#0f172a', title: accent, heading: '#1e293b', body: '#334155', muted: '#64748b' };
        return map[key] || '#334155';
    } else {
        const map = { name: '#0f172a', title: '#475569', heading: '#0f172a', body: '#1e293b', muted: '#64748b' };
        return map[key] || '#1e293b';
    }
}
function syncTextColorPickers() {
    const textColors = (window.App.cvData.design && window.App.cvData.design.text_colors) ? window.App.cvData.design.text_colors : {};
    const keys = ['name', 'title', 'heading', 'body', 'muted'];
    keys.forEach(key => {
        const picker = document.getElementById(`design-picker-text-${key}`);
        const badge = document.getElementById(`badge-color-text-${key}`);
        const colorVal = textColors[key] || getDefaultTextColorForLayout(window.App.currentLayout, key);
        if (textColors[key]) {
            document.documentElement.style.setProperty(`--text-color-${key}`, textColors[key]);
        } else {
            document.documentElement.style.removeProperty(`--text-color-${key}`);
        }
        if (picker) picker.value = colorVal;
        if (badge) badge.style.backgroundColor = colorVal;
    });
}
function applyRandomPalette() {
    if (window.App.currentLayout === 'designed') {
        const list = PRESETS.designed;
        const currentBg = window.App.cvData.themes.designed.bg_color;
        let choice = list[Math.floor(Math.random() * list.length)];
        for (let i = 0; i < 5; i++) {
            if (choice.bg === currentBg) {
                choice = list[Math.floor(Math.random() * list.length)];
            }
        }
        window.App.cvData.themes.designed.bg_color = choice.bg;
        window.App.cvData.themes.designed.gold_primary = choice.gold;
        window.App.cvData.themes.designed.gold_dark = darkenColor(choice.gold, 15);

        const p1 = document.getElementById('design-picker-bg');
        const p2 = document.getElementById('design-picker-gold');
        if (p1) p1.value = choice.bg;
        if (p2) p2.value = choice.gold;
    } else if (window.App.currentLayout === 'professional') {
        const list = PRESETS.professional;
        const currentNavy = window.App.cvData.themes.professional.navy_primary;
        let choice = list[Math.floor(Math.random() * list.length)];
        for (let i = 0; i < 5; i++) {
            if (choice.navy === currentNavy) {
                choice = list[Math.floor(Math.random() * list.length)];
            }
        }
        window.App.cvData.themes.professional.navy_primary = choice.navy;
        const p = document.getElementById('design-picker-navy');
        if (p) p.value = choice.navy;
    } else if (window.App.currentLayout === 'sidebar') {
        const list = PRESETS.sidebar;
        if (!window.App.cvData.themes.sidebar) window.App.cvData.themes.sidebar = {};
        const currentBg = window.App.cvData.themes.sidebar.sidebar_bg || "";
        let choice = list[Math.floor(Math.random() * list.length)];
        for (let i = 0; i < 5; i++) {
            if (choice.bg === currentBg) {
                choice = list[Math.floor(Math.random() * list.length)];
            }
        }
        window.App.cvData.themes.sidebar.sidebar_bg = choice.bg;
        window.App.cvData.themes.sidebar.sidebar_accent = choice.accent;

        const p1 = document.getElementById('design-picker-sidebar-bg');
        const p2 = document.getElementById('design-picker-sidebar-accent');
        if (p1) p1.value = choice.bg;
        if (p2) p2.value = choice.accent;
    }

    if (window.App.currentLayout === 'designed') {
        document.documentElement.style.setProperty('--design-bg', window.App.cvData.themes.designed.bg_color);
        document.documentElement.style.setProperty('--design-gold', window.App.cvData.themes.designed.gold_primary);
        document.documentElement.style.setProperty('--design-gold-dark', window.App.cvData.themes.designed.gold_dark);
    } else if (window.App.currentLayout === 'professional') {
        document.documentElement.style.setProperty('--prof-navy', window.App.cvData.themes.professional.navy_primary);
    } else if (window.App.currentLayout === 'sidebar') {
        document.documentElement.style.setProperty('--sidebar-bg', window.App.cvData.themes.sidebar.sidebar_bg);
        document.documentElement.style.setProperty('--sidebar-accent', window.App.cvData.themes.sidebar.sidebar_accent);
    }

    saveAndSync();
}
function updateDesignField(field, value) {
    if (!window.App.cvData.design) window.App.cvData.design = {};
    window.App.cvData.design[field] = value;

    // Update label readouts
    if (field === 'base_size') {
        document.getElementById('lbl-design-base-size').innerText = `Taille de police : ${value}px`;
    } else if (field === 'line_height') {
        document.getElementById('lbl-design-line-height').innerText = `Interligne : ${value}`;
    } else if (field === 'page_margin') {
        document.getElementById('lbl-design-page-margin').innerText = `Marges de page : ${value}mm`;
    } else if (field === 'section_spacing') {
        document.getElementById('lbl-design-section-spacing').innerText = `Espacement des sections : ${value}rem`;
    } else if (field === 'pfp_border_width') {
        document.getElementById('lbl-design-pfp-border-width').innerText = `Bordure : ${value}px`;
    } else if (field === 'pfp_shadow') {
        document.getElementById('lbl-design-pfp-shadow').innerText = `Ombre : ${value}px`;
    } else if (field === 'pfp_opacity') {
        document.getElementById('lbl-design-pfp-opacity').innerText = `OpacitÃ© : ${Math.round(value * 100)}%`;
    } else if (field === 'pfp_offset_x') {
        document.getElementById('lbl-design-pfp-offset-x').innerText = `DÃ©calage horizontal : ${value}px`;
    } else if (field === 'pfp_offset_y') {
        document.getElementById('lbl-design-pfp-offset-y').innerText = `DÃ©calage vertical : ${value}px`;
    }

    applyDesignStyles();

    // Define which fields require a full structural re-render vs CSS only
    const nonStructuralFields = [
        'pfp_border_width', 'pfp_shadow', 'pfp_opacity', 'pfp_offset_x', 'pfp_offset_y',
        'pfp_border_color', 'pfp_shape', 'font_family'
    ];

    const layoutAffectingFields = [
        'base_size', 'line_height', 'page_margin', 'section_spacing'
    ];

    if (nonStructuralFields.includes(field)) {
        localStorage.setItem('cv_data', JSON.stringify(window.App.cvData));
    } else if (layoutAffectingFields.includes(field)) {
        localStorage.setItem('cv_data', JSON.stringify(window.App.cvData));
        // Debounce the layout recalculation to prevent slider lag
        clearTimeout(window._designDebounce);
        window._designDebounce = setTimeout(() => {
            renderPreview();
        }, 400);
    } else {
        saveAndSync();
    }
}
function applyDesignStyles() {
    const design = window.App.cvData.design || {
        font_family: "Inter",
        base_size: 14,
        line_height: 1.45,
        page_margin: 15,
        section_spacing: 1.2,
        show_pfp: true,
        show_page_number: true
    };

    const fontVal = design.font_family === 'Playfair Display' || design.font_family === 'Lora'
        ? `'${design.font_family}', serif`
        : `'${design.font_family}', sans-serif`;

    document.documentElement.style.setProperty('--font-global', fontVal);
    document.documentElement.style.setProperty('--font-base-size', `${design.base_size}px`);
    document.documentElement.style.setProperty('--line-height-base', design.line_height);
    document.documentElement.style.setProperty('--page-margin', `${design.page_margin}mm`);
    document.documentElement.style.setProperty('--section-margin', `${design.section_spacing}rem`);
    document.documentElement.style.setProperty('--pfp-display', design.show_pfp ? 'block' : 'none');

    // Image design properties
    const shapeMap = { 'circle': '50%', 'rounded': '12px', 'square': '0px' };
    document.documentElement.style.setProperty('--pfp-border-radius', shapeMap[design.pfp_shape || 'circle'] || '50%');
    document.documentElement.style.setProperty('--pfp-border-width', `${design.pfp_border_width ?? 2}px`);
    document.documentElement.style.setProperty('--pfp-border-color', design.pfp_border_color || '#d4af37');
    document.documentElement.style.setProperty('--pfp-shadow-blur', `${design.pfp_shadow ?? 15}px`);
    document.documentElement.style.setProperty('--pfp-shadow-opacity', design.pfp_shadow > 0 ? '0.4' : '0');
    document.documentElement.style.setProperty('--pfp-opacity', design.pfp_opacity ?? 1);
    document.documentElement.style.setProperty('--pfp-margin-left', `${design.pfp_offset_x ?? 0}px`);
    document.documentElement.style.setProperty('--pfp-margin-top', `${design.pfp_offset_y ?? 0}px`);

    syncTextColorPickers();
}
window.updateThemeColor = updateThemeColor;
window.updateTextColor = updateTextColor;
window.resetTextColors = resetTextColors;
window.getDefaultTextColorForLayout = getDefaultTextColorForLayout;
window.syncTextColorPickers = syncTextColorPickers;
window.applyRandomPalette = applyRandomPalette;
window.updateDesignField = updateDesignField;
window.applyDesignStyles = applyDesignStyles;

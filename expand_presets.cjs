const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

const oldPresets = `const PRESETS = {
    designed: [
        { bg: "#0b0f19", gold: "#f59e0b" }, // Midnight & Amber
        { bg: "#0f172a", gold: "#38bdf8" }, // Slate & Cyan
        { bg: "#18181b", gold: "#f43f5e" }, // Zinc & Rose
        { bg: "#064e3b", gold: "#fbbf24" }, // Forest Green & Gold
        { bg: "#1e1b4b", gold: "#a855f7" }, // Indigo & Purple
        { bg: "#1c1917", gold: "#2dd4bf" }  // Stone & Teal
    ],
    professional: [
        { navy: "#1e3a8a" }, // Corporate Navy
        { navy: "#0f766e" }, // Teal
        { navy: "#1c1917" }, // Graphite
        { navy: "#881337" }, // Maroon Rose
        { navy: "#312e81" }  // Indigo
    ],
    sidebar: [
        { bg: "#1e293b", accent: "#3b82f6" }, // Slate & Blue
        { bg: "#0f172a", accent: "#f43f5e" }, // Navy & Rose
        { bg: "#1c1917", accent: "#f97316" }, // Charcoal & Orange
        { bg: "#14532d", accent: "#eab308" }, // Forest & Gold
        { bg: "#3b0764", accent: "#14b8a6" }  // Eggplant & Teal
    ]
};`;

const newPresets = `const PRESETS = {
    designed: [
        // Dark backgrounds
        { bg: "#0b0f19", gold: "#f59e0b", name: "Midnight Gold" },
        { bg: "#0f172a", gold: "#38bdf8", name: "Slate & Cyan" },
        { bg: "#18181b", gold: "#f43f5e", name: "Zinc & Rose" },
        { bg: "#064e3b", gold: "#fbbf24", name: "Forest & Gold" },
        { bg: "#1e1b4b", gold: "#a855f7", name: "Indigo & Purple" },
        { bg: "#1c1917", gold: "#2dd4bf", name: "Stone & Teal" },
        // New dark themes
        { bg: "#0c1a2e", gold: "#f97316", name: "Abyss & Flame" },
        { bg: "#09090b", gold: "#22d3ee", name: "Obsidian & Ice" },
        { bg: "#0d1117", gold: "#79f2b0", name: "GitHub Dark & Mint" },
        { bg: "#150926", gold: "#e879f9", name: "Void & Fuchsia" },
        { bg: "#0a0a0a", gold: "#facc15", name: "Carbon & Neon Yellow" },
        { bg: "#1a0533", gold: "#fb923c", name: "Midnight Grape & Sunset" },
        { bg: "#012030", gold: "#4ade80", name: "Deep Ocean & Lime" },
        { bg: "#0f1923", gold: "#f0abfc", name: "Noir & Lavender" },
        { bg: "#1a1a2e", gold: "#e94560", name: "Deep Blue & Crimson" },
        { bg: "#0e2323", gold: "#ffd700", name: "Dark Teal & Pure Gold" },
        { bg: "#231942", gold: "#9be7ff", name: "Cosmic & Sky" },
        { bg: "#1b0000", gold: "#ff6b6b", name: "Blood Night & Coral" },
        { bg: "#002b36", gold: "#cb4b16", name: "Solarized & Sienna" },
        { bg: "#2d1b00", gold: "#fca311", name: "Dark Caramel & Marigold" },
        { bg: "#0a192f", gold: "#64ffda", name: "Navy & Turquoise" },
        { bg: "#16213e", gold: "#e94560", name: "Midnight Blue & Red" },
        { bg: "#1a0a00", gold: "#ffaa00", name: "Dark Espresso & Gold" },
        { bg: "#080c0c", gold: "#39ff14", name: "Pitch Black & Neon Green" },
        { bg: "#0d0221", gold: "#ff6fff", name: "Ultra Violet & Pink" },
        { bg: "#101820", gold: "#fee715", name: "Dark Charcoal & Electric Yellow" },
        { bg: "#1b1b2f", gold: "#e43f5a", name: "Midnight Navy & Strawberry" },
        { bg: "#0e0e0e", gold: "#00bcd4", name: "Matte Black & Aqua" },
        { bg: "#020024", gold: "#ff6e7f", name: "Dark Indigo & Salmon" },
        { bg: "#1f1300", gold: "#fff3a3", name: "Dark Chocolate & Cream" },
    ],
    professional: [
        { navy: "#1e3a8a", name: "Corporate Navy" },
        { navy: "#0f766e", name: "Teal" },
        { navy: "#1c1917", name: "Graphite" },
        { navy: "#881337", name: "Maroon" },
        { navy: "#312e81", name: "Indigo" },
        // New professional themes
        { navy: "#1d4ed8", name: "Electric Blue" },
        { navy: "#0369a1", name: "Sky Blue" },
        { navy: "#065f46", name: "Emerald" },
        { navy: "#6b21a8", name: "Royal Purple" },
        { navy: "#7c2d12", name: "Terracotta" },
        { navy: "#1e40af", name: "Cobalt" },
        { navy: "#134e4a", name: "Dark Teal" },
        { navy: "#4a1942", name: "Plum" },
        { navy: "#292524", name: "Charcoal Brown" },
        { navy: "#0c4a6e", name: "Deep Cerulean" },
        { navy: "#1a202c", name: "Slate Black" },
        { navy: "#4c0519", name: "Dark Burgundy" },
        { navy: "#14532d", name: "Forest Green" },
        { navy: "#1d2d6b", name: "Prussian Blue" },
        { navy: "#4b2c20", name: "Espresso" },
        { navy: "#374151", name: "Storm Grey" },
        { navy: "#00695c", name: "Eucalyptus" },
        { navy: "#004d61", name: "Petrol Blue" },
        { navy: "#5b2333", name: "Wine Red" },
        { navy: "#2c3e50", name: "Wet Asphalt" },
        { navy: "#1a1a2e", name: "Cosmic Blue" },
        { navy: "#004e64", name: "Deep Sea" },
        { navy: "#2d3748", name: "Blue Grey" },
        { navy: "#003153", name: "Prussian Dark" },
    ],
    sidebar: [
        { bg: "#1e293b", accent: "#3b82f6", name: "Slate & Blue" },
        { bg: "#0f172a", accent: "#f43f5e", name: "Navy & Rose" },
        { bg: "#1c1917", accent: "#f97316", name: "Charcoal & Orange" },
        { bg: "#14532d", accent: "#eab308", name: "Forest & Gold" },
        { bg: "#3b0764", accent: "#14b8a6", name: "Eggplant & Teal" },
        // New sidebar themes
        { bg: "#0c1a2e", accent: "#f59e0b", name: "Abyss & Amber" },
        { bg: "#150926", accent: "#67e8f9", name: "Grape & Cyan" },
        { bg: "#1a0533", accent: "#4ade80", name: "Midnight & Lime" },
        { bg: "#09090b", accent: "#e879f9", name: "Black & Fuchsia" },
        { bg: "#012030", accent: "#fb923c", name: "Ocean & Flame" },
        { bg: "#231942", accent: "#fbbf24", name: "Cosmic & Gold" },
        { bg: "#1b0000", accent: "#34d399", name: "Blood & Mint" },
        { bg: "#002b36", accent: "#2dd4bf", name: "Solarized Teal" },
        { bg: "#0a192f", accent: "#64ffda", name: "Deep Navy & Jade" },
        { bg: "#16213e", accent: "#f9a8d4", name: "Midnight & Pink" },
        { bg: "#1b1b2f", accent: "#a78bfa", name: "Noir & Violet" },
        { bg: "#0d1117", accent: "#58a6ff", name: "GitHub & Blue" },
        { bg: "#0e2323", accent: "#fde68a", name: "Dark Teal & Cream" },
        { bg: "#101820", accent: "#ff6b6b", name: "Charcoal & Coral" },
        { bg: "#1f1300", accent: "#86efac", name: "Espresso & Sage" },
        { bg: "#020024", accent: "#c4b5fd", name: "Cosmic & Lavender" },
        { bg: "#0e0e0e", accent: "#fbbf24", name: "Pitch Black & Amber" },
        { bg: "#1a0a00", accent: "#38bdf8", name: "Burnt & Ice Blue" },
        { bg: "#080c0c", accent: "#f472b6", name: "Obsidian & Hot Pink" },
        { bg: "#2d1b00", accent: "#a3e635", name: "Dark Caramel & Lime" },
        { bg: "#150e28", accent: "#fb7185", name: "Deep Violet & Salmon" },
        { bg: "#001219", accent: "#94d2bd", name: "Deep Ocean & Seafoam" },
        { bg: "#10002b", accent: "#7c3aed", name: "Ultra Violet & Deep Purple" },
        { bg: "#1a1a1a", accent: "#22c55e", name: "Matte Black & Emerald" },
    ]
};`;

if (code.includes('const PRESETS = {')) {
    code = code.replace(oldPresets, newPresets);
    if (code.includes('const PRESETS = {')) {
        fs.writeFileSync('app.js', code, 'utf8');
        console.log('PRESETS replaced successfully');
    } else {
        console.error('Replacement failed - duplicate key issue');
    }
} else {
    console.error('Could not find PRESETS object');
}

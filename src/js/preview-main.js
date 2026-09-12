// Import styles
import '../css/main.css';

// Import necessary modules
import './globals.js';
import '../../data.js';
import './layouts.js';
import './design.js';

// Setup preview rendering on load
document.addEventListener('DOMContentLoaded', () => {
    // Attempt to load from localStorage
    const savedData = localStorage.getItem('cv_data');
    if (savedData) {
        try {
            window.App.cvData = JSON.parse(savedData);
        } catch(e) {
            console.error('Error parsing cv_data:', e);
        }
    } else if (typeof window.defaultCVData !== 'undefined') {
        window.App.cvData = JSON.parse(JSON.stringify(window.defaultCVData));
    }

    const savedLayout = localStorage.getItem('cv_layout');
    if (savedLayout) {
        window.App.currentLayout = savedLayout;
    }

    if (window.runMigrations) {
        window.runMigrations(window.App.cvData);
    }
    
    // Initial render
    if (window.applyDesignStyles) window.applyDesignStyles();
    if (window.renderPreview) window.renderPreview();
});

// Listen for updates from the editor tab
window.addEventListener('storage', (e) => {
    if (e.key === 'cv_data' || e.key === 'cv_layout' || e.key === 'preview_zoom') {
        if (e.key === 'cv_data') {
            try {
                window.App.cvData = JSON.parse(e.newValue);
                if (window.runMigrations) window.runMigrations(window.App.cvData);
            } catch(err) {
                console.error('Failed to parse updated cv_data');
            }
        }
        if (e.key === 'cv_layout') {
            window.App.currentLayout = e.newValue;
        }
        
        // Re-render preview
        if (window.applyDesignStyles) window.applyDesignStyles();
        if (window.renderPreview) window.renderPreview();
    }
});

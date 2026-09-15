const fs = require('fs');
let js = fs.readFileSync('app.js', 'utf8');

const cvDataDeclRegex = /let cvData = JSON\.parse\(localStorage\.getItem\('cv_data'\)\)[\s\S]*?let currentLayout = /;

const sanitizerCode = `
// Deep sanitize string encoding glitches (like â€¢ instead of •)
function sanitizeGlitches(obj) {
    if (typeof obj === 'string') {
        return obj.replace(/â€¢/g, '•').replace(/â€™/g, "'");
    }
    if (Array.isArray(obj)) {
        return obj.map(sanitizeGlitches);
    }
    if (obj !== null && typeof obj === 'object') {
        const newObj = {};
        for (const key in obj) {
            newObj[key] = sanitizeGlitches(obj[key]);
        }
        return newObj;
    }
    return obj;
}

let cvDataRaw = JSON.parse(localStorage.getItem('cv_data'));
let cvData = sanitizeGlitches(cvDataRaw) || (typeof window.defaultCVData !== 'undefined' ? sanitizeGlitches(window.defaultCVData) : JSON.parse(JSON.stringify(emptyCVData)));
let currentLayout = `;

js = js.replace(cvDataDeclRegex, sanitizerCode);

fs.writeFileSync('app.js', js, 'utf8');
console.log('Sanitizer injected into app.js');

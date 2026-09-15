const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// Normalize to use consistent line endings for the patch
const target = '    let el = null;\r\n    const focusKey = FOCUS_MAP[path];\r\n    if (focusKey) {';
const replacement = `    let el = null;\r\n    const focusKey = FOCUS_MAP[path];\r\n    if (path.startsWith('heading.')) {\r\n        const section = path.split('.')[1];\r\n        el = container.querySelector(\`[data-section-title="\${section}"]\`);\r\n    } else if (focusKey) {`;

if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync('app.js', code, 'utf8');
    console.log('Patched getDefaultFieldStyles for heading paths');
} else {
    // Try without \r
    const target2 = '    let el = null;\n    const focusKey = FOCUS_MAP[path];\n    if (focusKey) {';
    const replacement2 = `    let el = null;\n    const focusKey = FOCUS_MAP[path];\n    if (path.startsWith('heading.')) {\n        const section = path.split('.')[1];\n        el = container.querySelector(\`[data-section-title="\${section}"]\`);\n    } else if (focusKey) {`;
    if (code.includes(target2)) {
        code = code.replace(target2, replacement2);
        fs.writeFileSync('app.js', code, 'utf8');
        console.log('Patched (LF) getDefaultFieldStyles for heading paths');
    } else {
        console.error('Could not find target block');
        process.exit(1);
    }
}

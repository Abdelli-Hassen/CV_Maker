const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// Update mapPathToGlobalType
code = code.replace(
    /function mapPathToGlobalType\(path\) \{\s*if \(!path\) return 'body';\s*if \(path === 'contact\.name'\) return 'name';/,
    `function mapPathToGlobalType(path) {
    if (!path) return 'body';
    if (path.startsWith('heading.')) return 'heading';
    if (path === 'contact.name') return 'name';`
);

// Update getSelectorForPath
code = code.replace(
    /function getSelectorForPath\(path\) \{\s*if \(path === 'contact\.name'\) return '\[data-editor-focus="input-name"\]';/,
    `function getSelectorForPath(path) {
    if (path.startsWith('heading.')) {
        const section = path.split('.')[1];
        return \`[data-section-title="\${section}"]\`;
    }
    if (path === 'contact.name') return '[data-editor-focus="input-name"]';`
);

// Add data-section-title to rendered headings
code = code.replace(/>\$\{getHdg\('profile',/g, ' data-section-title="profile">${getHdg(\'profile\',');
code = code.replace(/>\$\{getHdg\('formations',/g, ' data-section-title="formations">${getHdg(\'formations\',');
code = code.replace(/>\$\{getHdg\('experiences',/g, ' data-section-title="experiences">${getHdg(\'experiences\',');
code = code.replace(/>\$\{getHdg\('projects',/g, ' data-section-title="projects">${getHdg(\'projects\',');
code = code.replace(/>\$\{getHdg\('skills',/g, ' data-section-title="skills">${getHdg(\'skills\',');
code = code.replace(/>\$\{getHdg\('certifications',/g, ' data-section-title="certifications">${getHdg(\'certifications\',');
code = code.replace(/>\$\{getHdg\('languages',/g, ' data-section-title="languages">${getHdg(\'languages\',');
code = code.replace(/>\$\{getHdg\('interests',/g, ' data-section-title="interests">${getHdg(\'interests\',');
code = code.replace(/>\$\{getHdg\('education',/g, ' data-section-title="education">${getHdg(\'education\',');
code = code.replace(/>\$\{getHdg\('activities',/g, ' data-section-title="activities">${getHdg(\'activities\',');

fs.writeFileSync('app.js', code, 'utf8');
console.log('App selectors updated.');

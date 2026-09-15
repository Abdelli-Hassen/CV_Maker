const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// Helper function injection
if (!code.includes('window.getHdg =')) {
    code = code.replace('function renderPreview() {', 'window.getHdg = function(key, def) { return (cvData.headings && cvData.headings[key]) || def; };\n\nfunction renderPreview() {');
}

// Replace directly in the file
code = code.replace(/>Profil Professionnel</g, '>${getHdg(\'profile\', \'Profil Professionnel\')}<');
code = code.replace(/>Profil</g, '>${getHdg(\'profile\', \'Profil\')}<');
code = code.replace(/>Stages & Formations</g, '>${getHdg(\'formations\', \'Stages & Formations\')}<');
code = code.replace(/>Expérience Professionnelle</g, '>${getHdg(\'experiences\', \'Expérience Professionnelle\')}<');
code = code.replace(/>Expériences Professionnelles</g, '>${getHdg(\'experiences\', \'Expériences Professionnelles\')}<');
code = code.replace(/>Expériences</g, '>${getHdg(\'experiences\', \'Expériences\')}<');
code = code.replace(/>Projets Clés</g, '>${getHdg(\'projects\', \'Projets Clés\')}<');
code = code.replace(/>Compétences</g, '>${getHdg(\'skills\', \'Compétences\')}<');
code = code.replace(/>Certifications</g, '>${getHdg(\'certifications\', \'Certifications\')}<');
code = code.replace(/>Langues</g, '>${getHdg(\'languages\', \'Langues\')}<');
code = code.replace(/>Centres d'intérêt</g, '>${getHdg(\'interests\', \'Centres d\\\'intérêt\')}<');
code = code.replace(/>Centres d'Intérêt</g, '>${getHdg(\'interests\', \'Centres d\\\'Intérêt\')}<');
code = code.replace(/>Divers & Langues</g, '>${getHdg(\'languages\', \'Divers & Langues\')}<');
code = code.replace(/>Certifications & Activités</g, '>${getHdg(\'certifications\', \'Certifications & Activités\')}<');

fs.writeFileSync('app.js', code, 'utf8');
console.log('updated app.js headings rendering');

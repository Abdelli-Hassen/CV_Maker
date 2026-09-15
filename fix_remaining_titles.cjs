const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

code = code.replace(/>Éducation</g, ` data-section-title="education">\${getHdg('education', 'Éducation')}<`);
code = code.replace(/>Engagements & Activités</g, ` data-section-title="activities">\${getHdg('activities', 'Engagements & Activités')}<`);
code = code.replace(/>Activités</g, ` data-section-title="activities">\${getHdg('activities', 'Activités')}<`);
code = code.replace(/>Intérêts</g, ` data-section-title="interests">\${getHdg('interests', 'Intérêts')}<`);
code = code.replace(/>Divers</g, ` data-section-title="languages">\${getHdg('languages', 'Divers')}<`);

fs.writeFileSync('app.js', code, 'utf8');
console.log('Fixed remaining hardcoded titles in app.js');

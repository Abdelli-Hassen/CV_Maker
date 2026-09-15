const fs = require('fs');
let code = fs.readFileSync('app.js', 'utf8');

// Line 525: Professional layout - Skills
code = code.replace(
  '<div class="cv-prof-sectitle" data-editor-tab="tab-skills">Compétences Techniques</div>',
  '<div class="cv-prof-sectitle" data-editor-tab="tab-skills" data-section-title="skills">${getHdg(\'skills\', \'Compétences Techniques\')}</div>'
);

// Line 691: ATS layout - Projects  
code = code.replace(
  '<div class="cv-ats-sectitle" data-editor-tab="tab-projects">Projets Réalisés</div>',
  '<div class="cv-ats-sectitle" data-editor-tab="tab-projects" data-section-title="projects">${getHdg(\'projects\', \'Projets Réalisés\')}</div>'
);

// Line 698: ATS layout - Skills
code = code.replace(
  '<div class="cv-ats-sectitle" data-editor-tab="tab-skills">Compétences Techniques</div>',
  '<div class="cv-ats-sectitle" data-editor-tab="tab-skills" data-section-title="skills">${getHdg(\'skills\', \'Compétences Techniques\')}</div>'
);

// Line 1248: Europass layout - Projects
code = code.replace(
  '<div class="cv-euro-left" data-editor-tab="tab-projects">Projets</div>',
  '<div class="cv-euro-left" data-editor-tab="tab-projects" data-section-title="projects">${getHdg(\'projects\', \'Projets\')}</div>'
);

fs.writeFileSync('app.js', code, 'utf8');
console.log('Fixed hardcoded heading remnants in app.js');

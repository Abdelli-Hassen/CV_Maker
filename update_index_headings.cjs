const fs = require('fs');

const path = 'd:\\Projects\\CV_Maker\\index.html';
let content = fs.readFileSync(path, 'utf8');

const sections = [
    { id: 'profile', defaultTitle: 'Profil / Résumé' },
    { id: 'experiences', defaultTitle: 'Parcours Professionnel' },
    { id: 'formations', defaultTitle: 'Stages / Formations' },
    { id: 'projects', defaultTitle: 'Projets & Réalisations' },
    { id: 'skills', defaultTitle: 'Catégories de Compétences' },
    { id: 'education', defaultTitle: 'Formations / Études' },
    { id: 'certifications', defaultTitle: 'Certifications' },
    { id: 'activities', defaultTitle: 'Engagements / Activités' },
    { id: 'languages', defaultTitle: 'Langues' },
    { id: 'interests', defaultTitle: "Centres d'intérêt" }
];

sections.forEach(section => {
    // Regex to match the title span and its sibling actions container
    // E.g.
    // <span>Parcours Professionnel</span>
    // <div class="section-title-actions">
    
    // Some have inline styles in panel-section-title but we just look for the span and the div
    const regex = new RegExp(`<span>${section.defaultTitle.replaceAll('/', '\\\\/')}</span>\\s*<div class="section-title-actions">`, 'g');
    
    const replacement = `<input type="text" class="section-title-input" data-section="${section.id}" placeholder="${section.defaultTitle}" value="${section.defaultTitle}" oninput="updateSectionTitle('${section.id}', this.value)">
              <div class="section-title-actions">
                <button class="btn-field-design" onclick="toggleFieldStylePanel('heading.${section.id}', this)" title="Design de la section">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.38 0 2.5-1.12 2.5-2.5 0-.61-.23-1.17-.6-1.59-.3-.32-.4-.73-.4-1.12 0-1.1.9-2 2-2H19c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z"></path></svg>
                </button>`;
                
    content = content.replace(regex, replacement);
});

fs.writeFileSync(path, content, 'utf8');
console.log('Updated index.html headings successfully');

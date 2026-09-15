const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const palBtn = (id) => `
                <button class="btn-field-design" onclick="toggleFieldStylePanel('heading.${id}', this)" title="Design de la section">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.38 0 2.5-1.12 2.5-2.5 0-.61-.23-1.17-.6-1.59-.3-.32-.4-.73-.4-1.12 0-1.1.9-2 2-2H19c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z"></path></svg>
                </button>`;

// 1. Profil
// Find: <span>Profil / Résumé</span>
// Next line: <button class="btn-toggle-section" id="btn-hide-profile"...
code = code.replace(
  /<span>Profil \/ Résumé<\/span>\s*<button class="btn-toggle-section" id="btn-hide-profile"/,
  `<input type="text" class="section-title-input" data-section="profile" placeholder="Profil / Résumé" value="Profil / Résumé" oninput="updateSectionTitle('profile', this.value)">\n              <div class="section-title-actions">\n${palBtn('profile')}\n                <button class="btn-toggle-section" id="btn-hide-profile"`
);

// We need to add a closing </div> after the profile hide button to close section-title-actions
code = code.replace(
  /<button class="btn-toggle-section" id="btn-hide-profile" onclick="toggleSectionVisibility\('profile'\)">([^<]*)<svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"><\/path><circle cx="12" cy="12" r="3"><\/circle><\/svg><\/button>\s*<\/div>\s*<div class="form-card">/,
  `<button class="btn-toggle-section" id="btn-hide-profile" onclick="toggleSectionVisibility('profile')"><svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></button>\n              </div>\n            </div>\n            <div class="form-card">`
);

// 2. Formations
code = code.replace(
  /<span>Stages \/ Formations<\/span>\s*<div class="section-title-actions">/,
  `<input type="text" class="section-title-input" data-section="formations" placeholder="Stages / Formations" value="Stages / Formations" oninput="updateSectionTitle('formations', this.value)">\n              <div class="section-title-actions">\n${palBtn('formations')}`
);

// 3. Education
code = code.replace(
  /<span>Formations \/ Études<\/span>\s*<div class="section-title-actions">/,
  `<input type="text" class="section-title-input" data-section="education" placeholder="Formations / Études" value="Formations / Études" oninput="updateSectionTitle('education', this.value)">\n              <div class="section-title-actions">\n${palBtn('education')}`
);

// 4. Activities
code = code.replace(
  /<span>Engagements \/ Activités<\/span>\s*<div class="section-title-actions">/,
  `<input type="text" class="section-title-input" data-section="activities" placeholder="Engagements / Activités" value="Engagements / Activités" oninput="updateSectionTitle('activities', this.value)">\n              <div class="section-title-actions">\n${palBtn('activities')}`
);

fs.writeFileSync('index.html', code, 'utf8');
console.log('Fixed index.html properly');

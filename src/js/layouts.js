const formatHref = (url) => {
    if (!url) return '';
    return url.startsWith('http://') || url.startsWith('https://') ? url : 'https://' + url;
};

const formatGithubHref = (val) => {
    if (!val) return '';
    val = val.trim();
    if (val.includes('github.com')) {
        return val.startsWith('http') ? val : 'https://' + val;
    }
    return 'https://github.com/' + val;
};

const formatLinkedinHref = (val) => {
    if (!val) return '';
    val = val.trim();
    if (val.includes('linkedin.com')) {
        return val.startsWith('http') ? val : 'https://' + val;
    }
    return 'https://www.linkedin.com/in/' + val;
};

const formatEmailHref = (val) => {
    if (!val) return '';
    val = val.trim();
    if (val.endsWith('@gmail.com') || val.includes('gmail.com')) {
        // Strip mailto: if they typed it, to get raw email
        const rawEmail = val.replace(/^mailto:/i, '');
        return `https://mail.google.com/mail/?view=cm&fs=1&to=${rawEmail}`;
    }
    return val.startsWith('mailto:') ? val : `mailto:${val}`;
};

const ICONS = {
    email: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>`,
    phone: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-2.2 2.2a15.045 15.045 0 01-6.59-6.59l2.2-2.2a.96.96 0 00.25-1.02c-.36-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.65.99-1.19v-3.44c0-.54-.45-.99-.99-.99z"/></svg>`,
    location: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-12-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>`,
    linkedin: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>`,
    github: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/></svg>`,
    website: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.53c-.26-.81-1-1.4-1.9-1.4h-1v-3c0-.55-.45-1-1-1h-6v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.4z"/></svg>`,
    driver: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.27-3.82c.14-.4.52-.68.96-.68h9.54c.44 0 .82.28.96.68L19 11H5z"/></svg>`
};

window.ICONS = ICONS;
window.formatHref = formatHref;
window.formatGithubHref = formatGithubHref;
window.formatLinkedinHref = formatLinkedinHref;
window.formatEmailHref = formatEmailHref;

function renderDesignedLayout() {
    if (!window.App.cvData.themes) window.App.cvData.themes = JSON.parse(JSON.stringify(emptyCVData.themes));
    if (!window.App.cvData.themes.designed) window.App.cvData.themes.designed = { "bg_color": "#0b0f19", "gold_primary": "#f59e0b", "gold_dark": "#d97706" };
    const themes = window.App.cvData.themes.designed;
    document.documentElement.style.setProperty('--design-bg', themes.bg_color);
    document.documentElement.style.setProperty('--design-gold', themes.gold_primary);
    document.documentElement.style.setProperty('--design-gold-dark', themes.gold_dark);

    let pfpHTML = "";
    if (window.App.cvData.contact.image && (!window.App.cvData.design || window.App.cvData.design.show_pfp)) {
        const sz = window.App.cvData.contact.image_size || 80;
        pfpHTML = `<img src="${window.App.cvData.contact.image}" class="cv-designed-pfp" style="width:${sz}px; height:${sz}px;" alt="PFP" data-editor-tab="tab-profile">`;
    }

    // Experiences HTML
    let expHTML = "";
    window.App.cvData.experiences.forEach((exp, index) => {
        let bulletsHTML = exp.bullets.map(b => `<li data-editor-field="bullets">${b}</li>`).join('');
        expHTML += `
        <div class="cv-designed-card" data-editor-tab="tab-experiences" data-editor-target="experiences" data-editor-index="${index}">
        <div class="cv-designed-cardtitle">
            <span style="font-weight:700; color:#fff;" data-editor-field="title">${exp.title}</span>
            <span class="cv-designed-carddate" data-editor-field="period">${exp.period}</span>
        </div>
        <div class="cv-designed-cardorg"><span data-editor-field="company">${exp.company}</span> | <span data-editor-field="location">${exp.location}</span></div>
        <ul class="cv-designed-bullets" data-editor-field="bullets">${bulletsHTML}</ul>
        </div>`;
    });

    // Formations HTML
    let formHTML = "";
    if (window.App.cvData.formations && window.App.cvData.formations.length > 0) {
        let formItemsHTML = "";
        window.App.cvData.formations.forEach((f, index) => {
            let bulletsHTML = f.bullets ? f.bullets.map(b => `<li data-editor-field="bullets">${b}</li>`).join('') : "";
            formItemsHTML += `
        <div class="cv-designed-card" data-editor-tab="tab-experiences" data-editor-target="formations" data-editor-index="${index}">
            <div class="cv-designed-cardtitle">
            <span style="font-weight:700; color:#fff;" data-editor-field="title">${f.title}</span>
            <span class="cv-designed-carddate" data-editor-field="period">${f.period}</span>
            </div>
            <div class="cv-designed-cardorg"><span data-editor-field="company">${f.company}</span> | <span data-editor-field="location">${f.location}</span></div>
            <ul class="cv-designed-bullets" data-editor-field="bullets">${bulletsHTML}</ul>
        </div>`;
        });
        formHTML = `
        <section>
        <div class="cv-designed-sectitle" data-editor-tab="tab-experiences">Stages & Formations</div>
        ${formItemsHTML}
        </section>`;
    }

    // Projects HTML
    let projHTML = "";
    window.App.cvData.projects.forEach((proj, index) => {
        projHTML += `
        <div class="cv-designed-card" data-editor-tab="tab-projects" data-editor-target="projects" data-editor-index="${index}">
        <div class="cv-designed-cardtitle">
            <span style="font-weight:700; color:#fff;" data-editor-field="title">${proj.title}</span>
            <span class="cv-designed-carddate" style="background:rgba(255,255,255,0.05); color:#fff; border:1px solid rgba(255,255,255,0.1);" data-editor-field="stack">${proj.stack}</span>
        </div>
        <p style="font-size:0.75rem; color:#9ca3af; margin-top:0.4rem; line-height:1.4;" data-editor-field="description">${proj.description}</p>
        </div>`;
    });

    // Education HTML
    let eduHTML = "";
    window.App.cvData.education.forEach((edu, index) => {
        eduHTML += `
        <div class="cv-designed-card" style="padding: 0.6rem 0.75rem;" data-editor-tab="tab-education" data-editor-target="education" data-editor-index="${index}">
        <div style="font-size:0.78rem; font-weight:700; color:#fff;" data-editor-field="degree">${edu.degree}</div>
        <div style="font-size:0.72rem; color:#9ca3af; margin-top:0.1rem;" data-editor-field="school">${edu.school}</div>
        <div style="font-size:0.7rem; color:var(--design-gold); font-weight:600; margin-top:0.2rem;" data-editor-field="period">${edu.period}</div>
        </div>`;
    });

    // Certifications HTML
    let certsHTML = "";
    window.App.cvData.certifications.forEach((c, index) => {
        const parts = c.includes(" â€“ ") ? c.split(" â€“ ") : c.split(" - ");
        certsHTML += `
        <div class="cv-designed-simpleitem" data-editor-tab="tab-education" data-editor-target="certifications" data-editor-index="${index}" data-editor-field="value">
        <span class="list-label" data-editor-field="value">${parts[0]}</span>
        <span class="list-val" style="color:var(--design-gold);" data-editor-field="value">${parts[1] || 'CertifiÃ©'}</span>
        </div>`;
    });

    // Languages HTML
    let langHTML = "";
    window.App.cvData.languages.forEach((l, index) => {
        langHTML += `
        <div class="cv-designed-simpleitem" data-editor-tab="tab-education" data-editor-target="languages" data-editor-index="${index}">
        <span class="list-label" data-editor-field="name">${l.name}</span>
        <span class="list-val" data-editor-field="level">${l.level}</span>
        </div>`;
    });

    // Activities HTML
    let actHTML = window.App.cvData.activities.map((a, index) => `<div style="margin-bottom:0.3rem;" data-editor-tab="tab-education" data-editor-target="activities" data-editor-index="${index}" data-editor-field="value">â–ª ${a}</div>`).join('');

    // Skill categories rendering loop
    const getTags = (str) => {
        return str.split(',').map(s => s.trim()).filter(s => s).map(s => `<span class="cv-designed-tag" data-editor-field="value">${s}</span>`).join('');
    };

    let skillsHTML = "";
    window.App.cvData.skills.forEach((s, index) => {
        skillsHTML += `
        <div class="skill-cat" style="margin-bottom:0.85rem;" data-editor-tab="tab-skills" data-editor-target="skills" data-editor-index="${index}">
        <div style="font-weight:700; color:#fff; margin-bottom:0.25rem; font-size:0.78rem;" data-editor-field="category">${s.category}</div>
        <div class="cv-designed-tags" data-editor-field="value">${getTags(s.value)}</div>
        </div>`;
    });

    return `
    <div class="cv-designed-body">
        <header class="cv-designed-header" data-editor-tab="tab-profile">
        <div class="cv-designed-header-text">
            <h1 class="cv-designed-name" data-editor-tab="tab-profile" data-editor-focus="input-name">${window.App.cvData.contact.name}</h1>
            <p class="cv-designed-title" data-editor-tab="tab-profile" data-editor-focus="input-title-sub">${window.App.cvData.contact.title_sub}</p>
            <div class="cv-designed-contacts" data-editor-tab="tab-profile">
            ${window.App.cvData.contact.email ? `<span data-editor-tab="tab-profile" data-editor-focus="input-email">${ICONS.email}<a href="${formatEmailHref(window.App.cvData.contact.email)}" target="_blank" style="color:inherit; text-decoration:none;">${window.App.cvData.contact.email}</a></span>` : ''}
            ${window.App.cvData.contact.phone ? `<span data-editor-tab="tab-profile" data-editor-focus="input-phone">${ICONS.phone}<a href="tel:${window.App.cvData.contact.phone}" style="color:inherit; text-decoration:none;">${window.App.cvData.contact.phone}</a></span>` : ''}
            ${window.App.cvData.contact.location ? `<span data-editor-tab="tab-profile" data-editor-focus="input-location">${ICONS.location}${window.App.cvData.contact.location}</span>` : ''}
            ${window.App.cvData.contact.linkedin ? `<span data-editor-tab="tab-profile" data-editor-focus="input-linkedin">${ICONS.linkedin}<a href="${formatLinkedinHref(window.App.cvData.contact.linkedin)}" target="_blank" style="color:inherit; text-decoration:none;">${window.App.cvData.contact.linkedin}</a></span>` : ''}
            ${window.App.cvData.contact.github ? `<span data-editor-tab="tab-profile" data-editor-focus="input-github">${ICONS.github}<a href="${formatGithubHref(window.App.cvData.contact.github)}" target="_blank" style="color:inherit; text-decoration:none;">${window.App.cvData.contact.github}</a></span>` : ''}
            ${window.App.cvData.contact.website ? `<span data-editor-tab="tab-profile" data-editor-focus="input-website">${ICONS.website}<a href="${formatHref(window.App.cvData.contact.website)}" target="_blank" style="color:inherit; text-decoration:none;">${window.App.cvData.contact.website}</a></span>` : ''}
            ${window.App.cvData.contact.driver ? `<span data-editor-tab="tab-profile" data-editor-focus="input-driver">${ICONS.driver}${window.App.cvData.contact.driver}</span>` : ''}
            </div>
        </div>
        ${pfpHTML}
        </header>
        
        <div class="cv-designed-grid">
        <div class="cv-designed-sidebar">
            ${window.App.cvData.profile && window.App.cvData.profile.trim() && !window.App.cvData.hidden_sections?.profile ? `
            <section>
                <div class="cv-designed-sectitle" data-editor-tab="tab-profile">Profil</div>
                <p style="font-size:0.73rem; color:#9ca3af; line-height:1.45; text-align:justify;" data-editor-tab="tab-profile" data-editor-focus="input-profile">${window.App.cvData.profile}</p>
            </section>
            ` : ''}
            ${window.App.cvData.skills && window.App.cvData.skills.length > 0 && !window.App.cvData.hidden_sections?.skills ? `
            <section>
                <div class="cv-designed-sectitle" data-editor-tab="tab-skills">CompÃ©tences</div>
                <div class="skills-group">
                ${skillsHTML}
                </div>
            </section>
            ` : ''}
            ${window.App.cvData.education && window.App.cvData.education.length > 0 && !window.App.cvData.hidden_sections?.education ? `
            <section>
                <div class="cv-designed-sectitle" data-editor-tab="tab-education">Ã‰ducation</div>
                ${eduHTML}
            </section>
            ` : ''}
            ${window.App.cvData.certifications && window.App.cvData.certifications.length > 0 && !window.App.cvData.hidden_sections?.certifications ? `
            <section>
                <div class="cv-designed-sectitle" data-editor-tab="tab-education">Certifications</div>
                <div class="cv-designed-simplelist">${certsHTML}</div>
            </section>
            ` : ''}
            ${window.App.cvData.languages && window.App.cvData.languages.length > 0 && !window.App.cvData.hidden_sections?.languages ? `
            <section>
                <div class="cv-designed-sectitle" data-editor-tab="tab-education">Langues</div>
                <div class="cv-designed-simplelist">${langHTML}</div>
            </section>
            ` : ''}
            ${window.App.cvData.interests && window.App.cvData.interests.length > 0 && !window.App.cvData.hidden_sections?.interests ? `
            <section>
                <div class="cv-designed-sectitle" data-editor-tab="tab-education">Centres d'intÃ©rÃªt</div>
                <div style="font-size:0.72rem; color:#9ca3af; line-height:1.4;">${window.App.cvData.interests.map((item, idx) => `<span data-editor-tab="tab-education" data-editor-target="interests" data-editor-index="${idx}" data-editor-field="value">${item}</span>`).join(', ')}</div>
            </section>
            ` : ''}
        </div>
        <div class="cv-designed-main">
            ${window.App.cvData.experiences && window.App.cvData.experiences.length > 0 && !window.App.cvData.hidden_sections?.experiences ? `
            <section>
                <div class="cv-designed-sectitle" data-editor-tab="tab-experiences">ExpÃ©riences Professionnelles</div>
                ${expHTML}
            </section>
            ` : ''}
            ${window.App.cvData.hidden_sections?.formations ? '' : formHTML}
            ${window.App.cvData.projects && window.App.cvData.projects.length > 0 && !window.App.cvData.hidden_sections?.projects ? `
            <section>
                <div class="cv-designed-sectitle" data-editor-tab="tab-projects">Projets ClÃ©s</div>
                ${projHTML}
            </section>
            ` : ''}
            ${window.App.cvData.activities && window.App.cvData.activities.length > 0 && !window.App.cvData.hidden_sections?.activities ? `
            <section>
                <div class="cv-designed-sectitle" data-editor-tab="tab-education">Engagements</div>
                <div class="cv-designed-card" style="font-size:0.72rem; color:#9ca3af; line-height:1.4;">
                ${actHTML}
                </div>
            </section>
            ` : ''}
        </div>
        </div>
    </div>`;
}
function renderProfessionalLayout() {
    if (!window.App.cvData.themes) window.App.cvData.themes = JSON.parse(JSON.stringify(emptyCVData.themes));
    if (!window.App.cvData.themes.professional) window.App.cvData.themes.professional = { "navy_primary": "#1e3a8a", "navy_light": "#eff6ff" };
    const themes = window.App.cvData.themes.professional;
    document.documentElement.style.setProperty('--prof-navy', themes.navy_primary);

    // PFP rendering
    let pfpHTML = "";
    if (window.App.cvData.contact.image && (!window.App.cvData.design || window.App.cvData.design.show_pfp)) {
        const sz = window.App.cvData.contact.image_size || 80;
        pfpHTML = `<img src="${window.App.cvData.contact.image}" class="cv-prof-pfp" style="width:${sz}px; height:${sz}px;" alt="PFP" data-editor-tab="tab-profile">`;
    }

    // Experiences HTML
    let expHTML = "";
    window.App.cvData.experiences.forEach((exp, index) => {
        let bulletsHTML = exp.bullets.map(b => `<li data-editor-field="bullets">${b}</li>`).join('');
        expHTML += `
        <div class="cv-prof-item" data-editor-tab="tab-experiences" data-editor-target="experiences" data-editor-index="${index}">
        <div class="cv-prof-itemhead">
            <span><span data-editor-field="title">${exp.title}</span> â€” <span class="cv-prof-itemorg" data-editor-field="company">${exp.company}</span></span>
            <span class="cv-prof-itemdate" data-editor-field="period">${exp.period}</span>
        </div>
        <div style="font-size: 0.78rem; color:#6b7280; margin-bottom:0.2rem;" data-editor-field="location">${exp.location}</div>
        <ul class="cv-prof-bullets" data-editor-field="bullets">${bulletsHTML}</ul>
        </div>`;
    });

    // Formations HTML
    let formHTML = "";
    if (window.App.cvData.formations && window.App.cvData.formations.length > 0) {
        let formItemsHTML = "";
        window.App.cvData.formations.forEach((f, index) => {
            let bulletsHTML = f.bullets ? f.bullets.map(b => `<li data-editor-field="bullets">${b}</li>`).join('') : "";
            formItemsHTML += `
        <div class="cv-prof-item" data-editor-tab="tab-experiences" data-editor-target="formations" data-editor-index="${index}">
            <div class="cv-prof-itemhead">
            <span><span data-editor-field="title">${f.title}</span> â€” <span class="cv-prof-itemorg" data-editor-field="company">${f.company}</span></span>
            <span class="cv-prof-itemdate" data-editor-field="period">${f.period}</span>
            </div>
            <div style="font-size: 0.78rem; color:#6b7280; margin-bottom:0.2rem;" data-editor-field="location">${f.location}</div>
            <ul class="cv-prof-bullets" data-editor-field="bullets">${bulletsHTML}</ul>
        </div>`;
        });
        formHTML = `
        <section class="section">
        <div class="cv-prof-sectitle" data-editor-tab="tab-experiences">Stages & Formations</div>
        ${formItemsHTML}
        </section>`;
    }

    // Projects HTML
    let projHTML = "";
    window.App.cvData.projects.forEach((proj, index) => {
        projHTML += `
        <div class="cv-prof-item" data-editor-tab="tab-projects" data-editor-target="projects" data-editor-index="${index}">
        <div class="cv-prof-itemhead">
            <span data-editor-field="title">${proj.title}</span>
            <span class="cv-prof-itemdate" style="font-weight:600;" data-editor-field="stack">${proj.stack}</span>
        </div>
        <p style="font-size:0.78rem; color:#374151; margin-top:0.2rem; line-height:1.45;" data-editor-field="description">${proj.description}</p>
        </div>`;
    });

    // Education HTML
    let eduHTML = "";
    window.App.cvData.education.forEach((edu, index) => {
        eduHTML += `
        <div class="cv-prof-item" style="margin-bottom:0.4rem;" data-editor-tab="tab-education" data-editor-target="education" data-editor-index="${index}">
        <div style="font-size:0.8rem; font-weight:700;" data-editor-field="degree">${edu.degree}</div>
        <div style="font-size:0.75rem; color:#4b5563;"><span data-editor-field="school">${edu.school}</span> | <span data-editor-field="period">${edu.period}</span></div>
        </div>`;
    });

    // Skill categories list Professional
    let skillsHTML = "";
    window.App.cvData.skills.forEach((s, index) => {
        skillsHTML += `
        <div class="cv-prof-skillrow" data-editor-tab="tab-skills" data-editor-target="skills" data-editor-index="${index}">
        <strong data-editor-field="category">${s.category} :</strong> <span data-editor-field="value">${s.value}</span>
        </div>`;
    });

    let certsHTML = window.App.cvData.certifications.map((c, index) => `<li data-editor-tab="tab-education" data-editor-target="certifications" data-editor-index="${index}" data-editor-field="value">${c}</li>`).join('');
    let actHTML = window.App.cvData.activities.map((a, index) => `<li data-editor-tab="tab-education" data-editor-target="activities" data-editor-index="${index}" data-editor-field="value">${a}</li>`).join('');
    let langHTML = window.App.cvData.languages.map((l, index) => `<span data-editor-tab="tab-education" data-editor-target="languages" data-editor-index="${index}"><strong data-editor-field="name">${l.name}</strong> (<span data-editor-field="level">${l.level}</span>)</span>`).join(', ');

    return `
    <div class="cv-prof-body">
        <header class="cv-prof-header" data-editor-tab="tab-profile">
        <div class="cv-prof-header-text">
            <h1 class="cv-prof-name" data-editor-tab="tab-profile" data-editor-focus="input-name">${window.App.cvData.contact.name}</h1>
            <p class="cv-prof-title" data-editor-tab="tab-profile" data-editor-focus="input-title-sub">${window.App.cvData.contact.title_sub}</p>
            <div class="cv-prof-contacts" data-editor-tab="tab-profile">
            ${window.App.cvData.contact.email ? `<span data-editor-tab="tab-profile" data-editor-focus="input-email">${ICONS.email}<a href="${formatEmailHref(window.App.cvData.contact.email)}" target="_blank" style="color:inherit; text-decoration:none;">${window.App.cvData.contact.email}</a></span>` : ''}
            ${window.App.cvData.contact.phone ? `<span data-editor-tab="tab-profile" data-editor-focus="input-phone">${ICONS.phone}<a href="tel:${window.App.cvData.contact.phone}" style="color:inherit; text-decoration:none;">${window.App.cvData.contact.phone}</a></span>` : ''}
            ${window.App.cvData.contact.location ? `<span data-editor-tab="tab-profile" data-editor-focus="input-location">${ICONS.location}${window.App.cvData.contact.location}</span>` : ''}
            ${window.App.cvData.contact.driver ? `<span data-editor-tab="tab-profile" data-editor-focus="input-driver">${ICONS.driver}${window.App.cvData.contact.driver}</span>` : ''}
            ${(window.App.cvData.contact.email || window.App.cvData.contact.phone || window.App.cvData.contact.location || window.App.cvData.contact.driver) && (window.App.cvData.contact.linkedin || window.App.cvData.contact.github || window.App.cvData.contact.website) ? '<br>' : ''}
            ${window.App.cvData.contact.linkedin ? `<span data-editor-tab="tab-profile" data-editor-focus="input-linkedin">${ICONS.linkedin}<a href="${formatLinkedinHref(window.App.cvData.contact.linkedin)}" target="_blank" style="color:inherit; text-decoration:none;">${window.App.cvData.contact.linkedin}</a></span>` : ''}
            ${window.App.cvData.contact.github ? `<span data-editor-tab="tab-profile" data-editor-focus="input-github">${ICONS.github}<a href="${formatGithubHref(window.App.cvData.contact.github)}" target="_blank" style="color:inherit; text-decoration:none;">${window.App.cvData.contact.github}</a></span>` : ''}
            ${window.App.cvData.contact.website ? `<span data-editor-tab="tab-profile" data-editor-focus="input-website">${ICONS.website}<a href="${formatHref(window.App.cvData.contact.website)}" target="_blank" style="color:inherit; text-decoration:none;">${window.App.cvData.contact.website}</a></span>` : ''}
            </div>
        </div>
        ${pfpHTML}
        </header>
        
        ${window.App.cvData.profile && window.App.cvData.profile.trim() && !window.App.cvData.hidden_sections?.profile ? `
        <section class="section">
            <div class="cv-prof-sectitle" data-editor-tab="tab-profile">Profil Professionnel</div>
            <p style="font-size:0.8rem; color:#374151; text-align:justify; line-height:1.45;" data-editor-tab="tab-profile" data-editor-focus="input-profile">${window.App.cvData.profile}</p>
        </section>
        ` : ''}

        ${window.App.cvData.experiences && window.App.cvData.experiences.length > 0 && !window.App.cvData.hidden_sections?.experiences ? `
        <section class="section">
            <div class="cv-prof-sectitle" data-editor-tab="tab-experiences">ExpÃ©riences Professionnelles</div>
            ${expHTML}
        </section>
        ` : ''}

        ${window.App.cvData.hidden_sections?.formations ? '' : formHTML}

        ${window.App.cvData.projects && window.App.cvData.projects.length > 0 && !window.App.cvData.hidden_sections?.projects ? `
        <section class="section">
            <div class="cv-prof-sectitle" data-editor-tab="tab-projects">Projets ClÃ©s</div>
            ${projHTML}
        </section>
        ` : ''}

        <div class="cv-prof-grid">
        <div>
            ${window.App.cvData.skills && window.App.cvData.skills.length > 0 && !window.App.cvData.hidden_sections?.skills ? `
            <section class="section">
                <div class="cv-prof-sectitle" data-editor-tab="tab-skills">CompÃ©tences Techniques</div>
                ${skillsHTML}
            </section>
            ` : ''}
            ${window.App.cvData.education && window.App.cvData.education.length > 0 && !window.App.cvData.hidden_sections?.education ? `
            <section class="section">
                <div class="cv-prof-sectitle" data-editor-tab="tab-education">Ã‰ducation</div>
                ${eduHTML}
            </section>
            ` : ''}
        </div>
        <div>
            ${window.App.cvData.certifications && window.App.cvData.certifications.length > 0 && !window.App.cvData.hidden_sections?.certifications ? `
            <section class="section">
                <div class="cv-prof-sectitle" data-editor-tab="tab-education">Certifications</div>
                <ul class="cv-prof-bullets">${certsHTML}</ul>
            </section>
            ` : ''}
            ${(window.App.cvData.activities && window.App.cvData.activities.length > 0 && !window.App.cvData.hidden_sections?.activities) || (window.App.cvData.languages && window.App.cvData.languages.length > 0 && !window.App.cvData.hidden_sections?.languages) || (window.App.cvData.interests && window.App.cvData.interests.length > 0 && !window.App.cvData.hidden_sections?.interests) ? `
            <section class="section">
                <div class="cv-prof-sectitle" data-editor-tab="tab-education">Divers & Langues</div>
                ${window.App.cvData.activities && window.App.cvData.activities.length > 0 && !window.App.cvData.hidden_sections?.activities ? `<ul class="cv-prof-bullets" style="margin-bottom:0.5rem;">${actHTML}</ul>` : ''}
                ${window.App.cvData.languages && window.App.cvData.languages.length > 0 && !window.App.cvData.hidden_sections?.languages ? `
                <div style="font-size:0.78rem; border-top:1px solid #d1d5db; padding-top:0.4rem; color:#374151;" data-editor-tab="tab-education">
                     <strong>Langues :</strong> ${langHTML}
                </div>
                ` : ''}
                ${window.App.cvData.interests && window.App.cvData.interests.length > 0 && !window.App.cvData.hidden_sections?.interests ? `
                <div style="font-size:0.75rem; border-top:1px solid #d1d5db; margin-top:0.4rem; padding-top:0.4rem; color:#374151;" data-editor-tab="tab-education">
                     <strong>IntÃ©rÃªts :</strong> ${window.App.cvData.interests.map((item, idx) => `<span data-editor-tab="tab-education" data-editor-target="interests" data-editor-index="${idx}" data-editor-field="value">${item}</span>`).join(', ')}
                </div>
                ` : ''}
            </section>
            ` : ''}
        </div>
        </div>
    </div>`;
}
function renderATSLayout() {
    // PFP is automatically hidden for parser safety in ATS layout
    let expHTML = "";
    window.App.cvData.experiences.forEach((exp, index) => {
        let bulletsHTML = exp.bullets.map(b => `<li data-editor-field="bullets">${b}</li>`).join('');
        expHTML += `
        <div class="cv-ats-item" data-editor-tab="tab-experiences" data-editor-target="experiences" data-editor-index="${index}">
        <div class="cv-ats-itemhead">
            <span data-editor-field="title">${exp.title}</span>
            <span data-editor-field="period">${exp.period}</span>
        </div>
        <div class="cv-ats-itemsub"><span data-editor-field="company">${exp.company}</span> â€” <span data-editor-field="location">${exp.location}</span></div>
        <ul class="cv-ats-bullets" data-editor-field="bullets">${bulletsHTML}</ul>
        </div>`;
    });

    // Formations HTML
    let formHTML = "";
    if (window.App.cvData.formations && window.App.cvData.formations.length > 0) {
        let formItemsHTML = "";
        window.App.cvData.formations.forEach((f, index) => {
            let bulletsHTML = f.bullets ? f.bullets.map(b => `<li data-editor-field="bullets">${b}</li>`).join('') : "";
            formItemsHTML += `
        <div class="cv-ats-item" data-editor-tab="tab-experiences" data-editor-target="formations" data-editor-index="${index}">
            <div class="cv-ats-itemhead">
            <span data-editor-field="title">${f.title}</span>
            <span data-editor-field="period">${f.period}</span>
            </div>
            <div class="cv-ats-itemsub"><span data-editor-field="company">${f.company}</span> â€” <span data-editor-field="location">${f.location}</span></div>
            <ul class="cv-ats-bullets" data-editor-field="bullets">${bulletsHTML}</ul>
        </div>`;
        });
        formHTML = `
        <div class="cv-ats-sectitle" data-editor-tab="tab-experiences">Stages & Formations</div>
        ${formItemsHTML}`;
    }

    let projHTML = "";
    window.App.cvData.projects.forEach((proj, index) => {
        projHTML += `
        <div class="cv-ats-item" data-editor-tab="tab-projects" data-editor-target="projects" data-editor-index="${index}">
        <div class="cv-ats-itemhead">
            <span data-editor-field="title">${proj.title}</span>
            <span style="font-weight:normal; font-size:10pt;" data-editor-field="stack">${proj.stack}</span>
        </div>
        <ul class="cv-ats-bullets">
            <li data-editor-field="description">${proj.description}</li>
        </ul>
        </div>`;
    });

    let eduHTML = "";
    window.App.cvData.education.forEach((edu, index) => {
        eduHTML += `
        <div class="cv-ats-item" data-editor-tab="tab-education" data-editor-target="education" data-editor-index="${index}">
        <div class="cv-ats-itemhead">
            <span data-editor-field="degree">${edu.degree}</span>
            <span data-editor-field="period">${edu.period}</span>
        </div>
        <div class="cv-ats-itemsub" data-editor-field="school">${edu.school}</div>
        </div>`;
    });

    let skillsHTML = "";
    window.App.cvData.skills.forEach((s, index) => {
        skillsHTML += `<p data-editor-tab="tab-skills" data-editor-target="skills" data-editor-index="${index}"><strong data-editor-field="category">${s.category} :</strong> <span data-editor-field="value">${s.value}</span></p>`;
    });

    let certsHTML = window.App.cvData.certifications.map((c, index) => `<li data-editor-tab="tab-education" data-editor-target="certifications" data-editor-index="${index}" data-editor-field="value">${c}</li>`).join('');
    let actHTML = window.App.cvData.activities.map((a, index) => `<li data-editor-tab="tab-education" data-editor-target="activities" data-editor-index="${index}" data-editor-field="value">${a}</li>`).join('');
    let langHTML = window.App.cvData.languages.map((l, index) => `<li data-editor-tab="tab-education" data-editor-target="languages" data-editor-index="${index}"><strong data-editor-field="name">${l.name} :</strong> <span data-editor-field="level">${l.level}</span></li>`).join('');

    let pfpHTML = "";
    if (window.App.cvData.contact.image && (!window.App.cvData.design || window.App.cvData.design.show_pfp)) {
        const sz = window.App.cvData.contact.image_size || 80;
        pfpHTML = `<img src="${window.App.cvData.contact.image}" style="width:${sz}px; height:${sz}px; border-radius:50%; object-fit:cover; border:1px solid #cccccc; display:block; margin:0 auto 0.5rem auto;" alt="Photo" data-editor-tab="tab-profile">`;
    }

    const atsContacts1 = [];
    if (window.App.cvData.contact.location) atsContacts1.push(`<span data-editor-tab="tab-profile" data-editor-focus="input-location">${window.App.cvData.contact.location}</span>`);
    if (window.App.cvData.contact.phone) atsContacts1.push(`<span data-editor-tab="tab-profile" data-editor-focus="input-phone">TÃ©l : <a href="tel:${window.App.cvData.contact.phone}" style="color:inherit; text-decoration:none;">${window.App.cvData.contact.phone}</a></span>`);
    if (window.App.cvData.contact.email) atsContacts1.push(`<span data-editor-tab="tab-profile" data-editor-focus="input-email">Email : <a href="${formatEmailHref(window.App.cvData.contact.email)}" target="_blank" style="color:inherit; text-decoration:none;">${window.App.cvData.contact.email}</a></span>`);
    if (window.App.cvData.contact.driver) atsContacts1.push(`<span data-editor-tab="tab-profile" data-editor-focus="input-driver">${window.App.cvData.contact.driver}</span>`);

    const atsContacts2 = [];
    if (window.App.cvData.contact.linkedin) atsContacts2.push(`<span data-editor-tab="tab-profile" data-editor-focus="input-linkedin">LinkedIn : <a href="${formatLinkedinHref(window.App.cvData.contact.linkedin)}" target="_blank" style="color:inherit; text-decoration:none;">${window.App.cvData.contact.linkedin}</a></span>`);
    if (window.App.cvData.contact.github) atsContacts2.push(`<span data-editor-tab="tab-profile" data-editor-focus="input-github">GitHub : <a href="${formatGithubHref(window.App.cvData.contact.github)}" target="_blank" style="color:inherit; text-decoration:none;">${window.App.cvData.contact.github}</a></span>`);
    if (window.App.cvData.contact.website) atsContacts2.push(`<span data-editor-tab="tab-profile" data-editor-focus="input-website">Portfolio : <a href="${formatHref(window.App.cvData.contact.website)}" target="_blank" style="color:inherit; text-decoration:none;">${window.App.cvData.contact.website}</a></span>`);

    let atsContactsHTML = "";
    if (atsContacts1.length > 0) atsContactsHTML += atsContacts1.join(' | ');
    if (atsContacts1.length > 0 && atsContacts2.length > 0) atsContactsHTML += ' <br> ';
    if (atsContacts2.length > 0) atsContactsHTML += atsContacts2.join(' | ');

    return `
    <div class="cv-ats-body">
        <header class="cv-ats-header" data-editor-tab="tab-profile">
        ${pfpHTML}
        <div class="cv-ats-name" data-editor-tab="tab-profile" data-editor-focus="input-name">${window.App.cvData.contact.name}</div>
        <div class="cv-ats-contacts" data-editor-tab="tab-profile">
            ${atsContactsHTML}
        </div>
        </header>
        
        ${window.App.cvData.profile && window.App.cvData.profile.trim() && !window.App.cvData.hidden_sections?.profile ? `
        <div class="cv-ats-section">
            <div class="cv-ats-sectitle" data-editor-tab="tab-profile">Profil Professionnel</div>
            <p style="font-size:10pt; margin-bottom:0.75rem; text-align:justify;" data-editor-tab="tab-profile" data-editor-focus="input-profile">${window.App.cvData.profile}</p>
        </div>
        ` : ''}

        ${window.App.cvData.experiences && window.App.cvData.experiences.length > 0 && !window.App.cvData.hidden_sections?.experiences ? `
        <div class="cv-ats-section">
            <div class="cv-ats-sectitle" data-editor-tab="tab-experiences">ExpÃ©rience Professionnelle</div>
            ${expHTML}
        </div>
        ` : ''}

        ${window.App.cvData.hidden_sections?.formations ? '' : (window.App.cvData.formations && window.App.cvData.formations.length > 0 ? `
        <div class="cv-ats-section">
            ${formHTML}
        </div>
        ` : '')}

        ${window.App.cvData.projects && window.App.cvData.projects.length > 0 && !window.App.cvData.hidden_sections?.projects ? `
        <div class="cv-ats-section">
            <div class="cv-ats-sectitle" data-editor-tab="tab-projects">Projets RÃ©alisÃ©s</div>
            ${projHTML}
        </div>
        ` : ''}

        ${window.App.cvData.skills && window.App.cvData.skills.length > 0 && !window.App.cvData.hidden_sections?.skills ? `
        <div class="cv-ats-section">
            <div class="cv-ats-sectitle" data-editor-tab="tab-skills">CompÃ©tences Techniques</div>
            <div style="font-size:10pt; margin-bottom:0.5rem;">
                ${skillsHTML}
            </div>
        </div>
        ` : ''}

        ${window.App.cvData.education && window.App.cvData.education.length > 0 && !window.App.cvData.hidden_sections?.education ? `
        <div class="cv-ats-section">
            <div class="cv-ats-sectitle" data-editor-tab="tab-education">Ã‰ducation</div>
            ${eduHTML}
        </div>
        ` : ''}

        ${window.App.cvData.certifications && window.App.cvData.certifications.length > 0 && !window.App.cvData.hidden_sections?.certifications ? `
        <div class="cv-ats-section">
            <div class="cv-ats-sectitle" data-editor-tab="tab-education">Certifications</div>
            <ul class="cv-ats-bullets">${certsHTML}</ul>
        </div>
        ` : ''}

        ${window.App.cvData.activities && window.App.cvData.activities.length > 0 && !window.App.cvData.hidden_sections?.activities ? `
        <div class="cv-ats-section">
            <div class="cv-ats-sectitle" data-editor-tab="tab-education">Engagements & ActivitÃ©s</div>
            <ul class="cv-ats-bullets">${actHTML}</ul>
        </div>
        ` : ''}

        ${window.App.cvData.languages && window.App.cvData.languages.length > 0 && !window.App.cvData.hidden_sections?.languages ? `
        <div class="cv-ats-section">
            <div class="cv-ats-sectitle" data-editor-tab="tab-education">Langues</div>
            <ul class="cv-ats-bullets">${langHTML}</ul>
        </div>
        ` : ''}

        ${window.App.cvData.interests && window.App.cvData.interests.length > 0 && !window.App.cvData.hidden_sections?.interests ? `
        <div class="cv-ats-section">
            <div class="cv-ats-sectitle" data-editor-tab="tab-education">Centres d'IntÃ©rÃªt</div>
            <p style="font-size:10pt;">${window.App.cvData.interests.map((item, idx) => `<span data-editor-tab="tab-education" data-editor-target="interests" data-editor-index="${idx}" data-editor-field="value">${item}</span>`).join(', ')}</p>
        </div>
        ` : ''}
    </div>`;
}
function renderSidebarLayout() {
    if (!window.App.cvData.themes) window.App.cvData.themes = JSON.parse(JSON.stringify(emptyCVData.themes));
    if (!window.App.cvData.themes.sidebar) window.App.cvData.themes.sidebar = { "sidebar_bg": "#1e293b", "sidebar_accent": "#3b82f6" };
    const themes = window.App.cvData.themes.sidebar;
    document.documentElement.style.setProperty('--sidebar-bg', themes.sidebar_bg);
    document.documentElement.style.setProperty('--sidebar-accent', themes.sidebar_accent);

    const hex = themes.sidebar_bg.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luma = [0.299 * r, 0.587 * g, 0.114 * b].reduce((x, y) => x + y);
    const textColor = luma > 160 ? '#0f172a' : '#ffffff';
    document.documentElement.style.setProperty('--sidebar-text', textColor);

    let pfpHTML = "";
    if (window.App.cvData.contact.image && (!window.App.cvData.design || window.App.cvData.design.show_pfp)) {
        const sz = window.App.cvData.contact.image_size || 80;
        pfpHTML = `<img src="${window.App.cvData.contact.image}" class="cv-sidebar-pfp" style="width:${sz}px; height:${sz}px;" alt="PFP" data-editor-tab="tab-profile">`;
    }

    let contactItems = [];
    if (window.App.cvData.contact.email) contactItems.push(`<div style="margin-bottom: 0.35rem;" data-editor-tab="tab-profile" data-editor-focus="input-email">${ICONS.email}<a href="${formatEmailHref(window.App.cvData.contact.email)}" target="_blank" style="color:inherit; text-decoration:none;">${window.App.cvData.contact.email}</a></div>`);
    if (window.App.cvData.contact.phone) contactItems.push(`<div style="margin-bottom: 0.35rem;" data-editor-tab="tab-profile" data-editor-focus="input-phone">${ICONS.phone}<a href="tel:${window.App.cvData.contact.phone}" style="color:inherit; text-decoration:none;">${window.App.cvData.contact.phone}</a></div>`);
    if (window.App.cvData.contact.location) contactItems.push(`<div style="margin-bottom: 0.35rem;" data-editor-tab="tab-profile" data-editor-focus="input-location">${ICONS.location}${window.App.cvData.contact.location}</div>`);
    if (window.App.cvData.contact.linkedin) contactItems.push(`<div style="margin-bottom: 0.35rem;" data-editor-tab="tab-profile" data-editor-focus="input-linkedin">${ICONS.linkedin}<a href="${formatLinkedinHref(window.App.cvData.contact.linkedin)}" target="_blank" style="color:inherit; text-decoration:none;">${window.App.cvData.contact.linkedin}</a></div>`);
    if (window.App.cvData.contact.github) contactItems.push(`<div style="margin-bottom: 0.35rem;" data-editor-tab="tab-profile" data-editor-focus="input-github">${ICONS.github}<a href="${formatGithubHref(window.App.cvData.contact.github)}" target="_blank" style="color:inherit; text-decoration:none;">${window.App.cvData.contact.github}</a></div>`);
    if (window.App.cvData.contact.website) contactItems.push(`<div style="margin-bottom: 0.35rem;" data-editor-tab="tab-profile" data-editor-focus="input-website">${ICONS.website}<a href="${formatHref(window.App.cvData.contact.website)}" target="_blank" style="color:inherit; text-decoration:none;">${window.App.cvData.contact.website}</a></div>`);
    if (window.App.cvData.contact.driver) contactItems.push(`<div style="margin-bottom: 0.35rem;" data-editor-tab="tab-profile" data-editor-focus="input-driver">${ICONS.driver}${window.App.cvData.contact.driver}</div>`);

    let contactHTML = "";
    if (contactItems.length > 0) {
        contactHTML = `
        <div class="cv-sidebar-left-section" data-editor-tab="tab-profile">
        <div class="cv-sidebar-left-title" data-editor-tab="tab-profile">Contact</div>
        <div class="cv-sidebar-left-content">
            ${contactItems.join('')}
        </div>
        </div>
    `;
    }

    let skillsHTML = "";
    window.App.cvData.skills.forEach((s, index) => {
        skillsHTML += `
        <div style="margin-bottom:0.5rem;" data-editor-tab="tab-skills" data-editor-target="skills" data-editor-index="${index}">
        <div style="font-weight:700; font-size:0.74rem; color:var(--sidebar-accent); margin-bottom:0.2rem;" data-editor-field="category">${s.category}</div>
        <div style="font-size:0.68rem; opacity:0.9; line-height:1.35;" data-editor-field="value">${s.value}</div>
        </div>`;
    });

    let langHTML = window.App.cvData.languages.map((l, index) => `<li data-editor-tab="tab-education" data-editor-target="languages" data-editor-index="${index}"><strong data-editor-field="name">${l.name}</strong>: <span data-editor-field="level">${l.level}</span></li>`).join('');
    let certsHTML = window.App.cvData.certifications.map((c, index) => `<li data-editor-tab="tab-education" data-editor-target="certifications" data-editor-index="${index}" data-editor-field="value">${c}</li>`).join('');

    // Experiences HTML
    let expHTML = "";
    window.App.cvData.experiences.forEach((exp, index) => {
        let bulletsHTML = exp.bullets.map(b => `<li data-editor-field="bullets">${b}</li>`).join('');
        expHTML += `
        <div class="cv-sidebar-item" data-editor-tab="tab-experiences" data-editor-target="experiences" data-editor-index="${index}">
        <div class="cv-sidebar-itemhead">
            <span><span data-editor-field="title">${exp.title}</span> â€” <span class="cv-sidebar-itemorg" data-editor-field="company">${exp.company}</span></span>
            <span class="cv-sidebar-itemdate" data-editor-field="period">${exp.period}</span>
        </div>
        <div style="font-size: 0.72rem; color:#64748b; margin-bottom:0.15rem;" data-editor-field="location">${exp.location}</div>
        <ul class="cv-sidebar-bullets" data-editor-field="bullets">${bulletsHTML}</ul>
        </div>`;
    });

    // Formations HTML
    let formHTML = "";
    if (window.App.cvData.formations && window.App.cvData.formations.length > 0) {
        let formItemsHTML = "";
        window.App.cvData.formations.forEach((f, index) => {
            let bulletsHTML = f.bullets ? f.bullets.map(b => `<li data-editor-field="bullets">${b}</li>`).join('') : "";
            formItemsHTML += `
        <div class="cv-sidebar-item" data-editor-tab="tab-experiences" data-editor-target="formations" data-editor-index="${index}">
            <div class="cv-sidebar-itemhead">
            <span><span data-editor-field="title">${f.title}</span> â€” <span class="cv-sidebar-itemorg" data-editor-field="company">${f.company}</span></span>
            <span class="cv-sidebar-itemdate" data-editor-field="period">${f.period}</span>
            </div>
            <div style="font-size: 0.72rem; color:#64748b; margin-bottom:0.15rem;" data-editor-field="location">${f.location}</div>
            <ul class="cv-sidebar-bullets" data-editor-field="bullets">${bulletsHTML}</ul>
        </div>`;
        });
        formHTML = `
        <div class="cv-sidebar-right-section">
        <div class="cv-sidebar-right-title" data-editor-tab="tab-experiences">Stages & Formations</div>
        ${formItemsHTML}
        </div>`;
    }

    let projHTML = "";
    window.App.cvData.projects.forEach((proj, index) => {
        projHTML += `
        <div class="cv-sidebar-item" data-editor-tab="tab-projects" data-editor-target="projects" data-editor-index="${index}">
        <div class="cv-sidebar-itemhead">
            <span data-editor-field="title">${proj.title}</span>
            <span class="cv-sidebar-itemdate" style="font-weight:600; color:var(--sidebar-accent);" data-editor-field="stack">${proj.stack}</span>
        </div>
        <p style="font-size:0.72rem; color:#475569; margin-top:0.25rem; line-height:1.4;" data-editor-field="description">${proj.description}</p>
        </div>`;
    });

    let eduHTML = "";
    window.App.cvData.education.forEach((edu, index) => {
        eduHTML += `
        <div style="margin-bottom:0.5rem; font-size:0.74rem;" data-editor-tab="tab-education" data-editor-target="education" data-editor-index="${index}">
        <div style="font-weight:700; color:#0f172a;" data-editor-field="degree">${edu.degree}</div>
        <div style="color:#475569;"><span data-editor-field="school">${edu.school}</span> | <span style="font-weight:600; color:var(--sidebar-accent);" data-editor-field="period">${edu.period}</span></div>
        </div>`;
    });

    let actHTML = window.App.cvData.activities.map((a, index) => `<div style="font-size:0.72rem; color:#334155; margin-bottom:0.25rem;" data-editor-tab="tab-education" data-editor-target="activities" data-editor-index="${index}" data-editor-field="value">â–ª ${a}</div>`).join('');

    return `
    <div class="cv-sidebar-body">
        <div class="cv-sidebar-container">
        <div class="cv-sidebar-left">
            ${pfpHTML}
            ${contactHTML}
            ${window.App.cvData.skills && window.App.cvData.skills.length > 0 && !window.App.cvData.hidden_sections?.skills ? `
            <div class="cv-sidebar-left-section">
                <div class="cv-sidebar-left-title" data-editor-tab="tab-skills">CompÃ©tences</div>
                <div class="cv-sidebar-left-content">${skillsHTML}</div>
            </div>
            ` : ''}
            ${window.App.cvData.languages && window.App.cvData.languages.length > 0 && !window.App.cvData.hidden_sections?.languages ? `
            <div class="cv-sidebar-left-section">
                <div class="cv-sidebar-left-title" data-editor-tab="tab-education">Langues</div>
                <ul class="cv-sidebar-left-bullets" style="color:var(--sidebar-text);">${langHTML}</ul>
            </div>
            ` : ''}
            ${window.App.cvData.interests && window.App.cvData.interests.length > 0 && !window.App.cvData.hidden_sections?.interests ? `
            <div class="cv-sidebar-left-section">
                <div class="cv-sidebar-left-title" data-editor-tab="tab-education">IntÃ©rÃªts</div>
                <div class="cv-sidebar-left-content" style="font-size:0.7rem; opacity:0.85;">${window.App.cvData.interests.map((item, idx) => `<span data-editor-tab="tab-education" data-editor-target="interests" data-editor-index="${idx}" data-editor-field="value">${item}</span>`).join(', ')}</div>
            </div>
            ` : ''}
        </div>
        <div class="cv-sidebar-right">
            <header style="margin-bottom:0.5rem;" data-editor-tab="tab-profile">
            <h1 style="font-family:'Plus Jakarta Sans', sans-serif; font-size:1.8rem; font-weight:800; color:#0f172a; line-height:1.15;" data-editor-tab="tab-profile" data-editor-focus="input-name">${window.App.cvData.contact.name}</h1>
            <p style="font-size:0.85rem; font-weight:700; color:var(--sidebar-accent); text-transform:uppercase; letter-spacing:0.04em; margin-top:0.25rem;" data-editor-tab="tab-profile" data-editor-focus="input-title-sub">${window.App.cvData.contact.title_sub}</p>
            </header>
            
            ${window.App.cvData.profile && window.App.cvData.profile.trim() && !window.App.cvData.hidden_sections?.profile ? `
            <div class="cv-sidebar-right-section">
                <div class="cv-sidebar-right-title" data-editor-tab="tab-profile">Profil</div>
                <p style="font-size:0.74rem; color:#334155; line-height:1.45; text-align:justify;" data-editor-tab="tab-profile" data-editor-focus="input-profile">${window.App.cvData.profile}</p>
            </div>
            ` : ''}

            ${window.App.cvData.experiences && window.App.cvData.experiences.length > 0 && !window.App.cvData.hidden_sections?.experiences ? `
            <div class="cv-sidebar-right-section">
                <div class="cv-sidebar-right-title" data-editor-tab="tab-experiences">ExpÃ©riences Professionnelles</div>
                ${expHTML}
            </div>
            ` : ''}

            ${window.App.cvData.hidden_sections?.formations ? '' : formHTML}

            ${window.App.cvData.projects && window.App.cvData.projects.length > 0 && !window.App.cvData.hidden_sections?.projects ? `
            <div class="cv-sidebar-right-section">
                <div class="cv-sidebar-right-title" data-editor-tab="tab-projects">Projets ClÃ©s</div>
                ${projHTML}
            </div>
            ` : ''}

            ${window.App.cvData.education && window.App.cvData.education.length > 0 && !window.App.cvData.hidden_sections?.education ? `
            <div class="cv-sidebar-right-section">
                <div class="cv-sidebar-right-title" data-editor-tab="tab-education">Ã‰ducation</div>
                ${eduHTML}
            </div>
            ` : ''}

            ${(window.App.cvData.certifications && window.App.cvData.certifications.length > 0 && !window.App.cvData.hidden_sections?.certifications) || (window.App.cvData.activities && window.App.cvData.activities.length > 0 && !window.App.cvData.hidden_sections?.activities) ? `
            <div class="cv-sidebar-right-section">
                <div class="cv-sidebar-right-title" data-editor-tab="tab-education">Certifications & ActivitÃ©s</div>
                ${window.App.cvData.certifications && window.App.cvData.certifications.length > 0 && !window.App.cvData.hidden_sections?.certifications ? `<ul class="cv-sidebar-bullets" style="margin-bottom:0.4rem;">${certsHTML}</ul>` : ''}
                ${window.App.cvData.activities && window.App.cvData.activities.length > 0 && !window.App.cvData.hidden_sections?.activities ? `
                <div style="border-top:1px solid #e2e8f0; padding-top:0.35rem; margin-top:0.4rem;">
                    ${actHTML}
                </div>
                ` : ''}
            </div>
            ` : ''}
        </div>
        </div>
    </div>
    `;
}
function renderMinimalistLayout() {
    let pfpHTML = "";
    if (window.App.cvData.contact.image && (!window.App.cvData.design || window.App.cvData.design.show_pfp)) {
        const sz = window.App.cvData.contact.image_size || 80;
        pfpHTML = `<img src="${window.App.cvData.contact.image}" class="cv-mini-pfp" style="width:${sz}px; height:${sz}px;" alt="PFP" data-editor-tab="tab-profile">`;
    }

    let contactItems = [];
    if (window.App.cvData.contact.email) contactItems.push(`<div data-editor-tab="tab-profile" data-editor-focus="input-email"><a href="${formatEmailHref(window.App.cvData.contact.email)}" target="_blank" style="color:inherit; text-decoration:none;">${window.App.cvData.contact.email}</a></div>`);
    if (window.App.cvData.contact.phone) contactItems.push(`<div data-editor-tab="tab-profile" data-editor-focus="input-phone"><a href="tel:${window.App.cvData.contact.phone}" style="color:inherit; text-decoration:none;">${window.App.cvData.contact.phone}</a></div>`);
    if (window.App.cvData.contact.location) contactItems.push(`<div data-editor-tab="tab-profile" data-editor-focus="input-location">${window.App.cvData.contact.location}</div>`);
    if (window.App.cvData.contact.linkedin) contactItems.push(`<div data-editor-tab="tab-profile" data-editor-focus="input-linkedin"><a href="${formatLinkedinHref(window.App.cvData.contact.linkedin)}" target="_blank" style="color:inherit; text-decoration:none;">LinkedIn</a></div>`);
    if (window.App.cvData.contact.github) contactItems.push(`<div data-editor-tab="tab-profile" data-editor-focus="input-github"><a href="${formatGithubHref(window.App.cvData.contact.github)}" target="_blank" style="color:inherit; text-decoration:none;">GitHub</a></div>`);
    if (window.App.cvData.contact.website) contactItems.push(`<div data-editor-tab="tab-profile" data-editor-focus="input-website"><a href="${formatHref(window.App.cvData.contact.website)}" target="_blank" style="color:inherit; text-decoration:none;">Site Web</a></div>`);
    if (window.App.cvData.contact.driver) contactItems.push(`<div data-editor-tab="tab-profile" data-editor-focus="input-driver">${window.App.cvData.contact.driver}</div>`);

    let contactHTML = "";
    if (contactItems.length > 0) {
        contactHTML = `
        <div class="cv-mini-contacts" data-editor-tab="tab-profile">
        ${contactItems.join('')}
        </div>
    `;
    }

    let skillsHTML = "";
    window.App.cvData.skills.forEach((s, index) => {
        skillsHTML += `
        <div class="cv-mini-skillcat" data-editor-tab="tab-skills" data-editor-target="skills" data-editor-index="${index}">
        <strong data-editor-field="category">${s.category}</strong>
        <span data-editor-field="value">${s.value}</span>
        </div>`;
    });

    let eduHTML = "";
    window.App.cvData.education.forEach((edu, index) => {
        eduHTML += `
        <div style="margin-bottom: 0.6rem; font-size: 0.72rem; color:#3f3f46;" data-editor-tab="tab-education" data-editor-target="education" data-editor-index="${index}">
        <div style="font-weight:700; color:#09090b;" data-editor-field="degree">${edu.degree}</div>
        <div data-editor-field="school">${edu.school}</div>
        <div style="font-style:italic; font-size:0.68rem; color:#71717a; margin-top:0.1rem;" data-editor-field="period">${edu.period}</div>
        </div>`;
    });

    let langHTML = window.App.cvData.languages.map((l, index) => `<div style="font-size:0.72rem; margin-bottom:0.25rem; color:#3f3f46;" data-editor-tab="tab-education" data-editor-target="languages" data-editor-index="${index}"><strong data-editor-field="name">${l.name}</strong>: <span data-editor-field="level">${l.level}</span></div>`).join('');
    let certsHTML = window.App.cvData.certifications.map((c, index) => `<li data-editor-tab="tab-education" data-editor-target="certifications" data-editor-index="${index}" data-editor-field="value">${c}</li>`).join('');

    // Experiences HTML
    let expHTML = "";
    window.App.cvData.experiences.forEach((exp, index) => {
        let bulletsHTML = exp.bullets.map(b => `<li data-editor-field="bullets">${b}</li>`).join('');
        expHTML += `
        <div class="cv-mini-item" data-editor-tab="tab-experiences" data-editor-target="experiences" data-editor-index="${index}">
        <div class="cv-mini-itemhead">
            <span data-editor-field="title">${exp.title}</span>
            <span class="cv-mini-itemdate" data-editor-field="period">${exp.period}</span>
        </div>
        <div class="cv-mini-itemorg"><span data-editor-field="company">${exp.company}</span> â€” <span style="font-size:0.7rem; font-style:normal;" data-editor-field="location">${exp.location}</span></div>
        <ul class="cv-mini-bullets" data-editor-field="bullets">${bulletsHTML}</ul>
        </div>`;
    });

    // Formations HTML
    let formHTML = "";
    if (window.App.cvData.formations && window.App.cvData.formations.length > 0) {
        let formItemsHTML = "";
        window.App.cvData.formations.forEach((f, index) => {
            let bulletsHTML = f.bullets ? f.bullets.map(b => `<li data-editor-field="bullets">${b}</li>`).join('') : "";
            formItemsHTML += `
        <div class="cv-mini-item" data-editor-tab="tab-experiences" data-editor-target="formations" data-editor-index="${index}">
            <div class="cv-mini-itemhead">
            <span data-editor-field="title">${f.title}</span>
            <span class="cv-mini-itemdate" data-editor-field="period">${f.period}</span>
            </div>
            <div class="cv-mini-itemorg"><span data-editor-field="company">${f.company}</span> â€” <span style="font-size:0.7rem; font-style:normal;" data-editor-field="location">${f.location}</span></div>
            <ul class="cv-mini-bullets" data-editor-field="bullets">${bulletsHTML}</ul>
        </div>`;
        });
        formHTML = `
        <div>
        <div class="cv-mini-sectitle" data-editor-tab="tab-experiences">Stages & Formations</div>
        ${formItemsHTML}
        </div>`;
    }

    let projHTML = "";
    window.App.cvData.projects.forEach((proj, index) => {
        projHTML += `
        <div class="cv-mini-item" data-editor-tab="tab-projects" data-editor-target="projects" data-editor-index="${index}">
        <div class="cv-mini-itemhead">
            <span data-editor-field="title">${proj.title}</span>
            <span class="cv-mini-itemdate" style="font-weight:500; font-family:'Inter', sans-serif;" data-editor-field="stack">${proj.stack}</span>
        </div>
        <p style="font-size:0.74rem; color:#52525b; margin-top:0.25rem; line-height:1.4;" data-editor-field="description">${proj.description}</p>
        </div>`;
    });

    let actHTML = window.App.cvData.activities.map((a, index) => `<div style="font-size:0.72rem; color:#52525b; margin-bottom:0.25rem;" data-editor-tab="tab-education" data-editor-target="activities" data-editor-index="${index}" data-editor-field="value">â€” ${a}</div>`).join('');

    return `
    <div class="cv-mini-body">
        <header class="cv-mini-header" data-editor-tab="tab-profile">
        <div style="flex:1;" data-editor-tab="tab-profile">
            <h1 class="cv-mini-name" data-editor-tab="tab-profile" data-editor-focus="input-name">${window.App.cvData.contact.name}</h1>
            <p class="cv-mini-title" data-editor-tab="tab-profile" data-editor-focus="input-title-sub">${window.App.cvData.contact.title_sub}</p>
        </div>
        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:0.5rem;" data-editor-tab="tab-profile">
            ${pfpHTML}
            ${contactHTML}
        </div>
        </header>
        
        <div class="cv-mini-grid">
        <div class="cv-mini-left-col">
            ${window.App.cvData.skills && window.App.cvData.skills.length > 0 && !window.App.cvData.hidden_sections?.skills ? `
            <div>
                <div class="cv-mini-sectitle" data-editor-tab="tab-skills">CompÃ©tences</div>
                ${skillsHTML}
            </div>
            ` : ''}
            ${window.App.cvData.education && window.App.cvData.education.length > 0 && !window.App.cvData.hidden_sections?.education ? `
            <div>
                <div class="cv-mini-sectitle" data-editor-tab="tab-education">Ã‰ducation</div>
                ${eduHTML}
            </div>
            ` : ''}
            ${window.App.cvData.languages && window.App.cvData.languages.length > 0 && !window.App.cvData.hidden_sections?.languages ? `
            <div>
                <div class="cv-mini-sectitle" data-editor-tab="tab-education">Langues</div>
                ${langHTML}
            </div>
            ` : ''}
            ${window.App.cvData.interests && window.App.cvData.interests.length > 0 && !window.App.cvData.hidden_sections?.interests ? `
            <div>
                <div class="cv-mini-sectitle" data-editor-tab="tab-education">IntÃ©rÃªts</div>
                <div style="font-size:0.7rem; color:#52525b; line-height:1.45;">${window.App.cvData.interests.map((item, idx) => `<span data-editor-tab="tab-education" data-editor-target="interests" data-editor-index="${idx}" data-editor-field="value">${item}</span>`).join(', ')}</div>
            </div>
            ` : ''}
        </div>
        <div class="cv-mini-right-col">
            ${window.App.cvData.profile && window.App.cvData.profile.trim() && !window.App.cvData.hidden_sections?.profile ? `
            <div>
                <div class="cv-mini-sectitle" data-editor-tab="tab-profile">Profil</div>
                <p style="font-size:0.74rem; color:#3f3f46; line-height:1.5; text-align:justify; margin-bottom:0.4rem;" data-editor-tab="tab-profile" data-editor-focus="input-profile">${window.App.cvData.profile}</p>
            </div>
            ` : ''}
            ${window.App.cvData.experiences && window.App.cvData.experiences.length > 0 && !window.App.cvData.hidden_sections?.experiences ? `
            <div>
                <div class="cv-mini-sectitle" data-editor-tab="tab-experiences">ExpÃ©riences Professionnelles</div>
                ${expHTML}
            </div>
            ` : ''}
            ${window.App.cvData.hidden_sections?.formations ? '' : formHTML}
            ${window.App.cvData.projects && window.App.cvData.projects.length > 0 && !window.App.cvData.hidden_sections?.projects ? `
            <div>
                <div class="cv-mini-sectitle" data-editor-tab="tab-projects">Projets ClÃ©s</div>
                ${projHTML}
            </div>
            ` : ''}
            ${(window.App.cvData.certifications && window.App.cvData.certifications.length > 0 && !window.App.cvData.hidden_sections?.certifications) || (window.App.cvData.activities && window.App.cvData.activities.length > 0 && !window.App.cvData.hidden_sections?.activities) ? `
            <div>
                <div class="cv-mini-sectitle" data-editor-tab="tab-education">Certifications & ActivitÃ©s</div>
                ${window.App.cvData.certifications && window.App.cvData.certifications.length > 0 && !window.App.cvData.hidden_sections?.certifications ? `<ul class="cv-mini-bullets" style="margin-bottom:0.5rem;">${certsHTML}</ul>` : ''}
                ${window.App.cvData.activities && window.App.cvData.activities.length > 0 && !window.App.cvData.hidden_sections?.activities ? `
                <div style="border-top:1px solid #f4f4f5; padding-top:0.4rem; margin-top:0.4rem;">
                    ${actHTML}
                </div>
                ` : ''}
            </div>
            ` : ''}
        </div>
        </div>
    </div>
    `;
}
function renderEuropassLayout() {
    let pfpHTML = "";
    if (window.App.cvData.contact.image && (!window.App.cvData.design || window.App.cvData.design.show_pfp)) {
        const sz = window.App.cvData.contact.image_size || 80;
        pfpHTML = `<img src="${window.App.cvData.contact.image}" class="cv-euro-pfp" style="width:${sz}px; height:${sz}px;" alt="PFP" data-editor-tab="tab-profile">`;
    }

    let expHTML = "";
    window.App.cvData.experiences.forEach((exp, index) => {
        let bulletsHTML = exp.bullets.map(b => `<li data-editor-field="bullets">${b}</li>`).join('');
        expHTML += `
        <div class="cv-euro-item" data-editor-tab="tab-experiences" data-editor-target="experiences" data-editor-index="${index}">
        <div class="cv-euro-itemhead">
            <span data-editor-field="title">${exp.title}</span>
            <span class="cv-euro-itemdate" data-editor-field="period">${exp.period}</span>
        </div>
        <div class="cv-euro-itemorg"><span data-editor-field="company">${exp.company}</span> | <span data-editor-field="location">${exp.location}</span></div>
        <ul class="cv-euro-bullets" data-editor-field="bullets">${bulletsHTML}</ul>
        </div>`;
    });

    // Formations HTML
    let formHTML = "";
    if (window.App.cvData.formations && window.App.cvData.formations.length > 0) {
        let formItemsHTML = "";
        window.App.cvData.formations.forEach((f, index) => {
            let bulletsHTML = f.bullets ? f.bullets.map(b => `<li data-editor-field="bullets">${b}</li>`).join('') : "";
            formItemsHTML += `
        <div class="cv-euro-item" data-editor-tab="tab-experiences" data-editor-target="formations" data-editor-index="${index}">
            <div class="cv-euro-itemhead">
            <span data-editor-field="title">${f.title}</span>
            <span class="cv-euro-itemdate" data-editor-field="period">${f.period}</span>
            </div>
            <div class="cv-euro-itemorg"><span data-editor-field="company">${f.company}</span> | <span data-editor-field="location">${f.location}</span></div>
            <ul class="cv-euro-bullets" data-editor-field="bullets">${bulletsHTML}</ul>
        </div>`;
        });
        formHTML = `
        <div class="cv-euro-row">
        <div class="cv-euro-left" data-editor-tab="tab-experiences">Stages & Formations</div>
        <div class="cv-euro-right">
            ${formItemsHTML}
        </div>
        </div>`;
    }

    let projHTML = "";
    window.App.cvData.projects.forEach((proj, index) => {
        projHTML += `
        <div class="cv-euro-item" data-editor-tab="tab-projects" data-editor-target="projects" data-editor-index="${index}">
        <div class="cv-euro-itemhead">
            <span data-editor-field="title">${proj.title}</span>
            <span class="cv-euro-itemdate" style="font-weight:600; color:#0055a5;" data-editor-field="stack">${proj.stack}</span>
        </div>
        <p style="font-size:0.74rem; color:#444444; margin-top:0.25rem; line-height:1.4;" data-editor-field="description">${proj.description}</p>
        </div>`;
    });

    let eduHTML = "";
    window.App.cvData.education.forEach((edu, index) => {
        eduHTML += `
        <div style="margin-bottom:0.5rem; font-size:0.74rem;" data-editor-tab="tab-education" data-editor-target="education" data-editor-index="${index}">
        <div style="font-weight:700; color:#333333;" data-editor-field="degree">${edu.degree}</div>
        <div style="color:#666666;"><span data-editor-field="school">${edu.school}</span> | <span style="font-weight:600; color:#0055a5;" data-editor-field="period">${edu.period}</span></div>
        </div>`;
    });

    let skillsHTML = "";
    window.App.cvData.skills.forEach((s, index) => {
        skillsHTML += `
        <div style="margin-bottom: 0.5rem;" data-editor-tab="tab-skills" data-editor-target="skills" data-editor-index="${index}">
        <div style="font-weight:700; font-size:0.74rem; color:#0055a5; margin-bottom:0.15rem;" data-editor-field="category">${s.category}</div>
        <div style="font-size:0.7rem; color:#444444; line-height:1.4;" data-editor-field="value">${s.value}</div>
        </div>`;
    });

    let certsHTML = window.App.cvData.certifications.map((c, index) => `<li data-editor-tab="tab-education" data-editor-target="certifications" data-editor-index="${index}" data-editor-field="value">${c}</li>`).join('');
    let actHTML = window.App.cvData.activities.map((a, index) => `<li data-editor-tab="tab-education" data-editor-target="activities" data-editor-index="${index}" data-editor-field="value">${a}</li>`).join('');
    let langHTML = window.App.cvData.languages.map((l, index) => `<li data-editor-tab="tab-education" data-editor-target="languages" data-editor-index="${index}"><strong data-editor-field="name">${l.name}</strong>: <span data-editor-field="level">${l.level}</span></li>`).join('');
    let contactItems = [];
    if (window.App.cvData.contact.email) contactItems.push(`<div class="cv-euro-contact-item" data-editor-tab="tab-profile" data-editor-focus="input-email">${ICONS.email} Email : <a href="${formatEmailHref(window.App.cvData.contact.email)}" target="_blank" style="color:inherit; text-decoration:none;">${window.App.cvData.contact.email}</a></div>`);
    if (window.App.cvData.contact.phone) contactItems.push(`<div class="cv-euro-contact-item" data-editor-tab="tab-profile" data-editor-focus="input-phone">${ICONS.phone} TÃ©lÃ©phone : <a href="tel:${window.App.cvData.contact.phone}" style="color:inherit; text-decoration:none;">${window.App.cvData.contact.phone}</a></div>`);
    if (window.App.cvData.contact.location) contactItems.push(`<div class="cv-euro-contact-item" data-editor-tab="tab-profile" data-editor-focus="input-location">${ICONS.location} Adresse : ${window.App.cvData.contact.location}</div>`);
    if (window.App.cvData.contact.linkedin) contactItems.push(`<div class="cv-euro-contact-item" data-editor-tab="tab-profile" data-editor-focus="input-linkedin">${ICONS.linkedin} LinkedIn : <a href="${formatLinkedinHref(window.App.cvData.contact.linkedin)}" target="_blank" style="color:inherit; text-decoration:none;">${window.App.cvData.contact.linkedin}</a></div>`);
    if (window.App.cvData.contact.github) contactItems.push(`<div class="cv-euro-contact-item" data-editor-tab="tab-profile" data-editor-focus="input-github">${ICONS.github} GitHub : <a href="${formatGithubHref(window.App.cvData.contact.github)}" target="_blank" style="color:inherit; text-decoration:none;">${window.App.cvData.contact.github}</a></div>`);
    if (window.App.cvData.contact.website) contactItems.push(`<div class="cv-euro-contact-item" data-editor-tab="tab-profile" data-editor-focus="input-website">${ICONS.website} Site Web : <a href="${formatHref(window.App.cvData.contact.website)}" target="_blank" style="color:inherit; text-decoration:none;">${window.App.cvData.contact.website}</a></div>`);
    if (window.App.cvData.contact.driver) contactItems.push(`<div class="cv-euro-contact-item" data-editor-tab="tab-profile" data-editor-focus="input-driver">${ICONS.driver} Permis : ${window.App.cvData.contact.driver}</div>`);

    let contactHTML = "";
    if (contactItems.length > 0) {
        contactHTML = `
        <div class="cv-euro-row">
        <div class="cv-euro-left" data-editor-tab="tab-profile">CoordonnÃ©es</div>
        <div class="cv-euro-right">
            ${contactItems.join('')}
        </div>
        </div>
    `;
    }

    return `
    <div class="cv-euro-body">
        <header class="cv-euro-header" data-editor-tab="tab-profile">
        <div class="cv-euro-logo-container">
            europass<span>â˜…</span>
        </div>
        <div class="cv-euro-header-text">
            <div>
            <h1 class="cv-euro-name" data-editor-tab="tab-profile" data-editor-focus="input-name">${window.App.cvData.contact.name}</h1>
            <p class="cv-euro-title" data-editor-tab="tab-profile" data-editor-focus="input-title-sub">${window.App.cvData.contact.title_sub}</p>
            </div>
            ${pfpHTML}
        </div>
        </header>

        ${contactHTML}

        ${window.App.cvData.profile && window.App.cvData.profile.trim() && !window.App.cvData.hidden_sections?.profile ? `
        <div class="cv-euro-row">
            <div class="cv-euro-left" data-editor-tab="tab-profile">Profil</div>
            <div class="cv-euro-right">
            <p style="line-height:1.45; text-align:justify;" data-editor-tab="tab-profile" data-editor-focus="input-profile">${window.App.cvData.profile}</p>
            </div>
        </div>
        ` : ''}

        ${window.App.cvData.experiences && window.App.cvData.experiences.length > 0 && !window.App.cvData.hidden_sections?.experiences ? `
        <div class="cv-euro-row">
            <div class="cv-euro-left" data-editor-tab="tab-experiences">ExpÃ©riences</div>
            <div class="cv-euro-right">
            ${expHTML}
            </div>
        </div>
        ` : ''}

        ${window.App.cvData.hidden_sections?.formations ? '' : formHTML}

        ${window.App.cvData.projects && window.App.cvData.projects.length > 0 && !window.App.cvData.hidden_sections?.projects ? `
        <div class="cv-euro-row">
            <div class="cv-euro-left" data-editor-tab="tab-projects">Projets</div>
            <div class="cv-euro-right">
            ${projHTML}
            </div>
        </div>
        ` : ''}

        ${window.App.cvData.skills && window.App.cvData.skills.length > 0 && !window.App.cvData.hidden_sections?.skills ? `
        <div class="cv-euro-row">
            <div class="cv-euro-left" data-editor-tab="tab-skills">CompÃ©tences</div>
            <div class="cv-euro-right">
            ${skillsHTML}
            </div>
        </div>
        ` : ''}

        ${window.App.cvData.education && window.App.cvData.education.length > 0 && !window.App.cvData.hidden_sections?.education ? `
        <div class="cv-euro-row">
            <div class="cv-euro-left" data-editor-tab="tab-education">Ã‰ducation</div>
            <div class="cv-euro-right">
            ${eduHTML}
            </div>
        </div>
        ` : ''}

        ${window.App.cvData.languages && window.App.cvData.languages.length > 0 && !window.App.cvData.hidden_sections?.languages ? `
        <div class="cv-euro-row">
            <div class="cv-euro-left" data-editor-tab="tab-education">Langues</div>
            <div class="cv-euro-right">
            <ul class="cv-euro-bullets" style="list-style-type:none; padding-left:0; margin:0;">${langHTML}</ul>
            </div>
        </div>
        ` : ''}

        ${(window.App.cvData.certifications && window.App.cvData.certifications.length > 0 && !window.App.cvData.hidden_sections?.certifications) || (window.App.cvData.activities && window.App.cvData.activities.length > 0 && !window.App.cvData.hidden_sections?.activities) || (window.App.cvData.interests && window.App.cvData.interests.length > 0 && !window.App.cvData.hidden_sections?.interests) ? `
        <div class="cv-euro-row">
            <div class="cv-euro-left" data-editor-tab="tab-education">Divers</div>
            <div class="cv-euro-right">
            ${window.App.cvData.certifications && window.App.cvData.certifications.length > 0 && !window.App.cvData.hidden_sections?.certifications ? `
                <div style="font-weight:700; color:#0055a5; margin-bottom:0.25rem;" data-editor-tab="tab-education">Certifications</div>
                <ul class="cv-euro-bullets" style="margin-bottom:0.5rem;">${certsHTML}</ul>
            ` : ''}
            ${window.App.cvData.activities && window.App.cvData.activities.length > 0 && !window.App.cvData.hidden_sections?.activities ? `
                <div style="font-weight:700; color:#0055a5; margin-bottom:0.25rem; margin-top:0.4rem;" data-editor-tab="tab-education">ActivitÃ©s</div>
                <ul class="cv-euro-bullets" style="margin-bottom:0.5rem;">${actHTML}</ul>
            ` : ''}
            ${window.App.cvData.interests && window.App.cvData.interests.length > 0 && !window.App.cvData.hidden_sections?.interests ? `
                <div style="font-weight:700; color:#0055a5; margin-bottom:0.25rem; margin-top:0.4rem;" data-editor-tab="tab-education">IntÃ©rÃªts</div>
                <div style="font-size:0.7rem; color:#444444;">${window.App.cvData.interests.map((item, idx) => `<span data-editor-tab="tab-education" data-editor-target="interests" data-editor-index="${idx}" data-editor-field="value">${item}</span>`).join(', ')}</div>
            ` : ''}
            </div>
        </div>
        ` : ''}
    </div>`;
}
function renderPreview() {
    if (window.App.cvData && window.App.cvData.contact && window.App.cvData.contact.name) {
        document.title = `CV ${window.App.cvData.contact.name}`;
    } else {
        document.title = "CV Maker";
    }

    const screenContainer = document.getElementById('screen-preview-container');
    try {
        // Generate layout HTML
        let layoutHTML = '';
        if (window.App.currentLayout === 'designed') layoutHTML = renderDesignedLayout();
        else if (window.App.currentLayout === 'professional') layoutHTML = renderProfessionalLayout();
        else if (window.App.currentLayout === 'sidebar') layoutHTML = renderSidebarLayout();
        else if (window.App.currentLayout === 'minimalist') layoutHTML = renderMinimalistLayout();
        else if (window.App.currentLayout === 'europass') layoutHTML = renderEuropassLayout();
        else layoutHTML = renderATSLayout();

        // Determine background color
        let bg = '#ffffff';
        if (window.App.currentLayout === 'designed') {
            bg = (window.App.cvData.themes && window.App.cvData.themes.designed && window.App.cvData.themes.designed.bg_color) ? window.App.cvData.themes.designed.bg_color : '#0b0f19';
        }

        // Render directly into screen container
        screenContainer.innerHTML = '';
        const pageSheet = document.createElement('div');
        pageSheet.className = 'a4-page-sheet';
        pageSheet.style.cssText = `width:210mm;background-color:${bg};height:auto;min-height:297mm;overflow:visible;box-shadow:0 15px 40px rgba(0,0,0,0.5);margin:0 auto;`;
        pageSheet.innerHTML = layoutHTML;
        screenContainer.appendChild(pageSheet);

        if (window.attachEditorBindings) window.attachEditorBindings(screenContainer);
        if (window.applyItemStyles) window.applyItemStyles(screenContainer);

        // Store for print - do NOT put in DOM now (would cause layout shift)
        window._lastLayoutHTML = layoutHTML;
    } catch(e) {
        console.error('[renderPreview] ERROR:', e);
        screenContainer.innerHTML = '<div style="color:red;padding:20px;font-family:monospace;">Preview error: ' + e.message + '</div>';
    }
}
function changeLayout(layout) {
    window.App.currentLayout = layout;
    localStorage.setItem('cv_layout', layout);

    const select = document.getElementById('design-layout-picker');
    if (select) select.value = layout;

    const designedGrp = document.getElementById('design-color-designed-group');
    const profGrp = document.getElementById('design-color-prof-group');
    const sidebarGrp = document.getElementById('design-color-sidebar-group');
    const btnRandom = document.getElementById('design-btn-random');

    if (designedGrp) designedGrp.style.display = (layout === 'designed') ? 'flex' : 'none';
    if (profGrp) profGrp.style.display = (layout === 'professional') ? 'flex' : 'none';
    if (sidebarGrp) sidebarGrp.style.display = (layout === 'sidebar') ? 'flex' : 'none';
    if (btnRandom) btnRandom.style.display = (layout === 'designed' || layout === 'professional' || layout === 'sidebar') ? 'inline-flex' : 'none';

    window.syncTextColorPickers();
    renderPreview();
}
window.renderDesignedLayout = renderDesignedLayout;
window.renderProfessionalLayout = renderProfessionalLayout;
window.renderATSLayout = renderATSLayout;
window.renderSidebarLayout = renderSidebarLayout;
window.renderMinimalistLayout = renderMinimalistLayout;
window.renderEuropassLayout = renderEuropassLayout;
window.renderPreview = renderPreview;
window.changeLayout = changeLayout;

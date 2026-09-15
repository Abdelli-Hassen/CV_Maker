const emptyCVData = {
    "contact": { "name": "", "title_sub": "", "email": "", "phone": "", "location": "", "linkedin": "", "github": "", "website": "", "driver": "", "image": "", "image_size": 80 },
    "profile": "",
    "experiences": [],
    "projects": [],
    "skills": [],
    "education": [],
    "certifications": [],
    "activities": [],
    "languages": [],
    "interests": [],
    "formations": [],
    "themes": {
        "designed": { "bg_color": "#0b0f19", "gold_primary": "#f59e0b", "gold_dark": "#d97706" },
        "professional": { "navy_primary": "#1e3a8a", "navy_light": "#eff6ff" },
        "sidebar": { "sidebar_bg": "#1e293b", "sidebar_accent": "#3b82f6" }
    }
};


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
let currentLayout = localStorage.getItem('cv_layout') || 'professional';
let openCollapseKeys = {}; // Collapsed items status tracking

/* ----------------------------------------------------
    MIGRATION CHECK (For old flat skills object)
    ---------------------------------------------------- */
function runMigrations(data) {
    if (!data) return;
    if (data.skills && !Array.isArray(data.skills)) {
        data.skills = [
            { "category": "Développement Web & Mobile", "value": data.skills.dev || "" },
            { "category": "Bases de Données", "value": data.skills.databases || "" },
            { "category": "Réseaux & Systèmes", "value": data.skills.networks || "" },
            { "category": "Matériel & IoT", "value": data.skills.hardware_iot || "" }
        ];
    }
    if (data.contact && data.contact.image_size === undefined) {
        data.contact.image_size = 80;
    }
    if (!data.themes) {
        data.themes = JSON.parse(JSON.stringify(emptyCVData.themes));
    }
    if (!data.themes.sidebar) {
        data.themes.sidebar = { "sidebar_bg": "#1e293b", "sidebar_accent": "#3b82f6" };
    }
    if (!data.formations) {
        data.formations = [];
    }
    if (!data.design) {
        data.design = {
            "font_family": "Inter",
            "base_size": 14,
            "line_height": 1.45,
            "page_margin": 15,
            "section_spacing": 1.2,
            "show_pfp": true,
            "show_page_number": false,
            "pfp_shape": "circle",
            "pfp_border_width": 2,
            "pfp_border_color": "#d4af37",
            "pfp_shadow": 15,
            "pfp_opacity": 1,
            "pfp_offset_x": 0,
            "pfp_offset_y": 0
        };
    }
    // Image design migration
    if (data.design && data.design.pfp_shape === undefined) {
        data.design.pfp_shape = 'circle';
        data.design.pfp_border_width = 2;
        data.design.pfp_border_color = '#d4af37';
        data.design.pfp_shadow = 15;
        data.design.pfp_opacity = 1;
    }
    if (data.design && data.design.pfp_offset_x === undefined) {
        data.design.pfp_offset_x = 0;
        data.design.pfp_offset_y = 0;
    }
    if (data.design) {
        data.design.show_page_number = false;
    }
    if (!data.hidden_sections) {
        data.hidden_sections = {};
    }
}

runMigrations(cvData);

/* ----------------------------------------------------
    7. TAB NAV CONTROLLER
    ---------------------------------------------------- */
function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));

    const targetBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => btn.getAttribute('onclick').includes(tabId));
    if (targetBtn) targetBtn.classList.add('active');

    document.getElementById(tabId).classList.add('active');
}

function toggleCollapse(key, idx) {
    if (openCollapseKeys[key] === idx) {
        delete openCollapseKeys[key];
    } else {
        openCollapseKeys[key] = idx;
    }
    renderList(key);
}

/* ----------------------------------------------------
    8. IMAGE UPLOAD & SCALING
    ---------------------------------------------------- */
function uploadProfileImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            cvData.contact.image = e.target.result;
            saveAndSync();
            updatePfpPreview();
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function removeProfileImage() {
    cvData.contact.image = "";
    saveAndSync();
    updatePfpPreview();
}

function updatePfpPreview() {
    const container = document.getElementById('pfp-preview');
    if (cvData.contact.image) {
        container.innerHTML = `<img src="${cvData.contact.image}" alt="PFP">`;
    } else {
        container.innerHTML = `<span>👤</span>`;
    }
}

function changeImageSize(px) {
    cvData.contact.image_size = parseInt(px);
    document.getElementById('lbl-image-size').innerText = `Taille de l'image : ${px}px`;
    saveAndSync();
}

/* ----------------------------------------------------
    9. TEMPLATE RENDER ENGINE
    ---------------------------------------------------- */
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

function renderDesignedLayout() {
    const themes = cvData.themes.designed;
    document.documentElement.style.setProperty('--design-bg', themes.bg_color);
    document.documentElement.style.setProperty('--design-gold', themes.gold_primary);
    document.documentElement.style.setProperty('--design-gold-dark', themes.gold_dark);

    let pfpHTML = "";
    if (cvData.contact.image && (!cvData.design || cvData.design.show_pfp)) {
        const sz = cvData.contact.image_size || 80;
        pfpHTML = `<img src="${cvData.contact.image}" class="cv-designed-pfp" style="width:${sz}px; height:${sz}px;" alt="PFP" data-editor-tab="tab-profile">`;
    }

    // Experiences HTML
    let expHTML = "";
    cvData.experiences.forEach((exp, index) => {
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
    if (cvData.formations && cvData.formations.length > 0) {
        let formItemsHTML = "";
        cvData.formations.forEach((f, index) => {
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
        <div class="cv-designed-sectitle" data-editor-tab="tab-experiences" data-section-title="formations">${getHdg('formations', 'Stages & Formations')}</div>
        ${formItemsHTML}
        </section>`;
    }

    // Projects HTML
    let projHTML = "";
    cvData.projects.forEach((proj, index) => {
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
    cvData.education.forEach((edu, index) => {
        eduHTML += `
        <div class="cv-designed-card" style="padding: 0.6rem 0.75rem;" data-editor-tab="tab-education" data-editor-target="education" data-editor-index="${index}">
        <div style="font-size:0.78rem; font-weight:700; color:#fff;" data-editor-field="degree">${edu.degree}</div>
        <div style="font-size:0.72rem; color:#9ca3af; margin-top:0.1rem;" data-editor-field="school">${edu.school}</div>
        <div style="font-size:0.7rem; color:var(--design-gold); font-weight:600; margin-top:0.2rem;" data-editor-field="period">${edu.period}</div>
        </div>`;
    });

    // Certifications HTML
    let certsHTML = "";
    cvData.certifications.forEach((c, index) => {
        const parts = c.includes(" – ") ? c.split(" – ") : c.split(" - ");
        certsHTML += `
        <div class="cv-designed-simpleitem" data-editor-tab="tab-education" data-editor-target="certifications" data-editor-index="${index}" data-editor-field="value">
        <span class="list-label" data-editor-field="value">${parts[0]}</span>
        <span class="list-val" style="color:var(--design-gold);" data-editor-field="value">${parts[1] || 'Certifié'}</span>
        </div>`;
    });

    // Languages HTML
    let langHTML = "";
    cvData.languages.forEach((l, index) => {
        langHTML += `
        <div class="cv-designed-simpleitem" data-editor-tab="tab-education" data-editor-target="languages" data-editor-index="${index}">
        <span class="list-label" data-editor-field="name">${l.name}</span>
        <span class="list-val" data-editor-field="level">${l.level}</span>
        </div>`;
    });

    // Activities HTML
    let actHTML = cvData.activities.map((a, index) => `<div style="margin-bottom:0.3rem;" data-editor-tab="tab-education" data-editor-target="activities" data-editor-index="${index}" data-editor-field="value">▪ ${a}</div>`).join('');

    // Skill categories rendering loop
    const getTags = (str) => {
        return str.split(',').map(s => s.trim()).filter(s => s).map(s => `<span class="cv-designed-tag" data-editor-field="value">${s}</span>`).join('');
    };

    let skillsHTML = "";
    cvData.skills.forEach((s, index) => {
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
            <h1 class="cv-designed-name" data-editor-tab="tab-profile" data-editor-focus="input-name">${cvData.contact.name}</h1>
            <p class="cv-designed-title" data-editor-tab="tab-profile" data-editor-focus="input-title-sub">${cvData.contact.title_sub}</p>
            <div class="cv-designed-contacts" data-editor-tab="tab-profile">
            ${cvData.contact.email ? `<span data-editor-tab="tab-profile" data-editor-focus="input-email">${ICONS.email}<a href="${formatEmailHref(cvData.contact.email)}" target="_blank" style="color:inherit; text-decoration:none;">${cvData.contact.email}</a></span>` : ''}
            ${cvData.contact.phone ? `<span data-editor-tab="tab-profile" data-editor-focus="input-phone">${ICONS.phone}<a href="tel:${cvData.contact.phone}" style="color:inherit; text-decoration:none;">${cvData.contact.phone}</a></span>` : ''}
            ${cvData.contact.location ? `<span data-editor-tab="tab-profile" data-editor-focus="input-location">${ICONS.location}${cvData.contact.location}</span>` : ''}
            ${cvData.contact.linkedin ? `<span data-editor-tab="tab-profile" data-editor-focus="input-linkedin">${ICONS.linkedin}<a href="${formatLinkedinHref(cvData.contact.linkedin)}" target="_blank" style="color:inherit; text-decoration:none;">${cvData.contact.linkedin}</a></span>` : ''}
            ${cvData.contact.github ? `<span data-editor-tab="tab-profile" data-editor-focus="input-github">${ICONS.github}<a href="${formatGithubHref(cvData.contact.github)}" target="_blank" style="color:inherit; text-decoration:none;">${cvData.contact.github}</a></span>` : ''}
            ${cvData.contact.website ? `<span data-editor-tab="tab-profile" data-editor-focus="input-website">${ICONS.website}<a href="${formatHref(cvData.contact.website)}" target="_blank" style="color:inherit; text-decoration:none;">${cvData.contact.website}</a></span>` : ''}
            ${cvData.contact.driver ? `<span data-editor-tab="tab-profile" data-editor-focus="input-driver">${ICONS.driver}${cvData.contact.driver}</span>` : ''}
            </div>
        </div>
        ${pfpHTML}
        </header>
        
        <div class="cv-designed-grid">
        <div class="cv-designed-sidebar">
            ${cvData.profile && cvData.profile.trim() && !cvData.hidden_sections?.profile ? `
            <section>
                <div class="cv-designed-sectitle" data-editor-tab="tab-profile" data-section-title="profile">${getHdg('profile', 'Profil')}</div>
                <p style="font-size:0.73rem; color:#9ca3af; line-height:1.45; text-align:justify;" data-editor-tab="tab-profile" data-editor-focus="input-profile">${cvData.profile}</p>
            </section>
            ` : ''}
            ${cvData.skills && cvData.skills.length > 0 && !cvData.hidden_sections?.skills ? `
            <section>
                <div class="cv-designed-sectitle" data-editor-tab="tab-skills" data-section-title="skills">${getHdg('skills', 'Compétences')}</div>
                <div class="skills-group">
                ${skillsHTML}
                </div>
            </section>
            ` : ''}
            ${cvData.education && cvData.education.length > 0 && !cvData.hidden_sections?.education ? `
            <section>
                <div class="cv-designed-sectitle" data-editor-tab="tab-education" data-section-title="education">${getHdg('education', 'Éducation')}</div>
                ${eduHTML}
            </section>
            ` : ''}
            ${cvData.certifications && cvData.certifications.length > 0 && !cvData.hidden_sections?.certifications ? `
            <section>
                <div class="cv-designed-sectitle" data-editor-tab="tab-education" data-section-title="certifications">${getHdg('certifications', 'Certifications')}</div>
                <div class="cv-designed-simplelist">${certsHTML}</div>
            </section>
            ` : ''}
            ${cvData.languages && cvData.languages.length > 0 && !cvData.hidden_sections?.languages ? `
            <section>
                <div class="cv-designed-sectitle" data-editor-tab="tab-education" data-section-title="languages">${getHdg('languages', 'Langues')}</div>
                <div class="cv-designed-simplelist">${langHTML}</div>
            </section>
            ` : ''}
            ${cvData.interests && cvData.interests.length > 0 && !cvData.hidden_sections?.interests ? `
            <section>
                <div class="cv-designed-sectitle" data-editor-tab="tab-education" data-section-title="interests">${getHdg('interests', 'Centres d\'intérêt')}</div>
                <div style="font-size:0.72rem; color:#9ca3af; line-height:1.4;">${cvData.interests.map((item, idx) => `<span data-editor-tab="tab-education" data-editor-target="interests" data-editor-index="${idx}" data-editor-field="value">${item}</span>`).join(', ')}</div>
            </section>
            ` : ''}
        </div>
        <div class="cv-designed-main">
            ${cvData.experiences && cvData.experiences.length > 0 && !cvData.hidden_sections?.experiences ? `
            <section>
                <div class="cv-designed-sectitle" data-editor-tab="tab-experiences" data-section-title="experiences">${getHdg('experiences', 'Expériences Professionnelles')}</div>
                ${expHTML}
            </section>
            ` : ''}
            ${cvData.hidden_sections?.formations ? '' : formHTML}
            ${cvData.projects && cvData.projects.length > 0 && !cvData.hidden_sections?.projects ? `
            <section>
                <div class="cv-designed-sectitle" data-editor-tab="tab-projects" data-section-title="projects">${getHdg('projects', 'Projets Clés')}</div>
                ${projHTML}
            </section>
            ` : ''}
            ${cvData.activities && cvData.activities.length > 0 && !cvData.hidden_sections?.activities ? `
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
    const themes = cvData.themes.professional;
    document.documentElement.style.setProperty('--prof-navy', themes.navy_primary);

    // PFP rendering
    let pfpHTML = "";
    if (cvData.contact.image && (!cvData.design || cvData.design.show_pfp)) {
        const sz = cvData.contact.image_size || 80;
        pfpHTML = `<img src="${cvData.contact.image}" class="cv-prof-pfp" style="width:${sz}px; height:${sz}px;" alt="PFP" data-editor-tab="tab-profile">`;
    }

    // Experiences HTML
    let expHTML = "";
    cvData.experiences.forEach((exp, index) => {
        let bulletsHTML = exp.bullets.map(b => `<li data-editor-field="bullets">${b}</li>`).join('');
        expHTML += `
        <div class="cv-prof-item" data-editor-tab="tab-experiences" data-editor-target="experiences" data-editor-index="${index}">
        <div class="cv-prof-itemhead">
            <span><span data-editor-field="title">${exp.title}</span> — <span class="cv-prof-itemorg" data-editor-field="company">${exp.company}</span></span>
            <span class="cv-prof-itemdate" data-editor-field="period">${exp.period}</span>
        </div>
        <div style="font-size: 0.78rem; color:#6b7280; margin-bottom:0.2rem;" data-editor-field="location">${exp.location}</div>
        <ul class="cv-prof-bullets" data-editor-field="bullets">${bulletsHTML}</ul>
        </div>`;
    });

    // Formations HTML
    let formHTML = "";
    if (cvData.formations && cvData.formations.length > 0) {
        let formItemsHTML = "";
        cvData.formations.forEach((f, index) => {
            let bulletsHTML = f.bullets ? f.bullets.map(b => `<li data-editor-field="bullets">${b}</li>`).join('') : "";
            formItemsHTML += `
        <div class="cv-prof-item" data-editor-tab="tab-experiences" data-editor-target="formations" data-editor-index="${index}">
            <div class="cv-prof-itemhead">
            <span><span data-editor-field="title">${f.title}</span> — <span class="cv-prof-itemorg" data-editor-field="company">${f.company}</span></span>
            <span class="cv-prof-itemdate" data-editor-field="period">${f.period}</span>
            </div>
            <div style="font-size: 0.78rem; color:#6b7280; margin-bottom:0.2rem;" data-editor-field="location">${f.location}</div>
            <ul class="cv-prof-bullets" data-editor-field="bullets">${bulletsHTML}</ul>
        </div>`;
        });
        formHTML = `
        <section class="section">
        <div class="cv-prof-sectitle" data-editor-tab="tab-experiences" data-section-title="formations">${getHdg('formations', 'Stages & Formations')}</div>
        ${formItemsHTML}
        </section>`;
    }

    // Projects HTML
    let projHTML = "";
    cvData.projects.forEach((proj, index) => {
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
    cvData.education.forEach((edu, index) => {
        eduHTML += `
        <div class="cv-prof-item" style="margin-bottom:0.4rem;" data-editor-tab="tab-education" data-editor-target="education" data-editor-index="${index}">
        <div style="font-size:0.8rem; font-weight:700;" data-editor-field="degree">${edu.degree}</div>
        <div style="font-size:0.75rem; color:#4b5563;"><span data-editor-field="school">${edu.school}</span> | <span data-editor-field="period">${edu.period}</span></div>
        </div>`;
    });

    // Skill categories list Professional
    let skillsHTML = "";
    cvData.skills.forEach((s, index) => {
        skillsHTML += `
        <div class="cv-prof-skillrow" data-editor-tab="tab-skills" data-editor-target="skills" data-editor-index="${index}">
        <strong data-editor-field="category">${s.category} :</strong> <span data-editor-field="value">${s.value}</span>
        </div>`;
    });

    let certsHTML = cvData.certifications.map((c, index) => `<li data-editor-tab="tab-education" data-editor-target="certifications" data-editor-index="${index}" data-editor-field="value">${c}</li>`).join('');
    let actHTML = cvData.activities.map((a, index) => `<li data-editor-tab="tab-education" data-editor-target="activities" data-editor-index="${index}" data-editor-field="value">${a}</li>`).join('');
    let langHTML = cvData.languages.map((l, index) => `<span data-editor-tab="tab-education" data-editor-target="languages" data-editor-index="${index}"><strong data-editor-field="name">${l.name}</strong> (<span data-editor-field="level">${l.level}</span>)</span>`).join(', ');

    return `
    <div class="cv-prof-body">
        <header class="cv-prof-header" data-editor-tab="tab-profile">
        <div class="cv-prof-header-text">
            <h1 class="cv-prof-name" data-editor-tab="tab-profile" data-editor-focus="input-name">${cvData.contact.name}</h1>
            <p class="cv-prof-title" data-editor-tab="tab-profile" data-editor-focus="input-title-sub">${cvData.contact.title_sub}</p>
            <div class="cv-prof-contacts" data-editor-tab="tab-profile">
            ${cvData.contact.email ? `<span data-editor-tab="tab-profile" data-editor-focus="input-email">${ICONS.email}<a href="${formatEmailHref(cvData.contact.email)}" target="_blank" style="color:inherit; text-decoration:none;">${cvData.contact.email}</a></span>` : ''}
            ${cvData.contact.phone ? `<span data-editor-tab="tab-profile" data-editor-focus="input-phone">${ICONS.phone}<a href="tel:${cvData.contact.phone}" style="color:inherit; text-decoration:none;">${cvData.contact.phone}</a></span>` : ''}
            ${cvData.contact.location ? `<span data-editor-tab="tab-profile" data-editor-focus="input-location">${ICONS.location}${cvData.contact.location}</span>` : ''}
            ${cvData.contact.driver ? `<span data-editor-tab="tab-profile" data-editor-focus="input-driver">${ICONS.driver}${cvData.contact.driver}</span>` : ''}
            ${(cvData.contact.email || cvData.contact.phone || cvData.contact.location || cvData.contact.driver) && (cvData.contact.linkedin || cvData.contact.github || cvData.contact.website) ? '<br>' : ''}
            ${cvData.contact.linkedin ? `<span data-editor-tab="tab-profile" data-editor-focus="input-linkedin">${ICONS.linkedin}<a href="${formatLinkedinHref(cvData.contact.linkedin)}" target="_blank" style="color:inherit; text-decoration:none;">${cvData.contact.linkedin}</a></span>` : ''}
            ${cvData.contact.github ? `<span data-editor-tab="tab-profile" data-editor-focus="input-github">${ICONS.github}<a href="${formatGithubHref(cvData.contact.github)}" target="_blank" style="color:inherit; text-decoration:none;">${cvData.contact.github}</a></span>` : ''}
            ${cvData.contact.website ? `<span data-editor-tab="tab-profile" data-editor-focus="input-website">${ICONS.website}<a href="${formatHref(cvData.contact.website)}" target="_blank" style="color:inherit; text-decoration:none;">${cvData.contact.website}</a></span>` : ''}
            </div>
        </div>
        ${pfpHTML}
        </header>
        
        ${cvData.profile && cvData.profile.trim() && !cvData.hidden_sections?.profile ? `
        <section class="section">
            <div class="cv-prof-sectitle" data-editor-tab="tab-profile" data-section-title="profile">${getHdg('profile', 'Profil Professionnel')}</div>
            <p style="font-size:0.8rem; color:#374151; text-align:justify; line-height:1.45;" data-editor-tab="tab-profile" data-editor-focus="input-profile">${cvData.profile}</p>
        </section>
        ` : ''}

        ${cvData.experiences && cvData.experiences.length > 0 && !cvData.hidden_sections?.experiences ? `
        <section class="section">
            <div class="cv-prof-sectitle" data-editor-tab="tab-experiences" data-section-title="experiences">${getHdg('experiences', 'Expériences Professionnelles')}</div>
            ${expHTML}
        </section>
        ` : ''}

        ${cvData.hidden_sections?.formations ? '' : formHTML}

        ${cvData.projects && cvData.projects.length > 0 && !cvData.hidden_sections?.projects ? `
        <section class="section">
            <div class="cv-prof-sectitle" data-editor-tab="tab-projects" data-section-title="projects">${getHdg('projects', 'Projets Clés')}</div>
            ${projHTML}
        </section>
        ` : ''}

        <div class="cv-prof-grid">
        <div>
            ${cvData.skills && cvData.skills.length > 0 && !cvData.hidden_sections?.skills ? `
            <section class="section">
                <div class="cv-prof-sectitle" data-editor-tab="tab-skills" data-section-title="skills">${getHdg('skills', 'Compétences Techniques')}</div>
                ${skillsHTML}
            </section>
            ` : ''}
            ${cvData.education && cvData.education.length > 0 && !cvData.hidden_sections?.education ? `
            <section class="section">
                <div class="cv-prof-sectitle" data-editor-tab="tab-education" data-section-title="education">${getHdg('education', 'Éducation')}</div>
                ${eduHTML}
            </section>
            ` : ''}
        </div>
        <div>
            ${cvData.certifications && cvData.certifications.length > 0 && !cvData.hidden_sections?.certifications ? `
            <section class="section">
                <div class="cv-prof-sectitle" data-editor-tab="tab-education" data-section-title="certifications">${getHdg('certifications', 'Certifications')}</div>
                <ul class="cv-prof-bullets">${certsHTML}</ul>
            </section>
            ` : ''}
            ${(cvData.activities && cvData.activities.length > 0 && !cvData.hidden_sections?.activities) || (cvData.languages && cvData.languages.length > 0 && !cvData.hidden_sections?.languages) || (cvData.interests && cvData.interests.length > 0 && !cvData.hidden_sections?.interests) ? `
            <section class="section">
                <div class="cv-prof-sectitle" data-editor-tab="tab-education" data-section-title="languages">${getHdg('languages', 'Divers & Langues')}</div>
                ${cvData.activities && cvData.activities.length > 0 && !cvData.hidden_sections?.activities ? `<ul class="cv-prof-bullets" style="margin-bottom:0.5rem;">${actHTML}</ul>` : ''}
                ${cvData.languages && cvData.languages.length > 0 && !cvData.hidden_sections?.languages ? `
                <div style="font-size:0.78rem; border-top:1px solid #d1d5db; padding-top:0.4rem; color:#374151;" data-editor-tab="tab-education">
                     <strong>Langues :</strong> ${langHTML}
                </div>
                ` : ''}
                ${cvData.interests && cvData.interests.length > 0 && !cvData.hidden_sections?.interests ? `
                <div style="font-size:0.75rem; border-top:1px solid #d1d5db; margin-top:0.4rem; padding-top:0.4rem; color:#374151;" data-editor-tab="tab-education">
                     <strong>Intérêts :</strong> ${cvData.interests.map((item, idx) => `<span data-editor-tab="tab-education" data-editor-target="interests" data-editor-index="${idx}" data-editor-field="value">${item}</span>`).join(', ')}
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
    cvData.experiences.forEach((exp, index) => {
        let bulletsHTML = exp.bullets.map(b => `<li data-editor-field="bullets">${b}</li>`).join('');
        expHTML += `
        <div class="cv-ats-item" data-editor-tab="tab-experiences" data-editor-target="experiences" data-editor-index="${index}">
        <div class="cv-ats-itemhead">
            <span data-editor-field="title">${exp.title}</span>
            <span data-editor-field="period">${exp.period}</span>
        </div>
        <div class="cv-ats-itemsub"><span data-editor-field="company">${exp.company}</span> — <span data-editor-field="location">${exp.location}</span></div>
        <ul class="cv-ats-bullets" data-editor-field="bullets">${bulletsHTML}</ul>
        </div>`;
    });

    // Formations HTML
    let formHTML = "";
    if (cvData.formations && cvData.formations.length > 0) {
        let formItemsHTML = "";
        cvData.formations.forEach((f, index) => {
            let bulletsHTML = f.bullets ? f.bullets.map(b => `<li data-editor-field="bullets">${b}</li>`).join('') : "";
            formItemsHTML += `
        <div class="cv-ats-item" data-editor-tab="tab-experiences" data-editor-target="formations" data-editor-index="${index}">
            <div class="cv-ats-itemhead">
            <span data-editor-field="title">${f.title}</span>
            <span data-editor-field="period">${f.period}</span>
            </div>
            <div class="cv-ats-itemsub"><span data-editor-field="company">${f.company}</span> — <span data-editor-field="location">${f.location}</span></div>
            <ul class="cv-ats-bullets" data-editor-field="bullets">${bulletsHTML}</ul>
        </div>`;
        });
        formHTML = `
        <div class="cv-ats-sectitle" data-editor-tab="tab-experiences" data-section-title="formations">${getHdg('formations', 'Stages & Formations')}</div>
        ${formItemsHTML}`;
    }

    let projHTML = "";
    cvData.projects.forEach((proj, index) => {
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
    cvData.education.forEach((edu, index) => {
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
    cvData.skills.forEach((s, index) => {
        skillsHTML += `<p data-editor-tab="tab-skills" data-editor-target="skills" data-editor-index="${index}"><strong data-editor-field="category">${s.category} :</strong> <span data-editor-field="value">${s.value}</span></p>`;
    });

    let certsHTML = cvData.certifications.map((c, index) => `<li data-editor-tab="tab-education" data-editor-target="certifications" data-editor-index="${index}" data-editor-field="value">${c}</li>`).join('');
    let actHTML = cvData.activities.map((a, index) => `<li data-editor-tab="tab-education" data-editor-target="activities" data-editor-index="${index}" data-editor-field="value">${a}</li>`).join('');
    let langHTML = cvData.languages.map((l, index) => `<li data-editor-tab="tab-education" data-editor-target="languages" data-editor-index="${index}"><strong data-editor-field="name">${l.name} :</strong> <span data-editor-field="level">${l.level}</span></li>`).join('');

    let pfpHTML = "";
    if (cvData.contact.image && (!cvData.design || cvData.design.show_pfp)) {
        const sz = cvData.contact.image_size || 80;
        pfpHTML = `<img src="${cvData.contact.image}" style="width:${sz}px; height:${sz}px; border-radius:50%; object-fit:cover; border:1px solid #cccccc; display:block; margin:0 auto 0.5rem auto;" alt="Photo" data-editor-tab="tab-profile">`;
    }

    const atsContacts1 = [];
    if (cvData.contact.location) atsContacts1.push(`<span data-editor-tab="tab-profile" data-editor-focus="input-location">${cvData.contact.location}</span>`);
    if (cvData.contact.phone) atsContacts1.push(`<span data-editor-tab="tab-profile" data-editor-focus="input-phone">Tél : <a href="tel:${cvData.contact.phone}" style="color:inherit; text-decoration:none;">${cvData.contact.phone}</a></span>`);
    if (cvData.contact.email) atsContacts1.push(`<span data-editor-tab="tab-profile" data-editor-focus="input-email">Email : <a href="${formatEmailHref(cvData.contact.email)}" target="_blank" style="color:inherit; text-decoration:none;">${cvData.contact.email}</a></span>`);
    if (cvData.contact.driver) atsContacts1.push(`<span data-editor-tab="tab-profile" data-editor-focus="input-driver">${cvData.contact.driver}</span>`);

    const atsContacts2 = [];
    if (cvData.contact.linkedin) atsContacts2.push(`<span data-editor-tab="tab-profile" data-editor-focus="input-linkedin">LinkedIn : <a href="${formatLinkedinHref(cvData.contact.linkedin)}" target="_blank" style="color:inherit; text-decoration:none;">${cvData.contact.linkedin}</a></span>`);
    if (cvData.contact.github) atsContacts2.push(`<span data-editor-tab="tab-profile" data-editor-focus="input-github">GitHub : <a href="${formatGithubHref(cvData.contact.github)}" target="_blank" style="color:inherit; text-decoration:none;">${cvData.contact.github}</a></span>`);
    if (cvData.contact.website) atsContacts2.push(`<span data-editor-tab="tab-profile" data-editor-focus="input-website">Portfolio : <a href="${formatHref(cvData.contact.website)}" target="_blank" style="color:inherit; text-decoration:none;">${cvData.contact.website}</a></span>`);

    let atsContactsHTML = "";
    if (atsContacts1.length > 0) atsContactsHTML += atsContacts1.join(' | ');
    if (atsContacts1.length > 0 && atsContacts2.length > 0) atsContactsHTML += ' <br> ';
    if (atsContacts2.length > 0) atsContactsHTML += atsContacts2.join(' | ');

    return `
    <div class="cv-ats-body">
        <header class="cv-ats-header" data-editor-tab="tab-profile">
        ${pfpHTML}
        <div class="cv-ats-name" data-editor-tab="tab-profile" data-editor-focus="input-name">${cvData.contact.name}</div>
        ${cvData.contact.title_sub ? `<div class="cv-ats-title" data-editor-tab="tab-profile" data-editor-focus="input-title-sub">${cvData.contact.title_sub}</div>` : ''}
        <div class="cv-ats-contacts" data-editor-tab="tab-profile">
            ${atsContactsHTML}
        </div>
        </header>
        
        ${cvData.profile && cvData.profile.trim() && !cvData.hidden_sections?.profile ? `
        <div class="cv-ats-section">
            <div class="cv-ats-sectitle" data-editor-tab="tab-profile" data-section-title="profile">${getHdg('profile', 'Profil Professionnel')}</div>
            <p style="font-size:10pt; margin-bottom:0.75rem; text-align:justify;" data-editor-tab="tab-profile" data-editor-focus="input-profile">${cvData.profile}</p>
        </div>
        ` : ''}

        ${cvData.experiences && cvData.experiences.length > 0 && !cvData.hidden_sections?.experiences ? `
        <div class="cv-ats-section">
            <div class="cv-ats-sectitle" data-editor-tab="tab-experiences" data-section-title="experiences">${getHdg('experiences', 'Expérience Professionnelle')}</div>
            ${expHTML}
        </div>
        ` : ''}

        ${cvData.hidden_sections?.formations ? '' : (cvData.formations && cvData.formations.length > 0 ? `
        <div class="cv-ats-section">
            ${formHTML}
        </div>
        ` : '')}

        ${cvData.projects && cvData.projects.length > 0 && !cvData.hidden_sections?.projects ? `
        <div class="cv-ats-section">
            <div class="cv-ats-sectitle" data-editor-tab="tab-projects" data-section-title="projects">${getHdg('projects', 'Projets Réalisés')}</div>
            ${projHTML}
        </div>
        ` : ''}

        ${cvData.skills && cvData.skills.length > 0 && !cvData.hidden_sections?.skills ? `
        <div class="cv-ats-section">
            <div class="cv-ats-sectitle" data-editor-tab="tab-skills" data-section-title="skills">${getHdg('skills', 'Compétences Techniques')}</div>
            <div style="font-size:10pt; margin-bottom:0.5rem;">
                ${skillsHTML}
            </div>
        </div>
        ` : ''}

        ${cvData.education && cvData.education.length > 0 && !cvData.hidden_sections?.education ? `
        <div class="cv-ats-section">
            <div class="cv-ats-sectitle" data-editor-tab="tab-education" data-section-title="education">${getHdg('education', 'Éducation')}</div>
            ${eduHTML}
        </div>
        ` : ''}

        ${cvData.certifications && cvData.certifications.length > 0 && !cvData.hidden_sections?.certifications ? `
        <div class="cv-ats-section">
            <div class="cv-ats-sectitle" data-editor-tab="tab-education" data-section-title="certifications">${getHdg('certifications', 'Certifications')}</div>
            <ul class="cv-ats-bullets">${certsHTML}</ul>
        </div>
        ` : ''}

        ${cvData.activities && cvData.activities.length > 0 && !cvData.hidden_sections?.activities ? `
        <div class="cv-ats-section">
            <div class="cv-ats-sectitle" data-editor-tab="tab-education" data-section-title="activities">${getHdg('activities', 'Engagements & Activités')}</div>
            <ul class="cv-ats-bullets">${actHTML}</ul>
        </div>
        ` : ''}

        ${cvData.languages && cvData.languages.length > 0 && !cvData.hidden_sections?.languages ? `
        <div class="cv-ats-section">
            <div class="cv-ats-sectitle" data-editor-tab="tab-education" data-section-title="languages">${getHdg('languages', 'Langues')}</div>
            <ul class="cv-ats-bullets">${langHTML}</ul>
        </div>
        ` : ''}

        ${cvData.interests && cvData.interests.length > 0 && !cvData.hidden_sections?.interests ? `
        <div class="cv-ats-section">
            <div class="cv-ats-sectitle" data-editor-tab="tab-education" data-section-title="interests">${getHdg('interests', 'Centres d\'Intérêt')}</div>
            <p style="font-size:10pt;">${cvData.interests.map((item, idx) => `<span data-editor-tab="tab-education" data-editor-target="interests" data-editor-index="${idx}" data-editor-field="value">${item}</span>`).join(', ')}</p>
        </div>
        ` : ''}
    </div>`;
}

function renderSidebarLayout() {
    const themes = cvData.themes.sidebar || { "sidebar_bg": "#1e293b", "sidebar_accent": "#3b82f6" };
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
    if (cvData.contact.image && (!cvData.design || cvData.design.show_pfp)) {
        const sz = cvData.contact.image_size || 80;
        pfpHTML = `<img src="${cvData.contact.image}" class="cv-sidebar-pfp" style="width:${sz}px; height:${sz}px;" alt="PFP" data-editor-tab="tab-profile">`;
    }

    let contactItems = [];
    if (cvData.contact.email) contactItems.push(`<div style="margin-bottom: 0.35rem;" data-editor-tab="tab-profile" data-editor-focus="input-email">${ICONS.email}<a href="${formatEmailHref(cvData.contact.email)}" target="_blank" style="color:inherit; text-decoration:none;">${cvData.contact.email}</a></div>`);
    if (cvData.contact.phone) contactItems.push(`<div style="margin-bottom: 0.35rem;" data-editor-tab="tab-profile" data-editor-focus="input-phone">${ICONS.phone}<a href="tel:${cvData.contact.phone}" style="color:inherit; text-decoration:none;">${cvData.contact.phone}</a></div>`);
    if (cvData.contact.location) contactItems.push(`<div style="margin-bottom: 0.35rem;" data-editor-tab="tab-profile" data-editor-focus="input-location">${ICONS.location}${cvData.contact.location}</div>`);
    if (cvData.contact.linkedin) contactItems.push(`<div style="margin-bottom: 0.35rem;" data-editor-tab="tab-profile" data-editor-focus="input-linkedin">${ICONS.linkedin}<a href="${formatLinkedinHref(cvData.contact.linkedin)}" target="_blank" style="color:inherit; text-decoration:none;">${cvData.contact.linkedin}</a></div>`);
    if (cvData.contact.github) contactItems.push(`<div style="margin-bottom: 0.35rem;" data-editor-tab="tab-profile" data-editor-focus="input-github">${ICONS.github}<a href="${formatGithubHref(cvData.contact.github)}" target="_blank" style="color:inherit; text-decoration:none;">${cvData.contact.github}</a></div>`);
    if (cvData.contact.website) contactItems.push(`<div style="margin-bottom: 0.35rem;" data-editor-tab="tab-profile" data-editor-focus="input-website">${ICONS.website}<a href="${formatHref(cvData.contact.website)}" target="_blank" style="color:inherit; text-decoration:none;">${cvData.contact.website}</a></div>`);
    if (cvData.contact.driver) contactItems.push(`<div style="margin-bottom: 0.35rem;" data-editor-tab="tab-profile" data-editor-focus="input-driver">${ICONS.driver}${cvData.contact.driver}</div>`);

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
    cvData.skills.forEach((s, index) => {
        skillsHTML += `
        <div style="margin-bottom:0.5rem;" data-editor-tab="tab-skills" data-editor-target="skills" data-editor-index="${index}">
        <div style="font-weight:700; font-size:0.74rem; color:var(--sidebar-accent); margin-bottom:0.2rem;" data-editor-field="category">${s.category}</div>
        <div style="font-size:0.68rem; opacity:0.9; line-height:1.35;" data-editor-field="value">${s.value}</div>
        </div>`;
    });

    let langHTML = cvData.languages.map((l, index) => `<li data-editor-tab="tab-education" data-editor-target="languages" data-editor-index="${index}"><strong data-editor-field="name">${l.name}</strong>: <span data-editor-field="level">${l.level}</span></li>`).join('');
    let certsHTML = cvData.certifications.map((c, index) => `<li data-editor-tab="tab-education" data-editor-target="certifications" data-editor-index="${index}" data-editor-field="value">${c}</li>`).join('');

    // Experiences HTML
    let expHTML = "";
    cvData.experiences.forEach((exp, index) => {
        let bulletsHTML = exp.bullets.map(b => `<li data-editor-field="bullets">${b}</li>`).join('');
        expHTML += `
        <div class="cv-sidebar-item" data-editor-tab="tab-experiences" data-editor-target="experiences" data-editor-index="${index}">
        <div class="cv-sidebar-itemhead">
            <span><span data-editor-field="title">${exp.title}</span> — <span class="cv-sidebar-itemorg" data-editor-field="company">${exp.company}</span></span>
            <span class="cv-sidebar-itemdate" data-editor-field="period">${exp.period}</span>
        </div>
        <div style="font-size: 0.72rem; color:#64748b; margin-bottom:0.15rem;" data-editor-field="location">${exp.location}</div>
        <ul class="cv-sidebar-bullets" data-editor-field="bullets">${bulletsHTML}</ul>
        </div>`;
    });

    // Formations HTML
    let formHTML = "";
    if (cvData.formations && cvData.formations.length > 0) {
        let formItemsHTML = "";
        cvData.formations.forEach((f, index) => {
            let bulletsHTML = f.bullets ? f.bullets.map(b => `<li data-editor-field="bullets">${b}</li>`).join('') : "";
            formItemsHTML += `
        <div class="cv-sidebar-item" data-editor-tab="tab-experiences" data-editor-target="formations" data-editor-index="${index}">
            <div class="cv-sidebar-itemhead">
            <span><span data-editor-field="title">${f.title}</span> — <span class="cv-sidebar-itemorg" data-editor-field="company">${f.company}</span></span>
            <span class="cv-sidebar-itemdate" data-editor-field="period">${f.period}</span>
            </div>
            <div style="font-size: 0.72rem; color:#64748b; margin-bottom:0.15rem;" data-editor-field="location">${f.location}</div>
            <ul class="cv-sidebar-bullets" data-editor-field="bullets">${bulletsHTML}</ul>
        </div>`;
        });
        formHTML = `
        <div class="cv-sidebar-right-section">
        <div class="cv-sidebar-right-title" data-editor-tab="tab-experiences" data-section-title="formations">${getHdg('formations', 'Stages & Formations')}</div>
        ${formItemsHTML}
        </div>`;
    }

    let projHTML = "";
    cvData.projects.forEach((proj, index) => {
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
    cvData.education.forEach((edu, index) => {
        eduHTML += `
        <div style="margin-bottom:0.5rem; font-size:0.74rem;" data-editor-tab="tab-education" data-editor-target="education" data-editor-index="${index}">
        <div style="font-weight:700; color:#0f172a;" data-editor-field="degree">${edu.degree}</div>
        <div style="color:#475569;"><span data-editor-field="school">${edu.school}</span> | <span style="font-weight:600; color:var(--sidebar-accent);" data-editor-field="period">${edu.period}</span></div>
        </div>`;
    });

    let actHTML = cvData.activities.map((a, index) => `<div style="font-size:0.72rem; color:#334155; margin-bottom:0.25rem;" data-editor-tab="tab-education" data-editor-target="activities" data-editor-index="${index}" data-editor-field="value">▪ ${a}</div>`).join('');

    return `
    <div class="cv-sidebar-body">
        <div class="cv-sidebar-container">
        <div class="cv-sidebar-left">
            ${pfpHTML}
            ${contactHTML}
            ${cvData.skills && cvData.skills.length > 0 && !cvData.hidden_sections?.skills ? `
            <div class="cv-sidebar-left-section">
                <div class="cv-sidebar-left-title" data-editor-tab="tab-skills" data-section-title="skills">${getHdg('skills', 'Compétences')}</div>
                <div class="cv-sidebar-left-content">${skillsHTML}</div>
            </div>
            ` : ''}
            ${cvData.languages && cvData.languages.length > 0 && !cvData.hidden_sections?.languages ? `
            <div class="cv-sidebar-left-section">
                <div class="cv-sidebar-left-title" data-editor-tab="tab-education" data-section-title="languages">${getHdg('languages', 'Langues')}</div>
                <ul class="cv-sidebar-left-bullets" style="color:var(--sidebar-text);">${langHTML}</ul>
            </div>
            ` : ''}
            ${cvData.interests && cvData.interests.length > 0 && !cvData.hidden_sections?.interests ? `
            <div class="cv-sidebar-left-section">
                <div class="cv-sidebar-left-title" data-editor-tab="tab-education" data-section-title="interests">${getHdg('interests', 'Intérêts')}</div>
                <div class="cv-sidebar-left-content" style="font-size:0.7rem; opacity:0.85;">${cvData.interests.map((item, idx) => `<span data-editor-tab="tab-education" data-editor-target="interests" data-editor-index="${idx}" data-editor-field="value">${item}</span>`).join(', ')}</div>
            </div>
            ` : ''}
        </div>
        <div class="cv-sidebar-right">
            <header style="margin-bottom:0.5rem; padding-top:1.5rem;" data-editor-tab="tab-profile">
            <h1 style="font-family:'Plus Jakarta Sans', sans-serif; font-size:1.8rem; font-weight:800; color:#0f172a; line-height:1.15;" data-editor-tab="tab-profile" data-editor-focus="input-name">${cvData.contact.name}</h1>
            <p style="font-size:0.85rem; font-weight:700; color:var(--sidebar-accent); text-transform:uppercase; letter-spacing:0.04em; margin-top:0.25rem;" data-editor-tab="tab-profile" data-editor-focus="input-title-sub">${cvData.contact.title_sub}</p>
            </header>
            
            ${cvData.profile && cvData.profile.trim() && !cvData.hidden_sections?.profile ? `
            <div class="cv-sidebar-right-section">
                <div class="cv-sidebar-right-title" data-editor-tab="tab-profile" data-section-title="profile">${getHdg('profile', 'Profil')}</div>
                <p style="font-size:0.74rem; color:#334155; line-height:1.45; text-align:justify;" data-editor-tab="tab-profile" data-editor-focus="input-profile">${cvData.profile}</p>
            </div>
            ` : ''}

            ${cvData.experiences && cvData.experiences.length > 0 && !cvData.hidden_sections?.experiences ? `
            <div class="cv-sidebar-right-section">
                <div class="cv-sidebar-right-title" data-editor-tab="tab-experiences" data-section-title="experiences">${getHdg('experiences', 'Expériences Professionnelles')}</div>
                ${expHTML}
            </div>
            ` : ''}

            ${cvData.hidden_sections?.formations ? '' : formHTML}

            ${cvData.projects && cvData.projects.length > 0 && !cvData.hidden_sections?.projects ? `
            <div class="cv-sidebar-right-section">
                <div class="cv-sidebar-right-title" data-editor-tab="tab-projects" data-section-title="projects">${getHdg('projects', 'Projets Clés')}</div>
                ${projHTML}
            </div>
            ` : ''}

            ${cvData.education && cvData.education.length > 0 && !cvData.hidden_sections?.education ? `
            <div class="cv-sidebar-right-section">
                <div class="cv-sidebar-right-title" data-editor-tab="tab-education" data-section-title="education">${getHdg('education', 'Éducation')}</div>
                ${eduHTML}
            </div>
            ` : ''}

            ${(cvData.certifications && cvData.certifications.length > 0 && !cvData.hidden_sections?.certifications) || (cvData.activities && cvData.activities.length > 0 && !cvData.hidden_sections?.activities) ? `
            <div class="cv-sidebar-right-section">
                <div class="cv-sidebar-right-title" data-editor-tab="tab-education" data-section-title="certifications">${getHdg('certifications', 'Certifications & Activités')}</div>
                ${cvData.certifications && cvData.certifications.length > 0 && !cvData.hidden_sections?.certifications ? `<ul class="cv-sidebar-bullets" style="margin-bottom:0.4rem;">${certsHTML}</ul>` : ''}
                ${cvData.activities && cvData.activities.length > 0 && !cvData.hidden_sections?.activities ? `
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
    if (cvData.contact.image && (!cvData.design || cvData.design.show_pfp)) {
        const sz = cvData.contact.image_size || 80;
        pfpHTML = `<img src="${cvData.contact.image}" class="cv-mini-pfp" style="width:${sz}px; height:${sz}px;" alt="PFP" data-editor-tab="tab-profile">`;
    }

    let contactItems = [];
    if (cvData.contact.email) contactItems.push(`<div data-editor-tab="tab-profile" data-editor-focus="input-email"><a href="${formatEmailHref(cvData.contact.email)}" target="_blank" style="color:inherit; text-decoration:none;">${cvData.contact.email}</a></div>`);
    if (cvData.contact.phone) contactItems.push(`<div data-editor-tab="tab-profile" data-editor-focus="input-phone"><a href="tel:${cvData.contact.phone}" style="color:inherit; text-decoration:none;">${cvData.contact.phone}</a></div>`);
    if (cvData.contact.location) contactItems.push(`<div data-editor-tab="tab-profile" data-editor-focus="input-location">${cvData.contact.location}</div>`);
    if (cvData.contact.linkedin) contactItems.push(`<div data-editor-tab="tab-profile" data-editor-focus="input-linkedin"><a href="${formatLinkedinHref(cvData.contact.linkedin)}" target="_blank" style="color:inherit; text-decoration:none;">LinkedIn</a></div>`);
    if (cvData.contact.github) contactItems.push(`<div data-editor-tab="tab-profile" data-editor-focus="input-github"><a href="${formatGithubHref(cvData.contact.github)}" target="_blank" style="color:inherit; text-decoration:none;">GitHub</a></div>`);
    if (cvData.contact.website) contactItems.push(`<div data-editor-tab="tab-profile" data-editor-focus="input-website"><a href="${formatHref(cvData.contact.website)}" target="_blank" style="color:inherit; text-decoration:none;">Site Web</a></div>`);
    if (cvData.contact.driver) contactItems.push(`<div data-editor-tab="tab-profile" data-editor-focus="input-driver">${cvData.contact.driver}</div>`);

    let contactHTML = "";
    if (contactItems.length > 0) {
        contactHTML = `
        <div class="cv-mini-contacts" data-editor-tab="tab-profile">
        ${contactItems.join('')}
        </div>
    `;
    }

    let skillsHTML = "";
    cvData.skills.forEach((s, index) => {
        skillsHTML += `
        <div class="cv-mini-skillcat" data-editor-tab="tab-skills" data-editor-target="skills" data-editor-index="${index}">
        <strong data-editor-field="category">${s.category}</strong>
        <span data-editor-field="value">${s.value}</span>
        </div>`;
    });

    let eduHTML = "";
    cvData.education.forEach((edu, index) => {
        eduHTML += `
        <div style="margin-bottom: 0.6rem; font-size: 0.72rem; color:#3f3f46;" data-editor-tab="tab-education" data-editor-target="education" data-editor-index="${index}">
        <div style="font-weight:700; color:#09090b;" data-editor-field="degree">${edu.degree}</div>
        <div data-editor-field="school">${edu.school}</div>
        <div style="font-style:italic; font-size:0.68rem; color:#71717a; margin-top:0.1rem;" data-editor-field="period">${edu.period}</div>
        </div>`;
    });

    let langHTML = cvData.languages.map((l, index) => `<div style="font-size:0.72rem; margin-bottom:0.25rem; color:#3f3f46;" data-editor-tab="tab-education" data-editor-target="languages" data-editor-index="${index}"><strong data-editor-field="name">${l.name}</strong>: <span data-editor-field="level">${l.level}</span></div>`).join('');
    let certsHTML = cvData.certifications.map((c, index) => `<li data-editor-tab="tab-education" data-editor-target="certifications" data-editor-index="${index}" data-editor-field="value">${c}</li>`).join('');

    // Experiences HTML
    let expHTML = "";
    cvData.experiences.forEach((exp, index) => {
        let bulletsHTML = exp.bullets.map(b => `<li data-editor-field="bullets">${b}</li>`).join('');
        expHTML += `
        <div class="cv-mini-item" data-editor-tab="tab-experiences" data-editor-target="experiences" data-editor-index="${index}">
        <div class="cv-mini-itemhead">
            <span data-editor-field="title">${exp.title}</span>
            <span class="cv-mini-itemdate" data-editor-field="period">${exp.period}</span>
        </div>
        <div class="cv-mini-itemorg"><span data-editor-field="company">${exp.company}</span> — <span style="font-size:0.7rem; font-style:normal;" data-editor-field="location">${exp.location}</span></div>
        <ul class="cv-mini-bullets" data-editor-field="bullets">${bulletsHTML}</ul>
        </div>`;
    });

    // Formations HTML
    let formHTML = "";
    if (cvData.formations && cvData.formations.length > 0) {
        let formItemsHTML = "";
        cvData.formations.forEach((f, index) => {
            let bulletsHTML = f.bullets ? f.bullets.map(b => `<li data-editor-field="bullets">${b}</li>`).join('') : "";
            formItemsHTML += `
        <div class="cv-mini-item" data-editor-tab="tab-experiences" data-editor-target="formations" data-editor-index="${index}">
            <div class="cv-mini-itemhead">
            <span data-editor-field="title">${f.title}</span>
            <span class="cv-mini-itemdate" data-editor-field="period">${f.period}</span>
            </div>
            <div class="cv-mini-itemorg"><span data-editor-field="company">${f.company}</span> — <span style="font-size:0.7rem; font-style:normal;" data-editor-field="location">${f.location}</span></div>
            <ul class="cv-mini-bullets" data-editor-field="bullets">${bulletsHTML}</ul>
        </div>`;
        });
        formHTML = `
        <div>
        <div class="cv-mini-sectitle" data-editor-tab="tab-experiences" data-section-title="formations">${getHdg('formations', 'Stages & Formations')}</div>
        ${formItemsHTML}
        </div>`;
    }

    let projHTML = "";
    cvData.projects.forEach((proj, index) => {
        projHTML += `
        <div class="cv-mini-item" data-editor-tab="tab-projects" data-editor-target="projects" data-editor-index="${index}">
        <div class="cv-mini-itemhead">
            <span data-editor-field="title">${proj.title}</span>
            <span class="cv-mini-itemdate" style="font-weight:500; font-family:'Inter', sans-serif;" data-editor-field="stack">${proj.stack}</span>
        </div>
        <p style="font-size:0.74rem; color:#52525b; margin-top:0.25rem; line-height:1.4;" data-editor-field="description">${proj.description}</p>
        </div>`;
    });

    let actHTML = cvData.activities.map((a, index) => `<div style="font-size:0.72rem; color:#52525b; margin-bottom:0.25rem;" data-editor-tab="tab-education" data-editor-target="activities" data-editor-index="${index}" data-editor-field="value">— ${a}</div>`).join('');

    return `
    <div class="cv-mini-body">
        <header class="cv-mini-header" data-editor-tab="tab-profile">
        <div style="flex:1;" data-editor-tab="tab-profile">
            <h1 class="cv-mini-name" data-editor-tab="tab-profile" data-editor-focus="input-name">${cvData.contact.name}</h1>
            <p class="cv-mini-title" data-editor-tab="tab-profile" data-editor-focus="input-title-sub">${cvData.contact.title_sub}</p>
        </div>
        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:0.5rem;" data-editor-tab="tab-profile">
            ${pfpHTML}
            ${contactHTML}
        </div>
        </header>
        
        <div class="cv-mini-grid">
        <div class="cv-mini-left-col">
            ${cvData.skills && cvData.skills.length > 0 && !cvData.hidden_sections?.skills ? `
            <div>
                <div class="cv-mini-sectitle" data-editor-tab="tab-skills" data-section-title="skills">${getHdg('skills', 'Compétences')}</div>
                ${skillsHTML}
            </div>
            ` : ''}
            ${cvData.education && cvData.education.length > 0 && !cvData.hidden_sections?.education ? `
            <div>
                <div class="cv-mini-sectitle" data-editor-tab="tab-education" data-section-title="education">${getHdg('education', 'Éducation')}</div>
                ${eduHTML}
            </div>
            ` : ''}
            ${cvData.languages && cvData.languages.length > 0 && !cvData.hidden_sections?.languages ? `
            <div>
                <div class="cv-mini-sectitle" data-editor-tab="tab-education" data-section-title="languages">${getHdg('languages', 'Langues')}</div>
                ${langHTML}
            </div>
            ` : ''}
            ${cvData.interests && cvData.interests.length > 0 && !cvData.hidden_sections?.interests ? `
            <div>
                <div class="cv-mini-sectitle" data-editor-tab="tab-education" data-section-title="interests">${getHdg('interests', 'Intérêts')}</div>
                <div style="font-size:0.7rem; color:#52525b; line-height:1.45;">${cvData.interests.map((item, idx) => `<span data-editor-tab="tab-education" data-editor-target="interests" data-editor-index="${idx}" data-editor-field="value">${item}</span>`).join(', ')}</div>
            </div>
            ` : ''}
        </div>
        <div class="cv-mini-right-col">
            ${cvData.profile && cvData.profile.trim() && !cvData.hidden_sections?.profile ? `
            <div>
                <div class="cv-mini-sectitle" data-editor-tab="tab-profile" data-section-title="profile">${getHdg('profile', 'Profil')}</div>
                <p style="font-size:0.74rem; color:#3f3f46; line-height:1.5; text-align:justify; margin-bottom:0.4rem;" data-editor-tab="tab-profile" data-editor-focus="input-profile">${cvData.profile}</p>
            </div>
            ` : ''}
            ${cvData.experiences && cvData.experiences.length > 0 && !cvData.hidden_sections?.experiences ? `
            <div>
                <div class="cv-mini-sectitle" data-editor-tab="tab-experiences" data-section-title="experiences">${getHdg('experiences', 'Expériences Professionnelles')}</div>
                ${expHTML}
            </div>
            ` : ''}
            ${cvData.hidden_sections?.formations ? '' : formHTML}
            ${cvData.projects && cvData.projects.length > 0 && !cvData.hidden_sections?.projects ? `
            <div>
                <div class="cv-mini-sectitle" data-editor-tab="tab-projects" data-section-title="projects">${getHdg('projects', 'Projets Clés')}</div>
                ${projHTML}
            </div>
            ` : ''}
            ${(cvData.certifications && cvData.certifications.length > 0 && !cvData.hidden_sections?.certifications) || (cvData.activities && cvData.activities.length > 0 && !cvData.hidden_sections?.activities) ? `
            <div>
                <div class="cv-mini-sectitle" data-editor-tab="tab-education" data-section-title="certifications">${getHdg('certifications', 'Certifications & Activités')}</div>
                ${cvData.certifications && cvData.certifications.length > 0 && !cvData.hidden_sections?.certifications ? `<ul class="cv-mini-bullets" style="margin-bottom:0.5rem;">${certsHTML}</ul>` : ''}
                ${cvData.activities && cvData.activities.length > 0 && !cvData.hidden_sections?.activities ? `
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
    if (cvData.contact.image && (!cvData.design || cvData.design.show_pfp)) {
        const sz = cvData.contact.image_size || 80;
        pfpHTML = `<img src="${cvData.contact.image}" class="cv-euro-pfp" style="width:${sz}px; height:${sz}px;" alt="PFP" data-editor-tab="tab-profile">`;
    }

    let expHTML = "";
    cvData.experiences.forEach((exp, index) => {
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
    if (cvData.formations && cvData.formations.length > 0) {
        let formItemsHTML = "";
        cvData.formations.forEach((f, index) => {
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
        <div class="cv-euro-left" data-editor-tab="tab-experiences" data-section-title="formations">${getHdg('formations', 'Stages & Formations')}</div>
        <div class="cv-euro-right">
            ${formItemsHTML}
        </div>
        </div>`;
    }

    let projHTML = "";
    cvData.projects.forEach((proj, index) => {
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
    cvData.education.forEach((edu, index) => {
        eduHTML += `
        <div style="margin-bottom:0.5rem; font-size:0.74rem;" data-editor-tab="tab-education" data-editor-target="education" data-editor-index="${index}">
        <div style="font-weight:700; color:#333333;" data-editor-field="degree">${edu.degree}</div>
        <div style="color:#666666;"><span data-editor-field="school">${edu.school}</span> | <span style="font-weight:600; color:#0055a5;" data-editor-field="period">${edu.period}</span></div>
        </div>`;
    });

    let skillsHTML = "";
    cvData.skills.forEach((s, index) => {
        skillsHTML += `
        <div style="margin-bottom: 0.5rem;" data-editor-tab="tab-skills" data-editor-target="skills" data-editor-index="${index}">
        <div style="font-weight:700; font-size:0.74rem; color:#0055a5; margin-bottom:0.15rem;" data-editor-field="category">${s.category}</div>
        <div style="font-size:0.7rem; color:#444444; line-height:1.4;" data-editor-field="value">${s.value}</div>
        </div>`;
    });

    let certsHTML = cvData.certifications.map((c, index) => `<li data-editor-tab="tab-education" data-editor-target="certifications" data-editor-index="${index}" data-editor-field="value">${c}</li>`).join('');
    let actHTML = cvData.activities.map((a, index) => `<li data-editor-tab="tab-education" data-editor-target="activities" data-editor-index="${index}" data-editor-field="value">${a}</li>`).join('');
    let langHTML = cvData.languages.map((l, index) => `<li data-editor-tab="tab-education" data-editor-target="languages" data-editor-index="${index}"><strong data-editor-field="name">${l.name}</strong>: <span data-editor-field="level">${l.level}</span></li>`).join('');
    let contactItems = [];
    if (cvData.contact.email) contactItems.push(`<div class="cv-euro-contact-item" data-editor-tab="tab-profile" data-editor-focus="input-email">${ICONS.email} Email : <a href="${formatEmailHref(cvData.contact.email)}" target="_blank" style="color:inherit; text-decoration:none;">${cvData.contact.email}</a></div>`);
    if (cvData.contact.phone) contactItems.push(`<div class="cv-euro-contact-item" data-editor-tab="tab-profile" data-editor-focus="input-phone">${ICONS.phone} Téléphone : <a href="tel:${cvData.contact.phone}" style="color:inherit; text-decoration:none;">${cvData.contact.phone}</a></div>`);
    if (cvData.contact.location) contactItems.push(`<div class="cv-euro-contact-item" data-editor-tab="tab-profile" data-editor-focus="input-location">${ICONS.location} Adresse : ${cvData.contact.location}</div>`);
    if (cvData.contact.linkedin) contactItems.push(`<div class="cv-euro-contact-item" data-editor-tab="tab-profile" data-editor-focus="input-linkedin">${ICONS.linkedin} LinkedIn : <a href="${formatLinkedinHref(cvData.contact.linkedin)}" target="_blank" style="color:inherit; text-decoration:none;">${cvData.contact.linkedin}</a></div>`);
    if (cvData.contact.github) contactItems.push(`<div class="cv-euro-contact-item" data-editor-tab="tab-profile" data-editor-focus="input-github">${ICONS.github} GitHub : <a href="${formatGithubHref(cvData.contact.github)}" target="_blank" style="color:inherit; text-decoration:none;">${cvData.contact.github}</a></div>`);
    if (cvData.contact.website) contactItems.push(`<div class="cv-euro-contact-item" data-editor-tab="tab-profile" data-editor-focus="input-website">${ICONS.website} Site Web : <a href="${formatHref(cvData.contact.website)}" target="_blank" style="color:inherit; text-decoration:none;">${cvData.contact.website}</a></div>`);
    if (cvData.contact.driver) contactItems.push(`<div class="cv-euro-contact-item" data-editor-tab="tab-profile" data-editor-focus="input-driver">${ICONS.driver} Permis : ${cvData.contact.driver}</div>`);

    let contactHTML = "";
    if (contactItems.length > 0) {
        contactHTML = `
        <div class="cv-euro-row">
        <div class="cv-euro-left" data-editor-tab="tab-profile">Coordonnées</div>
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
            europass<span>★</span>
        </div>
        <div class="cv-euro-header-text">
            <div>
            <h1 class="cv-euro-name" data-editor-tab="tab-profile" data-editor-focus="input-name">${cvData.contact.name}</h1>
            <p class="cv-euro-title" data-editor-tab="tab-profile" data-editor-focus="input-title-sub">${cvData.contact.title_sub}</p>
            </div>
            ${pfpHTML}
        </div>
        </header>

        ${contactHTML}

        ${cvData.profile && cvData.profile.trim() && !cvData.hidden_sections?.profile ? `
        <div class="cv-euro-row">
            <div class="cv-euro-left" data-editor-tab="tab-profile" data-section-title="profile">${getHdg('profile', 'Profil')}</div>
            <div class="cv-euro-right">
            <p style="line-height:1.45; text-align:justify;" data-editor-tab="tab-profile" data-editor-focus="input-profile">${cvData.profile}</p>
            </div>
        </div>
        ` : ''}

        ${cvData.experiences && cvData.experiences.length > 0 && !cvData.hidden_sections?.experiences ? `
        <div class="cv-euro-row">
            <div class="cv-euro-left" data-editor-tab="tab-experiences" data-section-title="experiences">${getHdg('experiences', 'Expériences')}</div>
            <div class="cv-euro-right">
            ${expHTML}
            </div>
        </div>
        ` : ''}

        ${cvData.hidden_sections?.formations ? '' : formHTML}

        ${cvData.projects && cvData.projects.length > 0 && !cvData.hidden_sections?.projects ? `
        <div class="cv-euro-row">
            <div class="cv-euro-left" data-editor-tab="tab-projects" data-section-title="projects">${getHdg('projects', 'Projets')}</div>
            <div class="cv-euro-right">
            ${projHTML}
            </div>
        </div>
        ` : ''}

        ${cvData.skills && cvData.skills.length > 0 && !cvData.hidden_sections?.skills ? `
        <div class="cv-euro-row">
            <div class="cv-euro-left" data-editor-tab="tab-skills" data-section-title="skills">${getHdg('skills', 'Compétences')}</div>
            <div class="cv-euro-right">
            ${skillsHTML}
            </div>
        </div>
        ` : ''}

        ${cvData.education && cvData.education.length > 0 && !cvData.hidden_sections?.education ? `
        <div class="cv-euro-row">
            <div class="cv-euro-left" data-editor-tab="tab-education" data-section-title="education">${getHdg('education', 'Éducation')}</div>
            <div class="cv-euro-right">
            ${eduHTML}
            </div>
        </div>
        ` : ''}

        ${cvData.languages && cvData.languages.length > 0 && !cvData.hidden_sections?.languages ? `
        <div class="cv-euro-row">
            <div class="cv-euro-left" data-editor-tab="tab-education" data-section-title="languages">${getHdg('languages', 'Langues')}</div>
            <div class="cv-euro-right">
            <ul class="cv-euro-bullets" style="list-style-type:none; padding-left:0; margin:0;">${langHTML}</ul>
            </div>
        </div>
        ` : ''}

        ${(cvData.certifications && cvData.certifications.length > 0 && !cvData.hidden_sections?.certifications) || (cvData.activities && cvData.activities.length > 0 && !cvData.hidden_sections?.activities) || (cvData.interests && cvData.interests.length > 0 && !cvData.hidden_sections?.interests) ? `
        <div class="cv-euro-row">
            <div class="cv-euro-left" data-editor-tab="tab-education" data-section-title="languages">${getHdg('languages', 'Divers')}</div>
            <div class="cv-euro-right">
            ${cvData.certifications && cvData.certifications.length > 0 && !cvData.hidden_sections?.certifications ? `
                <div style="font-weight:700; color:#0055a5; margin-bottom:0.25rem;" data-editor-tab="tab-education" data-section-title="certifications">${getHdg('certifications', 'Certifications')}</div>
                <ul class="cv-euro-bullets" style="margin-bottom:0.5rem;">${certsHTML}</ul>
            ` : ''}
            ${cvData.activities && cvData.activities.length > 0 && !cvData.hidden_sections?.activities ? `
                <div style="font-weight:700; color:#0055a5; margin-bottom:0.25rem; margin-top:0.4rem;" data-editor-tab="tab-education" data-section-title="activities">${getHdg('activities', 'Activités')}</div>
                <ul class="cv-euro-bullets" style="margin-bottom:0.5rem;">${actHTML}</ul>
            ` : ''}
            ${cvData.interests && cvData.interests.length > 0 && !cvData.hidden_sections?.interests ? `
                <div style="font-weight:700; color:#0055a5; margin-bottom:0.25rem; margin-top:0.4rem;" data-editor-tab="tab-education" data-section-title="interests">${getHdg('interests', 'Intérêts')}</div>
                <div style="font-size:0.7rem; color:#444444;">${cvData.interests.map((item, idx) => `<span data-editor-tab="tab-education" data-editor-target="interests" data-editor-index="${idx}" data-editor-field="value">${item}</span>`).join(', ')}</div>
            ` : ''}
            </div>
        </div>
        ` : ''}
    </div>`;
}

let isRenderingPreview = false;

window.getHdg = function(key, def) { return (cvData.headings && cvData.headings[key]) || def; };

function renderPreview() {
    isRenderingPreview = true;
    
    if (cvData && cvData.contact && cvData.contact.name) {
        document.title = `CV ${cvData.contact.name}`;
    } else {
        document.title = "CV Maker";
    }

    const printContainer = document.getElementById('print-preview-container');
    const screenContainer = document.getElementById('screen-preview-container');

    // Ensure CSS rules are up-to-date with current hidden_fields
    applyDesignStyles();

    // Store original data and blank out hidden fields to prevent them (and their separators) from being rendered
    const originalCvData = cvData;
    try {
        if (cvData.hidden_fields) {
            cvData = JSON.parse(JSON.stringify(originalCvData));
            Object.keys(cvData.hidden_fields).forEach(path => {
                if (cvData.hidden_fields[path]) {
                    const parts = path.split('.');
                    let current = cvData;
                    for (let i = 0; i < parts.length - 1; i++) {
                        if (current && current[parts[i]]) current = current[parts[i]];
                    }
                    if (current && current[parts[parts.length - 1]] !== undefined) {
                        if (Array.isArray(current)) {
                            current[parts[parts.length - 1]] = null;
                        } else {
                            current[parts[parts.length - 1]] = "";
                        }
                    }
                }
            });

            // Filter out nulls from lists
            ['experiences', 'formations', 'languages', 'skills', 'projects'].forEach(key => {
                if (cvData[key]) {
                    cvData[key] = cvData[key].filter(item => item !== null);
                }
            });
        }

        // 1. Generate full layout HTML inside the print container
        let layoutHTML = '';
        if (currentLayout === 'designed') {
            layoutHTML = renderDesignedLayout();
        } else if (currentLayout === 'professional') {
            layoutHTML = renderProfessionalLayout();
        } else if (currentLayout === 'sidebar') {
            layoutHTML = renderSidebarLayout();
        } else if (currentLayout === 'minimalist') {
            layoutHTML = renderMinimalistLayout();
        } else if (currentLayout === 'europass') {
            layoutHTML = renderEuropassLayout();
        } else {
            layoutHTML = renderATSLayout();
        }
        printContainer.innerHTML = layoutHTML;
    } finally {
        cvData = originalCvData;
    }

    // Attach data attributes to connect preview elements to their editor sections
    attachEditorBindings(printContainer);

    // 2. Determine conversion from page height and margins to pixels
    const dummyPage = document.createElement('div');
    dummyPage.style.height = '297mm';
    dummyPage.style.position = 'absolute';
    dummyPage.style.visibility = 'hidden';
    document.body.appendChild(dummyPage);
    const pageHeightPx = dummyPage.offsetHeight;
    document.body.removeChild(dummyPage);

    const marginMm = (cvData.design && cvData.design.page_margin !== undefined) ? cvData.design.page_margin : 15;
    const dummyMargin = document.createElement('div');
    dummyMargin.style.height = `${marginMm}mm`;
    dummyMargin.style.position = 'absolute';
    dummyMargin.style.visibility = 'hidden';
    document.body.appendChild(dummyMargin);
    const marginHeightPx = dummyMargin.offsetHeight;
    document.body.removeChild(dummyMargin);

    const pageContentHeightPx = pageHeightPx - (2 * marginHeightPx);

    // 3. Clear any existing spacers
    printContainer.querySelectorAll('.cv-layout-spacer').forEach(el => el.remove());

    // 4. Run spacer insertion algorithm to prevent element splitting
    const items = printContainer.querySelectorAll(`
    p, li, h1, h2, h3, h4, h5, h6,
    .cv-designed-cardtitle,
    .cv-prof-itemhead,
    .cv-ats-itemhead,
    .cv-sidebar-itemhead,
    .cv-mini-itemhead,
    .cv-euro-itemhead,
    .cv-designed-sectitle,
    .cv-prof-sectitle,
    .cv-ats-sectitle,
    .cv-sidebar-right-title,
    .cv-sidebar-left-title,
    .cv-mini-sectitle,
    .cv-euro-sectitle,
    .skill-cat,
    .cv-prof-skillrow,
    .cv-designed-simpleitem,
    .cv-mini-skillcat,
    .cv-sidebar-left-section
    `);

    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.classList.contains('cv-layout-spacer')) continue;

        // Calculate absolute top offset relative to printContainer
        let itemTop = 0;
        let p = item;
        while (p && p !== printContainer) {
            itemTop += p.offsetTop;
            p = p.offsetParent;
        }

        const itemHeight = item.offsetHeight;
        const itemBottom = itemTop + itemHeight;

        // Find boundary index
        const pageIndex = Math.floor(itemTop / pageContentHeightPx);
        const boundary = (pageIndex + 1) * pageContentHeightPx;

        // Push element to next page if it crosses the boundary and can fit on the next page
        if (itemTop < boundary && itemBottom > boundary && itemHeight <= pageContentHeightPx) {
            let targetElement = item;

            const getElemTop = (el) => {
                let top = 0;
                let p = el;
                while (p && p !== printContainer) {
                    top += p.offsetTop;
                    p = p.offsetParent;
                }
                return top;
            };

            const isTitleOrHeader = (el) => {
                if (!el) return false;
                return el.classList.contains('cv-designed-sectitle') ||
                    el.classList.contains('cv-prof-sectitle') ||
                    el.classList.contains('cv-ats-sectitle') ||
                    el.classList.contains('cv-sidebar-right-title') ||
                    el.classList.contains('cv-sidebar-left-title') ||
                    el.classList.contains('cv-mini-sectitle') ||
                    el.classList.contains('cv-euro-sectitle') ||
                    el.classList.contains('cv-designed-cardtitle') ||
                    el.classList.contains('cv-prof-itemhead') ||
                    el.classList.contains('cv-ats-itemhead') ||
                    el.classList.contains('cv-sidebar-itemhead') ||
                    el.classList.contains('cv-mini-itemhead') ||
                    el.classList.contains('cv-euro-itemhead') ||
                    el.tagName.match(/^H[1-6]$/i);
            };

            const isSectionTitle = (el) => {
                if (!el) return false;
                return el.classList.contains('cv-designed-sectitle') ||
                    el.classList.contains('cv-prof-sectitle') ||
                    el.classList.contains('cv-ats-sectitle') ||
                    el.classList.contains('cv-sidebar-right-title') ||
                    el.classList.contains('cv-sidebar-left-title') ||
                    el.classList.contains('cv-mini-sectitle') ||
                    el.classList.contains('cv-euro-sectitle') ||
                    el.tagName.match(/^H[1-6]$/i);
            };

            let prevCandidate = targetElement.previousElementSibling;
            if (!prevCandidate && targetElement.parentElement) {
                if (targetElement.parentElement.tagName.toLowerCase() === 'ul' || targetElement.parentElement.tagName.toLowerCase() === 'ol') {
                    prevCandidate = targetElement.parentElement.previousElementSibling;
                }
            }

            if (prevCandidate && isTitleOrHeader(prevCandidate)) {
                const prevTop = getElemTop(prevCandidate);
                const prevPageIndex = Math.floor(prevTop / pageContentHeightPx);
                if (prevPageIndex === pageIndex) {
                    targetElement = prevCandidate;
                    itemTop = prevTop;

                    let prevSecCandidate = targetElement.previousElementSibling;
                    if (prevSecCandidate && isSectionTitle(prevSecCandidate)) {
                        const secTop = getElemTop(prevSecCandidate);
                        const secPageIndex = Math.floor(secTop / pageContentHeightPx);
                        if (secPageIndex === pageIndex) {
                            targetElement = prevSecCandidate;
                            itemTop = secTop;
                        }
                    }
                }
            }

            // Convert pixel spacer height to mm using the measured DPI ratio
            const spacerHeight = boundary - itemTop;
            const pxPerMm = pageHeightPx / 297;
            const spacerHeightMm = spacerHeight / pxPerMm;

            const isListItem = targetElement.tagName.toLowerCase() === 'li';
            const spacer = document.createElement(isListItem ? 'li' : 'div');
            spacer.className = 'cv-layout-spacer';
            spacer.style.height = `${spacerHeightMm}mm`;
            if (isListItem) {
                spacer.style.listStyleType = 'none';
            }
            targetElement.parentNode.insertBefore(spacer, targetElement);
        }
    }

    // 5. Measure total height with spacers included based on actual content elements
    let maxContentBottom = 0;
    const contentNodes = printContainer.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6, img, svg, a, span, .cv-designed-cardtitle, .cv-prof-itemhead, .cv-ats-itemhead, .cv-sidebar-itemhead, .cv-mini-itemhead, .cv-euro-itemhead, .cv-prof-sectitle, .cv-designed-sectitle, .cv-ats-sectitle, .cv-sidebar-right-title, .cv-sidebar-left-title, .cv-mini-sectitle, .cv-euro-sectitle');
    contentNodes.forEach(el => {
        if (el.offsetHeight > 0) {
            let top = 0;
            let p = el;
            while (p && p !== printContainer) {
                top += p.offsetTop;
                p = p.offsetParent;
            }
            const bottom = top + el.offsetHeight;
            if (bottom > maxContentBottom) {
                maxContentBottom = bottom;
            }
        }
    });

    const effectiveHeight = Math.max(
        maxContentBottom > 0 ? (maxContentBottom - 5) : 0,
        printContainer.offsetHeight,
        printContainer.scrollHeight
    );
    const totalPages = Math.max(1, Math.ceil(effectiveHeight / pageContentHeightPx));

    // 6. Clear screen container and populate A4 sliced pages
    screenContainer.innerHTML = '';

    // Determine theme background color for visual continuity
    let bg = '#ffffff';
    if (currentLayout === 'designed') {
        bg = cvData.themes.designed.bg_color || '#0b0f19';
    }

    const pxPerMm = pageHeightPx / 297;
    const pageContentHeightMm = pageContentHeightPx / pxPerMm;

    for (let i = 0; i < totalPages; i++) {
        const pageSheet = document.createElement('div');
        pageSheet.className = 'a4-page-sheet';
        pageSheet.style.backgroundColor = bg;

        // Add page number badge
        const pageBadge = document.createElement('div');
        pageBadge.style.position = 'absolute';
        pageBadge.style.bottom = '8px';
        pageBadge.style.right = '12px';
        pageBadge.style.fontSize = '10px';
        pageBadge.style.fontWeight = 'bold';
        pageBadge.style.color = (currentLayout === 'designed') ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
        pageBadge.style.zIndex = '999';
        pageBadge.style.pointerEvents = 'none';
        pageBadge.innerText = `Page ${i + 1} / ${totalPages}`;

        const showPageNum = cvData.design && cvData.design.show_page_number === true;
        pageBadge.style.display = showPageNum ? 'block' : 'none';

        pageSheet.appendChild(pageBadge);

        const pageContentWrapper = document.createElement('div');
        pageContentWrapper.className = 'a4-page-content-wrapper';
        pageContentWrapper.style.marginTop = `${marginMm}mm`;
        pageContentWrapper.style.marginLeft = `${marginMm}mm`;
        pageContentWrapper.style.width = `calc(210mm - ${2 * marginMm}mm)`;
        pageContentWrapper.style.height = `calc(297mm - ${2 * marginMm}mm)`;

        const pageClone = document.createElement('div');
        pageClone.className = 'a4-page-clone';
        pageClone.style.width = `calc(210mm - ${2 * marginMm}mm)`;
        pageClone.innerHTML = printContainer.innerHTML;
        pageClone.style.transform = `translateY(-${i * pageContentHeightMm}mm)`;

        pageContentWrapper.appendChild(pageClone);
        pageSheet.appendChild(pageContentWrapper);
        screenContainer.appendChild(pageSheet);
    }
}

/* ----------------------------------------------------
    10. FORM FIELDS POPULATOR & DYNAMIC LISTS
    ---------------------------------------------------- */
function populateFormInputs() {
    setTimeout(renderThemeSwatches, 100);
    if (document.getElementById('design-layout-picker')) {
        document.getElementById('design-layout-picker').value = currentLayout;
    }

    document.getElementById('input-name').value = cvData.contact.name;
    document.getElementById('input-title-sub').value = cvData.contact.title_sub;
    document.getElementById('input-email').value = cvData.contact.email;
    document.getElementById('input-phone').value = cvData.contact.phone;
    document.getElementById('input-location').value = cvData.contact.location;
    document.getElementById('input-linkedin').value = cvData.contact.linkedin || "";
    document.getElementById('input-github').value = cvData.contact.github || "";
    document.getElementById('input-website').value = cvData.contact.website || "";
    document.getElementById('input-driver').value = cvData.contact.driver || "";

    // Sync header social links dynamically
    const linkGh = document.getElementById('brand-link-github');
    const linkLi = document.getElementById('brand-link-linkedin');
    const linkGm = document.getElementById('brand-link-gmail');
    if (linkGh) linkGh.href = formatGithubHref(cvData.contact.github);
    if (linkLi) linkLi.href = formatLinkedinHref(cvData.contact.linkedin);
    if (linkGm) linkGm.href = formatEmailHref(cvData.contact.email);

    document.getElementById('input-profile').value = cvData.profile;

    if (cvData.headings) {
        Object.keys(cvData.headings).forEach(section => {
            const input = document.querySelector(`.section-title-input[data-section="${section}"]`);
            if (input) input.value = cvData.headings[section];
        });
    }

    // Image Size Slider initialization
    const sz = cvData.contact.image_size || 80;
    document.getElementById('input-image-size').value = sz;
    document.getElementById('lbl-image-size').innerText = `Taille de l'image : ${sz}px`;

    // Design settings initialization
    if (!cvData.design) {
        cvData.design = {
            "font_family": "Inter",
            "base_size": 14,
            "line_height": 1.45,
            "page_margin": 15,
            "section_spacing": 1.2,
            "show_pfp": true,
            "show_page_number": true
        };
    }

    if (document.getElementById('design-font-family')) {
        document.getElementById('design-font-family').value = cvData.design.font_family || "Inter";
        document.getElementById('design-base-size').value = cvData.design.base_size || 14;
        document.getElementById('lbl-design-base-size').innerText = `Taille de police : ${cvData.design.base_size || 14}px`;
        document.getElementById('design-line-height').value = cvData.design.line_height || 1.45;
        document.getElementById('lbl-design-line-height').innerText = `Interligne : ${cvData.design.line_height || 1.45}`;
        document.getElementById('design-page-margin').value = cvData.design.page_margin || 15;
        document.getElementById('lbl-design-page-margin').innerText = `Marges de page : ${cvData.design.page_margin || 15}mm`;
        document.getElementById('design-section-spacing').value = cvData.design.section_spacing || 1.2;
        document.getElementById('lbl-design-section-spacing').innerText = `Espacement des sections : ${cvData.design.section_spacing || 1.2}rem`;
        document.getElementById('design-show-pfp').checked = cvData.design.show_pfp !== false;
        document.getElementById('design-show-page-number').checked = cvData.design.show_page_number === true;

        // Image design controls
        document.getElementById('design-pfp-shape').value = cvData.design.pfp_shape || 'circle';
        document.getElementById('design-pfp-border-width').value = cvData.design.pfp_border_width ?? 2;
        document.getElementById('lbl-design-pfp-border-width').innerText = `Bordure : ${cvData.design.pfp_border_width ?? 2}px`;
        document.getElementById('design-pfp-border-color').value = cvData.design.pfp_border_color || '#d4af37';
        document.getElementById('design-pfp-shadow').value = cvData.design.pfp_shadow ?? 15;
        document.getElementById('lbl-design-pfp-shadow').innerText = `Ombre : ${cvData.design.pfp_shadow ?? 15}px`;
        document.getElementById('design-pfp-opacity').value = cvData.design.pfp_opacity ?? 1;
        document.getElementById('lbl-design-pfp-opacity').innerText = `Opacité : ${Math.round((cvData.design.pfp_opacity ?? 1) * 100)}%`;
        document.getElementById('design-pfp-offset-x').value = cvData.design.pfp_offset_x ?? 0;
        document.getElementById('lbl-design-pfp-offset-x').innerText = `Décalage horizontal : ${cvData.design.pfp_offset_x ?? 0}px`;
        document.getElementById('design-pfp-offset-y').value = cvData.design.pfp_offset_y ?? 0;
        document.getElementById('lbl-design-pfp-offset-y').innerText = `Décalage vertical : ${cvData.design.pfp_offset_y ?? 0}px`;
    }

    if (document.getElementById('design-picker-bg')) {
        document.getElementById('design-picker-bg').value = cvData.themes.designed.bg_color;
        document.getElementById('design-picker-gold').value = cvData.themes.designed.gold_primary;
        document.getElementById('design-picker-navy').value = cvData.themes.professional.navy_primary;
        if (cvData.themes.sidebar) {
            document.getElementById('design-picker-sidebar-bg').value = cvData.themes.sidebar.sidebar_bg || "#1e293b";
            document.getElementById('design-picker-sidebar-accent').value = cvData.themes.sidebar.sidebar_accent || "#3b82f6";
        }
    }

    applyDesignStyles();

    updatePfpPreview();

    renderList('experiences');
    renderList('formations');
    renderList('projects');
    renderList('education');
    renderList('languages');

    renderSkillsList();

    renderSimpleList('certifications');
    renderSimpleList('activities');
    renderSimpleList('interests');

    updateSectionVisibilityUI();
    
    setTimeout(() => {
        isRenderingPreview = false;
    }, 100);
}

function toggleSectionVisibility(key) {
    if (!cvData.hidden_sections) {
        cvData.hidden_sections = {};
    }
    cvData.hidden_sections[key] = !cvData.hidden_sections[key];
    saveAndSync();
    updateSectionVisibilityUI();
}

function updateSectionVisibilityUI() {
    if (!cvData.hidden_sections) cvData.hidden_sections = {};

    const sections = ['profile', 'experiences', 'formations', 'projects', 'skills', 'education', 'certifications', 'activities', 'languages', 'interests'];

    sections.forEach(key => {
        const btn = document.getElementById(`btn-hide-${key}`);
        const isHidden = !!cvData.hidden_sections[key];

        if (btn) {
            if (isHidden) {
                btn.innerHTML = `<svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
                btn.classList.add('is-hidden');
                btn.title = "Cliquez pour afficher cette section sur le CV";
            } else {
                btn.innerHTML = `<svg style="width:14px;height:14px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
                btn.classList.remove('is-hidden');
                btn.title = "Cliquez pour masquer cette section du CV (les données sont conservées)";
            }
        }

        let targetEl = null;
        if (key === 'profile') {
            const inputProf = document.getElementById('input-profile');
            if (inputProf) targetEl = inputProf.closest('.form-card');
        } else {
            targetEl = document.getElementById(`list-${key}`);
        }

        if (targetEl) {
            if (isHidden) {
                targetEl.classList.add('section-hidden-dimmed');
            } else {
                targetEl.classList.remove('section-hidden-dimmed');
            }
        }
    });
}

// Dynamic Skill Categories panel renderer
function renderSkillsList() {
    const container = document.getElementById('list-skills');
    container.innerHTML = "";

    cvData.skills.forEach((s, index) => {
        const card = document.createElement('div');
        card.className = "form-card";
        card.innerHTML = `
        <div class="form-group" style="margin-bottom:0.5rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--sp-1);">
                <label style="margin-bottom:0; flex:1;">Nom de Catégorie</label>
                <div class="field-actions-container" style="display:flex; gap:var(--sp-1); align-items:center;">
                    <button class="btn-icon-delete" onclick="deleteSkillCategory(${index})" title="Supprimer cette catégorie"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg></button>
                </div>
            </div>
            <input type="text" data-field="category" value="${s.category}" oninput="updateSkillCategory(${index}, 'category', this.value)">
        </div>
        <div class="form-group">
        <label>Compétences (Séparez par virgules)</label>
        <textarea rows="5" data-field="value" placeholder="HTML, CSS, JavaScript, ..." oninput="updateSkillCategory(${index}, 'value', this.value)">${s.value}</textarea>
        </div>
    `;
        container.appendChild(card);
    });
}

function addSkillCategory() {
    cvData.skills.push({ "category": "Nouvelle Catégorie", "value": "A, B, C" });
    renderSkillsList();
    saveAndSync();
}

function updateSkillCategory(index, field, val) {
    cvData.skills[index][field] = val;
    saveAndSync();
}

function deleteSkillCategory(index) {
    cvData.skills.splice(index, 1);
    renderSkillsList();
    saveAndSync();
}

// Render lists as compact collapsible cards
function renderList(key) {
    const container = document.getElementById(`list-${key}`);
    container.innerHTML = "";

    cvData[key].forEach((item, index) => {
        const isOpen = openCollapseKeys[key] === index;
        const isHidden = cvData.hidden_fields && cvData.hidden_fields[`${key}.${index}`];
        const eyeIcon = isHidden ? 
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>' : 
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';

        let titleText = "";
        let subtitleText = "";
        let fields = "";

        if (key === 'experiences' || key === 'formations') {
            titleText = key === 'experiences' ? (item.title || "Poste sans titre") : (item.title || "Stage / Formation sans titre");
            subtitleText = `${item.company || (key === 'experiences' ? 'Entreprise' : 'Organisme')} | ${item.period || 'Période'}`;
            fields = `
        <div class="form-group">
            <label>${key === 'experiences' ? 'Intitulé du Poste' : 'Intitulé du Stage / Formation'}</label>
            <input type="text" data-field="title" value="${item.title}" oninput="updateListItem('${key}', ${index}, 'title', this.value)">
        </div>
        <div class="form-group">
            <label>${key === 'experiences' ? 'Entreprise' : 'Organisme / Établissement'}</label>
            <input type="text" data-field="company" value="${item.company}" oninput="updateListItem('${key}', ${index}, 'company', this.value)">
        </div>
        <div class="form-row">
            <div class="form-group">
            <label>Période</label>
            <input type="text" data-field="period" value="${item.period}" oninput="updateListItem('${key}', ${index}, 'period', this.value)">
            </div>
            <div class="form-group">
            <label>Lieu</label>
            <input type="text" data-field="location" value="${item.location}" oninput="updateListItem('${key}', ${index}, 'location', this.value)">
            </div>
        </div>
        <div class="form-group">
            <label>${key === 'experiences' ? 'Missions (Une mission par ligne)' : 'Détails / Missions (Un par ligne)'}</label>
            <textarea rows="6" data-field="bullets" oninput="updateListBullets('${key}', ${index}, this.value)">${item.bullets.join('\n')}</textarea>
        </div>`;
        } else if (key === 'projects') {
            titleText = item.title || "Projet sans titre";
            subtitleText = item.stack || "Tech stack";
            fields = `
        <div class="form-group">
            <label>Titre du Projet</label>
            <input type="text" data-field="title" value="${item.title}" oninput="updateListItem('${key}', ${index}, 'title', this.value)">
        </div>
        <div class="form-group">
            <label>Stack Technique</label>
            <input type="text" data-field="stack" value="${item.stack}" oninput="updateListItem('${key}', ${index}, 'stack', this.value)">
        </div>
        <div class="form-group">
            <label>Description du projet</label>
            <textarea rows="6" data-field="description" oninput="updateListItem('${key}', ${index}, 'description', this.value)">${item.description}</textarea>
        </div>`;
        } else if (key === 'education') {
            titleText = item.degree || "Diplôme";
            subtitleText = `${item.school || 'Établissement'} | ${item.period || 'Période'}`;
            fields = `
        <div class="form-group">
            <label>Intitulé du Diplôme / Formation</label>
            <input type="text" data-field="degree" value="${item.degree}" oninput="updateListItem('${key}', ${index}, 'degree', this.value)">
        </div>
        <div class="form-group">
            <label>Établissement</label>
            <input type="text" data-field="school" value="${item.school}" oninput="updateListItem('${key}', ${index}, 'school', this.value)">
        </div>
        <div class="form-group">
            <label>Période</label>
            <input type="text" data-field="period" value="${item.period}" oninput="updateListItem('${key}', ${index}, 'period', this.value)">
        </div>`;
        } else if (key === 'languages') {
            titleText = item.name || "Nouvelle langue";
            subtitleText = item.level || "Niveau";
            fields = `
        <div class="form-row">
            <div class="form-group">
            <label>Langue</label>
            <input type="text" data-field="name" value="${item.name}" oninput="updateListItem('${key}', ${index}, 'name', this.value)">
            </div>
            <div class="form-group">
            <label>Niveau</label>
            <input type="text" data-field="level" value="${item.level}" oninput="updateListItem('${key}', ${index}, 'level', this.value)">
            </div>
        </div>`;
        }

        const div = document.createElement('div');
        div.className = `collapsible-card ${isOpen ? 'open' : ''}`;
        div.setAttribute('data-card-key', key);
        div.setAttribute('data-card-index', index);
        div.innerHTML = `
        <div class="collapsible-header" onclick="toggleCollapse('${key}', ${index})">
        <div class="collapsible-header-info">
            <span class="collapsible-header-title">${titleText}</span>
            <span class="collapsible-header-subtitle">${subtitleText}</span>
        </div>
        <div class="collapsible-header-actions">
            <button class="btn-icon-eye ${isHidden ? 'field-hidden' : ''}" onclick="event.stopPropagation(); toggleListItemVisibility('${key}', ${index}, this)" title="Afficher/Masquer cet élément">
                ${eyeIcon}
            </button>
            <button class="btn-icon-delete" onclick="event.stopPropagation(); deleteItem('${key}', ${index})" title="Supprimer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
            </button>
            <svg class="collapsible-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </div>
        </div>
        <div class="collapsible-content">
            <div class="card-content-panel">
                ${fields}
            </div>
        </div>
    `;
        container.appendChild(div);
    });

    if (typeof injectFieldDesignButtons === 'function') injectFieldDesignButtons();
}

function renderSimpleList(key) {
    const container = document.getElementById(`list-${key}`);
    container.innerHTML = "";

    cvData[key].forEach((item, index) => {
        const isHidden = cvData.hidden_fields && cvData.hidden_fields[`${key}.${index}`];
        const eyeIcon = isHidden ? 
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>' : 
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';

        const div = document.createElement('div');
        div.className = 'simple-list-row';
        div.innerHTML = `
        <button class="btn-icon-eye ${isHidden ? 'field-hidden' : ''}" onclick="toggleListItemVisibility('${key}', ${index}, this)" title="Afficher/Masquer">
            ${eyeIcon}
        </button>
        <input class="simple-list-input" type="text" data-field="value" data-index="${index}" value="${item}" oninput="updateSimpleListItem('${key}', ${index}, this.value)">
        <button class="btn-icon-delete" onclick="deleteSimpleItem('${key}', ${index})" title="Supprimer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>
        </button>
    `;
        container.appendChild(div);
    });

    if (typeof injectFieldDesignButtons === 'function') injectFieldDesignButtons();
}

/* Input bindings */
function updateField(path, val) {
    const parts = path.split('.');
    if (parts.length === 2) {
        cvData[parts[0]][parts[1]] = val;
    } else {
        cvData[path] = val;
    }
    saveAndSync();
}

window.updateSectionTitle = function(section, value) {
    if (!cvData.headings) cvData.headings = {};
    cvData.headings[section] = value;
    saveAndSync();
    renderPreview();
};


function updateListItem(key, index, field, val) {
    cvData[key][index][field] = val;
    saveAndSync();
}

function updateListBullets(key, index, text) {
    cvData[key][index].bullets = text.split('\n').filter(line => line.trim());
    saveAndSync();
}

function updateSimpleListItem(key, index, val) {
    cvData[key][index] = val;
    saveAndSync();
}

function addItem(key) {
    let newItem = {};
    if (key === 'experiences') {
        newItem = { "title": "Nouveau Poste", "company": "Entreprise", "location": "Lieu", "period": "Période", "bullets": ["Nouvelle mission"] };
    } else if (key === 'formations') {
        newItem = { "title": "Nouveau Stage / Formation", "company": "Organisme", "location": "Lieu", "period": "Période", "bullets": ["Nouveau détail"] };
    } else if (key === 'projects') {
        newItem = { "title": "Nouveau Projet", "stack": "Technologies", "description": "Description du projet." };
    } else if (key === 'education') {
        newItem = { "degree": "Diplôme", "school": "Établissement", "period": "Période" };
    } else if (key === 'languages') {
        newItem = { "name": "Langue", "level": "Niveau" };
    }
    cvData[key].push(newItem);
    openCollapseKeys[key] = cvData[key].length - 1; // Auto-expand new item
    renderList(key);
    saveAndSync();
}

function deleteItem(key, index) {
    cvData[key].splice(index, 1);
    delete openCollapseKeys[key];
    renderList(key);
    saveAndSync();
}

function addSimpleItem(key) {
    cvData[key].push("Nouvelle entrée");
    renderSimpleList(key);
    saveAndSync();
}

function deleteSimpleItem(key, index) {
    cvData[key].splice(index, 1);
    renderSimpleList(key);
    saveAndSync();
}

function changeLayout(layout) {
    currentLayout = layout;
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

    renderThemeSwatches();
    renderPreview();
}

function darkenColor(hex, percent) {
    hex = hex.replace('#', '');
    let r = parseInt(hex.substr(0, 2), 16);
    let g = parseInt(hex.substr(2, 2), 16);
    let b = parseInt(hex.substr(4, 2), 16);
    r = Math.max(0, Math.floor(r * (1 - percent / 100)));
    g = Math.max(0, Math.floor(g * (1 - percent / 100)));
    b = Math.max(0, Math.floor(b * (1 - percent / 100)));
    return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

function updateThemeColor(type, hex) {
    if (type === 'bg') {
        cvData.themes.designed.bg_color = hex;
        document.documentElement.style.setProperty('--design-bg', hex);
        const p = document.getElementById('design-picker-bg');
        if (p) p.value = hex;
    } else if (type === 'gold') {
        cvData.themes.designed.gold_primary = hex;
        const dark = darkenColor(hex, 15);
        cvData.themes.designed.gold_dark = dark;
        document.documentElement.style.setProperty('--design-gold', hex);
        document.documentElement.style.setProperty('--design-gold-dark', dark);
        const p = document.getElementById('design-picker-gold');
        if (p) p.value = hex;
    } else if (type === 'navy') {
        cvData.themes.professional.navy_primary = hex;
        document.documentElement.style.setProperty('--prof-navy', hex);
        const p = document.getElementById('design-picker-navy');
        if (p) p.value = hex;
    } else if (type === 'sidebar-bg') {
        if (!cvData.themes.sidebar) cvData.themes.sidebar = {};
        cvData.themes.sidebar.sidebar_bg = hex;
        document.documentElement.style.setProperty('--sidebar-bg', hex);
        const p = document.getElementById('design-picker-sidebar-bg');
        if (p) p.value = hex;
    } else if (type === 'sidebar-accent') {
        if (!cvData.themes.sidebar) cvData.themes.sidebar = {};
        cvData.themes.sidebar.sidebar_accent = hex;
        document.documentElement.style.setProperty('--sidebar-accent', hex);
        const p = document.getElementById('design-picker-sidebar-accent');
        if (p) p.value = hex;
    }
}



const PRESETS = {
    designed: [
        // Dark backgrounds with white text
        { bg: "#0b0f19", gold: "#f59e0b", name: "Midnight Gold", font: "Playfair Display", textColors: { name: "#ffffff", title: "#d1d5db", heading: "#f59e0b", body: "#e2e8f0", muted: "#94a3b8" }, headingStyles: { textTransform: "uppercase", letterSpacing: "2px", textAlign: "center", borderBottom: "1px solid {accent}" } },
        { bg: "#0f172a", gold: "#38bdf8", name: "Slate & Cyan", font: "Montserrat", textColors: { name: "#f8fafc", title: "#cbd5e1", heading: "#38bdf8", body: "#f1f5f9", muted: "#94a3b8" }, headingStyles: { textTransform: "uppercase", fontWeight: "700", borderBottom: "3px solid {accent}" } },
        { bg: "#18181b", gold: "#f43f5e", name: "Zinc & Rose", font: "Lora", textColors: { name: "#ffffff", title: "#d4d4d8", heading: "#f43f5e", body: "#e4e4e7", muted: "#a1a1aa" }, headingStyles: { textTransform: "none", textAlign: "left", borderBottom: "1px dashed {accent}" } },
        { bg: "#064e3b", gold: "#fbbf24", name: "Forest & Gold", font: "Merriweather", textColors: { name: "#ecfdf5", title: "#a7f3d0", heading: "#fbbf24", body: "#d1fae5", muted: "#6ee7b7" }, headingStyles: { textTransform: "capitalize", borderBottom: "2px solid {accent}" } },
        { bg: "#1e1b4b", gold: "#a855f7", name: "Indigo & Purple", font: "Oswald", textColors: { name: "#ffffff", title: "#e0e7ff", heading: "#a855f7", body: "#c7d2fe", muted: "#818cf8" }, headingStyles: { textTransform: "uppercase", letterSpacing: "2px", textAlign: "center", borderBottom: "none" } },
        { bg: "#1c1917", gold: "#2dd4bf", name: "Stone & Teal", font: "Inter", textColors: { name: "#fafaf9", title: "#d6d3d1", heading: "#2dd4bf", body: "#e7e5e4", muted: "#a8a29e" }, headingStyles: { textTransform: "none", fontWeight: "600", borderBottom: "2px solid {accent}" } },
        { bg: "#0c1a2e", gold: "#f97316", name: "Abyss & Flame", font: "Roboto", textColors: { name: "#ffffff", title: "#bfdbfe", heading: "#f97316", body: "#dbeafe", muted: "#93c5fd" }, headingStyles: { textTransform: "uppercase", textAlign: "left", borderBottom: "1px solid #ccc" } },
        { bg: "#09090b", gold: "#22d3ee", name: "Obsidian & Ice", font: "Lato", textColors: { name: "#ffffff", title: "#d4d4d8", heading: "#22d3ee", body: "#f4f4f5", muted: "#a1a1aa" }, headingStyles: { textTransform: "none", borderBottom: "none" } },
        { bg: "#0d1117", gold: "#79f2b0", name: "GitHub Dark & Mint", font: "Open Sans", textColors: { name: "#c9d1d9", title: "#8b949e", heading: "#79f2b0", body: "#c9d1d9", muted: "#8b949e" }, headingStyles: { textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid {accent}" } },
        { bg: "#150926", gold: "#e879f9", name: "Void & Fuchsia", font: "Playfair Display", textColors: { name: "#f3e8ff", title: "#d8b4fe", heading: "#e879f9", body: "#e9d5ff", muted: "#c084fc" }, headingStyles: { textTransform: "capitalize", textAlign: "center", borderBottom: "2px solid {accent}" } },
        { bg: "#0a0a0a", gold: "#facc15", name: "Carbon & Neon Yellow", font: "Montserrat", textColors: { name: "#fafafa", title: "#a3a3a3", heading: "#facc15", body: "#e5e5e5", muted: "#737373" }, headingStyles: { textTransform: "uppercase", fontWeight: "800", borderBottom: "none" } },
        { bg: "#1a0533", gold: "#fb923c", name: "Midnight Grape & Sunset", font: "Lora", textColors: { name: "#fff5f5", title: "#fed7aa", heading: "#fb923c", body: "#ffedd5", muted: "#fdba74" }, headingStyles: { textTransform: "none", borderBottom: "1px dashed {accent}" } },
        { bg: "#012030", gold: "#4ade80", name: "Deep Ocean & Lime", font: "Inter", textColors: { name: "#f0fdf4", title: "#bbf7d0", heading: "#4ade80", body: "#dcfce7", muted: "#86efac" }, headingStyles: { textTransform: "uppercase", textAlign: "left", borderBottom: "2px solid {accent}" } },
        { bg: "#0f1923", gold: "#f0abfc", name: "Noir & Lavender", font: "Merriweather", textColors: { name: "#fae8ff", title: "#e879f9", heading: "#f0abfc", body: "#f5d0fe", muted: "#c084fc" }, headingStyles: { textTransform: "capitalize", borderBottom: "1px solid {accent}" } },
        { bg: "#1a1a2e", gold: "#e94560", name: "Deep Blue & Crimson", font: "Oswald", textColors: { name: "#ffffff", title: "#e2e8f0", heading: "#e94560", body: "#f8fafc", muted: "#cbd5e1" }, headingStyles: { textTransform: "uppercase", letterSpacing: "2px", borderBottom: "3px solid {accent}" } },
        // Light backgrounds with dark text
        { bg: "#ffffff", gold: "#0f172a", name: "Minimalist Light", font: "Inter", textColors: { name: "#0f172a", title: "#475569", heading: "#0f172a", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid #e2e8f0" } },
        { bg: "#f8fafc", gold: "#3b82f6", name: "Clean Slate", font: "Roboto", textColors: { name: "#1e293b", title: "#64748b", heading: "#3b82f6", body: "#334155", muted: "#94a3b8" }, headingStyles: { textTransform: "none", borderBottom: "2px solid {accent}" } },
        { bg: "#fafaf9", gold: "#1c1917", name: "Warm Stone", font: "Lora", textColors: { name: "#1c1917", title: "#57534e", heading: "#1c1917", body: "#44403c", muted: "#78716c" }, headingStyles: { textTransform: "capitalize", textAlign: "center", borderBottom: "1px double #1c1917" } },
        { bg: "#f0fdf4", gold: "#15803d", name: "Mint Fresh", font: "Montserrat", textColors: { name: "#14532d", title: "#166534", heading: "#15803d", body: "#166534", muted: "#22c55e" }, headingStyles: { textTransform: "uppercase", borderBottom: "2px solid {accent}" } },
        { bg: "#fffbeb", gold: "#b45309", name: "Cream & Amber", font: "Playfair Display", textColors: { name: "#78350f", title: "#92400e", heading: "#b45309", body: "#92400e", muted: "#d97706" }, headingStyles: { textTransform: "none", borderBottom: "1px dashed {accent}" } }
    ],
    professional: [
        // Professional uses light backgrounds by default, so text should be dark
        { navy: "#1e3a8a", name: "Corporate Navy", font: "Merriweather", textColors: { name: "#1e3a8a", title: "#475569", heading: "#1e3a8a", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", borderBottom: "2px solid {accent}" } },
        { navy: "#0f766e", name: "Teal", font: "Inter", textColors: { name: "#0f766e", title: "#475569", heading: "#0f766e", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "none", borderBottom: "1px solid #ddd" } },
        { navy: "#1c1917", name: "Graphite", font: "Montserrat", textColors: { name: "#1c1917", title: "#57534e", heading: "#1c1917", body: "#44403c", muted: "#78716c" }, headingStyles: { textTransform: "uppercase", letterSpacing: "1px", borderBottom: "3px solid {accent}" } },
        { navy: "#881337", name: "Maroon", font: "Playfair Display", textColors: { name: "#881337", title: "#475569", heading: "#881337", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "none", textAlign: "center", borderBottom: "1px double {accent}" } },
        { navy: "#312e81", name: "Indigo", font: "Roboto", textColors: { name: "#312e81", title: "#475569", heading: "#312e81", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "capitalize", borderBottom: "2px solid {accent}" } },
        { navy: "#1d4ed8", name: "Electric Blue", font: "Open Sans", textColors: { name: "#1d4ed8", title: "#475569", heading: "#1d4ed8", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", borderBottom: "1px solid {accent}" } },
        { navy: "#065f46", name: "Emerald", font: "Lato", textColors: { name: "#065f46", title: "#475569", heading: "#065f46", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", textAlign: "center", borderBottom: "2px solid {accent}" } },
        { navy: "#6b21a8", name: "Royal Purple", font: "Lora", textColors: { name: "#6b21a8", title: "#475569", heading: "#6b21a8", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "none", borderBottom: "1px dashed {accent}" } },
        { navy: "#7c2d12", name: "Terracotta", font: "Oswald", textColors: { name: "#7c2d12", title: "#475569", heading: "#7c2d12", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", letterSpacing: "2px", borderBottom: "2px solid {accent}" } },
        { navy: "#1a202c", name: "Slate Black", font: "Inter", textColors: { name: "#1a202c", title: "#475569", heading: "#1a202c", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", borderBottom: "3px solid {accent}" } },
        { navy: "#4c0519", name: "Dark Burgundy", font: "Merriweather", textColors: { name: "#4c0519", title: "#475569", heading: "#4c0519", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "capitalize", borderBottom: "1px double {accent}" } },
        { navy: "#14532d", name: "Forest Green", font: "Montserrat", textColors: { name: "#14532d", title: "#475569", heading: "#14532d", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", fontWeight: "700", borderBottom: "2px solid {accent}" } },
        { navy: "#1d2d6b", name: "Prussian Blue", font: "Playfair Display", textColors: { name: "#1d2d6b", title: "#475569", heading: "#1d2d6b", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "none", textAlign: "center", borderBottom: "1px solid {accent}" } },
        { navy: "#4b2c20", name: "Espresso", font: "Lora", textColors: { name: "#4b2c20", title: "#475569", heading: "#4b2c20", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "capitalize", borderBottom: "1px dashed {accent}" } },
        { navy: "#374151", name: "Storm Grey", font: "Inter", textColors: { name: "#374151", title: "#475569", heading: "#374151", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "none", borderBottom: "1px solid #e5e7eb" } },
        { navy: "#00695c", name: "Eucalyptus", font: "Roboto", textColors: { name: "#00695c", title: "#475569", heading: "#00695c", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", borderBottom: "2px solid {accent}" } },
        { navy: "#004d61", name: "Petrol Blue", font: "Open Sans", textColors: { name: "#004d61", title: "#475569", heading: "#004d61", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", letterSpacing: "1px", borderBottom: "2px solid {accent}" } },
        { navy: "#5b2333", name: "Wine Red", font: "Merriweather", textColors: { name: "#5b2333", title: "#475569", heading: "#5b2333", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "capitalize", borderBottom: "1px solid {accent}" } },
        { navy: "#2c3e50", name: "Wet Asphalt", font: "Lato", textColors: { name: "#2c3e50", title: "#475569", heading: "#2c3e50", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "none", borderBottom: "3px solid {accent}" } },
        { navy: "#1a1a2e", name: "Cosmic Blue", font: "Oswald", textColors: { name: "#1a1a2e", title: "#475569", heading: "#1a1a2e", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", borderBottom: "none" } }
    ],
    sidebar: [
        { bg: "#1e293b", accent: "#3b82f6", name: "Slate & Blue", font: "Inter", textColors: { name: "#1e293b", title: "#475569", heading: "#1e293b", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", borderBottom: "2px solid {accent}" } },
        { bg: "#0f172a", accent: "#f43f5e", name: "Navy & Rose", font: "Montserrat", textColors: { name: "#0f172a", title: "#475569", heading: "#0f172a", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "none", borderBottom: "none" } },
        { bg: "#1c1917", accent: "#f97316", name: "Charcoal & Orange", font: "Lora", textColors: { name: "#1c1917", title: "#57534e", heading: "#1c1917", body: "#44403c", muted: "#78716c" }, headingStyles: { textTransform: "capitalize", borderBottom: "1px solid {accent}" } },
        { bg: "#14532d", accent: "#eab308", name: "Forest & Gold", font: "Merriweather", textColors: { name: "#14532d", title: "#475569", heading: "#14532d", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", textAlign: "center", borderBottom: "1px dashed {accent}" } },
        { bg: "#3b0764", accent: "#14b8a6", name: "Eggplant & Teal", font: "Playfair Display", textColors: { name: "#3b0764", title: "#475569", heading: "#3b0764", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "none", borderBottom: "2px solid {accent}" } },
        { bg: "#0c1a2e", accent: "#f59e0b", name: "Abyss & Amber", font: "Roboto", textColors: { name: "#0c1a2e", title: "#475569", heading: "#0c1a2e", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", borderBottom: "1px solid {accent}" } },
        { bg: "#150926", accent: "#67e8f9", name: "Grape & Cyan", font: "Open Sans", textColors: { name: "#150926", title: "#475569", heading: "#150926", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", letterSpacing: "1px", borderBottom: "2px solid {accent}" } },
        { bg: "#1a0533", accent: "#4ade80", name: "Midnight & Lime", font: "Lato", textColors: { name: "#1a0533", title: "#475569", heading: "#1a0533", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "none", borderBottom: "3px solid {accent}" } },
        { bg: "#09090b", accent: "#e879f9", name: "Black & Fuchsia", font: "Oswald", textColors: { name: "#09090b", title: "#475569", heading: "#09090b", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", letterSpacing: "2px", borderBottom: "none" } },
        { bg: "#012030", accent: "#fb923c", name: "Ocean & Flame", font: "Merriweather", textColors: { name: "#012030", title: "#475569", heading: "#012030", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "capitalize", borderBottom: "1px double {accent}" } },
        { bg: "#231942", accent: "#fbbf24", name: "Cosmic & Gold", font: "Playfair Display", textColors: { name: "#231942", title: "#475569", heading: "#231942", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "none", textAlign: "center", borderBottom: "1px solid {accent}" } },
        { bg: "#1b0000", accent: "#34d399", name: "Blood & Mint", font: "Inter", textColors: { name: "#1b0000", title: "#475569", heading: "#1b0000", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", borderBottom: "2px solid {accent}" } },
        { bg: "#002b36", accent: "#2dd4bf", name: "Solarized Teal", font: "Montserrat", textColors: { name: "#002b36", title: "#475569", heading: "#002b36", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", fontWeight: "700", borderBottom: "3px solid {accent}" } },
        { bg: "#0a192f", accent: "#64ffda", name: "Deep Navy & Jade", font: "Lora", textColors: { name: "#0a192f", title: "#475569", heading: "#0a192f", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "capitalize", borderBottom: "1px dashed {accent}" } },
        { bg: "#16213e", accent: "#f9a8d4", name: "Midnight & Pink", font: "Roboto", textColors: { name: "#16213e", title: "#475569", heading: "#16213e", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "none", borderBottom: "2px solid {accent}" } },
        { bg: "#1b1b2f", accent: "#a78bfa", name: "Noir & Violet", font: "Merriweather", textColors: { name: "#1b1b2f", title: "#475569", heading: "#1b1b2f", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", borderBottom: "1px solid {accent}" } },
        { bg: "#0d1117", accent: "#58a6ff", name: "GitHub & Blue", font: "Open Sans", textColors: { name: "#0d1117", title: "#475569", heading: "#0d1117", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "none", borderBottom: "1px solid #e5e7eb" } },
        { bg: "#0e2323", accent: "#fde68a", name: "Dark Teal & Cream", font: "Playfair Display", textColors: { name: "#0e2323", title: "#475569", heading: "#0e2323", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "capitalize", borderBottom: "1px double {accent}" } },
        { bg: "#101820", accent: "#ff6b6b", name: "Charcoal & Coral", font: "Lato", textColors: { name: "#101820", title: "#475569", heading: "#101820", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", borderBottom: "2px solid {accent}" } },
        { bg: "#1f1300", accent: "#86efac", name: "Espresso & Sage", font: "Montserrat", textColors: { name: "#1f1300", title: "#475569", heading: "#1f1300", body: "#334155", muted: "#64748b" }, headingStyles: { textTransform: "uppercase", letterSpacing: "1px", borderBottom: "1px solid {accent}" } }
    ]
};


function renderThemeSwatches() {
    const container = document.getElementById('theme-swatches');
    if (!container) return;
    
    let list = [];
    if (currentLayout === 'designed') list = PRESETS.designed;
    else if (currentLayout === 'professional') list = PRESETS.professional;
    else if (currentLayout === 'sidebar') list = PRESETS.sidebar;
    
    if (list.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = list.map(theme => {
        let bgStyle = '';
        if (currentLayout === 'designed') {
            bgStyle = `background: linear-gradient(135deg, ${theme.bg} 50%, ${theme.gold} 50%);`;
        } else if (currentLayout === 'professional') {
            bgStyle = `background: ${theme.navy};`;
        } else if (currentLayout === 'sidebar') {
            bgStyle = `background: linear-gradient(135deg, ${theme.bg} 50%, ${theme.accent} 50%);`;
        }
        
        return `<div class="theme-swatch" style="${bgStyle}" data-tooltip="${theme.name || 'Thème'}" onclick="applySpecificTheme('${encodeURIComponent(JSON.stringify(theme))}')"></div>`;
    }).join('');
}

function applySpecificTheme(encodedTheme) {
    const theme = JSON.parse(decodeURIComponent(encodedTheme));

    // 1. Base Colors
    if (currentLayout === 'designed') {
        cvData.themes.designed.bg_color = theme.bg;
        cvData.themes.designed.gold_primary = theme.gold;
        cvData.themes.designed.gold_dark = darkenColor(theme.gold, 15);
        const p1 = document.getElementById('design-picker-bg');
        const p2 = document.getElementById('design-picker-gold');
        if (p1) p1.value = theme.bg;
        if (p2) p2.value = theme.gold;
    } else if (currentLayout === 'professional') {
        cvData.themes.professional.navy_primary = theme.navy;
        const p = document.getElementById('design-picker-navy');
        if (p) p.value = theme.navy;
    } else if (currentLayout === 'sidebar') {
        if (!cvData.themes.sidebar) cvData.themes.sidebar = {};
        cvData.themes.sidebar.sidebar_bg = theme.bg;
        cvData.themes.sidebar.sidebar_accent = theme.accent;
        const p1 = document.getElementById('design-picker-sidebar-bg');
        const p2 = document.getElementById('design-picker-sidebar-accent');
        if (p1) p1.value = theme.bg;
        if (p2) p2.value = theme.accent;
    }

    // 2. Font family
    if (theme.font) {
        if (!cvData.design) cvData.design = {};
        cvData.design.font_family = theme.font;
        const fontPicker = document.getElementById('design-font-family');
        if (fontPicker) fontPicker.value = theme.font;
    }

    // 3. Text Colors
    if (theme.textColors) {
        if (!cvData.design) cvData.design = {};
        if (!cvData.design.typography) cvData.design.typography = {};
        ['name', 'title', 'heading', 'body', 'muted'].forEach(type => {
            if (!cvData.design.typography[type]) cvData.design.typography[type] = {};
            if (theme.textColors[type]) cvData.design.typography[type].color = theme.textColors[type];
        });
    }

    // 4. Section Heading Styles
    if (theme.headingStyles) {
        if (!cvData.design) cvData.design = {};
        if (!cvData.design.overrides) cvData.design.overrides = {};
        const headingPaths = [
            'heading.profile', 'heading.experiences', 'heading.formations',
            'heading.skills', 'heading.projects', 'heading.education',
            'heading.certifications', 'heading.activities', 'heading.languages', 'heading.interests'
        ];
        const accentColor = theme.gold || theme.navy || theme.accent || '#3b82f6';
        headingPaths.forEach(path => {
            if (!cvData.design.overrides[path]) cvData.design.overrides[path] = {};
            if (theme.headingStyles.textTransform !== undefined)
                cvData.design.overrides[path]['textTransform'] = theme.headingStyles.textTransform;
            if (theme.headingStyles.textAlign !== undefined)
                cvData.design.overrides[path]['textAlign'] = theme.headingStyles.textAlign;
            if (theme.headingStyles.borderBottom !== undefined)
                cvData.design.overrides[path]['borderBottom'] = theme.headingStyles.borderBottom.replace('{accent}', accentColor);
            if (theme.headingStyles.letterSpacing !== undefined)
                cvData.design.overrides[path]['letterSpacing'] = theme.headingStyles.letterSpacing;
            if (theme.headingStyles.fontWeight !== undefined)
                cvData.design.overrides[path]['fontWeight'] = theme.headingStyles.fontWeight;
        });
    }

    saveAndSync();
    renderPreview();
}

function applyRandomPalette() {
    let list = [];
    if (currentLayout === 'designed') list = PRESETS.designed;
    else if (currentLayout === 'professional') list = PRESETS.professional;
    else if (currentLayout === 'sidebar') list = PRESETS.sidebar;

    if (list.length === 0) return;

    // Pick a random theme different from current
    let choice = list[Math.floor(Math.random() * list.length)];
    for (let i = 0; i < 5; i++) {
        const current = currentLayout === 'designed' ? cvData.themes.designed?.bg_color :
                        currentLayout === 'professional' ? cvData.themes.professional?.navy_primary :
                        cvData.themes.sidebar?.sidebar_bg;
        const choiceKey = choice.bg || choice.navy;
        if (choiceKey === current) {
            choice = list[Math.floor(Math.random() * list.length)];
        } else break;
    }

    applySpecificTheme(encodeURIComponent(JSON.stringify(choice)));
}

// setEditorMode removed in favor of unified tabs

function updateDesignField(field, value) {
    if (!cvData.design) cvData.design = {};
    cvData.design[field] = value;

    // Update label readouts
    if (field === 'base_size') {
        document.getElementById('lbl-design-base-size').innerText = `Taille de police : ${value}px`;
    } else if (field === 'line_height') {
        document.getElementById('lbl-design-line-height').innerText = `Interligne : ${value}`;
    } else if (field === 'page_margin') {
        document.getElementById('lbl-design-page-margin').innerText = `Marges de page : ${value}mm`;
    } else if (field === 'section_spacing') {
        document.getElementById('lbl-design-section-spacing').innerText = `Espacement des sections : ${value}rem`;
    } else if (field === 'pfp_border_width') {
        document.getElementById('lbl-design-pfp-border-width').innerText = `Bordure : ${value}px`;
    } else if (field === 'pfp_shadow') {
        document.getElementById('lbl-design-pfp-shadow').innerText = `Ombre : ${value}px`;
    } else if (field === 'pfp_opacity') {
        document.getElementById('lbl-design-pfp-opacity').innerText = `Opacité : ${Math.round(value * 100)}%`;
    } else if (field === 'pfp_offset_x') {
        document.getElementById('lbl-design-pfp-offset-x').innerText = `Décalage horizontal : ${value}px`;
    } else if (field === 'pfp_offset_y') {
        document.getElementById('lbl-design-pfp-offset-y').innerText = `Décalage vertical : ${value}px`;
    }

    applyDesignStyles();

    // Define which fields require a full structural re-render vs CSS only
    const nonStructuralFields = [
        'pfp_border_width', 'pfp_shadow', 'pfp_opacity', 'pfp_offset_x', 'pfp_offset_y',
        'pfp_border_color', 'pfp_shape', 'font_family'
    ];

    const layoutAffectingFields = [
        'base_size', 'line_height', 'page_margin', 'section_spacing'
    ];

    if (nonStructuralFields.includes(field)) {
        localStorage.setItem('cv_data', JSON.stringify(cvData));
    } else if (layoutAffectingFields.includes(field)) {
        localStorage.setItem('cv_data', JSON.stringify(cvData));
        // Debounce the layout recalculation to prevent slider lag
        clearTimeout(window._designDebounce);
        window._designDebounce = setTimeout(() => {
            renderPreview();
        }, 400);
    } else {
        saveAndSync();
    }
}

function applyDesignStyles() {
    const design = cvData.design || {
        font_family: "Inter",
        base_size: 14,
        line_height: 1.45,
        page_margin: 15,
        section_spacing: 1.2,
        show_pfp: true,
        show_page_number: true
    };

    const fontVal = design.font_family === 'Playfair Display' || design.font_family === 'Lora'
        ? `'${design.font_family}', serif`
        : `'${design.font_family}', sans-serif`;

    document.documentElement.style.setProperty('--font-global', fontVal);
    document.documentElement.style.setProperty('--font-base-size', `${design.base_size}px`);
    document.documentElement.style.setProperty('--line-height-base', design.line_height);
    document.documentElement.style.setProperty('--page-margin', `${design.page_margin}mm`);
    document.documentElement.style.setProperty('--section-margin', `${design.section_spacing}rem`);
    document.documentElement.style.setProperty('--pfp-display', design.show_pfp ? 'block' : 'none');

    // Image design properties
    const shapeMap = { 'circle': '50%', 'rounded': '12px', 'square': '0px' };
    document.documentElement.style.setProperty('--pfp-border-radius', shapeMap[design.pfp_shape || 'circle'] || '50%');
    document.documentElement.style.setProperty('--pfp-border-width', `${design.pfp_border_width ?? 2}px`);
    document.documentElement.style.setProperty('--pfp-border-color', design.pfp_border_color || '#d4af37');
    document.documentElement.style.setProperty('--pfp-shadow-blur', `${design.pfp_shadow ?? 15}px`);
    document.documentElement.style.setProperty('--pfp-shadow-opacity', design.pfp_shadow > 0 ? '0.4' : '0');
    document.documentElement.style.setProperty('--pfp-opacity', design.pfp_opacity ?? 1);
    document.documentElement.style.setProperty('--pfp-margin-left', `${design.pfp_offset_x ?? 0}px`);
    document.documentElement.style.setProperty('--pfp-margin-top', `${design.pfp_offset_y ?? 0}px`);
    document.documentElement.style.setProperty('--pfp-margin-top', `${design.pfp_offset_y ?? 0}px`);

    // Global Typography Properties
    if (design.typography) {
        Object.entries(design.typography).forEach(([type, props]) => {
            Object.entries(props).forEach(([prop, val]) => {
                const kebabProp = prop.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
                document.documentElement.style.setProperty(`--${type}-${kebabProp}`, val);
            });
        });
    }

    // Apply specific field overrides
    let overridesCss = '';
    if (design.overrides) {
        Object.entries(design.overrides).forEach(([path, styles]) => {
            const selector = getSelectorForPath(path);
            if (!selector) return;
            
            let rules = '';
            
            const processVal = (val, unit = '') => {
                if (val === undefined || val === null || val === '') return null;
                // If the value already contains a unit (like 'px', 'em', '%'), just use it directly.
                // Otherwise, append the default unit.
                if (typeof val === 'string' && /[a-zA-Z%]$/.test(val)) return val;
                return `${val}${unit}`;
            };

            if (styles.color) rules += `color: ${styles.color} !important;\n`;
            
            const fs = processVal(styles.fontSize, 'px');
            if (fs) rules += `font-size: ${fs} !important;\n`;
            
            if (styles.fontFamily) rules += `font-family: ${styles.fontFamily} !important;\n`;
            if (styles.fontWeight) rules += `font-weight: ${styles.fontWeight} !important;\n`;
            if (styles.fontStyle) rules += `font-style: ${styles.fontStyle} !important;\n`;
            if (styles.textDecoration) rules += `text-decoration: ${styles.textDecoration} !important;\n`;
            
            const ls = processVal(styles.letterSpacing, 'px'); // The panel inputs use px
            if (ls) rules += `letter-spacing: ${ls} !important;\n`;
            
            if (styles.lineHeight) rules += `line-height: ${styles.lineHeight} !important;\n`;
            if (styles.textTransform) rules += `text-transform: ${styles.textTransform} !important;\n`;
            if (styles.textAlign) rules += `text-align: ${styles.textAlign} !important;\n`;
            
            const ws = processVal(styles.wordSpacing, 'px');
            if (ws) rules += `word-spacing: ${ws} !important;\n`;
            
            const ti = processVal(styles.textIndent, 'px');
            if (ti) rules += `text-indent: ${ti} !important;\n`;
            
            if (styles.opacity !== undefined) rules += `opacity: ${styles.opacity} !important;\n`;
            
            if (rules) {
                overridesCss += `${selector} {\n${rules}}\n`;
            }
        });
    }

    if (cvData.hidden_fields) {
        Object.keys(cvData.hidden_fields).forEach(path => {
            if (cvData.hidden_fields[path]) {
                const selector = getSelectorForPath(path);
                if (selector) {
                    overridesCss += `#screen-preview-container ${selector}, #print-preview-container ${selector} { display: none !important; }\n`;
                }
            }
        });
    }

    let styleEl = document.getElementById('field-overrides-style');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'field-overrides-style';
        document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = overridesCss;
}

async function resetToDefaults() {
    if (confirm("Voulez-vous vraiment réinitialiser toutes les données aux valeurs d'origine ?")) {
        try {
            const response = await fetch('data.json');
            if (response.ok) {
                const data = await response.json();
                cvData = data;
                runMigrations(cvData);
                localStorage.setItem('cv_data', JSON.stringify(cvData));
                populateFormInputs();
                renderPreview();
                return;
            }
        } catch (e) {
            console.warn("Could not fetch data.json for reset, falling back to embedded defaults:", e);
        }
        // Fallback to empty skeleton or data.js if fetch fails
        cvData = typeof window.defaultCVData !== 'undefined' ? window.defaultCVData : JSON.parse(JSON.stringify(emptyCVData));
        runMigrations(cvData);
        localStorage.removeItem('cv_data');
        populateFormInputs();
        renderPreview();
    }
}

function downloadJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cvData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "data.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importJSON(input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const imported = JSON.parse(e.target.result);
            // Basic validation: check for required top-level keys
            if (!imported.contact || !imported.contact.name) {
                alert('❌ Fichier JSON invalide : la clé "contact.name" est manquante.');
                return;
            }
            cvData = imported;
            runMigrations(cvData);
            localStorage.setItem('cv_data', JSON.stringify(cvData));
            populateFormInputs();
            renderPreview();
            alert('✅ Données importées avec succès pour : ' + cvData.contact.name);
        } catch (err) {
            alert('❌ Erreur de lecture du fichier JSON : ' + err.message);
        }
    };
    reader.readAsText(file);
    input.value = ''; // Reset so re-importing the same file works
}

function saveAndSync() {
    localStorage.setItem('cv_data', JSON.stringify(cvData));
    renderPreview();
    if (window.innerWidth <= 900) {
        autoFitMobileZoom();
    }
}

function attachEditorBindings(container) {
    // Find all elements that look like section titles or headers
    const headers = container.querySelectorAll('h2, h3, h4, .cv-designed-sectitle, .cv-prof-sectitle, .cv-ats-sectitle, .cv-sidebar-right-title, .cv-sidebar-left-title, .cv-mini-sectitle, .cv-euro-sectitle');

    const keywordMap = {
        'profil': { tab: 'tab-profile', key: null },
        'résumé': { tab: 'tab-profile', key: null },
        'contact': { tab: 'tab-profile', key: null },
        'expéri': { tab: 'tab-experiences', key: 'experiences' },
        'parcours': { tab: 'tab-experiences', key: 'experiences' },
        'stage': { tab: 'tab-experiences', key: 'formations' },
        'formation': { tab: 'tab-experiences', key: 'formations' },
        'projet': { tab: 'tab-projects', key: 'projects' },
        'réalis': { tab: 'tab-projects', key: 'projects' },
        'compét': { tab: 'tab-skills', key: 'skills' },
        'techni': { tab: 'tab-skills', key: 'skills' },
        'éducat': { tab: 'tab-education', key: 'education' },
        'étude': { tab: 'tab-education', key: 'education' },
        'certif': { tab: 'tab-education', key: 'certifications' },
        'engage': { tab: 'tab-education', key: 'activities' },
        'activi': { tab: 'tab-education', key: 'activities' },
        'langue': { tab: 'tab-education', key: 'languages' },
        'intérêt': { tab: 'tab-education', key: 'interests' },
        'loisir': { tab: 'tab-education', key: 'interests' }
    };

    headers.forEach(header => {
        const text = header.textContent.toLowerCase();
        let match = null;
        for (const kw in keywordMap) {
            if (text.includes(kw)) {
                match = keywordMap[kw];
                break;
            }
        }
        if (!match) return;

        header.setAttribute('data-editor-tab', match.tab);
        if (match.key) {
            header.setAttribute('data-editor-target', match.key);
        }

        let sectionContainer = header.closest('section, .section, .cv-sidebar-right-section, .cv-sidebar-left-section, .cv-mini-right-col > div, .cv-mini-left-col > div, .cv-euro-row, .cv-ats-section');

        let isRootContainer = false;
        if (!sectionContainer || sectionContainer === container ||
            sectionContainer.classList.contains('cv-ats-body') ||
            sectionContainer.classList.contains('cv-prof-body') ||
            sectionContainer.classList.contains('cv-designed-body') ||
            sectionContainer.classList.contains('cv-mini-body') ||
            sectionContainer.classList.contains('cv-euro-body') ||
            sectionContainer.classList.contains('cv-sidebar-body')) {
            isRootContainer = true;
        }

        let sectionItems = [];
        let sectionChildren = [];

        if (!isRootContainer && sectionContainer) {
            sectionChildren = Array.from(sectionContainer.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, span, div, a, .cv-designed-simpleitem'));
            sectionItems = Array.from(sectionContainer.querySelectorAll('.cv-designed-card, .cv-prof-item, .cv-ats-item, .cv-sidebar-item, .cv-mini-item, .cv-euro-item, .skill-cat, .cv-prof-skillrow, .cv-designed-simpleitem, .cv-mini-skillcat, .cv-euro-item-row'));
        } else {
            let curr = header.nextElementSibling;
            const headerSelectors = 'h2, h3, h4, .cv-designed-sectitle, .cv-prof-sectitle, .cv-ats-sectitle, .cv-sidebar-right-title, .cv-sidebar-left-title, .cv-mini-sectitle, .cv-euro-sectitle';
            while (curr && !curr.matches(headerSelectors)) {
                if (curr.matches('.cv-designed-card, .cv-prof-item, .cv-ats-item, .cv-sidebar-item, .cv-mini-item, .cv-euro-item, .skill-cat, .cv-prof-skillrow, .cv-designed-simpleitem, .cv-mini-skillcat, .cv-euro-item-row')) {
                    sectionItems.push(curr);
                }
                curr.querySelectorAll('.cv-designed-card, .cv-prof-item, .cv-ats-item, .cv-sidebar-item, .cv-mini-item, .cv-euro-item, .skill-cat, .cv-prof-skillrow, .cv-designed-simpleitem, .cv-mini-skillcat, .cv-euro-item-row').forEach(it => sectionItems.push(it));

                sectionChildren.push(curr);
                curr.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, span, div, a, .cv-designed-simpleitem').forEach(ch => sectionChildren.push(ch));
                curr = curr.nextElementSibling;
            }
        }

        // Set target on all general children in this section first
        sectionChildren.forEach(child => {
            child.setAttribute('data-editor-tab', match.tab);
            if (match.key) {
                child.setAttribute('data-editor-target', match.key);
            }
        });

        // Set indexed targets on specific item cards
        sectionItems.forEach((item, index) => {
            item.setAttribute('data-editor-tab', match.tab);
            if (match.key) {
                item.setAttribute('data-editor-target', match.key);
                item.setAttribute('data-editor-index', index);

                if (match.key === 'skills') {
                    const catEl = item.querySelector('strong, .cv-designed-cardtitle, div:first-child');
                    if (catEl) {
                        catEl.setAttribute('data-editor-field', 'category');
                        catEl.querySelectorAll('*').forEach(c => c.setAttribute('data-editor-field', 'category'));
                    }
                    item.querySelectorAll('.cv-designed-tags, span, p').forEach(el => {
                        if (el !== catEl && !catEl?.contains(el)) {
                            el.setAttribute('data-editor-field', 'value');
                            el.querySelectorAll('*').forEach(c => c.setAttribute('data-editor-field', 'value'));
                        }
                    });
                } else if (match.key === 'certifications' || match.key === 'activities' || match.key === 'interests') {
                    item.setAttribute('data-editor-field', 'value');
                    item.querySelectorAll('*').forEach(c => c.setAttribute('data-editor-field', 'value'));
                } else {
                    // Map title fields
                    item.querySelectorAll('.cv-designed-cardtitle, .cv-prof-itemhead, .cv-ats-itemhead, .cv-sidebar-itemhead, .cv-mini-itemhead, .cv-euro-itemhead, h3, h4, .cv-designed-cardtitle > span:first-child, .cv-prof-itemhead > span:first-child, .cv-ats-itemhead > span:first-child, .cv-sidebar-itemhead > span:first-child, .cv-mini-itemhead > span:first-child, .cv-euro-itemhead > span:first-child').forEach(el => {
                        el.setAttribute('data-editor-field', match.key === 'education' ? 'degree' : (match.key === 'languages' ? 'name' : 'title'));
                    });

                    // Map company / school / level / stack fields
                    item.querySelectorAll('.cv-designed-cardorg, .cv-prof-itemorg, .cv-ats-itemsub, .cv-sidebar-itemorg, .cv-mini-itemorg, .cv-euro-itemorg').forEach(el => {
                        el.setAttribute('data-editor-field', match.key === 'education' ? 'school' : (match.key === 'languages' ? 'level' : 'company'));
                    });

                    // Map period fields
                    item.querySelectorAll('.cv-designed-carddate, .cv-prof-itemdate, .cv-sidebar-itemdate, .cv-mini-itemdate, .cv-euro-itemdate').forEach(el => {
                        if (match.key === 'projects') {
                            el.setAttribute('data-editor-field', 'stack');
                        } else {
                            el.setAttribute('data-editor-field', 'period');
                        }
                    });

                    // Map location fields
                    item.querySelectorAll('.cv-designed-cardloc, .cv-prof-cardloc, .cv-ats-cardloc, .cv-sidebar-cardloc, .cv-mini-cardloc, .cv-euro-cardloc').forEach(el => {
                        el.setAttribute('data-editor-field', 'location');
                    });

                    // Map description / bullets fields
                    item.querySelectorAll('.cv-designed-bullets, .cv-prof-bullets, .cv-ats-bullets, .cv-sidebar-bullets, .cv-mini-bullets, .cv-euro-bullets, .cv-designed-bullets li, .cv-prof-bullets li, .cv-ats-bullets li, p').forEach(el => {
                        el.setAttribute('data-editor-field', match.key === 'projects' ? 'description' : 'bullets');
                    });
                }
            }
        });
    });

    // Bind all profile/resume and personal header content
    const profileHeaderSelectors = [
        '.cv-designed-header', '.cv-prof-header', '.cv-ats-header',
        '.cv-sidebar-left-col', '.cv-mini-header', '.cv-euro-header',
        '.cv-designed-profile', '.cv-prof-profile', '.cv-ats-profile',
        '.cv-mini-profile', '.cv-euro-profile', '.cv-designed-contacts',
        '.cv-prof-contacts', '.cv-ats-contacts', '.cv-sidebar-contacts',
        '.cv-mini-contacts', '.cv-euro-contacts', '.cv-designed-name',
        '.cv-prof-name', '.cv-designed-title', '.cv-prof-title'
    ];

    profileHeaderSelectors.forEach(sel => {
        const els = container.querySelectorAll(sel);
        els.forEach(el => {
            el.setAttribute('data-editor-tab', 'tab-profile');
            const children = el.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, span, div, a, img');
            children.forEach(c => c.setAttribute('data-editor-tab', 'tab-profile'));
        });
    });

    // For the sidebar layout, the right-column header contains name + title directly
    container.querySelectorAll('.cv-sidebar-right > header').forEach(hdr => {
        hdr.setAttribute('data-editor-tab', 'tab-profile');
        hdr.querySelectorAll('*').forEach(c => c.setAttribute('data-editor-tab', 'tab-profile'));

        const nameEl = hdr.querySelector('h1');
        if (nameEl) {
            nameEl.setAttribute('data-editor-focus', 'input-name');
            nameEl.querySelectorAll('*').forEach(c => c.setAttribute('data-editor-focus', 'input-name'));
        }
        const titleEl = hdr.querySelector('p');
        if (titleEl) {
            titleEl.setAttribute('data-editor-focus', 'input-title-sub');
            titleEl.querySelectorAll('*').forEach(c => c.setAttribute('data-editor-focus', 'input-title-sub'));
        }
    });

    // Bind specific profile fields for direct input focusing
    const focusSelectors = {
        '.cv-designed-name, .cv-prof-name, .cv-ats-name, .cv-sidebar-name, .cv-mini-name, .cv-euro-name': 'input-name',
        '.cv-designed-title, .cv-prof-title, .cv-ats-title, .cv-sidebar-title, .cv-mini-title, .cv-euro-title': 'input-title-sub',
        '.cv-designed-profile, .cv-prof-profile, .cv-ats-profile, .cv-mini-profile, .cv-euro-profile': 'input-profile'
    };

    for (const sel in focusSelectors) {
        container.querySelectorAll(sel).forEach(el => {
            el.setAttribute('data-editor-focus', focusSelectors[sel]);
            el.querySelectorAll('*').forEach(c => c.setAttribute('data-editor-focus', focusSelectors[sel]));
        });
    }

    // Map dynamic contact items based on text content / icons
    const contactContainerSels = [
        '.cv-designed-contacts', '.cv-prof-contacts', '.cv-ats-contacts',
        '.cv-sidebar-contacts', '.cv-mini-contacts', '.cv-euro-contacts'
    ];

    container.querySelectorAll('.cv-sidebar-left-section').forEach(section => {
        const title = section.querySelector('.cv-sidebar-left-title');
        if (title && title.textContent.toLowerCase().includes('contact')) {
            section.setAttribute('data-editor-tab', 'tab-profile');
            section.querySelectorAll('*').forEach(c => c.setAttribute('data-editor-tab', 'tab-profile'));

            section.querySelectorAll('.cv-sidebar-left-content > div').forEach(row => {
                const text = row.textContent.toLowerCase();
                const link = row.querySelector('a');
                const href = link ? (link.getAttribute('href') || '') : '';

                let focusId = null;
                if (href.startsWith('mailto:') || text.includes('@')) {
                    focusId = 'input-email';
                } else if (href.startsWith('tel:') || text.match(/[+0-9]{8,}/)) {
                    focusId = 'input-phone';
                } else if (text.includes('linkedin') || href.includes('linkedin')) {
                    focusId = 'input-linkedin';
                } else if (text.includes('github') || href.includes('github')) {
                    focusId = 'input-github';
                } else if (text.includes('permis')) {
                    focusId = 'input-driver';
                } else if (text.includes('site') || (text.includes('.') && !text.includes('@'))) {
                    focusId = 'input-website';
                } else {
                    focusId = 'input-location';
                }

                if (focusId) {
                    row.setAttribute('data-editor-focus', focusId);
                    row.setAttribute('data-editor-tab', 'tab-profile');
                    row.querySelectorAll('*').forEach(c => {
                        c.setAttribute('data-editor-focus', focusId);
                        c.setAttribute('data-editor-tab', 'tab-profile');
                    });
                }
            });
        }
    });

    container.querySelectorAll('.cv-designed-contacts span, .cv-prof-contacts span, .cv-ats-contacts span, .cv-sidebar-contacts span, .cv-mini-contacts span, .cv-euro-contacts span, .cv-designed-contacts a, .cv-prof-contacts a, .cv-ats-contacts a, .cv-sidebar-contacts a, .cv-mini-contacts a, .cv-euro-contacts a').forEach(el => {
        const text = el.textContent.toLowerCase();
        const href = el.getAttribute('href') || '';

        let focusId = null;
        if (href.startsWith('mailto:') || text.includes('@')) {
            focusId = 'input-email';
        } else if (href.startsWith('tel:') || text.match(/[+0-9]{8,}/)) {
            focusId = 'input-phone';
        } else if (text.includes('linkedin') || href.includes('linkedin')) {
            focusId = 'input-linkedin';
        } else if (text.includes('github') || href.includes('github')) {
            focusId = 'input-github';
        } else if (text.includes('permis')) {
            focusId = 'input-driver';
        } else if (text.includes('.') && !text.includes('@')) {
            focusId = 'input-website';
        } else {
            focusId = 'input-location';
        }

        if (focusId) {
            el.setAttribute('data-editor-focus', focusId);
            el.querySelectorAll('*').forEach(c => c.setAttribute('data-editor-focus', focusId));
        }
    });

    container.querySelectorAll('.cv-sidebar-pfp').forEach(el => {
        el.setAttribute('data-editor-tab', 'tab-profile');
    });

    // Tag elements for interactive design mode color editing
    container.querySelectorAll('.cv-designed-name, .cv-prof-name, .cv-ats-name, .cv-sidebar-name, .cv-mini-name, .cv-euro-name').forEach(el => {
        el.setAttribute('data-design-target', 'name');
    });
    container.querySelectorAll('.cv-designed-title, .cv-prof-title, .cv-ats-title, .cv-sidebar-title, .cv-mini-title, .cv-euro-title').forEach(el => {
        el.setAttribute('data-design-target', 'title');
    });
    container.querySelectorAll('h2, h3, h4, .cv-designed-sectitle, .cv-prof-sectitle, .cv-ats-sectitle, .cv-sidebar-right-title, .cv-sidebar-left-title, .cv-mini-sectitle, .cv-euro-sectitle, [data-editor-field="title"], [data-editor-field="degree"], [data-editor-field="school"], [data-editor-field="category"]').forEach(el => {
        el.setAttribute('data-design-target', 'heading');
    });
    container.querySelectorAll('.cv-designed-bullets li, .cv-prof-bullets li, .cv-ats-bullets li, .cv-sidebar-bullets li, .cv-mini-bullets li, .cv-euro-bullets li, .cv-designed-profile, .cv-prof-profile, .cv-ats-profile, .cv-mini-profile, .cv-euro-profile, .cv-prof-skillrow, .cv-designed-card p, .cv-ats-item p, [data-editor-field="description"], [data-editor-field="bullets"], [data-editor-field="name"], [data-editor-field="value"], [data-editor-focus="input-profile"]').forEach(el => {
        el.setAttribute('data-design-target', 'body');
    });
    container.querySelectorAll('.cv-designed-contacts, .cv-prof-contacts, .cv-ats-contacts, .cv-sidebar-contacts, .cv-mini-contacts, .cv-euro-contacts, .cv-designed-carddate, .cv-prof-itemdate, .cv-ats-itemdate, .cv-sidebar-itemdate, .cv-mini-itemdate, .cv-euro-itemdate, .cv-prof-cardloc, .cv-designed-cardloc, [data-editor-field="company"], [data-editor-field="location"], [data-editor-field="period"], [data-editor-field="stack"]').forEach(el => {
        el.setAttribute('data-design-target', 'muted');
    });
}

/* ----------------------------------------------------
    MOBILE & RESPONSIVE VIEW ENGINE
    ---------------------------------------------------- */
function switchMobileView(view) {
    const appContainer = document.getElementById('app-container');
    const btnEditor = document.getElementById('btn-view-editor');
    const btnPreview = document.getElementById('btn-view-preview');

    if (!appContainer) return;

    if (view === 'preview') {
        appContainer.classList.remove('show-editor');
        appContainer.classList.add('show-preview');
        if (btnEditor) btnEditor.classList.remove('active');
        if (btnPreview) btnPreview.classList.add('active');

        // Re-run pagination rendering when preview tab opens so heights are accurate
        renderPreview();
        autoFitMobileZoom();
        const previewContainer = document.querySelector('.preview-container');
        if (previewContainer) {
            previewContainer.scrollTop = 0;
            previewContainer.scrollLeft = 0;
        }
    } else {
        appContainer.classList.remove('show-preview');
        appContainer.classList.add('show-editor');
        if (btnPreview) btnPreview.classList.remove('active');
        if (btnEditor) btnEditor.classList.add('active');
    }
}

function autoFitMobileZoom() {
    if (window.innerWidth <= 900) {
        const targetWidth = 794; // 210mm at 96dpi
        const calculatedScale = Math.min(1.0, Math.max(0.3, window.innerWidth / targetWidth));
        previewZoom = parseFloat(calculatedScale.toFixed(2));
        applyZoom();

        // Reset heights so container recalculates natural scroll bounds cleanly
        const screenPreview = document.getElementById('screen-preview-container');
        const a4Page = document.getElementById('a4-page');
        if (screenPreview) {
            screenPreview.style.height = 'auto';
        }
        if (a4Page) {
            a4Page.style.height = 'auto';
        }
    }
}

window.addEventListener('resize', () => {
    if (window.innerWidth <= 900 && document.getElementById('app-container').classList.contains('show-preview')) {
        autoFitMobileZoom();
    }
});

/* ----------------------------------------------------
    MOBILE TOUCH GESTURE ENGINE (Pinch-to-Zoom + Pan)
    ---------------------------------------------------- */
(function initTouchGestures() {
    const previewWrap = document.querySelector('.preview-container');
    if (!previewWrap) return;

    let startTouchDist = null;       // Distance between two fingers at pinch start
    let lastZoomAtStart = 1.0;       // Zoom level when pinch started
    let isPinching = false;
    let lastTapTime = 0;

    function getTouchDist(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    previewWrap.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            // Two fingers down — start pinch
            isPinching = true;
            startTouchDist = getTouchDist(e.touches);
            lastZoomAtStart = previewZoom;
            e.preventDefault(); // prevent browser page zoom during pinch
        } else if (e.touches.length === 1 && !isPinching) {
            // Single finger — check for double-tap to reset zoom
            const now = Date.now();
            if (now - lastTapTime < 300) {
                if (window.innerWidth <= 900) autoFitMobileZoom();
                else resetZoom();
                e.preventDefault();
            }
            lastTapTime = now;
            // Do NOT call preventDefault() here — allows native scroll/pan
        }
    }, { passive: false });

    previewWrap.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2 && isPinching && startTouchDist !== null) {
            // Compute scale relative to the distance at pinch start (not per-frame delta)
            const currentDist = getTouchDist(e.touches);
            const scale = currentDist / startTouchDist;
            const newZoom = Math.min(3.0, Math.max(0.3, lastZoomAtStart * scale));
            previewZoom = parseFloat(newZoom.toFixed(2));
            applyZoom();
            e.preventDefault(); // prevent scroll while pinching
        }
        // Single finger: no preventDefault — native scroll/pan works freely
    }, { passive: false });

    previewWrap.addEventListener('touchend', (e) => {
        if (isPinching && e.touches.length < 2) {
            // Pinch just ended — save zoom
            localStorage.setItem('preview_zoom', previewZoom.toFixed(2));
            isPinching = false;
            startTouchDist = null;
        }
    }, { passive: true });
})();

// Update click-to-edit to auto switch back to editor on mobile when preview item clicked
document.getElementById('screen-preview-container').addEventListener('click', (e) => {
    // Let real links (email, LinkedIn, etc.) open normally
    const clickedLink = e.target.closest('a[href]');
    if (clickedLink && clickedLink.getAttribute('href') && !clickedLink.getAttribute('href').startsWith('#')) {
        return; // Don't intercept — let the browser follow the link
    }

    const designTargetEl = e.target.closest('[data-design-target]');
    const isDesignModeActive = document.getElementById('btn-mode-design')?.classList.contains('active');

    // If in Design Mode or clicking a design element while holding Alt/Ctrl key, switch to Design tab & focus color picker
    if (designTargetEl && (isDesignModeActive || e.altKey || e.ctrlKey)) {
        const targetType = designTargetEl.getAttribute('data-design-target');
        switchTab('tab-design');
        window.changeLayout(window.App.currentLayout);
        if (window.innerWidth <= 900) {
            switchMobileView('editor');
        }
        setTimeout(() => {
            const cardEl = document.getElementById(`design-card-text-${targetType}`);
            const pickerEl = document.getElementById(`design-picker-text-${targetType}`);
            if (cardEl) {
                cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                cardEl.style.animation = 'pulseHighlight 0.8s ease-out';
                setTimeout(() => { cardEl.style.animation = ''; }, 800);
            }
            if (pickerEl) {
                pickerEl.focus();
            }
        }, 100);
        return;
    }

    const focusTarget = e.target.closest('[data-editor-focus]');
    const indexedTarget = e.target.closest('[data-editor-index]');
    const fieldTarget = e.target.closest('[data-editor-field]');
    const tabTarget = e.target.closest('[data-editor-tab]');

    if (!tabTarget && !focusTarget && !indexedTarget) return;

    if (window.innerWidth <= 900) {
        switchMobileView('editor');
    }

    const tabId = tabTarget ? tabTarget.getAttribute('data-editor-tab') : (focusTarget ? focusTarget.getAttribute('data-editor-tab') : null);
    const targetKey = indexedTarget ? indexedTarget.getAttribute('data-editor-target') : (tabTarget ? tabTarget.getAttribute('data-editor-target') : null);
    const index = indexedTarget ? indexedTarget.getAttribute('data-editor-index') : null;
    const focusId = focusTarget ? focusTarget.getAttribute('data-editor-focus') : null;
    const field = fieldTarget ? fieldTarget.getAttribute('data-editor-field') : (e.target.getAttribute('data-editor-field') || null);


    if (tabId) {
        switchTab(tabId);
    }

    if (focusId) {
        setTimeout(() => {
            const inputEl = document.getElementById(focusId);
            if (inputEl) {
                inputEl.focus();
                inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                inputEl.style.outline = '2px solid #10b981';
                setTimeout(() => { inputEl.style.outline = ''; }, 1200);
            }
        }, 100);
    } else if (targetKey && index !== null) {
        const idx = parseInt(index, 10);
        openCollapseKeys[targetKey] = idx;

        if (targetKey === 'skills') {
            renderSkillsList();
        } else if (targetKey === 'certifications' || targetKey === 'activities' || targetKey === 'interests') {
            renderSimpleList(targetKey);
        } else {
            renderList(targetKey);
        }

        setTimeout(() => {
            const listContainer = document.getElementById(`list-${targetKey}`);
            if (listContainer) {
                const cards = listContainer.children;
                const card = cards[idx];
                if (card) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    card.style.animation = 'pulseHighlight 0.8s ease-out';
                    setTimeout(() => { card.style.animation = ''; }, 800);

                    // Focus the specific field if targeted
                    if (field) {
                        let inputEl = card.querySelector(`[data-field="${field}"], textarea[data-field="${field}"]`);
                        if (!inputEl && targetKey === 'skills') {
                            if (field === 'category') inputEl = card.querySelector('input[data-field="category"], input[type="text"]');
                            if (field === 'value') inputEl = card.querySelector('textarea[data-field="value"], textarea');
                        }
                        if (!inputEl && (targetKey === 'certifications' || targetKey === 'activities' || targetKey === 'interests')) {
                            inputEl = card.querySelector('input[data-field="value"], input[type="text"]');
                        }
                        if (inputEl) {
                            inputEl.focus();
                            inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            inputEl.style.outline = '2px solid #10b981';
                            setTimeout(() => { inputEl.style.outline = ''; }, 1200);
                        }
                    }
                }
            }
        }, 100);
    } else if (targetKey) {
        setTimeout(() => {
            const listContainer = document.getElementById(`list-${targetKey}`);
            if (listContainer) {
                listContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    }
});

let previewZoom = parseFloat(localStorage.getItem('preview_zoom')) || 1.0;

function changeZoom(delta) {
    previewZoom = Math.min(2.0, Math.max(0.3, previewZoom + delta));
    localStorage.setItem('preview_zoom', previewZoom.toFixed(2));
    applyZoom();
}

function resetZoom() {
    if (window.innerWidth <= 900) {
        autoFitMobileZoom();
    } else {
        previewZoom = 1.0;
        localStorage.setItem('preview_zoom', previewZoom.toFixed(2));
        applyZoom();
    }
}

function applyZoom() {
    document.documentElement.style.setProperty('--preview-zoom', previewZoom);
    const lbl = document.getElementById('lbl-zoom-level');
    if (lbl) {
        lbl.innerText = `${Math.round(previewZoom * 100)}%`;
    }
}

window.onload = async function () {
    if (!localStorage.getItem('cv_data')) {
        try {
            const response = await fetch('data.json');
            if (response.ok) {
                const data = await response.json();
                cvData = data;
                runMigrations(cvData);
                localStorage.setItem('cv_data', JSON.stringify(cvData));
            }
        } catch (e) {
            console.warn("Could not fetch data.json, falling back to embedded defaults:", e);
        }
    }
    populateFormInputs();
    changeLayout(currentLayout);
    if (window.innerWidth <= 900) {
        switchMobileView('editor');
    } else {
        applyZoom();
    }

    if (typeof injectFieldDesignButtons === 'function') {
        injectFieldDesignButtons();
    }
};

// ==========================================
// FIELD LEVEL STYLES (DEEP CONFIG)
// ==========================================

function mapPathToGlobalType(path) {
    if (!path) return 'body';
    if (path.startsWith('heading.')) return 'heading';
    if (path === 'contact.name') return 'name';
    if (path === 'contact.title_sub') return 'title';
    if (path.startsWith('contact.')) return 'muted';
    if (path === 'profile') return 'body';

    const last = path.split('.').pop();
    if (['title', 'degree', 'school', 'category'].includes(last)) return 'heading';
    if (['organization', 'date', 'location', 'company', 'period', 'stack'].includes(last)) return 'muted';
    if (['description', 'bullets', 'name', 'value'].includes(last)) return 'body';

    return 'body';
}

function getSelectorForPath(path) {
    if (path.startsWith('heading.')) {
        const section = path.split('.')[1];
        return `[data-section-title="${section}"]`;
    }
    if (path === 'contact.name') return '[data-editor-focus="input-name"]';
    if (path === 'contact.title_sub') return '[data-editor-focus="input-title-sub"]';
    if (path === 'profile') return '[data-editor-focus="input-profile"]';
    if (path.startsWith('contact.')) {
        const field = path.split('.')[1];
        return `[data-editor-focus="input-${field}"]`;
    }
    
    // Lists: experiences.0.title
    const parts = path.split('.');
    if (parts.length === 3) {
        const listName = parts[0];
        const index = parts[1];
        const fieldName = parts[2];
        return `[data-editor-target="${listName}"][data-editor-index="${index}"] [data-editor-field="${fieldName}"]`;
    }
    return null;
}

function updateFieldStyle(path, prop, val) {
    if (!cvData.design) cvData.design = {};
    if (!cvData.design.overrides) cvData.design.overrides = {};
    if (!cvData.design.overrides[path]) cvData.design.overrides[path] = {};

    cvData.design.overrides[path][prop] = val;
    applyDesignStyles();
    saveAndSync();
}

function getFieldStyle(path) {
    const type = mapPathToGlobalType(path);
    const globalTypo = (cvData.design && cvData.design.typography && cvData.design.typography[type]) || {};
    const overrides = (cvData.design && cvData.design.overrides && cvData.design.overrides[path]) || {};
    return { ...globalTypo, ...overrides };
}

window.toggleFieldVisibility = function(path, btn) {
    if (!cvData.hidden_fields) {
        cvData.hidden_fields = {};
    }
    
    // Toggle state
    cvData.hidden_fields[path] = !cvData.hidden_fields[path];
    
    // Update button visual state (add/remove "hidden" class or change icon)
    if (cvData.hidden_fields[path]) {
        btn.classList.add('field-hidden');
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>'; // eye-off icon
    } else {
        btn.classList.remove('field-hidden');
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>'; // eye icon
    }
    
    // Trigger save and re-render preview
    saveAndSync();
};

window.toggleListItemVisibility = function(key, index, btn) {
    if (!cvData.hidden_fields) {
        cvData.hidden_fields = {};
    }
    const path = `${key}.${index}`;
    cvData.hidden_fields[path] = !cvData.hidden_fields[path];
    
    saveAndSync();
};

window.isFieldVisible = function(path) {
    return !(cvData.hidden_fields && cvData.hidden_fields[path]);
};

function resetFieldStyle(path) {
    if (cvData.design && cvData.design.overrides && cvData.design.overrides[path]) {
        delete cvData.design.overrides[path];
        saveAndSync();
        applyDesignStyles();
        const panel = document.getElementById(`field-style-panel-${path.replace(/\./g, '-')}`);
        if (panel) {
            panel.outerHTML = buildFieldStylePanel(path);
        }
    }
}

function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return '#000000';
    if (rgb.startsWith('#')) return rgb;
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return '#000000';
    return '#' + [match[1], match[2], match[3]].map(x => {
        const h = parseInt(x).toString(16);
        return h.length === 1 ? '0' + h : h;
    }).join('');
}

function getDefaultFieldStyles(path) {
    const container = document.getElementById('screen-preview-container');
    if (!container) return {};

    const FOCUS_MAP = {
        'name': 'input-name',
        'title_sub': 'input-title-sub',
        'profile': 'input-profile',
        'contact.email': 'input-email',
        'contact.phone': 'input-phone',
        'contact.location': 'input-location',
        'contact.linkedin': 'input-linkedin',
        'contact.github': 'input-github',
        'contact.website': 'input-website',
        'contact.driver': 'input-driver',
    };

    let el = null;
    const focusKey = FOCUS_MAP[path];
    if (path.startsWith('heading.')) {
        const section = path.split('.')[1];
        el = container.querySelector(`[data-section-title="${section}"]`);
    } else if (focusKey) {
        el = container.querySelector(`[data-editor-focus="${focusKey}"]`);
    } else {
        const parts = path.split('.');
        if (parts.length === 3) {
            el = container.querySelector(`[data-editor-target="${parts[0]}"][data-editor-index="${parts[1]}"] [data-editor-field="${parts[2]}"]`);
        } else if (parts.length === 2) {
            el = container.querySelector(`[data-editor-target="${parts[0]}"][data-editor-index="${parts[1]}"]`);
        }
    }

    if (!el) return {};

    const comp = window.getComputedStyle(el);

    let fontWeight = comp.fontWeight;
    if (fontWeight === 'bold' || parseInt(fontWeight) >= 600) fontWeight = 'bold';
    else fontWeight = 'normal';

    return {
        color: rgbToHex(comp.color),
        fontSize: parseInt(comp.fontSize) || 14,
        fontWeight,
        fontStyle: comp.fontStyle === 'italic' ? 'italic' : 'normal',
        letterSpacing: comp.letterSpacing !== 'normal' ? parseFloat(comp.letterSpacing) || 0 : 0,
        textTransform: comp.textTransform !== 'none' ? comp.textTransform : 'none',
        textAlign: comp.textAlign || 'left',
        // Paragraph properties
        lineHeight: comp.lineHeight && comp.lineHeight !== 'normal'
            ? (parseFloat(comp.lineHeight) / (parseInt(comp.fontSize) || 14)).toFixed(2)
            : 1.45,
        textIndent: comp.textIndent ? parseFloat(comp.textIndent) || 0 : 0,
        wordSpacing: comp.wordSpacing && comp.wordSpacing !== 'normal' ? parseFloat(comp.wordSpacing) || 0 : 0,
        opacity: comp.opacity !== undefined ? parseFloat(comp.opacity) : 1,
    };
}

let figmaPanelZIndex = 9999;

function toggleFieldStylePanel(path, btn = null) {
    const id = `field-style-panel-${path.replace(/\./g, '-')}`;
    let panel = document.getElementById(id);

    // Close all other panels and reset button states
    document.querySelectorAll('.figma-style-panel').forEach(p => {
        if (p.id !== id) p.remove();
    });

    const wasActive = btn && btn.classList.contains('active');

    document.querySelectorAll('.btn-field-design.active').forEach(b => {
        b.classList.remove('active');
    });

    if (panel || wasActive) {
        if (panel) panel.remove();
        return; // It was open, now closed
    }

    if (btn) btn.classList.add('active');
    figmaPanelZIndex++;

    let align = 'right';
    let btnRect = { top: 0, left: 0, bottom: 0, right: 0, height: 0 };
    if (btn) {
        btnRect = btn.getBoundingClientRect();
        if (btnRect.left < window.innerWidth / 2) {
            align = 'left';
        }
    }

    // Build the panel and append directly to body
    const panelHtml = buildFieldStylePanel(path, false, align, figmaPanelZIndex);
    const temp = document.createElement('div');
    temp.innerHTML = panelHtml;
    panel = temp.firstElementChild;
    document.body.appendChild(panel);

    panel.style.position = 'fixed';
    panel.style.display = 'block';

    if (btn) {
        // Position it near the button
        if (align === 'left') {
            panel.style.left = `${btnRect.left}px`;
            panel.style.right = 'auto';
        } else {
            panel.style.right = `${window.innerWidth - btnRect.right}px`;
            panel.style.left = 'auto';
        }

        // Try to position it above the button, or below if no space
        const panelRect = panel.getBoundingClientRect();
        if (btnRect.top - panelRect.height - 8 > 0) {
            panel.style.top = `${btnRect.top - panelRect.height - 8}px`;
            panel.style.bottom = 'auto';
            panel.style.transformOrigin = align === 'left' ? 'bottom left' : 'bottom right';
        } else {
            panel.style.top = `${btnRect.bottom + 8}px`;
            panel.style.bottom = 'auto';
            panel.style.transformOrigin = align === 'left' ? 'top left' : 'top right';
        }
    }
}

// Close panels when clicking outside
document.addEventListener('click', function (e) {
    if (e.target.closest('.figma-style-panel') || e.target.closest('.btn-field-design')) {
        return;
    }
    document.querySelectorAll('.figma-style-panel').forEach(panel => {
        panel.remove();
    });
    document.querySelectorAll('.btn-field-design.active').forEach(btn => {
        btn.classList.remove('active');
    });
});

// Close panels on any scroll (with capture to catch sidebar scrolling)
window.addEventListener('scroll', function (e) {
    if (isRenderingPreview) return;
    
    // Don't close if scrolling inside the panel itself
    if (e.target.closest && e.target.closest('.figma-style-panel')) return;

    document.querySelectorAll('.figma-style-panel').forEach(panel => panel.remove());
    document.querySelectorAll('.btn-field-design.active').forEach(btn => btn.classList.remove('active'));
}, true);

function buildFieldStylePanel(path, hidden = true, align = 'right', zIndex = 9999) {
    const overrides = getFieldStyle(path);
    const defaults = getDefaultFieldStyles(path);
    const getVal = (prop, def) => overrides[prop] !== undefined ? overrides[prop] : (defaults[prop] !== undefined ? defaults[prop] : def);

    const id = `field-style-panel-${path.replace(/\./g, '-')}`;
    const displayStyle = hidden ? 'none' : 'block';
    const alignStyle = align === 'left' ? 'left: 0px; right: auto; transform-origin: bottom left;' : 'right: 0px; left: auto; transform-origin: bottom right;';

    const currentTT = getVal('textTransform', 'none');
    const currentAlign = getVal('textAlign', 'left');

    // Determine if this path represents a paragraph/textarea (multi-line content)
    const isParagraph = path === 'profile' ||
        (path.includes('.') && (path.endsWith('.bullets') || path.endsWith('.description') || path.endsWith('.profile')));

    const paragraphControls = isParagraph ? `
        <div class="f-panel-divider"><span>PARAGRAPHE</span></div>
        
        <div class="f-panel-row">
            <span class="f-panel-label">Interligne</span>
            <div class="f-input-wrapper">
                <input type="number" step="0.05" min="0.8" max="3" value="${parseFloat(getVal('lineHeight', 1.45)).toFixed(2)}" 
                       oninput="updateFieldStyle('${path}', 'lineHeight', this.value)">
                <span class="f-input-suffix">×</span>
            </div>
        </div>
        
        <div class="f-panel-row">
            <span class="f-panel-label">Retrait</span>
            <div class="f-input-wrapper">
                <input type="number" step="1" min="0" value="${parseInt(getVal('textIndent', 0))}" 
                       oninput="updateFieldStyle('${path}', 'textIndent', this.value + 'px')">
                <span class="f-input-suffix">px</span>
            </div>
        </div>
        
        <div class="f-panel-row">
            <span class="f-panel-label">Esp. mots</span>
            <div class="f-input-wrapper">
                <input type="number" step="0.5" value="${parseFloat(getVal('wordSpacing', 0))}" 
                       oninput="updateFieldStyle('${path}', 'wordSpacing', this.value + 'px')">
                <span class="f-input-suffix">px</span>
            </div>
        </div>

        <div class="f-panel-row">
            <span class="f-panel-label">Opacité</span>
            <div class="f-input-wrapper">
                <input type="number" step="0.05" min="0" max="1" value="${parseFloat(getVal('opacity', 1)).toFixed(2)}" 
                       oninput="updateFieldStyle('${path}', 'opacity', this.value)">
                <span class="f-input-suffix">/ 1</span>
            </div>
        </div>` : '';

    const justifyBtn = isParagraph ? `
                <button class="f-segment-btn ${currentAlign === 'justify' ? 'active' : ''}" 
                        onclick="updateFieldStyle('${path}', 'textAlign', 'justify'); Array.from(this.parentNode.children).forEach(c => c.classList.remove('active')); this.classList.add('active');" title="Justifier">
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </button>` : '';

    return `
    <div id="${id}" class="figma-style-panel" style="display: ${displayStyle}; ${alignStyle} z-index: ${zIndex};">
        <div class="f-panel-header">
            <span class="f-panel-title">PROPRIÉTÉS DU TEXTE</span>
            <button class="f-panel-reset" onclick="resetFieldStyle('${path}')" title="Réinitialiser">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            </button>
        </div>
        
        <div class="f-panel-divider"><span>TYPOGRAPHIE</span></div>

        <div class="f-panel-row">
            <span class="f-panel-label">Couleur</span>
            <div class="f-color-wrapper">
                <div class="f-color-swatch" style="background-color: ${getVal('color', '#ffffff')}"></div>
                <input type="color" value="${getVal('color', '#ffffff')}" 
                       oninput="this.previousElementSibling.style.backgroundColor = this.value; updateFieldStyle('${path}', 'color', this.value)"
                       onchange="saveAndSync()">
            </div>
        </div>
        
        <div class="f-panel-row">
            <span class="f-panel-label">Taille</span>
            <div class="f-input-wrapper">
                <input type="number" value="${parseInt(getVal('fontSize', 14))}" 
                       oninput="updateFieldStyle('${path}', 'fontSize', this.value + 'px')">
                <span class="f-input-suffix">px</span>
            </div>
        </div>
        
        <div class="f-panel-row">
            <span class="f-panel-label">Style</span>
            <div class="f-segmented-control">
                <button class="f-segment-btn ${getVal('fontWeight', 'normal') === 'bold' ? 'active' : ''}" 
                        onclick="this.classList.toggle('active'); updateFieldStyle('${path}', 'fontWeight', this.classList.contains('active') ? 'bold' : 'normal')" title="Gras">
                    <span style="font-weight: 700;">B</span>
                </button>
                <button class="f-segment-btn ${getVal('fontStyle', 'normal') === 'italic' ? 'active' : ''}" 
                        onclick="this.classList.toggle('active'); updateFieldStyle('${path}', 'fontStyle', this.classList.contains('active') ? 'italic' : 'normal')" title="Italique">
                    <span style="font-style: italic; font-family: serif;">I</span>
                </button>
            </div>
        </div>
        
        <div class="f-panel-row">
            <span class="f-panel-label">Espacement</span>
            <div class="f-input-wrapper">
                <input type="number" step="0.5" value="${parseFloat(getVal('letterSpacing', 0))}" 
                       oninput="updateFieldStyle('${path}', 'letterSpacing', this.value + 'px')">
                <span class="f-input-suffix">px</span>
            </div>
        </div>
        
        <div class="f-panel-row">
            <span class="f-panel-label">Casse</span>
            <div class="f-segmented-control" style="grid-template-columns: 1fr 1fr 1fr;">
                <button class="f-segment-btn ${currentTT === 'none' ? 'active' : ''}" 
                        onclick="updateFieldStyle('${path}', 'textTransform', 'none'); Array.from(this.parentNode.children).forEach(c => c.classList.remove('active')); this.classList.add('active');" title="Normal">
                    <span>Aa</span>
                </button>
                <button class="f-segment-btn ${currentTT === 'uppercase' ? 'active' : ''}" 
                        onclick="updateFieldStyle('${path}', 'textTransform', 'uppercase'); Array.from(this.parentNode.children).forEach(c => c.classList.remove('active')); this.classList.add('active');" title="Majuscules">
                    <span>AA</span>
                </button>
                <button class="f-segment-btn ${currentTT === 'lowercase' ? 'active' : ''}" 
                        onclick="updateFieldStyle('${path}', 'textTransform', 'lowercase'); Array.from(this.parentNode.children).forEach(c => c.classList.remove('active')); this.classList.add('active');" title="Minuscules">
                    <span>aa</span>
                </button>
            </div>
        </div>
        
        <div class="f-panel-row">
            <span class="f-panel-label">Align.</span>
            <div class="f-segmented-control" style="grid-template-columns: ${isParagraph ? '1fr 1fr 1fr 1fr' : '1fr 1fr 1fr'};">
                <button class="f-segment-btn ${currentAlign === 'left' || currentAlign === 'start' ? 'active' : ''}" 
                        onclick="updateFieldStyle('${path}', 'textAlign', 'left'); Array.from(this.parentNode.children).forEach(c => c.classList.remove('active')); this.classList.add('active');" title="Gauche">
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="15" y2="12"></line><line x1="3" y1="18" x2="19" y2="18"></line></svg>
                </button>
                <button class="f-segment-btn ${currentAlign === 'center' ? 'active' : ''}" 
                        onclick="updateFieldStyle('${path}', 'textAlign', 'center'); Array.from(this.parentNode.children).forEach(c => c.classList.remove('active')); this.classList.add('active');" title="Centrer">
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="6" y1="12" x2="18" y2="12"></line><line x1="4" y1="18" x2="20" y2="18"></line></svg>
                </button>
                <button class="f-segment-btn ${currentAlign === 'right' || currentAlign === 'end' ? 'active' : ''}" 
                        onclick="updateFieldStyle('${path}', 'textAlign', 'right'); Array.from(this.parentNode.children).forEach(c => c.classList.remove('active')); this.classList.add('active');" title="Droite">
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="9" y1="12" x2="21" y2="12"></line><line x1="5" y1="18" x2="21" y2="18"></line></svg>
                </button>
                ${justifyBtn}
            </div>
        </div>

        ${paragraphControls}
    </div>
    `;
}

function injectFieldDesignButtons() {
    // Inject design buttons next to all inputs that have data-field or updateField
    const inputs = document.querySelectorAll('input[oninput*="updateField"], textarea[oninput*="updateField"], input[oninput*="updateListItem"], textarea[oninput*="updateListItem"], input[oninput*="updateSimpleListItem"], textarea[oninput*="updateSimpleListItem"], textarea[oninput*="updateListBullets"], textarea[oninput*="updateSkillCategory"], input[oninput*="updateSkillCategory"]');

    inputs.forEach(input => {
        // Prevent double injection
        if (input.dataset.hasDesignBtn === 'true') return;

        let path = '';
        const oninput = input.getAttribute('oninput');

        // Extract path based on the function called
        if (oninput.includes("updateField('")) {
            path = oninput.split("updateField('")[1].split("'")[0];
        } else if (oninput.includes("updateListItem('")) {
            const parts = oninput.split("updateListItem('")[1].split("'");
            const key = parts[0];
            const index = oninput.split(", ")[1];
            const field = parts[2];
            path = `${key}.${index}.${field}`;
        } else if (oninput.includes("updateSimpleListItem('")) {
            const parts = oninput.split("updateSimpleListItem('")[1].split("'");
            const key = parts[0];
            const index = oninput.split(", ")[1];
            path = `${key}.${index}`;
        } else if (oninput.includes("updateListBullets('")) {
            const parts = oninput.split("updateListBullets('")[1].split("'");
            const key = parts[0];
            const index = oninput.split(", ")[1];
            path = `${key}.${index}.bullets`;
        } else if (oninput.includes("updateSkillCategory(")) {
            const parts = oninput.split("updateSkillCategory(")[1].split(", ");
            const index = parts[0];
            const field = parts[1].replace(/'/g, '');
            path = `skills.${index}.${field}`;
        }

        if (!path) return;

        input.dataset.hasDesignBtn = 'true';

        const btn = document.createElement('button');
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.38 0 2.5-1.12 2.5-2.5 0-.61-.23-1.17-.6-1.59-.3-.32-.4-.73-.4-1.12 0-1.1.9-2 2-2H19c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z"></path></svg>';
        btn.className = 'btn-field-design';
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Don't toggle 'active' here, let toggleFieldStylePanel handle it
            toggleFieldStylePanel(path, btn);
        };
        
        const isListItemInput = path.split('.').length >= 2 && !path.startsWith('contact.') && !path.startsWith('profile');

        const eyeBtn = document.createElement('button');
        const isHidden = cvData.hidden_fields && cvData.hidden_fields[path];
        if (isHidden) {
            eyeBtn.className = 'btn-field-design btn-field-visibility field-hidden';
            eyeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
        } else {
            eyeBtn.className = 'btn-field-design btn-field-visibility';
            eyeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
        }
        eyeBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFieldVisibility(path, eyeBtn);
        };
        
        const btnGroup = document.createElement('div');
        btnGroup.style.display = 'flex';
        btnGroup.style.alignItems = 'center';
        btnGroup.style.gap = '4px';
        if (!isListItemInput) {
            btnGroup.appendChild(eyeBtn);
        }
        btnGroup.appendChild(btn);

        // Find the associated label
        let formGroup = input.closest('.form-group');
        let actionsContainer = formGroup ? formGroup.querySelector('.field-actions-container') : null;
        let label = formGroup ? formGroup.querySelector('label') : null;
        
        if (!label && input.previousElementSibling && input.previousElementSibling.tagName === 'LABEL') {
            label = input.previousElementSibling;
        }

        if (actionsContainer) {
            // Append the injected buttons to the start of the existing actions container
            actionsContainer.insertBefore(btnGroup, actionsContainer.firstChild);
        } else if (label) {
            // Create a wrapper to hold the label and button so the button isn't inside the label
            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.justifyContent = 'space-between';
            wrapper.style.alignItems = 'center';
            wrapper.style.width = '100%';
            // Preserve margin
            wrapper.style.marginBottom = label.style.marginBottom || (window.getComputedStyle(label).marginBottom !== '0px' ? window.getComputedStyle(label).marginBottom : '0.5rem');
            
            label.parentNode.insertBefore(wrapper, label);
            
            label.style.marginBottom = '0';
            label.style.flex = '1';
            
            wrapper.appendChild(label);
            wrapper.appendChild(btnGroup);
        } else {
            // No label (like simple list items), wrap input and inject a header
            if (input.id === 'input-profile') {
                const wrapper = document.createElement('div');
                wrapper.className = 'field-design-wrapper';
                wrapper.style.width = '100%';
                wrapper.style.marginBottom = '0.5rem';
                
                const header = document.createElement('div');
                header.style.display = 'flex';
                header.style.justifyContent = 'space-between';
                header.style.alignItems = 'center';
                header.style.marginBottom = '4px';
                
                const dummyLabel = document.createElement('label');
                dummyLabel.innerText = "Design: Profil / Résumé";
                dummyLabel.style.marginBottom = '0';
                dummyLabel.style.fontSize = '0.72rem';
                dummyLabel.style.fontWeight = '600';
                dummyLabel.style.color = 'var(--text-muted)';
                dummyLabel.style.textTransform = 'uppercase';
                
                header.appendChild(dummyLabel);
                header.appendChild(btnGroup);
                wrapper.appendChild(header);
                
                input.parentNode.insertBefore(wrapper, input);
                wrapper.appendChild(input);
            } else {
                // List items, just append the design btn inline next to the input
                // btnGroup contains the palette button
                // The input is already in a flex container (from renderSimpleList or similar)
                // We'll wrap the input and btnGroup to keep them grouped nicely
                const inputGroup = document.createElement('div');
                inputGroup.style.display = 'flex';
                inputGroup.style.flex = '1';
                inputGroup.style.gap = '6px';
                inputGroup.style.alignItems = 'center';
                
                input.parentNode.insertBefore(inputGroup, input);
                inputGroup.appendChild(input);
                inputGroup.appendChild(btnGroup);
            }
        }
    });
}






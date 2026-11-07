/* ==========================================================
   CV Maker — Extra layouts: Timeline, Executive, Modern
   Loaded after app.js, before features.js.
   They reuse the Corporate vocabulary (.cv-prof-*) so pagination,
   editor click-to-focus and per-field styling work unchanged, and
   share the Corporate accent colour + theme presets.
   ========================================================== */
(function () {
    'use strict';

    const hidden = (k) => !!(cvData.hidden_sections && cvData.hidden_sections[k]);
    const has = (k) => Array.isArray(cvData[k]) && cvData[k].length > 0 && !hidden(k);
    const hdg = (k, d) => getHdg(k, d);
    const c = () => cvData.contact || {};

    function setAccent() {
        const t = cvData.themes && cvData.themes.professional;
        if (t && t.navy_primary) document.documentElement.style.setProperty('--prof-navy', t.navy_primary);
    }

    function pfp(cls) {
        if (!c().image || (cvData.design && !cvData.design.show_pfp)) return '';
        const sz = c().image_size || 80;
        return `<img src="${c().image}" class="cv-prof-pfp ${cls || ''}" style="width:${sz}px; height:${sz}px;" alt="PFP" data-editor-tab="tab-profile">`;
    }

    function contactSpans() {
        const k = c(), out = [];
        const tab = 'data-editor-tab="tab-profile"';
        if (k.email) out.push(`<span ${tab} data-editor-focus="input-email">${ICONS.email}<a href="${formatEmailHref(k.email)}" target="_blank">${k.email}</a></span>`);
        if (k.phone) out.push(`<span ${tab} data-editor-focus="input-phone">${ICONS.phone}<a href="tel:${k.phone}">${k.phone}</a></span>`);
        if (k.location) out.push(`<span ${tab} data-editor-focus="input-location">${ICONS.location}${k.location}</span>`);
        if (k.driver) out.push(`<span ${tab} data-editor-focus="input-driver">${ICONS.driver}${k.driver}</span>`);
        if (k.linkedin) out.push(`<span ${tab} data-editor-focus="input-linkedin">${ICONS.linkedin}<a href="${formatLinkedinHref(k.linkedin)}" target="_blank">${k.linkedin}</a></span>`);
        if (k.github) out.push(`<span ${tab} data-editor-focus="input-github">${ICONS.github}<a href="${formatGithubHref(k.github)}" target="_blank">${k.github}</a></span>`);
        if (k.website) out.push(`<span ${tab} data-editor-focus="input-website">${ICONS.website}<a href="${formatHref(k.website)}" target="_blank">${k.website}</a></span>`);
        return out.join('');
    }

    const bullets = (arr) => (arr || []).map((b) => `<li data-editor-field="bullets">${b}</li>`).join('');

    /* ---------- shared section builders ---------- */
    const S = {
        profile(extraCls) {
            if (!(cvData.profile && cvData.profile.trim()) || hidden('profile')) return '';
            return `<section class="section ${extraCls || ''}">
                <div class="cv-prof-sectitle" data-editor-tab="tab-profile" data-section-title="profile">${hdg('profile', 'Profil Professionnel')}</div>
                <p class="cv-v-profile" data-editor-tab="tab-profile" data-editor-focus="input-profile">${cvData.profile}</p></section>`;
        },
        job(key, defTitle, itemCls, wrapCls) {
            if (!has(key)) return '';
            const items = cvData[key].map((e, i) => `
                <div class="cv-prof-item ${itemCls || ''}" data-editor-tab="tab-experiences" data-editor-target="${key}" data-editor-index="${i}">
                    <div class="cv-prof-itemhead">
                        <span><span data-editor-field="title">${e.title}</span> — <span class="cv-prof-itemorg" data-editor-field="company">${e.company}</span></span>
                        <span class="cv-prof-itemdate" data-editor-field="period">${e.period}</span>
                    </div>
                    <div class="cv-v-loc" data-editor-field="location">${e.location}</div>
                    <ul class="cv-prof-bullets" data-editor-field="bullets">${bullets(e.bullets)}</ul>
                </div>`).join('');
            return `<section class="section">
                <div class="cv-prof-sectitle" data-editor-tab="tab-experiences" data-section-title="${key}">${hdg(key, defTitle)}</div>
                <div class="${wrapCls || ''}">${items}</div></section>`;
        },
        projects(itemCls, wrapCls) {
            if (!has('projects')) return '';
            const items = cvData.projects.map((p, i) => `
                <div class="cv-prof-item ${itemCls || ''}" data-editor-tab="tab-projects" data-editor-target="projects" data-editor-index="${i}">
                    <div class="cv-prof-itemhead">
                        <span data-editor-field="title">${p.title}</span>
                        <span class="cv-prof-itemdate" data-editor-field="stack">${p.stack}</span>
                    </div>
                    <p class="cv-v-desc" data-editor-field="description">${p.description}</p>
                </div>`).join('');
            return `<section class="section">
                <div class="cv-prof-sectitle" data-editor-tab="tab-projects" data-section-title="projects">${hdg('projects', 'Projets Clés')}</div>
                <div class="${wrapCls || ''}">${items}</div></section>`;
        },
        skills(chips) {
            if (!has('skills')) return '';
            const rows = cvData.skills.map((s, i) => {
                const val = chips
                    ? `<div class="cv-v-chips" data-editor-field="value">${String(s.value || '').split(/,(?![^(]*\))/).map((x) => x.trim().replace(/\.$/, '')).filter(Boolean).map((x) => `<span class="cv-v-chip">${x}</span>`).join('')}</div>`
                    : `<span data-editor-field="value">${s.value}</span>`;
                return `<div class="cv-prof-skillrow" data-editor-tab="tab-skills" data-editor-target="skills" data-editor-index="${i}">
                    <strong data-editor-field="category">${s.category}${chips ? '' : ' :'}</strong>${chips ? '' : ' '}${val}</div>`;
            }).join('');
            return `<section class="section"><div class="cv-prof-sectitle" data-editor-tab="tab-skills" data-section-title="skills">${hdg('skills', 'Compétences Techniques')}</div>${rows}</section>`;
        },
        education() {
            if (!has('education')) return '';
            const rows = cvData.education.map((e, i) => `
                <div class="cv-prof-item cv-v-edu" data-editor-tab="tab-education" data-editor-target="education" data-editor-index="${i}">
                    <div class="cv-v-edu-deg" data-editor-field="degree">${e.degree}</div>
                    <div class="cv-v-edu-sub"><span data-editor-field="school">${e.school}</span> | <span data-editor-field="period">${e.period}</span></div>
                </div>`).join('');
            return `<section class="section"><div class="cv-prof-sectitle" data-editor-tab="tab-education" data-section-title="education">${hdg('education', 'Éducation')}</div>${rows}</section>`;
        },
        certs() {
            if (!has('certifications')) return '';
            const li = cvData.certifications.map((x, i) => `<li data-editor-tab="tab-education" data-editor-target="certifications" data-editor-index="${i}" data-editor-field="value">${x}</li>`).join('');
            return `<section class="section"><div class="cv-prof-sectitle" data-editor-tab="tab-education" data-section-title="certifications">${hdg('certifications', 'Certifications')}</div><ul class="cv-prof-bullets">${li}</ul></section>`;
        },
        activities() {
            if (!has('activities')) return '';
            const li = cvData.activities.map((x, i) => `<li data-editor-tab="tab-education" data-editor-target="activities" data-editor-index="${i}" data-editor-field="value">${x}</li>`).join('');
            return `<section class="section"><div class="cv-prof-sectitle" data-editor-tab="tab-education" data-section-title="activities">${hdg('activities', 'Engagements & Activités')}</div><ul class="cv-prof-bullets">${li}</ul></section>`;
        },
        languages(listMode) {
            const showL = has('languages'), showI = has('interests');
            if (!showL && !showI) return '';
            const l = showL ? cvData.languages.map((x, i) => `<${listMode ? 'div' : 'span'} class="cv-v-lang" data-editor-tab="tab-education" data-editor-target="languages" data-editor-index="${i}"><strong data-editor-field="name">${x.name}</strong> <span class="cv-v-langlvl">(<span data-editor-field="level">${x.level}</span>)</span></${listMode ? 'div' : 'span'}>`).join(listMode ? '' : ', ') : '';
            const it = showI ? `<div class="cv-v-interests">${cvData.interests.map((x, i) => `<span data-editor-tab="tab-education" data-editor-target="interests" data-editor-index="${i}" data-editor-field="value">${x}</span>`).join(', ')}</div>` : '';
            return `<section class="section"><div class="cv-prof-sectitle" data-editor-tab="tab-education" data-section-title="languages">${hdg('languages', 'Langues')}</div>${l}${it}</section>`;
        }
    };

    const headerText = () => `
        <h1 class="cv-prof-name" data-editor-tab="tab-profile" data-editor-focus="input-name">${c().name}</h1>
        <p class="cv-prof-title" data-editor-tab="tab-profile" data-editor-focus="input-title-sub">${c().title_sub}</p>
        <div class="cv-prof-contacts" data-editor-tab="tab-profile">${contactSpans()}</div>`;

    /* ---------- 1. Timeline ---------- */
    function renderTimelineLayout() {
        setAccent();
        return `<div class="cv-v-body cv-v-timeline">
            <header class="cv-v-head" data-editor-tab="tab-profile">
                ${pfp('cv-v-pfp')}
                <div class="cv-v-head-text">${headerText()}</div>
            </header>
            ${S.profile()}
            ${S.job('experiences', 'Parcours Professionnel', 'cv-v-tl-item', 'cv-v-tl')}
            ${hidden('formations') ? '' : S.job('formations', 'Stages & Formations', 'cv-v-tl-item', 'cv-v-tl')}
            ${S.projects('cv-v-tl-item', 'cv-v-tl')}
            <div class="cv-v-two">
                <div>${S.skills(false)}${S.education()}</div>
                <div>${S.certs()}${S.languages(false)}${S.activities()}</div>
            </div>
        </div>`;
    }

    /* ---------- 2. Executive ---------- */
    function renderExecutiveLayout() {
        setAccent();
        return `<div class="cv-v-body cv-v-exec">
            <header class="cv-v-band" data-editor-tab="tab-profile">
                <div class="cv-v-head-text">${headerText()}</div>
                ${pfp('cv-v-pfp')}
            </header>
            <div class="cv-v-exec-grid">
                <main class="cv-v-exec-main">
                    ${S.profile()}
                    ${S.job('experiences', 'Expérience Professionnelle')}
                    ${hidden('formations') ? '' : S.job('formations', 'Stages & Formations')}
                    ${S.projects()}
                </main>
                <aside class="cv-v-exec-side">
                    ${S.skills(false)}
                    ${S.education()}
                    ${S.certs()}
                    ${S.languages(true)}
                    ${S.activities()}
                </aside>
            </div>
        </div>`;
    }

    /* ---------- 3. Modern (cards + chips) ---------- */
    function renderModernLayout() {
        setAccent();
        return `<div class="cv-v-body cv-v-modern">
            <header class="cv-v-head" data-editor-tab="tab-profile">
                <div class="cv-v-head-text">${headerText()}</div>
                ${pfp('cv-v-pfp')}
            </header>
            ${S.profile('cv-v-lead')}
            ${S.job('experiences', 'Expériences Professionnelles', 'cv-v-job')}
            ${hidden('formations') ? '' : S.job('formations', 'Stages & Formations', 'cv-v-job')}
            ${S.projects('cv-v-card', 'cv-v-cards')}
            ${S.skills(true)}
            <div class="cv-v-two">
                <div>${S.education()}${S.certs()}</div>
                <div>${S.languages(false)}${S.activities()}</div>
            </div>
        </div>`;
    }

    window.CVX_LAYOUTS = {
        timeline: renderTimelineLayout,
        executive: renderExecutiveLayout,
        modern: renderModernLayout
    };
})();

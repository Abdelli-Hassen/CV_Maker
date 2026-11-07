/* ==========================================================
   CV Maker — Feature layer
   Loaded after app.js. Shares its globals (cvData, saveAndSync…).
   Adds: undo/redo, toasts, CV score + job-match analyser,
   fit-to-pages, multi-CV manager, template gallery, reordering,
   keyboard shortcuts.
   ========================================================== */
(function () {
    'use strict';

    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const store = {
        get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
        set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
    };
    const clone = (o) => JSON.parse(JSON.stringify(o));
    const ICON = {
        undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/></svg>',
        redo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 15-6.7L21 13"/></svg>',
        layout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M9 9h12"/></svg>',
        files: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
        gauge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>'
    };

    /* ------------------------------------------------------
       TOASTS
       ------------------------------------------------------ */
    function toast(msg, type = 'info', ms = 3200) {
        let box = $('.cvx-toasts');
        if (!box) { box = document.createElement('div'); box.className = 'cvx-toasts'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
        const t = document.createElement('div');
        t.className = 'cvx-toast ' + type;
        t.textContent = msg;
        box.appendChild(t);
        setTimeout(() => { t.classList.add('leaving'); setTimeout(() => t.remove(), 280); }, ms);
    }

    /* ------------------------------------------------------
       MODAL
       ------------------------------------------------------ */
    let activeModal = null;
    function closeModal() { if (activeModal) { activeModal.remove(); activeModal = null; } }
    function openModal(title, subtitle, bodyHTML, small) {
        closeModal();
        const m = document.createElement('div');
        m.className = 'cvx-modal';
        m.innerHTML = `
            <div class="cvx-dialog ${small ? 'cvx-dialog--sm' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
                <div class="cvx-dialog-head">
                    <div><h2>${esc(title)}</h2>${subtitle ? `<p>${esc(subtitle)}</p>` : ''}</div>
                    <button class="cvx-x" aria-label="Fermer" data-close>×</button>
                </div>
                <div class="cvx-dialog-body">${bodyHTML}</div>
            </div>`;
        m.addEventListener('mousedown', (e) => { if (e.target === m || e.target.hasAttribute('data-close')) closeModal(); });
        document.body.appendChild(m);
        activeModal = m;
        return m;
    }

    /* ------------------------------------------------------
       HISTORY (undo / redo)
       ------------------------------------------------------ */
    const H = { past: [], future: [], last: null, base: null, timer: null, limit: 50 };

    function snapNow() { return JSON.stringify(cvData); }

    function initHistory() { H.last = snapNow(); updateHistoryButtons(); }

    function flushPending() {
        if (H.timer) {
            clearTimeout(H.timer); H.timer = null;
            commitPending();
        }
    }
    function commitPending() {
        const cur = snapNow();
        if (H.base != null && H.base !== cur) {
            H.past.push(H.base);
            if (H.past.length > H.limit) H.past.shift();
            H.future = [];
        }
        H.base = null; H.last = cur;
        updateHistoryButtons();
    }

    function onChange() {
        markSaving();
        if (H.last == null) return;
        if (H.base == null) H.base = H.last;
        clearTimeout(H.timer);
        H.timer = setTimeout(() => { H.timer = null; commitPending(); }, 650);
    }

    // For bulk replacements (import / reset / load version): explicit checkpoints
    function checkpoint() {
        flushPending();
        const cur = snapNow();
        if (H.past[H.past.length - 1] !== cur) { H.past.push(cur); if (H.past.length > H.limit) H.past.shift(); }
        H.future = [];
    }
    function settle() { H.last = snapNow(); H.base = null; updateHistoryButtons(); }

    function applySnapshot(str) {
        cvData = JSON.parse(str);
        runMigrations(cvData);
        persistData();
        populateFormInputs();
        renderPreview();
        afterRender();
        H.last = str;
    }
    function undo() {
        flushPending();
        if (!H.past.length) return toast('Rien à annuler');
        H.future.push(snapNow());
        applySnapshot(H.past.pop());
        updateHistoryButtons();
    }
    function redo() {
        flushPending();
        if (!H.future.length) return toast('Rien à rétablir');
        H.past.push(snapNow());
        applySnapshot(H.future.pop());
        updateHistoryButtons();
    }
    function updateHistoryButtons() {
        const u = $('#cvx-undo'), r = $('#cvx-redo');
        if (u) u.disabled = !H.past.length && !H.timer;
        if (r) r.disabled = !H.future.length;
    }

    /* ------------------------------------------------------
       SAVE INDICATOR
       ------------------------------------------------------ */
    let savedTimer = null;
    function markSaving() {
        const el = $('#cvx-saved'); if (!el) return;
        el.textContent = 'Enregistrement…'; el.classList.add('is-saving');
        clearTimeout(savedTimer);
        savedTimer = setTimeout(() => { el.textContent = '✓ Enregistré'; el.classList.remove('is-saving'); }, 700);
    }

    /* ------------------------------------------------------
       TEXT ANALYSIS HELPERS
       ------------------------------------------------------ */
    const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const SKIP_KEYS = new Set(['themes', 'design', 'hidden_fields', 'hidden_sections', 'image', 'image_size', 'headings']);
    function collectText(v, out = []) {
        if (typeof v === 'string') out.push(v);
        else if (Array.isArray(v)) v.forEach((x) => collectText(x, out));
        else if (v && typeof v === 'object') for (const k in v) if (!SKIP_KEYS.has(k)) collectText(v[k], out);
        return out;
    }
    const cvPlainText = () => norm(collectText(cvData).join(' \n '));

    const STOP = new Set(('the and for with you your our are will have has from that this who use used using able work working team into more such per all any can may their they them but not out via about over under within across ' +
        'les des une que qui pour dans avec sur par est sont aux nos vos notre votre vous nous elle ils elles ete etre avoir plus tres ainsi entre chez comme cette ces ses son leur leurs fait faire afin dont mais donc sans sous lors ' +
        'poste profil mission missions experience experiences entreprise equipe candidat candidature recherche recherchons rejoindre rejoignez offre emploi h/f f/h cdi cdd stage alternance anne annee ans').split(/\s+/));

    function extractKeywords(text, max = 28) {
        const freq = new Map();
        (norm(text).match(/[a-z0-9][a-z0-9+#.\-/]{1,}/g) || []).forEach((raw) => {
            const w = raw.replace(/^[.\-/]+|[.\-/]+$/g, '');
            if (w.length < 3 || STOP.has(w) || /^\d+$/.test(w)) return;
            freq.set(w, (freq.get(w) || 0) + 1);
        });
        return [...freq.entries()]
            .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
            .slice(0, max).map((e) => e[0]);
    }
    function hasKeyword(cvText, kw) {
        const esc2 = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (new RegExp('(?<![a-z0-9])' + esc2, 'i').test(cvText)) return true;
        return kw.length >= 7 && cvText.includes(kw.slice(0, kw.length - 2));
    }

    const VERB_RE = new RegExp('^(' + [
        'conc', 'develop', 'deploy', 'install', 'configur', 'ger', 'gere', 'cre', 'mis', 'optimis', 'administr', 'supervis', 'realis', 'implement', 'automatis', 'migr', 'securis', 'assur', 'dirig', 'pilot', 'integr', 'maintenu', 'maintenance',
        'analys', 'diagnost', 'deploi', 'cabl', 'assembl', 'etudi', 'constr', 'adminis', 'repar', 'resolu', 'form', 'coordonn', 'redig', 'test', 'livr', 'ameliore', 'reduit', 'augment', 'lanc', 'conduit', 'anim', 'negoci', 'planifi', 'organis', 'elabor', 'constru', 'participe', 'contribu', 'collabor', 'accompagn', 'depann', 'surveill', 'monitor', 'sensibilis', 'standardis', 'documente', 'rationalis', 'modernis', 'concu',
        'led', 'built', 'design', 'developed', 'managed', 'created', 'implemented', 'deployed', 'improved', 'reduced', 'increased', 'automated', 'optimized', 'launched', 'delivered', 'architect', 'maintained', 'configured', 'installed', 'integrated', 'owned', 'drove', 'mentored'
    ].join('|') + ')', 'i');
    const LABEL_RE = /^[^:]{2,45}\s*:/; // "Déploiement LAN : …" style is accepted

    /* ------------------------------------------------------
       CV SCORE
       ------------------------------------------------------ */
    const pageCount = () => document.querySelectorAll('#screen-preview-container .a4-page-sheet').length || 1;

    function computeScore() {
        const d = cvData, c = d.contact || {};
        const checks = [];
        const add = (group, label, pts, max, detail) => checks.push({ group, label, pts: Math.round(pts * 10) / 10, max, detail });

        // Contact (20)
        add('Contact', 'Nom complet', c.name ? 5 : 0, 5, c.name ? 'Présent.' : 'Ajoutez votre nom complet.');
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((c.email || '').trim());
        add('Contact', 'E-mail valide', emailOk ? 5 : 0, 5, emailOk ? 'Format valide.' : (c.email ? 'Le format de l\'e-mail semble invalide.' : 'Ajoutez une adresse e-mail professionnelle.'));
        add('Contact', 'Téléphone', c.phone ? 4 : 0, 4, c.phone ? 'Présent.' : 'Les recruteurs veulent pouvoir vous appeler.');
        add('Contact', 'Localisation', c.location ? 2 : 0, 2, c.location ? 'Présent.' : 'Indiquez au moins votre ville ou pays.');
        const links = [c.linkedin, c.github, c.website].filter(Boolean).length;
        add('Contact', 'Liens en ligne', links ? 4 : 0, 4, links ? `${links} lien(s) (LinkedIn, GitHub, portfolio).` : 'Ajoutez LinkedIn, GitHub ou un portfolio.');

        // Profile (15)
        const plen = (d.profile || '').trim().length;
        let pp = 0, pd = 'Ajoutez un résumé de 2 à 4 phrases ciblant le poste visé.';
        if (plen >= 150 && plen <= 600) { pp = 15; pd = `${plen} caractères — longueur idéale.`; }
        else if (plen > 600) { pp = 8; pd = `${plen} caractères — trop long, visez 150 à 600.`; }
        else if (plen >= 40) { pp = 8; pd = `${plen} caractères — un peu court, visez 150 à 600.`; }
        add('Profil', 'Résumé professionnel', pp, 15, pd);

        // Experience (25)
        const exps = [...(d.experiences || []), ...(d.formations || [])];
        const bullets = exps.flatMap((e) => (e.bullets || []).map((b) => String(b).trim()).filter(Boolean));
        add('Expérience', 'Au moins une expérience', exps.length ? 8 : 0, 8, exps.length ? `${exps.length} expérience(s)/stage(s).` : 'Ajoutez vos expériences, stages ou projets professionnels.');
        const avg = exps.length ? bullets.length / exps.length : 0;
        add('Expérience', 'Missions par poste (2 à 6)', avg >= 2 && avg <= 6 ? 7 : (avg > 0 ? 3 : 0), 7, exps.length ? `Moyenne : ${avg.toFixed(1)} mission(s) par poste.` : 'Détaillez 2 à 6 missions par poste.');
        const strong = bullets.filter((b) => VERB_RE.test(norm(b)) || LABEL_RE.test(b)).length;
        const sr = bullets.length ? strong / bullets.length : 0;
        add('Expérience', 'Verbes d\'action en début de ligne', sr * 5, 5, bullets.length ? `${Math.round(sr * 100)} % des missions commencent par un verbe d'action ou un intitulé clair.` : 'Commencez chaque mission par un verbe (conçu, déployé, optimisé…).');
        const metr = bullets.filter((b) => /\d/.test(b)).length;
        const mr = bullets.length ? metr / bullets.length : 0;
        add('Expérience', 'Résultats chiffrés', Math.min(1, mr / 0.25) * 5, 5, bullets.length ? `${Math.round(mr * 100)} % des missions contiennent un chiffre. Visez 25 % ou plus (%, nombre d'utilisateurs, délais…).` : 'Quantifiez vos résultats : %, volumes, délais, taille d\'équipe.');

        // Skills (15)
        const skills = d.skills || [];
        const skillItems = skills.flatMap((s) => String(s.value || '').split(/[,;•]/).map((x) => x.trim()).filter(Boolean));
        add('Compétences', 'Catégories de compétences', skills.length >= 2 ? 7 : (skills.length ? 3 : 0), 7, skills.length ? `${skills.length} catégorie(s).` : 'Regroupez vos compétences en 2 à 5 catégories.');
        add('Compétences', 'Nombre de compétences (8+)', Math.min(1, skillItems.length / 8) * 8, 8, `${skillItems.length} compétence(s) listée(s). Visez 8 à 25 mots-clés pertinents.`);

        // Education / languages (10)
        const hasEdu = (d.education || []).length > 0;
        add('Formation', 'Formation / diplômes', hasEdu ? 5 : 0, 5, hasEdu ? 'Présent.' : 'Ajoutez votre formation.');
        const hasLang = (d.languages || []).length > 0;
        add('Formation', 'Langues', hasLang ? 5 : 0, 5, hasLang ? 'Présent.' : 'Indiquez vos langues et niveaux.');

        // Format (15)
        const pg = pageCount();
        add('Format', 'Longueur du CV', pg === 1 ? 10 : (pg === 2 ? 7 : 2), 10, pg === 1 ? '1 page — idéal.' : (pg === 2 ? '2 pages — acceptable pour un profil expérimenté.' : `${pg} pages — trop long. Utilisez « Ajuster à 1 page » ou condensez.`));
        const longB = bullets.filter((b) => b.length > 220).length;
        add('Format', 'Lisibilité des missions', longB ? Math.max(0, 5 - longB) : 5, 5, longB ? `${longB} mission(s) dépassent 220 caractères : scindez-les.` : 'Missions concises.');

        const total = checks.reduce((a, x) => a + x.pts, 0);
        const max = checks.reduce((a, x) => a + x.max, 0);
        return { score: Math.round((total / max) * 100), checks, pages: pg };
    }

    const verdict = (s) => s >= 85 ? ['Excellent', 'Votre CV est prêt à être envoyé.', 'ok']
        : s >= 70 ? ['Solide', 'Quelques ajustements le rendront remarquable.', 'ok']
            : s >= 50 ? ['À renforcer', 'Suivez les conseils ci-dessous pour gagner en impact.', 'warn']
                : ['Incomplet', 'Complétez les éléments essentiels en priorité.', 'bad'];
    const colorFor = (k) => ({ ok: '#34d399', warn: '#fbbf24', bad: '#f87171' }[k]);

    function renderAnalyse() {
        const host = $('#cvx-analyse-body'); if (!host) return;
        const r = computeScore();
        const [vt, vd, vk] = verdict(r.score);
        const C = 2 * Math.PI * 36;
        const groups = {};
        r.checks.forEach((c) => (groups[c.group] = groups[c.group] || []).push(c));
        const order = [...r.checks].sort((a, b) => (a.pts / a.max) - (b.pts / b.max));
        const top = order.filter((c) => c.pts < c.max).slice(0, 3);

        host.innerHTML = `
            <div class="cvx-score-hero">
                <div class="cvx-ring" aria-label="Score ${r.score} sur 100">
                    <svg width="84" height="84" viewBox="0 0 84 84"><circle cx="42" cy="42" r="36" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="8"/>
                    <circle cx="42" cy="42" r="36" fill="none" stroke="${colorFor(vk)}" stroke-width="8" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - r.score / 100)}"/></svg>
                    <div class="cvx-ring-num">${r.score}</div>
                </div>
                <div><h3>${vt}</h3><p>${vd}</p><p style="margin-top:4px">${r.pages} page${r.pages > 1 ? 's' : ''} · ${(collectText(cvData).join(' ').match(/\S+/g) || []).length} mots</p></div>
            </div>
            ${top.length ? `<div class="cvx-card"><h4>Priorités</h4><p>Les 3 améliorations qui feront le plus progresser votre score :</p>
                <div class="cvx-checks" style="margin-top:0">${top.map(checkHTML).join('')}</div></div>` : ''}
            <div class="cvx-card"><h4>Mise en page</h4><p>Ajuste automatiquement la taille du texte, l'interligne et les marges pour tenir sur le nombre de pages voulu.</p>
                <div class="cvx-row"><button class="cvx-btn" data-fit="1" style="justify-content:center">Ajuster à 1 page</button><button class="cvx-btn" data-fit="2" style="justify-content:center">Ajuster à 2 pages</button></div></div>
            <div class="cvx-card"><h4>Compatibilité avec une offre</h4>
                <p>Collez le texte d'une offre d'emploi : l'analyseur extrait les mots-clés et vérifie lesquels figurent dans votre CV (utile pour les logiciels ATS).</p>
                <textarea id="cvx-jd" rows="5" placeholder="Collez ici la description du poste…">${esc(store.get('cv_jd', ''))}</textarea>
                <div id="cvx-jd-result"></div></div>
            <div class="cvx-card"><h4>Détail du score</h4>
                ${Object.keys(groups).map((g) => `<div style="margin-top:.7rem;font:700 .68rem 'Plus Jakarta Sans';letter-spacing:.06em;text-transform:uppercase;color:var(--accent)">${esc(g)}</div>
                <div class="cvx-checks" style="margin-top:.35rem">${groups[g].map(checkHTML).join('')}</div>`).join('')}</div>`;
        runMatch();
    }
    function checkHTML(c) {
        const k = c.pts >= c.max ? 'ok' : (c.pts > 0 ? 'warn' : 'bad');
        return `<div class="cvx-check ${k}"><div class="ic">${k === 'ok' ? '✓' : (k === 'warn' ? '!' : '✕')}</div>
            <div><b>${esc(c.label)}</b><span class="d">${esc(c.detail)}</span></div><div class="pts">${c.pts}/${c.max}</div></div>`;
    }

    function runMatch() {
        const ta = $('#cvx-jd'), out = $('#cvx-jd-result'); if (!ta || !out) return;
        const text = ta.value.trim();
        if (!text) { out.innerHTML = ''; return; }
        const kws = extractKeywords(text), cv = cvPlainText();
        const hit = kws.filter((k) => hasKeyword(cv, k)), miss = kws.filter((k) => !hasKeyword(cv, k));
        const pct = kws.length ? Math.round((hit.length / kws.length) * 100) : 0;
        out.innerHTML = `
            <div class="cvx-match"><b>${pct} %</b><div class="cvx-meter"><div style="width:${pct}%;background-position:${pct}% 0"></div></div><span style="color:var(--text-muted)">${hit.length}/${kws.length}</span></div>
            ${miss.length ? `<div style="margin-top:.6rem;font-size:.72rem;color:var(--text-muted)">Absents de votre CV — ajoutez ceux qui correspondent réellement à votre expérience :</div><div class="cvx-chips">${miss.map((k) => `<span class="cvx-chip miss">${esc(k)}</span>`).join('')}</div>` : ''}
            ${hit.length ? `<div style="margin-top:.6rem;font-size:.72rem;color:var(--text-muted)">Déjà présents :</div><div class="cvx-chips">${hit.map((k) => `<span class="cvx-chip hit">${esc(k)}</span>`).join('')}</div>` : ''}`;
    }

    /* ------------------------------------------------------
       FIT TO N PAGES
       ------------------------------------------------------ */
    function fitToPages(n) {
        checkpoint();
        const d = cvData.design || (cvData.design = {});
        const orig = clone(d);
        const start = { base: d.base_size || 14, lh: d.line_height || 1.45, mg: d.page_margin != null ? d.page_margin : 15, sp: d.section_spacing || 1.2 };
        const steps = [];
        // Progressive tightening: spacing first, then line-height, margins, then font size
        for (let i = 0; i <= 40; i++) {
            steps.push({
                base_size: Math.max(10, start.base - Math.floor(i / 8)),
                line_height: Math.max(1.15, +(start.lh - i * 0.012).toFixed(3)),
                page_margin: Math.max(8, start.mg - Math.floor(i / 4)),
                section_spacing: Math.max(0.5, +(start.sp - i * 0.04).toFixed(2))
            });
        }
        let ok = false;
        for (const s of steps) {
            Object.assign(d, s);
            renderPreview();
            if (pageCount() <= n) { ok = true; break; }
        }
        if (!ok) { Object.assign(cvData.design, orig); renderPreview(); }
        persistData(); populateFormInputs(); afterRender(); settle();
        if (ok) toast(`Mise en page ajustée : ${pageCount()} page${pageCount() > 1 ? 's' : ''}.`, 'success');
        else toast(`Impossible de tenir sur ${n} page${n > 1 ? 's' : ''} sans rendre le texte illisible. Condensez le contenu.`, 'error', 5000);
    }

    /* ------------------------------------------------------
       VERSIONS (multi-CV manager)
       ------------------------------------------------------ */
    const VKEY = 'cv_versions';
    const getVersions = () => store.get(VKEY, []);
    const fmtDate = (t) => new Date(t).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

    function openVersions() {
        const m = openModal('Mes CV', 'Gardez plusieurs versions (une par poste visé) dans ce navigateur.', '<div id="cvx-ver-host"></div>', true);
        drawVersions(m);
    }
    function drawVersions(m) {
        const host = $('#cvx-ver-host', m); if (!host) return;
        const list = getVersions();
        const cur = cvData.contact && cvData.contact.name ? `CV ${cvData.contact.name}` : 'Mon CV';
        host.innerHTML = `
            <div class="cvx-row"><input class="cvx-field" id="cvx-ver-name" maxlength="60" placeholder="Nom de la version, ex. Développeur Full-Stack" value="${esc(cur)}" style="flex:3">
                <button class="cvx-btn" id="cvx-ver-save" style="justify-content:center;flex:1">Enregistrer</button></div>
            <div class="cvx-row" style="margin-top:.5rem"><button class="cvx-btn" id="cvx-ver-new" style="justify-content:center">+ Nouveau CV vierge</button></div>
            <div class="cvx-ver-list">${list.length ? list.map((v) => `
                <div class="cvx-ver" data-id="${esc(v.id)}"><div class="cvx-ver-info"><b>${esc(v.name)}</b><small>${esc(v.layout)} · ${fmtDate(v.updated)}</small></div>
                    <button class="cvx-btn" data-act="load">Ouvrir</button><button class="cvx-btn" data-act="update" title="Remplacer par le CV actuel">Màj</button>
                    <button class="cvx-btn" data-act="dup">Dupliquer</button><button class="cvx-btn cvx-btn--icon" data-act="del" title="Supprimer" aria-label="Supprimer">🗑</button></div>`).join('')
                : '<div class="cvx-empty">Aucune version enregistrée. Enregistrez le CV actuel pour commencer.</div>'}</div>`;

        host.insertAdjacentHTML('beforeend', `
            <div class="cvx-card" style="margin-top:1rem">
                <h4>🔒 Vos données restent chez vous</h4>
                <p>Vos CV sont enregistrés uniquement dans <b>ce navigateur</b> (stockage local). Ils ne sont envoyés à aucun serveur et personne d'autre ne peut les voir. Sur un ordinateur partagé, exportez votre CV en JSON puis effacez vos données.</p>
                <button class="cvx-btn" id="cvx-wipe" style="justify-content:center;width:100%;color:#f87171;border-color:rgba(248,113,113,.4)">Effacer toutes mes données de ce navigateur</button>
            </div>`);
        $('#cvx-wipe', host).onclick = () => {
            if (!confirm('Effacer définitivement tous vos CV et réglages de ce navigateur ? Exportez-les d\'abord si besoin. Cette action est irréversible.')) return;
            Object.keys(localStorage).filter((k) => /^(cv_|preview_zoom)/.test(k)).forEach((k) => localStorage.removeItem(k));
            location.reload();
        };

        const save = (arr) => { if (!store.set(VKEY, arr)) { toast('Stockage plein : supprimez une version ou exportez en JSON.', 'error'); return false; } return true; };
        $('#cvx-ver-save', host).onclick = () => {
            const name = ($('#cvx-ver-name', host).value || '').trim() || 'Sans titre';
            const arr = getVersions();
            if (save([{ id: 'v' + Date.now().toString(36), name, layout: currentLayout, updated: Date.now(), data: clone(cvData) }, ...arr])) { toast('Version enregistrée.', 'success'); drawVersions(m); }
        };
        $('#cvx-ver-new', host).onclick = () => {
            if (!confirm('Créer un CV vierge ? Le CV actuel sera remplacé (annulable avec Ctrl+Z, pensez à l\'enregistrer avant).')) return;
            checkpoint();
            const keepDesign = cvData.design ? clone(cvData.design) : null;
            cvData = clone(emptyCVData);
            if (keepDesign) cvData.design = keepDesign;
            runMigrations(cvData); persistData(); populateFormInputs(); renderPreview(); afterRender(); settle(); closeModal();
            toast('CV vierge créé.', 'success');
        };
        $$('.cvx-ver [data-act]', host).forEach((b) => b.onclick = () => {
            const id = b.closest('.cvx-ver').dataset.id;
            const arr = getVersions(); const i = arr.findIndex((v) => v.id === id); if (i < 0) return;
            const v = arr[i];
            if (b.dataset.act === 'load') {
                checkpoint();
                cvData = clone(v.data); runMigrations(cvData); persistData(); populateFormInputs();
                changeLayout(v.layout || currentLayout); afterRender(); settle(); closeModal();
                toast(`« ${v.name} » chargé.`, 'success');
            } else if (b.dataset.act === 'update') {
                arr[i] = { ...v, layout: currentLayout, updated: Date.now(), data: clone(cvData) };
                if (save(arr)) { toast('Version mise à jour.', 'success'); drawVersions(m); }
            } else if (b.dataset.act === 'dup') {
                arr.unshift({ ...clone(v), id: 'v' + Date.now().toString(36), name: v.name + ' (copie)', updated: Date.now() });
                if (save(arr)) drawVersions(m);
            } else if (b.dataset.act === 'del') {
                if (!confirm(`Supprimer « ${v.name} » ?`)) return;
                arr.splice(i, 1); if (save(arr)) drawVersions(m);
            }
        });
    }

    /* ------------------------------------------------------
       TEMPLATE GALLERY
       ------------------------------------------------------ */
    const TEMPLATES = [
        { id: 'professional', name: 'Corporate', desc: 'Classique et sobre, bandeau marine. Finance, conseil, administration.', tag: 'Polyvalent' },
        { id: 'ats', name: 'ATS-Optimisé', desc: 'Mise en page linéaire lisible par les robots de recrutement.', tag: 'Meilleur pour ATS' },
        { id: 'designed', name: 'Midnight Gold', desc: 'Fond sombre et accents dorés. Profils créatifs et développeurs.', tag: 'Créatif' },
        { id: 'sidebar', name: 'Sidebar Bicolore', desc: 'Deux colonnes compactes avec panneau latéral coloré.', tag: 'Compact' },
        { id: 'minimalist', name: 'Minimalisme Suisse', desc: 'Épuré, typographique, beaucoup d\'espace. Académique, design.', tag: 'Moderne' },
        { id: 'europass', name: 'Europass', desc: 'Format standard européen pour les candidatures dans l\'UE.', tag: 'Standard UE' },
        { id: 'timeline', name: 'Chronologie', desc: 'Frise verticale avec points : met en valeur la progression de carrière.', tag: 'Parcours' },
        { id: 'executive', name: 'Executive', desc: 'Bandeau coloré en en-tête et colonne latérale teintée pour les compétences.', tag: 'Impact' },
        { id: 'modern', name: 'Moderne', desc: 'Projets en cartes, compétences en tags, en-tête avec accent marqué.', tag: 'Tech & Startup' }
    ];
    function thumb(id) {
        const L = (w) => `<i style="width:${w}%"></i>`;
        const lines = L(90) + L(75) + L(85) + L(60);
        switch (id) {
            case 'designed': return `<div class="cvx-thumb" style="background:#0b0f19"><div class="col"><i style="background:#f59e0b;width:50%;height:7px"></i><i style="background:#475569;width:70%"></i>${lines.replace(/#cbd5e1/g, '')}<i style="background:#f59e0b;width:30%;margin-top:10px"></i><i style="background:#334155;width:90%"></i><i style="background:#334155;width:80%"></i><i style="background:#334155;width:85%"></i></div></div>`;
            case 'professional': return `<div class="cvx-thumb"><div class="col"><div class="bar" style="background:#1e3a8a;border-radius:3px"></div>${lines}<i style="background:#1e3a8a;width:35%;margin-top:10px"></i>${lines}</div></div>`;
            case 'sidebar': return `<div class="cvx-thumb"><div class="side" style="background:#1e293b"><div class="dot" style="background:#3b82f6"></div><i style="background:#64748b"></i><i style="background:#64748b;width:70%"></i><i style="background:#64748b"></i></div><div class="col"><i style="background:#1e293b;width:55%;height:6px"></i>${lines}<i style="background:#3b82f6;width:30%;margin-top:8px"></i>${lines}</div></div>`;
            case 'minimalist': return `<div class="cvx-thumb"><div class="col" style="padding:14px"><i style="background:#111;width:45%;height:7px"></i><i style="width:30%;margin-bottom:12px"></i><i style="width:20%;background:#111"></i>${lines}<i style="width:20%;background:#111;margin-top:10px"></i>${lines}</div></div>`;
            case 'europass': return `<div class="cvx-thumb"><div class="col"><div class="bar" style="background:#0e4194;height:12px"></div><div style="display:flex;gap:8px"><div style="width:28%"><i style="background:#0e4194"></i><i style="background:#0e4194;width:60%"></i></div><div style="flex:1">${lines}</div></div><div style="display:flex;gap:8px;margin-top:6px"><div style="width:28%"><i style="background:#0e4194"></i></div><div style="flex:1">${lines}</div></div></div></div>`;
            case 'timeline': return `<div class="cvx-thumb"><div class="col"><div style="display:flex;gap:6px;align-items:center;border-bottom:3px solid #1e3a8a;padding-bottom:5px;margin-bottom:6px"><div class="dot" style="margin:0;width:18px;height:18px;background:#1e3a8a"></div><div style="flex:1"><i style="background:#1e3a8a;width:60%;height:6px"></i><i style="width:80%"></i></div></div><div style="border-left:2px solid #93a4d0;margin-left:3px;padding-left:9px">${lines}${lines}</div></div></div>`;
            case 'executive': return `<div class="cvx-thumb"><div class="col"><div style="background:#1e3a8a;border-radius:3px;height:30px;margin-bottom:6px;padding:7px 8px"><i style="background:#fff;width:50%;height:6px;margin:0 0 4px"></i><i style="background:#93a4d0;width:70%;margin:0"></i></div><div style="display:flex;gap:6px"><div style="flex:1">${lines}${lines}</div><div style="width:32%;background:#e8ecf7;border-radius:3px;padding:5px">${L(90)}${L(70)}${L(85)}${L(60)}</div></div></div></div>`;
            case 'modern': return `<div class="cvx-thumb" style="border-top:5px solid #1e3a8a"><div class="col"><i style="background:#1e3a8a;width:50%;height:7px"></i><i style="width:70%;margin-bottom:6px"></i><i style="background:#1e3a8a;width:30%;margin-top:6px"></i>${L(90)}${L(70)}<div style="display:flex;gap:5px;margin-top:6px"><div style="flex:1;border:1px solid #cbd5e1;border-top:2px solid #1e3a8a;border-radius:3px;padding:3px">${L(90)}${L(60)}</div><div style="flex:1;border:1px solid #cbd5e1;border-top:2px solid #1e3a8a;border-radius:3px;padding:3px">${L(80)}${L(70)}</div></div><div style="display:flex;gap:3px;margin-top:6px"><span style="width:18%;height:6px;border-radius:9px;background:#dbe3f5"></span><span style="width:22%;height:6px;border-radius:9px;background:#dbe3f5"></span><span style="width:15%;height:6px;border-radius:9px;background:#dbe3f5"></span></div></div></div>`;
            default: return `<div class="cvx-thumb"><div class="col"><i style="background:#111;width:50%;height:7px"></i>${lines}${lines}${lines}</div></div>`;
        }
    }
    function openGallery() {
        const m = openModal('Modèles', 'Votre contenu reste identique : seul le design change.',
            `<div class="cvx-tpl-grid">${TEMPLATES.map((t) => `
                <button class="cvx-tpl ${t.id === currentLayout ? 'is-active' : ''}" data-id="${t.id}">${thumb(t.id)}<h3>${t.name}</h3><p>${t.desc}</p><span class="cvx-tpl-tag">${t.tag}</span></button>`).join('')}</div>`);
        $$('.cvx-tpl', m).forEach((b) => b.onclick = () => {
            changeLayout(b.dataset.id); afterRender(); closeModal();
            toast(`Modèle « ${TEMPLATES.find((t) => t.id === b.dataset.id).name} » appliqué.`, 'success');
        });
    }

    /* ------------------------------------------------------
       REORDER ENTRIES (▲ ▼) in editor cards
       ------------------------------------------------------ */
    function remapIndexKeys(map, key, i, j) {
        if (!map) return map;
        const out = {}, re = new RegExp('^' + key + '\\.(\\d+)(\\..*)?$');
        Object.keys(map).forEach((k) => {
            const m = k.match(re);
            if (!m) { out[k] = map[k]; return; }
            const n = +m[1], nn = n === i ? j : (n === j ? i : n);
            out[`${key}.${nn}${m[2] || ''}`] = map[k];
        });
        return out;
    }
    function moveItem(key, index, dir) {
        const arr = cvData[key], j = index + dir;
        if (!arr || j < 0 || j >= arr.length) return;
        [arr[index], arr[j]] = [arr[j], arr[index]];
        if (cvData.hidden_fields) cvData.hidden_fields = remapIndexKeys(cvData.hidden_fields, key, index, j);
        if (cvData.design && cvData.design.overrides) cvData.design.overrides = remapIndexKeys(cvData.design.overrides, key, index, j);
        if (openCollapseKeys[key] === index) openCollapseKeys[key] = j; else if (openCollapseKeys[key] === j) openCollapseKeys[key] = index;
        renderList(key);
        saveAndSync();
    }
    function moveSkill(index, dir) {
        const arr = cvData.skills, j = index + dir;
        if (j < 0 || j >= arr.length) return;
        [arr[index], arr[j]] = [arr[j], arr[index]];
        if (cvData.hidden_fields) cvData.hidden_fields = remapIndexKeys(cvData.hidden_fields, 'skills', index, j);
        if (cvData.design && cvData.design.overrides) cvData.design.overrides = remapIndexKeys(cvData.design.overrides, 'skills', index, j);
        renderSkillsList(); saveAndSync();
    }
    const moveBtns = (fn, i, n) => {
        const w = document.createElement('span');
        w.className = 'cvx-move';
        w.innerHTML = `<button title="Monter" aria-label="Monter" ${i === 0 ? 'disabled' : ''}>▲</button><button title="Descendre" aria-label="Descendre" ${i === n - 1 ? 'disabled' : ''}>▼</button>`;
        const [up, dn] = w.querySelectorAll('button');
        up.onclick = (e) => { e.stopPropagation(); fn(-1); };
        dn.onclick = (e) => { e.stopPropagation(); fn(1); };
        return w;
    };
    function decorateReorder(key) {
        const n = (cvData[key] || []).length;
        $$(`#list-${key} .collapsible-card`).forEach((card) => {
            const idx = +card.getAttribute('data-card-index');
            const acts = $('.collapsible-header-actions', card);
            if (acts && !$('.cvx-move', acts)) acts.insertBefore(moveBtns((d) => moveItem(key, idx, d), idx, n), acts.firstChild);
        });
    }
    function decorateSkills() {
        const cards = $$('#list-skills > .form-card'), n = cards.length;
        cards.forEach((card, idx) => {
            const acts = $('.field-actions-container', card);
            if (acts && !$('.cvx-move', acts)) acts.insertBefore(moveBtns((d) => moveSkill(idx, d), idx, n), acts.firstChild);
        });
    }
    ['renderList'].forEach((fn) => {
        const orig = window[fn];
        window[fn] = function (key) { orig.apply(this, arguments); decorateReorder(key); };
    });
    const origSkills = window.renderSkillsList;
    window.renderSkillsList = function () { origSkills.apply(this, arguments); decorateSkills(); };

    /* ------------------------------------------------------
       UI INJECTION
       ------------------------------------------------------ */
    function injectUI() {
        // Analyse tab
        const nav = $('.tabs-nav'), content = $('.tabs-content');
        if (nav && content && !$('#tab-analyse')) {
            const btn = document.createElement('button');
            btn.className = 'tab-btn';
            btn.setAttribute('onclick', "switchTab('tab-analyse'); CVX.refreshAnalyse()");
            btn.innerHTML = `${ICON.gauge}Score`;
            const designBtn = $('.tab-btn-design', nav);
            nav.insertBefore(btn, designBtn);
            const panel = document.createElement('div');
            panel.id = 'tab-analyse'; panel.className = 'tab-panel';
            panel.innerHTML = '<div id="cvx-analyse-body"></div>';
            content.appendChild(panel);
            panel.addEventListener('input', (e) => {
                if (e.target.id === 'cvx-jd') { store.set('cv_jd', e.target.value); clearTimeout(runMatch._t); runMatch._t = setTimeout(runMatch, 250); }
            });
            panel.addEventListener('click', (e) => {
                const f = e.target.closest('[data-fit]'); if (f) fitToPages(+f.dataset.fit);
            });
        }

        // Action bar
        const toolbar = $('.preview-toolbar');
        if (toolbar && !$('.cvx-bar')) {
            const bar = document.createElement('div');
            bar.className = 'cvx-bar';
            bar.innerHTML = `
                <button class="cvx-btn cvx-btn--icon" id="cvx-undo" title="Annuler (Ctrl+Z)" aria-label="Annuler" disabled>${ICON.undo}</button>
                <button class="cvx-btn cvx-btn--icon" id="cvx-redo" title="Rétablir (Ctrl+Shift+Z)" aria-label="Rétablir" disabled>${ICON.redo}</button>
                <span class="cvx-sep"></span>
                <button class="cvx-btn" id="cvx-tpl">${ICON.layout}Modèles</button>
                <button class="cvx-btn" id="cvx-ver">${ICON.files}Mes CV</button>
                <span class="cvx-sep"></span>
                <button class="cvx-pill" id="cvx-score" title="Voir l'analyse du CV">Score <b>–</b></button>
                <button class="cvx-pill" id="cvx-pages" title="Ajuster le nombre de pages">– p.</button>
                <span class="cvx-saved" id="cvx-saved" aria-live="polite">✓ Enregistré</span>`;
            toolbar.insertAdjacentElement('afterend', bar);
            $('#cvx-undo').onclick = undo; $('#cvx-redo').onclick = redo;
            $('#cvx-tpl').onclick = openGallery; $('#cvx-ver').onclick = openVersions;
            const goScore = () => { switchTab('tab-analyse'); refreshAnalyse(); };
            $('#cvx-score').onclick = goScore; $('#cvx-pages').onclick = goScore;
        }
    }

    function refreshAnalyse() { if ($('#tab-analyse.active')) renderAnalyse(); }

    let afterT = null;
    function afterRender() {
        clearTimeout(afterT);
        afterT = setTimeout(() => {
            const r = computeScore();
            const s = $('#cvx-score'), p = $('#cvx-pages');
            if (s) { s.innerHTML = `Score <b>${r.score}</b>`; s.className = 'cvx-pill is-' + verdict(r.score)[2]; }
            if (p) { p.textContent = `${r.pages} page${r.pages > 1 ? 's' : ''}`; p.className = 'cvx-pill ' + (r.pages === 1 ? 'is-ok' : r.pages === 2 ? 'is-warn' : 'is-bad'); }
            refreshAnalyse();
        }, 120);
    }

    /* ------------------------------------------------------
       KEYBOARD SHORTCUTS
       ------------------------------------------------------ */
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { closeModal(); return; }
        const mod = e.ctrlKey || e.metaKey; if (!mod) return;
        const k = e.key.toLowerCase();
        const typing = /^(input|textarea|select)$/i.test(e.target.tagName) || e.target.isContentEditable;
        if (k === 's') { e.preventDefault(); downloadJSON(); toast('Sauvegarde JSON téléchargée.', 'success'); return; }
        if (typing) return; // keep native text-undo inside fields
        if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
        else if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); redo(); }
    });

    /* ------------------------------------------------------
       WRAP EXISTING FLOWS (undo-able, toast instead of alert)
       ------------------------------------------------------ */
    const origReset = window.resetToDefaults;
    window.resetToDefaults = async function () {
        checkpoint();
        const before = snapNow();
        await origReset.apply(this, arguments);
        if (snapNow() === before) { H.past.pop(); updateHistoryButtons(); } else { settle(); afterRender(); toast('CV réinitialisé (Ctrl+Z pour annuler).', 'success'); }
    };
    const origChangeLayout = window.changeLayout;
    window.changeLayout = function () { const r = origChangeLayout.apply(this, arguments); afterRender(); return r; };
    const nativeAlert = window.alert.bind(window);
    window.alert = function (msg) {
        const s = String(msg);
        toast(s.replace(/^[✅❌]\s*/, ''), s.startsWith('❌') ? 'error' : (s.startsWith('✅') ? 'success' : 'info'), 4500);
    };
    window.CVX_nativeAlert = nativeAlert;

    /* ------------------------------------------------------
       BOOT
       ------------------------------------------------------ */
    window.CVX = { toast, onChange, afterRender, checkpoint, settle, undo, redo, refreshAnalyse, fitToPages, computeScore, openGallery, openVersions };

    function boot() {
        injectUI();
        // window.onload in app.js may replace cvData (first visit) — wait for it
        setTimeout(() => { initHistory(); afterRender(); }, 500);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

    // Safety net: warn before leaving with unsaved-to-disk work is not needed (autosave), but flush pending render
    window.addEventListener('beforeunload', () => { try { persistData(); } catch (e) { /* ignore */ } });
})();

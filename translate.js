/* ==========================================================
   CV Maker — Translator (FR <-> EN)
   Loaded after features.js. Translates the CV text field by field.
   - Cleans common typos before translating (spacing, punctuation, doubled words)
   - Tries Google Translate, falls back to MyMemory
   - Checks every result; anything that did not translate is flagged
     so the user can fix the source text and retry (never silently skipped)
   - Dates / months / "Présent" are translated locally (no network)
   - Only the text is sent: never e-mail, phone, links or photo
   ========================================================== */
(function () {
    'use strict';

    const $ = (s, r = document) => r.querySelector(s);
    const toast = (m, t) => window.CVX && CVX.toast(m, t);
    const clone = (o) => JSON.parse(JSON.stringify(o));
    const escH = (v) => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    /* ---------- language detection (stop-word count) ---------- */
    const FR_W = new Set('le la les un une des du et que qui pour dans sur avec au aux est sont ce cette mon ma mes je nous vous il elle ils ses son sa leur par ou où mais plus comme afin entre chez sans sous vers été avoir être fait faire'.split(' '));
    const EN_W = new Set('the and of to in for with by is are an this that my from at it was were have has will our their your been being into over under between using built led across about through'.split(' '));
    function langScore(text) {
        const toks = String(text).toLowerCase().normalize('NFC').match(/[a-zà-ÿ]+/g) || [];
        let fr = 0, en = 0;
        toks.forEach((t) => { if (FR_W.has(t)) fr++; if (EN_W.has(t)) en++; });
        if (/[àâçéèêëîïôûùüœ]/i.test(text)) fr += 1;
        return { fr, en };
    }
    function detect(text) {
        const s = langScore(text);
        if (s.fr === s.en) return null;
        return s.fr > s.en ? 'fr' : 'en';
    }

    /* ---------- typo clean-up (applied to what we SEND) ---------- */
    function cleanText(s) {
        let t = String(s);
        t = t.replace(/[   ]/g, ' ').replace(/[ \t]{2,}/g, ' ');
        t = t.replace(/\s+([,.;:!?)])/g, '$1');                       // no space before punctuation
        t = t.replace(/([,;:!?])(?=[A-Za-zÀ-ÿ])/g, '$1 ');            // space after , ; : ! ?
        t = t.replace(/([a-zà-ÿ]{2,})\.(?=[A-ZÀ-Ý][a-zà-ÿ])/g, '$1. '); // "fin.Début" -> "fin. Début"
        t = t.replace(/\b([A-Za-zÀ-ÿ]{2,})\s+\1\b/gi, '$1');          // "le le" -> "le"
        t = t.replace(/\(\s+/g, '(');
        return t.trim();
    }

    /* ---------- dates / months, translated locally ---------- */
    const MONTHS = [
        ['janv?\\.?|janvier', 'Jan.', 'janv.'], ['f[ée]vr?\\.?|f[ée]vrier', 'Feb.', 'févr.'], ['mars', 'Mar.', 'mars'],
        ['avr\\.?|avril', 'Apr.', 'avr.'], ['mai', 'May', 'mai'], ['juin', 'Jun.', 'juin'], ['juil\\.?|juillet', 'Jul.', 'juil.'],
        ['ao[uû]t', 'Aug.', 'août'], ['sept?\\.?|septembre', 'Sep.', 'sept.'], ['oct\\.?|octobre', 'Oct.', 'oct.'],
        ['nov\\.?|novembre', 'Nov.', 'nov.'], ['d[ée]c\\.?|d[ée]cembre', 'Dec.', 'déc.']
    ];
    const MONTHS_EN = [
        ['jan\\.?|january', 'Jan.', 'janv.'], ['feb\\.?|february', 'Feb.', 'févr.'], ['mar\\.?|march', 'Mar.', 'mars'],
        ['apr\\.?|april', 'Apr.', 'avr.'], ['may', 'May', 'mai'], ['jun\\.?|june', 'Jun.', 'juin'], ['jul\\.?|july', 'Jul.', 'juil.'],
        ['aug\\.?|august', 'Aug.', 'août'], ['sep\\.?|sept\\.?|september', 'Sep.', 'sept.'], ['oct\\.?|october', 'Oct.', 'oct.'],
        ['nov\\.?|november', 'Nov.', 'nov.'], ['dec\\.?|december', 'Dec.', 'déc.']
    ];
    function translatePeriod(s, to) {
        let t = String(s);
        const table = to === 'en' ? MONTHS : MONTHS_EN;
        const idx = to === 'en' ? 1 : 2;
        table.forEach((m) => {
            t = t.replace(new RegExp('(?<![\\p{L}])(?:' + m[0] + ')(?![\\p{L}])', 'giu'), m[idx]);
        });
        if (to === 'en') t = t.replace(/(?<![\p{L}])(pr[ée]sent|aujourd['’]hui|actuel(?:lement)?|en cours)(?![\p{L}])/giu, 'Present').replace(/(?<![\p{L}])ans?(?![\p{L}])/giu, 'yrs');
        else t = t.replace(/(?<![\p{L}])(present|current|ongoing)(?![\p{L}])/giu, 'Présent').replace(/(?<![\p{L}])yrs?(?![\p{L}])/giu, 'ans');
        return t;
    }

    /* ---------- default section titles ---------- */
    const HEAD_EN = {
        profile: 'Professional Profile', experiences: 'Professional Experience', formations: 'Internships & Training',
        projects: 'Key Projects', skills: 'Technical Skills', education: 'Education', certifications: 'Certifications',
        activities: 'Activities & Volunteering', languages: 'Languages', interests: 'Interests'
    };

    /* ---------- field collection ---------- */
    // kind: 'text' (network), 'period' (local)
    function collect(data) {
        const jobs = [];
        const add = (path, kind, label) => {
            let v = data; for (const k of path) { v = v == null ? v : v[k]; }
            if (typeof v === 'string' && v.trim()) jobs.push({ path, kind, label, src: v });
        };
        add(['contact', 'title_sub'], 'text', 'Titre');
        add(['contact', 'driver'], 'text', 'Permis');
        add(['profile'], 'text', 'Profil');
        (data.experiences || []).forEach((e, i) => {
            add(['experiences', i, 'title'], 'text', 'Expérience · poste');
            add(['experiences', i, 'period'], 'period', 'Période');
            (e.bullets || []).forEach((b, j) => add(['experiences', i, 'bullets', j], 'text', 'Expérience · puce'));
        });
        (data.formations || []).forEach((e, i) => {
            ['title', 'description'].forEach((k) => add(['formations', i, k], 'text', 'Formation · ' + k));
            add(['formations', i, 'period'], 'period', 'Période');
            (e.bullets || []).forEach((b, j) => add(['formations', i, 'bullets', j], 'text', 'Formation · puce'));
        });
        (data.projects || []).forEach((p, i) => {
            add(['projects', i, 'title'], 'text', 'Projet · titre');
            add(['projects', i, 'description'], 'text', 'Projet · description');
        });
        (data.skills || []).forEach((s, i) => add(['skills', i, 'category'], 'text', 'Compétences · catégorie'));
        (data.education || []).forEach((e, i) => {
            add(['education', i, 'degree'], 'text', 'Éducation · diplôme');
            add(['education', i, 'period'], 'period', 'Période');
        });
        (data.activities || []).forEach((a, i) => add(['activities', i], 'text', 'Activité'));
        (data.interests || []).forEach((a, i) => add(['interests', i], 'text', 'Intérêt'));
        (data.languages || []).forEach((l, i) => { add(['languages', i, 'name'], 'text', 'Langue'); add(['languages', i, 'level'], 'text', 'Niveau'); });
        Object.keys(data.headings || {}).forEach((k) => add(['headings', k], 'text', 'Titre de section'));
        return jobs;
    }
    const setPath = (obj, path, val) => { let o = obj; for (let i = 0; i < path.length - 1; i++) o = o[path[i]]; o[path[path.length - 1]] = val; };

    /* ---------- network ---------- */
    async function fetchJSON(url, ms) {
        const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms || 12000);
        try { const r = await fetch(url, { signal: ctl.signal }); if (!r.ok) throw new Error('HTTP ' + r.status); return await r.json(); }
        finally { clearTimeout(t); }
    }
    async function viaGoogle(text, from, to) {
        const j = await fetchJSON('https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=' + from + '&tl=' + to + '&q=' + encodeURIComponent(text));
        const out = (j[0] || []).map((x) => x[0] || '').join('');
        if (!out.trim()) throw new Error('empty');
        return out;
    }
    function chunks(text, max) {
        const parts = text.match(/[^.!?;]+[.!?;]*\s*/g) || [text]; const res = []; let cur = '';
        parts.forEach((p) => { if ((cur + p).length > max && cur) { res.push(cur); cur = ''; } cur += p; });
        if (cur) res.push(cur);
        return res.flatMap((c) => c.length > max ? c.match(new RegExp('.{1,' + max + '}', 'gs')) : [c]);
    }
    async function viaMyMemory(text, from, to) {
        const out = [];
        for (const c of chunks(text, 450)) {
            const j = await fetchJSON('https://api.mymemory.translated.net/get?langpair=' + from + '|' + to + '&q=' + encodeURIComponent(c));
            const t = j && j.responseData && j.responseData.translatedText;
            if (!t || (j.responseStatus && +j.responseStatus !== 200)) throw new Error('mymemory');
            out.push(t);
        }
        return out.join(' ').replace(/\s+/g, ' ').trim();
    }

    // Returns { ok, out, why }
    async function translateOne(src, from, to) {
        const text = cleanText(src);
        const own = detect(text);
        if (own === to && langScore(text)[to] >= 2) return { ok: true, out: src, skipped: true };   // already in target language
        const attempts = [viaGoogle, viaMyMemory];
        let lastErr = 'réseau';
        for (const fn of attempts) {
            try {
                const out = (await fn(text, from, to)).trim();
                const sc = langScore(out);
                // still clearly in the source language -> not really translated
                if (sc[from] >= 2 && sc[from] > sc[to]) { lastErr = 'texte non traduit (faute ou formulation non reconnue ?)'; continue; }
                return { ok: true, out };
            } catch (e) { lastErr = (e && e.name === 'AbortError') ? 'délai dépassé' : 'service indisponible'; }
        }
        return { ok: false, why: lastErr };
    }

    async function pool(items, n, fn, onTick) {
        let i = 0, done = 0;
        await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
            while (i < items.length) { const k = i++; await fn(items[k], k); onTick(++done); }
        }));
    }

    /* ---------- UI ---------- */
    let S = null; // session state

    function openTranslate() {
        const jobs = collect(cvData);
        const sample = jobs.filter((j) => j.kind === 'text').map((j) => j.src).join(' ');
        const guess = detect(sample) || 'fr';
        const m = window.CVX_openModal('Traduire le CV', 'Français ⇄ Anglais, champ par champ, avec contrôle des erreurs.', '<div id="cvx-tr-host"></div>');
        S = { jobs, from: guess, to: guess === 'fr' ? 'en' : 'fr', results: [], host: $('#cvx-tr-host', m), modal: m };
        drawStart();
    }

    function drawStart() {
        const { host, jobs } = S;
        const n = jobs.filter((j) => j.kind === 'text').length;
        host.innerHTML = `
            <div class="cvx-row">
                <label class="cvx-tr-lab">Traduire de
                    <select class="cvx-field" id="cvx-tr-from"><option value="fr">Français</option><option value="en">English</option></select></label>
                <label class="cvx-tr-lab">vers
                    <select class="cvx-field" id="cvx-tr-to"><option value="en">English</option><option value="fr">Français</option></select></label>
            </div>
            <p class="cvx-tr-note">Langue détectée : <b>${S.from === 'fr' ? 'français' : 'anglais'}</b> · <b>${n}</b> textes à traduire (+ dates et titres de section).</p>
            <div class="cvx-card">
                <h4>🌐 Ce qui est envoyé</h4>
                <p>Seuls les <b>textes</b> du CV (profil, postes, puces, projets…) sont envoyés à <b>Google Translate</b> (ou à MyMemory en secours). <b>Jamais</b> votre nom, e-mail, téléphone, liens ni photo. Le reste de l'application fonctionne hors-ligne.</p>
                <p style="margin-top:.4rem">Votre CV actuel est <b>sauvegardé</b> dans « Mes CV » avant traduction, et vous pouvez annuler avec Ctrl+Z.</p>
            </div>
            <button class="cvx-btn cvx-btn--primary" id="cvx-tr-go" style="justify-content:center;width:100%;margin-top:.8rem">Lancer la traduction</button>`;
        $('#cvx-tr-from', host).value = S.from; $('#cvx-tr-to', host).value = S.to;
        const sync = (changed) => { const f = $('#cvx-tr-from', host), t = $('#cvx-tr-to', host); if (f.value === t.value) { (changed === 'from' ? t : f).value = f.value === 'fr' ? 'en' : 'fr'; } S.from = f.value; S.to = t.value; };
        $('#cvx-tr-from', host).onchange = () => sync('from'); $('#cvx-tr-to', host).onchange = () => sync('to');
        $('#cvx-tr-go', host).onclick = run;
    }

    async function run() {
        const { host, jobs, from, to } = S;
        const todo = jobs.filter((j) => j.kind === 'text');
        host.innerHTML = `<p class="cvx-tr-note" id="cvx-tr-msg">Traduction en cours… 0 / ${todo.length}</p>
            <div class="cvx-tr-bar"><i id="cvx-tr-fill"></i></div>`;
        if (!todo.length) { return finish(); }
        S.results = new Array(jobs.length);
        const idxOf = new Map(jobs.map((j, i) => [j, i]));
        await pool(todo, 4, async (job) => { S.results[idxOf.get(job)] = await translateOne(job.src, from, to); },
            (d) => {
                const f = $('#cvx-tr-fill'), m = $('#cvx-tr-msg');
                if (f) f.style.width = Math.round(d / todo.length * 100) + '%';
                if (m) m.textContent = `Traduction en cours… ${d} / ${todo.length}`;
            });
        finish();
    }

    function finish() {
        const { host, jobs } = S;
        const bad = []; let okN = 0, skipN = 0;
        jobs.forEach((j, i) => {
            if (j.kind !== 'text') return;
            const r = S.results[i];
            if (r && r.ok) { r.skipped ? skipN++ : okN++; } else bad.push(i);
        });
        drawReport(bad, okN, skipN);
    }

    function drawReport(bad, okN, skipN) {
        const { host, jobs } = S;
        host.innerHTML = `
            <div class="cvx-tr-sum ${bad.length ? 'warn' : 'ok'}">
                <b>${bad.length ? '⚠ ' + bad.length + ' champ' + (bad.length > 1 ? 's' : '') + ' à vérifier' : '✓ Tout est traduit'}</b>
                <span>${okN} traduit${okN > 1 ? 's' : ''}${skipN ? ' · ' + skipN + ' déjà dans la langue cible' : ''}</span>
            </div>
            ${bad.length ? `<p class="cvx-tr-note">Ces textes n'ont pas pu être traduits (faute de frappe, phrase incomplète ou service indisponible). Corrigez le texte puis cliquez sur « Retraduire », ou gardez-le tel quel.</p>` : ''}
            <div id="cvx-tr-bad">${bad.map((i) => `
                <div class="cvx-tr-item" data-i="${i}">
                    <small>${escH(jobs[i].label)} · ${escH(S.results[i] && S.results[i].why || 'erreur')}</small>
                    <textarea class="cvx-field" rows="2">${escH(cleanText(jobs[i].src))}</textarea>
                    <div class="cvx-row"><button class="cvx-btn" data-act="retry">Retraduire</button><button class="cvx-btn" data-act="keep">Garder tel quel</button></div>
                    <em class="cvx-tr-st"></em>
                </div>`).join('')}</div>
            <div class="cvx-row" style="margin-top:.9rem">
                <button class="cvx-btn" id="cvx-tr-cancel" style="justify-content:center">Annuler</button>
                <button class="cvx-btn cvx-btn--primary" id="cvx-tr-apply" style="justify-content:center;flex:2">Appliquer la traduction</button>
            </div>`;
        $('#cvx-tr-cancel', host).onclick = () => window.CVX_closeModal();
        $('#cvx-tr-apply', host).onclick = apply;
        $('#cvx-tr-bad', host).onclick = async (e) => {
            const b = e.target.closest('[data-act]'); if (!b) return;
            const card = b.closest('.cvx-tr-item'), i = +card.dataset.i, st = $('.cvx-tr-st', card);
            if (b.dataset.act === 'keep') { S.results[i] = { ok: true, out: jobs[i].src, kept: true }; card.classList.add('done'); st.textContent = 'Gardé tel quel.'; return; }
            const txt = $('textarea', card).value;
            st.textContent = 'Traduction…'; b.disabled = true;
            const r = await translateOne(txt, S.from, S.to);
            b.disabled = false;
            if (r.ok) { S.results[i] = r; jobs[i].src = txt; card.classList.add('done'); st.textContent = '✓ ' + r.out; }
            else { S.results[i] = r; st.textContent = '✗ Toujours impossible (' + r.why + '). Reformulez la phrase ou gardez-la telle quelle.'; }
        };
    }

    function apply() {
        const { jobs, to } = S;
        const pending = jobs.some((j, i) => j.kind === 'text' && !(S.results[i] && S.results[i].ok));
        if (pending && !confirm('Certains champs n\'ont pas été traduits : ils resteront dans la langue d\'origine. Appliquer quand même ?')) return;
        // safety copy of the original in "Mes CV"
        try {
            const k = 'cv_versions', arr = JSON.parse(localStorage.getItem(k) || '[]');
            const nm = (cvData.contact && cvData.contact.name ? 'CV ' + cvData.contact.name : 'Mon CV') + ' — original (' + S.from.toUpperCase() + ')';
            arr.unshift({ id: 'v' + Date.now().toString(36), name: nm, layout: currentLayout, updated: Date.now(), data: clone(cvData) });
            localStorage.setItem(k, JSON.stringify(arr));
        } catch (e) { /* storage full: undo still works */ }

        CVX.checkpoint();
        const next = clone(cvData);
        const untouched = [];
        jobs.forEach((j, i) => {
            if (j.kind === 'period') setPath(next, j.path, translatePeriod(j.src, to));
            else { const r = S.results[i]; if (r && r.ok) setPath(next, j.path, r.out); else untouched.push(j.label); }
        });
        // default section titles follow the language (custom titles were translated above)
        next.headings = next.headings || {};
        if (to === 'en') Object.keys(HEAD_EN).forEach((k) => { if (!next.headings[k]) next.headings[k] = HEAD_EN[k]; });
        else Object.keys(HEAD_EN).forEach((k) => { if (next.headings[k] === HEAD_EN[k]) delete next.headings[k]; });
        cvData = next;
        runMigrations(cvData); persistData(); populateFormInputs(); renderPreview(); CVX.afterRender(); CVX.settle();
        window.CVX_closeModal();
        toast(untouched.length ? `Traduit — ${untouched.length} champ(s) laissé(s) tel quel. Ctrl+Z pour annuler.` : 'CV traduit (Ctrl+Z pour annuler). Original gardé dans « Mes CV ».', untouched.length ? 'info' : 'success');
    }

    /* ---------- hook into the action bar ---------- */
    function boot() {
        const bar = $('.cvx-bar'); if (!bar || $('#cvx-trans')) return;
        const b = document.createElement('button');
        b.className = 'cvx-btn'; b.id = 'cvx-trans'; b.title = 'Traduire le CV (FR ⇄ EN)';
        b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/></svg>Traduire';
        const ver = $('#cvx-ver'); (ver ? ver : bar.firstChild).insertAdjacentElement('afterend', b);
        b.onclick = openTranslate;
    }
    window.CVX_translate = { cleanText, translatePeriod, detect, translateOne, collect, open: openTranslate };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 50)); else setTimeout(boot, 50);
})();

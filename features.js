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
    // What the recruiter will actually see: hidden sections, hidden entries and hidden contact fields removed
    function effectiveData() {
        const d = clone(cvData), hs = d.hidden_sections || {}, hf = d.hidden_fields || {};
        if (hs.profile) d.profile = '';
        ['experiences', 'formations', 'projects', 'skills', 'education', 'certifications', 'activities', 'languages', 'interests'].forEach((k) => {
            if (hs[k]) d[k] = [];
            else if (Array.isArray(d[k])) d[k] = d[k].filter((_, i) => !hf[`${k}.${i}`]);
        });
        Object.keys(hf).forEach((k) => { if (hf[k] && /^contact\.\w+$/.test(k) && d.contact) d.contact[k.split('.')[1]] = ''; });
        if (hf.profile) d.profile = '';
        return d;
    }
    const cvPlainText = () => norm(collectText(effectiveData()).join(' \n '));

    /* ------------------------------------------------------
       VOCABULARY ENGINE
       1. Index of ~5,000 domain terms from vocab/*.js + the user's own terms (no fixed ceiling: see 3).
       2. Longest-match scan, accent/case/plural tolerant, bilingual aliases, stem-based coverage check.
       3. Open-ended extraction: skills are also pulled straight from the offer text (acronyms, mixed-case names,
          "maîtrise de X, Y" lists, "Compétences:" sections, repeated phrases) even when absent from the vocabulary.
       4. Ambiguous everyday words only count when the detected field confirms them.
       ------------------------------------------------------ */
    const EXTRA_TECH = ('javascript typescript python java kotlin swift dart flutter react angular vue svelte node.js nodejs express nestjs django flask fastapi spring laravel symfony php ruby rails golang rust c++ c# .net ' +
        'sql nosql postgresql postgres mysql mongodb redis oracle supabase firebase graphql api restful docker kubernetes k8s terraform ansible jenkins git github gitlab ci/cd devops aws azure gcp ' +
        'linux windows bash nginx vpn vlan dhcp dns tcp/ip cisco fortinet siem cybersecurity owasp pentest iot arduino raspberry stm32 agile scrum kanban jira figma tailwind html css sass webpack vite ' +
        'jest cypress selenium junit llm rag pandas numpy tensorflow pytorch excel sap salesforce itil microservices jwt oauth websocket mqtt rabbitmq kafka elasticsearch prometheus grafana helm android ios ia ai').split(' ')
        .concat(['github actions', 'machine learning', 'power bi', 'google cloud', 'amazon web services', 'react native', 'spring boot', 'data science', 'deep learning', 'unit testing']);

    // Bilingual / synonym groups: the first item is the canonical form shown to the user
    const ALIASES = [['postgresql', 'postgres'], ['node.js', 'nodejs'], ['kubernetes', 'k8s'], ['javascript', 'js'], ['typescript', 'ts'], ['ai', 'ia', 'intelligence artificielle', 'artificial intelligence'],
        ['ci/cd', 'cicd', 'ci cd', 'integration continue'], ['cybersecurity', 'cybersécurité', 'sécurité informatique', 'information security'], ['golang', 'go lang'], ['restful', 'rest api', 'api rest'], ['tcp/ip', 'tcp ip'],
        ['machine learning', 'apprentissage automatique'], ['deep learning', 'apprentissage profond'], ['mongodb', 'mongo'], ['aws', 'amazon web services'], ['gcp', 'google cloud'], ['react', 'reactjs'],
        ['angular', 'angularjs'], ['vue', 'vuejs'], ['rgpd', 'gdpr'], ['ressources humaines', 'human resources', 'rh', 'hr'], ['service client', 'customer service'], ['gestion de projet', 'project management'],
        ['comptabilité', 'accounting'], ['comptable', 'accountant'], ['recrutement', 'recruitment', 'talent acquisition'], ['marketing digital', 'digital marketing'], ['référencement naturel', 'seo'], ['réseaux sociaux', 'social media'],
        ['supply chain', 'chaîne logistique'], ['audit interne', 'internal audit'], ['business intelligence', 'bi'], ['développement commercial', 'business development'],
        ['infirmier', 'infirmière', 'nurse', 'nursing', 'soins infirmiers'], ['médecin', 'physician', 'doctor'], ['pharmacien', 'pharmacist'], ['juriste', 'lawyer', 'jurist'], ['avocat', 'attorney'],
        ['enseignant', 'teacher'], ['professeur', 'professor'], ['formateur', 'trainer'], ['ingénieur', 'engineer'], ['technicien', 'technician'], ['électricien', 'electrician'], ['plombier', 'plumber'],
        ['soudeur', 'welder'], ['maçon', 'mason'], ['menuisier', 'carpenter'], ['mécanicien', 'mechanic'], ['chauffeur', 'driver'], ['cuisinier', 'cook'], ['serveur', 'waiter', 'serveuse'],
        ['réceptionniste', 'receptionist'], ['vendeur', 'vendeuse', 'salesperson', 'sales associate'], ['acheteur', 'buyer'], ['magasinier', 'warehouse worker'], ['logisticien', 'logistician'],
        ['graphiste', 'graphic designer'], ['photographe', 'photographer'], ['rédacteur', 'writer'], ['traducteur', 'translator'], ['psychologue', 'psychologist'], ['kinésithérapeute', 'physiotherapist'],
        ['secrétaire', 'secretary'], ['assistant administratif', 'administrative assistant'], ['directeur', 'director'], ['chef de projet', 'project manager'], ['chef d\'équipe', 'team leader'],
        ['développeur', 'developer', 'programmeur', 'programmer'], ['analyste', 'analyst'], ['administrateur système', 'system administrator', 'sysadmin'], ['architecte', 'architect'],
        ['chercheur', 'researcher'], ['stagiaire', 'intern'], ['bénévole', 'volunteer'], ['relation client', 'customer relationship'], ['satisfaction client', 'customer satisfaction'],
        ['chiffre d\'affaires', 'revenue'], ['trésorerie', 'cash flow', 'cash management'], ['facturation', 'invoicing', 'billing'], ['paie', 'payroll'], ['gestion des stocks', 'inventory management'],
        ['approvisionnement', 'procurement', 'purchasing'], ['négociation', 'negotiation'], ['tableau de bord', 'dashboard', 'tableaux de bord'], ['amélioration continue', 'continuous improvement'],
        ['gestion du changement', 'change management', 'conduite du changement'], ['gestion des risques', 'risk management'], ['conformité', 'compliance'], ['protection des données', 'data protection'],
        ['pare-feu', 'firewall'], ['sauvegarde', 'backup'], ['base de données', 'database', 'bases de données'], ['traitement du langage naturel', 'nlp'], ['vision par ordinateur', 'computer vision'],
        ['réalité virtuelle', 'virtual reality'], ['réalité augmentée', 'augmented reality'], ['développement durable', 'sustainability'], ['énergies renouvelables', 'renewable energy'],
        ['efficacité énergétique', 'energy efficiency'], ['santé publique', 'public health'], ['soins palliatifs', 'palliative care'], ['dossier patient', 'patient records'],
        ['contrôle qualité', 'quality control'], ['assurance qualité', 'quality assurance'], ['maintenance préventive', 'preventive maintenance'], ['maintenance corrective', 'corrective maintenance'],
        ['sécurité incendie', 'fire safety'], ['premiers secours', 'first aid', 'secourisme'], ['hôtellerie', 'hospitality'], ['restauration', 'catering'], ['tourisme', 'tourism'], ['immobilier', 'real estate'],
        ['assurance', 'insurance'], ['banque', 'banking'], ['crédit', 'credit', 'loan'], ['fiscalité', 'taxation'], ['droit du travail', 'labor law', 'employment law'], ['droit des affaires', 'business law'],
        ['propriété intellectuelle', 'intellectual property'], ['rédaction', 'copywriting'], ['relecture', 'proofreading'], ['traduction', 'translation'], ['montage vidéo', 'video editing'],
        ['production vidéo', 'video production'], ['design graphique', 'graphic design'], ['identité visuelle', 'brand identity'], ['image de marque', 'branding'], ['stratégie de contenu', 'content strategy'],
        ['community management', 'social media management'], ['prospection', 'prospecting'], ['fidélisation', 'customer retention', 'loyalty'], ['gestion d\'équipe', 'team management'],
        ['travail d\'équipe', 'teamwork', 'travail en équipe'], ['résolution de problèmes', 'problem solving'], ['prise de décision', 'decision making'], ['gestion du temps', 'time management'],
        ['gestion du stress', 'stress management'], ['esprit d\'analyse', 'analytical skills'], ['sens de l\'organisation', 'organizational skills'], ['créativité', 'creativity'], ['adaptabilité', 'adaptability']];

    // Single words too generic to prove a skill (they appear in every offer)
    const GENERIC = new Set(('notion notions communication management qualite formation conseil organisation planning reporting budget strategie gestion vente ventes production maintenance installation configuration support equipe rigueur autonomie polyvalence ' +
        'creativite patience empathie accueil service services client clients projet projets recherche developpement analyse etude etudes suivi controle procedures procedure documentation normes reglementation securite ' +
        'travail terrain contact relation relations presentation animation coordination direction responsable entreprise commerce business team leadership innovation performance objectifs resultats technique technologie ' +
        'systeme systemes reseau reseaux outil outils logiciel logiciels application applications donnees information informatique digital numerique transformation evaluation education enseignement culture sante soins ' +
        'programme programmes plan plans mission missions poste profil experience competences competence stage emploi offre candidat contrat droit loi').split(' '));
    // Everyday words that are also vocabulary: they only count when the detected field confirms them
    const AMBIG = new Set(('actions article balance bloc board bois bureaux cafe carte charges chat chef club collection commune composition concert concerts conference conferences defense delivery design discipline documentaire edition ecoute ' +
        'entretien entretiens expert export extensions film finance foret gel genre grid guichet hotel import indicateurs inspection instrument interne externe journal justice lab layout location lieux live loisirs magasin make master mean menu ' +
        'mode moteur native nature offres option options police port portefeuille poster print protection region resident retail route scene script shell slides sport standard stores studio style taille ton training transmission transit travel ' +
        'vision vocal wind word workshop writing atelier ateliers audio balayage bilan bio box camera cap capacite certification chant cinema classement closing coupe coupes couverture cuisine curriculum dessin economie ecologie energie ' +
        'ensemble equipe facade fonds force gamme garde gestion grille groupe image impact jeu jeux lettre lettres liste livre marque mesure mesures meuble mise modele montage niveau numero objet ordre organisation page papier parcours partenaire ' +
        'pause pilote piste place plateau point pole portail poste pouvoir pratique prix processus produit profession programme promotion public qualification rapport recette reception reference regle relais remise reseau reserve ressource ' +
        'revision risque role salle schema secteur section sens serie signal site situation solution source stage statut stock structure suite support surface systeme table tableau test texte titre tour transfert type unite usage valeur version ' +
        'video vie visite voie volume zone').split(' '));

    // Light suffix stripper (FR + EN) — used only to check whether the CV covers an offer term, never to find terms
    const SUF = ['issements', 'issement', 'ements', 'ement', 'ations', 'ation', 'ateurs', 'ateur', 'atrices', 'atrice', 'ments', 'ment', 'ities', 'ity', 'ings', 'ing', 'ions', 'ion', 'euses', 'euse', 'eurs', 'eur',
        'ables', 'able', 'ibles', 'ible', 'ives', 'ive', 'ers', 'er', 'ees', 'ee', 'es', 'ed', 'e', 's', 'x'];
    const stem = (w) => { if (w.length < 6) return w; for (const x of SUF) if (w.endsWith(x) && w.length - x.length >= 4) return w.slice(0, -x.length); return w; };

    const tokenize = (str) => (norm(str).match(/[a-z0-9+#./]+/g) || []).map((t) => t.replace(/^\/+|[./]+$/g, '')).filter(Boolean);
    const keyOf = (toks) => {
        const t = toks.slice(), last = t[t.length - 1];
        if (last && last.length > 3 && last.endsWith('s') && !last.endsWith('ss')) t[t.length - 1] = last.slice(0, -1);
        return t.join(' ');
    };

    const CUSTOM_KEY = 'cv_custom_vocab';
    const INDEX = new Map();   // key -> { display, key, domains:Set, weak }
    let DOMAINS = {};          // name -> [display terms in priority order]
    let MAXN = 3;
    function rebuildIndex() {
        INDEX.clear(); DOMAINS = {}; MAXN = 3;
        const vocab = Object.assign({}, window.CVX_VOCAB || {});
        const custom = String(store.get(CUSTOM_KEY, '') || '').trim();
        if (custom) vocab['Mes termes'] = custom.replace(/\n/g, ',');
        const add = (display, domain) => {
            const toks = tokenize(display);
            if (!toks.length || (toks.length === 1 && (toks[0].length < 2 || GENERIC.has(toks[0])))) return;
            MAXN = Math.max(MAXN, toks.length);
            const key = keyOf(toks);
            let e = INDEX.get(key);
            if (!e) { e = { display: display.trim(), key, domains: new Set(), weak: toks.length === 1 && AMBIG.has(toks[0]) }; INDEX.set(key, e); }
            if (domain) e.domains.add(domain);
            return e;
        };
        Object.keys(vocab).forEach((name) => {
            const list = String(vocab[name]).split(',').map((x) => x.trim()).filter(Boolean);
            DOMAINS[name] = list;
            list.forEach((t) => add(t, name));
        });
        EXTRA_TECH.forEach((t) => add(t, null));
        ALIASES.forEach((g) => {
            const canon = add(g[0], null) || INDEX.get(keyOf(tokenize(g[0])));
            if (!canon) return;
            g.slice(1).forEach((al) => {
                const toks = tokenize(al); if (!toks.length) return;
                const k = keyOf(toks), old = INDEX.get(k);
                if (old && old !== canon) { old.domains.forEach((d) => canon.domains.add(d)); if (!old.weak) canon.weak = false; }
                INDEX.set(k, canon);
            });
        });
        MAXN = Math.min(MAXN, 5);
    }
    rebuildIndex();

    // Longest-match scan: returns Map(entry -> occurrences).
    // allowWeak: undefined = count ambiguous words (CV side); null = never; Set(domain names) = only when the entry belongs to one of them.
    function scan(text, allowWeak) {
        const toks = tokenize(text), found = new Map();
        for (let i = 0; i < toks.length;) {
            let hit = null, len = 1;
            for (let n = Math.min(MAXN, toks.length - i); n >= 1; n--) {
                const e = INDEX.get(keyOf(toks.slice(i, i + n)));
                if (e) {
                    if (e.weak && allowWeak !== undefined) {
                        if (!allowWeak || ![...e.domains].some((d) => allowWeak.has(d))) continue;
                    }
                    hit = e; len = n; break;
                }
            }
            if (hit) { found.set(hit, (found.get(hit) || 0) + 1); i += len; } else i++;
        }
        return found;
    }

    const escRe = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const termRe = (t) => new RegExp('(?<![a-z0-9])' + escRe(norm(t)) + 's?(?![a-z0-9+#])', 'i');

    const STOP = new Set(('the and for with you your our are will have has from that this who use used using able work working team into more such per all any can may their they them but not out via about over under within across ' +
        'looking senior strong build own role join years year ability skills knowledge plus experience excellent good great new help including ' +
        'les des une que qui pour dans avec sur par est sont aux nos vos notre votre vous nous elle ils elles ete etre avoir plus tres ainsi entre chez comme cette ces ses son leur leurs fait faire afin dont mais donc sans sous lors ' +
        'serez serons sera seront etes avez avons mise place charge justifiez minimum connaissance connaissances appreciee apprecie autonome rigoureux rigoureuse travail sens esprit capacite maitrise bonne bonnes bon sein cadre projet projets ' +
        'poste profil mission missions experience experiences entreprise equipe candidat candidature recherche recherchons rejoindre rejoignez offre emploi h/f f/h cdi cdd stage alternance anne annee ans').split(/\s+/));

    // Open-ended candidate extraction from the offer text itself (works for any job, with or without the vocabulary)
    function extractCandidates(text) {
        const out = [], seen = new Set();
        const BAD_TOK = /^(REST|CDI|CDD|CV|H\/F|F\/H|HF|FH|PME|TPE|RH|USA|UE|SARL|SAS|SA|ET|OU|OK|NB|PS|HT|TTC|SMIC|BAC|MR|MME)$/;
        const push = (raw, kind) => {
            let d = String(raw).trim().replace(/^[\s\-–•·*:;,.()\[\]]+|[\s\-–•·*:;,.()\[\]]+$/g, '');
            if (d.length < 2 || d.length > 40 || BAD_TOK.test(d)) return;
            let toks = tokenize(d);
            if (!toks.length || toks.length > 4) return;
            if (toks.every((t) => STOP.has(t) || GENERIC.has(t) || /^\d+$/.test(t))) return;
            // trim leading/trailing filler words ("Zorbax Pro appréciée" -> "Zorbax Pro")
            const words = d.split(/\s+/);
            while (words.length > 1 && STOP.has(tokenize(words[words.length - 1]).join(' '))) words.pop();
            while (words.length > 1 && STOP.has(tokenize(words[0]).join(' '))) words.shift();
            d = words.join(' '); toks = tokenize(d);
            const k = keyOf(toks);
            if (seen.has(k) || INDEX.has(k)) return;
            // already covered by a known term inside the phrase (e.g. "turbines Vestas" when "vestas" is known)
            if (toks.length > 1 && toks.some((t) => { const e = INDEX.get(keyOf([t])); return e && !e.weak; })) return;
            seen.add(k); out.push({ display: d, kind, key: k });
        };
        // 1. acronyms, mixed-case and alphanumeric names (TypeScript, iOS, SAP, B2, S3…)
        (text.match(/(?<![A-Za-z0-9])(?:[A-Z][A-Z0-9+#&/]{1,7}|[a-z]+[A-Z][A-Za-z0-9+#.]*|[A-Z][a-z]+[A-Z][A-Za-z0-9+#.]*|[A-Za-z]{1,}\d[A-Za-z0-9+#.]*)(?![A-Za-z0-9])/g) || []).forEach((t) => push(t, 1));
        // 2. "maîtrise de X, Y et Z", "experience with X", "such as X, Y"…
        const cue = /(?:ma[iî]trise(?:z|r)?|connaissances?|exp[eé]riences?|comp[eé]tences?|expertise|familiaris[eé]e?|notions?|proficiency|experience|knowledge|skills?|familiar(?:ity)?|using|such as|tels? que|notamment|e\.g\.|y compris|including)\s*(?:de la |de l'|des |du |d'|de |en |with |in |of |on |:)?\s*([^.;\n]{3,160})/gi;
        let m;
        while ((m = cue.exec(text))) m[1].split(/,|\/| et | ou | and | or |\+|·|•/i).forEach((it) => { const w = it.trim().split(/\s+/); if (w.length <= 4) push(it, 2); });
        // 3. list sections under "Compétences / Skills / Requirements / Stack / Outils…"
        const head = /^[ \t]*(?:comp[eé]tences?(?: requises| techniques| cl[eé]s)?|skills?|requirements?|qualifications?|pr[eé]requis|profil recherch[eé]|technologies|tech stack|stack(?: technique)?|outils|tools|environnement technique)[^\n:]{0,25}:?[ \t]*\n((?:[ \t]*[^\n]+\n?){1,12})/gim;
        while ((m = head.exec(text))) m[1].split('\n').forEach((line) => line.replace(/^[\s\-–•·*\d.)]+/, '').split(/,|;|\/| et /i).forEach((it) => { if (it.trim().split(/\s+/).length <= 4) push(it, 2); }));
        // 4. repeated phrases (2–3 words) that carry meaning
        const toks = tokenize(text), freq = new Map();
        for (let n = 2; n <= 3; n++) for (let i = 0; i + n <= toks.length; i++) {
            const g = toks.slice(i, i + n);
            if (STOP.has(g[0]) || STOP.has(g[n - 1]) || GENERIC.has(g[0]) && GENERIC.has(g[n - 1]) || g.some((t) => t.length < 3 || /^\d+$/.test(t))) continue;
            const k = g.join(' '); freq.set(k, (freq.get(k) || 0) + 1);
        }
        [...freq.entries()].filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).slice(0, 6).forEach(([k]) => push(k, 3));
        // drop fragments contained in a longer extracted phrase (V90 / Vestas V90)
        const keep = out.filter((c) => !out.some((o) => o !== c && o.key.length > c.key.length && (' ' + o.key + ' ').includes(' ' + c.key + ' ')));
        return keep.sort((a, b) => a.kind - b.kind).slice(0, 15);
    }

    // Returns { terms:[{display, entry|null, extra}], mode, domains:[{name, score}] }
    function extractKeywords(text) {
        const strong = scan(text, null);
        const score = {};
        strong.forEach((_, e) => { const w = 1 / Math.max(1, e.domains.size); e.domains.forEach((d) => { score[d] = (score[d] || 0) + w; }); });
        const domains = Object.keys(score).map((name) => ({ name, score: score[name] })).filter((d) => d.score >= 1.5).sort((x, y) => y.score - x.score).slice(0, 3);
        const found = domains.length ? scan(text, new Set(domains.map((d) => d.name))) : strong;
        const terms = [...found.entries()].sort((a, b) => b[1] - a[1] || b[0].display.length - a[0].display.length)
            .slice(0, 40).map(([entry]) => ({ display: entry.display, entry, extra: false }));
        extractCandidates(text).forEach((c) => terms.push({ display: c.display, entry: null, extra: true }));
        if (terms.length >= 3) return { terms, mode: 'vocab', domains };
        const n = norm(text), freq = new Map();
        (n.match(/[a-z0-9][a-z0-9+#.\-/]{3,}/g) || []).forEach((raw) => {
            const orig = raw.replace(/^[.\-/]+|[.\-/]+$/g, '');
            const w = orig.replace(/s$/, '');
            if (w.length < 4 || STOP.has(orig) || STOP.has(w) || /^\d+$/.test(w)) return;
            const e = freq.get(w) || { n: 0, show: orig.length <= w.length + 1 ? orig : w };
            e.n++; if (orig === w) e.show = orig;
            freq.set(w, e);
        });
        const words = [...freq.values()].sort((a, b) => b.n - a.n || b.show.length - a.show.length).slice(0, 20).map((e) => ({ display: e.show, entry: null, extra: false }));
        return { terms: words, mode: 'words', domains: [] };
    }
    // Does the CV cover this term? exact entry → exact phrase → stem-equivalent phrase (only for words of 6+ letters)
    function hasKeyword(cv, term) {
        if (term.entry && cv.entries.has(term.entry)) return true;
        if (termRe(term.display).test(cv.text)) return true;
        const toks = tokenize(term.display);
        if (toks.length && toks.every((t) => t.length >= 6)) return (' ' + cv.stems + ' ').includes(' ' + toks.map(stem).join(' ') + ' ');
        return false;
    }
    // Role-specific suggestions: terms of the detected field that sit "next to" the offer's terms in the domain list
    // (lists are grouped by topic), excluding what the CV or the offer already has.
    function suggestFor(domain, cv, jdTerms) {
        const list = DOMAINS[domain] || [], keys = list.map((d) => keyOf(tokenize(d)));
        const used = new Set(jdTerms.map((t) => t.entry).filter(Boolean));
        const pos = [];
        jdTerms.forEach((t) => { if (!t.entry) return; const i = keys.indexOf(t.entry.key); if (i >= 0) pos.push(i); });
        const domWords = new Set(tokenize(domain).map((w) => w.slice(0, 4)));
        const cand = [];
        list.forEach((d, j) => {
            const toks = tokenize(d), e = INDEX.get(keys[j]);
            if (!e || cv.entries.has(e) || used.has(e)) return;
            const near = pos.reduce((a, p) => a + Math.exp(-Math.abs(j - p) / 6), 0);
            cand.push({ e, j, stem: (toks[0] || '').slice(0, 4), score: pos.length ? near : 1 / (1 + j / 10) });
        });
        cand.sort((a, b) => b.score - a.score || a.j - b.j);
        const out = [], stems = new Set();
        for (const c of cand) {
            if (domWords.has(c.stem) || stems.has(c.stem) || out.some((o) => o.entry === c.e)) continue;
            stems.add(c.stem); out.push({ display: c.e.display, entry: c.e });
            if (out.length >= 10) break;
        }
        return out;
    }

    const VERB_RE = new RegExp('^(' + [
        'conc', 'develop', 'deploy', 'install', 'configur', 'ger\\b', 'gere', 'cre(?:e|er|ation)', 'mis\\b', 'mise en', 'optimis', 'administr', 'supervis', 'realis', 'implement', 'automatis', 'migr', 'securis', 'assur', 'dirig', 'pilot', 'integr', 'maintenu', 'maintenance',
        'analys', 'diagnost', 'deploi', 'cabl', 'assembl', 'etudi', 'constr', 'adminis', 'repar', 'resolu', 'encadr', 'amelior', 'redui', 'accel', 'simplifi', 'obtenu', 'remport', 'gagn', 'forme\\b', 'former\\b', 'coordonn', 'redig', 'teste', 'livr', 'ameliore', 'reduit', 'augment', 'lanc', 'conduit', 'anim', 'negoci', 'planifi', 'organis', 'elabor', 'constru', 'participe', 'contribu', 'collabor', 'accompagn', 'depann', 'surveill', 'monitor', 'sensibilis', 'standardis', 'documente', 'rationalis', 'modernis', 'concu',
        'led', 'built', 'design', 'developed', 'managed', 'created', 'implemented', 'deployed', 'improved', 'reduced', 'increased', 'automated', 'optimized', 'launched', 'delivered', 'architect', 'maintained', 'configured', 'installed', 'integrated', 'owned', 'drove', 'mentored'
    ].join('|') + ')', 'i');
    const WEAK_RE = /^(responsable de|charge de|chargee de|en charge|participation|taches?|aide a|aide au|responsible for|worked on|duties|helped|assisted)/i;
    // Strong = starts with an action verb, or a short "Label : detail" heading (max 4 words) — unless it opens with a weak formula
    const isStrong = (b) => {
        const n = norm(b);
        if (WEAK_RE.test(n)) return false;
        if (VERB_RE.test(n)) return true;
        const m = b.match(/^([^:]{2,35})\s*:/);
        return !!m && m[1].trim().split(/\s+/).length <= 4;
    };

    /* ------------------------------------------------------
       CV SCORE
       ------------------------------------------------------ */
    const pageCount = () => document.querySelectorAll('#screen-preview-container .a4-page-sheet').length || 1;

    function computeScore() {
        const d = effectiveData(), c = d.contact || {};
        const words = (collectText(d).join(' ').match(/\S+/g) || []).length;
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
        const strong = bullets.filter(isStrong).length;
        const weak = bullets.filter((b) => WEAK_RE.test(norm(b))).length;
        const sr = bullets.length ? strong / bullets.length : 0;
        add('Expérience', 'Verbes d\'action en début de ligne', sr * 5, 5, bullets.length ? `${Math.round(sr * 100)} % des missions commencent par un verbe d'action ou un intitulé clair.` + (weak ? ` ${weak} commence(nt) par une formule faible (« Responsable de », « Participation à »…) : remplacez-la par un verbe (piloté, conçu, réduit…).` : '') : 'Commencez chaque mission par un verbe (conçu, déployé, optimisé…).');
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
        add('Format', 'Longueur du CV', words < 80 ? 0 : (pg === 1 ? 10 : (pg === 2 ? 7 : 2)), 10, words < 80 ? 'Pas assez de contenu pour évaluer la longueur (moins de 80 mots).' : pg === 1 ? '1 page — idéal.' : (pg === 2 ? '2 pages — acceptable pour un profil expérimenté.' : `${pg} pages — trop long. Utilisez « Ajuster à 1 page » ou condensez.`));
        const longB = bullets.filter((b) => b.length > 220).length;
        add('Format', 'Lisibilité des missions', !bullets.length ? 0 : (longB ? Math.max(0, 5 - longB) : 5), 5, !bullets.length ? 'Aucune mission à évaluer.' : longB ? `${longB} mission(s) dépassent 220 caractères : scindez-les.` : 'Missions concises.');

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
                <div><h3>${vt}</h3><p>${vd}</p><p style="margin-top:4px">${r.pages} page${r.pages > 1 ? 's' : ''} · ${(collectText(effectiveData()).join(' ').match(/\S+/g) || []).length} mots</p></div>
            </div>
            ${top.length ? `<div class="cvx-card"><h4>Priorités</h4><p>Les 3 améliorations qui feront le plus progresser votre score :</p>
                <div class="cvx-checks" style="margin-top:0">${top.map(checkHTML).join('')}</div></div>` : ''}
            <div class="cvx-card"><h4>Mise en page</h4><p>Ajuste automatiquement la taille du texte, l'interligne et les marges pour tenir sur le nombre de pages voulu.</p>
                <div class="cvx-row"><button class="cvx-btn" data-fit="1" style="justify-content:center">Ajuster à 1 page</button><button class="cvx-btn" data-fit="2" style="justify-content:center">Ajuster à 2 pages</button></div></div>
            <div class="cvx-card"><h4>Compatibilité avec une offre</h4>
                <p>Collez le texte d'une offre d'emploi : l'analyseur extrait les mots-clés et vérifie lesquels figurent dans votre CV (utile pour les logiciels ATS).</p>
                <textarea id="cvx-jd" rows="5" placeholder="Collez ici la description du poste…">${esc(store.get('cv_jd', ''))}</textarea>
                <div id="cvx-jd-result"></div></div>
            <div class="cvx-card"><h4>Mon vocabulaire (optionnel)</h4>
                <p>Ajoutez vos propres compétences, outils ou termes métier (séparés par des virgules). Ils seront reconnus dans les offres, en plus du vocabulaire intégré. Enregistré uniquement dans ce navigateur.</p>
                <textarea id="cvx-custom-vocab" rows="3" placeholder="ex. Odoo, soudure TIG, comptabilité analytique, Figma…">${esc(store.get('cv_custom_vocab', ''))}</textarea></div>
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
        const { terms, mode, domains } = extractKeywords(text), cvText = cvPlainText();
        const cv = { text: cvText, entries: new Set(scan(cvText).keys()), stems: tokenize(cvText).map(stem).join(' ') };
        if (!terms.length) { out.innerHTML = '<div class="cvx-empty" style="margin-top:.6rem">Aucun mot-clé exploitable détecté. Collez l\'offre complète.</div>'; return; }
        const hit = terms.filter((t) => hasKeyword(cv, t)), miss = terms.filter((t) => !hasKeyword(cv, t));
        const pct = Math.round((hit.length / terms.length) * 100);
        const note = mode === 'vocab'
            ? 'Compétences et termes reconnus dans l\'offre (vocabulaire + détection directe dans le texte).'
            : 'Peu de termes reconnus : voici les mots les plus répétés de l\'offre (indicatif).';
        const chip = (cls) => (k) => `<span class="cvx-chip ${cls}${k.extra ? ' ext' : ''}" ${k.extra ? 'title="Détecté dans le texte de l\'offre (hors vocabulaire)"' : ''}>${esc(k.display)}</span>`;
        const dom = domains.length ? `<div style="margin-top:.6rem;font-size:.72rem;color:var(--text-muted)">Domaine détecté :</div><div class="cvx-chips">${domains.map((x) => `<span class="cvx-chip dom">${esc(x.name)}</span>`).join('')}</div>` : '';
        const sugg = domains.length ? suggestFor(domains[0].name, cv, terms) : [];
        out.innerHTML = `
            ${dom}
            <div style="margin-top:.6rem;font-size:.72rem;color:var(--text-muted)">${note}</div>
            <div class="cvx-match"><b>${pct} %</b><div class="cvx-meter"><div style="width:${pct}%;background-position:${pct}% 0"></div></div><span style="color:var(--text-muted)">${hit.length}/${terms.length}</span></div>
            ${miss.length ? `<div style="margin-top:.6rem;font-size:.72rem;color:var(--text-muted)">Absents de votre CV — ajoutez ceux qui correspondent réellement à votre expérience :</div><div class="cvx-chips">${miss.map(chip('miss')).join('')}</div>` : ''}
            ${hit.length ? `<div style="margin-top:.6rem;font-size:.72rem;color:var(--text-muted)">Déjà présents :</div><div class="cvx-chips">${hit.map(chip('hit')).join('')}</div>` : ''}
            ${sugg.length ? `<div style="margin-top:.6rem;font-size:.72rem;color:var(--text-muted)">Proches de ce poste, non cités dans l'offre (à ajouter seulement si vous les maîtrisez) :</div><div class="cvx-chips">${sugg.map((k) => `<span class="cvx-chip sugg">${esc(k.display)}</span>`).join('')}</div>` : ''}`;
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
                <p>Vos CV sont enregistrés uniquement dans <b>ce navigateur</b> (stockage local). Ils ne sont envoyés à aucun serveur et personne d'autre ne peut les voir (seule exception : si vous utilisez « Traduire », les textes à traduire transitent par un service de traduction). Sur un ordinateur partagé, exportez votre CV en JSON puis effacez vos données.</p>
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
                if (e.target.id === 'cvx-custom-vocab') { store.set('cv_custom_vocab', e.target.value); clearTimeout(rebuildIndex._t); rebuildIndex._t = setTimeout(() => { rebuildIndex(); runMatch(); }, 300); }
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
    window.CVX_openModal = openModal; window.CVX_closeModal = closeModal;
    window.CVX = { toast, onChange, afterRender, checkpoint, settle, undo, redo, refreshAnalyse, fitToPages, computeScore, openGallery, openVersions };

    function boot() {
        injectUI();
        // window.onload in app.js may replace cvData (first visit) — wait for it
        setTimeout(() => { initHistory(); afterRender(); }, 500);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

    // No save-on-close handler: every edit is already persisted by saveAndSync(), and a blind save at unload
    // could overwrite stored data with whatever happens to be in memory.
})();

/* L'Atelier d'Eros, Le Scribe — Echo, quiz Duo-Code, copie du prompt.
   Echo répond avec une IA via un petit serveur (voir ../echo-worker). Les réponses du quiz restent sur ce serveur.
   Sans serveur configuré, Echo répond par des réponses préparées et le quiz est indisponible. */
(function () {
  'use strict';

  // Adresse du serveur Echo (Cloudflare Worker), sans "/" final. Exemple : 'https://echo-atelier.compte.workers.dev'
  var ECHO_API = '';

  // Ce script sert les deux pages du site : la page 1 (le site, à la racine) et la page 2
  // (la Bibliothèque des Murmures, dans le dossier bibliotheque/). Cette ligne repère où on se trouve.
  var SUR_BIBLIO = /\/bibliotheque(\/|$)/.test(location.pathname);

  // Transforme le lien d'une réponse d'Echo en adresse valable depuis la page courante.
  // Un lien « biblio: true » mène à la Bibliothèque, les autres mènent au site.
  function adresse(e) {
    if (!e || !e.href) return '';
    if (/^https?:/.test(e.href)) return e.href;
    if (e.biblio) return SUR_BIBLIO ? e.href : 'bibliotheque/' + e.href;
    return SUR_BIBLIO ? '../' + e.href : e.href;
  }

  var PROMPT = "Tu es mon partenaire Duo-Code. Voici nos règles :\n• Repère temps : commence chaque réponse par la date et l'heure si tu peux les connaître. Si tu ne peux pas, dis-le simplement, ne les invente jamais.\n• Une seule question à la fois.\n• Avant d'agir, propose-moi des options et ta recommandation, puis attends mon feu vert. Mon feu vert s'écrit : OK, feu vert.\n• Tu n'écris et tu n'agis qu'après mon feu vert.\n• Si j'écris « pause », on fait une pause, sans insister.\nProtection : je ne te donne aucune donnée personnelle ou sensible, et tu ne m'en demandes pas. Tu restes dans le rôle de partenaire pour cette tâche, sans déborder sur autre chose.\nMa tâche : N' = [écris ici ce qui te manque, par exemple « ranger mon bureau »]\nAide-moi à la découper en étapes Δ.1, Δ.2, Δ.3. Chaque étape reste ↻ (en attente) jusqu'à ce que je la valide moi-même en V.";

  var KB = {
    accueil: { text: "Bonjour, je suis Echo, le guide de l'Atelier. Je peux vous orienter dans le site, et vous conduire à sa seconde page, la Bibliothèque des Murmures. Que cherchez-vous ?" },
    accueilBiblio: { text: "Bonjour, je suis Echo. Je vous guide dans la Bibliothèque des Murmures : la charte, les étagères, le don et le dépôt de livres (certaines parties arrivent bientôt). Que cherchez-vous ?" },
    murmures: { text: "La Bibliothèque des Murmures est la seconde page du site : un lieu de partage de connaissances où chacun dépose son livre numérique, fixe son prix et transmet ce qu'il sait, selon la règle d'or. Elle est en cours de construction.", href: '#accueil', label: 'Entrer dans la Bibliothèque', biblio: true },
    etageres: { text: "Les étagères présentent les livres par domaine : Écriture, Formule, Code, Nature, Artisanat, Philosophie. Vous pouvez filtrer par domaine ou chercher un titre ou un auteur.", href: '#etageres', label: 'Parcourir les étagères', biblio: true },
    regleor: { text: "La règle d'or tient en trois engagements : donner honnêtement, recevoir justement, respecter le savoir. Chaque personne les accepte en entrant dans la bibliothèque.", href: '#regle', label: 'Lire la charte', biblio: true },
    depot: { text: "Pour déposer un livre : créer son espace auteur, déposer le fichier PDF ou EPUB, choisir son prix (payant, prix libre ou gratuit), puis signer la charte. Chaque livre est relu avant la mise en rayon. Cette partie arrive bientôt.", href: '#deposer', label: 'Déposer mon livre', biblio: true },
    don: { text: "Un don rejoint le fonds commun de la bibliothèque, redistribué aux autrices et aux auteurs qui y partagent leurs écrits. Cette partie arrive bientôt.", href: '#soutien', label: 'Faire un don', biblio: true },
    retour: { text: "Retour à la première page : le site de L'Atelier d'Eros, avec son histoire, le livre gratuit, le Duo-Code et les outils.", href: '#accueil', label: 'Retourner au site' },
    lecture: { text: "Les pages 1 à 16 de « L'Univers d'Eros à l'atelier des débutants » sont gratuites : vous pouvez les lire en ligne ou télécharger le PDF. La suite sera vendue chapitre par chapitre.", href: '#lire', label: 'Lire gratuitement' },
    codex: { text: "Chaque chapitre à venir inclura des formules du Codex d'Eros, que vous pourrez pratiquer avec moi. Cette partie n'est pas encore ouverte, et je ne dévoile pas les formules d'avance. En attendant, je peux vous faire pratiquer le Duo-Code : dites « s'exercer ».", href: '#lire', label: 'Voir la suite' },
    symboles: { text: "Le Duo-Code suit une tâche avec quatre signes :\nN' = le manque, la tâche à accomplir.\nΔ = l'action, découpée en étapes (Δ.1, Δ.2, Δ.3).\n↻ = en attente. Ce signe ne veut jamais dire « fait ».\nV = validé, vérifié et confirmé par vous.\nVoulez-vous vous exercer ?", href: '#duo-code', label: 'Voir le Duo-Code' },
    outils: { text: "Le site propose deux outils gratuits. Écho est un prompteur qui suit votre voix pour lire un texte à voix haute, avec un atelier de prompts. Le kit Duo-Code prépare des prompts pour garder un duo de personnages identique d'une image à l'autre : famille, amis, animaux ou IA. Vos textes restent sur votre appareil.", href: '#outils', label: 'Voir les outils' },
    identite: { text: "Je suis Echo, le guide officiel de l'Atelier d'Eros. Je vous accueille, je vous oriente vers l'histoire, le livre gratuit, le Duo-Code et la boutique, et je vous accompagne dans le quiz. Eros garde toujours la décision : je n'agis jamais à sa place.", href: '#echo', label: 'Voir Echo' },
    auteur: { text: "Eros Bonaffini est l'auteur de L'Univers d'Eros. Il vient de Namur, en Belgique, et il est devenu passionné d'écriture à la suite d'un parcours de vie tumultueux. Son récit s'inspire de faits liés à sa vie.", href: '#auteur', label: "Voir l'auteur" },
    voix: { text: "La voix d'introduction est une courte narration d'environ 1 min 35, inspirée des trois premiers chapitres. Vous pouvez la lire dans la section L'histoire.", href: '#histoire', label: "Aller à L'histoire" },
    histoire: { text: "L'histoire commence avant Véritania. Un astéroïde transforme le monde et les survivants deviennent des Porteurs Divins. Eros, orphelin, ne reçoit aucun pouvoir, et sa sœur Lyra est choisie par l'arc d'Artémis. Je ne dévoile rien de plus que ce qui est écrit sur le site.", href: '#histoire', label: "Aller à L'histoire" },
    navigation: { text: "Le site se parcourt dans cet ordre : L'histoire, Le Livre Vivant, la lecture gratuite, L'auteur, Echo, Le Duo-Code, les outils, le Quiz, la Boutique, puis l'Aide. Pour débuter, je vous conseille L'histoire, puis l'extrait du Livre Vivant. La seconde page du site est la Bibliothèque des Murmures.", href: '#livre-vivant', label: 'Ouvrir Le Livre Vivant' },
    contenu: { text: "Le Livre Vivant rassemble le Tome 1 (La trilogie d'Eros), les Carnets de Véritania, les repères et un extrait. Certains contenus restent à définir. La procédure pour retrouver un contenu n'est pas encore confirmée.", href: '#livre-vivant', label: 'Voir Le Livre Vivant' },
    paiement: { text: "La boutique n'est pas encore ouverte. Le paiement passera par Stripe en 4 étapes : choisir une formule, vérifier le récapitulatif sur la page Stripe, valider le paiement, puis revenir au site pour vérifier l'accès. Ne m'envoyez jamais de données bancaires.", href: '#boutique', label: 'Voir la boutique' },
    duo: { text: "Le Duo-Code est une façon de travailler à deux, vous et l'IA, comme un frère et une sœur : l'un propose, l'autre valide, et rien ne part sans votre feu vert. Vous pouvez faire une pause à tout moment.", href: '#duo-code', label: 'Voir le Duo-Code' },
    donnees: { text: "Je préfère que vous ne m'envoyiez aucune donnée personnelle ou bancaire. Pour un achat, tout se passera sur la page Stripe.", href: '#aide', label: "Voir l'aide" },
    inconnu: { text: "Je ne sais pas encore répondre à cela, et je préfère ne rien inventer. Choisissez un sujet ci-dessous, ou consultez l'aide.", href: '#aide', label: "Aller à l'aide" },
    indispo: { text: "Je n'arrive pas à joindre mon cerveau pour le moment. Réessayez dans un instant, ou choisissez un sujet ci-dessous.", href: '#aide', label: "Voir l'aide" },
    quizindispo: { text: "Le quiz est momentanément indisponible. Réessayez plus tard.", href: '#duo-code', label: 'Relire le Duo-Code' }
  };

  function match(t) {
    var s = t.toLowerCase();
    if (/\d{8,}/.test(s.replace(/[\s-]/g, ''))) return 'donnees';
    if (/exerc|entra[iî]n|quiz|pratiqu/.test(s)) return 'pratique';
    // La Bibliothèque des Murmures (page 2) et le retour au site (page 1)
    if (/retour|premi[èe]re page|revenir au site/.test(s)) return 'retour';
    if (/d[ée]pos|publier|devenir auteur|vendre mon livre/.test(s)) return 'depot';
    if (/[ée]tag[èe]re|parcourir|rayon/.test(s)) return 'etageres';
    if (/r[èe]gle d.or|charte|engagement/.test(s)) return 'regleor';
    if (/murmure|biblioth[èe]que/.test(s)) return 'murmures';
    if (/\bdon\b|donner|fonds/.test(s)) return 'don';
    if (/formule|codex/.test(s)) return 'codex';
    if (/paie|stripe|prix|achat|ach[eè]t|boutique|carte/.test(s)) return 'paiement';
    if (/symbole|δ|↻|\bn['’](?!\w)/.test(s)) return 'symboles';
    if (/outil|prompteur|t[ée]l[ée]prompteur|\bkit\b|personnages? identiques?/.test(s)) return 'outils';
    if (/qui es[- ]tu|qui [êe]tes[- ]vous|tu es qui|ton nom|ton r[ôo]le|que fais[- ]tu/.test(s)) return 'identite';
    if (/auteur|qui est eros|namur|biograph|portrait|bonaffini/.test(s)) return 'auteur';
    if (/voix off|voix d.intro|narration|sous-titre/.test(s)) return 'voix';
    if (/gratuit|extrait|pdf|lire|t[ée]l[ée]charg|po[èe]me/.test(s)) return 'lecture';
    if (/duo|feu vert|pause|\bia\b/.test(s)) return 'duo';
    if (/histoire|eros|lyra|v[ée]ritania|r[ée]cit|ast[ée]ro/.test(s)) return 'histoire';
    if (/livre|tome|carnet|extrait|contenu|trouv|rep[èe]re/.test(s)) return 'contenu';
    if (/naviguer|refuge|section|o[ùu]|commenc|aide|contact/.test(s)) return 'navigation';
    return 'inconnu';
  }

  // Questions du quiz (publiques). Les réponses sont uniquement sur le serveur.
  var QZ = [
    "L'IA dit « c'est fait », mais vous n'avez rien vérifié. Quel signe convient : ↻ ou V ?",
    "Vous avez vérifié le résultat et vous le confirmez. Quel signe convient : ↻ ou V ?",
    "L'IA a envoyé un message sans attendre votre accord. Quel geste a été oublié ?",
    "Que représente le signe Δ ?",
    "Que représente N' ?",
    "Quel geste demande de vérifier la date et l'heure avant d'agir ?",
    "Combien de questions l'IA doit-elle poser à la fois ?",
    "Dans le duo, qui garde la décision finale : vous ou l'IA ?"
  ];
  var N = QZ.length;

  // Les suggestions changent selon la page : Echo propose ce qui est utile là où l'on se trouve.
  var CHIPS = SUR_BIBLIO ? [
    { label: 'Parcourir les étagères', key: 'etageres' },
    { label: "La règle d'or", key: 'regleor' },
    { label: 'Déposer un livre', key: 'depot' },
    { label: 'Faire un don', key: 'don' },
    { label: 'Retour au site', key: 'retour' }
  ] : [
    { label: "Explorer l'histoire", key: 'histoire' },
    { label: 'Naviguer dans le refuge', key: 'navigation' },
    { label: 'Retrouver un contenu', key: 'contenu' },
    { label: 'Lire gratuitement', key: 'lecture' },
    { label: 'La Bibliothèque des Murmures', key: 'murmures' },
    { label: "S'exercer au Duo-Code", key: 'pratique' },
    { label: 'Aide pour le paiement', key: 'paiement' }
  ];

  // Sans serveur Echo, le quiz ne peut pas fonctionner : on masque sa section, son lien de menu et son bouton.
  if (!ECHO_API) {
    var quizSection = document.getElementById('quiz');
    var quizLink = document.querySelector('a.nav[href="#quiz"]');
    if (quizSection) quizSection.hidden = true;
    if (quizLink) quizLink.hidden = true;
    CHIPS = CHIPS.filter(function (c) { return c.key !== 'pratique'; });
    KB.navigation.text = KB.navigation.text.replace(' le Quiz,', '');
  }

  var state = { open: false, busy: false, quiz: null, score: 0, errors: 0, results: [], msgs: [{ from: 'echo', key: SUR_BIBLIO ? 'accueilBiblio' : 'accueil' }] };

  var $ = function (id) { return document.getElementById(id); };
  var panel = $('echo-panel'), msgsEl = $('echo-msgs'), chipsEl = $('echo-chips');
  var form = $('echo-form'), input = $('echo-input'), toggle = $('echo-toggle'), sub = $('echo-sub');

  function el(tag, css, text) {
    var n = document.createElement(tag);
    if (css) n.style.cssText = css;
    if (text != null) n.textContent = text;
    return n;
  }

  function api(path, body) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 20000);
    return fetch(ECHO_API + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal
    }).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) throw new Error('http ' + r.status);
      return r.json();
    }, function (e) { clearTimeout(timer); throw e; });
  }

  function say(items, extra) {
    var k;
    for (k in extra) { if (Object.prototype.hasOwnProperty.call(extra, k)) state[k] = extra[k]; }
    state.msgs = state.msgs.concat(items);
    input.value = '';
    render();
  }

  function ask(text, key) {
    say([{ from: 'me', text: text }, { from: 'echo', key: key }], {});
  }

  function startQuiz(label) {
    var results = [];
    for (var i = 0; i < N; i++) results.push(null);
    if (!ECHO_API) {
      say([{ from: 'me', text: label }, { from: 'echo', key: 'quizindispo' }], {});
      return;
    }
    say(
      [{ from: 'me', text: label }, { from: 'echo', text: "Voici " + N + " questions sur le Duo-Code, une à la fois. Je garde les réponses pour moi et je corrige chacune des vôtres. Au-delà de 3 erreurs, je vous oriente vers le livre à télécharger, qui contient les indices. Écrivez « pause » pour arrêter.\n\nQuestion 1 sur " + N + ". " + QZ[0] }],
      { quiz: 0, score: 0, errors: 0, results: results, open: true }
    );
  }

  function typing(on) {
    state.busy = on;
    state.msgs = state.msgs.filter(function (m) { return !m.typing; });
    if (on) state.msgs.push({ from: 'echo', typing: true, text: 'Echo écrit…' });
  }

  function answerQuiz(t) {
    var i = state.quiz;
    if (/pause|stop|arr[êe]t/i.test(t)) {
      say([{ from: 'me', text: t }, { from: 'echo', text: "Pause prise, sans souci. Revenez quand vous voulez, dites « s'exercer »." }], { quiz: null });
      return;
    }
    if (state.busy) return;
    state.msgs.push({ from: 'me', text: t });
    typing(true);
    input.value = '';
    render();
    api('/quiz', { i: i, answer: t }).then(function (r) {
      typing(false);
      var good = !!r.correct;
      var score = state.score + (good ? 1 : 0);
      var errors = state.errors + (good ? 0 : 1);
      var results = QZ.map(function (_, k) { return k === i ? (good ? 'ok' : 'ko') : (state.results[k] || null); });
      var fb = good ? "Exact. " + (r.explanation || '') : "Pas tout à fait.";
      if (errors > 3) {
        say([{ from: 'echo', text: fb + "\n\nVous avez dépassé 3 erreurs, ce n'est pas grave. Le livre à télécharger contient les indices des réponses, dans le guide Duo-Code des pages 9 et 10 : lisez-le, puis revenez refaire le quiz avec moi.", href: '#lire', label: 'Télécharger le livre' }], { quiz: null, score: score, errors: errors, results: results });
      } else if (i + 1 < N) {
        say([{ from: 'echo', text: fb + "\n\nQuestion " + (i + 2) + " sur " + N + ". " + QZ[i + 1] }], { quiz: i + 1, score: score, errors: errors, results: results });
      } else {
        say([{ from: 'echo', text: fb + "\n\nTerminé : " + score + " sur " + N + (errors ? ". Pour progresser, relisez le guide Duo-Code, pages 9 et 10 du livre à télécharger." : ". Bravo, sans erreur."), href: errors ? '#lire' : '#duo-code', label: errors ? 'Télécharger le livre' : 'Voir le Duo-Code' }], { quiz: null, score: score, errors: errors, results: results });
      }
    }).catch(function () {
      typing(false);
      say([{ from: 'echo', key: 'quizindispo' }], {});
    });
  }

  function history() {
    var h = [];
    state.msgs.forEach(function (m) {
      if (m.typing) return;
      if (m.from === 'me') h.push({ role: 'user', content: m.text });
      else h.push({ role: 'assistant', content: m.key ? KB[m.key].text : m.text });
    });
    return h.slice(-8);
  }

  function askAI(t, fallbackKey) {
    if (state.busy) return;
    state.msgs.push({ from: 'me', text: t });
    typing(true);
    input.value = '';
    render();
    api('/chat', { messages: history() }).then(function (r) {
      typing(false);
      var m = { from: 'echo', text: r.reply || KB.inconnu.text };
      if (r.link) { m.href = r.link.href; m.label = r.link.label; }
      say([m], {});
    }).catch(function () {
      typing(false);
      say([{ from: 'echo', key: fallbackKey === 'inconnu' ? 'indispo' : fallbackKey }], {});
    });
  }

  function send(text) {
    var t = text.trim().slice(0, 300);
    if (!t) return;
    if (state.quiz !== null) { answerQuiz(t); return; }
    var k = match(t);
    if (k === 'pratique') startQuiz(t);
    else if (k === 'donnees' || !ECHO_API) ask(t, k);
    else askAI(t, k);
  }

  function renderMessages() {
    msgsEl.textContent = '';
    state.msgs.forEach(function (m) {
      var mine = m.from === 'me';
      var e = mine ? null : (m.key ? KB[m.key] : m);
      var box = el('div', mine
        ? 'align-self:flex-end;max-width:85%;padding:10px 14px;border-radius:16px 16px 4px 16px;background:var(--echo-fonce,#1F2E4A);color:#FFFFFF'
        : 'align-self:flex-start;max-width:90%;padding:10px 14px;border-radius:16px 16px 16px 4px;background:#FFFFFF;border:1px solid #D5DCD2;color:#1E2A3A' + (m.typing ? ';font-style:italic' : ''));
      box.appendChild(el('p', 'margin:0;font-size:16px;line-height:1.5;white-space:pre-line', mine ? m.text : e.text));
      if (e && e.href) {
        var a = el('a', 'display:inline-block;margin-top:8px;color:var(--echo-fonce,#1F2E4A);font-weight:700;text-decoration:underline;text-decoration-color:var(--echo-accent,#7D5A17);text-underline-offset:4px', e.label);
        a.href = adresse(e);
        box.appendChild(a);
      }
      msgsEl.appendChild(box);
    });
    // Montre le début du dernier message (et non sa fin) : une longue réponse reste lisible depuis sa première ligne.
    var last = msgsEl.lastElementChild;
    if (last && last.offsetHeight > msgsEl.clientHeight - 16) {
      msgsEl.scrollTop += last.getBoundingClientRect().top - msgsEl.getBoundingClientRect().top - 8;
    } else {
      msgsEl.scrollTop = msgsEl.scrollHeight;
    }
  }

  function renderQuiz() {
    var grid = $('q-grid');
    if (!grid) return;
    grid.textContent = '';
    var ok = 0, ko = 0, any = false;
    QZ.forEach(function (q, k) {
      var r = state.results[k] || null;
      var cur = state.quiz === k;
      if (r === 'ok') ok++;
      if (r === 'ko') ko++;
      if (r) any = true;
      var tone = r === 'ok' ? 'background:#DCE9DF;color:#1E4D2B' : r === 'ko' ? 'background:#F3E1D6;color:#7A2E12' : 'background:#EEF1EC;color:#3C4756';
      var card = el('article', 'background:#FFFFFF;border-radius:17px;padding:22px;' + (cur ? 'border:2px solid #1F2E4A' : 'border:1px solid #D5DCD2'));
      var head = el('div', 'display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px');
      head.appendChild(el('p', 'margin:0;color:#7D5A17;font-size:14px;font-weight:700;letter-spacing:.14em;text-transform:uppercase', 'Question ' + (k + 1)));
      head.appendChild(el('span', 'padding:2px 12px;border-radius:99px;font-size:14px;font-weight:700;' + tone, r === 'ok' ? 'Réussie' : r === 'ko' ? 'À revoir' : cur ? 'En cours' : 'À répondre'));
      card.appendChild(head);
      card.appendChild(el('p', 'margin:0', q));
      grid.appendChild(card);
    });
    $('q-ok').textContent = ok;
    $('q-ko').textContent = ko;
    $('q-toomany').hidden = !(state.errors > 3);
    $('quiz-open').textContent = state.quiz !== null ? 'Continuer avec Echo' : (any ? 'Recommencer avec Echo' : 'Commencer avec Echo');
  }

  function render() {
    panel.style.display = state.open ? 'flex' : 'none';
    toggle.textContent = state.open ? 'Fermer Echo' : 'Parler à Echo';
    toggle.setAttribute('aria-expanded', state.open ? 'true' : 'false');
    var lieu = SUR_BIBLIO ? 'Guide de la Bibliothèque' : "Guide de l'Atelier";
    if (sub) sub.textContent = lieu + (ECHO_API ? ' · propulsé par une IA' : ' · réponses préparées');
    renderMessages();
    renderQuiz();
  }

  function setOpen(v) {
    state.open = v;
    render();
    if (v) input.focus();
  }

  CHIPS.forEach(function (c) {
    var b = el('button', 'flex:0 0 auto;white-space:nowrap;min-height:44px;padding:8px 14px;border:1px solid var(--echo-fonce,#1F2E4A);border-radius:99px;background:transparent;color:var(--echo-fonce,#1F2E4A);font:inherit;font-size:14px;font-weight:700;cursor:pointer', c.label);
    b.type = 'button';
    b.addEventListener('click', function () {
      if (c.key === 'pratique') startQuiz(c.label);
      else if (state.quiz !== null) answerQuiz(c.label);
      else ask(c.label, c.key);
    });
    chipsEl.appendChild(b);
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-echo-toggle]'), function (b) {
    b.addEventListener('click', function () { setOpen(!state.open); });
  });

  // Le bouton du quiz n'existe que sur la page 1 : sur la page 2, on ne branche rien.
  var boutonQuiz = $('quiz-open');
  if (boutonQuiz) {
    boutonQuiz.addEventListener('click', function () {
      if (state.quiz !== null) setOpen(true); else startQuiz('Commencer le quiz');
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    send(input.value);
  });

  // Le bouton « Copier le bloc » n'existe que sur la page 1 : sur la page 2 on utilise un bouton factice.
  var copyBtn = $('copy-btn') || document.createElement('button');
  copyBtn.addEventListener('click', function () {
    function done() {
      copyBtn.textContent = 'Copié';
      setTimeout(function () { copyBtn.textContent = 'Copier le bloc'; }, 2000);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(PROMPT).then(done, done);
    } else {
      var ta = document.createElement('textarea');
      ta.value = PROMPT;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      done();
    }
  });

  render();
})();

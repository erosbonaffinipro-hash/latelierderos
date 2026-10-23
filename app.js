/* L'Atelier d'Eros, Le Scribe — Echo, quiz Duo-Code, copie du prompt.
   Echo répond avec une IA via un petit serveur (voir ../echo-worker). Les réponses du quiz restent sur ce serveur.
   Sans serveur configuré, Echo répond par des réponses préparées et le quiz est indisponible. */
(function () {
  'use strict';

  // Adresse du serveur Echo (Cloudflare Worker), sans "/" final. Exemple : 'https://echo-atelier.compte.workers.dev'
  var ECHO_API = '';

  var PROMPT = "Tu es mon partenaire Duo-Code. Voici nos règles :\n• Repère temps : commence chaque réponse par la date et l'heure si tu peux les connaître. Si tu ne peux pas, dis-le simplement, ne les invente jamais.\n• Une seule question à la fois.\n• Avant d'agir, propose-moi des options et ta recommandation, puis attends mon feu vert. Mon feu vert s'écrit : OK, feu vert.\n• Tu n'écris et tu n'agis qu'après mon feu vert.\n• Si j'écris « pause », on fait une pause, sans insister.\nProtection : je ne te donne aucune donnée personnelle ou sensible, et tu ne m'en demandes pas. Tu restes dans le rôle de partenaire pour cette tâche, sans déborder sur autre chose.\nMa tâche : N' = [écris ici ce qui te manque, par exemple « ranger mon bureau »]\nAide-moi à la découper en étapes Δ.1, Δ.2, Δ.3. Chaque étape reste ↻ (en attente) jusqu'à ce que je la valide moi-même en V.";

  var KB = {
    accueil: { text: "Bonjour, je suis Echo, le guide de l'Atelier. Je peux vous orienter dans le site. Que cherchez-vous ?" },
    lecture: { text: "Les pages 1 à 16 de « L'Univers d'Eros à l'atelier des débutants » sont gratuites : vous pouvez les lire en ligne ou télécharger le PDF. La suite sera vendue chapitre par chapitre.", href: '#lire', label: 'Lire gratuitement' },
    codex: { text: "Chaque chapitre à venir inclura des formules du Codex d'Eros, que vous pourrez pratiquer avec moi. Cette partie n'est pas encore ouverte, et je ne dévoile pas les formules d'avance. En attendant, je peux vous faire pratiquer le Duo-Code : dites « s'exercer ».", href: '#lire', label: 'Voir la suite' },
    symboles: { text: "Le Duo-Code suit une tâche avec quatre signes :\nN' = le manque, la tâche à accomplir.\nΔ = l'action, découpée en étapes (Δ.1, Δ.2, Δ.3).\n↻ = en attente. Ce signe ne veut jamais dire « fait ».\nV = validé, vérifié et confirmé par vous.\nVoulez-vous vous exercer ?", href: '#duo-code', label: 'Voir le Duo-Code' },
    histoire: { text: "L'histoire commence avant Véritania. Un astéroïde transforme le monde et les survivants deviennent des Porteurs Divins. Eros, orphelin, ne reçoit aucun pouvoir, et sa sœur Lyra est choisie par l'arc d'Artémis. Je ne dévoile rien de plus que ce qui est écrit sur le site.", href: '#histoire', label: "Aller à L'histoire" },
    navigation: { text: "Le site se parcourt dans cet ordre : L'histoire, Le Livre Vivant, Echo, Le Duo-Code, le Quiz, la Boutique, puis l'Aide. Pour débuter, je vous conseille L'histoire, puis l'extrait du Livre Vivant.", href: '#livre-vivant', label: 'Ouvrir Le Livre Vivant' },
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
    if (/formule|codex/.test(s)) return 'codex';
    if (/paie|stripe|prix|achat|ach[eè]t|boutique|carte/.test(s)) return 'paiement';
    if (/symbole|δ|↻|\bn['’](?!\w)/.test(s)) return 'symboles';
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

  var CHIPS = [
    { label: "Explorer l'histoire", key: 'histoire' },
    { label: 'Naviguer dans le refuge', key: 'navigation' },
    { label: 'Retrouver un contenu', key: 'contenu' },
    { label: 'Lire gratuitement', key: 'lecture' },
    { label: "S'exercer au Duo-Code", key: 'pratique' },
    { label: 'Aide pour le paiement', key: 'paiement' }
  ];

  var state = { open: false, busy: false, quiz: null, score: 0, errors: 0, results: [], msgs: [{ from: 'echo', key: 'accueil' }] };

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
        ? 'align-self:flex-end;max-width:85%;padding:10px 14px;border-radius:16px 16px 4px 16px;background:#1F2E4A;color:#FFFFFF'
        : 'align-self:flex-start;max-width:90%;padding:10px 14px;border-radius:16px 16px 16px 4px;background:#FFFFFF;border:1px solid #D5DCD2;color:#1E2A3A' + (m.typing ? ';font-style:italic' : ''));
      box.appendChild(el('p', 'margin:0;font-size:16px;line-height:1.5;white-space:pre-line', mine ? m.text : e.text));
      if (e && e.href) {
        var a = el('a', 'display:inline-block;margin-top:8px;color:#1F2E4A;font-weight:700;text-decoration:underline;text-decoration-color:#7D5A17;text-underline-offset:4px', e.label);
        a.href = e.href;
        box.appendChild(a);
      }
      msgsEl.appendChild(box);
    });
    msgsEl.scrollTop = msgsEl.scrollHeight;
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
    if (sub) sub.textContent = ECHO_API ? "Guide de l'Atelier · propulsé par une IA" : "Guide de l'Atelier · réponses préparées";
    renderMessages();
    renderQuiz();
  }

  function setOpen(v) {
    state.open = v;
    render();
    if (v) input.focus();
  }

  CHIPS.forEach(function (c) {
    var b = el('button', 'min-height:44px;padding:8px 14px;border:1px solid #1F2E4A;border-radius:99px;background:transparent;color:#1F2E4A;font:inherit;font-size:14px;font-weight:700;cursor:pointer', c.label);
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

  $('quiz-open').addEventListener('click', function () {
    if (state.quiz !== null) setOpen(true); else startQuiz('Commencer le quiz');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    send(input.value);
  });

  var copyBtn = $('copy-btn');
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

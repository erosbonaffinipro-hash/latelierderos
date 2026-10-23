/* Duo-Code, le kit de duo (famille, amis, animaux, IA).
   Tout se passe dans le navigateur : rien n'est envoyé nulle part.
   Les réponses ne sont gardées sur l'appareil que si la case « Garder mes réponses » est cochée. */
(function () {
  'use strict';

  var KEY = 'duocode-duo-v2';
  var $ = function (id) { return document.getElementById(id); };

  function F(key, label, ph, fmt, opts) {
    opts = opts || {};
    return { key: key, label: label, ph: ph, fmt: fmt, short: !!opts.short, hint: opts.hint || '' };
  }

  /* Fiches par type de personnage : h = humain, a = animal, i = IA */
  var KINDS = {
    h: [
      F('nom', 'Prénom ou surnom', 'ex. Lili', '', { }),
      F('age', 'Âge apparent', 'ex. 25 ans', '{v} d’apparence', { short: true }),
      F('taille', 'Taille', 'ex. petite', 'taille : {v}', { short: true }),
      F('cheveux', 'Cheveux', 'ex. bruns, ondulés, aux épaules', 'cheveux {v}'),
      F('yeux', 'Yeux', 'ex. verts', 'yeux {v}', { short: true }),
      F('peau', 'Teint', 'ex. clair, taches de rousseur', 'teint {v}', { short: true }),
      F('tenue', 'Tenue signature', 'ex. pull moutarde, jean, bottines', 'porte toujours {v}'),
      F('objet', 'Détail signature', 'ex. lunettes rondes dorées', 'détail signature : {v}', { hint: 'ce qui rend reconnaissable' }),
      F('carac', 'Caractère en 3 mots', 'ex. douce, têtue, rêveuse', 'personnalité : {v}')
    ],
    a: [
      F('nom', 'Nom ou surnom', 'ex. Pixel', ''),
      F('espece', 'Espèce et race', 'ex. chien, border collie', '{v}'),
      F('age', 'Âge', 'ex. 4 ans', '{v}', { short: true }),
      F('taille', 'Taille', 'ex. moyenne', 'taille : {v}', { short: true }),
      F('pelage', 'Pelage, plumage ou écailles', 'ex. noir et blanc, poil mi-long', '{v}'),
      F('yeux', 'Yeux', 'ex. marron foncé', 'yeux {v}'),
      F('marque', 'Marque distinctive', 'ex. tache blanche sur l’oreille gauche', 'marque distinctive : {v}', { hint: 'ce qui rend reconnaissable' }),
      F('accessoire', 'Collier ou accessoire', 'ex. collier rouge avec une médaille', 'porte toujours {v}'),
      F('carac', 'Caractère en 3 mots', 'ex. joueur, curieux, câlin', 'personnalité : {v}')
    ],
    i: [
      F('nom', 'Nom de l’IA', 'ex. Echo', ''),
      F('forme', 'Forme', 'ex. petit robot rond, hologramme, mascotte', 'forme : {v}'),
      F('couleur', 'Couleurs et matière', 'ex. blanc mat avec un liseré doré', 'couleurs et matières : {v}'),
      F('yeux', 'Yeux ou capteurs', 'ex. deux écrans ronds bleus', 'yeux : {v}'),
      F('taille', 'Taille par rapport à l’humain', 'ex. à hauteur d’épaule', 'taille : {v}'),
      F('signe', 'Détail signature', 'ex. petite antenne qui s’allume', 'détail signature : {v}', { hint: 'ce qui rend reconnaissable' }),
      F('carac', 'Caractère en 3 mots', 'ex. calme, attentive, précise', 'personnalité : {v}')
    ]
  };

  function L(id, a, b, kA, kB, phrase, frat) {
    return { id: id, a: a, b: b, kA: kA, kB: kB, phrase: phrase, frat: !!frat };
  }

  var MODES = {
    famille: { label: 'FAMILLE', liens: [
      L('sf', 'la sœur', 'le frère', 'h', 'h', 'Une sœur et son frère', 1),
      L('ss', 'la première sœur', 'la seconde sœur', 'h', 'h', 'Deux sœurs', 1),
      L('ff', 'le premier frère', 'le second frère', 'h', 'h', 'Deux frères', 1),
      L('pe', 'le parent', 'l’enfant', 'h', 'h', 'Un parent et son enfant'),
      L('gp', 'le grand-parent', 'le petit-enfant', 'h', 'h', 'Un grand-parent et son petit-enfant')
    ] },
    amis: { label: 'AMIS', liens: [
      L('am', 'l’ami·e n° 1', 'l’ami·e n° 2', 'h', 'h', 'Deux ami·e·s proches'),
      L('en', 'l’ami·e d’enfance n° 1', 'l’ami·e d’enfance n° 2', 'h', 'h', 'Deux ami·e·s d’enfance'),
      L('co', 'le·la colocataire n° 1', 'le·la colocataire n° 2', 'h', 'h', 'Deux colocataires complices')
    ] },
    animaux: { label: 'ANIMAUX', liens: [
      L('ch', 'l’humain', 'le chien', 'h', 'a', 'Un humain et son chien'),
      L('ca', 'l’humain', 'le chat', 'h', 'a', 'Un humain et son chat'),
      L('an', 'l’humain', 'l’animal', 'h', 'a', 'Un humain et son animal compagnon'),
      L('aa', 'le premier animal', 'le second animal', 'a', 'a', 'Deux animaux compagnons')
    ] },
    ia: { label: 'IA', liens: [
      L('hi', 'l’humain', 'l’IA', 'h', 'i', 'Un humain et son IA')
    ] }
  };

  var EMOS = {
    famille: ['rire ensemble', 'check / tape-m’en cinq', 'câlin', 'dos à dos, bras croisés, l’air complice', '« merci »', '« je t’aime »', 'surprise, bouche ouverte', 'bonne nuit, endormis l’un contre l’autre'],
    amis: ['fou rire', 'check / tape-m’en cinq', 'câlin d’amis', 'épaule contre épaule, l’air complice', '« merci »', '« t’es top »', 'surprise, bouche ouverte', '« bonne nuit », fatigués côte à côte'],
    animaux: ['jouer ensemble', 'check : patte contre main', 'câlin', 'côte à côte, l’air complice', '« merci »', '« je t’aime »', 'surprise, yeux ronds', 'bonne nuit, endormis l’un contre l’autre'],
    ia: ['rire ensemble', 'check / tape-m’en cinq', 'feu vert : pouce levé, petite lumière verte', 'pause : mains ouvertes, lumière douce', '« merci »', '« bien joué »', 'surprise', 'bonne nuit, l’IA en veille douce']
  };

  var SHARED = ['prec', 'style', 'geste', 'lieu', 'souvenir', 'quantique', 'photo'];

  /* ---------- Utilitaires ---------- */
  function el(tag, attrs, text) {
    var n = document.createElement(tag), k;
    for (k in (attrs || {})) { if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]); }
    if (text != null) n.textContent = text;
    return n;
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function bare(role) { return role.replace(/^(la|le|l’|l')\s?/i, ''); }
  function shortRole(role) { var b = bare(role); return b.length > 14 ? b.slice(0, 13) + '…' : b; }
  function currentMode() { var r = document.querySelector('input[name="mode"]:checked'); return r ? r.value : 'famille'; }
  function currentLien() {
    var liens = MODES[currentMode()].liens, id = $('lien').value, i;
    for (i = 0; i < liens.length; i++) { if (liens[i].id === id) return liens[i]; }
    return liens[0];
  }
  function val(id) { var n = $(id); return n ? (n.value || '').trim() : ''; }

  /* ---------- Rendu des fiches ---------- */
  function collect() {
    var data = {};
    ['a', 'b'].forEach(function (side) {
      Array.prototype.forEach.call($('fields-' + side).querySelectorAll('input'), function (i) { data[i.id] = i.value; });
    });
    return data;
  }

  function renderSide(side, kind, role, saved) {
    var box = $('fields-' + side);
    box.textContent = '';
    $('lg-' + side).textContent = cap(role);
    KINDS[kind].forEach(function (f) {
      var wrap = el('div', f.short ? {} : { 'class': 'full' });
      var id = side + '_' + f.key;
      var lab = el('label', { 'for': id }, f.label);
      if (f.hint) { lab.appendChild(document.createTextNode(' ')); lab.appendChild(el('span', { 'class': 'hint' }, '— ' + f.hint)); }
      var inp = el('input', { type: 'text', id: id, placeholder: f.ph, autocomplete: 'off' });
      if (saved && saved[id] != null) inp.value = saved[id];
      wrap.appendChild(lab);
      wrap.appendChild(inp);
      box.appendChild(wrap);
    });
  }

  function renderLien(keepValues) {
    var saved = keepValues ? collect() : null;
    var lien = currentLien();
    renderSide('a', lien.kA, lien.a, saved);
    renderSide('b', lien.kB, lien.b, saved);
    $('v-a').textContent = shortRole(lien.a);
    $('v-b').textContent = shortRole(lien.b);
    var prec = $('prec'), old = prec.value;
    prec.textContent = '';
    [['', 'Pas précisé'], ['ce sont des jumeaux', 'Jumeaux'], [bare(lien.a) + ' est l’aîné·e', 'Aîné·e : ' + bare(lien.a)], [bare(lien.b) + ' est l’aîné·e', 'Aîné·e : ' + bare(lien.b)]].forEach(function (o) {
      prec.appendChild(el('option', { value: o[0] }, o[1]));
    });
    prec.value = old;
    if (prec.selectedIndex < 0) prec.selectedIndex = 0;
    $('row-prec').hidden = !lien.frat;
  }

  function renderMode(keepLien) {
    var mode = currentMode(), liens = MODES[mode].liens, sel = $('lien'), previous = sel.value;
    sel.textContent = '';
    liens.forEach(function (l) { sel.appendChild(el('option', { value: l.id }, l.phrase)); });
    if (keepLien && previous) sel.value = previous;
    if (sel.selectedIndex < 0) sel.selectedIndex = 0;
    $('row-lien').hidden = liens.length < 2;
    renderLien(false);
  }

  /* ---------- Construction des prompts ---------- */
  function perso(side, lien) {
    var kind = side === 'a' ? lien.kA : lien.kB;
    var role = side === 'a' ? lien.a : lien.b;
    var nom = val(side + '_nom');
    var parts = KINDS[kind].filter(function (f) { return f.key !== 'nom'; }).map(function (f) {
      var v = val(side + '_' + f.key);
      return v ? f.fmt.replace('{v}', v) : '';
    }).filter(Boolean);
    var detail = (parts.join(', ') || 'à décrire') + '.';
    return {
      nom: nom || role,
      ligne: (nom ? cap(nom) + ' (' + role + ')' : cap(role)) + ' — ' + detail
    };
  }

  function scenes(c) {
    var S = c.S, B = c.B, decor = c.lieu || 'un décor naturel', geste = c.geste, souv = c.souvenir, lien = c.lien, m = c.mode;
    var out = [];
    if (m === 'ia') {
      out.push(['Le portrait officiel', 'Les deux posent ensemble dans ' + decor + ', regard vers l’objectif, ' + (geste || 'proches l’un de l’autre') + '. Lumière douce de fin de journée.']);
      out.push(['Le feu vert', S.nom + ' lève la main ouverte pour donner son accord ; ' + B.nom + ' attend, immobile, avec une petite lumière verte allumée. Atmosphère calme et confiante, dans ' + decor + '.']);
      out.push(['Le repère temps', B.nom + ' consulte une grande horloge avant d’agir, pendant que ' + S.nom + ' sourit, dans ' + decor + '. Détails soignés, lumière chaleureuse.']);
      out.push(['Une idée à deux', 'Les deux créent ensemble ' + (souv || 'un projet') + ' sur un grand tableau lumineux dans ' + decor + ' : ' + B.nom + ' propose, ' + S.nom + ' valide d’un geste. Complicité visible, sans gadgets envahissants.']);
      out.push(['La pause', 'Les deux font une pause tranquille dans ' + decor + ' : ' + S.nom + ' s’étire, ' + B.nom + ' est en veille douce, lumière tamisée. Aucun écran agressif.']);
    } else if (m === 'animaux') {
      out.push(['Le portrait officiel', S.nom + ' et ' + B.nom + ' posent ensemble dans ' + decor + ', ' + (geste || 'tout proches l’un de l’autre') + '. Lumière douce de fin de journée.']);
      out.push(['Le premier jour ensemble', 'Le tout premier jour de leur duo : les deux, en version plus jeune (mêmes marques et mêmes couleurs), se découvrent dans ' + decor + '. Émotion douce.']);
      out.push(['La petite bêtise', B.nom + ' vient de faire une farce adorable, ' + S.nom + ' fait semblant de gronder en riant. Expressions exagérées, ambiance drôle.']);
      out.push(['Le réconfort', 'Moment calme et tendre : l’un réconforte l’autre, installés côte à côte dans ' + decor + '. Émotion sincère, sans tristesse appuyée.']);
      out.push(['L’activité préférée', 'Les deux partagent leur activité préférée : ' + (souv || 'une longue balade') + ', dans ' + decor + '. Ils sont heureux, chacun avec son style.']);
    } else {
      out.push(['Le portrait officiel', 'Les deux posent ensemble dans ' + decor + ', regard vers l’objectif, ' + (geste || 'proches l’un de l’autre') + '. Lumière douce de fin de journée.']);
      out.push(lien.frat
        ? ['Le souvenir d’enfance', 'Version enfants des deux mêmes personnages (mêmes couleurs de cheveux et d’yeux, mêmes détails signature adaptés à leur âge), ' + (souv ? 'en train de partager : ' + souv : 'en train de construire une cabane ensemble') + ', dans ' + decor + '.']
        : ['Le souvenir partagé', 'Un souvenir cher à ' + S.nom + ' et ' + B.nom + ' : ' + (souv || 'une journée simple et heureuse') + ', dans ' + decor + '. Lumière chaude, détails chaleureux.']);
      out.push(m === 'amis'
        ? ['Le fou rire', 'Fou rire incontrôlable : ' + S.nom + ' se tient les côtes, ' + B.nom + ' essuie une larme de rire. Ambiance légère, expressions exagérées.']
        : ['La dispute pour rire', 'Fausse dispute complice : ' + S.nom + ' croise les bras, faussement vexé·e, ' + B.nom + ' rit. Ambiance légère, expressions exagérées.']);
      out.push(['Le soutien', 'Moment calme et tendre : l’un réconforte l’autre, assis côte à côte dans ' + decor + '. Émotion sincère, sans tristesse appuyée.']);
      out.push(['La passion commune', souv
        ? 'Les deux partagent leur passion commune : ' + souv + '. Ils sont concentrés et heureux, chacun avec son style.'
        : 'Les deux cuisinent ensemble dans une cuisine chaleureuse, farine partout, éclats de rire.']);
    }
    if (c.quantique) {
      out.push(['Intrication : le silence partagé', 'La nuit, dans ' + decor + ', les deux sont assis dos à dos, yeux fermés, en méditation, dans un silence total. Un fin fil de lumière relie leurs deux cœurs. Atmosphère calme, sombre, bleutée, aucune source de bruit visible.']);
      out.push(['Décohérence : le mur qui tombe', 'Un mur de verre fissuré sépare ' + S.nom + ' et ' + B.nom + '. Du côté du mur, des gribouillis sombres figurent le bruit et les pensées parasites. Les deux tendent la main : le mur éclate en fragments lumineux et leurs mains se rejoignent.']);
      out.push(['Superposition : sous Orion', 'Les deux allongés dans l’herbe la nuit regardent la constellation d’Orion, nettement reconnaissable dans le ciel. Autour d’eux, leurs silhouettes apparaissent en légers échos translucides, comme présents à plusieurs endroits à la fois. Ciel froid et limpide.']);
    }
    return out;
  }

  function card(title, text, kind) {
    var d = el('div', { 'class': 'prompt k-' + kind });
    d.appendChild(el('h3', {}, title));
    d.appendChild(el('pre', {}, text));
    d.appendChild(el('button', { type: 'button', 'class': 'copy' }, 'Copier'));
    return d;
  }
  function fill(id, cards) { var p = $(id); p.textContent = ''; cards.forEach(function (c) { p.appendChild(c); }); }

  function build() {
    var mode = currentMode(), lien = currentLien();
    var S = perso('a', lien), B = perso('b', lien);
    var style = val('style'), prec = val('prec'), geste = val('geste'), lieu = val('lieu'), souvenir = val('souvenir');
    var photo = $('photo').checked, quant = $('quantique').checked;
    var relation = lien.phrase + (lien.frat && prec ? ', ' + prec : '') + (geste ? ' ; geste complice : ' + geste : '') + '.';
    var air = mode === 'famille' ? ' On voit qu’ils sont de la même famille (air de famille), sans être identiques.' : ' Ils restent clairement reconnaissables, ensemble comme séparément.';
    var refPhoto = photo ? '\nUtilise les photos de référence jointes pour les visages et l’apparence, sans les modifier ni les embellir.' : '';
    var titre = bare(lien.a).toUpperCase() + ' × ' + bare(lien.b).toUpperCase();

    var bloc = '[DUO-CODE ' + MODES[mode].label + ' — ' + titre + ' — à garder identique dans chaque image]\n' +
      S.ligne + '\n' + B.ligne + '\n' + relation + '\n' +
      'Style : ' + style + '.\n' +
      'Les deux personnages gardent exactement les mêmes traits, couleurs, tenues et détails signature d’une image à l’autre.' + air + refPhoto;

    var fiche = bloc + '\n\nCrée une planche de référence de ces deux personnages : chacun en pied, de face et de trois quarts, côte à côte sur fond uni clair, avec leurs tailles respectées l’un par rapport à l’autre. Ajoute en bas un portrait des deux ensemble, ' + (geste || 'souriants') + '. Pas de texte sur l’image.';

    var list = scenes({ S: S, B: B, lieu: lieu, geste: geste, souvenir: souvenir, lien: lien, mode: mode, quantique: quant });
    var emos = EMOS[mode];

    fill('p1', [card('Prompt de la planche de référence', fiche, 'lien')]);
    fill('p2', list.map(function (s, i) {
      return card(s[0], '[Recolle d’abord le bloc de cohérence]\n' + s[1] + '\nStyle : ' + style + '. Format paysage 3:2.', i % 2 ? 'b' : 'a');
    }));
    fill('p3', [card('Planche de 8 stickers', '[Recolle d’abord le bloc de cohérence]\nPlanche de 8 stickers des deux personnages ensemble, style ' + style + ', contour blanc épais autour de chaque sticker, fond transparent ou blanc uni, grille 4 × 2.\nExpressions : ' + emos.join(' ; ') + '.\nTexte seulement dans les stickers qui ont des guillemets, en français, lettres simples et lisibles.', 'lien')]
      .concat(emos.map(function (e) {
        return card('Sticker seul : ' + e, '[Recolle d’abord le bloc de cohérence]\nUn seul sticker des deux personnages : ' + e + '. Style ' + style + ', contour blanc épais, fond blanc uni, format carré.', 'a');
      })));
    fill('p4', [card('Bloc de cohérence', bloc, 'lien')]);
    persist();
    select('p1');
    $('out').scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function select(p) {
    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (t) { t.setAttribute('aria-selected', t.getAttribute('data-p') === p ? 'true' : 'false'); });
    Array.prototype.forEach.call(document.querySelectorAll('.panel'), function (x) { x.classList.toggle('on', x.id === p); });
  }

  /* ---------- Stockage local (uniquement si la case est cochée) ---------- */
  function snapshot() {
    var d = { mode: currentMode(), lien: $('lien').value, fields: collect(), shared: {} };
    SHARED.forEach(function (id) { var n = $(id); d.shared[id] = n.type === 'checkbox' ? n.checked : n.value; });
    return d;
  }
  function persist() {
    try {
      if ($('keep').checked) localStorage.setItem(KEY, JSON.stringify(snapshot()));
      else localStorage.removeItem(KEY);
    } catch (e) { /* stockage indisponible : on continue sans */ }
  }
  function restore() {
    var d;
    try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { d = null; }
    if (!d || !MODES[d.mode]) return;
    var radio = document.querySelector('input[name="mode"][value="' + d.mode + '"]');
    if (radio) radio.checked = true;
    renderMode(false);
    $('lien').value = d.lien;
    if ($('lien').selectedIndex < 0) $('lien').selectedIndex = 0;
    var saved = d.fields || {}, lien = currentLien();
    renderSide('a', lien.kA, lien.a, saved);
    renderSide('b', lien.kB, lien.b, saved);
    renderLienLabelsOnly(lien);
    SHARED.forEach(function (id) {
      var n = $(id), v = d.shared ? d.shared[id] : undefined;
      if (v === undefined) return;
      if (n.type === 'checkbox') n.checked = !!v; else n.value = v;
    });
    $('keep').checked = true;
  }
  function renderLienLabelsOnly(lien) {
    $('v-a').textContent = shortRole(lien.a);
    $('v-b').textContent = shortRole(lien.b);
    var prec = $('prec');
    prec.textContent = '';
    [['', 'Pas précisé'], ['ce sont des jumeaux', 'Jumeaux'], [bare(lien.a) + ' est l’aîné·e', 'Aîné·e : ' + bare(lien.a)], [bare(lien.b) + ' est l’aîné·e', 'Aîné·e : ' + bare(lien.b)]].forEach(function (o) {
      prec.appendChild(el('option', { value: o[0] }, o[1]));
    });
    $('row-prec').hidden = !lien.frat;
  }

  /* ---------- Événements ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('input[name="mode"]'), function (r) {
    r.addEventListener('change', function () { renderMode(false); persist(); });
  });
  $('lien').addEventListener('change', function () { renderLien(true); persist(); });
  document.addEventListener('change', function (e) { if (e.target && e.target.closest && e.target.closest('#f')) persist(); });
  document.addEventListener('input', function (e) { if ($('keep').checked && e.target && e.target.closest && e.target.closest('#f')) persist(); });
  Array.prototype.forEach.call(document.querySelectorAll('.tab'), function (t) {
    t.addEventListener('click', function () { select(t.getAttribute('data-p')); });
  });
  document.addEventListener('click', function (e) {
    if (!e.target.classList || !e.target.classList.contains('copy')) return;
    var btn = e.target, pre = btn.previousElementSibling, txt = pre.textContent;
    function done() {
      btn.textContent = 'Copié'; btn.classList.add('done');
      setTimeout(function () { btn.textContent = 'Copier'; btn.classList.remove('done'); }, 1600);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(done, function () {
        var r = document.createRange(); r.selectNodeContents(pre);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        try { document.execCommand('copy'); } catch (err) { /* copie manuelle */ }
        done();
      });
    } else {
      var r = document.createRange(); r.selectNodeContents(pre);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      try { document.execCommand('copy'); } catch (err) { /* copie manuelle */ }
      done();
    }
  });
  $('go').addEventListener('click', build);
  $('reset').addEventListener('click', function () {
    try { localStorage.removeItem(KEY); } catch (e) { /* rien à effacer */ }
    HTMLFormElement.prototype.reset.call($('f')); // $('f').reset serait masqué par le bouton d'id « reset »
    $('keep').checked = false;
    renderMode(false);
    ['p2', 'p3', 'p4'].forEach(function (p) { $(p).textContent = ''; });
    $('p1').textContent = '';
    $('p1').appendChild(el('div', { 'class': 'empty' }, 'Remplis les deux fiches puis appuie sur « Générer le kit ».'));
    select('p1');
  });

  renderMode(false);
  restore();
})();

/* L'Atelier d'Eros, Le Scribe — la page d'accueil (tout sauf Echo).
   Rôle de ce fichier : le menu par étapes, le réseau qui pousse sous le doigt (mycélium), le portail d'Unissant,
   la structure d'Unissant, l'équilibre technologie/humain (qubit), les racines, le manifeste,
   le formulaire « Rejoindre », le bouton « Haut » et la ligne binaire du pied de page.
   Echo (la conversation, ses trois états, le quiz) est dans app.js, partagé avec la Bibliothèque. */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var tous = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  // La personne a demandé « réduire les animations » : on garde tout, sans mouvement.
  var REDUIT = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // 0 devient « 001 », 6 devient « 111 » : le code sur trois bits des sept racines
  function binaire3(i) { return ('00' + (i + 1).toString(2)).slice(-3); }

  var RACINES = [
    ['Science quantique & binaire', "Penser la superposition, l'incertitude, et la logique du 0/1 qui sous-tend tout le numérique.", "Un regard qui accepte la complexité : un système n'a pas à être réduit à un seul état pour être compris."],
    ['Philosophie', "La philosophie au sens large : éthique, sens, place de l'humain dans le vivant.", "La boussole. Chaque outil et chaque décision passe par la question : à quoi, et à qui, cela sert-il ?"],
    ['Psychiatrie', "Une expérience du soin psychique, de la vulnérabilité et de l'écoute.", "L'attention aux fragilités. Les lieux et les outils sont pensés pour ne pas abîmer celles et ceux qui les utilisent."],
    ['Relations familiales', "Les liens, les systèmes familiaux, les places de chacun et leurs tensions.", "Une lecture systémique : chaque entité d'Unissant est un membre d'une famille, avec ses rôles et ses équilibres."],
    ['Deuil', "L'accompagnement de la perte, de la fin et des transitions.", "Le courage d'accompagner les passages. Unissant accueille aussi ce qui se termine, pas seulement ce qui commence."],
    ['Informatique', "Le code, les réseaux, les systèmes, et l'art de les rendre fiables.", "La capacité de construire réellement les outils, de manière sobre, ouverte et maîtrisée."],
    ['Artisanat', "Le travail de la main, de la matière et du temps long.", "Le rythme juste. Ce qui est fait à la main rappelle que la qualité demande du temps et du lien à la matière."]
  ];
  var MOTS = ['unir', 'relier', 'soigner', 'créer', 'pousser'];


  /* ------------------------------------------------------------------------
     1. LE MENU PAR ÉTAPES (du plus simple au plus complet)
     ------------------------------------------------------------------------ */
  var ETAPES = [
    { id: 'commencer', num: 1, label: 'Commencer', desc: 'Les premiers pas : où vous êtes, et par où commencer.', liens: [
      { href: '#accueil', label: 'Accueil', desc: "Le réseau Unissant en un coup d'œil" },
      { href: '#atelier', label: "L'Atelier", desc: "La première porte : le but et l'objectif du site" },
      { href: '#aide', label: 'Aide', desc: 'Questions fréquentes et par où commencer' }
    ] },
    { id: 'lire', num: 2, label: 'Lire', desc: "Entrer dans l'histoire, à votre rythme.", liens: [
      { href: '#histoire', label: "L'histoire", desc: "Le récit d'Eros, pas à pas" },
      { href: '#livre-vivant', label: 'Le Livre Vivant', desc: 'Les récits et les carnets' },
      { href: '#lire', label: 'Lire gratuitement', desc: 'Les pages 1 à 16 offertes, et le poème' },
      { href: '#auteur', label: "L'auteur", desc: 'Eros Bonaffini, de Namur' },
      { href: '#boutique', label: 'Boutique', desc: 'La suite, chapitre par chapitre (bientôt)' },
      { href: 'bibliotheque/', label: 'La Bibliothèque des Murmures', desc: 'La seconde page : chacun y dépose son livre' }
    ] },
    { id: 'exercer', num: 3, label: "S'exercer", desc: 'Pratiquer avec Echo, une étape à la fois.', liens: [
      { href: '#echo', label: 'Echo', desc: 'Le guide aux trois états' },
      { href: '#duo-code', label: 'Le Duo-Code', desc: "Travailler à deux avec l'IA" },
      { href: '#outils', label: 'Les outils', desc: 'Le prompteur Écho et le kit de duo' },
      { href: '#quiz', label: 'Le quiz', desc: 'Huit questions avec Echo |1⟩' }
    ] },
    { id: 'unissant', num: 4, label: 'Unissant', desc: 'Le projet fondateur, pour aller plus loin.', liens: [
      { href: '#structure', label: 'La structure', desc: 'ASBL, HUB, Entreprise, Indépendants' },
      { href: '#equilibre', label: "L'équilibre", desc: 'Technologie et humain en superposition' },
      { href: '#racines', label: 'Les racines', desc: "Sept terrains d'expérience" },
      { href: '#manifeste', label: 'Le manifeste', desc: 'Cinq engagements' },
      { href: '#rejoindre', label: 'Rejoindre', desc: 'Entrer dans le réseau' },
      { href: '#salles', label: 'Les deux salles', desc: 'La salle 1 et la Salle 2, chacune avec son lien' }
    ] }
  ];

  var menu = $('menu-etapes'), voile = $('menu-voile');
  var boutonsEtape = tous('[data-etape]');
  var etapeOuverte = null;

  function rendreMenu() {
    boutonsEtape.forEach(function (b) {
      b.setAttribute('aria-expanded', b.getAttribute('data-etape') === etapeOuverte ? 'true' : 'false');
    });
    menu.hidden = voile.hidden = (etapeOuverte === null);
    if (etapeOuverte === null) return;

    var e = ETAPES.filter(function (x) { return x.id === etapeOuverte; })[0];
    $('menu-niveau').textContent = 'Étape ' + e.num + ' sur 4' + (e.num === 1 ? ' · la plus simple' : e.num === 4 ? ' · la plus complète' : '');
    $('menu-titre').textContent = e.label;
    $('menu-desc').textContent = e.desc;
    // Les quatre petits pas : celui de l'étape ouverte est plus long
    Array.prototype.forEach.call($('menu-pas').children, function (pas, k) {
      pas.style.cssText = 'display:block;width:' + (k + 1 === e.num ? 18 : 8) + 'px;height:8px;border-radius:99px;background:' + (k + 1 <= e.num ? '#7D5A17' : '#D5DCD2');
    });

    var liste = $('menu-liens');
    liste.textContent = '';
    e.liens.forEach(function (l) {
      // Sans serveur Echo, le quiz est masqué (app.js) : son lien disparaît aussi du menu
      var cible = l.href.charAt(0) === '#' ? $(l.href.slice(1)) : null;
      if (cible && cible.hidden) return;
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.className = 'menu-link';
      a.href = l.href;
      a.style.cssText = 'display:grid;gap:4px;height:100%;padding:16px 18px;border-radius:14px;border:1px solid #D5DCD2;background:#F6F7F3;transition:border-color .2s,transform .2s';
      var titre = document.createElement('span');
      titre.style.cssText = 'font-weight:700;font-size:17px';
      titre.textContent = l.label;
      var desc = document.createElement('span');
      desc.style.cssText = 'font-size:15px;line-height:1.45;color:#45514D';
      desc.textContent = l.desc;
      a.appendChild(titre);
      a.appendChild(desc);
      a.addEventListener('click', function () { fermerMenu(false); });
      li.appendChild(a);
      liste.appendChild(li);
    });
  }

  // Ferme le menu ; « rendreFocus » remet le clavier sur le bouton de l'étape qui était ouverte
  function fermerMenu(rendreFocus) {
    var avant = etapeOuverte;
    etapeOuverte = null;
    rendreMenu();
    if (rendreFocus && avant) {
      var b = document.querySelector('[data-etape="' + avant + '"]');
      if (b) b.focus();
    }
  }

  boutonsEtape.forEach(function (b) {
    b.addEventListener('click', function () {
      var id = b.getAttribute('data-etape');
      etapeOuverte = (etapeOuverte === id) ? null : id;
      rendreMenu();
    });
  });
  $('menu-fermer').addEventListener('click', function () { fermerMenu(true); });
  voile.addEventListener('click', function () { fermerMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && etapeOuverte !== null) fermerMenu(true);
  });


  /* ------------------------------------------------------------------------
     2. LE RÉSEAU QUI POUSSE (mycélium de l'accueil)
     Le réseau de départ est toujours le même (nombres « au hasard » mais fixés).
     Un toucher fait pousser un nœud ; les 7 premiers révèlent les 7 racines.
     Le titre et le réseau se repoussent comme des aimants, puis chacun revient à sa place.
     Les positions sont en % de la zone : x de 0 à 100 (largeur), y de 0 à 100 (hauteur).
     ------------------------------------------------------------------------ */
  var zone = $('myc-zone'), titreUnissant = $('unissant-titre');
  var coucheFils = $('myc-fils'), coucheNoeuds = $('myc-noeuds');
  var graine = $('myc-graine'), indice = $('myc-indice'), eclatsZone = $('myc-eclats');
  var EASE = 'cubic-bezier(.34,1.56,.64,1)';
  var DEPLACEMENT = REDUIT ? '' : ';transition:left .9s ' + EASE + ',top .9s ' + EASE;

  var noeuds = [], fils = [], eclats = [];
  var Z = null;              // le « champ » du titre : les points qui tombent dedans sont repoussés au bord
  var maison = null;         // la place de la graine, près du titre
  var tenu = -1;             // le nœud qui vient d'éclore reste un instant là où l'on a touché
  var pousses = 0;           // combien de nœuds la personne a fait pousser
  var graineXY = { x: 74, y: 60 };
  var decalage = { x: 0, y: 0 };
  var minuteries = {};

  // Le hasard fixé : les mêmes nombres à chaque visite, donc le même réseau de départ
  var germe = 20261027;
  function hasardFixe() {
    germe = (germe + 0x6D2B79F5) | 0;
    var t = Math.imul(germe ^ (germe >>> 15), 1 | germe);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Repousse un point hors du champ du titre, vers le bord le plus proche
  function placer(x, y) {
    if (!Z) return [x, y];
    var px = x / 100 * Z.W, py = y / 100 * Z.H;
    var dl = px - Z.L, dr = Z.R - px, dt = py - Z.T, db = Z.B - py;
    if (dl <= 0 || dr <= 0 || dt <= 0 || db <= 0) return [x, y];
    var choix = [[dl, Z.L - 8 - dl * 0.18, py], [dr, Z.R + 8 + dr * 0.18, py], [dt, px, Z.T - 8 - dt * 0.18], [db, px, Z.B + 8 + db * 0.18]]
      .filter(function (o) { return o[1] >= 4 && o[1] <= Z.W - 4 && o[2] >= 4 && o[2] <= Z.H - 4; })
      .sort(function (a, b) { return a[0] - b[0]; });
    if (!choix.length) return [x, y];
    return [choix[0][1] / Z.W * 100, choix[0][2] / Z.H * 100];
  }

  function span(classe, css) {
    var s = document.createElement('span');
    if (classe) s.className = classe;
    if (css) s.style.cssText = css;
    return s;
  }

  function creerFil(f) {
    f.el = span('', 'position:absolute;height:' + (f.fresh ? 1.5 : 1) + 'px;transform-origin:0 0' +
      (REDUIT ? '' : ';transition:left .9s ' + EASE + ',top .9s ' + EASE + ',width .9s ' + EASE + ',transform .9s ' + EASE));
    f.el.appendChild(span(f.fresh ? 'myc-grow' : '', 'position:absolute;inset:0;transform-origin:0 50%;background:' + (f.fresh ? '#2F6F62' : '#B9C4B6')));
    poserFil(f);
    coucheFils.appendChild(f.el);
    fils.push(f);
  }

  function poserFil(f) {
    var a = placer(f.ax, f.ay);
    var b = f.bi === tenu ? [f.bx, f.by] : placer(f.bx, f.by);
    var dx = (b[0] - a[0]) * 2, dy = b[1] - a[1];   // la zone est deux fois plus large que haute
    var L = Math.hypot(dx, dy), angle = Math.atan2(dy, dx) * 180 / Math.PI;
    f.el.style.left = a[0].toFixed(2) + '%';
    f.el.style.top = a[1].toFixed(2) + '%';
    f.el.style.width = (L / 2).toFixed(2) + '%';
    f.el.style.transform = 'rotate(' + angle.toFixed(1) + 'deg)';
  }

  function creerNoeud(n, i) {
    var lueur = !n.fresh && i % 6 === 0;
    var couleur = n.fresh ? '#2F6F62' : '#5B6A5F';
    n.el = span(n.fresh ? 'myc-new' : lueur ? 'myc-glow' : '',
      'position:absolute;width:' + (n.r * 2).toFixed(1) + 'px;height:' + (n.r * 2).toFixed(1) + 'px;margin:-' + n.r.toFixed(1) + 'px 0 0 -' + n.r.toFixed(1) + 'px;border-radius:50%;background:' + couleur +
      ';opacity:' + (n.fresh ? 1 : 0.6) + (n.fresh ? '' : ';animation-delay:' + n.d + 'ms') + DEPLACEMENT);
    if (n.fresh) n.el.appendChild(span('myc-ripple', 'position:absolute;inset:-2px;border-radius:50%;border:2px solid #B98930'));
    if (n.r > 2.6) {
      // Les plus gros nœuds clignotent entre 0 et 1
      var bit = "position:absolute;left:50%;bottom:calc(100% + 3px);transform:translateX(-50%);font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;line-height:1;color:" + couleur + ';animation-delay:' + n.d + 'ms';
      var b0 = span('bit0', bit), b1 = span('bit1', bit);
      b0.textContent = '0';
      b1.textContent = '1';
      n.el.appendChild(b0);
      n.el.appendChild(b1);
    }
    poserNoeud(n, i);
    coucheNoeuds.appendChild(n.el);
  }

  function poserNoeud(n, i) {
    var p = i === tenu ? [n.x, n.y] : placer(n.x, n.y);
    n.el.style.left = p[0].toFixed(2) + '%';
    n.el.style.top = p[1].toFixed(2) + '%';
  }

  // Ajoute un nœud et ses filaments vers ses trois plus proches voisins.
  // Un nouveau nœud pousse DEPUIS le réseau : ses filaments partent de ses voisins vers lui.
  function ajouterNoeud(x, y, hasard, fresh) {
    var proches = noeuds.map(function (m) { return [m, Math.hypot((m.x - x) * 2, m.y - y)]; })
      .sort(function (a, b) { return a[1] - b[1]; }).slice(0, 3);
    proches.forEach(function (p, k) {
      var m = p[0], d = p[1];
      if (fresh) { if (d < 40 || k < 2) creerFil({ ax: m.x, ay: m.y, bx: x, by: y, fresh: true, bi: noeuds.length }); }
      else if (d < 40) creerFil({ ax: x, ay: y, bx: m.x, by: m.y, fresh: false });
    });
    var n = { x: x, y: y, r: fresh ? 4 : 1.5 + hasard() * 2.5, fresh: fresh, d: Math.round(hasard() * 4800) };
    noeuds.push(n);
    creerNoeud(n, noeuds.length - 1);
  }

  function texteEclat(n) {
    if (n <= 7) return 'Racine ' + binaire3(n - 1) + ' · ' + RACINES[n - 1][0];
    if (n === 8) return 'Sept racines plantées. Le réseau est à vous.';
    return ('0000000' + (n + 84).toString(2)).slice(-8) + ' · ' + MOTS[n % 5];
  }

  function poserEclat(e) {
    var p = placer(e.x, e.y);
    e.el.style.left = Math.max(16, Math.min(84, p[0])).toFixed(2) + '%';
    e.el.style.top = Math.max(14, p[1]).toFixed(2) + '%';
  }

  // Replace tout (après une mesure, un redimensionnement ou une pousse)
  function poserTout() {
    fils.forEach(poserFil);
    noeuds.forEach(poserNoeud);
    eclats.forEach(poserEclat);
    var s = tenu >= 0 ? [graineXY.x, graineXY.y] : placer(graineXY.x, graineXY.y);
    var aDroite = s[0] <= 76;
    graine.style.left = indice.style.left = s[0].toFixed(2) + '%';
    graine.style.top = indice.style.top = s[1].toFixed(2) + '%';
    indice.style.transform = 'translate(' + (aDroite ? '22px' : 'calc(-100% - 22px)') + ',-50%)';
    indice.textContent = aDroite ? '← Touchez : un nœud va pousser' : 'Touchez : un nœud va pousser →';
    indice.hidden = pousses > 0;
  }

  function pousserA(x, y) {
    var cx = Math.max(2, Math.min(98, x)), cy = Math.max(3, Math.min(97, y));
    ajouterNoeud(cx, cy, Math.random, true);
    pousses += 1;
    graineXY = { x: cx, y: cy };
    tenu = noeuds.length - 1;

    // L'éclat de texte qui monte au-dessus du nouveau nœud
    var p = placer(cx, cy);
    var deplace = Math.abs(p[0] - cx) + Math.abs(p[1] - cy) > 0.01;
    var e = { x: cx, y: cy, el: span('myc-burst', (deplace && !REDUIT ? 'animation-delay:1.05s;' : '') +
      "position:absolute;margin-top:-12px;transform:translate(-50%,-140%);padding:5px 12px;border-radius:99px;background:rgba(246,247,243,.94);border:1px solid #E7C987;color:#7D5A17;font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:600;white-space:nowrap;pointer-events:none") };
    e.el.textContent = texteEclat(pousses);
    if (REDUIT) { eclats.forEach(function (x) { x.el.remove(); }); eclats = []; }
    eclats.push(e);
    poserEclat(e);
    eclatsZone.appendChild(e.el);
    if (!REDUIT) {
      setTimeout(function () { e.el.remove(); eclats = eclats.filter(function (x) { return x !== e; }); }, 5000);
    }

    $('myc-compte').textContent = noeuds.length;
    poserTout();

    // Le nœud éclot là où l'on touche, puis le champ du titre le repousse à sa juste place
    clearTimeout(minuteries.tenu);
    minuteries.tenu = setTimeout(function () { tenu = -1; poserTout(); }, REDUIT ? 0 : 950);
    // La graine est ensuite attirée vers sa place, près du titre
    clearTimeout(minuteries.maison);
    minuteries.maison = setTimeout(function () { if (maison) { graineXY = maison; poserTout(); } }, 2800);
  }

  // Fait pousser un nœud près de la graine (clavier, ou formulaire « Rejoindre »)
  function pousserPres() {
    pousserA(graineXY.x + (Math.random() - 0.5) * 14, graineXY.y + (Math.random() - 0.5) * 26);
  }

  // Mesure le champ du titre (au chargement, quand les polices arrivent, au redimensionnement)
  function mesurer() {
    var b = zone.getBoundingClientRect(), r = titreUnissant.getBoundingClientRect();
    if (!b.width || !b.height) return;
    if (b.width < 760) {
      // Sur téléphone, le titre passe sous le réseau : pas de champ à éviter
      Z = null;
      maison = null;
    } else {
      var marge = 22;
      Z = { L: r.left - b.left - decalage.x - marge, T: r.top - b.top - decalage.y - marge, R: r.right - b.left - decalage.x + marge, B: r.bottom - b.top - decalage.y + marge, W: b.width, H: b.height };
      maison = { x: Math.max(40, Math.min(92, (Z.R + 0.06 * b.width) / b.width * 100)), y: Math.max(12, Math.min(88, (Z.T + Z.B) / 2 / b.height * 100)) };
      if (pousses === 0) graineXY = maison;
    }
    poserTout();
  }

  // L'aimant : de combien le titre est poussé loin du point (x, y) de l'écran
  function repousser(x, y, maxi, rayon) {
    var r = titreUnissant.getBoundingClientRect();
    var cx = r.left + r.width / 2 - decalage.x, cy = r.top + r.height / 2 - decalage.y;
    var dx = cx - x, dy = cy - y, dist = Math.hypot(dx, dy) || 1;
    if (dist > rayon) return { x: 0, y: 0 };
    var force = maxi * (1 - dist / rayon) + 4;
    return { x: Math.round(dx / dist * force), y: Math.round(dy / dist * force * 0.6) };
  }

  function decaler(s) {
    decalage = s;
    titreUnissant.style.transform = 'translate(' + s.x + 'px,' + s.y + 'px)';
  }

  if (zone) {
    for (var i = 0; i < 48; i++) {
      // L'ordre des tirages compte : x, puis y, puis la taille et le délai dans ajouterNoeud
      var x = 30 + 68 * Math.pow(hasardFixe(), 0.8);
      var y = 4 + 92 * hasardFixe();
      ajouterNoeud(x, y, hasardFixe, false);
    }
    // La graine part du nœud le plus proche du point (74 %, 60 %)
    graineXY = noeuds.reduce(function (b, n) {
      return Math.hypot((n.x - 74) * 2, n.y - 60) < Math.hypot((b.x - 74) * 2, b.y - 60) ? n : b;
    }, noeuds[0]);
    graineXY = { x: graineXY.x, y: graineXY.y };
    zone.hidden = false;
    $('myc-legende').hidden = false;
    poserTout();

    var rafAimant = 0, pulsationJusqua = 0;
    zone.addEventListener('click', function (e) {
      var r = zone.getBoundingClientRect();
      // detail === 0 : le bouton a été activé au clavier (Entrée ou Espace), pas touché
      if (!r.width || e.detail === 0) { pousserPres(); return; }
      if (!REDUIT) {
        // Impulsion : le titre est repoussé par le geste, puis revient à sa place
        pulsationJusqua = Date.now() + 700;
        decaler(repousser(e.clientX, e.clientY, 30, 620));
        clearTimeout(minuteries.pulsation);
        minuteries.pulsation = setTimeout(function () { decaler({ x: 0, y: 0 }); }, 340);
      }
      pousserA((e.clientX - r.left) / r.width * 100, (e.clientY - r.top) / r.height * 100);
    });
    zone.addEventListener('pointermove', function (e) {
      if (REDUIT || e.pointerType !== 'mouse' || Date.now() < pulsationJusqua) return;
      var x = e.clientX, y = e.clientY;
      cancelAnimationFrame(rafAimant);
      rafAimant = requestAnimationFrame(function () {
        var s = repousser(x, y, 14, 460);
        if (s.x !== decalage.x || s.y !== decalage.y) decaler(s);
      });
    });
    zone.addEventListener('pointerleave', function () {
      cancelAnimationFrame(rafAimant);
      if (decalage.x || decalage.y) decaler({ x: 0, y: 0 });
    });

    setTimeout(mesurer, 120);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(mesurer);
    window.addEventListener('resize', function () {
      clearTimeout(minuteries.resize);
      minuteries.resize = setTimeout(mesurer, 160);
    });
  }


  /* ------------------------------------------------------------------------
     3. LE PORTAIL D'UNISSANT : quatre cercles, quatre couches du but, un regard au centre
     ------------------------------------------------------------------------ */
  var VR = [
    { k: 'Couche 1 · Relier', t: 'Relier les connaissances', d: "Science quantique, philosophie, soin, informatique, artisanat, vécu : chaque savoir apporte un fil, et les fils se tiennent." },
    { k: 'Couche 2 · Rassembler', t: 'Rassembler les différences', d: "Chacun arrive avec son parcours. Ce qui distingue les personnes devient ce qui relie le réseau." },
    { k: 'Couche 3 · Un monde commun', t: 'Un monde commun', d: "Un lieu partagé, physique et humain, où l'on travaille, écoute et crée côte à côte." },
    { k: 'Le centre · La nature', t: 'La nature pousse avec nous', d: "La technologie grandit avec le vivant, à son rythme. Elle ne se place pas au-dessus de lui : elle pousse avec nous." }
  ];
  var VR_INTRO = { k: "Le portail d'Unissant", t: 'Quatre cercles, une descente', d: "Touchez les cercles, de l'extérieur vers le centre, pour descendre jusqu'à ce qui nous relie : la nature." };
  var vrOuvert = null, vrVus = [false, false, false, false], clignements = 0;
  var anneaux = [$('vr-ring-0'), $('vr-ring-1'), $('vr-ring-2')], coeur = $('vr-core');

  function rendrePortail() {
    var eveil = vrVus.every(Boolean);
    var suivant = vrVus.indexOf(false);
    anneaux.forEach(function (a, i) {
      var on = vrOuvert === i, vu = vrVus[i];
      a.setAttribute('aria-pressed', on ? 'true' : 'false');
      a.className = 'vr-ring' + (eveil ? ' vr-turn' + (i === 1 ? ' vr-turn-r' : '') : i === suivant ? ' vr-next' : '');
      a.style.cssText = 'position:absolute;inset:' + [0, 12, 24][i] + '%;margin:0;padding:0;border-radius:50%;cursor:pointer;font:inherit;background:' + (vu ? 'rgba(185,137,48,.05)' : 'transparent') +
        ';border:' + (on ? 3 : vu ? 2 : 1) + 'px ' + (eveil ? 'dashed' : 'solid') + ' ' + (on ? '#B98930' : vu ? '#7D5A17' : '#9D7932') + ';transition:border-color .3s,background .3s' +
        (eveil ? ';animation-duration:' + [70, 46, 30][i] + 's' : '');
    });
    coeur.setAttribute('aria-pressed', vrOuvert === 3 ? 'true' : 'false');
    coeur.className = 'vr-ring' + (eveil ? ' vr-core-awake' : suivant === 3 ? ' vr-next' : '');
    coeur.style.border = vrOuvert === 3 ? '3px solid #E7C987' : '0';
    $('vr-paupiere').className = clignements % 2 ? 'vr-blinkA' : 'vr-blinkB';   // changer de classe relance le clignement

    $('vr-svg').setAttribute('class', eveil ? 'vr-awake' : '');
    [0, 1, 2].forEach(function (i) {
      $('vr-t' + i).setAttribute('opacity', vrVus[i] ? 1 : 0.4);
      $('vr-b' + i).setAttribute('opacity', vrVus[i] ? 1 : 0);
    });

    var c = vrOuvert === null ? VR_INTRO : VR[vrOuvert];
    $('vr-k').textContent = c.k;
    $('vr-t').textContent = c.t;
    $('vr-d').textContent = c.d;
    $('vr-src').textContent = c.src || '';
    $('vr-src').hidden = !c.src;
    $('vr-eveil').hidden = !eveil;
    Array.prototype.forEach.call($('vr-points').children, function (p, i) {
      p.style.cssText = 'display:block;width:' + (vrOuvert === i ? 18 : 8) + 'px;height:8px;border-radius:99px;background:' + (vrVus[i] ? '#7D5A17' : '#D5DCD2') + ';transition:width .3s,background .3s';
    });
  }

  if (coeur) {
    anneaux.concat(coeur).forEach(function (b, i) {
      b.addEventListener('click', function () {
        vrVus[i] = true;
        vrOuvert = i;
        clignements += 1;
        rendrePortail();
      });
    });
    $('vr-reset').addEventListener('click', function () {
      vrOuvert = null;
      vrVus = [false, false, false, false];
      rendrePortail();
    });

    // Le regard : l'œil du centre suit la souris dans la section
    var oeil = $('vr-oeil'), pupille = $('vr-pupille'), rafRegard = 0, dernierRegard = 0;
    var glisse = REDUIT ? '' : ';transition:left .35s ease-out,top .35s ease-out';
    var regarder = function (gx, gy) {
      oeil.style.cssText = 'position:absolute;left:' + (50 + gx * 20).toFixed(1) + '%;top:' + (50 + gy * 20).toFixed(1) + '%;width:46%;height:46%;transform:translate(-50%,-50%);pointer-events:none' + glisse;
      pupille.style.left = (50 + gx * 14).toFixed(1) + '%';
      pupille.style.top = (50 + gy * 14).toFixed(1) + '%';
    };
    pupille.style.transition = REDUIT ? '' : 'left .35s ease-out,top .35s ease-out';
    var atelier = $('atelier');
    atelier.addEventListener('pointermove', function (e) {
      if (REDUIT) return;
      var maintenant = Date.now();
      if (maintenant - dernierRegard < 33) return;
      dernierRegard = maintenant;
      var x = e.clientX, y = e.clientY;
      cancelAnimationFrame(rafRegard);
      rafRegard = requestAnimationFrame(function () {
        var r = $('vr-portail').getBoundingClientRect();
        var dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2), d = Math.hypot(dx, dy) || 1;
        var k = Math.min(1, d / 320);
        regarder(dx / d * k, dy / d * k);
      });
    });
    atelier.addEventListener('pointerleave', function () {
      cancelAnimationFrame(rafRegard);
      regarder(0, 0);
    });
    rendrePortail();
  }


  /* ------------------------------------------------------------------------
     4. LA STRUCTURE : quatre formes, un seul organisme
     ------------------------------------------------------------------------ */
  var PILIERS = {
    asbl: { k: 'Le cœur non marchand', t: 'ASBL', d: "Elle porte la mission : accompagner les personnes dans les passages difficiles de la vie, sans condition de moyens.", l: ['Cercles de parole autour du deuil et des liens familiaux', 'Ateliers de remise en lien par le geste artisanal', 'Médiation numérique pour les publics éloignés'] },
    hub: { k: 'Le lieu de rencontre', t: 'HUB', d: "Un espace physique en nature où chercheurs, artisans, soignants et développeurs travaillent côte à côte.", l: ['Atelier bois et réparation, salle calme, serre', 'Résidences croisées tech × soin × artisanat', "Conférences sur l'éthique et la philosophie des technologies"] },
    ent: { k: 'Le moteur durable', t: 'Entreprise', d: "Elle développe des outils numériques éthiques et réinvestit une part de ses revenus dans l'ASBL.", l: ['Logiciels sobres, ouverts, centrés sur la personne', 'Conseil en conception éthique', 'Objets mêlant artisanat et électronique'] },
    ind: { k: 'Le réseau vivant', t: 'Indépendants', d: "Partenaires ou collaborateurs, ils gardent leur liberté et se branchent sur le réseau selon les projets.", l: ['Thérapeutes, artisans, développeurs, formateurs', 'Mutualisation des lieux, outils et clients', 'Gouvernance partagée et transparente'] }
  };

  function choisirPilier(choisi) {
    Object.keys(PILIERS).forEach(function (k) {
      var on = k === choisi;
      $('pl-ligne-' + k).setAttribute('stroke', on ? '#2F6F62' : '#C6CFC3');
      $('pl-ligne-' + k).setAttribute('stroke-width', on ? 3 : 1.5);
      $('pl-cercle-' + k).setAttribute('fill', on ? '#2F6F62' : '#FFFFFF');
      $('pl-cercle-' + k).setAttribute('stroke', on ? '#2F6F62' : '#C6CFC3');
      $('pl-texte-' + k).setAttribute('fill', on ? '#FFFFFF' : '#1E2A3A');
    });
    tous('[data-pilier]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-pilier') === choisi ? 'true' : 'false');
    });
    var p = PILIERS[choisi];
    $('pl-k').textContent = p.k;
    $('pl-t').textContent = p.t;
    $('pl-d').textContent = p.d;
    var liste = $('pl-l');
    liste.textContent = '';
    p.l.forEach(function (texte) {
      var li = document.createElement('li');
      li.textContent = texte;
      liste.appendChild(li);
    });
  }
  tous('[data-pilier]').forEach(function (b) {
    b.addEventListener('click', function () { choisirPilier(b.getAttribute('data-pilier')); });
  });


  /* ------------------------------------------------------------------------
     5. L'ÉQUILIBRE : un qubit entre technologie et humain
     |ψ⟩ = cos(θ/2)|tech⟩ + sin(θ/2)|humain⟩ ; les probabilités sont les carrés.
     ------------------------------------------------------------------------ */
  var LECTURES = [
    [15, "Efficace, rapide, et froid. Personne ne s'y sent accueilli."],
    [60, "La machine guide, l'humain suit. Utile, mais l'écoute s'amincit."],
    [120, "Les deux pôles se tiennent. C'est ici qu'Unissant veut vivre."],
    [165, "Chaleureux, mais fragile. Sans outils, le soin s'épuise."],
    [181, "Pure présence humaine. Belle, et difficile à transmettre."]
  ];
  var curseurTheta = $('theta');

  function amplitudes() {
    var rad = Number(curseurTheta.value) * Math.PI / 180;
    return { a: Math.cos(rad / 2), b: Math.sin(rad / 2), rad: rad };
  }

  function rendreQubit() {
    var d = Number(curseurTheta.value), q = amplitudes();
    var vx = (160 + 120 * Math.sin(q.rad)).toFixed(1), vy = (160 - 120 * Math.cos(q.rad)).toFixed(1);
    $('q-vecteur').setAttribute('x2', vx);
    $('q-vecteur').setAttribute('y2', vy);
    $('q-point').setAttribute('cx', vx);
    $('q-point').setAttribute('cy', vy);
    $('theta-val').textContent = d;
    $('q-a').textContent = q.a.toFixed(2);
    $('q-b').textContent = q.b.toFixed(2);
    $('q-pt').textContent = Math.round(q.a * q.a * 100);
    $('q-ph').textContent = Math.round(q.b * q.b * 100);
    $('q-barre-t').style.width = (q.a * q.a * 100).toFixed(1) + '%';
    $('q-barre-h').style.width = (q.b * q.b * 100).toFixed(1) + '%';
    $('q-lecture').textContent = LECTURES.filter(function (l) { return d < l[0]; })[0][1];
    curseurTheta.setAttribute('aria-valuetext', d + ' degrés : ' + Math.round(q.a * q.a * 100) + ' % technologie, ' + Math.round(q.b * q.b * 100) + ' % humain');
  }

  if (curseurTheta) {
    curseurTheta.addEventListener('input', function () {
      $('q-mesure').textContent = '';
      rendreQubit();
    });
    $('q-mesurer').addEventListener('click', function () {
      var q = amplitudes();
      var resultat = Math.random() < q.a * q.a ? 'technologie' : 'humain';
      $('q-mesure').textContent = 'Mesure → |' + resultat + "⟩. L'observation a choisi ; le réglage, lui, reste le vôtre.";
    });
    rendreQubit();
  }


  /* ------------------------------------------------------------------------
     6. LES RACINES : sept terrains d'expérience, codés sur trois bits
     ------------------------------------------------------------------------ */
  tous('[data-racine]').forEach(function (b) {
    b.addEventListener('click', function () {
      var i = Number(b.getAttribute('data-racine'));
      tous('[data-racine]').forEach(function (x) {
        x.setAttribute('aria-pressed', x === b ? 'true' : 'false');
      });
      $('rc-bin').textContent = binaire3(i);
      $('rc-nom').textContent = RACINES[i][0];
      $('rc-d').textContent = RACINES[i][1];
      $('rc-a').textContent = RACINES[i][2];
    });
  });


  /* ------------------------------------------------------------------------
     7. LE MANIFESTE : chaque ligne passe du binaire au langage
     Le texte lu par les lecteurs d'écran reste toujours le vrai texte (span.sr).
     ------------------------------------------------------------------------ */
  function enBinaire(s) {
    return Array.prototype.map.call(s, function (c) { return c === ' ' ? ' ' : (c.charCodeAt(0) & 1 ? '1' : '0'); }).join('');
  }
  tous('.manif').forEach(function (li) {
    var visible = li.firstElementChild, texte = visible.textContent, enCours = false;
    function animer() {
      if (REDUIT || enCours) return;
      enCours = true;
      var bin = enBinaire(texte), k = 0;
      li.classList.add('vivant');
      visible.textContent = bin;
      var t = setInterval(function () {
        k += Math.ceil(texte.length / 18);
        if (k >= texte.length) {
          clearInterval(t);
          visible.textContent = texte;
          li.classList.remove('vivant');
          enCours = false;
        } else {
          visible.textContent = texte.slice(0, k) + bin.slice(k);
        }
      }, 35);
    }
    li.addEventListener('mouseenter', animer);
    li.addEventListener('focus', animer);
    li.addEventListener('click', animer);
  });


  /* ------------------------------------------------------------------------
     8. REJOINDRE : une maquette, rien n'est envoyé
     ------------------------------------------------------------------------ */
  var formRejoindre = $('rejoindre-form');
  if (formRejoindre) {
    formRejoindre.addEventListener('submit', function (e) {
      e.preventDefault();
      var role = formRejoindre.querySelector('input[name="role"]:checked');
      var prenom = $('nm').value.trim() || 'Vous';
      var merci = $('rejoindre-merci');
      merci.textContent = prenom + ', votre intention est plantée côté ' + (role ? role.value : 'ASBL') +
        ". Un nouveau nœud a poussé dans le réseau, tout en haut de la page. Dans la vraie version, l'équipe vous recontacterait ; ici, rien n'a été envoyé.";
      merci.hidden = false;
      if (zone) pousserPres();
    });
  }


  /* ------------------------------------------------------------------------
     9. LE PIED DE PAGE (une ligne binaire qui change de mot) ET LE BOUTON « HAUT »
     ------------------------------------------------------------------------ */
  var ticker = $('ticker'), mot = 0;
  if (ticker && !REDUIT) {
    setInterval(function () {
      mot = (mot + 1) % 5;
      ticker.textContent = ('0000000' + (mot + 85).toString(2)).slice(-8) + ' · ' + MOTS[mot];
    }, 2600);
  }

  var haut = $('haut-bouton');
  if (haut) {
    var verifierHaut = function () { haut.hidden = (window.scrollY || document.documentElement.scrollTop || 0) <= 500; };
    window.addEventListener('scroll', verifierHaut, { passive: true });
    verifierHaut();
  }


  /* ------------------------------------------------------------------------
     10. LES DEUX SALLES : un bouton réunit les deux cartes ; chacune garde son propre lien
     ------------------------------------------------------------------------ */
  var sallesBouton = $('salles-bouton'), sallesPanneau = $('salles-panneau');
  if (sallesBouton && sallesPanneau) {
    sallesBouton.addEventListener('click', function () {
      var ouvrir = sallesPanneau.hidden;
      sallesPanneau.hidden = !ouvrir;
      sallesBouton.setAttribute('aria-expanded', ouvrir ? 'true' : 'false');
      sallesBouton.textContent = ouvrir ? 'Replier les deux salles' : 'Fusionner les deux salles';
    });
  }
})();

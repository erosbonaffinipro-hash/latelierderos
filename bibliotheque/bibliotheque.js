/* ==========================================================================
   LA BIBLIOTHÈQUE DES MURMURES — le JavaScript de la page
   Rôle de ce fichier : lire books.json et afficher les livres sous forme de cartes animées,
   avec les filtres, la recherche et la fiche de chaque livre ; gérer le bouton de don, le panneau
   des flux (flux.json) et le formulaire de dépôt.

   Pour AJOUTER ou MODIFIER un livre, vous n'avez PAS besoin de toucher à ce fichier :
   il suffit de modifier books.json.
   ========================================================================== */

(function () {
  'use strict';   // demande à JavaScript d'être strict : il signale plus d'erreurs de frappe

  /* ------------------------------------------------------------------------
     1. LES RÉGLAGES (les seules choses que vous aurez peut-être envie de changer)
     ------------------------------------------------------------------------ */

  // Le nom du fichier qui contient les livres (il est dans le même dossier que cette page)
  var FICHIER_LIVRES = 'books.json';

  // ===== A REMPLACER : l'adresse de votre lien de paiement Stripe (« Payment Link ») pour les dons. =====
  // Tant qu'elle contient « LIEN-ICI », le bouton « Faire un don » reste grisé et une note l'indique.
  // Quand vous collez votre vrai lien (il commence par https://buy.stripe.com/), le bouton s'active tout seul.
  var LIEN_DON = 'https://buy.stripe.com/5kQ9AVekf1SwakJbu67kc02';

  // L'adresse e-mail qui reçoit les demandes (le bouton « Demander ma part »).
  var EMAIL_CONTACT = 'erosbonaffini.pro@gmail.com';

  // Le nom du fichier qui contient le panneau des flux (dons reçus, parts versées…)
  var FICHIER_FLUX = 'flux.json';

  // Combien de lignes montrer au maximum dans « Derniers dons » et « Dernières parts versées »
  var LIGNES_MAXI = 5;

  // Les domaines proposés comme filtres, dans l'ordre d'affichage
  var DOMAINES = ['Écriture', 'Formule', 'Code', 'Nature', 'Artisanat', 'Philosophie'];

  // Le calculateur de « Comment est utilisé l'argent » :
  var TVA_TAUX = 0.06;          // TVA de 6 %, le taux de l'exemple de la page
  var PART_AUTEUR = 0.60;       // 60 % du prix hors TVA pour l'auteur·rice (le reste, 40 %, pour la bibliothèque)
  var FRAIS_POURCENT = 0.015;   // frais Stripe estimés pour une carte européenne : 1,5 % du prix…
  var FRAIS_FIXES = 0.25;       // … plus 0,25 € par paiement


  /* ------------------------------------------------------------------------
     2. LES ÉLÉMENTS DE LA PAGE
     On les repère une fois pour toutes grâce à leur identifiant (id) dans index.html.
     ------------------------------------------------------------------------ */
  var zoneFiltres  = document.getElementById('filtres');
  var zoneCartes   = document.getElementById('cartes');
  var champRecherche = document.getElementById('recherche');
  var messageVide  = document.getElementById('vide');
  var messageErreur = document.getElementById('erreur');


  /* ------------------------------------------------------------------------
     3. CE QUE LA PAGE « RETIENT »
     ------------------------------------------------------------------------ */
  var livres = [];                 // la liste des livres, une fois lue dans books.json
  var domaineChoisi = 'Tout';      // le filtre actif
  var texteRecherche = '';         // ce que la personne a tapé dans la recherche


  /* ------------------------------------------------------------------------
     4. DE PETITES FONCTIONS UTILES
     ------------------------------------------------------------------------ */

  // Crée un élément HTML (par exemple une balise <p>) avec une classe et un texte.
  // On utilise « textContent » et jamais « innerHTML » : ainsi, un texte écrit dans books.json
  // sera toujours affiché comme du simple texte et ne pourra jamais exécuter de code.
  function creer(balise, classe, texte) {
    var element = document.createElement(balise);
    if (classe) { element.className = classe; }
    if (texte !== undefined) { element.textContent = texte; }
    return element;
  }

  // Met en minuscules et retire les accents : « Écriture » devient « ecriture ».
  // Sert à comparer sans se soucier des majuscules ni des accents.
  function simplifier(texte) {
    return String(texte).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  // Donne le nom de la classe CSS de couleur pour un domaine : « Écriture » -> « couv-ecriture »
  function classeCouverture(domaine) {
    return 'couv-' + simplifier(domaine);
  }

  // Un lien n'est accepté que s'il commence par https:// (sécurité : on refuse tout autre type de lien)
  function lienValide(lien) {
    return typeof lien === 'string' && lien.indexOf('https://') === 0;
  }

  // Le lien d'un LIVRE peut être : une adresse https:// (par exemple un lien de paiement Stripe)
  // OU un fichier de ce site (par exemple ../mon-livre.pdf). Tout le reste est refusé.
  function lienLivreValide(lien) {
    return lienValide(lien) || cheminDuSite(lien, /\.(pdf|epub|html)$/i);
  }

  // Une couverture doit être un fichier image de ce site (jamais une adresse venant d'ailleurs)
  function imageValide(chemin) {
    return cheminDuSite(chemin, /\.(jpg|jpeg|png|webp)$/i);
  }

  // Vrai seulement pour un chemin de fichier DE CE SITE, par exemple « ../guide.pdf » :
  //  - il ne doit contenir que des lettres, chiffres, tirets, points et barres ;
  //  - il ne doit pas commencer par « / » ni contenir « // » (sinon c'est une adresse vers un autre site) ;
  //  - il doit finir par une des extensions autorisées.
  function cheminDuSite(chemin, extensions) {
    return typeof chemin === 'string' &&
           /^[\w\-.\/]+$/.test(chemin) &&
           chemin.charAt(0) !== '/' &&
           chemin.indexOf('//') === -1 &&
           extensions.test(chemin);
  }


  /* ------------------------------------------------------------------------
     5. LES BOUTONS DE FILTRE (Tout, Écriture, Formule…)
     ------------------------------------------------------------------------ */
  function afficherFiltres() {
    zoneFiltres.textContent = '';                    // on vide la zone avant de la remplir

    ['Tout'].concat(DOMAINES).forEach(function (domaine) {
      var item = creer('li');
      var bouton = creer('button', '', domaine);
      bouton.type = 'button';

      // aria-pressed dit aux lecteurs d'écran quel filtre est actif (et le CSS le colore en vert)
      bouton.setAttribute('aria-pressed', domaine === domaineChoisi ? 'true' : 'false');

      // Quand on clique : on retient le domaine, puis on réaffiche les boutons et les cartes
      bouton.addEventListener('click', function () {
        domaineChoisi = domaine;
        afficherFiltres();
        afficherLivres();
      });

      item.appendChild(bouton);
      zoneFiltres.appendChild(item);
    });
  }


  /* ------------------------------------------------------------------------
     6. LES CARTES DE LIVRES
     ------------------------------------------------------------------------ */

  // Construit la couverture d'un livre : sa vraie image si books.json en indique une,
  // sinon un rectangle coloré selon le domaine, avec le titre dessus.
  // aria-hidden : les lecteurs d'écran la sautent (le titre est lu ailleurs).
  function creerCouverture(livre) {
    var couverture = creer('div', 'couverture ' + classeCouverture(livre.domaine));
    couverture.setAttribute('aria-hidden', 'true');
    if (imageValide(livre.couverture)) {
      couverture.classList.add('couverture-image');
      var image = creer('img');
      image.src = livre.couverture;
      image.alt = '';                 // décorative : le titre du livre est lu à côté
      image.loading = 'lazy';
      couverture.appendChild(image);
    } else {
      couverture.appendChild(creer('small', '', livre.domaine));
      couverture.appendChild(creer('strong', '', livre.titre));
    }
    return couverture;
  }

  // Construit le bouton d'achat d'un livre :
  //  - un vrai lien (Stripe ou fichier du site) qui s'ouvre dans un nouvel onglet,
  //    avec « Acheter » pour un livre payant et « Télécharger » pour un livre gratuit ;
  //  - sinon (pas encore de lien dans books.json), un bouton grisé « Bientôt disponible ».
  function creerBoutonAchat(livre, classes) {
    if (lienLivreValide(livre.lien)) {
      var gratuit = simplifier(livre.prix) === 'gratuit';
      var lien = creer('a', classes, gratuit ? 'Télécharger' : 'Acheter');
      lien.href = livre.lien;
      lien.target = '_blank';
      lien.rel = 'noopener';        // sécurité : le nouvel onglet ne peut pas agir sur votre page
      return lien;
    }
    var inactif = creer('button', classes, 'Bientôt disponible');
    inactif.type = 'button';
    inactif.disabled = true;
    return inactif;
  }

  // Construit UNE carte pour UN livre. « rang » = sa place dans la liste (0, 1, 2…),
  // qui sert à faire arriver les cartes l'une après l'autre.
  function creerCarte(livre, rang) {
    var carte = creer('li', 'carte carte-apparait');
    // Chaque carte arrive un peu après la précédente (effet de cascade, réglé dans le CSS).
    // On s'arrête à 8 pour que les dernières cartes n'attendent pas trop longtemps.
    carte.style.setProperty('--rang', Math.min(rang || 0, 8));

    // La couverture est un bouton : un clic (ou Entrée au clavier) ouvre la fiche du livre
    var bouton = creer('button', 'couverture-bouton');
    bouton.type = 'button';
    bouton.setAttribute('aria-haspopup', 'dialog');
    bouton.setAttribute('aria-label', 'Voir la fiche : ' + livre.titre);
    bouton.appendChild(creerCouverture(livre));
    bouton.appendChild(creer('span', 'couverture-indice', 'Voir la fiche'));
    bouton.addEventListener('click', function () { ouvrirFiche(livre, bouton); });
    carte.appendChild(bouton);

    // Le titre et l'auteur. Si le livre est marqué « anonyme », le nom de l'auteur n'est jamais affiché.
    var auteur = livre.anonyme ? 'Auteur·rice anonyme' : livre.auteur;
    carte.appendChild(creer('h3', 'carte-titre', livre.titre));
    carte.appendChild(creer('p', 'carte-auteur', auteur));

    // Le bas de la carte : le prix et le bouton d'achat
    var bas = creer('div', 'carte-bas');
    bas.appendChild(creer('span', 'carte-prix', livre.prix));
    bas.appendChild(creerBoutonAchat(livre, 'bouton bouton-contour bouton-petit'));
    carte.appendChild(bas);
    return carte;
  }

  // Affiche les cartes qui correspondent au filtre ET à la recherche
  function afficherLivres() {
    zoneCartes.textContent = '';
    var recherche = simplifier(texteRecherche);

    var visibles = livres.filter(function (livre) {
      var bonDomaine = (domaineChoisi === 'Tout') || (livre.domaine === domaineChoisi);
      var bonTexte = (recherche === '') ||
                     simplifier(livre.titre + ' ' + livre.auteur).indexOf(recherche) !== -1;
      return bonDomaine && bonTexte;
    });

    visibles.forEach(function (livre, rang) {
      zoneCartes.appendChild(creerCarte(livre, rang));
    });

    // S'il n'y a aucun livre à montrer, on affiche le message « Cette étagère attend… »
    messageVide.hidden = (visibles.length > 0);
  }


  /* ------------------------------------------------------------------------
     6 bis. LA FICHE DU LIVRE
     Une fenêtre (<dialog id="fiche"> dans index.html) qui s'ouvre au clic sur une couverture.
     Son contenu vient de books.json : résumé, pages, niveau, format (tous facultatifs).
     ------------------------------------------------------------------------ */
  var fiche = document.getElementById('fiche');
  var ficheContenu = document.getElementById('fiche-contenu');
  var ficheDeclencheur = null;     // le bouton qui a ouvert la fiche : on y revient à la fermeture

  function ouvrirFiche(livre, declencheur) {
    ficheContenu.textContent = '';   // on vide la fiche précédente

    // À gauche : la couverture, en grand
    var colonneCouverture = creer('div', 'fiche-couverture');
    colonneCouverture.appendChild(creerCouverture(livre));
    ficheContenu.appendChild(colonneCouverture);

    // À droite : le texte
    var texte = creer('div', 'fiche-texte');
    texte.appendChild(creer('p', 'fiche-domaine', livre.domaine));
    var titre = creer('h2', '', livre.titre);
    titre.id = 'fiche-titre';        // la fenêtre est « nommée » par ce titre (aria-labelledby)
    texte.appendChild(titre);
    texte.appendChild(creer('p', 'fiche-auteur', livre.anonyme ? 'Auteur·rice anonyme' : livre.auteur));
    texte.appendChild(creer('p', 'fiche-resume', livre.resume || 'Le résumé de ce livre arrive bientôt.'));

    // Les détails : on n'affiche que ceux qui sont renseignés dans books.json
    var details = creer('dl', 'fiche-details');
    [['Pages', livre.pages], ['Niveau', livre.niveau], ['Format', livre.format]].forEach(function (detail) {
      if (detail[1]) {
        details.appendChild(creer('dt', '', detail[0]));
        details.appendChild(creer('dd', '', String(detail[1])));
      }
    });
    if (details.children.length > 0) { texte.appendChild(details); }

    // Le prix et le bouton d'achat
    var achat = creer('div', 'fiche-achat');
    achat.appendChild(creer('span', 'fiche-prix', livre.prix));
    achat.appendChild(creerBoutonAchat(livre, 'bouton bouton-plein'));
    texte.appendChild(achat);
    if (lienValide(livre.lien) && livre.lien.indexOf('https://buy.stripe.com/') === 0) {
      texte.appendChild(creer('p', 'fiche-note', 'Paiement immédiat et sécurisé par Stripe, dans un nouvel onglet.'));
    }
    ficheContenu.appendChild(texte);

    ficheDeclencheur = declencheur;
    // showModal() ouvre la fenêtre par-dessus la page ; Échap la ferme tout seul
    if (typeof fiche.showModal === 'function') { fiche.showModal(); } else { fiche.setAttribute('open', ''); }
  }

  function preparerFiche() {
    // Le bouton × ferme la fiche
    document.getElementById('fiche-fermer').addEventListener('click', function () { fiche.close(); });
    // Un clic sur le fond sombre, autour de la fiche, la ferme aussi
    fiche.addEventListener('click', function (evenement) {
      if (evenement.target === fiche) { fiche.close(); }
    });
    // À la fermeture, on remet le curseur du clavier sur la couverture qui avait ouvert la fiche
    fiche.addEventListener('close', function () {
      if (ficheDeclencheur) { ficheDeclencheur.focus(); }
    });
  }


  /* ------------------------------------------------------------------------
     7. LA LECTURE DE books.json
     ------------------------------------------------------------------------ */
  async function chargerLivres() {
    try {
      // fetch = « va chercher ce fichier ». « await » = on attend la réponse avant de continuer.
      var reponse = await fetch(FICHIER_LIVRES);
      if (!reponse.ok) { throw new Error('Fichier introuvable'); }

      var donnees = await reponse.json();             // transforme le texte JSON en liste JavaScript
      if (!Array.isArray(donnees)) { throw new Error('Le fichier doit contenir une liste de livres'); }

      // On ne garde que les livres qui ont au moins un titre (évite d'afficher une fiche vide)
      livres = donnees.filter(function (livre) { return livre && livre.titre; });

      afficherFiltres();
      afficherLivres();
      afficherExemplesPrix();     // les boutons « essayer avec un livre » du calculateur

    } catch (erreur) {
      // Si quelque chose ne va pas, on explique simplement au lieu de laisser la page vide.
      messageErreur.textContent =
        'Les livres ne peuvent pas être affichés pour le moment. ' +
        '(Astuce : si vous avez ouvert ce fichier directement depuis votre ordinateur, c\'est normal : ' +
        'les livres se chargent seulement depuis le site en ligne ou un petit serveur local.)';
      messageErreur.hidden = false;
      afficherFiltres();      // on montre quand même les filtres
    }
  }


  /* ------------------------------------------------------------------------
     8. LE DON ET LE PANNEAU DES FLUX (étape 5)
     ------------------------------------------------------------------------ */

  // Écrit un montant en euros à la belge : 1234.5 devient « 1 234,50 € ».
  // Si la valeur n'est pas un nombre, on affiche 0,00 € plutôt qu'une erreur.
  function enEuros(montant) {
    var nombre = (typeof montant === 'number' && isFinite(montant)) ? montant : 0;
    return new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' }).format(nombre);
  }

  // Écrit une date « 2026-10-24 » en toutes lettres : « 24 octobre 2026 ».
  // Si la date est vide ou illisible, on affiche un tiret.
  function enDate(texte) {
    var date = new Date(texte);
    if (!texte || isNaN(date.getTime())) { return '—'; }
    return date.toLocaleDateString('fr-BE', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  // Le bouton « Faire un don » et le bouton « Demander ma part »
  function afficherDon() {
    var boutonDon = document.getElementById('btn-don');
    var noteDon = document.getElementById('note-don');
    var boutonPart = document.getElementById('btn-part');

    // Le lien de don est « prêt » s'il commence par https:// et ne contient plus « LIEN-ICI »
    var lienPret = lienValide(LIEN_DON) && LIEN_DON.indexOf('LIEN-ICI') === -1;

    if (lienPret) {
      boutonDon.href = LIEN_DON;
      boutonDon.target = '_blank';
      boutonDon.rel = 'noopener';          // sécurité : le nouvel onglet ne peut pas agir sur votre page
      noteDon.hidden = true;
    } else {
      // Pas encore de vrai lien : le bouton est grisé et ne mène nulle part
      boutonDon.setAttribute('aria-disabled', 'true');
      boutonDon.addEventListener('click', function (evenement) { evenement.preventDefault(); });
      noteDon.hidden = false;
    }

    // « Demander ma part » ouvre un e-mail déjà rédigé dans la messagerie de la personne.
    // encodeURIComponent protège les accents et les espaces pour qu'ils passent dans l'adresse.
    var sujet = 'Demande de part du fonds — La Bibliothèque des Murmures';
    var corps = 'Bonjour,\n\n' +
                'Je demande une part du fonds des petits auteurs.\n\n' +
                'Mon nom de plume : \n' +
                'Le titre de mon écrit dans la bibliothèque : \n' +
                'Le montant de mon don (merci de joindre le reçu) : \n\n' +
                'Je confirme avoir intégré au moins un écrit à la bibliothèque et avoir donné au moins 1 €.\n';
    boutonPart.href = 'mailto:' + EMAIL_CONTACT + '?subject=' + encodeURIComponent(sujet) + '&body=' + encodeURIComponent(corps);
  }

  // Les animations du panneau des flux n'ont lieu que si le navigateur sait détecter quand le panneau
  // apparaît à l'écran (IntersectionObserver) ET si la personne n'a pas demandé « réduire les animations ».
  var animerFlux = ('IntersectionObserver' in window) &&
                   !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Remplit une liste (<ul>) avec des lignes « texte à gauche, montant à droite ».
  // « lignes » est une liste de { texte, montant }. S'il n'y en a pas, on écrit le message « messageVide ».
  function remplirListe(zone, lignes, messageVide) {
    zone.textContent = '';
    if (lignes.length === 0) {
      zone.appendChild(creer('li', 'mouvement-vide', messageVide));
      return;
    }
    lignes.slice(0, LIGNES_MAXI).forEach(function (ligne, rang) {
      var item = creer('li');
      item.appendChild(creer('span', '', ligne.texte));
      item.appendChild(creer('span', '', enEuros(ligne.montant)));
      if (animerFlux) {
        // La ligne attendra que le panneau soit visible, puis arrivera après la précédente (voir le CSS)
        item.classList.add('ligne-apparait');
        item.style.setProperty('--rang', rang);
      }
      zone.appendChild(item);
    });
  }

  // Écrit un montant du panneau, et le garde aussi en nombre (data-valeur) pour l'animation.
  // Le bon montant est écrit tout de suite : un lecteur d'écran le lit même si l'animation n'a pas lieu.
  function afficherMontant(id, valeur) {
    var element = document.getElementById(id);
    element.textContent = enEuros(valeur);
    element.dataset.valeur = valeur;
  }

  // La jauge d'objectif : affichée seulement si flux.json contient un « objectif » (un nombre plus grand que 0)
  function afficherObjectif(flux, dons) {
    if (typeof flux.objectif !== 'number' || flux.objectif <= 0) { return; }
    var pourcent = Math.min(100, Math.max(0, dons / flux.objectif * 100));
    var texte = enEuros(dons) + ' sur ' + enEuros(flux.objectif) + ' · ' + Math.floor(pourcent) + ' %';
    if (flux.objectifLibelle) { document.getElementById('objectif-libelle').textContent = flux.objectifLibelle; }
    document.getElementById('objectif-texte').textContent = texte;
    var jauge = document.getElementById('jauge');
    jauge.setAttribute('aria-valuemax', flux.objectif);
    jauge.setAttribute('aria-valuenow', Math.min(Math.max(dons, 0), flux.objectif));
    jauge.setAttribute('aria-valuetext', texte);
    document.getElementById('jauge-remplie').style.width = pourcent + '%';
    document.getElementById('objectif').hidden = false;
  }

  // Fait défiler un montant de 0 jusqu'à sa valeur en 1,2 seconde, en ralentissant à la fin
  function compter(element) {
    var valeur = Number(element.dataset.valeur) || 0;
    var debut = null;
    function etape(temps) {
      if (debut === null) { debut = temps; }
      var avance = Math.min(1, (temps - debut) / 1200);   // de 0 (début) à 1 (fin)
      var doux = 1 - Math.pow(1 - avance, 3);              // rapide au début, lent à la fin
      element.textContent = enEuros(valeur * doux);
      if (avance < 1) { requestAnimationFrame(etape); } else { element.textContent = enEuros(valeur); }
    }
    requestAnimationFrame(etape);
  }

  // Lance les animations du panneau la première fois qu'il apparaît à l'écran
  function preparerAnimationFlux() {
    if (!animerFlux) { return; }
    var panneau = document.querySelector('.panneau');
    var remplie = document.getElementById('jauge-remplie');
    var largeurFinale = remplie.style.width;
    remplie.style.width = '0%';                     // la jauge part de zéro…
    var observateur = new IntersectionObserver(function (entrees) {
      if (!entrees[0].isIntersecting) { return; }
      observateur.disconnect();                     // une seule fois
      panneau.classList.add('panneau-visible');     // déclenche la cascade des lignes (CSS)
      ['flux-dons', 'flux-parts', 'flux-solde'].forEach(function (id) { compter(document.getElementById(id)); });
      remplie.style.width = largeurFinale;          // … puis se remplit en glissant (transition CSS)
    }, { threshold: 0.3 });                         // quand au moins 30 % du panneau est visible
    observateur.observe(panneau);
  }

  // Lit flux.json et remplit le panneau
  async function chargerFlux() {
    var erreurFlux = document.getElementById('flux-erreur');
    try {
      var reponse = await fetch(FICHIER_FLUX);
      if (!reponse.ok) { throw new Error('Fichier introuvable'); }
      var flux = await reponse.json();

      var dons  = (typeof flux.donsRecus === 'number') ? flux.donsRecus : 0;
      var parts = (typeof flux.partsVersees === 'number') ? flux.partsVersees : 0;

      document.getElementById('flux-maj').textContent = enDate(flux.miseAJour);
      afficherMontant('flux-dons', dons);
      afficherMontant('flux-parts', parts);
      // Le solde est calculé : dons reçus moins parts versées (une seule chose à tenir à jour de moins)
      afficherMontant('flux-solde', dons - parts);
      afficherObjectif(flux, dons);

      // Derniers dons : le prénom, ou « Donateur anonyme » si le prénom est vide
      var derniersDons = (Array.isArray(flux.derniersDons) ? flux.derniersDons : []).map(function (don) {
        return { texte: (don && don.prenom) ? don.prenom : 'Donateur anonyme', montant: don ? don.montant : 0 };
      });
      remplirListe(document.getElementById('liste-dons'), derniersDons, 'Aucun don pour le moment.');

      // Dernières parts versées : « Nom de l'auteur — titre de l'écrit »
      var dernieresParts = (Array.isArray(flux.dernieresParts) ? flux.dernieresParts : []).map(function (part) {
        var nom = (part && part.auteur) ? part.auteur : 'Auteur·rice';
        var titre = (part && part.titre) ? ' — ' + part.titre : '';
        return { texte: nom + titre, montant: part ? part.montant : 0 };
      });
      remplirListe(document.getElementById('liste-parts'), dernieresParts, 'Aucune part versée pour le moment.');

      preparerAnimationFlux();   // les montants défileront quand le panneau apparaîtra à l'écran

    } catch (erreur) {
      erreurFlux.textContent = 'Le panneau des flux ne peut pas être affiché pour le moment.';
      erreurFlux.hidden = false;
    }
  }

  // ÉTAPE 6 : le formulaire « Déposer mon livre ».
  // Il n'envoie rien et ne stocke aucun fichier : il vérifie les champs, puis ouvre
  // un e-mail déjà rédigé dans la messagerie de la personne (elle y joint son fichier).
  function preparerDepot() {
    var formulaire = document.getElementById('formulaire-depot');
    var erreurDepot = document.getElementById('erreur-depot');

    // Lit le texte d'un champ, sans les espaces inutiles au début et à la fin
    function lire(id) { return document.getElementById(id).value.trim(); }

    formulaire.addEventListener('submit', function (evenement) {
      evenement.preventDefault();   // on empêche le formulaire d'être envoyé tout seul

      // 1. Les champs obligatoires : on note ceux qui manquent
      var manquants = [];
      if (!lire('depot-titre'))   { manquants.push('le titre du livre'); }
      if (!lire('depot-plume'))   { manquants.push('votre nom de plume'); }
      if (!lire('depot-resume'))  { manquants.push('le résumé'); }
      if (!lire('depot-fichier')) { manquants.push('le nom du fichier'); }
      if (!document.getElementById('depot-droits').checked) { manquants.push('la case sur les droits'); }
      if (!document.getElementById('depot-charte').checked) { manquants.push('la case sur la charte'); }

      if (manquants.length > 0) {
        erreurDepot.textContent = 'Il manque encore : ' + manquants.join(', ') + '.';
        erreurDepot.hidden = false;
        return;   // on s'arrête là : rien n'est préparé tant que ce n'est pas complet
      }
      erreurDepot.hidden = true;

      // 2. Le texte de l'e-mail, rempli avec ce que la personne a écrit
      var anonyme = document.getElementById('depot-anonyme').checked;
      var montant = lire('depot-montant') || 'non précisé';
      var corps = 'Bonjour,\n\n' +
                  'Je souhaite déposer mon livre à La Bibliothèque des Murmures.\n\n' +
                  'Titre : ' + lire('depot-titre') + '\n' +
                  'Nom de plume : ' + lire('depot-plume') + (anonyme ? ' (anonyme : ne jamais afficher mon nom)' : '') + '\n' +
                  'Domaine : ' + document.getElementById('depot-domaine').value + '\n' +
                  'Type de prix : ' + document.getElementById('depot-prix').value + '\n' +
                  'Montant souhaité : ' + montant + '\n' +
                  'Fichier (à joindre à cet e-mail) : ' + lire('depot-fichier') + '\n\n' +
                  'Résumé :\n' + lire('depot-resume') + '\n\n' +
                  'Je confirme avoir les droits de diffusion de ce livre et j\'accepte la charte de la règle d\'or.\n';
      var sujet = 'Dépôt de livre — ' + lire('depot-titre');

      // 3. L'adresse de l'e-mail. On la garde sur le formulaire (utile pour vérifier), puis on ouvre la messagerie.
      var adresse = 'mailto:' + EMAIL_CONTACT + '?subject=' + encodeURIComponent(sujet) + '&body=' + encodeURIComponent(corps);
      formulaire.dataset.mailto = adresse;
      window.location.href = adresse;
    });
  }

  /* ------------------------------------------------------------------------
     8 bis. LE CALCULATEUR DE RÉPARTITION (section « Comment est utilisé l'argent »)
     Le curseur choisit un prix ; le tableau, la barre et la légende se recalculent.
     ------------------------------------------------------------------------ */
  var curseur = document.getElementById('prix-simule');

  // Écrit un prix court : « 10 € » pour un prix rond, « 4,50 € » sinon
  function prixCourt(montant) {
    return (montant % 1 === 0) ? montant + ' €' : enEuros(montant);
  }

  // Lit un prix écrit dans books.json (« 5 € », « 4,50 € »). Renvoie null pour « Gratuit », « Prix libre » ou « [PRIX] ».
  function lirePrix(texte) {
    var nombre = parseFloat(String(texte).replace(',', '.').replace(/[^0-9.]/g, ''));
    return nombre > 0 ? nombre : null;
  }

  // Fait le calcul. Tout est compté en CENTIMES (nombres entiers) pour éviter les erreurs d'arrondi.
  function calculerRepartition(prix) {
    var prixC   = Math.round(prix * 100);
    var htC     = Math.round(prixC / (1 + TVA_TAUX));           // prix hors TVA
    var auteurC = Math.round(htC * PART_AUTEUR);                 // 60 % pour l'auteur·rice
    var biblioC = htC - auteurC;                                 // le reste (40 %) pour la bibliothèque
    var fraisC  = Math.round(prixC * FRAIS_POURCENT + FRAIS_FIXES * 100);
    return {
      prix: prixC / 100, tva: (prixC - htC) / 100, ht: htC / 100,
      auteur: auteurC / 100, biblio: biblioC / 100, frais: fraisC / 100, reste: (biblioC - fraisC) / 100
    };
  }

  // Affiche le résultat dans le tableau, la barre et la légende
  function afficherRepartition(prix) {
    var r = calculerRepartition(prix);
    function ecrire(id, texte) { document.getElementById(id).textContent = texte; }
    // La largeur d'un morceau de barre = sa part du prix payé, en pourcentage
    function largeur(id, montant) { document.getElementById(id).style.width = Math.max(0, montant / r.prix * 100) + '%'; }

    ecrire('prix-affiche', prixCourt(r.prix));
    ecrire('repartition-titre', 'Un livre vendu ' + prixCourt(r.prix));
    ecrire('val-prix', enEuros(r.prix));
    ecrire('val-tva', '− ' + enEuros(r.tva));
    ecrire('val-ht', enEuros(r.ht));
    ecrire('val-auteur', enEuros(r.auteur));
    ecrire('val-biblio', enEuros(r.biblio));
    ecrire('val-frais', '− ' + enEuros(r.frais));
    ecrire('val-reste', '≈ ' + enEuros(r.reste));

    largeur('barre-tva', r.tva);
    largeur('barre-auteur', r.auteur);
    largeur('barre-frais', r.frais);
    largeur('barre-reste', r.reste);
    ecrire('leg-tva', enEuros(r.tva));
    ecrire('leg-auteur', enEuros(r.auteur));
    ecrire('leg-frais', enEuros(r.frais));
    ecrire('leg-reste', enEuros(r.reste));

    // Ce que les lecteurs d'écran annoncent quand on bouge le curseur : « 12 € » plutôt que « 12 »
    curseur.setAttribute('aria-valuetext', prixCourt(r.prix));
  }

  // Les boutons « essayer avec un livre » : un bouton par livre qui a un vrai prix dans books.json
  function afficherExemplesPrix() {
    var zone = document.getElementById('exemples-prix');
    if (!curseur || !zone) { return; }
    zone.textContent = '';
    livres.forEach(function (livre) {
      var prix = lirePrix(livre.prix);
      if (!prix) { return; }
      var item = creer('li');
      var bouton = creer('button', '', livre.titre + ' · ' + prixCourt(prix));
      bouton.type = 'button';
      bouton.addEventListener('click', function () {
        if (prix > Number(curseur.max)) { curseur.max = Math.ceil(prix); }   // un livre plus cher que 50 € agrandit le curseur
        curseur.value = prix;
        afficherRepartition(prix);
      });
      item.appendChild(bouton);
      zone.appendChild(item);
    });
    zone.hidden = (zone.children.length === 0);
  }

  function preparerCalculateur() {
    if (!curseur) { return; }
    document.getElementById('calculateur').hidden = false;    // JavaScript fonctionne : on montre le calculateur
    curseur.addEventListener('input', function () { afficherRepartition(Number(curseur.value)); });
    afficherRepartition(Number(curseur.value));
  }

  /* ------------------------------------------------------------------------
     9. LE DÉMARRAGE
     ------------------------------------------------------------------------ */

  // À chaque lettre tapée dans la recherche : on retient le texte et on réaffiche les cartes
  champRecherche.addEventListener('input', function () {
    texteRecherche = champRecherche.value;
    afficherLivres();
  });

  chargerLivres();
  afficherDon();
  chargerFlux();
  preparerDepot();
  preparerFiche();
  preparerCalculateur();

})();

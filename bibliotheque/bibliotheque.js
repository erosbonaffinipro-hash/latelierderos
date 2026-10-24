/* ==========================================================================
   LA BIBLIOTHÈQUE DES MURMURES — le JavaScript de la page
   Rôle de ce fichier (étapes 3 et 5) : lire books.json et afficher les livres
   sous forme de cartes, avec les filtres et la recherche ; gérer le bouton de don et le panneau des flux (flux.json).

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
  var LIEN_DON = 'https://buy.stripe.com/LIEN-ICI';

  // L'adresse e-mail qui reçoit les demandes (le bouton « Demander ma part »).
  var EMAIL_CONTACT = 'erosbonaffini.pro@gmail.com';

  // Le nom du fichier qui contient le panneau des flux (dons reçus, parts versées…)
  var FICHIER_FLUX = 'flux.json';

  // Combien de lignes montrer au maximum dans « Derniers dons » et « Dernières parts versées »
  var LIGNES_MAXI = 5;

  // Les domaines proposés comme filtres, dans l'ordre d'affichage
  var DOMAINES = ['Écriture', 'Formule', 'Code', 'Nature', 'Artisanat', 'Philosophie'];


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

  // Construit UNE carte pour UN livre
  function creerCarte(livre) {
    var carte = creer('li', 'carte');

    // La couverture : un rectangle coloré selon le domaine, avec le titre dessus.
    // aria-hidden : les lecteurs d'écran la sautent (le titre est déjà lu plus bas).
    var couverture = creer('div', 'couverture ' + classeCouverture(livre.domaine));
    couverture.setAttribute('aria-hidden', 'true');
    if (imageValide(livre.couverture)) {
      // Une vraie image de couverture est indiquée dans books.json : elle remplace le rectangle coloré
      couverture.classList.add('couverture-image');
      var image = creer('img');
      image.src = livre.couverture;
      image.alt = '';                 // décorative : le titre du livre est lu juste en dessous
      image.loading = 'lazy';
      couverture.appendChild(image);
    } else {
      couverture.appendChild(creer('small', '', livre.domaine));
      couverture.appendChild(creer('strong', '', livre.titre));
    }
    carte.appendChild(couverture);

    // Le titre et l'auteur. Si le livre est marqué « anonyme », le nom de l'auteur n'est jamais affiché.
    var auteur = livre.anonyme ? 'Auteur·rice anonyme' : livre.auteur;
    carte.appendChild(creer('h3', 'carte-titre', livre.titre));
    carte.appendChild(creer('p', 'carte-auteur', auteur));

    // Le bas de la carte : le prix et le bouton
    var bas = creer('div', 'carte-bas');
    bas.appendChild(creer('span', 'carte-prix', livre.prix));

    if (lienLivreValide(livre.lien)) {
      // Un vrai lien (Stripe ou fichier du site), qui s'ouvre dans un nouvel onglet
      var lien = creer('a', 'bouton bouton-contour bouton-petit', 'Voir le livre');
      lien.href = livre.lien;
      lien.target = '_blank';
      lien.rel = 'noopener';        // sécurité : le nouvel onglet ne peut pas agir sur votre page
      bas.appendChild(lien);
    } else {
      // Pas encore de lien dans books.json : on affiche un bouton grisé
      var inactif = creer('button', 'bouton bouton-contour bouton-petit', 'Bientôt disponible');
      inactif.type = 'button';
      inactif.disabled = true;
      bas.appendChild(inactif);
    }

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

    visibles.forEach(function (livre) {
      zoneCartes.appendChild(creerCarte(livre));
    });

    // S'il n'y a aucun livre à montrer, on affiche le message « Cette étagère attend… »
    messageVide.hidden = (visibles.length > 0);
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

  // Remplit une liste (<ul>) avec des lignes « texte à gauche, montant à droite ».
  // « lignes » est une liste de { texte, montant }. S'il n'y en a pas, on écrit le message « messageVide ».
  function remplirListe(zone, lignes, messageVide) {
    zone.textContent = '';
    if (lignes.length === 0) {
      zone.appendChild(creer('li', 'mouvement-vide', messageVide));
      return;
    }
    lignes.slice(0, LIGNES_MAXI).forEach(function (ligne) {
      var item = creer('li');
      item.appendChild(creer('span', '', ligne.texte));
      item.appendChild(creer('span', '', enEuros(ligne.montant)));
      zone.appendChild(item);
    });
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
      document.getElementById('flux-dons').textContent = enEuros(dons);
      document.getElementById('flux-parts').textContent = enEuros(parts);
      // Le solde est calculé : dons reçus moins parts versées (une seule chose à tenir à jour de moins)
      document.getElementById('flux-solde').textContent = enEuros(dons - parts);

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

    } catch (erreur) {
      erreurFlux.textContent = 'Le panneau des flux ne peut pas être affiché pour le moment.';
      erreurFlux.hidden = false;
    }
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

})();

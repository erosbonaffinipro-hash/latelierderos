/* ==========================================================================
   LA BIBLIOTHÈQUE DES MURMURES — le JavaScript de la page
   Rôle de ce fichier (étape 3) : lire books.json, puis afficher les livres
   sous forme de cartes, avec les filtres par domaine et la recherche.

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
    couverture.appendChild(creer('small', '', livre.domaine));
    couverture.appendChild(creer('strong', '', livre.titre));
    carte.appendChild(couverture);

    // Le titre et l'auteur
    carte.appendChild(creer('h3', 'carte-titre', livre.titre));
    carte.appendChild(creer('p', 'carte-auteur', livre.auteur));

    // Le bas de la carte : le prix et le bouton
    var bas = creer('div', 'carte-bas');
    bas.appendChild(creer('span', 'carte-prix', livre.prix));

    if (lienValide(livre.lien)) {
      // Un vrai lien, qui s'ouvre dans un nouvel onglet
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
     8. LE DÉMARRAGE
     ------------------------------------------------------------------------ */

  // À chaque lettre tapée dans la recherche : on retient le texte et on réaffiche les cartes
  champRecherche.addEventListener('input', function () {
    texteRecherche = champRecherche.value;
    afficherLivres();
  });

  chargerLivres();

})();

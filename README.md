# L'Atelier d'Eros, Le Scribe — site statique

Tous les fichiers sont à la racine du dépôt (pas de sous-dossier).

- `index.html` : le site complet (une page), première porte du réseau Unissant ; le menu est rangé en quatre étapes
- `confidentialite.html` : confidentialité et cookies (aucun cookie n'est déposé)
- `app.js` : Echo (trois états sur la page d'accueil : |0⟩ guide, |1⟩ Duo-Code, |2⟩ réseau Unissant), quiz Duo-Code, bouton « Copier le bloc ». Aussi utilisé par la Bibliothèque, où Echo reste le guide.
- `site.js` : le reste de la page d'accueil (menu par étapes, réseau qui pousse, portail de Véritania, structure, équilibre, racines, manifeste, formulaire « Rejoindre »)
- `maquettes/site-complet.dc.html` : la maquette de design d'origine (fichier de travail, non affiché sur le site)
- `fonts.css` et `font-*.woff2` : polices hébergées sur le site (aucun appel à Google)
- `echo-prompteur.html`, `.css`, `.js` : l'outil Écho (prompteur qui suit la voix, atelier de prompts)
- `duo-kit.html`, `.css`, `.js` : le kit Duo-Code (famille, amis, animaux, IA)
- `extrait-gratuit.pdf` : le livre gratuit (16 pages)
- `couverture-livre.jpg` et `portrait-eros.jpg` : images optimisées pour le web (couverture du livre, portrait de l'auteur)
- `CNAME` : le domaine pour GitHub Pages (`latelierderos.art`)
- `.nojekyll` : demande à GitHub de servir les fichiers tels quels

## Mise en ligne

GitHub Pages, branche `main`, dossier racine. Pour mettre à jour : dépôt > Add file > Upload files, glisser les fichiers modifiés, valider.

## Echo avec une vraie IA et quiz

- Tant que `ECHO_API` est vide dans `app.js`, Echo répond par des réponses préparées, et la section Quiz (avec son lien de menu) est masquée.
- Pour les activer : installer le serveur du dossier `echo-worker` (voir son README), puis mettre son adresse dans `ECHO_API`.
- Ne publiez jamais le dossier `echo-worker` sur GitHub Pages : il contient les réponses du quiz.

## Sécurité

`index.html` contient une politique de sécurité (CSP) qui n'autorise que les fichiers du site et les serveurs `*.workers.dev` pour Echo. Si le serveur d'Echo est sur un autre domaine, ajoutez-le dans `connect-src`.

## Avant d'ouvrir la boutique

- Remplacer les textes entre crochets : contact, mentions légales, conditions de vente, prix, lien Stripe, adresse dans `confidentialite.html`.
- Dans Canva, retirer le domaine de l'ancien site.

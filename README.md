# L'Atelier d'Eros, Le Scribe — site statique

Contenu du dossier :

- `index.html` : le site complet (une page)
- `app.js` : Echo (réponses préparées), quiz Duo-Code, bouton « Copier le bloc »
- `assets/extrait-gratuit.pdf` : le livre gratuit (16 pages)
- `CNAME` : le domaine pour GitHub Pages (`latelierderos.art`, à corriger si besoin)
- `.nojekyll` : demande à GitHub de servir les fichiers tels quels

## Mettre en ligne sur GitHub Pages

1. Créez un dépôt GitHub (par exemple `latelierderos`) et envoyez-y le contenu de ce dossier, à la racine.
2. Dépôt > Settings > Pages > Source : « Deploy from a branch », branche `main`, dossier `/ (root)`.
3. Dans « Custom domain », saisissez `latelierderos.art`, puis cochez « Enforce HTTPS » quand la case devient disponible.

## Relier le domaine (domaine chez WordPress.com)

Dans WordPress.com : Domaines > votre domaine > Enregistrements DNS.

1. Supprimez les anciens enregistrements `A` et `AAAA` du domaine racine (ceux qui pointent vers WordPress ou Canva).
2. Ajoutez 4 enregistrements `A` sur le domaine racine (`@`) :
   `185.199.108.153` · `185.199.109.153` · `185.199.110.153` · `185.199.111.153`
3. Ajoutez 4 enregistrements `AAAA` sur `@` (facultatif mais recommandé) :
   `2606:50c0:8000::153` · `2606:50c0:8001::153` · `2606:50c0:8002::153` · `2606:50c0:8003::153`
4. Ajoutez un `CNAME` : nom `www`, valeur `VOTRE-COMPTE.github.io`.
5. Attendez la propagation (de quelques minutes à 24 h), puis vérifiez le HTTPS dans GitHub Pages.

Vérifiez ces valeurs dans la documentation GitHub Pages avant de les saisir : elles peuvent évoluer.

## À faire avant d'ouvrir la boutique

- Remplacer les textes entre crochets : contact, mentions légales, confidentialité, conditions de vente, prix, lien Stripe.
- Dans Canva, retirer le domaine de l'ancien site, pour qu'il ne reste pas associé à Canva.

## Limites actuelles

- Echo avec une vraie IA et le quiz passent par le serveur du dossier `../echo-worker` (à installer, voir son README), puis son adresse se met dans `app.js` (ligne `ECHO_API`). Sans cela, Echo répond par des réponses préparées et le quiz est indisponible.
- Ne publiez jamais le dossier `echo-worker` sur GitHub Pages : il contient les réponses du quiz.
- Les polices viennent de Google Fonts : à mentionner dans la politique de confidentialité, ou à héberger vous-même.

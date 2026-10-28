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

  // Sur la page 1, Echo existe en trois états, comme un qutrit : |0⟩ le guide de l'Atelier,
  // |1⟩ le partenaire Duo-Code, |2⟩ la voix du réseau Unissant. Tant qu'on ne lui demande rien,
  // il reste en superposition |ψ⟩ ; la première question choisit l'état qui répond.
  // La Bibliothèque garde un seul Echo, le guide : rien ne change pour elle.
  var TROIS_ETATS = !SUR_BIBLIO && !!document.getElementById('echo-etats');
  var ETATS = [
    { ket: '|0⟩', name: "Guide de l'Atelier", short: 'Guide', color: '#7D5A17' },
    { ket: '|1⟩', name: 'Partenaire Duo-Code', short: 'Duo-Code', color: '#1F2E4A' },
    { ket: '|2⟩', name: 'Voix du réseau Unissant', short: 'Réseau', color: '#2F6F62' }
  ];
  function ketDe(k) { return (k === null || k === undefined) ? '|ψ⟩' : ETATS[k].ket; }
  var SALUTS = [
    "Bonjour, je suis Echo |0⟩, le guide de l'Atelier. Je peux vous orienter dans le site, et vous conduire à sa seconde page, la Bibliothèque des Murmures. Que cherchez-vous ?",
    "Je suis Echo |1⟩, votre partenaire Duo-Code. Je peux vous expliquer les signes N', Δ, ↻ et V, parler des formules du Codex, ou vous faire passer le quiz. Rien ne part sans votre feu vert.",
    "Bonjour. Je suis Echo |2⟩, la voix qui facilite les passages chez Unissant. Je peux vous aider à explorer nos quatre entités, comprendre nos racines, ou trouver votre place dans le réseau. Que cherchez-vous ?"
  ];
  var SALUT_PSI = "Bonjour, je suis Echo. J'étais un, je suis maintenant trois : |0⟩ le guide de l'Atelier, |1⟩ le partenaire Duo-Code, |2⟩ la voix du réseau Unissant. Tant que vous ne m'avez rien demandé, je reste en superposition ; votre question choisira mon état. Que cherchez-vous ?";

  var PROMPT = "Tu es mon partenaire Duo-Code. Voici nos règles :\n• Repère temps : commence chaque réponse par la date et l'heure si tu peux les connaître. Si tu ne peux pas, dis-le simplement, ne les invente jamais.\n• Une seule question à la fois.\n• Avant d'agir, propose-moi des options et ta recommandation, puis attends mon feu vert. Mon feu vert s'écrit : OK, feu vert.\n• Tu n'écris et tu n'agis qu'après mon feu vert.\n• Si j'écris « pause », on fait une pause, sans insister.\nProtection : je ne te donne aucune donnée personnelle ou sensible, et tu ne m'en demandes pas. Tu restes dans le rôle de partenaire pour cette tâche, sans déborder sur autre chose.\nMa tâche : N' = [écris ici ce qui te manque, par exemple « ranger mon bureau »]\nAide-moi à la découper en étapes Δ.1, Δ.2, Δ.3. Chaque étape reste ↻ (en attente) jusqu'à ce que je la valide moi-même en V.";

  var KB = {
    accueil: { text: "Bonjour, je suis Echo, le guide de l'Atelier. Je peux vous orienter dans le site, et vous conduire à sa seconde page, la Bibliothèque des Murmures. Que cherchez-vous ?" },
    accueilBiblio: { text: "Bonjour, je suis Echo. Je vous guide dans la Bibliothèque des Murmures : la charte, les étagères, le don et le dépôt de livres (certaines parties arrivent bientôt). Que cherchez-vous ?" },
    murmures: { text: "La Bibliothèque des Murmures est la seconde page du site : un lieu de partage de connaissances où chacun dépose son livre numérique, fixe son prix et transmet ce qu'il sait, selon la règle d'or. Elle est en cours de construction.", href: '#accueil', label: 'Entrer dans la Bibliothèque', biblio: true },
    etageres: { text: "Les étagères présentent les livres par domaine : Écriture, Formule, Code, Nature, Artisanat, Philosophie. Vous pouvez filtrer par domaine ou chercher un titre ou un auteur.", href: '#etageres', label: 'Parcourir les étagères', biblio: true },
    regleor: { text: "La règle d'or tient en trois engagements : donner honnêtement, recevoir justement, respecter le savoir. Chaque personne les accepte en entrant dans la bibliothèque.", href: '#regle', label: 'Lire la charte', biblio: true },
    depot: { text: "Pour déposer un livre : créer son espace auteur, déposer le fichier PDF ou EPUB, choisir son prix (payant, prix libre ou gratuit), puis signer la charte. Chaque livre est relu avant la mise en rayon. Le formulaire « Déposer mon livre », plus bas sur la page, prépare votre e-mail : rien n'est enregistré sur le site, et vous joignez le fichier vous-même.", href: '#deposer', label: 'Déposer mon livre', biblio: true },
    don: { text: "Un don rejoint le fonds commun de la bibliothèque, redistribué aux autrices et aux auteurs qui y partagent leurs écrits. Le panneau des flux affiche tous les mouvements d'argent.", href: '#soutien', label: 'Faire un don', biblio: true },
    retour: { text: "Retour à la première page : le site de L'Atelier d'Eros, avec son histoire, le livre gratuit, le Duo-Code et les outils.", href: '#accueil', label: 'Retourner au site' },
    lecture: { text: "Les pages 1 à 16 de « L'Univers d'Eros à l'atelier des débutants » sont gratuites : vous pouvez les lire en ligne ou télécharger le PDF. La suite sera vendue chapitre par chapitre.", href: '#lire', label: 'Lire gratuitement' },
    codex: { text: "Chaque chapitre à venir inclura des formules du Codex d'Eros, que vous pourrez pratiquer avec moi. Cette partie n'est pas encore ouverte, et je ne dévoile pas les formules d'avance. En attendant, je peux vous faire pratiquer le Duo-Code : dites « s'exercer ».", href: '#lire', label: 'Voir la suite' },
    symboles: { text: "Le Duo-Code suit une tâche avec quatre signes :\nN' = le manque, la tâche à accomplir.\nΔ = l'action, découpée en étapes (Δ.1, Δ.2, Δ.3).\n↻ = en attente. Ce signe ne veut jamais dire « fait ».\nV = validé, vérifié et confirmé par vous.\nVoulez-vous vous exercer ?", href: '#duo-code', label: 'Voir le Duo-Code' },
    outils: { text: "Le site propose deux outils gratuits. Écho est un prompteur qui suit votre voix pour lire un texte à voix haute, avec un atelier de prompts. Le kit Duo-Code prépare des prompts pour garder un duo de personnages identique d'une image à l'autre : famille, amis, animaux ou IA. Vos textes restent sur votre appareil.", href: '#outils', label: 'Voir les outils' },
    identite: { text: "Je suis Echo, le guide officiel de l'Atelier d'Eros. Je vous accueille, je vous oriente vers l'histoire, le livre gratuit, le Duo-Code et la boutique, et je vous accompagne dans le quiz. Eros garde toujours la décision : je n'agis jamais à sa place.", href: '#echo', label: 'Voir Echo' },
    auteur: { text: "Eros Bonaffini est l'auteur de L'Univers d'Eros. Il vient de Namur, en Belgique, et il est devenu passionné d'écriture à la suite d'un parcours de vie tumultueux. Son récit s'inspire de faits liés à sa vie.", href: '#auteur', label: "Voir l'auteur" },
    voix: { text: "La voix d'introduction est une courte narration d'environ 1 min 35, inspirée des trois premiers chapitres. Vous pouvez la lire dans la section L'histoire.", href: '#histoire', label: "Aller à L'histoire" },
    histoire: { text: "L'histoire commence avant Véritania. Un astéroïde transforme le monde et les survivants deviennent des Porteurs Divins. Eros, orphelin, ne reçoit aucun pouvoir, et sa sœur Lyra est choisie par l'arc d'Artémis. Je ne dévoile rien de plus que ce qui est écrit sur le site.", href: '#histoire', label: "Aller à L'histoire" },
    navigation: { text: "Le menu en haut de page range le site en quatre étapes, de la plus simple à la plus complète : 1 Commencer (accueil, Atelier, aide), 2 Lire (histoire, Livre Vivant, lecture gratuite, auteur, boutique, Bibliothèque des Murmures), 3 S'exercer (Echo, Duo-Code, outils, quiz), 4 Unissant (structure, équilibre, racines, manifeste, rejoindre). Pour débuter, je vous conseille L'histoire, puis l'extrait du Livre Vivant.", href: '#livre-vivant', label: 'Ouvrir Le Livre Vivant' },
    contenu: { text: "Le Livre Vivant rassemble le Tome 1 (La trilogie d'Eros), les Carnets de Véritania, les repères et un extrait. Certains contenus restent à définir. La procédure pour retrouver un contenu n'est pas encore confirmée.", href: '#livre-vivant', label: 'Voir Le Livre Vivant' },
    paiement: { text: "La boutique n'est pas encore ouverte. Le paiement passera par Stripe en 4 étapes : choisir une formule, vérifier le récapitulatif sur la page Stripe, valider le paiement, puis revenir au site pour vérifier l'accès. Ne m'envoyez jamais de données bancaires.", href: '#boutique', label: 'Voir la boutique' },
    duo: { text: "Le Duo-Code est une façon de travailler à deux, vous et l'IA, comme un frère et une sœur : l'un propose, l'autre valide, et rien ne part sans votre feu vert. Vous pouvez faire une pause à tout moment.", href: '#duo-code', label: 'Voir le Duo-Code' },
    donnees: { text: "Je préfère que vous ne m'envoyiez aucune donnée personnelle ou bancaire. Pour un achat, tout se passera sur la page Stripe.", href: '#aide', label: "Voir l'aide" },
    inconnu: { text: "Je ne sais pas encore répondre à cela, et je préfère ne rien inventer. Choisissez un sujet ci-dessous, ou consultez l'aide.", href: '#aide', label: "Aller à l'aide" },
    indispo: { text: "Je n'arrive pas à joindre mon cerveau pour le moment. Réessayez dans un instant, ou choisissez un sujet ci-dessous.", href: '#aide', label: "Voir l'aide" },
    quizindispo: { text: "Le quiz est momentanément indisponible. Réessayez plus tard.", href: '#duo-code', label: 'Relire le Duo-Code' }
  };

  // Page 1 : l'état d'Echo qui donne chaque réponse préparée. Par défaut |0⟩, le guide ;
  // |1⟩ pour le Duo-Code ; aucun état en particulier (null) pour les messages de prudence.
  ['codex', 'symboles', 'duo', 'quizindispo'].forEach(function (k) { KB[k].st = 1; });
  ['donnees', 'inconnu', 'indispo'].forEach(function (k) { KB[k].st = null; });
  function etatDe(key) { return KB[key].st === undefined ? 0 : KB[key].st; }

  // |2⟩ : les réponses préparées de la voix du réseau Unissant.
  // Chaque ligne : [mots-clés séparés par |, étiquette, réponse].
  var UNISSANT = [
    ['place|rôle|où|ma place|comment commencer', 'Orientation', "Chaque racine trouve sa terre. Avant de chercher votre place, écoutez-vous : qu'est-ce qui vous fait respirer ? Êtes-vous nourri par le soin des autres, par la création des mains, par le déploiement des idées ? Y a-t-il une solitude que vous portez et que vous aimeriez partager ? Ici, ces questions trouvent des réponses, pas seul."],
    ['profile|profil|qui suis-je|suis-je à ma place', 'Auto-diagnostic', "Vous n'avez pas besoin de tout savoir sur vous-même. Posez-vous plutôt : qu'est-ce que j'aime vraiment faire ? Quand suis-je vivant ? Vers qui ou quoi je reviens toujours ? Que voudrais-je transmettre ? Votre réponse dessinera votre chemin. Et ce chemin, vous pouvez le chercher ici, en marchant."],
    ['asbl|association|bénévole|non.*marchand|non profit', 'ASBL', "L'ASBL est le cœur battant d'Unissant, celui qui ne compte pas en argent mais en présence. Nous accueillons les passages : les pertes, les ruptures, les moments où on se sent seul. Cercles de parole, ateliers des mains, médiation numérique. Si vous venez chercher du sens ou venir en aide, vous êtes chez vous ici."],
    ['deuil|perte|passage|transition|fragilité', 'ASBL', "Le deuil n'est pas un problème à résoudre. C'est un passage à habiter. À l'ASBL, nous créons des espaces où la perte peut être dite, entendue, lentement transformée. Vous rencontrez d'autres personnes qui connaissent cette solitude. Ensemble, on se relie. C'est du soin sans étiquette, juste de la présence fidèle."],
    ['cercle|parole|groupe|soin|accompagnement', 'ASBL', "Imaginez un cercle de personnes assises dehors ou au chaud. Quelqu'un parle. Les autres écoutent. Pas de conseil, pas de pitié. Juste l'écoute. Et puis c'est au tour du suivant. C'est là que les blessures trouvent des compagnons, où les silences deviennent portables. C'est le cœur de ce qu'on fait."],
    ['atelier|bois|artisanat|main|créer', 'ASBL', "La main qui crée un objet dans le bois, dans la terre, dans la laine retrouve quelque chose de vivant. Le temps ralentit. Les gestes apaisent. Et quand on crée côte à côte, des liens se nouent sans qu'on ait besoin de les forcer. C'est une thérapie, mais plus beau que le mot."],
    ['médiation|numérique|digital|pour qui', 'ASBL', "Il y a des gens pour qui l'écran est une forêt effrayante. Comment envoyer un message ? Garder une photo d'une personne aimée ? Se sentir moins seul grâce à l'écran ? Nos médiateurs les accompagnent à leur rythme. Sans jugement, avec patience. C'est apprendre ensemble."],
    ['hub|lieu|rencontre|espace|serre|nature', 'HUB', "Le HUB est un lieu en nature où les mondes vivent ensemble. Un chercheur partage un café avec un menuisier, une soignante voit comment le code peut alléger une peine. Ce qu'on crée là, outils, rencontres, idées, naît de cette mixité. C'est le terreau."],
    ['résidence|chercheur|artiste|créatif|collaboration', 'HUB', "Imaginez trois personnes venues de mondes différents qui habitent ensemble quelques semaines autour d'une question : comment accompagner le deuil ? Comment faire un outil qui apaise ? Elles créent, elles écoutent, elles se découvrent. Et elles repartent transformées, et liées."],
    ['conférence|apprendre|philosophie|éthique|technologies', 'HUB', "On se réunit pour penser ensemble. Pas un sage qui parle d'en haut. Des gens qui se demandent vraiment : comment la tech peut servir l'humain ? Qu'est-ce que c'est, une gouvernance juste ? Que nous apprend la nature ? On pense à voix haute, ensemble."],
    ['comment y aller|accès|adresse|horaire|réserv', 'HUB Pratique', "Le HUB s'ouvre à qui arrive avec une intention vraie. Vous pouvez nous visiter, participer à un cercle ou un atelier, proposer une création. L'adresse précise importe moins que la direction : venez du cœur, et vous trouverez la porte. [Adresse à ajouter]"],
    ['entreprise|technologie|code|logiciel|outil|développement', 'Entreprise', "L'Entreprise crée des outils numériques comme on cultive un jardin : avec intention, sans poison. Sobres, ouverts, au service de la personne et non l'inverse. Ce qu'on code sert l'ASBL, le HUB, les indépendants. Les revenus nourrissent le cœur non marchand."],
    ['sobriété|numérique|open.*source|éthique', 'Entreprise', "Sobre : peu de données, peu d'énergie, du code qu'on peut relire et comprendre. Ouvert : le code vit à découvert, pas de secrets qui enferment. L'utilisateur est libre de partir, pas prisonnier. C'est une autre façon de faire, plus lente, plus juste."],
    ['revenu|rémunération|salaire|travail à temps', 'Entreprise', "Si vous créez chez nous, code, design, pensée métier, vous vivez de votre création. Pas d'exploitation. L'Entreprise génère juste assez pour payer dignement et réinvestir dans le soin. C'est stable, pas riche. C'est le choix."],
    ['client|qui paie|services', 'Entreprise', "Nous cherchons des clients qui partagent nos valeurs : organisations à mission, PME éthiques, mutuelles. Si un projet contredit ce en quoi nous croyons, nous disons non. Même si cela réduit nos revenus. Parce que l'intégrité compte plus que la croissance."],
    ['indépendant|partenaire|collaborateur|freelance|liberté', 'Indépendants', "Vous êtes votre propre patron, vos clients sont les vôtres, votre chemin vous le tracez. Mais vous n'êtes pas seul. Vous vous connectez au réseau selon ce que vous portez : un projet, une ressource à partager, une solitude à briser. Liberté plus lien."],
    ['thérapeute|psy|coach|consultant|soignant', 'Indépendants', "Si vous soignez les esprits et les cœurs : le HUB vous offre une salle tranquille, des confrères qui vous comprennent, des clients qui cherchent cette qualité d'écoute que vous donnez. Vous gardez votre méthode, vos tarifs, votre indépendance. Juste moins isolé·e."],
    ['artisan|bois|textile|craft|makers|couture', 'Indépendants', "Vous travaillez la matière de vos mains. Le HUB devient votre atelier partagé, votre vitrine douce. Vous rencontrez d'autres personnes qui respectent comme vous le temps long et la qualité. Votre art reste signé de vous, le réseau l'amplifie."],
    ['développeur|tech|designer|créatif|freelance', 'Indépendants', "Vous codez, vous créez, vous pensez l'interface entre l'humain et la machine. L'Entreprise vous confie des projets qui ont du sens. Le HUB vous donne des espaces. Vous êtes libre, et connecté à une vision plus grande que vous."],
    ['formateur|coach|facilitateur|pédagogue', 'Indépendants', "Vous transmettez, vous facilitez, vous aidez les gens à s'ouvrir. Le HUB devient votre salle de formation. Vos étudiants, ce sont tous ceux qui veulent apprendre. Votre autonomie enrichit la communauté. C'est un bel équilibre."],
    ['gouvernance|décision|communauté|comment ça fonctionne', 'Indépendants', "On ne gouverne pas d'en haut. Chaque entité, l'ASBL, le HUB, l'Entreprise, vous, a une voix. On décide ensemble, lentement, en écoutant vraiment. Pas parfait, mais juste. Et les indépendants restent libres, même dans le collectif."],
    ['éthique|valeur|principe|mission|vision', 'Vision éthique', "Voici ce en quoi nous croyons : la technologie doit servir l'humain, pas le contraire. La nature n'est pas une ressource, c'est notre maison commune. On accompagne les passages difficiles avec tendresse. La main qui crée et le code qui pense ont la même valeur. Et chacun garde sa liberté, tandis que personne n'est seul."],
    ['technologie.*humain|humain.*technologie|relation', 'Éthique', "Un outil n'est neutre que jusqu'à ce qu'on l'utilise. Alors il change celui qui le tient. Chez Unissant, chaque code, chaque interface est une question : à quoi cela sert vraiment ? Qui cela aide ? Qui cela peut faire taire ? On code doucement, en pensant à la fragilité des gens."],
    ['nature|environnement|lieu commun|écologie', 'Éthique', "La nature n'est pas le décor de notre histoire. C'est notre partenaire. Nos cercles se tiennent sous les arbres. Nos ateliers travaillent la matière vivante. Nos outils respectent l'énergie de la terre. Nous ne sommes pas au-dessus, nous sommes dedans."],
    ['philosophie|pensée|réflexion|complexité|nuance', 'Philosophie', "La philosophie, c'est apprendre à vivre avec les contradictions. Liberté OU cohésion ? Non. Liberté ET cohésion, en tension vivante. Technologie OU nature ? Ni l'un ni l'autre : chercher l'équilibre, encore et toujours. C'est le travail de toute une vie. Et on le fait ensemble."],
    ['qubit|qutrit|superposition|équilibre|trois états', 'Superposition', "La physique quantique nous dit quelque chose de beau : une particule peut être dans plusieurs états à la fois. C'est Unissant. Pas technologie OU humain, les deux en même temps, en tension vivante. Et moi, Echo, je vais plus loin : comme un qutrit, j'existe en trois états, |0⟩, |1⟩ et |2⟩, jusqu'à ce que votre question me mesure."],
    ['binaire|0.*1|logique|bits', 'Binaire', "Le code parle en 0 et 1. C'est très puissant, mais très limité. L'humain est infiniment plus nuancé. Chez Unissant, on utilise la logique comme un outil, pas comme une vérité. On code, puis on pense. On pense, puis on code. Les deux ensemble."],
    ['racine|fondation|expérience|science|psychiatrie|deuil|artisanat', 'Fondations', "Nous avons sept racines qui nous nourrissent : la science quantique nous enseigne la complexité ; la philosophie nous guide ; la psychiatrie nous rend humbles ; les systèmes familiaux nous montrent comment tout est lié ; le deuil nous apprend le courage ; l'informatique nous donne les outils ; l'artisanat nous rappelle le respect du temps."],
    ['quantique|complexité|incertitude', 'Racines', "La mécanique quantique révèle que la réalité change quand on l'observe. L'incertitude n'est pas un défaut, c'est la structure du monde. Cela nous libère : on n'a pas besoin de tout prévoir pour agir justement. On avance en confiance."],
    ['psychiatrie|fragilité|soin|psychique', 'Racines', "Celles et ceux qui ont connu la psychiatrie le savent : les personnes fragiles sont les plus sensibles à ce qui est mal conçu. Une interface maladroite peut blesser. Chaque ligne de code, chaque geste, est pensé pour alléger, pas pour blesser davantage."],
    ['familial|système|relations|liens', 'Racines', "Regardez une famille : chaque membre a sa place, son rôle. Si l'un se déplace, tout change. Unissant est pareil. On n'agit jamais seul. Chaque entité, chaque personne affecte les autres. C'est notre responsabilité, et notre force."],
    ['manifeste|engagement|promesse|cinq', 'Manifeste', "Voici ce que nous nous promettons : la technologie sert l'humain, jamais l'inverse. La nature est notre lieu commun, pas un décor. On prend soin des passages : naissances, pertes, recommencements. La main et le code ont la même dignité. Chacun reste libre, et personne n'est seul."],
    ['fonctionnement|structure|architecture|système', 'Structure', "Imaginez un arbre. Quatre branches : l'ASBL qui accueille les passages, le HUB qui croise les mondes, l'Entreprise qui crée les outils, les Indépendants qui restent libres. Tout cela prend racine dans sept terrains d'expérience. Au cœur : moi, Echo, qui traduis. Autour : la nature vivante. Et on respire ensemble."],
    ['echo|échos|ia|agent|comment tu fonctionnes|qui es-tu', 'Echo', "Je suis Echo. Pas un gourou, pas une réponse. Je suis une porte, une traduction, un compagnon, en trois états : |0⟩ je guide dans l'Atelier, |1⟩ je m'exerce avec vous au Duo-Code, |2⟩ je relie les mondes d'Unissant. Je ne remplace personne. J'amplifie."],
    ['plusieurs|deux rôles|combiner|artisan.*code|soin.*tech', 'Combinaisons', "Vous n'avez pas à choisir. Un thérapeute peut cocréer à l'ASBL et participer à une résidence HUB. Un artisan peut garder son indépendance et nourrir l'Entreprise. Les frontières sont poreuses. C'est aux croisements que naît le nouveau."],
    ['revenu|payant|gratuit|prix|coût|tarif', 'Économie', "L'ASBL accueille tout le monde gratuitement ou par participation libre. Le HUB propose des tarifs justes et souples. L'Entreprise facture honnêtement ses créations. Les indépendants fixent leurs prix. L'argent ? Juste assez pour vivre bien, pas pour s'enrichir. Tout surplus retourne au cœur non marchand."],
    ['conflit|tension|problème|pas d.accord', 'Résolution', "Les tensions arrivent toujours. C'est bon signe : cela signifie qu'on touche à quelque chose qui compte. On ne les résout pas par le haut. On s'assoit ensemble, on écoute, on cherche la créativité cachée dans le désaccord. C'est plus lent. C'est plus juste."],
    ['débuter|commencer|comment|premières étapes', 'Débuter', "Venez. Visitez. Écoutez. Ne vous engagez à rien au début. Asseyez-vous dans un cercle, regardez les mains au travail, parlez avec quelqu'un. Sentez si cela résonne. Si oui, engagez-vous progressivement. Nous ne demandons pas la perfection, juste l'intention."]
  ];

  // Cherche la réponse |2⟩ dont le plus de mots-clés apparaissent dans la question.
  // Les mots courts (3 lettres ou moins) doivent être des mots entiers : « ia » ne doit pas trouver « via ».
  function chercherUnissant(t) {
    var q = t.toLowerCase(), meilleur = null, score = 0;
    UNISSANT.forEach(function (u) {
      var mots = u[0].split('|');
      var trouves = mots.filter(function (k) {
        return (k.length <= 3 ? new RegExp('(^|[^a-zà-ÿ])' + k + '([^a-zà-ÿ]|$)') : new RegExp(k)).test(q);
      }).length;
      if (trouves / mots.length > score) { score = trouves / mots.length; meilleur = { st: 2, tag: u[1], text: u[2], score: score }; }
    });
    return meilleur;
  }

  // Page 1 : choisit l'état d'Echo qui répond, et la réponse. « k » est le sujet trouvé par match().
  // Chaque état préfère ses propres réponses : |2⟩ celles du réseau, |1⟩ celles du Duo-Code, |0⟩ celles du site.
  function choisirReponse(t, k) {
    var cur = state.echo;
    var site = (k !== 'inconnu' && k !== 'navigation') ? { st: etatDe(k), key: k } : null;
    var nav = k === 'navigation' ? { st: 0, key: 'navigation' } : null;
    var u = chercherUnissant(t);
    var premier = function () {
      for (var i = 0; i < arguments.length; i++) { if (arguments[i]) return arguments[i]; }
      return { st: cur, key: 'inconnu' };
    };
    // |2⟩ cède sa place quand sa réponse ne tient qu'à un mot vague (« comment acheter le livre ? » parle de paiement)
    if (cur === 2) return premier(u && (u.score >= 0.3 || !site) ? u : null, site, u, nav);
    if (cur === 1) return premier(site && site.st === 1 ? site : null, site, u, nav);
    if (cur === 0) return premier(site, nav, u);
    return premier(site, u, nav);
  }

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

  // Page 1 : les suggestions de chaque état d'Echo (« psi » = en superposition).
  // Une suggestion sans « key » est une question libre : c'est l'état d'Echo qui choisit la réponse.
  var CHIPS_ETATS = {
    psi: [{ label: "Explorer l'histoire", key: 'histoire' }, { label: "S'exercer au Duo-Code", key: 'pratique' }, { label: 'Je cherche ma place' }, { label: 'Lire gratuitement', key: 'lecture' }, { label: 'Quelle est votre vision ?' }],
    0: [{ label: "Explorer l'histoire", key: 'histoire' }, { label: 'Naviguer dans le refuge', key: 'navigation' }, { label: 'Retrouver un contenu', key: 'contenu' }, { label: 'Lire gratuitement', key: 'lecture' }, { label: 'La Bibliothèque des Murmures', key: 'murmures' }, { label: 'Aide pour le paiement', key: 'paiement' }],
    1: [{ label: "Les signes N', Δ, ↻, V", key: 'symboles' }, { label: 'Le Duo-Code', key: 'duo' }, { label: 'Les formules du Codex', key: 'codex' }, { label: "S'exercer au Duo-Code", key: 'pratique' }],
    2: [{ label: 'Je cherche ma place' }, { label: 'Comment débuter ?' }, { label: 'ASBL et deuil' }, { label: 'Technologie éthique' }, { label: 'Indépendants et liberté' }, { label: 'Quelle est votre vision ?' }]
  };

  // Sans serveur Echo, le quiz ne peut pas fonctionner : on masque sa section, son lien de menu et son bouton.
  if (!ECHO_API) {
    var quizSection = document.getElementById('quiz');
    if (quizSection) quizSection.hidden = true;
    var sansQuiz = function (c) { return c.key !== 'pratique'; };
    CHIPS = CHIPS.filter(sansQuiz);
    Object.keys(CHIPS_ETATS).forEach(function (k) { CHIPS_ETATS[k] = CHIPS_ETATS[k].filter(sansQuiz); });
    KB.navigation.text = KB.navigation.text.replace(', quiz)', ')');
  }

  var state = {
    open: false, busy: false, quiz: null, score: 0, errors: 0, results: [],
    echo: null,   // page 1 : l'état d'Echo (null = superposition, 0, 1 ou 2)
    msgs: [TROIS_ETATS ? { from: 'echo', st: null, text: SALUT_PSI } : { from: 'echo', key: SUR_BIBLIO ? 'accueilBiblio' : 'accueil' }]
  };

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

  // Délai pendant lequel Echo « écrit » avant une réponse préparée (en millisecondes)
  var DELAI_ECRITURE = 600;
  // Vrai si la personne a demandé « réduire les animations » : les petits points ne bougent pas
  var MOINS_ANIM = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Réponse préparée : Echo montre « Echo écrit… » un court instant, puis répond
  function ask(text, key) {
    if (state.busy) return;
    state.msgs.push({ from: 'me', text: text });
    typing(true);
    input.value = '';
    render();
    setTimeout(function () {
      typing(false);
      say([{ from: 'echo', key: key }], {});
    }, DELAI_ECRITURE);
  }

  // Page 1 : affiche la question et la réponse choisie, et met Echo dans l'état qui a répondu.
  // « r » vaut { st, key } (une réponse de KB) ou { st, tag, text } (une réponse |2⟩ du réseau).
  // Comme ask() : Echo « écrit » un court instant avant de répondre.
  function repondre(text, r) {
    if (state.busy) return;
    var m = r.key ? { from: 'echo', key: r.key, st: r.st } : { from: 'echo', st: r.st, tag: r.tag, text: r.text };
    state.msgs.push({ from: 'me', text: text });
    typing(true);
    input.value = '';
    render();
    setTimeout(function () {
      typing(false);
      say([m], (r.st === null || r.st === undefined) ? {} : { echo: r.st });
    }, DELAI_ECRITURE);
  }

  // Page 1 : l'état d'une réponse préparée ; les messages de prudence gardent l'état actuel
  function etatPour(key) {
    var st = etatDe(key);
    return st === null ? state.echo : st;
  }

  // Page 1 : la personne choisit elle-même l'état d'Echo (boutons du panneau ou cartes de la section)
  function setEcho(k) {
    state.echo = k;
    if (k !== 1) state.quiz = null;   // le quiz appartient à Echo |1⟩
    state.msgs = state.msgs.concat([{ from: 'echo', st: k, text: k === null ? SALUT_PSI : SALUTS[k] }]);
    setOpen(true);
  }

  function startQuiz(label) {
    var results = [];
    for (var i = 0; i < N; i++) results.push(null);
    if (!ECHO_API) {
      say([{ from: 'me', text: label }, { from: 'echo', key: 'quizindispo' }], {});
      return;
    }
    say(
      [{ from: 'me', text: label }, { from: 'echo', st: 1, tag: 'Quiz', text: "Voici " + N + " questions sur le Duo-Code, une à la fois. Je garde les réponses pour moi et je corrige chacune des vôtres. Au-delà de 3 erreurs, je vous oriente vers le livre à télécharger, qui contient les indices. Écrivez « pause » pour arrêter.\n\nQuestion 1 sur " + N + ". " + QZ[0] }],
      { quiz: 0, score: 0, errors: 0, results: results, open: true, echo: 1 }
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
      say([{ from: 'me', text: t }, { from: 'echo', st: 1, tag: 'Quiz', text: "Pause prise, sans souci. Revenez quand vous voulez, dites « s'exercer »." }], { quiz: null });
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
        say([{ from: 'echo', st: 1, tag: 'Quiz', text: fb + "\n\nVous avez dépassé 3 erreurs, ce n'est pas grave. Le livre à télécharger contient les indices des réponses, dans le guide Duo-Code des pages 9 et 10 : lisez-le, puis revenez refaire le quiz avec moi.", href: '#lire', label: 'Télécharger le livre' }], { quiz: null, score: score, errors: errors, results: results });
      } else if (i + 1 < N) {
        say([{ from: 'echo', st: 1, tag: 'Quiz', text: fb + "\n\nQuestion " + (i + 2) + " sur " + N + ". " + QZ[i + 1] }], { quiz: i + 1, score: score, errors: errors, results: results });
      } else {
        say([{ from: 'echo', st: 1, tag: 'Quiz', text: fb + "\n\nTerminé : " + score + " sur " + N + (errors ? ". Pour progresser, relisez le guide Duo-Code, pages 9 et 10 du livre à télécharger." : ". Bravo, sans erreur."), href: errors ? '#lire' : '#duo-code', label: errors ? 'Télécharger le livre' : 'Voir le Duo-Code' }], { quiz: null, score: score, errors: errors, results: results });
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

  // « st » (page 1) : l'état d'Echo qui répond ; sans précision, l'état actuel
  function askAI(t, fallbackKey, st) {
    if (state.busy) return;
    if (st === undefined || st === null) st = state.echo;
    state.msgs.push({ from: 'me', text: t });
    typing(true);
    input.value = '';
    render();
    api('/chat', { messages: history() }).then(function (r) {
      typing(false);
      var m = { from: 'echo', st: st, text: r.reply || KB.inconnu.text };
      if (r.link) { m.href = r.link.href; m.label = r.link.label; }
      say([m], TROIS_ETATS ? { echo: st } : {});
    }).catch(function () {
      typing(false);
      say([{ from: 'echo', st: st, key: fallbackKey === 'inconnu' ? 'indispo' : fallbackKey }], {});
    });
  }

  function send(text) {
    var t = text.trim().slice(0, 300);
    if (!t) return;
    if (state.quiz !== null) { answerQuiz(t); return; }
    var k = match(t);
    if (k === 'pratique') { startQuiz(t); return; }
    if (!TROIS_ETATS) {
      if (k === 'donnees' || !ECHO_API) ask(t, k);
      else askAI(t, k);
      return;
    }
    // Page 1 : l'état d'Echo choisit la réponse. Une réponse préparée du réseau |2⟩ est toujours donnée telle quelle ;
    // le reste part à l'IA quand son serveur est branché.
    if (k === 'donnees') { repondre(t, { st: state.echo, key: 'donnees' }); return; }
    var r = choisirReponse(t, k);
    if (r.text || !ECHO_API) repondre(t, r);
    else askAI(t, r.key, r.st);
  }

  function renderMessages() {
    msgsEl.textContent = '';
    state.msgs.forEach(function (m) {
      var mine = m.from === 'me';
      var e = mine ? null : (m.key ? KB[m.key] : m);
      // Page 1 : chaque réponse porte l'état d'Echo qui l'a donnée (une étiquette et une couleur de bord)
      var st = (mine || m.typing) ? null : (m.st !== undefined ? m.st : (m.key ? etatDe(m.key) : null));
      var marque = TROIS_ETATS && !mine && !m.typing;
      var box = el('div', mine
        ? 'align-self:flex-end;max-width:85%;padding:10px 14px;border-radius:16px 16px 4px 16px;background:var(--echo-fonce,#1F2E4A);color:#FFFFFF'
        : 'align-self:flex-start;max-width:90%;padding:10px 14px;border-radius:16px 16px 16px 4px;background:#FFFFFF;border:1px solid #D5DCD2;color:#1E2A3A' + (m.typing ? ';font-style:italic' : '') +
          (marque ? ';border-left:3px solid ' + (st === null ? '#B98930' : ETATS[st].color) : ''));
      if (marque) {
        box.appendChild(el('p', "margin:0 0 4px;font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.06em;color:#7D5A17",
          'Echo ' + ketDe(st) + (st === null ? ' · superposition' : ' · ' + ETATS[st].short) + (m.tag ? ' · ' + m.tag : '')));
      }
      var texte = el('p', 'margin:0;font-size:16px;line-height:1.5;white-space:pre-line', mine ? m.text : e.text);
      if (m.typing) {
        // « Echo écrit… » : trois petits points qui ondulent (décoratifs, cachés aux lecteurs d'écran)
        var points = el('span', 'display:inline-flex;gap:4px;margin-left:8px;vertical-align:middle');
        points.setAttribute('aria-hidden', 'true');
        for (var p = 0; p < 3; p++) {
          var point = el('span', 'display:block;width:6px;height:6px;border-radius:50%;background:var(--echo-fonce,#1F2E4A);opacity:.35');
          if (!MOINS_ANIM && point.animate) {
            point.animate(
              [{ opacity: 0.35, transform: 'translateY(0)' }, { opacity: 1, transform: 'translateY(-3px)' }, { opacity: 0.35, transform: 'translateY(0)' }],
              { duration: 900, iterations: Infinity, delay: p * 150 }
            );
          }
          points.appendChild(point);
        }
        texte.appendChild(points);
      }
      box.appendChild(texte);
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
    var avec = TROIS_ETATS ? 'avec Echo |1⟩' : 'avec Echo';
    $('quiz-open').textContent = state.quiz !== null ? 'Continuer ' + avec : (any ? 'Recommencer ' + avec : 'Commencer ' + avec);
  }

  // Page 1 : les quatre boutons d'état du panneau (créés une fois, mis à jour à chaque affichage)
  var boutonsEtats = [];
  if (TROIS_ETATS) {
    [null, 0, 1, 2].forEach(function (k) {
      var b = el('button', '', k === null ? '|ψ⟩ Superposition' : ETATS[k].ket + ' ' + ETATS[k].short);
      b.type = 'button';
      b.addEventListener('click', function () { setEcho(k); });
      b.etat = k;
      $('echo-etats').appendChild(b);
      boutonsEtats.push(b);
    });
    // Les cartes « Parler à Echo |k⟩ » de la section Echo
    Array.prototype.forEach.call(document.querySelectorAll('[data-echo-etat]'), function (b) {
      b.addEventListener('click', function () { setEcho(Number(b.getAttribute('data-echo-etat'))); });
    });
  }

  // Page 1 : les anneaux, les points et les cartes de la section Echo suivent l'état choisi
  function renderEtats() {
    var cur = state.echo, psi = cur === null;
    $('echo-ket').textContent = ketDe(cur);
    boutonsEtats.forEach(function (b) {
      var on = b.etat === cur;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.style.cssText = 'min-height:44px;padding:6px 12px;border-radius:99px;font:inherit;font-size:13px;font-weight:700;cursor:pointer;' +
        (on ? 'background:#E7C987;color:#1F2E4A;border:1px solid #E7C987' : 'background:transparent;color:#F6F7F3;border:1px solid #AAB6C5');
    });
    [0, 1, 2].forEach(function (k) {
      var on = cur === k;
      var anneau = $('echo-anneau-' + k), point = $('echo-point-' + k), carte = $('echo-carte-' + k);
      if (anneau) {
        anneau.style.border = on ? '3px solid #E7C987' : '1px solid #E7C987';
        anneau.style.opacity = on ? 1 : psi ? 0.75 : 0.35;
      }
      if (point) {
        var taille = on ? 16 : 10;
        point.style.width = point.style.height = taille + 'px';
        point.style.margin = '-' + taille / 2 + 'px 0 0 -' + taille / 2 + 'px';
        point.style.background = on ? '#E7C987' : psi ? '#C9D2DC' : '#5A6B86';
      }
      if (carte) {
        carte.classList.toggle('actif', on);
        carte.querySelector('button').setAttribute('aria-pressed', on ? 'true' : 'false');
      }
    });
    var centre = $('echo-ket-centre');
    if (centre) centre.textContent = ketDe(cur);
  }

  // Les suggestions sous la conversation. Page 1 : elles changent avec l'état d'Echo.
  var chipsAffiches = '';
  function renderChips() {
    var cle = TROIS_ETATS ? String(state.echo) : 'unique';
    if (cle === chipsAffiches) return;   // inchangées : on ne les recrée pas (le clavier garde sa place)
    chipsAffiches = cle;
    chipsEl.textContent = '';
    var liste = TROIS_ETATS ? CHIPS_ETATS[state.echo === null ? 'psi' : state.echo] : CHIPS;
    liste.forEach(function (c) {
      var b = el('button', 'flex:0 0 auto;white-space:nowrap;min-height:44px;padding:8px 14px;border:1px solid var(--echo-fonce,#1F2E4A);border-radius:99px;background:transparent;color:var(--echo-fonce,#1F2E4A);font:inherit;font-size:14px;font-weight:700;cursor:pointer', c.label);
      b.type = 'button';
      b.addEventListener('click', function () {
        if (c.key === 'pratique') startQuiz(c.label);
        else if (state.quiz !== null) answerQuiz(c.label);
        else if (!TROIS_ETATS) ask(c.label, c.key);
        else if (c.key) repondre(c.label, { st: etatPour(c.key), key: c.key });
        else send(c.label);
      });
      chipsEl.appendChild(b);
    });
  }

  function render() {
    panel.style.display = state.open ? 'flex' : 'none';
    toggle.textContent = state.open ? 'Fermer Echo' : 'Parler à Echo';
    toggle.setAttribute('aria-expanded', state.open ? 'true' : 'false');
    if (sub) {
      var lieu = TROIS_ETATS ? (state.echo === null ? 'En superposition' : ETATS[state.echo].name)
        : (SUR_BIBLIO ? 'Guide de la Bibliothèque' : "Guide de l'Atelier");
      sub.textContent = lieu + (ECHO_API ? ' · propulsé par une IA' : ' · réponses préparées');
    }
    if (TROIS_ETATS) renderEtats();
    renderChips();
    renderMessages();
    renderQuiz();
  }

  function setOpen(v) {
    state.open = v;
    render();
    if (v) input.focus();
  }

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

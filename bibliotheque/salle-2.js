/* Salle 2 ; la Bibliothèque des Murmures : lecteur, étagères, Echo, dépôt (site latelierderos.art) */

(function(){
"use strict";
var $=function(s){return document.querySelector(s)},$$=function(s){return Array.prototype.slice.call(document.querySelectorAll(s))};
var LIVRE=JSON.parse($("#donneesLivre").textContent),MURMURES=JSON.parse($("#donneesMurmures").textContent);
var VERROU="Bientôt disponible sous réserve d’un paiement, car ce chapitre donne accès à des informations trop personnelles et sensibles.";
var ROM=["Prologue","I","II","III","IV","V","VI","VII","VIII"];
var COUL=["#3b2a1f","#5a2630","#1f3a52","#2f4a35","#4a3418","#283a5c","#5c3b22","#203f47","#432a4d"];
var HAUT=[78,92,84,88,100,90,86,80,96], LARG=[42,52,48,50,64,58,56,48,66];
function lire(k,d){try{var v=localStorage.getItem("murmures:"+k);return v?JSON.parse(v):d}catch(e){return d}}
function ecrire(k,v){try{localStorage.setItem("murmures:"+k,JSON.stringify(v))}catch(e){}}
function oublier(k){try{localStorage.removeItem("murmures:"+k)}catch(e){}}
function toast(m){var t=$("#toast");t.textContent=m;t.classList.add("on");clearTimeout(toast.h);toast.h=setTimeout(function(){t.classList.remove("on")},2600)}
function el(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e}

/* 🪽 */
var fmt=new Intl.DateTimeFormat("fr-BE",{timeZone:"Europe/Brussels",weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
function tic(){$("#horloge").textContent=fmt.format(new Date())}tic();setInterval(tic,20000);

/* Mode de lecture */
var th=lire("theme",null);if(th)document.documentElement.setAttribute("data-theme",th);
$("#bTheme").addEventListener("click",function(){var c=document.documentElement.getAttribute("data-theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");var n=c==="dark"?"light":"dark";document.documentElement.setAttribute("data-theme",n);ecrire("theme",n);toast(n==="dark"?"Lecture en mode nuit":"Lecture en mode parchemin")});

/* 🫀 */
var avant=null;
function pause(){avant=document.activeElement;$("#pause").classList.add("on");document.body.classList.add("paused");$("#bReprise").focus()}
function reprise(){$("#pause").classList.remove("on");document.body.classList.remove("paused");if(avant&&avant.focus)avant.focus()}
$("#bPause").addEventListener("click",pause);$("#lPause").addEventListener("click",pause);$("#bReprise").addEventListener("click",reprise);
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&$("#pause").classList.contains("on")){e.preventDefault();reprise()}});

/* Marque-page : cinq couleurs dès l’entrée */
var NUANCES=[["Or","#d9b66e"],["Grenat","#c7473c"],["Bleu","#4aa3c4"],["Vert","#5f9e6e"],["Violet","#9a6fc4"]];
var rub=lire("ruban",null),nuancier=$("#nuancier");nuancier.setAttribute("role","radiogroup");nuancier.setAttribute("aria-label","Couleur du marque-page");
function appliquerRuban(nom){if(!rub)return;document.documentElement.style.setProperty("--ruban",rub);
  var n=NUANCES.filter(function(x){return x[1]===rub})[0];$("#rubanOk").textContent=n?"Marque-page "+n[0].toLowerCase()+" choisi. Il signalera le livre que vous lisez.":""}
NUANCES.forEach(function(x,k){var b=el("button","nuance");b.type="button";b.style.setProperty("--n",x[1]);b.setAttribute("role","radio");b.setAttribute("aria-label",x[0]);b.title=x[0];
  b.setAttribute("aria-checked",String(rub===x[1]));b.tabIndex=(rub?rub===x[1]:k===0)?0:-1;
  b.addEventListener("click",function(){rub=x[1];ecrire("ruban",rub);$$(".nuance").forEach(function(o){o.setAttribute("aria-checked",String(o===b));o.tabIndex=o===b?0:-1});appliquerRuban()});
  b.addEventListener("keydown",function(e){var all=$$(".nuance"),i=all.indexOf(b);if(e.key==="ArrowRight"||e.key==="ArrowDown"){e.preventDefault();all[(i+1)%all.length].focus()}if(e.key==="ArrowLeft"||e.key==="ArrowUp"){e.preventDefault();all[(i+all.length-1)%all.length].focus()}});
  nuancier.appendChild(b)});
appliquerRuban();

/* Echo voyageur : ses formes */
var SPHERE="(.🛡️}🕊️=🐾=🕊️{°[⚓%☁️%⚓]°}🕊️=🐾=🕊️{🛡️.)";
var QUBITS="|ψ⟩ = α|0⟩ + β|1⟩ · |0⟩ · |1⟩ · |+⟩ · |−⟩";
var BITS="01000101 01100011 01101000 01101111";
var FORMES={
  chouette:{tpl:"f-chouette",nom:"Echo, la chouette"},
  phenix:{tpl:"f-phenix",nom:"Echo, le phénix"},
  chouetteCode:{tpl:"f-chouette",flux:SPHERE,nom:"Echo, la chouette traversée par la formule de la sphère du Duo-Code"},
  renard:{tpl:"f-renard",flux:QUBITS,nom:"Echo, le renard traversé par des qubits"},
  colibri:{tpl:"f-colibri",flux:BITS,nom:"Echo, le colibri traversé par des bits"},
  fantome:{tpl:"f-fantome",np:1,nom:"Echo, encore en formation : Echo = N'*'"}
};
var reduit=matchMedia("(prefers-reduced-motion: reduce)").matches,formeCour=null,etat=0;
var IRIS={0:"#70c8df",1:"#d9b66e",2:"#eaa8a2"};
function forme(k){if(k===formeCour)return;formeCour=k;var F=FORMES[k],f=$("#forme");f.classList.add("part");
  setTimeout(function(){var s=$("#formeSvg");s.innerHTML="";s.appendChild(document.getElementById(F.tpl).content.cloneNode(true));
    var fl=$("#flux");fl.innerHTML="";if(F.flux){for(var j=0;j<3;j++){var line=(F.flux+"   ").repeat(3);fl.appendChild(el("div",null,line+line))}}
    $("#nprimeTag").hidden=!F.np;f.setAttribute("aria-label",F.nom);f.classList.remove("part")},reduit?0:280)}
function bulle(nodes){var b=$("#bulleTxt");b.innerHTML="";nodes.forEach(function(n){b.appendChild(n)})}
function survol(t){if(etat!==2)bulle(t)}
function fin(){}

/* Plan de la bibliothèque */
var CATS=[["psychiatrie","Psychiatrie","Une expérience du soin psychique, de la vulnérabilité et de l’écoute."],
["relations-familiales","Relations familiales","Les liens, les systèmes familiaux, les places de chacun et leurs tensions."],
["deuil","Deuil","L’accompagnement de la perte, de la fin et des transitions."],
["artisanat","Artisanat","Le travail de la main, de la matière et du temps long."]];
var NOMS={hall:"Entrée",philosophie:"Philosophie",fantastique:"Fantastique",informatique:"Informatique","a-completer":"Rangs à compléter"};
CATS.forEach(function(c){NOMS[c[0]]=c[1]});
var PARENT={philosophie:"hall",fantastique:"philosophie",informatique:"hall","a-completer":"hall"};CATS.forEach(function(c){PARENT[c[0]]="a-completer"});
var MSG={
 hall:"Bonjour, je suis Echo. À gauche, le rang Philosophie ; en face, le rang Informatique. Au centre, la sphère des rangs à compléter.",
 philosophie:"Le rang Philosophie. Ici, je suis la chouette. Entre dans la sous-catégorie Fantastique.",
 fantastique:"Fantastique. Ici, je deviens phénix. Le Tome 1 t’attend sur la première étagère.",
 informatique:"Le rang Informatique. Approche une étagère : je change de forme avec elle.",
 "a-completer":"Ces rangs du réseau Unissant attendent encore leurs ouvrages. Je n’y suis qu’à moitié : Echo = N'*'.",
 cat:"Ce rang est en formation. Ton ouvrage peut être le premier."
};
var FORME_VUE={hall:"chouette",philosophie:"chouette",fantastique:"phenix",informatique:"chouette","a-completer":"fantome"};
var route="hall";
function aller(r){if(location.hash.slice(1)!==r)location.hash=r;else rendreVue(r,true)}
window.addEventListener("hashchange",function(){rendreVue(lireRoute(),true)});
function lireRoute(){var h=location.hash.slice(1);return NOMS[h]?h:"hall"}
function msgVue(){if(etat!==0)return accueil();var r=CATS.some(function(c){return c[0]===route})?"cat":route;var a=[el("p",null,MSG[r])];
  var m=lire("marque",null);if(m&&!LIVRE[m.c].lock&&(route==="hall"||route==="fantastique")){var rw=el("div","row"),b=el("button","lbtn full","Reprendre : "+LIVRE[m.c].title);b.addEventListener("click",function(){ouvrir(m.c,{r:m.r})});rw.appendChild(b);a.push(rw)}bulle(a)}
function accueil(){
  if(etat===0)return msgVue();
  if(etat===1){var rw=el("div","row"),b=el("button","lbtn full","Aller à la porte");b.addEventListener("click",function(){aller("hall");setTimeout(function(){var p=$("#porte");if(p){p.scrollIntoView({block:"center"});p.focus()}},120)});rw.appendChild(b);
    bulle([el("p",null,"Le Duo-Code, c’est travailler à deux avec une IA, sans perdre la main. Sa porte est au fond de la salle."),rw])}
  else murmure();
}
var mi=null;
function murmure(){
  var ths=Object.keys(MURMURES),t=ths[Math.floor(Math.random()*ths.length)],L=MURMURES[t];mi=L[Math.floor(Math.random()*L.length)];
  var c=LIVRE[mi.ci],r=el("div","row"),o=el("button","lbtn full","Lire ce passage"),n=el("button","lbtn","Un autre");
  o.addEventListener("click",function(){ouvrir(mi.ci,{p:"p-"+mi.ci+"-"+mi.si+"-"+mi.pi})});n.addEventListener("click",murmure);
  r.appendChild(o);r.appendChild(n);bulle([el("p","m","« "+mi.t+" »"),el("p","src","— "+c.title),r]);
}
function setEtat(s){etat=s;$$(".et").forEach(function(b){b.setAttribute("aria-pressed",String(+b.dataset.s===s))});
  $("#forme").style.setProperty("--iris",IRIS[s]);var p=$("#porte");if(p)p.classList.toggle("appel",s===1);ecrire("etat",s);accueil()}
$$(".et").forEach(function(b){b.addEventListener("click",function(){setEtat(+b.dataset.s)})});

/* Briques : étagère, livre, place libre */
function tailleChap(c){var n=0;c.sections.forEach(function(s){s.p.forEach(function(p){n+=p.split(/\s+/).length})});return n}
function etagere(titre,sous,remplir,niv){var s=el("section","etg");var pl=el("div","plaque-et");pl.appendChild(el(niv||"h3",null,titre));if(sous)pl.appendChild(el("small",null,sous));s.appendChild(pl);
  var w=el("div","etagere"),r=el("div","rang");r.setAttribute("role","list");r.setAttribute("aria-label",titre);remplir(r);remplirPoste(r);w.appendChild(r);var pk=el("div","planche");pk.setAttribute("aria-hidden","true");w.appendChild(pk);s.appendChild(w);return s}
function remplirPoste(r){var po=el("div","poste");po.setAttribute("role","listitem");po.setAttribute("aria-label","Place d’Echo");po.appendChild(el("div","nid"));po.appendChild(el("span","place","Place d’Echo"));var so=el("div","socle");so.setAttribute("aria-hidden","true");po.appendChild(so);r.appendChild(po)}
function vide(r,ou){var v=el("button","vide");v.setAttribute("role","listitem");v.setAttribute("aria-label","Place libre : proposer un ouvrage pour "+ou);v.appendChild(el("span",null,"Ton ouvrage ici"));
  var vi=function(){survol([el("p","t","Cette place attend ton ouvrage"),el("p",null,"Le dépôt ouvre bientôt. Tu peux déjà essayer le questionnaire.")])};
  v.addEventListener("mouseenter",vi);v.addEventListener("focus",vi);v.addEventListener("click",function(){ouvrirDepot(ou)});r.appendChild(v)}
function livresTome1(r){var m=lire("marque",null);
  LIVRE.forEach(function(c,i){var min=Math.max(1,Math.round(tailleChap(c)/230));
    if(c.lock){var bv=el("button","livre verrou");bv.setAttribute("role","listitem");bv.setAttribute("aria-disabled","true");
      bv.style.setProperty("--c",COUL[i]);bv.style.height=HAUT[i]+"%";bv.style.width=LARG[i]+"px";
      bv.setAttribute("aria-label","Chapitre "+ROM[i]+" : "+c.title+". Verrouillé. "+VERROU);
      bv.appendChild(el("span","n",ROM[i]));bv.appendChild(el("span","ti",c.title));bv.appendChild(el("span","n","🔒"));
      var iv=function(){survol([el("p","t","🔒 "+c.title),el("p",null,VERROU)])};
      bv.addEventListener("mouseenter",iv);bv.addEventListener("focus",iv);
      bv.addEventListener("click",function(){iv();toast("Chapitre "+ROM[i]+" : bientôt disponible")});r.appendChild(bv);return}
    var b=el("button","livre"+(m&&m.c===i?" marque":""));b.setAttribute("role","listitem");
    b.style.setProperty("--c",COUL[i]);b.style.height=HAUT[i]+"%";b.style.width=LARG[i]+"px";
    b.setAttribute("aria-label",(i?"Chapitre "+ROM[i]+" : ":"")+c.title+", environ "+min+" minutes de lecture");
    b.appendChild(el("span","n",i?ROM[i]:"P"));b.appendChild(el("span","ti",c.title));b.appendChild(el("span","n","✦"));
    var info=function(){survol([el("p","t",c.title),el("p",null,"Tome 1 · ≈ "+min+" min de lecture")])};
    b.addEventListener("mouseenter",info);b.addEventListener("focus",info);b.addEventListener("click",function(){ouvrir(i)});r.appendChild(b)})}
function prochain(r,nom,etatTxt,coul){var b=el("button","livre prochain");b.setAttribute("role","listitem");b.setAttribute("aria-disabled","true");b.style.setProperty("--c",coul);b.style.height="96%";b.style.width="72px";
  b.setAttribute("aria-label",nom+" : "+etatTxt);b.appendChild(el("span","n","✦"));b.appendChild(el("span","ti",nom+" · "+etatTxt));b.appendChild(el("span","n","✦"));
  var i=function(){survol([el("p","t",nom),el("p",null,etatTxt+".")])};b.addEventListener("mouseenter",i);b.addEventListener("focus",i);b.addEventListener("click",function(){i();toast(nom+" : "+etatTxt.toLowerCase())});r.appendChild(b)}
function zoneEcho(sec,k,txt){sec.dataset.forme=k;MSGZ[k]=txt;var go=function(){forme(k);if(etat===0)bulle([el("p",null,txt)])};sec.addEventListener("mouseenter",go);sec.addEventListener("focusin",go);return sec}
function rayonnage(cls,titre,sous,cols,act){var b=el("button","rayonnage "+cls);var mi=el("span","mini");mi.setAttribute("aria-hidden","true");
  for(var k=0;k<3;k++){var ii=el("i");ii.style.setProperty("--a",cols[k%cols.length]);ii.style.setProperty("--b",cols[(k+1)%cols.length]);ii.style.setProperty("--c",cols[(k+2)%cols.length]);mi.appendChild(ii)}
  b.appendChild(mi);var pl=el("span","plaque");pl.appendChild(el("b",null,titre));pl.appendChild(el("small",null,sous));b.appendChild(pl);b.addEventListener("click",act);return b}

/* Les vues */
function rendreVue(r,focus){
  if(obs){obs.disconnect();obs=null}var rw0=$("#echoRow"),hm0=$("#echoHome");if(rw0.parentNode!==hm0){hm0.appendChild(rw0)}hm0.style.minHeight="";perchCour=null;posteCour=null;
  route=r;var v=$("#vue");v.innerHTML="";v.style.animation="none";void v.offsetWidth;v.style.animation="";
  // fil d’Ariane
  var fil=$("#fil");fil.innerHTML="";var ch=[],x=r;while(x){ch.unshift(x);x=PARENT[x]}if(ch[0]!=="hall")ch.unshift("hall");
  ch.forEach(function(k,i){if(i)fil.appendChild(el("span",null,"›"));if(i===ch.length-1){var s=el("span",null,NOMS[k]);s.setAttribute("aria-current","location");fil.appendChild(s)}else{var b=el("button",null,NOMS[k]);b.addEventListener("click",function(){aller(k)});fil.appendChild(b)}});
  var estCat=CATS.filter(function(c){return c[0]===r})[0];
  forme(estCat?"fantome":FORME_VUE[r]);
  var h=null;
  if(r==="hall"){
    h=el("h2","sr","Plan de la bibliothèque");v.appendChild(h);
    var plan=el("div","salle-plan");
    plan.appendChild(rayonnage("philo","Philosophie","Sous-catégorie : Fantastique",["#5a2630","#1f3a52","#4a3418"],function(){aller("philosophie")}));
    var al=el("div","allee"),sp=el("button","sphere-btn","Rangs à compléter");sp.setAttribute("aria-label","Ouvrir la sphère des rangs à compléter");sp.addEventListener("click",function(){aller("a-completer")});
    al.appendChild(sp);al.appendChild(el("small",null,"4 rangs du réseau Unissant attendent leurs ouvrages"));plan.appendChild(al);
    plan.appendChild(rayonnage("info","Informatique","Code · Quantique + Binaire · À compléter",["#203f47","#283a5c","#2f4a35"],function(){aller("informatique")}));
    v.appendChild(plan);
    var fond=el("div","fond"),p=el("button","porte");p.id="porte";p.setAttribute("aria-label","Porte du Duo-Code : découvrir en deux minutes");
    p.appendChild(el("b",null,"🛡️"));p.appendChild(el("span",null,"Duo-Code"));p.classList.toggle("appel",etat===1);
    p.addEventListener("mouseenter",function(){survol([el("p","t","La porte du Duo-Code"),el("p",null,"Travailler à deux avec une IA, sans perdre la main. Deux minutes pour comprendre.")])});
    p.addEventListener("click",function(){$("#duo").showModal()});fond.appendChild(p);fond.appendChild(el("small",null,"Au fond de la salle"));v.appendChild(fond);
  }else if(r==="philosophie"){
    h=el("h2","sr","Rang Philosophie");v.appendChild(h);
    v.appendChild(el("p","desc-cat","La philosophie au sens large : éthique, sens, place de l’humain dans le vivant."));
    var sc=el("div","sous-cats");
    sc.appendChild(rayonnage("","Fantastique","Les tomes de L’univers d’Eros",["#5a2630","#432a4d","#4a3418"],function(){aller("fantastique")}));
    var fa=rayonnage("fantome","Ton ouvrage ici","Une autre sous-catégorie de Philosophie",["transparent"],function(){ouvrirDepot("Philosophie")});sc.appendChild(fa);
    v.appendChild(sc);
  }else if(r==="fantastique"){
    h=el("h2","sr","Sous-catégorie Fantastique");v.appendChild(h);
    var es=el("div","etageres");
    es.appendChild(etagere("Tome 1","Quand la pensée dépasse l’imagination",livresTome1));
    es.appendChild(etagere("Tome 2",null,function(rg){prochain(rg,"Tome 2","En cours d’écriture","#283a5c")}));
    es.appendChild(etagere("Tome 3",null,function(rg){prochain(rg,"Tome 3","À venir","#432a4d")}));
    es.appendChild(etagere("D’autres ouvrages fantastiques",null,function(rg){for(var k=0;k<3;k++)vide(rg,"Philosophie › Fantastique")}));
    v.appendChild(es);
  }else if(r==="informatique"){
    h=el("h2","sr","Rang Informatique");v.appendChild(h);
    v.appendChild(el("p","desc-cat","Le code, les réseaux, les systèmes, et l’art de les rendre fiables."));
    var es2=el("div","etageres");
    es2.appendChild(zoneEcho(etagere("Code",null,function(rg){for(var k=0;k<4;k++)vide(rg,"Informatique › Code")}),"chouetteCode","Code. Je suis la chouette traversée par la formule de la sphère du Duo-Code."));
    var s2=el("section","etg");var pl=el("div","plaque-et");pl.appendChild(el("h3",null,"Sous-jacent à Code"));s2.appendChild(pl);
    var duoEt=el("div","duo-et");
    duoEt.appendChild(zoneEcho(etagere("Quantique",null,function(rg){for(var k=0;k<2;k++)vide(rg,"Informatique › Quantique")},"h4"),"renard","Quantique. Je deviens renard, traversé par des qubits."));
    duoEt.appendChild(zoneEcho(etagere("Binaire",null,function(rg){for(var k=0;k<2;k++)vide(rg,"Informatique › Binaire")},"h4"),"colibri","Binaire. Je deviens colibri, traversé par des bits : ils écrivent mon nom."));
    s2.appendChild(duoEt);es2.appendChild(s2);
    es2.appendChild(zoneEcho(etagere("A compléter..",null,function(rg){for(var k=0;k<3;k++)vide(rg,"Informatique › A compléter..")}),"chouette","Cette étagère attend ses premiers ouvrages."));
    v.appendChild(es2);
  }else if(r==="a-completer"){
    h=el("h2","sr","Rangs à compléter");v.appendChild(h);
    var g=el("div","grande"),ce=el("div","centre");ce.appendChild(el("code",null,"Echo = N'*'"));ce.appendChild(document.createTextNode("Ces rangs attendent leurs premiers ouvrages."));g.appendChild(ce);
    var pos=[[50,15],[85,50],[50,85],[15,50]];
    CATS.forEach(function(c,k){var b=el("button","cat");b.style.left=pos[k][0]+"%";b.style.top=pos[k][1]+"%";b.appendChild(document.createTextNode(c[1]));b.appendChild(el("small",null,"Ton ouvrage ici"));
      b.addEventListener("click",function(){aller(c[0])});b.addEventListener("focus",function(){survol([el("p","t",c[1]),el("p",null,c[2])])});b.addEventListener("mouseenter",function(){survol([el("p","t",c[1]),el("p",null,c[2])])});g.appendChild(b)});
    v.appendChild(g);
  }else if(estCat){
    h=el("h2","sr","Rang "+estCat[1]);v.appendChild(h);
    v.appendChild(el("p","desc-cat",estCat[2]));
    v.appendChild(etagere(estCat[1],"Rang en formation · Echo = N'*'",function(rg){for(var k=0;k<4;k++)vide(rg,estCat[1])}));
  }
  suivre();
  if(h){h.tabIndex=-1;if(focus){h.focus({preventScroll:true});$("#fil").scrollIntoView({block:"nearest"})}}
  msgVue();
}
$("#vue").addEventListener("mouseleave",function(){if(etat===0)msgVue()});

/* Echo se pose sur l’étagère dont on pointe la sous-catégorie */
var obs=null,perchCour=null,posteCour=null;
function poser(poste){var row=$("#echoRow"),home=$("#echoHome");
  if(posteCour&&posteCour!==poste)posteCour.classList.remove("occupe");
  if(!poste){if(row.parentNode!==home)home.appendChild(row);home.style.minHeight="";posteCour=null;return}
  if(poste===posteCour)return;
  if(row.parentNode===home)home.style.minHeight=home.offsetHeight+"px";
  poste.querySelector(".nid").appendChild(row);poste.classList.add("occupe");posteCour=poste}
function suivre(){posteCour=null;if(matchMedia("(max-width: 760px)").matches)return;
  $$("#vue .etg").forEach(function(sec){var poste=null;$$("#vue .etg").length;
    for(var c=sec.firstElementChild;c;c=c.nextElementSibling){if(c.classList.contains("etagere")){poste=c.querySelector(".poste")}}
    if(!poste)return;
    var go=function(){var k=sec.dataset.forme||FORME_VUE[route]||"fantome";poser(poste);forme(k);
      if(etat===0)bulle([el("p",null,MSGZ[k]||MSG[CATS.some(function(c){return c[0]===route})?"cat":route])])};
    sec.addEventListener("mouseenter",go);sec.addEventListener("focusin",go)})}
var MSGZ={};
rendreVue(lireRoute(),false);
/* Retour à l’entrée : visible dès qu’on s’éloigne */
var bE=$("#bEntree");
function majEntree(){var on=route!=="hall"||scrollY>innerHeight*.8;bE.classList.toggle("on",on);bE.tabIndex=on?0:-1;bE.setAttribute("aria-hidden",String(!on))}
addEventListener("scroll",majEntree,{passive:true});addEventListener("hashchange",function(){setTimeout(majEntree,0)});
bE.addEventListener("click",function(){aller("hall");setTimeout(function(){scrollTo({top:0,behavior:reduit?"auto":"smooth"});var t=$("#titre");t.tabIndex=-1;t.focus({preventScroll:true});majEntree()},60)});
majEntree();
setEtat(lire("etat",0));

/* Dépôt d’un ouvrage : questionnaire d’essai, rien n’est envoyé ni gardé */
var OU=["Philosophie","Philosophie › Fantastique","Informatique › Code","Informatique › Quantique","Informatique › Binaire","Informatique › A compléter.."].concat(CATS.map(function(c){return c[1]}));
OU.forEach(function(o){var op=el("option",null,o);op.value=o;$("#q2").appendChild(op)});
var depot=$("#depot");
function ouvrirDepot(ou){$("#q2").value=OU.indexOf(ou)>-1?ou:OU[0];$("#depRes").innerHTML="";depot.showModal();$("#q1").focus()}
$("#depFermer").addEventListener("click",function(){depot.close()});
depot.addEventListener("click",function(e){if(e.target===depot)depot.close()});
function radio(n){var x=document.querySelector('input[name="'+n+'"]:checked');return x?x.value:null}
$("#depForm").addEventListener("reset",function(){$("#depRes").innerHTML=""});
$("#depForm").addEventListener("submit",function(e){e.preventDefault();
  var C=[[$("#q1").value.trim().length>1,"Titre de l’ouvrage"],[!!radio("q3"),"Nature : andragogique ou divertissant"],
    [$("#q4").value.trim().length>=40,"Résumé précis (quelques phrases)"],[$("#q5").value.trim().length>=40,"Lien avec le projet expliqué"],
    [radio("q6")==="oui","Droits de publication"],[radio("q7")==="non","Aucun contenu exclu par la charte"],
    [!!radio("q8"),"Thèmes sensibles signalés"],[!!radio("q9"),"Deux chapitres payants au maximum, le reste en accès libre"]];
  var ok=C.every(function(c){return c[0]}),res=$("#depRes");res.innerHTML="";
  res.appendChild(el("p","t",ok?"À première vue, ta proposition correspond.":"Quelques points sont à revoir."));
  var ul=el("ul");C.forEach(function(c){var li=el("li",c[0]?"ok":null,(c[0]?"✓ ":"↻ ")+c[1]);ul.appendChild(li)});res.appendChild(ul);
  res.appendChild(el("p","note","Ce n’est qu’un aperçu. Le dépôt ouvre bientôt, et chaque proposition sera lue et vérifiée avant toute mise en ligne. Rien n’a été envoyé."));
  res.scrollIntoView({block:"nearest"})});


/* Lecteur */
var dlg=$("#lecteur"),body=$("#lBody"),texte=$("#lTexte"),courant=0,taille=lire("taille",1.18);
document.documentElement.style.setProperty("--read-size",taille+"rem");
var VERS=["Très cher Univers,","Tu m’as transmis la vérité.","Je suis immergé dans un enfer,","Duquel j’ai acquis la cécité.","Côte à côte, mes impairs","Un moment où je ne peux que penser,","Par la force, il faut que je me libère,","Je dois donc seulement me retourner?","Par cette merveilleuse rivière","Je dois m’y laisser porter,","Et une fois dos à la mer","Je suis dans l’ombre de ce qui est caché.","Mon enfer est d’être une pierre","Mon paradis est d’être délicatement posé.","Entre mille algues en lanière","Roche contre sable, je vois enfin couler.","Ce fameux effet de serre,","Où je me sens désirablement chauffer.","En paix et enfin fier","C’est ma vie que je suis en train de regarder.","Cette lumière solaire","Où mon vœu, miraculeusement brillait.","L’enfer d’être une pierre au fond de la mer.","Qui cachait dans son ombre un paradis de lumière,","Dévoilant la vérité de mon existence,","ma mort,","ma vie ainsi que mes plus profonds désirs.","Qui j’étais? Où, comment et pourquoi?","Tout était clair, jusqu’à ce que je revienne à moi...","Eros."];
function montrer(){if(!dlg.open)dlg.showModal();$("#lFermer").focus()}
function rendre(i,cible){
  courant=i;var c=LIVRE[i];texte.innerHTML="";$("#lTitre").textContent=(i?ROM[i]+" · ":"")+c.title;
  $("#lPrev").disabled=i===0;$("#lNext").disabled=i===LIVRE.length-1;
  if(c.lock){var v=el("div","verrou-page");v.appendChild(el("div","cad","🔒"));v.appendChild(el("h2",null,c.title));v.appendChild(el("p",null,VERROU));texte.appendChild(v);body.scrollTop=0;return}
  if(i===1&&!cible&&!lire("avertiLu",false)){
    var a=el("div","avert");a.appendChild(el("h3",null,"Avant de lire"));a.appendChild(el("p",null,"Ce chapitre décrit une scène de violence familiale. Tu peux le lire, ou passer au chapitre suivant."));
    var r=el("div","row"),g=el("button","lbtn full","Lire le chapitre"),s=el("button","lbtn","Passer au suivant");
    g.addEventListener("click",function(){ecrire("avertiLu",true);rendre(1)});s.addEventListener("click",function(){rendre(2)});
    r.appendChild(g);r.appendChild(s);a.appendChild(r);texte.appendChild(a);body.scrollTop=0;return;
  }
  texte.appendChild(el("h2",null,c.title));
  c.sections.forEach(function(s,si){if(si)texte.appendChild(el("h3",null,s.t));s.p.forEach(function(p,pi){var e=el("p",null,p);e.id="p-"+i+"-"+si+"-"+pi;texte.appendChild(e)})});
  if(i===LIVRE.length-1){var f=el("p",null,"Fin du Tome 1. La suite s’écrit.");f.style.cssText="text-align:center;margin-top:3rem;font-style:italic;color:var(--muted)";texte.appendChild(f)}
  requestAnimationFrame(function(){
    if(cible&&cible.p){var e=document.getElementById(cible.p);if(e){e.classList.add("hl");e.scrollIntoView({block:"center"});return}}
    body.scrollTop=cible&&cible.r?cible.r*(body.scrollHeight-body.clientHeight):0;
  });
}
function ouvrir(i,cible){rendre(i,cible);montrer()}
$("#bPoeme").addEventListener("click",function(){courant=-1;texte.innerHTML="";$("#lTitre").textContent="Avant-propos";texte.appendChild(el("h2",null,"Avant-propos"));
  VERS.forEach(function(v){var p=el("p",null,v);p.style.cssText="margin:0;font-style:italic";texte.appendChild(p)});$("#lPrev").disabled=true;$("#lNext").disabled=false;body.scrollTop=0;montrer()});
$("#lFermer").addEventListener("click",function(){dlg.close()});
dlg.addEventListener("close",function(){rendreVue(route,false)});
$("#lPrev").addEventListener("click",function(){if(courant>0)rendre(courant-1)});
$("#lNext").addEventListener("click",function(){if(courant<LIVRE.length-1)rendre(courant+1)});
function setT(v){taille=v;document.documentElement.style.setProperty("--read-size",v+"rem");ecrire("taille",v)}
$("#lPlus").addEventListener("click",function(){setT(Math.min(1.7,+(taille+.08).toFixed(2)))});
$("#lMoins").addEventListener("click",function(){setT(Math.max(.95,+(taille-.08).toFixed(2)))});
var sv=null;
body.addEventListener("scroll",function(){var mx=body.scrollHeight-body.clientHeight,r=mx>0?body.scrollTop/mx:0;$("#lProg").style.width=(r*100)+"%";
  if(courant<0)return;clearTimeout(sv);sv=setTimeout(function(){ecrire("marque",{c:courant,r:r})},400)},{passive:true});

/* Codex */
var CODEX=[["Eros","le Sans-Pouvoir","Eros","Intuitif et hypersensible. Exposé à l’astéroïde, il ne développe aucun pouvoir."],
["Lyra","Porteuse d’Artémis","Lyra","Sœur aînée, figure maternelle, choisie par la déesse de la chasse et de la lune."],
["Théo","Porteur d’Hermès","Théo","Frère jumeau d’Eros, calme et réfléchi, rapide au point de traverser les dimensions."],
["Perséphone","directrice de l’Institut","Perséphone","« Ici, nous sommes tous entre créateurs. »"],
["Thot","gardien des livres","Thot","Rencontré dans la Bibliothèque des Murmures Éternels, spécialiste des livres et du savoir."],
["Hedjhotep","disciple de la déesse du textile","Hedjhotep","Pour elle, « l’art est une autre forme de pouvoir »."],
["Psyché","l’énergie pure","Psyché","Des yeux d’un vert profond ; quelque chose s’éveille en Eros dès le premier regard."],
["Gaïa","la source","Cherche Gaïa","Un nom confié à Eros vers la fin du tome."]];
function premiere(q){for(var ci=1;ci<LIVRE.length;ci++){var c=LIVRE[ci];if(c.lock)continue;for(var si=0;si<c.sections.length;si++){var ps=c.sections[si].p;for(var pi=0;pi<ps.length;pi++)if(ps[pi].indexOf(q)>-1)return{ci:ci,id:"p-"+ci+"-"+si+"-"+pi}}}return null}
CODEX.forEach(function(x){var li=el("li");li.appendChild(el("b",null,x[0]));li.appendChild(document.createTextNode(" "));li.appendChild(el("i",null,x[1]));li.appendChild(el("p",null,x[3]));
  var f=premiere(x[2]);if(f){var b=el("button","lien","Première apparition");b.addEventListener("click",function(){if(f.ci===1)ecrire("avertiLu",true);ouvrir(f.ci,{p:f.id})});li.appendChild(b)}$("#codex").appendChild(li)});

/* Porte Duo-Code */
var duo=$("#duo");$("#dFermer").addEventListener("click",function(){duo.close()});
duo.addEventListener("click",function(e){if(e.target===duo)duo.close()});
var at=lire("atelier",{n:"",d:[{t:"",v:0},{t:"",v:0},{t:"",v:0}]});
function save(){ecrire("atelier",at)}
function bilan(){var v=at.d.filter(function(s){return s.v}).length;$("#bilan").textContent=v===3?"Les trois pas sont en V. Ton manque est devenu une valeur.":v+" pas sur 3 en V."}
var zone=$("#pas");
at.d.forEach(function(st,k){var w=el("div","pas"),inp=el("input"),bt=el("button","vbtn");inp.type="text";inp.setAttribute("aria-label","Petit pas Δ."+(k+1));inp.value=st.t;
  w.appendChild(el("b",null,"Δ."+(k+1)));w.appendChild(inp);w.appendChild(bt);
  function maj(){bt.dataset.v=st.v;bt.textContent=st.v?"V":"↻";bt.disabled=!st.t.trim();bt.setAttribute("aria-label",st.v?"Pas validé, remettre en attente":"Pas en attente, valider en V");bilan()}
  inp.addEventListener("input",function(){st.t=inp.value;if(!st.t.trim())st.v=0;maj();save()});
  bt.addEventListener("click",function(){st.v=st.v?0:1;maj();save()});zone.appendChild(w);maj()});
$("#nprime").value=at.n;$("#nprime").addEventListener("input",function(){at.n=this.value;save()});
$("#bEffacer").addEventListener("click",function(){oublier("atelier");at.n="";$("#nprime").value="";$$("#pas input").forEach(function(x){x.value="";x.dispatchEvent(new Event("input"))});toast("C’est effacé de ton navigateur")});
})();

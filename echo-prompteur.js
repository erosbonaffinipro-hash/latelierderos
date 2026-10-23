(() => {
  const $ = id => document.getElementById(id);
  const KEY = 'echo.items.v1';

  /* ---------- Stockage local (tout reste sur l'appareil) ---------- */
  const store = {
    load(){ try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; } },
    save(items){ try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {} }
  };
  let items = store.load();
  if (!items) {
    items = [{
      id: 'ex1', type: 'texte', exemple: true, date: Date.now(),
      titre: 'Exemple : la voix d’introduction de Véritania',
      texte: "Avant Véritania, il y avait une vie. La mienne. Des souvenirs épars, des visages et des instants précieux. Mais derrière certaines images, se cachent aussi des épreuves. Dans le roman, un astéroïde transforme le monde. Les survivants deviennent des Porteurs Divins. Mais Éros ne reçoit aucun pouvoir. Il cherche encore sa place. De cette quête naît un passage vers la cité de Véritania. Mon histoire continue. Et je choisis de l’écrire."
    }];
  }
  const persist = () => store.save(items);

  /* ---------- Navigation ---------- */
  function show(view){
    ['v-lib','v-ed','v-ate'].forEach(v => $(v).hidden = v !== view);
    $('tab-lib').setAttribute('aria-selected', view !== 'v-ate');
    $('tab-ate').setAttribute('aria-selected', view === 'v-ate');
  }
  $('tab-lib').onclick = () => { renderLib(); show('v-lib'); };
  $('tab-ate').onclick = () => { renderPrompt(); show('v-ate'); };

  function toast(msg){
    const t = $('toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(() => t.hidden = true, 1800);
  }

  /* ---------- Bibliothèque ---------- */
  const fmtDate = d => new Date(d).toLocaleDateString('fr-BE', { day:'numeric', month:'short', year:'numeric' });
  const countWords = s => (s.trim().match(/\S+/g) || []).length;
  let pendingDelete = null;

  function renderLib(){
    const ul = $('lib-list'); ul.innerHTML = '';
    if (!items.length) { ul.innerHTML = '<li class="empty">Aucun texte pour l\'instant. Crée le premier avec « Nouveau texte ».</li>'; return; }
    [...items].sort((a,b) => b.date - a.date).forEach(it => {
      const li = document.createElement('li');
      const n = countWords(it.texte);
      li.innerHTML = `<div class="info"><div class="t"></div><div class="m">${fmtDate(it.date)} · ${n} mots · ~${Math.max(1, Math.round(n/130))} min</div></div>`;
      li.querySelector('.t').textContent = it.titre || 'Sans titre';
      if (it.type === 'prompt') li.querySelector('.t').insertAdjacentHTML('beforeend', '<span class="chip">Prompt</span>');
      if (it.exemple) li.querySelector('.t').insertAdjacentHTML('beforeend', '<span class="chip">Exemple</span>');
      const mk = (txt, cls, fn) => { const b = document.createElement('button'); b.className = 'btn ' + cls; b.textContent = txt; b.onclick = fn; li.appendChild(b); };
      mk('Lire', 'primary', () => openPrompter(it));
      mk('Modifier', '', () => openEditor(it));
      if (pendingDelete === it.id) {
        mk('Confirmer la suppression', 'danger', () => { items = items.filter(x => x.id !== it.id); persist(); pendingDelete = null; renderLib(); toast('Texte supprimé'); });
      } else {
        mk('Supprimer', 'ghost danger', () => { pendingDelete = it.id; renderLib(); });
      }
      ul.appendChild(li);
    });
  }

  /* ---------- Éditeur ---------- */
  let editing = null;
  function openEditor(it){
    editing = it || null;
    $('ed-h').textContent = it ? 'Modifier le texte' : 'Nouveau texte';
    $('ed-title').value = it ? it.titre : '';
    $('ed-text').value = it ? it.texte : '';
    updateCount(); show('v-ed'); $('ed-title').focus();
  }
  function updateCount(){
    const n = countWords($('ed-text').value);
    $('ed-count').textContent = `${n} mot${n>1?'s':''} · environ ${Math.max(n?1:0, Math.round(n/130))} min de lecture`;
  }
  $('ed-text').addEventListener('input', updateCount);
  $('btn-new').onclick = () => openEditor(null);
  $('ed-back').onclick = () => { renderLib(); show('v-lib'); };
  function saveEditor(){
    const titre = $('ed-title').value.trim() || 'Sans titre', texte = $('ed-text').value;
    if (!texte.trim()) { toast('Le texte est vide'); return null; }
    if (editing) Object.assign(editing, { titre, texte, date: Date.now(), exemple: false });
    else { editing = { id: 'i' + Date.now(), type: 'texte', titre, texte, date: Date.now() }; items.push(editing); }
    persist(); toast('Enregistré'); return editing;
  }
  $('ed-save').onclick = () => { if (saveEditor()) { renderLib(); show('v-lib'); } };
  $('ed-read').onclick = () => { const it = saveEditor(); if (it) openPrompter(it); };

  /* ---------- Atelier de prompts ---------- */
  function buildPrompt(){
    const v = id => $(id).value.trim();
    const lines = [];
    lines.push(`# Rôle\nTu es ${v('a-role') || 'un assistant compétent'}.`);
    if (v('a-ctx')) lines.push(`# Contexte\n${v('a-ctx')}`);
    lines.push(`# Tâche\n${v('a-int') || '(décris ton intention)'}`);
    lines.push(`# Public\n${v('a-public') || 'grand public'}`);
    lines.push(`# Format attendu\n${v('a-format')}`);
    lines.push(`# Ton\n${v('a-ton')}`);
    if (v('a-cons')) lines.push(`# Contraintes\n${v('a-cons')}`);
    lines.push(`# Avant de répondre\nSi une information essentielle manque, pose-moi une seule question.`);
    return lines.join('\n\n');
  }
  function renderPrompt(){ $('a-out').textContent = buildPrompt(); }
  ['a-int','a-role','a-public','a-format','a-ton','a-ctx','a-cons'].forEach(id => $(id).addEventListener('input', renderPrompt));
  $('a-copy').onclick = () => {
    const txt = buildPrompt();
    const fallback = () => { const r = document.createRange(); r.selectNodeContents($('a-out')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast('Texte sélectionné : copie-le'); };
    try { navigator.clipboard.writeText(txt).then(() => toast('Prompt copié'), fallback); } catch { fallback(); }
  };
  $('a-save').onclick = () => {
    const titre = 'Prompt : ' + ($('a-int').value.trim().slice(0, 40) || 'sans titre');
    items.push({ id: 'p' + Date.now(), type: 'prompt', titre, texte: buildPrompt(), date: Date.now() });
    persist(); toast('Ajouté à la bibliothèque');
  };

  /* ---------- Prompteur ---------- */
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let words = [], wnorm = [], pos = 0, running = false, voiceMode = !!SR, rec = null, raf = 0, lastT = 0, wakeLock = null;

  function openPrompter(it){
    const box = $('p-text'); box.innerHTML = '';
    words = []; wnorm = []; pos = 0;
    it.texte.split(/(\s+)/).forEach(tok => {
      if (/^\s+$/.test(tok)) {
        const nl = Math.min(2, (tok.match(/\n/g) || []).length);
        if (!nl) box.appendChild(document.createTextNode(' '));
        for (let k = 0; k < nl; k++) box.appendChild(document.createElement('br'));
        return;
      }
      if (!tok) return;
      const s = document.createElement('span'); s.className = 'w'; s.textContent = tok;
      box.appendChild(s); words.push(s); wnorm.push(norm(tok));
    });
    $('prompter').hidden = false; $('p-consent').hidden = true; $('p-stage').hidden = false;
    $('p-stage').scrollTop = 0;
    setMode(voiceMode && !!SR);
    if (!SR) note('La reconnaissance vocale n\'est pas disponible ici. Le défilement manuel est activé.');
    else note('');
    paint();
    try { document.documentElement.requestFullscreen?.().catch(() => {}); } catch {}
  }
  function note(msg){ $('p-note').textContent = msg; $('p-note').hidden = !msg; }

  function setMode(voice){
    voiceMode = voice;
    $('p-mode').setAttribute('aria-pressed', voice);
    $('p-mode').textContent = voice ? 'Voix' : 'Manuel';
    $('p-speed-wrap').hidden = voice;
    $('p-mic').hidden = !voice;
    stop();
  }
  $('p-mode').onclick = () => {
    if (!SR) { note('La reconnaissance vocale n\'est pas disponible dans ce navigateur. Essaie Chrome ou Edge.'); return; }
    setMode(!voiceMode);
  };

  function paint(){
    words.forEach((w, i) => { w.classList.toggle('done', i < pos); w.classList.toggle('now', i === pos); });
    const cur = words[Math.min(pos, words.length - 1)];
    if (cur && voiceMode) {
      const st = $('p-stage');
      const target = cur.offsetTop - st.clientHeight * 0.35 + cur.offsetHeight / 2;
      st.scrollTop = Math.max(0, target);
    }
  }

  // Avance dans le texte selon les mots entendus (fenêtre tolérante)
  function advance(heard){
    const tail = heard.slice(-6);
    for (const h of tail) {
      if (!h) continue;
      const win = h.length < 3 ? 2 : 10;
      for (let j = pos; j < Math.min(words.length, pos + win); j++) {
        if (wnorm[j] === h || (h.length > 4 && wnorm[j].startsWith(h.slice(0, 5)))) { pos = j + 1; break; }
      }
    }
    paint();
    if (pos >= words.length) { stop(); toast('Fin du texte'); }
  }

  function startVoice(){
    rec = new SR(); rec.lang = 'fr-BE'; rec.continuous = true; rec.interimResults = true;
    rec.onresult = e => {
      let txt = '';
      for (let i = e.resultIndex; i < e.results.length; i++) txt += ' ' + e.results[i][0].transcript;
      advance(txt.split(/\s+/).map(norm));
    };
    rec.onerror = e => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        note('Le micro est bloqué ici. Ouvre cette page dans Chrome ou Edge, ou utilise le mode manuel.');
        setMode(false);
      }
    };
    rec.onend = () => { if (running && voiceMode) { try { rec.start(); } catch {} } };
    try { rec.start(); micState(true); } catch { note('Impossible de démarrer le micro.'); setMode(false); }
  }
  function micState(on){ $('p-mic').classList.toggle('on', on); $('p-mic').querySelector('span').textContent = on ? 'J\'écoute…' : 'Micro éteint'; }

  function tick(t){
    if (!running) return;
    const dt = lastT ? (t - lastT) / 1000 : 0; lastT = t;
    $('p-stage').scrollTop += dt * Number($('p-speed').value);
    raf = requestAnimationFrame(tick);
  }

  let consentGiven = false;
  function start(){
    if (voiceMode && !consentGiven) { $('p-consent').hidden = false; $('p-stage').hidden = true; return; }
    running = true; $('p-play').textContent = 'Pause';
    if (voiceMode) startVoice();
    else { $('p-stage').style.scrollBehavior = 'auto'; lastT = 0; raf = requestAnimationFrame(tick); }
    try { navigator.wakeLock?.request('screen').then(l => wakeLock = l).catch(() => {}); } catch {}
  }
  function stop(){
    running = false; $('p-play').textContent = 'Démarrer';
    cancelAnimationFrame(raf); $('p-stage').style.scrollBehavior = '';
    if (rec) { try { rec.onend = null; rec.stop(); } catch {} rec = null; }
    micState(false);
    try { wakeLock?.release(); } catch {} wakeLock = null;
  }
  $('c-ok').onclick = () => { consentGiven = true; $('p-consent').hidden = true; $('p-stage').hidden = false; start(); };
  $('c-manual').onclick = () => { $('p-consent').hidden = true; $('p-stage').hidden = false; setMode(false); };
  $('p-play').onclick = () => running ? stop() : start();
  $('p-top').onclick = () => { pos = 0; $('p-stage').scrollTop = 0; paint(); };
  $('p-size').oninput = e => { $('p-text').style.setProperty('--size', e.target.value + 'px'); paint(); };
  $('p-mirror').onclick = () => {
    const on = $('p-text').classList.toggle('mirror');
    $('p-mirror').setAttribute('aria-pressed', on);
  };
  $('p-close').onclick = () => {
    stop(); $('prompter').hidden = true;
    try { document.fullscreenElement && document.exitFullscreen(); } catch {}
    renderLib(); show('v-lib');
  };
  // Clic sur un mot : repartir de là
  $('p-text').addEventListener('click', e => {
    const i = words.indexOf(e.target); if (i >= 0) { pos = i; paint(); }
  });
  document.addEventListener('keydown', e => {
    if ($('prompter').hidden) return;
    if (e.code === 'Space' && e.target.tagName !== 'BUTTON') { e.preventDefault(); running ? stop() : start(); }
    if (e.key === 'Escape') $('p-close').click();
  });

  let wipeAsk = false;
  $('btn-wipe').onclick = () => {
    if (!wipeAsk) { wipeAsk = true; $('btn-wipe').textContent = 'Confirmer : tout effacer'; return; }
    try { localStorage.removeItem(KEY); } catch {}
    location.reload();
  };

  renderLib(); renderPrompt();
})();
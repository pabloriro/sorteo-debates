'use strict';
/* ============================================================
   EL GRAN SORTEO DEL DEBATE  (1 debate)
   Acto I: moción · Acto II: parejas → bancadas · Acto III: trío de jueces
   ============================================================ */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let FAST = false;
  const T = ms => (FAST ? ms * 0.4 : ms);
  const wait = ms => sleep(T(ms));
  let busy = false;

  /* ---------- Azar de verdad (crypto) ---------- */
  const rnd = n => {
    if (n <= 1) return 0;
    const a = new Uint32Array(1);
    const lim = Math.floor(0xFFFFFFFF / n) * n;
    let x;
    do { crypto.getRandomValues(a); x = a[0]; } while (x >= lim);
    return x % n;
  };

  const BANCADAS = [
    { nombre: 'Apertura de Gobierno', lado: 'g', roles: 'Primer Ministro · Viceprimer Ministro' },
    { nombre: 'Apertura de Oposición', lado: 'o', roles: 'Líder · Vicelíder de la Oposición' },
    { nombre: 'Baja de Gobierno', lado: 'g', roles: 'Miembro · Látigo del Gobierno' },
    { nombre: 'Baja de Oposición', lado: 'o', roles: 'Miembro · Látigo de la Oposición' },
  ];
  const J_SLOTS = Math.min(JUECES_POR_DEBATE, JURADOS.length);

  /* ---------- Estado guardado ---------- */
  const SIG = (() => {
    const str = JSON.stringify([PAREJAS, JURADOS, J_SLOTS, MOCIONES.map(m => m.t)]);
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return String(h);
  })();
  const KEY = 'sorteoDebate_v3';
  const fresh = () => ({ sig: SIG, act: 'intro', mocion: null, slots: Array(BANCADAS.length).fill(null), jueces: Array(J_SLOTS).fill(null) });
  const load = () => {
    try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.sig === SIG) return s; } catch (e) { /* sin almacenamiento */ }
    return fresh();
  };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* nada */ } };
  let S = load();

  const status = () => ({
    act1: S.mocion !== null,
    act2: S.slots.every(x => x !== null),
    act3: S.jueces.every(x => x !== null),
  });
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const initials = n => n.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();

  /* ============================================================
     SONIDO (todo sintetizado, sin archivos)
     ============================================================ */
  const sfx = (() => {
    let ctx = null, master = null, on = true;
    const init = () => {
      if (!ctx) {
        const C = window.AudioContext || window.webkitAudioContext;
        if (!C) return;
        ctx = new C(); master = ctx.createGain(); master.gain.value = 0.6; master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
    };
    const tone = (f, d = 0.1, type = 'sine', v = 0.15, delay = 0, f2 = null) => {
      if (!ctx || !on) return;
      const t = ctx.currentTime + delay;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + d + 0.05);
    };
    const noise = (d = 0.1, v = 0.1, delay = 0, freq = 1200) => {
      if (!ctx || !on) return;
      const t = ctx.currentTime + delay, n = Math.floor(ctx.sampleRate * d);
      const buf = ctx.createBuffer(1, n, ctx.sampleRate), a = buf.getChannelData(0);
      for (let i = 0; i < n; i++) a[i] = Math.random() * 2 - 1;
      const s = ctx.createBufferSource(); s.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq;
      const g = ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      s.connect(f); f.connect(g); g.connect(master); s.start(t);
    };
    const api = {
      init,
      toggle() { on = !on; return on; },
      tick(p = 0, base = 300) { tone(base + p * 700, 0.05, 'square', 0.05); },
      type() { tone(900 + Math.random() * 300, 0.025, 'square', 0.025); },
      thump() { tone(110, 0.28, 'sine', 0.5, 0, 38); },
      heart() { api.thump(); setTimeout(api.thump, 170); },
      hit() { tone(70, 0.6, 'sawtooth', 0.25, 0, 30); noise(0.35, 0.25, 0, 300); },
      whoosh() { noise(0.6, 0.12, 0, 2500); },
      ding() { tone(880, 0.4, 'triangle', 0.2); tone(1320, 0.5, 'triangle', 0.15, 0.08); },
      fanfare() {
        [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.28, 'triangle', 0.2, i * 0.12));
        [1046, 1318, 784].forEach(f => tone(f, 0.9, 'triangle', 0.15, 0.5));
      },
      roll(ms) {
        let stop = false; const t0 = performance.now();
        (function loop() {
          if (stop) return;
          const k = Math.min(1, (performance.now() - t0) / ms);
          noise(0.05, 0.05 + 0.1 * k, 0, 800 + k * 2500);
          setTimeout(loop, 55 - 25 * k);
        })();
        return () => { stop = true; };
      },
    };
    return api;
  })();

  /* ============================================================
     CONFETI
     ============================================================ */
  const cf = (() => {
    const cv = $('#confetti'), c = cv.getContext('2d');
    let P = [], running = false;
    const size = () => { cv.width = innerWidth; cv.height = innerHeight; };
    size(); addEventListener('resize', size);
    const COL = ['#ffd24a', '#ff3d8b', '#2ee6ff', '#8b5cff', '#ffffff', '#ff9a3d'];
    const add = (x, y, n, power) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = Math.random() * power;
        P.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - power * 0.6, w: 6 + Math.random() * 8, h: 4 + Math.random() * 6,
          r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, col: COL[rnd(COL.length)], life: 140 + Math.random() * 80 });
      }
      if (!running) { running = true; requestAnimationFrame(loop); }
    };
    const loop = () => {
      c.clearRect(0, 0, cv.width, cv.height);
      P.forEach(p => {
        p.vy += 0.25; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life--;
        c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.globalAlpha = Math.min(1, p.life / 40);
        c.fillStyle = p.col; c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); c.restore();
      });
      P = P.filter(p => p.life > 0 && p.y < cv.height + 30);
      if (P.length) requestAnimationFrame(loop); else { running = false; c.clearRect(0, 0, cv.width, cv.height); }
    };
    return {
      burst(x = innerWidth / 2, y = innerHeight / 2, n = 140) { add(x, y, n, 16); },
      big() { this.burst(innerWidth * 0.2, innerHeight * 0.7, 110); this.burst(innerWidth * 0.8, innerHeight * 0.7, 110); this.burst(innerWidth / 2, innerHeight * 0.4, 160); },
    };
  })();

  /* ============================================================
     UTILIDADES DE SUSPENSO
     ============================================================ */
  async function countdown(label, n = 3) {
    const el = $('#countdown'), num = $('.cd-num', el);
    $('.cd-label', el).textContent = label;
    el.hidden = false;
    for (let i = n; i >= 1; i--) {
      num.textContent = i; num.classList.remove('pop'); void num.offsetWidth; num.classList.add('pop');
      sfx.heart(); await wait(850);
    }
    el.hidden = true;
  }

  async function typeText(el, text, per = 36) {
    el.textContent = ''; el.classList.remove('done');
    for (let i = 0; i < text.length; i++) {
      el.textContent += text[i];
      if (text[i] !== ' ') sfx.type();
      await wait(per);
    }
    el.classList.add('done');
  }

  function decode(el, text, ms = 1500) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@%&?';
    const t0 = performance.now(), dur = T(ms);
    return new Promise(res => {
      (function f() {
        const k = Math.min(1, (performance.now() - t0) / dur), fixed = Math.floor(k * text.length);
        let out = '';
        for (let i = 0; i < text.length; i++) out += (text[i] === ' ' || i < fixed) ? text[i] : chars[rnd(chars.length)];
        el.textContent = out;
        if (k < 1) requestAnimationFrame(f); else { el.textContent = text; res(); }
      })();
    });
  }

  /* El foco salta entre candidatos, cada vez más lento, y termina en `winner`.
     A veces se queda un buen rato en un "falso ganador" antes de llegar al verdadero. */
  async function hop(cands, winner, onHop) {
    const pick = not => { let c, g = 0; do { c = cands[rnd(cands.length)]; g++; } while (cands.length > 1 && c === not && g < 50); return c; };
    const n = 22 + rnd(8);
    const seq = []; let prev = -1;
    for (let i = 0; i < n && cands.length > 1; i++) { const c = pick(prev); seq.push(c); prev = c; }
    while (seq.length && seq[seq.length - 1] === winner) seq.pop();
    const last = seq.length ? seq[seq.length - 1] : -1;
    let decoy = null;
    if (cands.length > 2 && rnd(2) === 0) {
      const ds = cands.filter(c => c !== winner && c !== last);
      if (ds.length) decoy = ds[rnd(ds.length)];
    }
    if (decoy !== null) seq.push(decoy);
    seq.push(winner);
    const total = seq.length;
    for (let k = 0; k < total; k++) {
      const isLast = k === total - 1;
      const dwell = k === total - 2 && (decoy !== null || cands.length === 2); // pausa de suspenso antes del final
      const p = k / (total - 1 || 1);
      onHop(seq[k], p, isLast);
      let d = 45 + 520 * Math.pow(p, 2.6);
      if (dwell) { d += 1300; setTimeout(() => sfx.heart(), T(250)); }
      if (!isLast) await wait(d);
    }
  }

  /* ============================================================
     NAVEGACIÓN
     ============================================================ */
  function updateStepper() {
    const st = status();
    const unlocked = { act1: true, act2: st.act1, act3: st.act1 && st.act2, final: st.act1 && st.act2 && st.act3 };
    $$('#stepper button').forEach(b => {
      const a = b.dataset.act;
      b.disabled = !unlocked[a] || busy;
      b.classList.toggle('active', S.act === a);
      b.classList.toggle('done', a !== 'final' && st[a]);
    });
  }
  function render() {
    updateStepper();
    $$('.screen').forEach(s => s.classList.toggle('active', s.id === S.act));
    ({ intro: renderIntro, act1: renderAct1, act2: renderAct2, act3: renderAct3, final: renderFinal })[S.act]();
  }
  function go(a) {
    if (busy) return;
    S.act = a; save(); render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  const setBusy = v => { busy = v; $$('.primary').forEach(b => { b.disabled = v; }); updateStepper(); };
  const nextAct = () => { const st = status(); return !st.act1 ? 'act1' : !st.act2 ? 'act2' : !st.act3 ? 'act3' : 'final'; };

  /* ---------- Intro ---------- */
  function renderIntro() {
    $('#introSub').textContent = CONFIG.subtitulo;
    $('#introStats').innerHTML =
      `<div class="stat"><b>${MOCIONES.length}</b><span>mociones</span></div>` +
      `<div class="stat"><b>${PAREJAS.length}</b><span>parejas</span></div>` +
      `<div class="stat"><b>${JURADOS.length}</b><span>jurados</span></div>`;
    const any = S.mocion !== null || S.slots.some(x => x !== null) || S.jueces.some(x => x !== null);
    $('#btnStart').textContent = any ? 'Continuar donde quedamos' : '¡Comenzar el sorteo!';
  }

  /* ============================================================
     ACTO I · MOCIÓN
     ============================================================ */
  function renderAct1() {
    const wall = $('#wall');
    if (!wall.children.length) {
      MOCIONES.forEach((m, i) => {
        const d = document.createElement('div');
        d.className = 'mcard'; d.dataset.i = i;
        d.innerHTML = `<span class="n">${i + 1}</span><span class="emo">${m.emoji}</span><div><small>${esc(m.cat)} · ${esc(m.tipo.replace('Moción de ', ''))}</small><p>${esc(m.t)}</p></div>`;
        wall.appendChild(d);
      });
    }
    $$('.mcard', wall).forEach(c => {
      const i = +c.dataset.i;
      c.classList.remove('hot');
      c.classList.toggle('chosen', S.mocion === i);
      c.classList.toggle('dim', S.mocion !== null && S.mocion !== i);
    });
    const btn = $('#btnMotion');
    btn.textContent = S.mocion === null ? 'Sortear moción' : 'Continuar al Acto II · Parejas →';
    btn.disabled = busy;
  }

  async function drawMotion() {
    if (S.mocion !== null) return go('act2');
    setBusy(true);
    const all = MOCIONES.map((_, i) => i);
    const w = all[rnd(all.length)];
    await countdown('Sorteando la moción');
    const cards = $$('.mcard', $('#wall'));
    let cur = null;
    await hop(all, w, (c, k) => {
      if (cur !== null) cards[cur].classList.remove('hot');
      cur = c; cards[c].classList.add('hot'); sfx.tick(k);
      cards[c].scrollIntoView({ block: 'nearest' });
    });
    cards[w].classList.remove('hot'); cards[w].classList.add('chosen');
    cards.forEach((c, i) => { if (i !== w) c.classList.add('dim'); });
    sfx.hit(); await wait(1100);
    await revealMotion(w);
    S.mocion = w; save();
    setBusy(false); render();
  }

  async function revealMotion(mi) {
    const m = MOCIONES[mi], o = $('#reveal');
    const seal = $('#rvSeal'), cat = $('#rvCat'), tipo = $('#rvTipo'), txt = $('#rvText'), ctx = $('#rvCtx'), ok = $('#rvOk');
    [cat, tipo, txt, ctx, ok].forEach(x => { x.hidden = true; }); seal.hidden = false; txt.textContent = '';
    o.hidden = false;
    const stop = sfx.roll(T(1800)); await wait(1800); stop(); sfx.hit();
    seal.hidden = true;
    $('.emo', cat).textContent = m.emoji; $('.catname', cat).textContent = m.cat;
    cat.hidden = false; sfx.ding(); await wait(1300);
    tipo.textContent = m.tipo; tipo.hidden = false; sfx.ding(); await wait(1100);
    txt.hidden = false; await typeText(txt, m.t, 34);
    await wait(500);
    ctx.textContent = m.ctx; ctx.hidden = false;
    sfx.fanfare(); cf.big();
    ok.hidden = false; ok.focus();
    await new Promise(r => { ok.onclick = r; });
    o.hidden = true;
  }

  /* ============================================================
     ACTO II · PAREJAS → BANCADAS
     ============================================================ */
  let lastPlaced = null;
  const benchHTML = (b, bi, opts = {}) => {
    const p = S.slots[bi], next = S.slots.indexOf(null);
    const cls = [b.lado, p !== null ? 'filled' : '', !opts.final && next === bi ? 'next' : '', !opts.final && lastPlaced === bi ? 'pop' : ''].join(' ');
    return `<div class="bench ${cls}" data-b="${bi}"><div class="b-name">${b.nombre}</div><div class="b-roles">${b.roles}</div>
      <div class="b-pair ${p === null ? 'empty' : ''}">${p === null ? '?' : esc(PAREJAS[p][0]) + '<br>' + esc(PAREJAS[p][1])}</div></div>`;
  };

  function renderAct2() {
    $('#benchBoard').innerHTML = BANCADAS.map((b, bi) => benchHTML(b, bi)).join('');
    lastPlaced = null;
    const full = S.slots.every(x => x !== null);
    $('#pairPool').innerHTML = PAREJAS.map((p, i) => {
      const placed = S.slots.includes(i);
      return `<div class="pchip ${placed ? 'gone' : ''} ${full && !placed ? 'out' : ''}" data-out="Próximo debate" data-i="${i}"><small>Pareja ${i + 1}</small>${esc(p[0])}<br>${esc(p[1])}</div>`;
    }).join('');
    const left = PAREJAS.length - S.slots.filter(x => x !== null).length;
    $('#poolTitle').textContent = full ? 'Las demás parejas debaten en el próximo debate' : `En la tómbola: ${left} parejas`;
    const nx = S.slots.indexOf(null), btn = $('#btnPair');
    btn.textContent = nx === -1 ? 'Continuar al Acto III · Jueces →' : `Sortear · ${BANCADAS[nx].nombre}`;
    btn.disabled = busy;
  }

  /* Clona el elemento y lo hace viajar hasta el destino */
  async function fly(chip, target) {
    const cr = chip.getBoundingClientRect(), tr = target.getBoundingClientRect();
    const clone = chip.cloneNode(true);
    clone.classList.remove('hot', 'chosen'); clone.classList.add('fly');
    Object.assign(clone.style, { left: cr.left + 'px', top: cr.top + 'px', width: cr.width + 'px', height: cr.height + 'px' });
    document.body.appendChild(clone);
    chip.classList.remove('chosen'); chip.classList.add('gone');
    sfx.whoosh();
    const anim = clone.animate([
      { transform: 'translate(0,0) scale(1)' },
      { transform: `translate(${tr.left - cr.left}px,${tr.top - cr.top}px) scale(${tr.width / cr.width},${tr.height / cr.height})` },
    ], { duration: T(1000), easing: 'cubic-bezier(.5,0,.2,1)', fill: 'forwards' });
    await anim.finished;
    clone.remove();
  }

  async function drawPair() {
    const slot = S.slots.indexOf(null);
    if (slot === -1) return go('act3');
    setBusy(true);
    const avail = PAREJAS.map((_, i) => i).filter(i => !S.slots.includes(i));
    const w = avail[rnd(avail.length)];
    $('#benchBoard').children[slot].scrollIntoView({ block: 'nearest' });
    await countdown(BANCADAS[slot].nombre);
    const chips = $$('.pchip', $('#pairPool'));
    let cur = null;
    await hop(avail, w, (c, k) => {
      if (cur !== null) chips[cur].classList.remove('hot');
      cur = c; chips[c].classList.add('hot'); sfx.tick(k);
    });
    chips[w].classList.remove('hot'); chips[w].classList.add('chosen');
    sfx.hit(); cf.burst(chips[w].getBoundingClientRect().left + 80, chips[w].getBoundingClientRect().top + 20, 60);
    await wait(1300);

    // la pareja "viaja" hasta su bancada
    const target = $('#benchBoard').children[slot], tr = target.getBoundingClientRect();
    await fly(chips[w], target);
    S.slots[slot] = w; save(); lastPlaced = slot;
    sfx.ding(); cf.burst(tr.left + tr.width / 2, tr.top + tr.height / 2, 80);
    setBusy(false); render();
    if (S.slots.every(x => x !== null)) { sfx.fanfare(); cf.big(); }
  }

  /* ============================================================
     ACTO III · TRÍO DE JUECES
     ============================================================ */
  let lastSeat = null;
  const seatLabel = k => `Juez ${k + 1}`;
  const seatHTML = (k, opts = {}) => {
    const j = S.jueces[k], next = S.jueces.indexOf(null);
    const cls = [j !== null ? 'filled' : '', !opts.final && next === k ? 'next' : '', !opts.final && lastSeat === k ? 'pop' : ''].join(' ');
    return `<div class="bench j ${cls}" data-k="${k}"><div class="b-name">${seatLabel(k)}</div>
      <div class="b-pair ${j === null ? 'empty' : ''}">${j === null ? '?' : esc(JURADOS[j])}</div></div>`;
  };

  function renderAct3() {
    $('#seatBoard').innerHTML = S.jueces.map((_, k) => seatHTML(k)).join('');
    lastSeat = null;
    const full = S.jueces.every(x => x !== null);
    $('#judgePool').innerHTML = JURADOS.map((j, i) => {
      const taken = S.jueces.includes(i);
      return `<div class="pchip ${taken ? 'gone' : ''} ${full && !taken ? 'out' : ''}" data-out="No participa" data-i="${i}"><small>Jurado</small>${esc(j)}</div>`;
    }).join('');
    const left = JURADOS.length - S.jueces.filter(x => x !== null).length;
    $('#judgeTitle').textContent = full ? 'El panel de jueces está completo' : `En la tómbola: ${left} jurados`;
    const nx = S.jueces.indexOf(null), btn = $('#btnJudge');
    btn.textContent = nx === -1 ? 'Ver la cartelera final →' : `Sortear · ${seatLabel(nx)}`;
    btn.disabled = busy;
  }

  async function drawJudge() {
    const slot = S.jueces.indexOf(null);
    if (slot === -1) return go('final');
    setBusy(true);
    const avail = JURADOS.map((_, i) => i).filter(i => !S.jueces.includes(i));
    const w = avail[rnd(avail.length)];
    $('#seatBoard').children[slot].scrollIntoView({ block: 'nearest' });
    await countdown(seatLabel(slot));
    const chips = $$('.pchip', $('#judgePool'));
    let cur = null;
    await hop(avail, w, (c, k) => {
      if (cur !== null) chips[cur].classList.remove('hot');
      cur = c; chips[c].classList.add('hot'); sfx.tick(k, 220);
    });
    chips[w].classList.remove('hot'); chips[w].classList.add('chosen');
    const r = chips[w].getBoundingClientRect();
    sfx.hit(); cf.burst(r.left + r.width / 2, r.top + 20, 60);
    await wait(1300);
    const target = $('#seatBoard').children[slot], tr = target.getBoundingClientRect();
    await fly(chips[w], target);
    S.jueces[slot] = w; save(); lastSeat = slot;
    sfx.ding(); cf.burst(tr.left + tr.width / 2, tr.top + tr.height / 2, 80);
    setBusy(false); render();
    if (S.jueces.every(x => x !== null)) { sfx.fanfare(); cf.big(); }
  }

  /* ============================================================
     CARTELERA FINAL
     ============================================================ */
  function renderFinal() {
    const m = S.mocion !== null ? MOCIONES[S.mocion] : null;
    const reserve = PAREJAS.map((p, i) => i).filter(i => !S.slots.includes(i)).map(i => `${PAREJAS[i][0]} y ${PAREJAS[i][1]}`);
    $('#finalBoard').innerHTML = `<article class="debate-card">
      ${m ? `<div class="motion-mini">${m.emoji} ${esc(m.t)}</div>` : ''}
      <div class="benches-row">${BANCADAS.map((b, bi) => benchHTML(b, bi, { final: true })).join('')}</div>
      <div class="judges-line"><b>Trío de jueces</b>${S.jueces.filter(x => x !== null).map((j, k) => esc(JURADOS[j])).join(' · ') || '—'}</div>
      ${reserve.length ? `<div class="reserve-line"><b>Parejas para el próximo debate</b>${reserve.map(esc).join(' · ')}</div>` : ''}
    </article>`;
    $('#copyMsg').textContent = '';
  }
  function asText() {
    const lines = ['DEBATE', `Moción: ${S.mocion !== null ? MOCIONES[S.mocion].t : '—'}`];
    BANCADAS.forEach((b, bi) => { const p = S.slots[bi]; if (p !== null) lines.push(`${b.nombre}: ${PAREJAS[p][0]} y ${PAREJAS[p][1]}`); });
    const js = S.jueces.filter(x => x !== null).map(j => JURADOS[j]);
    if (js.length) lines.push(`Jueces: ${js.join(', ')}`);
    const reserve = PAREJAS.map((_, i) => i).filter(i => !S.slots.includes(i)).map(i => `${PAREJAS[i][0]} y ${PAREJAS[i][1]}`);
    if (reserve.length) lines.push(`Parejas para el próximo debate: ${reserve.join('; ')}`);
    return lines.join('\n');
  }

  /* ============================================================
     EVENTOS
     ============================================================ */
  // Si algo falla a mitad de un sorteo, se limpia la pantalla para no quedar bloqueados
  const safe = fn => async () => {
    sfx.init();
    try { await fn(); } catch (err) {
      console.error(err);
      $$('.overlay').forEach(o => { o.hidden = true; });
      $$('.fly').forEach(f => f.remove());
      setBusy(false); render();
    }
  };
  $('#btnStart').onclick = () => { sfx.init(); sfx.ding(); go(nextAct()); };
  $('#btnMotion').onclick = safe(drawMotion);
  $('#btnPair').onclick = safe(drawPair);
  $('#btnJudge').onclick = safe(drawJudge);
  $$('#stepper button').forEach(b => { b.onclick = () => go(b.dataset.act); });
  $('#btnPrint').onclick = () => window.print();
  $('#btnCopy').onclick = async () => {
    try { await navigator.clipboard.writeText(asText()); $('#copyMsg').textContent = '¡Copiado! Pégalo donde quieras.'; }
    catch (e) { $('#copyMsg').textContent = 'No se pudo copiar automáticamente.'; }
  };
  const reset = () => {
    if (busy) return;
    if (!confirm('¿Borrar todos los resultados y empezar de cero?')) return;
    S = fresh(); save(); render(); go('intro');
  };
  $('#btnReset').onclick = reset;
  $('#btnRedo').onclick = reset;
  $('#btnSound').onclick = e => {
    sfx.init(); const on = sfx.toggle();
    e.currentTarget.textContent = on ? '🔊' : '🔇'; e.currentTarget.classList.toggle('off', !on);
  };
  $('#btnFast').onclick = e => { FAST = !FAST; e.currentTarget.classList.toggle('on', FAST); };

  // Barra espaciadora / Enter = botón principal
  addEventListener('keydown', e => {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    if (e.target.closest('button')) return;
    e.preventDefault();
    for (const id of ['#rvOk']) { const b = $(id); if (!b.hidden && !b.closest('.overlay').hidden) return b.click(); }
    if (busy || $$('.overlay').some(o => !o.hidden)) return;
    const b = $('.screen.active .primary');
    if (b && !b.disabled) b.click();
  });

  render();
})();

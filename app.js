(() => {
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const C = Gem.CIPHERS;
const PALETTE = { eo: '#8fb8ff', fr: '#7ee0b0', ro: '#f5b37a', rfr: '#f38bb8', sr: '#b4a4ff', rsr: '#e8d27c', jew: '#7fd8d8', sum: '#e8c27a', rsum: '#f09a86', fb: '#c3c9f5' };
C.forEach(c => c.color = PALETTE[c.id] || c.color);
const LS = { get: (k, d) => { try { return JSON.parse(localStorage.getItem('jgl_' + k)) ?? d; } catch { return d; } }, set: (k, v) => { try { localStorage.setItem('jgl_' + k, JSON.stringify(v)); } catch {} } };
const pad = n => String(n).padStart(2, '0');
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const parseISO = s => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? { y: +m[1], m: +m[2], d: +m[3] } : null; };
const iso = p => `${p.y}-${pad(p.m)}-${pad(p.d)}`;
const fmtDate = (p, o) => p ? new Date(p.y, p.m - 1, p.d).toLocaleDateString('en-US', o || { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '';
const toast = msg => { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), 1900); };
const plural = (n, w) => `${n} ${n === 1 ? w : /(ch|sh|s|x)$/.test(w) ? w + 'es' : w + 's'}`;
const cipherDot = c => `<span class="cdot" style="--c:${c.color}"></span>`;

/* ---------- nav ---------- */
const TABS = ['today', 'calc', 'dates', 'dots', 'track'];
function showTab(t, keepScroll) {
  $$('.tab').forEach(s => s.classList.toggle('active', s.id === 'tab-' + t));
  $$('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === t));
  if (!keepScroll) window.scrollTo(0, 0);
  if (location.hash !== '#' + t) history.replaceState(null, '', '#' + t);
}
$$('.tabs button').forEach(b => b.onclick = () => showTab(b.dataset.t));
$$('[data-go]').forEach(b => b.onclick = () => showTab(b.dataset.go));
addEventListener('scroll', () => $('.top').classList.toggle('scrolled', scrollY > 4), { passive: true });
$('#teamlist').innerHTML = Object.values(TEAMS).flat().map(t => `<option value="${esc(t)}">`).join('');

/* ---------- sheet ---------- */
function openSheet(html) { $('#sheetBody').innerHTML = html; const s = $('#sheet'); s.classList.add('open'); s.setAttribute('aria-hidden', 'false'); setTimeout(() => $('#sheet [data-close].btn').focus(), 50); }
function closeSheet() { const s = $('#sheet'); s.classList.remove('open'); s.setAttribute('aria-hidden', 'true'); }
$$('#sheet [data-close]').forEach(el => el.onclick = closeSheet);
addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });
function cipherInfo(id) {
  const c = C.find(x => x.id === id), ex = ['Detroit Lions', 'Thanksgiving', 'Christmas'];
  openSheet(`<p class="eyebrow">${cipherDot(c)} Cipher</p><h3 id="sheetTitle">${esc(c.name)}</h3><p>${esc(c.desc)}</p><div class="ex">${ex.map(w => `<span class="pill">${esc(w)} <b>${Gem.value(w, c)}</b></span>`).join('')}</div>`);
}

/* ---------- TODAY ---------- */
function renderToday() {
  const p = parseISO(todayISO()), dv = Object.fromEntries(Gem.dateValues(p.y, p.m, p.d).map(d => [d.id, d]));
  const hs = [...Gem.holidays(p.y), ...Gem.holidays(p.y + 1)];
  const todayHol = hs.find(h => h.y === p.y && h.m === p.m && h.d === p.d);
  $('#todayDow').textContent = fmtDate(p, { weekday: 'long' });
  $('#todayDate').textContent = fmtDate(p, { month: 'long', day: 'numeric', year: 'numeric' });
  $('#todayHol').innerHTML = todayHol ? `Today is <b style="color:var(--gold2)">${esc(todayHol.name)}</b> · ${esc(todayHol.words[0])} = ${Gem.value(todayHol.words[0], C[1])} / ${Gem.value(todayHol.words[0], C[3])}` : 'Here’s what today adds up to.';
  $('#todayGrid').innerHTML = ['d1', 'd2', 'd3', 'd6', 'd9', 'd10'].map(k => `<div class="num"><b>${dv[k].v}</b><span>${esc(dv[k].label)}</span></div>`).join('');
  const t0 = Date.UTC(p.y, p.m - 1, p.d);
  const next = hs.map(h => ({ ...h, days: Math.round((Date.UTC(h.y, h.m - 1, h.d) - t0) / 864e5) })).filter(h => h.days > 0).sort((a, b) => a.days - b.days)[0];
  const w = next.words[0], hdv = Object.fromEntries(Gem.dateValues(next.y, next.m, next.d).map(d => [d.id, d.v]));
  $('#nextHol').innerHTML = `<div class="card-head"><h2>Next holiday</h2><button class="text-btn" id="nhOpen">Match it</button></div>
    <div class="nh" style="margin-top:12px"><div class="nh-badge"><b>${next.days}</b><small>${next.days === 1 ? 'day' : 'days'}</small></div><div class="nh-t"><div style="font-weight:600;font-size:16px">${esc(next.name)}</div><small>${fmtDate(next)}</small></div></div>
    <div class="pills">${[1, 3, 0, 2].map(i => `<span class="pill">${cipherDot(C[i])}${esc(C[i].short)} <b>${Gem.value(w, C[i])}</b></span>`).join('')}<span class="pill gold">m+d+yy <b>${hdv.d2}</b></span><span class="pill gold">m+d+cc+yy <b>${hdv.d1}</b></span></div>`;
  $('#nhOpen').onclick = () => { $('#gDate').value = iso(next); fillHolSelect(); $('#gHol').value = next.name; renderDots(); showTab('dots'); };
}
$$('[data-qa]').forEach(b => b.onclick = () => {
  const a = b.dataset.qa;
  if (a === 'word') { showTab('calc'); setTimeout(() => $('#phrase').focus(), 80); }
  if (a === 'match') { setDotsMode('match'); showTab('dots'); }
  if (a === 'log') { showTab('track'); openAdd(true); }
  if (a === 'example') { loadExample(); setDotsMode('match'); showTab('dots'); }
});

/* ---------- WORDS ---------- */
let selCipher = 'rfr';
let words = LS.get('words', ['Detroit Lions', 'Thanksgiving', 'Chicago Bears']);
function renderCalc() {
  const p = $('#phrase').value || $('#phrase').placeholder, find = +$('#findnum').value || null;
  const vals = Gem.allValues(p);
  $('#cipherGrid').innerHTML = C.map(c => `<div class="cv ${vals[c.id] === find ? 'hit' : ''} ${selCipher === c.id ? 'sel' : ''}" data-c="${c.id}" role="button" tabindex="0" aria-label="${esc(c.name)} ${vals[c.id]}. Show letters">
    ${vals[c.id] === find ? '<span class="tag">MATCH</span>' : ''}<span class="n" style="color:${vals[c.id] === find ? '' : c.color}">${vals[c.id]}</span><span class="t">${cipherDot(c)}${esc(c.name)}</span>
    <button class="info" data-info="${c.id}" aria-label="What is ${esc(c.name)}?"><svg><use href="#i-info"/></svg></button></div>`).join('');
  $$('#cipherGrid .cv').forEach(el => { const go = () => { selCipher = el.dataset.c; renderCalc(); $('#breakdown').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }; el.onclick = go; el.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }; });
  $$('#cipherGrid .info').forEach(b => b.onclick = e => { e.stopPropagation(); cipherInfo(b.dataset.info); });
  const c = C.find(x => x.id === selCipher), bd = Gem.breakdown(p, c), b = $('#breakdown');
  b.classList.toggle('hidden', !bd.length);
  b.innerHTML = `<div class="card-head"><div><p class="eyebrow" style="margin:0">${cipherDot(c)} Letter by letter</p><h2 style="margin-top:4px">${esc(c.name)}</h2></div><span class="target has" style="padding:0"><span class="tv" style="font-size:32px">${vals[c.id]}</span></span></div>
    <div class="letters">${bd.map(([ch, v]) => `<div class="lt"><b>${esc(ch)}</b><i>${v}</i></div>`).join('')}</div><p class="eq">${bd.map(x => x[1]).join(' + ')} = <b style="color:var(--gold2)">${vals[c.id]}</b></p>`;
  const list = words.slice(); if ($('#phrase').value && !list.includes($('#phrase').value)) list.unshift($('#phrase').value);
  $('#cmpTable').innerHTML = list.length ? `<tr><th>Phrase</th>${C.map(c => `<th title="${esc(c.name)}">${esc(c.short)}</th>`).join('')}<th></th></tr>` +
    list.map(w => { const v = Gem.allValues(w); return `<tr><td>${esc(w)}</td>${C.map(c => `<td class="${v[c.id] === find ? 'hit' : ''}">${v[c.id]}</td>`).join('')}<td class="x" data-w="${esc(w)}" aria-label="Remove">${words.includes(w) ? '✕' : ''}</td></tr>`; }).join('') : '<tr><td class="empty">Nothing to compare yet.</td></tr>';
  $$('#cmpTable .x').forEach(x => x.onclick = () => { words = words.filter(w => w !== x.dataset.w); LS.set('words', words); renderCalc(); });
}
$('#phrase').oninput = renderCalc; $('#findnum').oninput = renderCalc;
$('#saveword').onclick = () => { const w = $('#phrase').value.trim(); if (!w) return toast('Type a word first'); words = [w, ...words.filter(x => x !== w)].slice(0, 30); LS.set('words', words); renderCalc(); toast('Added to compare'); };
$('#clearwords').onclick = () => { words = []; LS.set('words', words); renderCalc(); };

/* ---------- DATES ---------- */
function setDatesMode(m) { $$('#datesSeg button').forEach(b => b.classList.toggle('on', b.dataset.v === m)); $('#datePane').classList.toggle('hidden', m !== 'date'); $('#holPane').classList.toggle('hidden', m !== 'hol'); }
$$('#datesSeg button').forEach(b => b.onclick = () => setDatesMode(b.dataset.v));
function renderDates() {
  const p = parseISO($('#dateIn').value); if (!p) return;
  const hol = Gem.holidays(p.y).find(h => h.m === p.m && h.d === p.d), dv = Gem.dateValues(p.y, p.m, p.d);
  $('#dateLabel').textContent = fmtDate(p, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) + (hol ? ' · ' + hol.name : '');
  const key = Object.fromEntries(dv.map(d => [d.id, d]));
  $('#dateKeyGrid').innerHTML = ['d1', 'd2', 'd9', 'd10'].map(k => `<div class="num"><b>${key[k].v}</b><span>${esc(key[k].label)}</span><small>${esc(key[k].formula)}</small></div>`).join('');
  $('#dateList').innerHTML = dv.map(d => `<div class="li"><span>${esc(d.label)}<small>${esc(d.formula)}</small></span><b>${d.v}</b></div>`).join('');
}
function renderSpan() {
  const a = parseISO($('#spanA').value), b = parseISO($('#spanB').value); if (!a || !b) { $('#spanOut').textContent = ''; return; }
  const n = Math.round(Math.abs(Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 864e5);
  $('#spanOut').innerHTML = `<b>${n}</b> days &nbsp;·&nbsp; <b>${n + 1}</b> counting both ends &nbsp;·&nbsp; ${Math.floor(n / 7)}w ${n % 7}d`;
}
$('#dateIn').oninput = renderDates; $('#spanA').oninput = renderSpan; $('#spanB').oninput = renderSpan;

/* ---------- HOLIDAYS ---------- */
let holYear = new Date().getFullYear();
function renderHol() {
  $('#yLbl').textContent = holYear;
  const key = ['eo', 'fr', 'ro', 'rfr', 'jew', 'sum'], today = parseISO(todayISO());
  const hs = Gem.holidays(holYear);
  const nextIdx = hs.findIndex(h => Date.UTC(h.y, h.m - 1, h.d) >= Date.UTC(today.y, today.m - 1, today.d));
  $('#holList').innerHTML = hs.map((h, i) => {
    const dv = Gem.dateValues(h.y, h.m, h.d), v0 = Gem.allValues(h.words[0]);
    return `<details class="hol" ${i === nextIdx ? 'open' : ''}><summary><div><div class="hn">${esc(h.name)}</div><div class="hd">${fmtDate(h)}</div></div><div class="hv">${['fr', 'rfr'].map(id => { const c = C.find(x => x.id === id); return `<span class="pill">${cipherDot(c)}<b>${v0[id]}</b></span>`; }).join('')}</div></summary>
    <div class="body"><div class="scroll-x" style="margin-top:0"><table class="tbl"><tr><th>Words</th>${key.map(id => `<th>${C.find(c => c.id === id).short}</th>`).join('')}</tr>
    ${h.words.map(w => { const v = Gem.allValues(w); return `<tr><td>${esc(w)}</td>${key.map(id => `<td>${v[id]}</td>`).join('')}</tr>`; }).join('')}</table></div>
    <div class="pills">${dv.filter(d => d.id !== 'd8').map(d => `<span class="pill gold">${esc(d.label)} <b>${d.v}</b></span>`).join('')}</div>
    <button class="btn secondary block" data-hi="${i}">Use in Match</button></div></details>`;
  }).join('');
  $$('#holList [data-hi]').forEach(b => b.onclick = () => { const h = Gem.holidays(holYear)[+b.dataset.hi]; $('#gDate').value = iso(h); fillHolSelect(); $('#gHol').value = h.name; renderDots(); showTab('dots'); });
}
$('#yPrev').onclick = () => { holYear--; renderHol(); }; $('#yNext').onclick = () => { holYear++; renderHol(); };

/* ---------- MATCH ---------- */
let dotsMode = 'match', picks = new Map();
function setDotsMode(m) { dotsMode = m; $$('#dotsMode button').forEach(x => x.classList.toggle('on', x.dataset.m === m)); $('#scoreRow').classList.toggle('hidden', m === 'sim'); renderDots(); }
$$('#dotsMode button').forEach(b => b.onclick = () => setDotsMode(b.dataset.m));
function fillHolSelect() {
  const p = parseISO($('#gDate').value); if (!p) return;
  const hs = Gem.holidays(p.y), cur = $('#gHol').value;
  $('#gHol').innerHTML = '<option value="">None</option>' + hs.map(h => `<option>${esc(h.name)}</option>`).join('');
  const on = hs.find(h => h.m === p.m && h.d === p.d);
  $('#gHol').value = on ? on.name : (hs.some(h => h.name === cur) ? cur : '');
}
function gameDots() {
  const p = parseISO($('#gDate').value), srcs = [];
  if ($('#tA').value.trim()) srcs.push({ text: $('#tA').value, kind: 'Team A' });
  if ($('#tB').value.trim()) srcs.push({ text: $('#tB').value, kind: 'Team B' });
  const hn = $('#gHol').value; if (hn && p) { const h = Gem.holidays(p.y).find(x => x.name === hn); (h ? h.words : [hn]).forEach(w => srcs.push({ text: w, kind: 'Holiday' })); }
  $('#gExtra').value.split(',').map(s => s.trim()).filter(Boolean).forEach(w => srcs.push({ text: w, kind: 'Extra' }));
  const seen = new Set();
  return Gem.dots(srcs, p).filter(d => d.cid !== 'date' || d.v < 1000).filter(d => { const k = d.v + '|' + d.cid + '|' + d.src.toLowerCase() + '|' + d.method; if (seen.has(k)) return false; seen.add(k); return true; });
}
const KIND = { 'Team A': 'Away team', 'Team B': 'Home team', Holiday: 'Holiday', Extra: 'Extra word' };
const dotLine = d => d.cid === 'date' ? `<span class="src">${esc(d.method.replace('Date: ', ''))}</span><span class="cph">Date</span>` : `<span class="src">${esc(d.src)}</span><span class="cph">${esc(d.cipher)}</span>`;
const pickKey = (v, t) => v + '|' + t;
function togglePick(v, target, ds) { const k = pickKey(v, target); if (picks.has(k)) picks.delete(k); else picks.set(k, { v, target, dots: ds }); renderDots(); }
function renderDots() {
  const ds = gameDots(), sa = $('#sA').value, sb = $('#sB').value, A = $('#tA').value || 'Away', B = $('#tB').value || 'Home';
  const out = $('#dotsOut');
  $('#saveBar').classList.toggle('floating', picks.size > 0); $('#pickCount').textContent = picks.size; $('#pickLbl').textContent = picks.size === 1 ? 'call picked' : 'calls picked';
  if (!ds.length) { out.innerHTML = `<div class="card empty"><p class="empty-title">Add two teams to start</p>Or tap <b>Try Lions example</b> above to see how it works.</div>`; return; }
  if (dotsMode === 'match') {
    if (sa === '' || sb === '') { out.innerHTML = `<div class="card empty"><p class="empty-title">Add the final score</p>Then every number that matches the total, a team score or the margin lights up.</div>` + valueTable(ds, []); return; }
    const a = +sa, b = +sb;
    const targets = [{ key: 'total', label: 'Total points', v: a + b }, { key: 'a', label: A, v: a }, { key: 'b', label: B, v: b }, { key: 'margin', label: 'Margin', v: Math.abs(a - b) }];
    const m = Gem.match(ds, targets), n = m.reduce((s, t) => s + t.hits.length, 0);
    out.innerHTML = `<div class="card glow"><div class="result-head"><div><p class="eyebrow" style="margin:0">Result</p><div class="big">${plural(n, 'match')}</div><p class="hint">${esc(A)} ${a} · ${esc(B)} ${b}</p></div><span class="pill gold">Total <b>${a + b}</b></span></div></div>` +
      m.map(t => `<div class="card target ${t.hits.length ? 'has' : ''}" id="t-${t.key}"><div class="th"><div><div class="tl">${esc(t.label)}</div><div class="tv">${t.v}</div></div><span class="badge">${t.hits.length ? plural(t.hits.length, 'match') : 'No match'}</span></div>
      ${t.hits.map(d => `<button class="dot ${picks.has(pickKey(t.v, t.key)) ? 'picked' : ''}" data-v="${t.v}" data-t="${t.key}"><span class="dl">${dotLine(d)}</span><span class="cph kind">${esc(d.cid === 'date' ? d.src : KIND[d.method] || d.method)}</span></button>`).join('')}</div>`).join('') +
      valueTable(ds, targets.map(t => t.v));
    $$('#dotsOut .dot').forEach(el => el.onclick = () => { const t = m.find(x => x.key === el.dataset.t); togglePick(+el.dataset.v, el.dataset.t, t.hits); });
  } else {
    const s = Gem.simulate(ds, $('#sport').value);
    const cand = (list, target, title, rng, id) => `<div class="card" id="${id}"><h2>${title}</h2><p class="hint">${rng[0]}–${rng[1]} range · most overlap first · tap to pick</p>${list.slice(0, 6).map(c => {
      const kinds = [...new Set(c.dots.map(d => d.cid === 'date' ? 'Date' : KIND[d.method] || d.method))];
      return `<button class="cand ${picks.has(pickKey(c.v, target)) ? 'picked' : ''}" data-v="${c.v}" data-t="${target}"><span class="cn">${c.v}</span><span class="meta"><b>${esc(kinds.join(' + '))}</b> · ${plural(c.n, 'dot')}<br>${c.dots.slice(0, 3).map(d => d.cid === 'date' ? esc(d.method.replace('Date: ', 'Date · ')) : `${esc(d.src)} · ${esc(d.cipher)}`).join('<br>')}${c.n > 3 ? `<br>+${c.n - 3} more` : ''}<span class="bar"><i style="width:${Math.min(100, c.kinds * 28 + c.n * 6)}%"></i></span></span></button>`; }).join('') || '<div class="empty">No numbers land in this range.</div>'}
      ${list.length > 6 ? `<p class="field-label">Every other number in range</p><div class="chips">${list.slice(6).sort((a, b) => a.v - b.v).map(c => `<button class="chipn ${picks.has(pickKey(c.v, target)) ? 'picked' : ''}" data-v="${c.v}" data-t="${target}" title="${esc(c.dots.map(d => d.src + ' · ' + d.cipher).join('\n'))}">${c.v}<small>×${c.n}</small></button>`).join('')}</div>` : ''}</div>`;
    out.innerHTML = `<div class="note"><svg><use href="#i-info"/></svg><span>These are the numbers your names and date point to, where sources overlap. Number patterns only, not predictions. Pick some, log the game, then grade it after the final.</span></div>` +
      cand(s.totals, 'total', 'Totals the numbers point to', s.range.total, 'sim-totals') + cand(s.teams, 'either', 'Team scores the numbers point to', s.range.team, 'sim-teams');
    $$('#dotsOut [data-v]').forEach(el => el.onclick = () => { const v = +el.dataset.v, t = el.dataset.t; togglePick(v, t, (t === 'total' ? s.totals : s.teams).find(c => c.v === v).dots); });
  }
}
function valueTable(ds, hitVals) {
  const rows = {}; ds.filter(d => d.cid !== 'date').forEach(d => { (rows[d.method + '|' + d.src] = rows[d.method + '|' + d.src] || { label: d.src, v: {} }).v[d.cid] = d.v; });
  const dates = ds.filter(d => d.cid === 'date');
  return `<div class="card"><h2>All the numbers</h2><p class="hint">Every name in every cipher, plus the date.</p><div class="scroll-x"><table class="tbl"><tr><th>Source</th>${C.map(c => `<th>${esc(c.short)}</th>`).join('')}</tr>${Object.values(rows).map(r => `<tr><td>${esc(r.label)}</td>${C.map(c => `<td class="${hitVals.includes(r.v[c.id]) ? 'hit' : ''}">${r.v[c.id]}</td>`).join('')}</tr>`).join('')}</table></div>
  <div class="pills">${dates.map(d => `<span class="pill ${hitVals.includes(d.v) ? 'gold' : ''}">${esc(d.method.replace('Date: ', ''))} <b>${d.v}</b></span>`).join('')}</div></div>`;
}
['#sport', '#tA', '#tB', '#gHol', '#gExtra', '#sA', '#sB'].forEach(s => $(s).addEventListener('input', renderDots));
$('#gDate').addEventListener('input', () => { fillHolSelect(); renderDots(); });
function loadExample() { $('#sport').value = 'NFL'; $('#tA').value = 'Chicago Bears'; $('#tB').value = 'Detroit Lions'; $('#gDate').value = '2026-11-26'; fillHolSelect(); $('#gHol').value = 'Thanksgiving'; $('#gExtra').value = ''; $('#sA').value = 39; $('#sB').value = 35; picks.clear(); renderDots(); }
$('#loadEx').onclick = () => { loadExample(); toast('Bears 39, Lions 35 on Thanksgiving'); };
const callsFromPicks = () => [...picks.values()].flatMap(p => { const seen = new Set(); return p.dots.filter(d => { const k = d.cid + '|' + d.method; if (seen.has(k)) return false; seen.add(k); return true; }).map(d => ({ v: p.v, target: p.target, cipher: d.cipher, method: d.method, src: d.src })); });
$('#saveGame').onclick = () => {
  const p = parseISO($('#gDate').value); if (!$('#tA').value.trim() || !$('#tB').value.trim() || !p) return toast('Add both teams and a date first');
  const g = { id: 'g' + Date.now().toString(36), date: $('#gDate').value, sport: $('#sport').value, a: $('#tA').value.trim(), b: $('#tB').value.trim(), holiday: $('#gHol').value, sa: dotsMode === 'match' && $('#sA').value !== '' ? +$('#sA').value : null, sb: dotsMode === 'match' && $('#sB').value !== '' ? +$('#sB').value : null, calls: callsFromPicks() };
  games.unshift(g); LS.set('games', games); picks.clear(); renderDots(); renderTracker(); toast(`Logged with ${plural(g.calls.length, 'call')}`);
};

/* ---------- TRACKER ---------- */
let games = LS.get('games', []), statMode = 'cipher';
const TARGETS = { total: 'Total', either: 'Either team', a: 'Away', b: 'Home', margin: 'Margin', any: 'Any' };
function grade(g, c) {
  if (g.sa == null || g.sb == null || g.sa === '' || g.sb === '') return null;
  const a = +g.sa, b = +g.sb, t = { total: [a + b], a: [a], b: [b], margin: [Math.abs(a - b)], either: [a, b], any: [a + b, a, b, Math.abs(a - b)] }[c.target] || [];
  return t.includes(+c.v);
}
const methodGroup = m => /^Team [AB]$/.test(m) ? 'Team name' : m === 'Extra' ? 'Extra word' : m;
const EXAMPLE = { id: 'example', date: '2026-11-26', sport: 'NFL', a: 'Chicago Bears', b: 'Detroit Lions', holiday: 'Thanksgiving', sa: 39, sb: 35, calls: [{ v: 74, target: 'total', cipher: 'Reverse Full Reduction', method: 'Team B', src: 'Detroit Lions' }, { v: 60, target: 'total', cipher: 'Full Reduction', method: 'Holiday', src: 'Thanksgiving' }, { v: 66, target: 'total', cipher: 'Reverse Full Reduction', method: 'Holiday', src: 'Thanksgiving' }] };
function gameCard(g, example) {
  const done = grade(g, { v: 0, target: 'total' }) !== null;
  return `<div class="game ${example ? 'example' : ''}" data-id="${g.id}"><div class="gh"><div><div class="gt">${esc(g.a)} @ ${esc(g.b)}</div><div class="gd">${esc(g.sport)} · ${fmtDate(parseISO(g.date))}${g.holiday ? ' · ' + esc(g.holiday) : ''}</div></div><div class="sc">${done ? `${g.sa}–${g.sb}` : '<span class="badge">Pending</span>'}</div></div>
  <div class="calls">${g.calls.map(c => { const r = grade(g, c); return `<span class="call ${r === true ? 'hit' : r === false ? 'miss' : ''}">${r === true ? '✓' : r === false ? '✕' : '•'} <b>${esc(c.v)}</b> ${esc(TARGETS[c.target] || c.target)} · ${esc(c.cipher)}${c.method && c.method !== 'Manual' && c.cipher !== 'Date' ? ' · ' + esc(c.src || c.method) : c.cipher === 'Date' && c.method !== 'Date' ? ' · ' + esc(c.method.replace('Date: ', '')) : ''}</span>`; }).join('') || '<span class="hint">No calls logged</span>'}</div>
  ${example ? `<button class="btn secondary block" id="addExample">Add this example to my tracker</button>` : `<div class="gacts"><input class="input" type="number" inputmode="numeric" placeholder="Away" aria-label="Away score" value="${g.sa ?? ''}" data-f="sa"><input class="input" type="number" inputmode="numeric" placeholder="Home" aria-label="Home score" value="${g.sb ?? ''}" data-f="sb"><button class="btn secondary" data-act="grade">Grade</button><button class="del" data-act="del">Delete</button></div>`}</div>`;
}
function renderTracker() {
  const rows = games.flatMap(g => g.calls.map(c => ({ g, c, r: grade(g, c) }))).filter(x => x.r !== null);
  const hits = rows.filter(x => x.r).length;
  $('#kRate').textContent = rows.length ? Math.round(hits / rows.length * 100) + '%' : '–';
  $('#kCalls').textContent = rows.length; $('#kGames').textContent = games.length;
  const keyOf = x => statMode === 'cipher' ? x.c.cipher : statMode === 'method' ? methodGroup(x.c.method) : TARGETS[x.c.target] || x.c.target;
  const grp = {}; rows.forEach(x => { const k = keyOf(x); grp[k] = grp[k] || { h: 0, n: 0 }; grp[k].n++; if (x.r) grp[k].h++; });
  const list = Object.entries(grp).sort((a, b) => b[1].h / b[1].n - a[1].h / a[1].n || b[1].n - a[1].n);
  $('#stats').innerHTML = list.length ? list.map(([k, s]) => `<div class="stat"><div class="sh"><span>${esc(k)}</span><b>${s.h}/${s.n} · ${Math.round(s.h / s.n * 100)}%</b></div><div class="bar"><i style="width:${s.h / s.n * 100}%"></i></div></div>`).join('') : `<p class="hint" style="margin-top:14px">Your hit rate by cipher shows here once a game with calls has a final score.</p>`;
  $('#games').innerHTML = games.length ? games.map(g => gameCard(g)).join('') :
    `<div class="card empty" style="text-align:left"><p class="empty-title">No games yet</p><p class="hint" style="margin:0">Here’s what a logged game looks like. Calls turn green when they hit and red when they miss.</p></div>` + gameCard(EXAMPLE, true);
  const ex = $('#addExample'); if (ex) ex.onclick = () => { games.unshift({ ...JSON.parse(JSON.stringify(EXAMPLE)), id: 'g' + Date.now().toString(36) }); LS.set('games', games); renderTracker(); toast('Example added'); };
  $$('#games .game:not(.example)').forEach(el => {
    const g = games.find(x => x.id === el.dataset.id); if (!g) return;
    el.querySelector('[data-act=grade]').onclick = () => { const a = el.querySelector('[data-f=sa]').value, b = el.querySelector('[data-f=sb]').value; g.sa = a === '' ? null : +a; g.sb = b === '' ? null : +b; LS.set('games', games); renderTracker(); toast('Graded'); };
    el.querySelector('[data-act=del]').onclick = () => { if (confirm('Delete this game?')) { games = games.filter(x => x !== g); LS.set('games', games); renderTracker(); } };
  });
}
$$('#statMode button').forEach(b => b.onclick = () => { statMode = b.dataset.s; $$('#statMode button').forEach(x => x.classList.toggle('on', x === b)); renderTracker(); });
function openAdd(open) { const f = $('#addForm'); const show = open ?? f.classList.contains('hidden'); f.classList.toggle('hidden', !show); $('#toggleAdd').textContent = show ? 'Close' : '+ Log a game'; $('#toggleAdd').className = show ? 'btn secondary block' : 'btn primary block'; if (!$('#mCalls').children.length) addCallRow(); if (show) setTimeout(() => f.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60); }
$('#toggleAdd').onclick = () => openAdd();
function addCallRow() {
  const d = document.createElement('div'); d.className = 'callrow';
  d.innerHTML = `<input class="input" type="number" inputmode="numeric" placeholder="#" aria-label="Number"><select class="input" aria-label="Target">${Object.entries(TARGETS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select><select class="input" aria-label="Cipher">${C.map(c => `<option>${esc(c.name)}</option>`).join('')}<option>Date</option><option>Other</option></select><button aria-label="Remove call">×</button>`;
  d.querySelector('button').onclick = () => d.remove(); $('#mCalls').appendChild(d);
}
$('#mAddCall').onclick = addCallRow;
$('#mSave').onclick = () => {
  if (!$('#mA').value.trim() || !$('#mB').value.trim()) return toast('Add both teams');
  const calls = $$('#mCalls .callrow').map(r => { const [n, t, c] = r.querySelectorAll('input,select'); return n.value === '' ? null : { v: +n.value, target: t.value, cipher: c.value, method: c.value === 'Date' ? 'Date' : 'Manual', src: '' }; }).filter(Boolean);
  games.unshift({ id: 'g' + Date.now().toString(36), date: $('#mDate').value || todayISO(), sport: $('#mSport').value, a: $('#mA').value.trim(), b: $('#mB').value.trim(), holiday: (Gem.holidays(+($('#mDate').value || todayISO()).slice(0, 4)).find(h => iso(h) === $('#mDate').value) || {}).name || '', sa: $('#mSA').value === '' ? null : +$('#mSA').value, sb: $('#mSB').value === '' ? null : +$('#mSB').value, calls });
  LS.set('games', games); ['#mA', '#mB', '#mSA', '#mSB'].forEach(s => $(s).value = ''); $('#mCalls').innerHTML = ''; addCallRow(); openAdd(false); renderTracker(); toast('Game logged');
};
/* CSV */
const COLS = ['game_id', 'date', 'sport', 'team_a', 'team_b', 'holiday', 'score_a', 'score_b', 'call_number', 'call_target', 'cipher', 'method', 'source', 'result'];
const csvCell = v => { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
$('#expCsv').onclick = () => {
  if (!games.length) return toast('Nothing to export yet');
  const lines = [COLS.join(',')];
  games.forEach(g => { const base = [g.id, g.date, g.sport, g.a, g.b, g.holiday, g.sa, g.sb]; if (!g.calls.length) lines.push([...base, '', '', '', '', '', ''].map(csvCell).join(',')); g.calls.forEach(c => { const r = grade(g, c); lines.push([...base, c.v, c.target, c.cipher, c.method, c.src, r === null ? 'pending' : r ? 'hit' : 'miss'].map(csvCell).join(',')); }); });
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' })); a.download = `gematria-tracker-${todayISO()}.csv`; a.click(); toast('CSV exported');
};
function parseCSV(t) { const rows = []; let row = [], cell = '', q = false; for (let i = 0; i < t.length; i++) { const ch = t[i]; if (q) { if (ch === '"' && t[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; } else if (ch === '"') q = true; else if (ch === ',') { row.push(cell); cell = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; } else cell += ch; } if (cell || row.length) { row.push(cell); rows.push(row); } return rows.filter(r => r.some(x => x !== '')); }
$('#impCsv').onchange = async e => {
  const f = e.target.files[0]; if (!f) return; const rows = parseCSV(await f.text()); const h = (rows.shift() || []).map(s => s.trim()); const ix = k => h.indexOf(k);
  if (ix('team_a') < 0) return toast('That isn’t a tracker CSV');
  const map = new Map(); rows.forEach(r => { const id = r[ix('game_id')] || ('g' + Math.random().toString(36).slice(2)); const num = x => x === '' || x == null ? null : +x;
    if (!map.has(id)) map.set(id, { id, date: r[ix('date')], sport: r[ix('sport')] || 'NFL', a: r[ix('team_a')], b: r[ix('team_b')], holiday: r[ix('holiday')] || '', sa: num(r[ix('score_a')]), sb: num(r[ix('score_b')]), calls: [] });
    if (r[ix('call_number')] !== '' && r[ix('call_number')] != null) map.get(id).calls.push({ v: +r[ix('call_number')], target: r[ix('call_target')] || 'total', cipher: r[ix('cipher')] || 'Other', method: r[ix('method')] || 'Manual', src: r[ix('source')] || '' }); });
  const ids = new Set(map.keys()); games = [...map.values(), ...games.filter(g => !ids.has(g.id))]; LS.set('games', games); renderTracker(); toast(`Imported ${plural(map.size, 'game')}`); e.target.value = '';
};

/* ---------- init ---------- */
const t = todayISO(); $('#dateIn').value = t; $('#gDate').value = t; $('#mDate').value = t; $('#spanA').value = `${new Date().getFullYear()}-01-01`; $('#spanB').value = t;
fillHolSelect(); renderToday(); renderCalc(); renderDates(); renderSpan(); renderHol(); renderDots(); renderTracker();
const h = location.hash.slice(1); if (TABS.includes(h)) showTab(h);
if ('serviceWorker' in navigator && location.protocol === 'https:') addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));

/* API for the tour */
window.App = {
  showTab, setDotsMode, setDatesMode, loadExample, renderCalc, closeSheet,
  getState: () => ({ phrase: $('#phrase').value, find: $('#findnum').value, sel: selCipher, mode: dotsMode, f: ['#sport', '#tA', '#tB', '#gDate', '#gHol', '#gExtra', '#sA', '#sB'].map(s => $(s).value), picks: new Map(picks) }),
  setState: s => { $('#phrase').value = s.phrase; $('#findnum').value = s.find; selCipher = s.sel; ['#sport', '#tA', '#tB', '#gDate'].forEach((sel, i) => $(sel).value = s.f[i]); fillHolSelect(); ['#gHol', '#gExtra', '#sA', '#sB'].forEach((sel, i) => $(sel).value = s.f[i + 4]); picks = s.picks; renderCalc(); setDotsMode(s.mode); },
  setPhrase: (p, find, sel) => { $('#phrase').value = p; $('#findnum').value = find ?? ''; if (sel) selCipher = sel; renderCalc(); },
};
})();

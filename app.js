(() => {
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const C = Gem.CIPHERS;
const LS = { get: (k, d) => { try { return JSON.parse(localStorage.getItem('jgl_' + k)) ?? d; } catch { return d; } }, set: (k, v) => localStorage.setItem('jgl_' + k, JSON.stringify(v)) };
const pad = n => String(n).padStart(2, '0');
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const parseISO = s => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? { y: +m[1], m: +m[2], d: +m[3] } : null; };
const fmtDate = p => p ? new Date(p.y, p.m - 1, p.d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '';
const toast = msg => { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), 1800); };

/* tabs */
function showTab(t) { $$('.tab').forEach(s => s.classList.toggle('active', s.id === 'tab-' + t)); $$('.tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === t)); window.scrollTo(0, 0); if (location.hash !== '#' + t) history.replaceState(null, '', '#' + t); }
$$('.tabs button').forEach(b => b.onclick = () => showTab(b.dataset.t));
$('#teamlist').innerHTML = Object.values(TEAMS).flat().map(t => `<option value="${esc(t)}">`).join('');

/* ---------- CALCULATOR ---------- */
let selCipher = 'eo';
let words = LS.get('words', ['Detroit Lions', 'Thanksgiving', 'Chicago Bears']);
function renderCalc() {
  const p = $('#phrase').value || $('#phrase').placeholder, find = +$('#findnum').value || null;
  const vals = Gem.allValues(p);
  $('#cipherGrid').innerHTML = C.map(c => `<div class="cv ${vals[c.id] === find ? 'hit' : ''} ${selCipher === c.id ? 'sel' : ''}" style="--c:${c.color}" data-c="${c.id}"><div class="n">${vals[c.id]}</div><div class="t">${c.name}</div></div>`).join('');
  $$('#cipherGrid .cv').forEach(el => el.onclick = () => { selCipher = el.dataset.c; renderCalc(); });
  const c = C.find(x => x.id === selCipher), bd = Gem.breakdown(p, c);
  const b = $('#breakdown'); b.classList.toggle('hidden', !bd.length);
  b.innerHTML = `<div class="row between"><h2 style="margin:0">${esc(c.name)}</h2><span class="pill">${vals[c.id]}</span></div><div class="letters">${bd.map(([ch, v]) => `<div class="lt"><b>${esc(ch)}</b><i>${v}</i></div>`).join('')}</div>`;
  const list = words.slice(); if ($('#phrase').value && !list.includes($('#phrase').value)) list.unshift($('#phrase').value);
  $('#cmpTable').innerHTML = `<tr><th>Phrase</th>${C.map(c => `<th title="${esc(c.name)}">${esc(c.short)}</th>`).join('')}<th></th></tr>` +
    list.map(w => { const v = Gem.allValues(w); return `<tr><td>${esc(w)}</td>${C.map(c => `<td class="${v[c.id] === find ? 'hit' : ''}">${v[c.id]}</td>`).join('')}<td class="x" data-w="${esc(w)}">${words.includes(w) ? '✕' : ''}</td></tr>`; }).join('');
  $$('#cmpTable .x').forEach(x => x.onclick = () => { words = words.filter(w => w !== x.dataset.w); LS.set('words', words); renderCalc(); });
}
$('#phrase').oninput = renderCalc; $('#findnum').oninput = renderCalc;
$('#saveword').onclick = () => { const w = $('#phrase').value.trim(); if (!w) return; words = [w, ...words.filter(x => x !== w)].slice(0, 30); LS.set('words', words); $('#phrase').value = ''; renderCalc(); toast('Added to compare list'); };
$('#clearwords').onclick = () => { words = []; LS.set('words', words); renderCalc(); };

/* ---------- DATES ---------- */
function renderDates() {
  const p = parseISO($('#dateIn').value); if (!p) return;
  const hol = Gem.holidays(p.y).find(h => h.m === p.m && h.d === p.d);
  $('#dateLabel').textContent = fmtDate(p) + (hol ? ' · ' + hol.name : '');
  $('#dateGrid').innerHTML = Gem.dateValues(p.y, p.m, p.d).map(d => `<div class="dv"><div class="n">${d.v}</div><div class="t">${esc(d.label)}</div><div class="f">${esc(d.formula)}</div></div>`).join('');
}
function renderSpan() {
  const a = parseISO($('#spanA').value), b = parseISO($('#spanB').value); if (!a || !b) { $('#spanOut').textContent = ''; return; }
  const n = Math.round(Math.abs(Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 864e5);
  $('#spanOut').innerHTML = `<b>${n}</b> days · <b>${n + 1}</b> counting both ends · ${Math.floor(n / 7)} weeks ${n % 7} days`;
}
$('#dateIn').oninput = renderDates; $('#spanA').oninput = renderSpan; $('#spanB').oninput = renderSpan;

/* ---------- HOLIDAYS ---------- */
let holYear = new Date().getFullYear();
function renderHol() {
  $('#yLbl').textContent = holYear;
  const key = ['eo', 'fr', 'ro', 'rfr'];
  $('#holList').innerHTML = Gem.holidays(holYear).map((h, i) => {
    const dv = Gem.dateValues(h.y, h.m, h.d), v0 = Gem.allValues(h.words[0]);
    return `<details class="hol" ${h.name === 'Thanksgiving' ? 'open' : ''}><summary><div><div class="hn">${esc(h.name)}</div><div class="hd">${fmtDate(h)}</div></div><div class="chips">${['fr', 'rfr'].map(id => { const c = C.find(x => x.id === id); return `<span class="chip" style="--c:${c.color}"><span class="muted" style="font-weight:600">${c.short}</span> ${v0[id]}</span>`; }).join('')}</div></summary>
    <div class="body"><div class="scroll-x"><table class="tbl"><tr><th>Words</th>${key.map(id => `<th>${C.find(c => c.id === id).short}</th>`).join('')}<th>Jewish</th><th>Sumer</th></tr>
    ${h.words.map(w => { const v = Gem.allValues(w); return `<tr><td>${esc(w)}</td>${key.map(id => `<td>${v[id]}</td>`).join('')}<td>${v.jew}</td><td>${v.sum}</td></tr>`; }).join('')}</table></div>
    <div class="calls">${dv.filter(d => d.id !== 'd8').map(d => `<span class="call">${esc(d.label)}: <b>${d.v}</b></span>`).join('')}</div>
    <button class="btn ghost wide" data-hi="${i}">Use in Connect the dots</button></div></details>`;
  }).join('');
  $$('#holList [data-hi]').forEach(b => b.onclick = () => { const h = Gem.holidays(holYear)[+b.dataset.hi]; $('#gDate').value = `${h.y}-${pad(h.m)}-${pad(h.d)}`; fillHolSelect(); $('#gHol').value = h.name; renderDots(); showTab('dots'); });
}
$('#yPrev').onclick = () => { holYear--; renderHol(); }; $('#yNext').onclick = () => { holYear++; renderHol(); };

/* ---------- CONNECT THE DOTS ---------- */
let dotsMode = 'match', picks = new Map();
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
const dotLine = d => d.cid === 'date' ? `${esc(d.method.replace('Date: ', 'Date · '))}` : `${esc(d.src)} <span class="cph">· ${esc(d.cipher)}</span>`;
function pickKey(v, target) { return v + '|' + target; }
function togglePick(v, target, ds) { const k = pickKey(v, target); if (picks.has(k)) picks.delete(k); else picks.set(k, { v, target, dots: ds }); $('#pickCount').textContent = picks.size; renderDots(); }
function renderDots() {
  const ds = gameDots(), sa = $('#sA').value, sb = $('#sB').value, A = $('#tA').value || 'Team A', B = $('#tB').value || 'Team B';
  const out = $('#dotsOut'); $('#pickCount').textContent = picks.size;
  if (!ds.length) { out.innerHTML = '<div class="card empty">Enter two teams and a date to start connecting dots.</div>'; return; }
  if (dotsMode === 'match') {
    if (sa === '' || sb === '') { out.innerHTML = '<div class="card empty">Enter the final score for both teams to see which numbers connected.<br>Or switch to <b>Simulate</b> to see what the numbers point to before the game.</div>' + valueTable(ds, []); return; }
    const a = +sa, b = +sb;
    const targets = [{ key: 'total', label: 'Total points', v: a + b }, { key: 'a', label: A, v: a }, { key: 'b', label: B, v: b }, { key: 'margin', label: 'Margin', v: Math.abs(a - b) }];
    const m = Gem.match(ds, targets), n = m.reduce((s, t) => s + t.hits.length, 0);
    out.innerHTML = `<div class="card"><div class="row between"><div><h2 style="margin:0">${n} dot${n === 1 ? '' : 's'} connect</h2><div class="small muted">${esc(A)} ${a} · ${esc(B)} ${b}</div></div><span class="pill">Total ${a + b}</span></div></div>` +
      m.map(t => `<div class="card target ${t.hits.length ? 'has' : ''}"><div class="th"><div><div class="lbl" style="margin:0">${esc(t.label)}</div><div class="big">${t.v}</div></div><span class="pill">${t.hits.length ? t.hits.length + ' match' + (t.hits.length > 1 ? 'es' : '') : 'no match'}</span></div>
      ${t.hits.map(d => `<div class="dot ${picks.has(pickKey(t.v, t.key)) ? 'picked' : ''}" data-v="${t.v}" data-t="${t.key}"><span class="src">${dotLine(d)}</span><span class="cph">${esc(d.method.startsWith('Date') ? d.src : d.method)}</span></div>`).join('')}</div>`).join('') +
      valueTable(ds, targets.map(t => t.v));
    $$('#dotsOut .dot').forEach(el => el.onclick = () => { const t = m.find(x => x.key === el.dataset.t); togglePick(+el.dataset.v, el.dataset.t, t.hits); });
  } else {
    const sport = $('#sport').value, s = Gem.simulate(ds, sport);
    const cand = (list, target, title, rng) => `<div class="card"><h2>${title}</h2><p class="small muted">Range ${rng[0]}–${rng[1]}. Ranked by how many different sources point to the same number.</p>${list.slice(0, 8).map(c => {
      const kinds = [...new Set(c.dots.map(d => d.method.startsWith('Date') ? 'Date' : d.method))];
      return `<div class="cand ${picks.has(pickKey(c.v, target)) ? 'picked' : ''}" data-v="${c.v}" data-t="${target}"><div class="cn">${c.v}</div><div class="meta"><b>${kinds.join(' + ')}</b> · ${c.n} dot${c.n > 1 ? 's' : ''}<br>${c.dots.slice(0, 4).map(dotLine).join('<br>')}${c.n > 4 ? `<br>+${c.n - 4} more` : ''}<div class="bar"><i style="width:${Math.min(100, c.kinds * 30 + c.n * 6)}%"></i></div></div></div>`; }).join('') || '<div class="empty">No values land in this range.</div>'}${list.length > 8 ? `<p class="lbl" style="margin-top:14px">Every other number in range</p><div class="calls">${list.slice(8).sort((a, b) => a.v - b.v).map(c => `<span class="call cand-chip ${picks.has(pickKey(c.v, target)) ? 'hit' : ''}" data-v="${c.v}" data-t="${target}" title="${esc(c.dots.map(d => d.src + ' · ' + d.cipher).join('\n'))}"><b>${c.v}</b> · ${c.n}</span>`).join('')}</div>` : ''}</div>`;
    out.innerHTML = `<div class="note">Simulate lists the numbers your words and the date point to, where several sources overlap. These are number patterns only, not predictions. Tap a number to log it as a call, then save the game and grade it after the final.</div>` +
      cand(s.totals, 'total', 'Totals the numbers point to', s.range.total) + cand(s.teams, 'either', 'Team scores the numbers point to', s.range.team);
    $$('#dotsOut .cand, #dotsOut .cand-chip').forEach(el => el.onclick = () => { const v = +el.dataset.v, t = el.dataset.t; togglePick(v, t, (t === 'total' ? s.totals : s.teams).find(c => c.v === v).dots); });
  }
}
function valueTable(ds, hitVals) {
  const rows = {}; ds.filter(d => d.cid !== 'date').forEach(d => { (rows[d.method + '|' + d.src] = rows[d.method + '|' + d.src] || { label: d.src, kind: d.method, v: {} }).v[d.cid] = d.v; });
  const dates = ds.filter(d => d.cid === 'date');
  return `<div class="card"><h2>All values</h2><div class="scroll-x"><table class="tbl"><tr><th>Source</th>${C.map(c => `<th>${esc(c.short)}</th>`).join('')}</tr>${Object.values(rows).map(r => `<tr><td>${esc(r.label)}</td>${C.map(c => `<td class="${hitVals.includes(r.v[c.id]) ? 'hit' : ''}">${r.v[c.id]}</td>`).join('')}</tr>`).join('')}</table></div>
  <div class="calls">${dates.map(d => `<span class="call ${hitVals.includes(d.v) ? 'hit' : ''}">${esc(d.method.replace('Date: ', ''))}: <b>${d.v}</b></span>`).join('')}</div></div>`;
}
['#sport', '#tA', '#tB', '#gHol', '#gExtra', '#sA', '#sB'].forEach(s => $(s).addEventListener('input', renderDots));
$('#gDate').addEventListener('input', () => { fillHolSelect(); renderDots(); });
$$('#dotsMode button').forEach(b => b.onclick = () => { dotsMode = b.dataset.m; $$('#dotsMode button').forEach(x => x.classList.toggle('on', x === b)); renderDots(); });
$('#loadEx').onclick = () => { $('#sport').value = 'NFL'; $('#tA').value = 'Chicago Bears'; $('#tB').value = 'Detroit Lions'; $('#gDate').value = '2026-11-26'; fillHolSelect(); $('#gHol').value = 'Thanksgiving'; $('#gExtra').value = ''; $('#sA').value = 39; $('#sB').value = 35; picks.clear(); renderDots(); };
const callsFromPicks = () => [...picks.values()].flatMap(p => { const seen = new Set(); return p.dots.filter(d => { const k = d.cid + '|' + d.method; if (seen.has(k)) return false; seen.add(k); return true; }).map(d => ({ v: p.v, target: p.target, cipher: d.cipher, method: d.method, src: d.cid === 'date' ? d.src : d.src })); });
$('#saveGame').onclick = () => {
  const p = parseISO($('#gDate').value); if (!$('#tA').value.trim() || !$('#tB').value.trim() || !p) return toast('Add both teams and a date first');
  const g = { id: 'g' + Date.now().toString(36), date: $('#gDate').value, sport: $('#sport').value, a: $('#tA').value.trim(), b: $('#tB').value.trim(), holiday: $('#gHol').value, sa: $('#sA').value === '' ? null : +$('#sA').value, sb: $('#sB').value === '' ? null : +$('#sB').value, calls: callsFromPicks() };
  games.unshift(g); LS.set('games', games); picks.clear(); renderDots(); renderTracker(); toast(`Saved with ${g.calls.length} call${g.calls.length === 1 ? '' : 's'}`);
};

/* ---------- TRACKER ---------- */
let games = LS.get('games', []), statMode = 'cipher';
const TARGETS = { total: 'Total', either: 'Either team', a: 'Team A', b: 'Team B', margin: 'Margin', any: 'Any' };
function grade(g, c) {
  if (g.sa == null || g.sb == null || g.sa === '' || g.sb === '') return null;
  const a = +g.sa, b = +g.sb, t = { total: [a + b], a: [a], b: [b], margin: [Math.abs(a - b)], either: [a, b], any: [a + b, a, b, Math.abs(a - b)] }[c.target] || [];
  return t.includes(+c.v);
}
const methodGroup = m => /^Team [AB]$/.test(m) ? 'Team name' : m;
function renderTracker() {
  const rows = games.flatMap(g => g.calls.map(c => ({ g, c, r: grade(g, c) }))).filter(x => x.r !== null);
  const hits = rows.filter(x => x.r).length;
  $('#trkSummary').textContent = rows.length ? `${hits}/${rows.length} hit · ${Math.round(hits / rows.length * 100)}%` : `${games.length} game${games.length === 1 ? '' : 's'}`;
  const keyOf = x => statMode === 'cipher' ? x.c.cipher : statMode === 'method' ? methodGroup(x.c.method) : TARGETS[x.c.target] || x.c.target;
  const grp = {}; rows.forEach(x => { const k = keyOf(x); (grp[k] = grp[k] || { h: 0, n: 0 }); grp[k].n++; if (x.r) grp[k].h++; });
  const list = Object.entries(grp).sort((a, b) => b[1].h / b[1].n - a[1].h / a[1].n || b[1].n - a[1].n);
  $('#stats').innerHTML = list.length ? list.map(([k, s]) => `<div class="stat"><div class="sh"><span>${esc(k)}</span><b>${s.h}/${s.n} · ${Math.round(s.h / s.n * 100)}%</b></div><div class="bar"><i style="width:${s.h / s.n * 100}%"></i></div></div>`).join('') : '<div class="empty">Graded calls show up here. Save a game with number calls, then add the final score.</div>';
  $('#games').innerHTML = games.length ? games.map(g => {
    const done = grade(g, { v: 0, target: 'total' }) !== null;
    return `<div class="game" data-id="${g.id}"><div class="gh"><div><div class="gt">${esc(g.a)} vs ${esc(g.b)}</div><div class="gd">${esc(g.sport)} · ${fmtDate(parseISO(g.date))}${g.holiday ? ' · ' + esc(g.holiday) : ''}</div></div><div class="sc">${done ? `${g.sa}–${g.sb}` : '<span class="pill">pending</span>'}</div></div>
    <div class="calls">${g.calls.map(c => { const r = grade(g, c); return `<span class="call ${r === true ? 'hit' : r === false ? 'miss' : ''}">${r === true ? '✓' : r === false ? '✕' : '•'} <b>${esc(c.v)}</b> ${esc(TARGETS[c.target] || c.target)} · ${esc(c.cipher)}${c.method && !/^Manual$/.test(c.method) ? ' · ' + esc(c.method.replace('Date: ', '')) : ''}</span>`; }).join('') || '<span class="muted small">No calls logged</span>'}</div>
    <div class="acts"><input type="number" inputmode="numeric" placeholder="A" value="${g.sa ?? ''}" data-f="sa"><input type="number" inputmode="numeric" placeholder="B" value="${g.sb ?? ''}" data-f="sb"><button class="btn ghost" data-act="grade">Grade</button><span style="flex:1"></span><button class="link" data-act="del" style="color:var(--red)">Delete</button></div></div>`;
  }).join('') : '<div class="card empty">No games yet. Use Connect the dots → Save, or add one above.</div>';
  $$('#games .game').forEach(el => {
    const g = games.find(x => x.id === el.dataset.id);
    el.querySelector('[data-act=grade]').onclick = () => { const a = el.querySelector('[data-f=sa]').value, b = el.querySelector('[data-f=sb]').value; g.sa = a === '' ? null : +a; g.sb = b === '' ? null : +b; LS.set('games', games); renderTracker(); toast('Graded'); };
    el.querySelector('[data-act=del]').onclick = () => { if (confirm('Delete this game?')) { games = games.filter(x => x !== g); LS.set('games', games); renderTracker(); } };
  });
}
$$('#statMode button').forEach(b => b.onclick = () => { statMode = b.dataset.s; $$('#statMode button').forEach(x => x.classList.toggle('on', x === b)); renderTracker(); });
$('#toggleAdd').onclick = () => { const f = $('#addForm'); f.classList.toggle('hidden'); $('#toggleAdd').textContent = f.classList.contains('hidden') ? 'Open' : 'Close'; if (!$('#mCalls').children.length) addCallRow(); };
function addCallRow() {
  const d = document.createElement('div'); d.className = 'callrow';
  d.innerHTML = `<input type="number" inputmode="numeric" placeholder="#"><select>${Object.entries(TARGETS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select><select>${C.map(c => `<option>${esc(c.name)}</option>`).join('')}<option>Date</option><option>Other</option></select><button aria-label="remove">×</button>`;
  d.querySelector('button').onclick = () => d.remove(); $('#mCalls').appendChild(d);
}
$('#mAddCall').onclick = addCallRow;
$('#mSave').onclick = () => {
  if (!$('#mA').value.trim() || !$('#mB').value.trim()) return toast('Add both teams');
  const calls = $$('#mCalls .callrow').map(r => { const [n, t, c] = r.querySelectorAll('input,select'); return n.value === '' ? null : { v: +n.value, target: t.value, cipher: c.value, method: c.value === 'Date' ? 'Date' : 'Manual', src: '' }; }).filter(Boolean);
  games.unshift({ id: 'g' + Date.now().toString(36), date: $('#mDate').value || todayISO(), sport: $('#mSport').value, a: $('#mA').value.trim(), b: $('#mB').value.trim(), holiday: '', sa: $('#mSA').value === '' ? null : +$('#mSA').value, sb: $('#mSB').value === '' ? null : +$('#mSB').value, calls });
  LS.set('games', games); ['#mA', '#mB', '#mSA', '#mSB'].forEach(s => $(s).value = ''); $('#mCalls').innerHTML = ''; addCallRow(); renderTracker(); toast('Game saved');
};
/* CSV */
const COLS = ['game_id', 'date', 'sport', 'team_a', 'team_b', 'holiday', 'score_a', 'score_b', 'call_number', 'call_target', 'cipher', 'method', 'source', 'result'];
const csvCell = v => { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
$('#expCsv').onclick = () => {
  const lines = [COLS.join(',')];
  games.forEach(g => { const base = [g.id, g.date, g.sport, g.a, g.b, g.holiday, g.sa, g.sb]; if (!g.calls.length) lines.push([...base, '', '', '', '', '', ''].map(csvCell).join(',')); g.calls.forEach(c => { const r = grade(g, c); lines.push([...base, c.v, c.target, c.cipher, c.method, c.src, r === null ? 'pending' : r ? 'hit' : 'miss'].map(csvCell).join(',')); }); });
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv' })); a.download = `gematria-tracker-${todayISO()}.csv`; a.click(); toast('CSV exported');
};
function parseCSV(t) { const rows = []; let row = [], cell = '', q = false; for (let i = 0; i < t.length; i++) { const ch = t[i]; if (q) { if (ch === '"' && t[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; } else if (ch === '"') q = true; else if (ch === ',') { row.push(cell); cell = ''; } else if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; } else cell += ch; } if (cell || row.length) { row.push(cell); rows.push(row); } return rows.filter(r => r.some(x => x !== '')); }
$('#impCsv').onchange = async e => {
  const f = e.target.files[0]; if (!f) return; const rows = parseCSV(await f.text()); const h = rows.shift().map(s => s.trim()); const ix = k => h.indexOf(k);
  if (ix('team_a') < 0) return toast('Not a tracker CSV');
  const map = new Map(); rows.forEach(r => { const id = r[ix('game_id')] || ('g' + Math.random().toString(36).slice(2)); const num = x => x === '' || x == null ? null : +x;
    if (!map.has(id)) map.set(id, { id, date: r[ix('date')], sport: r[ix('sport')] || 'NFL', a: r[ix('team_a')], b: r[ix('team_b')], holiday: r[ix('holiday')] || '', sa: num(r[ix('score_a')]), sb: num(r[ix('score_b')]), calls: [] });
    if (r[ix('call_number')] !== '' && r[ix('call_number')] != null) map.get(id).calls.push({ v: +r[ix('call_number')], target: r[ix('call_target')] || 'total', cipher: r[ix('cipher')] || 'Other', method: r[ix('method')] || 'Manual', src: r[ix('source')] || '' }); });
  const ids = new Set(map.keys()); games = [...map.values(), ...games.filter(g => !ids.has(g.id))]; LS.set('games', games); renderTracker(); toast(`Imported ${map.size} game${map.size === 1 ? '' : 's'}`); e.target.value = '';
};

/* init */
const t = todayISO(); $('#dateIn').value = t; $('#gDate').value = t; $('#mDate').value = t; $('#spanA').value = `${new Date().getFullYear()}-01-01`; $('#spanB').value = t;
fillHolSelect(); renderCalc(); renderDates(); renderSpan(); renderHol(); renderDots(); renderTracker();
const h = location.hash.slice(1); if (['calc', 'dates', 'hol', 'dots', 'track'].includes(h)) showTab(h);
})();

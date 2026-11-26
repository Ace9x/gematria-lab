/* Joe's Gematria Lab — cipher + date math (pure functions, browser + node) */
(function (root) {
  const A = 'abcdefghijklmnopqrstuvwxyz';
  const reduceFull = n => { while (n > 9) n = String(n).split('').reduce((s, d) => s + +d, 0); return n; };
  const reduceOnce = n => n > 9 ? String(n).split('').reduce((s, d) => s + +d, 0) : n;
  const JEWISH = { a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,k:10,l:20,m:30,n:40,o:50,p:60,q:70,r:80,s:90,t:100,u:200,x:300,y:400,z:500,j:600,v:700,w:900 };
  const map = fn => { const m = {}; A.split('').forEach((c, i) => m[c] = fn(i + 1)); return m; };
  const ORD = map(n => n), REV = map(n => 27 - n);
  const CIPHERS = [
    { id: 'eo',  name: 'English Ordinal',          short: 'Ordinal',    color: '#7cc4ff', table: ORD },
    { id: 'fr',  name: 'Full Reduction',           short: 'Reduction',  color: '#8ef0b0', table: map(reduceFull) },
    { id: 'ro',  name: 'Reverse Ordinal',          short: 'Rev Ord',    color: '#ffb86b', table: REV },
    { id: 'rfr', name: 'Reverse Full Reduction',   short: 'Rev Red',    color: '#ff7eb6', table: map(n => reduceFull(27 - n)) },
    { id: 'sr',  name: 'Single Reduction',         short: 'Single Red', color: '#b9a3ff', table: map(reduceOnce) },
    { id: 'rsr', name: 'Reverse Single Reduction', short: 'Rev Single', color: '#f6e27a', table: map(n => reduceOnce(27 - n)) },
    { id: 'jew', name: 'Jewish',                   short: 'Jewish',     color: '#6ee7e7', table: JEWISH },
    { id: 'sum', name: 'English (Sumerian)',       short: 'Sumerian',   color: '#ffd27f', table: map(n => n * 6) },
    { id: 'rsum',name: 'Reverse English (Sumerian)',short: 'Rev Sumer', color: '#ff9f80', table: map(n => (27 - n) * 6) },
    { id: 'fb',  name: 'Francis Bacon',            short: 'Bacon',      color: '#c7d2fe', caseSensitive: true },
  ];
  function value(text, c) {
    let s = 0;
    for (const ch of String(text)) {
      if (c.caseSensitive) {
        const lo = A.indexOf(ch), up = A.indexOf(ch.toLowerCase());
        if (lo >= 0) s += lo + 1; else if (up >= 0 && ch !== ch.toLowerCase()) s += up + 27;
      } else {
        const v = c.table[ch.toLowerCase()]; if (v) s += v;
      }
    }
    return s;
  }
  function allValues(text) { const o = {}; CIPHERS.forEach(c => o[c.id] = value(text, c)); return o; }
  function breakdown(text, c) {
    return [...String(text)].filter(ch => /[a-z]/i.test(ch)).map(ch => [ch, value(ch, c)]);
  }

  /* ---- dates ---- */
  const digits = n => String(n).split('').reduce((s, d) => s + +d, 0);
  const isLeap = y => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  function dayOfYear(y, m, d) { return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 864e5) + 1; }
  function dateValues(y, m, d) {
    const yy = y % 100, c = Math.floor(y / 100), doy = dayOfYear(y, m, d), len = isLeap(y) ? 366 : 365;
    return [
      { id: 'd1', label: 'm + d + cc + yy',          formula: `${m}+${d}+${c}+${yy}`, v: m + d + c + yy },
      { id: 'd2', label: 'm + d + yy',               formula: `${m}+${d}+${yy}`, v: m + d + yy },
      { id: 'd3', label: 'm + d + year digits',      formula: `${m}+${d}+${String(y).split('').join('+')}`, v: m + d + digits(y) },
      { id: 'd4', label: 'all digits',               formula: `${String(m).split('').join('+')}+${String(d).split('').join('+')}+${String(y).split('').join('+')}`, v: digits(m) + digits(d) + digits(y) },
      { id: 'd5', label: 'm + d + yy digits',        formula: `${m}+${d}+${String(yy).padStart(2,'0').split('').join('+')}`, v: m + d + digits(yy) },
      { id: 'd6', label: 'm + d',                    formula: `${m}+${d}`, v: m + d },
      { id: 'd7', label: 'm digits + d digits + yy',        formula: `${String(m).split('').join('+')}+${String(d).split('').join('+')}+${yy}`, v: digits(m) + digits(d) + yy },
      { id: 'd8', label: 'm + d + yyyy',             formula: `${m}+${d}+${y}`, v: m + d + y },
      { id: 'd9', label: 'Day of year',              formula: `day ${doy} of ${len}`, v: doy },
      { id: 'd10',label: 'Days left in year',        formula: `${len}−${doy}`, v: len - doy },
      { id: 'd11',label: 'Days left (incl. today)',  formula: `${len}−${doy}+1`, v: len - doy + 1 },
      { id: 'd12',label: 'Date reduced',             formula: `reduce(${digits(m) + digits(d) + digits(y)})`, v: reduceFull(digits(m) + digits(d) + digits(y)) },
    ];
  }

  /* ---- holidays ---- */
  const nthDow = (y, m, dow, n) => { const f = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(); return 1 + ((dow - f + 7) % 7) + (n - 1) * 7; };
  const lastDow = (y, m, dow) => { const last = new Date(Date.UTC(y, m, 0)).getUTCDate(); const l = new Date(Date.UTC(y, m - 1, last)).getUTCDay(); return last - ((l - dow + 7) % 7); };
  function easter(y) { const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1; return [mo,da]; }
  function holidays(y) {
    const H = (name, m, d, words) => ({ name, m, d, y, words: words || [name] });
    const [em, ed] = easter(y);
    const tg = nthDow(y, 11, 4, 4);
    return [
      H("New Year's Day", 1, 1, ["New Year's Day", 'New Years']),
      H('MLK Day', 1, nthDow(y, 1, 1, 3), ['Martin Luther King', 'MLK Day']),
      H('Super Bowl Sunday', 2, nthDow(y, 2, 0, 2), ['Super Bowl', 'Super Bowl Sunday']),
      H("Valentine's Day", 2, 14, ["Valentine's Day", 'Valentine']),
      H("Presidents' Day", 2, nthDow(y, 2, 1, 3), ["Presidents Day"]),
      H("St. Patrick's Day", 3, 17, ["Saint Patrick's Day", 'St Patricks Day']),
      H('Easter', em, ed, ['Easter', 'Easter Sunday']),
      H("Mother's Day", 5, nthDow(y, 5, 0, 2), ["Mother's Day"]),
      H('Memorial Day', 5, lastDow(y, 5, 1)),
      H("Father's Day", 6, nthDow(y, 6, 0, 3), ["Father's Day"]),
      H('Juneteenth', 6, 19),
      H('Independence Day', 7, 4, ['Independence Day', 'Fourth of July', 'July Fourth']),
      H('Labor Day', 9, nthDow(y, 9, 1, 1)),
      H('Columbus Day', 10, nthDow(y, 10, 1, 2)),
      H('Halloween', 10, 31),
      H('Veterans Day', 11, 11),
      H('Thanksgiving', 11, tg, ['Thanksgiving', 'Thanksgiving Day']),
      H('Black Friday', 11, tg + 1),
      H('Christmas Eve', 12, 24),
      H('Christmas', 12, 25, ['Christmas', 'Christmas Day']),
      H("New Year's Eve", 12, 31, ["New Year's Eve"]),
    ];
  }

  /* ---- connect the dots ---- */
  // sources: [{label, text, kind}] -> all number "dots" with provenance
  function dots(sources, date) {
    const out = [];
    sources.forEach(src => {
      if (!src.text || !src.text.trim()) return;
      const phrases = [src.text.trim()];
      const words = src.text.trim().split(/\s+/).filter(w => /[a-z]/i.test(w));
      if (words.length > 1) words.forEach(w => phrases.push(w));
      phrases.forEach(p => CIPHERS.forEach(c => out.push({ v: value(p, c), cipher: c.name, cid: c.id, method: src.kind, src: p })));
    });
    if (date) dateValues(date.y, date.m, date.d).forEach(dv => out.push({ v: dv.v, cipher: 'Date', cid: 'date', method: 'Date: ' + dv.label, src: dv.formula }));
    return out;
  }
  function match(allDots, targets) { // targets: [{key,label,v}]
    return targets.map(t => ({ ...t, hits: allDots.filter(d => d.v === t.v) }));
  }
  const RANGES = { NFL: { total: [20, 80], team: [0, 56] }, NCAAF: { total: [20, 100], team: [0, 70] }, NBA: { total: [180, 280], team: [80, 150] }, NCAAB: { total: [110, 180], team: [50, 110] }, WNBA: { total: [130, 200], team: [60, 110] }, MLB: { total: [1, 25], team: [0, 15] }, NHL: { total: [1, 13], team: [0, 9] }, Soccer: { total: [0, 8], team: [0, 6] } };
  function simulate(allDots, sport) {
    const r = RANGES[sport] || RANGES.NFL; const by = {};
    allDots.forEach(d => { (by[d.v] = by[d.v] || []).push(d); });
    const rank = ([lo, hi]) => Object.keys(by).map(Number).filter(v => v >= lo && v <= hi)
      .map(v => { const ds = by[v]; const kinds = new Set(ds.map(d => d.method.startsWith('Date') ? 'Date' : d.method)); return { v, dots: ds, n: ds.length, kinds: kinds.size }; })
      .sort((a, b) => b.kinds - a.kinds || b.n - a.n || a.v - b.v);
    return { totals: rank(r.total), teams: rank(r.team), range: r };
  }

  const api = { CIPHERS, value, allValues, breakdown, dateValues, dayOfYear, holidays, dots, match, simulate, RANGES, reduceFull };
  if (typeof module !== 'undefined') module.exports = api; else root.Gem = api;
})(this);

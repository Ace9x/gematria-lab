const G = require('./gematria.js'); const assert = require('assert');
const by = id => G.CIPHERS.find(c => c.id === id);
const v = (t, id) => G.value(t, by(id));
// independent hand-arithmetic checks
const ord = s => [...s.toLowerCase()].filter(c=>/[a-z]/.test(c)).reduce((a,c)=>a+c.charCodeAt(0)-96,0);
const red = n => { while(n>9) n=[...String(n)].reduce((a,d)=>a+ +d,0); return n; };
const fr = s => [...s.toLowerCase()].filter(c=>/[a-z]/.test(c)).reduce((a,c)=>a+red(c.charCodeAt(0)-96),0);
const rfr = s => [...s.toLowerCase()].filter(c=>/[a-z]/.test(c)).reduce((a,c)=>a+red(27-(c.charCodeAt(0)-96)),0);
const cases = [
  ['Detroit Lions','eo',160],['Detroit Lions','fr',61],['Detroit Lions','ro',164],['Detroit Lions','rfr',74],
  ['Thanksgiving','eo',141],['Thanksgiving','fr',60],['Thanksgiving','rfr',66],['Thanksgiving','ro',183],
  ['Jesus','eo',74],['Jesus','fr',11],['Jesus','jew',985],['Jesus','sum',444],
  ['Donald Trump','eo',138],['Donald Trump','sum',828],
  ['Chicago Bears','eo',91],
];
for (const [t,id,exp] of cases) { const got=v(t,id); console.log(`${t.padEnd(14)} ${by(id).name.padEnd(26)} = ${got}`); assert.strictEqual(got,exp,`${t} ${id}`); }
for (const t of ['Detroit Lions','Chicago Bears','Thanksgiving','Super Bowl','New York Jets']) { assert.strictEqual(v(t,'eo'),ord(t)); assert.strictEqual(v(t,'fr'),fr(t)); assert.strictEqual(v(t,'rfr'),rfr(t)); assert.strictEqual(v(t,'sum'),ord(t)*6); assert.strictEqual(v(t,'ro'),[...t.toLowerCase()].filter(c=>/[a-z]/.test(c)).length*27-ord(t)); }
// single reduction: S = 10 ; reverse single: H = 10
assert.strictEqual(v('s','sr'),10); assert.strictEqual(v('h','rsr'),10); assert.strictEqual(v('k','sr'),2);
// Bacon: lowercase 1-26, uppercase 27-52
assert.strictEqual(v('a','fb'),1); assert.strictEqual(v('A','fb'),27); assert.strictEqual(v('Detroit Lions','fb'),160+2*26);
// which ciphers give 74 for Detroit Lions
console.log('Detroit Lions = 74 in:', G.CIPHERS.filter(c=>G.value('Detroit Lions',c)===74).map(c=>c.name));
// dates: Thanksgiving 2026 = Nov 26
const tg = G.holidays(2026).find(h=>h.name==='Thanksgiving'); assert.deepStrictEqual([tg.m,tg.d],[11,26]);
const dv = Object.fromEntries(G.dateValues(2026,11,26).map(d=>[d.id,d.v]));
console.log('11/26/2026', G.dateValues(2026,11,26).map(d=>`${d.label}=${d.v}`).join(' | '));
assert.strictEqual(dv.d1,83); assert.strictEqual(dv.d2,63); assert.strictEqual(dv.d3,47); assert.strictEqual(dv.d4,20); assert.strictEqual(dv.d6,37); assert.strictEqual(dv.d9,330); assert.strictEqual(dv.d10,35);
const h27 = G.holidays(2027); const get=n=>h27.find(h=>h.name===n); assert.deepStrictEqual([get('Easter').m,get('Easter').d],[3,28]); assert.deepStrictEqual([get('Super Bowl Sunday').m,get('Super Bowl Sunday').d],[2,14]);
assert.deepStrictEqual([G.holidays(2026).find(h=>h.name==='Memorial Day').d, G.holidays(2026).find(h=>h.name==='Labor Day').d, G.holidays(2026).find(h=>h.name==='MLK Day').d],[25,7,19]);
// matcher: Bears 39 Lions 35 on Thanksgiving -> total 74 hits Detroit Lions RFR
const ds = G.dots([{text:'Chicago Bears',kind:'Team A'},{text:'Detroit Lions',kind:'Team B'},{text:'Thanksgiving',kind:'Holiday'}],{y:2026,m:11,d:26});
const m = G.match(ds,[{key:'total',v:74},{key:'a',v:39},{key:'b',v:35},{key:'margin',v:4}]);
assert(m[0].hits.some(h=>h.src==='Detroit Lions'&&h.cid==='rfr'));
m.forEach(x=>console.log(x.key,x.v,'->',x.hits.map(h=>`${h.src}/${h.cipher}`).join(', ')||'none'));
console.log('ALL TESTS PASSED');

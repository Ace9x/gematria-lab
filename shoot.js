const { chromium } = require('/workspace/qa-tools/node_modules/playwright-core');
const base = process.argv[2] || 'http://localhost:8765/';
const out = process.argv[3] || 'shots/local';
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto(base, { waitUntil: 'networkidle' });
  // calculator
  await p.fill('#phrase', 'Detroit Lions'); await p.fill('#findnum', '74'); await p.click('#cipherGrid [data-c=rfr]');
  await p.screenshot({ path: `${out}-1-calculator.png` });
  await p.screenshot({ path: `${out}-1b-calculator-full.png`, fullPage: true });
  // matcher
  await p.click('.tabs [data-t=dots]'); await p.click('#loadEx'); await p.waitForTimeout(400);
  await p.evaluate(() => window.scrollTo(0, document.querySelector('#dotsOut').offsetTop - 70));
  await p.screenshot({ path: `${out}-2-matcher.png` });
  await p.screenshot({ path: `${out}-2b-matcher-full.png`, fullPage: true });
  // simulate (clear scores to mimic pre-game, pick 74 + 60 + 66)
  await p.click('#dotsMode [data-m=sim]'); await p.waitForTimeout(150);
  for (const v of ['74', '60', '66']) { const el = await p.$(`[data-t=total][data-v="${v}"]`); if (el) await el.click(); else console.log('no candidate', v); }
  await p.evaluate(() => window.scrollTo(0, document.querySelector('#dotsOut').offsetTop - 70));
  await p.screenshot({ path: `${out}-3-simulate.png` });
  await p.click('#saveGame'); await p.waitForTimeout(2100);
  // tracker: add a second manual game pending
  await p.click('.tabs [data-t=track]'); await p.waitForTimeout(400);
  await p.screenshot({ path: `${out}-4-tracker.png` });
  await p.click('#statMode [data-s=method]'); await p.screenshot({ path: `${out}-4b-tracker-method.png`, fullPage: true });
  // holidays + dates
  await p.click('.tabs [data-t=hol]'); await p.waitForTimeout(400); await p.screenshot({ path: `${out}-5-holidays.png` });
  await p.click('.tabs [data-t=dates]'); await p.waitForTimeout(400); await p.screenshot({ path: `${out}-6-dates.png` });
  // csv export roundtrip
  await p.click('.tabs [data-t=track]');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#expCsv')]);
  await dl.saveAs(`${out}-export.csv`);
  await p.evaluate(() => localStorage.clear()); await p.reload(); await p.click('.tabs [data-t=track]');
  await p.setInputFiles('#impCsv', `${out}-export.csv`); await p.waitForTimeout(300);
  console.log('after import summary:', await p.textContent('#trkSummary'), '| games:', await p.$$eval('#games .game', g => g.length));
  const txt = await p.evaluate(() => document.body.innerText.toLowerCase());
  console.log('banned words:', ['bet ', 'odds', 'units', 'sportsbook', 'wager'].filter(w => txt.includes(w)));
  console.log('errors:', errs);
  await b.close();
})();

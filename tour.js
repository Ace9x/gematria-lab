/* First-run guided tour: vanilla spotlight + coachmarks */
(() => {
const $ = s => document.querySelector(s);
const KEY = 'jgl_tourDone';
const STEPS = [
  { tab: 'calc', target: '#phraseCard', title: 'Start with a word', text: 'Welcome! This quick tour shows you around. Type any team, player, holiday or city here and every cipher updates as you type.',
    setup: () => App.setPhrase('Detroit Lions', '74', 'rfr') },
  { tab: 'calc', target: '.cv[data-c="rfr"]', title: 'Tap a cipher for the math', text: 'Each card is one cipher. Tap it to see the letter-by-letter math, or tap ⓘ to learn what the cipher is. Here, Detroit Lions = 74 in Reverse Full Reduction.' },
  { tab: 'dates', target: '#dateKey', title: 'Dates are numbers too', text: 'Pick any date to see its common date sums. Switch to Holidays for every holiday’s word and date numbers.',
    setup: () => App.setDatesMode('date') },
  { tab: 'dots', target: '#t-total', title: 'Match a final score', text: 'Thanksgiving: Bears 39, Lions 35. The total of 74 lines up with “Detroit Lions” in two ciphers. Matches for each team’s score and the margin show here too.',
    setup: () => { App.loadExample(); App.setDotsMode('match'); } },
  { tab: 'dots', target: '#sim-totals .cand', title: 'Before the game', text: 'In “Before the game” mode you see which numbers the names and date point to, ranked by overlap. Tap any number to pick it as a call. These are patterns, not predictions.',
    setup: () => { App.loadExample(); App.setDotsMode('sim'); } },
  { tab: 'track', target: '#trkHero', title: 'Track what wins and loses', text: 'Log games with your calls, add the final score and see your hit rate by cipher, source and target. Export to CSV anytime.' },
  { tab: 'today', target: '#helpBtn', title: 'You’re all set', text: 'Today shows today’s numbers and the next holiday. Tap ? anytime to replay this tour.', last: true },
];
const tour = $('#tour'), spot = $('#tourSpot'), card = $('#tourCard');
let i = 0, saved = null, active = false, timers = [];
const dots = $('#tourDots');
dots.innerHTML = STEPS.map(() => '<i></i>').join('');

function start() {
  if (active) return;
  App.closeSheet(); saved = App.getState(); active = true; i = 0;
  tour.classList.remove('hidden'); document.body.style.overflow = 'hidden';
  go(0);
}
function end(done) {
  active = false; timers.forEach(clearTimeout);
  card.classList.remove('show'); tour.classList.add('hidden'); document.body.style.overflow = '';
  try { localStorage.setItem(KEY, '1'); } catch {}
  if (saved) App.setState(saved);
  App.showTab('today');
  if (done) { const t = $('#toast'); t.textContent = 'Tap ? anytime to see the tour again'; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 2200); }
  $('#helpBtn').focus();
}
function go(n) {
  i = Math.max(0, Math.min(STEPS.length - 1, n)); const s = STEPS[i];
  timers.forEach(clearTimeout); timers = [];
  card.classList.remove('show');
  if (s.setup) s.setup();
  App.showTab(s.tab, true);
  $('#tourStep').textContent = `Step ${i + 1} of ${STEPS.length}`;
  $('#tourTitle').textContent = s.title; $('#tourText').textContent = s.text;
  $('#tourBack').style.visibility = i === 0 ? 'hidden' : 'visible';
  $('#tourNext').textContent = s.last ? 'Done' : 'Next';
  $('#tourSkip').style.visibility = s.last ? 'hidden' : 'visible';
  [...dots.children].forEach((d, k) => { d.className = k === i ? 'on' : k < i ? 'done' : ''; });
  const el = s.target && document.querySelector(s.target);
  if (el) { const r = el.getBoundingClientRect(); const top = el.closest('.top') ? 0 : Math.max(0, scrollY + r.top - 84); window.scrollTo({ top, behavior: 'auto' }); }
  timers.push(setTimeout(() => place(true), 80), setTimeout(() => place(), 420));
}
function place(first) {
  if (!active) return;
  const s = STEPS[i], el = s.target && document.querySelector(s.target);
  const vh = innerHeight, vw = innerWidth, tabH = (document.querySelector('.tabs')?.offsetHeight || 72) + 12;
  const ch = card.offsetHeight;
  if (!el) { spot.className = 'tour-spot none'; Object.assign(spot.style, { left: vw / 2 + 'px', top: vh / 2 + 'px', width: '0px', height: '0px' }); card.style.top = Math.max(80, (vh - ch) / 2) + 'px'; card.classList.add('show'); return; }
  const r = el.getBoundingClientRect(), p = 8;
  spot.className = 'tour-spot';
  const radius = getComputedStyle(el).borderRadius;
  Object.assign(spot.style, { left: r.left - p + 'px', top: r.top - p + 'px', width: r.width + p * 2 + 'px', height: r.height + p * 2 + 'px', borderRadius: radius === '50%' ? '999px' : `calc(${radius} + ${p}px)` });
  const below = r.bottom + p + 14, maxTop = vh - tabH - ch;
  let top;
  if (below <= maxTop) top = below;
  else if (r.top - p - 14 - ch >= 70) top = r.top - p - 14 - ch;
  else top = Math.max(70, maxTop);
  card.style.top = top + 'px';
  card.classList.add('show');
  if (first) $('#tourNext').focus({ preventScroll: true });
}
$('#tourNext').onclick = () => STEPS[i].last ? end(true) : go(i + 1);
$('#tourBack').onclick = () => go(i - 1);
$('#tourSkip').onclick = () => end(false);
$('#helpBtn').onclick = start;
addEventListener('resize', () => active && place());
addEventListener('keydown', e => {
  if (!active) return;
  if (e.key === 'Escape') end(false);
  else if (e.key === 'ArrowRight') $('#tourNext').click();
  else if (e.key === 'ArrowLeft' && i > 0) go(i - 1);
});
window.Tour = { start, end, go };
let seen = null; try { seen = localStorage.getItem(KEY); } catch {}
if (!seen) setTimeout(start, 700);
})();

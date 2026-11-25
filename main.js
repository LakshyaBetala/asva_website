/* ASVA 05 · one driver: scroll -> day of the month -> everything else. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TICK = '<svg viewBox="0 -8 78 80"><path d="M8 14l26 50 36-62" fill="none" stroke="#F2B705" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const story = $('#story'), stage = $('#stage'), phone = $('#phone'), device = $('#device');
  const floor = $('#floor'), track = $('#track'), knob = $('#knob'), fill = $('#tlFill');
  const nav = $('#nav');

  /* ---------- nav ---------- */
  const toggle = $('#navToggle');
  const setMenu = open => { nav.classList.toggle('open', open); toggle.setAttribute('aria-expanded', open); };
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  $$('#menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => e.key === 'Escape' && setMenu(false));

  /* ---------- reveals for the quiet sections ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
  $$('.rv').forEach(el => io.observe(el));

  /* ---------- the month ----------
     [scroll progress, day, phone angle]. Angle 360n = customer's side, 180 + 360n = owner's side.
     Day rises strictly, so a day dragged on the timeline maps back to exactly one scroll position. */
  const END = 0.93; // the last 7% of the scroll holds the final frame so the tick can finish drawing
  const KF = [
    [0, 0, 180], [.04, .05, 180],
    [.12, 1, 360], [.19, 1.4, 360],            // the bill arrives
    [.26, 2, 540], [.32, 2.6, 540],            // owner sees: sent
    [.41, 8.6, 720], [.52, 15.4, 720], [.57, 15.6, 720], // reminders, then the reply
    [.64, 16.2, 900], [.68, 16.6, 900],        // owner sees: promise, paused
    [.79, 27, 900], [.83, 27.3, 900],          // twelve empty days, then the date passes
    [.885, 28.1, 1080], [.915, 28.4, 1080],    // the reminder returns
    [.94, 29.1, 1080], [.96, 29.3, 1080],      // they pay
    [.99, 29.9, 1260], [1, 30, 1260]           // receipt, posted
  ].map(k => [k[0] * END, k[1], k[2]]);
  KF.push([1, 30, 1260]);
  const STOPS = [0, .155, .29, .545, .66, .81, .9, .95, 1].map(p => p * END);
  const smooth = t => t * t * (3 - 2 * t);

  function at(p) {
    for (let i = 1; i < KF.length; i++) if (p <= KF[i][0]) {
      const a = KF[i - 1], b = KF[i], t = (p - a[0]) / (b[0] - a[0] || 1);
      return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * smooth(t)];
    }
    return [30, 1260];
  }
  function pOf(day) {
    for (let i = 1; i < KF.length; i++) if (day <= KF[i][1]) {
      const a = KF[i - 1], b = KF[i];
      return a[0] + (b[0] - a[0]) * ((day - a[1]) / (b[1] - a[1] || 1));
    }
    return END;
  }
  const dateOf = d => d < 1 ? '9 Aug' : d <= 22 ? (9 + d) + ' Aug' : (d - 22) + ' Sep';
  const eventOf = d =>
    d < .5 ? 'The month begins.' :
    d < 8.9 ? 'Bill sent on WhatsApp.' :
    d < 15.3 ? 'Polite reminders, timed to credit days.' :
    d < 27.05 ? 'Promise read. Paused till the 5th.' :
    d < 28 ? 'The 5th passed. Reminders resume.' :
    d < 28.95 ? 'Reminder sent.' :
    d < 29.85 ? 'Paid. Receipt ready.' : 'Receipt posted to Tally.';
  const chapterOf = d => d < .45 ? 0 : d < 5.5 ? 1 : d < 26.6 ? 2 : d < 28.7 ? 3 : 4;

  /* ---------- timeline furniture ---------- */
  const el = (tag, cls, d, html) => { const e = document.createElement(tag); e.className = cls; e.style.setProperty('--d', d); if (html) e.innerHTML = html; return e; };
  const gate = (e, from, to) => { if (from != null) e.dataset.from = from; if (to != null) e.dataset.to = to; return e; };
  const marks = document.createDocumentFragment();
  for (let d = 0; d <= 30; d++) marks.append(el('i', 'tk' + ([1, 8, 15, 22, 27, 30].includes(d) ? ' major' : ''), d));
  marks.append(gate(el('i', 'mk ghost', 1), -1, .9), gate(el('i', 'mk bill', 1), .9));
  [9, 12, 15, 18, 21, 24, 27, 30].forEach(d => marks.append(gate(el('i', 'mk ghost', d), -1, d <= 15 ? d : 15.3)));
  [9, 12, 15, 28].forEach(d => marks.append(gate(el('i', 'mk rem', d), d)));
  marks.append(
    gate(el('i', 'mk ghost', 28), 15.3, 28),
    gate(el('i', 'mk reply', 15), 15.3),
    gate(el('i', 'mk due', 27), 15.3),
    gate(el('i', 'mk missed', 27), 27.05),
    gate(el('i', 'mk paid', 29, TICK), 28.95)
  );
  track.insertBefore(marks, knob);
  const labs = document.createElement('div');
  labs.className = 'tl-labs'; labs.setAttribute('aria-hidden', 'true');
  [[1, '10 Aug'], [8, '17 Aug, due'], [15, '24 Aug'], [22, '31 Aug'], [27, '5 Sep']].forEach(([d, t]) => labs.append(el('span', '', d, t)));
  track.after(labs);

  /* ---------- day gates: an element is "on" from its day (until its end day) ---------- */
  const gates = root => $$('[data-from],[data-to]', root).map(e => ({ e, from: +(e.dataset.from ?? -1), to: +(e.dataset.to ?? 99), on: null }));
  const apply = (list, day) => { for (const g of list) { const on = day >= g.from && day < g.to; if (on !== g.on) { g.on = on; g.e.classList.toggle('on', on); } } };

  /* ---------- reduced motion: no pin, no turn. Four chapters, both sides, side by side. ---------- */
  if (reduce) {
    document.documentElement.classList.add('static');
    const seq = $('#seq'), front = $('.face.front'), back = $('.face.back');
    [[1.4, 2.6], [15.6, 16.6], [28.3, 27.3], [29.3, 30]].forEach(([fd, bd], i) => {
      const cap = $(`.cap[data-c="${i + 1}"]`), art = document.createElement('article');
      art.className = 'seq-ch';
      [[front, fd, cap.children[0]], [back, bd, cap.children[1]]].forEach(([face, d, text]) => {
        const side = document.createElement('div'), f = face.cloneNode(true);
        side.className = 'seq-side'; f.classList.add('flat'); f.setAttribute('aria-hidden', 'true');
        apply(gates(f), d); side.append(text, f); art.append(side);
      });
      seq.append(art);
    });
    apply(gates($('#tl')), 30);
    $('#tlDay').textContent = 'Day 30'; $('#tlDate').textContent = '8 Sep'; $('#tlEvent').textContent = 'The whole sample month.';
    $('.hero-cta .fine').textContent = 'One phone, two sides: both are shown below.';
    $('.tl-hint').textContent = 'Sample data, built in code.';
    addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 8), { passive: true });
    return;
  }

  /* ---------- live stage ---------- */
  // touch keeps native scrolling: Lenis cancels a programmatic glide on touchend, which would eat the swipe
  const lenis = window.Lenis && matchMedia('(pointer: fine)').matches ? new Lenis({ lerp: .11 }) : null;
  const live = gates(stage);
  const tlDay = $('#tlDay'), tlDate = $('#tlDate'), tlEvent = $('#tlEvent');
  let top = 0, span = 1, trackW = 1;
  const measure = () => { top = story.offsetTop; span = Math.max(1, story.offsetHeight - innerHeight); trackW = track.clientWidth; };
  measure(); addEventListener('resize', measure); addEventListener('load', measure);
  document.fonts && document.fonts.ready.then(measure);

  const seek = (p, glide) => {
    const y = Math.ceil(top + clamp(p, 0, 1) * span); // ceil: land on or just past the asked day, never a pixel short of its event
    if (lenis) lenis.scrollTo(y, glide ? { duration: 1.25 } : { immediate: true });
    else scrollTo({ top: y, behavior: glide ? 'smooth' : 'auto' });
  };
  let p = 0, day = 0;
  const step = dir => {
    const next = dir > 0 ? STOPS.find(s => s > p + .012) : [...STOPS].reverse().find(s => s < p - .012);
    if (next != null) seek(next, true);
    else if (dir > 0) seek(1.02, true); // past the last stop: let the page carry on
  };

  // turn it by hand: button, click, swipe
  $('#turn').addEventListener('click', () => step(1));
  device.addEventListener('click', () => step(1));
  let sx = 0, sy = 0;
  device.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  device.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.3) step(dx < 0 ? 1 : -1);
  }, { passive: true });

  // scrub the month by hand
  let dragging = false, goal = 0, goalAt = -1e9;
  const dayAt = x => { const r = track.getBoundingClientRect(); return clamp((x - r.left) / r.width, 0, 1) * 30; };
  track.addEventListener('pointerdown', e => { dragging = true; track.setPointerCapture(e.pointerId); seek(pOf(dayAt(e.clientX))); });
  track.addEventListener('pointermove', e => { if (dragging) seek(pOf(dayAt(e.clientX))); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => track.addEventListener(t, () => { dragging = false; }));
  knob.addEventListener('keydown', e => {
    const k = e.key, d = performance.now() - goalAt < 400 ? goal : Math.round(day); // fast repeats count from where the last press is heading
    const to = k === 'ArrowRight' || k === 'ArrowUp' ? d + 1 : k === 'ArrowLeft' || k === 'ArrowDown' ? d - 1 : k === 'Home' ? 0 : k === 'End' ? 30 : null;
    if (k === 'PageDown') { e.preventDefault(); step(1); } else if (k === 'PageUp') { e.preventDefault(); step(-1); }
    else if (to != null) { e.preventDefault(); goal = clamp(to, 0, 30); goalAt = performance.now(); seek(pOf(goal)); }
  });

  // a little parallax from the pointer, desktop only
  let px = 0, py = 0, tx = 0, ty = 0;
  if (matchMedia('(pointer: fine)').matches) addEventListener('pointermove', e => { tx = e.clientX / innerWidth * 2 - 1; ty = e.clientY / innerHeight * 2 - 1; }, { passive: true });

  /* the turn is a damped spring chasing the scrubbed angle: it starts slow, carries weight, and settles */
  let cur = 180, vel = 0, hold = false, last = performance.now(), shownDay = -1, shownEvent = '', face = '', chap = -1;

  const H = 1 / 120;
  function frame(now) {
    requestAnimationFrame(frame);
    if (lenis) lenis.raf(now);
    const dt = Math.min(.25, (now - last) / 1000); last = now;
    const y = scrollY;
    nav.classList.toggle('scrolled', y > top + span + 4);
    if (y > top + span + innerHeight) return; // stage is off screen

    p = clamp((y - top) / span, 0, 1);
    const [d, angle] = at(p); day = d;
    const target = hold ? 0 : angle;
    if (Math.abs(target - cur) > 400) cur += Math.round((target - cur) / 360) * 360; // never spin through whole revolutions
    // fixed 120 Hz sub-steps, so the spring keeps real time when frames are slow
    for (let left = dt; left > 0; left -= H) { const h = Math.min(H, left); vel += (target - cur) * 95 * h; vel *= Math.exp(-17.5 * h); cur += vel * h; }

    px += (tx - px) * .06; py += (ty - py) * .06;
    const t = now / 1000, pose = 1 - clamp(d / .9, 0, 1);
    const ry = cur + pose * -24 + Math.sin(t * .55) * 1.8 + px * 5;
    const rx = pose * 5 + Math.cos(t * .45) * 1.1 - py * 3.5;
    const edge = Math.abs(Math.sin(cur * Math.PI / 180));
    phone.style.transform = `translateY(${(Math.sin(t * .8) * 4).toFixed(2)}px) scale(${(1 - edge * .07).toFixed(4)}) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    phone.style.setProperty('--sheen', (edge * .55).toFixed(3));
    floor.style.transform = `scaleX(${(.28 + .72 * Math.abs(Math.cos(ry * Math.PI / 180))).toFixed(3)})`;

    apply(live, d);
    knob.style.transform = `translateX(${(d / 30 * trackW).toFixed(1)}px)`;
    fill.style.transform = `scaleX(${(d / 30).toFixed(4)})`;

    const f = Math.round(cur / 180) % 2 === 0 ? 'front' : 'back';
    if (f !== face) stage.dataset.face = face = f;
    const c = chapterOf(d);
    if (c !== chap) stage.dataset.ch = chap = c;
    const whole = Math.floor(d + .02), ev = eventOf(d);
    if (whole !== shownDay || ev !== shownEvent) {
      shownDay = whole; shownEvent = ev;
      tlDay.textContent = 'Day ' + whole; tlDate.textContent = dateOf(whole); tlEvent.textContent = ev;
      knob.setAttribute('aria-valuenow', whole);
      knob.setAttribute('aria-valuetext', `Day ${whole}, ${dateOf(whole)}. ${ev}`);
    }
  }
  requestAnimationFrame(frame);

  /* self-check: the day map must be strictly rising or the drag cannot be inverted */
  console.assert(KF.slice(0, -1).every((k, i) => i === 0 || (k[0] > KF[i - 1][0] && k[1] > KF[i - 1][1])), 'KF must rise strictly');
  console.assert(Math.abs(at(pOf(15.3))[0] - 15.3) < 1e-6, 'pOf must invert at');
})();


/* ---- hero: the start of 02's crowd. One dot per party, appearing; hover or tap one. No sorting. ---- */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const canvas = $('#field'), ctx = canvas.getContext('2d'), tip = $('#tip'), countLine = $('#countLine');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const phoneMQ = matchMedia('(max-width: 900px)');
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const num = n => Math.round(n).toLocaleString('en-IN');

/* sample ledger, seeded so every visit draws the same shop (02's generator) */
function mulberry32(a){return () => {a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296;};}
const NA = ['Sharma','Mehta','Gupta','Iyer','Patel','Khan','Reddy','Jain','Agarwal','Nair','Singh','Verma','Rao','Shah','Das','Bose','Pillai','Kulkarni','Desai','Chopra','Menon','Naidu','Joshi','Saxena','Thakur','Bhatia','Fernandes','Mishra','Kapoor','Sethi'];
const NB = ['Traders','Agencies','Stores','Enterprises','Distributors','Medicals','Electricals','Hardware','Textiles','and Sons','Marketing','Provisions','Paints','Supplies','Mart'];
const PARTIES = 500; // a sample shop; every party here is invented
const rnd = mulberry32(2000), dots = [];
for (let i = 0; i < PARTIES; i++) {
  const g = Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(6.2832 * rnd());
  const amount = Math.round(Math.min(420000, Math.max(900, 14000 * Math.exp(g * 1.05))) / 50) * 50;
  const age = Math.min(160, 8 + Math.floor(-Math.log(1 - rnd()) * 55));
  const credit = [15, 15, 30, 30, 45][Math.floor(rnd() * 5)];
  let st = 'notdue';
  if (age > credit) { const r = rnd(); st = r < .36 ? 'waiting' : r < .62 ? 'promised' : r < .70 ? 'disputed' : 'paid'; }
  dots.push({ name: NA[Math.floor(rnd() * NA.length)] + ' ' + NB[Math.floor(rnd() * NB.length)], amount, age, credit, st,
    shuffle: rnd(), ph: rnd() * 6.2832, w: .0006 + rnd() * .0006, x: 0, y: 0, x0: 0, y0: 0, r: 2, k: 0, bx: 0, by: 0, al: 1, pop: 0, rr: 2 });
}

/* 05's state colours, on 05's cream */
const BG = '#F7F5EF';
const COL = { notdue: '#BEBBAF', waiting: '#14201B', promised: '#F2B705', disputed: '#14201B', paid: '#0B6B4F' };
const STATUS = {
  notdue: d => `Inside its ${d.credit} credit days. Left alone.`,
  waiting: d => `${d.age - d.credit} days past its ${d.credit} credit days. Reminded.`,
  promised: () => 'Promised a date. Paused till then.',
  disputed: () => 'Disputed. Paused while you sort it out.',
  paid: () => 'Paid. Receipt posted into Tally.'
};
const APPEAR = reduce ? 0 : 2400; // ms for the whole crowd to arrive, centre outwards

let W = 0, H = 0, dpr = 1, shown = dots, t0 = 0, raf = 0, visible = true, hover = null, lastCount = -1, filter = null, opened = null, lastT = 0, settled = false;
const lens = { x: 0, y: 0, on: 0, want: 0 }; // the pointer is a magnifying glass: dots near it grow and part
const LENS = 86, LK = 1.25;

function layout() {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width) return;
  W = rect.width; H = rect.height;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  const phone = phoneMQ.matches, g = phone ? 1.2 : 1.5;
  shown = dots; // 500 is few enough to draw every party on a phone too
  const R = Math.min(W, H) / 2 - 4, cx = W / 2, cy = H / 2;
  const s = R * Math.sqrt(.56 / shown.reduce((a, d) => a + d.amount, 0));
  for (const d of shown) d.r = clamp(s * Math.sqrt(d.amount), phone ? 2.2 : 1.7, R * .085);
  // phyllotaxis disc, then nudge overlapping dots apart (02's packing)
  const order = shown.slice().sort((a, b) => ((b.st === filter) - (a.st === filter)) || a.shuffle - b.shuffle); // a chosen colour gathers in the middle
  const A = order.reduce((a, d) => a + (d.r * 2 + g) ** 2, 0);
  let cum = 0;
  const pts = order.map((d, i) => {
    const a = (d.r * 2 + g) ** 2, rr = (R - d.r) * Math.sqrt((cum + a / 2) / A), th = i * 2.39996;
    cum += a; d.k = i / order.length;
    return { d, x: cx + Math.cos(th) * rr, y: cy + Math.sin(th) * rr };
  });
  const rBig = Math.max(...shown.map(d => d.r));
  for (let it = 0; it < 14; it++) {
    pts.sort((p, q) => p.x - q.x);
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      for (let j = i + 1; j < pts.length; j++) {
        const q = pts[j], dx = q.x - p.x;
        if (dx > p.d.r + rBig + g) break;
        const dy = q.y - p.y, min = p.d.r + q.d.r + g * .7, d2 = dx * dx + dy * dy;
        if (d2 >= min * min || d2 < 1e-6) continue;
        const dist = Math.sqrt(d2), push = (min - dist) / dist, wp = q.d.r / (p.d.r + q.d.r);
        p.x -= dx * push * wp; p.y -= dy * push * wp; q.x += dx * push * (1 - wp); q.y += dy * push * (1 - wp);
      }
    }
    for (const p of pts) { const dx = p.x - cx, dy = p.y - cy, dd = Math.hypot(dx, dy), lim = R - p.d.r; if (dd > lim) { p.x = cx + dx / dd * lim; p.y = cy + dy / dd * lim; } }
  }
  for (const p of pts) { p.d.x0 = p.x; p.d.y0 = p.y; if (!settled) { p.d.bx = p.x; p.d.by = p.y; } }
  settled = true;
}

function frame(now) {
  raf = 0;
  const dt = Math.min(60, now - (lastT || now)); lastT = now;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  const t = now - t0;
  lens.on += (lens.want - lens.on) * (1 - Math.exp(-dt / 110));
  let n = 0;
  for (const d of shown) {
    const a = APPEAR ? clamp((t - d.k * APPEAR) / 380, 0, 1) : 1;
    if (!a) continue;
    n++;
    const e = 1 - (1 - a) ** 3, g = reduce ? 1 : 1 - Math.exp(-dt / (150 + d.shuffle * 170)); // each dot walks to its place at its own pace
    d.bx += (d.x0 - d.bx) * g; d.by += (d.y0 - d.by) * g;
    d.al += ((filter && d.st !== filter ? .16 : 1) - d.al) * g;
    d.pop *= Math.exp(-dt / 260);
    let x = d.bx, y = d.by, m = 1;
    if (!reduce) { x += Math.sin(now * d.w + d.ph) * 1.6; y += Math.cos(now * d.w * .8 + d.ph) * 1.6; } // a crowd never quite stands still
    if (lens.on > .01) {
      const dx = x - lens.x, dy = y - lens.y, u = Math.hypot(dx, dy) / LENS;
      if (u < 1) { const f = 1 + ((LK + 1) / (LK * u + 1) - 1) * lens.on; x = lens.x + dx * f; y = lens.y + dy * f; m = 1 + .75 * (1 - u) * lens.on; }
    }
    d.x = x; d.y = y; d.rr = d.r * (.4 + .6 * e) * m * (1 + d.pop);
    ctx.globalAlpha = e * d.al;
    ctx.fillStyle = COL[d.st];
    ctx.beginPath(); ctx.arc(x, y, d.rr, 0, 6.2832); ctx.fill();
    if (d.st === 'disputed') { ctx.fillStyle = BG; ctx.beginPath(); ctx.arc(x, y, Math.max(0, d.rr - Math.max(1.1, d.rr * .36)), 0, 6.2832); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
  if (!filter) {
    const count = n === shown.length ? PARTIES : Math.round(PARTIES * n / shown.length);
    if (count !== lastCount) { lastCount = count; const el = $('#figParties'); if (el) el.textContent = num(count); }
  }
  if (hover) {
    ctx.strokeStyle = '#14201B'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(hover.x, hover.y, hover.rr + 3.5, 0, 6.2832); ctx.stroke();
    placeTip();
  }
  if (visible && !reduce && !opened) raf = requestAnimationFrame(frame);
}
function start() { if (!raf && W) raf = requestAnimationFrame(frame); }

/* hover and tap: nearest dot wins, with a generous reach for fingers */
function placeTip() {
  const d = hover, tw = tip.offsetWidth, th = tip.offsetHeight;
  let x = d.x + d.r + 14; if (x + tw > W) x = d.x - d.r - 14 - tw;
  x = Math.max(0, Math.min(W - tw, x));
  let y = Math.max(0, Math.min(H - th, d.y - th / 2));
  if (x < d.x + d.r && x + tw > d.x - d.r) y = d.y - d.r - 12 - th < 0 ? d.y + d.r + 12 : d.y - d.r - 12 - th; // narrow screens: above or below
  tip.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
}
function setHover(d) {
  if (d === hover) return;
  hover = d;
  tip.hidden = !d;
  if (d) tip.innerHTML = `<p class="tip-s">Sample party</p><p class="tip-n">${d.name}</p><p class="tip-a">Rs ${num(d.amount)}</p><p class="tip-m">${STATUS[d.st](d)}</p><p class="tip-o">${coarse ? 'Tap again to open' : 'Click to open'}</p>`;
  if (reduce) { raf = 0; frame(performance.now()); } else start();
}
function point(e, reach) {
  const b = canvas.getBoundingClientRect(), px = e.clientX - b.left, py = e.clientY - b.top;
  let best = null, bd = 1e9;
  for (const d of shown) { const dist = Math.hypot(d.x - px, d.y - py) - d.rr; if (dist < bd) { bd = dist; best = d; } }
  setHover(bd <= reach ? best : null);
}
const coarse = matchMedia('(hover: none)').matches;
canvas.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse') return;
  const b = canvas.getBoundingClientRect();
  lens.x = e.clientX - b.left; lens.y = e.clientY - b.top; lens.want = reduce ? 0 : 1;
  point(e, 9);
});
canvas.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { setHover(null); lens.want = 0; } });
// mouse: click opens. Touch: first tap meets the party, a second tap on it opens.
canvas.addEventListener('click', e => {
  const was = hover;
  point(e, coarse ? 26 : 9);
  if (hover && (!coarse || hover === was)) openDot(hover);
});
canvas.addEventListener('keydown', e => {
  const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
  if (e.key === 'Escape') setHover(null);
  if ((e.key === 'Enter' || e.key === ' ') && hover) { e.preventDefault(); openDot(hover); }
  if (dir) { e.preventDefault(); const L = filter ? shown.filter(d => d.st === filter) : shown; setHover(L[(L.indexOf(hover) + dir + L.length) % L.length]); }
});
canvas.addEventListener('blur', () => { if (!opened) setHover(null); });

/* ---- the key is a set of buttons: choose a colour and those parties gather in the middle ---- */
const keyBtns = [...document.querySelectorAll('.cl-key button')], COUNTALL = countLine.innerHTML;
const LABEL = { notdue: ['is not due yet', 'are not due yet'], waiting: ['has been reminded', 'have been reminded'], promised: ['promised a date', 'promised a date'], disputed: ['raised a question', 'raised a question'], paid: ['has paid', 'have paid'] };
function counts() {
  for (const b of keyBtns) b.querySelector('em').textContent = num(dots.filter(d => d.st === b.dataset.st).length);
}
function paintLine() {
  if (filter) {
    const L = dots.filter(d => d.st === filter);
    countLine.innerHTML = `<b>${num(L.length)}</b> ${LABEL[filter][L.length === 1 ? 0 : 1]}. Sample total Rs ${num(L.reduce((a, d) => a + d.amount, 0))}.`;
  } else { countLine.innerHTML = COUNTALL; countLine.querySelector('b').textContent = num(PARTIES); }
}
function setFilter(st) {
  filter = st === filter ? null : st;
  keyBtns.forEach(b => b.setAttribute('aria-pressed', b.dataset.st === filter));
  setHover(null); paintLine(); layout();
  if (reduce) frame(performance.now()); else start();
}
keyBtns.forEach(b => b.addEventListener('click', () => setFilter(b.dataset.st)));

/* ---- a clicked dot opens: it grows to fill the panel in its own colour and shows that party's WhatsApp ---- */
const panel = $('#dotPanel'), chat = $('#dpChat'), nextB = $('#dpNext');
const TALK = {
  notdue: d => [['note', `Bill of Rs ${num(d.amount)}, ${d.age} days old. Inside its ${d.credit} credit days, so ASVA sends nothing.`]],
  waiting: d => [['out', `Namaste ${d.name}, a gentle reminder. Your bill of Rs ${num(d.amount)} is now due. You can pay here by UPI.`], ['note', 'Reminder sent from your own WhatsApp number.']],
  promised: () => [['in', 'Will pay by the 5th.'], ['note', 'ASVA read the promise. Reminders paused till the 5th.']],
  disputed: () => [['in', 'Two cartons came short.'], ['note', 'Reminders paused. This one comes to you.']],
  paid: d => [['in', `Paid Rs ${num(d.amount)} by UPI.`], ['note', 'Receipt posted into Tally.']]
};
const NEXT = { notdue: ['Skip to the due date', 'waiting'], waiting: ['See the reply', 'promised'], promised: ['Jump to the 5th', 'paid'], disputed: ['You sort it out', 'paid'], paid: ['Back to all 500', null] };
const PAST = { notdue: [], waiting: [], promised: ['waiting'], disputed: ['waiting'], paid: ['waiting', 'promised'] };
const NAMES = { notdue: 'Not due yet', waiting: 'Reminded', promised: 'Promised a date', disputed: 'Disputed', paid: 'Paid' };
function say(list, from) {
  for (const [k, t] of list) {
    const li = document.createElement('li'); li.className = 'dp-' + k; li.textContent = t; li.style.setProperty('--i', from++); chat.append(li);
  }
  chat.scrollTop = chat.scrollHeight;
}
function paintPanel(d) {
  panel.dataset.st = d.st;
  $('#dpState').textContent = NAMES[d.st];
  nextB.firstElementChild.textContent = NEXT[d.st][0];
}
const clip = d => `circle(${Math.max(2, d.rr).toFixed(1)}px at ${d.x.toFixed(1)}px ${d.y.toFixed(1)}px)`;
const full = d => `circle(${Math.hypot(W, H).toFixed(0)}px at ${d.x.toFixed(1)}px ${d.y.toFixed(1)}px)`;
function openDot(d) {
  opened = d; tip.hidden = true;
  $('#dpName').textContent = d.name; $('#dpAmt').textContent = 'Rs ' + num(d.amount);
  chat.replaceChildren();
  PAST[d.st].forEach(st => say(TALK[st](d), 0)); say(TALK[d.st](d), 2);
  paintPanel(d);
  panel.hidden = false;
  if (!reduce) panel.animate([{ clipPath: clip(d) }, { clipPath: full(d) }], { duration: 620, easing: 'cubic-bezier(.6,0,.2,1)' });
  nextB.focus({ preventScroll: true });
}
function closeDot() {
  const d = opened; if (!d) return;
  opened = null; hover = null; lens.want = 0;
  if (filter) layout(); // it may have changed colour while open
  counts(); paintLine();
  const done = () => { panel.hidden = true; if (reduce) frame(performance.now()); else d.pop = 2.2; };
  if (reduce) done();
  else panel.animate([{ clipPath: full(d) }, { clipPath: clip(d) }], { duration: 460, easing: 'cubic-bezier(.5,0,.2,1)' }).finished.then(done, done);
  start(); canvas.focus({ preventScroll: true });
}
nextB.addEventListener('click', () => {
  const d = opened, to = d && NEXT[d.st][1];
  if (!to) return closeDot();
  d.st = to; paintPanel(d); say(TALK[to](d), 0);
});
$('#dpClose').addEventListener('click', closeDot);
panel.addEventListener('keydown', e => { if (e.key === 'Escape') closeDot(); });
counts();

if (matchMedia('(hover: none)').matches) $('#clNote').textContent = 'Tap a dot to meet one party. Tap it again to open it.' + (phoneMQ.matches ? ' 1 in 4 drawn here.' : '');
new IntersectionObserver(en => { visible = en[0].isIntersecting; if (visible) start(); }).observe(canvas);
let rT = 0;
new ResizeObserver(() => {
  clearTimeout(rT);
  rT = setTimeout(() => { const first = !W; settled = false; layout(); if (first) t0 = performance.now(); hover = null; tip.hidden = true; if (raf) cancelAnimationFrame(raf); raf = 0; frame(performance.now()); }, W ? 140 : 0);
}).observe(canvas);
console.assert(dots.length === PARTIES && dots.every(d => COL[d.st]), 'one coloured dot per party');
})();

/* v4.9: the evening film plays only while it is on screen; with less motion asked for, the still stays */
(() => {
  const v = document.querySelector('.eve-video'); if (!v || matchMedia('(prefers-reduced-motion: reduce)').matches || (navigator.connection && navigator.connection.saveData)) return;
  new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }), { threshold: .25 }).observe(v);
})();

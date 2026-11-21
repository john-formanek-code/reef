/* Reef — octopuses in filled-cell ASCII, seen from above. Each has a soft mantle with two eyes
   and eight verlet-simulated arms that taper to thin curling tips. They jet in pulses (mantle
   squeezes, arms stream behind, then glide), get curious about the cursor and reach an arm
   toward it, ink and dart away on a fast flick, and grab food you drop with an arm and curl
   it to the mouth. */
(function () {
  "use strict";
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const angDiff = (a, b) => ((b - a + Math.PI) % TAU + TAU) % TAU - Math.PI;
  function hash(a, b, c) {
    let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul((c | 0) + 7, 1274126177);
    h = Math.imul(h ^ (h >>> 13), 1103515245); h ^= h >>> 16; return (h >>> 0) / 4294967296;
  }
  function vnoise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi, 9), b = hash(xi + 1, yi, 9), c = hash(xi, yi + 1, 9), d = hash(xi + 1, yi + 1, 9);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const pack = (c) => ((clamp(c[0] | 0, 0, 255) << 16) | (clamp(c[1] | 0, 0, 255) << 8) | clamp(c[2] | 0, 0, 255)) >>> 0;

  // species palettes: [base, mottle (chromatophores), highlight]
  const SKINS_DARK = [
    { base: [233, 104, 72], mottle: [158, 46, 38], hi: [255, 168, 128] },   // coral
    { base: [226, 126, 58], mottle: [150, 62, 30], hi: [255, 190, 120] },   // orange-red / amber
    { base: [150, 84, 172], mottle: [88, 40, 112], hi: [204, 150, 222] },   // deep purple
    { base: [236, 112, 92], mottle: [170, 56, 60], hi: [255, 178, 150] },   // salmon coral
    { base: [64, 180, 168], mottle: [24, 104, 96], hi: [142, 227, 224] },   // teal (noesea)
    { base: [218, 170, 78], mottle: [140, 98, 30], hi: [240, 214, 150] },   // gold (lawie)
    { base: [160, 166, 214], mottle: [88, 92, 140], hi: [214, 220, 246] },  // lavender (eraivo)
    { base: [150, 160, 172], mottle: [84, 92, 104], hi: [208, 214, 222] },  // steel (corthex)
  ];
  const SKINS_LIGHT = [
    { base: [228, 92, 60], mottle: [150, 40, 32], hi: [240, 122, 84] },
    { base: [222, 112, 40], mottle: [146, 56, 22], hi: [236, 140, 64] },
    { base: [128, 66, 156], mottle: [74, 30, 98], hi: [152, 92, 182] },
    { base: [226, 96, 80], mottle: [156, 46, 52], hi: [238, 124, 104] },
    { base: [36, 140, 128], mottle: [16, 84, 76], hi: [60, 168, 156] },
    { base: [196, 140, 40], mottle: [122, 82, 20], hi: [214, 164, 70] },
    { base: [110, 116, 176], mottle: [64, 68, 118], hi: [136, 142, 196] },
    { base: [104, 114, 128], mottle: [60, 66, 78], hi: [130, 140, 154] },
  ];
  const SKIN = { coral: 0, orange: 1, purple: 2, salmon: 3, teal: 4, gold: 5, lavender: 6, steel: 7 };
  const DARK = { bg: [26, 25, 23], skins: SKINS_DARK, eye: [244, 226, 176], pupil: [20, 16, 14], water: [255, 247, 240], food: [236, 196, 128],
    inkTile: [5, 4, 9], inkGlyph: [140, 128, 160], inkA: 1, alpha: 0.95, edge: 0.5, sucker: [255, 214, 196], solid: 0.5, edgeTo: [26, 25, 23], gk: 1, blush: [255, 156, 196], flash: [255, 240, 228] };
  const LIGHT = { bg: [245, 244, 241], skins: SKINS_LIGHT, eye: [250, 236, 190], pupil: [24, 18, 16], water: [40, 38, 36], food: [176, 118, 52],
    inkTile: [44, 40, 50], inkGlyph: [150, 142, 158], inkA: 0.85, alpha: 0.97, edge: 0.3, sucker: [255, 222, 206], solid: 0.68, edgeTo: [60, 36, 40], gk: 0.55, blush: [214, 58, 108], flash: [60, 38, 44] };
  const GLYPHS = "+xX%S8#";
  const N = 12; // nodes per arm (root + 11)

  function Reef(canvas, opts) {
    opts = opts || {};
    const ctx = canvas.getContext("2d");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mini = !!opts.mini;
    let cfg = { count: opts.count, skins: opts.skins, dim: opts.dim == null ? 1 : opts.dim, zone: opts.zone || "home", feed: opts.feed !== false, auto: opts.auto || null };
    const S = { W: 0, H: 0, dpr: 1, cw: 10, ch: 12, cols: 0, rows: 0, time: 0, octos: [], food: [], ripples: [], ink: [], paused: false, gdim: cfg.dim, nextId: 1,
      ptr: { x: 0, y: 0, speed: 0, active: false, down: false, t: -9 }, eyes: [] };
    let pal = DARK, cov, own, part, tileC, tileOn, glyph, glyphC, glyphA, dim, inkD, energy, energyTmp, textBox = null;
    const font = '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace';

    const setTheme = () => { pal = document.documentElement.classList.contains("dark") ? DARK : LIGHT; };
    function resize() {
      const w = mini ? canvas.clientWidth : innerWidth, h = mini ? canvas.clientHeight : innerHeight, first = !S.W;
      if (!w || !h) return;
      S.W = w; S.H = h; S.dpr = Math.min(2, devicePixelRatio || 1);
      S.cw = mini ? clamp(Math.round(Math.min(w, h) / 60), 5, 9) : clamp(Math.round(w / 125), 7, 12); S.ch = S.cw + 2;
      S.cols = Math.ceil(w / S.cw); S.rows = Math.ceil(h / S.ch);
      canvas.width = Math.round(w * S.dpr); canvas.height = Math.round(h * S.dpr);
      const n = S.cols * S.rows;
      cov = new Float32Array(n); tileOn = new Uint8Array(n); own = new Int16Array(n); part = new Int8Array(n); tileC = new Uint32Array(n); glyph = new Uint16Array(n);
      glyphC = new Uint32Array(n); glyphA = new Float32Array(n); dim = new Float32Array(n).fill(1); inkD = new Float32Array(n);
      energy = new Float32Array(n); energyTmp = new Float32Array(n);
      if (first) seed(); else for (const o of S.octos) { o.x = clamp(o.x, 0, w); o.y = clamp(o.y, 0, h); }
      measureAvoid();
    }

    // ---------- creatures ----------
    const skinFor = (i) => { const sk = cfg.skins || ["coral", "purple", "orange", "salmon"]; const v = sk[i % sk.length]; return typeof v === "number" ? v : SKIN[v] || 0; };
    const baseR = () => mini ? clamp(Math.min(S.W, S.H) * (wantCount() > 1 ? 0.095 : 0.11), 16, 56) : clamp(Math.min(S.W, S.H) * (S.W < 700 ? 0.078 : 0.088), 28, 84) * (opts.scale || 1);
    const wantCount = () => { const c = cfg.count; if (typeof c === "function") return c(S.W, S.H); if (typeof c === "number") return c; return S.W * S.H > 1.6e6 ? 4 : S.W < 700 ? 2 : 3; };
    function makeOcto(i, n, R) {
      const o = { id: S.nextId++, skin: skinFor(i), R, x: rnd(0.15, 0.85) * S.W, y: rnd(0.15, 0.8) * S.H, vx: 0, vy: 0, heading: rnd(0, TAU), turn: 0,
        c: 0, pulseT: 9, nextPulse: rnd(0.5, 3), curiosity: rnd(0.5, 1), wander: rnd(0, TAU), phase: rnd(0, TAU), shimmer: rnd(0, 100),
        reach: null, carry: null, flee: 0, fdx: 0, fdy: 0, inkCd: 0, arms: [],
        ptrArms: [], linger: 0, pet: 0, blushX: 0, blushY: 0, flash: 0, shrink: 0, pokeT: -9, spin: 0, grab: null, blink: rnd(2, 6), blinkUntil: -1 };
      const spots = mini ? [[0.5, 0.5], [0.3, 0.4], [0.7, 0.6]] : S.W < 700 ? [[0.62, 0.24], [0.3, 0.42], [0.75, 0.38]] : cfg.zone === "home" ? [[0.6, 0.3], [0.82, 0.66], [0.33, 0.2], [0.88, 0.22]] : [[0.74, 0.28], [0.55, 0.22], [0.88, 0.35], [0.4, 0.2]];
      o.x = S.W * spots[i % spots.length][0]; o.y = S.H * spots[i % spots.length][1];
      const rest = restPose(o, 0);
      for (let a = 0; a < 8; a++) {
        const nodes = rest[a].map(([x, y]) => ({ x, y, px: x, py: y }));
        o.arms.push({ nodes, len: armLens(o), off: (a - 3.5) / 3.5, phase: rnd(0, TAU), curl: rnd(0.7, 1.4) * (a < 4 ? -1 : 1) });
      }
      return o;
    }
    function armLens(o) { const total = o.R * 2.6, w = []; let s = 0; for (let k = 1; k < N; k++) { const v = 1.25 - 0.55 * (k / N); w.push(v); s += v; } return [0, ...w.map((v) => (v / s) * total)]; }
    function seed() {
      const n = wantCount(), R = baseR();
      S.octos = []; for (let i = 0; i < n; i++) S.octos.push(makeOcto(i, n, R * (i === 3 ? 0.78 : i === 2 ? 0.9 : 1)));
      opts.onCount && opts.onCount(S.octos.length, S.food.length);
    }
    const fwdOf = (o) => [Math.cos(o.heading), Math.sin(o.heading)];
    function roots(o) {
      const [fx, fy] = fwdOf(o), back = o.heading + Math.PI, out = [];
      for (let a = 0; a < 8; a++) { const off = (a - 3.5) / 3.5, ang = back + off * 1.25; out.push([o.x + Math.cos(ang) * o.R * 0.3 - fx * o.R * 0.05, o.y + Math.sin(ang) * o.R * 0.3 - fy * o.R * 0.05, ang]); }
      return out;
    }
    // where each arm "wants" to be: a star when hovering, a streamer when jetting; tips curl, everything waves
    function restPose(o, t) {
      const sp = Math.hypot(o.vx, o.vy), stream = clamp(sp / (o.R * 1.6), 0, 1), back = o.heading + Math.PI, rs = roots(o), res = [];
      for (let a = 0; a < 8; a++) {
        const off = (a - 3.5) / 3.5, arm = o.arms[a];
        const relax = o.pet || 0, sh = o.shrink || 0;
        const spread = lerp(1.38, 0.36, stream) - 0.15 * o.c + 0.2 * relax - 0.5 * sh;
        let ang = back + off * spread, x = rs[a][0], y = rs[a][1]; const pts = [[x, y]];
        const lens = arm ? arm.len : armLens(o), ph = arm ? arm.phase : 0, curl = arm ? arm.curl : 1;
        for (let k = 1; k < N; k++) {
          const s = k / (N - 1);
          ang += Math.sin(t * (1.2 - 0.5 * relax) + ph - k * 0.7) * 0.2 * (0.3 + s) * (1 - 0.3 * stream) * (1 - 0.6 * relax) + curl * (0.05 + 0.5 * s * s * s) * (1 - 0.55 * stream) * (1 - 0.45 * relax + 1.2 * sh);
          x += Math.cos(ang) * lens[k]; y += Math.sin(ang) * lens[k]; pts.push([x, y]);
        }
        res.push(pts);
      }
      return res;
    }

    // ---------- simulation ----------
    function drop(x, y) {
      S.ripples.push({ x, y, born: S.time, strength: 0.35 });
      const n = Math.min(3 + Math.floor(Math.random() * 3), 16 - S.food.length);
      for (let i = 0; i < n; i++) { const a = rnd(0, TAU), r = 26 * Math.sqrt(Math.random()); S.food.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, vx: 0, vy: 0, born: S.time, landAt: rnd(0.1, 0.35), landed: false, held: null }); }
      opts.onCount && opts.onCount(S.octos.length, S.food.length);
    }
    function inkBurst(o, dx, dy) {
      for (let k = 0; k < 70; k++) {
        const a = Math.atan2(-dy, -dx) + rnd(-1.2, 1.2), v = rnd(20, 150);
        S.ink.push({ x: o.x + rnd(-0.2, 0.2) * o.R, y: o.y + rnd(-0.2, 0.2) * o.R, vx: Math.cos(a) * v, vy: Math.sin(a) * v, born: S.time + k * 0.004, life: rnd(2.6, 4.2), r: rnd(0.6, 1.4) });
      }
    }
    const life = (r) => 1.2 + 4 * r.strength;
    // gallery studies play themselves
    function autoplay(dt) {
      const a = cfg.auto, t = S.time; if (!a || !S.octos.length) return;
      S.autoT = (S.autoT || 0) + dt; const o = S.octos[0];
      if (a === "feed" && S.autoT > 6.5) { S.autoT = 0; drop(clamp(o.x + rnd(-1, 1) * o.R * 2.4, o.R, S.W - o.R), clamp(o.y + rnd(-1, 1) * o.R * 1.6, o.R, S.H - o.R)); }
      if (a === "ink" && S.autoT > 6 && !reduce) { S.autoT = 0; const ang = rnd(0, TAU); o.flee = 1; o.fdx = Math.cos(ang); o.fdy = Math.sin(ang); inkBurst(o, o.fdx, o.fdy); o.nextPulse = 0; o.inkCd = 3; }
      if (a === "reach") { const r = Math.min(S.W, S.H) * 0.36; S.ptr.x = S.W / 2 + Math.cos(t * 0.45) * r; S.ptr.y = S.H / 2 + Math.sin(t * 0.7) * r * 0.7; S.ptr.active = true; S.ptr.t = t; S.ptr.speed = 40; }
    }
    // pages change how many octopuses there are, their colours and how present they are
    function configure(next) {
      cfg = Object.assign({}, cfg, next);
      const target = wantCount(), live = S.octos.filter((o) => !o.leaving);
      live.forEach((o, i) => { o.skin = skinFor(i); o.dest = null; o.forceGo = true; });
      if (live.length > target) live.slice(target).forEach((o) => { o.leaving = o.x < S.W / 2 ? -1 : 1; o.reach = null; o.carry = null; o.target = null; });
      for (let i = live.length; i < target; i++) {
        const o = makeOcto(i, target, baseR() * (i === 3 ? 0.78 : i === 2 ? 0.9 : 1)), side = Math.random() < 0.7 ? 1 : -1, dy = pickDest()[1];
        const shift = (side > 0 ? S.W + o.R * 3.5 : -o.R * 3.5) - o.x, sh2 = dy - o.y;
        o.x += shift; o.y += sh2; for (const arm of o.arms) for (const nd of arm.nodes) { nd.x += shift; nd.px += shift; nd.y += sh2; nd.py += sh2; }
        o.heading = side > 0 ? Math.PI : 0; o.entering = true; o.dest = pickDest(); o.going = true; o.destT = S.time + 12; o.nextPulse = rnd(0, 0.6);
        S.octos.push(o);
      }
      opts.onCount && opts.onCount(target, S.food.length);
      measureAvoid();
    }
    function step(dt) {
      if (S.paused) return;
      S.time += dt; const t = S.time;
      S.ptr.speed *= Math.exp(-8 * dt);
      { const pr = S.press && S.press(); if (pr && !pr.o.grab && performance.now() - pr.t > 260) startGrab(pr.o); }
      for (const o of S.octos) think(o, dt);
      const nb = S.octos.length;
      S.octos = S.octos.filter((o) => !(o.leaving && (o.x < -o.R * 4 || o.x > S.W + o.R * 4)));
      if (S.octos.length !== nb) opts.onCount && opts.onCount(S.octos.filter((o) => !o.leaving).length, S.food.length);
      S.gdim += (cfg.dim - S.gdim) * Math.min(1, dt * 2);
      autoplay(dt);
      // physics at a fixed 60 Hz
      S.acc = (S.acc || 0) + dt; let n = 0;
      while (S.acc >= 1 / 60 && n < 4) { S.acc -= 1 / 60; n++; for (const o of S.octos) physics(o, 1 / 60, t); }
      // food
      const before = S.food.length;
      for (const f of S.food) {
        if (!f.landed) { if (t - f.born >= f.landAt) { f.landed = true; S.ripples.push({ x: f.x, y: f.y, born: t, strength: 0.1 }); } continue; }
        if (f.held) { const tip = f.held.arm.nodes[f.held.k]; f.x = tip.x; f.y = tip.y; }
        else { f.x += Math.sin(t * 0.7 + f.born) * 3 * dt; f.y += 2 * dt; }
      }
      S.food = S.food.filter((f) => !f.eaten && (f.held || t - f.born < 30));
      if (S.food.length !== before) opts.onCount && opts.onCount(S.octos.length, S.food.length);
      for (const p of S.ink) { if (t < p.born) continue; const d = Math.exp(-1.6 * dt); p.vx *= d; p.vy *= d; p.x += p.vx * dt; p.y += p.vy * dt + 3 * dt; }
      S.ink = S.ink.filter((p) => t - p.born < p.life);
      S.ripples = S.ripples.filter((r) => t - r.born < life(r));
    }

    function pickDest() {
      const { W, H } = S, mob = W < 700;
      if (mini) return [rnd(0.3, 0.7) * W, rnd(0.3, 0.7) * H];
      if (cfg.zone === "home") { if (mob) return [rnd(0.2, 0.8) * W, rnd(0.14, 0.46) * H]; const yy = rnd(0.18, 0.85); return [(yy > 0.42 ? rnd(0.66, 0.9) : rnd(0.3, 0.9)) * W, yy * H]; }
      if (cfg.zone === "center") return mob ? [rnd(0.3, 0.7) * W, rnd(0.2, 0.42) * H] : [rnd(0.4, 0.75) * W, rnd(0.22, 0.5) * H];
      if (cfg.zone === "low") return [rnd(0.55, 0.9) * W, rnd(0.55, 0.85) * H];
      return mob ? [rnd(0.3, 0.8) * W, rnd(0.13, 0.28) * H] : [rnd(0.68, 0.9) * W, rnd(0.2, 0.42) * H];
    }
    function think(o, dt) {
      const { W, H, ptr, time: t } = S, R = o.R;
      o.inkCd = Math.max(0, o.inkCd - dt);
      let gx = 0, gy = 0, want = 0; // desired direction & urge (0 = hover)
      // mostly hover; now and then pick a new spot and jet over to it
      if (o.leaving) { o.dest = [o.leaving < 0 ? -R * 6 : W + R * 6, o.y]; o.going = true; o.destT = t + 99; }
      else if (!o.dest || t > o.destT) { o.dest = pickDest(); o.destT = t + (cfg.auto === "jet" ? rnd(2.5, 4) : rnd(9, 16)); o.going = o.forceGo || cfg.auto === "jet" || Math.random() < 0.75; o.forceGo = false; }
      { const ex = o.dest[0] - o.x, ey = o.dest[1] - o.y, d = Math.hypot(ex, ey) || 1;
        if (!o.going && cfg.zone !== "home" && !mini && d > R * 4) o.going = true;
        if (o.going && d > R * 1.5) { gx = ex / d; gy = ey / d; want = 0.75; } else { o.going = false; o.wander += (Math.random() - 0.5) * dt * 0.6; gx = Math.cos(o.wander) * 0.3; gy = Math.sin(o.wander) * 0.3; want = 0.05; } }
      // walls & text
      const m = mini ? R * 1.9 : R * 2.2;
      if (!o.leaving && !o.entering) { if (o.x < m) gx += (m - o.x) / m * 5; if (o.x > W - m) gx -= (o.x - W + m) / m * 5;
      if (o.y < m + 40) gy += (m + 40 - o.y) / m * 5; if (o.y > H - m) gy -= (o.y - H + m) / m * 5; }
      if (o.entering && o.x > R * 2 && o.x < W - R * 2 && Math.hypot(o.dest[0] - o.x, o.dest[1] - o.y) < R * 3) { o.entering = false; o.vx *= 0.25; o.vy *= 0.25; o.flee = 0; }
      if (textBox) { const b = textBox, cx = clamp(o.x, b.l, b.r), cy = clamp(o.y, b.t, b.b), ex = o.x - cx, ey = o.y - cy, d = Math.hypot(ex, ey), Rr = R * 3;
        if (d < Rr) { const f = (1 - d / Rr) * 2.5; if (d > 1) { gx += ex / d * f; gy += ey / d * f; } else { gx += 1; gy -= 1; } want = Math.max(want, 0.6);
          if (cfg.zone !== "home") { if (W < 700) gy -= f * 1.5; else gx += f * 1.5; } } }
      for (const p of S.octos) { if (p === o) continue; const ex = o.x - p.x, ey = o.y - p.y, d = Math.hypot(ex, ey), r = (o.R + p.R) * (mini ? 2 : 3.4);
        if (d < r && d > 0.1) { const f = (1 - d / r) * 2.5; gx += ex / d * f; gy += ey / d * f; want = Math.max(want, 0.5 * (1 - d / r) + 0.2); } }
      // food
      if (!o.carry && (!o.reach || o.reach.kind !== "food" || o.reach.food.held || o.reach.food.eaten)) {
        if (o.reach && o.reach.kind === "food") o.reach = null;
        let best = null, bd = 1e9; for (const f of S.food) if (f.landed && !f.held && !f.eaten) { const d = Math.hypot(f.x - o.x, f.y - o.y); if (d < bd) { bd = d; best = f; } }
        o.target = best && bd < 1100 ? best : null;
      }
      if (o.carry) { want = 0; }
      else if (o.target) {
        const f = o.target, ex = f.x - o.x, ey = f.y - o.y, d = Math.hypot(ex, ey) || 1;
        if (d > R * 3.2) { gx += ex / d * 3; gy += ey / d * 3; want = 1; } else { want = 0; gx = -ex / d; gy = -ey / d; o.vx += ex / d * (d - R * 1.9) * 0.8 * dt; o.vy += ey / d * (d - R * 1.9) * 0.8 * dt; } // turn the arms toward it and drift into reach
        if (d < R * 2.9) { // reach with the nearest arm
          if (!o.reach || o.reach.food !== f) o.reach = { kind: "food", food: f, arm: nearestArm(o, f.x, f.y) };
          const tip = o.reach.arm.nodes[N - 1];
          if (Math.hypot(tip.x - f.x, tip.y - f.y) < Math.max(10, R * 0.25)) { f.held = { arm: o.reach.arm, k: N - 1 }; o.carry = f; o.carryT = t; o.target = null; o.reach = { kind: "mouth", arm: o.reach.arm }; S.ripples.push({ x: f.x, y: f.y, born: t, strength: 0.12 }); }
        }
      }
      if (o.carry) { const tip = o.reach.arm.nodes[N - 1]; if ((Math.hypot(tip.x - o.x, tip.y - o.y) < R * 0.5 && t - o.carryT > 1.2) || t - o.carryT > 6) { o.carry.eaten = true; o.carry = null; o.reach = null; o.c = 0.6; } }
      // cursor: eyes follow it; curiosity, reaching (more arms the longer you linger), petting, grabbing, ink
      o.flash *= Math.exp(-5 * dt); o.shrink *= Math.exp(-3.2 * dt); o.spin *= Math.exp(-1.6 * dt); o.heading += o.spin * dt;
      o.blink -= dt; if (o.blink < 0) { o.blinkUntil = t + 0.13; o.blink = rnd(3, 7); }
      const fresh = ptr.active && t - ptr.t < 4;
      const onBody = fresh && bodyDist(o, ptr.x, ptr.y) < R * 0.85;
      const petting = onBody && !ptr.down && !o.grab && ptr.speed > 12 && ptr.speed < 700;
      if (petting) { o.pet = Math.min(1, o.pet + dt * 0.9); o.blushX = ptr.x; o.blushY = ptr.y; }
      else o.pet = Math.max(0, o.pet - dt * (onBody ? 0.08 : 0.3));
      let curious = false;
      const reachR = R * (mini ? 2.4 : 3.4);
      if (o.grab) { // held: arms wrap the cursor, the body trails it on an elastic leash
        const ex = ptr.x - o.x, ey = ptr.y - o.y, d = Math.hypot(ex, ey) || 1, rest = R * 0.9;
        if (d > rest) { const k = (d - rest) * 26; o.vx += ex / d * k * dt; o.vy += ey / d * k * dt; }
        const dmp = Math.exp(-6 * dt); o.vx *= dmp; o.vy *= dmp;
        gx = -ex / d; gy = -ey / d; want = 0; o.flee = 0; o.going = false; o.dest = [o.x, o.y]; o.destT = t + 4; o.pet = 0;
        addArms(o, 5, ptr.x, ptr.y); curious = true;
      } else if (fresh && !o.target && !o.carry && t - o.pokeT > 0.7) {
        const ex = ptr.x - o.x, ey = ptr.y - o.y, d = Math.hypot(ex, ey) || 1;
        if (ptr.speed > 1300 && d < R * 4 && o.inkCd === 0 && !ptr.down) { o.flee = 1; o.fdx = -ex / d; o.fdy = -ey / d; inkBurst(o, o.fdx, o.fdy); o.inkCd = 3; o.nextPulse = 0; o.ptrArms.length = 0; o.pet = 0; }
        else if (onBody) { // a hand resting on the mantle: stay put and relax
          want = 0; gx = Math.cos(o.heading); gy = Math.sin(o.heading); const dmp = Math.exp(-3 * dt); o.vx *= dmp; o.vy *= dmp; o.ptrArms.length = 0; o.linger = 0;
        } else if ((mini || d < 480) && o.flee < 0.2) {
          curious = true;
          const f = o.curiosity * (mini ? 0.9 : 1 - d / 480) * 2;
          if (d > reachR) { gx += ex / d * f * 1.5; gy += ey / d * f * 1.5; want = Math.max(want, 0.7 * o.curiosity); o.linger = Math.max(0, o.linger - dt); }
          else { want = 0; gx = -ex / d; gy = -ey / d; if (mini) { const dm = Math.exp(-2.5 * dt); o.vx *= dm; o.vy *= dm; } o.linger += dt * (ptr.speed < 500 ? 1 : 0.3);
            addArms(o, Math.min(4, 1 + (o.linger > 1.4) + (o.linger > 3) + (o.linger > 5)), ptr.x, ptr.y); }
          if (d > reachR * 1.15) o.ptrArms.length = 0;
        }
      }
      if (!curious && !o.grab) { o.ptrArms.length = 0; if (!onBody) o.linger = 0; }
      if (o.flee > 0.02) { gx += o.fdx * 3 * o.flee; gy += o.fdy * 3 * o.flee; want = 1; o.flee *= Math.exp(-0.9 * dt); }
      // steer: the mantle leads
      if (o.leaving || o.entering) { const ex = o.dest[0] - o.x, ey = o.dest[1] - o.y, d = Math.hypot(ex, ey) || 1; gx = ex / d; gy = ey / d; want = 1; o.flee = Math.max(o.flee, 0.35); o.fdx = gx; o.fdy = gy;
        const near = clamp(d / (R * 4), 0.15, 1); o.vx += gx * R * 2.2 * near * dt; o.vy += gy * R * 2.2 * near * dt; if (o.entering && d < R * 4) o.flee = Math.min(o.flee, 0.05); }
      const desired = Math.atan2(gy, gx), turnRate = (want > 0.1 ? 1.3 : 0.5) * (1 + o.flee * 2) * (o.grab ? 3 : 1);
      o.heading += clamp(angDiff(o.heading, desired), -turnRate * dt, turnRate * dt);
      // jet pulses
      o.pulseT += dt; o.nextPulse -= dt;
      if (o.nextPulse <= 0 && want > 0.3 && Math.abs(angDiff(o.heading, desired)) < 0.9) {
        o.pulseT = 0; o.nextPulse = o.flee > 0.1 ? rnd(0.45, 0.6) : rnd(1.6, 2.6) / Math.max(0.5, want); o.kick = (o.flee > 0.1 ? 230 : 70 + 40 * want) * (mini ? clamp(R / 70, 0.35, 1) : 1);
      }
      const pt = o.pulseT;
      if (pt < 0.32) o.c = Math.max(o.c, smooth(0, 0.32, pt)); else o.c += (0 - o.c) * Math.min(1, dt * 2.2);
      if (pt >= 0.32 && o.kick) { const [fx, fy] = fwdOf(o); o.vx += fx * o.kick; o.vy += fy * o.kick; o.kick = 0; S.ripples.push({ x: o.x - fx * R * 0.2, y: o.y - fy * R * 0.2, born: t, strength: 0.05 }); }
      const drag = Math.exp(-(want < 0.1 ? 2.2 : 1.15) * dt); o.vx *= drag; o.vy *= drag;
      if (want < 0.1) { o.vx += (gx * 6 - o.vx) * 0 ; }
      o.x += o.vx * dt; o.y += o.vy * dt;
      if (!o.leaving && !o.entering) { const mx = R * (mini ? 1.9 : 0.9), my = R * (mini ? 1.9 : 0.9); if (o.x < mx) { o.x = mx; o.vx = Math.abs(o.vx) * 0.3; } if (o.x > W - mx) { o.x = W - mx; o.vx = -Math.abs(o.vx) * 0.3; } if (o.y < my) { o.y = my; o.vy = Math.abs(o.vy) * 0.3; } if (o.y > H - my) { o.y = H - my; o.vy = -Math.abs(o.vy) * 0.3; } }
      // personal space, applied directly so jets can't push them into each other
      for (const p of S.octos) { if (p === o) continue; const ex = o.x - p.x, ey = o.y - p.y, d = Math.hypot(ex, ey) || 0.1, r = (o.R + p.R) * (mini ? 1.6 : 2.3);
        if (d < r) { const push = (r - d) * 1.6 * dt; o.x += ex / d * push; o.y += ey / d * push; const vn = (o.vx * ex + o.vy * ey) / d; if (vn < 0) { o.vx -= ex / d * vn * 0.5; o.vy -= ey / d * vn * 0.5; } } }
      // gentle hover drift
      o.x += Math.cos(t * 0.3 + o.phase) * 2 * dt; o.y += Math.sin(t * 0.37 + o.phase) * 2 * dt;
    }
    function bodyDist(o, x, y) { const [fx, fy] = fwdOf(o); return Math.min(Math.hypot(x - o.x, y - o.y), Math.hypot(x - o.x - fx * o.R * 0.62, y - o.y - fy * o.R * 0.62)); }
    function addArms(o, n, x, y) {
      while (o.ptrArms.length > n) o.ptrArms.pop();
      while (o.ptrArms.length < n) { let b = null, bd = 1e9; for (const a of o.arms) { if (o.ptrArms.includes(a)) continue; const tp = a.nodes[N - 1], d = Math.hypot(tp.x - x, tp.y - y); if (d < bd) { bd = d; b = a; } } if (!b) break; o.ptrArms.push(b); }
    }
    function hitOcto(x, y) {
      let best = null, bd = 1e9;
      for (const o of S.octos) {
        if (o.leaving) continue;
        let d = bodyDist(o, x, y) / o.R; if (d > 0.85) d = 1e9;
        if (d === 1e9) for (const a of o.arms) { for (let k = 1; k < N - 1; k++) { const n = a.nodes[k], dd = Math.hypot(x - n.x, y - n.y); if (dd < Math.max(S.cw * 1.1, o.R * (0.17 * (1 - k / (N - 1)) + 0.04))) { d = 1 + dd / o.R; break; } } if (d < 1e9) break; }
        if (d < bd) { bd = d; best = o; }
      }
      return best ? { o: best, body: bd < 1 } : null;
    }
    function poke(o, x, y, soft) {
      o.pokeT = S.time; o.flash = soft ? 0.6 : 1; o.shrink = soft ? 0.5 : 1; o.pet = 0; o.ptrArms.length = 0; o.linger = 0;
      const ex = o.x - x, ey = o.y - y, d = Math.hypot(ex, ey) || 1; o.vx += ex / d * 70; o.vy += ey / d * 70;
      S.ripples.push({ x, y, born: S.time, strength: 0.18 });
    }
    function startGrab(o) {
      o.grab = { t: S.time }; o.target = null; o.pet = 0;
      if (o.carry) { o.carry.held = null; o.carry = null; } o.reach = null;
    }
    function release(o, x, y) {
      o.grab = null; const a = Math.atan2(o.y - y, o.x - x) + rnd(-0.5, 0.5);
      o.flee = 0.7; o.fdx = Math.cos(a); o.fdy = Math.sin(a); o.nextPulse = 0; o.ptrArms.length = 0; o.linger = 0; o.spin = rnd(-1, 1) * 2.5;
      o.inkCd = Math.max(o.inkCd, 1.5); o.dest = null; S.ripples.push({ x: o.x, y: o.y, born: S.time, strength: 0.15 });
    }
    // inverse kinematics (FABRIK) for an arm reaching for a point; the root stays on the body
    function fabrik(arm, tx, ty, stretch) {
      const nd = arm.nodes, p = nd.map((n) => ({ x: n.x, y: n.y })), L = arm.len;
      for (let it = 0; it < 3; it++) {
        p[N - 1].x = tx; p[N - 1].y = ty;
        for (let k = N - 2; k >= 0; k--) { const dx = p[k].x - p[k + 1].x, dy = p[k].y - p[k + 1].y, d = Math.hypot(dx, dy) || 1e-3, l = L[k + 1] * stretch; p[k].x = p[k + 1].x + dx / d * l; p[k].y = p[k + 1].y + dy / d * l; }
        p[0].x = nd[0].x; p[0].y = nd[0].y;
        for (let k = 1; k < N; k++) { const dx = p[k].x - p[k - 1].x, dy = p[k].y - p[k - 1].y, d = Math.hypot(dx, dy) || 1e-3, l = L[k] * stretch; p[k].x = p[k - 1].x + dx / d * l; p[k].y = p[k - 1].y + dy / d * l; }
      }
      return p;
    }
    function nearestArm(o, x, y) { let b = o.arms[0], bd = 1e9; for (const a of o.arms) { const tp = a.nodes[N - 1], d = Math.hypot(tp.x - x, tp.y - y); if (d < bd) { bd = d; b = a; } } return b; }

    function physics(o, h, t) {
      const rest = restPose(o, t), rs = roots(o);
      for (let a = 0; a < 8; a++) {
        const arm = o.arms[a], nd = arm.nodes, rp = rest[a];
        nd[0].x = rs[a][0]; nd[0].y = rs[a][1]; nd[0].px = nd[0].x; nd[0].py = nd[0].y;
        const pj = o.ptrArms.indexOf(arm), reaching = (o.reach && o.reach.arm === arm) || pj >= 0;
        if (pj < 0 && arm.stretch > 1) arm.stretch = 1 + (arm.stretch - 1) * 0.92;
        arm.boost = (arm.boost || 0) + ((pj >= 0 ? 1 : 0) - (arm.boost || 0)) * 0.06;
        for (let k = 1; k < N; k++) {
          const p = nd[k], s = k / (N - 1), vx = (p.x - p.px) * 0.9, vy = (p.y - p.py) * 0.9;
          p.px = p.x; p.py = p.y;
          let kS = lerp(0.07, 0.012, s);
          if (reaching) kS *= 0.1;
          p.x += vx + (rp[k][0] - p.x) * kS; p.y += vy + (rp[k][1] - p.y) * kS;
        }
        if (pj >= 0) { // IK toward the cursor; close up, the last nodes curl around it
          const grab = !!o.grab, cx = S.ptr.x, cy = S.ptr.y, root = nd[0];
          let total = 0; for (let k = 1; k < N; k++) total += arm.len[k];
          arm.stretch = grab ? clamp(Math.hypot(cx - root.x, cy - root.y) / (total * 0.9), 1, 1.6) : 1 + ((arm.stretch || 1) - 1) * 0.9;
          const ik = fabrik(arm, cx, cy, arm.stretch), rc = Math.max(S.cw * 1.1, o.R * (grab ? 0.2 : 0.15));
          const tipD = Math.hypot(nd[N - 1].x - cx, nd[N - 1].y - cy), wrap = clamp(1 - (tipD - rc) / (o.R * 0.8), 0, 1);
          const base = Math.atan2(ik[N - 4].y - cy, ik[N - 4].x - cx), dir = arm.curl > 0 ? 1 : -1, str = grab ? 0.35 : 0.13 * (pj === 0 ? 1 : 0.75);
          for (let k = 2; k < N; k++) {
            let tx = ik[k].x, ty = ik[k].y;
            if (k >= N - 3 && wrap > 0) { const j = k - (N - 4), an = base + dir * j * (grab ? 1.25 : 0.95); tx = lerp(tx, cx + Math.cos(an) * rc, wrap); ty = lerp(ty, cy + Math.sin(an) * rc, wrap); }
            const w = str * (0.3 + 0.7 * k / (N - 1)); nd[k].x += (tx - nd[k].x) * w; nd[k].y += (ty - nd[k].y) * w;
          }
        }
        if (o.reach && o.reach.arm === arm) { // pull the tip (and a little of the arm) toward the goal
          let gx, gy, str = 0.05;
          if (o.reach.kind === "ptr") { gx = S.ptr.x; gy = S.ptr.y; str = 0.05; }
          else if (o.reach.kind === "food") { gx = o.reach.food.x; gy = o.reach.food.y; }
          else { gx = o.x; gy = o.y; str = 0.014; }
          for (let k = N - 4; k < N; k++) { const p = nd[k], w = str * (k - N + 5) / 4; p.x += (gx - p.x) * w; p.y += (gy - p.y) * w; }
        }
        for (let it = 0; it < 4; it++) for (let k = 1; k < N; k++) {
          const p = nd[k - 1], q = nd[k], dx = q.x - p.x, dy = q.y - p.y, d = Math.hypot(dx, dy) || 1e-3, L = arm.len[k] * (arm.stretch || 1), diff = (d - L) / d;
          if (k === 1) { q.x -= dx * diff; q.y -= dy * diff; } else { q.x -= dx * diff * 0.5; q.y -= dy * diff * 0.5; p.x += dx * diff * 0.5; p.y += dy * diff * 0.5; }
        }
      }
    }

    // ---------- raster ----------
    function put(i, c, oid, pt, tile, g, gc, ga) {
      // a later creature covers an earlier one only where it is solid; within a creature, max coverage wins
      if (own[i] && own[i] !== oid) { if (c < 0.5) return; }
      else if (own[i] === oid && c <= cov[i]) return;
      cov[i] = c; own[i] = oid; part[i] = pt; tileOn[i] = tile ? 1 : 0; tileC[i] = tile ? pack(tile) : 0; glyph[i] = g; glyphC[i] = pack(gc); glyphA[i] = ga;
    }
    // chromatophores: petting sends rings of blush out from the hand; a poke flashes the whole skin
    function skinFx(o, tile, px, py, t) {
      if (o.pet > 0.01) { const dd = Math.hypot(px - o.blushX, py - o.blushY), wv = 0.5 + 0.5 * Math.sin(dd / (S.cw * 0.9) - t * 6); tile = mix(tile, pal.blush, o.pet * (0.12 + 0.7 * wv * wv) * Math.exp(-dd / (o.R * 1.6))); }
      if (o.flash > 0.02) tile = mix(tile, pal.flash, o.flash * 0.75);
      return tile;
    }
    function rasterOcto(o, t) {
      const { cw, ch, cols, rows } = S, R = o.R, skin = pal.skins[o.skin], [fx, fy] = fwdOf(o), sx = -fy, sy = fx, oid = o.id;
      const aa = cw * 0.75;
      const shimmer = (u, v) => { // chromatophore mottling that slowly crawls
        const n = vnoise(u * 2.3 + o.shimmer, v * 2.3 + t * 0.25) * 0.65 + vnoise(u * 5.1 - t * 0.4, v * 5.1 + o.shimmer) * 0.35;
        return smooth(0.42, 0.72, n + 0.08 * Math.sin(t * 1.7 + u * 3 + o.phase));
      };
      // arms first (body sits on top)
      for (let a = 0; a < 8; a++) {
        const nd = o.arms[a].nodes;
        for (let k = 1; k < N; k++) {
          const p = nd[k - 1], q = nd[k], s0 = (k - 1) / (N - 1), s1 = k / (N - 1);
          const bo = o.arms[a].boost || 0, r0 = R * (0.17 * Math.pow(1 - s0, 1.2) + 0.018 + 0.06 * bo * s0), r1 = R * (0.17 * Math.pow(1 - s1, 1.2) + 0.018 + 0.06 * bo * s1), rm = Math.max(r0, r1);
          const c0 = Math.max(0, Math.floor((Math.min(p.x, q.x) - rm - cw) / cw)), c1 = Math.min(cols - 1, Math.floor((Math.max(p.x, q.x) + rm + cw) / cw));
          const w0 = Math.max(0, Math.floor((Math.min(p.y, q.y) - rm - ch) / ch)), w1 = Math.min(rows - 1, Math.floor((Math.max(p.y, q.y) + rm + ch) / ch));
          const dx = q.x - p.x, dy = q.y - p.y, mm = dx * dx + dy * dy || 1;
          for (let r = w0; r <= w1; r++) for (let c = c0; c <= c1; c++) {
            const px = c * cw + cw / 2, py = r * ch + ch / 2, tt = clamp(((px - p.x) * dx + (py - p.y) * dy) / mm, 0, 1);
            const d = Math.hypot(px - p.x - dx * tt, py - p.y - dy * tt), rr0 = lerp(r0, r1, tt), s = lerp(s0, s1, tt);
            const thin = clamp(rr0 / (cw * 0.45), 0, 1), rr = Math.max(rr0, cw * 0.45); // thin tips stay continuous, just fainter
            const cv = clamp(0.5 + (rr - d) / aa, 0, 1); if (cv < 0.3) continue;
            const i = r * cols + c;
            const m = shimmer(s * 3 + a * 1.7, d / R), core = 1 - clamp(d / Math.max(rr, 1), 0, 1);
            let tile = mix(skin.base, skin.mottle, 0.22 + m * 0.4);
            tile = mix(tile, skin.hi, core * 0.2 * (1 - s));
            if (o.pet > 0.01 || o.flash > 0.02) tile = skinFx(o, tile, px, py, t);
            tile = mix(pal.bg, tile, (pal.solid + (1 - pal.solid) * cv) * (pal.solid + (1 - pal.solid) * thin));
            let g = GLYPHS.charCodeAt(clamp(Math.round((1 - core) * 3 + m * 2 + hash(c, r, a) * 1.5), 0, 6)), gc = mix(tile, skin.mottle, 0.75), ga = 0.75;
            // suckers show on the curled outer half of each arm
            if (s > 0.5 && thin > 0.5 && cv > 0.6 && hash(c * 3 + a, r * 5, 1) < 0.3) { g = 111; gc = mix(tile, pal.sucker, 0.6); ga = 0.9; }
            if (cv < 0.55) g = 32;
            if (thin < 0.62) { // thin tips become a drawn line instead of a filled cell: smoother taper
              if (d > cw * 0.55) continue;
              const ang = Math.atan2(dy, dx), aa2 = Math.abs(Math.sin(ang)), ac = Math.abs(Math.cos(ang));
              g = aa2 < 0.38 ? 45 : ac < 0.38 ? 124 : (Math.sin(ang) * Math.cos(ang) > 0 ? 92 : 47);
              put(i, 0.5 + 0.2 * thin, oid, a + 1, null, g, mix(skin.base, skin.hi, 0.25), 0.55 + 0.45 * thin / 0.62);
              continue;
            }
            put(i, cv, oid, a + 1, tile, g, gc, ga);
          }
        }
      }
      // the web (interbrachial membrane) between neighbouring arms, near the base
      const inPoly = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
      for (let a = 0; a < 7; a++) {
        const A = o.arms[a].nodes, B = o.arms[a + 1].nodes, K = 3;
        const mid = [(A[K].x + B[K].x) / 2 * 0.45 + o.x * 0.55, (A[K].y + B[K].y) / 2 * 0.45 + o.y * 0.55];
        const poly = [[o.x, o.y], [A[1].x, A[1].y], [A[2].x, A[2].y], [A[K].x, A[K].y], mid, [B[K].x, B[K].y], [B[2].x, B[2].y], [B[1].x, B[1].y]];
        let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of poly) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
        for (let r = Math.max(0, Math.floor(y0 / ch)); r <= Math.min(rows - 1, Math.floor(y1 / ch)); r++) for (let cc = Math.max(0, Math.floor(x0 / cw)); cc <= Math.min(cols - 1, Math.floor(x1 / cw)); cc++) {
          const px = cc * cw + cw / 2, py = r * ch + ch / 2; if (!inPoly(poly, px, py)) continue;
          const i = r * cols + cc, m = shimmer(px / R * 0.7, py / R * 0.7);
          let tile = mix(skin.base, skin.mottle, 0.28 + m * 0.3);
          if (o.pet > 0.01 || o.flash > 0.02) tile = skinFx(o, tile, px, py, t);
          put(i, 0.98, oid, 0, tile, GLYPHS.charCodeAt(clamp(Math.round(2 + m * 3 + hash(cc, r, 3)), 0, 6)), mix(tile, skin.mottle, 0.7), 0.6);
        }
      }
      // mantle + head (smooth union), seen from above
      const c = o.c, shk = 1 - 0.22 * o.shrink, ma = R * 0.82 * (1 + 0.06 * c) * shk, mb = R * 0.6 * (1 - 0.24 * c) * shk, mcx = o.x + fx * R * 0.66, mcy = o.y + fy * R * 0.66, hr = R * 0.46;
      const ext = R * 1.4, c0 = Math.max(0, Math.floor((o.x - ext) / cw)), c1 = Math.min(cols - 1, Math.floor((o.x + ext) / cw));
      const w0 = Math.max(0, Math.floor((o.y - ext) / ch)), w1 = Math.min(rows - 1, Math.floor((o.y + ext) / ch));
      const eyes = [[o.x + fx * R * 0.05 + sx * R * 0.3, o.y + fy * R * 0.05 + sy * R * 0.3], [o.x + fx * R * 0.05 - sx * R * 0.3, o.y + fy * R * 0.05 - sy * R * 0.3]];
      const look = S.ptr.active && S.time - S.ptr.t < 4 ? Math.atan2(S.ptr.y - o.y, S.ptr.x - o.x) : o.heading;
      for (let r = w0; r <= w1; r++) for (let cc = c0; cc <= c1; cc++) {
        const px = cc * cw + cw / 2, py = r * ch + ch / 2;
        const u = (px - mcx) * fx + (py - mcy) * fy, v = (px - mcx) * sx + (py - mcy) * sy;
        const dm = (Math.hypot(u / ma, v / mb) - 1) * Math.min(ma, mb);
        const dh = Math.hypot(px - o.x, py - o.y) - hr;
        const kx = R * 0.18, hh = clamp(0.5 + 0.5 * (dh - dm) / kx, 0, 1), d = lerp(dh, dm, hh) - kx * hh * (1 - hh);
        const cv = clamp(0.5 + (-d) / aa, 0, 1); if (cv < 0.12) continue;
        const i = r * cols + cc;
        // eye?
        // shading: dome lit from the upper-left, a ridge along the mantle
        const nu = u / ma, nv = v / mb, dome = clamp(1 - (nu * nu + nv * nv), 0, 1);
        const light = clamp(0.55 + 0.35 * Math.sqrt(dome) - 0.18 * ((px - o.x) * 0.7 + (py - o.y) * 0.7) / R, 0.25, 1);
        const m = shimmer(u / R * 1.4, v / R * 1.4);
        let tile = mix(skin.base, skin.mottle, m * 0.6);
        tile = mix(tile, skin.hi, Math.max(0, light - 0.5) * 1.1);
        tile = mix(tile, skin.mottle, Math.max(0, 0.55 - light) * 0.8);
        tile = skinFx(o, tile, px, py, t);
        tile = mix(pal.bg, tile, 0.3 + 0.7 * cv * cv);
        let g = GLYPHS.charCodeAt(clamp(Math.round((1 - light) * 4 + m * 2 + hash(cc, r, 7) * 1.2), 0, 6));
        if (cv < 0.55) g = 32;
        put(i, Math.max(cv, own[i] === oid ? 0.99 : cv), oid, 9, tile, g, mix(tile, skin.mottle, 0.7), 0.7);
      }
      const closed = t < o.blinkUntil || t - o.pokeT < 0.3, fresh = S.ptr.active && S.time - S.ptr.t < 4;
      for (const [ex, ey] of eyes) { const i = cellIndex(ex, ey); if (i < 0) continue; cov[i] = 1; own[i] = oid; part[i] = 10; tileOn[i] = 1; tileC[i] = pack(pal.eye); glyph[i] = 32; glyphC[i] = pack(pal.pupil); glyphA[i] = 1;
        let lx = Math.cos(o.heading) * 0.45, ly = Math.sin(o.heading) * 0.45;
        if (fresh) { const dx = S.ptr.x - ex, dy = S.ptr.y - ey, d = Math.hypot(dx, dy) || 1, m = Math.min(1, d / (R * 1.2)); lx = dx / d * m; ly = dy / d * m; }
        S.eyes.push({ i, oid, lx, ly, closed, wide: !!o.grab || o.pet > 0.5 }); }
    }

    // ---------- avoid text ----------
    function measureAvoid() {
      if (mini || !dim) { if (dim) dim.fill(1); return; }
      const { cols, rows, cw, ch } = S, pad = 3 * cw; dim.fill(1); let tb = null;
      for (const el of document.querySelectorAll("[data-avoid]")) {
        if (!el.offsetParent && getComputedStyle(el).position !== "fixed") continue;
        const rects = [], tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), rg = document.createRange();
        if (el.hasAttribute("data-avoid-box")) rects.push(el.getBoundingClientRect());
        else for (let n; (n = tw.nextNode());) if (n.nodeValue.trim()) { rg.selectNodeContents(n); rects.push(...rg.getClientRects()); }
        for (const b of rects) { if (!b.width || b.bottom < 0 || b.top > S.H) continue;
          if (!el.matches("nav")) tb = tb ? { l: Math.min(tb.l, b.left), r: Math.max(tb.r, b.right), t: Math.min(tb.t, b.top), b: Math.max(tb.b, b.bottom) } : { l: b.left, r: b.right, t: b.top, b: b.bottom };
          const x0 = Math.max(0, Math.floor((b.left - pad) / cw)), x1 = Math.min(cols - 1, Math.floor((b.right + pad) / cw));
          const y0 = Math.max(0, Math.floor((b.top - pad) / ch)), y1 = Math.min(rows - 1, Math.floor((b.bottom + pad) / ch));
          for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
            const cx = x * cw + cw / 2, cy = y * ch + ch / 2, i = y * cols + x;
            dim[i] = Math.min(dim[i], 0.15 + 0.85 * smooth(0, pad, Math.hypot(Math.max(b.left - cx, 0, cx - b.right), Math.max(b.top - cy, 0, cy - b.bottom))));
          } }
      }
      textBox = tb;
    }

    // ---------- draw ----------
    const styleCache = new Map();
    const style = (u) => { let s = styleCache.get(u); if (!s) { s = `rgb(${u >>> 16},${(u >>> 8) & 255},${u & 255})`; styleCache.set(u, s); } return s; };
    const cellIndex = (x, y) => { const c = Math.floor(x / S.cw), r = Math.floor(y / S.ch); return c < 0 || r < 0 || c >= S.cols || r >= S.rows ? -1 : r * S.cols + c; };
    function glyphAt(i, chr, col, a) { const { cols, cw, ch } = S; ctx.globalAlpha = a * S.gdim; ctx.fillStyle = style(pack(col)); ctx.fillText(chr, (i % cols) * cw + cw / 2, ((i / cols) | 0) * ch + ch / 2 + 1); }
    function render(dt) {
      const { cols, rows, cw, ch, time: t } = S;
      cov.fill(0); own.fill(0); glyph.fill(0); inkD.fill(0); S.eyes.length = 0;
      // draw order: the one carrying food or reaching sits on top
      const order = [...S.octos].sort((a, b) => (a.reach ? 1 : 0) - (b.reach ? 1 : 0) || a.id - b.id);
      for (const o of order) rasterOcto(o, t);
      // ink density
      for (const p of S.ink) {
        if (t < p.born) continue; const age = (t - p.born) / p.life, rad = (1.2 + age * 4) * p.r, w = (1 - age) * (1 - age);
        const c0 = Math.floor(p.x / cw), r0 = Math.floor(p.y / ch), rc = Math.ceil(rad);
        for (let r = r0 - rc; r <= r0 + rc; r++) for (let c = c0 - rc; c <= c0 + rc; c++) {
          if (c < 0 || r < 0 || c >= cols || r >= rows) continue; const dd = Math.hypot(c - c0, r - r0); if (dd > rad) continue;
          inkD[r * cols + c] += w * (1 - dd / (rad + 0.01)) * 0.7;
        }
      }
      // water energy from jets and the cursor
      for (const o of S.octos) if (o.pulseT < 0.6) { const [fx, fy] = fwdOf(o), i = cellIndex(o.x - fx * o.R * 0.5, o.y - fy * o.R * 0.5); if (i >= 0) energy[i] = Math.min(1.5, energy[i] + 0.06); }
      if (S.ptr.active) { const i = cellIndex(S.ptr.x, S.ptr.y); if (i >= 0) energy[i] = Math.min(1.5, energy[i] + 0.06 + S.ptr.speed * 0.00012); }
      const decay = Math.exp(-0.9 * dt);
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const i = y * cols + x;
        energyTmp[i] = (4 * energy[i] + (x > 0 ? energy[i - 1] : energy[i]) + (x < cols - 1 ? energy[i + 1] : energy[i]) + (y > 0 ? energy[i - cols] : energy[i]) + (y < rows - 1 ? energy[i + cols] : energy[i])) * 0.125 * decay;
      }
      [energy, energyTmp] = [energyTmp, energy];

      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
      ctx.font = `600 ${Math.round(0.72 * ch)}px ${font}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      for (let i = 0; i < energy.length; i++) { const e = energy[i]; if (e < 0.2 || own[i]) continue; glyphAt(i, e > 0.5 ? "-" : ".", pal.water, 0.28 * Math.min(1, (e - 0.2) * 1.5) * dim[i]); }
      // ripples
      for (const rp of S.ripples) {
        const age = t - rp.born; if (age < 0) continue;
        const h = Math.pow(1 - age / life(rp), 1.5) * rp.strength;
        for (let ring = 0; ring < 2; ring++) {
          const R = 55 * Math.max(0, age - 0.45 * ring) * (0.7 + 0.5 * rp.strength); if (R < 3) continue;
          const x0 = Math.max(0, Math.floor((rp.x - R - cw) / cw)), x1 = Math.min(cols - 1, Math.floor((rp.x + R + cw) / cw));
          const y0 = Math.max(0, Math.floor((rp.y - R - ch) / ch)), y1 = Math.min(rows - 1, Math.floor((rp.y + R + ch) / ch)), a = h * (ring ? 0.3 : 0.55);
          for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
            const i = y * cols + x; if (own[i]) continue;
            const dx = x * cw + cw / 2 - rp.x, dy = y * ch + ch / 2 - rp.y;
            if (Math.abs(Math.hypot(dx, dy) - R) > 0.6 * cw) continue;
            const ax = Math.abs(dx), ay = Math.abs(dy);
            glyphAt(i, ax < 0.45 * ay ? "-" : ay < 0.45 * ax ? "|" : dx * dy > 0 ? "\\" : "/", pal.water, a * 1.6 * dim[i]);
          }
        }
      }
      // ink (under the octopuses, which dart out of it)
      const IG = ":;%#";
      for (let i = 0; i < inkD.length; i++) {
        const d = inkD[i]; if (d < 0.08 || own[i]) continue;
        const px = (i % cols) * cw, py = ((i / cols) | 0) * ch, a = Math.min(1, d * 0.9) * pal.inkA * dim[i];
        ctx.globalAlpha = a; ctx.fillStyle = style(pack(pal.inkTile)); ctx.fillRect(px + 1, py + 1, cw - 1, ch - 1);
        ctx.globalAlpha = Math.min(1, d) * dim[i]; ctx.fillStyle = style(pack(pal.inkGlyph)); ctx.fillText(IG[clamp(Math.floor(d * 2.2), 0, 3)], px + cw / 2, py + ch / 2 + 1);
      }
      // food
      for (const f of S.food) {
        const i = cellIndex(f.x, f.y); if (i < 0) continue;
        if (own[i] && !f.held) continue;
        const fade = 1 - smooth(26, 30, t - f.born);
        if (f.landed) { ctx.globalAlpha = 0.55 * fade * Math.max(0.45, dim[i]); ctx.fillStyle = style(pack(mix(pal.bg, pal.food, 0.55))); ctx.fillRect((i % cols) * cw + 1, ((i / cols) | 0) * ch + 1, cw - 1, ch - 1); }
        if (!f.held) glyphAt(i, f.landed ? "o" : ".", pal.food, (f.landed ? 1 : 0.7) * fade * Math.max(0.45, dim[i]));
      }
      // octopuses; cells on the boundary between two creatures (or two crossing arms) are darkened so overlaps never merge into a blob
      const A = pal.alpha;
      for (let i = 0; i < glyph.length; i++) {
        const o = own[i]; if (!o) continue;
        const x = i % cols, y = (i / cols) | 0;
        let edge = false;
        const pi = part[i];
        for (const j of [x > 0 ? i - 1 : -1, x < cols - 1 ? i + 1 : -1, y > 0 ? i - cols : -1, y < rows - 1 ? i + cols : -1]) {
          if (j < 0) continue; const oj = own[j];
          if (oj && oj !== o && oj > o) { edge = true; break; }
          if (oj === o && pi > 0 && pi < 9 && part[j] > 0 && part[j] < 9 && Math.abs(part[j] - pi) > 1 && cov[i] < cov[j]) { edge = true; break; }
          if (oj === o && pi === 9 && part[j] < 9) { edge = true; break; }
        }
        let tc = tileC[i];
        if (edge) { const c = [tc >>> 16, (tc >>> 8) & 255, tc & 255]; tc = pack(mix(c, pal.edgeTo, pal.edge)); }
        const px = x * cw, py = y * ch;
        const gd = dim[i] * S.gdim;
        if (tileOn[i]) { ctx.globalAlpha = A * gd; ctx.fillStyle = style(tc); ctx.fillRect(px + 1, py + 1, cw - 1, ch - 1); }
        if (glyph[i] !== 32) { ctx.globalAlpha = glyphA[i] * gd * (part[i] === 10 || !tileOn[i] ? 1 : pal.gk); ctx.fillStyle = style(glyphC[i]); ctx.fillText(String.fromCharCode(glyph[i]), px + cw / 2, py + ch / 2 + 1); }
      }
      // pupils: a horizontal slit that slides toward the cursor
      ctx.fillStyle = style(pack(pal.pupil));
      for (const e of S.eyes) {
        if (own[e.i] !== e.oid || part[e.i] !== 10) continue;
        const px = (e.i % cols) * cw, py = ((e.i / cols) | 0) * ch; ctx.globalAlpha = dim[e.i] * S.gdim;
        if (e.closed) { ctx.fillRect(px + 1, py + ch * 0.5, cw - 1, Math.max(1, ch * 0.16)); continue; }
        const pw = cw * (e.wide ? 0.66 : 0.52), ph = Math.max(2, ch * (e.wide ? 0.36 : 0.24));
        const cx = px + 0.5 + cw / 2 + e.lx * (cw - 1 - pw) / 2, cy = py + 0.5 + ch / 2 + e.ly * (ch - 1 - ph) / 2;
        ctx.fillRect(Math.round(cx - pw / 2), Math.round(cy - ph / 2), Math.round(pw), Math.round(ph));
      }
      // held food stays visible at the tip
      for (const f of S.food) if (f.held) { const i = cellIndex(f.x, f.y); if (i >= 0) { ctx.globalAlpha = 1; ctx.fillStyle = style(pack(pal.food)); ctx.fillRect((i % cols) * cw + 1, ((i / cols) | 0) * ch + 1, cw - 1, ch - 1); glyphAt(i, "o", mix(pal.food, [60, 30, 10], 0.6), 1); } }
      ctx.globalAlpha = 1;
    }

    // ---------- loop: runs only while visible ----------
    let last = performance.now(), avoidT = 0, raf = 0, visible = true;
    function loop(now) {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!mini && now - avoidT > 300) { measureAvoid(); avoidT = now; }
      step(reduce ? dt * 0.3 : dt); render(dt);
      kick();
    }
    function kick() { if (!raf && visible && !document.hidden && S.W) { raf = requestAnimationFrame((n) => { if (!raf) return; loop(n); }); } }
    function halt() { if (raf) cancelAnimationFrame(raf); raf = 0; }
    document.addEventListener("visibilitychange", () => { if (document.hidden) halt(); else { last = performance.now(); kick(); } });
    if (mini && "IntersectionObserver" in window) new IntersectionObserver((es) => { visible = es[es.length - 1].isIntersecting; if (visible) { last = performance.now(); kick(); } else halt(); }).observe(canvas);

    // ---------- input ----------
    // hover: curiosity, reaching, petting · press on an octopus: tap = poke, hold or drag = grab · fast flick: ink · click on empty water: food
    let lp = null, press = null, suppress = false;
    const target = mini ? canvas : window, touchy = opts.touchy !== false, rootEl = document.documentElement;
    const local = (e) => { if (!mini) return [e.clientX, e.clientY]; const b = canvas.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
    const blocked = (e) => !mini && e.composedPath().some((el) => el instanceof Element && el.matches("a,button,input,nav,header,main [data-avoid],[data-noclick]"));
    let curCur = "";
    const setCursor = (c) => { if (c === curCur) return; curCur = c; if (mini) canvas.style.cursor = c; else { rootEl.classList.toggle("octo-grab", c === "grab"); rootEl.classList.toggle("octo-grabbing", c === "grabbing"); } };
    S.press = () => press;
    target.addEventListener("pointermove", (e) => {
      if (cfg.auto === "reach" && !press) return;
      const now = performance.now(), [x, y] = local(e);
      if (lp) { const d = Math.hypot(x - lp.x, y - lp.y), dts = Math.max(1, now - lp.t) / 1000; S.ptr.speed = Math.max(S.ptr.speed * 0.6, d / dts); }
      lp = { x, y, t: now };
      S.ptr.x = x; S.ptr.y = y; S.ptr.active = e.pointerType === "mouse" || e.pressure > 0 || !!press; S.ptr.t = S.time;
      if (press) { if (!press.o.grab && Math.hypot(x - press.x, y - press.y) > 7) startGrab(press.o); setCursor("grabbing"); }
      else if (touchy && e.pointerType === "mouse") setCursor(!blocked(e) && hitOcto(x, y) ? "grab" : "");
    }, { passive: true });
    target.addEventListener("pointerdown", (e) => {
      if (!touchy || e.button > 0 || blocked(e)) return;
      const [x, y] = local(e), h = hitOcto(x, y); if (!h) return;
      press = { o: h.o, body: h.body, x, y, t: performance.now() };
      S.ptr.x = x; S.ptr.y = y; S.ptr.down = true; S.ptr.active = true; S.ptr.t = S.time; S.ptr.speed = 0; lp = { x, y, t: performance.now() };
      if (mini) try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault(); setCursor("grabbing");
    });
    const up = (e, cancel) => {
      if (!press) return;
      const o = press.o, [x, y] = e && e.clientX != null ? local(e) : [S.ptr.x, S.ptr.y];
      if (o.grab) release(o, x, y); else if (!cancel) poke(o, x, y, !press.body);
      press = null; S.ptr.down = false; suppress = true; setTimeout(() => (suppress = false), 350);
      if (!e || e.pointerType !== "mouse") S.ptr.active = false;
      setCursor(e && e.pointerType === "mouse" && hitOcto(x, y) ? "grab" : "");
    };
    (mini ? canvas : window).addEventListener("pointerup", (e) => up(e));
    (mini ? canvas : window).addEventListener("pointercancel", (e) => up(e, true));
    addEventListener("blur", () => up(null, true));
    // a touch that lands on an octopus belongs to the octopus, not to page scrolling
    target.addEventListener("touchstart", (e) => {
      if (!touchy || blocked(e) || e.touches.length !== 1) return;
      const t0 = e.touches[0], [x, y] = local(t0); if (hitOcto(x, y)) e.preventDefault();
    }, { passive: false });
    (mini ? canvas : document.documentElement).addEventListener("pointerleave", () => { if (cfg.auto !== "reach" && !press) { S.ptr.active = false; setCursor(""); } });
    target.addEventListener("click", (e) => {
      if (suppress) { suppress = false; return; }
      if (!cfg.feed) return;
      if (blocked(e)) return;
      const [x, y] = local(e); if (hitOcto(x, y)) return; drop(x, y);
    });
    if (mini && "ResizeObserver" in window) new ResizeObserver(() => { const w = canvas.clientWidth, h = canvas.clientHeight; if (w && h && (Math.abs(w - S.W) > 1 || Math.abs(h - S.H) > 1)) { resize(); kick(); } }).observe(canvas);
    else addEventListener("resize", () => { resize(); kick(); });
    new MutationObserver(setTheme).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    setTheme(); resize(); kick();
    return { drop, configure, state: S, kick, ink: (x, y) => inkBurst({ x, y, R: 60 }, 1, 0) };
  }
  window.Reef = Reef;
})();

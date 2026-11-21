(function () {
  "use strict";
  const root = document.documentElement;
  const MOON = '<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M233.5 137.9a12 12 0 0 0-12.3-3A84 84 0 0 1 121.1 34.8a12 12 0 0 0-15.3-15.3A108 108 0 1 0 236.5 150.2a12 12 0 0 0-3-12.3ZM128 212A84 84 0 0 1 89.6 53.3 108.2 108.2 0 0 0 202.7 166.4 84.4 84.4 0 0 1 128 212Z"/></svg>';
  const SUN = '<svg viewBox="0 0 256 256" fill="currentColor" aria-hidden="true"><path d="M116 32V16a12 12 0 0 1 24 0v16a12 12 0 0 1-24 0Zm80 96a68 68 0 1 1-68-68 68.08 68.08 0 0 1 68 68Zm-24 0a44 44 0 1 0-44 44 44.05 44.05 0 0 0 44-44ZM58.5 75.5a12 12 0 0 0 17-17l-12-12a12 12 0 0 0-17 17Zm0 105-12 12a12 12 0 0 0 17 17l12-12a12 12 0 1 0-17-17ZM192 80a12 12 0 0 0 8.5-3.5l12-12a12 12 0 0 0-17-17l-12 12A12 12 0 0 0 192 80Zm8.5 100.5a12 12 0 0 0-17 17l12 12a12 12 0 0 0 17-17ZM44 128a12 12 0 0 0-12-12H16a12 12 0 0 0 0 24h16a12 12 0 0 0 12-12Zm84 84a12 12 0 0 0-12 12v16a12 12 0 0 0 24 0v-16a12 12 0 0 0-12-12Zm112-96h-16a12 12 0 0 0 0 24h16a12 12 0 0 0 0-24Z"/></svg>';
  const paintToggles = () => document.querySelectorAll(".theme-toggle").forEach((b) => (b.innerHTML = root.classList.contains("dark") ? SUN : MOON));
  document.querySelectorAll(".theme-toggle").forEach((b) => b.addEventListener("click", () => {
    root.classList.toggle("dark");
    try { localStorage.setItem("jf:theme", root.classList.contains("dark") ? "dark" : "light"); } catch (e) {}
    document.querySelector('meta[name="theme-color"]').content = root.classList.contains("dark") ? "#1a1917" : "#f5f4f1";
    paintToggles();
  }));
  paintToggles();

  // mobile menu
  const mh = document.querySelector(".mhead"), mb = document.querySelector(".mhead-menu");
  mb.addEventListener("click", () => { mh.classList.toggle("open"); mb.setAttribute("aria-expanded", mh.classList.contains("open")); });
  mh.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => mh.classList.remove("open")));
  addEventListener("hashchange", () => { mh.classList.remove("open"); mb.setAttribute("aria-expanded", "false"); });

  // counter
  const cK = document.querySelector(".c-octo"), cP = document.querySelector(".c-food");
  let lastP = -1;
  const onCount = (k, p) => {
    cK.textContent = k;
    if (p !== lastP) { cP.textContent = p ? p + " food" : "food"; cP.classList.add("flash"); requestAnimationFrame(() => requestAnimationFrame(() => cP.classList.remove("flash"))); lastP = p; }
  };

  // typewriter
  function typewriter(el) {
    const lines = el.dataset.lines.split("|"), text = lines.join("\n");
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { el.textContent = text; return; }
    let i = 0;
    el.textContent = "";
    (function tick() {
      if (i > text.length) return;
      el.textContent = text.slice(0, i);
      const ch = text[i - 1]; i++;
      setTimeout(tick, ch === "," ? 380 : ch === "\n" ? 260 : 38 + Math.random() * 55);
    })();
  }

  // routing: each page tells the reef how many octopuses, which colour, how present
  const mob = () => innerWidth < 700;
  const ROUTES = {
    "/": { count: undefined, dim: 1, zone: "home", skins: undefined, feed: true },
    "/ventures": { count: 0, dim: 0.4, zone: "top", feed: false },
    "/gallery": { count: 0, dim: 0.4, zone: "top", feed: false },
    "/projects": { count: 0, dim: 0.4, zone: "top", feed: false },
    "/cv": { count: 1, dim: 0.35, zone: "top", feed: false },
    "/writing": { count: 1, dim: 0.45, zone: "top", feed: false },
        "404": { count: 1, dim: 1, zone: "center", skins: ["coral"], feed: true },
  };
  const minis = new WeakSet();
  function wakeMinis(page) {
    page.querySelectorAll("canvas.mini").forEach((c) => {
      if (minis.has(c)) return; minis.add(c);
      c._reef = Reef(c, { mini: true, count: +(c.dataset.count || 1), skins: c.dataset.skin.split(","), auto: c.dataset.auto || null, feed: !c.closest("a"), touchy: !c.closest("a") });
    });
  }
  function route() {
    let path = location.hash.replace(/^#/, "") || "/";
    if (path === "/about") { location.replace("#/cv"); return; }
    if (path.length > 1) path = path.replace(/\/$/, "");
    if (window.JF_404 && !location.hash) path = "404";
    let page = document.querySelector(`.page[data-page="${CSS.escape(path)}"]`);
    if (!page) { page = document.querySelector('.page[data-page="404"]'); path = "404"; }
    document.querySelectorAll(".page").forEach((p) => (p.hidden = p !== page));
    page.classList.remove("in"); void page.offsetWidth; page.classList.add("in");
    const top = "/" + (path.split("/")[1] || "");
    document.querySelectorAll("[data-route]").forEach((a) => (a.dataset.route === top && path !== "404" ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
    document.body.classList.toggle("calm", path !== "/");
    document.body.dataset.route = path === "404" ? "404" : top.slice(1) || "reef";
    const r = ROUTES[path] || (page.dataset.skin ? { count: 1, dim: mob() ? 0.45 : 0.6, zone: "top", skins: [page.dataset.skin], feed: false } : ROUTES["404"]);
    if (!("skins" in r)) r.skins = undefined;
    if (window.jfReef) window.jfReef.configure(r); else window.jfReef = Reef(document.getElementById("reef"), Object.assign({ onCount }, r));
    const h = page.querySelector("h1");
    const T = { "/ventures": "Ventures", "/gallery": "Gallery", "/writing": "Writing", "/projects": "Projects", "/cv": "CV" };
    document.title = path === "/" ? "Jan Formánek" : path === "404" ? "Lost at sea · Jan Formánek" : (T[path] || (h ? h.textContent : top.slice(1))) + " · Jan Formánek";
    wakeMinis(page);
    const tw = page.querySelector(".tw");
    if (tw && !tw.dataset.done) { tw.dataset.done = 1; typewriter(tw); }
    window.scrollTo(0, 0);
    if (routed) document.getElementById("main").focus({ preventScroll: true });
    routed = true;
  }
  let routed = false;

  // ventures carousel: wheel / trackpad / shift+wheel / arrows / drag / touch all move the row sideways
  document.querySelectorAll(".cards").forEach(function carousel(row) {
    const page = row.closest(".page"), reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let goal = null, raf = 0;
    const max = () => row.scrollWidth - row.clientWidth;
    const animate = () => {
      raf = 0; if (goal == null) return;
      const cur = row.scrollLeft, d = goal - cur;
      if (Math.abs(d) < 0.6 || reduce) { row.scrollLeft = goal; goal = null; row.classList.remove("moving"); return; }
      let st = d * 0.16; if (Math.abs(st) < 1) st = Math.sign(d) * Math.min(Math.abs(d), 1); row.scrollLeft = cur + st; if (Math.abs(row.scrollLeft - cur) < 0.01) { row.scrollLeft = goal; goal = null; row.classList.remove("moving"); return; } raf = requestAnimationFrame(animate);
    };
    const go = (x) => { goal = Math.max(0, Math.min(max(), x)); row.classList.add("moving"); if (!raf) raf = requestAnimationFrame(animate); };
    const cards = () => [...row.children];
    const snapX = (i) => { const c = cards()[Math.max(0, Math.min(cards().length - 1, i))]; return c.offsetLeft - row.firstElementChild.offsetLeft; };
    const nearest = (x) => { let bi = 0, bd = 1e9; cards().forEach((c, i) => { const d = Math.abs(snapX(i) - x); if (d < bd) { bd = d; bi = i; } }); return bi; };
    let settleT = 0;
    addEventListener("wheel", (e) => {
      if (page.hidden || e.ctrlKey) return;
      let d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (e.deltaMode === 1) d *= 32; else if (e.deltaMode === 2) d *= row.clientWidth;
      const base = goal == null ? row.scrollLeft : goal;
      if ((d < 0 && base <= 0) || (d > 0 && base >= max())) return;
      e.preventDefault(); go(base + d * 1.1);
      clearTimeout(settleT); settleT = setTimeout(() => go(snapX(nearest(goal == null ? row.scrollLeft : goal))), 420);
    }, { passive: false });
    addEventListener("keydown", (e) => {
      if (page.hidden || e.altKey || e.metaKey || e.ctrlKey) return;
      const i = nearest(goal == null ? row.scrollLeft : goal);
      if (e.key === "ArrowRight") { e.preventDefault(); go(snapX(i + 1)); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); go(snapX(i - 1)); }
      else if (e.key === "Home") { e.preventDefault(); go(0); } else if (e.key === "End") { e.preventDefault(); go(max()); }
    });
    // click-drag with a mouse (touch uses native scrolling + snap)
    let drag = null, dragged = false;
    row.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button) return;
      drag = { x: e.clientX, s: row.scrollLeft, t: performance.now(), v: 0, lx: e.clientX, lt: performance.now() }; dragged = false; goal = null;
    });
    addEventListener("pointermove", (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (!dragged && Math.abs(dx) > 5) { dragged = true; row.classList.add("dragging"); }
      if (!dragged) return;
      const now = performance.now(); drag.v = (e.clientX - drag.lx) / Math.max(1, now - drag.lt); drag.lx = e.clientX; drag.lt = now;
      row.scrollLeft = Math.max(0, Math.min(max(), drag.s - dx));
    });
    addEventListener("pointerup", () => {
      if (!drag) return;
      if (dragged) { const fling = row.scrollLeft - drag.v * 260; go(snapX(nearest(fling))); setTimeout(() => row.classList.remove("dragging"), 0); }
      drag = null;
    });
    row.addEventListener("click", (e) => { if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; } }, true);
    row.addEventListener("dragstart", (e) => e.preventDefault());
    row.addEventListener("focusin", (e) => { const li = e.target.closest("li"); if (li) go(snapX(cards().indexOf(li))); });
  });
  document.querySelector(".skip").addEventListener("click", (e) => { e.preventDefault(); const m = document.getElementById("main"); m.focus(); const f = m.querySelector(".page:not([hidden]) a"); if (f) f.focus(); });
  addEventListener("hashchange", route);

  const start = () => route();
  (document.fonts && document.fonts.load) ? document.fonts.load('600 12px "Geist Mono"').then(start, start) : start();
})();

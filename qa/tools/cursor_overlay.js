// QA only: headless screenshots/screencasts don't show the OS cursor, so draw one.
addEventListener("DOMContentLoaded", () => {
  const c = document.createElement("div");
  c.style.cssText = "position:fixed;left:0;top:0;width:18px;height:18px;margin:-9px 0 0 -9px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1.5px #000;z-index:99999;pointer-events:none;transition:transform .08s,background .08s;opacity:.9";
  document.body.appendChild(c);
  addEventListener("pointermove", (e) => { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; }, true);
  addEventListener("pointerdown", (e) => { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; c.style.transform = "scale(.7)"; c.style.background = "rgba(255,255,255,.55)"; }, true);
  addEventListener("pointerup", () => { c.style.transform = ""; c.style.background = ""; }, true);
});

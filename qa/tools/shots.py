# Every page x desktop/mobile x dark/light, collecting console errors. Usage: python3 qa/tools/shots.py [outdir] [wait_ms]
import sys, asyncio, json, os
from playwright.async_api import async_playwright
BASE = "http://127.0.0.1:8765/"
PAGES = [("reef", "#/"), ("ventures", "#/ventures"), ("lawie", "#/ventures/lawie"), ("noesea", "#/ventures/noesea"), ("eraivo", "#/ventures/eraivo"),
         ("corthex", "#/ventures/corthex"), ("gallery", "#/gallery"), ("writing", "#/writing"), ("about", "#/about"), ("404", "#/nowhere")]
OUT = sys.argv[1] if len(sys.argv) > 1 else "qa/shots"; WAIT = int(sys.argv[2]) if len(sys.argv) > 2 else 4500
os.makedirs(OUT, exist_ok=True)
async def main():
    errs = []
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome")
        for dev, vw, vh in [("desktop", 1440, 900), ("mobile", 390, 844)]:
            if os.environ.get("DEV") and os.environ["DEV"] != dev: continue
            for theme in ["dark", "light"]:
                if os.environ.get("THEME") and os.environ["THEME"] != theme: continue
                ctx = await b.new_context(viewport={"width": vw, "height": vh}, device_scale_factor=2 if dev == "mobile" else 1, has_touch=dev == "mobile")
                if theme == "light": await ctx.add_init_script("localStorage.setItem('jf:theme','light')")
                pg = await ctx.new_page()
                pg.on("console", lambda m, d=dev, t=theme: m.type in ("error", "warning") and errs.append(f"{d}/{t}: {m.text}"))
                pg.on("pageerror", lambda e, d=dev, t=theme: errs.append(f"{d}/{t}: {e}"))
                await pg.goto(BASE + "index.html#/"); await pg.wait_for_timeout(800)
                for name, h in PAGES:
                    await pg.evaluate(f"location.hash = {json.dumps(h)}"); await pg.wait_for_timeout(WAIT)
                    await pg.screenshot(path=f"{OUT}/{name}-{dev}-{theme}.png")
                # standalone 404.html
                await pg.goto(BASE + "404.html"); await pg.wait_for_timeout(WAIT)
                await pg.screenshot(path=f"{OUT}/404html-{dev}-{theme}.png")
                await ctx.close()
        await b.close()
    print(json.dumps(errs, indent=1))
asyncio.run(main())

# Functional checks: route -> octopus count/zone after settling, feeding on reef, no food on content pages, keyboard focus, hash links resolve.
import asyncio, json
from playwright.async_api import async_playwright
B = "http://127.0.0.1:8765/index.html"
async def main():
    out = {}
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome")
        for vw, vh in [(1440, 900), (390, 844)]:
            pg = await (await b.new_context(viewport={"width": vw, "height": vh})).new_page()
            errs = []; pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
            await pg.goto(B + "#/"); await pg.wait_for_timeout(1500)
            st = lambda: pg.evaluate("({n: jfReef.state.octos.length, live: jfReef.state.octos.filter(o=>!o.leaving).length, pos: jfReef.state.octos.map(o=>[Math.round(o.x/innerWidth*100), Math.round(o.y/innerHeight*100), o.skin]), food: jfReef.state.food.length, title: document.title})")
            r = {"home": await st()}
            await pg.mouse.click(vw * 0.8, vh * 0.5); await pg.wait_for_timeout(300); r["after_click"] = await st()
            await pg.wait_for_timeout(9000); r["after_9s"] = await st(); r["counter"] = await pg.inner_text(".counter")
            for h in ["#/about", "#/ventures/noesea", "#/gallery", "#/nope"]:
                await pg.evaluate(f"location.hash='{h}'"); await pg.wait_for_timeout(8000); r[h] = await st()
                if h == "#/about":
                    await pg.mouse.click(vw * 0.85, vh * 0.3); await pg.wait_for_timeout(200); r["about_click_food"] = (await st())["food"]
            # minis running? count frames drawn on the gallery
            await pg.evaluate("location.hash='#/gallery'"); await pg.wait_for_timeout(1500)
            r["gallery_minis"] = await pg.evaluate("[...document.querySelectorAll('.page:not([hidden]) canvas.mini')].map(c=>c.width+'x'+c.height)")
            # hash links resolve
            r["hash_links"] = await pg.evaluate("""(()=>{const pages=new Set([...document.querySelectorAll('.page')].map(p=>p.dataset.page));return [...new Set([...document.querySelectorAll('a[href^="#"],a[href^="./#"]')].map(a=>a.getAttribute('href')))].map(h=>[h, pages.has(h.replace(/^\\.?\\/?#/,'')||'/')])})()""")
            # keyboard
            await pg.evaluate("location.hash='#/'"); await pg.wait_for_timeout(500)
            seq = []
            for _ in range(8):
                await pg.keyboard.press("Tab"); seq.append(await pg.evaluate("document.activeElement.textContent.trim().slice(0,24) || document.activeElement.getAttribute('aria-label')"))
            r["tab_order"] = seq; r["errors"] = errs
            out[f"{vw}"] = r
        await b.close()
    print(json.dumps(out, indent=1, ensure_ascii=False))
asyncio.run(main())

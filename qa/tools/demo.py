# Real-time navigation demo via CDP screencast, resampled to constant 30 fps -> qa/demo.mp4
import asyncio, base64, os, shutil, subprocess, json
from playwright.async_api import async_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
OUT = f"{ROOT}/qa"; FR = "/tmp/jf-final-frames"
async def main():
    shutil.rmtree(FR, ignore_errors=True); os.makedirs(FR)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--force-device-scale-factor=1"])
        pg = await b.new_page(viewport={"width": 1440, "height": 900})
        errs = []; pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
        await pg.goto("http://127.0.0.1:8765/index.html#/"); await pg.wait_for_timeout(1200)
        cdp = await pg.context.new_cdp_session(pg); frames = []
        async def on(f):
            frames.append((f["metadata"]["timestamp"], f["data"]))
            await cdp.send("Page.screencastFrameAck", {"sessionId": f["sessionId"]})
        cdp.on("Page.screencastFrame", lambda f: asyncio.ensure_future(on(f)))
        await cdp.send("Page.startScreencast", {"format": "jpeg", "quality": 86, "maxWidth": 1440, "maxHeight": 900, "everyNthFrame": 1})
        cur = [1300, 160]
        async def glide(x1, y1, sec):
            x0, y0 = cur; n = max(1, int(sec * 30))
            for k in range(n + 1):
                t = k / n; t = t * t * (3 - 2 * t); await pg.mouse.move(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t); await asyncio.sleep(1 / 30)
            cur[:] = [x1, y1]
        async def nav(text):
            el = pg.locator(f'.nav a:text-is("{text}")'); bb = await el.bounding_box()
            await glide(bb["x"] + bb["width"] / 2, bb["y"] + bb["height"] / 2, 0.7); await el.click()
        oc = lambda: pg.evaluate("jfReef.state.octos.map(o=>[o.x,o.y,o.R])")
        await asyncio.sleep(3)
        o = await oc(); x, y, R = o[0]
        await glide(x + R * 3.4, y + R * 0.6, 1.6); await asyncio.sleep(1.5)
        bx, by = min(1350, max(560, x + R * 2)), min(820, max(140, y + R * 1.2))
        await glide(bx, by, 0.5); await pg.mouse.click(bx, by); await glide(1400, 870, 0.6); await asyncio.sleep(7)
        await nav("ventures"); await asyncio.sleep(2.5)
        await glide(560, 420, 1.0); await asyncio.sleep(2); await glide(700, 330, 1.2); await asyncio.sleep(1)
        await pg.mouse.wheel(900, 0); await asyncio.sleep(1.5); await pg.mouse.wheel(900, 0); await asyncio.sleep(1.5); await pg.mouse.wheel(-1800, 0); await asyncio.sleep(1.2)
        await glide(600, 420, 0.6); await pg.mouse.click(600, 420); await glide(1380, 300, 0.8); await asyncio.sleep(5)
        await nav("gallery"); await asyncio.sleep(3)
        for _ in range(10): await pg.mouse.wheel(0, 70); await asyncio.sleep(0.05)
        await asyncio.sleep(3)
        for _ in range(10): await pg.mouse.wheel(0, -70); await asyncio.sleep(0.05)
        await asyncio.sleep(1)
        await nav("writing"); await asyncio.sleep(3)
        await nav("about"); await asyncio.sleep(4.5)
        el = pg.locator(".nav .theme-toggle"); bb = await el.bounding_box(); await glide(bb["x"] + 7, bb["y"] + 7, 0.6); await el.click(); await asyncio.sleep(2.5)
        await nav("reef"); await asyncio.sleep(5)
        await pg.evaluate("location.hash='#/somewhere-else'"); await asyncio.sleep(5)
        await pg.evaluate("location.hash='#/'"); await asyncio.sleep(3)
        await cdp.send("Page.stopScreencast")
        print("frames", len(frames), "errors", json.dumps(errs))
        await b.close()
    frames.sort(); t0 = frames[0][0]; dur = frames[-1][0] - t0; n = int(dur * 30); j = 0
    for k in range(n):
        t = t0 + k / 30
        while j + 1 < len(frames) and frames[j + 1][0] <= t: j += 1
        open(f"{FR}/{k:05d}.jpg", "wb").write(base64.b64decode(frames[j][1]))
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", "30", "-i", f"{FR}/%05d.jpg", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "21", "-movflags", "+faststart", f"{OUT}/demo.mp4"], check=True)
    print("dur", round(dur, 1), "real fps", round(len(frames) / dur, 1))
asyncio.run(main())

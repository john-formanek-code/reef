# Real-time demo of mouse interactions + ventures wheel scrolling -> qa/demo-interact.mp4 (CDP screencast resampled to 30 fps).
# A QA-only cursor overlay is injected because headless screencasts don't show the OS cursor.
import asyncio, base64, os, shutil, subprocess, json, math
from playwright.async_api import async_playwright
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
FR = "/workspace/.jf-interact-frames"
async def main():
    shutil.rmtree(FR, ignore_errors=True); os.makedirs(FR)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--force-device-scale-factor=1"])
        ctx = await b.new_context(viewport={"width": 1440, "height": 900})
        await ctx.add_init_script(path=f"{ROOT}/qa/tools/cursor_overlay.js")
        pg = await ctx.new_page()
        errs = []; pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
        await pg.goto("http://127.0.0.1:8765/index.html#/"); await pg.wait_for_timeout(1500)
        cdp = await ctx.new_cdp_session(pg); frames = []
        async def on(f):
            frames.append((f["metadata"]["timestamp"], f["data"]))
            await cdp.send("Page.screencastFrameAck", {"sessionId": f["sessionId"]})
        cdp.on("Page.screencastFrame", lambda f: asyncio.ensure_future(on(f)))
        await cdp.send("Page.startScreencast", {"format": "jpeg", "quality": 86, "maxWidth": 1440, "maxHeight": 900, "everyNthFrame": 1})
        cur = [1320, 120]; await pg.mouse.move(*cur)
        async def glide(x1, y1, sec):
            x0, y0 = cur; n = max(1, int(sec * 60))
            for k in range(n + 1):
                t = k / n; t = t * t * (3 - 2 * t); await pg.mouse.move(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t); await asyncio.sleep(sec / n)
            cur[:] = [x1, y1]
        async def linger(sec, r=5):
            n = int(sec * 20)
            for k in range(n): await pg.mouse.move(cur[0] + math.sin(k / 3) * r, cur[1] + math.cos(k / 4) * r); await asyncio.sleep(0.05)
        O = lambda i=0: pg.evaluate(f"(()=>{{const o=jfReef.state.octos[{i}];return [o.x,o.y,o.R,Math.cos(o.heading),Math.sin(o.heading)]}})()")
        await asyncio.sleep(1.5)
        # 1. eyes + reach, then linger so more arms come
        x, y, R, fx, fy = await O(0)
        await glide(x + R * 2.8, y + R * 0.3, 1.6); await linger(5.5)
        # 2. pet the mantle
        x, y, R, fx, fy = await O(0); await glide(x + fx * R * 0.5, y + fy * R * 0.5, 0.9)
        for k in range(90):
            x, y, R, fx, fy = await O(0); mx, my = x + fx * R * 0.5, y + fy * R * 0.5
            await pg.mouse.move(mx + math.cos(k / 7) * R * 0.35, my + math.sin(k / 7) * R * 0.25); cur[:] = [mx, my]; await asyncio.sleep(0.04)
        # 3. step back, poke
        await glide(cur[0] + R * 1.6, cur[1] + R * 1.8, 0.9); await asyncio.sleep(0.8)
        x, y, R, fx, fy = await O(0); await glide(x + fx * R * 0.4, y + fy * R * 0.4, 0.6)
        await pg.mouse.down(); await asyncio.sleep(0.06); await pg.mouse.up(); await asyncio.sleep(1.6)
        # 4. grab, drag around, release
        x, y, R, fx, fy = await O(0); await glide(x + fx * R * 0.3, y + fy * R * 0.3, 0.6)
        await pg.mouse.down(); await asyncio.sleep(0.6)
        await glide(max(1000, min(1250, cur[0] + 260)), 260, 1.4); await glide(1180, 560, 1.3); await glide(900, 330, 1.3); await asyncio.sleep(0.4)
        await pg.mouse.up(); await asyncio.sleep(2.2)
        # 5. food on empty water
        pt = await pg.evaluate("(()=>{let best=null,bd=-1;for(let x=700;x<1380;x+=60)for(let y=140;y<800;y+=60){const d=Math.min(...jfReef.state.octos.map(o=>Math.hypot(o.x-x,o.y-y)/o.R));if(d>bd){bd=d;best=[x,y]}}return best})()")
        await glide(pt[0], pt[1], 0.9); await pg.mouse.click(pt[0], pt[1]); await glide(1400, 860, 0.8); await asyncio.sleep(6)
        # 6. flick -> ink
        x, y, R, fx, fy = await O(1); await glide(x - R * 2, y, 0.8)
        for k in range(8): await pg.mouse.move(x + (R * 2 if k % 2 else -R * 2), y + 8 * k, steps=2); await asyncio.sleep(0.016)
        cur[:] = [x + R * 2, y + 56]; await asyncio.sleep(3)
        # 7. ventures: wheel scrolls sideways, cards' octopuses follow the cursor
        el = pg.locator('.nav a:text-is("ventures")'); bb = await el.bounding_box()
        await glide(bb["x"] + bb["width"] / 2, bb["y"] + 8, 0.8); await el.click(); await asyncio.sleep(1.5)
        await glide(760, 420, 0.8); await linger(2.5, 30)
        for _ in range(4): await pg.mouse.wheel(0, 200); await asyncio.sleep(0.06)
        await asyncio.sleep(1.6); await linger(1.5, 30)
        for _ in range(4): await pg.mouse.wheel(0, 200); await asyncio.sleep(0.06)
        await asyncio.sleep(1.6)
        for _ in range(3): await pg.mouse.wheel(0, 200); await asyncio.sleep(0.06)
        await asyncio.sleep(1.6)
        for _ in range(12): await pg.mouse.wheel(0, -220); await asyncio.sleep(0.05)
        await asyncio.sleep(1.6)
        # drag the row
        await glide(1100, 420, 0.5); await pg.mouse.down(); await glide(560, 430, 0.9); await pg.mouse.up(); await asyncio.sleep(1.4)
        await pg.keyboard.press("ArrowLeft"); await asyncio.sleep(1.2)
        await glide(640, 380, 0.8); await linger(3, 40)
        await cdp.send("Page.stopScreencast")
        print("frames", len(frames), "errors", json.dumps(errs))
        await b.close()
    frames.sort(); t0 = frames[0][0]; dur = frames[-1][0] - t0; n = int(dur * 30); j = 0
    for k in range(n):
        t = t0 + k / 30
        while j + 1 < len(frames) and frames[j + 1][0] <= t: j += 1
        open(f"{FR}/{k:05d}.jpg", "wb").write(base64.b64decode(frames[j][1]))
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", "30", "-i", f"{FR}/%05d.jpg", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "21", "-movflags", "+faststart", f"{ROOT}/qa/demo-interact.mp4"], check=True)
    shutil.rmtree(FR, ignore_errors=True)
    print("dur", round(dur, 1), "real fps", round(len(frames) / dur, 1))
asyncio.run(main())

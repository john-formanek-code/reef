# Scripted CDP mouse/touch tests for octopus interactions + ventures wheel scrolling. Writes qa/interact/*.png and qa/interact/results.json
import asyncio, json, math, os, sys
from playwright.async_api import async_playwright
B = "http://127.0.0.1:8765/index.html"; OUT = "qa/interact"; os.makedirs(OUT, exist_ok=True)
THEME = sys.argv[1] if len(sys.argv) > 1 else "dark"
R = {}
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome")
        ctx = await b.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
        if THEME == "light": await ctx.add_init_script("localStorage.setItem('jf:theme','light')")
        await ctx.add_init_script(path="qa/tools/cursor_overlay.js")
        pg = await ctx.new_page(); errs = []
        pg.on("pageerror", lambda e: errs.append(str(e))); pg.on("console", lambda m: m.type in ("error", "warning") and errs.append(m.text))
        await pg.goto(B + "#/"); await pg.wait_for_timeout(2500)
        O = lambda i=0: pg.evaluate(f"(()=>{{const o=jfReef.state.octos[{i}];const f=[Math.cos(o.heading),Math.sin(o.heading)];const t=o.ptrArms.map(a=>a.nodes[11]);return {{x:o.x,y:o.y,R:o.R,fx:f[0],fy:f[1],arms:o.ptrArms.length,pet:o.pet,flash:o.flash,shrink:o.shrink,grab:!!o.grab,flee:o.flee,tips:t.map(n=>[n.x,n.y]),stretch:Math.max(...o.arms.map(a=>a.stretch||1)),cursor:document.documentElement.className}}}})()")
        pos = [700, 450]
        async def glide(x, y, sec, steps=None):
            n = steps or max(2, int(sec * 60)); x0, y0 = pos
            for k in range(1, n + 1):
                t = k / n; t = t * t * (3 - 2 * t); await pg.mouse.move(x0 + (x - x0) * t, y0 + (y - y0) * t); await asyncio.sleep(sec / n)
            pos[:] = [x, y]
        async def shot(name, o, scale=4.2):
            L = o["R"] * scale; x0, y0 = max(0, o["x"] - L), max(0, o["y"] - L * 0.75)
            await pg.screenshot(path=f"{OUT}/{name}-{THEME}.png", clip={"x": x0, "y": y0, "width": min(1440 - x0, 2 * L), "height": min(900 - y0, 1.5 * L)})
        # pick the octopus furthest from the text
        o = await O(0); i0 = 0
        # 1 reach + linger (multiple arms)
        cx, cy = o["x"] + o["R"] * 2.6, o["y"] + o["R"] * 0.4
        await glide(cx, cy, 1.2)
        for k in range(50):  # linger with tiny movements so it stays "fresh"
            await pg.mouse.move(cx + math.sin(k / 4) * 6, cy + math.cos(k / 5) * 6); await asyncio.sleep(0.1)
        pos[:] = [cx, cy]; o = await O(0)
        R["reach"] = {"arms_reaching": o["arms"], "tip_dist_to_cursor": [round(math.hypot(t[0] - pos[0], t[1] - pos[1])) for t in o["tips"]], "R": round(o["R"])}
        await shot("1-reach", o)
        # eyes: pupils follow the cursor (sample pupil offsets at two cursor positions)
        # 2 pet: slow strokes across the mantle
        o = await O(0); mx, my = o["x"] + o["fx"] * o["R"] * 0.5, o["y"] + o["fy"] * o["R"] * 0.5
        await glide(mx, my, 0.8)
        for k in range(70):
            o = await O(0); mx, my = o["x"] + o["fx"] * o["R"] * 0.5, o["y"] + o["fy"] * o["R"] * 0.5
            await pg.mouse.move(mx + math.cos(k / 6) * o["R"] * 0.35, my + math.sin(k / 6) * o["R"] * 0.25); await asyncio.sleep(0.04)
        o = await O(0); R["pet"] = {"pet": round(o["pet"], 2), "reaching_while_petted": o["arms"], "cursor_class": o["cursor"]}
        await shot("2-pet", o)
        # 3 poke: move off, come back, click the body
        pos[:] = [mx, my]; await glide(mx + o["R"] * 1.5, my + o["R"] * 2.2, 0.8); await asyncio.sleep(0.9)
        o = await O(0); bx, by = o["x"] + o["fx"] * o["R"] * 0.4, o["y"] + o["fy"] * o["R"] * 0.4
        food0 = await pg.evaluate("jfReef.state.food.length")
        await glide(bx, by, 0.5); await pg.mouse.down(); await asyncio.sleep(0.06); await pg.mouse.up(); await asyncio.sleep(0.07)
        o = await O(0); R["poke"] = {"flash": round(o["flash"], 2), "shrink": round(o["shrink"], 2), "food_dropped": await pg.evaluate("jfReef.state.food.length") - food0}
        await shot("3-poke", o)
        await asyncio.sleep(1.5)
        # 4 grab + drag: press on body, hold, drag 320 px, then release
        o = await O(0); bx, by = o["x"] + o["fx"] * o["R"] * 0.3, o["y"] + o["fy"] * o["R"] * 0.3
        start = (o["x"], o["y"])
        await glide(bx, by, 0.6); await pg.mouse.down(); await asyncio.sleep(0.45)
        o = await O(0); R["grab_hold"] = {"grab": o["grab"], "arms_wrapping": o["arms"], "cursor_class": o["cursor"]}
        await shot("4-grab", o)
        tx, ty = min(1300, max(140, bx - 330)), min(780, max(140, by + 140))
        await glide(tx, ty, 1.6); await asyncio.sleep(0.15)
        o = await O(0); R["drag"] = {"grab": o["grab"], "moved_px": round(math.hypot(o["x"] - start[0], o["y"] - start[1])), "max_arm_stretch": round(o["stretch"], 2), "tips_near_cursor": sum(1 for t in o["tips"] if math.hypot(t[0] - tx, t[1] - ty) < o["R"] * 0.6)}
        await shot("5-drag", o)
        await pg.mouse.up(); await asyncio.sleep(0.5)
        o = await O(0); R["release"] = {"grab": o["grab"], "flee": round(o["flee"], 2), "dist_from_cursor_after_0.5s": round(math.hypot(o["x"] - tx, o["y"] - ty))}
        await shot("6-release", o, 5)
        # 6 flick -> ink
        await asyncio.sleep(2)
        o = await O(1); await pg.mouse.move(o["x"] - o["R"] * 2, o["y"]); await asyncio.sleep(0.1)
        for k in range(8): await pg.mouse.move(o["x"] + (o["R"] * 2 if k % 2 else -o["R"] * 2), o["y"] + 10 * k, steps=1); await asyncio.sleep(0.016)
        await asyncio.sleep(0.4); R["flick_ink_particles"] = await pg.evaluate("jfReef.state.ink.length")
        await pg.screenshot(path=f"{OUT}/7-ink-{THEME}.png")
        # 5 food on empty water
        await asyncio.sleep(1)
        pt = await pg.evaluate("(()=>{let best=null,bd=-1;for(let x=500;x<1400;x+=60)for(let y=120;y<820;y+=60){const d=Math.min(...jfReef.state.octos.map(o=>Math.hypot(o.x-x,o.y-y)/o.R));if(d>bd&&!(x<1000&&y>480)){bd=d;best=[x,y]}}return best})()")
        f0 = await pg.evaluate("jfReef.state.food.length"); await glide(pt[0], pt[1], 0.6); await pg.mouse.click(pt[0], pt[1]); await asyncio.sleep(0.2)
        R["food_click_empty"] = await pg.evaluate("jfReef.state.food.length") - f0
        # 7 ventures wheel scroll
        await pg.mouse.move(1400, 880); await pg.evaluate("location.hash='#/ventures'"); await asyncio.sleep(1.5)
        sl = lambda: pg.evaluate("Math.round(document.querySelector('.cards').scrollLeft)")
        W = {}
        await pg.mouse.move(700, 400); W["start"] = await sl()
        for _ in range(3): await pg.mouse.wheel(0, 240); await asyncio.sleep(0.05)
        await asyncio.sleep(1.0); W["after_wheel_deltaY_over_card"] = await sl()
        await pg.screenshot(path=f"{OUT}/8-ventures-wheel-{THEME}.png")
        await pg.mouse.move(700, 70)
        for _ in range(3): await pg.mouse.wheel(0, 240); await asyncio.sleep(0.05)
        await asyncio.sleep(1.0); W["after_wheel_over_empty_area"] = await sl()
        await pg.mouse.move(700, 400)
        for _ in range(4): await pg.mouse.wheel(0, -300); await asyncio.sleep(0.05)
        await asyncio.sleep(1.0); W["after_wheel_back"] = await sl()
        for _ in range(3): await pg.mouse.wheel(260, 0); await asyncio.sleep(0.05)
        await asyncio.sleep(1.0); W["after_horizontal_deltaX"] = await sl()
        await pg.keyboard.down("Shift")
        for _ in range(3): await pg.mouse.wheel(0, 260); await asyncio.sleep(0.05)
        await pg.keyboard.up("Shift"); await asyncio.sleep(1.0); W["after_shift_wheel"] = await sl()
        await pg.keyboard.press("Home"); await asyncio.sleep(0.8); W["after_Home"] = await sl()
        await pg.keyboard.press("ArrowRight"); await asyncio.sleep(0.9); W["after_ArrowRight"] = await sl()
        await pg.keyboard.press("ArrowRight"); await asyncio.sleep(0.9); W["after_ArrowRight_2"] = await sl()
        await pg.keyboard.press("ArrowLeft"); await asyncio.sleep(0.9); W["after_ArrowLeft"] = await sl()
        await pg.mouse.move(1000, 400); await pg.mouse.down()
        for k in range(20): await pg.mouse.move(1000 - k * 25, 400); await asyncio.sleep(0.016)
        await pg.mouse.up(); await asyncio.sleep(1.0); W["after_drag_left_500px"] = await sl(); W["hash_after_drag"] = await pg.evaluate("location.hash")
        R["ventures_scroll"] = W
        # 8 mini card octopus follows the cursor
        await pg.keyboard.press("Home"); await asyncio.sleep(0.8)
        cb = await pg.evaluate("(()=>{const c=document.querySelector('.cards canvas.mini');const r=c.getBoundingClientRect();const o=c._reef.state.octos[0];return {l:r.left,t:r.top,w:r.width,h:r.height,x:o.x,y:o.y}})()")
        tx, ty = cb["l"] + cb["w"] * 0.85, cb["t"] + cb["h"] * 0.7
        await pg.mouse.move(tx, ty, steps=10)
        for k in range(40): await pg.mouse.move(tx + math.sin(k / 3) * 4, ty); await asyncio.sleep(0.1)
        ca = await pg.evaluate("(()=>{const o=document.querySelector('.cards canvas.mini')._reef.state.octos[0];return {x:o.x,y:o.y,arms:o.ptrArms.length}})()")
        lx, ly = tx - cb["l"], ty - cb["t"]
        R["card_mini_follow"] = {"dist_before": round(math.hypot(cb["x"] - lx, cb["y"] - ly)), "dist_after_4s": round(math.hypot(ca["x"] - lx, ca["y"] - ly)), "arms_reaching": ca["arms"]}
        await pg.screenshot(path=f"{OUT}/9-card-follow-{THEME}.png", clip={"x": cb["l"], "y": cb["t"], "width": cb["w"], "height": cb["h"]})
        R["errors"] = errs
        await ctx.close()
        # touch (mobile)
        ctx = await b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, has_touch=True, is_mobile=True)
        if THEME == "light": await ctx.add_init_script("localStorage.setItem('jf:theme','light')")
        pg = await ctx.new_page(); errs2 = []; pg.on("pageerror", lambda e: errs2.append(str(e))); pg.on("console", lambda m: m.type == "error" and errs2.append(m.text))
        await pg.goto(B + "#/"); await pg.wait_for_timeout(2500)
        o = await O(0); f0 = await pg.evaluate("jfReef.state.food.length")
        await pg.touchscreen.tap(o["x"] + o["fx"] * o["R"] * 0.3, o["y"] + o["fy"] * o["R"] * 0.3); await asyncio.sleep(0.08)
        o2 = await O(0); T = {"tap_flash": round(o2["flash"], 2), "tap_food": await pg.evaluate("jfReef.state.food.length") - f0}
        await asyncio.sleep(1.2)
        cdp = await ctx.new_cdp_session(pg); o = await O(0); x, y = o["x"], o["y"]
        await cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": x, "y": y}]}); await asyncio.sleep(0.35)
        for k in range(1, 30):
            await cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [{"x": x - k * 4, "y": y + k * 5}]}); await asyncio.sleep(0.03)
        o2 = await O(0); T["touch_drag_grab"] = o2["grab"]; T["touch_drag_moved_px"] = round(math.hypot(o2["x"] - x, o2["y"] - y)); T["page_scrollY"] = await pg.evaluate("scrollY")
        await pg.screenshot(path=f"{OUT}/10-touch-drag-{THEME}.png")
        await cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []}); await asyncio.sleep(0.3)
        T["after_release_grab"] = (await O(0))["grab"]
        await pg.evaluate("location.hash='#/ventures'"); await asyncio.sleep(1)
        s0 = await pg.evaluate("document.querySelector('.cards').scrollLeft")
        await cdp.send("Input.dispatchTouchEvent", {"type": "touchStart", "touchPoints": [{"x": 300, "y": 420}]})
        for k in range(1, 16): await cdp.send("Input.dispatchTouchEvent", {"type": "touchMove", "touchPoints": [{"x": 300 - k * 14, "y": 420}]}); await asyncio.sleep(0.016)
        await cdp.send("Input.dispatchTouchEvent", {"type": "touchEnd", "touchPoints": []}); await asyncio.sleep(1.2)
        T["ventures_touch_swipe_scrollLeft"] = [round(s0), round(await pg.evaluate("document.querySelector('.cards').scrollLeft"))]
        T["errors"] = errs2; R["touch_mobile"] = T
        await b.close()
    json.dump(R, open(f"{OUT}/results-{THEME}.json", "w"), indent=1)
    print(json.dumps(R, indent=1))
asyncio.run(main())

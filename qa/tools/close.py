# close-ups of each octopus after a few seconds of live simulation, dark + light
import asyncio, sys
from playwright.async_api import async_playwright
URL="file:///workspace/jan-site-v4/index.html"; tag=sys.argv[1] if len(sys.argv)>1 else "a"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path="/usr/bin/google-chrome")
        for theme in ["dark","light"]:
            pg=await b.new_page(viewport={"width":1440,"height":900},device_scale_factor=1)
            errs=[]; pg.on("pageerror",lambda e: errs.append(str(e))); pg.on("console",lambda m: m.type=="error" and errs.append(m.text))
            await pg.add_init_script(f"localStorage.setItem('jf:theme','{theme}')")
            await pg.goto(URL); await pg.wait_for_timeout(int(sys.argv[2]) if len(sys.argv)>2 else 5000)
            await pg.screenshot(path=f"/tmp/oc-{tag}-{theme}.png")
            oc=await pg.evaluate("reef.state.octos.map(o=>[o.x,o.y,o.R])")
            for k,(x,y,R) in enumerate(oc[:2]):
                await pg.screenshot(path=f"/tmp/oc-{tag}-{theme}-z{k}.png",clip={"x":max(0,x-R*3.3),"y":max(0,y-R*3.3),"width":R*6.6,"height":R*6.6})
            print(theme, errs)
            await pg.close()
        await b.close()
asyncio.run(main())

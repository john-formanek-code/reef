import sys, asyncio, json
from playwright.async_api import async_playwright
URL="file:///workspace/jan-site-v4/index.html"
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path="/usr/bin/google-chrome")
        errs=[]
        for name,vw,vh,hashp,theme in [("home-desktop",1440,900,"",None),("home-mobile",390,844,"",None),("ventures-desktop",1440,900,"#/ventures",None),("ventures-mobile",390,844,"#/ventures",None),("home-light",1440,900,"","light")]:
            ctx=await b.new_context(viewport={"width":vw,"height":vh},device_scale_factor=2 if vw<500 else 1)
            pg=await ctx.new_page()
            pg.on("console",lambda m: m.type in("error","warning") and errs.append(m.text))
            pg.on("pageerror",lambda e: errs.append(str(e)))
            if theme: await pg.add_init_script("localStorage.setItem('jf:theme','light')")
            await pg.goto(URL+hashp); await pg.wait_for_timeout(6000)
            await pg.screenshot(path=f"qa/{name}.png")
            await ctx.close()
        # zoom on swans
        ctx=await b.new_context(viewport={"width":1440,"height":900},device_scale_factor=2)
        pg=await ctx.new_page(); await pg.goto(URL); await pg.wait_for_timeout(2500)
        sw=await pg.evaluate("reef.state.octos.map(s=>[s.x,s.y,s.R*3.2])")
        for k,(x,y,L) in enumerate(sw[:3]):
            await pg.screenshot(path=f"qa/zoom-octopus{k}.png",clip={"x":max(0,x-L*0.8),"y":max(0,y-L*0.85),"width":L*1.6,"height":L*1.25})
        print(json.dumps(errs)); await b.close()
asyncio.run(main())

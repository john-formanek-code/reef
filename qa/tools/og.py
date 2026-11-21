import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome")
        pg = await (await b.new_context(viewport={"width": 1200, "height": 630})).new_page()
        await pg.goto("http://127.0.0.1:8765/qa/tools/og.html"); await pg.wait_for_timeout(5000)
        await pg.screenshot(path="og.png"); await b.close()
asyncio.run(main())

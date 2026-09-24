#!/usr/bin/env python3
"""探针3：走完引导关闭流程，逐步截图 + 可见控件 dump。"""
import sys
from playwright.sync_api import sync_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:3081").rstrip("/")
CHROME = "/home/work/.openclaw/workspace/.openclaw/tmp/chrome-linux64/chrome"
SHOTS = "/home/work/.openclaw/workspace/.openclaw/tmp/shots"

DUMP = """() => Array.from(document.querySelectorAll('button, input, textarea, [role=button], h1, h2, h3'))
  .map(el => ({ t: el.tagName, txt: (el.innerText || el.getAttribute('placeholder') || '').trim().slice(0, 50),
                vis: !!(el.offsetParent || el.getClientRects().length) }))
  .filter(x => x.txt).map(x => `${x.vis ? 'V' : 'H'}|${x.t}|${x.txt}`).slice(0, 40)"""


def dump(page, tag):
    print(f"--- {tag} ---", flush=True)
    for line in page.evaluate(DUMP):
        print(" ", line, flush=True)
    page.screenshot(path=f"{SHOTS}/probe3-{tag}.png")


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
    page = browser.new_context(ignore_https_errors=True, viewport={"width": 1440, "height": 900}).new_page()
    page.goto(f"{BASE}/go", wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(5000)
    dump(page, "0-load")
    for name in ("Continue", "Configure later"):
        try:
            page.get_by_role("button", name=name).click(timeout=6000)
            page.wait_for_timeout(1500)
            dump(page, f"after-{name.split()[0]}")
        except Exception as exc:  # noqa: BLE001
            print(f"!!! click {name} failed: {str(exc)[:150]}", flush=True)
    browser.close()

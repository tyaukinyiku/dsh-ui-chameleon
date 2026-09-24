#!/usr/bin/env python3
"""探针4：会话建立后检查 slot 覆盖组件的 DOM 渲染现场。"""
import sys
from playwright.sync_api import sync_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:3081").rstrip("/")
CHROME = "/home/work/.openclaw/workspace/.openclaw/tmp/chrome-linux64/chrome"
SHOTS = "/home/work/.openclaw/workspace/.openclaw/tmp/shots"

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
    page = browser.new_context(ignore_https_errors=True, viewport={"width": 1440, "height": 900}).new_page()
    page.goto(f"{BASE}/go", wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(5000)
    for name in ("Continue", "Configure later"):
        try:
            b = page.get_by_role("button", name=name)
            if b.count() and b.first.is_enabled():
                b.first.click(timeout=4000)
                page.wait_for_timeout(1000)
        except Exception:  # noqa: BLE001
            pass
    page.get_by_role("button", name="Choose workspace").click(timeout=10000)
    page.wait_for_timeout(1500)
    listed = page.get_by_text("acme-e2e", exact=False)
    if listed.count() > 0:
        listed.first.click(timeout=5000)
    else:
        page.get_by_role("button", name="Home").click(timeout=8000)
        page.wait_for_timeout(1000)
        page.get_by_text("acme-e2e", exact=False).first.click(timeout=8000)
        page.get_by_role("button", name="Open").click(timeout=8000)
        page.wait_for_timeout(1500)
        try:
            page.get_by_role("button", name="Open").click(timeout=3000)
        except Exception:  # noqa: BLE001
            pass
    page.wait_for_timeout(2000)
    page.get_by_role("button", name="New Session").first.click(timeout=8000)
    page.wait_for_timeout(1500)
    box = page.locator("textarea:visible, [contenteditable='true']:visible").first
    box.click(timeout=8000)
    box.type("hi", delay=20)
    page.keyboard.press("Enter")
    page.wait_for_timeout(5000)

    info = page.evaluate(
        """() => ({
          url: location.pathname + location.search,
          quartzCorner: document.querySelectorAll('[data-quartz-corner]').length,
          badge: Array.from(document.querySelectorAll('[data-ui-skins-badge]')).map(e => e.textContent),
          anyQuartz: Array.from(document.querySelectorAll('*')).filter(e => Array.from(e.attributes).some(a => a.name.includes('quartz'))).map(e => e.tagName + '.' + e.className).slice(0, 5),
          headerHtml: (document.querySelector('[class*=header], header')?.outerHTML || '').slice(0, 600),
          pack: document.documentElement.getAttribute('data-ui-pack'),
        })"""
    )
    for k, v in info.items():
        print(f"{k}: {v}", flush=True)
    page.screenshot(path=f"{SHOTS}/probe4-session.png")
    browser.close()

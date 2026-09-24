#!/usr/bin/env python3
"""探针2：点开 Choose workspace 弹层，dump 内部控件与文本。"""
import sys
from playwright.sync_api import sync_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:3081").rstrip("/")
CHROME = "/home/work/.openclaw/workspace/.openclaw/tmp/chrome-linux64/chrome"

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
    page = browser.new_context(ignore_https_errors=True, viewport={"width": 1440, "height": 900}).new_page()
    page.goto(f"{BASE}/go", wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(4500)
    page.get_by_role("button", name="Choose workspace").click(timeout=10000)
    page.wait_for_timeout(1500)
    page.screenshot(path="/home/work/.openclaw/workspace/.openclaw/tmp/shots/probe-ws.png")
    items = page.evaluate(
        "() => Array.from(document.querySelectorAll('button, input, [role=button], [role=option], li, h1, h2, h3, label, p'))"
        ".map(el => el.tagName + '|' + (el.innerText || el.getAttribute('placeholder') || el.getAttribute('aria-label') || '').trim().replace(/\\n/g, ' / ').slice(0, 80))"
        ".filter(s => s.split('|')[1]).slice(-40)"
    )
    for line in items:
        print(line)
    browser.close()

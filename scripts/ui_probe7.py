#!/usr/bin/env python3
"""探针7：皮肤按钮渲染现场。"""
import sys
from playwright.sync_api import sync_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:3081").rstrip("/")
CHROME = "/home/work/.openclaw/workspace/.openclaw/tmp/chrome-linux64/chrome"
errs = []

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
    page = browser.new_context(ignore_https_errors=True, viewport={"width": 1440, "height": 900}).new_page()
    page.on("console", lambda m: errs.append(f"{m.type}: {m.text[:200]}") if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: errs.append(f"pageerror: {str(e)[:200]}"))
    page.goto(f"{BASE}/go", wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(6000)
    print("badge:", page.evaluate("() => document.querySelectorAll('[data-ui-skins-badge]').length"), flush=True)
    print("picker:", page.evaluate("() => document.querySelectorAll('[data-ui-skins-picker]').length"), flush=True)
    print("pack:", page.evaluate("() => document.documentElement.getAttribute('data-ui-pack')"), flush=True)
    print("console:", errs[:6], flush=True)
    browser.close()

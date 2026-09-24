#!/usr/bin/env python3
"""探针：dump 当前 UI 可见文本与关键控件，供编写精确选择器。"""
import sys
from playwright.sync_api import sync_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:3081").rstrip("/")
CHROME = "/home/work/.openclaw/workspace/.openclaw/tmp/chrome-linux64/chrome"

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
    page = browser.new_context(ignore_https_errors=True, viewport={"width": 1440, "height": 900}).new_page()
    page.goto(f"{BASE}/go", wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(5000)
    try:
        page.get_by_role("button", name="Continue").click(timeout=6000)
        page.wait_for_timeout(1500)
    except Exception:  # noqa: BLE001
        pass
    page.screenshot(path="/home/work/.openclaw/workspace/.openclaw/tmp/shots/probe.png")
    text = page.evaluate(
        "() => Array.from(document.querySelectorAll('button, a, input, textarea, [role=button], h1, h2, h3, label'))"
        ".map(el => el.tagName + '|' + (el.innerText || el.getAttribute('placeholder') || '').trim().slice(0, 60))"
        ".filter(s => s.split('|')[1]).slice(0, 60)"
    )
    for line in text:
        print(line)
    print("--- html attrs ---")
    print(page.evaluate("() => document.documentElement.getAttributeNames().map(n => n + '=' + document.documentElement.getAttribute(n)).join(' | ')"))
    browser.close()

#!/usr/bin/env python3
"""探针5：single 型覆盖渲染判定 + 新会话 id 差分。"""
import glob
import json
import re
import sys
from playwright.sync_api import sync_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:3081").rstrip("/")
CHROME = "/home/work/.openclaw/workspace/.openclaw/tmp/chrome-linux64/chrome"


def all_session_ids():
    ids = set()
    for path in glob.glob("/home/work/.dsh/storages/*.json"):
        try:
            text = json.dumps(json.load(open(path)))
        except Exception:  # noqa: BLE001
            continue
        ids.update(re.findall(r'"(session-[0-9a-f-]+)"', text))
    return ids


before = all_session_ids()
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
    print("hero 数据点 brand[data-ui-brand]:", page.evaluate("() => document.querySelectorAll('[data-ui-brand]').length"), flush=True)
    print("hero hint[data-ui-hint]:", page.evaluate("() => document.querySelectorAll('[data-ui-hint]').length"), flush=True)

    page.get_by_role("button", name="Choose workspace").click(timeout=10000)
    page.wait_for_timeout(1500)
    page.get_by_text("acme-e2e", exact=False).first.click(timeout=5000)
    page.wait_for_timeout(2000)
    page.get_by_role("button", name="New Session").first.click(timeout=8000)
    page.wait_for_timeout(1500)
    box = page.locator("textarea:visible, [contenteditable='true']:visible").first
    box.click(timeout=8000)
    box.type("hi", delay=20)
    page.keyboard.press("Enter")
    page.wait_for_timeout(5500)

    print("corner[data-quartz-corner]:", page.evaluate("() => document.querySelectorAll('[data-quartz-corner]').length"), flush=True)
    print("badge:", page.evaluate("() => Array.from(document.querySelectorAll('[data-ui-skins-badge]')).map(e => e.textContent)"), flush=True)
    print("session 视图内 span 属性扫描:", page.evaluate(
        "() => Array.from(document.querySelectorAll('span[title], span[data-ui-skins-badge], span[data-quartz-corner]'))"
        ".map(e => e.tagName + '|title=' + (e.getAttribute('title') || '') + '|txt=' + e.textContent.slice(0, 20)).slice(0, 10)"
    ), flush=True)
    after = all_session_ids()
    print("NEW session ids:", sorted(after - before), flush=True)
    browser.close()

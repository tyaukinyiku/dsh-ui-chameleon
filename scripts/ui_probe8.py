#!/usr/bin/env python3
"""探针8：全信号诊断客户端模块加载/应用。"""
import sys
from playwright.sync_api import sync_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:3081").rstrip("/")
CHROME = "/home/work/.openclaw/workspace/.openclaw/tmp/chrome-linux64/chrome"
sig = []

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
    page = browser.new_context(ignore_https_errors=True, viewport={"width": 1440, "height": 900}).new_page()
    page.on("console", lambda m: sig.append(f"console.{m.type}: {m.text[:220]}"))
    page.on("pageerror", lambda e: sig.append(f"pageerror: {str(e)[:220]}"))
    page.on("requestfailed", lambda r: sig.append(f"reqfail: {r.url[:120]} {r.failure}"))
    page.on("response", lambda r: sig.append(f"http{r.status}: {r.url[:120]}") if r.status >= 400 else None)
    page.goto(f"{BASE}/go", wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(7000)
    print("pack:", page.evaluate("() => document.documentElement.getAttribute('data-ui-pack')"), flush=True)
    print("boot rows:", page.evaluate("() => (window.__DSH_BOOT__?.entries ?? []).map(e => e.id).filter(id => id.includes('ui-')).join(',')"), flush=True)
    print("module 表:", page.evaluate("() => { try { return Object.keys(window.__ModuleLoader__?.entries ?? {}).join(',') } catch { return 'n/a' } }"), flush=True)
    for line in sig[:25]:
        print(" ", line, flush=True)
    browser.close()

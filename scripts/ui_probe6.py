#!/usr/bin/env python3
"""探针6：工作区列表项（侧栏/选择器）的真实 DOM 结构与可点击面。"""
import sys
from playwright.sync_api import sync_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:3081").rstrip("/")
CHROME = "/home/work/.openclaw/workspace/.openclaw/tmp/chrome-linux64/chrome"

DUMP = """() => {
  const out = [];
  for (const el of document.querySelectorAll('*')) {
    const t = (el.textContent || '').trim();
    if (!t.startsWith('ws-') || t.length > 20) continue;
    if (el.children.length > 2) continue;
    const chain = [];
    let n = el;
    for (let i = 0; i < 4 && n; i++, n = n.parentElement) {
      chain.push(n.tagName.toLowerCase() + (n.getAttribute('role') ? '[' + n.getAttribute('role') + ']' : '') + (n.className && typeof n.className === 'string' ? '.' + n.className.split(' ')[0] : ''));
    }
    out.push({ text: t, chain: chain.join(' < '), visible: !!(el.offsetParent || el.getClientRects().length) });
  }
  return out;
}"""

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
    page = browser.new_context(ignore_https_errors=True, viewport={"width": 1440, "height": 900}).new_page()
    page.goto(f"{BASE}/go", wait_until="domcontentloaded", timeout=60000)
    page.wait_for_timeout(5000)
    for name in ("Continue", "Configure later"):
        try:
            b = page.get_by_role("button", name=name)
            if b.count() and b.first.is_enabled():
                b.first.click(timeout=3000)
        except Exception:  # noqa: BLE001
            pass
    print("=== 首屏（侧栏） ===", flush=True)
    for item in page.evaluate(DUMP):
        print(" ", ("V" if item["visible"] else "H"), item["text"], "::", item["chain"], flush=True)
    page.get_by_role("button", name="Choose workspace").click(timeout=8000)
    page.wait_for_timeout(1500)
    print("=== 选择器打开后 ===", flush=True)
    for item in page.evaluate(DUMP):
        print(" ", ("V" if item["visible"] else "H"), item["text"], "::", item["chain"], flush=True)
    browser.close()

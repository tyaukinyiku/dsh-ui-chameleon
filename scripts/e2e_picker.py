#!/usr/bin/env python3
"""e2e_picker.py —— 皮肤选择器（配置界面）端到端验收。

纯 UI 流程：🎨 按钮 → 选 pack/主题/布局 → 应用到【会话】/【工作区】→ 清除覆盖回落。
顺带全程断言三级继承语义与零报错。
用法：python3 scripts/e2e_picker.py [base_url]
"""
import os
import sys

from playwright.sync_api import sync_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:3081").rstrip("/")
CHROME = "/home/work/.openclaw/workspace/.openclaw/tmp/chrome-linux64/chrome"
SHOTS = "/home/work/.openclaw/workspace/.openclaw/tmp/shots"
WS_NAME = "acme-e2e"

errors = []
results = []


def check(label, ok, detail=""):
    results.append(ok)
    print(f"{'PASS' if ok else 'FAIL'}  {label}" + (f" — {detail}" if detail else ""), flush=True)


def pack_now(page):
    return page.evaluate("() => document.documentElement.getAttribute('data-ui-pack')")


def dismiss_modals(page):
    for name in ("Continue", "Configure later", "Cancel"):
        try:
            b = page.get_by_role("button", name=name)
            if b.count() and b.first.is_enabled():
                b.first.click(timeout=2500)
                page.wait_for_timeout(500)
        except Exception:  # noqa: BLE001
            pass


def open_picker(page):
    # 会话按钮（title 含“会话”）优先；失败再退侧栏按钮
    btn = page.locator('[data-ui-skins-picker][title*="会话"]')
    (btn.first if btn.count() > 0 else page.locator("[data-ui-skins-picker]").first).click(timeout=8000)
    page.wait_for_timeout(1200)
    check("选择器弹层打开", page.locator(".ui-skins-overlay").count() > 0)


def close_picker(page):
    page.get_by_role("button", name="关闭").click(timeout=5000)
    page.wait_for_timeout(500)


def choose_workspace(page, name):
    dismiss_modals(page)
    page.keyboard.press("Escape")
    page.wait_for_timeout(300)
    page.get_by_role("button", name="Choose workspace").click(timeout=8000)
    page.wait_for_timeout(1200)
    item = page.get_by_role("menuitem", name=name)
    if item.count() > 0:
        item.first.click(timeout=5000)
    else:
        check("工作区应已预置", False, f"{name} 不在菜单")
    page.wait_for_timeout(2000)


def main():
    os.makedirs(SHOTS, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
        ctx = browser.new_context(ignore_https_errors=True, viewport={"width": 1440, "height": 900})
        page = ctx.new_page()
        page.on("console", lambda m: errors.append(f"{m.type}: {m.text[:160]}") if m.type in ("error", "warning") else None)
        page.on("pageerror", lambda e: errors.append(f"pageerror: {str(e)[:200]}"))
        page.goto(f"{BASE}/go", wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(5000)
        dismiss_modals(page)
        choose_workspace(page, WS_NAME)
        page.get_by_role("button", name="New Session").first.click(timeout=8000)
        page.wait_for_timeout(1200)
        box = page.locator("textarea:visible, [contenteditable='true']:visible").first
        box.click(timeout=8000)
        box.type("hi", delay=15)
        page.keyboard.press("Enter")
        page.wait_for_timeout(5000)
        check("基线：工作区层 quartz 生效", pack_now(page) == "quartz", pack_now(page))
        check("🎨 会话按钮存在", page.locator("conversation" and "[data-ui-skins-picker]").count() >= 1)

        # ---------- 1. 应用到当前会话 ----------
        open_picker(page)
        check("pack 卡片 = 5 个集成皮肤", page.locator(".ui-skins-card").count() == 5, str(page.locator(".ui-skins-card").count()))
        page.screenshot(path=f"{SHOTS}/picker-dialog.png")
        page.locator('[data-pack="aurora"]').click(timeout=5000)
        page.wait_for_timeout(400)
        page.get_by_role("button", name="应用", exact=True).click(timeout=5000)
        page.wait_for_timeout(3500)  # SSE → 即时生效
        check("应用到会话：切到 aurora", pack_now(page) == "aurora", pack_now(page))
        close_picker(page)
        page.screenshot(path=f"{SHOTS}/picker-applied-session.png")

        # ---------- 2. 清除会话覆盖 → 回落工作区 ----------
        open_picker(page)
        page.get_by_role("button", name="清除本层覆盖").click(timeout=5000)
        page.wait_for_timeout(3500)
        check("清除会话覆盖：回落 quartz", pack_now(page) == "quartz", pack_now(page))
        close_picker(page)

        # ---------- 3. 应用到工作区 ----------
        open_picker(page)
        page.locator('label.ui-skins-radio:has-text("工作区") input').check(timeout=4000)
        sel = page.locator("select.ui-skins-select")
        if sel.count() > 0:
            opts = sel.first.locator("option").all_text_contents()
            idx = next((i for i, t in enumerate(opts) if "acme-e2e" in t), 0)
            sel.first.select_option(index=idx)
        page.locator('[data-pack="terminal"]').click(timeout=5000)
        page.wait_for_timeout(300)
        page.get_by_role("button", name="应用", exact=True).click(timeout=5000)
        page.wait_for_timeout(3500)
        check("应用到工作区：切到 terminal", pack_now(page) == "terminal", pack_now(page))
        close_picker(page)

        # ---------- 4. 清除工作区覆盖 → 回落文件层 ----------
        open_picker(page)
        page.locator('label.ui-skins-radio:has-text("工作区") input').check(timeout=4000)
        sel = page.locator("select.ui-skins-select")
        if sel.count() > 0:
            opts = sel.first.locator("option").all_text_contents()
            idx = next((i for i, t in enumerate(opts) if "acme-e2e" in t), 0)
            sel.first.select_option(index=idx)
        page.get_by_role("button", name="清除本层覆盖").click(timeout=5000)
        page.wait_for_timeout(3500)
        check("清除工作区覆盖：回落 quartz（.dsh/ui.json）", pack_now(page) == "quartz", pack_now(page))
        close_picker(page)

        ours = [e for e in errors if "ui-skins" in e or "ui-pack" in e]
        check("零我方报错/告警", not ours, str(ours[:3]))
        browser.close()

    print("\n===== 汇总 =====")
    print(f"断言: {sum(results)}/{len(results)} 通过 | console 噪声: {len(errors)}")
    for e in errors[:5]:
        print("  console:", e)
    sys.exit(0 if all(results) else 1)


if __name__ == "__main__":
    main()

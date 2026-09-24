#!/usr/bin/env python3
"""demo_workspaces.py —— 千面演示：不同工作区进入不同 UI/UX。

流程：每个工作区使用独立浏览器上下文（隔离状态），走真实用户路径
（选择工作区 → 新建会话），断言解析出专属 pack/theme/布局 token/品牌组件，并整页截图。
用法：python3 scripts/demo_workspaces.py [base_url]
"""
import os
import re
import sys

from playwright.sync_api import sync_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:3081").rstrip("/")
CHROME = "/home/work/.openclaw/workspace/.openclaw/tmp/chrome-linux64/chrome"
SHOTS = "/home/work/.openclaw/workspace/.openclaw/tmp/shots"

# (工作区目录, 期望 pack, 期望 theme, 期望 --ui-bg, 品牌标记选择器, 角标计数键)
DEMOS = [
    ("ws-aurora", "aurora", "aurora-night", "#05060f", "[data-ui-aurora-mark]", "aurora"),
    ("ws-manuscript", "manuscript", "ms-classic", "#f4ecd8", "[data-ui-ms-mark]", "manuscript"),
    ("ws-terminal", "terminal", "crt-green", "#000000", "[data-ui-term-mark]", "terminal"),
]

errors = []
results = []


def check(label, ok, detail=""):
    results.append(ok)
    print(f"{'PASS' if ok else 'FAIL'}  {label}" + (f" — {detail}" if detail else ""), flush=True)


def dismiss_modals(page):
    for name in ("Continue", "Configure later", "Cancel"):
        try:
            b = page.get_by_role("button", name=name)
            if b.count() and b.first.is_enabled():
                b.first.click(timeout=2500)
                page.wait_for_timeout(600)
        except Exception:  # noqa: BLE001
            pass


def spec_dom(page, marker):
    return page.evaluate(
        """(marker) => {
        const el = document.documentElement;
        const cs = getComputedStyle(el);
        return {
          pack: el.getAttribute('data-ui-pack'),
          theme: el.getAttribute('data-ui-theme'),
          layout: el.getAttribute('data-ui-layout'),
          bg: cs.getPropertyValue('--ui-bg').trim(),
          font: cs.getPropertyValue('--ui-font').trim().slice(0, 22),
          marker: document.querySelectorAll(marker).length,
          corner: {
            aurora: document.querySelectorAll('[data-ui-aurora-corner]').length,
            manuscript: document.querySelectorAll('[data-ui-ms-corner]').length,
            terminal: document.querySelectorAll('[data-ui-term-corner]').length,
          },
        };
    }""",
        marker,
    )


def choose_workspace(page, name):
    """选中工作区：选择器是 role=menu，用 menuitem 精确点击；缺失时走目录选择器添加。"""
    dismiss_modals(page)
    page.keyboard.press("Escape")
    page.wait_for_timeout(400)
    try:
        page.get_by_role("button", name="Choose workspace").click(timeout=6000)
    except Exception:  # noqa: BLE001  会话视图里无此入口：New Session 复位
        page.get_by_role("button", name="New Session").first.click(timeout=6000)
        page.wait_for_timeout(1500)
        page.get_by_role("button", name="Choose workspace").click(timeout=8000)
    page.wait_for_timeout(1500)
    item = page.get_by_role("menuitem", name=name)
    if item.count() > 0:
        item.first.click(timeout=5000)
    else:
        try:
            page.get_by_role("menuitem", name=re.compile("Add workspace")).last.click(timeout=4000)
        except Exception:  # noqa: BLE001
            try:
                page.get_by_role("button", name=re.compile("Add workspace")).last.click(timeout=4000)
            except Exception:  # noqa: BLE001
                pass
        page.wait_for_timeout(1000)
        page.get_by_role("button", name="Home").last.click(timeout=8000)
        page.wait_for_timeout(1200)
        page.get_by_text(name, exact=False).first.click(timeout=8000)
        page.get_by_role("button", name="Open").last.click(timeout=8000)
        page.wait_for_timeout(1500)
        try:
            page.get_by_role("button", name="Open").last.click(timeout=3000)
        except Exception:  # noqa: BLE001
            pass
        page.wait_for_timeout(1500)
        try:
            page.get_by_role("menuitem", name=name).first.click(timeout=4000)
        except Exception:  # noqa: BLE001
            pass
    page.wait_for_timeout(2500)


def main():
    os.makedirs(SHOTS, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
        for ws, pack, theme, bg, marker, corner_key in DEMOS:
            page = None
            try:
                ctx = browser.new_context(ignore_https_errors=True, viewport={"width": 1440, "height": 900})
                page = ctx.new_page()
                page.on("console", lambda m: errors.append(f"{m.type}: {m.text[:160]}") if m.type in ("error", "warning") else None)
                page.on("pageerror", lambda e: errors.append(f"pageerror: {str(e)[:200]}"))
                page.goto(f"{BASE}/go", wait_until="domcontentloaded", timeout=60000)
                page.wait_for_timeout(5000)
                dismiss_modals(page)
                choose_workspace(page, ws)
                page.get_by_role("button", name="New Session").first.click(timeout=8000)
                page.wait_for_timeout(1500)
                box = page.locator("textarea:visible, [contenteditable='true']:visible").first
                box.click(timeout=8000)
                box.type("hi", delay=20)
                page.keyboard.press("Enter")
                page.wait_for_timeout(5000)
                d = spec_dom(page, marker)
                if d["pack"] != pack:
                    page.wait_for_timeout(4500)  # 竞态重试：等待会话→工作区落定
                    d = spec_dom(page, marker)
                check(f"[{ws}] pack={pack}", d["pack"] == pack, str(d["pack"]))
                check(f"[{ws}] theme={theme}", d["theme"] == theme, str(d["theme"]))
                check(f"[{ws}] --ui-bg={bg}", d["bg"].lower() == bg.lower(), d["bg"])
                check(f"[{ws}] 品牌组件渲染", d["marker"] >= 1, f"count={d['marker']}")
                check(f"[{ws}] 角标归属正确", d["corner"].get(corner_key, 0) >= 1, str(d["corner"]))
                page.screenshot(path=f"{SHOTS}/demo-{ws}.png", full_page=False)
                print(f"       font: {d['font']} | layout: {d['layout']}", flush=True)
                ctx.close()
            except Exception as exc:  # noqa: BLE001
                check(f"[{ws}] 流程执行", False, str(exc)[:140])
                try:
                    page.screenshot(path=f"{SHOTS}/demo-{ws}-fail.png", full_page=False)
                except Exception:  # noqa: BLE001
                    pass

        ours = [e for e in errors if "ui-skins" in e or "ui-pack" in e or "ui-aurora" in e or "ui-ms" in e or "ui-term" in e]
        check("零我方报错/告警", not ours, str(ours[:3]))
        browser.close()

    print("\n===== 汇总 =====")
    print(f"断言: {sum(results)}/{len(results)} 通过 | console 噪声: {len(errors)}")
    for e in errors[:5]:
        print("  console:", e)
    sys.exit(0 if all(results) else 1)


if __name__ == "__main__":
    main()

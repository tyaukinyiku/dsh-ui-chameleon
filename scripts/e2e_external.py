#!/usr/bin/env python3
"""e2e_external.py —— 外部 web-ui 皮肤集成（外部包集成器）端到端测评。

链路：进会话 → 🎨 选择器第三方卡（badge 外部）→ 应用到【会话】→ bodyAttr 激活 +
第三方作用域 CSS 生效 → 【会话层】压过【工作区层】（分层测评）→ 逐层清除回落 → 零报错。
用法：DSH_TOKEN=*** python3 scripts/e2e_external.py [base_url]
"""
import os
import sys

from playwright.sync_api import sync_playwright

from pathlib import Path

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:3080").rstrip("/")
Q = "?token=" + os.environ.get("AUTHV", "demo")
CHROME = "/home/work/.openclaw/workspace/.openclaw/tmp/chrome-linux64/chrome"
SHOTS = "/home/work/.openclaw/workspace/.openclaw/tmp/shots"
WS_NAME = "acme-e2e"
EXT_ID = os.environ.get("EXT_ID", "ext-aurora")
BODY_ATTR = os.environ.get("BODY_ATTR", "data-dsh-aurora")
# 第三方 CSS 在 [data-dsh-aurora] 作用域定义的自定义属性（提取自真实 bundle）
CSS_PROBE = os.environ.get("CSS_PROBE", "--dsh-aurora-glass-card-light")

errors = []
results = []
posts = []  # /ui-skins/binding POST bodies


def check(label, ok, detail=""):
    results.append(ok)
    print(f"{'PASS' if ok else 'FAIL'}  {label}" + (f" — {detail}" if detail else ""), flush=True)


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


def create_session(page):
    """建会话拿到会话上下文（会话头 🎨 按钮随 session scope 挂载，带 sessionId）。"""
    page.get_by_role("button", name="New Session").first.click(timeout=8000)
    page.wait_for_timeout(1500)
    box = page.locator("textarea:visible, [contenteditable='true']:visible").first
    box.click(timeout=8000)
    box.type("hi", delay=30)
    page.keyboard.press("Enter")
    page.wait_for_timeout(4500)


def select_ws(page, name):
    """工作区目标下拉显式选中（选择器 wsSelect 默认取 workspaces[0]，不一定是当前会话工作区）。"""
    sel = page.locator("select.ui-skins-select")
    if sel.count() > 0:
        opts = sel.first.locator("option").all_text_contents()
        idx = next((i for i, t in enumerate(opts) if name in t), 0)
        sel.first.select_option(index=idx)


def state(page):
    return page.evaluate(
        """([attr, cssVar]) => ({
        pack: document.documentElement.getAttribute('data-ui-pack'),
        htmlAttr: document.documentElement.getAttribute(attr),
        bodyAttr: document.body.getAttribute(attr),
        cssVar: getComputedStyle(document.body).getPropertyValue(cssVar).trim(),
      })""",
        [BODY_ATTR, CSS_PROBE],
    )


def main():
    os.makedirs(SHOTS, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
        ctx = browser.new_context(ignore_https_errors=True, viewport={"width": 1440, "height": 900})
        page = ctx.new_page()
        page.on("console", lambda m: errors.append(f"{m.type}: {m.text[:160]}") if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(f"pageerror: {str(e)[:200]}"))
        page.on(
            "request",
            lambda r: posts.append(r.post_data or "")
            if "/ui-skins/binding" in r.url and r.method == "POST"
            else None,
        )
        # 带 token 落地（303 → SPA 首页 + 鉴权 cookie）
        page.goto(f"{BASE}/{Q}", wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(5000)
        dismiss_modals(page)
        choose_workspace(page, WS_NAME)

        # ---------- 0. 进会话（拿到会话上下文） ----------
        try:
            create_session(page)
            check("UI: 会话已建立", True)
        except Exception as exc:  # noqa: BLE001
            check("UI: 会话已建立", False, str(exc)[:120])
        sess_btn = page.locator('[data-ui-skins-picker][title*="会话"]')
        check("会话头 🎨 按钮就位（session scope）", sess_btn.count() > 0)

        # ---------- 1. 选择器呈现第三方皮肤卡 ----------
        open_picker(page)
        card = page.locator(f'.ui-skins-card[data-pack="{EXT_ID}"]')
        check("第三方皮肤卡出现", card.count() > 0)
        badge = card.first.locator(".ui-skins-badge")
        check("卡片带「外部」徽标", badge.count() > 0 and "外部" in (badge.first.inner_text() if badge.count() else ""))
        desc = card.first.inner_text()
        check("卡片含第三方来源说明", len(desc.strip()) > 5, desc[:50].replace("\n", " "))
        page.screenshot(path=f"{SHOTS}/external-picker-card.png", full_page=False)

        # ---------- 2. 应用到会话 ----------
        card.first.click(timeout=5000)
        page.wait_for_timeout(400)
        page.get_by_role("button", name="应用", exact=True).click(timeout=5000)
        page.wait_for_timeout(1800)
        close_picker(page)
        page.wait_for_timeout(800)

        last_post = posts[-1] if posts else ""
        check("绑定写入会话层", f'"level":"session"' in last_post, last_post[:90])
        s = state(page)
        check("应用到会话：pack=ext-aurora", s["pack"] == EXT_ID, str(s["pack"]))
        check("bodyAttr 激活（html+body 双挂）", s["bodyAttr"] is not None and s["htmlAttr"] is not None)
        diag = page.evaluate("(cssp) => { const st = document.getElementById('dsh-ui-skins-style'); const txt = st ? (st.textContent || '') : ''; const attr = document.documentElement.getAttribute('data-dsh-skin') || document.documentElement.getAttribute('data-ui-pack'); const val = getComputedStyle(document.documentElement).getPropertyValue(cssp); const nRules = Array.from(document.styleSheets).reduce((n, sh) => { try { return n + (sh.cssRules || []).length } catch (e) { return n } }, 0); return JSON.stringify({ attr, val: val.slice(0, 24), styleLen: txt.length, probeInStyle: txt.includes(cssp), anchorInStyle: txt.includes('data-dsh-skin='), nRules }) }", CSS_PROBE)
        check("第三方作用域 CSS 生效（自定义属性非空）", bool(s["cssVar"]), s["cssVar"][:40] + " diag=" + str(diag))
        applied_cssval = s["cssVar"]
        page.screenshot(path=f"{SHOTS}/external-applied-session.png", full_page=False)

        # ---------- 3. 分层测评：工作区写另一皮肤，会话层应压过 ----------
        open_picker(page)
        page.locator('label.ui-skins-radio:has-text("工作区") input').check(timeout=4000)
        select_ws(page, WS_NAME)
        page.locator('[data-pack="terminal"]').click(timeout=5000)
        page.wait_for_timeout(400)
        page.get_by_role("button", name="应用", exact=True).click(timeout=5000)
        page.wait_for_timeout(1500)
        close_picker(page)
        page.wait_for_timeout(800)
        s = state(page)
        check("分层：会话层 ext-aurora 压过工作区 terminal", s["pack"] == EXT_ID, str(s["pack"]))
        page.screenshot(path=f"{SHOTS}/external-layering.png", full_page=False)

        # ---------- 4. 清除会话覆盖 → 回落工作区层 ----------
        open_picker(page)
        page.get_by_role("button", name="清除本层覆盖").click(timeout=5000)
        page.wait_for_timeout(1500)
        close_picker(page)
        page.wait_for_timeout(800)
        s = state(page)
        check("清除会话后回落工作区层 terminal", s["pack"] == "terminal", str(s["pack"]))
        check("清除后 bodyAttr 回收", s["bodyAttr"] is None and s["htmlAttr"] is None)

        # ---------- 5. 清除工作区覆盖 → 回落 dsh 层 ----------
        open_picker(page)
        page.locator('label.ui-skins-radio:has-text("工作区") input').check(timeout=4000)
        select_ws(page, WS_NAME)
        page.get_by_role("button", name="清除本层覆盖").click(timeout=5000)
        page.wait_for_timeout(1500)
        close_picker(page)
        page.wait_for_timeout(800)
        s = state(page)
        check("清除工作区后回落 dsh 层", s["pack"] != "terminal", str(s["pack"]))
        check("清除后 CSS 变量已非皮肤值（回落官方/空）", s["cssVar"] != applied_cssval, "applied=" + applied_cssval[:20] + " now=" + s["cssVar"][:20])

        bad = [e for e in errors if "password" not in e.lower()]
        check("零 pageerror / 零 console error", len(bad) == 0, "; ".join(bad[:2]))
        page.screenshot(path=f"{SHOTS}/external-cleared.png", full_page=False)
        browser.close()

    print(f"\n断言: {sum(results)}/{len(results)} 通过")
    sys.exit(0 if all(results) else 1)


if __name__ == "__main__":
    main()

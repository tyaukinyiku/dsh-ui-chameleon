#!/usr/bin/env python3
"""e2e_headless.py —— 无头浏览器验收：dsh 加载 dsh-ui-chameleon 的效果与三级继承。

断言面：
  1. 加载：__DSH_BOOT__ 含插件 entry、零 pageerror / 零我方 console error；
  2. dsh 层继承：html[data-ui-pack/theme/layout] + CSS 变量落地；
  3. 工作区层继承：选中带 .dsh/ui.json 的 acme 工作区并建会话 → quartz/focus + 工作区 token；
  4. 会话层继承：对真实会话 id 写绑定（含 null 清除）→ 会话>工作区>dsh 逐字段验证。

用法：python3 scripts/e2e_headless.py [base_url]
"""
import os
import re
import sys
import time

from playwright.sync_api import sync_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:3081").rstrip("/")
CHROME = "/home/work/.openclaw/workspace/.openclaw/tmp/chrome-linux64/chrome"
SHOTS = "/home/work/.openclaw/workspace/.openclaw/tmp/shots"
WORKSPACE_PATH = "/home/work/acme-e2e"

os.makedirs(SHOTS, exist_ok=True)
errors = {"console": [], "pageerror": [], "requestfailed": []}
results = []


def check(label, ok, detail=""):
    results.append((label, ok))
    print(f"{'PASS' if ok else 'FAIL'}  {label}" + (f" — {detail}" if detail else ""), flush=True)


def spec_dom(page):
    return page.evaluate(
        """() => {
        const el = document.documentElement;
        const cs = getComputedStyle(el);
        return {
          pack: el.getAttribute('data-ui-pack'),
          theme: el.getAttribute('data-ui-theme'),
          layout: el.getAttribute('data-ui-layout'),
          bg: cs.getPropertyValue('--ui-bg').trim(),
          gap: cs.getPropertyValue('--ui-gap').trim(),
          styleTags: document.querySelectorAll('style#dsh-ui-skins-style').length,
          cornerTitle: document.querySelector('[data-quartz-corner]')?.getAttribute('title') || '',
          badge: document.querySelector('[data-ui-skins-badge]')?.textContent || '',
        };
    }"""
    )


def set_binding(page, level, sid, config):
    return page.evaluate(
        "async (b) => (await fetch('/ui-skins/binding', {method:'POST',"
        " headers:{'content-type':'application/json'}, body: JSON.stringify(b)})).status",
        {"level": level, "id": sid, "config": config},
    )


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME, args=["--no-sandbox"])
        ctx = browser.new_context(ignore_https_errors=True, viewport={"width": 1440, "height": 900})
        page = ctx.new_page()
        page.on("console", lambda m: errors["console"].append(f"{m.type}: {m.text[:200]}") if m.type in ("error", "warning") else None)
        page.on("pageerror", lambda e: errors["pageerror"].append(str(e)[:300]))
        page.on("requestfailed", lambda r: errors["requestfailed"].append(f"{r.url[:120]} {r.failure}"))

        # ---------- 1. 加载 ----------
        page.goto(f"{BASE}/go", wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(5000)
        body = page.content()
        check("页面加载（SPA）", len(body) > 20000, f"{len(body)} bytes")
        check("__DSH_BOOT__ 含插件 entry", "dsh-ui-skins" in body)
        boot = page.evaluate("() => !!window.__DSH_BOOT__?.entries?.some(e => e.id === 'dsh-ui-skins')")
        check("boot graph 有 dsh-ui-skins 行", bool(boot))
        for name in ("Continue", "Configure later"):  # 引导弹窗逐个独立关闭（存在的才点）
            try:
                btn = page.get_by_role("button", name=name)
                if btn.count() and btn.first.is_enabled():
                    btn.first.click(timeout=4000)
                    page.wait_for_timeout(1200)
            except Exception:  # noqa: BLE001
                pass

        # ---------- 2. dsh 层继承 ----------
        d = spec_dom(page)
        check("dsh层: data-ui-pack=default", d["pack"] == "default", str(d["pack"]))
        check("dsh层: theme=paper（pack 默认）", d["theme"] == "paper", str(d["theme"]))
        check("dsh层: layout=classic（pack 默认）", d["layout"] == "classic", str(d["layout"]))
        check("dsh层: CSS 变量落地(--ui-bg)", bool(d["bg"]), d["bg"])
        check("dsh层: 样式注入(<style id>)", d["styleTags"] >= 1, str(d["styleTags"]))
        page.screenshot(path=f"{SHOTS}/1-dsh-layer.png")

        # ---------- 3. 工作区层继承（幂等：列表里有则直接选，无则目录选择器添加） ----------
        session_ids_before = all_session_ids()
        try:
            page.get_by_role("button", name="Choose workspace").click(timeout=10000)
            page.wait_for_timeout(1500)
            item = page.get_by_role("menuitem", name="acme-e2e")  # 选择器是 role=menu，用 menuitem 点
            if item.count() > 0:
                item.first.click(timeout=5000)
            else:
                import re as _re
                try:
                    page.get_by_role("menuitem", name=_re.compile("Add workspace")).last.click(timeout=4000)
                except Exception:  # noqa: BLE001
                    pass
                page.wait_for_timeout(1000)
                page.get_by_role("button", name="Home").last.click(timeout=8000)
                page.wait_for_timeout(1200)
                page.get_by_text("acme-e2e", exact=False).first.click(timeout=8000)
                page.get_by_role("button", name="Open").last.click(timeout=8000)
                page.wait_for_timeout(1500)
                try:
                    page.get_by_role("button", name="Open").last.click(timeout=3000)
                except Exception:  # noqa: BLE001
                    pass
                page.wait_for_timeout(1500)
                try:
                    page.get_by_role("menuitem", name="acme-e2e").first.click(timeout=4000)
                except Exception:  # noqa: BLE001
                    pass
            page.wait_for_timeout(2500)
            check("UI: 工作区已选中", True, "acme-e2e")
        except Exception as exc:  # noqa: BLE001
            check("UI: 工作区已选中", False, str(exc)[:120])
            try:  # 失败现场：可见控件 dump + 截图，供一轮收敛
                page.screenshot(path=f"{SHOTS}/fail-workspace.png")
                for line in page.evaluate(
                    "() => Array.from(document.querySelectorAll('button, input, textarea, h2, label'))"
                    ".map(el => (el.offsetParent ? 'V' : 'H') + '|' + el.tagName + '|' +"
                    " (el.innerText || el.getAttribute('placeholder') || '').trim().slice(0, 60))"
                    ".filter(s => s.split('|')[2]).slice(0, 30)"
                ):
                    print("    dump:", line, flush=True)
            except Exception:  # noqa: BLE001
                pass

        try:
            page.get_by_role("button", name="New Session").first.click(timeout=8000)
            page.wait_for_timeout(1500)
            box = page.locator("textarea:visible, [contenteditable='true']:visible").first
            box.click(timeout=8000)
            box.type("hi", delay=30)
            page.keyboard.press("Enter")
            page.wait_for_timeout(4500)  # 观察器上报 sessionId → host 推导工作区 → 应用 quartz
            check("UI: 会话已建立并发送", True)
        except Exception as exc:  # noqa: BLE001
            check("UI: 会话已建立并发送", False, str(exc)[:120])
        new_ids = all_session_ids() - session_ids_before
        session_ids_before |= new_ids

        ws = spec_dom(page)
        check("工作区层: pack=quartz（.dsh/ui.json）", ws["pack"] == "quartz", str(ws["pack"]))
        check("工作区层: theme=quartz-night", ws["theme"] == "quartz-night", str(ws["theme"]))
        check("工作区层: layout=focus", ws["layout"] == "focus", str(ws["layout"]))
        check("工作区层: token --ui-gap=4px", ws["gap"] == "4px", ws["gap"])
        check("组件级: quartz 角标渲染", ws["cornerTitle"].startswith("session "), ws["cornerTitle"])
        page.screenshot(path=f"{SHOTS}/2-workspace-layer.png")

        # ---------- 4. 会话层继承（会话 id = 建会话前后的差分） ----------
        sid = ws["cornerTitle"].removeprefix("session ").strip() or (sorted(new_ids)[-1] if new_ids else "")
        check("会话层: 取到真实会话 id", bool(sid), sid or "未找到")
        if sid:
            st = set_binding(page, "session", sid, {"pack": "default", "theme": "dusk", "tokens": {"--ui-gap": "1px"}})
            check("会话层: 绑定写入 204", st == 204, str(st))
            page.wait_for_timeout(3500)  # SSE → 运行时刷新
            se = spec_dom(page)
            check("会话层: pack=default 覆盖 quartz", se["pack"] == "default", str(se["pack"]))
            check("会话层: theme=dusk 覆盖 quartz-night", se["theme"] == "dusk", str(se["theme"]))
            check("会话层: --ui-gap=1px 覆盖 4px", se["gap"] == "1px", se["gap"])
            page.screenshot(path=f"{SHOTS}/3-session-layer.png")

            # null 清除：theme=null → 回落 pack 默认主题（其余字段不变，继承语义）
            st = set_binding(page, "session", sid, {"pack": "default", "theme": None, "tokens": {"--ui-gap": "1px"}})
            check("null清除: 绑定写入 204", st == 204, str(st))
            page.wait_for_timeout(3500)
            cl = spec_dom(page)
            check("null清除: theme 回落 pack 默认(paper)", cl["theme"] == "paper", str(cl["theme"]))
            check("null清除: 同层 token 保留(--ui-gap=1px)", cl["gap"] == "1px", cl["gap"])
            page.screenshot(path=f"{SHOTS}/4-null-clear.png")
        else:
            check("会话层: 角标携带 sessionId", False, ws["badge"] or "角标未渲染")

        # ---------- 5. 不报错 ----------
        check("零 pageerror", not errors["pageerror"], str(errors["pageerror"][:2]))
        ours = [e for e in errors["console"] if "ui-skins" in e or "ui-pack" in e or "__ModuleLoader__" in e or "client.js" in e]
        check("零我方 console error", not ours, str(ours[:2]))
        browser.close()

    print("\n===== 汇总 =====")
    print(f"console errors: {len(errors['console'])} | pageerror: {len(errors['pageerror'])} | requestfailed: {len(errors['requestfailed'])}")
    for e in errors["console"][:6]:
        print("  console:", e)
    for e in errors["requestfailed"][:6]:
        print("  reqfail:", e)
    failed = [r for r in results if not r[1]]
    print(f"断言: {len(results) - len(failed)}/{len(results)} 通过")
    sys.exit(1 if failed else 0)


def all_session_ids():
    """storage 里全部会话 id（差分法定位新建会话）。"""
    import glob
    import json
    ids = set()
    for path in glob.glob("/home/work/.dsh/storages/*.json"):
        try:
            text = json.dumps(json.load(open(path)))
        except Exception:  # noqa: BLE001
            continue
        ids.update(re.findall(r'"(session-[0-9a-f-]+)"', text))
    return ids


def find_session_id():
    return ""


if __name__ == "__main__":
    main()

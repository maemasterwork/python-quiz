/* پنل معلم: نمره‌ها، پیشرفت آزمون‌های نیمه‌تمام و جواب‌ها */
(() => {
"use strict";
const REMOTE = !!(CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY);
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fa = (n, d = 1) => Number(n).toLocaleString("fa-IR", { maximumFractionDigits: d });
const when = s => s ? new Date(s).toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short" }) : "—";
const QBY = Object.fromEntries(QUESTIONS.map(q => [q.id, q]));
const STATUS = { correct: "✅ درست", partial: "🟡 نمره جزئی", wrong: "❌ نادرست", empty: "⚪ بی‌پاسخ", engine: "⚠️ بررسی نشد" };

function view(html) { const a = $("#app"); a.innerHTML = html; a.classList.remove("enter"); void a.offsetWidth; a.classList.add("enter"); }

async function load(code) {
  if (!REMOTE) {
    if (code !== CONFIG.DEMO_ADMIN_CODE) throw new Error("invalid_admin_code");
    let db = {}; try { db = JSON.parse(localStorage.getItem("pyquiz_demo") || "{}"); } catch (e) {}
    return Object.entries(CONFIG.DEMO_STUDENTS).map(([c, name]) => ({
      name, code: c, attempts: (db[c] || []).map(a => ({ ...a }))
    }));
  }
  const k = CONFIG.SUPABASE_ANON_KEY;
  const r = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/admin_overview`, {
    method: "POST", headers: { apikey: k, ...(k.startsWith("eyJ") ? { Authorization: `Bearer ${k}` } : {}), "Content-Type": "application/json" },
    body: JSON.stringify({ p_admin_code: code })
  });
  const txt = await r.text();
  if (!r.ok) { let m = txt; try { m = JSON.parse(txt).message; } catch (e) {} throw new Error(m); }
  return JSON.parse(txt);
}

function login(msg) {
  view(`<section class="login"><div class="orb orb-a"></div><div class="orb orb-b"></div>
    <div class="login-card"><div class="snake">🧑‍🏫</div><h1>پنل معلم</h1><p class="muted">کد معلم را وارد کن</p>
    <form id="f" autocomplete="off"><input id="c" class="code-input" dir="ltr" type="password" autocomplete="off" placeholder="••••••••">
    <button class="btn primary big" type="submit">ورود</button></form><div class="err">${msg || ""}</div></div></section>`);
  $("#c").focus();
  $("#f").onsubmit = async e => {
    e.preventDefault();
    const code = $("#c").value.trim(); if (!code) return;
    try { const data = await load(code); sessionStorage.setItem("pyquiz_admin", code); dashboard(code, data); }
    catch (err) { login(err.message.includes("admin") ? "کد معلم درست نیست." : "ارتباط با سرور برقرار نشد."); }
  };
}

function attemptHTML(a) {
  const finished = !!a.finished_at;
  let head, body = "";
  if (finished) {
    head = `<span><b>آزمون ${fa(a.attempt_no, 0)}</b> <span class="pill fin">پایان‌یافته</span> <span class="muted">${when(a.finished_at)}</span></span>
            <span class="sc">${fa(a.score)} / ${fa(a.max_score, 0)}</span>`;
    const d = Array.isArray(a.details) ? a.details : [];
    const hints = d.filter(x => x.hint_used).length;
    body = `<div class="muted">راهنمای استفاده‌شده: ${fa(hints, 0)}</div>
      <table class="t"><tr><th>#</th><th>مبحث</th><th>وضعیت</th><th>نمره</th><th>راهنما</th></tr>
      ${d.map(x => `<tr><td>${fa(x.id, 0)}</td><td dir="ltr" style="text-align:left">${esc(QBY[x.id]?.topic)}</td>
        <td>${STATUS[x.status] || x.status}${x.tests_total ? ` <span class="muted">(${fa(x.tests_passed, 0)}/${fa(x.tests_total, 0)} تست)</span>` : ""}</td>
        <td class="sc">${fa(x.earned, 2)} / ${fa(x.points, 0)}</td><td>${x.hint_used ? "💡" : ""}</td></tr>`).join("")}</table>
      ${d.filter(x => QBY[x.id]?.kind === "code" && x.answer).map(x =>
        `<details style="margin-top:8px"><summary>کد سوال ${fa(x.id, 0)}</summary><pre class="code" dir="ltr">${esc(x.answer)}</pre></details>`).join("")}`;
  } else {
    const p = a.progress || {};
    const answered = Object.keys(p.answers || {}).filter(id => { const v = p.answers[id]; return typeof v !== "string" || v.trim(); }).length;
    const hints = Object.keys(p.hints || {}).length;
    head = `<span><b>آزمون ${fa(a.attempt_no, 0)}</b> <span class="pill run">در حال انجام</span> <span class="muted">آخرین فعالیت: ${when(a.updated_at || a.started_at)}</span></span>
            <span class="muted">${fa(answered, 0)} از ${fa(QUESTIONS.length, 0)} سوال جواب داده شده</span>`;
    body = `<div class="muted">سوال فعلی: ${fa((p.cur ?? 0) + 1, 0)} · راهنمای استفاده‌شده: ${fa(hints, 0)}</div>`;
  }
  return `<details class="rv att"><summary>${head}</summary><div class="body">${body}</div></details>`;
}

function dashboard(code, data) {
  const csv = () => {
    const rows = [["name", "attempt_no", "score", "max_score", "finished_at"]];
    data.forEach(s => s.attempts.filter(a => a.finished_at).forEach(a => rows.push([s.name, a.attempt_no, a.score, a.max_score, a.finished_at])));
    const blob = new Blob(["﻿" + rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
    const l = document.createElement("a"); l.href = URL.createObjectURL(blob); l.download = "python-quiz-results.csv"; l.click();
  };
  view(`
  <div class="top-actions"><span class="chip">🧑‍🏫 پنل معلم</span><button class="btn" id="out">خروج</button></div>
  ${REMOTE ? "" : `<div class="demo-banner">🧪 حالت آزمایشی: فقط اطلاعات همین مرورگر دیده می‌شود</div>`}
  <div class="toolbar"><button class="btn" id="re">🔄 تازه‌سازی</button><button class="btn" id="csv">⬇️ خروجی CSV</button></div>
  <div class="adm-grid">${data.map(s => {
    const fin = s.attempts.filter(a => a.finished_at);
    const best = fin.length ? Math.max(...fin.map(a => +a.score)) : null;
    return `<section class="card stu"><h3><span>👩‍🎓 ${esc(s.name)} <span class="chip topic">${esc(s.code)}</span></span>
      <span class="muted">بهترین نمره: <b class="sc ok">${best === null ? "—" : fa(best)}</b> · ${fa(s.attempts.length, 0)} از ۳ فرصت مصرف شده</span></h3>
      ${s.attempts.length ? s.attempts.map(attemptHTML).join("") : `<p class="muted">هنوز آزمونی شروع نکرده است.</p>`}</section>`;
  }).join("")}</div>`);
  $("#out").onclick = () => { sessionStorage.removeItem("pyquiz_admin"); login(); };
  $("#re").onclick = async () => { try { dashboard(code, await load(code)); } catch (e) { login("دوباره وارد شو."); } };
  $("#csv").onclick = csv;
}

(async () => {
  const code = sessionStorage.getItem("pyquiz_admin");
  if (code) { try { return dashboard(code, await load(code)); } catch (e) {} }
  login();
})();
})();

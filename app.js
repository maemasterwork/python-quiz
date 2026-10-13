/* ==========================================================
   آزمون پایتون — منطق اصلی سایت
   ========================================================== */
(() => {
"use strict";

const Q = QUESTIONS;
const TOTAL = Q.reduce((s, q) => s + q.points, 0);
const MAX_ATTEMPTS = 3;
const REMOTE = !!(CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY);

/* ---------------------------- helpers ---------------------------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const fa = (n, d = 1) => Number(n).toLocaleString("fa-IR", { maximumFractionDigits: d });
const r2 = n => Math.round(n * 100) / 100;
const pick = a => a[Math.floor(Math.random() * a.length)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));

function rich(src) {
  const blocks = [];
  let t = String(src).replace(/\n?```([\s\S]*?)```\n?/g, (_, c) => {
    blocks.push(c.replace(/^\n/, "").replace(/\n$/, ""));
    return `\u0000${blocks.length - 1}\u0000`;
  });
  t = esc(t)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
    .replace(/\n/g, "<br>");
  return t.replace(/\u0000(\d+)\u0000/g, (_, i) => `<pre class="code" dir="ltr">${esc(blocks[i])}</pre>`);
}

function view(html) {
  const a = $("#app");
  a.innerHTML = html;
  a.classList.remove("enter"); void a.offsetWidth; a.classList.add("enter");
  window.scrollTo({ top: 0 });
}

/* background floating code tokens */
(function bg() {
  const toks = ["print()", "for", "if", "[ ]", "{ }", "def", "while", "range()", "True", "# ", "+=", "==", "len()", ".append()", "elif", "0:5", "'abc'", "3.14"];
  const el = $("#bg");
  for (let i = 0; i < 26; i++) {
    const s = document.createElement("span");
    s.textContent = pick(toks);
    s.style.left = Math.random() * 100 + "%";
    s.style.fontSize = 14 + Math.random() * 26 + "px";
    s.style.animationDuration = 22 + Math.random() * 30 + "s";
    s.style.animationDelay = -Math.random() * 40 + "s";
    el.appendChild(s);
  }
  document.addEventListener("mousemove", e => {
    const x = (e.clientX / innerWidth - .5) * 40, y = (e.clientY / innerHeight - .5) * 40;
    $$(".orb").forEach((o, i) => o.style.transform = `translate(${x * (i ? -1 : 1)}px,${y * (i ? -1 : 1)}px)`);
  });
})();

/* confetti */
function confetti(n = 140) {
  const c = $("#confetti"), ctx = c.getContext("2d");
  c.width = innerWidth; c.height = innerHeight;
  const cols = ["#ffd43b", "#4b8bbe", "#3ddc97", "#ff6b81", "#9b7bff", "#ffffff"];
  const ps = Array.from({ length: n }, () => ({
    x: Math.random() * c.width, y: -20 - Math.random() * c.height * .5,
    vx: (Math.random() - .5) * 4, vy: 2 + Math.random() * 4, s: 6 + Math.random() * 8,
    r: Math.random() * 6, vr: (Math.random() - .5) * .3, c: pick(cols)
  }));
  let f = 0;
  (function tick() {
    ctx.clearRect(0, 0, c.width, c.height);
    ps.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.r += p.vr; p.vy += .03;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
      ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore();
    });
    if (++f < 260) requestAnimationFrame(tick); else ctx.clearRect(0, 0, c.width, c.height);
  })();
}

function confirmDialog({ title, text, ok = "باشه", cancel = "بیخیال" }) {
  return new Promise(res => {
    const m = document.createElement("div");
    m.className = "modal";
    m.innerHTML = `<div class="modal-box"><h3>${title}</h3><p class="muted">${text}</p>
      <div class="modal-actions"><button class="btn" data-no>${cancel}</button><button class="btn primary" data-ok>${ok}</button></div></div>`;
    document.body.appendChild(m);
    m.querySelector("[data-ok]").onclick = () => { m.remove(); res(true); };
    m.querySelector("[data-no]").onclick = () => { m.remove(); res(false); };
  });
}

/* ---------------------------- API layer ---------------------------- */
function infoFrom(name, attempts, openAttempt) {
  const done = attempts.filter(a => a.finished_at);
  return {
    name,
    attempts_used: attempts.length,
    attempts_left: Math.max(0, MAX_ATTEMPTS - attempts.length),
    open_attempt_id: openAttempt ? openAttempt.id : null,
    history: done.map(a => ({ attempt_no: a.attempt_no, score: a.score, max_score: a.max_score, finished_at: a.finished_at }))
  };
}

const remoteAPI = {
  async rpc(fn, args, keepalive = false) {
    const k = CONFIG.SUPABASE_ANON_KEY;
    const r = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: "POST", keepalive,
      headers: { apikey: k, ...(k.startsWith("eyJ") ? { Authorization: `Bearer ${k}` } : {}), "Content-Type": "application/json" },
      body: JSON.stringify(args)
    });
    const txt = await r.text();
    if (!r.ok) { let m = txt; try { m = JSON.parse(txt).message; } catch (e) {} throw new Error(m); }
    return txt ? JSON.parse(txt) : null;
  },
  login: code => remoteAPI.rpc("login_student", { p_code: code }),
  start: code => remoteAPI.rpc("start_attempt", { p_code: code }),
  save: (code, id, state, keepalive) => remoteAPI.rpc("save_progress", { p_code: code, p_attempt_id: id, p_state: state }, keepalive),
  finish: (code, id, score, max, details) =>
    remoteAPI.rpc("finish_attempt", { p_code: code, p_attempt_id: id, p_score: score, p_max: max, p_details: details })
};

const demoAPI = {
  db() { try { return JSON.parse(localStorage.getItem("pyquiz_demo") || "{}"); } catch (e) { return {}; } },
  put(d) { localStorage.setItem("pyquiz_demo", JSON.stringify(d)); },
  find(code) {
    const c = String(code).trim().toUpperCase();
    const e = Object.entries(CONFIG.DEMO_STUDENTS).find(([k]) => k.toUpperCase() === c);
    return e ? { code: e[0], name: e[1] } : null;
  },
  async login(code) {
    const s = this.find(code); if (!s) return null;
    const list = this.db()[s.code] || [];
    return infoFrom(s.name, list, list.find(a => !a.finished_at));
  },
  async start(code) {
    const s = this.find(code); if (!s) throw new Error("invalid_code");
    const db = this.db(); const list = db[s.code] || [];
    const open = list.find(a => !a.finished_at);
    if (open) return { attempt_id: open.id, attempt_no: open.attempt_no, resumed: true, progress: open.progress || null };
    if (list.length >= MAX_ATTEMPTS) throw new Error("no_attempts_left");
    const a = { id: "demo-" + Date.now(), attempt_no: list.length + 1, finished_at: null, progress: null };
    list.push(a); db[s.code] = list; this.put(db);
    return { attempt_id: a.id, attempt_no: a.attempt_no, resumed: false, progress: null };
  },
  async save(code, id, state) {
    const s = this.find(code); if (!s) return;
    const db = this.db(); const a = (db[s.code] || []).find(x => x.id === id);
    if (a && !a.finished_at) { a.progress = state; a.updated_at = new Date().toISOString(); this.put(db); }
  },
  async finish(code, id, score, max, details) {
    const s = this.find(code); const db = this.db(); const list = db[s.code] || [];
    const a = list.find(x => x.id === id); if (!a || a.finished_at) throw new Error("attempt_closed");
    Object.assign(a, { finished_at: new Date().toISOString(), score, max_score: max, details });
    this.put(db); return "ok";
  }
};
const API = REMOTE ? remoteAPI : demoAPI;

/* ---------------------------- Python engine (Pyodide in a Worker) ---------------------------- */
const PY_BASE = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/";
const HARNESS = [
  "import sys, io, json, builtins",
  "class _Cap(io.StringIO):",
  "    def write(self, s):",
  "        if self.tell() > 20000:",
  "            raise RuntimeError('Too much output')",
  "        return super().write(s)",
  "def _no_input(*a, **k):",
  "    raise RuntimeError('input() is not allowed here')",
  "builtins.input = _no_input",
  "def _run(src):",
  "    buf = _Cap()",
  "    old = sys.stdout",
  "    sys.stdout = buf",
  "    err = ''",
  "    try:",
  "        exec(compile(src, 'your_code.py', 'exec'), {'__name__': '__main__'})",
  "    except BaseException as e:",
  "        err = type(e).__name__ + ': ' + str(e)",
  "    finally:",
  "        sys.stdout = old",
  "    return json.dumps([buf.getvalue(), err])"
].join("\n");

const WORKER_SRC = `
importScripts("${PY_BASE}pyodide.js");
let py;
const ready = (async () => {
  py = await loadPyodide({ indexURL: "${PY_BASE}" });
  await py.runPythonAsync(${JSON.stringify(HARNESS)});
  postMessage({ type: "ready" });
})().catch(e => postMessage({ type: "fail", message: String(e) }));
onmessage = async (e) => {
  await ready;
  if (!py) return;
  const { id, src } = e.data;
  try {
    py.globals.set("_src", src);
    const r = await py.runPythonAsync("_run(_src)");
    postMessage({ type: "result", id, data: JSON.parse(r) });
  } catch (err) {
    postMessage({ type: "result", id, data: ["", String(err)] });
  }
};`;

const Py = {
  worker: null, ready: null, seq: 0, pending: new Map(),
  start() {
    if (this.worker) return this.ready;
    let resolve, reject;
    this.ready = new Promise((a, b) => { resolve = a; reject = b; });
    this.ready.catch(() => {});
    try {
      const url = URL.createObjectURL(new Blob([WORKER_SRC], { type: "text/javascript" }));
      this.worker = new Worker(url);
    } catch (e) { reject(e); return this.ready; }
    this.worker.onmessage = ev => {
      const m = ev.data;
      if (m.type === "ready") resolve();
      else if (m.type === "fail") reject(new Error(m.message));
      else if (m.type === "result") {
        const p = this.pending.get(m.id);
        if (p) { clearTimeout(p.t); this.pending.delete(m.id); p.res({ out: m.data[0], err: m.data[1] }); }
      }
    };
    this.worker.onerror = e => reject(new Error(e.message || "worker error"));
    return this.ready;
  },
  reset() {
    if (this.worker) this.worker.terminate();
    this.worker = null; this.ready = null;
    this.pending.forEach(p => clearTimeout(p.t)); this.pending.clear();
  },
  async run(src, timeout = 4000) {
    try { await this.start(); }
    catch (e) { this.reset(); return { out: "", err: "", engine: false }; }
    return new Promise(res => {
      const id = ++this.seq;
      const t = setTimeout(() => {
        this.pending.delete(id); this.reset();
        res({ out: "", err: "TimeoutError: کد خیلی طول کشید (شاید حلقه‌ی بی‌پایان داری؟)" });
        this.start();
      }, timeout);
      this.pending.set(id, { res, t });
      this.worker.postMessage({ id, src });
    });
  }
};

/* ---------------------------- state ---------------------------- */
let session = null;  // { code, info }
let st = null;       // quiz state

const MSG = {
  start: ["سلام! من پایتونی‌ام 🐍 آماده‌ای؟", "هر سوال یک ماجراجویی تازه است! 🚀", "آروم و با دقت بخون، تو می‌تونی!"],
  next: ["آفرین، ادامه بده! 🔥", "سوال بعدی یه کم جالب‌تره 😉", "عالی پیش میری! ✨", "هر سوال یک قدم تا قهرمانی! 🏆"],
  answer: ["انتخاب خوبیه! 🤔", "ثبت شد ✅", "جواب رو گرفتم 👀", "به نظر مطمئن میای 😎"],
  hint: ["راهنما رو دیدی؛ هیچ اشکالی نداره، یاد گرفتن مهمه 💡", "خوب شد کمک گرفتی! 🌱"],
  paste: ["کدت رو گرفتم! دکمه‌ی «اجرا» رو بزن ببین چی در میاد 👀", "آفرین! پیست شد ✅"],
  code: ["وقت کدنویسیه! 💻 کد رو توی پایتون خودت بنویس و اینجا پیست کن.", "حالا نوبت بخش عملیه 🔧"],
  last: ["آخرین سوال! بعدش نتیجه رو می‌بینی 🎉"]
};
function say(text) {
  const b = $("#bubble"), m = $("#mascot");
  if (b) b.textContent = text;
  if (m) { m.classList.remove("hop"); void m.offsetWidth; m.classList.add("hop"); }
}
let saveTimer = null;
function syncNow(keepalive = false) {
  clearTimeout(saveTimer);
  if (!st || st.done || !session) return Promise.resolve();
  return Promise.resolve(API.save(session.code, st.attemptId, st, keepalive)).catch(() => {});
}
const save = () => {
  st.updatedAt = Date.now();
  try { localStorage.setItem("pyquiz_state_" + st.attemptId, JSON.stringify(st)); } catch (e) {}
  clearTimeout(saveTimer); saveTimer = setTimeout(() => syncNow(), 1500);   // ذخیره در سرور
};
// وقتی دانش‌آموز از صفحه خارج شد یا تب را عوض کرد، فوراً در سرور ذخیره کن
document.addEventListener("visibilitychange", () => { if (document.hidden) syncNow(true); });
window.addEventListener("pagehide", () => syncNow(true));
const isAnswered = q => {
  const a = st.answers[q.id];
  if (q.kind === "mcq") return typeof a === "number";
  if (q.kind === "tf") return typeof a === "boolean";
  return typeof a === "string" && a.trim() !== "";
};

/* ---------------------------- login ---------------------------- */
function showLogin(msg) {
  view(`
  ${REMOTE ? "" : `<div class="demo-banner">🧪 حالت آزمایشی: اطلاعات فقط در همین مرورگر ذخیره می‌شود</div>`}
  <section class="login">
    <div class="orb orb-a"></div><div class="orb orb-b"></div>
    <div class="login-card">
      <div class="snake">🐍</div>
      <h1>آزمون پایتون</h1>
      <p class="muted">کد مخصوص خودت را وارد کن</p>
      <form id="loginForm" autocomplete="off">
        <input id="codeInput" class="code-input" dir="ltr" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="••••-••••" maxlength="24">
        <button class="btn primary big" id="loginBtn" type="submit">بزن بریم 🚀</button>
      </form>
      <div class="err" id="loginErr">${msg || ""}</div>
    </div>
  </section>`);
  const inp = $("#codeInput"); inp.focus();
  $("#loginForm").onsubmit = async e => {
    e.preventDefault();
    const code = inp.value.trim();
    if (!code) return;
    const btn = $("#loginBtn"); btn.disabled = true; btn.textContent = "⏳ چک می‌کنم...";
    try {
      const info = await API.login(code);
      if (!info) throw new Error("bad");
      session = { code, info };
      sessionStorage.setItem("pyquiz_code", code);
      showHome();
    } catch (err) {
      btn.disabled = false; btn.textContent = "بزن بریم 🚀";
      inp.classList.remove("shake"); void inp.offsetWidth; inp.classList.add("shake");
      $("#loginErr").textContent = err.message === "bad" ? "این کد درست نیست؛ دوباره امتحان کن 🙈" : "ارتباط با سرور برقرار نشد. اینترنت را چک کن.";
    }
  };
}

/* ---------------------------- home ---------------------------- */
function showHome() {
  if (st && !st.done) syncNow();   // اگر وسط آزمون بود، پیشرفت ذخیره شود
  const i = session.info;
  const best = i.history.length ? Math.max(...i.history.map(h => +h.score)) : null;
  const hearts = Array.from({ length: MAX_ATTEMPTS }, (_, k) => `<span class="${k < i.attempts_left ? "" : "lost"}">❤️</span>`).join("");
  const canStart = i.attempts_left > 0 || i.open_attempt_id;
  view(`
  ${REMOTE ? "" : `<div class="demo-banner">🧪 حالت آزمایشی (Supabase وصل نیست)</div>`}
  <div class="top-actions"><span class="chip">🐍 آزمون پایتون</span><button class="btn" id="logout">خروج</button></div>
  <section class="hero">
    <div class="snake" style="font-size:56px">👋</div>
    <h2>سلام ${esc(i.name)}!</h2>
    <p class="muted">آماده‌ی ماجراجویی در دنیای پایتون هستی؟</p>
    <div class="hearts" title="فرصت‌های باقی‌مانده">${hearts}</div>
    <div class="muted">${fa(i.attempts_left, 0)} فرصت از ${fa(MAX_ATTEMPTS, 0)} فرصت باقی مانده</div>
    <div class="stats">
      <div class="stat"><b>${fa(Q.length, 0)}</b>سوال</div>
      <div class="stat"><b>${fa(TOTAL, 0)}</b>امتیاز کل</div>
      <div class="stat"><b>${best === null ? "—" : fa(best)}</b>بهترین نمره</div>
    </div>
    <div class="rules">
      <div>📘 <b>۱۲ سوال تئوری</b> و 💻 <b>۸ سوال عملی</b></div>
      <div>💡 برای هر سوال می‌توانی <b>راهنما</b> بگیری، ولی <b>۱/۳ امتیاز</b> همان سوال کم می‌شود.</div>
      <div>📋 در سوال‌های عملی کدی را که توی پایتون خودت نوشتی <b>پیست</b> می‌کنی.</div>
      <div>🏁 نتیجه و پاسخ‌های درست آخر آزمون نشانت داده می‌شود.</div>
      <div>💾 جواب‌هایت خودکار ذخیره می‌شود. اگر از صفحه خارج شدی، بعداً با همان کد برگرد و <b>از همان‌جا ادامه بده</b> (حتی با دستگاه دیگر).</div>
    </div>
    <button class="btn primary big" id="startBtn" ${canStart ? "" : "disabled"}>
      ${i.open_attempt_id ? "ادامه‌ی آزمون ▶️" : canStart ? "شروع آزمون 🚀" : "فرصت‌هایت تمام شده"}
    </button>
    ${i.history.length ? `<div class="history"><b>📜 آزمون‌های قبلی</b>${i.history.map(h =>
      `<div class="row"><span>آزمون ${fa(h.attempt_no, 0)}</span><span class="sc">${fa(h.score)} / ${fa(h.max_score, 0)}</span></div>`).join("")}</div>` : ""}
  </section>`);
  $("#logout").onclick = () => { sessionStorage.removeItem("pyquiz_code"); session = null; showLogin(); };
  $("#startBtn").onclick = startQuiz;
  Py.start();   // گرم کردن موتور پایتون
}

/* ---------------------------- quiz ---------------------------- */
async function startQuiz() {
  const btn = $("#startBtn"); btn.disabled = true; btn.textContent = "⏳ ...";
  try {
    const r = await API.start(session.code);
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem("pyquiz_state_" + r.attempt_id) || "null"); } catch (e) {}
    const remote = r.progress && typeof r.progress === "object" && r.progress.attemptId === r.attempt_id ? r.progress : null;
    // اگر هم در مرورگر و هم در سرور پیشرفت هست، تازه‌ترین را بردار
    st = saved && remote ? ((saved.updatedAt || 0) >= (remote.updatedAt || 0) ? saved : remote) : (saved || remote);
    const resumed = !!st && (Object.keys(st.answers || {}).length > 0 || st.cur > 0);
    if (!st) {
      st = { attemptId: r.attempt_id, attemptNo: r.attempt_no, answers: {}, hints: {}, cur: 0, order: {} };
      Q.forEach(q => {
        if (q.kind === "mcq") {
          const idx = q.options.map((_, i) => i);
          for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
          st.order[q.id] = idx;
        }
      });
      save();
    }
    renderQuiz();
    if (resumed) {
      const n = Q.filter(isAnswered).length;
      say(`خوش برگشتی! 👋 ${fa(n, 0)} سوال را قبلاً جواب داده بودی؛ از همان‌جا ادامه بده.`);
    } else say(pick(MSG.start));
  } catch (e) {
    btn.disabled = false; btn.textContent = "شروع آزمون 🚀";
    alert(e.message === "no_attempts_left" ? "فرصت‌هایت تمام شده است." : "مشکلی پیش آمد: " + e.message);
  }
}

const ptsChip = q => st.hints[q.id]
  ? `⭐ حداکثر ${fa(r2(q.points - q.points / 3), 2)} از ${fa(q.points, 0)} امتیاز`
  : `⭐ ${fa(q.points, 0)} امتیاز`;

function dotsHTML() {
  return Q.map((q, i) => `<div class="dot ${i === st.cur ? "cur" : isAnswered(q) ? "done" : ""} ${st.hints[q.id] ? "hinted" : ""}" data-i="${i}" title="سوال ${i + 1}">${fa(i + 1, 0)}</div>`).join("");
}
function hintHTML(q) {
  if (st.hints[q.id]) return `<div class="hint-box">💡 ${rich(q.hint)}<small>(${fa(r2(q.points / 3), 2)} امتیاز از این سوال کم شد)</small></div>`;
  return `<button class="btn ghost" id="hintBtn">💡 راهنما <small>(−${fa(r2(q.points / 3), 2)} امتیاز)</small></button>`;
}
function answerHTML(q) {
  const a = st.answers[q.id];
  if (q.kind === "mcq") {
    const letters = ["الف", "ب", "ج", "د", "ه"];
    return `<div class="options">${st.order[q.id].map((oi, pos) =>
      `<button class="opt ${a === oi ? "sel" : ""}" data-oi="${oi}"><span class="letter">${letters[pos]}</span><span dir="auto">${rich(q.options[oi])}</span></button>`).join("")}</div>`;
  }
  if (q.kind === "tf") {
    return `<div class="tf"><button class="opt ${a === true ? "sel" : ""}" data-tf="1">✅ درست</button><button class="opt ${a === false ? "sel" : ""}" data-tf="0">❌ نادرست</button></div>`;
  }
  if (q.kind === "fill") {
    return `<input class="fill" id="fillInput" placeholder="جوابت را اینجا بنویس..." value="${esc(a || "")}" autocomplete="off" spellcheck="false">`;
  }
  return `
    <div class="preset"><div class="preset-title">🔧 این متغیرها <b>از قبل ساخته شده‌اند</b> (دوباره نسازشان). نمونه:</div>
      <pre class="code" dir="ltr">${esc(q.tests[0])}</pre>
      <div class="preset-title">در آزمون، کدت با مقدارهای دیگر هم امتحان می‌شود.</div></div>
    <div class="paste-note">📋 <span>کدت را در پایتون خودت بنویس و تست کن، بعد <b>اینجا پیست کن</b>.</span></div>
    <textarea class="codebox" id="codeBox" spellcheck="false" placeholder="# کد پایتون را اینجا پیست کن">${esc(a || "")}</textarea>
    <div class="run-row"><button class="btn" id="runBtn">▶️ اجرا و دیدن خروجی</button><span class="muted" style="font-size:.85rem">(فقط برای بررسی خودت؛ نمره‌ی نهایی آخر آزمون حساب می‌شود)</span></div>
    <div class="out" id="runOut"><span class="lbl">خروجی</span>—</div>`;
}

function renderQuiz() {
  const q = Q[st.cur];
  const last = st.cur === Q.length - 1;
  view(`
  <div class="topbar">
    <div class="brand">🐍 آزمون پایتون</div>
    <div>سوال <b>${fa(st.cur + 1, 0)}</b> از ${fa(Q.length, 0)}</div>
    <span class="chip ${q.section === "theory" ? "theory" : "code"}">${q.section === "theory" ? "📘 بخش تئوری" : "💻 بخش عملی"}</span>
  </div>
  <div class="progress"><i style="width:${(st.cur + 1) / Q.length * 100}%"></i></div>
  <div class="mascot-row"><div class="mascot" id="mascot">🐍</div><div class="bubble" id="bubble">…</div></div>
  <article class="card">
    <div class="q-meta"><span class="chip topic">${esc(q.topic)}</span><span class="chip pts" id="ptsChip">${ptsChip(q)}</span></div>
    <div class="q-text">${rich(q.q)}</div>
    <div id="answerArea">${answerHTML(q)}</div>
    <div class="hint-zone" id="hintZone">${hintHTML(q)}</div>
  </article>
  <div class="dots" id="dots">${dotsHTML()}</div>
  <div class="nav-btns">
    <button class="btn" id="prevBtn" ${st.cur === 0 ? "disabled" : ""}>→ قبلی</button>
    ${last ? `<button class="btn good" id="finishBtn">🏁 پایان و ارسال آزمون</button>` : `<button class="btn primary" id="nextBtn">بعدی ←</button>`}
  </div>`);
  bindQuiz(q);
}

function refreshDots() {
  $("#dots").innerHTML = dotsHTML();
}

function bindQuiz(q) {
  const go = i => {
    st.cur = i; save(); syncNow(); renderQuiz();
    const firstCode = Q.findIndex(x => x.section === "code");
    say(pick(i === firstCode ? MSG.code : i === Q.length - 1 ? MSG.last : MSG.next));
  };
  $("#dots").onclick = e => { const d = e.target.closest(".dot"); if (d) go(+d.dataset.i); };
  const p = $("#prevBtn"), n = $("#nextBtn"), f = $("#finishBtn");
  if (p) p.onclick = () => go(st.cur - 1);
  if (n) n.onclick = () => go(st.cur + 1);
  if (f) f.onclick = finish;

  $$(".opt[data-oi]").forEach(b => b.onclick = () => {
    st.answers[q.id] = +b.dataset.oi; save();
    $$(".opt").forEach(x => x.classList.toggle("sel", x === b));
    refreshDots(); say(pick(MSG.answer));
  });
  $$(".opt[data-tf]").forEach(b => b.onclick = () => {
    st.answers[q.id] = b.dataset.tf === "1"; save();
    $$(".opt").forEach(x => x.classList.toggle("sel", x === b));
    refreshDots(); say(pick(MSG.answer));
  });
  const fi = $("#fillInput");
  if (fi) fi.oninput = () => { st.answers[q.id] = fi.value; save(); refreshDots(); };

  const cb = $("#codeBox");
  if (cb) {
    cb.oninput = () => { st.answers[q.id] = cb.value; save(); refreshDots(); };
    cb.onpaste = () => setTimeout(() => { st.answers[q.id] = cb.value; save(); refreshDots(); say(pick(MSG.paste)); }, 0);
    cb.onkeydown = e => {
      if (e.key === "Tab") {
        e.preventDefault();
        const s = cb.selectionStart;
        cb.value = cb.value.slice(0, s) + "    " + cb.value.slice(cb.selectionEnd);
        cb.selectionStart = cb.selectionEnd = s + 4;
        cb.oninput();
      }
    };
    $("#runBtn").onclick = async () => {
      const out = $("#runOut"), btn = $("#runBtn");
      if (!cb.value.trim()) { out.className = "out err"; out.innerHTML = `<span class="lbl">خطا</span>اول کدت را پیست کن!`; return; }
      btn.disabled = true; out.className = "out"; out.innerHTML = `<span class="lbl">خروجی</span>⏳ در حال اجرا... (بار اول چند ثانیه طول می‌کشد)`;
      const r = await Py.run(q.tests[0] + "\n" + cb.value, 5000);
      btn.disabled = false;
      if (r.engine === false) { out.className = "out err"; out.innerHTML = `<span class="lbl">خطا</span>موتور پایتون بارگذاری نشد (اینترنت؟). کدت همچنان ذخیره شده است.`; return; }
      let html = `<span class="lbl">خروجی</span>${esc(r.out) || (r.err ? "" : "(چیزی چاپ نشد)")}`;
      if (r.err) { html += `${r.out ? "\n" : ""}<span style="color:var(--red)">${esc(r.err)}</span>`; }
      out.className = "out" + (r.err ? " err" : "");
      out.innerHTML = html;
    };
  }

  const hb = $("#hintBtn");
  if (hb) hb.onclick = async () => {
    const ok = await confirmDialog({
      title: "راهنما می‌خواهی؟ 💡",
      text: `اگر راهنما را ببینی ${fa(r2(q.points / 3), 2)} امتیاز (یک‌سوم) از این سوال کم می‌شود. مطمئنی؟`,
      ok: "آره، راهنما بده", cancel: "نه، خودم حل می‌کنم"
    });
    if (!ok) return;
    st.hints[q.id] = true; save(); syncNow();
    $("#hintZone").innerHTML = hintHTML(q);
    $("#ptsChip").textContent = ptsChip(q);
    refreshDots(); say(pick(MSG.hint));
  };
}

/* ---------------------------- grading ---------------------------- */
const normFill = s => String(s).replace(/\s+/g, "").replace(/['"]/g, "").toLowerCase();
const normOut = s => String(s).replace(/\r/g, "").split("\n").map(l => l.trimEnd()).join("\n").trim();

async function gradeQuestion(q, ans, hinted) {
  const res = { id: q.id, hint: hinted, points: q.points, raw: 0, status: "empty", tests: null };
  const answered = ans !== undefined && !(typeof ans === "string" && !ans.trim());
  if (!answered) { res.earned = 0; return res; }

  if (q.kind === "mcq") res.raw = ans === q.answer ? q.points : 0;
  else if (q.kind === "tf") res.raw = ans === q.answer ? q.points : 0;
  else if (q.kind === "fill") res.raw = q.accept.some(a => normFill(a) === normFill(ans)) ? q.points : 0;
  else {
    res.tests = []; let pass = 0;
    for (const pre of q.tests) {
      const exp = await Py.run(pre + "\n" + q.ref, 4000);
      const got = await Py.run(pre + "\n" + ans, 4000);
      if (got.engine === false) { res.status = "engine"; res.tests = null; res.earned = 0; return res; }
      const ok = !got.err && normOut(got.out) === normOut(exp.out);
      if (ok) pass++;
      res.tests.push({ pre, expected: exp.out, got: got.out, err: got.err || "", ok });
    }
    res.raw = q.points * pass / q.tests.length;
  }
  res.status = res.raw >= q.points - 1e-9 ? "correct" : res.raw > 0 ? "partial" : "wrong";
  res.earned = r2(Math.max(0, res.raw - (hinted ? q.points / 3 : 0)));
  return res;
}

async function finish() {
  const un = Q.filter(q => !isAnswered(q)).length;
  const ok = await confirmDialog({
    title: "پایان آزمون؟ 🏁",
    text: un ? `${fa(un, 0)} سوال را بدون جواب گذاشته‌ای. با ارسال، دیگر نمی‌توانی جواب‌ها را عوض کنی.` : "همه‌ی سوال‌ها جواب داده شده‌اند. بعد از ارسال دیگر نمی‌توانی تغییری بدهی.",
    ok: "آره، ارسال کن", cancel: "برگردم"
  });
  if (!ok) return;
  await syncNow();            // آخرین جواب‌ها در سرور ذخیره شوند
  st.done = true; clearTimeout(saveTimer);

  view(`<section class="grading"><div><div class="spinner">🐍</div><h2>دارم جواب‌هایت را بررسی می‌کنم...</h2>
    <p class="muted" id="gmsg">آماده‌سازی</p><div class="progress gbar"><i id="gbar" style="width:0"></i></div></div></section>`);
  const results = [];
  for (let i = 0; i < Q.length; i++) {
    const q = Q[i];
    $("#gmsg").textContent = q.kind === "code" ? `در حال اجرای کد سوال ${fa(i + 1, 0)}...` : `بررسی سوال ${fa(i + 1, 0)}`;
    results.push(await gradeQuestion(q, st.answers[q.id], !!st.hints[q.id]));
    $("#gbar").style.width = ((i + 1) / Q.length * 100) + "%";
    if (q.kind !== "code") await sleep(60);
  }
  const score = r2(results.reduce((s, r) => s + r.earned, 0));
  const details = results.map(r => ({
    id: r.id, status: r.status, earned: r.earned, points: r.points, hint_used: r.hint,
    answer: st.answers[r.id] ?? null, tests_passed: r.tests ? r.tests.filter(t => t.ok).length : null, tests_total: r.tests ? r.tests.length : null
  }));

  let saved = false;
  while (!saved) {
    try { await API.finish(session.code, st.attemptId, score, TOTAL, details); saved = true; }
    catch (e) {
      const retry = await confirmDialog({ title: "ذخیره نشد 😕", text: "ارتباط با سرور قطع است. می‌خواهی دوباره تلاش کنم؟ (نتیجه‌ات از بین نمی‌رود)", ok: "تلاش دوباره", cancel: "فعلاً نتیجه را ببینم" });
      if (!retry) break;
    }
  }
  if (saved) {
    localStorage.removeItem("pyquiz_state_" + st.attemptId);
    try { session.info = await API.login(session.code); } catch (e) {}
  }
  showResult(results, score, saved);
}

/* ---------------------------- result ---------------------------- */
function fmtAns(q, a) {
  if (a === undefined || (typeof a === "string" && !a.trim())) return `<span class="muted">بی‌پاسخ</span>`;
  if (q.kind === "mcq") return rich(q.options[a]);
  if (q.kind === "tf") return a ? "✅ درست" : "❌ نادرست";
  if (q.kind === "fill") return `<code>${esc(a)}</code>`;
  return "";
}

function reviewHTML(q, r) {
  const a = st.answers[q.id];
  const badge = { correct: ["✅", "ok"], partial: ["🟡", "mid"], wrong: ["❌", "bad"], empty: ["⚪", "muted"], engine: ["⚠️", "mid"] }[r.status];
  let body = "";
  if (q.kind === "code") {
    body += `<div class="ans-line ${r.status === "correct" ? "right" : "wrong"}"><b>کد تو:</b><pre class="code" dir="ltr">${esc(a || "(خالی)")}</pre></div>`;
    if (r.status === "engine") body += `<div class="explain">⚠️ موتور پایتون بارگذاری نشد و کد تو بررسی نشد. به معلم بگو.</div>`;
    if (r.tests) {
      body += `<div><b>نتیجه‌ی ${fa(r.tests.length, 0)} تست:</b> ${fa(r.tests.filter(t => t.ok).length, 0)} تا درست</div>`;
      body += r.tests.map((t, i) => `<div class="tcase"><div class="h"><span>تست ${fa(i + 1, 0)} <code>${esc(t.pre.replace(/\n/g, "; "))}</code></span><span class="${t.ok ? "ok" : "bad"}">${t.ok ? "✅ درست" : "❌ نادرست"}</span></div>
        <div class="cols"><div><small>خروجی درست</small><pre>${esc(t.expected) || "(خالی)"}</pre></div>
        <div><small>خروجی تو</small><pre>${esc(t.got) || "(خالی)"}${t.err ? "\n" + esc(t.err) : ""}</pre></div></div></div>`).join("");
    }
    body += `<div class="explain">✨ <b>راه‌حل پیشنهادی:</b><pre class="code" dir="ltr">${esc(q.ref)}</pre>${rich(q.explain)}</div>`;
  } else {
    const right = r.status === "correct";
    body += `<div class="ans-line ${right ? "right" : "wrong"}"><b>جواب تو:</b> ${fmtAns(q, a)}</div>`;
    if (!right) {
      const corr = q.kind === "mcq" ? rich(q.options[q.answer]) : q.kind === "tf" ? (q.answer ? "✅ درست" : "❌ نادرست") : `<code>${esc(q.accept[0])}</code>`;
      body += `<div class="ans-line right"><b>جواب درست:</b> ${corr}</div>`;
    }
    body += `<div class="explain">📖 ${rich(q.explain)}</div>`;
  }
  return `<details class="rv"><summary><span>${badge[0]} سوال ${fa(q.id, 0)} <span class="chip topic">${esc(q.topic)}</span> ${r.hint ? "💡" : ""}</span>
    <span class="sc ${badge[1]}">${fa(r.earned, 2)} / ${fa(q.points, 0)}</span></summary>
    <div class="body"><div class="q-text" style="margin-top:12px">${rich(q.q)}</div>${body}
    ${r.hint ? `<div class="muted">💡 راهنما استفاده شد: ${fa(r2(q.points / 3), 2)} امتیاز کم شد.</div>` : ""}</div></details>`;
}

function showResult(results, score, saved) {
  const pct = score / TOTAL * 100;
  const th = results.filter((r, i) => Q[i].section === "theory").reduce((s, r) => s + r.earned, 0);
  const co = results.filter((r, i) => Q[i].section === "code").reduce((s, r) => s + r.earned, 0);
  const thMax = Q.filter(q => q.section === "theory").reduce((s, q) => s + q.points, 0);
  const coMax = TOTAL - thMax;
  const lost = results.reduce((s, r) => s + (r.hint ? Math.min(r.raw, r.points / 3) : 0), 0);
  const hints = results.filter(r => r.hint).length;
  const correct = results.filter(r => r.status === "correct").length;
  const verdict = pct >= 90 ? "افسانه‌ای! 🏆" : pct >= 75 ? "عالی بود! 🌟" : pct >= 50 ? "خوب بود، ادامه بده! 💪" : "نگران نباش، با تمرین بهتر می‌شوی! 🌱";
  const left = session.info.attempts_left;
  view(`
  <section class="card result-hero">
    <div class="ring">
      <svg viewBox="0 0 200 200" width="210" height="210"><defs><linearGradient id="grad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4b8bbe"/><stop offset="1" stop-color="#ffd43b"/></linearGradient></defs>
        <circle class="bgc" cx="100" cy="100" r="90"/><circle class="fg" id="fg" cx="100" cy="100" r="90"/></svg>
      <div class="num"><b id="count">۰</b><span class="muted">از ${fa(TOTAL, 0)}</span></div>
    </div>
    <div class="verdict">${verdict}</div>
    <div class="muted">${fa(correct, 0)} سوال کاملاً درست · ${fa(hints, 0)} راهنما${lost ? ` · ${fa(r2(lost), 2)} امتیاز بابت راهنما کم شد` : ""}</div>
    ${saved ? "" : `<div class="err">⚠️ نتیجه در سرور ذخیره نشد؛ این صفحه را نبند و به معلم خبر بده.</div>`}
    <div class="mini">
      <div class="stat" style="text-align:right">📘 تئوری <b style="display:inline;float:left">${fa(th)} / ${fa(thMax, 0)}</b><div class="bar"><i style="width:${th / thMax * 100}%"></i></div></div>
      <div class="stat" style="text-align:right">💻 عملی <b style="display:inline;float:left">${fa(co)} / ${fa(coMax, 0)}</b><div class="bar"><i style="width:${co / coMax * 100}%"></i></div></div>
    </div>
    <div class="nav-btns"><button class="btn" id="homeBtn">🏠 صفحه‌ی اصلی</button>${left > 0 ? `<button class="btn primary" id="againBtn">🔁 آزمون دوباره (${fa(left, 0)} فرصت)</button>` : ""}</div>
  </section>
  <h3 style="margin:26px 4px 10px">🔍 مرور سوال‌ها و جواب‌های درست</h3>
  <div class="review">${Q.map((q, i) => reviewHTML(q, results[i])).join("")}</div>`);

  requestAnimationFrame(() => requestAnimationFrame(() => { $("#fg").style.strokeDashoffset = 565.5 * (1 - pct / 100); }));
  const t0 = performance.now();
  (function tick(t) {
    const k = Math.min(1, (t - t0) / 1800), e = 1 - Math.pow(1 - k, 3);
    const c = $("#count"); if (!c) return;
    c.textContent = fa(score * e, 1);
    if (k < 1) requestAnimationFrame(tick);
  })(t0);
  if (pct >= 60) setTimeout(() => confetti(pct >= 85 ? 220 : 120), 700);
  $("#homeBtn").onclick = showHome;
  const ag = $("#againBtn"); if (ag) ag.onclick = () => { showHome(); setTimeout(() => $("#startBtn")?.click(), 50); };
}

/* ---------------------------- init ---------------------------- */
(async function init() {
  const code = sessionStorage.getItem("pyquiz_code");
  if (code) {
    try {
      const info = await API.login(code);
      if (info) { session = { code, info }; return showHome(); }
    } catch (e) {}
  }
  showLogin();
})();
})();

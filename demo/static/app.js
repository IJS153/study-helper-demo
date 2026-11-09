/* 공부 도우미 화면. 글자는 모두 textContent로만 넣습니다(자료 이름·답·발췌가 HTML로 해석되지 않게). */
(() => {
  "use strict";

  // ---------- 작은 도구 ----------
  const SVG_NS = "http://www.w3.org/2000/svg";
  const ICONS = {
    home: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10",
    book: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zM4 19a2 2 0 0 0 2 2h13",
    quiz: "M9 9a3 3 0 1 1 4.5 2.6c-1 .6-1.5 1.1-1.5 2.4M12 17.5v.5M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0",
    check: "M5 4h14v16H5zM8.5 9l1.5 1.5L13 7.5M8.5 15l1.5 1.5 3-3M15 10h1.5M15 16h1.5",
    more: "M5 12h.01M12 12h.01M19 12h.01",
    doc: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6",
    chat: "M4 5h16v11H9l-5 4z",
    trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
    upload: "M12 16V4M7 9l5-5 5 5M4 20h16",
    link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
    back: "M15 5l-7 7 7 7",
    tick: "M5 12.5l4.5 4.5L19 7.5",
    send: "M12 19V6M6 11l6-6 6 6",
    copy: "M9 9h10v11H9zM5 15V4h10",
    chev: "M9 5l7 7-7 7",
    lock: "M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3",
    info: "M12 11v5M12 8v.01M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0",
    spark: "M12 4l1.8 4.7L18.5 10l-4.7 1.3L12 16l-1.8-4.7L5.5 10l4.7-1.3z",
    list: "M5 7h14M5 12h14M5 17h9",
    camera: "M4 8h3l1.5-2h7L17 8h3v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",
    image: "M4 5h16v14H4zM8 10a1.5 1.5 0 1 0 0-.01M4 17l5-5 4 4 3-3 4 4",
    note: "M6 3h12v18l-6-3-6 3zM9 8h6M9 12h6",
  };

  // 하단 탭용 채움(filled) 아이콘
  const FILLED = {
    home: "M12 2.5 2 11.5h3V21h5.5v-5.5h3V21H19v-9.5h3z",
    book: "M6 2h13v16H7.5A1.5 1.5 0 0 0 6 19.5zM6 21a1.5 1.5 0 0 1 1.5-1.5H19V21z",
    quiz: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15.5h-2V15.6h2zm1.6-6.4c-.5.6-1 .9-1.5 1.3-.4.3-.6.6-.6 1.3h-2c0-1.4.6-2 1.3-2.6.5-.4.9-.7.9-1.2 0-.6-.5-1-1.2-1-.8 0-1.3.5-1.4 1.2H8c.1-1.8 1.6-3 3.4-3 2 0 3.3 1.1 3.3 2.7 0 .5-.1 1-.1 1.3z",
    check: "M9 2h6v2h3a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3zm-1 9.2L9.4 9.8l1.6 1.6 3.6-3.6L16 9.2l-5 5zM8 18h8v-1.6H8z",
    more: "M5 10.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6zm7 0a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6zm7 0a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6z",
  };
  // 선생님 빨간펜 표시: 정답은 번호를 두르는 찌그러진 동그라미 한 획, 오답은 번호 위로 긋는 빠른 사선 두 줄.
  // 장식이라 화면 낭독기에서는 읽지 않고(aria-hidden), 정답/오답 글자와 카드 색은 그대로 둡니다.
  function penMark(correct) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 36 36");
    svg.setAttribute("class", "pen " + (correct ? "pen-ok" : "pen-bad"));
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    const g = document.createElementNS(SVG_NS, "g");
    g.setAttribute("filter", "url(#redpen-rough)");  // 살짝 번진 펜 질감(index.html 에 정의)
    const strokes = correct
      ? ["M21 3.6C11 2.6 3.6 10.6 4.2 20C4.8 29.4 14 34 23.4 32.2C31.6 30.6 34.4 21 31.4 13C28.8 6.2 20.6 2.8 12.6 5.4"]
      : ["M6.4 31C14.6 22.4 22.6 14.2 30.2 5.2", "M12.8 33.4C21 24.6 27.2 18 33.4 11.2"];
    for (const d of strokes) {
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", d);
      path.setAttribute("pathLength", "1");  // 긋는 애니메이션(stroke-dashoffset)을 길이와 상관없이 쓰기 위해
      g.appendChild(path);
    }
    svg.appendChild(g);
    return svg;
  }

  function icon(name, filled) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("class", filled ? "ico fill" : "ico");
    if (filled) { const fp = document.createElementNS(SVG_NS, "path"); fp.setAttribute("d", FILLED[name] || FILLED.more); fp.setAttribute("fill-rule", "evenodd"); svg.appendChild(fp); svg.setAttribute("aria-hidden", "true"); return svg; }
    svg.setAttribute("aria-hidden", "true");
    const p = document.createElementNS(SVG_NS, "path");
    p.setAttribute("d", ICONS[name] || ICONS.doc);
    svg.appendChild(p);
    return svg;
  }

  // 상단 앱바: 왼쪽 뒤로, 가운데 제목, 오른쪽 아이콘(선택)
  function appbar(title, opts) {
    const o = opts || {};
    return h("header", { class: "appbar" },
      o.back ? h("button", { class: "iconbtn", type: "button", "aria-label": o.backLabel || "뒤로", onclick: o.back }, icon("back")) : h("span"),
      h("h1", { text: title }),
      o.right ? h("button", { class: "iconbtn", type: "button", "aria-label": o.rightLabel || "", onclick: o.right }, icon(o.rightIcon || "list")) : h("span"));
  }
  function illus() {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 120 96"); svg.setAttribute("class", "illus"); svg.setAttribute("aria-hidden", "true");
    const add = (tag, attrs) => { const n = document.createElementNS(SVG_NS, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); svg.appendChild(n); };
    add("rect", { x: "22", y: "20", width: "62", height: "60", rx: "10", fill: "#D3E4FF" });
    add("rect", { x: "36", y: "10", width: "62", height: "60", rx: "10", fill: "#FFFFFF", stroke: "#1B63D8", "stroke-width": "2.5" });
    add("path", { d: "M48 30h38M48 40h38M48 50h24", stroke: "#1B63D8", "stroke-width": "2.5", "stroke-linecap": "round" });
    add("circle", { cx: "92", cy: "70", r: "12", fill: "#1B63D8" });
    add("path", { d: "M87 70l4 4 7-8", stroke: "#fff", "stroke-width": "2.5", fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" });
    return svg;
  }

  function h(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === undefined || v === null || v === false) continue;
      if (k === "class") n.className = v;
      else if (k === "text") n.textContent = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat()) {
      if (kid === null || kid === undefined || kid === false) continue;
      n.appendChild(typeof kid === "string" ? document.createTextNode(kid) : kid);
    }
    return n;
  }

  // 브라우저 기본 영어 파일 선택 창구 대신 한국어 버튼과 고른 파일 이름을 보여 줍니다(진짜 입력은 화면 낭독기·키보드용으로 남김).
  function filePicker(id, accept, buttonText, ariaLabel) {
    const input = h("input", { type: "file", id, accept, class: "sr-only", "aria-label": ariaLabel });
    const name = h("span", { class: "muted fname", text: "고른 파일이 없어요" });
    input.addEventListener("change", () => { name.textContent = input.files[0] ? input.files[0].name : "고른 파일이 없어요"; });
    const btn = h("label", { class: "btn secondary", for: id }, icon("upload"), buttonText);
    return { input, el: h("div", { class: "picker" }, input, btn, name) };
  }

  async function api(path, options = {}) {
    let res;
    try { res = await fetch(path, options); }
    catch (_) { throw new Error("서버에 연결하지 못했어요. 앱이 켜져 있는지 확인하고 다시 시도해 주세요."); }
    let body = {};
    try { body = await res.json(); } catch (_) {}
    if (!res.ok) throw new Error(body.error || `요청이 실패했어요 (${res.status})`);
    return body;
  }
  const postJson = (path, data) => api(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data || {}) });

  function box(kind, text) {
    const el = h("div", { class: "box" + (kind ? " " + kind : ""), role: kind === "error" ? "alert" : "status" });
    setBox(el, kind, text);
    return el;
  }
  // retry 가 있으면 오류 상자에 "다시 시도" 버튼을 붙입니다(직전 요청을 그대로 다시 보냅니다).
  function setBox(el, kind, text, retry) {
    el.className = "box" + (text && kind ? " " + kind : "");
    el.textContent = "";
    if (!text) return;
    if (kind === "busy") { el.append(h("span", { class: "spinner" }), h("span", { text })); return; }
    el.textContent = text;
    if (kind === "error" && typeof retry === "function") {
      el.append(h("div", { class: "row", style: "margin-top:8px" }, h("button", { class: "btn small retry-again", type: "button", onclick: retry }, "다시 시도")));
    }
  }

  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value);
    } catch (_) {}
    return null;
  }

  // ---------- 상태 ----------
  const state = {
    tab: "home",
    materials: [],
    selId: store("sel") || "",
    study: "허브",       // 허브 | 자료 | 요약 | 질문 | 기록
    quizMode: "새 문제", // 새 문제 | 오답
    chat: {},            // 자료 id → 이번에 나눈 질문·답 [{q, data}]
    drafts: {},          // 자료 id → 쓰던 질문
    retentionDays: 30,   // 질문 기록 보관 일수(서버 응답의 retention_days가 오면 그 값)
    quizzes: {},         // 자료 id → {data, picked:[], result, grading} (자료마다 따로 보관)
    asking: {},          // 자료 id → 답을 기다리는 중
    openWrong: {},       // 자료 id → 다시 풀 오답 수(홈 칩용)
    summ: {},            // 자료 id → 요약 진행 상태 {pending, error, text}
    qbusy: {},           // 자료 id → 문제를 만드는 중(문제 만들기·오답 다시 풀기가 함께 쓰는 잠금)
    regen: {},           // 자료 id → 오답 다시 풀기 진행 상태 {pending, error}(문제 만들기와 따로)
    gen: {},             // 자료 id → 문제 만들기 진행 상태 {pending, error}
    busy: new Set(),
  };
  const sel = () => state.materials.find((m) => m.id === state.selId) || null;

  const TABS = [
    ["home", "홈", "home"],
    ["study", "공부", "book"],
    ["quiz", "문제·오답", "quiz"],
    ["rubric", "수행평가", "check"],
    ["more", "더보기", "more"],
  ];

  function go(tab) {
    state.tab = tab;
    render();
    window.scrollTo(0, 0);
  }

  function renderTabs() {
    const bar = document.getElementById("tabbar");
    bar.textContent = "";
    for (const [id, label, ic] of TABS) {
      bar.appendChild(h("button", { class: "tab", type: "button", "aria-current": state.tab === id ? "page" : false, onclick: () => { if (id === "study" && state.tab === "study") state.study = "허브"; go(id); }  /* 이미 공부 탭이면 첫 화면(허브)으로 */  }, icon(ic, true), label));
    }
  }

  function render() {
    renderTabs();
    const root = document.getElementById("screens");
    root.textContent = "";
    const screens = { home: renderHome, study: renderStudy, quiz: renderQuiz, rubric: renderRubric, more: renderMore };
    root.appendChild(h("section", { class: "screen active" }, screens[state.tab]()));
  }

  // ---------- 공통 조각 ----------
  function empty(ic, title, text, action) {
    return h("div", { class: "empty card" }, illus(), h("strong", { text: title }), h("p", { text }), action ? h("div", { class: "row", style: "justify-content:center" }, action) : null);
  }
  function needMaterial(goal) {
    return empty("doc", "먼저 자료를 골라 주세요", `${goal}에는 공부 자료가 필요해요. 공부 탭에서 파일을 올리거나 골라 보세요.`,
      h("button", { class: "btn", type: "button", onclick: () => { state.study = "자료"; go("study"); } }, "공부 탭으로"));
  }
  function chips(options, current, onPick, label) {
    return h("div", { class: "chips", role: "tablist", "aria-label": label },
      options.map((o) => h("button", { class: "chip", type: "button", role: "tab", "aria-selected": o === current ? "true" : "false", onclick: () => onPick(o) }, o === current ? icon("tick") : null, o)));
  }
  // 분할 버튼(회색 바 안에 흰 선택 칸)
  function seg(options, current, onPick, label) {
    return h("div", { class: "seg", role: "tablist", "aria-label": label },
      options.map((o) => h("button", { type: "button", role: "tab", "aria-selected": o === current ? "true" : "false", onclick: () => onPick(o) }, o)));
  }
  function notice(text) { return h("p", { class: "notice", text }); }

  // ---------- 홈 ----------
  function renderHome() {
    const nick = store("nick");
    const m = sel();
    const openCount = state.openWrong[state.selId] || 0;
    const hero = m
      ? h("button", { class: "hero", type: "button", id: "home-hero", onclick: () => { state.study = "질문"; go("study"); } },
          h("span", { class: "tagchip", text: m.has_summary ? "요약 있음" : "요약 없음" }),
          h("b", { text: "이어서 공부하기" }),
          h("span", { class: "desc", text: `${m.filename} · ${m.page_count}쪽` }),
          h("span", { class: "go" }, "이 자료에 질문하기", icon("chev")))
      : h("button", { class: "hero", type: "button", id: "home-hero", onclick: () => { state.study = "자료"; go("study"); } },
          h("span", { class: "tagchip", text: "시작하기" }),
          h("b", { text: "오늘 볼 자료를 올려 보세요" }),
          h("span", { class: "desc", text: "PDF나 텍스트 파일을 올리면 요약하고, 쪽 번호와 함께 질문에 답해 줘요." }),
          h("span", { class: "go" }, "자료 올리러 가기", icon("chev")));
    return [
      h("div", { class: "topline" },
        h("span", { class: "logo-chip" }, h("span", { class: "dot-logo" }, icon("book")), "공부 도우미"),
        h("span", { class: "stats-chips" },
          h("span", { class: "pill-stat", text: `자료 ${state.materials.length}개` }),
          h("span", { class: "pill-stat", text: `오답 ${openCount}개` }))),
      h("h1", { class: "title", text: nick ? `${nick}님, 오늘도 한 쪽씩` : "오늘도 한 쪽씩" }),
      h("p", { class: "subtitle", text: "내 수업 자료로 요약하고, 묻고, 문제를 풀어요." }),
      nickPrompt(),
      hero,
      h("div", { class: "softpills" },
        h("button", { class: "softpill", type: "button", onclick: () => { state.study = "요약"; go("study"); } }, icon("doc"), "요약 보기"),
        h("button", { class: "softpill", type: "button", onclick: () => go("quiz") }, icon("quiz"), "문제 풀기"),
        h("button", { class: "softpill", type: "button", onclick: () => { state.quizMode = "오답"; go("quiz"); } }, icon("note"), "오답 노트")),
      h("div", { class: "quick" },
        h("button", { class: "btn", type: "button", id: "quick-ask", onclick: () => { state.study = m ? "질문" : "자료"; go("study"); } }, icon("chat"), "질문하기"),
        h("button", { class: "btn secondary", type: "button", id: "quick-photo", onclick: () => go("rubric") }, icon("camera"), "사진 찍기")),
      h("p", { class: "privacy" }, icon("lock"), keepSpan("올린 자료는 지우기 전까지 이 기기에 남아요. 질문 기록은 {days}일 뒤 자동으로 지워져요. AI 답은 틀릴 수 있으니 원문을 확인해 주세요.")),
    ];
  }

  // 처음 열었을 때 닉네임을 정하도록 한 번 물어봅니다(건너뛸 수 있고, 이 기기에만 저장).
  function nickPrompt() {
    if (store("nick") || store("nickSkip")) return null;
    const msg = box();
    const inp = h("input", { type: "text", id: "nick-home", maxlength: "12", "aria-label": "닉네임", placeholder: "예: 하늘" });
    return h("div", { class: "card", id: "nick-card", style: "margin-top:12px" },
      h("strong", { text: "뭐라고 부를까요?" }),
      h("p", { class: "muted", text: "닉네임은 이 기기에만 저장돼요. 이름·학년·반은 쓰지 마세요." }),
      inp,
      h("div", { class: "row" },
        h("button", { class: "btn", type: "button", id: "nick-home-save", onclick: () => {
          const v = inp.value.trim();
          if (!v) { setBox(msg, "error", "닉네임을 입력하거나 '나중에'를 눌러 주세요."); return; }
          store("nick", v); render();
        } }, "저장"),
        h("button", { class: "btn secondary", type: "button", id: "nick-home-skip", onclick: () => { store("nickSkip", "1"); render(); } }, "나중에")),
      msg);
  }

  function feature(ic, title, desc, onclick) {
    return h("button", { class: "feature", type: "button", onclick },
      h("span", { class: "badge-ico" }, icon(ic)),
      h("span", {}, h("b", { text: title }), h("span", { text: desc })));
  }

  // ---------- 자료 불러오기 ----------
  // 질문 기록 보관 기간 문구: {days} 자리에 서버가 알려 준 일수를 넣습니다(응답이 없으면 기본 30일).
  const KEEP_ATTR = "data-keep";
  function keepText(tpl) { return tpl.replace("{days}", String(state.retentionDays)); }
  function keepSpan(tpl) { return h("span", { [KEEP_ATTR]: tpl, text: keepText(tpl) }); }
  function applyRetention() { for (const el of document.querySelectorAll(`[${KEEP_ATTR}]`)) el.textContent = keepText(el.getAttribute(KEEP_ATTR)); }
  async function refreshRetention() {
    const id = state.selId;
    if (!id) return;
    try {
      const data = await api(`/api/materials/${id}/history`);
      const days = Number(data.retention_days);
      if (Number.isFinite(days) && days > 0) { state.retentionDays = days; applyRetention(); }
    } catch (_) {}
  }

  // 홈 칩에 보일 "다시 풀 오답 수"를 가져옵니다(실패해도 화면은 그대로).
  async function refreshOpenWrong() {
    const id = state.selId;
    if (!id) return;
    try {
      const data = await api(`/api/materials/${id}/wrong-notes`);
      state.openWrong[id] = data.open_count;
      if (state.tab === "home") render();
      // 더보기가 이미 열려 있으면 입력 중인 닉네임을 잃지 않게, 통계 숫자만 바꿉니다.
      const stat = document.getElementById("stat-wrong");
      if (stat && state.tab === "more" && state.selId === id) stat.textContent = String(data.open_count);
    } catch (_) {}
  }

  async function loadMaterials(prefer) {
    state.materials = await api("/api/materials");
    const want = prefer || state.selId;
    const found = state.materials.find((m) => m.id === want);
    state.selId = found ? found.id : (state.materials[0] ? state.materials[0].id : "");
    store("sel", state.selId || null);
    refreshOpenWrong();
    refreshRetention();
  }

  // ---------- 공부 ----------
  function renderStudy() {
    const wrap = h("div");
    if (state.study === "허브") { wrap.append(...[].concat(studyHub())); return wrap; }
    wrap.append(
      appbar("공부", { back: () => { state.study = "허브"; render(); }, backLabel: "공부 첫 화면으로", right: () => { state.study = "자료"; render(); }, rightLabel: "자료 관리", rightIcon: "doc" }),
      chips(["자료", "요약", "질문", "기록"], state.study, (c) => { state.study = c; render(); }, "공부 메뉴"));
    const body = { 자료: studyMaterials, 요약: studySummary, 질문: studyAsk, 기록: studyHistory }[state.study];
    wrap.append(...[].concat(body()));
    return wrap;
  }

  // 공부 첫 화면: 기능 허브(2열)와 내 자료 행 목록
  function studyHub() {
    const tile = (ic, color, name, onclick, id) => h("button", { class: "tile", type: "button", id, onclick },
      h("span", { class: `badge-ico ${color}` }, icon(ic)), h("span", { text: name }));
    const rows = state.materials.length
      ? h("ul", { class: "rows", id: "hub-materials" }, state.materials.map((m) => h("li", {},
          h("button", { class: "rowitem", type: "button", "aria-pressed": m.id === state.selId ? "true" : "false", onclick: () => { state.selId = m.id; store("sel", m.id); refreshOpenWrong(); state.study = "질문"; render(); } },
            h("span", { class: "grow" }, h("span", { class: "nm", text: m.filename }), h("span", { class: "meta", text: `${m.page_count}쪽 · ${m.has_summary ? "요약 있음" : "요약 없음"}${m.id === state.selId ? " · 선택됨" : ""}` })),
            h("span", { class: "go-ico" }, icon("chev"))))))
      : empty("doc", "아직 올린 자료가 없어요", "PDF나 텍스트 파일을 올리면 여기에 모여요.", h("button", { class: "btn", type: "button", onclick: () => { state.study = "자료"; render(); } }, "자료 올리기"));
    return [
      h("h1", { class: "title", text: "공부" }),
      h("p", { class: "label", text: "공부 도구" }),
      h("div", { class: "hub" },
        tile("chat", "blue", "질문하기", () => { state.study = sel() ? "질문" : "자료"; render(); }, "tile-ask"),
        tile("doc", "blue", "요약", () => { state.study = sel() ? "요약" : "자료"; render(); }, "tile-summary"),
        tile("quiz", "green", "문제 풀기", () => { state.quizMode = "새 문제"; go("quiz"); }, "tile-quiz"),
        tile("note", "green", "오답 노트", () => { state.quizMode = "오답"; go("quiz"); }, "tile-wrong"),
        tile("check", "amber", "수행평가 점검", () => go("rubric"), "tile-rubric")),
      h("p", { class: "label", text: "내 자료" }),
      rows,
      h("div", { class: "row" }, h("button", { class: "sm-pill", type: "button", onclick: () => { state.study = "자료"; render(); } }, "자료 올리기·관리")),
    ];
  }

  function studyMaterials() {
    const msg = box();
    const picker = filePicker("file", ".pdf,.txt,.md", "파일 고르기", "자료 파일 고르기");
    const fileInput = picker.input;
    const upBtn = h("button", { class: "btn", type: "submit", id: "upload-btn" }, icon("upload"), "올리기");
    const form = h("form", { id: "upload-form", onsubmit: async (ev) => {
      ev.preventDefault();
      const file = fileInput.files[0];
      if (!file) { setBox(msg, "error", "올릴 파일을 먼저 골라 주세요."); return; }
      upBtn.disabled = true;
      setBox(msg, "busy", "자료를 읽고 있어요...");
      try {
        const fd = new FormData(); fd.append("file", file);
        const created = await api("/api/materials", { method: "POST", body: fd });
        await loadMaterials(created.id);
        state.study = "자료";
        render();
        const again = document.getElementById("upload-msg");
        if (again) setBox(again, "ok", "올렸어요. 요약하거나 질문해 보세요.");
      } catch (e) { setBox(msg, "error", e.message); upBtn.disabled = false; }
    } },
      h("p", { class: "field", text: "PDF, TXT, MD 파일 (최대 20MB)" }),
      picker.el, h("div", { class: "row" }, upBtn));
    msg.id = "upload-msg";

    const list = h("ul", { class: "rows", id: "material-list" });
    const delMsg = box();
    for (const m of state.materials) {
      const on = m.id === state.selId;
      list.appendChild(h("li", {},
        h("div", { class: "rowwrap" },
          h("button", { class: "rowitem", type: "button", "aria-pressed": on ? "true" : "false", onclick: () => { state.selId = m.id; store("sel", m.id); refreshOpenWrong(); render(); } },
            h("span", { class: "grow" }, h("span", { class: "nm", text: m.filename }),
              h("span", { class: "meta", text: `${m.page_count}쪽 · ${m.has_summary ? "요약 있음" : "요약 없음"}${on ? " · 선택됨" : ""}` }))),
          h("button", { class: "btn danger small", type: "button", "aria-label": `${m.filename} 삭제`, onclick: () => removeMaterial(m, delMsg) }, icon("trash"), "삭제"))));
    }
    return [
      h("div", { class: "card" }, h("h2", { class: "h2", style: "margin-top:0", text: "자료 올리기" }),
        h("p", { class: "muted", text: "원본 파일은 저장하지 않고 글자만 이 기기에 보관해요. 지우기 전까지 남아 있어요. 개인정보는 올리지 마세요." }), form, msg),
      h("p", { class: "label", text: `내 자료 ${state.materials.length}개` }),
      state.materials.length ? list : empty("doc", "아직 올린 자료가 없어요", "위에서 PDF나 텍스트 파일을 올리면 여기에 나와요."),
      delMsg,
    ];
  }

  async function removeMaterial(m, msg) {
    if (!confirm(`"${m.filename}" 자료와 요약, 질문 기록, 문제를 모두 지울까요? 되돌릴 수 없어요.`)) return;
    try {
      await api(`/api/materials/${m.id}`, { method: "DELETE" });
      delete state.chat[m.id]; delete state.drafts[m.id]; delete state.summ[m.id];
      delete state.quizzes[m.id];
      await loadMaterials(state.selId === m.id ? "" : state.selId);
      render();
    } catch (e) { setBox(msg, "error", e.message); }
  }

  function studySummary() {
    const m = sel();
    if (!m) return needMaterial("요약");
    const sm = state.summ[m.id] || (state.summ[m.id] = { pending: false, error: "", text: "" });
    const msg = box();
    const out = h("div", { class: "summary", id: "summary" });
    out.textContent = sm.text;
    const make = h("button", { class: "btn", type: "button", id: "summary-btn", disabled: sm.pending }, m.has_summary ? "요약 보기" : "요약 만들기");
    const again = h("button", { class: "btn secondary", type: "button", id: "summary-refresh-btn", disabled: sm.pending }, "다시 만들기");
    again.classList.toggle("hidden", !m.has_summary);
    if (sm.pending) setBox(msg, "busy", "요약을 만들고 있어요. 긴 자료는 1분 가까이 걸릴 수 있어요. 이 화면을 닫지 말고 기다려 주세요.");
    else if (sm.error) setBox(msg, "error", sm.error, () => run(!!sm.lastRefresh));
    async function run(refresh) {
      if (sm.pending) return;
      const id = m.id;
      sm.pending = true; sm.error = ""; sm.lastRefresh = !!refresh;
      render();  // 만드는 중에는 화면을 옮겼다 돌아와도 같은 진행 상태로 보입니다.
      try {
        const data = await api(`/api/materials/${id}/summary${refresh ? "?refresh=1" : ""}`, { method: "POST" });
        m.has_summary = true; sm.text = data.summary;
      } catch (e) { sm.error = e.message; }
      finally { sm.pending = false; }
      // 끝났을 때 같은 요약 화면이 열려 있으면 다시 그려 결과를 보여 줍니다(처음 그린 화면은 이미 사라졌을 수 있음).
      if (state.tab === "study" && state.study === "요약" && state.selId === id) render();
    }
    make.addEventListener("click", () => run(false));
    again.addEventListener("click", () => run(true));
    if (m.has_summary && !sm.text && !sm.pending && !sm.error) setTimeout(() => { if (out.isConnected) run(false); }, 0);
    return h("div", { class: "card" },
      h("p", { style: "font-weight:700;overflow-wrap:anywhere", text: m.filename }),
      h("div", { class: "row" }, make, again), msg, out,
      notice("AI 요약은 틀릴 수 있어요. 원본 자료와 함께 확인하세요."));
  }

  // ----- 질문(채팅) -----
  function studyAsk() {
    const m = sel();
    if (!m) return needMaterial("질문");
    const list = state.chat[m.id] || (state.chat[m.id] = []);
    const chat = h("div", { class: "chat", id: "chat" });
    const msg = box();
    const ta = h("textarea", { id: "question", maxlength: "500", "aria-label": "질문", placeholder: "이 자료에서 궁금한 걸 물어보세요" });
    ta.value = state.drafts[m.id] || "";
    ta.addEventListener("input", () => { state.drafts[m.id] = ta.value; });
    const send = h("button", { class: "send", type: "submit", id: "ask-btn", "aria-label": "질문 보내기", disabled: !!state.asking[m.id] }, icon("send"));
    ta.setAttribute("rows", "1");
    const grow = () => { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 140) + "px"; };
    ta.addEventListener("input", grow);
    ta.addEventListener("keydown", (ev) => { if (ev.key === "Enter" && !ev.shiftKey && !ev.isComposing) { ev.preventDefault(); form.requestSubmit(); } });
    // 질문 한 번 보내기. fromBox=true 면 입력칸에서 온 질문이라 입력칸을 비웁니다(다시 시도는 비우지 않음).
    async function doAsk(question, fromBox) {
      const id = m.id;
      if (state.asking[id]) return;  // Enter로 보내도 버튼과 같은 잠금을 따릅니다.
      state.asking[id] = true;
      send.disabled = true;
      if (fromBox) { ta.value = ""; state.drafts[id] = ""; }
      setBox(msg, "busy", "답을 찾고 있어요. 보통 몇 초, 길면 1분쯤 걸려요.");
      try {
        const data = await postJson(`/api/materials/${id}/ask`, { question });
        (state.chat[id] || (state.chat[id] = [])).push({ q: question, data, at: new Date() });
        // 실패 뒤 입력칸에 되살려 둔 같은 질문이 남아 있으면 비웁니다(다시 보내 중복 질문이 되지 않게). 새로 쓴 다른 글은 그대로 둡니다.
        if ((state.drafts[id] || "").trim() === question) {
          state.drafts[id] = "";
          const box0 = document.getElementById("question");
          if (box0 && state.selId === id && box0.value.trim() === question) box0.value = "";
        }
        // 기다리는 사이 화면을 옮겼다 돌아왔다면 처음 만든 화면은 이미 사라졌으므로, 지금 떠 있는 대화 칸에 그립니다.
        const live = document.getElementById("chat");
        if (live && state.tab === "study" && state.study === "질문" && state.selId === id) { fillChat(live, m); setBox(msg, "", ""); }
      } catch (e) {
        if (fromBox && !state.drafts[id]) { state.drafts[id] = question; if (ta.isConnected && state.selId === id) ta.value = question; }
        if (msg.isConnected) setBox(msg, "error", e.message, () => doAsk(question, false));
      } finally {
        delete state.asking[id];
        send.disabled = false;
        const live = document.getElementById("ask-btn");  // 화면을 옮겼다 돌아왔다면 지금 떠 있는 버튼도 풀어 줍니다.
        if (live && state.selId === id) live.disabled = false;
      }
    }
    const form = h("form", { class: "composer", id: "ask-form", onsubmit: (ev) => {
      ev.preventDefault();
      const question = ta.value.trim();
      if (question) doAsk(question, true);
    } }, ta, send);
    fillChat(chat, m);
    setTimeout(grow, 0);
    return [chat, msg, form, h("p", { class: "notice" }, keepSpan("AI 답은 틀릴 수 있어요. 최신 내용은 원문을 확인해 주세요. 질문하면 이 기기에 기록이 남고 {days}일 뒤 자동으로 지워져요. 개인정보는 입력하지 마세요."))];
  }

  function fillChat(chat, m) {
    const list = state.chat[m.id] || [];
    chat.textContent = "";
    if (!list.length) { chat.appendChild(empty("chat", "이 자료로 물어볼 수 있어요", "자료에 나온 내용으로만 답하고, 근거가 된 쪽을 함께 보여 줘요. 쪽 번호를 눌러 원문 발췌를 확인해요.")); return; }
    for (const item of list) {
      chat.appendChild(h("div", { class: "me", text: item.q }));
      chat.appendChild(answerBlock(m, item.q, item.data));
    }
    const form = document.getElementById("ask-form");
    if (form) requestAnimationFrame(() => form.scrollIntoView({ block: "end", behavior: "smooth" }));
  }

  function answerBlock(m, question, data) {
    const col = h("div", { class: "col" }, h("div", { class: "who", text: "AI 도우미" }), h("div", { class: "bubble", text: data.answer }));
    for (const s of data.sources || []) {
      col.appendChild(h("button", { class: "src", type: "button", onclick: () => openSource(m, s, question) },
        h("span", { class: "box-ico" }, icon("doc")),
        h("span", {}, h("b", { text: `출처: ${m.filename} · ${s.page}쪽` }), h("small", { text: "최신 여부는 원문을 확인해 주세요" }))));
    }
    const copy = h("button", { class: "iconbtn", type: "button", "aria-label": "답 복사", onclick: async () => {
      try { await navigator.clipboard.writeText(data.answer); copy.setAttribute("aria-label", "복사했어요"); } catch (_) {}
    } }, icon("copy"));
    col.appendChild(h("div", { class: "acts" }, copy));
    return h("div", { class: "ai" }, h("span", { class: "avatar" }, icon("spark")), col);
  }

  // ----- 출처 확인 시트 -----
  function tokens(q) {
    return (q.match(/[0-9A-Za-z가-힣]{2,}/g) || []).map((t) => (t.length > 2 ? t.slice(0, t.length - 1) : t));
  }
  function highlighted(text, question) {
    const toks = tokens(question);
    const frag = document.createDocumentFragment();
    const parts = text.match(/[^.!?。\n]+[.!?。]?\s*|\n/g) || [text];
    for (const p of parts) {
      if (toks.some((t) => p.includes(t))) frag.appendChild(h("mark", { text: p })); else frag.appendChild(document.createTextNode(p));
    }
    return frag;
  }
  let sheetReturn = null;
  function docKind(name) { return /\.pdf$/i.test(name) ? "PDF 문서" : /\.md$/i.test(name) ? "마크다운 문서" : "텍스트 문서"; }
  function openSource(m, s, question) {
    const sheet = document.getElementById("sheet");
    sheetReturn = document.activeElement;
    sheet.textContent = "";
    const close = () => { sheet.classList.add("hidden"); document.body.style.overflow = ""; if (sheetReturn && sheetReturn.focus) sheetReturn.focus(); };
    const excerpt = h("p", { class: "excerpt" }); excerpt.appendChild(highlighted(String(s.excerpt || ""), question));
    sheet.append(h("div", { class: "inner" },
      appbar("출처 확인", { back: close, backLabel: "돌아가기" }),
      h("div", { class: "card docinfo" },
        h("span", { class: "box-ico" }, icon("doc")),
        h("div", { class: "grow" }, h("div", { class: "nm", text: m.filename }), h("div", { class: "muted", text: `근거 [${s.number}] · ${s.page}쪽` })),
        h("span", { class: "chipline", text: docKind(m.filename) })),
      h("div", { class: "paper" }, excerpt, h("div", { class: "pageno", text: `${s.page}쪽` })),
      h("p", { class: "info" }, icon("info"), h("span", { text: "일부 발췌본이에요. 질문과 맞는 줄은 파랗게 표시했어요. 정확한 내용은 원문을 확인하세요." })),
      h("button", { class: "btn big block", type: "button", id: "source-back-btn", onclick: () => { close(); state.selId = m.id; store("sel", m.id); state.study = "자료"; go("study"); } },
        h("span", { style: "display:flex;align-items:center;gap:8px" }, icon("book"), "공부 탭에서 이 자료 보기"), icon("chev"))));
    sheet.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    sheet.scrollTop = 0;
    sheet.querySelector("button").focus();
  }
  document.addEventListener("keydown", (e) => {
    const sheet = document.getElementById("sheet");
    if (e.key === "Escape" && !sheet.classList.contains("hidden")) { sheet.classList.add("hidden"); document.body.style.overflow = ""; }
  });

  // ----- 기록 -----
  function studyHistory() {
    const m = sel();
    if (!m) return needMaterial("질문 기록");
    const holder = h("div");
    const msg = box();
    holder.appendChild(box("busy", "기록을 불러오고 있어요..."));
    (async () => {
      try {
        const data = await api(`/api/materials/${m.id}/history`);
        if (Number(data.retention_days) > 0) { state.retentionDays = Number(data.retention_days); applyRetention(); }
        holder.textContent = "";
        if (!data.entries.length) { holder.appendChild(empty("chat", "아직 질문 기록이 없어요", "질문하면 근거가 있는 답이 여기에 남아요.")); }
        else {
          holder.appendChild(h("div", { class: "row end", style: "margin-top:0" },
            h("button", { class: "btn danger small", type: "button", onclick: async () => {
              if (!confirm("이 자료의 질문 기록을 모두 지울까요?")) return;
              try { await api(`/api/materials/${m.id}/history`, { method: "DELETE" }); delete state.chat[m.id]; render(); } catch (e) { setBox(msg, "error", e.message); }
            } }, icon("trash"), "기록 모두 지우기")));
          const ul = h("ul", { class: "list" });
          for (const e of data.entries) {
            const when = new Date(e.created_at);
            ul.appendChild(h("li", { class: "card" },
              h("p", { class: "when", text: isNaN(when) ? "" : when.toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "numeric", minute: "2-digit" }) }),
              h("div", { class: "me", style: "margin-top:8px", text: e.question }),
              h("div", { style: "margin-top:12px" }, answerBlock(m, e.question, e)),
              h("div", { class: "row end" }, h("button", { class: "btn danger small", type: "button", "aria-label": "이 기록 지우기", onclick: async () => {
                try {
                  await api(`/api/materials/${m.id}/history/${e.id}`, { method: "DELETE" });
                  state.chat[m.id] = (state.chat[m.id] || []).filter((it) => !(it.q === e.question && it.data.answer === e.answer));  // 지운 기록이 질문 화면에 남지 않게
                  render();
                } catch (err) { setBox(msg, "error", err.message); }
              } }, icon("trash"), "지우기"))));
          }
          holder.appendChild(ul);
        }
        holder.appendChild(notice(data.notice || "질문 기록은 이 기기에만 저장되고 일정 기간 뒤 자동 삭제돼요."));
      } catch (e) { holder.textContent = ""; holder.appendChild(box("error", e.message)); }
    })();
    return [holder, msg];
  }

  // ---------- 문제·오답 ----------
  function renderQuiz() {
    const wrap = h("div");
    wrap.append(appbar("문제·오답", { back: () => go("home"), backLabel: "홈으로" }));
    const m = sel();
    if (!m) { wrap.append(needMaterial("문제 풀기")); return wrap; }
    wrap.append(seg(["새 문제", "오답"], state.quizMode, (c) => { state.quizMode = c; render(); }, "문제 메뉴"));
    if (state.quizzes[m.id] && state.quizMode === "새 문제") wrap.append(quizRunner(state.quizzes[m.id]));
    else wrap.append(...[].concat(state.quizMode === "새 문제" ? quizSetup(m) : wrongNotes(m)));
    return wrap;
  }

  function quizSetup(m) {
    const msg = box();
    let difficulty = "보통";
    const diffRow = h("div", { class: "chips", role: "group", "aria-label": "난이도", style: "margin:0;padding:0" });
    function drawDiff() {
      diffRow.textContent = "";
      for (const d of ["쉬움", "보통", "어려움"]) diffRow.appendChild(h("button", { class: "chip", type: "button", "aria-selected": d === difficulty ? "true" : "false", onclick: () => { difficulty = d; drawDiff(); } }, d));
    }
    drawDiff();
    const count = h("select", { id: "quiz-count", "aria-label": "문제 수" }, [3, 5, 7, 10].map((n) => h("option", { value: String(n), selected: n === 5 }, `${n}문제`)));
    const gen = state.gen[m.id] || (state.gen[m.id] = { pending: false, error: "" });
    // 같은 설정(난이도·문제 수)으로 문제 만들기. 다시 시도도 마지막으로 보낸 설정을 그대로 씁니다.
    async function generate(req) {
      if (gen.pending || state.qbusy[m.id]) return;  // 오답 다시 풀기와 같은 잠금을 함께 씁니다
      gen.pending = true; state.qbusy[m.id] = true; gen.error = ""; gen.last = req;
      render();  // 만드는 중에는 화면을 옮겼다 돌아와도 버튼이 잠겨 있습니다.
      try {
        const data = await postJson(`/api/materials/${m.id}/quizzes`, req);
        // 문제는 자료마다 따로 보관하므로, 다른 자료의 늦은 응답이 풀던 문제를 건드리지 않습니다.
        installQuiz(m.id, data, gen);
      } catch (e) { gen.error = e.message; }
      finally { gen.pending = false; delete state.qbusy[m.id]; }
      if (state.tab === "quiz") render();
    }
    const go1 = h("button", { class: "btn block", type: "button", id: "quiz-btn", disabled: gen.pending || !!state.qbusy[m.id], onclick: () => generate({ difficulty, count: Number(count.value) }) }, "문제 만들기");
    if (gen.pending || state.qbusy[m.id]) setBox(msg, "busy", "문제를 만들고 있어요. 보통 몇 초, 길면 1분쯤 걸려요.");
    else if (gen.error) setBox(msg, "error", gen.error, gen.last ? () => generate(gen.last) : undefined);
    return h("div", { class: "card" },
      h("p", { style: "font-weight:700;overflow-wrap:anywhere", text: m.filename }),
      h("label", { class: "field", text: "난이도" }), diffRow,
      h("label", { class: "field", for: "quiz-count", text: "문제 수" }), count,
      h("div", { class: "row" }, go1), msg,
      notice("AI가 만든 문제와 정답은 틀릴 수 있어요. 해설에 적힌 쪽의 원문으로 꼭 확인하세요."));
  }

  function quizRunner(cur) {
    const qz = cur;
    const data = qz.data;
    const wrap = h("div");
    const msg = box();
    if (data.shortfall_message) wrap.append(box("", data.shortfall_message));
    const done = !!qz.result;
    if (done) {
      wrap.append(h("div", { class: "card" },
        h("p", { class: "muted", text: "결과" }),
        h("p", { class: "score", text: `${qz.result.score} / ${qz.result.total}` }),
        h("p", { class: "muted", text: `틀린 문제 ${qz.result.total - qz.result.score}개는 오답 노트에 모았어요.` })));
    }
    data.questions.forEach((q, i) => {
      const r = done ? qz.result.results[i] : null;
      const mark = r ? penMark(r.selected === r.answer) : null;  // 채점 뒤에만 빨간펜 표시
      const card = h("div", { class: "card q" }, h("h3", { class: "qhead" },
        h("span", { class: "qno" }, h("span", { class: "qdigit", text: String(i + 1) }), mark),
        h("span", { class: "qtext", text: q.question })));
      q.choices.forEach((c, k) => {
        const n = k + 1;
        let cls = "choice";
        if (r) { if (n === r.answer) cls += " right"; else if (n === r.selected) cls += " wrong"; }
        card.appendChild(h("button", { class: cls, type: "button", disabled: done || qz.grading, "aria-pressed": qz.picked[i] === n ? "true" : "false",
          onclick: () => { qz.picked[i] = n; render(); } }, h("span", { class: "num", text: String(n) }), h("span", { text: c })));
      });
      if (r) card.appendChild(h("p", { class: "explain", text: `${r.selected === r.answer ? "정답" : (r.selected ? `정답은 ${r.answer}번` : `안 풀었어요. 정답은 ${r.answer}번`)} · ${r.explanation} (${r.page}쪽)` }));
      wrap.append(card);
    });
    if (!done) {
      const left = qz.picked.filter((p) => p === null).length;
      const submit = h("button", { class: "btn block", type: "button", id: "submit-btn", disabled: qz.grading, onclick: async () => {
        if (qz.grading) return;
        if (left && !confirm(`아직 안 푼 문제가 ${left}개 있어요. 그래도 채점할까요?`)) return;
        qz.grading = true; qz.error = "";
        render();  // 선택지와 채점 버튼을 잠근 모습으로 다시 그립니다.
        try { qz.result = await postJson(`/api/quizzes/${data.id}/submit`, { answers: qz.picked }); refreshOpenWrong(); }
        catch (e) { qz.error = e.message; }
        finally { qz.grading = false; }
        if (state.quizzes[qz.data.material_id] === qz && state.tab === "quiz") render();
      } }, left ? `채점하기 (안 푼 문제 ${left}개)` : "채점하기");
      if (qz.grading) setBox(msg, "busy", "채점하고 있어요...");
      else if (qz.error) setBox(msg, "error", qz.error);
      wrap.append(h("div", { class: "row" }, submit), msg);
    } else {
      wrap.append(h("div", { class: "row" },
        h("button", { class: "btn", type: "button", onclick: () => { delete state.quizzes[data.material_id]; render(); } }, "새 문제 만들기"),
        h("button", { class: "btn secondary", type: "button", onclick: () => { delete state.quizzes[data.material_id]; state.quizMode = "오답"; render(); } }, "오답 노트 보기")));
    }
    wrap.append(notice(data.notice || "AI가 만든 문제는 틀릴 수 있어요."));
    return wrap;
  }

  // 늦게 온 문제를 자료의 현재 문제로 넣습니다. 이미 풀고 있는(채점 전) 문제가 있으면 지키고, 채점이 끝난 문제는 새 문제로 바꿉니다.
  function installQuiz(materialId, quiz, gen) {
    const cur = state.quizzes[materialId];
    if (cur && !cur.result) { gen.error = "이미 풀고 있는 문제가 있어요. 먼저 그 문제를 끝내 주세요."; return false; }
    state.quizzes[materialId] = { data: quiz, picked: quiz.questions.map(() => null), result: null };
    return true;
  }

  function wrongNotes(m) {
    const gen = state.regen[m.id] || (state.regen[m.id] = { pending: false, error: "" });
    // "틀린 문제 다시 풀기" 요청. 오류 상자의 다시 시도도 같은 함수를 부릅니다.
    async function startRetry() {
      if (gen.pending || state.qbusy[m.id]) return;  // 문제 만들기와 같은 잠금을 함께 씁니다(오류 상태만 따로 둠).
      gen.pending = true; state.qbusy[m.id] = true; gen.error = "";
      render();
      try {
        const quiz = await postJson(`/api/materials/${m.id}/wrong-notes/quiz`, {});
        if (installQuiz(m.id, quiz, gen)) state.quizMode = "새 문제";
      } catch (e) { gen.error = e.message; }
      finally { gen.pending = false; delete state.qbusy[m.id]; }
      if (state.tab === "quiz") render();
    }
    const holder = h("div");
    const msg = box();
    holder.appendChild(box("busy", "오답 노트를 불러오고 있어요..."));
    (async () => {
      try {
        const data = await api(`/api/materials/${m.id}/wrong-notes`);
        state.openWrong[m.id] = data.open_count;  // 홈·더보기 칩도 같은 숫자를 보이도록
        holder.textContent = "";
        if (!data.items.length) holder.appendChild(empty("quiz", "틀린 문제가 아직 없어요", "문제를 풀고 틀리면 여기에 모아서 다시 풀 수 있어요."));
        else {
          holder.appendChild(h("div", { class: "card" },
            h("p", { style: "font-weight:700;font-size:17px", text: `다시 풀 문제 ${data.open_count}개` }),
            h("p", { class: "muted", text: `해결한 문제 ${data.resolved_count}개` }),
            h("div", { class: "row" }, h("button", { class: "btn", type: "button", id: "retry-btn", disabled: data.open_count === 0 || gen.pending || !!state.qbusy[m.id], onclick: startRetry }, "틀린 문제 다시 풀기"))));
          if (gen.pending || state.qbusy[m.id]) setBox(msg, "busy", "문제를 만들고 있어요...");
          else if (gen.error) setBox(msg, "error", gen.error, startRetry);
          holder.appendChild(h("p", { class: "count", text: `${data.items.length}개의 오답 기록` }));
          const ul = h("ul", { class: "list" });
          for (const it of data.items) {
            ul.appendChild(h("li", { class: "card" },
              h("span", { class: "tag" + (it.status === "resolved" ? " yes" : ""), text: it.status === "resolved" ? "해결" : "다시 풀기" }),
              h("p", { style: "margin-top:8px;font-weight:700;overflow-wrap:anywhere", text: it.question }),
              h("p", { class: "muted", text: `정답: ${it.answer}번 ${it.choices[it.answer - 1] || ""} · ${it.page}쪽 · 틀린 횟수 ${it.wrong_count}` }),
              h("p", { class: "explain", text: it.explanation })));
          }
          holder.appendChild(ul);
        }
        holder.appendChild(notice(data.notice));
      } catch (e) { holder.textContent = ""; holder.appendChild(box("error", e.message)); }
    })();
    return [holder, msg];
  }

  // ---------- 수행평가 ----------
  const rub = { pickError: "", resizing: false, pickToken: 0, chosen: null, previewUrl: "", reading: false, readError: "", token: 0, view: "점검", mode: "list", list: null, draft: null, current: null, results: {}, texts: {}, pending: {}, errors: {} };
  const VERDICT = { "충분": ["ok", "충분"], "부족": ["warn", "부족"], "확인필요": ["note", "확인 필요"] };

  function renderRubric() {
    const wrap = h("div");
    wrap.append(appbar("수행평가", { back: () => go("home"), backLabel: "홈으로" }));
    if (rub.mode === "edit") wrap.append(...[].concat(rubricEditor()));
    else if (rub.mode === "check") wrap.append(...[].concat(rubricCheck()));
    else wrap.append(...[].concat(rubricList()));
    return wrap;
  }

  function rubricList() {
    const holder = h("div");
    const msg = box();
    const preview = h("img", { class: "preview hidden", alt: "고른 기준표 사진 미리보기" });
    const fileName = h("p", { class: "muted", style: "color:rgba(255,255,255,.8)", text: "아직 고른 사진이 없어요" });
    const readBtn = h("button", { class: "btn light block", type: "button", id: "rubric-read-btn", disabled: true, onclick: async () => {
      if (!rub.chosen) { setBox(msg, "error", "기준표 사진을 먼저 찍거나 골라 주세요."); return; }
      if (rub.reading) return;  // 읽는 중에는 다른 사진을 골라도 버튼이 잠겨 있습니다.
      rub.reading = true; rub.readError = "";
      readBtn.disabled = true;
      const mine = ++rub.token;  // 직접 입력을 시작하거나 돌아가면 이 요청의 결과는 버립니다.
      setBox(msg, "busy", "사진에서 기준표를 읽고 있어요. 길면 1분쯤 걸려요.");
      try {
        const fd = new FormData(); fd.append("image", rub.chosen);
        const data = await api("/api/rubrics/draft", { method: "POST", body: fd });
        if (mine === rub.token && rub.mode === "list") { rub.draft = data.draft; rub.draftNotice = data.notice; rub.mode = "edit"; clearChosen(); }
      } catch (e) { if (mine === rub.token) rub.readError = e.message; }
      finally { rub.reading = false; }
      if (state.tab === "rubric") render();
    } }, "기준표 읽기");
    if (rub.resizing) { setBox(msg, "busy", "사진을 줄이고 있어요..."); readBtn.disabled = true; }
    else if (rub.reading) setBox(msg, "busy", "사진에서 기준표를 읽고 있어요. 길면 1분쯤 걸려요.");
    else if (rub.pickError) setBox(msg, "error", rub.pickError);
    else if (rub.readError) setBox(msg, "error", rub.readError, () => readBtn.click());
    function clearChosen() { if (rub.previewUrl) URL.revokeObjectURL(rub.previewUrl); rub.chosen = null; rub.previewUrl = ""; }
    // 다시 그려도(오류·화면 이동 뒤) 고른 사진을 그대로 보여 주어, 같은 사진으로 다시 읽을 수 있게 합니다.
    if (rub.chosen) { preview.src = rub.previewUrl; preview.classList.remove("hidden"); fileName.textContent = `${rub.chosen.name} · ${Math.max(1, Math.round(rub.chosen.size / 1024))}KB`; readBtn.disabled = rub.reading || rub.resizing; }
    function pick(input) {
      input.addEventListener("change", async () => {
        const f = input.files[0];
        input.value = "";  // 같은 사진을 다시 골라도 change 가 나게 합니다
        if (!f) return;
        const mine = ++rub.pickToken;
        rub.resizing = true;
        setBox(msg, "busy", "사진을 줄이고 있어요...");
        readBtn.disabled = true;
        let photo = f, failure = "";
        try {
          // 휴대폰 사진은 5MB를 넘기 쉬워서 긴 변 1600px, JPEG 0.85로 줄여 올립니다(디코딩이 안 되면 안내).
          if (window.ImageUtil) photo = await window.ImageUtil.shrinkImage(f);
        } catch (e) { failure = e.message; }
        if (mine !== rub.pickToken) return;  // 그 사이 다른 사진을 골랐다면 이 결과는 버립니다(마지막 선택만 상태를 끝냄)
        rub.resizing = false;
        if (failure) rub.pickError = failure;
        else {
          rub.pickError = "";
          if (rub.previewUrl) URL.revokeObjectURL(rub.previewUrl);
          rub.chosen = photo; rub.previewUrl = URL.createObjectURL(photo);
        }
        // 줄이는 사이 화면을 옮겼다 돌아왔어도 지금 떠 있는 화면에 반영되도록, 수행평가 첫 화면이면 다시 그립니다.
        if (state.tab === "rubric" && rub.mode === "list") render();
      });
      return input;
    }
    const cam = pick(h("input", { type: "file", id: "rubric-camera", accept: "image/*", capture: "environment", class: "sr-only", "aria-label": "사진 찍기" }));
    const album = pick(h("input", { type: "file", id: "rubric-image", accept: "image/png,image/jpeg,image/webp", class: "sr-only", "aria-label": "앨범에서 사진 고르기" }));
    holder.append(
      h("div", { class: "snap" },
        h("span", { class: "hint", text: "기준표 전체가 보이게 찍어 주세요 · 이름·학번은 가려 주세요" }),
        preview, fileName,
        h("div", { class: "row", style: "justify-content:center" },
          cam, album,
          h("label", { class: "btn light", for: "rubric-camera" }, icon("camera"), "사진 찍기"),
          h("label", { class: "btn ghost", for: "rubric-image" }, icon("image"), "앨범에서 고르기")),
        h("div", { class: "row" }, readBtn), msg),
      h("p", { class: "count", text: "PNG, JPEG, WebP · 최대 5MB. 무료 AI는 올린 사진이 서비스 개선에 쓰일 수 있어요." }),
      h("div", { class: "softpills" }, h("button", { class: "softpill", type: "button", id: "rubric-manual-btn", onclick: () => {
        rub.token++;
        rub.draft = { title: "", elements: [{ name: "", max_points: 5, levels: [{ points: 5, criterion: "" }, { points: 0, criterion: "" }] }] };
        rub.draftNotice = ""; rub.mode = "edit"; render();
      } }, icon("note"), "직접 입력")),
      h("p", { class: "label", text: "내 기준표" }));
    const list = h("div", { id: "rubric-list" }, box("busy", "불러오고 있어요..."));
    holder.append(list);
    (async () => {
      try {
        rub.list = await api("/api/rubrics");
        list.textContent = "";
        if (!rub.list.length) { list.appendChild(empty("check", "아직 기준표가 없어요", "위에서 기준표 사진을 올리면 여기에 저장돼요.")); return; }
        const ul = h("ul", { class: "mats" });
        for (const r of rub.list) {
          ul.appendChild(h("li", { class: "mat" },
            h("button", { class: "pick", type: "button", onclick: async () => {
              try { rub.current = await api(`/api/rubrics/${r.id}`); rub.mode = "check"; render(); } catch (e) { setBox(msg, "error", e.message); }
            } }, h("span", { class: "grow" }, h("span", { class: "nm", text: r.title || "이름 없는 기준표" }), h("span", { class: "meta", text: `요소 ${r.element_count}개` }))),
            h("button", { class: "btn danger small", type: "button", "aria-label": `${r.title || "기준표"} 삭제`, onclick: async () => {
              if (!confirm("이 기준표를 지울까요? 되돌릴 수 없어요.")) return;
              try { await api(`/api/rubrics/${r.id}`, { method: "DELETE" }); delete rub.results[r.id]; render(); } catch (e) { setBox(msg, "error", e.message); }
            } }, icon("trash"), "삭제")));
        }
        list.appendChild(ul);
      } catch (e) { list.textContent = ""; list.appendChild(box("error", e.message)); }
    })();
    holder.append(notice("점검은 참고용이에요. 점수를 정하는 건 선생님이에요."));
    return holder;
  }

  function rubricEditor() {
    const d = rub.draft;
    const msg = box();
    const wrap = h("div");
    const title = h("input", { type: "text", id: "rubric-title", maxlength: "100", "aria-label": "기준표 이름", placeholder: "예: 국어 발표 수행평가" });
    title.value = d.title || "";
    title.addEventListener("input", () => { d.title = title.value; });
    wrap.append(
      h("button", { class: "btn secondary small", type: "button", onclick: () => { rub.token++; rub.mode = "list"; render(); } }, icon("back"), "돌아가기"),
      h("p", { class: "notice", text: rub.draftNotice || "AI가 읽은 내용이 아니라면 직접 채워 주세요." }),
      h("label", { class: "field", for: "rubric-title", text: "기준표 이름" }), title);
    d.elements.forEach((el, i) => wrap.append(elementEditor(d, el, i)));
    wrap.append(h("div", { class: "row" }, h("button", { class: "btn secondary", type: "button", onclick: () => {
      d.elements.push({ name: "", max_points: 5, levels: [{ points: 5, criterion: "" }, { points: 0, criterion: "" }] }); render();
    } }, "요소 추가")));
    const ok = h("button", { class: "btn block", type: "button", id: "rubric-confirm-btn", onclick: async () => {
      ok.disabled = true; setBox(msg, "busy", "저장하고 있어요...");
      try {
        const saved = await postJson("/api/rubrics", d);
        rub.current = saved; rub.mode = "check"; render();
      } catch (e) { setBox(msg, "error", e.message); ok.disabled = false; }
    } }, "맞아요, 이 기준표로 할게요");
    wrap.append(h("div", { class: "row" }, ok), msg);
    return wrap;
  }

  function elementEditor(d, el, i) {
    const num = (value, onchange, label) => {
      const inp = h("input", { type: "text", inputmode: "decimal", "aria-label": label, style: "width:80px" });
      inp.value = String(value);
      inp.addEventListener("input", () => onchange(inp.value.trim() === "" ? "" : Number(inp.value)));
      return inp;
    };
    const name = h("input", { type: "text", maxlength: "100", "aria-label": `${i + 1}번 요소 이름`, placeholder: "평가 요소 이름" });
    name.value = el.name;
    name.addEventListener("input", () => { el.name = name.value; });
    const card = h("div", { class: "card", style: "margin-top:12px" },
      h("div", { class: "row", style: "margin-top:0" }, h("strong", { text: `${i + 1}번` }), h("span", { class: "grow" }),
        d.elements.length > 1 ? h("button", { class: "btn danger small", type: "button", "aria-label": `${i + 1}번 요소 지우기`, onclick: () => { d.elements.splice(i, 1); render(); } }, icon("trash"), "지우기") : null),
      name,
      h("label", { class: "field", text: "배점(만점)" }), num(el.max_points, (v) => { el.max_points = v; }, `${i + 1}번 배점`),
      h("label", { class: "field", text: "수준별 기준" }));
    el.levels.forEach((lv, k) => {
      const crit = h("textarea", { "aria-label": `${i + 1}번 요소 ${k + 1}번째 수준 기준`, style: "min-height:64px", placeholder: "이 점수를 받는 기준" });
      crit.value = lv.criterion;
      crit.addEventListener("input", () => { lv.criterion = crit.value; });
      card.append(h("div", { class: "row", style: "align-items:flex-start" },
        num(lv.points, (v) => { lv.points = v; }, `${i + 1}번 요소 ${k + 1}번째 수준 점수`), h("div", { class: "grow" }, crit),
        el.levels.length > 1 ? h("button", { class: "btn danger small", type: "button", "aria-label": "이 수준 지우기", onclick: () => { el.levels.splice(k, 1); render(); } }, icon("trash")) : null));
    });
    card.append(h("div", { class: "row" }, h("button", { class: "btn secondary small", type: "button", onclick: () => { el.levels.push({ points: 0, criterion: "" }); render(); } }, "수준 추가")));
    return card;
  }

  function rubricCheck() {
    const r = rub.current;
    const results = rub.results[r.id] || (rub.results[r.id] = {});
    const texts = rub.texts[r.id] || (rub.texts[r.id] = {});
    const wrap = h("div");
    wrap.append(
      h("button", { class: "btn secondary small", type: "button", onclick: () => { rub.mode = "list"; render(); } }, icon("back"), "기준표 목록"),
      h("h2", { class: "title", style: "font-size:22px;margin-top:16px", text: r.title || "수행평가 기준표" }),
      seg(["점검", "기준표"], rub.view, (v) => { rub.view = v; render(); }, "수행평가 보기"),
      h("p", { class: "count", text: rub.view === "점검"
        ? `${Object.keys(results).length}개의 결과 · 요소 ${r.elements.length}개 (한 번에 한 요소씩 점검해요)`
        : `요소 ${r.elements.length}개` }));
    r.elements.forEach((el, i) => {
      if (rub.view === "기준표") {
        wrap.append(h("div", { class: "card", style: "margin-top:12px" },
          h("h3", { style: "font-size:17px", text: `${i + 1}. ${el.name}` }),
          h("p", { class: "muted", text: `배점 ${el.max_points}점` }),
          h("table", { class: "grid", style: "margin-top:8px" }, el.levels.map((lv) => h("tr", {}, h("th", { text: `${lv.points}점` }), h("td", { text: lv.criterion }))))));
        return;
      }
      const msg = box();
      const out = h("div");
      const ta = h("textarea", { "aria-label": `${el.name} 점검할 글`, maxlength: "5000", placeholder: "이 요소에 해당하는 내 글을 붙여 넣으세요" });
      ta.value = texts[i] || "";
      ta.addEventListener("input", () => { texts[i] = ta.value; });
      const key = `${r.id}:${i}`;
      const btn = h("button", { class: "btn", type: "button", disabled: !!rub.pending[key], onclick: async () => {
        const text = ta.value.trim();
        if (!text) { setBox(msg, "error", "점검할 글을 먼저 입력해 주세요."); return; }
        if (rub.pending[key]) return;
        rub.pending[key] = true; rub.errors[key] = "";
        render();  // 점검 중인 모습으로 다시 그립니다.
        try { results[i] = await postJson(`/api/rubrics/${r.id}/check`, { element_index: i, text }); }
        catch (e) { rub.errors[key] = e.message; }
        finally { delete rub.pending[key]; }
        // 기다리는 사이 화면을 옮겼다 돌아와도 결과가 보이도록, 같은 기준표가 열려 있으면 다시 그립니다.
        if (state.tab === "rubric" && rub.mode === "check" && rub.current && rub.current.id === r.id) render();
      } }, "점검하기");
      if (rub.pending[key]) setBox(msg, "busy", "점검하고 있어요. 보통 몇 초 걸려요.");
      else if (rub.errors[key]) setBox(msg, "error", rub.errors[key], () => btn.click());
      if (results[i]) out.appendChild(resultCard(results[i]));
      wrap.append(h("div", { class: "card", style: "margin-top:12px" },
        h("h3", { style: "font-size:17px", text: `${i + 1}. ${el.name}` }),
        h("p", { class: "muted", text: `배점 ${el.max_points}점` }),
        h("label", { class: "field", text: "내 글" }), ta, h("div", { class: "row" }, btn), msg, out));
    });
    wrap.append(notice("점검은 참고용이에요. 점수를 정하는 건 선생님이에요. AI가 틀릴 수 있으니 직접 다시 읽어 보세요."));
    return wrap;
  }

  function resultCard(res) {
    const [cls, label] = VERDICT[res.verdict] || ["note", "확인 필요"];
    const card = h("div", { class: `card res ${cls}`, style: "margin-top:12px" }, h("span", { class: `pill ${cls}`, text: label }));
    if (res.message) card.append(h("p", { style: "margin-top:8px", text: res.message }));
    if ((res.evidence || []).length) {
      card.append(h("p", { class: "muted", style: "margin-top:12px", text: "내 글에서 찾은 근거" }));
      for (const q of res.evidence) card.append(h("div", { class: "quote", text: q }));
    }
    if (res.closest_level) card.append(h("p", { style: "margin-top:12px" }, h("strong", { text: `가까운 수준: ${res.closest_level.points}점` }), h("br"), res.closest_level.criterion));
    if ((res.gaps || []).length) card.append(h("p", { class: "muted", style: "margin-top:12px", text: "더 필요해 보이는 점" }), h("ul", {}, res.gaps.map((g) => h("li", { text: g }))));
    if ((res.hints || []).length) card.append(h("p", { class: "muted", style: "margin-top:12px", text: "스스로 생각해 볼 질문" }), h("ul", {}, res.hints.map((g) => h("li", { text: g }))));
    card.append(h("p", { class: "confirm", text: res.notice || "이 결과는 점수가 아니라 참고용 점검입니다. 최종 평가는 선생님이 합니다." }));
    return card;
  }

  // ---------- 더보기 ----------
  function renderMore() {
    const nick = h("input", { type: "text", id: "nick", maxlength: "12", "aria-label": "닉네임", placeholder: "예: 하늘" });
    nick.value = store("nick") || "";
    const msg = box();
    const editor = h("div", { class: "hidden", id: "nick-editor" },
      h("label", { class: "field", for: "nick", text: "부르고 싶은 이름" }), nick,
      h("div", { class: "row" }, h("button", { class: "btn", type: "button", id: "nick-save", onclick: () => {
        const v = nick.value.trim(); store("nick", v || null); render();
      } }, "저장")));
    const name = store("nick");
    const row = (title, sub, onclick, id) => h("li", {}, h("button", { class: "rowitem", type: "button", id, onclick },
      h("span", { class: "grow" }, h("span", { class: "nm", text: title }), sub ? h("span", { class: "meta", text: sub }) : null), h("span", { class: "go-ico" }, icon("chev"))));
    const info = h("ul", { class: "list muted hidden", id: "about-list", style: "padding:12px 16px" },
      ["AI 답과 문제는 틀릴 수 있어요. 원본 자료와 선생님께 확인하세요.",
       "개인정보와 비공개 자료는 올리지 마세요.",
       "무료 AI는 입력한 내용이 서비스 개선에 쓰일 수 있어요. 공개해도 되는 자료만 올려 주세요.",
       "올린 자료는 지우기 전까지 이 기기에 남아요. 질문 기록은 {days}일 뒤 자동으로 지워져요.",
       "사진·스캔본은 아직 읽지 못해요(글자가 있는 PDF만)."].map((t) => h("li", { [KEEP_ATTR]: t, text: keepText(t) })));
    return [
      appbar("더보기", { back: () => go("home"), backLabel: "홈으로" }),
      h("div", { class: "card" },
        h("div", { class: "profile" },
          h("span", { class: "avatar-lg", "aria-hidden": "true", text: name ? name.slice(0, 1) : "나" }),
          h("div", { class: "grow" }, h("b", { style: "font-size:18px", text: name || "닉네임을 정해 보세요" }), h("div", { class: "muted", text: "이 기기에만 저장돼요" })),
          h("button", { class: "sm-pill", type: "button", id: "nick-edit", onclick: () => { editor.classList.toggle("hidden"); } }, "수정")),
        editor, msg,
        h("div", { class: "statgrid" },
          h("div", { class: "statbox" }, h("b", { id: "stat-materials", text: String(state.materials.length) }), h("span", { text: "보관 중인 자료" })),
          h("div", { class: "statbox" }, h("b", { id: "stat-wrong", text: String(state.openWrong[state.selId] || 0) }), h("span", { text: "다시 풀 오답" })))),
      h("p", { class: "label", text: "기록" }),
      h("ul", { class: "rows" },
        row("질문 기록", "물어본 질문과 답을 다시 봐요", () => { state.study = "기록"; go("study"); }),
        row("오답 노트", "틀린 문제를 모아 다시 풀어요", () => { state.quizMode = "오답"; go("quiz"); }),
        row("자료 관리", "올린 자료를 고르거나 지워요", () => { state.study = "자료"; go("study"); })),
      h("p", { class: "label", text: "설정" }),
      h("ul", { class: "rows" },
        row("안내와 한계", "AI 답은 틀릴 수 있어요", () => info.classList.toggle("hidden"), "about-row"),
        h("li", {}, info),
        row("이 기기 설정 지우기", "닉네임과 고른 자료 표시를 지워요", () => { store("nick", null); store("sel", null); store("nickSkip", null); render(); })),
    ];
  }

  // ---------- 시작 ----------
  render();
  loadMaterials().then(render).catch((e) => {
    const root = document.getElementById("screens");
    root.prepend(box("error", e.message));
  });
})();

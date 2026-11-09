/* 체험판 계층(demo shim). 서버가 없는 정적 사이트에서 /api/... 호출을 브라우저 안의 예시 데이터로 대신 답합니다.
 * - 실제 AI를 쓰지 않습니다. 모든 응답은 demo-data.json에 미리 써 둔 예시입니다.
 * - 사용자가 고른 파일(자료·사진)은 읽지도, 보내지도, 저장하지도 않습니다.
 * - 저장하는 것은 이 브라우저의 localStorage(질문 기록·오답 노트·기준표)뿐이며 어디로도 전송되지 않습니다. */
(() => {
  "use strict";
  const realFetch = window.fetch.bind(window);
  const PREFIX = "demo-v1:";
  const mem = {};  // localStorage를 못 쓰는 환경(사생활 보호 창 등)용 대체 저장소

  function load(key, fallback) {
    try { const v = localStorage.getItem(PREFIX + key); if (v !== null) return JSON.parse(v); } catch (_) {}
    return key in mem ? JSON.parse(mem[key]) : fallback;
  }
  function save(key, value) {
    const text = JSON.stringify(value);
    mem[key] = text;
    try { localStorage.setItem(PREFIX + key, text); } catch (_) {}
  }

  let dataPromise = null;
  function getData() {
    if (!dataPromise) dataPromise = realFetch("demo-data.json").then((r) => r.json());
    return dataPromise;
  }

  // 발표자 본인 키 모드(byok.js, 선택). 키가 있을 때만 수행평가 두 기능을 진짜 AI로 부르고, 실패하면 예시로 돌아갑니다.
  const FAIL_MARK = "진짜 AI 연결 실패, 예시로 보여 드려요.";
  const REAL_CHECK_MARK = "진짜 AI가 점검한 결과예요.";
  const byok = () => (window.__byok && window.__byok.hasKey() ? window.__byok : null);

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
  const reply = (status, body) => new Response(body === null ? null : JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  const fail = (status, message) => reply(status, { error: message });
  const uid = (p) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const nowIso = () => new Date().toISOString().replace(/\.\d+Z$/, "+00:00");

  // ---------- 상태 ----------
  const session = { materials: null, summarized: {}, quizzes: {} };  // 새로고침하면 처음 상태로 돌아옵니다.
  function materials(data) {
    if (!session.materials) session.materials = data.materials.map((m) => ({ ...m }));
    return session.materials;
  }
  const publicMaterial = (m) => ({ id: m.id, filename: m.filename, created_at: m.created_at, page_count: m.pages.length, has_summary: !!session.summarized[m.id] });

  // ---------- 질문 ----------
  function pickAnswer(data, question) {
    let best = null, bestScore = 0;
    for (const qa of data.qa) {
      const score = qa.keywords.reduce((s, k) => s + (question.toLowerCase().includes(k.toLowerCase()) ? k.length : 0), 0);
      if (score > bestScore) { best = qa; bestScore = score; }
    }
    return best;
  }
  function noMatchAnswer(data) {
    const tips = data.qa.map((q) => `· ${q.suggestion}`).join("\n");
    return { answer: `${data.no_match.answer}\n${tips}`, sources: [] };
  }

  // ---------- 기록 ----------
  const histKey = (id) => `history:${id}`;
  const RETENTION_DAYS = 30, MAX_ENTRIES = 100;
  // 실제 백엔드처럼 읽거나 쓸 때 30일이 지난 기록과 100개를 넘는 오래된 기록을 지웁니다(저장된 목록도 같이 정리).
  function loadHistory(id) {
    const all = load(histKey(id), []);
    const cutoff = Date.now() - RETENTION_DAYS * 86400000;
    const kept = all.filter((e) => e && typeof e.id === "string" && Date.parse(e.created_at) >= cutoff).slice(-MAX_ENTRIES);
    if (kept.length !== all.length) save(histKey(id), kept);
    return kept;
  }
  function addHistory(id, question, answer, sources) {
    const list = loadHistory(id);
    list.push({ id: uid("h"), created_at: nowIso(), question, answer, sources });
    save(histKey(id), list.slice(-MAX_ENTRIES));
  }

  // ---------- 문제·오답 ----------
  function publicQuiz(quiz) {
    return { id: quiz.id, material_id: quiz.material_id, difficulty: quiz.difficulty, kind: quiz.kind, notice: quiz.notice,
      questions: quiz.questions.map((q) => ({ id: q.id, question: q.question, choices: q.choices })) };
  }
  function makeQuiz(data, materialId, difficulty, kind, questions) {
    const quiz = { id: uid("quiz"), material_id: materialId, difficulty, kind, notice: data.quiz.notice,
      questions: questions.map((q, i) => ({ ...q, id: i + 1 })) };
    session.quizzes[quiz.id] = quiz;
    return quiz;
  }
  const notesKey = (id) => `notes:${id}`;
  const noteKey = (q) => `${q.page}:${q.question}`;
  function notesBody(data, id) {
    const items = load(notesKey(id), []);
    return { items, open_count: items.filter((i) => i.status === "open").length, resolved_count: items.filter((i) => i.status === "resolved").length, notice: data.quiz.notice };
  }

  // ---------- 수행평가 ----------
  const rubricsKey = "rubrics";
  function splitSentences(text) { return (text.match(/[^.!?。\n]+[.!?。]?/g) || []).map((s) => s.trim()).filter(Boolean); }
  function checkText(data, rubric, index, text, failed) {
    const spec = data.rubric.check[index % data.rubric.check.length];
    const el = rubric.elements[index];
    const hits = spec.keywords.filter((k) => text.includes(k));
    const len = text.replace(/\s+/g, "").length;
    const levels = [...el.levels].sort((a, b) => b.points - a.points);
    const level = (i) => { const l = levels[Math.min(i, levels.length - 1)]; return l ? { points: l.points, criterion: l.criterion } : null; };
    const evidence = splitSentences(text).filter((s) => s.replace(/\s+/g, "").length >= 6 && spec.keywords.some((k) => s.includes(k))).slice(0, 3);
    const base = { element_index: index, element_name: el.name, notice: (failed ? FAIL_MARK + " " : "") + "이 결과는 점수가 아니라 참고용 점검입니다. 최종 평가는 선생님이 합니다." };
    if (len < 20) return { ...base, verdict: "확인필요", evidence: [], closest_level: null, gaps: [], hints: spec.hints.slice(0, 1), message: data.rubric.check_messages.short };
    if (hits.length >= 2 && len >= 60 && evidence.length) return { ...base, verdict: "충분", evidence, closest_level: level(0), gaps: [], hints: spec.hints.slice(0, 1), message: data.rubric.check_messages.enough };
    return { ...base, verdict: "부족", evidence, closest_level: level(1), gaps: spec.gaps, hints: spec.hints, message: data.rubric.check_messages.lacking };
  }

  // ---------- 요청 처리 ----------
  async function handle(method, path, query, request) {
    const data = await getData();
    const list = materials(data);
    let m;

    if (path === "/api/materials" && method === "GET") return reply(200, list.map(publicMaterial));
    if (path === "/api/materials" && method === "POST") {
      // 올린 파일은 읽지 않고 버립니다. 어디에도 보내거나 저장하지 않아요.
      return fail(400, "체험판에서는 예시 자료로 체험해요. 올린 파일은 어디에도 보내거나 저장하지 않아요. 아래 목록의 예시 자료를 골라 써 보세요.");
    }

    if ((m = path.match(/^\/api\/materials\/([^/]+)(?:\/(.*))?$/))) {
      const id = m[1], rest = m[2] || "";
      const mat = list.find((x) => x.id === id);
      if (!mat) return fail(404, "자료를 찾을 수 없습니다.");

      if (rest === "" && method === "DELETE") {
        session.materials = list.filter((x) => x.id !== id);
        try { localStorage.removeItem(PREFIX + histKey(id)); localStorage.removeItem(PREFIX + notesKey(id)); } catch (_) {}
        delete mem[histKey(id)]; delete mem[notesKey(id)];
        return reply(204, null);
      }
      if (rest === "summary" && method === "POST") {
        await sleep(500);
        const cached = !!session.summarized[id] && query.get("refresh") !== "1";
        session.summarized[id] = true;
        return reply(200, { summary: mat.summary, cached });
      }
      if (rest === "ask" && method === "POST") {
        const body = await request.json().catch(() => ({}));
        const question = String(body.question || "").trim();
        if (!question) return fail(400, "질문을 입력해 주세요.");
        if (question.length > 500) return fail(400, "질문은 500자 이하로 입력해 주세요.");
        await sleep(600);
        const hit = pickAnswer(data, question);
        const result = hit ? { answer: hit.answer, sources: hit.sources } : noMatchAnswer(data);
        if (result.sources.length) addHistory(id, question, result.answer, result.sources);
        return reply(200, result);
      }
      if (rest === "history" && method === "GET") {
        return reply(200, { entries: loadHistory(id).slice().reverse(), retention_days: RETENTION_DAYS, notice: "체험판의 질문 기록은 이 브라우저에만 저장되고 어디로도 보내지 않아요. 개인정보는 입력하지 마세요." });
      }
      if (rest === "history" && method === "DELETE") { save(histKey(id), []); return reply(204, null); }
      if ((m = rest.match(/^history\/([^/]+)$/)) && method === "DELETE") {
        const entries = loadHistory(id);
        const left = entries.filter((e) => e.id !== m[1]);
        if (left.length === entries.length) return fail(404, "기록을 찾을 수 없습니다.");
        save(histKey(id), left);
        return reply(204, null);
      }
      if (rest === "quizzes" && method === "POST") {
        const body = await request.json().catch(() => ({}));
        if (!["쉬움", "보통", "어려움"].includes(body.difficulty)) return fail(400, "난이도는 쉬움, 보통, 어려움 중에서 골라 주세요.");
        const count = body.count;
        if (!Number.isInteger(count) || count < 3 || count > 10) return fail(400, "문제 수는 3~10 사이로 정해 주세요.");
        await sleep(500);
        const pool = data.quiz.questions;
        const n = Math.min(count, pool.length);
        const quiz = makeQuiz(data, id, body.difficulty, "generated", pool.slice(0, n));
        return reply(201, { ...publicQuiz(quiz), requested: count, count: n, shortfall_message: n < count ? data.quiz.shortfall_template.replace(/\{n\}/g, String(n)) : null });
      }
      if (rest === "wrong-notes" && method === "GET") return reply(200, notesBody(data, id));
      if (rest === "wrong-notes/quiz" && method === "POST") {
        const open = load(notesKey(id), []).filter((i) => i.status === "open");
        if (!open.length) return fail(409, "다시 풀 오답이 없습니다.");
        const qs = open.slice(0, 10).map((i) => ({ question: i.question, choices: i.choices, answer: i.answer, explanation: i.explanation, page: i.page }));
        const quiz = makeQuiz(data, id, "오답 다시 풀기", "retry", qs);
        return reply(201, { ...publicQuiz(quiz), count: qs.length });
      }
      return fail(404, "체험판에서 지원하지 않는 기능이에요.");
    }

    if ((m = path.match(/^\/api\/quizzes\/([^/]+)(\/submit)?$/))) {
      const quiz = session.quizzes[m[1]];
      if (!quiz) return fail(404, "퀴즈를 찾을 수 없습니다.");
      if (!m[2] && method === "GET") return reply(200, publicQuiz(quiz));
      if (m[2] && method === "POST") {
        const body = await request.json().catch(() => ({}));
        const answers = body.answers;
        if (!Array.isArray(answers)) return fail(400, "answers를 보내 주세요.");
        if (answers.length !== quiz.questions.length) return fail(400, `답은 ${quiz.questions.length}개를 보내 주세요. 안 푼 문제는 null로 비워 두세요.`);
        if (answers.some((a) => a !== null && (!Number.isInteger(a) || a < 1 || a > 4))) return fail(400, "답은 1~4 사이의 번호여야 합니다.");
        const results = quiz.questions.map((q, i) => ({ id: q.id, selected: answers[i], correct: answers[i] === q.answer, answer: q.answer, explanation: q.explanation, page: q.page }));
        // 오답 노트 반영: 틀리면 추가/다시 열기, 맞히면 해결
        const items = load(notesKey(quiz.material_id), []);
        let added = 0, resolved = 0;
        quiz.questions.forEach((q, i) => {
          const key = noteKey(q);
          const item = items.find((x) => x.key === key);
          if (!results[i].correct) {
            if (!item) { items.push({ key, question: q.question, choices: q.choices, answer: q.answer, explanation: q.explanation, page: q.page, status: "open", wrong_count: 1, created_at: nowIso(), resolved_at: null }); added++; }
            else { item.wrong_count++; if (item.status === "resolved") { item.status = "open"; item.resolved_at = null; added++; } }
          } else if (item && item.status === "open") { item.status = "resolved"; item.resolved_at = nowIso(); resolved++; }
        });
        save(notesKey(quiz.material_id), items);
        return reply(200, { quiz_id: quiz.id, score: results.filter((r) => r.correct).length, total: results.length, results, wrong_notes: { added, resolved }, notice: quiz.notice });
      }
    }

    // 수행평가
    if (path === "/api/rubrics/draft" && method === "POST") {
      // 키가 있으면 사진을 진짜 AI로 읽어 봅니다. 키가 없거나 실패하면 사진은 읽지 않고 같은 예시 초안을 줍니다.
      const b = byok();
      let failed = false;
      if (b) { try { return reply(200, await b.draft(request.body)); } catch (_) { failed = true; } }
      await sleep(700);
      return reply(200, { draft: JSON.parse(JSON.stringify(data.rubric.draft)), saved: false, notice: (failed ? FAIL_MARK + " " : "") + data.rubric.draft_notice });
    }
    if (path === "/api/rubrics" && method === "GET") {
      return reply(200, load(rubricsKey, []).slice().reverse().map((r) => ({ id: r.id, created_at: r.created_at, title: r.title || "", element_count: r.elements.length })));
    }
    if (path === "/api/rubrics" && method === "POST") {
      const body = await request.json().catch(() => null);
      const problem = validateRubric(body);
      if (problem) return fail(400, problem);
      const record = { id: uid("rubric"), created_at: nowIso(), title: String(body.title || "").trim(), elements: body.elements.map((e) => ({ name: String(e.name).trim(), max_points: Number(e.max_points), levels: e.levels.map((l) => ({ points: Number(l.points), criterion: String(l.criterion).trim() })) })) };
      const all = load(rubricsKey, []); all.push(record); save(rubricsKey, all);
      return reply(201, record);
    }
    if ((m = path.match(/^\/api\/rubrics\/([^/]+?)(\/check)?$/))) {
      const all = load(rubricsKey, []);
      const rubric = all.find((r) => r.id === m[1]);
      if (!rubric) return fail(404, "기준표를 찾을 수 없습니다.");
      if (!m[2] && method === "GET") return reply(200, rubric);
      if (!m[2] && method === "DELETE") { save(rubricsKey, all.filter((r) => r.id !== m[1])); return reply(204, null); }
      if (m[2] && method === "POST") {
        const body = await request.json().catch(() => ({}));
        const idx = body.element_index;
        if (!Number.isInteger(idx) || idx < 0 || idx >= rubric.elements.length) return fail(400, "점검할 평가 요소를 골라 주세요.");
        const text = typeof body.text === "string" ? body.text.trim() : "";
        if (!text) return fail(400, "점검할 글을 입력해 주세요.");
        if (text.length > 5000) return fail(400, "글은 5000자 이하로 나누어 올려 주세요.");
        const b = byok();
        let failed = false;
        if (b) {
          try { return reply(200, { element_index: idx, element_name: rubric.elements[idx].name, ...(await b.check(rubric.elements[idx], text)) }); }
          catch (_) { failed = true; }
        }
        await sleep(500);
        return reply(200, checkText(data, rubric, idx, text, failed));
      }
    }
    return fail(404, "체험판에서 지원하지 않는 기능이에요.");
  }

  function validateRubric(b) {
    if (!b || typeof b !== "object" || !Array.isArray(b.elements) || !b.elements.length) return "평가 요소가 하나 이상 필요해요.";
    for (const e of b.elements) {
      if (!e || !String(e.name || "").trim()) return "평가 요소 이름을 입력해 주세요.";
      if (!(Number(e.max_points) > 0)) return "배점은 0보다 큰 숫자여야 해요.";
      if (!Array.isArray(e.levels) || !e.levels.length) return "수준별 기준이 하나 이상 필요해요.";
      for (const l of e.levels) {
        if (l === null || typeof l !== "object" || l.points === "" || !Number.isFinite(Number(l.points))) return "수준 점수는 숫자여야 해요.";
        if (!String(l.criterion || "").trim()) return "수준별 기준 문장을 입력해 주세요.";
      }
    }
    return "";
  }

  window.fetch = async function (input, init) {
    const url = new URL(typeof input === "string" ? input : input.url, location.href);
    const options = init || {};
    const apiAt = url.pathname.indexOf("/api/");
    if (url.origin !== location.origin || apiAt < 0) return realFetch(input, init);
    const method = String(options.method || (typeof input !== "string" && input.method) || "GET").toUpperCase();
    // 본문은 JSON일 때만 읽습니다(파일이 든 FormData는 열어 보지 않음).
    const req = { json: async () => (typeof options.body === "string" ? JSON.parse(options.body) : {}), body: options.body };
    try { return await handle(method, url.pathname.slice(apiAt), url.searchParams, req); }
    catch (_) { return fail(500, "체험판에서 문제가 생겼어요. 페이지를 새로고침해 주세요."); }
  };

  // ---------- '예시' 표시 ----------
  // 답변·요약·결과 카드마다 작은 '예시' 표시를 붙입니다(앱 스크립트는 건드리지 않고 화면이 바뀔 때 덧붙임).
  const TAG_TARGETS = [".ai .who", "#summary", ".card.res", ".score", ".paper .pageno", ".card.q .explain", "ul.list > li.card .explain"];
  function tagOnce(el) {
    if (el.dataset.demoTagged) return;
    el.dataset.demoTagged = "1";
    const tag = document.createElement("span");
    const real = el.matches(".card.res") && el.textContent.includes(REAL_CHECK_MARK);  // 진짜 AI 결과에는 '진짜 AI', 나머지는 '예시'
    tag.className = real ? "demo-tag real" : "demo-tag";
    tag.textContent = real ? "진짜 AI" : "예시";
    if (el.id === "summary") { if (!el.textContent.trim()) { delete el.dataset.demoTagged; return; } el.prepend(tag, document.createElement("br")); }
    else if (el.matches(".card.res")) el.prepend(tag);
    else el.append(tag);
  }
  function tagAll() { for (const sel of TAG_TARGETS) document.querySelectorAll(sel).forEach(tagOnce); }
  let queued = false;
  function schedule() { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; tagAll(); }); }
  // 배너 높이(글이 두 줄로 접히는 좁은 화면 포함)만큼 앱 상단 바를 아래로 밀어, 배너가 항상 보이게 합니다.
  function fitBanner() {
    const b = document.getElementById("demo-banner");
    if (b) document.documentElement.style.setProperty("--demo-banner-h", b.offsetHeight + "px");
  }
  function start() {
    fitBanner();
    window.addEventListener("resize", fitBanner);
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    schedule();
  }
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
})();

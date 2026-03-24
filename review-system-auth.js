/**
 * review-system-auth.js
 *
 * Password gate + identified comments via AWS /login + /comment endpoints.
 * Supports both training reports and manuscript pages.
 */
(function () {
  const API_BASE = "https://2tu79n9lw0.execute-api.us-east-1.amazonaws.com";
  const SESSION_KEY = "mg_review_auth_v1";

  const PAGE_ID = (location.pathname || "report")
    .replace(/[^a-z0-9/_-]/gi, "_")
    .slice(0, 120);
  const IS_MANUSCRIPT_PAGE =
    /manuscript/i.test(PAGE_ID) || /manuscript/i.test(document.title || "");
  const MIN_PARAGRAPH_LEN = 48;

  function slugify(text) {
    return text.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 64);
  }

  function injectStyles() {
    const css = `
      #review-gate {
        position: fixed; inset: 0; z-index: 99999;
        background: rgba(15, 23, 42, 0.84);
        display: flex; align-items: center; justify-content: center;
        backdrop-filter: blur(4px);
      }
      .gate-box {
        width: min(420px, 92vw);
        background: #fff; color: #0f172a;
        border-radius: 12px; padding: 24px;
        box-shadow: 0 20px 56px rgba(0,0,0,.35);
        font-family: "IBM Plex Sans", -apple-system, system-ui, sans-serif;
      }
      .gate-box h2 { margin: 0 0 8px 0; font-size: 1.2rem; }
      .gate-box p { margin: 0 0 14px 0; color: #475569; font-size: .92rem; }
      .gate-box input {
        width: 100%; box-sizing: border-box;
        border: 1px solid #cbd5e1; border-radius: 8px;
        padding: 10px 12px; font-size: .95rem;
      }
      .gate-actions { display: flex; gap: 10px; margin-top: 12px; }
      .gate-box button {
        border: 0; border-radius: 8px; cursor: pointer;
        padding: 10px 14px; font-size: .92rem; font-weight: 600;
      }
      .btn-primary { background: #2563eb; color: #fff; }
      .btn-primary:hover { background: #1d4ed8; }
      .gate-error { min-height: 18px; margin-top: 8px; color: #dc2626; font-size: .85rem; }

      #review-badge {
        position: fixed; right: 16px; bottom: 16px; z-index: 9999;
        background: #0f172a; color: #e2e8f0; border-radius: 999px;
        padding: 6px 12px; font-family: "IBM Plex Sans", -apple-system, system-ui, sans-serif;
        font-size: .76rem; cursor: pointer;
      }
      #review-badge:hover { background: #1e293b; }

      .comment-toggle {
        margin-left: 10px; border: 1px solid #cbd5e1; background: #fff;
        color: #334155; border-radius: 999px; padding: 2px 10px;
        font-size: .72rem; cursor: pointer; line-height: 1.8;
        vertical-align: middle;
      }
      .comment-toggle.has-draft { border-color: #6366f1; color: #4f46e5; background: #eef2ff; }
      .comment-panel {
        display: none; margin: 8px 0 18px 0; padding: 12px;
        border: 1px solid #cbd5e1; border-radius: 8px; background: #f8fafc;
      }
      .comment-anchor-inline {
        margin: 6px 0 14px 0;
      }
      .comment-anchor-inline .comment-toggle {
        margin-left: 0;
      }
      .comment-panel textarea {
        width: 100%; box-sizing: border-box; min-height: 84px; resize: vertical;
        border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 10px;
        font-family: inherit;
      }
      .comment-actions { margin-top: 8px; display: flex; gap: 10px; align-items: center; }
      .comment-submit {
        border: 0; border-radius: 6px; background: #4f46e5; color: #fff;
        padding: 6px 12px; font-size: .82rem; cursor: pointer;
      }
      .comment-submit:disabled { background: #a5b4fc; cursor: default; }
      .comment-status { font-size: .8rem; color: #475569; }
      .comment-status.ok { color: #16a34a; }
      .comment-status.err { color: #dc2626; }
      .comment-thread {
        margin-top: 10px; border-top: 1px dashed #cbd5e1; padding-top: 10px;
      }
      .comment-empty { font-size: .78rem; color: #64748b; }
      .comment-item {
        margin: 0 0 8px 0; padding: 8px 10px; border: 1px solid #e2e8f0;
        border-radius: 6px; background: #fff;
      }
      .comment-item-head {
        font-size: .72rem; color: #475569; margin-bottom: 4px;
      }
      .comment-item-text {
        white-space: pre-wrap; font-size: .84rem; color: #0f172a;
      }
    `;
    const s = document.createElement("style");
    s.textContent = css;
    document.head.appendChild(s);
  }

  async function postJson(path, payload, token) {
    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    let body = {};
    try {
      body = await res.json();
    } catch (_) {}
    if (!res.ok) {
      const msg = (body && body.error) ? body.error : `HTTP ${res.status}`;
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }
    return body;
  }

  async function getJson(path, token) {
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}${path}`, {
      method: "GET",
      headers,
    });
    let body = {};
    try {
      body = await res.json();
    } catch (_) {}
    if (!res.ok) {
      const msg = (body && body.error) ? body.error : `HTTP ${res.status}`;
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }
    return body;
  }

  function loadSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || !s.token || !s.reviewer) return null;
      return s;
    } catch (_) {
      return null;
    }
  }

  function saveSession(session) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  async function showGate() {
    return new Promise((resolve) => {
      const gate = document.createElement("div");
      gate.id = "review-gate";
      gate.innerHTML = `
        <div class="gate-box">
          <h2>Reviewer Login</h2>
          <p>Enter your reviewer password to view and comment on this protected page.</p>
          <input type="password" id="review-pwd" placeholder="Password" autocomplete="current-password" />
          <div class="gate-actions">
            <button class="btn-primary" id="review-login-btn">Unlock</button>
          </div>
          <div class="gate-error" id="review-gate-error"></div>
        </div>
      `;
      document.body.appendChild(gate);
      document.body.style.overflow = "hidden";

      const input = gate.querySelector("#review-pwd");
      const btn = gate.querySelector("#review-login-btn");
      const err = gate.querySelector("#review-gate-error");
      input.focus();

      async function submit() {
        const password = (input.value || "").trim();
        if (!password) return;
        btn.disabled = true;
        err.textContent = "";
        try {
          const out = await postJson("/login", { password }, null);
          const session = {
            token: out.token,
            reviewer: out.reviewer || "reviewer",
            at: Date.now(),
          };
          saveSession(session);
          gate.remove();
          document.body.style.overflow = "";
          resolve(session);
        } catch (e) {
          err.textContent = e.message || "Login failed.";
          btn.disabled = false;
          input.select();
        }
      }

      btn.addEventListener("click", submit);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") submit();
      });
    });
  }

  function addBadge(session) {
    const badge = document.createElement("div");
    badge.id = "review-badge";
    badge.textContent = `Reviewer: ${session.reviewer} | sign out`;
    badge.addEventListener("click", () => {
      if (confirm("Sign out reviewer session?")) {
        clearSession();
        location.reload();
      }
    });
    document.body.appendChild(badge);
  }

  function renderThread(host, items) {
    host.innerHTML = "";
    if (!items || items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "comment-empty";
      empty.textContent = "No comments yet.";
      host.appendChild(empty);
      return;
    }
    items.forEach((it) => {
      const card = document.createElement("div");
      card.className = "comment-item";
      const head = document.createElement("div");
      head.className = "comment-item-head";
      const who = it.reviewer || "reviewer";
      const when = it.ts ? new Date(it.ts).toLocaleString() : "";
      head.textContent = when ? `${who} | ${when}` : who;
      const text = document.createElement("div");
      text.className = "comment-item-text";
      text.textContent = it.text || "";
      card.appendChild(head);
      card.appendChild(text);
      host.appendChild(card);
    });
  }

  async function fetchComments(session) {
    const qs = new URLSearchParams({
      page: PAGE_ID,
      limit: "400",
      days: "365",
    });
    const out = await getJson(`/comments?${qs.toString()}`, session.token);
    const items = Array.isArray(out.items) ? out.items : [];
    const bySection = new Map();
    items.forEach((it) => {
      const sec = (it.section || "").trim();
      if (!sec) return;
      if (!bySection.has(sec)) bySection.set(sec, []);
      bySection.get(sec).push(it);
    });
    bySection.forEach((arr) => {
      arr.sort((a, b) => String(a.ts || "").localeCompare(String(b.ts || "")));
    });
    return bySection;
  }

  function setToggleLabel(toggle, count, hasDraft) {
    if (hasDraft && count > 0) {
      toggle.textContent = `+ note (${count}, draft)`;
      return;
    }
    if (hasDraft) {
      toggle.textContent = "+ note (draft)";
      return;
    }
    if (count > 0) {
      toggle.textContent = `+ note (${count})`;
      return;
    }
    toggle.textContent = "+ note";
  }

  function buildSectionTargets() {
    const headers = Array.from(document.querySelectorAll("h2"));
    const targets = [];
    headers.forEach((h2, idx) => {
      const title = (h2.textContent || "").trim();
      if (!title) return;
      targets.push({
        anchor: h2,
        sectionId: `s${idx}_${slugify(title)}`,
        placeholder: "Comment on this section...",
        anchorMode: "append-to-heading",
      });
    });
    return targets;
  }

  function buildParagraphTargets() {
    const targets = [];
    const idCounts = new Map();
    let currentHeading = "intro";

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, null);
    let node = walker.nextNode();
    while (node) {
      const tag = (node.tagName || "").toUpperCase();
      if (/^H[1-6]$/.test(tag)) {
        const headingText = (node.textContent || "").trim();
        if (headingText) {
          currentHeading = slugify(headingText).slice(0, 24) || "section";
        }
        node = walker.nextNode();
        continue;
      }
      if (tag !== "P") {
        node = walker.nextNode();
        continue;
      }
      const p = node;
      if (p.closest("#review-gate, #review-badge, .comment-panel, .comment-anchor-inline, .comment-thread, nav, header, footer, aside, figcaption")) {
        node = walker.nextNode();
        continue;
      }
      const text = (p.textContent || "").trim();
      if (text.length < MIN_PARAGRAPH_LEN) {
        node = walker.nextNode();
        continue;
      }
      const textSig = slugify(text.slice(0, 56)) || "para";
      const baseId = `p_${currentHeading}_${textSig}`.slice(0, 96);
      const n = (idCounts.get(baseId) || 0) + 1;
      idCounts.set(baseId, n);
      const sectionId = n === 1 ? baseId : `${baseId}_${n}`;
      targets.push({
        anchor: p,
        sectionId,
        placeholder: "Comment on this paragraph...",
        anchorMode: "after-paragraph",
      });
      node = walker.nextNode();
    }
    return targets;
  }

  function buildCommentTargets() {
    if (IS_MANUSCRIPT_PAGE) {
      const paragraphTargets = buildParagraphTargets();
      if (paragraphTargets.length > 0) {
        return paragraphTargets;
      }
    }
    return buildSectionTargets();
  }

  function wireComments(session, commentsBySection) {
    const targets = buildCommentTargets();
    targets.forEach((target) => {
      const sectionId = target.sectionId;
      const draftKey = `draft_${PAGE_ID}_${sectionId}`;

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "comment-toggle";

      let panelAnchor = target.anchor;
      if (target.anchorMode === "after-paragraph") {
        const anchorWrap = document.createElement("div");
        anchorWrap.className = "comment-anchor-inline";
        anchorWrap.appendChild(toggle);
        target.anchor.insertAdjacentElement("afterend", anchorWrap);
        panelAnchor = anchorWrap;
      } else {
        target.anchor.appendChild(toggle);
      }

      const panel = document.createElement("div");
      panel.className = "comment-panel";
      panel.innerHTML = `
        <textarea placeholder="${target.placeholder}"></textarea>
        <div class="comment-actions">
          <button type="button" class="comment-submit">Submit</button>
          <span class="comment-status"></span>
        </div>
        <div class="comment-thread"></div>
      `;
      panelAnchor.insertAdjacentElement("afterend", panel);

      const ta = panel.querySelector("textarea");
      const submit = panel.querySelector(".comment-submit");
      const status = panel.querySelector(".comment-status");
      const thread = panel.querySelector(".comment-thread");
      const sectionComments = commentsBySection.get(sectionId) || [];
      renderThread(thread, sectionComments);

      const draft = localStorage.getItem(draftKey);
      if (draft) {
        ta.value = draft;
        toggle.classList.add("has-draft");
      }
      setToggleLabel(toggle, sectionComments.length, Boolean(draft));

      toggle.addEventListener("click", () => {
        panel.style.display = panel.style.display === "block" ? "none" : "block";
        if (panel.style.display === "block") ta.focus();
      });

      ta.addEventListener("input", () => {
        const val = ta.value || "";
        if (val.trim()) {
          localStorage.setItem(draftKey, val);
          toggle.classList.add("has-draft");
          setToggleLabel(toggle, sectionComments.length, true);
        } else {
          localStorage.removeItem(draftKey);
          toggle.classList.remove("has-draft");
          setToggleLabel(toggle, sectionComments.length, false);
        }
      });

      submit.addEventListener("click", async () => {
        const text = (ta.value || "").trim();
        if (!text) return;
        submit.disabled = true;
        status.className = "comment-status";
        status.textContent = "Saving...";
        try {
          await postJson(
            "/comment",
            {
              page: PAGE_ID,
              section: sectionId,
              text,
              ts: new Date().toISOString(),
            },
            session.token
          );
          status.className = "comment-status ok";
          status.textContent = "Saved";
          const saved = {
            reviewer: session.reviewer,
            ts: new Date().toISOString(),
            text,
            page: PAGE_ID,
            section: sectionId,
          };
          sectionComments.push(saved);
          renderThread(thread, sectionComments);
          ta.value = "";
          localStorage.removeItem(draftKey);
          toggle.classList.remove("has-draft");
          setToggleLabel(toggle, sectionComments.length, false);
          setTimeout(() => {
            status.textContent = "";
            panel.style.display = "none";
          }, 1200);
        } catch (e) {
          if (e.status === 401) {
            status.className = "comment-status err";
            status.textContent = "Session expired. Reload and sign in again.";
          } else {
            status.className = "comment-status err";
            status.textContent = `Save failed: ${e.message || "unknown error"}`;
          }
        } finally {
          submit.disabled = false;
        }
      });
    });
  }

  async function init() {
    injectStyles();
    let session = loadSession();
    if (!session) {
      session = await showGate();
    }
    let commentsBySection = new Map();
    try {
      commentsBySection = await fetchComments(session);
    } catch (e) {
      console.warn("review comments fetch failed:", e);
    }
    addBadge(session);
    wireComments(session, commentsBySection);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

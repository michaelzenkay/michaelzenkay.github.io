/**
 * review-system.js
 * Password-gated collaborative annotation layer for MG reports.
 */

(function () {
  // ── Configuration ────────────────────────────────────────────────────────
  const REVIEWERS = {
    'c1968554511202df97e3cd7577772e6e329fb28d150c2474395a37e595fdde13': 'richard',
    '94db3b5c7906d110d83ab5a64b567d7e1a942c1050118c55b1277953b101bee5': 'tim',
    'c64e839a14cddd55ea64a5912aba1c6518eb42abca77beb8abb0c81460ad8d3b': 'sachin',
    'b8ef69ad52755883952749fb3416642283d6313bd58738711bbdea3d347538a9': 'mike',
  };

  const API_URL     = 'https://2tu79n9lw0.execute-api.us-east-1.amazonaws.com/comment';
  const SESSION_KEY = 'mg_reviewer';
  // ─────────────────────────────────────────────────────────────────────────

  const PAGE_ID = (document.title || 'report').replace(/[^a-z0-9_-]/gi, '_').slice(0, 60);

  async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function slugify(text) {
    return text.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 40);
  }

  // ── CSS ───────────────────────────────────────────────────────────────────
  const STYLES = `
  #review-gate {
    position: fixed; inset: 0; background: rgba(15,23,42,0.85);
    display: flex; align-items: center; justify-content: center;
    z-index: 99999; backdrop-filter: blur(6px);
  }
  .gate-box {
    background: #fff; border-radius: 12px; padding: 40px 48px;
    max-width: 400px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    font-family: 'IBM Plex Sans', -apple-system, sans-serif;
  }
  .gate-box h2 { font-size: 1.2rem; font-weight: 700; margin-bottom: 8px; color: #1a1a2e; }
  .gate-box p  { font-size: 0.88rem; color: #64748b; margin-bottom: 20px; }
  .gate-box input {
    width: 100%; padding: 10px 14px; border: 1.5px solid #e2e8f0;
    border-radius: 7px; font-size: 0.95rem; outline: none;
    transition: border-color .15s;
  }
  .gate-box input:focus { border-color: #2563eb; }
  .gate-box button {
    margin-top: 12px; width: 100%; padding: 10px;
    background: #2563eb; color: #fff; border: none;
    border-radius: 7px; font-size: 0.95rem; font-weight: 600;
    cursor: pointer; transition: background .15s;
  }
  .gate-box button:hover { background: #1d4ed8; }
  #gate-err { margin-top: 10px; color: #dc2626; font-size: 0.82rem; min-height: 1.2em; }

  h2 { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
  .comment-toggle {
    flex-shrink: 0; background: none; border: 1.5px solid #c7d2fe;
    border-radius: 99px; padding: 1px 9px; font-size: 0.72rem;
    color: #6366f1; cursor: pointer; line-height: 1.8;
    font-family: inherit; transition: all .15s; white-space: nowrap;
  }
  .comment-toggle:hover { background: #eef2ff; border-color: #6366f1; }
  .comment-toggle.has-draft { background: #eef2ff; border-color: #6366f1; font-weight: 600; }

  .comment-panel {
    background: #f8faff; border: 1.5px solid #c7d2fe; border-radius: 8px;
    padding: 14px 16px; margin: 6px 0 18px; display: none;
    font-family: 'IBM Plex Sans', -apple-system, sans-serif;
  }
  .comment-panel textarea {
    width: 100%; min-height: 80px; padding: 8px 10px;
    border: 1px solid #c7d2fe; border-radius: 6px; font-size: 0.87rem;
    font-family: inherit; resize: vertical; outline: none;
    transition: border-color .15s; box-sizing: border-box;
  }
  .comment-panel textarea:focus { border-color: #6366f1; }
  .comment-actions { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
  .comment-submit {
    background: #6366f1; color: #fff; border: none; border-radius: 6px;
    padding: 6px 16px; font-size: 0.83rem; font-weight: 600;
    cursor: pointer; transition: background .15s; font-family: inherit;
  }
  .comment-submit:hover { background: #4f46e5; }
  .comment-submit:disabled { background: #a5b4fc; cursor: default; }
  .comment-status { font-size: 0.8rem; color: #64748b; }
  .comment-status.ok  { color: #16a34a; }
  .comment-status.err { color: #dc2626; }

  #review-badge {
    position: fixed; bottom: 16px; right: 16px;
    background: #1e1b4b; color: #c7d2fe; border-radius: 99px;
    padding: 5px 14px; font-size: 0.75rem; font-family: inherit;
    z-index: 9999; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    transition: background .15s;
  }
  #review-badge:hover { background: #312e81; }
  `;

  function injectStyles() {
    const s = document.createElement('style');
    s.textContent = STYLES;
    document.head.appendChild(s);
  }

  // ── Password gate ─────────────────────────────────────────────────────────
  function showGate() {
    const gate = document.createElement('div');
    gate.id = 'review-gate';
    gate.innerHTML = `
      <div class="gate-box">
        <h2>Reviewer Access</h2>
        <p>Enter your reviewer password to view and annotate this report.</p>
        <input type="password" id="gate-pwd" placeholder="Password" autocomplete="current-password">
        <button id="gate-btn">Unlock</button>
        <div id="gate-err"></div>
      </div>`;
    document.body.appendChild(gate);
    document.body.style.overflow = 'hidden';
    document.getElementById('gate-pwd').focus();

    async function tryUnlock() {
      const pwd = document.getElementById('gate-pwd').value;
      if (!pwd) return;
      const btn = document.getElementById('gate-btn');
      const err = document.getElementById('gate-err');
      btn.disabled = true;
      err.textContent = '';
      const hash = await sha256(pwd);
      const reviewer = REVIEWERS[hash];
      if (reviewer) {
        sessionStorage.setItem(SESSION_KEY, reviewer);
        gate.remove();
        document.body.style.overflow = '';
        injectCommentWidgets(reviewer);
      } else {
        err.textContent = 'Invalid password. Try again.';
        document.getElementById('gate-pwd').select();
        btn.disabled = false;
      }
    }

    document.getElementById('gate-btn').addEventListener('click', tryUnlock);
    document.getElementById('gate-pwd').addEventListener('keydown', e => { if (e.key === 'Enter') tryUnlock(); });
  }

  // ── Comment widgets ───────────────────────────────────────────────────────
  async function postComment(reviewer, payload) {
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewer, ...payload }),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  }

  function injectCommentWidgets(reviewer) {
    document.querySelectorAll('h2').forEach((h2, idx) => {
      const rawText = h2.childNodes[0]?.textContent || h2.textContent;
      const sectionId = `s${idx}_${slugify(rawText)}`;
      const draftKey  = `draft_${PAGE_ID}_${sectionId}`;

      const btn = document.createElement('button');
      btn.className = 'comment-toggle';
      btn.textContent = '+ note';
      const saved = localStorage.getItem(draftKey);
      if (saved) { btn.classList.add('has-draft'); btn.textContent = '+ note (draft)'; }
      h2.appendChild(btn);

      const panel = document.createElement('div');
      panel.className = 'comment-panel';
      panel.innerHTML = `
        <textarea placeholder="Add a comment on this section..."></textarea>
        <div class="comment-actions">
          <button class="comment-submit">Submit</button>
          <span class="comment-status"></span>
        </div>`;
      h2.after(panel);

      const ta     = panel.querySelector('textarea');
      const submit = panel.querySelector('.comment-submit');
      const status = panel.querySelector('.comment-status');

      if (saved) ta.value = saved;

      ta.addEventListener('input', () => {
        const v = ta.value.trim();
        localStorage.setItem(draftKey, ta.value);
        btn.classList.toggle('has-draft', !!v);
        btn.textContent = v ? '+ note (draft)' : '+ note';
      });

      btn.addEventListener('click', () => {
        const open = panel.style.display === 'block';
        panel.style.display = open ? 'none' : 'block';
        if (!open) ta.focus();
      });

      submit.addEventListener('click', async () => {
        const text = ta.value.trim();
        if (!text) return;
        submit.disabled = true;
        status.textContent = 'Saving...';
        status.className = 'comment-status';
        try {
          await postComment(reviewer, { section: sectionId, text, page: PAGE_ID, ts: new Date().toISOString() });
          status.textContent = 'Saved!';
          status.className = 'comment-status ok';
          ta.value = '';
          localStorage.removeItem(draftKey);
          btn.classList.remove('has-draft');
          btn.textContent = '+ note';
          setTimeout(() => { panel.style.display = 'none'; status.textContent = ''; }, 1800);
        } catch (e) {
          status.textContent = 'Error saving — check console.';
          status.className = 'comment-status err';
        } finally {
          submit.disabled = false;
        }
      });
    });

    const badge = document.createElement('div');
    badge.id = 'review-badge';
    badge.textContent = `Reviewing as ${reviewer} — sign out`;
    badge.addEventListener('click', () => {
      if (confirm('Sign out? Unsaved drafts are stored locally.')) {
        sessionStorage.removeItem(SESSION_KEY);
        location.reload();
      }
    });
    document.body.appendChild(badge);

    if (typeof window.reviewPageInit === 'function') window.reviewPageInit(reviewer);
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    injectStyles();
    const reviewer = sessionStorage.getItem(SESSION_KEY);
    if (reviewer) {
      injectCommentWidgets(reviewer);
    } else {
      showGate();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

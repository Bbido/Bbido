(() => {
  let panel = null;
  let activeTarget = null;
  let btn = null;
  let generatedText = '';

  const TYPES = [
    { id: 'post', label: '✍️ Post' },
    { id: 'comment', label: '💬 Comment' },
    { id: 'message', label: '✉️ Message' },
    { id: 'improve', label: '✨ Improve' },
    { id: 'reply', label: '↩️ Reply' },
  ];

  const TONES = ['Professional', 'Friendly', 'Inspiring', 'Witty', 'Concise'];

  // Observe DOM for LinkedIn editor elements
  const observer = new MutationObserver(() => attachToEditors());
  observer.observe(document.body, { childList: true, subtree: true });
  attachToEditors();

  function attachToEditors() {
    const selectors = [
      '.ql-editor[contenteditable="true"]',
      '[data-placeholder]',
      'div[contenteditable="true"]',
      'textarea',
    ];

    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => {
        if (el.dataset.linkedai) return;
        el.dataset.linkedai = '1';

        el.addEventListener('focus', () => {
          activeTarget = el;
          showBtn(el);
        });

        el.addEventListener('blur', () => {
          setTimeout(() => {
            if (!document.getElementById('linkedai-btn')?.matches(':hover') &&
                !document.getElementById('linkedai-panel')) {
              removeBtn();
            }
          }, 200);
        });
      });
    });
  }

  function showBtn(el) {
    removeBtn();
    btn = document.createElement('button');
    btn.id = 'linkedai-btn';
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L9.5 8.5H3L8.5 12.5L6.5 19L12 15L17.5 19L15.5 12.5L21 8.5H14.5L12 2Z"/>
      </svg>
      LinkedAI
    `;
    btn.onclick = (e) => { e.stopPropagation(); openPanel(); };

    document.body.appendChild(btn);
    positionBtn(el);
  }

  function positionBtn(el) {
    if (!btn) return;
    const rect = el.getBoundingClientRect();
    btn.style.top = `${window.scrollY + rect.bottom - 34}px`;
    btn.style.left = `${window.scrollX + rect.right - 120}px`;
  }

  function removeBtn() {
    document.getElementById('linkedai-btn')?.remove();
    btn = null;
  }

  function openPanel() {
    if (document.getElementById('linkedai-panel')) return;
    removeBtn();

    panel = document.createElement('div');
    panel.id = 'linkedai-panel';
    panel.innerHTML = buildPanelHTML();
    document.body.appendChild(panel);

    setupPanelEvents();
    loadUsage();
  }

  function buildPanelHTML() {
    const tabs = TYPES.map((t, i) =>
      `<button class="lai-tab${i === 0 ? ' active' : ''}" data-type="${t.id}">${t.label}</button>`
    ).join('');

    const toneOptions = TONES.map(t =>
      `<option value="${t.toLowerCase()}">${t}</option>`
    ).join('');

    return `
      <div class="lai-header">
        <h3>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L9.5 8.5H3L8.5 12.5L6.5 19L12 15L17.5 19L15.5 12.5L21 8.5H14.5L12 2Z"/>
          </svg>
          LinkedAI
        </h3>
        <button class="lai-close">×</button>
      </div>
      <div class="lai-body">
        <div class="lai-tabs">${tabs}</div>
        <div class="lai-row">
          <label>Topic or context</label>
          <textarea id="lai-topic" rows="3" placeholder="e.g. I just got promoted to Senior Engineer..."></textarea>
        </div>
        <div class="lai-row">
          <label>Tone</label>
          <select id="lai-tone">${toneOptions}</select>
        </div>
        <button class="lai-generate-btn" id="lai-gen-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L9.5 8.5H3L8.5 12.5L6.5 19L12 15L17.5 19L15.5 12.5L21 8.5H14.5L12 2Z"/>
          </svg>
          Generate
        </button>
        <div id="lai-output"></div>
        <div class="lai-usage" id="lai-usage-info"></div>
      </div>
    `;
  }

  function setupPanelEvents() {
    panel.querySelector('.lai-close').onclick = closePanel;

    panel.querySelectorAll('.lai-tab').forEach(tab => {
      tab.onclick = () => {
        panel.querySelectorAll('.lai-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        if (tab.dataset.type === 'improve') {
          document.getElementById('lai-topic').placeholder = 'Paste your text here to improve it...';
        } else {
          document.getElementById('lai-topic').placeholder = 'e.g. I just got promoted to Senior Engineer...';
        }
      };
    });

    panel.querySelector('#lai-gen-btn').onclick = generate;
  }

  function closePanel() {
    panel?.remove();
    panel = null;
  }

  async function loadUsage() {
    const data = await sendMessage({ type: 'GET_USAGE' });
    updateUsageUI(data);
  }

  function updateUsageUI(data) {
    const el = document.getElementById('lai-usage-info');
    if (!el) return;

    if (data.pro) {
      el.textContent = '⭐ Pro Plan — Unlimited generations';
      el.style.color = '#0a66c2';
    } else {
      el.textContent = `${data.limit - data.used} of ${data.limit} free generations remaining today`;
    }
  }

  async function generate() {
    const type = panel.querySelector('.lai-tab.active')?.dataset.type || 'post';
    const topic = document.getElementById('lai-topic').value.trim();
    const tone = document.getElementById('lai-tone').value;

    if (!topic) {
      showError('Please enter a topic or context.');
      return;
    }

    const btn = document.getElementById('lai-gen-btn');
    btn.disabled = true;

    const output = document.getElementById('lai-output');
    output.innerHTML = `<div class="lai-loader"><div class="lai-spinner"></div> Writing your ${type}...</div>`;

    const result = await sendMessage({ type: 'GENERATE', payload: { type, topic, tone } });

    btn.disabled = false;

    if (result.error) {
      if (result.error.includes('limit')) {
        showUpgradeBanner();
      } else {
        showError(result.error);
      }
      return;
    }

    generatedText = result.text;
    showResult(result.text);
    loadUsage();
  }

  function showResult(text) {
    const output = document.getElementById('lai-output');
    output.innerHTML = `
      <div class="lai-result" id="lai-result-text">${escapeHtml(text)}</div>
      <div class="lai-result-actions">
        <button class="lai-insert-btn" id="lai-insert">Insert</button>
        <button class="lai-copy-btn" id="lai-copy">Copy</button>
        <button class="lai-regen-btn" id="lai-regen">Redo</button>
      </div>
    `;

    document.getElementById('lai-insert').onclick = insertText;
    document.getElementById('lai-copy').onclick = copyText;
    document.getElementById('lai-regen').onclick = generate;
  }

  function insertText() {
    if (!activeTarget || !generatedText) return;

    activeTarget.focus();

    if (activeTarget.tagName === 'TEXTAREA') {
      activeTarget.value = generatedText;
      activeTarget.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      // LinkedIn uses contenteditable divs
      document.execCommand('selectAll');
      document.execCommand('insertText', false, generatedText);
    }

    closePanel();
  }

  function copyText() {
    navigator.clipboard.writeText(generatedText).then(() => {
      const btn = document.getElementById('lai-copy');
      if (btn) { btn.textContent = 'Copied!'; setTimeout(() => { if (btn) btn.textContent = 'Copy'; }, 2000); }
    });
  }

  function showError(msg) {
    const output = document.getElementById('lai-output');
    if (output) output.innerHTML = `<div class="lai-error">${msg}</div>`;
  }

  function showUpgradeBanner() {
    const output = document.getElementById('lai-output');
    output.innerHTML = `
      <div class="lai-upgrade-banner">
        <p>🚀 You've used all free generations today</p>
        <button class="lai-upgrade-btn" id="lai-upgrade">Upgrade to Pro — $9/mo</button>
      </div>
    `;
    document.getElementById('lai-upgrade').onclick = () => {
      chrome.runtime.sendMessage({ type: 'OPEN_UPGRADE' });
    };
  }

  function sendMessage(msg) {
    return new Promise((resolve) => chrome.runtime.sendMessage(msg, resolve));
  }

  function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
})();

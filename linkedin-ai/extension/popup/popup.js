const API_BASE = 'https://linkedai-api.vercel.app/api';

let currentUser = null;
let selectedType = 'post';
let generatedText = '';

// DOM refs
const $ = id => document.getElementById(id);

async function init() {
  const { token, user } = await storageGet(['token', 'user']);

  if (token && user) {
    currentUser = user;
    showLoggedIn(user);
    loadUsage(token);
  } else {
    showView('logged-out');
  }
}

function showView(view) {
  ['logged-out', 'signup-form', 'logged-in'].forEach(v =>
    document.getElementById(v).classList.toggle('hidden', v !== view)
  );
}

function showLoggedIn(user) {
  showView('logged-in');
  $('user-name').textContent = user.name || user.email;
  $('user-email').textContent = user.email;
  $('user-avatar').textContent = (user.name || user.email)[0].toUpperCase();
  if (user.pro) {
    $('plan-badge').textContent = 'Pro';
    $('plan-badge').classList.add('pro');
    $('pro-card').classList.remove('hidden');
    $('usage-card').classList.add('hidden');
    $('upgrade-section').classList.add('hidden');
  }
}

async function loadUsage(token) {
  try {
    const res = await fetch(`${API_BASE}/usage`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    if (!data.pro) {
      $('usage-count').textContent = `${data.used} / ${data.limit}`;
      $('usage-fill').style.width = `${(data.used / data.limit) * 100}%`;
    }
  } catch { /* ignore */ }
}

// Auth
$('login-btn').addEventListener('click', async () => {
  const email = $('email').value.trim();
  const password = $('password').value;
  if (!email || !password) return showAuthError('Please fill in all fields.');

  $('login-btn').disabled = true;
  $('login-btn').textContent = 'Signing in...';

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Login failed');

    await storageSet({ token: data.token, user: data.user });
    currentUser = data.user;
    showLoggedIn(data.user);
    loadUsage(data.token);
  } catch (e) {
    showAuthError(e.message);
  } finally {
    $('login-btn').disabled = false;
    $('login-btn').textContent = 'Sign In';
  }
});

$('signup-link').addEventListener('click', (e) => { e.preventDefault(); showView('signup-form'); });
$('back-login').addEventListener('click', (e) => { e.preventDefault(); showView('logged-out'); });

$('signup-btn').addEventListener('click', async () => {
  const name = $('signup-name').value.trim();
  const email = $('signup-email').value.trim();
  const password = $('signup-password').value;

  if (!name || !email || !password) return showSignupError('Please fill in all fields.');
  if (password.length < 6) return showSignupError('Password must be at least 6 characters.');

  $('signup-btn').disabled = true;
  $('signup-btn').textContent = 'Creating account...';

  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'Registration failed');

    await storageSet({ token: data.token, user: data.user });
    currentUser = data.user;
    showLoggedIn(data.user);
    loadUsage(data.token);
  } catch (e) {
    showSignupError(e.message);
  } finally {
    $('signup-btn').disabled = false;
    $('signup-btn').textContent = 'Create Account';
  }
});

$('logout-btn').addEventListener('click', async () => {
  await storageSet({ token: null, user: null });
  currentUser = null;
  showView('logged-out');
});

// Type selector
document.querySelectorAll('.type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedType = btn.dataset.type;
    if (selectedType === 'improve') {
      $('quick-topic').placeholder = 'Paste your text here to improve it...';
    } else {
      $('quick-topic').placeholder = 'Enter your topic or paste text...';
    }
  });
});

// Quick generate
$('quick-gen-btn').addEventListener('click', async () => {
  const topic = $('quick-topic').value.trim();
  if (!topic) return;

  const { token } = await storageGet(['token']);
  if (!token) { showView('logged-out'); return; }

  $('quick-gen-btn').disabled = true;
  $('quick-gen-btn').textContent = 'Writing...';
  $('quick-output').innerHTML = `<div class="loader"><div class="spinner"></div> Generating...</div>`;

  try {
    const res = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ type: selectedType, topic, tone: 'professional' })
    });

    const data = await res.json();

    if (!res.ok) {
      if (res.status === 429) {
        $('quick-output').innerHTML = `
          <div class="upgrade-prompt">
            🚀 Daily limit reached!
            <br><button id="pop-upgrade">Upgrade to Pro — $9/mo</button>
          </div>`;
        $('pop-upgrade').onclick = openUpgrade;
        return;
      }
      throw new Error(data.message || 'Generation failed');
    }

    generatedText = data.text;
    $('quick-output').innerHTML = `
      <div class="quick-result">${escapeHtml(data.text)}</div>
      <div class="result-actions">
        <button id="pop-copy">Copy</button>
        <button id="pop-regen">Redo</button>
      </div>
    `;
    $('pop-copy').onclick = () => {
      navigator.clipboard.writeText(generatedText).then(() => {
        $('pop-copy').textContent = 'Copied!';
        setTimeout(() => { if ($('pop-copy')) $('pop-copy').textContent = 'Copy'; }, 2000);
      });
    };
    $('pop-regen').onclick = () => $('quick-gen-btn').click();

    loadUsage(token);
  } catch (e) {
    $('quick-output').innerHTML = `<div class="error-msg">${e.message}</div>`;
  } finally {
    $('quick-gen-btn').disabled = false;
    $('quick-gen-btn').textContent = 'Generate';
  }
});

// Upgrade
$('upgrade-btn').addEventListener('click', openUpgrade);

async function openUpgrade() {
  const { token } = await storageGet(['token']);
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE}/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (data.url) chrome.tabs.create({ url: data.url });
  } catch { /* ignore */ }
}

function showAuthError(msg) {
  const el = $('auth-error');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function showSignupError(msg) {
  const el = $('signup-error');
  el.textContent = msg;
  el.classList.remove('hidden');
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function storageGet(keys) {
  return new Promise(resolve => chrome.storage.local.get(keys, resolve));
}

function storageSet(data) {
  return new Promise(resolve => chrome.storage.local.set(data, resolve));
}

init();

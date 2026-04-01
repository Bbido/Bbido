const API_BASE = 'https://linkedai-api.vercel.app/api';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GENERATE') {
    handleGenerate(message.payload).then(sendResponse).catch(err => {
      sendResponse({ error: err.message });
    });
    return true; // keep channel open for async response
  }

  if (message.type === 'GET_USER') {
    getUser().then(sendResponse);
    return true;
  }

  if (message.type === 'GET_USAGE') {
    getUsage().then(sendResponse);
    return true;
  }

  if (message.type === 'SET_TOKEN') {
    chrome.storage.local.set({ token: message.token }, () => sendResponse({ ok: true }));
    return true;
  }
});

async function getUser() {
  return new Promise(resolve => {
    chrome.storage.local.get(['token', 'user'], resolve);
  });
}

async function getUsage() {
  const { token } = await getUser();
  if (!token) return { used: 0, limit: 5, pro: false };

  try {
    const res = await fetch(`${API_BASE}/usage`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return await res.json();
  } catch {
    return { used: 0, limit: 5, pro: false };
  }
}

async function handleGenerate({ type, topic, tone, existing }) {
  const { token } = await getUser();

  const res = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : ''
    },
    body: JSON.stringify({ type, topic, tone, existing })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Generation failed');
  }

  return await res.json();
}

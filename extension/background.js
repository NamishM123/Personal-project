// Background service worker.
// Opens options on first install. Handles cross-origin POSTs from
// the content script (which can't make credentialed requests itself).

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.runtime.openOptionsPage();
  }
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "ST_SAVE_JOB") {
    saveJob(msg.payload).then(sendResponse);
    return true; // keep the message channel open for the async reply
  }
});

async function saveJob(payload) {
  const { trackerUrl, autoDetect } = await chrome.storage.sync.get(["trackerUrl", "autoDetect"]);
  if (!trackerUrl) {
    return { ok: false, error: "Set your tracker URL in extension Options first." };
  }
  if (autoDetect === false && payload.__fromAuto) {
    return { ok: false, error: "Auto-detect is off." };
  }
  try {
    const res = await fetch(`${trackerUrl.replace(/\/$/, "")}/api/jobs`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company: payload.company,
        title: payload.title,
        location: payload.location || null,
        url: payload.url || null,
        source: payload.source || null,
        status: "applied",
      }),
    });
    if (res.status === 401) {
      return { ok: false, error: "Sign in to your tracker in this browser, then try again." };
    }
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      return { ok: false, error: j.error || `Failed (${res.status})` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `Network error: ${e.message}` };
  }
}

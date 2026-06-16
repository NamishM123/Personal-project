// popup.js — autofill the form from the current tab, then POST to your tracker.

const $ = (id) => document.getElementById(id);

const els = {
  company: $("company"),
  title: $("title"),
  location: $("location"),
  url: $("url"),
  status: $("status"),
  source: $("source"),
  notes: $("notes"),
  save: $("save"),
  settings: $("settings"),
  statusLine: $("status"),
  hint: $("hint"),
};

(async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  els.url.value = tab.url ?? "";
  els.source.value = guessSource(tab.url ?? "");

  try {
    const [{ result } = {}] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractFromPage,
    });
    if (result) {
      if (result.company) els.company.value = result.company;
      if (result.title) els.title.value = result.title;
      if (result.location) els.location.value = result.location;
      if (result.notes) els.notes.value = result.notes;
    }
  } catch (e) {
    els.hint.textContent = "Couldn't auto-detect this page; fill it in manually.";
  }

  const { trackerUrl } = await chrome.storage.sync.get("trackerUrl");
  if (!trackerUrl) {
    els.hint.textContent = "Click Settings to set your tracker URL first.";
  }
})();

els.save.addEventListener("click", async () => {
  const { trackerUrl, sessionCookie } = await chrome.storage.sync.get(["trackerUrl", "sessionCookie"]);
  if (!trackerUrl) {
    setStatus("Set your tracker URL in Settings.", "err");
    return;
  }
  if (!els.company.value || !els.title.value) {
    setStatus("Company and title are required.", "err");
    return;
  }
  els.save.disabled = true;
  setStatus("Saving…");

  try {
    const res = await fetch(`${trackerUrl.replace(/\/$/, "")}/api/jobs`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        company: els.company.value.trim(),
        title: els.title.value.trim(),
        location: els.location.value.trim() || null,
        url: els.url.value || null,
        status: els.status.value,
        source: els.source.value.trim() || null,
        notes: els.notes.value.trim() || null,
      }),
    });
    if (res.status === 401) {
      setStatus("You're not signed in. Open the tracker, sign in, then try again.", "err");
    } else if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setStatus(j.error || `Failed (${res.status})`, "err");
    } else {
      setStatus("Saved ✓", "ok");
      setTimeout(() => window.close(), 600);
    }
  } catch (e) {
    setStatus(`Network error: ${e.message}`, "err");
  } finally {
    els.save.disabled = false;
  }
});

els.settings.addEventListener("click", () => chrome.runtime.openOptionsPage());

function setStatus(text, kind = "") {
  els.statusLine.textContent = text;
  els.statusLine.className = `status ${kind}`;
}

function guessSource(url) {
  try {
    const h = new URL(url).hostname;
    if (h.includes("linkedin")) return "LinkedIn";
    if (h.includes("indeed")) return "Indeed";
    if (h.includes("greenhouse")) return "Greenhouse";
    if (h.includes("lever")) return "Lever";
    if (h.includes("ashbyhq")) return "Ashby";
    if (h.includes("workday")) return "Workday";
    return h.replace(/^www\./, "");
  } catch {
    return "";
  }
}

// Executed in the page context — extracts what it can from common job-board layouts.
function extractFromPage() {
  function text(selector) {
    const el = document.querySelector(selector);
    return el ? el.textContent.trim().replace(/\s+/g, " ") : "";
  }
  function meta(name) {
    const el = document.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
    return el ? el.getAttribute("content") || "" : "";
  }

  const host = location.hostname;
  let company = "";
  let title = "";
  let loc = "";

  if (host.includes("linkedin.com")) {
    title = text(".job-details-jobs-unified-top-card__job-title") || text("h1.t-24");
    company = text(".job-details-jobs-unified-top-card__company-name") || text(".jobs-unified-top-card__company-name");
    loc = text(".job-details-jobs-unified-top-card__primary-description-container .tvm__text") ||
          text(".jobs-unified-top-card__bullet");
  } else if (host.includes("indeed.com")) {
    title = text("h1.jobsearch-JobInfoHeader-title") || text('[data-testid="jobsearch-JobInfoHeader-title"]');
    company = text('[data-testid="inlineHeader-companyName"]') || text(".jobsearch-CompanyInfoContainer a");
    loc = text('[data-testid="job-location"]') || text(".jobsearch-JobInfoHeader-subtitle div");
  } else if (host.includes("greenhouse.io")) {
    title = text(".app-title") || text("h1");
    company = text(".company-name")?.replace(/^at\s+/i, "") || "";
    loc = text(".location");
  } else if (host.includes("lever.co")) {
    title = text(".posting-headline h2") || text("h2");
    company = text(".main-header-text h3") || "";
    loc = text(".posting-categories .sort-by-location") || text(".location");
  } else if (host.includes("ashbyhq.com")) {
    title = text("h1");
    company = text("header h2") || "";
    loc = text('[class*="Location"]');
  } else if (host.includes("workday.com") || host.includes("myworkdayjobs.com")) {
    title = text('[data-automation-id="jobPostingHeader"]') || text("h2");
    loc = text('[data-automation-id="locations"]');
  } else {
    title = meta("og:title") || document.title || "";
    company = meta("og:site_name") || "";
  }

  return { company, title, location: loc, notes: "" };
}

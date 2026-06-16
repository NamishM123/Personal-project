/*
 * Auto-detect job applications across the web.
 *
 * How it works:
 *   1. On page load, decide if this looks like a job-posting page.
 *      If so, extract details and cache them via the background worker.
 *   2. Hook every form submit on the page. Arm a "submission watcher"
 *      that runs for ~30s afterwards.
 *   3. The watcher checks for confirmation signals:
 *        - URL path now contains /thank-you, /confirmation, /submitted, etc.
 *        - Page text now contains "application submitted",
 *          "thank you for applying", "we received your application", etc.
 *   4. On a confirmed application, show a non-intrusive toast in the
 *      bottom-right of the page with one Save click.
 *
 * Generic detection trades a little precision for coverage. The toast
 * always asks for confirmation, so a false positive costs the user
 * one click to dismiss; nothing pollutes the tracker without consent.
 */

(() => {
  if (window.__stTrackerInjected) return;
  window.__stTrackerInjected = true;

  const CONFIRMATION_URL_HINTS = [
    "/thank-you",
    "/thank_you",
    "/thanks",
    "/confirmation",
    "/confirmed",
    "/submitted",
    "/applied",
    "/application-complete",
    "/application-received",
    "/application/complete",
    "/application/received",
    "/success",
    "/received",
  ];

  const CONFIRMATION_TEXT_HINTS = [
    "application submitted",
    "application received",
    "your application has been received",
    "we received your application",
    "we have received your application",
    "thanks for applying",
    "thank you for applying",
    "thanks for your application",
    "thank you for your application",
    "thanks for your interest",
    "we'll be in touch",
    "we will be in touch",
    "we'll review your application",
    "your application is in",
    "application complete",
    "successfully applied",
  ];

  const JOB_PATH_HINTS = [
    "/jobs",
    "/job/",
    "/careers",
    "/career",
    "/apply",
    "/positions",
    "/opening",
    "/openings",
    "/vacancy",
    "/vacancies",
    "/roles",
    "/role/",
  ];

  const KNOWN_HOSTS = [
    "linkedin.com",
    "indeed.com",
    "greenhouse.io",
    "lever.co",
    "ashbyhq.com",
    "workday.com",
    "myworkdayjobs.com",
    "smartrecruiters.com",
    "icims.com",
    "wellfound.com",
    "angel.co",
    "ycombinator.com",
    "breezy.hr",
    "jobvite.com",
    "rippling.com",
    "remote.com",
    "ashby.com",
    "bamboohr.com",
    "personio.com",
    "workable.com",
    "recruitee.com",
  ];

  const text = (sel) => {
    const el = document.querySelector(sel);
    return el ? el.textContent.trim().replace(/\s+/g, " ") : "";
  };
  const metaContent = (name) => {
    const el = document.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
    return el ? (el.getAttribute("content") || "").trim() : "";
  };

  function pathLooksJobby(url) {
    try {
      const p = new URL(url).pathname.toLowerCase();
      return JOB_PATH_HINTS.some((h) => p.includes(h));
    } catch {
      return false;
    }
  }
  function hostKnown(url) {
    try {
      const h = new URL(url).hostname.toLowerCase();
      return KNOWN_HOSTS.some((k) => h.includes(k));
    } catch {
      return false;
    }
  }

  /** Generic heuristic: does this page look like a job posting? */
  function looksLikeJobPage() {
    if (hostKnown(location.href) && pathLooksJobby(location.href)) return true;

    // Generic signal: form on the page has labels mentioning resume, CV,
    // cover letter, LinkedIn URL, portfolio, or there's a button labeled
    // "Apply", and the URL or title mentions a role-ish word.
    const formText = (document.querySelector("form") || document.body).innerText.toLowerCase();
    const looksLikeAppForm =
      /(resume|cv|cover letter|portfolio|linkedin url|github url|why do you want|work history|years of experience)/.test(
        formText
      );
    const hasApplyButton = !!Array.from(document.querySelectorAll("button, a, input[type=submit]")).find((b) => {
      const t = (b.innerText || b.value || "").trim().toLowerCase();
      return t === "apply" || t === "apply now" || t === "submit application" || t.startsWith("submit ");
    });
    const titleLooksJobby = /\b(engineer|developer|designer|manager|analyst|intern|scientist|software|product|marketing|sales|recruit|associate|director|head of|lead)\b/i.test(
      document.title || ""
    );

    return (looksLikeAppForm || hasApplyButton) && (pathLooksJobby(location.href) || titleLooksJobby);
  }

  function extractJob() {
    const host = location.hostname;
    let title = "";
    let company = "";
    let loc = "";

    if (host.includes("linkedin.com")) {
      title = text(".job-details-jobs-unified-top-card__job-title") || text("h1.t-24");
      company =
        text(".job-details-jobs-unified-top-card__company-name") ||
        text(".jobs-unified-top-card__company-name");
      loc =
        text(".job-details-jobs-unified-top-card__primary-description-container .tvm__text") ||
        text(".jobs-unified-top-card__bullet");
    } else if (host.includes("indeed.com")) {
      title = text("h1.jobsearch-JobInfoHeader-title") || text('[data-testid="jobsearch-JobInfoHeader-title"]');
      company =
        text('[data-testid="inlineHeader-companyName"]') ||
        text(".jobsearch-CompanyInfoContainer a");
      loc = text('[data-testid="job-location"]');
    } else if (host.includes("greenhouse.io")) {
      title = text(".app-title") || text("h1");
      company = (text(".company-name") || "").replace(/^at\s+/i, "");
      loc = text(".location");
    } else if (host.includes("lever.co")) {
      title = text(".posting-headline h2") || text("h2");
      company = text(".main-header-text h3") || "";
      loc = text(".posting-categories .sort-by-location") || text(".location");
    } else if (host.includes("ashbyhq.com") || host.includes("ashby.com")) {
      title = text("h1");
      company = text("header h2") || "";
      loc = text('[class*="Location"]');
    } else if (host.includes("workday.com") || host.includes("myworkdayjobs.com")) {
      title = text('[data-automation-id="jobPostingHeader"]') || text("h2");
      loc = text('[data-automation-id="locations"]');
    }

    // Generic fallback: meta tags + document title.
    if (!title) title = metaContent("og:title") || (document.title || "").split(" | ")[0].trim();
    if (!company) {
      company =
        metaContent("og:site_name") ||
        text('[itemprop="hiringOrganization"]') ||
        text('a[rel="author"]') ||
        guessCompanyFromHost(host);
    }

    return {
      company: cleanField(company),
      title: cleanField(title),
      location: cleanField(loc),
      url: location.href,
      source: guessSource(host),
    };
  }

  function guessCompanyFromHost(host) {
    // Strip jobs.<co>.com, careers.<co>.com, <co>-careers.com, etc.
    const h = host.replace(/^www\./, "");
    const parts = h.split(".");
    if (parts.length < 2) return "";
    const candidate = parts[parts.length - 2];
    if (["greenhouse", "lever", "ashbyhq", "workday", "linkedin", "indeed", "smartrecruiters"].includes(candidate)) {
      return "";
    }
    return candidate ? candidate[0].toUpperCase() + candidate.slice(1) : "";
  }

  function guessSource(host) {
    const h = host.replace(/^www\./, "");
    if (h.includes("linkedin")) return "LinkedIn";
    if (h.includes("indeed")) return "Indeed";
    if (h.includes("greenhouse")) return "Greenhouse";
    if (h.includes("lever")) return "Lever";
    if (h.includes("ashby")) return "Ashby";
    if (h.includes("workday")) return "Workday";
    return h;
  }

  function cleanField(s) {
    return (s || "").replace(/\s+/g, " ").trim().slice(0, 200);
  }

  /* -------------------- Confirmation detection -------------------- */

  function urlIsConfirmation(href = location.href) {
    const p = new URL(href).pathname.toLowerCase();
    return CONFIRMATION_URL_HINTS.some((h) => p.includes(h));
  }

  let bodyTextCache = "";
  let bodyTextAt = 0;
  function bodyText() {
    if (Date.now() - bodyTextAt < 250) return bodyTextCache;
    bodyTextCache = (document.body?.innerText || "").toLowerCase();
    bodyTextAt = Date.now();
    return bodyTextCache;
  }
  function textIsConfirmation() {
    const t = bodyText();
    return CONFIRMATION_TEXT_HINTS.some((p) => t.includes(p));
  }

  /* -------------------- Toast -------------------- */

  async function showConfirmToast(job) {
    if (document.getElementById("__st-toast")) return;
    try {
      const { autoDetect } = await chrome.storage.sync.get("autoDetect");
      if (autoDetect === false) return;
    } catch {
      // If storage isn't reachable, fall through and show the toast.
    }

    const root = document.createElement("div");
    root.id = "__st-toast";
    root.attachShadow({ mode: "open" });
    root.shadowRoot.innerHTML = `
      <style>
        :host, * { box-sizing: border-box; }
        .card {
          position: fixed; right: 16px; bottom: 16px; z-index: 2147483647;
          width: 340px; padding: 14px 14px 12px;
          background: #0f1411; color: #e9efe9;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          box-shadow: 0 24px 60px -20px rgba(0,0,0,0.6);
          font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Inter, sans-serif;
          font-size: 13px; line-height: 1.4;
          opacity: 0; transform: translateY(8px) scale(0.98);
          transition: opacity 220ms cubic-bezier(0.22,1,0.36,1),
                      transform 240ms cubic-bezier(0.22,1,0.36,1);
        }
        .card.in { opacity: 1; transform: translateY(0) scale(1); }
        .row { display: flex; align-items: flex-start; gap: 10px; }
        .mark {
          width: 24px; height: 24px; border-radius: 6px;
          background: #2f9e6e; flex-shrink: 0;
          display: grid; place-items: center;
          color: #0f1411; font-weight: 700; font-size: 11px;
        }
        h4 { margin: 0 0 2px; font-size: 13px; font-weight: 600; letter-spacing: -0.01em; }
        p { margin: 0; color: #97a09a; font-size: 12px; }
        .fields { margin-top: 10px; display: grid; gap: 6px; }
        label { font-size: 11px; color: #97a09a; }
        input {
          width: 100%; padding: 6px 8px; font-size: 12px;
          background: rgba(255,255,255,0.04); color: #e9efe9;
          border: 1px solid rgba(255,255,255,0.08); border-radius: 7px;
          outline: none; font-family: inherit;
        }
        input:focus { border-color: #2f9e6e; }
        .actions { margin-top: 12px; display: flex; gap: 6px; justify-content: flex-end; }
        button {
          padding: 6px 10px; font-size: 12px; font-weight: 500; font-family: inherit;
          border-radius: 8px; border: 1px solid transparent; cursor: pointer;
          background: transparent; color: #e9efe9;
          transition: transform 120ms cubic-bezier(0.22,1,0.36,1),
                      background-color 120ms ease-out;
        }
        button:active { transform: scale(0.97); }
        button.ghost { color: #97a09a; }
        button.ghost:hover { background: rgba(255,255,255,0.06); color: #e9efe9; }
        button.primary { background: #2f9e6e; color: #0f1411; font-weight: 600; }
        button.primary:hover { background: #38b27e; }
        .status { font-size: 11px; color: #97a09a; margin-top: 6px; min-height: 14px; }
        .status.err { color: #ef6b6b; }
        .status.ok { color: #58c896; }
        .close {
          position: absolute; top: 8px; right: 8px;
          width: 22px; height: 22px; border-radius: 6px;
          color: #97a09a; padding: 0; line-height: 1;
        }
      </style>
      <div class="card">
        <button class="close ghost" aria-label="Dismiss">×</button>
        <div class="row">
          <div class="mark">ST</div>
          <div>
            <h4>Log this application?</h4>
            <p>Looks like you just applied. Save it to your tracker.</p>
          </div>
        </div>
        <div class="fields">
          <div>
            <label>Company</label>
            <input id="company" />
          </div>
          <div>
            <label>Title</label>
            <input id="title" />
          </div>
        </div>
        <div class="actions">
          <button class="ghost" id="dismiss">Not a job</button>
          <button class="primary" id="save">Save</button>
        </div>
        <p class="status" id="status"></p>
      </div>
    `;
    document.documentElement.appendChild(root);
    const sr = root.shadowRoot;
    const card = sr.querySelector(".card");
    const $ = (id) => sr.getElementById(id);

    $("company").value = job.company || "";
    $("title").value = job.title || "";

    requestAnimationFrame(() => card.classList.add("in"));

    let dismissed = false;
    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      card.classList.remove("in");
      setTimeout(() => root.remove(), 240);
    }

    $("dismiss").addEventListener("click", dismiss);
    $("close").addEventListener("click", dismiss);

    $("save").addEventListener("click", async () => {
      const payload = {
        ...job,
        company: $("company").value.trim(),
        title: $("title").value.trim(),
      };
      if (!payload.company || !payload.title) {
        $("status").textContent = "Company and title are required.";
        $("status").className = "status err";
        return;
      }
      $("save").disabled = true;
      $("status").textContent = "Saving…";
      $("status").className = "status";

      try {
        const res = await chrome.runtime.sendMessage({ type: "ST_SAVE_JOB", payload });
        if (!res?.ok) {
          $("status").textContent = res?.error || "Save failed.";
          $("status").className = "status err";
          $("save").disabled = false;
        } else {
          $("status").textContent = "Saved.";
          $("status").className = "status ok";
          setTimeout(dismiss, 900);
        }
      } catch (e) {
        $("status").textContent = "Couldn't reach the tracker.";
        $("status").className = "status err";
        $("save").disabled = false;
      }
    });

    // Auto-dismiss after 45s of inactivity so the toast doesn't stick around.
    setTimeout(dismiss, 45_000);
  }

  /* -------------------- Wiring -------------------- */

  let cachedJob = null;
  let watchUntil = 0;
  let watcherTimer = null;
  let confirmed = false;

  function recache() {
    if (looksLikeJobPage()) {
      const job = extractJob();
      if (job.title) cachedJob = job;
    }
  }

  function armWatcher() {
    watchUntil = Date.now() + 30_000;
    if (watcherTimer) return;
    watcherTimer = setInterval(() => {
      if (confirmed || Date.now() > watchUntil) {
        clearInterval(watcherTimer);
        watcherTimer = null;
        return;
      }
      if (urlIsConfirmation() || textIsConfirmation()) {
        confirmed = true;
        clearInterval(watcherTimer);
        watcherTimer = null;
        // Use the cached job if we have one; otherwise re-extract from current page.
        const job = cachedJob || extractJob();
        if (job.title || job.company) showConfirmToast(job);
      }
    }, 800);
  }

  // Hook submits
  document.addEventListener(
    "submit",
    () => {
      recache();
      armWatcher();
    },
    true
  );

  // Many modern apply flows use buttons, not form submits.
  document.addEventListener(
    "click",
    (e) => {
      const el = e.target.closest("button, a, input[type=submit]");
      if (!el) return;
      const label = (el.innerText || el.value || el.ariaLabel || "").trim().toLowerCase();
      if (
        label === "submit application" ||
        label === "submit" ||
        label === "apply" ||
        label === "apply now" ||
        label === "send application" ||
        label.includes("submit application")
      ) {
        recache();
        armWatcher();
      }
    },
    true
  );

  // First pass on load — also catches confirmation pages reached directly.
  recache();
  if (urlIsConfirmation() || textIsConfirmation()) {
    const job = cachedJob || extractJob();
    if (job.title || job.company) showConfirmToast(job);
  }

  // Catch SPA navigations (LinkedIn, etc.)
  let lastHref = location.href;
  const obs = new MutationObserver(() => {
    if (location.href !== lastHref) {
      lastHref = location.href;
      recache();
      if (urlIsConfirmation()) {
        const job = cachedJob || extractJob();
        if (job.title || job.company) showConfirmToast(job);
      }
    }
  });
  obs.observe(document.documentElement, { childList: true, subtree: true });
})();

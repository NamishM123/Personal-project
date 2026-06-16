# Summer Tracker: Browser Extension

A small Chrome/Edge extension that saves job applications to your Summer Tracker. Two flavors:

1. **One-click save** from the extension popup on any job posting (LinkedIn, Indeed, Greenhouse, Lever, Ashby, Workday, or anywhere).
2. **Auto-detect** mode: the extension watches every page and pops a small confirmation toast when it thinks you just submitted an application, regardless of which site you used. You always confirm or dismiss; nothing is saved silently.

## Install (dev mode)

1. Deploy your tracker (or run locally on `http://localhost:3000`) and sign in.
2. Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, pick this `extension/` folder.
3. The Options page opens automatically on first install.
4. Paste your tracker URL (e.g. `https://your-app.vercel.app`).
5. Leave **Auto-detect** ticked (or untick if you want manual only).

## How auto-detect works

On every page (except a small blocklist like Google, YouTube, social media), a content script:

1. Decides if the page looks like a job posting (known host like LinkedIn, or generic signals like an "Apply" button + resume/cover-letter form fields).
2. Extracts company, title, location from common selectors.
3. Hooks form submits and Apply-button clicks.
4. After a submit, watches for 30 seconds for a confirmation signal:
   - URL path contains `/thank-you`, `/confirmation`, `/submitted`, `/applied`, `/success`, etc.
   - Page text contains "application submitted", "thank you for applying", "we received your application", etc.
5. When a confirmation is detected, a toast appears bottom-right. One Save click logs it.

If you visit a confirmation page directly (e.g. from an email link), the toast also pops automatically.

## How auth works

The background service worker POSTs to `${trackerUrl}/api/jobs` with `credentials: "include"`, using your existing tracker session cookie. If you're not signed in, sign in at the tracker URL in a normal tab first.

## Privacy

- The extension only reads the page you're currently on.
- It only sends data to *your* tracker URL, nothing third-party.
- Auto-detect can be turned off at any time in the Options page.
- The blocklist in `manifest.json` excludes common high-traffic sites where the heuristics would be noise.

# Summer Tracker — Browser Extension

A tiny Chrome/Edge extension that saves a job posting to your Summer Tracker in one click.

## Install (dev mode)

1. Deploy your tracker (or run it locally on `http://localhost:3000`) and sign in.
2. Open `chrome://extensions`, enable **Developer mode**, and click **Load unpacked**.
3. Pick this `extension/` folder.
4. Open the extension's **Options** page and paste your tracker URL (e.g. `https://your-app.vercel.app`).

## Use

1. Visit a job posting on LinkedIn, Indeed, Greenhouse, Lever, Ashby, Workday, or any company page.
2. Click the extension icon.
3. The form is pre-filled where possible. Tweak it, click **Save**.

## How auth works

The popup `POST`s to `${trackerUrl}/api/jobs` with `credentials: "include"`, so it
uses your existing tracker session cookie. If you're not signed in, sign in at
your tracker URL in a normal tab first.

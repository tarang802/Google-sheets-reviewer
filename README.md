# Hackathon Idea Review

Reads submissions from a Google Sheet, renders them as reviewable cards, and
writes Accept/Reject decisions back into the sheet (with reviewer name + timestamp).

## Structure

- `backend/` — Express API. Talks to Google Sheets via a service account. Handles login (5 hardcoded reviewers) and read/write of submissions.
- `frontend/` — React (Vite) UI. Login screen, filterable card dashboard, Accept/Reject buttons.

## 1. Google Sheets access (one-time setup)

Uses OAuth as your own Google account rather than a service account key,
since many Cloud orgs now block service-account key creation by policy.
Because you authorize as yourself, and you already own the sheet, there's no
separate "share with this email" step.

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → create a project.
2. Enable the **Google Sheets API** for that project.
3. **APIs & Services → OAuth consent screen** → set User Type to **External**,
   fill in the required fields, and add yourself as a **test user**.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID** →
   Application type: **Desktop app**. Copy the generated **Client ID** and
   **Client Secret**.
5. Copy the Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/`**`SHEET_ID`**`/edit`.

The backend will automatically add `Decision`, `Reviewed By`, and `Reviewed At`
columns to the end of your sheet the first time it runs, if they don't exist yet.

> Note: because the OAuth consent screen stays in "Testing" mode (no Google
> verification needed for a single-user tool like this), the refresh token
> expires after ~7 days of the app being unused. If it stops working mid-review,
> just rerun `node scripts/get-refresh-token.js` and paste the new token in `.env`.

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
- `SHEET_ID` — from step 1.5 above
- `SHEET_TAB_NAME` — the tab name at the bottom of your sheet (e.g. `Sheet1`)
- `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` — from step 1.4
- `JWT_SECRET` — any long random string
- `REVIEWERS` — `Name:password,Name:password,...` for your 5 reviewers
- `FRONTEND_ORIGIN` — where the frontend runs (`http://localhost:5173` for local dev)

Then mint the refresh token (one-time, opens a browser tab to sign in as
whichever Google account owns the sheet):

```bash
node scripts/get-refresh-token.js
```

Paste the printed value into `.env` as `GOOGLE_OAUTH_REFRESH_TOKEN`.

Run the backend:
```bash
npm run dev
```

## 3. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
```

Set `VITE_API_URL` in `.env` to the backend URL (`http://localhost:4000` locally).

Run it:
```bash
npm run dev
```

Open `http://localhost:5173`.

## 4. Deploying

- **Backend** → Render or Railway (Node web service). Set the same env vars from
  `.env` in the host's dashboard, including the three `GOOGLE_OAUTH_*` values
  (there's no key file to upload — the refresh token is the only secret to copy over).
- **Frontend** → Vercel. Set `VITE_API_URL` to your deployed backend URL.
- Update `FRONTEND_ORIGIN` on the backend to your deployed frontend URL, and
  make sure both are served over HTTPS (required for the `secure` session cookie
  in production).

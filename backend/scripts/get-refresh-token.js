// One-time script: run this once to authorize your own Google account and
// print a refresh token to put in .env. Requires GOOGLE_OAUTH_CLIENT_ID and
// GOOGLE_OAUTH_CLIENT_SECRET to already be set in .env (from a Desktop-app
// OAuth client you created in Google Cloud Console).
//
// Usage:
//   node scripts/get-refresh-token.js
// Then open the printed URL, sign in with the Google account that owns the
// sheet, approve access, and the token will be printed here automatically.

import "dotenv/config";
import http from "node:http";
import { google } from "googleapis";

const CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const REDIRECT_URI = "http://localhost:3999/oauth2callback";

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in .env first.");
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/spreadsheets"],
});

console.log("\nOpen this URL, sign in with the account that owns the sheet, and approve access:\n");
console.log(authUrl, "\n");

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith("/oauth2callback")) return;

  const url = new URL(req.url, REDIRECT_URI);
  const code = url.searchParams.get("code");

  res.end("Success — you can close this tab and return to the terminal.");
  server.close();

  const { tokens } = await oauth2Client.getToken(code);
  console.log("\nRefresh token (put this in backend/.env as GOOGLE_OAUTH_REFRESH_TOKEN):\n");
  console.log(tokens.refresh_token);
  console.log();
  process.exit(0);
});

server.listen(3999, () => console.log("Waiting for authorization…"));

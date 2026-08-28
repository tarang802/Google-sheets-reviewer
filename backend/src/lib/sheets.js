import { google } from "googleapis";

const SHEET_ID = process.env.SHEET_ID;
const TAB_NAME = process.env.SHEET_TAB_NAME || "Sheet1";

let sheetsClient = null;

// Authenticates as your own Google account via a pre-authorized OAuth
// refresh token (see scripts/get-refresh-token.js), rather than a service
// account key — needed because this Cloud org blocks service account key
// creation (iam.disableServiceAccountKeyCreation).
function getSheetsClient() {
  if (!sheetsClient) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN });
    sheetsClient = google.sheets({ version: "v4", auth: oauth2Client });
  }
  return sheetsClient;
}

let tabSheetId = null;

// Numeric sheet/tab id (gid) needed for cell-formatting requests, as
// distinct from the spreadsheet's string SHEET_ID.
async function getTabSheetId() {
  if (tabSheetId === null) {
    const sheets = await getSheetsClient();
    const res = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
    const tab = res.data.sheets.find((s) => s.properties.title === TAB_NAME);
    if (!tab) throw new Error(`Tab "${TAB_NAME}" not found in spreadsheet`);
    tabSheetId = tab.properties.sheetId;
  }
  return tabSheetId;
}

const DECISION_COLORS = {
  ACCEPTED: { background: { red: 0.78, green: 0.91, blue: 0.80 }, text: { red: 0.06, green: 0.36, blue: 0.14 } },
  REJECTED: { background: { red: 0.97, green: 0.78, blue: 0.78 }, text: { red: 0.53, green: 0.08, blue: 0.08 } },
  PENDING: { background: { red: 1, green: 1, blue: 1 }, text: { red: 0, green: 0, blue: 0 } },
};

function columnLetter(index) {
  let letter = "";
  let n = index;
  while (n >= 0) {
    letter = String.fromCharCode((n % 26) + 65) + letter;
    n = Math.floor(n / 26) - 1;
  }
  return letter;
}

const REQUIRED_TRAILING_COLUMNS = ["Decision", "Reviewed By", "Reviewed At"];

// Reads the header row, appends any of the required trailing columns that
// don't already exist, and returns the final header list in sheet order.
export async function ensureHeaders() {
  const sheets = await getSheetsClient();
  const headerRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${TAB_NAME}!1:1`,
  });
  const headers = headerRes.data.values?.[0] || [];

  const missing = REQUIRED_TRAILING_COLUMNS.filter((c) => !headers.includes(c));
  if (missing.length > 0) {
    const startCol = headers.length;
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${TAB_NAME}!${columnLetter(startCol)}1`,
      valueInputOption: "RAW",
      requestBody: { values: [missing] },
    });
    headers.push(...missing);
  }
  return headers;
}

export async function getSubmissions() {
  const sheets = await getSheetsClient();
  const headers = await ensureHeaders();

  const dataRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${TAB_NAME}!A2:${columnLetter(headers.length - 1)}`,
  });
  const rows = dataRes.data.values || [];

  return rows
    .map((row, i) => {
      const record = { rowNumber: i + 2 }; // +2: header is row 1, data starts row 2
      headers.forEach((header, colIdx) => {
        record[header] = row[colIdx] ?? "";
      });
      return record;
    })
    .filter((record) =>
      // skip fully blank rows
      Object.entries(record).some(([k, v]) => k !== "rowNumber" && String(v).trim() !== "")
    );
}

export async function setDecision(rowNumber, decision, reviewerName) {
  const sheets = await getSheetsClient();
  const headers = await ensureHeaders();

  const decisionCol = columnLetter(headers.indexOf("Decision"));
  const reviewedByCol = columnLetter(headers.indexOf("Reviewed By"));
  const reviewedAtCol = columnLetter(headers.indexOf("Reviewed At"));

  const timestamp = new Date().toISOString();

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      valueInputOption: "RAW",
      data: [
        { range: `${TAB_NAME}!${decisionCol}${rowNumber}`, values: [[decision]] },
        { range: `${TAB_NAME}!${reviewedByCol}${rowNumber}`, values: [[reviewerName]] },
        { range: `${TAB_NAME}!${reviewedAtCol}${rowNumber}`, values: [[timestamp]] },
      ],
    },
  });

  const sheetId = await getTabSheetId();
  const decisionColIndex = headers.indexOf("Decision");
  const colors = DECISION_COLORS[decision];

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: rowNumber - 1,
              endRowIndex: rowNumber,
              startColumnIndex: decisionColIndex,
              endColumnIndex: decisionColIndex + 1,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: colors.background,
                textFormat: { foregroundColor: colors.text, bold: decision !== "PENDING" },
              },
            },
            fields: "userEnteredFormat(backgroundColor,textFormat)",
          },
        },
      ],
    },
  });

  return { rowNumber, decision, reviewedBy: reviewerName, reviewedAt: timestamp };
}

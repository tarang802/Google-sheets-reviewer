// Submissions come from a sheet whose exact header names may vary.
// These helpers guess which column is "team name", "track", etc. by
// matching header text loosely, instead of hardcoding exact strings.

const SYSTEM_FIELDS = new Set(["rowNumber", "Decision", "Reviewed By", "Reviewed At"]);

function findKey(record, patterns) {
  const keys = Object.keys(record);
  for (const pattern of patterns) {
    const match = keys.find((k) => pattern.test(k));
    if (match) return match;
  }
  return null;
}

export function getTeamName(record) {
  const key = findKey(record, [/^team\s*name$/i, /team/i]);
  return key ? record[key] : `Row ${record.rowNumber}`;
}

export function getLeaderName(record) {
  const key = findKey(record, [/leader\s*name/i, /^name$/i]);
  return key ? record[key] : "";
}

export function getTrack(record) {
  const key = findKey(record, [/track/i, /domain/i, /theme/i, /category/i]);
  return key ? record[key] : "";
}

export function getDecision(record) {
  return record["Decision"] || "PENDING";
}

// Everything else, in sheet column order, for the expandable detail view.
export function getDetailFields(record) {
  return Object.entries(record).filter(([key]) => !SYSTEM_FIELDS.has(key));
}

const LONG_FIELD_THRESHOLD = 60;

// Short fields (mobile, email, college, submission id...) render as a
// compact info grid; long fields (problem statement, solution...) render as
// full-width readable blocks. Split by value length rather than by name,
// since header names vary sheet to sheet.
export function getShortFields(record) {
  return getDetailFields(record).filter(([, value]) => String(value).length <= LONG_FIELD_THRESHOLD);
}

export function getLongFields(record) {
  return getDetailFields(record).filter(([, value]) => String(value).length > LONG_FIELD_THRESHOLD);
}

export function getPreviewText(record) {
  const key = findKey(record, [/problem\s*statement/i, /problem/i]);
  const longFields = getLongFields(record);
  const text = key ? record[key] : longFields[0]?.[1] || "";
  const trimmed = String(text).trim();
  return trimmed.length > 160 ? trimmed.slice(0, 160) + "…" : trimmed;
}

export function getUniqueTracks(records) {
  const tracks = new Set(records.map(getTrack).filter(Boolean));
  return Array.from(tracks).sort();
}

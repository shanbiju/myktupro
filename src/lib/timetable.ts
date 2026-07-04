export interface TimetableExamEntry {
  id: string;
  date: string;
  day: string;
  semester: string;
  scheme?: string;
  slot: string;
  session: string;
  subject_code?: string;
}

export const TIMETABLE_REQUIRED_HEADERS = ["date", "day", "semester", "scheme", "slot", "session"] as const;

const VALID_SEMESTERS = new Set(["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"]);
const VALID_SLOTS = new Set(["A", "B", "C", "D", "E", "F"]);
const VALID_SESSIONS = new Set(["FN", "AN"]);

export function normalizeSemester(semester?: string): string {
  const normalized = String(semester || "").trim().toUpperCase();
  const match = normalized.match(/^S?([1-8])$/);
  if (match) return `S${match[1]}`;
  return normalized;
}

export function normalizeSlot(slot?: string): string {
  const normalized = String(slot || "").trim().toUpperCase();
  if (!normalized || normalized === "-" || normalized === "NA" || normalized === "N/A") return "";
  return normalized;
}

export function normalizeSession(session?: string): string {
  const normalized = String(session || "").trim().toUpperCase();
  if (["FN", "FORENOON", "MORNING", "AM"].includes(normalized)) return "FN";
  if (["AN", "AFTERNOON", "EVENING", "PM"].includes(normalized)) return "AN";
  return normalized;
}

export function isValidSemester(semester?: string): boolean {
  return VALID_SEMESTERS.has(normalizeSemester(semester));
}

export function isValidSlot(slot?: string): boolean {
  const normalized = normalizeSlot(slot);
  if (!normalized) return true;
  return VALID_SLOTS.has(normalized);
}

export function isValidSession(session?: string): boolean {
  const normalized = normalizeSession(session);
  if (!normalized) return true;
  return VALID_SESSIONS.has(normalized);
}

function normalizeHeaderName(header: string): string {
  const normalized = String(header || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (normalized === "subjectcode" || normalized === "subject_code" || normalized === "subject") {
    return "subject_code";
  }

  return normalized;
}

export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      const isEscapedQuote = inQuotes && line[i + 1] === '"';
      if (isEscapedQuote) {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      out.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  out.push(current.trim());
  return out;
}

export function parseTimetableCsv(csvText: string): {
  headers: string[];
  headerIndex: Record<string, number>;
  rows: TimetableExamEntry[];
} {
  const lines = String(csvText || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { headers: [], headerIndex: {}, rows: [] };
  }

  const headers = splitCsvLine(lines[0]).map(normalizeHeaderName);
  const headerIndex: Record<string, number> = {};
  headers.forEach((name, idx) => {
    if (!(name in headerIndex)) {
      headerIndex[name] = idx;
    }
  });

  const dateIdx = headerIndex.date ?? -1;
  const dayIdx = headerIndex.day ?? -1;
  const semIdx = headerIndex.semester ?? -1;
  const schemeIdx = headerIndex.scheme ?? -1;
  const slotIdx = headerIndex.slot ?? -1;
  const sessionIdx = headerIndex.session ?? -1;
  const subjectIdx = headerIndex.subject_code ?? -1;

  if (dateIdx < 0 || semIdx < 0) {
    return { headers, headerIndex, rows: [] };
  }

  const rows: TimetableExamEntry[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = splitCsvLine(lines[i]);
    const date = (cols[dateIdx] || "").trim();
    const semester = normalizeSemester(cols[semIdx]);

    if (!date || !semester) continue;

    rows.push({
      id: `csv-${i}`,
      date,
      day: dayIdx >= 0 ? (cols[dayIdx] || "").trim() : "",
      semester,
      scheme: schemeIdx >= 0 ? (cols[schemeIdx] || "").trim() || "2019" : "2019",
      slot: normalizeSlot(slotIdx >= 0 ? cols[slotIdx] : ""),
      session: normalizeSession(sessionIdx >= 0 ? cols[sessionIdx] : ""),
      subject_code: subjectIdx >= 0 ? (cols[subjectIdx] || "").trim().toUpperCase() : "",
    });
  }

  return { headers, headerIndex, rows };
}

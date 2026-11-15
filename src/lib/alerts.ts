import { wallNow } from './meetings';

export type Severity = 'emergency' | 'warning' | 'info';
export interface Alert {
  message: string;
  severity: Severity;
}

// Minimal CSV parser (handles quoted cells, commas, and "" escapes).
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else quoted = false;
      } else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

// Accepts 2026-11-15 or 11/15/2026 (Sheets sometimes exports either).
function normalizeDate(v: string): string | null {
  const s = v.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` : null;
}

const TRUE = new Set(['true', 'yes', 'y', '1', 'x']);

/** Columns (header row required): message, severity, active, expires */
export function activeAlerts(csv: string, timeZone: string): Alert[] {
  const [header, ...rows] = parseCsv(csv).filter((r) => r.some((c) => c.trim()));
  if (!header) return [];
  const col = (name: string) => header.map((h) => h.trim().toLowerCase()).indexOf(name);
  const [iMsg, iSev, iAct, iExp] = ['message', 'severity', 'active', 'expires'].map(col);
  const today = wallNow(timeZone).date;

  const rank: Record<Severity, number> = { emergency: 0, warning: 1, info: 2 };
  return rows
    .filter((r) => iMsg >= 0 && r[iMsg]?.trim())
    .filter((r) => iAct < 0 || TRUE.has((r[iAct] ?? '').trim().toLowerCase()))
    .filter((r) => {
      const exp = iExp >= 0 ? normalizeDate(r[iExp] ?? '') : null;
      return !exp || exp >= today; // blank expiry = stays until unchecked
    })
    .map((r) => {
      const s = (r[iSev] ?? '').trim().toLowerCase();
      const severity: Severity = ['emergency', 'critical', 'outage'].includes(s)
        ? 'emergency'
        : s === 'warning' ? 'warning' : 'info';
      return { message: r[iMsg].trim(), severity };
    })
    .sort((a, b) => rank[a.severity] - rank[b.severity]);
}

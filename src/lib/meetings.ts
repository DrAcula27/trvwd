// Pure date logic, shared by the build step and the browser.

export interface MeetingException {
  date: string; // regular meeting date, YYYY-MM-DD
  status: "cancelled" | "moved";
  newDate?: string; // YYYY-MM-DD (moved)
  newTime?: string; // HH:MM (moved)
  note?: string;
}

export interface MeetingConfig {
  weekday: number;
  nth: number;
  time: string;
  durationHours: number;
  schedule: string;
  location: string;
  exceptions: MeetingException[];
}

export interface NextMeeting {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  dateLabel: string; // "Tuesday, November 24, 2026"
  timeLabel: string; // "6:00 PM"
  notice?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m0: number, d: number) =>
  `${y}-${pad(m0 + 1)}-${pad(d)}`;

/** Day-of-month of the nth given weekday (0=Sun) in a month (m0 is 0-based). */
export function nthWeekday(
  year: number,
  m0: number,
  weekday: number,
  n: number,
): number {
  const firstDow = new Date(Date.UTC(year, m0, 1)).getUTCDay();
  return 1 + ((weekday - firstDow + 7) % 7) + (n - 1) * 7;
}

/** Current wall-clock time in a given time zone, as plain numbers. */
export function wallNow(timeZone: string, at: Date = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(at)
      .map((x) => [x.type, x.value]),
  );
  return {
    y: +p.year,
    m: +p.month,
    d: +p.day,
    h: +p.hour,
    min: +p.minute,
    date: `${p.year}-${p.month}-${p.day}`,
  };
}

// Minutes since epoch for a wall-clock date + "HH:MM" (zone-independent comparison).
const stamp = (date: string, time: string) => {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  return Date.UTC(y, m - 1, d, h, min) / 60000;
};

export const formatDate = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
};

export const formatTime = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h < 12 ? "AM" : "PM"}`;
};

export function getNextMeeting(
  cfg: MeetingConfig,
  timeZone: string,
  at: Date = new Date(),
): NextMeeting {
  const now = wallNow(timeZone, at);
  const nowStamp = stamp(now.date, `${pad(now.h)}:${pad(now.min)}`);
  let notice: string | undefined;

  for (let i = 0; i < 24; i++) {
    const monthIndex = now.m - 1 + i;
    const y = now.y + Math.floor(monthIndex / 12);
    const m0 = monthIndex % 12;
    const regular = iso(y, m0, nthWeekday(y, m0, cfg.weekday, cfg.nth));

    let date = regular;
    let time = cfg.time;
    const ex = cfg.exceptions.find((e) => e.date === regular);

    if (ex?.status === "moved") {
      date = ex.newDate ?? regular;
      time = ex.newTime ?? cfg.time;
    }

    const endStamp = stamp(date, time) + cfg.durationHours * 60;
    if (endStamp <= nowStamp) continue; // already over

    if (ex?.status === "cancelled") {
      notice = `The ${formatDate(regular)} meeting is cancelled.${ex.note ? " " + ex.note : ""}`;
      continue; // look at the following month
    }
    if (ex?.status === "moved") {
      notice = `Rescheduled from ${formatDate(regular)}.${ex.note ? " " + ex.note : ""}`;
    }
    return {
      date,
      time,
      dateLabel: formatDate(date),
      timeLabel: formatTime(time),
      notice,
    };
  }
  throw new Error("No upcoming meeting found; check meeting config.");
}

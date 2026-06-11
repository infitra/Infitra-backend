// RFC 5545 `.ics` builder. Pure, zero-dependency.
//
// Times are emitted in UTC (the trailing `Z`) so calendar apps localize to the
// viewer's own device zone. This matches our UTC-stored session times and
// avoids needing a VTIMEZONE block entirely.

export type ICSEvent = {
  uid: string;
  start: Date;
  durationMin: number;
  title: string;
  description?: string;
  url?: string;
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toICSDateUTC(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

// Escape per RFC 5545 §3.3.11 (backslash, semicolon, comma, newline).
function escapeText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// Fold content lines to <=75 chars with a CRLF + single-space continuation
// (§3.1). Conservative char-based folding; our content is short + ASCII-heavy.
function fold(line: string): string {
  if (line.length <= 75) return line;
  const out: string[] = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 0) {
    out.push(" " + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  return out.join("\r\n");
}

export function buildICS({
  calName,
  events,
}: {
  calName: string;
  events: ICSEvent[];
}): string {
  const now = toICSDateUTC(new Date());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//INFITRA//Experiences//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    fold("X-WR-CALNAME:" + escapeText(calName)),
  ];

  for (const e of events) {
    const end = new Date(e.start.getTime() + e.durationMin * 60_000);
    lines.push("BEGIN:VEVENT");
    lines.push("UID:" + e.uid);
    lines.push("DTSTAMP:" + now);
    lines.push("DTSTART:" + toICSDateUTC(e.start));
    lines.push("DTEND:" + toICSDateUTC(end));
    lines.push(fold("SUMMARY:" + escapeText(e.title)));
    if (e.description) lines.push(fold("DESCRIPTION:" + escapeText(e.description)));
    if (e.url) lines.push(fold("URL:" + escapeText(e.url)));
    lines.push("STATUS:CONFIRMED");
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  // RFC 5545 lines are CRLF-delimited; trailing CRLF on the final line.
  return lines.join("\r\n") + "\r\n";
}

export function slugify(s: string): string {
  const out = (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return out || "experience";
}

// Helpers shared by the two ticket conversation screens (the student's reply page and
// the support team's ticket details).

// Calendar day of a timestamp ('' when it is not a date), for grouping messages by day.
export function dayKey(value: unknown): string {
  const date = new Date(value as string);
  return isNaN(date.getTime()) ? '' : date.toDateString();
}

// 'Today', 'Yesterday' or a short date, for the divider above each day's messages.
export function dateLabel(value: unknown, now = new Date()): string {
  const date = new Date(value as string);
  if (isNaN(date.getTime())) {
    return '';
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (dayKey(date) === dayKey(now)) {
    return 'Today';
  }
  if (dayKey(date) === dayKey(yesterday)) {
    return 'Yesterday';
  }
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

// Two letters for an avatar: first and last word ('Priya K Sharma' -> 'PS'), else the first two.
export function initialsOf(name: unknown, fallback = '?'): string {
  const text = String(name || fallback).trim();
  const parts = text.split(/\s+/).filter(Boolean);
  const initials = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : text.slice(0, 2);
  return initials.toUpperCase();
}

// True when message `index` starts a new day (the first message always does).
export function startsNewDay(messages: { sentAt?: unknown }[], index: number): boolean {
  return index === 0 || dayKey(messages[index - 1]?.sentAt) !== dayKey(messages[index]?.sentAt);
}

// CSS class for a ticket status badge.
export function statusClass(status: unknown): string {
  switch (String(status || 'open').toLowerCase()) {
    case 'closed':
      return 'status-closed';
    case 'inprogress':
      return 'status-inprogress';
    default:
      return 'status-open';
  }
}

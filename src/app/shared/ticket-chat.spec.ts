import { dateLabel, dayKey, initialsOf, startsNewDay, statusClass } from './ticket-chat';

describe('ticket chat helpers', () => {
  const now = new Date(2026, 9, 7, 12, 0);

  it('labels today, yesterday and older days', () => {
    expect(dateLabel(new Date(2026, 9, 7, 8, 0), now)).toBe('Today');
    expect(dateLabel(new Date(2026, 9, 6, 23, 0), now)).toBe('Yesterday');
    expect(dateLabel(new Date(2026, 8, 1), now)).toContain('2026');
    expect(dateLabel('not a date', now)).toBe('');
  });

  it('groups messages by calendar day', () => {
    const messages = [
      { sentAt: '2026-10-06T09:00:00' },
      { sentAt: '2026-10-06T18:00:00' },
      { sentAt: '2026-10-07T08:00:00' }
    ];
    expect([0, 1, 2].map(i => startsNewDay(messages, i))).toEqual([true, false, true]);
    expect(dayKey('nope')).toBe('');
  });

  it('builds avatar initials', () => {
    expect(initialsOf('Priya K Sharma')).toBe('PS');
    expect(initialsOf('admin')).toBe('AD');
    expect(initialsOf('', 'Support')).toBe('SU');
  });

  it('maps statuses to badge classes', () => {
    expect(statusClass('Closed')).toBe('status-closed');
    expect(statusClass('InProgress')).toBe('status-inprogress');
    expect(statusClass(undefined)).toBe('status-open');
  });
});

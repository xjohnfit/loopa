// Local-calendar-day helpers. Deliberately avoid toISOString()/`new Date(isoString)`
// for these, since both cross through UTC and silently shift the date by one
// day for anyone west of UTC.

export const toISODate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const fromISODate = (iso: string) => {
  const [y, m, day] = iso.split('-').map(Number);
  return new Date(y, m - 1, day);
};

export const addDays = (d: Date, amount: number) => {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + amount);
  return copy;
};

export const startOfWeek = (d: Date) => {
  const copy = new Date(d);
  copy.setDate(copy.getDate() - copy.getDay());
  copy.setHours(0, 0, 0, 0);
  return copy;
};

export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const formatWeekday = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'long' });

export const formatMonthDay = (d: Date) =>
  d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });

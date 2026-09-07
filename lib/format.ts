export const AR_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
export const AR_DAYS_SHORT = ['أحد', 'اثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];
export const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

export function formatTime(min: number): string {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const mm = m % 60;
  const period = h24 < 12 ? 'ص' : 'م';
  let h = h24 % 12;
  if (h === 0) h = 12;
  return `${h}:${pad(mm)} ${period}`;
}

export function formatDuration(min: number): string {
  const m = Math.max(0, Math.round(min));
  if (m < 60) return `${m} دقيقة`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (rest === 0) return `${h} ساعة`;
  return `${h} س ${rest} د`;
}

export function formatHours(min: number): string {
  const h = min / 60;
  if (h === Math.floor(h)) return `${h}`;
  return (Math.round(h * 10) / 10).toString();
}

export function formatRange(a: number, b: number): string {
  return `${formatTime(a)} — ${formatTime(b)}`;
}

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDays(d: Date, n: number): Date {
  const c = new Date(d.getTime());
  c.setDate(c.getDate() + n);
  return c;
}

export function formatDateLong(d: Date): string {
  return `${AR_DAYS[d.getDay()]} ${d.getDate()} ${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateShort(d: Date): string {
  return `${d.getDate()} ${AR_MONTHS[d.getMonth()]}`;
}

export function relativeDayLabel(key: string, todayKey: string): string {
  if (key === todayKey) return 'اليوم';
  const t = fromDateKey(todayKey);
  const k = fromDateKey(key);
  const diff = Math.round((k.getTime() - t.getTime()) / 86400000);
  if (diff === 1) return 'غداً';
  if (diff === -1) return 'أمس';
  if (diff > 1 && diff < 7) return `بعد ${diff} أيام`;
  if (diff < -1 && diff > -7) return `منذ ${-diff} أيام`;
  return formatDateShort(k);
}

export function nowMinutes(d: Date = new Date()): number {
  return d.getHours() * 60 + d.getMinutes();
}

export function minutesUntil(target: number, from: number): number {
  let diff = target - from;
  if (diff < -720) diff += 1440;
  return diff;
}

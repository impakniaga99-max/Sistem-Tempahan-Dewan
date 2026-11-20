const MALAY_MONTHS = [
  'Januari',
  'Februari',
  'Mac',
  'April',
  'Mei',
  'Jun',
  'Julai',
  'Ogos',
  'September',
  'Oktober',
  'November',
  'Disember',
];

const MALAY_DAYS = [
  'Ahad',
  'Isnin',
  'Selasa',
  'Rabu',
  'Khamis',
  'Jumaat',
  'Sabtu',
];

export const WEEKDAY_SHORT = ['Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab', 'Aha'];

export function formatRM(amount: number): string {
  return `RM ${amount.toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDateMalay(ymd: string, withDay = false): string {
  const parts = ymd.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return ymd;
  const [y, m, d] = parts;
  const dt = new Date(y, m - 1, d);
  const monthName = MALAY_MONTHS[m - 1] ?? '';
  if (withDay) {
    const dayName = MALAY_DAYS[dt.getDay()] ?? '';
    return `${dayName}, ${d} ${monthName} ${y}`;
  }
  return `${d} ${monthName} ${y}`;
}

export function formatMonthYearMalay(year: number, monthIndex0: number): string {
  return `${MALAY_MONTHS[monthIndex0] ?? ''} ${year}`;
}

export function toYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateTimeMalay(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  const datePart = formatDateMalay(toYMD(dt));
  const hours = String(dt.getHours()).padStart(2, '0');
  const mins = String(dt.getMinutes()).padStart(2, '0');
  return `${datePart}, ${hours}:${mins}`;
}

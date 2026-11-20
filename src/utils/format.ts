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

const MALAY_MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mac',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Ogos',
  'Sep',
  'Okt',
  'Nov',
  'Dis',
];

export function formatDateShortMalay(ymd: string): string {
  const parts = ymd.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return ymd;
  const [, m, d] = parts;
  return `${d} ${MALAY_MONTHS_SHORT[m - 1] ?? ''}`;
}

export function getBookingDates(booking: { date: string; dates?: string[] }): string[] {
  if (Array.isArray(booking.dates) && booking.dates.length > 0) {
    return [...booking.dates].sort();
  }
  return booking.date ? [booking.date] : [];
}

export function formatBookingDatesMalay(
  date: string,
  dates?: string[],
  withDayOnSingle = false
): string {
  const list = getBookingDates({ date, dates });
  if (list.length === 0) return '-';
  if (list.length === 1) {
    return formatDateMalay(list[0], withDayOnSingle);
  }
  if (list.length <= 3) {
    return `${list.map(formatDateShortMalay).join(', ')} (${list.length} hari)`;
  }
  return `${formatDateShortMalay(list[0])} – ${formatDateShortMalay(
    list[list.length - 1]
  )} (${list.length} hari)`;
}

export function formatDateTimeMalay(iso: string): string {
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  const datePart = formatDateMalay(toYMD(dt));
  const hours = String(dt.getHours()).padStart(2, '0');
  const mins = String(dt.getMinutes()).padStart(2, '0');
  return `${datePart}, ${hours}:${mins}`;
}

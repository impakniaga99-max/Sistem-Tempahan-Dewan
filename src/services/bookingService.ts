import { ADDONS, TIME_SLOTS, VENUES } from '../data/venues.ts';
import type {
  AdminOverviewResponse,
  BookingAddonSelection,
  BookingRecord,
  DayAvailability,
  PaymentMethodId,
  TimeSlotId,
} from '../types.ts';

const LOCAL_STORAGE_KEY = 'dewan_pro_bookings_v1';
const LOCAL_ADMIN_TOKEN_PREFIX = 'local-adm-';
const SST_RATE = 0.08;

function formatDateYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(base: Date, days: number): string {
  const copy = new Date(base);
  copy.setDate(copy.getDate() + days);
  return formatDateYMD(copy);
}

function roundCurrency(val: number): number {
  return Math.round(val * 100) / 100;
}

function computeDayStatus(
  bookedSlots: TimeSlotId[]
): 'tersedia' | 'terhad' | 'penuh' {
  if (bookedSlots.length === 0) return 'tersedia';
  if (
    bookedSlots.includes('sepenuh-hari') ||
    (bookedSlots.includes('pagi') && bookedSlots.includes('petang'))
  ) {
    return 'penuh';
  }
  return 'terhad';
}

function hasSlotConflict(
  existingSlots: TimeSlotId[],
  requestedSlot: TimeSlotId
): boolean {
  if (existingSlots.includes('sepenuh-hari')) return true;
  if (requestedSlot === 'sepenuh-hari' && existingSlots.length > 0) return true;
  return existingSlots.includes(requestedSlot);
}

function getSeedBookings(): BookingRecord[] {
  const today = new Date();
  return [
    {
      id: 'seed-1',
      referenceCode: 'DP-2026-1001',
      venueId: 'dewan-anggerik',
      venueName: 'Dewan Anggerik',
      date: addDays(today, 2),
      slot: 'sepenuh-hari',
      slotLabel: 'Sepenuh Hari (08:00 – 18:00)',
      attendees: 180,
      layout: 'Teater (200 org)',
      customerName: 'Dato’ Ahmad Zulkifli',
      organization: 'Perbadanan Ekonomi Digital Negara',
      email: 'zulkifli@pedn.gov.my',
      phone: '012-3456789',
      eventTitle: 'Simposium Transformasi Digital Sektor Awam 2026',
      addons: [
        {
          addonId: 'juruteknik-av',
          name: 'Juruteknik Audio Visual Dedikasi',
          quantity: 1,
          unitPrice: 250,
          subtotal: 250,
        },
      ],
      baseAmount: 2400,
      addonsAmount: 250,
      sstAmount: 212,
      totalAmount: 2862,
      status: 'Disahkan & Dibayar',
      paymentMethod: 'fpx',
      paymentBank: 'Maybank2u',
      transactionId: 'TXN-FPX-884210',
      paidAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'seed-2',
      referenceCode: 'DP-2026-1002',
      venueId: 'dewan-anggerik',
      venueName: 'Dewan Anggerik',
      date: addDays(today, 6),
      slot: 'pagi',
      slotLabel: 'Sesi Pagi (Separuh Hari) (08:00 – 13:00)',
      attendees: 120,
      layout: 'Bilik Darjah (120 org)',
      customerName: 'Puan Nurul Huda',
      organization: 'Akademi Latihan Korporat Amanah',
      email: 'nurul.huda@amanah.com.my',
      phone: '019-7788990',
      eventTitle: 'Seminar Kepimpinan & Tadbir Urus Korporat',
      addons: [],
      baseAmount: 1450,
      addonsAmount: 0,
      sstAmount: 116,
      totalAmount: 1566,
      status: 'Disahkan & Dibayar',
      paymentMethod: 'kad',
      transactionId: 'TXN-CRD-991042',
      paidAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'seed-3',
      referenceCode: 'DP-2026-1003',
      venueId: 'bilik-mesyuarat',
      venueName: 'Bilik Mesyuarat Eksekutif',
      date: addDays(today, 4),
      slot: 'pagi',
      slotLabel: 'Sesi Pagi (Separuh Hari) (08:00 – 13:00)',
      attendees: 16,
      layout: 'Meja Lembaga / Boardroom (20 org)',
      customerName: 'Encik Hafizuddin Razak',
      organization: 'Kumpulan Kejuruteraan Wawasan',
      email: 'hafiz@wawasan-eng.my',
      phone: '013-2244668',
      eventTitle: 'Mesyuarat Jawatankuasa Audit Suku Keempat',
      addons: [
        {
          addonId: 'jamuan-ringan',
          name: 'Jamuan Ringan (Minum Pagi / Petang)',
          quantity: 16,
          unitPrice: 18,
          subtotal: 288,
        },
      ],
      baseAmount: 380,
      addonsAmount: 288,
      sstAmount: 53.44,
      totalAmount: 721.44,
      status: 'Disahkan & Dibayar',
      paymentMethod: 'fpx',
      paymentBank: 'CIMB Clicks',
      transactionId: 'TXN-FPX-773105',
      paidAt: new Date(Date.now() - 86400000).toISOString(),
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'seed-4',
      referenceCode: 'DP-2026-1004',
      venueId: 'bilik-seminar-1',
      venueName: 'Bilik Seminar 1',
      date: addDays(today, 9),
      slot: 'sepenuh-hari',
      slotLabel: 'Sepenuh Hari (08:00 – 18:00)',
      attendees: 28,
      layout: 'Bilik Darjah (30 org)',
      customerName: 'Cik Farah Nadiah',
      organization: 'Institut Pembangunan Sumber Manusia',
      email: 'farah@ipsm.org.my',
      phone: '017-5544332',
      eventTitle: 'Bengkel Analisis Data & Produktiviti Pasukan',
      addons: [
        {
          addonId: 'makan-tengah-hari',
          name: 'Bufet Makan Tengah Hari Korporat',
          quantity: 28,
          unitPrice: 35,
          subtotal: 980,
        },
      ],
      baseAmount: 880,
      addonsAmount: 980,
      sstAmount: 148.8,
      totalAmount: 2008.8,
      status: 'Disahkan & Dibayar',
      paymentMethod: 'duitnow',
      transactionId: 'TXN-DNQ-662019',
      paidAt: new Date(Date.now() - 43200000).toISOString(),
      createdAt: new Date(Date.now() - 43200000).toISOString(),
    },
  ];
}

function readLocalBookings(): BookingRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      const seed = getSeedBookings();
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // ignore storage errors
  }
  return getSeedBookings();
}

function writeLocalBookings(records: BookingRecord[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // ignore storage errors
  }
}

class ApiUnavailableError extends Error {
  constructor() {
    super('API backend tidak tersedia; menggunakan storan setempat.');
  }
}

async function fetchJsonSafe<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch {
    throw new ApiUnavailableError();
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    // Prevents "Unexpected token '<', <!doctype ... is not valid JSON" when static host returns HTML
    throw new ApiUnavailableError();
  }

  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data?.error || 'Permintaan gagal diproses.') as Error & {
      status?: number;
    };
    err.status = res.status;
    throw err;
  }
  return data as T;
}

export async function fetchMonthlyAvailability(
  venueId: string,
  month: string
): Promise<Record<string, DayAvailability>> {
  try {
    const data = await fetchJsonSafe<{ days?: Record<string, DayAvailability> }>(
      `/api/availability?venueId=${encodeURIComponent(venueId)}&month=${encodeURIComponent(month)}`
    );
    return data.days ?? {};
  } catch (err) {
    if (!(err instanceof ApiUnavailableError)) throw err;

    const bookings = readLocalBookings().filter(
      (b) =>
        b.status !== 'Dibatalkan' &&
        b.venueId === venueId &&
        b.date.startsWith(month)
    );
    const map: Record<string, DayAvailability> = {};
    for (const item of bookings) {
      if (!map[item.date]) {
        map[item.date] = { date: item.date, bookedSlots: [], status: 'tersedia' };
      }
      if (!map[item.date].bookedSlots.includes(item.slot)) {
        map[item.date].bookedSlots.push(item.slot);
      }
      map[item.date].status = computeDayStatus(map[item.date].bookedSlots);
    }
    return map;
  }
}

export interface CreateBookingPayload {
  venueId: string;
  date: string;
  slot: TimeSlotId;
  attendees: number;
  layout: string;
  customerName: string;
  organization: string;
  email: string;
  phone: string;
  eventTitle: string;
  notes: string;
  addonIds: string[];
}

export async function createBooking(
  payload: CreateBookingPayload
): Promise<BookingRecord> {
  try {
    const data = await fetchJsonSafe<{ booking: BookingRecord }>(
      '/api/bookings',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
    return data.booking;
  } catch (err) {
    if (!(err instanceof ApiUnavailableError)) throw err;

    const venue = VENUES.find((v) => v.id === payload.venueId);
    if (!venue) throw new Error('Ruang atau dewan yang dipilih tidak sah.');

    const slotDef = TIME_SLOTS.find((s) => s.id === payload.slot);
    if (!slotDef) throw new Error('Slot masa yang dipilih tidak sah.');

    const bookings = readLocalBookings();
    const activeDaySlots = bookings
      .filter(
        (b) =>
          b.venueId === venue.id &&
          b.date === payload.date &&
          b.status !== 'Dibatalkan'
      )
      .map((b) => b.slot);

    if (hasSlotConflict(activeDaySlots, slotDef.id)) {
      throw new Error(
        `Maaf, ${venue.name} pada ${payload.date} untuk ${slotDef.label} telah ditempah.`
      );
    }

    const baseAmount =
      slotDef.rateType === 'full' ? venue.fullDayRate : venue.halfDayRate;
    const selectedAddons: BookingAddonSelection[] = [];
    let addonsAmount = 0;

    for (const addonId of payload.addonIds) {
      const addon = ADDONS.find((a) => a.id === addonId);
      if (!addon) continue;
      const quantity = addon.unit === 'per_orang' ? payload.attendees : 1;
      const subtotal = roundCurrency(addon.price * quantity);
      addonsAmount = roundCurrency(addonsAmount + subtotal);
      selectedAddons.push({
        addonId: addon.id,
        name: addon.name,
        quantity,
        unitPrice: addon.price,
        subtotal,
      });
    }

    const subtotal = roundCurrency(baseAmount + addonsAmount);
    const sstAmount = roundCurrency(subtotal * SST_RATE);
    const totalAmount = roundCurrency(subtotal + sstAmount);
    const referenceCode = `DP-${payload.date.slice(0, 4)}-${1001 + bookings.length}`;

    const newBooking: BookingRecord = {
      id: `bk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      referenceCode,
      venueId: venue.id,
      venueName: venue.name,
      date: payload.date,
      slot: slotDef.id,
      slotLabel: `${slotDef.label} (${slotDef.timeRange})`,
      attendees: payload.attendees,
      layout: payload.layout || venue.layouts[0],
      customerName: payload.customerName,
      organization: payload.organization || 'Individu / Persendirian',
      email: payload.email,
      phone: payload.phone,
      eventTitle: payload.eventTitle,
      notes: payload.notes,
      addons: selectedAddons,
      baseAmount,
      addonsAmount,
      sstAmount,
      totalAmount,
      status: 'Menunggu Pembayaran',
      createdAt: new Date().toISOString(),
    };

    bookings.push(newBooking);
    writeLocalBookings(bookings);
    return newBooking;
  }
}

export async function processPayment(
  bookingId: string,
  paymentMethod: PaymentMethodId,
  paymentBank?: string
): Promise<BookingRecord> {
  try {
    const data = await fetchJsonSafe<{ booking: BookingRecord }>(
      '/api/payments',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, paymentMethod, paymentBank }),
      }
    );
    return data.booking;
  } catch (err) {
    if (!(err instanceof ApiUnavailableError)) throw err;

    const bookings = readLocalBookings();
    const index = bookings.findIndex((b) => b.id === bookingId);
    if (index === -1) throw new Error('Rekod tempahan tidak ditemui.');
    const target = bookings[index];
    if (target.status === 'Dibatalkan') {
      throw new Error('Tempahan ini telah dibatalkan.');
    }

    const prefix =
      paymentMethod === 'fpx' ? 'FPX' : paymentMethod === 'kad' ? 'CRD' : 'DNQ';
    const updated: BookingRecord = {
      ...target,
      status: 'Disahkan & Dibayar',
      paymentMethod,
      paymentBank: paymentMethod === 'fpx' ? paymentBank || 'Maybank2u' : undefined,
      transactionId: `TXN-${prefix}-${Math.floor(100000 + Math.random() * 900000)}`,
      paidAt: new Date().toISOString(),
    };
    bookings[index] = updated;
    writeLocalBookings(bookings);
    return updated;
  }
}

export async function adminLogin(
  username: string,
  password: string
): Promise<string> {
  try {
    const data = await fetchJsonSafe<{ token: string }>('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return data.token;
  } catch (err) {
    if (!(err instanceof ApiUnavailableError)) throw err;
    if (username === 'admin' && password === 'admin123') {
      return `${LOCAL_ADMIN_TOKEN_PREFIX}${Date.now()}`;
    }
    throw new Error('Nama pengguna atau kata laluan tidak sah.');
  }
}

export async function adminLogout(token: string): Promise<void> {
  if (!token || token.startsWith(LOCAL_ADMIN_TOKEN_PREFIX)) return;
  try {
    await fetch('/api/admin/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // ignore
  }
}

function buildOverviewFromBookings(
  bookings: BookingRecord[]
): AdminOverviewResponse {
  const sorted = [...bookings].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  let confirmedRevenue = 0;
  let pendingRevenue = 0;
  let confirmedCount = 0;
  let pendingCount = 0;
  let cancelledCount = 0;
  let totalParticipants = 0;

  for (const b of sorted) {
    if (b.status === 'Disahkan & Dibayar') {
      confirmedRevenue = roundCurrency(confirmedRevenue + b.totalAmount);
      confirmedCount += 1;
      totalParticipants += b.attendees;
    } else if (b.status === 'Menunggu Pembayaran') {
      pendingRevenue = roundCurrency(pendingRevenue + b.totalAmount);
      pendingCount += 1;
      totalParticipants += b.attendees;
    } else {
      cancelledCount += 1;
    }
  }

  const activeCount = confirmedCount + pendingCount;
  const avgBookingValue =
    confirmedCount > 0 ? roundCurrency(confirmedRevenue / confirmedCount) : 0;

  const venueBreakdown = VENUES.map((v) => {
    const vBookings = sorted.filter(
      (b) => b.venueId === v.id && b.status !== 'Dibatalkan'
    );
    const vConfirmed = vBookings.filter(
      (b) => b.status === 'Disahkan & Dibayar'
    );
    const revenue = roundCurrency(
      vConfirmed.reduce((acc, cur) => acc + cur.totalAmount, 0)
    );
    const totalAttendees = vBookings.reduce(
      (acc, cur) => acc + cur.attendees,
      0
    );
    const sharePercent =
      confirmedRevenue > 0 ? Math.round((revenue / confirmedRevenue) * 100) : 0;
    return {
      venueId: v.id,
      venueName: v.name,
      capacity: v.capacity,
      bookingsCount: vBookings.length,
      confirmedCount: vConfirmed.length,
      totalAttendees,
      revenue,
      sharePercent,
    };
  });

  const paymentMethods: { method: PaymentMethodId; label: string }[] = [
    { method: 'fpx', label: 'FPX Perbankan Dalam Talian' },
    { method: 'kad', label: 'Kad Kredit / Debit' },
    { method: 'duitnow', label: 'DuitNow QR / E-Dompet' },
  ];

  const paymentBreakdown = paymentMethods.map((pm) => {
    const matched = sorted.filter(
      (b) => b.status === 'Disahkan & Dibayar' && b.paymentMethod === pm.method
    );
    return {
      method: pm.method,
      label: pm.label,
      count: matched.length,
      amount: roundCurrency(
        matched.reduce((acc, cur) => acc + cur.totalAmount, 0)
      ),
    };
  });

  const slotBreakdown = TIME_SLOTS.map((slot) => {
    const matched = sorted.filter(
      (b) => b.status !== 'Dibatalkan' && b.slot === slot.id
    );
    return {
      slot: slot.id,
      label: slot.label,
      count: matched.length,
      revenue: roundCurrency(
        matched
          .filter((b) => b.status === 'Disahkan & Dibayar')
          .reduce((acc, cur) => acc + cur.totalAmount, 0)
      ),
    };
  });

  return {
    kpis: {
      confirmedRevenue,
      pendingRevenue,
      totalBookings: activeCount,
      confirmedCount,
      pendingCount,
      cancelledCount,
      totalParticipants,
      avgBookingValue,
    },
    venueBreakdown,
    paymentBreakdown,
    slotBreakdown,
    bookings: sorted,
  };
}

export async function fetchAdminOverview(
  token: string
): Promise<AdminOverviewResponse> {
  if (token.startsWith(LOCAL_ADMIN_TOKEN_PREFIX)) {
    return buildOverviewFromBookings(readLocalBookings());
  }
  try {
    return await fetchJsonSafe<AdminOverviewResponse>('/api/admin/overview', {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    if (!(err instanceof ApiUnavailableError)) throw err;
    return buildOverviewFromBookings(readLocalBookings());
  }
}

export async function confirmAdminBooking(
  token: string,
  bookingId: string
): Promise<BookingRecord> {
  try {
    const data = await fetchJsonSafe<{ booking: BookingRecord }>(
      `/api/admin/bookings/${encodeURIComponent(bookingId)}/confirm`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return data.booking;
  } catch (err) {
    if (!(err instanceof ApiUnavailableError)) throw err;
    const bookings = readLocalBookings();
    const idx = bookings.findIndex((b) => b.id === bookingId);
    if (idx === -1) throw new Error('Rekod tempahan tidak ditemui.');
    const target = bookings[idx];
    const updated: BookingRecord = {
      ...target,
      status: 'Disahkan & Dibayar',
      paymentMethod: target.paymentMethod ?? 'fpx',
      paymentBank: target.paymentBank ?? 'Pengesahan Manual Pentadbir',
      transactionId:
        target.transactionId ??
        `TXN-ADM-${Math.floor(100000 + Math.random() * 900000)}`,
      paidAt: target.paidAt ?? new Date().toISOString(),
    };
    bookings[idx] = updated;
    writeLocalBookings(bookings);
    return updated;
  }
}

export async function cancelAdminBooking(
  token: string,
  bookingId: string
): Promise<BookingRecord> {
  try {
    const data = await fetchJsonSafe<{ booking: BookingRecord }>(
      `/api/admin/bookings/${encodeURIComponent(bookingId)}/cancel`,
      {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return data.booking;
  } catch (err) {
    if (!(err instanceof ApiUnavailableError)) throw err;
    const bookings = readLocalBookings();
    const idx = bookings.findIndex((b) => b.id === bookingId);
    if (idx === -1) throw new Error('Rekod tempahan tidak ditemui.');
    bookings[idx] = { ...bookings[idx], status: 'Dibatalkan' };
    writeLocalBookings(bookings);
    return bookings[idx];
  }
}

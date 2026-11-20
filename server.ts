import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { ADDONS, TIME_SLOTS, VENUES } from './src/data/venues.ts';
import type {
  BookingAddonSelection,
  BookingRecord,
  DayAvailability,
  PaymentMethodId,
  TimeSlotId,
} from './src/types.ts';

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(process.cwd(), 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
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

function createInitialSeedBookings(): BookingRecord[] {
  const today = new Date();
  const d2 = addDays(today, 2);
  const d4 = addDays(today, 4);
  const d6 = addDays(today, 6);
  const d9 = addDays(today, 9);

  return [
    {
      id: 'seed-1',
      referenceCode: 'DP-2026-1001',
      venueId: 'dewan-anggerik',
      venueName: 'Dewan Anggerik',
      date: d2,
      dates: [d2],
      daysCount: 1,
      slot: 'sepenuh-hari',
      slotLabel: 'Sehari (08:00 – 18:00)',
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
      date: d6,
      dates: [d6],
      daysCount: 1,
      slot: 'pagi',
      slotLabel: 'Sesi Pagi (08:00 – 13:00)',
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
      date: d4,
      dates: [d4],
      daysCount: 1,
      slot: 'pagi',
      slotLabel: 'Sesi Pagi (08:00 – 13:00)',
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
      date: d9,
      dates: [d9],
      daysCount: 1,
      slot: 'sepenuh-hari',
      slotLabel: 'Sehari (08:00 – 18:00)',
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

function ensureStorage(): BookingRecord[] {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(BOOKINGS_FILE)) {
    const seed = createInitialSeedBookings();
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
  try {
    const raw = fs.readFileSync(BOOKINGS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    const seed = createInitialSeedBookings();
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
}

function saveBookings(records: BookingRecord[]): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(records, null, 2), 'utf-8');
}

function hasSlotConflict(existingSlots: TimeSlotId[], requestedSlot: TimeSlotId): boolean {
  if (existingSlots.includes('sepenuh-hari')) return true;
  if (requestedSlot === 'sepenuh-hari' && existingSlots.length > 0) return true;
  return existingSlots.includes(requestedSlot);
}

function computeDayStatus(bookedSlots: TimeSlotId[]): 'tersedia' | 'terhad' | 'penuh' {
  if (bookedSlots.length === 0) return 'tersedia';
  if (
    bookedSlots.includes('sepenuh-hari') ||
    (bookedSlots.includes('pagi') && bookedSlots.includes('petang'))
  ) {
    return 'penuh';
  }
  return 'terhad';
}

function getRecordDates(record: BookingRecord): string[] {
  if (Array.isArray(record.dates) && record.dates.length > 0) {
    return record.dates;
  }
  return record.date ? [record.date] : [];
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  ensureStorage();

  app.get('/api/venues', (_req, res) => {
    res.json({ venues: VENUES, timeSlots: TIME_SLOTS, addons: ADDONS });
  });

  app.get('/api/availability', (req, res) => {
    const venueId = typeof req.query.venueId === 'string' ? req.query.venueId : '';
    const month = typeof req.query.month === 'string' ? req.query.month : '';
    const date = typeof req.query.date === 'string' ? req.query.date : '';

    const bookings = ensureStorage().filter((b) => b.status !== 'Dibatalkan');

    if (date && venueId) {
      const dayBookings = bookings.filter(
        (b) => b.venueId === venueId && getRecordDates(b).includes(date)
      );
      const bookedSlots = dayBookings.map((b) => b.slot);
      const availability: DayAvailability = {
        date,
        bookedSlots,
        status: computeDayStatus(bookedSlots),
      };
      return res.json({ availability, bookings: dayBookings });
    }

    if (venueId && month) {
      const monthPrefix = month; // YYYY-MM
      const filtered = bookings.filter((b) => b.venueId === venueId);
      const map: Record<string, DayAvailability> = {};
      for (const item of filtered) {
        for (const d of getRecordDates(item)) {
          if (!d.startsWith(monthPrefix)) continue;
          if (!map[d]) {
            map[d] = {
              date: d,
              bookedSlots: [],
              status: 'tersedia',
            };
          }
          if (!map[d].bookedSlots.includes(item.slot)) {
            map[d].bookedSlots.push(item.slot);
          }
          map[d].status = computeDayStatus(map[d].bookedSlots);
        }
      }
      return res.json({ venueId, month, days: map });
    }

    return res.status(400).json({
      error: 'Sila nyatakan parameter venueId bersama month atau date.',
    });
  });

  app.get('/api/bookings', (req, res) => {
    const ref = typeof req.query.ref === 'string' ? req.query.ref.trim().toLowerCase() : '';
    const bookings = ensureStorage().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (ref) {
      const matched = bookings.filter(
        (b) =>
          b.referenceCode.toLowerCase().includes(ref) ||
          b.email.toLowerCase().includes(ref) ||
          b.phone.toLowerCase().includes(ref) ||
          b.customerName.toLowerCase().includes(ref)
      );
      return res.json({ bookings: matched });
    }

    return res.json({ bookings });
  });

  app.post('/api/bookings', (req, res) => {
    const {
      venueId,
      date,
      dates,
      slot,
      attendees,
      layout,
      customerName,
      organization,
      email,
      phone,
      eventTitle,
      notes,
      addonIds,
    } = req.body ?? {};

    const venue = VENUES.find((v) => v.id === venueId);
    if (!venue) {
      return res.status(400).json({ error: 'Ruang atau dewan yang dipilih tidak sah.' });
    }

    const rawDates: unknown[] =
      Array.isArray(dates) && dates.length > 0
        ? dates
        : typeof date === 'string' && date
        ? [date]
        : [];

    const validDates = rawDates.filter(
      (d): d is string => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)
    );
    const uniqueDates = Array.from(new Set(validDates)).sort();

    if (uniqueDates.length === 0 || uniqueDates.length !== rawDates.filter((d) => typeof d === 'string').length) {
      return res.status(400).json({ error: 'Sila pilih sekurang-kurangnya satu tarikh tempahan yang sah.' });
    }

    const todayStr = formatDateYMD(new Date());
    if (uniqueDates.some((d) => d < todayStr)) {
      return res
        .status(400)
        .json({ error: 'Terdapat tarikh yang telah berlalu. Sila pilih tarikh hari ini atau akan datang.' });
    }

    const slotDef = TIME_SLOTS.find((s) => s.id === slot);
    if (!slotDef) {
      return res.status(400).json({ error: 'Slot masa yang dipilih tidak sah.' });
    }

    const guestCount = Number(attendees);
    if (!Number.isFinite(guestCount) || guestCount < 1 || guestCount > venue.capacity) {
      return res.status(400).json({
        error: `Bilangan peserta mesti antara 1 hingga ${venue.capacity} orang bagi ${venue.name}.`,
      });
    }

    if (!customerName?.trim() || !email?.trim() || !phone?.trim() || !eventTitle?.trim()) {
      return res.status(400).json({
        error: 'Sila lengkapkan nama penuh, alamat emel, nombor telefon, dan tajuk program.',
      });
    }

    const bookings = ensureStorage();
    const activeVenueBookings = bookings.filter(
      (b) => b.venueId === venue.id && b.status !== 'Dibatalkan'
    );

    const conflictingDates: string[] = [];
    for (const targetDate of uniqueDates) {
      const existingSlots = activeVenueBookings
        .filter((b) => getRecordDates(b).includes(targetDate))
        .map((b) => b.slot);
      if (hasSlotConflict(existingSlots, slotDef.id)) {
        conflictingDates.push(targetDate);
      }
    }

    if (conflictingDates.length > 0) {
      return res.status(409).json({
        error: `Maaf, ${venue.name} pada ${conflictingDates.join(', ')} untuk ${slotDef.label} tidak lagi tersedia kerana bertindih dengan tempahan sedia ada.`,
      });
    }

    const daysCount = uniqueDates.length;
    const unitBaseRate =
      slotDef.rateType === 'full' ? venue.fullDayRate : venue.halfDayRate;
    const baseAmount = roundCurrency(unitBaseRate * daysCount);

    const selectedAddonIds: string[] = Array.isArray(addonIds) ? addonIds : [];
    const selectedAddons: BookingAddonSelection[] = [];
    let addonsAmount = 0;

    for (const addonId of selectedAddonIds) {
      const addon = ADDONS.find((a) => a.id === addonId);
      if (!addon) continue;
      const quantity = addon.unit === 'per_orang' ? guestCount * daysCount : daysCount;
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

    const subtotalBeforeTax = roundCurrency(baseAmount + addonsAmount);
    const sstAmount = roundCurrency(subtotalBeforeTax * SST_RATE);
    const totalAmount = roundCurrency(subtotalBeforeTax + sstAmount);

    const primaryDate = uniqueDates[0];
    const nextSeq = 1001 + bookings.length;
    const referenceCode = `DP-${primaryDate.slice(0, 4)}-${nextSeq}`;

    const newBooking: BookingRecord = {
      id: `bk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      referenceCode,
      venueId: venue.id,
      venueName: venue.name,
      date: primaryDate,
      dates: uniqueDates,
      daysCount,
      slot: slotDef.id,
      slotLabel: `${slotDef.label} (${slotDef.timeRange})`,
      attendees: guestCount,
      layout: typeof layout === 'string' && layout.trim() ? layout : venue.layouts[0],
      customerName: customerName.trim(),
      organization: typeof organization === 'string' && organization.trim() ? organization.trim() : 'Individu / Persendirian',
      email: email.trim(),
      phone: phone.trim(),
      eventTitle: eventTitle.trim(),
      notes: typeof notes === 'string' ? notes.trim() : '',
      addons: selectedAddons,
      baseAmount,
      addonsAmount,
      sstAmount,
      totalAmount,
      status: 'Menunggu Pembayaran',
      createdAt: new Date().toISOString(),
    };

    bookings.push(newBooking);
    saveBookings(bookings);

    return res.status(201).json({ booking: newBooking });
  });

  app.post('/api/payments', (req, res) => {
    const { bookingId, paymentMethod, paymentBank } = req.body ?? {};

    if (!bookingId || typeof bookingId !== 'string') {
      return res.status(400).json({ error: 'ID tempahan diperlukan untuk pembayaran.' });
    }

    const validMethods: PaymentMethodId[] = ['fpx', 'kad', 'duitnow'];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({ error: 'Kaedah pembayaran tidak sah.' });
    }

    const bookings = ensureStorage();
    const index = bookings.findIndex((b) => b.id === bookingId);
    if (index === -1) {
      return res.status(404).json({ error: 'Rekod tempahan tidak ditemui.' });
    }

    const target = bookings[index];
    if (target.status === 'Dibatalkan') {
      return res.status(400).json({ error: 'Tempahan ini telah dibatalkan.' });
    }

    const prefix =
      paymentMethod === 'fpx' ? 'FPX' : paymentMethod === 'kad' ? 'CRD' : 'DNQ';
    const transactionId = `TXN-${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;

    const updated: BookingRecord = {
      ...target,
      status: 'Disahkan & Dibayar',
      paymentMethod,
      paymentBank: paymentMethod === 'fpx' ? paymentBank || 'Maybank2u' : undefined,
      transactionId,
      paidAt: new Date().toISOString(),
    };

    bookings[index] = updated;
    saveBookings(bookings);

    return res.json({ booking: updated });
  });

  app.patch('/api/bookings/:id/cancel', (req, res) => {
    const { id } = req.params;
    const bookings = ensureStorage();
    const index = bookings.findIndex((b) => b.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Tempahan tidak ditemui.' });
    }
    bookings[index] = {
      ...bookings[index],
      status: 'Dibatalkan',
    };
    saveBookings(bookings);
    return res.json({ booking: bookings[index] });
  });

  // --- Admin Auth & Analytics Endpoints ---
  const adminTokens = new Set<string>();

  function requireAdmin(req: express.Request, res: express.Response): boolean {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!token || !adminTokens.has(token)) {
      res.status(401).json({ error: 'Sesi pentadbir tidak sah atau telah tamat. Sila log masuk semula.' });
      return false;
    }
    return true;
  }

  app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body ?? {};
    if (username === 'admin' && password === 'admin123') {
      const token = `adm-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      adminTokens.add(token);
      return res.json({
        token,
        user: {
          username: 'admin',
          role: 'Pentadbir Utama',
        },
      });
    }
    return res.status(401).json({
      error: 'Nama pengguna atau kata laluan tidak sah.',
    });
  });

  app.post('/api/admin/logout', (req, res) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (token) adminTokens.delete(token);
    return res.json({ ok: true });
  });

  app.get('/api/admin/overview', (req, res) => {
    if (!requireAdmin(req, res)) return;

    const bookings = ensureStorage().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    let confirmedRevenue = 0;
    let pendingRevenue = 0;
    let confirmedCount = 0;
    let pendingCount = 0;
    let cancelledCount = 0;
    let totalParticipants = 0;

    for (const b of bookings) {
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
    const avgBookingValue = confirmedCount > 0 ? roundCurrency(confirmedRevenue / confirmedCount) : 0;

    const venueBreakdown = VENUES.map((v) => {
      const vBookings = bookings.filter((b) => b.venueId === v.id && b.status !== 'Dibatalkan');
      const vConfirmed = vBookings.filter((b) => b.status === 'Disahkan & Dibayar');
      const revenue = roundCurrency(
        vConfirmed.reduce((acc, cur) => acc + cur.totalAmount, 0)
      );
      const totalAttendees = vBookings.reduce((acc, cur) => acc + cur.attendees, 0);
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
      const matched = bookings.filter(
        (b) => b.status === 'Disahkan & Dibayar' && b.paymentMethod === pm.method
      );
      return {
        method: pm.method,
        label: pm.label,
        count: matched.length,
        amount: roundCurrency(matched.reduce((acc, cur) => acc + cur.totalAmount, 0)),
      };
    });

    const slotBreakdown = TIME_SLOTS.map((slot) => {
      const matched = bookings.filter(
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

    return res.json({
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
      bookings,
    });
  });

  app.patch('/api/admin/bookings/:id/confirm', (req, res) => {
    if (!requireAdmin(req, res)) return;
    const { id } = req.params;
    const bookings = ensureStorage();
    const index = bookings.findIndex((b) => b.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Rekod tempahan tidak ditemui.' });
    }
    const target = bookings[index];
    if (target.status === 'Dibatalkan') {
      return res.status(400).json({ error: 'Tempahan yang dibatalkan tidak boleh disahkan.' });
    }
    const updated: BookingRecord = {
      ...target,
      status: 'Disahkan & Dibayar',
      paymentMethod: target.paymentMethod ?? 'fpx',
      paymentBank: target.paymentBank ?? 'Pengesahan Manual Pentadbir',
      transactionId:
        target.transactionId ?? `TXN-ADM-${Math.floor(100000 + Math.random() * 900000)}`,
      paidAt: target.paidAt ?? new Date().toISOString(),
    };
    bookings[index] = updated;
    saveBookings(bookings);
    return res.json({ booking: updated });
  });

  app.patch('/api/admin/bookings/:id/cancel', (req, res) => {
    if (!requireAdmin(req, res)) return;
    const { id } = req.params;
    const bookings = ensureStorage();
    const index = bookings.findIndex((b) => b.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Rekod tempahan tidak ditemui.' });
    }
    bookings[index] = {
      ...bookings[index],
      status: 'Dibatalkan',
    };
    saveBookings(bookings);
    return res.json({ booking: bookings[index] });
  });

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint tidak ditemui.' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sistem Tempahan Dewan Pro berjalan di http://0.0.0.0:${PORT}`);
  });
}

startServer();

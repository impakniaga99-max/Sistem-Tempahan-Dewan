import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  Users,
} from 'lucide-react';
import { ADDONS, TIME_SLOTS, VENUES } from '../data/venues.ts';
import type {
  BookingRecord,
  DayAvailability,
  TimeSlotId,
} from '../types.ts';
import {
  formatDateMalay,
  formatMonthYearMalay,
  formatRM,
  toYMD,
  WEEKDAY_SHORT,
} from '../utils/format.ts';

interface AvailabilityBookingSectionProps {
  selectedVenueId: string;
  onSelectVenueId: (id: string) => void;
  refreshTrigger: number;
  onBookingCreated: (booking: BookingRecord) => void;
}

const SST_RATE = 0.08;

export function AvailabilityBookingSection({
  selectedVenueId,
  onSelectVenueId,
  refreshTrigger,
  onBookingCreated,
}: AvailabilityBookingSectionProps) {
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => toYMD(today), [today]);

  const tomorrowStr = useMemo(() => {
    const t = new Date(today);
    t.setDate(t.getDate() + 1);
    return toYMD(t);
  }, [today]);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState(tomorrowStr);
  const [availabilityMap, setAvailabilityMap] = useState<
    Record<string, DayAvailability>
  >({});
  const [loadingCal, setLoadingCal] = useState(false);
  const [calError, setCalError] = useState('');

  const [selectedSlot, setSelectedSlot] = useState<TimeSlotId | ''>('');
  const [attendees, setAttendees] = useState<number>(20);
  const [layout, setLayout] = useState<string>('');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

  const [customerName, setCustomerName] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const venue = useMemo(
    () => VENUES.find((v) => v.id === selectedVenueId) ?? VENUES[0],
    [selectedVenueId]
  );

  // Sync default layout & cap attendees when venue changes
  useEffect(() => {
    setLayout(venue.layouts[0]);
    setAttendees((prev) => {
      if (prev > venue.capacity) return venue.capacity;
      if (prev < 1) return Math.min(10, venue.capacity);
      return prev;
    });
    setSelectedSlot('');
    setFormError('');
  }, [venue]);

  // Fetch monthly availability for selected venue
  useEffect(() => {
    const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
    let cancelled = false;
    setLoadingCal(true);
    setCalError('');

    fetch(
      `/api/availability?venueId=${encodeURIComponent(venue.id)}&month=${monthStr}`
    )
      .then(async (res) => {
        if (!res.ok) throw new Error('Gagal memuatkan jadual kekosongan.');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setAvailabilityMap(data.days ?? {});
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setCalError(
            err instanceof Error ? err.message : 'Ralat rangkaian berlaku.'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingCal(false);
      });

    return () => {
      cancelled = true;
    };
  }, [venue.id, viewYear, viewMonth, refreshTrigger]);

  // Compute calendar grid days (Monday first)
  const calendarDays = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const lastOfMonth = new Date(viewYear, viewMonth + 1, 0);
    const totalDays = lastOfMonth.getDate();

    // JS getDay(): 0 Sun, 1 Mon ... 6 Sat -> convert to Mon=0 .. Sun=6
    const startOffset = (firstOfMonth.getDay() + 6) % 7;

    const cells: ({ ymd: string; day: number } | null)[] = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      const ymd = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(
        d
      ).padStart(2, '0')}`;
      cells.push({ ymd, day: d });
    }
    return cells;
  }, [viewYear, viewMonth]);

  const canGoPrevMonth =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  function handlePrevMonth() {
    if (!canGoPrevMonth) return;
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function handleNextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  const selectedDayInfo = availabilityMap[selectedDate];
  const bookedSlotsOnDay = selectedDayInfo?.bookedSlots ?? [];

  function isSlotAvailable(slotId: TimeSlotId): boolean {
    if (selectedDate < todayStr) return false;
    if (bookedSlotsOnDay.includes('sepenuh-hari')) return false;
    if (slotId === 'sepenuh-hari') return bookedSlotsOnDay.length === 0;
    return !bookedSlotsOnDay.includes(slotId);
  }

  // Clear selected slot if it became unavailable on date/venue switch
  useEffect(() => {
    if (selectedSlot && !isSlotAvailable(selectedSlot)) {
      setSelectedSlot('');
    }
  }, [selectedDate, bookedSlotsOnDay, selectedSlot]);

  function toggleAddon(addonId: string) {
    setSelectedAddons((prev) =>
      prev.includes(addonId)
        ? prev.filter((id) => id !== addonId)
        : [...prev, addonId]
    );
  }

  // Cost calculation
  const pricing = useMemo(() => {
    const slotDef = TIME_SLOTS.find((s) => s.id === selectedSlot);
    const baseAmount = slotDef
      ? slotDef.rateType === 'full'
        ? venue.fullDayRate
        : venue.halfDayRate
      : 0;

    let addonsAmount = 0;
    for (const id of selectedAddons) {
      const addon = ADDONS.find((a) => a.id === id);
      if (!addon) continue;
      const qty = addon.unit === 'per_orang' ? Math.max(1, attendees) : 1;
      addonsAmount += addon.price * qty;
    }

    const subtotal = baseAmount + addonsAmount;
    const sst = Math.round(subtotal * SST_RATE * 100) / 100;
    const total = Math.round((subtotal + sst) * 100) / 100;
    return { baseAmount, addonsAmount, sst, total };
  }, [selectedSlot, venue, selectedAddons, attendees]);

  async function handleSubmitBooking(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (!selectedDate || selectedDate < todayStr) {
      setFormError('Sila pilih tarikh hari ini atau tarikh akan datang.');
      return;
    }
    if (!selectedSlot) {
      setFormError('Sila pilih slot masa (Pagi, Petang, atau Sepenuh Hari).');
      return;
    }
    if (attendees < 1 || attendees > venue.capacity) {
      setFormError(
        `Bilangan peserta mestilah antara 1 hingga ${venue.capacity} orang bagi ${venue.name}.`
      );
      return;
    }
    if (!customerName.trim() || !email.trim() || !phone.trim() || !eventTitle.trim()) {
      setFormError('Sila lengkapkan semua maklumat wajib pemohon dan tajuk program.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('Format alamat emel tidak sah.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueId: venue.id,
          date: selectedDate,
          slot: selectedSlot,
          attendees,
          layout,
          customerName: customerName.trim(),
          organization: organization.trim(),
          email: email.trim(),
          phone: phone.trim(),
          eventTitle: eventTitle.trim(),
          notes: notes.trim(),
          addonIds: selectedAddons,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Tempahan tidak dapat diproses.');
      }
      onBookingCreated(data.booking);
      setSelectedSlot('');
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Berlaku ralat semasa menghantar tempahan.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="semak-kekosongan"
      className="py-14 lg:py-20 bg-white border-y border-slate-200 no-print"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <p className="text-sm font-medium text-[#0F4C5C] mb-2">
            02. Semakan Tarikh & Tempahan Dalam Talian
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 [text-wrap:balance]">
            Semak Kekosongan dan Lengkapkan Tempahan Anda
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl">
            Pilih ruang, klik tarikh pada kalendar untuk melihat slot masa yang masih kosong, dan teruskan ke pembayaran dalam talian.
          </p>
        </div>

        {/* Venue Selector Bar */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8"
          role="radiogroup"
          aria-label="Pilih ruang untuk disemak"
        >
          {VENUES.map((item) => {
            const active = item.id === venue.id;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onSelectVenueId(item.id)}
                className={`text-left p-4 rounded-xl border transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] ${
                  active
                    ? 'bg-[#0F4C5C] text-white border-[#0F4C5C]'
                    : 'bg-[#F8F9FA] text-slate-900 border-slate-200 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span
                    className={`text-xs font-medium ${
                      active ? 'text-slate-200' : 'text-slate-500'
                    }`}
                  >
                    {item.categoryLabel}
                  </span>
                  <span
                    className={`text-xs font-mono tabular-nums ${
                      active ? 'text-slate-200' : 'text-slate-500'
                    }`}
                  >
                    Maks {item.capacity} org
                  </span>
                </div>
                <p className="text-sm font-semibold truncate">{item.name}</p>
                <p
                  className={`text-xs mt-1 font-mono tabular-nums ${
                    active ? 'text-slate-100' : 'text-slate-600'
                  }`}
                >
                  {formatRM(item.halfDayRate)} / {formatRM(item.fullDayRate)}
                </p>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Interactive Monthly Availability Calendar */}
          <div className="lg:col-span-5 bg-[#F8F9FA] border border-slate-200 rounded-xl p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {formatMonthYearMalay(viewYear, viewMonth)}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Jadual kekosongan bagi {venue.name}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  disabled={!canGoPrevMonth}
                  aria-label="Bulan sebelumnya"
                  className="p-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label="Bulan seterusnya"
                  className="p-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {calError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{calError}</span>
              </div>
            )}

            <div className="grid grid-cols-7 gap-1.5 mb-2">
              {WEEKDAY_SHORT.map((dayName) => (
                <div
                  key={dayName}
                  className="text-center text-xs font-medium text-slate-500 py-1"
                >
                  {dayName}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5" aria-busy={loadingCal}>
              {calendarDays.map((cell, idx) => {
                if (!cell) {
                  return <div key={`empty-${idx}`} className="min-h-[54px]" />;
                }

                const isPast = cell.ymd < todayStr;
                const dayInfo = availabilityMap[cell.ymd];
                const status = dayInfo?.status ?? 'tersedia';
                const isSelected = cell.ymd === selectedDate;

                let cellStyle =
                  'bg-white border-slate-200 text-slate-900 hover:border-[#0F4C5C]';
                let subLabel = 'Kosong';
                let subLabelColor = 'text-emerald-700';

                if (isPast) {
                  cellStyle =
                    'bg-slate-100 border-slate-200/70 text-slate-400 cursor-not-allowed';
                  subLabel = '—';
                  subLabelColor = 'text-slate-400';
                } else if (status === 'penuh') {
                  cellStyle = isSelected
                    ? 'bg-red-50 border-red-600 text-red-900 ring-1 ring-red-600'
                    : 'bg-red-50/70 border-red-200 text-red-800 hover:border-red-400';
                  subLabel = 'Penuh';
                  subLabelColor = 'text-red-700';
                } else if (status === 'terhad') {
                  cellStyle = isSelected
                    ? 'bg-amber-50 border-[#0F4C5C] text-slate-900 ring-2 ring-[#0F4C5C]'
                    : 'bg-amber-50/70 border-amber-300 text-slate-900 hover:border-amber-500';
                  subLabel = 'Terhad';
                  subLabelColor = 'text-amber-800';
                } else if (isSelected) {
                  cellStyle =
                    'bg-[#0F4C5C] border-[#0F4C5C] text-white ring-2 ring-[#0F4C5C]/25';
                  subLabel = 'Dipilih';
                  subLabelColor = 'text-slate-100';
                }

                return (
                  <button
                    key={cell.ymd}
                    type="button"
                    disabled={isPast}
                    onClick={() => setSelectedDate(cell.ymd)}
                    aria-label={`${formatDateMalay(cell.ymd)} - ${
                      isPast ? 'Tarikh berlalu' : subLabel
                    }`}
                    className={`min-h-[54px] rounded-lg border p-1.5 flex flex-col items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] ${cellStyle}`}
                  >
                    <span className="text-sm font-semibold font-mono tabular-nums leading-none">
                      {cell.day}
                    </span>
                    <span
                      className={`text-[10px] font-medium mt-1 leading-none ${subLabelColor}`}
                    >
                      {subLabel}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-200 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-white border border-slate-300 inline-block" />
                <span>Tersedia</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-100 border border-amber-400 inline-block" />
                <span>Terhad (1 slot kosong)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-red-100 border border-red-300 inline-block" />
                <span>Penuh Ditempah</span>
              </div>
            </div>
          </div>

          {/* Right Column: Slot Selection + Booking Form */}
          <div className="lg:col-span-7">
            <form
              onSubmit={handleSubmitBooking}
              className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-7"
            >
              {/* Step 1: Date & Slot Picker */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-[#0F4C5C]" />
                    <h3 className="text-base font-bold text-slate-900">
                      Slot Masa untuk {formatDateMalay(selectedDate, true)}
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {venue.name}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                  {TIME_SLOTS.map((slot) => {
                    const available = isSlotAvailable(slot.id);
                    const active = selectedSlot === slot.id;
                    const rate =
                      slot.rateType === 'full'
                        ? venue.fullDayRate
                        : venue.halfDayRate;

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={!available}
                        onClick={() => setSelectedSlot(slot.id)}
                        className={`text-left p-4 rounded-xl border transition-colors flex flex-col justify-between min-h-[116px] ${
                          !available
                            ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                            : active
                            ? 'bg-[#0F4C5C]/5 border-[#0F4C5C] ring-1 ring-[#0F4C5C] cursor-pointer'
                            : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span
                              className={`text-xs font-medium inline-flex items-center gap-1 ${
                                available
                                  ? active
                                    ? 'text-[#0F4C5C]'
                                    : 'text-emerald-700'
                                  : 'text-red-600'
                              }`}
                            >
                              {available ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Tersedia</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3.5 h-3.5" />
                                  <span>Ditempah</span>
                                </>
                              )}
                            </span>
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                          <p className="text-sm font-semibold text-slate-900">
                            {slot.id === 'pagi'
                              ? 'Sesi Pagi'
                              : slot.id === 'petang'
                              ? 'Sesi Petang'
                              : 'Sepenuh Hari'}
                          </p>
                          <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                            {slot.timeRange}
                          </p>
                        </div>

                        <p className="text-sm font-bold text-slate-900 font-mono tabular-nums mt-3">
                          {formatRM(rate)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Room Configuration & Add-ons */}
              <div className="pt-2 border-t border-slate-100 space-y-5">
                <h4 className="text-sm font-bold text-slate-900">
                  Konfigurasi Acara & Keperluan Tambahan
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="attendees-input"
                      className="block text-xs font-medium text-slate-700 mb-1.5"
                    >
                      Anggaran Bilangan Peserta (Maks {venue.capacity} orang)
                    </label>
                    <div className="relative">
                      <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="attendees-input"
                        type="number"
                        min={1}
                        max={venue.capacity}
                        value={attendees}
                        onChange={(e) =>
                          setAttendees(
                            Math.max(1, Math.min(venue.capacity, Number(e.target.value) || 1))
                          )
                        }
                        className="w-full pl-9 pr-3 py-2.5 text-sm font-mono tabular-nums border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] focus:border-[#0F4C5C]"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="layout-select"
                      className="block text-xs font-medium text-slate-700 mb-1.5"
                    >
                      Susunan Meja & Kerusi
                    </label>
                    <select
                      id="layout-select"
                      value={layout}
                      onChange={(e) => setLayout(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] focus:border-[#0F4C5C]"
                    >
                      {venue.layouts.map((l) => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-700 mb-2">
                    Pakej Tambahan (Pilihan)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {ADDONS.map((addon) => {
                      const checked = selectedAddons.includes(addon.id);
                      const unitLabel =
                        addon.unit === 'per_orang'
                          ? `${formatRM(addon.price)} / orang`
                          : `${formatRM(addon.price)} / hari`;

                      return (
                        <label
                          key={addon.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            checked
                              ? 'border-[#0F4C5C] bg-[#0F4C5C]/5'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleAddon(addon.id)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#0F4C5C] focus:ring-[#0F4C5C]"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-900">
                              {addon.name}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {addon.description}
                            </p>
                            <p className="text-xs font-mono tabular-nums font-medium text-[#0F4C5C] mt-1">
                              {unitLabel}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Step 3: Applicant Details */}
              <div className="pt-2 border-t border-slate-100 space-y-4">
                <h4 className="text-sm font-bold text-slate-900">
                  Maklumat Pemohon & Organisasi
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="customer-name"
                      className="block text-xs font-medium text-slate-700 mb-1.5"
                    >
                      Nama Penuh *
                    </label>
                    <input
                      id="customer-name"
                      type="text"
                      required
                      placeholder="Contoh: Ahmad Syafiq bin Razali"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] focus:border-[#0F4C5C]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="organization"
                      className="block text-xs font-medium text-slate-700 mb-1.5"
                    >
                      Syarikat / Agensi / Organisasi
                    </label>
                    <input
                      id="organization"
                      type="text"
                      placeholder="Contoh: Akademi Korporat Malaysia"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] focus:border-[#0F4C5C]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-medium text-slate-700 mb-1.5"
                    >
                      Alamat Emel Rasmi *
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="nama@organisasi.com.my"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] focus:border-[#0F4C5C]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-xs font-medium text-slate-700 mb-1.5"
                    >
                      No. Telefon (WhatsApp) *
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      required
                      placeholder="012-3456789"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] focus:border-[#0F4C5C]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="event-title"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    Tajuk Program / Mesyuarat *
                  </label>
                  <input
                    id="event-title"
                    type="text"
                    required
                    placeholder="Contoh: Bengkel Strategi Tahunan 2026"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] focus:border-[#0F4C5C]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="notes"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    Catatan Tambahan (Pilihan)
                  </label>
                  <textarea
                    id="notes"
                    rows={2}
                    placeholder="Contoh: Perlukan 2 mikrofon tanpa wayar tambahan atau meja pendaftaran di ruang legar."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] focus:border-[#0F4C5C]"
                  />
                </div>
              </div>

              {/* Price Summary & Submit */}
              <div className="pt-5 border-t border-slate-200 bg-[#F8F9FA] -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-6 sm:p-8 rounded-b-xl">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>
                      Sewaan {venue.name} (
                      {selectedSlot
                        ? TIME_SLOTS.find((s) => s.id === selectedSlot)?.label
                        : 'Belum pilih slot'}
                      )
                    </span>
                    <span className="font-mono tabular-nums font-medium text-slate-900">
                      {formatRM(pricing.baseAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Pakej Tambahan ({selectedAddons.length} item)</span>
                    <span className="font-mono tabular-nums font-medium text-slate-900">
                      {formatRM(pricing.addonsAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Cukai Perkhidmatan (SST 8%)</span>
                    <span className="font-mono tabular-nums font-medium text-slate-900">
                      {formatRM(pricing.sst)}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-base font-bold text-slate-900">
                      Jumlah Perlu Dibayar
                    </span>
                    <span className="text-xl font-bold text-[#0F4C5C] font-mono tabular-nums">
                      {formatRM(pricing.total)}
                    </span>
                  </div>
                </div>

                {formError && (
                  <div
                    role="alert"
                    className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-xs text-slate-500">
                    Slot dikunci serta-merta selepas pembayaran dalam talian disahkan.
                  </p>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 text-sm font-medium text-white bg-[#0F4C5C] hover:bg-[#0B3B48] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0F4C5C]"
                  >
                    {submitting
                      ? 'Mencipta Tempahan...'
                      : 'Teruskan ke Pembayaran Dalam Talian'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

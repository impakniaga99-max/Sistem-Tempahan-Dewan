import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Search,
  XCircle,
} from 'lucide-react';
import type { BookingRecord, BookingStatus } from '../types.ts';
import { formatDateMalay, formatRM } from '../utils/format.ts';

interface BookingLookupSectionProps {
  refreshTrigger: number;
  onOpenPaymentOrReceipt: (booking: BookingRecord) => void;
  onBookingCancelled: () => void;
}

type StatusFilter = 'semua' | BookingStatus;

export function BookingLookupSection({
  refreshTrigger,
  onOpenPaymentOrReceipt,
  onBookingCancelled,
}: BookingLookupSectionProps) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('semua');
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  function loadBookings(searchTerm = '') {
    setLoading(true);
    setError('');
    const url = searchTerm.trim()
      ? `/api/bookings?ref=${encodeURIComponent(searchTerm.trim())}`
      : '/api/bookings';

    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error('Gagal mendapatkan senarai tempahan.');
        return res.json();
      })
      .then((data) => {
        setBookings(Array.isArray(data.bookings) ? data.bookings : []);
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : 'Berlaku ralat semasa memuatkan rekod.'
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    loadBookings(query);
  }, [refreshTrigger]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadBookings(query);
  }

  async function handleCancel(bookingId: string) {
    setCancellingId(bookingId);
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}/cancel`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Pembatalan gagal diproses.');
      loadBookings(query);
      onBookingCancelled();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ralat semasa membatalkan tempahan.'
      );
    } finally {
      setCancellingId(null);
    }
  }

  const visibleBookings =
    statusFilter === 'semua'
      ? bookings
      : bookings.filter((b) => b.status === statusFilter);

  const filterOptions: { id: StatusFilter; label: string }[] = [
    { id: 'semua', label: 'Semua Rekod' },
    { id: 'Disahkan & Dibayar', label: 'Disahkan & Dibayar' },
    { id: 'Menunggu Pembayaran', label: 'Menunggu Bayaran' },
    { id: 'Dibatalkan', label: 'Dibatalkan' },
  ];

  return (
    <section id="status-tempahan" className="py-14 lg:py-20 bg-white no-print">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
          <div>
            <p className="text-sm font-medium text-[#0F4C5C] mb-2">
              04. Semakan Status & Rekod Tempahan
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 [text-wrap:balance]">
              Semak Tempahan, Resit dan Jadual Terkini
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl">
              Masukkan nombor rujukan tempahan (contoh: DP-2026-1001), nama pemohon, atau alamat emel untuk menyemak status dan mencetak resit rasmi.
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari rujukan, nama atau emel..."
                aria-label="Cari rekod tempahan"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 text-sm font-medium text-white bg-[#0F4C5C] hover:bg-[#0B3B48] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Semak
            </button>
          </form>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div
            className="inline-flex items-center gap-1 p-1 bg-[#F8F9FA] border border-slate-200 rounded-lg overflow-x-auto max-w-full"
            role="tablist"
            aria-label="Tapis status tempahan"
          >
            {filterOptions.map((opt) => {
              const active = statusFilter === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setStatusFilter(opt.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-white text-slate-900 border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-slate-500 font-mono tabular-nums">
            Memaparkan {visibleBookings.length} rekod
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Memuatkan rekod tempahan...
            </div>
          ) : visibleBookings.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-semibold text-slate-900">
                Tiada rekod tempahan ditemui
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Cuba kata kunci carian lain atau pilih penapis status yang berbeza.
              </p>
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    loadBookings('');
                  }}
                  className="mt-4 px-4 py-2 text-xs font-medium text-[#0F4C5C] border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Papar Semua Tempahan
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#F8F9FA] text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">No. Rujukan</th>
                    <th className="py-3 px-4">Ruang & Program</th>
                    <th className="py-3 px-4">Tarikh & Slot</th>
                    <th className="py-3 px-4">Pemohon</th>
                    <th className="py-3 px-4 text-right">Jumlah</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {visibleBookings.map((b) => {
                    const isPaid = b.status === 'Disahkan & Dibayar';
                    const isPending = b.status === 'Menunggu Pembayaran';
                    const isCancelled = b.status === 'Dibatalkan';

                    return (
                      <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono tabular-nums text-xs font-semibold text-slate-900 whitespace-nowrap">
                          {b.referenceCode}
                        </td>
                        <td className="py-3.5 px-4 min-w-[220px]">
                          <p className="font-semibold text-slate-900">{b.venueName}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[260px]">
                            {b.eventTitle} · {b.attendees} org
                          </p>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <p className="text-slate-900 font-medium">
                            {formatDateMalay(b.date)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {b.slot === 'pagi'
                              ? '08:00 – 13:00'
                              : b.slot === 'petang'
                              ? '14:00 – 19:00'
                              : '08:00 – 18:00'}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 min-w-[170px]">
                          <p className="text-slate-900">{b.customerName}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[190px]">
                            {b.organization}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                          {formatRM(b.totalAmount)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isPaid && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span>Disahkan</span>
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                              <span>Menunggu Bayaran</span>
                            </span>
                          )}
                          {isCancelled && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700">
                              <XCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>Dibatalkan</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-3">
                            {isPaid && (
                              <button
                                type="button"
                                onClick={() => onOpenPaymentOrReceipt(b)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-[#0F4C5C] hover:underline underline-offset-4 cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Resit</span>
                              </button>
                            )}
                            {isPending && (
                              <button
                                type="button"
                                onClick={() => onOpenPaymentOrReceipt(b)}
                                className="px-2.5 py-1 text-xs font-medium text-white bg-[#0F4C5C] hover:bg-[#0B3B48] rounded-md cursor-pointer"
                              >
                                Bayar
                              </button>
                            )}
                            {!isCancelled && (
                              <button
                                type="button"
                                disabled={cancellingId === b.id}
                                onClick={() => handleCancel(b.id)}
                                className="text-xs font-medium text-slate-500 hover:text-red-700 disabled:opacity-50 cursor-pointer"
                              >
                                {cancellingId === b.id ? 'Memproses...' : 'Batal'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

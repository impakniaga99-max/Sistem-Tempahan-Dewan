import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Lock,
  LogOut,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react';
import { VENUES } from '../data/venues.ts';
import type {
  AdminOverviewResponse,
  BookingRecord,
  BookingStatus,
} from '../types.ts';
import { formatDateMalay, formatDateTimeMalay, formatRM } from '../utils/format.ts';

interface AdminPageProps {
  onBackToPublic: () => void;
  onOpenReceipt: (booking: BookingRecord) => void;
  onDataMutated: () => void;
}

const ADMIN_TOKEN_STORAGE_KEY = 'dewan_pro_admin_token';

type StatusFilter = 'semua' | BookingStatus;

export function AdminPage({
  onBackToPublic,
  onOpenReceipt,
  onDataMutated,
}: AdminPageProps) {
  const [token, setToken] = useState<string>(() => {
    try {
      return sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Dashboard state
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState('');

  // Ledger filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('semua');
  const [venueFilter, setVenueFilter] = useState<string>('semua');
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  const fetchOverview = useCallback(async (activeToken: string) => {
    if (!activeToken) return;
    setLoadingData(true);
    setDataError('');
    try {
      const res = await fetch('/api/admin/overview', {
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });
      if (res.status === 401) {
        sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
        setToken('');
        setOverview(null);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memuatkan data papan pemuka.');
      }
      setOverview(data);
    } catch (err) {
      setDataError(
        err instanceof Error ? err.message : 'Berlaku ralat rangkaian.'
      );
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      void fetchOverview(token);
    }
  }, [token, fetchOverview]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Log masuk gagal.');
      }
      sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, data.token);
      setToken(data.token);
      setUsername('');
      setPassword('');
    } catch (err) {
      setLoginError(
        err instanceof Error ? err.message : 'Nama pengguna atau kata laluan salah.'
      );
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleLogout() {
    if (token) {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    sessionStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    setToken('');
    setOverview(null);
  }

  async function handleConfirmBooking(bookingId: string) {
    setActionBusyId(bookingId);
    try {
      const res = await fetch(
        `/api/admin/bookings/${encodeURIComponent(bookingId)}/confirm`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Pengesahan gagal.');
      }
      await fetchOverview(token);
      onDataMutated();
    } catch (err) {
      setDataError(err instanceof Error ? err.message : 'Ralat pengesahan.');
    } finally {
      setActionBusyId(null);
    }
  }

  async function handleCancelBooking(bookingId: string) {
    setActionBusyId(bookingId);
    try {
      const res = await fetch(
        `/api/admin/bookings/${encodeURIComponent(bookingId)}/cancel`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Pembatalan gagal.');
      }
      await fetchOverview(token);
      onDataMutated();
    } catch (err) {
      setDataError(err instanceof Error ? err.message : 'Ralat pembatalan.');
    } finally {
      setActionBusyId(null);
    }
  }

  const filteredBookings = useMemo(() => {
    const list = overview?.bookings ?? [];
    const q = searchQuery.trim().toLowerCase();
    return list.filter((b) => {
      if (statusFilter !== 'semua' && b.status !== statusFilter) return false;
      if (venueFilter !== 'semua' && b.venueId !== venueFilter) return false;
      if (!q) return true;
      return (
        b.referenceCode.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.organization.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q) ||
        b.eventTitle.toLowerCase().includes(q) ||
        (b.transactionId ?? '').toLowerCase().includes(q)
      );
    });
  }, [overview, searchQuery, statusFilter, venueFilter]);

  function handleExportCsv() {
    const rows = filteredBookings;
    const headers = [
      'No Rujukan',
      'Ruang',
      'Tarikh',
      'Slot',
      'Peserta',
      'Pemohon',
      'Organisasi',
      'Emel',
      'Telefon',
      'Program',
      'Jumlah (RM)',
      'Status',
      'Kaedah Bayaran',
      'ID Transaksi',
    ];
    const escapeCsv = (val: string | number) => {
      const str = String(val ?? '');
      return `"${str.replace(/"/g, '""')}"`;
    };
    const csvLines = [
      headers.map(escapeCsv).join(','),
      ...rows.map((b) =>
        [
          b.referenceCode,
          b.venueName,
          b.date,
          b.slotLabel,
          b.attendees,
          b.customerName,
          b.organization,
          b.email,
          b.phone,
          b.eventTitle,
          b.totalAmount.toFixed(2),
          b.status,
          b.paymentMethod ?? '-',
          b.transactionId ?? '-',
        ]
          .map(escapeCsv)
          .join(',')
      ),
    ];

    const blob = new Blob([`\uFEFF${csvLines.join('\n')}`], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rekod-tempahan-dewan-pro-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Login Gate
  if (!token) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#F8F9FA] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
          <div className="mb-6">
            <button
              type="button"
              onClick={onBackToPublic}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 mb-4 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Laman Utama</span>
            </button>
            <div className="flex items-center gap-2.5 mb-2">
              <Lock className="w-5 h-5 text-[#0F4C5C]" />
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Log Masuk Panel Admin
              </h1>
            </div>
            <p className="text-sm text-slate-600">
              Akses papan pemuka pengurusan, analisa hasil, serta rekod tempahan dan pembayaran Sistem Tempahan Dewan Pro.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="admin-username"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Nama Pengguna
              </label>
              <input
                id="admin-username"
                type="text"
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan nama pengguna"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Kata Laluan
              </label>
              <input
                id="admin-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata laluan"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
              />
            </div>

            {loginError && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 px-4 text-sm font-medium text-white bg-[#0F4C5C] hover:bg-[#0B3B48] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
            >
              {loginLoading ? 'Mengesahkan...' : 'Log Masuk ke Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const kpis = overview?.kpis;
  const venueBreakdown = overview?.venueBreakdown ?? [];
  const paymentBreakdown = overview?.paymentBreakdown ?? [];
  const slotBreakdown = overview?.slotBreakdown ?? [];

  const maxSlotCount = Math.max(1, ...slotBreakdown.map((s) => s.count));
  const totalPaidTransactions = Math.max(
    1,
    paymentBreakdown.reduce((acc, cur) => acc + cur.count, 0)
  );

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F8F9FA] py-8 lg:py-10 no-print">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-8">
        {/* Top Admin Context Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <p className="text-xs font-medium text-[#0F4C5C] mb-1">
              Pentadbiran / Dashboard & Analisa
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Papan Pemuka Pentadbir Dewan Pro
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => void fetchOverview(token)}
              disabled={loadingData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`}
              />
              <span>Muat Semula</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Muat Turun CSV</span>
            </button>

            <button
              type="button"
              onClick={onBackToPublic}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Laman Utama</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded-lg cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Keluar</span>
            </button>
          </div>
        </div>

        {dataError && (
          <div
            role="alert"
            className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{dataError}</span>
          </div>
        )}

        {/* 1. KPI Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">
              Jumlah Hasil Disahkan
            </p>
            <p className="text-2xl font-bold text-[#0F4C5C] font-mono tabular-nums mt-2">
              {formatRM(kpis?.confirmedRevenue ?? 0)}
            </p>
            <p className="text-xs text-slate-500 mt-1.5 tabular-nums">
              Purata {formatRM(kpis?.avgBookingValue ?? 0)} / tempahan
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">
              Menunggu Pembayaran
            </p>
            <p className="text-2xl font-bold text-amber-700 font-mono tabular-nums mt-2">
              {formatRM(kpis?.pendingRevenue ?? 0)}
            </p>
            <p className="text-xs text-slate-500 mt-1.5 tabular-nums">
              {kpis?.pendingCount ?? 0} tempahan belum dijelaskan
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">
              Tempahan Aktif
            </p>
            <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-2">
              {kpis?.totalBookings ?? 0}
            </p>
            <p className="text-xs text-slate-500 mt-1.5 tabular-nums">
              {kpis?.confirmedCount ?? 0} disahkan · {kpis?.cancelledCount ?? 0} dibatalkan
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">
              Jumlah Peserta Dijangka
            </p>
            <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-2">
              {(kpis?.totalParticipants ?? 0).toLocaleString('en-MY')}
            </p>
            <p className="text-xs text-slate-500 mt-1.5">
              Merentas 4 dewan & bilik aktif
            </p>
          </div>
        </div>

        {/* 2. Analytics Grid: Room Utilization & Payment/Slot Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Venue Revenue & Occupancy Breakdown */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Analisa Prestasi Mengikut Ruang
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sumbangan hasil disahkan dan bilangan peserta setiap dewan/bilik
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500 tabular-nums">
                4 Ruang
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {venueBreakdown.map((item) => (
                <div key={item.venueId} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {item.venueName}
                      </p>
                      <p className="text-xs text-slate-500 tabular-nums">
                        {item.bookingsCount} tempahan aktif ·{' '}
                        {item.totalAttendees} jumlah peserta (kapasiti {item.capacity})
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                        {formatRM(item.revenue)}
                      </p>
                      <p className="text-xs text-[#0F4C5C] font-mono tabular-nums">
                        {item.sharePercent}% daripada hasil
                      </p>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0F4C5C] rounded-full transition-all"
                      style={{ width: `${Math.max(item.sharePercent, item.bookingsCount > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Methods & Slot Demand Analytics */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="text-base font-bold text-slate-900">
                Analisa Saluran Pembayaran
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 mb-4">
                Pecahan transaksi yang telah disahkan
              </p>

              <div className="space-y-3.5">
                {paymentBreakdown.map((pm) => {
                  const pct = Math.round((pm.count / totalPaidTransactions) * 100);
                  return (
                    <div key={pm.method}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-slate-800">
                          {pm.label}
                        </span>
                        <span className="font-mono tabular-nums text-slate-700">
                          {pm.count} bil · {formatRM(pm.amount)}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h2 className="text-base font-bold text-slate-900">
                Permintaan Mengikut Slot Masa
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 mb-4">
                Taburan tempahan aktif antara sesi pagi, petang, dan sepenuh hari
              </p>

              <div className="space-y-3">
                {slotBreakdown.map((s) => {
                  const widthPct = Math.round((s.count / maxSlotCount) * 100);
                  return (
                    <div
                      key={s.slot}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="text-slate-700 font-medium w-40 truncate">
                        {s.label}
                      </span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-700 rounded-full"
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                      <span className="font-mono tabular-nums text-slate-900 font-semibold w-12 text-right">
                        {s.count}x
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Full Booking & Payment Ledger */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-200 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Rekod Tempahan & Pembayaran Lengkap
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sahkan bayaran manual, semak ID transaksi, cetak resit, atau batalkan tempahan
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari rujukan, pelanggan, TXN..."
                    aria-label="Cari rekod pentadbir"
                    className="w-full sm:w-64 pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
                  />
                </div>

                <select
                  value={venueFilter}
                  onChange={(e) => setVenueFilter(e.target.value)}
                  aria-label="Tapis mengikut ruang"
                  className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
                >
                  <option value="semua">Semua Ruang</option>
                  {VENUES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div
                className="inline-flex items-center gap-1 p-1 bg-[#F8F9FA] border border-slate-200 rounded-lg overflow-x-auto max-w-full"
                role="tablist"
                aria-label="Tapis status rekod admin"
              >
                {(
                  [
                    { id: 'semua', label: 'Semua' },
                    { id: 'Disahkan & Dibayar', label: 'Disahkan & Dibayar' },
                    { id: 'Menunggu Pembayaran', label: 'Menunggu Bayaran' },
                    { id: 'Dibatalkan', label: 'Dibatalkan' },
                  ] as { id: StatusFilter; label: string }[]
                ).map((tab) => {
                  const active = statusFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setStatusFilter(tab.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        active
                          ? 'bg-white text-slate-900 border border-slate-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <p className="text-xs font-mono tabular-nums text-slate-500">
                {filteredBookings.length} rekod dipaparkan
              </p>
            </div>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Tiada rekod tempahan yang sepadan dengan penapis semasa.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#F8F9FA] text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Rujukan</th>
                    <th className="py-3 px-4">Pelanggan & Program</th>
                    <th className="py-3 px-4">Ruang</th>
                    <th className="py-3 px-4">Tarikh & Slot</th>
                    <th className="py-3 px-4">Pembayaran / TXN</th>
                    <th className="py-3 px-4 text-right">Jumlah</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {filteredBookings.map((b) => {
                    const isPaid = b.status === 'Disahkan & Dibayar';
                    const isPending = b.status === 'Menunggu Pembayaran';
                    const isCancelled = b.status === 'Dibatalkan';
                    const busy = actionBusyId === b.id;

                    return (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                          {b.referenceCode}
                        </td>
                        <td className="py-3.5 px-4 min-w-[200px]">
                          <p className="font-semibold text-slate-900">{b.customerName}</p>
                          <p className="text-slate-500 truncate max-w-[230px]">
                            {b.organization} · {b.eventTitle}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <p className="font-medium text-slate-900">{b.venueName}</p>
                          <p className="text-slate-500 tabular-nums">{b.attendees} peserta</p>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <p className="font-medium text-slate-900">
                            {formatDateMalay(b.date)}
                          </p>
                          <p className="text-slate-500">
                            {b.slot === 'pagi'
                              ? 'Pagi (08:00–13:00)'
                              : b.slot === 'petang'
                              ? 'Petang (14:00–19:00)'
                              : 'Sepenuh Hari'}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isPaid ? (
                            <div>
                              <p className="font-mono tabular-nums font-medium text-slate-900">
                                {b.transactionId}
                              </p>
                              <p className="text-slate-500">
                                {b.paymentMethod === 'fpx'
                                  ? `FPX (${b.paymentBank ?? 'Online'})`
                                  : b.paymentMethod === 'kad'
                                  ? 'Kad Kredit/Debit'
                                  : 'DuitNow QR'}
                                {b.paidAt ? ` · ${formatDateTimeMalay(b.paidAt)}` : ''}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-400">Belum dibayar</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                          {formatRM(b.totalAmount)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isPaid && (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span>Disahkan</span>
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                              <span>Menunggu</span>
                            </span>
                          )}
                          {isCancelled && (
                            <span className="inline-flex items-center gap-1 text-red-700 font-medium">
                              <XCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>Dibatalkan</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2.5">
                            {isPaid && (
                              <button
                                type="button"
                                onClick={() => onOpenReceipt(b)}
                                className="inline-flex items-center gap-1 text-[#0F4C5C] font-medium hover:underline underline-offset-4 cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Resit</span>
                              </button>
                            )}
                            {isPending && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void handleConfirmBooking(b.id)}
                                className="px-2.5 py-1 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded cursor-pointer"
                              >
                                Sahkan Bayaran
                              </button>
                            )}
                            {!isCancelled && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void handleCancelBooking(b.id)}
                                className="text-slate-500 hover:text-red-700 font-medium disabled:opacity-50 cursor-pointer"
                              >
                                Batal
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
    </div>
  );
}

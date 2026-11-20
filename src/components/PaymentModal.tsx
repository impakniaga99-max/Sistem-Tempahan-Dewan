import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Landmark,
  Printer,
  QrCode,
  ShieldCheck,
  X,
} from 'lucide-react';
import { FPX_BANKS } from '../data/venues.ts';
import { processPayment } from '../services/bookingService.ts';
import type { BookingRecord, PaymentMethodId } from '../types.ts';
import {
  formatBookingDatesMalay,
  formatDateMalay,
  formatDateTimeMalay,
  formatRM,
  getBookingDates,
} from '../utils/format.ts';

interface PaymentModalProps {
  booking: BookingRecord | null;
  onClose: () => void;
  onPaymentSuccess: (updated: BookingRecord) => void;
}

export function PaymentModal({
  booking,
  onClose,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethodId>('fpx');
  const [fpxBank, setFpxBank] = useState(FPX_BANKS[0].name);
  const [fpxType, setFpxType] = useState<'b2c' | 'b2b'>('b2c');

  const [cardNumber, setCardNumber] = useState('4532 8810 2940 1124');
  const [cardExpiry, setCardExpiry] = useState('09/29');
  const [cardCvv, setCardCvv] = useState('418');
  const [cardHolder, setCardHolder] = useState('');

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  if (!booking) return null;

  const isPaid = booking.status === 'Disahkan & Dibayar';

  function formatCardInput(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  }

  function formatExpiryInput(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  }

  async function handleConfirmPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!booking) return;
    setError('');

    if (method === 'kad') {
      const cleanCard = cardNumber.replace(/\s/g, '');
      if (cleanCard.length < 16) {
        setError('Sila masukkan 16 digit nombor kad kredit atau debit.');
        return;
      }
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        setError('Format tarikh luput kad mestilah MM/YY.');
        return;
      }
      if (cardCvv.length < 3) {
        setError('Sila masukkan 3 digit kod keselamatan CVV.');
        return;
      }
      if (!cardHolder.trim()) {
        setError('Sila masukkan nama pemegang kad.');
        return;
      }
    }

    setProcessing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      const updatedBooking = await processPayment(
        booking.id,
        method,
        method === 'fpx' ? `${fpxBank} (${fpxType.toUpperCase()})` : undefined
      );
      onPaymentSuccess(updatedBooking);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ralat berlaku semasa memproses bayaran.'
      );
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 no-print">
          <div>
            <h3
              id="payment-modal-title"
              className="text-lg font-bold text-slate-900"
            >
              {isPaid
                ? 'Resit Rasmi Pembayaran Tempahan'
                : 'Gerbang Pembayaran Dalam Talian'}
            </h3>
            <p className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
              Rujukan: {booking.referenceCode}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup tetingkap"
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isPaid ? (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-emerald-950">
                  Pembayaran Disahkan & Tempahan Berjaya
                </p>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Slot anda telah dikunci secara rasmi dalam sistem. Sila simpan nombor rujukan untuk semakan di kaunter atau daftar masuk acara.
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl divide-y divide-slate-200 text-sm">
              <div className="p-4 flex flex-wrap items-center justify-between gap-2 bg-[#F8F9FA]">
                <div>
                  <p className="text-xs text-slate-500">No. Rujukan Tempahan</p>
                  <p className="font-mono font-bold text-slate-900 tabular-nums">
                    {booking.referenceCode}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">ID Transaksi</p>
                  <p className="font-mono font-medium text-slate-800 tabular-nums">
                    {booking.transactionId}
                  </p>
                </div>
              </div>

              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Ruang / Dewan</p>
                  <p className="font-semibold text-slate-900">{booking.venueName}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{booking.layout}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Tarikh & Slot Masa</p>
                  <p className="font-semibold text-slate-900">
                    {formatBookingDatesMalay(booking.date, booking.dates, true)}
                  </p>
                  {getBookingDates(booking).length > 1 && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {getBookingDates(booking).map((d) => formatDateMalay(d)).join(' · ')}
                    </p>
                  )}
                  <p className="text-xs text-slate-600 mt-0.5">{booking.slotLabel}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Pemohon / Organisasi</p>
                  <p className="font-medium text-slate-900">{booking.customerName}</p>
                  <p className="text-xs text-slate-600">{booking.organization}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Program & Peserta</p>
                  <p className="font-medium text-slate-900">{booking.eventTitle}</p>
                  <p className="text-xs text-slate-600 tabular-nums">
                    {booking.attendees} orang peserta
                  </p>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>
                    Kadar Sewaan Asas
                    {getBookingDates(booking).length > 1
                      ? ` (${getBookingDates(booking).length} hari)`
                      : ''}
                  </span>
                  <span className="font-mono tabular-nums">
                    {formatRM(booking.baseAmount)}
                  </span>
                </div>
                {booking.addons.map((addon) => (
                  <div
                    key={addon.addonId}
                    className="flex justify-between text-xs text-slate-600"
                  >
                    <span>
                      {addon.name} (x{addon.quantity})
                    </span>
                    <span className="font-mono tabular-nums">
                      {formatRM(addon.subtotal)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-xs text-slate-600">
                  <span>SST (8%)</span>
                  <span className="font-mono tabular-nums">
                    {formatRM(booking.sstAmount)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                  <span>Jumlah Telah Dibayar</span>
                  <span className="font-mono tabular-nums text-[#0F4C5C]">
                    {formatRM(booking.totalAmount)}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-[#F8F9FA] flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span>
                  Kaedah:{' '}
                  {booking.paymentMethod === 'fpx'
                    ? `FPX (${booking.paymentBank})`
                    : booking.paymentMethod === 'kad'
                    ? 'Kad Kredit / Debit'
                    : 'DuitNow QR'}
                </span>
                <span>
                  Tarikh Bayaran:{' '}
                  {booking.paidAt ? formatDateTimeMalay(booking.paidAt) : '-'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Resit</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-white bg-[#0F4C5C] hover:bg-[#0B3B48] rounded-lg cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConfirmPayment} className="p-6 sm:p-8 space-y-6">
            {/* Compact Order Summary */}
            <div className="p-4 rounded-xl bg-[#F8F9FA] border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {booking.venueName} ·{' '}
                  {formatBookingDatesMalay(booking.date, booking.dates)}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  {booking.slotLabel} · {booking.attendees} orang
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-xs text-slate-500">Jumlah Bayaran</p>
                <p className="text-xl font-bold text-[#0F4C5C] font-mono tabular-nums">
                  {formatRM(booking.totalAmount)}
                </p>
              </div>
            </div>

            {/* Payment Method Tabs */}
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2.5">
                Pilih Kaedah Pembayaran Dalam Talian
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod('fpx')}
                  className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                    method === 'fpx'
                      ? 'border-[#0F4C5C] bg-[#0F4C5C]/5 text-[#0F4C5C]'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Landmark className="w-4 h-4 mb-1.5" />
                  <p className="text-xs font-semibold whitespace-nowrap">FPX Online</p>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('kad')}
                  className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                    method === 'kad'
                      ? 'border-[#0F4C5C] bg-[#0F4C5C]/5 text-[#0F4C5C]'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <CreditCard className="w-4 h-4 mb-1.5" />
                  <p className="text-xs font-semibold whitespace-nowrap">Kad Kredit/Debit</p>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('duitnow')}
                  className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                    method === 'duitnow'
                      ? 'border-[#0F4C5C] bg-[#0F4C5C]/5 text-[#0F4C5C]'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <QrCode className="w-4 h-4 mb-1.5" />
                  <p className="text-xs font-semibold whitespace-nowrap">DuitNow QR</p>
                </button>
              </div>
            </div>

            {/* Method-specific panels */}
            {method === 'fpx' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFpxType('b2c')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border cursor-pointer ${
                      fpxType === 'b2c'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    Perbankan Individu (B2C)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFpxType('b2b')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border cursor-pointer ${
                      fpxType === 'b2b'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    Perbankan Korporat (B2B)
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">
                    Pilih Bank Pilihan Anda
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {FPX_BANKS.map((bank) => {
                      const active = fpxBank === bank.name;
                      return (
                        <button
                          key={bank.id}
                          type="button"
                          onClick={() => setFpxBank(bank.name)}
                          className={`px-3 py-2.5 rounded-lg border text-xs font-medium text-left transition-colors cursor-pointer ${
                            active
                              ? 'border-[#0F4C5C] bg-[#0F4C5C]/5 text-[#0F4C5C]'
                              : 'border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {bank.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {method === 'kad' && (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="card-holder"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    Nama Pemegang Kad
                  </label>
                  <input
                    id="card-holder"
                    type="text"
                    placeholder="Seperti tertera pada kad"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="card-num"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    Nombor Kad (Visa / Mastercard)
                  </label>
                  <input
                    id="card-num"
                    type="text"
                    inputMode="numeric"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardInput(e.target.value))}
                    className="w-full px-3 py-2.5 text-sm font-mono tabular-nums border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="card-exp"
                      className="block text-xs font-medium text-slate-700 mb-1.5"
                    >
                      Tarikh Luput (MM/YY)
                    </label>
                    <input
                      id="card-exp"
                      type="text"
                      inputMode="numeric"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiryInput(e.target.value))}
                      className="w-full px-3 py-2.5 text-sm font-mono tabular-nums border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="card-cvv"
                      className="block text-xs font-medium text-slate-700 mb-1.5"
                    >
                      CVV / CVC
                    </label>
                    <input
                      id="card-cvv"
                      type="password"
                      maxLength={4}
                      inputMode="numeric"
                      value={cardCvv}
                      onChange={(e) =>
                        setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))
                      }
                      className="w-full px-3 py-2.5 text-sm font-mono tabular-nums border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C5C]"
                    />
                  </div>
                </div>
              </div>
            )}

            {method === 'duitnow' && (
              <div className="p-5 rounded-xl border border-slate-200 bg-[#F8F9FA] flex flex-col sm:flex-row items-center gap-6">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shrink-0">
                  <svg
                    width="128"
                    height="128"
                    viewBox="0 0 128 128"
                    aria-label="Kod QR DuitNow untuk pembayaran"
                    className="text-slate-900"
                  >
                    <rect width="128" height="128" fill="#ffffff" />
                    <rect x="10" y="10" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="6" />
                    <rect x="20" y="20" width="12" height="12" fill="currentColor" />
                    <rect x="86" y="10" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="6" />
                    <rect x="96" y="20" width="12" height="12" fill="currentColor" />
                    <rect x="10" y="86" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="6" />
                    <rect x="20" y="96" width="12" height="12" fill="currentColor" />
                    <rect x="52" y="14" width="8" height="8" fill="currentColor" />
                    <rect x="68" y="14" width="8" height="8" fill="currentColor" />
                    <rect x="52" y="30" width="16" height="8" fill="currentColor" />
                    <rect x="14" y="52" width="16" height="8" fill="currentColor" />
                    <rect x="38" y="52" width="12" height="12" fill="#0F4C5C" />
                    <rect x="58" y="52" width="16" height="16" fill="#0F4C5C" />
                    <rect x="82" y="52" width="12" height="8" fill="currentColor" />
                    <rect x="102" y="52" width="14" height="14" fill="currentColor" />
                    <rect x="14" y="68" width="8" height="10" fill="currentColor" />
                    <rect x="30" y="68" width="14" height="8" fill="currentColor" />
                    <rect x="52" y="76" width="10" height="10" fill="currentColor" />
                    <rect x="70" y="74" width="16" height="8" fill="currentColor" />
                    <rect x="94" y="74" width="16" height="12" fill="currentColor" />
                    <rect x="52" y="94" width="14" height="14" fill="currentColor" />
                    <rect x="74" y="94" width="12" height="8" fill="currentColor" />
                    <rect x="94" y="94" width="22" height="10" fill="currentColor" />
                    <rect x="74" y="108" width="20" height="10" fill="currentColor" />
                  </svg>
                </div>
                <div className="space-y-2 text-center sm:text-left">
                  <p className="text-sm font-bold text-slate-900">
                    Imbas Kod DuitNow QR
                  </p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Gunakan aplikasi perbankan mudah alih anda atau e-dompet (Touch ’n Go, GrabPay, MAE) dan klik butang pengesahan di bawah selepas imbasan selesai.
                  </p>
                  <p className="text-xs font-mono tabular-nums text-[#0F4C5C] font-medium">
                    Penerima: Dewan Pro Sdn. Bhd. · {formatRM(booking.totalAmount)}
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-[#0F4C5C] shrink-0" />
                <span>Transaksi disulitkan & resit dijana serta-merta</span>
              </div>
              <button
                type="submit"
                disabled={processing}
                className="px-6 py-3 text-sm font-medium text-white bg-[#0F4C5C] hover:bg-[#0B3B48] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {processing
                  ? 'Mengesahkan Pembayaran...'
                  : `Bayar ${formatRM(booking.totalAmount)} Sekarang`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

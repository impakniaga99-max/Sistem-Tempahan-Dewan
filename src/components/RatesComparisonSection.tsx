import { VENUES } from '../data/venues.ts';
import { formatRM } from '../utils/format.ts';

interface RatesComparisonSectionProps {
  onSelectVenueForBooking: (venueId: string) => void;
}

export function RatesComparisonSection({
  onSelectVenueForBooking,
}: RatesComparisonSectionProps) {
  return (
    <section
      id="panduan-kadar"
      className="py-14 lg:py-20 bg-[#F8F9FA] border-b border-slate-200 no-print"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <p className="text-sm font-medium text-[#0F4C5C] mb-2">
            03. Jadual Kadar & Kapasiti
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 [text-wrap:balance]">
            Perbandingan Ruang dan Kadar Sewaan Rasmi
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl">
            Kadar sewaan merangkumi akses penuh kelengkapan teknikal bilik, penyaman udara, dan sambungan internet berkelajuan tinggi.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-[#F8F9FA] text-xs font-semibold text-slate-600">
                  <th className="py-3.5 px-5">Nama Ruang</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4 text-right">Kapasiti Maksima</th>
                  <th className="py-3.5 px-4">Kelengkapan Teras</th>
                  <th className="py-3.5 px-4 text-right">Separuh Hari</th>
                  <th className="py-3.5 px-4 text-right">Sepenuh Hari</th>
                  <th className="py-3.5 px-5 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {VENUES.map((venue) => (
                  <tr
                    key={venue.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-4 px-5 font-semibold text-slate-900 whitespace-nowrap">
                      {venue.name}
                    </td>
                    <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                      {venue.categoryLabel}
                    </td>
                    <td className="py-4 px-4 text-right font-mono tabular-nums text-slate-900 whitespace-nowrap">
                      {venue.capacity} orang
                    </td>
                    <td className="py-4 px-4 text-slate-600 min-w-[240px]">
                      {venue.id === 'dewan-anggerik'
                        ? 'Sistem Audio Visual lengkap, LED 4K, 4 mikrofon, Wi-Fi 1Gbps'
                        : venue.id === 'bilik-mesyuarat'
                        ? 'Wi-Fi berkelajuan tinggi, skrin 75-inci, persidangan video'
                        : 'Projektor/Skrin HD, papan putih, Wi-Fi pantas, susunan latihan'}
                    </td>
                    <td className="py-4 px-4 text-right font-mono tabular-nums font-medium text-slate-900 whitespace-nowrap">
                      {formatRM(venue.halfDayRate)}
                    </td>
                    <td className="py-4 px-4 text-right font-mono tabular-nums font-semibold text-[#0F4C5C] whitespace-nowrap">
                      {formatRM(venue.fullDayRate)}
                    </td>
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onSelectVenueForBooking(venue.id)}
                        className="text-xs font-medium text-[#0F4C5C] hover:text-[#0B3B48] hover:underline underline-offset-4 cursor-pointer"
                      >
                        Pilih Ruang
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

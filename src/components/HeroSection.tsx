import { ArrowRight } from 'lucide-react';
import { VENUES } from '../data/venues.ts';
import { VenueImage } from './VenueImage.tsx';

interface HeroSectionProps {
  onSelectVenueAndScroll: (venueId: string) => void;
  onJumpToAvailability: () => void;
}

export function HeroSection({
  onSelectVenueAndScroll,
  onJumpToAvailability,
}: HeroSectionProps) {
  const featured = VENUES[0];

  return (
    <section id="atas" className="bg-white border-b border-slate-200 no-print">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-10 pb-12 lg:pt-14 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-between py-1">
            <div>
              <p className="text-sm font-medium text-[#0F4C5C] mb-3">
                Pusat Konvensyen & Latihan Korporat
              </p>
              <h1 className="text-[clamp(2.25rem,4vw,3.5rem)] font-bold tracking-tight text-slate-900 leading-[1.1] [text-wrap:balance] mb-5">
                Tempahan Dewan & Bilik Seminar dalam Satu Platform Teratur
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mb-8">
                Semak kekosongan tarikh secara masa nyata bagi Dewan Anggerik, Bilik Mesyuarat Eksekutif, dan dua Bilik Seminar, lengkap dengan bayaran dalam talian serta pengesahan resit segera.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={onJumpToAvailability}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-[#0F4C5C] hover:bg-[#0B3B48] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0F4C5C]"
                >
                  <span>Semak Kekosongan Tarikh</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="#ruang-dewan"
                  className="inline-flex items-center px-5 py-3 text-sm font-medium text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 bg-white rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Terokai 4 Ruang Kami
                </a>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-slate-200 grid grid-cols-3 gap-6">
              <div>
                <p className="text-2xl font-bold text-slate-900 tabular-nums font-mono">
                  280
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Jumlah Kapasiti Serentak
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 tabular-nums font-mono">
                  4
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dewan & Bilik Tersedia
                </p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 tabular-nums font-mono">
                  24/7
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Semakan & Bayaran Online
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 flex">
            <div className="w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative min-h-[280px] lg:min-h-[420px]">
              <VenueImage
                src={featured.imageUrl}
                alt="Dewan Anggerik berkapasiti 200 orang dengan sistem audio visual lengkap"
                title={featured.name}
                className="w-full h-full object-cover lg:absolute lg:inset-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <p className="text-xs text-slate-200 mb-1">
                  Ruang Utama · Kapasiti 200 Orang · Audio Visual Lengkap
                </p>
                <div className="flex items-end justify-between gap-4">
                  <p className="text-xl font-semibold tracking-tight">
                    Dewan Anggerik
                  </p>
                  <p className="text-sm font-mono tabular-nums text-slate-100 whitespace-nowrap">
                    Dari RM 1,450 / sesi
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {VENUES.map((venue, idx) => (
            <button
              key={venue.id}
              type="button"
              onClick={() => onSelectVenueAndScroll(venue.id)}
              className="text-left p-4 rounded-xl border border-slate-200 bg-[#F8F9FA] hover:bg-white hover:border-[#0F4C5C]/40 transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C]"
            >
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1.5">
                <span className="font-mono tabular-nums">0{idx + 1}</span>
                <span>{venue.categoryLabel}</span>
              </div>
              <p className="text-base font-semibold text-slate-900 group-hover:text-[#0F4C5C] transition-colors">
                {venue.name}
              </p>
              <p className="text-xs text-slate-600 mt-1 tabular-nums">
                Maksima {venue.capacity} orang · Dari RM {venue.halfDayRate.toLocaleString('en-MY')}
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

import { useState } from 'react';
import { ArrowUpRight, Check } from 'lucide-react';
import { VENUES } from '../data/venues.ts';
import type { VenueCategory } from '../types.ts';
import { formatRM } from '../utils/format.ts';
import { VenueImage } from './VenueImage.tsx';

interface VenueShowcaseProps {
  selectedVenueId: string;
  onSelectVenueForBooking: (venueId: string) => void;
}

type FilterOption = 'semua' | VenueCategory;

export function VenueShowcase({
  selectedVenueId,
  onSelectVenueForBooking,
}: VenueShowcaseProps) {
  const [filter, setFilter] = useState<FilterOption>('semua');

  const filteredVenues =
    filter === 'semua' ? VENUES : VENUES.filter((v) => v.category === filter);

  const filterTabs: { id: FilterOption; label: string }[] = [
    { id: 'semua', label: 'Semua Ruang (4)' },
    { id: 'dewan', label: 'Dewan Utama (1)' },
    { id: 'mesyuarat', label: 'Bilik Mesyuarat (1)' },
    { id: 'seminar', label: 'Bilik Seminar (2)' },
  ];

  return (
    <section id="ruang-dewan" className="py-14 lg:py-20 bg-[#F8F9FA]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-sm font-medium text-[#0F4C5C] mb-2">
              01. Pilihan Ruang & Kemudahan
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 [text-wrap:balance]">
              Spesifikasi Lengkap Setiap Dewan dan Bilik
            </h2>
            <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl">
              Setiap ruang dilengkapi infrastruktur moden mengikut skala program anda, daripada mesyuarat eksekutif sehingga konvensyen 200 peserta.
            </p>
          </div>

          <div
            className="inline-flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-lg overflow-x-auto max-w-full"
            role="tablist"
            aria-label="Tapis kategori ruang"
          >
            {filterTabs.map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#0F4C5C] text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredVenues.map((venue) => {
            const isFeatured = filter === 'semua' && venue.id === 'dewan-anggerik';
            const isSelected = selectedVenueId === venue.id;

            return (
              <article
                key={venue.id}
                className={`bg-white rounded-xl border transition-colors overflow-hidden flex flex-col ${
                  isSelected
                    ? 'border-[#0F4C5C] ring-1 ring-[#0F4C5C]/20'
                    : 'border-slate-200'
                } ${isFeatured ? 'lg:col-span-2 lg:grid lg:grid-cols-12' : ''}`}
              >
                <div
                  className={`relative bg-slate-100 overflow-hidden ${
                    isFeatured
                      ? 'lg:col-span-6 min-h-[260px] lg:min-h-full'
                      : 'aspect-[4/3]'
                  }`}
                >
                  <VenueImage
                    src={venue.imageUrl}
                    alt={`${venue.name} - ${venue.categoryLabel} kapasiti ${venue.capacity} orang`}
                    title={venue.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div
                  className={`p-6 sm:p-8 flex flex-col justify-between ${
                    isFeatured ? 'lg:col-span-6' : 'flex-1'
                  }`}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2">
                      <span className="font-medium text-[#0F4C5C]">
                        {venue.categoryLabel}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        Maksima {venue.capacity} Orang
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{venue.areaSqm} m²</span>
                      <span aria-hidden="true">·</span>
                      <span>{venue.floor}</span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      {venue.name}
                    </h3>

                    <p className="text-sm text-slate-600 leading-relaxed mt-2">
                      {venue.description}
                    </p>

                    <div className="mt-5 pt-5 border-t border-slate-100">
                      <p className="text-xs font-semibold text-slate-900 mb-3">
                        Kelengkapan & Ciri Utama
                      </p>
                      <ul className="space-y-2">
                        {venue.amenities.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-2.5 text-sm text-slate-600"
                          >
                            <Check className="w-4 h-4 text-[#0F4C5C] shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <p className="text-xs text-slate-500 mt-4">
                      Susunan tersedia: {venue.layouts.join(' · ')}
                    </p>
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-baseline gap-4">
                      <div>
                        <p className="text-xs text-slate-500">Separuh Hari</p>
                        <p className="text-base font-bold text-slate-900 font-mono tabular-nums">
                          {formatRM(venue.halfDayRate)}
                        </p>
                      </div>
                      <div className="h-7 w-px bg-slate-200" aria-hidden="true" />
                      <div>
                        <p className="text-xs text-slate-500">Sepenuh Hari</p>
                        <p className="text-base font-bold text-slate-900 font-mono tabular-nums">
                          {formatRM(venue.fullDayRate)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectVenueForBooking(venue.id)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white bg-[#0F4C5C] hover:bg-[#0B3B48] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0F4C5C]"
                    >
                      <span>Semak Tarikh & Tempah</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

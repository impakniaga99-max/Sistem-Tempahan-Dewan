import { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface HeaderProps {
  activePage: 'public' | 'admin';
  onStartBooking: () => void;
  onNavigateSection: (sectionId: string) => void;
  onOpenAdmin: () => void;
}

export function Header({
  activePage,
  onStartBooking,
  onNavigateSection,
  onOpenAdmin,
}: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleNavClick(sectionId: string) {
    setMobileOpen(false);
    onNavigateSection(sectionId);
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 no-print">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        <a
          href="#atas"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('atas');
          }}
          className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0F4C5C] rounded"
        >
          Sistem Tempahan Dewan Pro
        </a>

        <nav
          className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600"
          aria-label="Navigasi Utama"
        >
          <a
            href="#ruang-dewan"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('ruang-dewan');
            }}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Ruang
          </a>
          <a
            href="#semak-kekosongan"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('semak-kekosongan');
            }}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Kekosongan
          </a>
          <a
            href="#status-tempahan"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('status-tempahan');
            }}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Status
          </a>
          <a
            href="#lokasi-arah"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('lokasi-arah');
            }}
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Lokasi
          </a>
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              onOpenAdmin();
            }}
            className={`hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activePage === 'admin' ? 'text-[#0F4C5C] font-semibold underline' : ''
            }`}
          >
            Admin
          </button>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              onStartBooking();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-[#0F4C5C] hover:bg-[#0B3B48] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0F4C5C]"
          >
            Tempah Sekarang
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="lg:hidden p-2 text-slate-700 hover:text-slate-900 rounded-lg border border-slate-200 min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 flex flex-col gap-1"
          aria-label="Navigasi Mudah Alih"
        >
          <button
            type="button"
            onClick={() => handleNavClick('ruang-dewan')}
            className="text-left py-2.5 px-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-md hover:bg-slate-50"
          >
            Ruang & Dewan
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('semak-kekosongan')}
            className="text-left py-2.5 px-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-md hover:bg-slate-50"
          >
            Semak Kekosongan
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('status-tempahan')}
            className="text-left py-2.5 px-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-md hover:bg-slate-50"
          >
            Status Tempahan
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('lokasi-arah')}
            className="text-left py-2.5 px-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-md hover:bg-slate-50"
          >
            Lokasi & Arah
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileOpen(false);
              onOpenAdmin();
            }}
            className="text-left py-2.5 px-2 text-sm font-semibold text-[#0F4C5C] rounded-md hover:bg-slate-50"
          >
            Panel Admin
          </button>
        </nav>
      )}
    </header>
  );
}

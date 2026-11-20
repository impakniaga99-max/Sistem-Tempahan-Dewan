interface FooterProps {
  onOpenAdmin: () => void;
  onNavigateSection: (sectionId: string) => void;
}

export function Footer({ onOpenAdmin, onNavigateSection }: FooterProps) {
  return (
    <footer className="bg-white border-t border-slate-200 py-10 no-print">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <p className="text-sm font-bold text-slate-900">
            Sistem Tempahan Dewan Pro
          </p>
          <p className="text-xs text-slate-500 mt-1">
            NO. 27-1, Jalan 7/7C, Seksyen 7, 43650, Bandar Baru Bangi, Selangor
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600">
          <button
            type="button"
            onClick={() => onNavigateSection('ruang-dewan')}
            className="hover:text-slate-900 cursor-pointer"
          >
            Ruang & Dewan
          </button>
          <button
            type="button"
            onClick={() => onNavigateSection('semak-kekosongan')}
            className="hover:text-slate-900 cursor-pointer"
          >
            Semak Kekosongan
          </button>
          <button
            type="button"
            onClick={() => onNavigateSection('lokasi-arah')}
            className="hover:text-slate-900 cursor-pointer"
          >
            Lokasi & Arah
          </button>
          <button
            type="button"
            onClick={onOpenAdmin}
            className="font-medium text-[#0F4C5C] hover:underline underline-offset-4 cursor-pointer"
          >
            Panel Admin
          </button>
        </div>
      </div>
    </footer>
  );
}

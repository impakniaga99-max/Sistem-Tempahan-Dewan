import { useEffect, useState } from 'react';
import { AdminPage } from './components/AdminPage.tsx';
import { AvailabilityBookingSection } from './components/AvailabilityBookingSection.tsx';
import { BookingLookupSection } from './components/BookingLookupSection.tsx';
import { Footer } from './components/Footer.tsx';
import { Header } from './components/Header.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { LocationDirectionsSection } from './components/LocationDirectionsSection.tsx';
import { PaymentModal } from './components/PaymentModal.tsx';
import { RatesComparisonSection } from './components/RatesComparisonSection.tsx';
import { VenueShowcase } from './components/VenueShowcase.tsx';
import { VENUES } from './data/venues.ts';
import type { BookingRecord } from './types.ts';

export default function App() {
  const [activePage, setActivePage] = useState<'public' | 'admin'>(() =>
    window.location.hash === '#/admin' ? 'admin' : 'public'
  );
  const [selectedVenueId, setSelectedVenueId] = useState<string>(VENUES[0].id);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [activeBookingModal, setActiveBookingModal] =
    useState<BookingRecord | null>(null);
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);

  useEffect(() => {
    const onQuota = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuota);
    const onHashChange = () => {
      setActivePage(window.location.hash === '#/admin' ? 'admin' : 'public');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', onQuota);
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  function navigateToSection(sectionId: string, venueId?: string) {
    if (venueId) {
      setSelectedVenueId(venueId);
    }
    if (activePage !== 'public') {
      window.location.hash = '';
      setActivePage('public');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
      return;
    }
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function openAdminPage() {
    window.location.hash = '#/admin';
    setActivePage('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function backToPublic() {
    window.location.hash = '';
    setActivePage('public');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleBookingCreated(booking: BookingRecord) {
    setRefreshTrigger((prev) => prev + 1);
    setActiveBookingModal(booking);
  }

  function handlePaymentSuccess(updated: BookingRecord) {
    setRefreshTrigger((prev) => prev + 1);
    setActiveBookingModal(updated);
  }

  function handleDataMutated() {
    setRefreshTrigger((prev) => prev + 1);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-slate-900">
      {mapsQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm no-print">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      <Header
        activePage={activePage}
        onStartBooking={() => navigateToSection('semak-kekosongan')}
        onNavigateSection={(sec) => navigateToSection(sec)}
        onOpenAdmin={openAdminPage}
      />

      <main className="flex-1">
        {activePage === 'admin' ? (
          <AdminPage
            onBackToPublic={backToPublic}
            onOpenReceipt={(booking) => setActiveBookingModal(booking)}
            onDataMutated={handleDataMutated}
          />
        ) : (
          <>
            <HeroSection
              onSelectVenueAndScroll={(id) =>
                navigateToSection('semak-kekosongan', id)
              }
              onJumpToAvailability={() => navigateToSection('semak-kekosongan')}
            />

            <VenueShowcase
              selectedVenueId={selectedVenueId}
              onSelectVenueForBooking={(id) =>
                navigateToSection('semak-kekosongan', id)
              }
            />

            <AvailabilityBookingSection
              selectedVenueId={selectedVenueId}
              onSelectVenueId={setSelectedVenueId}
              refreshTrigger={refreshTrigger}
              onBookingCreated={handleBookingCreated}
            />

            <RatesComparisonSection
              onSelectVenueForBooking={(id) =>
                navigateToSection('semak-kekosongan', id)
              }
            />

            <BookingLookupSection
              refreshTrigger={refreshTrigger}
              onOpenPaymentOrReceipt={(booking) => setActiveBookingModal(booking)}
              onBookingCancelled={handleDataMutated}
            />

            <LocationDirectionsSection />
          </>
        )}
      </main>

      <Footer
        onOpenAdmin={openAdminPage}
        onNavigateSection={(sec) => navigateToSection(sec)}
      />

      <PaymentModal
        booking={activeBookingModal}
        onClose={() => setActiveBookingModal(null)}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}

export type VenueCategory = 'dewan' | 'mesyuarat' | 'seminar';

export type TimeSlotId = 'pagi' | 'petang' | 'sepenuh-hari';

export type BookingStatus =
  | 'Menunggu Pembayaran'
  | 'Disahkan & Dibayar'
  | 'Dibatalkan';

export type PaymentMethodId = 'fpx' | 'kad' | 'duitnow';

export interface Venue {
  id: string;
  name: string;
  shortLabel: string;
  category: VenueCategory;
  categoryLabel: string;
  capacity: number;
  areaSqm: number;
  floor: string;
  headline: string;
  description: string;
  halfDayRate: number;
  fullDayRate: number;
  imageUrl: string;
  layouts: string[];
  amenities: string[];
}

export interface AddonItem {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: 'per_orang' | 'per_hari';
}

export interface BookingAddonSelection {
  addonId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface BookingRecord {
  id: string;
  referenceCode: string;
  venueId: string;
  venueName: string;
  date: string; // YYYY-MM-DD
  slot: TimeSlotId;
  slotLabel: string;
  attendees: number;
  layout: string;
  customerName: string;
  organization: string;
  email: string;
  phone: string;
  eventTitle: string;
  notes?: string;
  addons: BookingAddonSelection[];
  baseAmount: number;
  addonsAmount: number;
  sstAmount: number;
  totalAmount: number;
  status: BookingStatus;
  paymentMethod?: PaymentMethodId;
  paymentBank?: string;
  transactionId?: string;
  paidAt?: string;
  createdAt: string;
}

export interface DayAvailability {
  date: string;
  bookedSlots: TimeSlotId[];
  status: 'tersedia' | 'terhad' | 'penuh';
}

export interface VenueAnalyticsItem {
  venueId: string;
  venueName: string;
  capacity: number;
  bookingsCount: number;
  confirmedCount: number;
  totalAttendees: number;
  revenue: number;
  sharePercent: number;
}

export interface PaymentMethodAnalytics {
  method: PaymentMethodId;
  label: string;
  count: number;
  amount: number;
}

export interface AdminOverviewResponse {
  kpis: {
    confirmedRevenue: number;
    pendingRevenue: number;
    totalBookings: number;
    confirmedCount: number;
    pendingCount: number;
    cancelledCount: number;
    totalParticipants: number;
    avgBookingValue: number;
  };
  venueBreakdown: VenueAnalyticsItem[];
  paymentBreakdown: PaymentMethodAnalytics[];
  slotBreakdown: {
    slot: TimeSlotId;
    label: string;
    count: number;
    revenue: number;
  }[];
  bookings: BookingRecord[];
}


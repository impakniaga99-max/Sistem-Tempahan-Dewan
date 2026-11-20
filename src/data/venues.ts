import type { AddonItem, TimeSlotId, Venue } from '../types.ts';

export const VENUES: Venue[] = [
  {
    id: 'dewan-anggerik',
    name: 'Dewan Anggerik',
    shortLabel: 'Dewan Utama · 200 Pax',
    category: 'dewan',
    categoryLabel: 'Dewan Utama',
    capacity: 200,
    areaSqm: 420,
    floor: 'Aras 1, Sayap Utama',
    headline: 'Dewan utama berkapasiti tinggi dengan sistem audio visual lengkap.',
    description:
      'Direka khusus untuk persidangan korporat, seminar kebangsaan, majlis perasmian, dan konvensyen sehingga 200 peserta serentak dengan akustik profesional dan sokongan pentas penuh.',
    halfDayRate: 1450,
    fullDayRate: 2400,
    imageUrl: '/src/assets/images/dewan_anggerik_1795137055206.jpg',
    layouts: ['Teater (200 org)', 'Bankuet (140 org)', 'Bilik Darjah (120 org)'],
    amenities: [
      'Kelengkapan audio visual lengkap & sistem PA 8-pembesar suara',
      'Skrin LED 4K lebar 5 meter & projektor laser',
      '4 mikrofon tanpa wayar & podium eksekutif',
      'Pencahayaan pentas boleh laras & bilik kawalan AV',
      'Akses Wi-Fi gentian optik berkelajuan tinggi 1Gbps',
    ],
  },
  {
    id: 'bilik-mesyuarat',
    name: 'Bilik Mesyuarat Eksekutif',
    shortLabel: 'Mesyuarat · 20 Pax',
    category: 'mesyuarat',
    categoryLabel: 'Bilik Mesyuarat',
    capacity: 20,
    areaSqm: 68,
    floor: 'Aras 2, Blok Eksekutif',
    headline: 'Ruang mesyuarat lembaga pengarah dengan sambungan Wi-Fi berkelajuan tinggi.',
    description:
      'Suasana tenang dan eksklusif untuk mesyuarat pengurusan, pembentangan pelabur, dan perbincangan hibrid bersama pasukan jarak jauh sehingga 20 orang.',
    halfDayRate: 380,
    fullDayRate: 650,
    imageUrl: '/src/assets/images/bilik_mesyuarat_1795137054160.jpg',
    layouts: ['Meja Lembaga / Boardroom (20 org)'],
    amenities: [
      'Akses Wi-Fi berkelajuan tinggi khusus 1Gbps (dedicated VLAN)',
      'Skrin pintar 75-inci 4K & sambungan HDMI/USB-C tanpa wayar',
      'Bar kamera & mikrofon persidangan video HD',
      'Meja eksekutif kayu walnut dengan soket kuasa terbina',
      'Papan putih kaca magnetik & kelengkapan alat tulis',
    ],
  },
  {
    id: 'bilik-seminar-1',
    name: 'Bilik Seminar 1',
    shortLabel: 'Seminar · 30 Pax',
    category: 'seminar',
    categoryLabel: 'Bilik Seminar',
    capacity: 30,
    areaSqm: 85,
    floor: 'Aras 2, Sayap Timur',
    headline: 'Bilik latihan berstruktur untuk bengkel profesional dan kelas intensif.',
    description:
      'Susunan meja latihan yang kemas dengan pencahayaan semula jadi, direka untuk sesi latihan kakitangan, kursus pensijilan, dan taklimat berfokus sehingga 30 peserta.',
    halfDayRate: 520,
    fullDayRate: 880,
    imageUrl: '/src/assets/images/bilik_seminar_1_1795137054445.jpg',
    layouts: ['Bilik Darjah (30 org)', 'Bentuk-U / U-Shape (22 org)', 'Teater (30 org)'],
    amenities: [
      'Projektor HD siling & skrin paparan bermotor',
      'Papan putih kaca berkembar & penanda papan putih',
      'Sistem audio bilik dengan 2 mikrofon tanpa wayar',
      'Meja latihan modular & kerusi ergonomik',
      'Akses Wi-Fi berkelajuan tinggi untuk semua peserta',
    ],
  },
  {
    id: 'bilik-seminar-2',
    name: 'Bilik Seminar 2',
    shortLabel: 'Seminar · 30 Pax',
    category: 'seminar',
    categoryLabel: 'Bilik Seminar',
    capacity: 30,
    areaSqm: 85,
    floor: 'Aras 2, Sayap Barat',
    headline: 'Bilik perbincangan berkumpulan dengan susunan kluster kolaboratif.',
    description:
      'Sesuai untuk bengkel sumbang saran, perbincangan kumpulan kerja, dan sesi fasilitasi interaktif sehingga 30 orang dalam susunan meja bulat kluster.',
    halfDayRate: 520,
    fullDayRate: 880,
    imageUrl: '/src/assets/images/bilik_seminar_2_1795137054887.jpg',
    layouts: ['Kluster Berkumpulan (30 org)', 'Bengkel / Workshop (28 org)', 'Bentuk-U (22 org)'],
    amenities: [
      'Dwi-skrin paparan 65-inci untuk penglihatan jelas setiap meja',
      '5 set meja kluster perbincangan berkumpulan',
      'Papan selak (flipchart) dan papan putih mudah alih',
      'Sistem audio bilik & soket kuasa di setiap zon meja',
      'Akses Wi-Fi berkelajuan tinggi 1Gbps',
    ],
  },
];

export const TIME_SLOTS: {
  id: TimeSlotId;
  label: string;
  timeRange: string;
  rateType: 'half' | 'full';
  description: string;
}[] = [
  {
    id: 'pagi',
    label: 'Sesi Pagi (Separuh Hari)',
    timeRange: '08:00 – 13:00',
    rateType: 'half',
    description: 'Tempoh 5 jam termasuk 30 minit persediaan awal.',
  },
  {
    id: 'petang',
    label: 'Sesi Petang (Separuh Hari)',
    timeRange: '14:00 – 19:00',
    rateType: 'half',
    description: 'Tempoh 5 jam termasuk 30 minit persediaan awal.',
  },
  {
    id: 'sepenuh-hari',
    label: 'Sepenuh Hari',
    timeRange: '08:00 – 18:00',
    rateType: 'full',
    description: 'Tempoh 10 jam penuh dengan kadar penjimatan harian.',
  },
];

export const ADDONS: AddonItem[] = [
  {
    id: 'jamuan-ringan',
    name: 'Jamuan Ringan (Minum Pagi / Petang)',
    description: 'Kopi, teh tarik, 3 jenis kuih/pastri dan air mineral.',
    price: 18,
    unit: 'per_orang',
  },
  {
    id: 'makan-tengah-hari',
    name: 'Bufet Makan Tengah Hari Korporat',
    description: 'Hidangan lengkap menu Melayu/antarabangsa, buah & minuman.',
    price: 35,
    unit: 'per_orang',
  },
  {
    id: 'juruteknik-av',
    name: 'Juruteknik Audio Visual Dedikasi',
    description: 'Pegawai teknikal bertugas sepanjang majlis berlangsung.',
    price: 250,
    unit: 'per_hari',
  },
  {
    id: 'rakaman-live',
    name: 'Set Rakaman Video & Penstriman Langsung',
    description: 'Kamera HD bersama sambungan siaran langsung (Zoom/YouTube).',
    price: 450,
    unit: 'per_hari',
  },
];

export const FPX_BANKS: { id: string; name: string }[] = [
  { id: 'maybank2u', name: 'Maybank2u' },
  { id: 'cimb', name: 'CIMB Clicks' },
  { id: 'publicbank', name: 'Public Bank (PBe)' },
  { id: 'rhb', name: 'RHB Now' },
  { id: 'bankislam', name: 'Bank Islam' },
  { id: 'ambank', name: 'AmOnline' },
];

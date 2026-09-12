import type { CelestialType } from "@/types/celestial";

type Entry = { label: string; note: string };


const BY_KIND = {
  sun: {
    sun: {
      label: "Matahari",
      note: "Sumber cahaya tunggal di halaman ini. Terbenamnya bukan sekadar pergantian suasana — itu saat instrumen mulai bekerja, karena langit gelap yang membuat objek lain bisa dipisahkan dari latar.",
    },
  },
  moon: {
    moon: {
      label: "Bulan",
      note: "Karena tidak punya atmosfer, batas antara sisi terang dan gelap di permukaannya tajam dan bisa ditelusuri tanpa alat bantu. Bentuk sabitnya murni soal sudut datang cahaya, bukan bayangan Bumi.",
    },
  },
  planet: {
    mercury: {
      label: "Merkurius",
      note: "Selalu menempel dekat Matahari. Jendela pengamatannya cuma beberapa puluh menit sebelum fajar atau sesudah senja, dan selama itu pun ia masih berkelahi dengan cahaya senja.",
    },
    venus: {
      label: "Venus",
      note: "Tertutup awan asam sulfat yang memantulkan hampir seluruh cahaya yang diterimanya, sehingga cukup terang untuk terlihat saat langit belum benar-benar gelap. Orbitnya di dalam orbit Bumi, jadi ia tidak pernah muncul di tengah malam.",
    },
    mars: {
      label: "Mars",
      note: "Warna merahnya berasal dari debu besi oksida yang menutupi seluruh permukaan. Setiap dua tahun sekali ia berada pada jarak terdekatnya dan berubah jadi salah satu titik paling menyala di langit.",
    },
    jupiter: {
      label: "Jupiter",
      note: "Massa paling besar di tata surya, dengan pita atmosfer yang bergerak berlawanan arah dan badai raksasa yang sudah berputar lebih lama daripada teleskop pertama. Terangnya cukup untuk dibedakan dari bintang tanpa alat.",
    },
    saturn: {
      label: "Saturnus",
      note: "Cincinnya tersusun dari bongkahan es dan batuan dengan lebar ratusan ribu kilometer tapi tebal hanya puluhan meter. Bentuknya baru terbuka lewat teleskop.",
    },
    uranus: {
      label: "Uranus",
      note: "Porosnya rebah hampir sejajar bidang orbitnya, jadi kutubnya bergantian menghadap Matahari selama puluhan tahun — satu musim di sana lebih panjang daripada satu generasi pengamat. Terlalu redup untuk mata telanjang.",
    },
    neptune: {
      label: "Neptunus",
      note: "Ditemukan lewat perhitungan sebelum benar-benar terlihat: posisinya ditebak dari gangguan gravitasi pada orbit Uranus. Dari Semarang ia hanya titik biru samar di batas kemampuan optik.",
    },
    pluto: {
      label: "Pluto",
      note: "Sudah dicoret dari daftar planet, tapi orbitnya tetap dihitung di sini. Terlalu kecil dan terlalu jauh untuk menunjukkan bentuk apa pun tanpa teleskop besar.",
    },
  },
  star: {
    sirius: {
      label: "Sirius",
      note: "Paling terang di langit malam. Saat posisinya masih rendah, cahayanya terpecah jadi kilau warna-warni karena harus melewati atmosfer paling tebal.",
    },
    canopus: {
      label: "Canopus",
      note: "Bintang paling terang di langit selatan — pengamat di Eropa tidak pernah bisa melihatnya. Dari sini ia melintas cukup tinggi untuk dipotret dengan kamera sederhana.",
    },
    arcturus: {
      label: "Arcturus",
      note: "Warna jingganya menandakan permukaan yang jauh lebih dingin daripada Matahari meski ukurannya raksasa. Bintang tua yang sedang melintas cepat, sisa dari gugus yang sudah lama bubar.",
    },
    vega: {
      label: "Vega",
      note: "Sempat dipakai sebagai titik acuan magnitudo nol dalam fotometri, jadi terangnya sering jadi pembanding baku. Berputar sangat cepat sampai bentuknya lonjong.",
    },
    capella: {
      label: "Capella",
      note: "Yang tampak sebagai satu bintang sebetulnya dua pasang bintang raksasa yang saling mengorbit — sistem empat bintang, sesuatu yang baru terungkap lewat spektroskopi.",
    },
    rigel: {
      label: "Rigel",
      note: "Biru dan sangat panas. Sinar yang kita lihat hari ini meninggalkannya jauh sebelum manusia mengenal tulisan.",
    },
    procyon: {
      label: "Procyon",
      note: "Namanya dari bahasa Yunani untuk 'sebelum anjing': ia terbit lebih dulu daripada Sirius di langit timur, seperti pengumuman kedatangan sang pemburu.",
    },
    betelgeuse: {
      label: "Betelgeuse",
      note: "Raksasa merah di ambang akhir hidupnya. Suatu saat ia akan meledak, dan untuk beberapa minggu akan seterang bulan sabit. Kapan persisnya masih jadi perdebatan.",
    },
    altair: {
      label: "Altair",
      note: "Berputar begitu cepat sampai bentuknya tertekan jadi lonjong, berbeda dari hampir semua bintang lain yang bisa diamati.",
    },
    aldebaran: {
      label: "Aldebaran",
      note: "Mata lembu di rasi Taurus. Warnanya jingga tua yang mudah dikenali, dan sering jadi contoh pertama bintang kelas K bagi pengamat pemula.",
    },
    spica: {
      label: "Spica",
      note: "Dua bintang biru yang mengorbit begitu rapat sampai hampir bersentuhan. Di beberapa tradisi agraris, kemunculannya dipakai sebagai penanda musim panen.",
    },
    antares: {
      label: "Antares",
      note: "Namanya berarti 'saingan Mars', karena warnanya hampir tidak bisa dibedakan dari planet merah itu saat keduanya kebetulan berdekatan.",
    },
    polaris: {
      label: "Polaris",
      note: "Penunjuk utara bagi belahan Bumi utara. Dari lintang Semarang ia tidak pernah naik di atas horizon — bintang ini secara harfiah tidak ada di langit sini.",
    },
    deneb: {
      label: "Deneb",
      note: "Salah satu bintang paling jauh yang bisa dilihat mata telanjang. Jaraknya ribuan kali lebih besar daripada Sirius, dan satu-satunya alasan ia masih terlihat adalah karena ukurannya.",
    },
    fomalhaut: {
      label: "Fomalhaut",
      note: "Dikelilingi piringan debu yang sudah difoto langsung, salah satu bukti paling jelas bahwa pembentukan planet masih berlangsung sampai sekarang.",
    },
    regulus: {
      label: "Regulus",
      note: "Letaknya hampir tepat di jalur ekliptika, jadi sesekali tertutup Bulan atau planet lain — peristiwa yang bisa diprediksi bertahun-tahun sebelumnya sampai ke detiknya.",
    },
  },
  satellite: {
    iss: {
      label: "ISS",
      note: "Melintas hanya beberapa menit dari horizon ke horizon. Cahayanya adalah pantulan Matahari dari panel surya, bukan lampu di stasiun — karena itu ia menghilang begitu masuk bayangan Bumi.",
    },
  },
} as const satisfies Record<CelestialType, Record<string, Entry>>;


export type ObjectKey = {
  [K in CelestialType]: keyof (typeof BY_KIND)[K];
}[CelestialType];

export type ObjectContent = Entry & { kind: CelestialType };

const KIND_BY_KEY = new Map<string, CelestialType>(
  Object.entries(BY_KIND).flatMap(([kind, entries]) =>
    Object.keys(entries).map((key) => [key, kind as CelestialType] as const),
  ),
);

const ALIASES = new Map<string, string>([
  ["25544", "iss"],
  ["zarya", "iss"],
]);

export function kindOf(id: unknown): CelestialType | null {
  return typeof id === "string"
    ? (KIND_BY_KEY.get(
        ALIASES.get(id.trim().toLowerCase()) ?? id.trim().toLowerCase(),
      ) ?? null)
    : null;
}

export function contentOf(id: unknown): ObjectContent | null {
  const kind = kindOf(id);
  if (kind === null || typeof id !== "string") return null;

  const key = ALIASES.get(id.trim().toLowerCase()) ?? id.trim().toLowerCase();
  const entry = (BY_KIND[kind] as Record<string, Entry>)[key];

  return entry === undefined ? null : { kind, ...entry };
}

export function labelOf(id: unknown, fallback: string): string {
  return contentOf(id)?.label ?? fallback;
}

export function keysOfKinds(...kinds: readonly CelestialType[]): string[] {
  return kinds
    .flatMap((kind) => Object.keys(BY_KIND[kind]))
    .sort((left, right) => left.localeCompare(right));
}

export const FEATURED = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "iss",
] as const satisfies readonly ObjectKey[];

// Polaris sengaja di luar: dari lintang Semarang ia tidak pernah terbit.
export const PILOT_STARS = [
  "sirius",
  "vega",
  "betelgeuse",
  "arcturus",
  "capella",
  "altair",
] as const satisfies readonly ObjectKey[];
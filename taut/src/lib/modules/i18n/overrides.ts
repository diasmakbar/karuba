import type { Language } from "../../i18n";

/**
 * Runtime translation overlay for module-generated text.
 *
 * Module definitions build their manual tables, titles, notes and rule sentences from English
 * source strings (e.g. `"Wire colors (Info 1)"`). Rather than rewrite every module, we key a
 * translation map by that exact English source string and post-process the output of
 * `runInfo` / `runStatus` / `localizeModuleName` at the UI boundary.
 *
 * To add a string: paste the exact English text as the key and the translation as the value.
 * To add a language: add a new key to `MODULE_TEXT` and `LOCALE_OVERRIDES`.
 *
 * Strings with runtime values (e.g. `"Wire 3"`, `"Cutting manual — 5 wires (Info 2)"`) are handled
 * by `PATTERN_OVERRIDES`, which match on a regex and rewrite the captured parts.
 */
export const MODULE_TEXT: Partial<Record<Language, Record<string, string>>> = {
  id: {
    // Module names
    "Wire": "Kabel",
    "Invisible Maze": "Labirin Tak Terlihat",
    "Big Button": "Tombol Besar",
    "Sequence Protocol": "Protokol Urutan",
    "Chemistry": "Kimia",
    "Power Grid": "Jaringan Daya",
    "Equalizer": "Ekualiser",
    "Storm Radar": "Radar Badai",
    "Synthesizer": "Sintesis",
    "Pressure Valves": "Katup Tekanan",
    "Intercom": "Interkom",
    "Battleship": "Kapal Perang",
    "Shape Sorter": "Penyortir Bentuk",
    "Pneumatic Tube": "Tabung Pneumatik",
    "Biometric Scanner": "Pemindai Biometrik",

    // MOD_01 Wire  ("Wire" itself is already mapped above as the module name.)
    "Wire colors (Info 1)": "Warna kabel (Info 1)",
    "Color": "Warna",
    "Cutting manual — {count} wires (Info 2)": "Panduan potong — {count} kabel (Info 2)",
    "#": "#",
    "Rule": "Aturan",

    // MOD_02 Invisible maze
    "Architecture map: {maze} (Info 1)": "Peta arsitektur: {maze} (Info 1)",
    "Hidden walls": "Dinding tersembunyi",
    "D-pad rotation (Info 2)": "Rotasi tombol arah (Info 2)",
    "Serial number ends in": "Nomor seri berakhiran",
    "Effect on the D-pad": "Efek pada tombol arah",
    "EVEN digit": "Digit GENAP",
    "ODD digit": "Digit GANJIL",

    // MOD_04 Sequence protocol
    "Stage 1 (Info 1)": "Tahap 1 (Info 1)",
    "Stage 2 (Info 1)": "Tahap 2 (Info 1)",
    "Stage 3 (Info 2)": "Tahap 3 (Info 2)",
    "Stage 4 (Info 2)": "Tahap 4 (Info 2)",
    "Display": "Tampilan",
    "Press": "Tekan",

    // MOD_05 Chemistry
    "Antidote chart (Info 1)": "Tabel antidot (Info 1)",
    "Hazard symbol": "Simbol bahaya",
    "Required antidote": "Antidot yang dibutuhkan",
    "Vial contents (Info 2)": "Isi vial (Info 2)",
    "Shape on the button": "Bentuk pada tombol",
    "Liquid inside": "Cairan di dalam",

    // MOD_06 Power grid
    "Required switch pattern (Info 1)": "Pola sakelar yang dibutuhkan (Info 1)",
    "Inversion protocol (Info 2)": "Protokol pembalikan (Info 2)",
    "Warning light": "Lampu peringatan",
    "Invert these positions of the Info 1 pattern": "Balik posisi ini dari pola Info 1",

    // MOD_07 Equalizer
    "Target output profile (Info 1)": "Profil keluaran target (Info 1)",
    "Hardware revision bugs (Info 2)": "Bug revisi perangkat (Info 2)",
    "Revision": "Revisi",
    "Known fault": "Kerusakan diketahui",

    // MOD_08 Radar
    "Epicenter chart (Info 1)": "Tabel episentrum (Info 1)",
    "Constellation on screen": "Konstelasi di layar",
    "Epicenter": "Episentrum",
    "Drift pattern (Info 2)": "Pola pergeseran (Info 2)",
    "Wind arrow": "Panah angin",
    "Drift from the epicenter": "Pergeseran dari episentrum",

    // MOD_09 Synthesizer
    "Culture requirements (Info 1)": "Kebutuhan kultur (Info 1)",
    "Target type": "Jenis target",
    "Needs": "Butuh",
    "Inventory contents (Info 2)": "Isi inventaris (Info 2)",
    "Vial": "Vial",
    "Contents": "Isi",

    // MOD_10 Pressure valves
    "Target pressure (Info 1)": "Tekanan target (Info 1)",
    "Target pressure": "Tekanan target",
    "Valve flow rates (Info 2)": "Laju alir katup (Info 2)",
    "Valve": "Katup",
    "Flow": "Aliran",

    // MOD_11 Intercom
    "Transmission dictionary (Info 1)": "Kamus transmisi (Info 1)",
    "Incoming message": "Pesan masuk",
    "Meaning": "Arti",
    "Meaning relay (Info 2)": "Relai arti (Info 2)",
    "Meaning received": "Arti diterima",
    "Relay meaning": "Arti relai",

    // MOD_12 Battleship
    "Ship deployments (Info 1)": "Penyebaran kapal (Info 1)",
    "Ship": "Kapal",
    "Occupied coordinates": "Koordinat terisi",
    "Artillery trajectories (Info 2)": "Lintasan artileri (Info 2)",
    "Incoming shot": "Tembakan masuk",
    "Coordinates hit": "Koordinat terkena",

    // MOD_13 Shape sorter
    "Filter ALPHA status (Info 1)": "Status Filter ALPHA (Info 1)",
    "Filter BETA status (Info 2)": "Status Filter BETA (Info 2)",
    "Status": "Status",
    "Behaviour": "Perilaku",

    // MOD_14 Pneumatic tube
    "Document directory (Info 1)": "Direktori dokumen (Info 1)",
    "Document code": "Kode dokumen",
    "Owning department": "Departemen pemilik",
    "Tube map (Info 2)": "Peta tabung (Info 2)",
    "Department": "Departemen",
    "Tube to use": "Tabung yang dipakai",

    // MOD_15 Biometric scanner
    "Clearance required (Info 1)": "Izin yang dibutuhkan (Info 1)",
    "Destination": "Tujuan",
    "Clearance level": "Tingkat izin",
    "Security log — badge levels (Info 2)": "Log keamanan — tingkat lencana (Info 2)",
    "Person": "Orang",
    "Badge level": "Tingkat lencana",

    // MOD_03 Button
    "Action cascade — check top to bottom (Info 1)": "Kaskade aksi — periksa dari atas ke bawah (Info 1)",
    "Release timing — light OFF (Info 2)": "Waktu lepas — lampu MATI (Info 2)",
    "Light state": "Keadaan lampu",
    "Release when…": "Lepas saat…",
    "Light color": "Warna lampu",
    "Release timing — {state} light (Info 2)": "Waktu lepas — lampu {state} (Info 2)",
    "OFF (any color)": "MATI (warna apa pun)",

    // ---- Beginner goal hints (goals.ts) ----
    "Cut the one correct wire. Ask your informants for its colour, then the cutting manual.":
      "Potong satu kabel yang benar. Tanyakan warnanya ke informanmu, lalu ikuti panduan potong.",
    "Walk the token to the exit using the arrow pad. Informants describe the hidden walls and rotation.":
      "Gerakkan token ke pintu keluar dengan tombol arah. Informan menjelaskan dinding tersembunyi dan rotasinya.",
    "Press or hold the button exactly as the two manual pages describe.":
      "Tekan atau tahan tombol persis seperti yang dijelaskan dua halaman manual.",
    "Press the correct position each stage. Stages 1–2 use Info 1, stages 3–4 use Info 2.":
      "Tekan posisi yang benar setiap tahap. Tahap 1–2 memakai Info 1, tahap 3–4 memakai Info 2.",
    "Press the two vials that mix into the antidote named on your manuals.":
      "Tekan dua vial yang bercampur menjadi antidot yang disebut di manualmu.",
    "Set the switches to the pattern your manuals describe, then execute.":
      "Setel sakelar sesuai pola di manualmu, lalu eksekusi.",
    "Set the sliders so the output screen matches the target profile from your manuals.":
      "Setel slider agar layar keluaran cocok dengan profil target di manualmu.",
    "Find the storm: start at the epicentre, apply the wind drift, then tap that cell.":
      "Temukan badai: mulai dari episentrum, terapkan pergeseran angin, lalu ketuk sel itu.",
    "Press the vial that matches the synthesizer target, per your manuals.":
      "Tekan vial yang cocok dengan target sintesis, sesuai manualmu.",
    "Open the valves that bring the gauge to the target pressure from your manuals.":
      "Buka katup yang membawa pengukur ke tekanan target dari manualmu.",
    "Follow the meaning chain through your manuals and press the final message.":
      "Ikuti rantai arti melalui manualmu dan tekan pesan terakhir.",
    "Select the single coordinate where the target ship and the incoming shot cross.":
      "Pilih satu koordinat tempat kapal target dan tembakan masuk berpotongan.",
    "Tap the one object that passes both filters described on your manuals.":
      "Ketuk satu objek yang lolos kedua filter di manualmu.",
    "Load the capsule into the correct tube for the document code.":
      "Muat kapsul ke tabung yang benar untuk kode dokumen.",
    "Approve or reject the scan based on the two clearance numbers read to you.":
      "Setujui atau tolak pemindaian berdasarkan dua angka izin yang dibacakan padamu.",

    // ---- Info notes ----
    "Switch 1 is the leftmost. Read all five states out loud.":
      "Sakelar 1 paling kiri. Bacakan kelima keadaan dengan lantang.",
    "Invert means flip that switch to the opposite side of the Info 1 pattern, then the owner executes.":
      "Balik berarti ubah sakelar itu ke sisi berlawanan dari pola Info 1, lalu pemilik mengeksekusi.",
    "Ask the owner for the last digit of their serial number, then read them the matching row.":
      "Tanyakan digit terakhir nomor seri pemilik, lalu bacakan baris yang cocok.",
    "Two presses max. The Clear vial is a solvent — it adds nothing and will waste a slot.":
      "Maksimal dua tekanan. Vial Clear adalah pelarut — tidak menambah apa pun dan membuang satu slot.",
    "Columns are A-E left to right, rows are 1-5 top to bottom.":
      "Kolom A-E dari kiri ke kanan, baris 1-5 dari atas ke bawah.",
    "If a drift would leave the grid, WRAP around: exiting one edge continues from the opposite edge on that axis.":
      "Jika pergeseran keluar dari grid, LINGKAR: keluar dari satu sisi berlanjut dari sisi berlawanan pada sumbu itu.",
    "These are the values the output screen must read — not necessarily the slider positions.":
      "Ini nilai yang harus ditampilkan layar keluaran — belum tentu posisi slider.",
    "Help the owner convert the target profile into physical slider positions.":
      "Bantu pemilik mengubah profil target menjadi posisi slider fisik.",
    "All three conditions must match exactly — read them out one at a time.":
      "Ketiga syarat harus cocok persis — bacakan satu per satu.",
    "Tell the owner each valve's flow rate so they can sum to the target.":
      "Beri tahu pemilik laju alir tiap katup agar jumlahnya mencapai target.",
    "Translate the owner's incoming message. The owner may return with a meaning from Info 2 to look up as a final message.":
      "Terjemahkan pesan masuk pemilik. Pemilik mungkin kembali dengan arti dari Info 2 untuk dicari sebagai pesan akhir.",
    "Every meaning relays to a different meaning. The owner then takes the relay meaning back to Informant 1 to find the final message.":
      "Setiap arti diteruskan ke arti berbeda. Pemilik lalu membawa arti relai itu kembali ke Informan 1 untuk menemukan pesan akhir.",
    "Each ship occupies a contiguous horizontal or vertical run. Ask the owner which ship is the target.":
      "Setiap kapal menempati baris horizontal atau vertikal yang bersambung. Tanyakan kapal mana yang jadi target.",
    "Shot coordinates are listed here. Ask the owner which shot is incoming.":
      "Koordinat tembakan ada di sini. Tanyakan tembakan mana yang masuk.",
    "Exactly one object survives both filters — read out each object's color and shape and eliminate.":
      "Hanya satu objek lolos kedua filter — bacakan warna dan bentuk tiap objek lalu eliminasi.",
    "The YELLOW tube has no department label — never send a document through it.":
      "Tabung KUNING tidak punya label departemen — jangan pernah kirim dokumen lewat tabung itu.",
    "APPROVE only if the badge level is greater than OR equal to the required clearance. Otherwise REJECT.":
      "SETUJUI hanya jika tingkat lencana lebih besar atau sama dengan izin yang dibutuhkan. Jika tidak, TOLAK.",
    "Stop at the first rule that matches. If it says HOLD, consult the release manual. If it says DROP, release immediately.":
      "Berhenti di aturan pertama yang cocok. Jika HOLD, lihat panduan lepas. Jika DROP, lepas segera.",
    "If the light is OFF, ignore its color and use this row.":
      "Jika lampu MATI, abaikan warnanya dan pakai baris ini.",
    "Only read this if the first manual resolved to HOLD. Everyone reads the same shared room clock.":
      "Bacakan hanya jika manual pertama menghasilkan HOLD. Semua membaca jam ruangan yang sama.",
    "A step is only legal if it does not cross a wall or leave the grid.":
      "Langkah sah hanya jika tidak melewati dinding atau keluar grid.",

    // ---- MOD_01 wire cutting rules ----
    "If there are no red wires, cut the second wire.": "Jika tidak ada kabel merah, potong kabel kedua.",
    "Otherwise, if the last wire is white, cut the last wire.": "Jika tidak, dan kabel terakhir putih, potong kabel terakhir.",
    "Otherwise, if there is more than one blue wire, cut the last blue wire.": "Jika tidak, dan ada lebih dari satu kabel biru, potong kabel biru terakhir.",
    "Otherwise, cut the last wire.": "Jika tidak, potong kabel terakhir.",
    "If there is more than one red wire and the last digit of the serial number is odd, cut the last red wire.": "Jika ada lebih dari satu kabel merah dan digit terakhir nomor seri ganjil, potong kabel merah terakhir.",
    "Otherwise, if the last wire is yellow and there are no red wires, cut the first wire.": "Jika tidak, dan kabel terakhir kuning serta tidak ada kabel merah, potong kabel pertama.",
    "Otherwise, if there is exactly one blue wire, cut the first wire.": "Jika tidak, dan tepat ada satu kabel biru, potong kabel pertama.",
    "Otherwise, if there is more than one yellow wire, cut the last wire.": "Jika tidak, dan ada lebih dari satu kabel kuning, potong kabel terakhir.",
    "Otherwise, cut the second wire.": "Jika tidak, potong kabel kedua.",
    "If the last wire is black and the last digit of the serial number is odd, cut the fourth wire.": "Jika kabel terakhir hitam dan digit terakhir nomor seri ganjil, potong kabel keempat.",
    "Otherwise, if there is exactly one red wire and there is more than one yellow wire, cut the first wire.": "Jika tidak, dan tepat ada satu kabel merah serta lebih dari satu kabel kuning, potong kabel pertama.",
    "Otherwise, if there are no black wires, cut the second wire.": "Jika tidak, dan tidak ada kabel hitam, potong kabel kedua.",
    "Otherwise, cut the first wire.": "Jika tidak, potong kabel pertama.",
    "If there are no yellow wires and the last digit of the serial number is odd, cut the third wire.": "Jika tidak ada kabel kuning dan digit terakhir nomor seri ganjil, potong kabel ketiga.",
    "Otherwise, if there is exactly one yellow wire and there is more than one white wire, cut the fourth wire.": "Jika tidak, dan tepat ada satu kabel kuning serta lebih dari satu kabel putih, potong kabel keempat.",
    "Otherwise, if there are no red wires, cut the last wire.": "Jika tidak, dan tidak ada kabel merah, potong kabel terakhir.",
    "Otherwise, cut the fourth wire.": "Jika tidak, potong kabel keempat.",

    // ---- MOD_04 sequence rules ----
    "Press the button in the 2nd position.": "Tekan tombol di posisi ke-2.",
    "Press the button in the 3rd position.": "Tekan tombol di posisi ke-3.",
    "Press the button in the 4th position.": "Tekan tombol di posisi ke-4.",
    "Press the button in the 1st position.": "Tekan tombol di posisi ke-1.",
    "Press the button labeled \"4\".": "Tekan tombol berlabel \"4\".",
    "Press the button in the same position as stage 1.": "Tekan tombol di posisi yang sama seperti tahap 1.",
    "Press the button in the same position as stage 2.": "Tekan tombol di posisi yang sama seperti tahap 2.",
    "Press the button with the same LABEL as the stage-2 press.": "Tekan tombol dengan LABEL sama seperti tekanan tahap 2.",
    "Press the button with the same LABEL as the stage-1 press.": "Tekan tombol dengan LABEL sama seperti tekanan tahap 1.",
    "Positions are counted left to right (position 1 is the leftmost button). Labels are reshuffled every stage.":
      "Posisi dihitung dari kiri ke kanan (posisi 1 paling kiri). Label diacak tiap tahap.",
    "Read out the rule for the digit the owner shows you.": "Bacakan aturan untuk digit yang ditunjukkan pemilik.",
    "You may need the buttons pressed in stages 1 and 2 — ask the other informant.":
      "Kamu mungkin butuh tombol yang ditekan pada tahap 1 dan 2 — tanyakan informan lain.",
    "You may need the buttons pressed earlier — coordinate with the other informant.":
      "Kamu mungkin butuh tombol yang ditekan sebelumnya — koordinasi dengan informan lain.",

    // ---- MOD_07 equalizer revision bugs ----
    "Firmware clean — every slider outputs the position you set.": "Firmware bersih — setiap slider mengeluarkan posisi yang kamu set.",
    "Mid channel outputs 2 steps HIGH: set the mid slider 2 steps BELOW the target (never below 1).": "Kanal Mid mengeluarkan 2 langkah LEBIH TINGGI: set slider mid 2 langkah DI BAWAH target (jangan di bawah 1).",
    "Bass channel is inverted: the output is 6 minus the physical position, so set bass to 6 minus the target.": "Kanal Bass terbalik: keluaran adalah 6 dikurangi posisi fisik, jadi set bass ke 6 dikurangi target.",

    // ---- MOD_03 button action rules ----
    "If the button is BLUE and says \"Abort\", press and HOLD.": "Jika tombol BIRU dan bertuliskan \"Abort\", tekan dan TAHAN.",
    "Otherwise, if the button is GREEN and the indicator light is FLASHING, press and HOLD.": "Jika tidak, dan tombol HIJAU serta lampu indikator BERKEDIP, tekan dan TAHAN.",
    "Otherwise, if the serial number ends in an EVEN digit and the indicator light is OFF, press and HOLD.": "Jika tidak, dan nomor seri berakhiran digit GENAP serta lampu indikator MATI, tekan dan TAHAN.",
    "Otherwise, if the button is YELLOW and says \"Detonate\", press and HOLD.": "Jika tidak, dan tombol KUNING serta bertuliskan \"Detonate\", tekan dan TAHAN.",
    "Otherwise, if the button is BLUE and says \"Press\", press and HOLD.": "Jika tidak, dan tombol BIRU serta bertuliskan \"Press\", tekan dan TAHAN.",
    "Otherwise, if the serial number ends in an ODD digit and the indicator light is SOLID, press and HOLD.": "Jika tidak, dan nomor seri berakhiran digit GANJIL serta lampu indikator MENYALA TETAP, tekan dan TAHAN.",
    "Otherwise, release IMMEDIATELY without holding (DROP).": "Jika tidak, lepas SEGERA tanpa menahan (DROP).",
    "Light is OFF. Release only when the shared clock's SECONDS are even.": "Lampu MATI. Lepas hanya saat DETIK jam bersama genap.",
    "Steady BLUE light. Release when the shared clock contains a 4 anywhere in MM:SS.": "Lampu BIRU tetap. Lepas saat jam bersama memuat angka 4 di mana pun pada MM:SS.",
    "Steady GREEN light. Release when the shared clock contains a 1 anywhere in MM:SS.": "Lampu HIJAU tetap. Lepas saat jam bersama memuat angka 1 di mana pun pada MM:SS.",
    "Steady YELLOW light. Release when the shared clock contains a 5 anywhere in MM:SS.": "Lampu KUNING tetap. Lepas saat jam bersama memuat angka 5 di mana pun pada MM:SS.",
    "Steady RED light. Release immediately once it lights — a simple tap release.": "Lampu MERAH tetap. Lepas segera setelah menyala — cukup ketuk.",
    "FLASHING BLUE light. Release when the shared clock's SECONDS are even.": "Lampu BIRU berkedip. Lepas saat DETIK jam bersama genap.",
    "FLASHING GREEN light. Release when the shared clock contains a 1 anywhere in MM:SS.": "Lampu HIJAU berkedip. Lepas saat jam bersama memuat angka 1 di mana pun pada MM:SS.",
    "FLASHING YELLOW light. Release when the shared clock contains a 3 anywhere in MM:SS.": "Lampu KUNING berkedip. Lepas saat jam bersama memuat angka 3 di mana pun pada MM:SS.",
    "FLASHING RED light. Release when the shared clock contains a 7 anywhere in MM:SS.": "Lampu MERAH berkedip. Lepas saat jam bersama memuat angka 7 di mana pun pada MM:SS.",

    // ---- MOD_13 shape sorter filter behaviour ----
    "Rejects RED and GREEN objects — anything else may pass.": "Menolak objek MERAH dan HIJAU — selain itu boleh lolos.",
    "Rejects BLUE objects — anything else may pass.": "Menolak objek BIRU — selain itu boleh lolos.",
    "Requires exactly 3 sides — only a TRIANGLE passes.": "Butuh tepat 3 sisi — hanya SEGITIGA yang lolos.",
    "Requires 0 sharp corners — only a CIRCLE passes.": "Butuh 0 sudut tajam — hanya LINGKARAN yang lolos.",
  },
};

/**
 * Regex-based overrides for strings that embed runtime values. Each rule rewrites the whole
 * sentence in the target language, exposing captured groups as `{1}`, `{2}`, … in `template`.
 * `source` must match the English string the module produces.
 */
interface PatternOverride {
  source: RegExp;
  template: string;
}

export const PATTERN_OVERRIDES: Partial<Record<Language, PatternOverride[]>> = {
  id: [
    { source: /^Cutting manual — (\d+) wires \(Info 2\)$/, template: "Panduan potong — {1} kabel (Info 2)" },
    { source: /^Architecture map: (.+) \(Info 1\)$/, template: "Peta arsitektur: {1} (Info 1)" },
    { source: /^Release timing — (.+) light \(Info 2\)$/, template: "Waktu lepas — lampu {1} (Info 2)" },
    { source: /^Wires attached: (\d+)$/, template: "Kabel terpasang: {1}" },
    { source: /^Wire (\d+) cut$/, template: "Kabel {1} dipotong" },
    { source: /^Token at (\S+) · exit at (\S+)$/, template: "Token di {1} · keluar di {2}" },
    { source: /^Stage (\d+) of (\d+) · display shows (\d+)$/, template: "Tahap {1} dari {2} · layar menampilkan {3}" },
    { source: /^Switches set: (\d+) ON$/, template: "Sakelar aktif: {1} ON" },
    { source: /^Gauge reads (\d+) psi$/, template: "Pengukur membaca {1} psi" },
  ],
};

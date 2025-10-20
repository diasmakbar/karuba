# Rancang — Game Logic

Game **Rancang** adalah game multiplayer berbasis negosiasi dan area control, terinspirasi dari *Chinatown* dan *Waterfall Park*, dengan mekanik orisinal berbasis grid spiral dan sistem kluster atraksi.

---

## 🎯 Tujuan
Pemain membangun **kluster atraksi** yang saling menempel di papan spiral. Skor diperoleh berdasarkan **jumlah atraksi dalam kluster** dan **kelengkapannya** (dalam satu ukuran atraksi yang sama).

---

## 🧱 Setup Awal

- **Jumlah pemain**: 2–9
- **Ukuran papan**: `(jumlah pemain + 4)²`, minimal **50 tile** maksimal **150 tile**
- **Penomoran tile**: dimulai dari tengah, lalu spiral ke luar searah jarum jam
- **Modal awal**: setiap pemain mendapat **koin = jumlah pemain**

---

## 🎁 Distribusi per Ronde

Ada **4 ronde**. Tiap ronde, tiap pemain menerima:

| Jumlah Pemain | Ronde 1–2 (Tanah / Atraksi) | Ronde 3–4 (Tanah / Atraksi) |
|---------------|-----------------------------|-----------------------------|
| 2–3           | 5 / 6                       | 6 / 5                       |
| 4–5           | 4 / 4                       | 5 / 3                       |
| 6–7           | 3 / 3                       | 4 / 2                       |

> Terdapat {jumlah tanah} + 2 sebagai pilihan dan pemain harus memilih hanya sejumlah {jumlah tanah} tanah. Misalkan dalam 4-5 pemain, ronde 1, pemain mendapatkan 6 tanah namun hanya memilih 4 tanah.

---

## 🗂️ Jenis Atraksi

Atraksi dibagi dalam 3 ukuran, masing-masing dengan 3 varian:

- **Ukuran 3**: Rest Area (x3), Minimarket (x3), Tempat Ibadah (x3)  
- **Ukuran 4**: Taman (x4), Bioskop (x4), Lapangan Olahraga (x4)
- **Ukuran 5**: Gedung Bisnis (x5), Waterboom (x5), Apartemen (x5)

### Total Kartu Atraksi
- 2–3 pemain → 1 set = **36 kartu**
- 4–5 pemain → 2 set = **72 kartu**
- 6–7 pemain → 3 set = **108 kartu**
- 8–9 pemain → 4 set = **144 kartu**

---

## 💬 Fase Negosiasi

- Durasi: **5 menit per ronde**
- Pemain boleh **tawar-menawar bebas**:
  - Tukar **tanah**, **atraksi**, atau **koin**
  - Bisa tawar tanah kosong atau tanah + atraksi
- Fase berakhir jika:
  - Waktu habis, **atau**
  - Semua pemain klik **"Selesai"**

---

## 📊 Scoring (Akhir Tiap Ronde)

Skor dihitung berdasarkan **kluster atraksi** yang saling menempel (adjacent di grid spiral).

| Jumlah Atraksi | Tidak Lengkap | Lengkap |
|----------------|---------------|---------|
| 1              | 1 koin        | –       |
| 2              | 3 koin        | –       |
| 3              | 5 koin        | 6 koin  |
| 4              | 7 koin        | 9 koin  |
| 5              | –             | 12 koin |

> **Lengkap** = Semua atraksi dalam kluster sudah sesuai ukuran atraksi. Misal terdapat 4 bangunan Bioskop yang saling menempel.  
> **Tidak lengkap** = Semua atraksi dalam kluster belum sesuai ukuran atraksi.

Koin hasil scoring langsung ditambahkan ke pemain.

---

## 🔁 Alur Game

1. **Distribusi** tanah & atraksi
2. **Negosiasi** (5 menit)
3. **Scoring otomatis**
4. **Auto-advance** ke ronde berikutnya (setelah 10 detik)
5. Ulangi hingga ronde 4 → tampilkan **skor akhir**

---

## 🌐 Teknis

- **Papan**: grid spiral dengan offset ganjil-genap (mirip hex)
- **Multiplayer**: real-time via **Firebase Realtime Database**
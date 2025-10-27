# 🏡 Welcome To: Digital Balanced Edition  
Based on *Welcome To: Your Perfect Home* (Blue Cocker Games, 2018)  

---

## 🎯 Tujuan
Bangun perumahan sempurna di tiga jalan (Street A, B, C) dengan menulis nomor rumah berurutan, memilih aksi yang sesuai, dan menyelesaikan proyek kota (*City Plans*). Game akan selesai saat ada pemain menyelesaikan 3 basic city plans **atau** saat ada pemain yang terkena pinalti tidak bisa membangun rumah ketiga kalinya **atau** saat ada pemain yang membangun semua rumah (33 rumah terisi).

---

## 🧾 1. Komponen Game

| Komponen | Jumlah | Keterangan |
|-----------|---------|------------|
| Construction Cards | 81 | Sisi angka (1–15) dan sisi aksi |
| City Plan Cards | 28 | 18 Basic + 10 Advanced |
| Web-based Player Board | 1 per pemain | 3 jalan (10, 11, 12 rumah) |

---

## 🏘️ 2. Struktur Jalan
| Street | Jumlah Rumah | Pool | Slot Park |
|:--|:--:|:--:|:--:|
| Street 1 | 10 | 3 | 3 |
| Street 2 | 11 | 3 | 4 |
| Street 3 | 12 | 3 | 5 |

Total: 33 rumah, 9 kolam, 12 taman slot.

---

## 🧱 3. Jenis Aksi (Effect Cards)
| Efek | Jumlah | Fungsi |
|:--|:--:|:--|
| 🏊 Pool Manufacturer | 9 | Bangun kolam di rumah yang punya ikon kolam |
| ⚙️ Temp Agency | 9 | Ubah angka ±1 atau ±2 |
| 🏡 Bis | 9 | Gandakan nomor rumah di sebelahnya (tambah rumah “Bis”) |
| 🌳 Landscaper | 18 | Tambah taman di jalan tempat rumah dibangun |
| 💰 Real Estate Agent | 18 | Naikkan nilai kompleks rumah di akhir game |
| 🏗️ Surveyor | 18 | Pasang pagar antar rumah untuk bikin kompleks baru |

---

## 🔢 4. Distribusi Angka (House Numbers)
```
3x 1,2,14,15  
4x 3,13  
5x 4,12  
6x 5,11  
7x 6,10  
8x 7,9  
9x 8
```
→ Total 81 kartu. Angka tengah (7–9) paling sering muncul.

---

## 🚫 5. Aturan City Plan
- Satu **estate (kompleks berpagar)** hanya boleh digunakan untuk **satu City Plan**.  
- Plan yang targetnya seluruh street / pool / park boleh overlap.  

---

## 🏙️ 6. City Plans
- 18 **Basic Plans** → kombinasi ukuran estate (1–6 rumah).  
- 10 **Advanced Plans** → fokus pada full street, kolam/taman lengkap, BIS, Temp, dan roundabout.  
- Semua City Plan punya dua mode skor:  
  - **Classic:** versi resmi  
  - **Balanced:** hasil kalibrasi agar lebih adil sesuai kesulitan.

---

## ⚖️ 7. Skoring Aksi (detail)

### 🏊 Pool
| Urutan | Poin |
|:--:|:--:|
| 1 | 3 |
| 2 | 6 |
| 3 | 9 |
| 4 | 13 |
| 5 | 17 |
| 6 | 21 |
| 7 | 26 |
| 8 | 31 |
| 9 | 36 |

---

### 🌳 Park
| Jalan | Urutan | Poin |
|:--|:--:|:--:|
| 1 | 1 | 2 |
| 1 | 2 | 4 |
| 1 | 3 | 10 |
| 2 | 1 | 2 |
| 2 | 2 | 4 |
| 2 | 3 | 6 |
| 2 | 4 | 14 |
| 3 | 1 | 2 |
| 3 | 2 | 4 |
| 3 | 3 | 6 |
| 3 | 4 | 8 |
| 3 | 5 | 18 |

---

### ⚙️ Temp Agency (jumlah penggunaan terbanyak)
| Peringkat | Poin |
|:--:|:--:|
| 1 | 7 |
| 2 | 4 |
| 3 | 1 |

---

### 💰 Real Estate Agent (nilai kompleks rumah)
| Ukuran Estate | Level Upgrade | Poin |
|:--:|:--:|:--:|
| 1 | 1 | 3 |
| 2 | 1 | 3 |
| 2 | 2 | 4 |
| 3 | 1 | 4 |
| 3 | 2 | 5 |
| 3 | 3 | 6 |
| 4 | 1 | 5 |
| 4 | 2 | 6 |
| 4 | 3 | 7 |
| 4 | 4 | 8 |
| 5 | 1 | 6 |
| 5 | 2 | 7 |
| 5 | 3 | 8 |
| 5 | 4 | 10 |
| 6 | 1 | 7 |
| 6 | 2 | 8 |
| 6 | 3 | 10 |
| 6 | 4 | 12 |

---

### 🏡 BIS (penalti)
| Jumlah BIS | Poin |
|:--:|:--:|
| 1 | -1 |
| 2 | -3 |
| 3 | -6 |
| 4 | -9 |
| 5 | -12 |
| 6 | -16 |
| 7 | -20 |
| 8 | -24 |
| 9 | -28 |

---

### 🔁 Roundabout (penalti)
| Jumlah | Poin |
|:--:|:--:|
| 1 | -3 |
| 2 | -8 |

---

### 🚫 Building Permit Refusal (gagal isi rumah)
| Kejadian | Poin |
|:--:|:--:|
| 1 | 0 |
| 2 | -3 |
| 3 | -5 → End Game |

---

## 🧮 10. JSON Lengkap – City Plans (Classic & Balanced)
{
  "basic": {
    "n1": [
      {"id":"n1-1","objective":"6 estates of size 1","type":"estate","allow_overlap":false,"classic":{"first":8,"later":4},"balanced":{"first":7,"later":3}},
      {"id":"n1-2","objective":"4 estates of size 2","type":"estate","allow_overlap":false,"classic":{"first":8,"later":4},"balanced":{"first":8,"later":4}},
      {"id":"n1-3","objective":"3 estates of size 3","type":"estate","allow_overlap":false,"classic":{"first":8,"later":4},"balanced":{"first":9,"later":5}},
      {"id":"n1-4","objective":"2 estates of size 4","type":"estate","allow_overlap":false,"classic":{"first":6,"later":3},"balanced":{"first":7,"later":4}},
      {"id":"n1-5","objective":"2 estates of size 5","type":"estate","allow_overlap":false,"classic":{"first":8,"later":4},"balanced":{"first":10,"later":5}},
      {"id":"n1-6","objective":"2 estates of size 6","type":"estate","allow_overlap":false,"classic":{"first":10,"later":6},"balanced":{"first":11,"later":7}}
    ],
    "n2": [
      {"id":"n2-1","objective":"1 estate size 3 and 1 estate size 6","type":"estate","allow_overlap":false,"classic":{"first":8,"later":4},"balanced":{"first":9,"later":5}},
      {"id":"n2-2","objective":"2 estates size 3 and 1 estate size 4","type":"estate","allow_overlap":false,"classic":{"first":12,"later":7},"balanced":{"first":12,"later":7}},
      {"id":"n2-3","objective":"1 estate size 4 and 1 estate size 5","type":"estate","allow_overlap":false,"classic":{"first":9,"later":5},"balanced":{"first":10,"later":6}},
      {"id":"n2-4","objective":"1 estate size 4 and 3 estates size 1","type":"estate","allow_overlap":false,"classic":{"first":9,"later":5},"balanced":{"first":9,"later":5}},
      {"id":"n2-5","objective":"1 estate size 5 and 2 estates size 2","type":"estate","allow_overlap":false,"classic":{"first":10,"later":6},"balanced":{"first":11,"later":6}},
      {"id":"n2-6","objective":"1 estate size 6 and 3 estates size 1","type":"estate","allow_overlap":false,"classic":{"first":11,"later":6},"balanced":{"first":12,"later":7}}
    ],
    "n3": [
      {"id":"n3-1","objective":"1 estate size 3 and 1 estate size 4","type":"estate","allow_overlap":false,"classic":{"first":7,"later":3},"balanced":{"first":8,"later":4}},
      {"id":"n3-2","objective":"1 estate size 2 and 1 estate size 5","type":"estate","allow_overlap":false,"classic":{"first":7,"later":3},"balanced":{"first":8,"later":4}},
      {"id":"n3-3","objective":"1 estate size 1, 1 estate size 4, 1 estate size 5","type":"estate","allow_overlap":false,"classic":{"first":13,"later":7},"balanced":{"first":13,"later":8}},
      {"id":"n3-4","objective":"1 estate size 2, 1 estate size 3, 1 estate size 5","type":"estate","allow_overlap":false,"classic":{"first":13,"later":7},"balanced":{"first":13,"later":8}},
      {"id":"n3-5","objective":"1 estate size 1, 1 estate size 2, 1 estate size 6","type":"estate","allow_overlap":false,"classic":{"first":12,"later":7},"balanced":{"first":12,"later":7}},
      {"id":"n3-6","objective":"1 estate size 1, 2 estates size 2, 1 estate size 3","type":"estate","allow_overlap":false,"classic":{"first":11,"later":6},"balanced":{"first":11,"later":6}}
    ]
  },
  "advanced": {
    "n1": [
      {"id":"a1-1","objective":"All 12 houses built in street 3 (full street)","type":"street","allow_overlap":true,"classic":{"first":8,"later":4},"balanced":{"first":10,"later":5}},
      {"id":"a1-2","objective":"Use 7 Temp Agencies","type":"effect","allow_overlap":true,"classic":{"first":6,"later":3},"balanced":{"first":7,"later":4}},
      {"id":"a1-3","objective":"All 10 houses built in street 1 (full street)","type":"street","allow_overlap":true,"classic":{"first":6,"later":3},"balanced":{"first":9,"later":4}},
      {"id":"a1-4","objective":"Use 5 BIS effects","type":"effect","allow_overlap":true,"classic":{"first":8,"later":3},"balanced":{"first":10,"later":5}},
      {"id":"a1-5","objective":"First and last house in every street are built","type":"street","allow_overlap":true,"classic":{"first":7,"later":4},"balanced":{"first":7,"later":4}}
    ],
    "n2": [
      {"id":"a2-1","objective":"Two streets each have 3 completed pools (6 total)","type":"pool","allow_overlap":true,"classic":{"first":7,"later":4},"balanced":{"first":10,"later":5}},
      {"id":"a2-2","objective":"All pools and parks built in street 3","type":"street","allow_overlap":true,"classic":{"first":10,"later":5},"balanced":{"first":11,"later":6}},
      {"id":"a2-3","objective":"All pools and parks built in street 2","type":"street","allow_overlap":true,"classic":{"first":8,"later":3},"balanced":{"first":9,"later":5}},
      {"id":"a2-4","objective":"One street has all pools, all parks, and one roundabout","type":"street","allow_overlap":true,"classic":{"first":10,"later":5},"balanced":{"first":12,"later":6}},
      {"id":"a2-5","objective":"All parks or all pools completed in two different streets","type":"street","allow_overlap":true,"classic":{"first":7,"later":4},"balanced":{"first":9,"later":5}}
    ]
  }
}


---

## 🕹️ Mode Permainan
- **Classic Mode:** mengikuti skor dan tempo resmi.  
- **Balanced Mode:** lebih adil terhadap tingkat kesulitan advanced.  

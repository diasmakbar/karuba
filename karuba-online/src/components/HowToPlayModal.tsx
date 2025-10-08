import React, { useState } from "react"
import Modal from "./Modal"

interface HowToPlayModalProps {
  isOpen: boolean
  onClose: () => void
  onPlay?: () => void
}

export default function HowToPlayModal({ isOpen, onClose, onPlay }: HowToPlayModalProps) {
  const [currentPage, setCurrentPage] = useState(0)

  // Content from README.md split by sections
  const pages = [
    {
      title: "Tujuan Permainan",
      content: `Bantu para penjelajah (explorer) menemukan jalannya menuju temple berwarna sama sebelum pemain lain!
Susun tile jalan dan kelola langkahmu seefisien mungkin untuk mengumpulkan poin terbanyak.`
    },
    {
      title: "1. Setup Game",
      content: `Setiap pemain punya papan 6×6 dengan:
- 4 penjelajah (🟤🟡🔵🔴) di tepi pantai
- 4 temple di sisi berlawanan (warnanya sesuai explorer)
- Semua pemain punya set tile jalan (1–36) yang sama.
- Satu pemain jadi Host, dan memulai ronde pertama lewat tombol Start Game.`
    },
    {
      title: "2. Giliran Permainan",
      content: `Setiap ronde, semua pemain akan mendapat tile dengan nomor yang sama.
Pemain bisa memilih:
- Menaruh tile di papan untuk membangun jalan.
- Membuang tile (discard) untuk mendapat langkah gerak tambahan.
- Berjalan sesuai tile dan moves yang tersedia`
    },
    {
      title: "3. Menaruh Tile",
      content: `Tap kotak kosong → konfirmasi "Place tile here?"
Tekan Yes untuk menempatkan tile.
Tile tidak bisa dipindahkan setelah diletakkan.
Jalur antar tile harus nyambung agar explorer bisa lewat.`
    },
    {
      title: "4. Membuang Tile & Jumlah Langkah",
      content: `Kalau kamu membuang tile, explorer mendapat langkah (moves) tergantung jenis tile-nya:

Jenis Tile | Langkah yang Didapat
Jalan Lurus | 2 moves
Tikungan | 2 moves
Pertigaan | 3 moves
Perempatan | 4 moves`
    },
    {
      title: "5. Bergerak",
      content: `Setelah punya moves, tap tile tujuan di jalur yang terhubung, Explorer akan otomatis berjalan ke arah itu.
Kamu bisa:
⬅️ Undo Move – membatalkan langkah terakhir
🔁 Redo Move – mengulangi langkah yang dibatalkan
Explorer hanya bisa melewati jalan yang tersambung tanpa putus.`
    },
    {
      title: "6. Mendapatkan Poin dari Temple",
      content: `Setiap warna explorer punya temple warna sama. Siapa yang pertama kali mencapai temple warna itu akan dapat poin lebih besar.

Urutan Sampai Temple\tPoin yang Didapat
🥇 Pertama\tjumlah pemain + 1
🥈 Kedua\tjumlah pemain
🥉 Ketiga\tjumlah pemain − 1
dst...\t...hingga 2 poin minimum

Contoh: kalau 4 pemain
→ Pemain pertama dapat 5 poin, kedua 4, ketiga 3, keempat 2.

Apabila tile terdapat gold akan menambah +2 poin, dan apabila tile terdapat crystal akan menambah +1 poin.`
    },
    {
      title: "7. Selesai Permainan",
      content: `Game berakhir setelah semua 36 tile dimainkan atau semua explorer mencapai temple.
Pemain dengan total poin tertinggi menang!
Jika seri, pemenang ditentukan oleh jalur tercepat (langkah paling efisien).`
    },
    {
      title: "Tips untuk Pemula",
      content: `Jangan buru-buru taruh tile – pikirkan sambungan jangka panjang.
Kadang lebih untung buang tile sulit untuk dapet langkah tambahan.
Gunakan undo/redo buat perbaiki strategi jalan tanpa panik.
Fokus ke satu temple dulu biar aman dapet poin besar.`
    }
  ]

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1)
    } else if (onPlay) {
      onPlay()
    }
  }

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  if (!isOpen) return null

  const isLastPage = currentPage === pages.length - 1

  return (
    <Modal width={400}>
      <div style={{ textAlign: "center" }}>
        <h2 style={{ margin: "0 0 16px 0", fontSize: 20, fontWeight: "bold" }}>
          How to Play
        </h2>

        <div style={{ textAlign: "left", marginBottom: 20 }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: 16, color: "#333" }}>
            {pages[currentPage].title}
          </h3>
          <div style={{
            fontSize: 14,
            lineHeight: 1.5,
            color: "#555",
            whiteSpace: "pre-line"
          }}>
            {pages[currentPage].content}
          </div>
        </div>

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 20
        }}>
          <button
            onClick={prevPage}
            disabled={currentPage === 0}
            style={{
              padding: "8px 16px",
              background: currentPage === 0 ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: currentPage === 0 ? "not-allowed" : "pointer"
            }}
          >
            Previous
          </button>

          <span style={{ fontSize: 12, color: "#666" }}>
            {currentPage + 1} / {pages.length}
          </span>

          <button
            onClick={nextPage}
            style={{
              padding: "8px 16px",
              background: "#28a745",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            {isLastPage ? "Play!" : "Next"}
          </button>
        </div>

        <button
          onClick={onClose}
          style={{
            marginTop: 12,
            padding: "6px 12px",
            background: "transparent",
            color: "#666",
            border: "1px solid #ddd",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 12
          }}
        >
          Close
        </button>
      </div>
    </Modal>
  )
}

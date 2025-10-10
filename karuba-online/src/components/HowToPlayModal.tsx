import { useState } from "react"
import Modal from "./Modal"

interface HowToPlayModalProps {
  isOpen: boolean
  onClose: () => void
  onPlay?: () => void
}

export default function HowToPlayModal({ isOpen, onClose, onPlay }: HowToPlayModalProps) {
  const [currentPage, setCurrentPage] = useState(0)

  const pages = [
    {
      title: "🎯 Tujuan Permainan",
      content: `
      Bantu penjelajah menemukan jalannya menuju <b>harta karun berwarna sama</b> sebelum pemain lain!<br><br>
      Susun jalan dan kelola langkahmu seefisien mungkin untuk mengumpulkan <b>poin terbanyak</b>.`,
      image: "/tutorial/goal.png"
    },
    {
      title: "🧩 1. Setup Game",
      content: `
      Setiap pemain punya papan 6×6 berisi:
      <ul>
        <li>🧍‍♂️ 4 penjelajah: coklat, kuning, biru, merah (di tepi pantai)</li>
        <li>💎 4 harta karun warna sama di sisi berlawanan</li>
        <li>🧱 36 tile jalan (1–36) yang sama untuk semua pemain</li>
        <li>👑 Host menekan <b>Start Game</b> untuk memulai ronde pertama, atau player menekan <b>Generate Tile</b> untuk tau tile ronde selanjutnya.</li>
      </ul>`,
      image: "/tutorial/setup.png"
    },
    {
      title: "🎲 2. Giliran Permainan",
      content: `
      Setiap ronde, semua pemain akan mendapat tile dengan <b>nomor yang sama</b>.<br><br>
      Pemain bisa memilih:
      <ul>
        <li>🪨 Menaruh tile di papan untuk membangun jalan</li>
        <li>🗑️ Membuang tile (discard) untuk mendapat langkah tambahan</li>
        <li>👣 Berjalan sesuai moves yang tersedia</li>
      </ul>`,
      image: "/tutorial/turn.png"
    },
    {
      title: "🏗️ 3. Menaruh Tile",
      content: `
      Tap kotak kosong → klik lagi untuk konfirmasi “Place tile here?” → tekan <b>Yes</b> untuk menaruh tile.<br><br>
      📌 Catatan:
      <ul>
        <li>Tile tidak bisa dipindahkan setelah diletakkan</li>
        <li>Jalur antar tile harus tersambung agar explorer bisa lewat</li>
      </ul>`,
      image: "/tutorial/place_tile.png"
    },
    {
      title: "🗑️ 4. Membuang Tile = Langkah (Moves)",
      content: `
      Kalau kamu <b>membuang tile</b>, explorer mendapat langkah sesuai bentuk tile:
      <table style="width:100%; border-collapse:collapse; margin-top:8px;">
        <thead>
          <tr>
            <th align="left">Jenis Tile</th>
            <th align="center">Contoh</th>
            <th align="right">Langkah Didapat</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Jalan Lurus</td><td align="center">➖</td><td align="right">2 moves</td></tr>
          <tr><td>Tikungan</td><td align="center">↩️</td><td align="right">2 moves</td></tr>
          <tr><td>Pertigaan</td><td align="center">⛓️</td><td align="right">3 moves</td></tr>
          <tr><td>Perempatan</td><td align="center">✴️</td><td align="right">4 moves</td></tr>
        </tbody>
      </table>`,
      image: "/tutorial/discard.png"
    },
    {
      title: "🚶‍♀️ 5. Bergerak",
      content: `
      Setelah punya moves, tap tile tujuan di jalur yang terhubung, explorer akan <b>bergerak otomatis</b>.<br><br>
      Kamu bisa:
      <ul>
        <li>⬅️ <b>Undo Move</b> – membatalkan langkah terakhir</li>
        <li>🔁 <b>Redo Move</b> – mengulangi langkah yang dibatalkan</li>
      </ul>
      Explorer hanya bisa melewati jalan yang tersambung tanpa putus.`,
      image: "/tutorial/move.png"
    },
    {
      title: "🏆 6. Mendapatkan Poin - Harta Karun",
      content: `
      Setiap warna explorer punya temple warna sama.<br>
      Siapa yang pertama kali mencapai temple akan dapat poin lebih besar.
      <table style="width:100%; border-collapse:collapse; margin-top:8px;">
        <thead>
          <tr><th align="left">Urutan</th><th align="right">Poin</th></tr>
        </thead>
        <tbody>
          <tr><td>🥇 Pertama</td><td align="right">Jumlah pemain + 1</td></tr>
          <tr><td>🥈 Kedua</td><td align="right">Jumlah pemain</td></tr>
          <tr><td>🥉 Ketiga</td><td align="right">Jumlah pemain − 1</td></tr>
          <tr><td>dst...</td><td align="right">Minimal 2 poin</td></tr>
        </tbody>
      </table>`,
      image: "/tutorial/temple.png"
    },
    {
      title: "🏆 7. Mendapatkan Poin - Reward dan Bonus",
      content: `
      Terdapat tile yang mempunyai reward emas atau crystal. Apabila explorer melewati tile tersebut akan mendapat bonus<br>
      <ul>
        <li>Tile berisi <b>Gold</b> → +2 pts</li>
        <li>Tile berisi <b>Crystal</b> → +1 pts</li>
      </ul>
      <br>
      Pemain yang dapat menyelesaikan semua warna sebelum ronde 36 akan mendapat bonus:
      <ul>
        <li>36 - Round finish (contoh round 30) → +6 pts, max 8 pts.</li>
      </ul>
      <br>
      Pemain yang dapat menyelesaikan semua warna sebelum ronde 36 akan mendapat bonus:
      <table style="width:100%; border-collapse:collapse; margin-top:8px;">
        <thead>
          <tr><th align="left">Urutan</th><th align="right">Poin</th></tr>
        </thead>
        <tbody>
          <tr><td>🥇 Pertama</td><td align="right">+2 Pts</td></tr>
          <tr><td>🥈 Kedua</td><td align="right">+1 Pts</td></tr>
          <tr><td>Ketiga, dst</td><td align="right">-</td></tr>
        </tbody>
      </table>
      `,
      image: "/tutorial/temple.png"
    },
    {
      title: "🕹️ 8. Selesai Permainan",
      content: `
      Game berakhir setelah:
      <ul>
        <li>Semua 36 tile dimainkan</li>
        <li>atau semua explorer mencapai temple</li>
      </ul>
      🎉 Pemain dengan <b>total poin tertinggi</b> menang!`,
      image: "/tutorial/end.png"
    },
    {
      title: "💡 Tips untuk Pemula",
      content: `
      <ul>
        <li>✨ Jangan buru-buru taruh tile – pikirkan sambungan jangka panjang</li>
        <li>✨ Kadang lebih untung buang tile sulit untuk dapat langkah tambahan</li>
        <li>✨ Gunakan undo/redo buat eksperimen tanpa panik</li>
        <li>✨ Fokus ke satu temple dulu untuk amankan poin besar</li>
      </ul>`,
      image: "/tutorial/tips.png"
    }
  ]

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1)
    } else {
      onClose()
      onPlay?.()
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
      <div style={{ position: "relative" }}>
        {/* Tombol close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: -8,
            left: -8,
            background: "transparent",
            border: "none",
            fontSize: 18,
            color: "#666",
            cursor: "pointer",
            width: 24,
            height: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "50%",
            backgroundColor: "rgba(0,0,0,0.1)"
          }}
        >
          ×
        </button>

        {/* Konten modal */}
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <h2 style={{ margin: "0 0 16px 0", fontSize: 20, fontWeight: "bold" }}>
            How to Play
          </h2>

          <div style={{ textAlign: "left", marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: 16, color: "#333" }}>
              {pages[currentPage].title}
            </h3>

            {/* Render konten dengan HTML */}
            <div
              style={{
                fontSize: 14,
                lineHeight: 1.5,
                color: "#555",
              }}
              dangerouslySetInnerHTML={{ __html: pages[currentPage].content }}
            />

            {/* Gambar kalau ada */}
            {pages[currentPage].image && (
              <img
                src={pages[currentPage].image}
                alt={pages[currentPage].title}
                style={{
                  width: "100%",
                  marginTop: 12,
                  borderRadius: 8,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
                }}
              />
            )}
          </div>

          {/* Navigasi */}
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
        </div>
      </div>
    </Modal>
  )
}

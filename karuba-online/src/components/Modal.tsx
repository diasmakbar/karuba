import React from "react"

export default function Modal({ children, width = 320 }: { children: React.ReactNode; width?: number }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: 18,
          borderRadius: 10,
          width,
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        }}
      >
        {children}
      </div>
    </div>
  )
}

export function ModalButtons({ onYes, onCancel }: { onYes: () => void; onCancel: () => void }) {
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 12 }}>
      <button onClick={onYes}>Yes</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}

import React from "react";

export function HomeIconButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "absolute",
        top: 18,
        right: 18,
        zIndex: 20,
        background: "#fff",
        border: "none",
        borderRadius: "50%",
        width: 64,
        height: 64,
        boxShadow: "0 2px 8px #e0e0e0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        padding: 0,
        outline: "none"
      }}
      aria-label="Home"
    >
      <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#222" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 11.5L12 5l9 6.5" />
        <path d="M5 19V11.5M19 19V11.5" />
        <path d="M9 19V15h6v4" />
      </svg>
    </button>
  );
}

export function PauseModal({ open, onResume, onRestart, onHome }: { open: boolean, onResume: () => void, onRestart: () => void, onHome: () => void }) {
  if (!open) return null;
  return (
    <div style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(30,30,30,0.85)",
      zIndex: 100,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 18,
    }}>
      <div style={{ background: "#fff", borderRadius: 24, padding: 40, minWidth: 320, boxShadow: "0 4px 24px #0003", display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
        <h2 style={{ color: "#222", fontWeight: 900, fontSize: 36, marginBottom: 24 }}>Game Paused</h2>
        <button onClick={onHome} style={{ fontSize: 22, padding: "16px 0", borderRadius: 12, background: "#00b6e6", color: "#fff", fontWeight: 700, border: "none", marginBottom: 8, width: 240 }}>Return to Menu</button>
        <button onClick={onResume} style={{ fontSize: 22, padding: "16px 0", borderRadius: 12, background: "#ffb347", color: "#fff", fontWeight: 700, border: "none", marginBottom: 8, width: 240 }}>Resume Game</button>
        <button onClick={onRestart} style={{ fontSize: 22, padding: "16px 0", borderRadius: 12, background: "#f2f2f2", color: "#222", fontWeight: 700, border: "none", width: 240 }}>Restart Game</button>
      </div>
    </div>
  );
}

import React from "react";

// SVG ile pembe home ikonu (LoveGame'deki gibi)
export default function HomeButton({ onClick, style = {} }: { onClick: () => void; style?: React.CSSProperties }) {
  return (
    <button
      onClick={onClick}
      aria-label="Home"
      title="Home"
      style={{
        background: "none",
        border: "none",
        padding: 0,
        margin: 0,
        cursor: "pointer",
        position: "absolute",
        top: 18,
        right: 18,
        zIndex: 10,
        ...style,
      }}
    >
      <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Çatı */}
        <polygon points="7,20 19,8 31,20" fill="#e75480" stroke="#e75480" strokeWidth="2.5" />
        {/* Gövde */}
        <rect x="11" y="20" width="16" height="12" rx="3" fill="#fff" stroke="#e75480" strokeWidth="2.5" />
        {/* Kapı */}
        <rect x="17" y="26" width="4" height="6" rx="2" fill="#e75480" />
        {/* Kalp pencere */}
        <path d="M15.5 23.5c0-1 1-2 2-2s2 1 2 2c0-1 1-2 2-2s2 1 2 2c0 2-4 4-4 4s-4-2-4-4z" fill="#e75480" />
      </svg>
    </button>
  );
}

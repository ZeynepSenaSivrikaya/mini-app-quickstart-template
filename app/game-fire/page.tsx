
"use client";


import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Types
type Fire = {
  id: number;
  x: number;
  y: number;
  hitsLeft: number;
  exploding: boolean;
};
type Explosion = {
  x: number;
  y: number;
  time: number;
};

const MAX_UNEXTINGUISHED = 10;
const WIN_SCORE = 1000;
const GAME_OVER_SCORE = -200;

export default function GameFirePage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const beaverRef = useRef<HTMLDivElement | null>(null);
  const nextId = useRef(1);
  const timers = useRef<Record<number, number>>({});
  const [fires, setFires] = useState<Fire[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [playing, setPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const INITIAL_SPAWN = 350;
  const INITIAL_LIFESPAN = 700;
  const [spawnInterval, setSpawnInterval] = useState(INITIAL_SPAWN);
  const [fireLifespan, setFireLifespan] = useState(INITIAL_LIFESPAN);
  const [elapsed, setElapsed] = useState(0);
  const difficultyTimer = useRef<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const spawnTimer = useRef<number | null>(null);

  // Helper: getBgColor
  function getBgColor() {
    // Oyun ilerledikçe arka plan rengi değişsin
    // t: 0 (başlangıç) -> 1 (son)
    const t = Math.min(1, Math.max(0, elapsed / 120000));
    let r, g, b;
    if (t < 0.7) {
      const tt = t / 0.7;
      r = Math.round(184 + (75 - 184) * tt + (34 - 75) * Math.max(0, (tt - 0.7) / 0.3));
      g = 0;
      b = Math.round(0 + (20 - 0) * tt + (10 - 20) * Math.max(0, (tt - 0.7) / 0.3));
    } else {
      const tt = (t - 0.8) / 0.2;
      r = Math.round(34 * (1 - tt));
      g = 0;
      b = Math.round(10 * (1 - tt));
    }
    let edgeBlackness = 0;
    if (score <= 0) {
      edgeBlackness = Math.min(1, Math.max(0, (0 - score) / 200));
    }
    let edgeColor;
    if (t > 0.7 || edgeBlackness > 0) {
      const base = t > 0.7 ? 0 : 184;
      const rEdge = Math.round(base * (1 - edgeBlackness));
      const gEdge = 0;
      const bEdge = Math.round(0 * (1 - edgeBlackness));
      edgeColor = `rgb(${rEdge},${gEdge},${bEdge})`;
    } else {
      edgeColor = `#b80000`;
    }
    return `radial-gradient(ellipse at center, rgb(${r},${g},${b}) 60%, ${edgeColor} 100%)`;
  }

  // Helper: clearSpawnTimer
  function clearSpawnTimer() {
    if (spawnTimer.current) {
      window.clearTimeout(spawnTimer.current);
      spawnTimer.current = null;
    }
  }

  // Helper: clearAllFireTimers
  function clearAllFireTimers() {
    Object.values(timers.current).forEach((t) => window.clearTimeout(t));
    timers.current = {};
  }

  // Helper: startSpawnTimer
  function startSpawnTimer() {
    clearSpawnTimer();
    spawnTimer.current = window.setTimeout(() => {
      spawnFire();
      if (playing) startSpawnTimer();
    }, spawnInterval);
  }

  // Helper: extinguishFire
  function extinguishFire(id: number) {
    setFires((prev) =>
      prev.map((f) =>
        f.id === id && f.hitsLeft > 0
          ? { ...f, hitsLeft: f.hitsLeft - 1 }
          : f
      )
    );
    setTimeout(() => {
      setFires((prev) => {
        const fire = prev.find((f) => f.id === id);
        if (fire && fire.hitsLeft === 0 && !fire.exploding) {
          setScore((s) => s + 10);
          return prev.filter((f) => f.id !== id);
        }
        return prev;
      });
    }, 100);
  }

  // Helper: spawnFire
  function spawnFire() {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.random() * (rect.width - 64) + 32;
    const y = Math.random() * (rect.height - 180) + 90;
    const id = nextId.current++;
    const hitsLeft = Math.floor(Math.random() * 3);
    setFires((prev) => [...prev, { id, x, y, hitsLeft, exploding: false }]);
    timers.current[id] = window.setTimeout(() => {
      setFires((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, exploding: true } : f
        )
      );
      setTimeout(() => {
        setFires((prev) => prev.filter((f) => f.id !== id));
        setExplosions((prev) => [
          ...prev,
          { x, y, time: Date.now() }
        ]);
        setScore((s) => s - 5);
        setFlash(true);
        setTimeout(() => setFlash(false), 3000);
      }, 600);
    }, fireLifespan);
  }
  // (Çift tanım kaldırıldı)

  useEffect(() => {
    if (!playing) {
      clearSpawnTimer()
      clearAllFireTimers()
      setFires([])
      return
    }
    startSpawnTimer()
    return () => {
      clearSpawnTimer()
      clearAllFireTimers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, spawnInterval, fireLifespan])

  // Oyun bitiş ve kazanma kontrolü
  function handleClickFire(e: React.MouseEvent, id: number) {
    e.stopPropagation();
    extinguishFire(id);
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100vw",
        maxWidth: 480,
        height: "100vh",
        maxHeight: 900,
        margin: "0 auto",
        background: undefined,
        backgroundImage: flash
          ? `${getBgColor()}, radial-gradient(ellipse at center, #ffd700ee 0%, #ff9800cc 30%, #ff6f00bb 45%, transparent 60%, transparent 100%)`
          : getBgColor(),
        overflow: "hidden",
        borderRadius: 18,
        boxShadow: "0 2px 24px #b8000033",
        touchAction: "manipulation",
        padding: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        transition: 'background 0.5s'
      }}
    >
      {/* Score top left */}
      <div style={{
        position: "absolute",
        top: 18,
        left: 18,
        zIndex: 10,
        background: "#fff",
        padding: "8px 18px",
        borderRadius: 10,
        fontWeight: 700,
        fontSize: 20,
        color: "#b80000",
        boxShadow: "0 2px 8px #b8000033",
        display: "flex",
        alignItems: "center",
        gap: 12
      }}>
        <span>Score: {score}</span>
      </div>

      <button
        onClick={() => {
          setShowMenu(true);
          setPlaying(false);
        }}
        style={{
          position: "absolute",
          top: 18,
          right: 18,
          zIndex: 10,
          background: "#fff",
          color: "#1e90ff",
          fontWeight: 700,
          fontSize: 22,
          border: "2px solid #1e90ff",
          borderRadius: 10,
          padding: "8px 14px",
          boxShadow: "0 2px 8px #1e90ff33",
          cursor: "pointer",
          display: "flex",
          alignItems: "center"
        }}
        aria-label="Menu"
      >
        <svg width="24" height="24" fill="none" stroke="#1e90ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 12L12 3l9 9"/><path d="M9 21V9h6v12"/></svg>
      </button>

      {/* Menu Modal */}
      {showMenu && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.18)",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }} onClick={() => setShowMenu(false)}>
          <div style={{
            background: "#fff",
            borderRadius: 18,
            boxShadow: "0 4px 24px #0002",
            padding: "32px 24px 28px 24px",
            minWidth: 220,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 22,
            position: "relative"
          }} onClick={e => e.stopPropagation()}>
            <h2 style={{ color: "#2196f3", fontWeight: 900, fontSize: 28, margin: 0, marginBottom: 10 }}>Menu</h2>
            <button onClick={() => { setShowMenu(false); setPlaying(true); }} style={{ width: 170, background: "#2196f3", color: "#fff", fontWeight: 700, fontSize: 22, border: "none", borderRadius: 12, padding: "12px 0", marginBottom: 0, cursor: "pointer", boxShadow: "0 2px 8px #2196f333" }}>Resume</button>
            <button onClick={() => { setShowMenu(false); setScore(0); setFires([]); setGameOver(false); setWin(false); setPlaying(false); setSpawnInterval(INITIAL_SPAWN); setFireLifespan(INITIAL_LIFESPAN); }} style={{ width: 170, background: "#ffe033", color: "#222", fontWeight: 700, fontSize: 22, border: "none", borderRadius: 12, padding: "12px 0", marginBottom: 0, cursor: "pointer", boxShadow: "0 2px 8px #ffe03355" }}>Restart</button>
            <button onClick={() => router.push("/")} style={{ width: 170, background: "#fff", color: "#b80000", fontWeight: 700, fontSize: 22, border: "2px solid #b80000", borderRadius: 12, padding: "12px 0", marginBottom: 0, cursor: "pointer", boxShadow: "0 2px 8px #b8000033" }}>Home</button>
          </div>
        </div>
      )}

      {/* Mobilde sadeleştirilmiş ayarlar */}
      {/* Oyun ayarları ve zorluk göstergesi kaldırıldı */}

      {/* Start ekranı */}
      {/* Game Over ekranı */}
  {gameOver && (
    <div style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "#3a001aee",
      zIndex: 30,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 18,
    }}>
      <img src="/fireandbeaver/boom.png" alt="Patlama" style={{ width: 120, height: 120, marginBottom: 18, borderRadius: "50%", boxShadow: "0 4px 24px #b8000033", animation: "boom-anim 1.2s infinite alternate" }} />
      <h2 style={{ color: "#fff", fontWeight: 900, fontSize: 32, margin: 0, marginBottom: 10, letterSpacing: 2 }}>GAME OVER</h2>
      <div style={{ color: "#fff", fontSize: 20, marginBottom: 18, textAlign: "center", maxWidth: 260 }}>
        Çok fazla ateş patladı veya skor çok düştü!<br />Skorun: <b>{score}</b>
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        <button onClick={() => {
          setScore(0);
          setFires([]);
          setGameOver(false);
          setPlaying(false);
          setSpawnInterval(INITIAL_SPAWN);
          setFireLifespan(INITIAL_LIFESPAN);
        }} style={{ fontSize: 22, padding: "12px 38px", borderRadius: 12, background: "#fff", color: "#b80000", fontWeight: 700, border: "none", boxShadow: "0 2px 8px #b8000033", marginBottom: 10 }}>Tekrar Oyna</button>
        <button onClick={() => router.push("/")} style={{ fontSize: 22, padding: "12px 38px", borderRadius: 12, background: "#fff", color: "#1e90ff", fontWeight: 700, border: "none", boxShadow: "0 2px 8px #1e90ff33", marginBottom: 10 }}>Geri Dön</button>
      </div>
    </div>
  )}
      {win && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "#e6fffaee",
          zIndex: 30,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 18,
        }}>
          <img src="/fireandbeaver/coolbeaver.png" alt="Kazandınız" style={{ width: 120, height: 120, marginBottom: 18, borderRadius: "50%", boxShadow: "0 4px 24px #1e90ff33", animation: "win-anim 1.2s infinite alternate" }} />
          <h2 style={{ color: "#1e90ff", fontWeight: 900, fontSize: 32, margin: 0, marginBottom: 10, letterSpacing: 2 }}>KAZANDINIZ!</h2>
          <div style={{ color: "#1e90ff", fontSize: 20, marginBottom: 18, textAlign: "center", maxWidth: 260 }}>
            Tebrikler, 1000 puana ulaştınız!<br />Skorunuz: <b>{score}</b>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <button onClick={() => {
              setScore(0);
              setFires([]);
              setWin(false);
              setPlaying(false);
              setSpawnInterval(INITIAL_SPAWN);
              setFireLifespan(INITIAL_LIFESPAN);
            }} style={{ fontSize: 22, padding: "12px 38px", borderRadius: 12, background: "#fff", color: "#1e90ff", fontWeight: 700, border: "none", boxShadow: "0 2px 8px #1e90ff33", marginBottom: 10 }}>Tekrar Oyna</button>
            <button onClick={() => router.push("/")} style={{ fontSize: 22, padding: "12px 38px", borderRadius: 12, background: "#fff", color: "#b80000", fontWeight: 700, border: "none", boxShadow: "0 2px 8px #b8000033", marginBottom: 10 }}>Geri Dön</button>
          </div>
        </div>
      )}
      {!playing && !gameOver && !win && !showMenu && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "#fff",
          zIndex: 20,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 18,
          boxShadow: "0 4px 24px #b8000033"
        }}>
          <img src="/fireandbeaver/coolbeaver.png" alt="Beaver" style={{ width: 120, height: 120, marginBottom: 18, borderRadius: "50%", boxShadow: "0 4px 24px #b8000033", background: "#fff" }} />
          <h2 style={{ color: "#2196f3", fontWeight: 900, fontSize: 32, margin: 0, marginBottom: 10, letterSpacing: 1 }}>Fire Extinguisher</h2>
          <div style={{ color: "#2196f3", fontSize: 18, marginBottom: 18, textAlign: "center", maxWidth: 320 }}>
            Put out the fires as quickly as you can! If fires explode, you lose points.<br /><br />
            <b>Rules:</b><br />
            Click on a fire one, two, or three times to extinguish it.<br />
            Each extinguished fire <b>+10 points</b>, each exploded fire <b>-5 points</b>.<br />
            Reach 1000 points to win.<br />
          </div>
          <div style={{ display: "flex", gap: 18, marginTop: 10 }}>
            <button onClick={() => {
              setScore(0);
              setFires([]);
              setPlaying(true);
              setGameOver(false);
              setWin(false);
              setSpawnInterval(INITIAL_SPAWN);
              setFireLifespan(INITIAL_LIFESPAN);
            }} style={{ fontSize: 22, padding: "12px 38px", borderRadius: 12, background: "#2196f3", color: "#fff", fontWeight: 700, border: "none", boxShadow: "0 2px 8px #2196f333", marginBottom: 10, cursor: "pointer" }}>Start</button>
            <button onClick={() => router.push("/")} style={{ fontSize: 22, padding: "12px 38px", borderRadius: 12, background: "#fff", color: "#b80000", fontWeight: 700, border: "2px solid #b80000", boxShadow: "0 2px 8px #b8000033", marginBottom: 10, cursor: "pointer" }}>Go Back</button>
          </div>
        </div>
      )}
        {/* beaver top center */}
        <div
          ref={beaverRef}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -54%)",
            textAlign: "center",
            pointerEvents: "none",
            width: 300,
            height: 300,
            zIndex: 1
          }}
        >
          <img src="/fireandbeaver/coolbeaver.png" alt="Kunduz" style={{ width: 300, height: 300, objectFit: "contain", boxShadow: "0 8px 32px #0003", borderRadius: "50%" }} />
        </div>

        {/* Patlama efektleri */}
        {explosions.map((ex, i) => (
          <div
            key={ex.time + '-' + i}
            style={{
              position: "absolute",
              left: ex.x - 60,
              top: ex.y - 60,
              width: 120,
              height: 120,
              pointerEvents: "none",
              zIndex: 10,
              opacity: 0.92,
              animation: "explosion-anim 0.7s linear forwards",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {/* Sarı-turuncu glow arka plan */}
            <div style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "radial-gradient(circle, #ffe066cc 0%, #ffb300bb 50%, #ff6f0088 90%)",
              filter: "blur(8px)",
              zIndex: 0,
              pointerEvents: "none"
            }} />
            <img
              src="/fireandbeaver/boom.png"
              alt="Patlama"
              style={{
                width: 110,
                height: 110,
                objectFit: "contain",
                filter: "drop-shadow(0 0 32px #ffb300) drop-shadow(0 0 64px #ff6f00)",
                borderRadius: "50%",
                zIndex: 1
              }}
            />
          </div>
        ))}

        {/* fires */}
        {fires.map((f) => (
          <div
            key={f.id}
            onClick={f.exploding ? undefined : (e) => handleClickFire(e, f.id)}
            title={f.exploding ? "Patladı!" : `${f.hitsLeft + 1} vuruş kaldı`}
            style={{
              position: "absolute",
              left: f.x - 32,
              top: f.y - 64,
              width: 64,
              height: 96,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              cursor: f.exploding ? "not-allowed" : "pointer",
              userSelect: "none",
              zIndex: 2,
              pointerEvents: f.exploding ? "none" : undefined,
              transition: f.exploding ? "transform 0.3s, opacity 0.6s" : undefined,
              transform: f.exploding ? "scale(1.3) rotate(-10deg)" : undefined,
              opacity: f.exploding ? 0.3 : 1
            }}
          >
            {f.exploding ? (
              <>
                <img src="/fireandbeaver/boom.png" alt="Boom!" style={{
                  width: 90,
                  height: 90,
                  objectFit: "contain",
                  position: "absolute",
                  left: -13,
                  top: 0,
                  zIndex: 3,
                  opacity: 0.92,
                  animation: "boom-anim 0.6s linear"
                }} />
              </>
            ) : (
              <img src="/fireandbeaver/fire.png" alt="Ateş" style={{ width: 64, height: 96, objectFit: "contain", filter: "drop-shadow(0 0 16px #ffb) drop-shadow(0 0 32px #f00)" }} />
            )}
            {!f.exploding && <div style={{
              position: "absolute",
              bottom: 8,
              left: 0,
              width: "100%",
              textAlign: "center",
              color: '#fff',
              fontWeight: 700,
              fontSize: 20,
              textShadow: '0 2px 8px #d63900, 0 0px 2px #fff'
            }}>{f.hitsLeft + 1}</div>}
          </div>
        ))}
<style>{`
@keyframes boom-anim {
  0% { opacity: 0.2; transform: scale(0.7) rotate(-10deg); }
  60% { opacity: 1; transform: scale(1.2) rotate(8deg); }
  100% { opacity: 0.1; transform: scale(1.7) rotate(-20deg); }
}
@keyframes explosion-anim {
  0% { opacity: 0.7; transform: scale(0.7); }
  60% { opacity: 1; transform: scale(1.2); }
  100% { opacity: 0; transform: scale(1.7); }
}
@keyframes boom-bg {
  0% { background: #1e90ff; }
  100% { background: #b80000; }
}
@keyframes win-anim {
  0% { opacity: 0.8; transform: scale(1) rotate(-2deg); }
  60% { opacity: 1; transform: scale(1.1) rotate(2deg); }
  100% { opacity: 0.8; transform: scale(1) rotate(-2deg); }
}
`}</style>
      </div>
  );
}

"use client";

import JumpGame from "../login/components/JumpGame";
import { useState, useRef } from "react";
import { HomeIconButton, PauseModal } from "./GameJumpUI";
import { useRouter } from "next/navigation";
export default function Page() {
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [restartKey, setRestartKey] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const router = useRouter();
  const gameOverRef = useRef(false);

  // JumpGame'a gameOver callback'i ilet
  function JumpGameWithGameOver() {
    return <JumpGame onGameOver={() => { setGameOver(true); setStarted(false); gameOverRef.current = true; }} onScoreChange={val => setScore(val)} key={restartKey} scoreInit={score} />;
  }

  return (
    <div style={{ width: 360, height: 640, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", margin: "0 auto", background: "#f8fafd", borderRadius: 18, boxShadow: "0 4px 24px #0001" }}>
      {/* Home Icon Button (top right) */}
      {started && !gameOver && !paused && (
        <HomeIconButton onClick={() => { setPaused(true); setShowMenu(true); }} />
      )}
      {/* Modern Pause Modal */}
      <PauseModal
        open={showMenu && started && !gameOver}
        onResume={() => { setPaused(false); setShowMenu(false); }}
        onRestart={() => { setShowMenu(false); setGameOver(false); setStarted(true); setRestartKey(k => k + 1); setPaused(false); setScore(0); }}
        onHome={() => { setPaused(false); setShowMenu(false); router.push("/"); }}
      />
      {!started && !gameOver && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(255,255,255,0.97)",
          zIndex: 20,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 18,
        }}>
          <img src="/bears/happy.png" alt="Happy Beaver" style={{ width: 120, height: 120, marginBottom: 18, borderRadius: "50%", boxShadow: "0 4px 24px #1e90ff33" }} />
          <h2 style={{ color: "#1e90ff", fontWeight: 900, fontSize: 28, margin: 0, marginBottom: 10 }}>Jumping Beaver</h2>
          <div style={{ color: "#1e90ff", fontSize: 18, marginBottom: 18, textAlign: "center", maxWidth: 320 }}>
            Jump as high as you can without falling off the platforms!<br /><br />
            <b>Rules:</b><br />
            Move the beaver.<br />
            Jump up by landing on platforms.<br />
            If you fall, the game is over.
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <button onClick={() => { setScore(0); setStarted(true); setRestartKey(k => k + 1); }} style={{ fontSize: 22, padding: "12px 38px", borderRadius: 12, background: "#1e90ff", color: "#fff", fontWeight: 700, border: "none", boxShadow: "0 2px 8px #1e90ff33", marginBottom: 10 }}>Start</button>
            <button onClick={() => router.push("/")} style={{ fontSize: 22, padding: "12px 38px", borderRadius: 12, background: "#fff", color: "#b80000", fontWeight: 700, border: "none", boxShadow: "0 2px 8px #b8000033", marginBottom: 10 }}>Go Back</button>
          </div>
        </div>
      )}
      {started && !gameOver && <JumpGameWithGameOver />}
      {gameOver && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(30,30,30,0.97)",
          zIndex: 30,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 18,
        }}>
          <h2 style={{ color: "#fff", fontWeight: 900, fontSize: 32, margin: 0, marginBottom: 18, letterSpacing: 2 }}>GAME OVER</h2>
          <div style={{ display: "flex", gap: 16 }}>
            <button onClick={() => { setScore(0); setGameOver(false); setStarted(true); setRestartKey(k => k + 1); }} style={{ fontSize: 22, padding: "12px 38px", borderRadius: 12, background: "#1e90ff", color: "#fff", fontWeight: 700, border: "none", boxShadow: "0 2px 8px #1e90ff33", marginBottom: 10 }}>Restart</button>
            <button onClick={() => router.push("/")} style={{ fontSize: 22, padding: "12px 38px", borderRadius: 12, background: "#fff", color: "#b80000", fontWeight: 700, border: "none", boxShadow: "0 2px 8px #b8000033", marginBottom: 10 }}>Go Back</button>
          </div>
        </div>
      )}
    </div>
  );
}

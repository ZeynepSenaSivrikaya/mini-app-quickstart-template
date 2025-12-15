
"use client";
import React, { useEffect, useRef } from "react";

// Dikey telefon formatında, sağa-sola hareket eden ve ağlayan kunduz, yaşlar ve kova
export default function CryingBeaverGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isPausedRef = useRef(false); // REF ile pause kontrolü - state yerine
  const [score, setScore] = React.useState(0);
  const [showHomeModal, setShowHomeModal] = React.useState(false);
  const [showStartModal, setShowStartModal] = React.useState(true);
  const [gameOver, setGameOver] = React.useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Boyutlar (dikey telefon)
    let width = (canvas.width = Math.min(360, window.innerWidth - 20));
    let height = (canvas.height = Math.min(640, window.innerHeight - 40));

    // Sad arka plan görseli
    const sadBg = new window.Image();
    sadBg.src = "/bears/sadbackground.avif";

    // Proportional beaver and bucket (adjusted)
    const BEAVER_WIDTH = width * 0.36; // larger beaver
    const BEAVER_ASPECT = 1.1;
    const BEAVER_HEIGHT = BEAVER_WIDTH / BEAVER_ASPECT;
    const BUCKET_WIDTH = width * 0.15; // smaller bucket
    const BUCKET_ASPECT = 1.2;
    const BUCKET_HEIGHT = BUCKET_WIDTH / BUCKET_ASPECT;
  // Block ground image
  const blockImg = new window.Image();
  blockImg.src = "/crying-beaver-game/block.png";

    // Beaver state
    const beaver = {
      x: width / 2 - BEAVER_WIDTH / 2,
      y: 48,
      w: BEAVER_WIDTH,
      h: BEAVER_HEIGHT,
      vx: (Math.random() > 0.5 ? 1 : -1) * (1.1 + Math.random() * 1.1),
      dirTimer: 0,
      dirInterval: 60 + Math.floor(Math.random() * 80),
    };

    // Bucket state
    const bucket = {
      x: width / 2 - BUCKET_WIDTH / 2,
      y: height - BUCKET_HEIGHT - 16,
      w: BUCKET_WIDTH,
      h: BUCKET_HEIGHT,
      vx: 0,
      speed: 6.5,
    };

    // Tears
    let tears: {
      x: number;
      y: number;
      vy: number;
      vx: number;
      t: number;
      phase: number;
      dirTimer: number;
      dirInterval: number;
      isLeft: boolean;
      width: number;
      height: number;
      caught: boolean;
    }[] = [];
    let tearTimer = 0;
    let localScore = 0;
    let waterLevel = 0;
    let gameOverRef = { value: false };

    // PNG assets
    const beaverImg = new window.Image();
    beaverImg.src = "/crying-beaver-game/beaver.png";
    const bucketImg = new window.Image();
    bucketImg.src = "/crying-beaver-game/bucket.png";
    // Use new tear.png for both left and right tears
    const tearImg = new window.Image();
    tearImg.src = "/crying-beaver-game/tear.png";

    // Draw beaver
    function drawBeaver(x: number, y: number, w: number, h: number) {
      if (!ctx) return;
      if (beaverImg.complete && beaverImg.naturalWidth > 0) {
        const ratio = beaverImg.naturalWidth / beaverImg.naturalHeight;
        let drawW = w, drawH = h;
        if (ratio > 1) drawH = w / ratio;
        else drawW = h * ratio;
        ctx.drawImage(beaverImg, x + (w - drawW) / 2, y + (h - drawH) / 2, drawW, drawH);
      } else {
        ctx.save();
        ctx.translate(x + w / 2, y + h / 2);
        ctx.scale(w / 48, h / 48);
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, 2 * Math.PI);
        ctx.fillStyle = "#b36b3c";
        ctx.fill();
        ctx.restore();
      }
    }

    // Draw bucket
    function drawBucket(x: number, y: number, w: number, h: number) {
      if (!ctx) return;
      if (bucketImg.complete && bucketImg.naturalWidth > 0) {
        const ratio = bucketImg.naturalWidth / bucketImg.naturalHeight;
        let drawW = w, drawH = h;
        if (ratio > 1) drawH = w / ratio;
        else drawW = h * ratio;
        ctx.drawImage(bucketImg, x + (w - drawW) / 2, y + (h - drawH) / 2, drawW, drawH);
      } else {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.fillStyle = "#90caf9";
        ctx.fill();
        ctx.strokeStyle = "#1976d2";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      }
    }

    // Draw tear (random size, swapped PNGs)
    function drawTear(x: number, y: number, w: number, h: number, phase: number, isLeft: boolean) {
        if (!ctx) return;
      if (tearImg.complete && tearImg.naturalWidth > 0) {
        // Preserve aspect ratio of tear.png
        const ratio = tearImg.naturalWidth / tearImg.naturalHeight;
        let drawW = w, drawH = h;
        if (ratio > 1) drawH = w / ratio;
        else drawW = h * ratio;
          ctx.drawImage(tearImg, x - drawW / 2, y - drawH / 2, drawW, drawH);
      } else {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(x, y, w / 2, h / 2, 0, 0, 2 * Math.PI);
        ctx.fillStyle = phase === 0 ? "#b3e5fc" : "#4fc3f7";
        ctx.fill();
        ctx.restore();
      }
    }

    // Main game loop
    function step() {
      // PAUSE KONTROLÜ - Eğer oyun durdurulmuşsa hiçbir şey güncelleme
      if (isPausedRef.current) {
        requestAnimationFrame(step);
        return;
      }
      
      // Beaver movement
      beaver.x += beaver.vx;
      beaver.dirTimer++;
      // Clamp beaver inside game area
      if (beaver.x < 0) {
        beaver.x = 0;
        beaver.vx = Math.abs(beaver.vx);
      }
      if (beaver.x + beaver.w > width) {
        beaver.x = width - beaver.w;
        beaver.vx = -Math.abs(beaver.vx);
      }
      // Randomly change beaver direction
      if (beaver.dirTimer > beaver.dirInterval) {
        beaver.vx = (Math.random() > 0.5 ? 1 : -1) * (1.1 + Math.random() * 1.1);
        beaver.dirTimer = 0;
        beaver.dirInterval = 60 + Math.floor(Math.random() * 80);
      }
      // Clamp beaver speed
      if (beaver.vx > 2.2) beaver.vx = 2.2;
      if (beaver.vx < -2.2) beaver.vx = -2.2;

      // Bucket movement
      bucket.x += bucket.vx;
      if (bucket.x < 0) bucket.x = 0;
      if (bucket.x + bucket.w > width) bucket.x = width - bucket.w;

      // Tear spawn (make tears larger) - spawn more tears as water rises
        // Stop spawning tears when game is over
        if (!gameOverRef.value) {
          tearTimer++;
          // Calculate spawn rate based on water level (lower spawn interval = more tears)
          const waterPercentage = waterLevel / (height * 1.2);
          const baseSpawnInterval = 55;
          const spawnInterval = Math.max(25, baseSpawnInterval - (waterPercentage * 30));
          
          if (tearTimer > spawnInterval) {
            const tearW1 = 32 + Math.random() * 22; // larger min/max
            const tearH1 = tearW1 * 0.8;
            const tearW2 = 32 + Math.random() * 22;
            const tearH2 = tearW2 * 0.8;
            tears.push({
              x: beaver.x + beaver.w * 0.28,
              y: beaver.y + beaver.h * 0.38,
              vy: 2.2 + Math.random() * 1.5,
              vx: (Math.random() - 0.5) * 1.2,
              t: 0,
              phase: 0,
              caught: false,
              dirTimer: 0,
              dirInterval: 10 + Math.floor(Math.random() * 18),
              isLeft: true,
              width: tearW1,
              height: tearH1,
            });
            tears.push({
              x: beaver.x + beaver.w * 0.72,
              y: beaver.y + beaver.h * 0.38,
              vy: 2.2 + Math.random() * 1.5,
              vx: (Math.random() - 0.5) * 1.2,
              t: 0,
              phase: 0,
              caught: false,
              dirTimer: 0,
              dirInterval: 10 + Math.floor(Math.random() * 18),
              isLeft: false,
              width: tearW2,
              height: tearH2,
            });
            tearTimer = 0;
          }
        }

      // Move tears (up then down, random drift)
      for (const tear of tears) {
        if (!tear.caught) {
          tear.t++;
          // Random drift
          tear.dirTimer++;
          if (tear.dirTimer > tear.dirInterval) {
            tear.vx += (Math.random() - 0.5) * 0.8;
            if (tear.vx > 1.2) tear.vx = 1.2;
            if (tear.vx < -1.2) tear.vx = -1.2;
            tear.dirTimer = 0;
            tear.dirInterval = 10 + Math.floor(Math.random() * 18);
          }
          if (tear.t < 12) {
            tear.y -= 1.2;
            tear.x += tear.vx * 0.5;
            tear.phase = 0;
          } else {
            tear.y += tear.vy;
            tear.x += tear.vx;
            tear.phase = 1;
          }
        }
        // Collision with bucket
        if (
          !tear.caught &&
          tear.y + tear.height / 2 > bucket.y &&
          tear.x > bucket.x &&
          tear.x < bucket.x + bucket.w
        ) {
          tear.caught = true;
          localScore++;
          setScore(localScore);
        }
      }
      // Check for newly missed tears and update water level
      for (const tear of tears) {
        if (!tear.caught && tear.y >= height && !('alreadyCounted' in tear)) {
          (tear as any).alreadyCounted = true;
          // Each missed tear increases water level
          waterLevel = Math.min(height * 1.2, waterLevel + 12);
        }
      }

      // Remove out-of-bounds or caught tears
      tears = tears.filter((t) => t.y < height && !t.caught);

      // Check game over condition (water reaches beaver's neck)
      // Beaver is at position beaver.y, and neck is roughly at beaver.y + beaver.h * 0.25
      // Water fills from bottom, so if waterLevel is high enough to cover the neck area
      const beaverNeckY = beaver.y + beaver.h * 0.3;
      const waterSurfaceY = height - waterLevel;
      
      // Game over when water surface goes above beaver's neck (with some margin)
      if (waterSurfaceY < beaverNeckY && !gameOverRef.value) {
        gameOverRef.value = true;
        setGameOver(true);
      }

      // Draw
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      // Arka plan görseli (sadbackground.avif) orijinal oranında, ortalanmış şekilde
      if (sadBg.complete && sadBg.naturalWidth > 0 && sadBg.naturalHeight > 0) {
        const imgRatio = sadBg.naturalWidth / sadBg.naturalHeight;
        const canvasRatio = width / height;
        let drawW = width, drawH = height, dx = 0, dy = 0;
        if (imgRatio > canvasRatio) {
          // Görsel daha geniş: yükseklik tam, genişlik taşarsa ortala
          drawH = height;
          drawW = height * imgRatio;
          dx = (width - drawW) / 2;
        } else {
          // Görsel daha dar: genişlik tam, yükseklik taşarsa ortala
          drawW = width;
          drawH = width / imgRatio;
          dy = (height - drawH) / 2;
        }
        ctx.drawImage(sadBg, dx, dy, drawW, drawH);
      } else {
        ctx.fillStyle = "#b3e5c7"; // fallback background color
        ctx.fillRect(0, 0, width, height);
      }
      // Draw ground block at the bottom
      // Sadece kunduzun ayağının altına, orijinal boyutunda ve ortalanmış olarak çim bloğu koy
      // Kunduzun ayağının altına arka planla uyumlu yarı saydam koyu bir platform (gölge/zemin efekti) ekle
      {
        const platW = beaver.w * 0.85;
        const platH = beaver.h * 0.18;
        const platX = beaver.x + beaver.w / 2 - platW / 2;
        const platY = beaver.y + beaver.h - platH * 0.3;
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.ellipse(platX + platW / 2, platY + platH / 2, platW / 2, platH / 2, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
      }
      drawBeaver(beaver.x, beaver.y, beaver.w, beaver.h);
      for (const tear of tears) drawTear(tear.x, tear.y, tear.width, tear.height, tear.phase, tear.isLeft);
      drawBucket(bucket.x, bucket.y, bucket.w, bucket.h);
      
      // Draw water level
      if (waterLevel > 0) {
        ctx.fillStyle = 'rgba(0, 150, 255, 0.3)';
        ctx.fillRect(0, height - waterLevel, width, waterLevel);
        // Water surface line
        ctx.strokeStyle = 'rgba(0, 100, 200, 0.6)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, height - waterLevel);
        ctx.lineTo(width, height - waterLevel);
        ctx.stroke();
      }
      
      ctx.fillStyle = "#1976d2";
      ctx.font = "18px sans-serif";
      ctx.fillText(`Collected Tears: ${localScore}`, 10, 30);
      requestAnimationFrame(step);
    }
    step();

    // Keyboard controls
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") bucket.vx = -bucket.speed;
      else if (e.key === "ArrowRight") bucket.vx = bucket.speed;
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") bucket.vx = 0;
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);

    // Touch controls for mobile
    function onTouch(e: TouchEvent) {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      if (x < width / 2) {
        bucket.vx = -bucket.speed;
      } else {
        bucket.vx = bucket.speed;
      }
    }
    function onTouchEnd() {
      bucket.vx = 0;
    }
    canvas.addEventListener("touchstart", onTouch);
    canvas.addEventListener("touchmove", onTouch);
    canvas.addEventListener("touchend", onTouchEnd);

    // Responsive
    function resize() {
      width = canvas.width = Math.min(360, window.innerWidth - 20);
      height = canvas.height = Math.min(640, window.innerHeight - 40);
    }
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("touchstart", onTouch);
      canvas.removeEventListener("touchmove", onTouch);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", padding: 8 }}>
      {/* Start modal */}
      {showStartModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.8)" }}>
          <div style={{ background: "#fff", borderRadius: 24, boxShadow: "0 8px 32px #0004", padding: 28, display: "flex", flexDirection: "column", alignItems: "center", gap: 18, width: 320, maxWidth: "95vw", aspectRatio: '9/16', minHeight: 420, justifyContent: 'center' }}>
            <img src="/crying-beaver-game/beaver.png" alt="Crying Beaver" style={{ width: 100, height: 100, borderRadius: "50%", marginBottom: 8, boxShadow: "0 2px 12px #0001" }} />
            <div style={{ fontSize: 28, fontWeight: 700, color: "#1976d2", marginBottom: 8, textAlign: 'center' }}>Crying Beaver</div>
            <div style={{ color: "#1976d2", fontSize: 17, textAlign: "center", marginBottom: 8, fontWeight: 500 }}>
              Catch as many tears as you can with the bucket!<br/>
              But beware - missed tears raise the water level!<br/>
            </div>
            <div style={{ color: "#334155", fontSize: 16, textAlign: "center", marginBottom: 10, lineHeight: 1.5 }}>
              <b style={{ color: '#1976d2' }}>Rules:</b><br/>
              Move the bucket left and right.<br/>
              Collect falling tears.<br/>
              If the water rises too high, you'll drown!<br/>
            </div>
            <div style={{ display: 'flex', gap: 16, width: '100%', marginTop: 8, justifyContent: 'center' }}>
              <button
                style={{ flex: 1, padding: "14px 0", background: "#1976d2", color: "#fff", borderRadius: 12, fontWeight: 700, fontSize: 20, border: "none", cursor: "pointer", letterSpacing: 1, boxShadow: '0 2px 8px #1976d233' }}
                onClick={() => setShowStartModal(false)}
              >Start</button>
              <button
                style={{ flex: 1, padding: "14px 0", background: "#fff", color: "#b80000", borderRadius: 12, fontWeight: 700, fontSize: 20, border: "2px solid #b80000", cursor: "pointer", letterSpacing: 1, boxShadow: '0 2px 8px #b8000033' }}
                onClick={() => window.location.href = "/"}
              >Go Back</button>
            </div>
          </div>
        </div>
      )}
      {/* Home icon top-right */}
      <div style={{ position: "absolute", top: 16, right: 16, zIndex: 30 }}>
        <button
          onClick={() => { isPausedRef.current = true; setShowHomeModal(true); }}
          style={{ background: "#fff", color: "#1e293b", borderRadius: 9999, width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px #0002", border: "none", cursor: "pointer" }}
          aria-label="Home"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 28, height: 28 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-7.5L21 12M4.5 10.5V19a1.5 1.5 0 001.5 1.5h3.75m6 0H18a1.5 1.5 0 001.5-1.5v-8.5" />
          </svg>
        </button>
      </div>
      {/* Home modal */}
      {showHomeModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 40, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)" }}>
          <div style={{ background: "#fff", borderRadius: 24, boxShadow: "0 8px 32px #0004", padding: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 24, minWidth: 260, maxWidth: "90vw" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>Game Paused</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
              <button
                style={{ width: "100%", padding: "12px 0", background: "#f59e42", color: "#fff", borderRadius: 12, fontWeight: 600, fontSize: 18, border: "none", marginBottom: 8, cursor: "pointer" }}
                onClick={() => { isPausedRef.current = false; setShowHomeModal(false); }}
              >Resume Game</button>
              <button
                style={{ width: "100%", padding: "12px 0", background: "#e5e7eb", color: "#1e293b", borderRadius: 12, fontWeight: 600, fontSize: 18, border: "none", marginBottom: 8, cursor: "pointer" }}
                onClick={() => { 
                  setScore(0); 
                  isPausedRef.current = false; 
                  setShowHomeModal(false); 
                  setGameOver(false);
                  window.location.reload(); // Oyunu tamamen yeniden başlat
                }}
              >Restart Game</button>
              <button
                style={{ width: "100%", padding: "12px 0", background: "#06b6d4", color: "#fff", borderRadius: 12, fontWeight: 600, fontSize: 18, border: "none", marginBottom: 8, cursor: "pointer" }}
                onClick={() => { window.location.href = "/"; }}
              >Return to Menu</button>
            </div>
          </div>
        </div>
      )}
      {/* Game Over modal */}
      {gameOver && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(100, 150, 255, 0.6)" }}>
          <div style={{ background: "#fff", borderRadius: 24, boxShadow: "0 8px 32px #0004", padding: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 24, minWidth: 280, maxWidth: "90vw" }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#b80000", marginBottom: 8 }}>Drowned! 😵</div>
            <div style={{ fontSize: 18, color: "#666", marginBottom: 16 }}>The water rose too high...</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: "#1976d2", marginBottom: 16 }}>Final Score: {score}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
              <button
                style={{ width: "100%", padding: "14px 0", background: "#FFD700", color: "#000", borderRadius: 12, fontWeight: 600, fontSize: 18, border: "none", cursor: "pointer" }}
                onClick={() => { setScore(0); setGameOver(false); window.location.reload(); }}
              >Try Again</button>
              <button
                style={{ width: "100%", padding: "14px 0", background: "#b80000", color: "#fff", borderRadius: 12, fontWeight: 600, fontSize: 18, border: "none", cursor: "pointer" }}
                onClick={() => { window.location.href = "/"; }}
              >Go Home</button>
            </div>
          </div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        style={{
          borderRadius: 16,
          boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
          touchAction: "none",
          background: "#e3f2fd",
          filter: showStartModal ? 'blur(2px)' : 'none',
          pointerEvents: showStartModal ? 'none' : 'auto',
        }}
      />
      <div style={{ fontWeight: 600, fontSize: 18, marginTop: 8 }}>Collected Tears: {score}</div>
    </div>
  );
}



"use client";
import React, { useEffect, useRef } from "react";

// Klasik Doodle Jump tarzı, zıplayan kunduz ve çim platformlar
type JumpGameProps = {
  grassSrc?: string;
  beaverSrc?: string;
  onGameOver?: () => void;
  onScoreChange?: (score: number) => void;
  scoreInit?: number;
};

function JumpGame({
  grassSrc = "/games/grass.png",
  beaverSrc = "/games/beaver.png",
  onGameOver,
  onScoreChange,
  scoreInit = 0,
}: JumpGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Touch hareketleri için değişkenler
      let touchStartX: number | null = null;

      let width = (canvas.width = 360);
      let height = (canvas.height = 640);

      // Karakter
      const player = {
        x: width / 2 - 24,
        y: height - 60,
        w: 48,
        h: 48,
        vy: -10,
        vx: 0,
      };
      let lastSafePosition = { x: player.x, y: player.y };
      let gravity = 0.4;
      let jumpImpulse = -10;
      let platformGap = 80;
      let difficultyIncreased = false;

      // Canlar
      let lives = 3;

      // Platformlar
      // İlk platformu kunduzun tam altına yerleştir, diğerlerini rastgele dağıt
      let platforms = [
        {
          x: width / 2 - 30, // kunduzun tam altı (kunduz 48px, platform 60px)
          y: height - 12,    // kunduzun alt kenarına yakın
          w: 60,
          h: 16,
        },
        // Diğer platformlar rastgele
        ...Array.from({ length: 7 }, (_, i) => ({
          x: Math.random() * (width - 60),
          y: height - (i + 1) * 80 - 40,
          w: 60,
          h: 16,
        }))
      ];

      // Score başlat
      let jumpedPlatformCount = scoreInit || 0;

    // Görseller
    const grassImg = new window.Image();
    grassImg.src = grassSrc;
    const beaverImg = new window.Image();
    beaverImg.src = beaverSrc;

    // Kunduz PNG yoksa SVG ile çiz
    function drawBeaver(x: number, y: number, w: number, h: number) {
      if (!ctx) return;
      if (beaverImg.complete && beaverImg.naturalWidth > 0) {
        ctx.drawImage(beaverImg, x, y, w, h);
      } else {
        ctx.save();
        ctx.translate(x + w / 2, y + h / 2);
        ctx.scale(w / 48, h / 48);
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, 2 * Math.PI);
        ctx.fillStyle = "#b36b3c";
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-8, -6, 6, 8, 0, 0, 2 * Math.PI);
        ctx.ellipse(8, -6, 6, 8, 0, 0, 2 * Math.PI);
        ctx.fillStyle = "#000";
        ctx.fill();
        ctx.beginPath();
        ctx.rect(-8, 10, 16, 8);
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.restore();
      }
    }

    // Platform çiz
    function drawPlatform(p: { x: number; y: number; w: number; h: number }) {
      if (!ctx) return;
      if (grassImg.complete && grassImg.naturalWidth > 0) {
        ctx.drawImage(grassImg, p.x, p.y, p.w, 20);
      } else {
        ctx.fillStyle = "#4caf50";
        ctx.fillRect(p.x, p.y, p.w, p.h);
      }
    }

    // Oyun döngüsü
  let lastPlatformY = player.y;
  // let jumpedPlatformCount = 0; // Atlanan platform sayısı (Score olarak kullanılacak)
    let gameOver = false;

    function step() {
      // Fizik
      player.vy += gravity;
      player.y += player.vy;
      player.x += player.vx;

      // Kenardan çıkarsa diğer tarafa geç
      if (player.x < -player.w) player.x = width;
      if (player.x > width) player.x = -player.w;

      // Platforma çarpma (sadece aşağı inerken)
      let touchedPlatform = false;
      for (const p of platforms) {
        if (
          player.vy > 0 &&
          player.x + player.w > p.x &&
          player.x < p.x + p.w &&
          player.y + player.h > p.y &&
          player.y + player.h < p.y + p.h + 16
        ) {
          player.y = p.y - player.h;
          player.vy = jumpImpulse;
          touchedPlatform = true;
          // Her platforma ilk temasında sayaç artır
          if (!(p as any)._jumped) {
            jumpedPlatformCount++;
            (p as any)._jumped = true;
          }
        }
      }
      // Son güvenli konumu kaydet (platforma değdiyse)
      if (touchedPlatform) {
        lastSafePosition = { x: player.x, y: player.y };
      }

      // Kamera yukarı takip
      if (player.y < height / 2) {
        const diff = height / 2 - player.y;
        player.y = height / 2;
        for (const p of platforms) p.y += diff;
        // Yükseldikçe güvenli konumu güncelle
        lastSafePosition = { x: player.x, y: player.y };
      }

      // Her 25 blokta bir zorluk artır
      if (jumpedPlatformCount > 0 && jumpedPlatformCount % 25 === 0) {
        // Zorluk seviyesini blok sayısına göre artır
        gravity = 0.4 + 0.1 * Math.floor(jumpedPlatformCount / 25);
        jumpImpulse = -10 - Math.floor(jumpedPlatformCount / 25);
        platformGap = 80 + 10 * Math.floor(jumpedPlatformCount / 25);
      }

      // Platformları yenile
      platforms = platforms.filter((p) => p.y < height + 40);
      while (platforms.length < 8) {
        const lastY = Math.min(...platforms.map((p) => p.y));
        platforms.push({
          x: Math.random() * (width - 60),
          y: lastY - platformGap,
          w: 60,
          h: 16,
        });
      }

      // Yere düştü mü?
      if (player.y > height) {
        lives--;
        if (lives > 0) {
          // Kunduzu son güvenli konuma döndür
          player.x = lastSafePosition.x;
          player.y = lastSafePosition.y;
          player.vy = 0;
          player.vx = 0;
        } else {
          gameOver = true;
        }
      }

      // Çizim
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      // Arka planı şeffaf bırak, sadece platform ve karakter çiz
      for (const p of platforms) drawPlatform(p);
      drawBeaver(player.x, player.y, player.w, player.h);
      // Score (sol üst): Atlanan blok sayısı
      ctx.fillStyle = "#1976d2";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`Score: ${jumpedPlatformCount}`, 10, 24);
      ctx.textAlign = "left";
      // Lives (top center)
      ctx.font = "24px sans-serif";
      ctx.fillStyle = "#e53935";
      let heart = "\u2665"; // ♥
      let livesText = Array(lives).fill(heart).join(" ");
      ctx.textAlign = "center";
      ctx.fillText(livesText, width / 2, 36);
      ctx.textAlign = "left";
      if (gameOver) {
        ctx.fillStyle = "#fff";
        ctx.font = "bold 32px sans-serif";
        ctx.fillText("GAME OVER", width / 2 - 100, height / 2);
        if (onGameOver) setTimeout(onGameOver, 100); // Birkaç frame sonra çağır
        return;
      }
      requestAnimationFrame(step);
    }
    step();

    // Klavye ile sağ/sol hareket
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") player.vx = -4;
      else if (e.key === "ArrowRight") player.vx = 4;
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") player.vx = 0;
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);

    // Mobil: parmak hareketiyle sağ/sol hareket
    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
      }
    }
    function onTouchMove(e: TouchEvent) {
      if (touchStartX === null) return;
      const dx = e.touches[0].clientX - touchStartX;
      if (Math.abs(dx) > 20) {
        if (dx > 0) player.vx = 4;
        else player.vx = -4;
      }
    }
    function onTouchEnd(e: TouchEvent) {
      player.vx = 0;
      touchStartX = null;
    }
    canvas.addEventListener("touchstart", onTouchStart);
    canvas.addEventListener("touchmove", onTouchMove);
    canvas.addEventListener("touchend", onTouchEnd);

    // Responsive
    function resize() {
      width = canvas.width = Math.min(390, window.innerWidth - 40);
      height = canvas.height = Math.min(700, window.innerHeight - 120);
    }
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
    };
  }, [grassSrc, beaverSrc]);

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 8, position: "relative" }}>
      {/* Bulutlu arka plan */}
      <img
        src="/jumpingbeaver/clouds.png"
        alt="Clouds"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
          borderRadius: 16,
          pointerEvents: "none",
          userSelect: "none"
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          borderRadius: 16,
          boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
          touchAction: "none",
          position: "relative",
          zIndex: 1
        }}
      />
    </div>
  );
}

export default JumpGame;

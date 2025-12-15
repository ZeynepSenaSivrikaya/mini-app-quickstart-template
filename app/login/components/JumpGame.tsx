

"use client";
import React, { useEffect, useRef } from "react";

// Klasik Doodle Jump tarzı, zıplayan kunduz ve çim platformlar
function JumpGame({
  grassSrc = "/games/grass.png",
  beaverSrc = "/games/beaver.png",
}: {
  grassSrc?: string;
  beaverSrc?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = Math.min(390, window.innerWidth - 40));
    let height = (canvas.height = Math.min(700, window.innerHeight - 120));

    // Karakter
    const player = {
      x: width / 2 - 24,
      y: height - 60,
      w: 48,
      h: 48,
      vy: -10,
      vx: 0,
    };
    const gravity = 0.4;
    const jumpImpulse = -10;

    // Platformlar
    let platforms = Array.from({ length: 8 }, (_, i) => ({
      x: Math.random() * (width - 60),
      y: height - i * 80 - 40,
      w: 60,
      h: 16,
    }));

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
    let score = 0;
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
        }
      }

      // Kamera yukarı takip
      if (player.y < height / 2) {
        const diff = height / 2 - player.y;
        player.y = height / 2;
        for (const p of platforms) p.y += diff;
        score += Math.floor(diff);
      }

      // Platformları yenile
      platforms = platforms.filter((p) => p.y < height + 40);
      while (platforms.length < 8) {
        const lastY = Math.min(...platforms.map((p) => p.y));
        platforms.push({
          x: Math.random() * (width - 60),
          y: lastY - 80,
          w: 60,
          h: 16,
        });
      }

      // Kaybettin mi?
      if (player.y > height) gameOver = true;

      // Çizim
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#a8e6cf";
      ctx.fillRect(0, 0, width, height);
      for (const p of platforms) drawPlatform(p);
      drawBeaver(player.x, player.y, player.w, player.h);
      ctx.fillStyle = "#222";
      ctx.font = "16px sans-serif";
      ctx.fillText(`Skor: ${score}`, 10, 24);
      if (gameOver) {
        ctx.fillStyle = "#fff";
        ctx.font = "bold 32px sans-serif";
        ctx.fillText("Oyun Bitti", width / 2 - 80, height / 2);
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
    };
  }, [grassSrc, beaverSrc]);

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 8 }}>
      <canvas
        ref={canvasRef}
        style={{
          borderRadius: 16,
          boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
          touchAction: "none",
        }}
      />
    </div>
  );
}

export default JumpGame;

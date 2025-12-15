"use client";
import React, { useRef, useEffect, useState } from "react";

// --- Oyun Sabitleri ---
const CANVAS_W = 400;
const CANVAS_H = 700;
const BEAVER_Y = CANVAS_H - 100;
const ARROW_SPEED = 12;
const TARGET_RADIUS = 32;
const GAME_TIME = 30; // saniye

// --- Tipler ---
type Arrow = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  power: number;
  active: boolean;
};

type TargetType = "lover" | "broken" | "bonus" | "timer";

type Target = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: TargetType;
  radius: number;
  hit: boolean;
};

// --- Yardımcılar ---
function randomTarget(id: number, level: number): Target {
  // Hedef türü ve hızını seviyeye göre belirle
  const tRand = Math.random();
  let type: TargetType = "lover";
  if (tRand < 0.12) type = "broken";
  else if (tRand > 0.98) type = "timer"; // çok nadir
  else if (tRand > 0.92) type = "bonus";
  const y = 80 + Math.random() * 220;
  const vx = (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * (2 + level * 0.5));
  return {
    id,
    x: Math.random() * (CANVAS_W - 2 * TARGET_RADIUS) + TARGET_RADIUS,
    y,
    vx,
    vy: 0,
    type,
    radius: TARGET_RADIUS + (type === "lover" ? Math.random() * 12 : 0),
    hit: false,
  };
}

function getArrowColor(): string {
  return "#e75480";
}

function getTargetColor(type: TargetType): string {
  if (type === "lover") return "#ffb6c1";
  if (type === "broken") return "#b71c1c";
  if (type === "bonus") return "gold";
  if (type === "timer") return "#6ec6ff";
  return "#ccc";
}

// --- Ana Component ---
export default function LoveGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const beaverImgRef = useRef<HTMLImageElement | null>(null);
  const brokenHeartImgRef = useRef<HTMLImageElement | null>(null);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [energy, setEnergy] = useState(100);
  const [timer, setTimer] = useState(GAME_TIME);
  const [charging, setCharging] = useState(false);
  const [chargeStart, setChargeStart] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [powerUp, setPowerUp] = useState<string | null>(null);
  const [wind, setWind] = useState(0);
  const [beaverX, setBeaverX] = useState(CANVAS_W / 2);
  const [arrowAnim, setArrowAnim] = useState(false);
  const [effect, setEffect] = useState<{x:number,y:number,type:string}|null>(null);
  const [lastHitType, setLastHitType] = useState<TargetType|null>(null);

  // --- Oyun Başlat ---
  useEffect(() => {
    if (gameOver) return;
    setTargets(Array.from({length: 4}, (_,i) => randomTarget(i, level)));
    setArrows([]);
    setCombo(0);
    setEnergy(100);
    setTimer(GAME_TIME);
    setPowerUp(null);
    setWind((Math.random()-0.5)*4);
    setBeaverX(CANVAS_W/2);
    setArrowAnim(false);
    setEffect(null);
    setLastHitType(null);
    // eslint-disable-next-line
  }, [gameOver, level]);

  // --- Zamanlayıcı ---
  useEffect(() => {
    if (gameOver) return;
    if (timer <= 0) { setGameOver(true); return; }
    const t = setInterval(() => setTimer(ti => ti-1), 1000);
    return () => clearInterval(t);
  }, [timer, gameOver]);

  // --- Hedefleri ve Okları Güncelle ---
  useEffect(() => {
    if (gameOver) return;
    const anim = setInterval(() => {
      setTargets(ts => ts.map(t => {
        let nx = t.x + t.vx + wind;
        if (nx < t.radius || nx > CANVAS_W-t.radius) t.vx *= -1;
        return {...t, x: Math.max(t.radius, Math.min(CANVAS_W-t.radius, nx))};
      }));
      setArrows(arrs => arrs.map(a => ({...a, x: a.x + a.vx + wind, y: a.y + a.vy}))
        .filter(a => a.y > -40 && a.active));
    }, 16);
    return () => clearInterval(anim);
  }, [gameOver, wind]);

  // --- Çarpışma ve Skor ---
  useEffect(() => {
    if (gameOver) return;
    setArrows(arrs => arrs.map(a => {
      for (const t of targets) {
        if (!t.hit && Math.hypot(a.x-t.x, a.y-t.y) < t.radius) {
          t.hit = true;
          setLastHitType(t.type);
          setEffect({x:t.x, y:t.y, type:t.type});
          if (t.type === "lover") {
            setScore(s=>s+10);
            setCombo(c=>c+1);
          } else if (t.type === "bonus") {
            setScore(s=>s+50);
            setEffect({x:t.x, y:t.y, type:"bonus"});
          } else if (t.type === "timer") {
            setTimer(tm=>tm+5);
          } else if (t.type === "broken") {
            setCombo(0);
            setEnergy(e=>Math.max(0,e-30));
          }
          a.active = false;
        }
      }
      return a;
    }));
    // Yeni hedefler
    setTargets(ts => ts.map(t => t.hit ? randomTarget(Math.random()*10000, level) : t));
    // Zorluk artışı
    if (score > 0 && score % 100 === 0) setLevel(l=>l+1);
    // Enerji biterse oyun biter
    if (energy <= 0) setGameOver(true);
    // Combo efekti
    if (combo > 0 && combo % 5 === 0) setEffect({x:CANVAS_W/2, y:60, type:"combo"});
    // eslint-disable-next-line
  }, [arrows, targets]);

  // --- Canvas Çizimi ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0,0,CANVAS_W,CANVAS_H);
    // Arka plan
    ctx.fillStyle = "#f7eaff";
    ctx.fillRect(0,0,CANVAS_W,CANVAS_H);
    // Bulutlar
    for(let i=0;i<4;i++){
      ctx.save();
      ctx.globalAlpha=0.15;
      ctx.beginPath();
      ctx.arc(60+i*90,60+20*Math.sin(i),40+10*Math.cos(i),0,2*Math.PI);
      ctx.fillStyle="#fff";
      ctx.fill();
      ctx.restore();
    }
    // Hedefler
    for(const t of targets){
      ctx.save();
      if(t.type!=="broken") {
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius, 0, 2*Math.PI);
        ctx.fillStyle = getTargetColor(t.type);
        ctx.shadowColor = t.type==="bonus"?"gold":"#e75480";
        ctx.shadowBlur = t.type==="bonus"?20:0;
        ctx.fill();
      }
      ctx.restore();
      // Hedef tipi simgesi veya görseli
      ctx.save();
      if(t.type==="lover") {
        ctx.font = "bold 22px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("💑", t.x, t.y);
      }
      if(t.type==="bonus") {
        ctx.font = "bold 22px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("💛", t.x, t.y);
      }
      if(t.type==="timer") {
        ctx.font = "bold 22px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("⏰", t.x, t.y);
      }
      if(t.type==="broken") {
        const img = brokenHeartImgRef.current;
        if (img && img.complete) {
          const scale = 0.5;
          const w = img.width * scale;
          const h = img.height * scale;
          ctx.drawImage(img, t.x - w/2, t.y - h/2, w, h);
        } else if (img) {
          img.onload = () => {
            if (!ctx) return;
            const scale = 0.5;
            const w = img.width * scale;
            const h = img.height * scale;
            ctx.drawImage(img, t.x - w/2, t.y - h/2, w, h);
          };
        }
      }
      ctx.restore();
    }
    // Oklar
    for(const a of arrows){
      if(!a.active) continue;
      ctx.save();
      ctx.strokeStyle = getArrowColor();
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(a.x, a.y-32);
      ctx.stroke();
      ctx.font = "20px sans-serif";
      ctx.fillText("🏹", a.x, a.y-20);
      ctx.restore();
    }
    // Beaver görseli (%10 boyutunda, orantılı)
    const img = beaverImgRef.current;
    if (img && img.complete) {
      const scale = 0.10; // %10 boyut
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      ctx.drawImage(img, beaverX - drawW / 2, BEAVER_Y - drawH / 2, drawW, drawH);
    }
    // Enerji barı
    ctx.save();
    ctx.fillStyle = "#b71c1c";
    ctx.globalAlpha = 0.18;
    ctx.fillRect(20, CANVAS_H-30, 120, 16);
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = "#e75480";
    ctx.fillRect(20, CANVAS_H-30, 120*energy/100, 16);
    ctx.restore();
    // Skor, zaman, combo
    ctx.save();
    ctx.font = "bold 22px sans-serif";
    ctx.fillStyle = "#e75480";
    ctx.fillText(`Skor: ${score}`, 20, 36);
    ctx.fillText(`⏰ ${timer}s`, CANVAS_W-80, 36);
    if(combo>1) ctx.fillText(`🔥 Combo x${combo}`, CANVAS_W/2, 36);
    ctx.restore();
    // Efektler
    if(effect){
      ctx.save();
      if(effect.type==="bonus"){
        ctx.font = "bold 32px sans-serif";
        ctx.fillStyle = "gold";
        ctx.fillText("+50!", effect.x, effect.y-40);
      } else if(effect.type==="combo"){
        ctx.font = "bold 32px sans-serif";
        ctx.fillStyle = "#e75480";
        ctx.fillText("COMBO!", effect.x, effect.y);
      } else if(effect.type==="broken"){
        ctx.font = "bold 28px sans-serif";
        ctx.fillStyle = "#b71c1c";
        ctx.fillText("Oops!", effect.x, effect.y-40);
      }
      ctx.restore();
    }
    // Rüzgar göstergesi
    ctx.save();
    ctx.font = "18px sans-serif";
    ctx.fillStyle = "#6ec6ff";
    ctx.fillText(`Rüzgar: ${wind>0?"→":"←"} ${Math.abs(wind).toFixed(1)}`, CANVAS_W-90, CANVAS_H-20);
    ctx.restore();
    // Game over
    if(gameOver){
      ctx.save();
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, CANVAS_H/2-80, CANVAS_W, 160);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#e75480";
      ctx.font = "bold 32px sans-serif";
      ctx.fillText("Oyun Bitti!", CANVAS_W/2, CANVAS_H/2-10);
      ctx.font = "bold 22px sans-serif";
      ctx.fillText(`Skorun: ${score}`, CANVAS_W/2, CANVAS_H/2+32);
      ctx.restore();
    }
  }, [arrows, targets, score, combo, energy, timer, gameOver, effect, wind, beaverX]);

  // --- Kontroller: Basılı tut/çek ---
  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (gameOver) return;
    setCharging(true);
    setChargeStart(Date.now());
  }
  function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (gameOver || !charging || chargeStart === null) return;
    setCharging(false);
    const duration = Math.min(1200, Date.now() - chargeStart);
    const power = 0.5 + duration / 1200;
    // Okun yönü ve gücü
    setArrows(arrs => [
      ...arrs,
      {
        x: beaverX,
        y: BEAVER_Y-32,
        vx: wind*0.5,
        vy: -ARROW_SPEED*power,
        power,
        active: true,
      },
    ]);
    setArrowAnim(true);
    setTimeout(()=>setArrowAnim(false), 200);
  }
  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (gameOver) return;
    // Mobilde nişan için X eksenini takip et
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    let x = e.clientX - rect.left;
    x = Math.max(40, Math.min(CANVAS_W-40, x));
    setBeaverX(x);
  }
  function handleRestart() {
    setScore(0);
    setCombo(0);
    setEnergy(100);
    setTimer(GAME_TIME);
    setLevel(1);
    setGameOver(false);
    setPowerUp(null);
    setWind((Math.random()-0.5)*4);
    setEffect(null);
  }

  useEffect(() => {
    if (!beaverImgRef.current) {
      const img = new window.Image();
      img.src = "/love%20game/asktanrisibeaver.png";
      beaverImgRef.current = img;
    }
  }, []);

  useEffect(() => {
    if (!brokenHeartImgRef.current) {
      const img = new window.Image();
      img.src = "/love%20game/broken-heart.png";
      brokenHeartImgRef.current = img;
    }
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#f7eaff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{ borderRadius: 18, boxShadow: "0 4px 24px #e75480a0", background: "#fff", touchAction: "none", maxWidth: 400, maxHeight: 700, margin: "auto" }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
      />
      {gameOver && (
        <button onClick={handleRestart} style={{ marginTop: 24, fontSize: 20, background: "#e75480", color: "#fff", border: 0, borderRadius: 12, padding: "12px 32px", fontWeight: 700 }}>
          Tekrar Oyna
        </button>
      )}
      <div style={{ marginTop: 16, color: "#e75480", fontWeight: 600, fontSize: 16 }}>🏹 Cupid Beaver</div>
    </div>
  );
}

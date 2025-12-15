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
  if (tRand < 0.20) type = "broken";
  else if (tRand > 0.95) type = "timer"; // biraz daha sık
  else if (tRand > 0.85) type = "bonus";
  const y = 80 + Math.random() * 180;
  // Hedefleri yavaşlatmak için hız katsayıları azaltıldı
  const vx = (Math.random() < 0.5 ? -1 : 1) * (1.5 + Math.random() * (1.2 + level * 0.3));
  // lover ve broken tipleri için dikeyde de rastgele hareket (daha yavaş)
  const vy = (type === "lover" || type === "broken") ? (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * (0.7 + level * 0.1)) : 0;
  return {
    id,
    x: Math.random() * (CANVAS_W - 2 * TARGET_RADIUS) + TARGET_RADIUS,
    y,
    vx,
    vy,
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
  const coupleImgRef = useRef<HTMLImageElement | null>(null);

  const arrowImgRef = useRef<HTMLImageElement | null>(null);
  // Ok görselini yükle (hook kurallarına uygun şekilde en üstte, sadece bir tane)
  useEffect(() => {
    if (!arrowImgRef.current) {
      const img = new window.Image();
      img.src = "/love%20game/arrow.png";
      arrowImgRef.current = img;
    }
  }, []);
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
  const [beaverX, setBeaverX] = useState(CANVAS_W / 2);
  const [arrowAnim, setArrowAnim] = useState(false);
  const [effect, setEffect] = useState<{x:number,y:number,type:string}|null>(null);
  const [lastHitType, setLastHitType] = useState<TargetType|null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [dragStart, setDragStart] = useState<{x:number, y:number}|null>(null);
  const [dragCurrent, setDragCurrent] = useState<{x:number, y:number}|null>(null);
  const [paused, setPaused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showHomeModal, setShowHomeModal] = useState(false);

  // --- Oyun Başlat ---
  useEffect(() => {
    if (gameOver || !gameStarted || paused) return;
    setTargets(Array.from({length: 6}, (_,i) => randomTarget(i, level)));
    setArrows([]);
    setCombo(0);
    setEnergy(100);
    setTimer(GAME_TIME);
    setPowerUp(null);
    setBeaverX(CANVAS_W/2);
    setArrowAnim(false);
    setEffect(null);
    setLastHitType(null);
    // eslint-disable-next-line
  }, [gameOver, level, gameStarted]);

  // --- Zamanlayıcı ---
  useEffect(() => {
    if (gameOver || !gameStarted || paused) return;
    let t: NodeJS.Timeout | null = null;
    if (timer > 0) {
      t = setInterval(() => {
        setTimer(ti => {
          if (ti <= 1) {
            if (!gameOver) setGameOver(true);
            return 0;
          }
          return ti - 1;
        });
      }, 1000);
    }
    return () => { if (t) clearInterval(t); };
    // Sadece gameOver ve level değişince başlasın
  }, [gameOver, level, gameStarted]);



  // --- Hedefleri ve Okları Güncelle ---
  useEffect(() => {
    if (gameOver || !gameStarted || paused) return;
    const anim = setInterval(() => {
      setTargets(ts => ts.map(t => {
        let nx = t.x + t.vx;
        let ny = t.y + t.vy;
        // lover ve broken tipleri ekranda rastgele hareket etsin (hem yatay hem dikey)
        if (nx < t.radius || nx > CANVAS_W-t.radius) t.vx *= -1;
        if ((t.type === "lover" || t.type === "broken") && (ny < t.radius+40 || ny > CANVAS_H-t.radius-180)) t.vy *= -1;
        // bonus ve timer sadece yatayda hareket
        if (t.type === "lover" || t.type === "broken") {
          return {...t, x: Math.max(t.radius, Math.min(CANVAS_W-t.radius, nx)), y: Math.max(t.radius+40, Math.min(CANVAS_H-t.radius-180, ny))};
        } else {
          return {...t, x: Math.max(t.radius, Math.min(CANVAS_W-t.radius, nx))};
        }
      }));
      setArrows(arrs => arrs.map(a => ({...a, x: a.x + a.vx, y: a.y + a.vy}))
        .filter(a => a.y > -40 && a.active));
    }, 16);
    return () => clearInterval(anim);
  }, [gameOver, gameStarted]);

  // --- Çarpışma ve Skor ---
  useEffect(() => {
    if (gameOver || paused) return;
    
    let scoreChange = 0;
    let comboChange = 0;
    let timerChange = 0;
    let energyChange = 0;
    let levelChange = false;
    let shouldEndGame = false;
    let newEffect: any = null;
    let newLastHitType: any = null;
    
    // Check collisions
    const ARROW_HITBOX = 14; // ok ucu yarıçapı ekle
    const updatedArrows = arrows.map(a => {
      for (const t of targets) {
        if (!t.hit && Math.hypot(a.x-t.x, a.y-t.y) < t.radius + ARROW_HITBOX) {
          t.hit = true;
          newLastHitType = t.type;
          newEffect = {x:t.x, y:t.y, type:t.type};
          if (t.type === "lover") {
            scoreChange += 10;
            comboChange += 1;
          } else if (t.type === "bonus") {
            scoreChange += 50;
            newEffect = {x:t.x, y:t.y, type:"bonus"};
          } else if (t.type === "timer") {
            timerChange += 5;
          } else if (t.type === "broken") {
            comboChange = -combo; // Reset combo
            energyChange -= 30;
            timerChange -= 5; // Penalty: lose time when hitting broken hearts
          }
          a.active = false;
        }
      }
      return a;
    });
    
    // Apply all state changes at once
    if (scoreChange !== 0) {
      setScore(s => {
        const newScore = s + scoreChange;
        if (newScore > 0 && newScore % 100 === 0 && Math.floor(newScore/100) > Math.floor(s/100)) {
          setLevel(l => l + 1);
        }
        return newScore;
      });
    }
    if (comboChange !== 0) {
      setCombo(c => {
        const newCombo = comboChange < 0 ? 0 : c + comboChange;
        if (newCombo > 0 && newCombo % 5 === 0 && newCombo !== c) {
          setEffect({x:CANVAS_W/2, y:60, type:"combo"});
        }
        return newCombo;
      });
    }
    if (timerChange !== 0) setTimer(tm => tm + timerChange);
    if (energyChange !== 0) {
      setEnergy(e => {
        const newEnergy = Math.max(0, e + energyChange);
        if (newEnergy <= 0) {
          setGameOver(true);
        }
        return newEnergy;
      });
    }
    if (newEffect) setEffect(newEffect);
    if (newLastHitType) setLastHitType(newLastHitType);
    
    // Update arrows
    setArrows(updatedArrows);
    
    // Update targets - regenerate hit targets
    setTargets(ts => ts.map(t => t.hit ? randomTarget(Math.random()*10000, level) : t));
  }, [arrows.length, score]); // Only depend on arrow count and score to avoid infinite loop

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
    // Ekranda dönen süsler (kalpler)
    const t = Date.now()*0.0015;
    for(let i=0;i<6;i++){
      const orbitR = 40 + i*12;
      const cx = CANVAS_W/2 + Math.cos(t + i)*orbitR;
      const cy = 140 + Math.sin(t*1.3 + i*0.8)* (24+i*2);
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.font = "20px sans-serif";
      ctx.fillText("❤", cx, cy);
      ctx.restore();
    }
    // Hedefler
    for(const t of targets){
      ctx.save();
      // Sadece bonus ve timer için arka plan dairesi çiz
      if(t.type==="bonus" || t.type==="timer") {
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
        const img = coupleImgRef.current;
        if (img && img.complete) {
          const scale = 0.05;
          const w = img.width * scale;
          const h = img.height * scale;
          ctx.drawImage(img, t.x - w/2, t.y - h/2, w, h);
        } else if (img) {
          img.onload = () => {
            if (!ctx) return;
            const scale = 0.05;
            const w = img.width * scale;
            const h = img.height * scale;
            ctx.drawImage(img, t.x - w/2, t.y - h/2, w, h);
          };
        }
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
          const scale = 0.4;
          const w = img.width * scale;
          const h = img.height * scale;
          ctx.drawImage(img, t.x - w/2, t.y - h/2, w, h);
        } else if (img) {
          img.onload = () => {
            if (!ctx) return;
            const scale = 0.4;
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
      const img = arrowImgRef.current;
      if (img && img.complete) {
        const scale = 0.3;
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.translate(a.x, a.y);
        // Okun açısı
        const angle = Math.atan2(a.vy, a.vx);
        ctx.rotate(angle + Math.PI/2);
        ctx.drawImage(img, -w/2, -h/2, w, h);
      }
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
    
    // Yay çekme görseli
    if (charging && dragStart && dragCurrent) {
      ctx.save();
      const dx = dragStart.x - dragCurrent.x;
      const dy = dragStart.y - dragCurrent.y;
      const distance = Math.sqrt(dx*dx + dy*dy);
      
      // Çekme çizgisi
      ctx.strokeStyle = "#e75480";
      ctx.lineWidth = 5;
      ctx.setLineDash([7, 7]);
      ctx.beginPath();
      ctx.moveTo(beaverX, BEAVER_Y-32);
      ctx.lineTo(dragCurrent.x, dragCurrent.y);
      ctx.stroke();
      
      // Yön oku
      ctx.setLineDash([]);
      ctx.fillStyle = "#e75480";
      ctx.globalAlpha = 0.65;
      const arrowLength = Math.min(distance * 1.0, 140);
      const angle = Math.atan2(dy, dx);
      const anchorX = dragStart.x;
      const anchorY = dragStart.y;
      const arrowX = anchorX + Math.cos(angle) * arrowLength;
      const arrowY = anchorY + Math.sin(angle) * arrowLength;
      ctx.beginPath();
      ctx.moveTo(arrowX, arrowY);
      ctx.lineTo(arrowX - Math.cos(angle - 0.4) * 22, arrowY - Math.sin(angle - 0.4) * 22);
      ctx.lineTo(arrowX - Math.cos(angle + 0.4) * 22, arrowY - Math.sin(angle + 0.4) * 22);
      ctx.closePath();
      ctx.fill();
      
      // Güç göstergesi
      ctx.globalAlpha = 1;
      ctx.font = "bold 16px sans-serif";
      ctx.fillStyle = "#e75480";
      const powerPercent = Math.min(distance / 170 * 100, 100).toFixed(0);
      ctx.fillText(`${powerPercent}%`, beaverX, BEAVER_Y - 70);
      // Yay merkez halkası
      ctx.strokeStyle = "#e75480";
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(beaverX, BEAVER_Y-32, Math.min(distance, 80), 0, Math.PI*2);
      ctx.stroke();
      ctx.restore();
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



    // Menü açıksa altına 3 seçeneklik panel
    if (menuOpen) {
      const iconSize = 30;
      const iconY = 10;
      const menuW = 140;
      const menuH = 90;
      const menuX = CANVAS_W - menuW - 14;
      const menuY = iconY + iconSize + 6;
      ctx.save();
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#e75480";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(menuX, menuY, menuW, menuH, 10 as any);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Seçenekler metinleri
      ctx.save();
      ctx.font = "14px sans-serif";
      ctx.fillStyle = "#333";
      ctx.textAlign = "left";
      ctx.fillText("Resume", menuX + 12, menuY + 26);
      ctx.fillText("Restart", menuX + 12, menuY + 50);
      ctx.fillText("Home", menuX + 12, menuY + 74);
      ctx.restore();
    }
    // Game over
    if(gameOver){
      ctx.save();
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, CANVAS_H/2-80, CANVAS_W, 160);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#e75480";
      ctx.textAlign = "center";
      ctx.font = "bold 32px sans-serif";
      ctx.fillText("Game Over!", CANVAS_W/2, CANVAS_H/2-10);
      ctx.font = "bold 22px sans-serif";
      ctx.fillText(`Score: ${score}`, CANVAS_W/2, CANVAS_H/2+32);
      ctx.restore();
    }
  }, [arrows, targets, score, combo, energy, timer, gameOver, effect, beaverX, charging, dragStart, dragCurrent]);

  // --- Kontroller: Basılı tut/çek ---
  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (gameOver || !gameStarted) return;
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Home ikonu tıklaması ve menü
    const iconSize = 30;
    const iconX = CANVAS_W - iconSize - 100;
    const iconY = 10;
    if (x >= iconX && x <= iconX + iconSize && y >= iconY && y <= iconY + iconSize) {
      setMenuOpen(m => !m);
      return;
    }
    if (menuOpen) {
      const menuW = 140;
      const menuH = 90;
      const menuX = CANVAS_W - menuW - 14;
      const menuY = iconY + iconSize + 6;
      if (x >= menuX && x <= menuX + menuW && y >= menuY && y <= menuY + menuH) {
        // Üç satır: Resume, Restart, Home
        if (y <= menuY + 30) {
          setPaused(false);
          setMenuOpen(false);
          return;
        } else if (y <= menuY + 60) {
          setMenuOpen(false);
          handleRestart();
          return;
        } else {
          setMenuOpen(false);
          handleHome();
          return;
        }
      } else {
        // Menü dışında tıklandıysa kapat
        setMenuOpen(false);
      }
    }
    // Yayın başlangıç noktası kunduzun yayı olsun
    setDragStart({x: beaverX, y: BEAVER_Y-32});
    setDragCurrent({x, y});
    setCharging(true);
    setChargeStart(Date.now());
  }
  
  function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    if (gameOver || !gameStarted || paused || menuOpen || !charging || chargeStart === null || !dragStart || !dragCurrent) return;
    setCharging(false);
    
    // Çekme mesafesi ve yönünü hesapla
    const pullX = dragCurrent.x - dragStart.x;
    const pullY = dragCurrent.y - dragStart.y;
    const distance = Math.sqrt(pullX*pullX + pullY*pullY);
    const maxDistance = 170;
    const power = Math.max(0.8, Math.min(distance / maxDistance, 1) * 1.6 + 0.4);
    if (distance < 5) {
      setDragStart(null);
      setDragCurrent(null);
      return;
    }

    // Ok yönünü hesapla (çekişin tersine, yaydan ileri)
    const angle = Math.atan2(-pullY, -pullX);
    const speed = ARROW_SPEED * power * 1.1;
    
    // Okun yönü ve gücü
    setArrows(arrs => [
      ...arrs,
      {
        x: beaverX,
        y: BEAVER_Y-32,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        power,
        active: true,
      },
    ]);
    setArrowAnim(true);
    setTimeout(()=>setArrowAnim(false), 200);
    setDragStart(null);
    setDragCurrent(null);
  }
  
  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (gameOver || !gameStarted) return;
    // Mobilde nişan için X eksenini takip et
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    x = Math.max(40, Math.min(CANVAS_W-40, x));
    // Çekerken kunduz pozisyonunu sabit tut, bırakınca güncelle
    if (!charging) {
      setBeaverX(x);
    }
    
    // Eğer yay çekiyorsak, çekme pozisyonunu güncelle
    if (charging && dragStart) {
      setDragCurrent({x, y});
    }
  }
  
  function handleRestart() {
    setScore(0);
    setCombo(0);
    setEnergy(100);
    setTimer(GAME_TIME);
    setLevel(1);
    setGameOver(false);
    setGameStarted(false);
    setPowerUp(null);
    setEffect(null);
  }

  function handleStart() {
    // Oyunu temiz başlat
    setScore(0);
    setCombo(0);
    setEnergy(100);
    setTimer(GAME_TIME);
    setLevel(1);
    setGameOver(false);
    setPowerUp(null);
    setEffect(null);
    setLastHitType(null);
    setDragStart(null);
    setDragCurrent(null);
    setArrows([]);
    setTargets(Array.from({length: 6}, (_,i) => randomTarget(i, 1)));
    setGameStarted(true);
  }

  function handleHome() {
    setPaused(true);
    setShowHomeModal(true);
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

  useEffect(() => {
    if (!coupleImgRef.current) {
      const img = new window.Image();
      img.src = "/love%20game/couple.png";
      coupleImgRef.current = img;
    }
  }, []);

  return (
    <div style={{ width: '360px', height: '640px', background: '#f7eaff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', margin: '0 auto', borderRadius: 18, boxShadow: '0 2px 24px #e7548033', overflow: 'hidden' }}>
      {/* Home icon top-right */}
      <div style={{ position: "absolute", top: 16, right: 16, zIndex: 30 }}>
        <button
          onClick={handleHome}
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
                style={{ width: "100%", padding: "12px 0", background: "#06b6d4", color: "#fff", borderRadius: 12, fontWeight: 600, fontSize: 18, border: "none", marginBottom: 8, cursor: "pointer" }}
                onClick={() => { setPaused(false); setShowHomeModal(false); window.location.href = "/"; }}
              >Return to Menu</button>
              <button
                style={{ width: "100%", padding: "12px 0", background: "#f59e42", color: "#fff", borderRadius: 12, fontWeight: 600, fontSize: 18, border: "none", marginBottom: 8, cursor: "pointer" }}
                onClick={() => { setPaused(false); setShowHomeModal(false); }}
              >Resume</button>
              <button
                style={{ width: "100%", padding: "12px 0", background: "#e5e7eb", color: "#1e293b", borderRadius: 12, fontWeight: 600, fontSize: 18, border: "none", marginBottom: 8, cursor: "pointer" }}
                onClick={() => { setScore(0); setCombo(0); setEnergy(100); setTimer(GAME_TIME); setLevel(1); setGameOver(false); setGameStarted(false); setPowerUp(null); setEffect(null); setShowHomeModal(false); setPaused(false); }}
              >Restart</button>
            </div>
          </div>
        </div>
      )}
      {!gameStarted && !gameOver && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 2 }}>
          <div style={{ background: "#fff", padding: 20, borderRadius: 16, boxShadow: "0 4px 24px #e75480a0", maxWidth: 360, width: "100%", textAlign: "center" }}>
            {/* Cupid Beaver başlığı kaldırıldı */}
            <div style={{ color: "#555", fontSize: 14, lineHeight: 1.5, marginBottom: 12 }}>
              Pull and hold anywhere on the screen, aim backwards like a bow, then release to shoot.
              The longer you pull, the stronger the shot.
            </div>
            <div style={{ color: "#777", fontSize: 13, lineHeight: 1.4, marginBottom: 14 }}>
              ❤ Lover: +10 score • 💛 Bonus: +50 • ⏰ Timer: +5s • Broken heart: -30 energy & -5s
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={handleStart} style={{ fontSize: 18, background: "#e75480", color: "#fff", border: 0, borderRadius: 12, padding: "10px 22px", fontWeight: 700 }}>
                Start
              </button>
              <button onClick={handleHome} aria-label="Home" title="Home" style={{ fontSize: 20, background: "#999", color: "#fff", border: 0, borderRadius: 12, padding: "10px 18px", fontWeight: 700 }}>
                🏠
              </button>
            </div>
          </div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={360}
        height={640}
        style={{ borderRadius: 18, boxShadow: '0 4px 24px #e75480a0', background: '#fff', touchAction: 'none', width: 360, height: 640, margin: 'auto', filter: showHomeModal ? 'blur(2px)' : 'none', pointerEvents: showHomeModal ? 'none' : 'auto' }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerMove={handlePointerMove}
      />
      {/* Bottom Restart and Home buttons removed as requested */}
      {/* Alt kısımdaki Cupid Beaver yazısı kaldırıldı */}
    </div>
  );
}

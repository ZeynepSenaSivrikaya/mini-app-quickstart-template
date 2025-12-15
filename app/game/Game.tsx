"use client";
import React from "react";

type Vec = { x: number; y: number };

const TILE = 24;
const MAP_W = 15;
const MAP_H = 21;

// handcrafted maze: '#' = wall, '.' = floor
const MAP_STR = [
  "###############",
  "#.............#",
  "#.###.###.###.#",
  "#.#.#.#.#.#.#.#",
  "#.#.#.#.#.#.#.#",
  "#...#.....#...#",
  "###.#.###.#.###",
  "#.....#.#.....#",
  "#.#####.#####.#",
  "#.............#",
  "#.###.#.#.###.#",
  "#.#...#.#...#.#",
  "#.#.#####.#.#.#",
  "#.#.......#.#.#",
  "#.#########.#.#",
  "#.............#",
  "###.####.#######",
  "#.............#",
  "#.###########.#",
  "#.............#",
  "###############",
];

// 0 = floor, 1 = wall
const MAP: number[] = [];
for (let r = 0; r < MAP_H; r++) {
  for (let c = 0; c < MAP_W; c++) {
    MAP.push(MAP_STR[r][c] === "#" ? 1 : 0);
  }
}

function idx(x: number, y: number) {
  return y * MAP_W + x;
}

export default function Game() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [running, setRunning] = React.useState(false); // Start paused
  const [started, setStarted] = React.useState(false); // Track if game started
  const runningRef = React.useRef(running);
  const [anxiety, setAnxiety] = React.useState(0); // 0 - 100
  const [breathing, setBreathing] = React.useState(false);
  const [gameOver, setGameOver] = React.useState(false);
  const [won, setWon] = React.useState(false); // Track win state
  const [message, setMessage] = React.useState<string | null>(null);
  const [lives, setLives] = React.useState(3);
  const [score, setScore] = React.useState(0);
  const [runKey, setRunKey] = React.useState(0);
  const anxietyRef = React.useRef(anxiety);
  const scoreRef = React.useRef(score);
  React.useEffect(() => { anxietyRef.current = anxiety; }, [anxiety]);
  React.useEffect(() => { scoreRef.current = score; }, [score]);
  React.useEffect(() => { runningRef.current = running; }, [running]);
  React.useEffect(() => { if (!running) { /* keep gameOver true if running was stopped due to game over */ } }, [running]);
  // ensure that when lives hit zero we set the game over state reliably
  React.useEffect(() => {
    if (lives <= 0) {
      setGameOver(true);
      setMessage("Game Over");
      setRunning(false);
    }
  }, [lives]);

  React.useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    canvas.width = 360;
    canvas.height = 640;

    // preload images
    const playerImg = new Image();
    playerImg.src = "/bears/scared.png";
    const ghostImg = new Image();
    ghostImg.src = "/sprites/ghost.svg";

    // simple catch sound via Web Audio API
    const audioCtx = typeof window !== 'undefined' && (new (window.AudioContext || (window as any).webkitAudioContext)());
    function playCatchSound() {
      if (!audioCtx) return;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'square';
      o.frequency.value = 420; // start freq
      g.gain.value = 0.08; // low volume
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start();
      // quick down-chirp
      const nowA = audioCtx.currentTime;
      o.frequency.setValueAtTime(420, nowA);
      o.frequency.exponentialRampToValueAtTime(180, nowA + 0.18);
      g.gain.exponentialRampToValueAtTime(0.0001, nowA + 0.2);
      o.stop(nowA + 0.22);
    }

    let req = 0;
    const startPos = { x: 2 * TILE + TILE / 2, y: 2 * TILE + TILE / 2 };
    const player: Vec & { speed: number; invulnerableUntil?: number } = { x: startPos.x, y: startPos.y, speed: 2 };
    const ghostSpawns = [
      { x: 11 * TILE + TILE / 2, y: 3 * TILE + TILE / 2 },
      { x: 12 * TILE + TILE / 2, y: 16 * TILE + TILE / 2 },
      { x: 7 * TILE + TILE / 2, y: 9 * TILE + TILE / 2 },
    ];
    const ghosts: Array<Vec & { vx: number; vy: number; speed: number; disabledUntil?: number; target?: {x:number;y:number}; lastPick?: number }> = ghostSpawns.map((p, i) => ({ x: p.x, y: p.y, vx: 0, vy: 0, speed: 0.55 + i * 0.08, target: undefined, lastPick: performance.now() }));

    let last = performance.now();
    let keys: Record<string, boolean> = {};
    let pausedUntil = 0; // breathe pause
    const particles: Array<{ x:number; y:number; vx:number; vy:number; life:number; color:string; size:number }> = [];

    function handleKey(e: KeyboardEvent) {
      // ignore controls when the game is over
      if (gameOver) return;
      if (e.type === "keydown") keys[e.key] = true;
      else keys[e.key] = false;
      // Space = stop & breathe mechanic
      if (e.type === "keydown" && e.key === " ") {
        // prevent default page scroll
        e.preventDefault();
        // attempt a timed breath: reduces anxiety if not too close to a ghost
        const now = performance.now();
        pausedUntil = now + 3000; // 3s pause
        setBreathing(true);
        setTimeout(() => setBreathing(false), 3000);
        // check distances
        const close = ghosts.some((g) => distance(g, player) < 80 && (!g.disabledUntil || g.disabledUntil < now));
        if (!close) {
          setAnxiety((a) => Math.max(0, a - 20));
          setMessage("You breathed — calmer now");
          setTimeout(() => setMessage(null), 1500);
        } else {
          setAnxiety((a) => Math.min(100, a + 10));
          setMessage("Too close — not safe to breathe!");
          setTimeout(() => setMessage(null), 1500);
        }
      }
    }

    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKey);

    function distance(a: Vec, b: Vec) {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      return Math.sqrt(dx * dx + dy * dy);
    }

    function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
      ctx.save();
      ctx.translate(x, y - size * 0.1);
      ctx.beginPath();
      // two top circles
      ctx.arc(-size * 0.25, -size * 0.05, size * 0.25, 0, Math.PI * 2);
      ctx.arc(size * 0.25, -size * 0.05, size * 0.25, 0, Math.PI * 2);
      // bottom triangle-ish curve
      ctx.moveTo(-size * 0.5, 0);
      ctx.quadraticCurveTo(0, size * 0.8, size * 0.5, 0);
      ctx.closePath();
      ctx.fillStyle = "#ef4444";
      ctx.fill();
      ctx.strokeStyle = "#7f1d1d";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }

    function tileAtXY(x: number, y: number) {
      const tx = Math.floor(x / TILE);
      const ty = Math.floor(y / TILE);
      if (tx < 0 || ty < 0 || tx >= MAP_W || ty >= MAP_H) return 1;
      return MAP[idx(tx, ty)];
    }

    // BFS pathfinder on grid to get the next step from start tile to target tile
    function nextStepTowards(sx: number, sy: number, tx: number, ty: number) {
      const start = { x: sx, y: sy };
      const goal = { x: tx, y: ty };
      const q: Array<{ x: number; y: number }> = [start];
      const prev = new Map<string, string | null>();
      const key = (p: { x: number; y: number }) => `${p.x},${p.y}`;
      prev.set(key(start), null);
      const dirs = [ [1,0],[-1,0],[0,1],[0,-1] ];
      while (q.length) {
        const p = q.shift()!;
        if (p.x === goal.x && p.y === goal.y) break;
        for (const d of dirs) {
          const nx = p.x + d[0];
          const ny = p.y + d[1];
          if (nx < 0 || ny < 0 || nx >= MAP_W || ny >= MAP_H) continue;
          if (MAP[idx(nx, ny)] === 1) continue;
          const k = `${nx},${ny}`;
          if (prev.has(k)) continue;
          prev.set(k, key(p));
          q.push({ x: nx, y: ny });
        }
      }
      // reconstruct: build path from goal back to start, then return the tile right after the start
      const kGoal = key(goal);
      if (!prev.has(kGoal)) return null;
      const path: string[] = [];
      let curKey: string | undefined = kGoal;
      while (curKey) {
        path.push(curKey);
        curKey = prev.get(curKey) ?? undefined;
      }
      // path is [goal, ..., start]; if length < 2 no step
      if (path.length < 2) return null;
      const nextKey = path[path.length - 2]; // the tile just after start
      const [nx, ny] = nextKey.split(",").map((v) => parseInt(v, 10));
      return { x: nx, y: ny };
    }

    let lastPowerSpawn = 0;
    let lastBoardSpawn = 0;
    const boards: Array<{ x: number; y: number; taken?: boolean }> = [];
    const powerUps: Array<{ x: number; y: number; type: string; taken?: boolean }> = [];
    // pellets collectible like pac-man dots
    const pellets: Array<{ tx: number; ty: number; taken?: boolean }> = [];
    for (let ry = 1; ry < MAP_H - 1; ry++) {
      for (let rx = 1; rx < MAP_W - 1; rx++) {
        if (MAP[idx(rx, ry)] === 0) {
          // avoid spawning on start or ghost spawns
          if ((rx === 2 && ry === 2) || (rx === 11 && ry === 3) || (rx === 12 && ry === 16) || (rx ===7 && ry ===9)) continue;
          pellets.push({ tx: rx, ty: ry });
        }
      }
    }

    function spawnPower() {
      // pick a random empty tile
      for (let i = 0; i < 20; i++) {
        const rx = 1 + Math.floor(Math.random() * (MAP_W - 2));
        const ry = 1 + Math.floor(Math.random() * (MAP_H - 2));
        if (MAP[idx(rx, ry)] === 0) {
          const types = ["coffee", "breath", "music", "journal"];
          powerUps.push({ x: rx * TILE + TILE / 2, y: ry * TILE + TILE / 2, type: types[Math.floor(Math.random() * types.length)] });
          break;
        }
      }
    }

    function spawnBoard() {
      for (let i = 0; i < 30; i++) {
        const rx = 1 + Math.floor(Math.random() * (MAP_W - 2));
        const ry = 1 + Math.floor(Math.random() * (MAP_H - 2));
        if (MAP[idx(rx, ry)] === 0) {
          // avoid start / ghost spawn tiles
          if ((rx === 2 && ry === 2) || (rx === 11 && ry === 3) || (rx === 12 && ry === 16) || (rx ===7 && ry ===9)) continue;
          boards.push({ x: rx * TILE + TILE / 2, y: ry * TILE + TILE / 2 });
          break;
        }
      }
    }

    let powerTimers: any = { coffee: 0, breath: 0, journalGhostDisabledUntil: 0 };
    let flashUntil = 0;
    let shakeUntil = 0;

    function step(now: number) {
      const dt = Math.min(40, now - last) / 16.67; // normalize to ~60fps
      last = now;

      // if the game is not running (game over or paused) skip simulation updates
      if (!runningRef.current) {
        // still draw final overlay/frames but skip movement updates
        req = requestAnimationFrame(step);
        return;
      }

      // controls lag when anxiety high (simulate small delay)
      const curAnx = anxietyRef.current;
      const controlLag = curAnx > 70 ? 80 : curAnx > 40 ? 30 : 0;

      // handle input, respect pause
      if (now > pausedUntil) {
        let dx = 0;
        let dy = 0;
        if (keys.ArrowUp || keys.w) dy -= 1;
        if (keys.ArrowDown || keys.s) dy += 1;
        if (keys.ArrowLeft || keys.a) dx -= 1;
        if (keys.ArrowRight || keys.d) dx += 1;
        if (dx !== 0 || dy !== 0) {
          const mag = Math.sqrt(dx * dx + dy * dy) || 1;
          const anxietySlow = curAnx > 70 ? 0.6 : curAnx > 40 ? 0.85 : 1;
          const speedMult = (powerTimers.coffee > now ? 1.8 : 1) * anxietySlow;
          // dash (Shift) to run away — gives a temporary speed boost
          const shiftMultiplier = keys.Shift ? 1.6 : 1;
          // fleeing assist: if moving away from nearest ghost while dashing, give additional boost
          let fleeBoost = 1;
          if (keys.Shift) {
            // find nearest active ghost
            let nearest: (typeof ghosts)[0] | null = null;
            let best = Infinity;
            for (const g of ghosts) {
              const d = Math.hypot(g.x - player.x, g.y - player.y);
              if (d < best) { best = d; nearest = g; }
            }
            if (nearest && best < 160) {
              // vector away
              const awayX = player.x - nearest.x;
              const awayY = player.y - nearest.y;
              const dot = (dx / mag) * (awayX / Math.hypot(awayX, awayY) || 0) + (dy / mag) * (awayY / Math.hypot(awayX, awayY) || 0);
              if (dot > 0.3) fleeBoost = 1.25;
            }
          }
          // attempt to move but block on walls per axis
          const nextX = player.x + (dx / mag) * player.speed * speedMult * shiftMultiplier * fleeBoost * dt * 8;
          const nextY = player.y + (dy / mag) * player.speed * speedMult * shiftMultiplier * fleeBoost * dt * 8;
          // check X move alone
          if (tileAtXY(nextX, player.y) === 0) player.x = nextX;
          // check Y move alone
          if (tileAtXY(player.x, nextY) === 0) player.y = nextY;
        }
      }

      // clamp player inside
      player.x = Math.max(12, Math.min(player.x, canvas.width - 12));
      player.y = Math.max(12, Math.min(player.y, canvas.height - 12));

      // update ghosts: passive roaming / patrol behavior (do NOT aggressively chase the player)
      for (const g of ghosts) {
        const nowTime = performance.now();
        if (g.disabledUntil && g.disabledUntil > nowTime) continue;
        // pick a random floor tile every 2-4s
        if (!g.target || nowTime - (g.lastPick || 0) > 2000 + Math.random() * 2000) {
          // pick random floor tile
          let tries = 0;
          while (tries++ < 40) {
            const rx = 1 + Math.floor(Math.random() * (MAP_W - 2));
            const ry = 1 + Math.floor(Math.random() * (MAP_H - 2));
            if (MAP[idx(rx, ry)] === 0) { g.target = { x: rx, y: ry }; g.lastPick = nowTime; break; }
          }
        }
        // follow the target via grid steps
        const tx = Math.floor(g.x / TILE);
        const ty = Math.floor(g.y / TILE);
        let targX = g.x;
        let targY = g.y;
        if (g.target) {
          const next = nextStepTowards(tx, ty, g.target.x, g.target.y);
          if (next) { targX = next.x * TILE + TILE / 2; targY = next.y * TILE + TILE / 2; }
        }
        // small random jitter to feel organic
        targX += (Math.random() - 0.5) * 4;
        targY += (Math.random() - 0.5) * 4;
        const dx = targX - g.x;
        const dy = targY - g.y;
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const speedFactor = powerTimers.breath > nowTime ? 0.6 : 1;
        // intentionally slow, non-aggressive speeds
        g.vx = (dx / dist) * (g.speed * 0.7) * speedFactor;
        g.vy = (dy / dist) * (g.speed * 0.7) * speedFactor;
        g.x += g.vx * dt * 6;
        g.y += g.vy * dt * 6;
        g.x = Math.max(12, Math.min(g.x, canvas.width - 12));
        g.y = Math.max(12, Math.min(g.y, canvas.height - 12));
      }

      // anxiety changes based on proximity and collisions
      let a = 0;
      const nowTime = performance.now();
      let caughtThisFrame = false;
      for (const g of ghosts) {
        if (g.disabledUntil && g.disabledUntil > nowTime) continue;
        const d = distance(g, player);
        // increased collision radius and ensure only one life is lost per frame
        if (d < 20 && (!player.invulnerableUntil || player.invulnerableUntil < nowTime) && !caughtThisFrame) {
          flashUntil = nowTime + 300;
          shakeUntil = nowTime + 300; // brief screen shake
          playCatchSound();
          // spawn capture particles (scorch burst)
          for (let i = 0; i < 18; i++) {
            const ang = (Math.PI * 2 * i) / 18 + Math.random() * 0.3;
            const spd = 1.2 + Math.random() * 1.5;
            particles.push({ x: player.x, y: player.y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, life: 400, color: "#ff7a00", size: 2 });
          }
          // collision: lose life
          setLives((l) => {
            const nl = l - 1;
            setMessage("You were caught!");
            setTimeout(() => setMessage(null), 1200);
            if (nl <= 0) {
                setAnxiety(100);
                setRunning(false);
                setGameOver(true);
                setMessage("Game Over");
            } else {
              // reset positions and temporary invulnerability
              player.x = startPos.x; player.y = startPos.y;
              let i = 0;
              for (const s of ghostSpawns) { ghosts[i].x = s.x; ghosts[i].y = s.y; i++; }
              player.invulnerableUntil = performance.now() + 1500;
              setAnxiety((_) => Math.min(100, 50));
            }
            return nl;
          });
          caughtThisFrame = true;
        }
        if (d < 220) {
          a += Math.max(0, (220 - d) / 220) * 0.9; // accumulate per ghost (stronger anxiety since ghosts are passive)
        }
      }
      // music reduces anxiety when picked; otherwise anxiety slowly decays a bit
      setAnxiety((prev) => Math.max(0, Math.min(100, prev + a - 0.02)));

      // handle power-up collisions
      for (const p of powerUps) {
        if (p.taken) continue;
        const d = distance(p as Vec, player);
        if (d < 24) {
          p.taken = true;
          // apply effect
          const now = performance.now();
          if (p.type === "coffee") powerTimers.coffee = now + 5000;
          if (p.type === "breath") powerTimers.breath = now + 5000;
          if (p.type === "music") setAnxiety((v) => Math.max(0, v - 25));
          if (p.type === "journal") {
            // disable the nearest ghost temporarily
            let nearest = ghosts[0];
            let best = Infinity;
            for (const g of ghosts) {
              const d2 = distance(g, player);
              if (d2 < best) { best = d2; nearest = g; }
            }
            nearest.disabledUntil = now + 6000;
          }
        }
      }

      // handle board pickups
      for (const b of boards) {
        if (b.taken) continue;
        const d = distance(b as Vec, player);
        if (d < 20) {
          b.taken = true;
          setScore((s) => {
            const newScore = s + 1;
            // Check win condition
            if (newScore >= 200) {
              setRunning(false);
              setGameOver(true);
              setWon(true);
              setMessage("You Win! 🎉");
            }
            return newScore;
          });
          setAnxiety((a) => Math.max(0, a - 10));
          setMessage("Tahta toplandı!");
          setTimeout(() => setMessage(null), 1200);
          // sparkle particles for pickup feedback
          for (let i = 0; i < 10; i++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = 0.8 + Math.random();
            particles.push({ x: b.x, y: b.y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, life: 350, color: "#ffd166", size: 1.5 });
          }
        }
      }

      // pellet pickups
      const ptx = Math.floor(player.x / TILE);
      const pty = Math.floor(player.y / TILE);
      for (const pel of pellets) {
        if (pel.taken) continue;
        if (pel.tx === ptx && pel.ty === pty) {
          pel.taken = true;
          setScore((s) => s + 1);
          setAnxiety((a) => Math.max(0, a - 1));
        }
      }

      // spawn powers occasionally
      if (now - lastPowerSpawn > 4000 && powerUps.filter(p => !p.taken).length < 3) { spawnPower(); lastPowerSpawn = now; }

      // spawn boards occasionally (rare collectible that reduces anxiety)
      if (now - lastBoardSpawn > 7000 && boards.filter(b => !b.taken).length < 2) { spawnBoard(); lastBoardSpawn = now; }

      // draw
      // compute brief screen shake offset
      let shakeX = 0, shakeY = 0;
      if (shakeUntil > now) {
        const intensity = 3; // pixels
        shakeX = (Math.random() - 0.5) * 2 * intensity;
        shakeY = (Math.random() - 0.5) * 2 * intensity;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
            // update & draw particles
            for (let i = particles.length - 1; i >= 0; i--) {
              const prt = particles[i];
              prt.life -= dt * 16.67;
              prt.x += prt.vx * dt * 6;
              prt.y += prt.vy * dt * 6;
              if (prt.life <= 0) { particles.splice(i, 1); continue; }
              const alpha = Math.max(0, Math.min(1, prt.life / 400));
              ctx.fillStyle = `rgba(${prt.color === "#ff7a00" ? "255,122,0" : "255,209,102"},${alpha})`;
              ctx.beginPath(); ctx.arc(prt.x, prt.y, prt.size, 0, Math.PI * 2); ctx.fill();
            }
      // map - draw Pac-Man-like walls: blue outlines with inner dark fill
      for (let ry = 0; ry < MAP_H; ry++) {
        for (let rx = 0; rx < MAP_W; rx++) {
          const v = MAP[idx(rx, ry)];
          if (v === 1) {
            // wall tile: dark inner + blue border
            ctx.fillStyle = "#040814";
            ctx.fillRect(rx * TILE + shakeX, ry * TILE + shakeY, TILE, TILE);
            ctx.strokeStyle = "#2b6cb0";
            ctx.lineWidth = 3;
            ctx.strokeRect(rx * TILE + 1.5 + shakeX, ry * TILE + 1.5 + shakeY, TILE - 3, TILE - 3);
          } else {
            // floor is darker black so pellets show
            ctx.fillStyle = "#000";
            ctx.fillRect(rx * TILE + shakeX, ry * TILE + shakeY, TILE, TILE);
          }
        }
      }

      // draw powerups
      for (const p of powerUps) {
        if (p.taken) continue;
        ctx.beginPath();
        ctx.fillStyle = p.type === "coffee" ? "#f59e0b" : p.type === "breath" ? "#10b981" : p.type === "music" ? "#60a5fa" : "#a78bfa";
        ctx.arc(p.x + shakeX, p.y + shakeY, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // draw boards (wooden planks)
      for (const b of boards) {
        if (b.taken) continue;
        ctx.save();
        ctx.translate(b.x + shakeX, b.y + shakeY);
        ctx.rotate((Math.PI / 180) * ((b.x + b.y) % 20 - 10));
        ctx.fillStyle = "#a16207"; // wood
        ctx.fillRect(-10, -5, 20, 10);
        ctx.strokeStyle = "#7c2d12";
        ctx.lineWidth = 1;
        ctx.strokeRect(-10, -5, 20, 10);
        // nails
        ctx.fillStyle = "#2b2b2b";
        ctx.beginPath(); ctx.arc(-6, 0, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(6, 0, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }

      // draw pellets: small white dots, big power pellets at four corners
      for (const pel of pellets) {
        if (pel.taken) continue;
        const cx = pel.tx * TILE + TILE / 2 + shakeX;
        const cy = pel.ty * TILE + TILE / 2 + shakeY;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI * 2); ctx.fill();
      }
      // big power pellets in corners
      const corners = [ [1,1],[MAP_W-2,1],[1,MAP_H-2],[MAP_W-2,MAP_H-2] ];
      for (const c of corners) {
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(c[0]*TILE + TILE/2 + shakeX, c[1]*TILE + TILE/2 + shakeY, 6, 0, Math.PI*2); ctx.fill();
      }

      // visually highlight the ghost house in the maze center
      ctx.strokeStyle = "#2b6cb0";
      ctx.lineWidth = 2;
      ctx.strokeRect(7 * TILE + 2 + shakeX, 8 * TILE + 2 + shakeY, TILE * 1, TILE * 3);

      // draw ghosts using sprite
      for (const g of ghosts) {
        const nowTime = performance.now();
        ctx.save();
        if (g.disabledUntil && g.disabledUntil > nowTime) {
          ctx.globalAlpha = 0.25;
        }
        const s = 44;
        if (ghostImg.complete && ghostImg.naturalWidth) {
          ctx.drawImage(ghostImg, g.x - s / 2 + shakeX, g.y - s / 2 - 6 + shakeY, s, s);
        } else {
          ctx.fillStyle = "#cceeff";
          ctx.beginPath(); ctx.arc(g.x + shakeX, g.y - 4 + shakeY, 14, Math.PI, 0); ctx.fill();
        }
        ctx.restore();
      }

      // draw player (kunduz) - prefer sprite
      if (playerImg.complete && playerImg.naturalWidth) {
        const s = 42;
        ctx.drawImage(playerImg, player.x - s / 2 + shakeX, player.y - s / 2 - 2 + shakeY, s, s);
      } else {
        ctx.save();
        const nowTimeForDraw = performance.now();
        if (player.invulnerableUntil && player.invulnerableUntil > nowTimeForDraw) ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.fillStyle = "#b5651d"; ctx.arc(player.x + shakeX, player.y + shakeY, 14, 0, Math.PI * 2); ctx.fill();
        // eyes & sweat when anxious
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(player.x - 5 + shakeX, player.y - 4 + shakeY, 3, 4, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(player.x + 5 + shakeX, player.y - 4 + shakeY, 3, 4, 0, 0, Math.PI*2); ctx.fill();
        ctx.restore();
      }

      // HUD (anxiety UI removed per request)

      // Set font for HUD
      ctx.font = "bold 20px sans-serif";

      // lives (hearts) - draw nicer heart shapes
      for (let i = 0; i < lives; i++) {
        const hx = 14 + i * 22;
        const hy = 28;
        drawHeart(ctx, hx, hy, 12);
      }
      // score - larger and more visible
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3;
      ctx.strokeText(`Score: ${scoreRef.current}`, canvas.width - 120, 28);
      ctx.fillText(`Score: ${scoreRef.current}`, canvas.width - 120, 28);

      // messages
      if (message) {
        ctx.font = "bold 16px sans-serif";
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(canvas.width / 2 - 120, 28, 240, 28);
        ctx.fillStyle = "#fff";
        ctx.fillText(message, canvas.width / 2 - 100, 46);
      }

      // apply visual effects when anxiety high
      if (anxiety >= 100) {
        // game over
        setRunning(false);
        setGameOver(true);
        setMessage("Game Over");
        // show a short reflective line after a moment
        setTimeout(() => setMessage("Kaçmak bazen iyidir, ama yüzleşmek kazandırır."), 1600);
      }

      // draw brief capture flash if player was caught
      if (flashUntil > now) {
        const alpha = Math.max(0, Math.min(1, (flashUntil - now) / 300));
        ctx.fillStyle = `rgba(255,120,0,${alpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      req = requestAnimationFrame(step);
    }

    req = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(req);
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("keyup", handleKey);
    };
  }, [runKey]);

  // Show vignette only during the Stop & Breathe pause
  const vignette = breathing;

  const handleStart = () => {
    setStarted(true);
    setRunning(true);
    setGameOver(false);
    setWon(false);
    setAnxiety(0);
    setLives(3);
    setScore(0);
    setMessage(null);
    setRunKey(k => k + 1);
  };

  const handleHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-slate-900 overflow-hidden">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '360px', marginBottom: 8 }}>
        <h2 className="text-2xl font-bold text-white">Scared Beaver Game</h2>
        <button onClick={handleHome} style={{ padding: '8px 20px', background: '#64748b', color: '#fff', borderRadius: 8, fontWeight: 600, border: 'none', fontSize: 14, cursor: 'pointer' }}>Home</button>
      </div>
      <div className="relative bg-slate-800 rounded-3xl shadow-2xl overflow-hidden" style={{ width: '360px', height: '640px' }}>
        <canvas ref={canvasRef} className="block" />
        
        {/* Start Screen */}
        {!started && !gameOver && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', background: 'rgba(0,0,0,0.85)' }}>
            <img src="/bears/scared.png" alt="Scared Beaver" style={{ width: 100, height: 100, marginBottom: 20, borderRadius: '50%' }} />
            <div style={{ color: '#fff', fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Scared Beaver</div>
            <div style={{ color: '#cbd5e1', fontSize: 16, marginBottom: 24, textAlign: 'center', maxWidth: 280 }}>
              Help the scared beaver escape from ghosts!<br/>
              Collect boards and pellets while avoiding danger.
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <button onClick={handleStart} style={{ padding: '12px 32px', background: '#06b6d4', color: '#fff', borderRadius: 12, fontWeight: 700, border: 'none', fontSize: 18, cursor: 'pointer' }}>Start</button>
              <button onClick={handleHome} style={{ padding: '12px 32px', background: '#64748b', color: '#fff', borderRadius: 12, fontWeight: 700, border: 'none', fontSize: 18, cursor: 'pointer' }}>Home</button>
            </div>
          </div>
        )}
        
        {/* Game Over Screen */}
        {gameOver && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', background: won ? 'rgba(16, 185, 129, 0.9)' : 'rgba(0,0,0,0.85)' }}>
            {won ? (
              <>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
                <div style={{ color: '#fff', fontSize: 32, fontWeight: 700, marginBottom: 12 }}>YOU WIN!</div>
                <div style={{ color: '#fff', fontSize: 18, marginBottom: 24 }}>Congratulations! Final Score: {score}</div>
              </>
            ) : (
              <>
                <div style={{ color: '#fff', fontSize: 28, fontWeight: 700, marginBottom: 12 }}>GAME OVER</div>
                <div style={{ color: '#cbd5e1', fontSize: 18, marginBottom: 24 }}>Final Score: {score}</div>
              </>
            )}
            <div style={{ display: 'flex', gap: 16 }}>
              <button onClick={handleStart} style={{ padding: '12px 32px', background: '#06b6d4', color: '#fff', borderRadius: 12, fontWeight: 700, border: 'none', fontSize: 18, cursor: 'pointer' }}>Try Again</button>
              <button onClick={handleHome} style={{ padding: '12px 32px', background: '#64748b', color: '#fff', borderRadius: 12, fontWeight: 700, border: 'none', fontSize: 18, cursor: 'pointer' }}>Home</button>
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-4 mt-4">
        <div className="text-lg text-gray-300">Arrow keys / WASD — Shift: Dash — Space: Breathe</div>
      </div>
      <div className="text-xl font-bold text-gray-200 mt-3">Lives: <span className="text-red-400">{lives}</span> — Score: <span className="text-yellow-400">{score}</span></div>
      {!running && started && !gameOver && (
        <div className="mt-2 text-base text-yellow-200">Paused — Press any key to continue</div>
      )}
    </div>
  );
}

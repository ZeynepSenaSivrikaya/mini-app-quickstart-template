"use client"

import React, { useEffect, useRef, useState } from "react"

type Tear = {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  size: number
}

export default function GamePage() {
  const [tears, setTears] = useState<Tear[]>([])
  const nextId = useRef(1)
  const rafRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [score, setScore] = useState(0)
  const [missed, setMissed] = useState(0)
  const [bucketX, setBucketX] = useState(50) // percent
  const [playing, setPlaying] = useState(false)
  const [spawnRate, setSpawnRate] = useState(0.8) // tears per second
  const [width, setWidth] = useState(800)
  const [height, setHeight] = useState(600)

  // update container size
  useEffect(() => {
    const update = () => {
      const el = containerRef.current
      if (!el) return
      setWidth(el.clientWidth)
      setHeight(el.clientHeight)
    }
    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [])

  // spawn tears periodically when playing
  useEffect(() => {
    if (!playing) return
    let last = performance.now()
    let accumulator = 0
    const tick = (t: number) => {
      const dt = (t - last) / 1000
      last = t
      accumulator += dt
      const interval = 1 / spawnRate
      while (accumulator >= interval) {
        spawnTear()
        accumulator -= interval
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, spawnRate])

  // physics update for tears
  useEffect(() => {
    let last = performance.now()
    let anim: number | null = null
    const loop = (t: number) => {
      const dt = (t - last) / 1000
      last = t
      setTears((prev) => {
        if (!containerRef.current) return prev
        const bucketPx = (bucketX / 100) * containerRef.current.clientWidth
        const bucketW = 120
        const bucketH = 40
        const newTears: Tear[] = []
        let collected = 0
        let missedLocal = 0
        for (const tr of prev) {
          const vy = tr.vy + 400 * dt // gravity-ish
          const vx = tr.vx
          const nx = tr.x + vx * dt
          const ny = tr.y + vy * dt
          // collision with bucket (bucket positioned at bottom center of bucketX)
          const bucketTop = containerRef.current.clientHeight - bucketH - 10
          const bucketLeft = bucketPx - bucketW / 2
          const bucketRight = bucketLeft + bucketW
          if (
            ny + tr.size >= bucketTop &&
            nx >= bucketLeft &&
            nx <= bucketRight
          ) {
            collected += 1
            continue // remove this tear
          }
          // if fell past bottom
          if (ny > containerRef.current.clientHeight + 50) {
            missedLocal += 1
            continue
          }
          newTears.push({ ...tr, x: nx, y: ny, vy })
        }
        if (collected > 0) setScore((s) => s + collected)
        if (missedLocal > 0) setMissed((m) => m + missedLocal)
        return newTears
      })
      anim = requestAnimationFrame(loop)
    }
    anim = requestAnimationFrame(loop)
    return () => {
      if (anim) cancelAnimationFrame(anim)
    }
  }, [bucketX])

  function spawnTear() {
    const el = containerRef.current
    if (!el) return
    const beaverX = el.clientWidth / 2 // beaver centered
    const x = beaverX + (Math.random() - 0.5) * 240 // tears flow from slightly different points
    const y = 80 + Math.random() * 20
    const vx = (Math.random() - 0.5) * 120 // some sideways flow
    const vy = 80 + Math.random() * 60
    const size = 10 + Math.random() * 8
    const id = nextId.current++
    setTears((t) => [...t, { id, x, y, vx, vy, size }])
  }

  function handleMouseMove(e: React.MouseEvent) {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * 100
    setBucketX(Math.max(5, Math.min(95, px)))
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowLeft") setBucketX((x) => Math.max(0, x - 4))
    if (e.key === "ArrowRight") setBucketX((x) => Math.min(100, x + 4))
  }

  function startGame() {
    setScore(0)
    setMissed(0)
    setTears([])
    setPlaying(true)
  }

  function stopGame() {
    setPlaying(false)
  }

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ marginBottom: 8 }}>Küçük Kunduz ve Gözyaşı Oyunu</h1>
      <p style={{ marginTop: 0 }}>Kunduz ağlıyor — kovayla gözyaşlarını topla!</p>

      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKey}
        onMouseMove={handleMouseMove}
        style={{
          width: "100%",
          height: 520,
          maxWidth: 1000,
          margin: "12px auto",
          background: "linear-gradient(#bfe9ff, #e6f7ff)",
          border: "2px solid #c7e6ff",
          borderRadius: 8,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* beaver at top center */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            top: 16,
            fontSize: 48,
            pointerEvents: "none",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 56 }}>🦫</div>
          <div style={{ fontSize: 14 }}>Kunduz
            <span style={{ display: "block", fontSize: 12, color: "#555" }}>{playing ? "(ağlamaya devam ediyor)" : "(beklemede)"}</span>
          </div>
        </div>

        {/* tears */}
        {tears.map((tr) => (
          <div
            key={tr.id}
            style={{
              position: "absolute",
              left: tr.x - tr.size / 2,
              top: tr.y - tr.size / 2,
              width: tr.size,
              height: tr.size * 1.4,
              background: "radial-gradient(circle at 30% 30%, #aee1ff, #2fa6ff)",
              borderRadius: "50%",
              opacity: 0.95,
              transform: "rotate(10deg)",
              pointerEvents: "none",
            }}
          />
        ))}

        {/* bucket */}
        <div
          style={{
            position: "absolute",
            left: `${bucketX}%`,
            transform: "translateX(-50%)",
            bottom: 10,
            width: 120,
            height: 48,
            background: "#c77f4f",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontWeight: 700,
            boxShadow: "0 4px 6px rgba(0,0,0,0.12)",
          }}
        >
          🪣
        </div>

        {/* HUD */}
        <div style={{ position: "absolute", left: 12, top: 12 }}>
          <div style={{ background: "rgba(255,255,255,0.8)", padding: "6px 10px", borderRadius: 6 }}>
            <strong>Skor:</strong> {score} <span style={{ marginLeft: 8 }}><strong>Kaçırılan:</strong> {missed}</span>
          </div>
        </div>

        {/* controls overlay */}
        <div style={{ position: "absolute", right: 12, top: 12, textAlign: "right" }}>
          <div style={{ background: "rgba(255,255,255,0.85)", padding: "6px 10px", borderRadius: 6 }}>
            <div style={{ marginBottom: 6 }}>
              <label style={{ fontSize: 12 }}>Ağlama hızı: {spawnRate.toFixed(2)} /s</label>
              <input
                aria-label="spawnRate"
                type="range"
                min={0.2}
                max={3}
                step={0.1}
                value={spawnRate}
                onChange={(e) => setSpawnRate(Number(e.target.value))}
                style={{ width: 140, display: "block" }}
              />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              {!playing ? (
                <button onClick={startGame} style={{ padding: "6px 10px" }}>
                  Başlat
                </button>
              ) : (
                <button onClick={stopGame} style={{ padding: "6px 10px" }}>
                  Durdur
                </button>
              )}
              <button
                onClick={() => {
                  setScore(0)
                  setMissed(0)
                  setTears([])
                }}
                style={{ padding: "6px 10px" }}
              >
                Sıfırla
              </button>
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: "#333" }}>
              İpucu: Kova ile fareyi hareket ettir veya sol/sağ ok tuşlarını kullan.
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "10px auto", color: "#444" }}>
        <h3>Nasıl oynanır</h3>
        <ul>
          <li>Kunduz ağlarken gözyaşları rastgele yerlere doğru akıyor.</li>
          <li>Kovayı hareket ettirerek gözyaşlarını yakala.</li>
          <li>Her yakalanan gözyaşı +1 skor getirir. Aşağı düşenler "kaçırılan" sayısını artırır.</li>
        </ul>
      </div>
    </div>
  )
}

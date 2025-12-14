"use client";
import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const MOODS = [
  { id: "cry", label: "Üzgün", emoji: "😢" },
  { id: "happy", label: "Mutlu", emoji: "😄" },
  { id: "sweat", label: "Gergin", emoji: "😅" },
  { id: "sleep", label: "Uykulu", emoji: "😴" },
  { id: "love", label: "Aşık", emoji: "😍" },
  { id: "fire", label: "Ateşli", emoji: "🔥😎" },
];

export default function Home() {
    const router = useRouter();
    const videoRef = React.useRef<HTMLVideoElement | null>(null);
    const [playing, setPlaying] = React.useState(true);

    // Helper for returning a possible image path in /public/moods/<id>.png
    function moodImagePath(id: string) {
      return `/moods/${id}.png`;
    }

    function togglePlay() {
      if (!videoRef.current) return;
      if (videoRef.current.paused) {
        videoRef.current.play();
        setPlaying(true);
      } else {
        videoRef.current.pause();
        setPlaying(false);
      }
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent py-8">
        {/* Phone frame */}
        <div className="relative w-[360px] sm:w-[420px] lg:w-[420px] bg-black rounded-3xl shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-black/60 z-0" />

          {/* Video screen */}
          <div className="relative aspect-[9/16] bg-black">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              poster="/intro-poster.jpg"
            >
              <source src="/intro.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Play overlay */}
            <button
              onClick={togglePlay}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-16 h-16 bg-black/60 rounded-full flex items-center justify-center shadow-lg border-2 border-white/20"
              aria-label="play-pause"
            >
              {playing ? (
                <div className="flex gap-1">
                  <div className="w-2 h-6 bg-white rounded-sm" />
                  <div className="w-2 h-6 bg-white rounded-sm" />
                </div>
              ) : (
                <div className="w-0 h-0 border-l-[16px] border-l-white border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent" />
              )}
            </button>

            {/* Top title and choose text */}
            <div className="absolute inset-x-0 top-10 z-20 flex flex-col items-center px-4">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-yellow-300 tracking-tight drop-shadow-[0_2px_0_rgba(0,0,0,0.6)]" style={{ WebkitTextStroke: '2px #111827', lineHeight: '0.9' }}>
                BRAVER
                <br />
                BEAVER
              </h1>

              <div className="mt-2 text-3xl text-cyan-200 font-bold italic drop-shadow-md" style={{ fontFamily: 'var(--font-pacifico)' }}>CHOOSE!</div>
            </div>

            {/* Mood buttons area */}
            <div className="absolute bottom-14 left-0 right-0 z-20 px-6">
              <div className="grid grid-cols-3 gap-4">
                {MOODS.map((mood) => (
                  <button
                    key={mood.id}
                    onClick={() => router.push(`/mood/${mood.id}`)}
                    className="relative w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-md border border-white/40 overflow-hidden"
                  >
                    <Image
                      src={moodImagePath(mood.id)}
                      alt={mood.label}
                      width={56}
                      height={56}
                      className="object-contain"
                    />
                    <span className="absolute bottom-[-8px] text-xs bg-transparent text-white/90 font-semibold">{mood.emoji}</span>
                  </button>
                ))}
              </div>

              {/* Progress knob (decorative) */}
              <div className="mt-4 relative px-2">
                <div className="w-full h-2 bg-white/30 rounded-full relative">
                  <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-white rounded-full" />
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md border-2 border-white/90" />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom speaker notch / phone bezel */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black/60 rounded-full" />
        </div>
      </div>
    );
  }

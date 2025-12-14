"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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

  // Helper for returning a possible image path in /public/moods/<id>.png
  function moodImagePath(id: string) {
    return `/moods/${id}.png`;
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gray-50">
      {/* Background video */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        poster="/intro-poster.jpg"
      >
        {/* User should place their MP4 at public/intro.mp4 */}
        <source src="/intro.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Overlay */}
      <div className="relative z-10 max-w-4xl w-full p-6 md:p-12 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold text-white drop-shadow-lg">BRAVER BEAVER</h1>
        <p className="mt-3 text-white/90 text-lg md:text-xl">Duygunu seç, anında paylaş</p>

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {MOODS.map((mood) => (
            <button
              key={mood.id}
              onClick={() => router.push(`/mood/${mood.id}`)}
              className="relative rounded-xl overflow-hidden bg-white/90 backdrop-blur-sm shadow-md hover:scale-[1.02] transition-transform p-4 flex flex-col items-center"
            >
              {/* Try to show an image from /public/moods/<id>.png; fallback to emoji */}
              <div className="w-20 h-20 flex items-center justify-center text-3xl">
                <Image
                  src={moodImagePath(mood.id)}
                  alt={mood.label}
                  width={80}
                  height={80}
                  onError={() => { /* next/image doesn't allow onError reliably on local file; fallback shown via emoji below */ }}
                  className="object-contain"
                />
                {/* This emoji fallback will be visible if image is missing (behind image tag) */}
                <span className="absolute text-3xl">{mood.emoji}</span>
              </div>

              <div className="mt-3 font-semibold text-gray-800">{mood.label}</div>

              <div className="absolute top-2 right-2 bg-white/90 text-xs px-2 py-1 rounded-full font-medium">Choose</div>
            </button>
          ))}
        </div>
      </div>

      {/* Dim overlay to increase text contrast */}
      <div className="absolute inset-0 bg-black/30" />
    </div>
  );
}

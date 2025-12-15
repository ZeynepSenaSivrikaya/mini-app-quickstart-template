"use client";
import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const MOODS = [
	{ id: "sad", label: "Sad", img: "/bears/sad.png", route: "/game-tears" },
	{ id: "happy", label: "Happy", img: "/bears/happy.png", route: "/game-jump" },
	{ id: "scared", label: "Scared", img: "/bears/scared.png", route: "/game" },
	{ id: "sleepy", label: "Sleepy", img: "/bears/sleepy.png", route: "/game-sleepy" },
	{ id: "love", label: "Love", img: "/bears/love.png", route: "/game-love" },
	{ id: "fire", label: "Fire", img: "/bears/fire.png", route: "/game-fire" },
];

export default function Home() {
	const router = useRouter();

	return (
		<div className="min-h-screen flex items-center justify-center p-0 bg-black">
			<div className="flex flex-col items-center gap-4 w-full max-w-[420px] mx-auto">
				<div className="relative w-[360px] sm:w-[420px] bg-black rounded-3xl shadow-2xl overflow-hidden">
					<div className="absolute inset-0 bg-black/40 z-0" />
					<div className="relative aspect-[9/16] bg-black overflow-hidden">
						<video
							ref={React.useRef<HTMLVideoElement>(null)}
							className="absolute inset-0 w-full h-full object-cover pointer-events-none"
							style={{ transform: 'scale(1.39)', transformOrigin: 'center center' }}
							autoPlay
							loop
							muted
							playsInline
						>
							<source src="/background.mp4" type="video/mp4" />
							<source src="/intro.mp4" type="video/mp4" />
						</video>
						<div className="absolute inset-x-0 top-8 z-10 flex flex-col items-center px-4">
							<h1 className="text-4xl sm:text-5xl font-extrabold text-yellow-300 tracking-tight drop-shadow-[0_2px_0_rgba(0,0,0,0.6)]" style={{ WebkitTextStroke: '2px #111827', lineHeight: '0.9' }}>
								BRAVER
								<br />
								BEAVER
							</h1>
						</div>
						<div className="absolute left-0 right-0 bottom-20 z-10 px-6 flex flex-col items-center gap-4">
							<div className="text-4xl sm:text-5xl text-cyan-200 font-bold italic" style={{ fontFamily: 'var(--font-pacifico)' }}>CHOOSE!</div>
							<div className="grid grid-cols-3 grid-rows-2 gap-4 justify-center items-center">
								{MOODS.map((mood) => (
									<button
										key={mood.id}
										onClick={() => {
											if (mood.route) {
												router.push(mood.route);
											} else {
												router.push("/");
											}
										}}
										className="relative w-28 h-28 rounded-full bg-white/6 border border-white/10 flex items-center justify-center shadow-lg overflow-hidden transform transition duration-200 hover:scale-105 hover:shadow-2xl active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
										aria-label={mood.label}
									>
										<div className="relative w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
											<Image src={mood.img} alt={mood.label} fill className="object-contain" />
										</div>
									</button>
								))}
							</div>
							{/* (decorative bar removed per request) */}
						</div>
						<div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black/60 rounded-full" />
					</div>
				</div>
			</div>
		</div>
	);
}

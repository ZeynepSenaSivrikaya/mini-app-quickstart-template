"use client";
import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const MOODS = [
	{ id: "sad", label: "Üzgün", img: "/bears/sad.png", route: "/game-tears" },
	{ id: "happy", label: "Mutlu", img: "/bears/happy.png", route: "/game-jump" },
	{ id: "scared", label: "Korkmuş", img: "/bears/scared.png", route: "/game" },
	{ id: "sleepy", label: "Uykulu", img: "/bears/sleepy.png", route: "/" },
	{ id: "love", label: "Aşık", img: "/bears/love.png", route: "/" },
	{ id: "fire", label: "Ateşli", img: "/bears/fire.png", route: "/game-fire" },
];

export default function Home() {
	const router = useRouter();
	const videoRef = React.useRef<HTMLVideoElement | null>(null);
	const [videoSrc, setVideoSrc] = React.useState<string>("/background.mp4");

	React.useEffect(() => {
		const v = videoRef.current;
		if (!v) return;
		function handleLoaded() {
			v.currentTime = 1;
			v.muted = false;
			v.play().catch(() => {});
		}
		v.addEventListener("loadedmetadata", handleLoaded);
		function onPause() {
			const vv = videoRef.current;
			if (!vv) return;
			try { vv.play().catch(() => {}); } catch (_) {}
		}
		v.addEventListener("pause", onPause);
		return () => {
			v.removeEventListener("loadedmetadata", handleLoaded);
			v.removeEventListener("pause", onPause);
		};
	}, []);

	React.useEffect(() => {
		let mounted = true;
		async function findVideo() {
			const candidates = [
				"/background.mp4",
				"/intro.mp4",
			];
			for (const c of candidates) {
				try {
					const res = await fetch(c, { method: "HEAD" });
					if (res.ok && mounted) {
						setVideoSrc(c);
						return;
					}
				} catch (e) {
					/* ignore */
				}
			}
		}
		findVideo();
		return () => { mounted = false; };
	}, []);

	return (
		<div className="min-h-screen flex items-center justify-center p-0 bg-black">
			<div className="flex flex-col items-center gap-4 w-full max-w-[420px] mx-auto">
				<div className="relative w-[360px] sm:w-[420px] bg-black rounded-3xl shadow-2xl overflow-hidden">
					<div className="absolute inset-0 bg-black/40 z-0" />
					<div className="relative aspect-[9/16] bg-black">
						<video
							ref={videoRef}
							className="absolute inset-0 w-full h-[130%] object-cover pointer-events-none"
							style={{ position: 'absolute', top: 'auto', bottom: 0, transform: 'translateY(14%)' }}
							autoPlay
							loop
							playsInline
							poster="/intro-poster.jpg"
						>
							<source src={videoSrc} type="video/mp4" />
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

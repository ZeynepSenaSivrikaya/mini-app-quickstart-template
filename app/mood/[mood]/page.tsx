import Image from "next/image";
import { useRouter } from "next/navigation";

interface Props {
  params: { mood: string };
}

export default function MoodPage({ params }: Props) {
  const router = useRouter();
  const { mood } = params;

  const labels: Record<string, string> = {
    cry: "Üzgün",
    happy: "Mutlu",
    sweat: "Gergin",
    sleep: "Uykulu",
    love: "Aşık",
    fire: "Ateşli",
  };

  const label = labels[mood] ?? mood;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-b from-white to-gray-100">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <h2 className="text-3xl font-bold mb-4">{label}</h2>

        <div className="flex items-center justify-center">
          <Image src={`/moods/${mood}.png`} alt={label} width={240} height={240} className="object-contain" />
        </div>

        <p className="mt-6 text-gray-600">Bu sayfa şimdilik bir placeholder — mood sayfası burada gösterilecek.</p>

        <div className="mt-6 flex justify-center">
          <button onClick={() => router.back()} className="px-4 py-2 bg-gray-800 text-white rounded-lg">Geri</button>
        </div>
      </div>
    </div>
  );
}

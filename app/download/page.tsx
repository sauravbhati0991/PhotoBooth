"use client";

import { useSearchParams } from "next/navigation";
import Image from "next/image";

export default function PhotoPage() {
  const searchParams = useSearchParams();
  const img = searchParams.get("img");

  const handleShare = async () => {
    if (!img) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "My Photobooth Photo",
          text: "Check out my photo!",
          url: img,
        });
      } else {
        alert("Sharing not supported on this device");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 px-6 gap-6">
      <h1 className="text-3xl font-bold text-blue-500">Your Photo 📸</h1>

      {img && (
        <div className="relative w-80 h-80 rounded-xl overflow-hidden shadow">
          <Image src={img} alt="photo" fill className="object-cover" />
        </div>
      )}

      <div className="flex gap-4">
        {/* Download Button */}
        <a
          href={img || ""}
          download="photobooth.jpg"
          className="px-6 py-3 bg-blue-500 text-white rounded-xl"
        >
          Download
        </a>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="px-6 py-3 bg-green-500 text-white rounded-xl"
        >
          Share
        </button>
      </div>
    </div>
  );
}

"use client";

import { useSearchParams } from "next/navigation";
import Image from "next/image";

export default function DownloadContent() {
  const searchParams = useSearchParams();
  const img = searchParams.get("img");

  const handleDownload = async () => {
    if (!img) return;

    const response = await fetch(img);
    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "photobooth.jpg";

    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(url);
  };

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 px-6 gap-8">
      <h1 className="text-3xl font-bold text-blue-500 text-center">
        Your Photo 📸
      </h1>

      {img && (
        <div className="relative w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] md:w-[500px] md:h-[500px] lg:w-[600px] lg:h-[600px] rounded-xl overflow-hidden shadow-lg">
          <Image src={img} alt="photo" fill className="object-contain" />
        </div>
      )}

      <div className="flex gap-4 flex-wrap justify-center">
        <button
          onClick={handleDownload}
          className="px-6 py-3 bg-blue-500 text-white rounded-xl cursor-pointer"
        >
          Download
        </button>

        <button
          onClick={handleShare}
          className="px-6 py-3 bg-green-500 text-white rounded-xl cursor-pointer"
        >
          Share
        </button>
      </div>
    </div>
  );
}

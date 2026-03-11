"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function DownloadContent() {
  const searchParams = useSearchParams();
  const img = searchParams.get("img");

  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!img) return;

    try {
      setDownloading(true);

      const response = await fetch(img, { mode: "cors" });
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "photobooth.gif";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!img) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "My Photobooth Photo",
          text: "Check out my photobooth photo!",
          url: img,
        });
      } else {
        alert("Sharing is not supported on this device.");
      }
    } catch (error) {
      console.log("Share cancelled or failed:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 px-6 py-10 gap-8">
      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold text-blue-500 text-center">
        Your Photo 📸
      </h1>

      {/* Image Preview */}
      {img && (
        <div className="max-w-[90vw] sm:max-w-[400px] md:max-w-[550px] lg:max-w-[650px] rounded-2xl overflow-hidden shadow-xl bg-white">
          <img
            src={img}
            alt="Photobooth result"
            className="w-full h-auto object-contain"
          />
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-4 flex-wrap justify-center">
        {/* Download */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className={`px-6 py-3 rounded-xl text-white font-medium transition
          ${
            downloading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 cursor-pointer"
          }`}
        >
          {downloading ? "Downloading..." : "Download"}
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition cursor-pointer"
        >
          Share
        </button>
      </div>
    </div>
  );
}

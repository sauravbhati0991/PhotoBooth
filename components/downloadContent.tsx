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
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-gradient-to-r from-purple-500 via-pink-400 to-purple-600 text-white px-6 py-10">
      {/* TITLE */}
      <h1 className="text-3xl md:text-4xl font-bold text-center">Your Giphy</h1>

      {/* GIF PREVIEW */}
      {img && (
        <div className="w-full max-w-[420px] bg-white/20 backdrop-blur-lg rounded-3xl p-5 shadow-xl flex justify-center">
          <img
            src={img}
            alt="Photobooth result"
            className="w-full h-auto object-contain rounded-xl"
          />
        </div>
      )}

      {/* BUTTONS */}
      <div className="flex gap-4 flex-wrap justify-center">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className={`px-6 py-3 rounded-xl font-medium shadow-lg transition
      ${
        downloading
          ? "bg-gray-400 cursor-not-allowed"
          : "bg-white text-purple-600 hover:scale-105"
      }`}
        >
          {downloading ? "Downloading..." : "Download"}
        </button>

        <button
          onClick={handleShare}
          className="px-6 py-3 rounded-xl bg-white/80 text-purple-700 font-medium shadow-lg hover:scale-105 transition"
        >
          Share
        </button>
      </div>
    </div>
  );
}

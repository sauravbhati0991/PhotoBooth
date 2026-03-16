"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import QRCode from "qrcode";

export default function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const img = searchParams.get("img");

  const [qr, setQr] = useState("");

  const downloadUrl =
    img &&
    `${typeof window !== "undefined" ? window.location.origin : ""}/download?img=${encodeURIComponent(
      img,
    )}`;

  useEffect(() => {
    if (!downloadUrl) return;

    QRCode.toDataURL(downloadUrl).then(setQr);
  }, [downloadUrl]);

  const handleDownload = async () => {
    if (!img) return;

    try {
      const response = await fetch(img);
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
      console.error("Download failed", err);
    }
  };

  const handleShare = async () => {
    if (!img) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "My Photobooth GIF",
          text: "Check out my photobooth GIF!",
          url: img,
        });
      } else {
        await navigator.clipboard.writeText(img);
        alert("Link copied to clipboard!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-purple-500 via-pink-400 to-purple-600 text-white p-8">
      {/* TITLE */}
      <h1 className="text-3xl font-bold text-center mb-2">
        🎉 Payment Successful
      </h1>

      <p className="text-white/80 mb-10 text-center">
        Your photobooth GIF is ready!
      </p>

      {/* GIF + QR SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center max-w-5xl w-full">
        {/* GIF PREVIEW */}
        {img && (
          <div className="flex justify-center w-full">
            <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-4 shadow-xl w-[220px] sm:w-[260px] md:w-[300px]">
              <div className="rounded-2xl overflow-hidden">
                <img
                  src={img}
                  alt="GIF Preview"
                  className="w-full h-auto object-contain"
                  style={{ clipPath: "inset(0 round 24px)" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* QR CODE */}
        {qr && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-white/80 text-sm text-center">
              Scan to download
            </p>

            <img
              src={qr}
              alt="QR Code"
              className="w-48 md:w-56 bg-white p-4 rounded-xl shadow-lg"
            />
          </div>
        )}
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-wrap justify-center gap-4 mt-10">
        <button
          onClick={handleDownload}
          className="px-6 py-3 rounded-xl bg-white text-purple-600 font-semibold shadow hover:scale-105 transition"
        >
          Download
        </button>

        <button
          onClick={handleShare}
          className="px-6 py-3 rounded-xl bg-white/80 text-purple-700 font-semibold shadow hover:scale-105 transition"
        >
          Share
        </button>
      </div>

      {/* BACK BUTTON */}
      <button
        onClick={() => router.push("/")}
        className="mt-10 px-8 py-3 bg-white text-purple-600 font-semibold rounded-xl shadow hover:scale-105 transition"
      >
        Back to Home
      </button>
    </div>
  );
}

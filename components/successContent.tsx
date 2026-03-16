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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-purple-500 via-pink-400 to-purple-600 text-white px-6 py-12">
      {/* TITLE */}
      <h1 className="text-4xl font-bold mb-3 text-center">
        🎉 Payment Successful
      </h1>

      <p className="text-white/80 mb-12 text-center">
        Your photobooth GIF is ready!
      </p>

      {/* CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full max-w-6xl">
        {/* GIF PREVIEW */}
        {img && (
          <div className="flex justify-center">
            <div className="bg-white/20 backdrop-blur-lg rounded-[32px] p-6 shadow-2xl w-full max-w-[900px]">
              <div className="rounded-[28px] overflow-hidden">
                <img
                  src={img}
                  alt="Photobooth GIF"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        )}

        {/* QR CODE */}
        {qr && (
          <div className="flex flex-col items-center gap-6">
            <p className="text-white/80 text-sm">Scan to download</p>

            <img
              src={qr}
              alt="QR Code"
              className="w-56 bg-white p-4 rounded-2xl shadow-xl"
            />
          </div>
        )}
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-wrap justify-center gap-6 mt-12">
        <button
          onClick={handleDownload}
          className="px-8 py-3 rounded-xl bg-white text-purple-600 font-semibold shadow-lg hover:scale-105 transition"
        >
          Download
        </button>

        <button
          onClick={handleShare}
          className="px-8 py-3 rounded-xl bg-white/80 text-purple-700 font-semibold shadow-lg hover:scale-105 transition"
        >
          Share
        </button>
      </div>

      {/* BACK */}
      <button
        onClick={() => router.push("/")}
        className="mt-12 px-10 py-3 bg-white text-purple-600 font-semibold rounded-xl shadow-lg hover:scale-105 transition"
      >
        Back to Home
      </button>
    </div>
  );
}

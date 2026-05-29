"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import QRCode from "qrcode";
import Link from "next/link";
import CustomModal from "./customModal";

export default function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const gif = searchParams.get("gif");
  const img = searchParams.get("img");
  const orderId = searchParams.get("orderId");

  const [qr, setQr] = useState("");
  
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "alert" | "confirm";
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    type: "alert",
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const showAlert = (title: string, message: string) => {
    setModalState({
      isOpen: true,
      type: "alert",
      title,
      message,
      onConfirm: () => setModalState(prev => ({ ...prev, isOpen: false })),
    });
  };

  const closeDialog = () => setModalState(prev => ({ ...prev, isOpen: false }));

  const downloadUrl =
    typeof window !== "undefined" &&
    gif &&
    img &&
    `${window.location.origin}/download?gif=${encodeURIComponent(
      gif,
    )}&img=${encodeURIComponent(img)}`;

  useEffect(() => {
    if (!downloadUrl) return;
    QRCode.toDataURL(downloadUrl).then(setQr);
  }, [downloadUrl]);

  const handleDownload = async (url: string, name: string) => {
    if (!url) return;

    const res = await fetch(url);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = name;
    a.click();

    URL.revokeObjectURL(objectUrl);
  };

  const handlePrint = () => {
    if (!img) return;

    const win = window.open("", "_blank");
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <style>
            @page { size: 4in 6in; margin: 0; }
            body {
              margin:0;
              display:flex;
              justify-content:center;
              align-items:center;
              background:white;
            }
            img {
              max-width:90%;
              max-height:90%;
              border-radius:12px;
            }
          </style>
        </head>
        <body>
          <img src="${img}" />
        </body>
      </html>
    `);

    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  const handleShare = async () => {
    if (!gif) return;

    if (navigator.share) {
      await navigator.share({
        title: "Photobooth",
        url: gif,
      });
    } else {
      await navigator.clipboard.writeText(gif);
      showAlert("Copied", "GIF link copied!");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-500 via-pink-400 to-purple-600 text-white flex flex-col items-center px-4 py-8">
      <nav className="w-full max-w-6xl flex justify-between items-center mb-6">
        <Link href="/" className="text-xl sm:text-2xl font-bold cursor-pointer">
          PhotoBooth
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/about" className="text-lg font-medium text-white hover:text-white/80 transition-colors">
            About Us
          </Link>
          <Link href="/contact" className="text-lg font-medium text-white hover:text-white/80 transition-colors">
            Contact Us
          </Link>
        </div>
      </nav>

      <h1 className="text-2xl sm:text-4xl font-bold mb-3 text-center">
        🎉 Payment Successful
      </h1>

      {orderId && (
        <div className="bg-white/20 backdrop-blur-lg rounded-2xl px-6 py-3 mb-4">
          <p className="text-white/70 text-sm text-center">Order ID</p>
          <p className="text-xl font-bold text-center tracking-wider">{orderId}</p>
        </div>
      )}

      <p className="text-white/80 mb-8 text-center">
        Your photobooth is ready!
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl">
        {gif && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-white/80">GIF Preview</p>

            <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 flex justify-center items-center">
              <div
                style={{ width: 300, height: 450 }}
                className="flex justify-center items-center overflow-hidden rounded-2xl"
              >
                <img
                  src={gif}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>

            <button
              onClick={() => handleDownload(gif, "photobooth.gif")}
              className="px-6 py-2 bg-white text-purple-600 rounded-lg cursor-pointer font-semibold"
            >
              Download GIF
            </button>
          </div>
        )}

        {img && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-white/80">Image Preview</p>

            <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-4 flex justify-center items-center">
              <div
                style={{ width: 300, height: 450 }}
                className="flex justify-center items-center overflow-hidden"
              >
                <img
                  src={img}
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
            </div>

            <div className="flex gap-3 flex-wrap justify-center">
              <button
                onClick={() => handleDownload(img, "photobooth.jpg")}
                className="px-6 cursor-pointer py-2 bg-white text-purple-600 rounded-lg font-semibold"
              >
                Download Image
              </button>
            </div>
          </div>
        )}
      </div>

      {qr && (
        <div className="flex flex-col items-center gap-4 mt-10">
          <p className="text-white/80 text-sm">Scan to download image</p>

          <img src={qr} alt="QR" className="w-44 bg-white p-3 rounded-xl" />
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-4 mt-10">
        <button
          onClick={handleShare}
          className="px-6 py-2 bg-white cursor-pointer text-purple-600 rounded-lg font-semibold"
        >
          Share GIF
        </button>

        <button
          onClick={() => router.push("/")}
          className="px-6 py-2 bg-white/80 cursor-pointer text-purple-700 rounded-lg font-semibold"
        >
          Back to Home
        </button>
      </div>

      <CustomModal
        isOpen={modalState.isOpen}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        onConfirm={modalState.onConfirm}
        onCancel={closeDialog}
      />
    </div>
  );
}

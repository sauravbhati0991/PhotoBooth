"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import Link from "next/link";

export default function SuccessContent() {
  const searchParams = useSearchParams();

  const gif = searchParams.get("gif");
  const img = searchParams.get("img");

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl">
        {gif && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-white/80">GIF Preview</p>

            <div
              className="rounded-2xl shadow-2xl overflow-hidden"
              style={{ width: 320, height: 480, backgroundColor: "#ffffff" }}
            >
              <img
                src={gif}
                className="w-full h-full object-cover"
              />
            </div>

            <button
              onClick={() => handleDownload(gif, "photobooth.gif")}
              className="px-6 py-2 bg-white text-purple-600 rounded-lg font-semibold cursor-pointer"
            >
              Download GIF
            </button>
          </div>
        )}

        {img && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-white/80">Image Preview</p>

            <div
              className="rounded-2xl shadow-2xl overflow-hidden"
              style={{ width: 320, height: 480, backgroundColor: "#ffffff" }}
            >
              <img
                src={img}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex gap-3 flex-wrap justify-center">
              <button
                onClick={() => handleDownload(img, "photobooth.jpg")}
                className="px-6 py-2 bg-white text-purple-600 rounded-lg font-semibold cursor-pointer"
              >
                Download Image
              </button>

              <button
                onClick={handlePrint}
                className="px-6 py-2 bg-white/80 text-purple-700 rounded-lg font-semibold cursor-pointer"
              >
                Print
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import QRCode from "qrcode";

export default function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const img = searchParams.get("img");

  const [qr, setQr] = useState("");

  useEffect(() => {
    if (!img) return;

    const previewUrl = `${window.location.origin}/photo?img=${encodeURIComponent(img)}`;

    QRCode.toDataURL(previewUrl).then(setQr);
  }, [img]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-blue-50 px-6">
      <h1 className="text-3xl font-bold text-blue-500">
        Payment Successful 🎉
      </h1>

      <p className="text-gray-600 text-center">
        Scan the QR code to download your photo
      </p>

      {qr && (
        <img
          src={qr}
          alt="QR Code"
          className="w-60 h-60 bg-white p-4 rounded-xl shadow"
        />
      )}

      <button
        onClick={() => router.push("/")}
        className="mt-4 px-6 py-3 bg-blue-400 hover:bg-blue-500 active:bg-blue-600 text-white cursor-pointer rounded-xl"
      >
        Back to Home
      </button>
    </div>
  );
}

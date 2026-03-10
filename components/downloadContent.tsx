"use client";

import { useSearchParams } from "next/navigation";

export default function DownloadContent() {
  const searchParams = useSearchParams();

  const img = searchParams.get("img");
  const title = searchParams.get("title");
  const count = searchParams.get("count");

  const handleDownload = async () => {
    if (!img) return;

    try {
      const res = await fetch(img);
      const blob = await res.blob();

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "photobooth.jpg";

      document.body.appendChild(a);
      a.click();

      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-blue-50">
      <h1 className="text-3xl font-bold text-blue-500">
        Your Photo is Ready 📸
      </h1>

      <p>Layout: {title}</p>
      <p>Photos: {count}</p>

      {img && (
        <img
          src={img}
          className="w-64 rounded-xl shadow"
          alt="Generated Layout"
        />
      )}

      <button
        onClick={handleDownload}
        className="px-6 py-3 bg-blue-400 text-white rounded-xl hover:bg-blue-500 cursor-pointer active:bg-blue-600"
      >
        Download Photo
      </button>
    </div>
  );
}

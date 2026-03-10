"use client";

import { useSearchParams } from "next/navigation";

export default function DownloadContent() {
  const searchParams = useSearchParams();

  const title = searchParams.get("title");
  const count = searchParams.get("count");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-blue-50">
      <h1 className="text-3xl font-bold text-blue-500">
        Your Photo is Ready 📸
      </h1>

      <p>Layout: {title}</p>
      <p>Photos: {count}</p>

      <button className="px-6 py-3 bg-blue-500 text-white rounded-xl">
        Download Photo
      </button>
    </div>
  );
}

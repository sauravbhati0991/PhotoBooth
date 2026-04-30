"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function GridCardsSectionAdmin() {
  const router = useRouter();
  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-500 via-pink-400 to-purple-600 text-white">
      <nav className="max-w-7xl mx-auto flex items-center justify-between p-6">
        <Link href="/" className="text-2xl font-bold">
          PhotoBooth
        </Link>
        <button
          onClick={handleLogout}
          className="bg-white/20 cursor-pointer hover:bg-white/30 px-4 py-2 rounded-xl backdrop-blur-sm transition font-medium"
        >
          Logout
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-6 pb-20">
        <h1 className="text-3xl font-bold text-center mb-10">Layout Builder</h1>

        <div className="flex gap-10 justify-center">
          <button
            onClick={() => router.push("/admin/newLayout")}
            className="bg-white text-purple-600 hover:scale-105 cursor-pointer px-6 py-3 rounded-xl shadow-lg transition"
          >
            Add Layout
          </button>

          <button
            onClick={() => router.push("/admin/editLayout")}
            className="bg-white text-purple-600 hover:scale-105 cursor-pointer px-6 py-3 rounded-xl shadow-lg transition"
          >
            Edit Layout
          </button>
        </div>
      </div>
    </div>
  );
}

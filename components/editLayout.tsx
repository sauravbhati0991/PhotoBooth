"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Template = {
  _id: string;
  name: string;
  rows: number;
  cols: number;
  count: number;
  price: number;
  backgroundType: "color" | "image";
  backgroundValue: string;
};

const CELL = 72;
const GAP = 10;
const FRAME = 10;

export default function EditLayout() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch("/api/layouts");
        if (!res.ok) throw new Error("Failed to fetch templates");

        const data: Template[] = await res.json();
        setTemplates(data);
      } catch (err) {
        console.error("Template fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;

    scrollRef.current.scrollBy({
      left: direction === "left" ? -350 : 350,
      behavior: "smooth",
    });
  };

  const openTemplate = (id: string) => {
    router.push(`/admin/editLayout/${id}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-purple-500 via-pink-400 to-purple-600 px-4">
      <nav className="fixed top-5 left-5">
        <button
          onClick={() => router.back()}
          className="flex items-center cursor-pointer gap-2 bg-white text-purple-600 px-4 py-2 rounded-lg shadow hover:scale-105 transition"
        >
          ← Back
        </button>
      </nav>

      <h2 className="text-2xl md:text-3xl font-semibold text-white mb-12 text-center">
        Select the Template
      </h2>

      <div className="flex items-center gap-4 w-full max-w-6xl">
        <button
          onClick={() => scroll("left")}
          className="p-3 rounded-full cursor-pointer bg-white/80 backdrop-blur-md shadow-lg hover:scale-110 transition"
        >
          <ChevronLeft size={26} />
        </button>

        {loading ? (
          <p className="text-white">Loading templates...</p>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-10 items-center scrollbar-hide p-8 overflow-x-auto scroll-smooth w-full"
          >
            {templates.map((t) => {
              const gridWidth = t.cols * CELL + (t.cols - 1) * GAP;
              const gridHeight = t.rows * CELL + (t.rows - 1) * GAP;

              return (
                <div
                  key={t._id}
                  onClick={() => openTemplate(t._id)}
                  className="flex flex-col items-center cursor-pointer hover:scale-110 transition"
                  style={{ width: gridWidth + FRAME * 2 }}
                >
                  <div
                    className="rounded-2xl shadow-lg flex items-center justify-center"
                    style={{
                      backgroundColor:
                        t.backgroundType === "color"
                          ? t.backgroundValue
                          : undefined,
                      backgroundImage:
                        t.backgroundType === "image"
                          ? `url(${t.backgroundValue})`
                          : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      padding: FRAME,
                      width: gridWidth + FRAME * 2,
                      height: gridHeight + FRAME * 2,
                    }}
                  >
                    <div
                      className="grid"
                      style={{
                        gridTemplateColumns: `repeat(${t.cols}, ${CELL}px)`,
                        gridTemplateRows: `repeat(${t.rows}, ${CELL}px)`,
                        gap: GAP,
                      }}
                    >
                      {Array.from({
                        length: t.rows * t.cols,
                      }).map((_, i) => (
                        <div key={i} className="bg-white rounded-lg" />
                      ))}
                    </div>
                  </div>

                  <p className="text-white mt-3 text-sm font-medium text-center">
                    {t.name}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={() => scroll("right")}
          className="p-3 rounded-full cursor-pointer bg-white/80 backdrop-blur-md shadow-lg hover:scale-110 transition"
        >
          <ChevronRight size={26} />
        </button>
      </div>
    </div>
  );
}

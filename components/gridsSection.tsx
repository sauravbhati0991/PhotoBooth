"use client";

import Link from "next/link";
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

export default function GridCardsSection() {
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

  const openTemplate = (t: Template) => {
    router.push(
      `/editLayout?title=${encodeURIComponent(t.name)}&price=${t.price}&count=${t.count}&rows=${t.rows}&cols=${t.cols}&bgType=${t.backgroundType}&bgValue=${encodeURIComponent(t.backgroundValue)}`,
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-purple-500 via-pink-400 to-purple-600 px-4">
      <nav className="absolute top-0 w-full max-w-7xl flex items-center justify-between p-6">
        <Link href="/" className="text-2xl font-bold text-white">
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

      <h2 className="text-2xl md:text-3xl font-semibold text-white mb-12 text-center">
        Choose Your Template
      </h2>

      <div className="flex items-center gap-4 w-full max-w-6xl">
        <button
          onClick={() => scroll("left")}
          className="p-3 rounded-full bg-white/80 backdrop-blur-md shadow-lg hover:scale-110 transition"
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
                  onClick={() => openTemplate(t)}
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
                      {Array.from({ length: t.rows * t.cols }).map((_, i) => (
                        <div key={i} className="bg-white rounded-lg" />
                      ))}
                    </div>
                  </div>

                  <p className="mt-3 text-white font-medium text-center">
                    {t.name}
                  </p>

                  <p className="text-white/80 text-sm">{t.price === 0 ? "Free" : `₹${t.price}`}</p>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={() => scroll("right")}
          className="p-3 rounded-full bg-white/80 backdrop-blur-md shadow-lg hover:scale-110 transition"
        >
          <ChevronRight size={26} />
        </button>
      </div>
    </div>
  );
}

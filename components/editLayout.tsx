"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Square } from "lucide-react";

type Template = {
  _id: string;
  name: string;
  rows: number;
  cols: number;
  count: number;
  price: number;
  backgroundType: "color" | "image";
  backgroundValue: string;
  elements?: any[];
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
              const gridWidth = 160;
              const gridHeight = 240;
              const elements = t.elements || [];

              return (
                <div
                  key={t._id}
                  onClick={() => openTemplate(t._id)}
                  className="flex flex-col items-center cursor-pointer hover:scale-105 hover:-translate-y-1 transition duration-300"
                  style={{ width: gridWidth + FRAME * 2 }}
                >
                  <div
                    className="rounded-2xl shadow-xl flex items-center justify-center relative overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 transition-all duration-300 hover:shadow-2xl"
                    style={{
                      padding: FRAME,
                      width: gridWidth + FRAME * 2,
                      height: gridHeight + FRAME * 2,
                    }}
                  >
                    <div
                      className="relative overflow-hidden rounded-lg w-full h-full"
                      style={{
                        backgroundColor: t.backgroundType === "color" ? t.backgroundValue : "#ffffff",
                        width: gridWidth,
                        height: gridHeight,
                      }}
                    >
                      {elements.map((el: any) => {
                        const scale = gridWidth / 1200;
                        return (
                          <div
                            key={el.id}
                            className="absolute overflow-hidden"
                            style={{
                              left: el.x * scale,
                              top: el.y * scale,
                              width: el.width * scale,
                              height: el.height * scale,
                              zIndex: el.type === "image" ? 10 : el.type === "text" ? 20 : 30
                            }}
                          >
                            {el.type === "image" && el.src && (
                              <img
                                src={el.src}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            )}
                            {el.type === "placeholder" && (
                              <div className="w-full h-full bg-purple-50/85 border border-dashed border-purple-300 rounded-sm flex flex-col items-center justify-center text-purple-600 font-bold text-center" style={{ padding: 2 * scale }}>
                                <Square size={Math.max(8, 16 * scale)} className="text-purple-400" style={{ marginBottom: 1 * scale }} />
                                <span className="tracking-tight uppercase" style={{ fontSize: Math.max(6, 9 * scale), lineHeight: 1 }}>Photo</span>
                              </div>
                            )}
                            {el.type === "text" && (
                              <div
                                className="w-full h-full flex items-center justify-center text-slate-900 font-bold text-center leading-none"
                                style={{ fontSize: 16 * scale }}
                              >
                                {el.text}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <p className="mt-3 text-white font-semibold text-center text-sm drop-shadow-sm truncate w-full px-2">
                    {t.name}
                  </p>

                  <p className="text-white/80 text-xs font-medium bg-white/20 px-2.5 py-0.5 rounded-full mt-1 border border-white/10">
                    {t.price === 0 ? "Free" : `₹${t.price}`}
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

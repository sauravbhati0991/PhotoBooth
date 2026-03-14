"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = {
  _id: string;
  name: string;
  count: number;
  rows: number;
  cols: number;
  price: number;
  backgroundType: "color" | "image";
  backgroundValue: string;
};

export default function LayoutThemes() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const count = Number(searchParams.get("count"));
  const design = searchParams.get("design") ?? "";

  const [themes, setThemes] = useState<Theme[]>([]);

  useEffect(() => {
    const loadThemes = async () => {
      try {
        const res = await fetch(
          `/api/layouts?count=${count}&rows=${design.split("x")[0]}&cols=${design.split("x")[1]}`,
        );

        const data = await res.json();
        setThemes(data);
      } catch (error) {
        console.error(error);
      }
    };

    if (count && design) loadThemes();
  }, [count, design]);

  const CELL = 72;
  const GAP = 10;
  const FRAME = 12;

  return (
    <div className="min-h-screen bg-blue-50 p-10">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 cursor-pointer mb-8 bg-blue-400 text-white px-4 py-2 rounded-xl hover:bg-blue-500 transition"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <h1 className="text-3xl font-bold text-blue-600 mb-10">
        Choose Design Theme
      </h1>

      <div className="flex flex-wrap gap-8">
        {themes.map((theme) => {
          const gridWidth = theme.cols * CELL + (theme.cols - 1) * GAP;
          const gridHeight = theme.rows * CELL + (theme.rows - 1) * GAP;

          return (
            <div
              key={theme._id}
              className="bg-white rounded-3xl shadow-xl p-6 hover:shadow-2xl hover:-translate-y-2 transition flex flex-col items-center"
            >
              <div
                className="rounded-xl flex items-center justify-center"
                style={{
                  background:
                    theme.backgroundType === "color"
                      ? theme.backgroundValue
                      : `url(${theme.backgroundValue}) center/cover`,
                  padding: FRAME,
                  width: gridWidth + FRAME * 2,
                  height: gridHeight + FRAME * 2,
                }}
              >
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: `repeat(${theme.cols}, ${CELL}px)`,
                    gridTemplateRows: `repeat(${theme.rows}, ${CELL}px)`,
                    gap: GAP,
                  }}
                >
                  {Array.from({ length: theme.rows * theme.cols }).map(
                    (_, i) => (
                      <div key={i} className="bg-white rounded-lg" />
                    ),
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-col w-full gap-1">
                <p className="text-lg font-semibold text-gray-800">
                  Layout: {theme.name}
                </p>

                <p className="text-blue-500 font-semibold">
                  Price: ₹{theme.price}
                </p>
              </div>

              <button
                onClick={() =>
                  router.push(
                    `/editLayout?title=${encodeURIComponent(
                      theme.name,
                    )}&price=${theme.price}&count=${theme.count}&rows=${theme.rows}&cols=${theme.cols}&bgType=${theme.backgroundType}&bgValue=${encodeURIComponent(
                      theme.backgroundValue,
                    )}`,
                  )
                }
                className="mt-6 px-5 py-2 cursor-pointer rounded-xl bg-blue-400 text-white font-semibold shadow-md hover:bg-blue-500 hover:scale-105 active:scale-95 transition"
              >
                Select
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

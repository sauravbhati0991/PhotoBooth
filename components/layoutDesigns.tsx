"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

interface Design {
  _id: string;
  rows: number;
  cols: number;
  count: number;
}

export default function LayoutDesigns() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const title = searchParams.get("title") ?? "";
  const count = Number(searchParams.get("count"));

  const [designs, setDesigns] = useState<Design[]>([]);

  useEffect(() => {
    const loadDesigns = async () => {
      const res = await fetch(`/api/layouts?count=${count}`);
      const data = await res.json();

      const uniqueDesigns = data.filter(
        (design: Design, index: number, self: Design[]) =>
          index ===
          self.findIndex(
            (d) => d.rows === design.rows && d.cols === design.cols,
          ),
      );

      setDesigns(uniqueDesigns);
    };

    loadDesigns();
  }, [count]);

  return (
    <div className="min-h-screen bg-blue-50 p-10">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 mb-6 bg-blue-400 text-white px-4 py-2 rounded-xl hover:bg-blue-500 transition"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <h1 className="text-3xl font-bold text-blue-600 mb-10">
        Choose {count}-Grid Design
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {designs.map((design) => {
          const rows = design.rows;
          const cols = design.cols;

          return (
            <div
              key={design._id}
              className="bg-white rounded-3xl shadow-xl p-6 hover:shadow-2xl transition flex flex-col items-center"
            >
              <div
                className="grid gap-3 place-items-center"
                style={{
                  gridTemplateColumns: `repeat(${design.cols}, 1fr)`,
                  gridTemplateRows: `repeat(${rows}, 1fr)`,
                  width: "160px",
                  height: "160px",
                }}
              >
                {Array.from({ length: design.rows * design.cols }).map(
                  (_, i) => (
                    <div
                      key={i}
                      className="bg-blue-300 rounded-lg w-full h-full"
                    />
                  ),
                )}
              </div>

              <div className="w-full mt-5 flex flex-col gap-3">
                <p className="text-lg font-semibold text-gray-800">
                  {rows} × {cols} Grid
                </p>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() =>
                      router.push(
                        `/layout-themes?layoutId=${design._id}&title=${encodeURIComponent(
                          title,
                        )}&count=${count}&design=${rows}x${cols}`,
                      )
                    }
                    className="px-5 py-2 rounded-xl cursor-pointer bg-blue-400 text-white font-semibold shadow-md hover:bg-blue-500 hover:scale-105 active:scale-95 transition"
                  >
                    Select
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

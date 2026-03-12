"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import GridCard from "./gridCard";

const PhotoGrid = dynamic(() => import("@/utils/photogrid"), {
  ssr: false,
});

interface GridItem {
  _id: string;
  title: string;
  price: number;
  count: number;
}

export default function GridCardsSection() {
  const [layouts, setLayouts] = useState<GridItem[]>([]);
  const [generatedImages, setGeneratedImages] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    fetch("/api/layouts")
      .then(async (res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((data) => setLayouts(data || []))
      .catch(() => setLayouts([]));
  }, []);

  return (
    <>
      <nav className="max-w-7xl mx-auto flex items-center justify-between p-6">
        <Link
          href="/"
          className="text-2xl font-bold text-blue-400 hover:underline"
        >
          PhotoBooth
        </Link>
      </nav>

      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 text-blue-400">
          Choose Your Photo Grid Layout
        </h2>
      </div>

      <div className="fixed top-0 left-0 opacity-0 pointer-events-none -z-50">
        {layouts.map((layout) => (
          <PhotoGrid
            key={layout._id}
            count={layout.count}
            onImageGenerated={(img: string) =>
              setGeneratedImages((prev) => {
                if (prev[layout._id]) return prev;

                return {
                  ...prev,
                  [layout._id]: img,
                };
              })
            }
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 rounded-xl p-6 shadow-lg bg-blue-50">
          {layouts.map((layout) => (
            <GridCard
              key={layout._id}
              title={layout.title}
              price={layout.price}
              image={generatedImages[layout._id] ?? ""}
              count={layout.count}
            />
          ))}
        </div>
      </div>
    </>
  );
}

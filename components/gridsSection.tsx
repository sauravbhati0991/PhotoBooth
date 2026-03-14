"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import GridCard from "./gridCard";

interface LayoutFromDB {
  _id: string;
  count: number;
}

interface GridItem {
  _id: string;
  title: string;
  count: number;
}

export default function GridCardsSection() {
  const [layouts, setLayouts] = useState<GridItem[]>([]);

  useEffect(() => {
    const loadLayouts = async () => {
      try {
        const res = await fetch("/api/layouts");

        if (!res.ok) throw new Error("Failed to fetch layouts");

        const data: LayoutFromDB[] = await res.json();

        const uniqueCounts = Array.from(new Set(data.map((l) => l.count))).sort(
          (a, b) => a - b,
        );

        const formatted: GridItem[] = uniqueCounts.map((count, i) => ({
          _id: String(i),
          title: `${count} Grid Layout`,
          count,
        }));

        setLayouts(formatted);
      } catch (err) {
        console.error(err);
      }
    };

    loadLayouts();
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

      <div className="max-w-7xl mx-auto px-6 pb-16">
        <div className="grid gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 rounded-xl p-6 shadow-lg bg-blue-50">
          {layouts.map((layout) => (
            <GridCard
              key={layout._id}
              title={layout.title}
              count={layout.count}
            />
          ))}
        </div>
      </div>
    </>
  );
}

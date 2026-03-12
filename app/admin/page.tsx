"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import GridCard from "@/components/gridCard";

const PhotoGrid = dynamic(() => import("@/utils/photogrid"), {
  ssr: false,
});

interface GridItem {
  _id: string;
  title: string;
  price: number;
  count: number;
}

export default function GridCardsSectionAdmin() {
  const [layouts, setLayouts] = useState<GridItem[]>([]);
  const [generatedImages, setGeneratedImages] = useState<
    Record<string, string>
  >({});

  const [count, setCount] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    const loadLayouts = async () => {
      try {
        const res = await fetch("/api/layouts");

        if (!res.ok) return;

        const data = await res.json();

        const cleaned = data.map((layout: any) => ({
          _id: layout._id?.toString(),
          title: layout.title,
          price: layout.price,
          count: layout.count,
        }));

        setLayouts(cleaned);
      } catch (error) {
        console.error("Failed to load layouts:", error);
      }
    };

    loadLayouts();
  }, []);

  const addLayout = async () => {
    if (!count || !price) return;

    try {
      const res = await fetch("/api/layouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `${count}-Grid Layout`,
          price: Number(price),
          count: Number(count),
        }),
      });

      if (!res.ok) {
        console.error("Failed to add layout");
        return;
      }

      const newLayout = await res.json();

      setLayouts((prev) => [
        ...prev,
        {
          _id: newLayout._id.toString(),
          title: newLayout.title,
          price: newLayout.price,
          count: newLayout.count,
        },
      ]);

      setCount("");
      setPrice("");
    } catch (error) {
      console.error("Add layout error:", error);
    }
  };

  const deleteLayout = async (id: string) => {
    try {
      const res = await fetch(`/api/layouts/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        console.error("Delete failed");
        return;
      }

      setLayouts((prev) => prev.filter((layout) => layout._id !== id));

      setGeneratedImages((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

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

      <div className="max-w-7xl mx-auto px-6 mb-10">
        <div className="bg-blue-50 shadow-lg p-6 rounded-xl flex gap-4 items-center flex-wrap">
          <input
            type="number"
            placeholder="Image Count"
            value={count}
            min={1}
            max={20}
            onChange={(e) => {
              const value = e.target.value;

              if (value === "") {
                setCount("");
                return;
              }

              const num = Number(value);

              if (num >= 1 && num <= 20) {
                setCount(value);
              }
            }}
            className="border p-2 rounded w-40"
          />

          <input
            type="number"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="border p-2 rounded w-40"
          />

          <button
            onClick={addLayout}
            className="bg-blue-400 hover:bg-blue-500 active:bg-blue-600 hover:shadow-xl text-white px-5 py-2 rounded-lg cursor-pointer"
          >
            Add Grid
          </button>
        </div>
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
              mode="admin"
              onDelete={() => deleteLayout(layout._id)}
            />
          ))}
        </div>
      </div>
    </>
  );
}

"use client";

import { useMemo, useRef, useEffect } from "react";
import html2canvas from "html2canvas";

interface Props {
  count: number;
  onImageGenerated: (img: string) => void;
}

const images = [
  "/image-1.png",
  "/image-2.png",
  "/image-3.png",
  "/image-4.png",
  "/image-5.png",
  "/image-6.png",
];

function getRandomImages(count: number) {
  const result: string[] = [];

  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * images.length);
    result.push(images[randomIndex]);
  }

  return result;
}

export default function PhotoGrid({ count, onImageGenerated }: Props) {
  const gridRef = useRef<HTMLDivElement>(null);
  const loadedImages = useRef(0);
  const isGenerating = useRef(false);

  const selected = useMemo(() => getRandomImages(count), [count]);

  useEffect(() => {
    loadedImages.current = 0;
    isGenerating.current = false;
  }, [count]);

  const handleLoad = async () => {
    loadedImages.current += 1;

    if (loadedImages.current === selected.length && !isGenerating.current) {
      isGenerating.current = true;

      if (!gridRef.current) return;

      const canvas = await html2canvas(gridRef.current, {
        backgroundColor: "#ffffff",
        scale: 1,
        useCORS: true,
      });

      const img = canvas.toDataURL("image/png");
      onImageGenerated(img);
    }
  };

  function getGridCols(count: number) {
    if (count <= 3) return count;
    if (count === 4) return 2;
    if (count <= 6) return 3;
    if (count <= 8) return 4;
    return 5;
  }

  return (
    <div
      ref={gridRef}
      className="p-6 rounded-xl"
      style={{ backgroundColor: "#60a5fa" }}
    >
      <div
        className="grid gap-6"
        style={{
          gridTemplateColumns: `repeat(${getGridCols(count)}, 1fr)`,
        }}
      >
        {selected.map((img, i) => (
          <div
            key={i}
            className="p-3 rounded-lg"
            style={{ backgroundColor: "#ffffff" }}
          >
            <img
              src={img}
              alt="photo"
              onLoad={handleLoad}
              className="rounded object-cover w-full h-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

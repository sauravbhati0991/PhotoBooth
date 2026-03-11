"use client";

import { useEffect, useRef } from "react";
import html2canvas from "html2canvas-pro";

interface Props {
  count: number;
  onImageGenerated?: (img: string) => void;
}

export default function PhotoGrid({ count, onImageGenerated }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  /* Generate preview image */
  useEffect(() => {
    if (!ref.current || !onImageGenerated) return;

    html2canvas(ref.current).then((canvas) => {
      onImageGenerated(canvas.toDataURL("image/png"));
    });
  }, [count, onImageGenerated]);

  /* Determine max columns dynamically */
  const getMaxCols = (count: number) => {
    if (count <= 3) return count;
    if (count === 4) return 2;
    if (count <= 6) return 3;
    if (count <= 12) return 4;
    return 5;
  };

  const maxCols = getMaxCols(count);

  /* Create rows dynamically */
  const rows: number[] = [];
  let remaining = count;

  while (remaining > 0) {
    const cells = Math.min(maxCols, remaining);
    rows.push(cells);
    remaining -= cells;
  }

  const cellStyle =
    "aspect-square bg-blue-200 border border-blue-300 rounded-lg";

  return (
    <div
      ref={ref}
      className="p-4 bg-blue-100 rounded-xl w-[300px] flex flex-col gap-3"
    >
      {rows.map((cols, rowIndex) => (
        <div
          key={rowIndex}
          className={`grid gap-3 ${cols < maxCols ? "justify-center" : ""}`}
          style={{
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
          }}
        >
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className={cellStyle} />
          ))}
        </div>
      ))}
    </div>
  );
}

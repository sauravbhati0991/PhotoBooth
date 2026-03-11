"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useRef, useCallback, useMemo } from "react";
import Webcam from "react-webcam";
import { ArrowLeft } from "lucide-react";
import gifshot from "gifshot";

type GifResult = { error: boolean; image: string };

export default function EditLayoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const title = searchParams.get("title") ?? "";
  const count = Number(searchParams.get("count"));
  const price = Number(searchParams.get("price"));

  const [framesList, setFramesList] = useState<string[][]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [cameraIndex, setCameraIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("none");
  const [capturing, setCapturing] = useState(false);

  const webcamRef = useRef<Webcam>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const filters = [
    { name: "Original", value: "none" },
    { name: "Black & White", value: "grayscale(1)" },
    { name: "Sepia", value: "sepia(1)" },
    { name: "Vintage", value: "contrast(1.2) brightness(1.1) sepia(0.5)" },
    { name: "Cool", value: "hue-rotate(180deg)" },
    { name: "Warm", value: "hue-rotate(-20deg) saturate(1.4)" },
    { name: "Bright", value: "brightness(1.4)" },
    { name: "Soft", value: "brightness(1.1) contrast(0.9)" },
    { name: "Dramatic", value: "contrast(1.6)" },
  ];

  const getGridCols = useCallback((count: number) => {
    if (count <= 3) return count;
    if (count === 4) return 2;
    if (count <= 6) return 3;
    if (count <= 12) return 4;
    return 5;
  }, []);

  const cols = getGridCols(count);

  const rows: number[] = [];
  let remaining = count;

  while (remaining > 0) {
    const cells = Math.min(cols, remaining);
    rows.push(cells);
    remaining -= cells;
  }

  const gridWidth = useMemo(() => {
    if (count <= 1) return "max-w-sm";
    if (count <= 4) return "max-w-xl";
    if (count <= 6) return "max-w-4xl";
    return "max-w-6xl";
  }, [count]);

  const allFilled = useMemo(
    () => images.filter(Boolean).length === count,
    [images, count],
  );

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const handleCapture = useCallback(async () => {
    if (!webcamRef.current || cameraIndex === null) return;

    const video = webcamRef.current.video;
    if (!video) return;

    setCapturing(true);

    const frames: string[] = [];

    for (let i = 0; i < 6; i++) {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) continue;

      ctx.filter = filter;
      ctx.drawImage(video, 0, 0);

      frames.push(canvas.toDataURL("image/jpeg"));
      await delay(250);
    }

    setFramesList((prev) => {
      const updated = [...prev];
      updated[cameraIndex] = frames;
      return updated;
    });

    gifshot.createGIF(
      {
        images: frames,
        interval: 0.25,
        gifWidth: 400,
        gifHeight: 400,
        numWorkers: 4,
        quality: 5,
      },
      (obj: GifResult) => {
        if (!obj.error) {
          setImages((prev) => {
            const updated = [...prev];
            updated[cameraIndex] = obj.image;
            return updated;
          });
        }

        setCameraIndex(null);
        setCapturing(false);
      },
    );
  }, [cameraIndex, filter]);

  const generateLayoutGif = async () => {
    if (saving || framesList.length !== count) return;

    setSaving(true);

    try {
      const frameCount = 6;
      const layoutFrames: string[] = [];

      const cols = getGridCols(count);
      const size = 800;
      const padding = 40;
      const gap = 24;

      const usable = size - padding * 2;
      const cell = (usable - gap * (cols - 1)) / cols;

      for (let f = 0; f < frameCount; f++) {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        ctx.fillStyle = "#60a5fa";
        ctx.fillRect(0, 0, size, size);

        for (let i = 0; i < framesList.length; i++) {
          const frame = framesList[i]?.[f];
          if (!frame) continue;

          const img = new Image();
          img.src = frame;

          await new Promise((res) => (img.onload = res));

          const row = Math.floor(i / cols);
          const col = i % cols;

          const x = padding + col * (cell + gap);
          const y = padding + row * (cell + gap);

          const radius = 24;

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(x + radius, y);
          ctx.lineTo(x + cell - radius, y);
          ctx.quadraticCurveTo(x + cell, y, x + cell, y + radius);
          ctx.lineTo(x + cell, y + cell - radius);
          ctx.quadraticCurveTo(x + cell, y + cell, x + cell - radius, y + cell);
          ctx.lineTo(x + radius, y + cell);
          ctx.quadraticCurveTo(x, y + cell, x, y + cell - radius);
          ctx.lineTo(x, y + radius);
          ctx.quadraticCurveTo(x, y, x + radius, y);
          ctx.closePath();
          ctx.clip();

          ctx.drawImage(img, x, y, cell, cell);

          ctx.restore();
        }

        layoutFrames.push(canvas.toDataURL("image/jpeg"));
      }

      gifshot.createGIF(
        {
          images: layoutFrames,
          interval: 0.25,
          gifWidth: size,
          gifHeight: size,
          numWorkers: 4,
          quality: 5,
        },
        async (obj: GifResult) => {
          if (!obj.error) {
            const res = await fetch("/api/upload", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ image: obj.image }),
            });

            const data = await res.json();

            router.push(
              `/payment?title=${encodeURIComponent(
                title,
              )}&price=${price}&img=${encodeURIComponent(data.url)}`,
            );
          }
        },
      );
    } catch (err) {
      console.error(err);
      setSaving(false);
    }
  };

  return (
    <>
      <div className="w-full bg-blue-50 px-6 pt-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-xl"
        >
          <ArrowLeft size={18} />
          Back
        </button>
      </div>

      <div className="min-h-screen p-10 bg-blue-50">
        <h1 className="text-3xl underline font-bold text-blue-600 mb-10">
          {title}
        </h1>

        <div
          ref={gridRef}
          className="flex flex-col gap-2 w-fit mx-auto p-3 rounded-xl"
          style={{ backgroundColor: "#60a5fa" }}
        >
          {rows.map((cellsInRow, rowIndex) => (
            <div key={rowIndex} className="flex justify-center flex-wrap gap-2">
              {Array.from({ length: cellsInRow }).map((_, colIndex) => {
                const index =
                  rows.slice(0, rowIndex).reduce((a, b) => a + b, 0) + colIndex;

                return (
                  <div
                    key={index}
                    className="relative w-32 sm:w-36 md:w-40 aspect-square bg-white rounded-xl overflow-hidden group"
                  >
                    {images[index] ? (
                      <img
                        src={images[index]}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <span className="text-4xl">+</span>
                        Add GIF
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-3 transition">
                      <button
                        onClick={() => !saving && setCameraIndex(index)}
                        disabled={saving}
                        className={`px-4 py-2 rounded-lg text-white transition ${
                          saving
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-300 hover:bg-blue-400 cursor-pointer"
                        }`}
                      >
                        {images[index] ? "Recapture" : "Capture"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {allFilled && (
          <div className="mt-12 flex justify-center">
            <button
              onClick={generateLayoutGif}
              disabled={saving}
              className={`px-8 py-3 rounded-xl text-lg text-white transition ${
                saving
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-400 hover:bg-blue-500 active:bg-blue-600 shadow-lg cursor-pointer"
              }`}
            >
              {saving ? "Saving..." : "Save Layout"}
            </button>
          </div>
        )}
      </div>

      {cameraIndex !== null && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-3xl flex flex-col items-center gap-4">
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="rounded-xl"
              videoConstraints={{ facingMode: "user" }}
              style={{ filter }}
            />

            <div className="flex gap-3 overflow-x-auto scrollbar-hide max-w-md pb-2 bg-blue-50 shadow-lg p-3 rounded-lg">
              {filters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition cursor-pointer ${
                    filter === f.value
                      ? "bg-blue-400 text-white"
                      : "bg-blue-200 hover:bg-blue-300"
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>

            <button
              onClick={handleCapture}
              disabled={capturing}
              className={`px-6 py-2 rounded-xl text-white transition ${
                capturing
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 cursor-pointer"
              }`}
            >
              {capturing ? "Capturing..." : "Capture GIF"}
            </button>

            <button
              onClick={() => setCameraIndex(null)}
              className="bg-gray-300 px-6 py-2 rounded-xl"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useRef, useCallback, useMemo } from "react";
import Webcam from "react-webcam";
import gifshot from "gifshot";
import Link from "next/link";

type GifResult = { error: boolean; image: string };

export default function EditLayoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const title = searchParams.get("title") ?? "";
  const count = Number(searchParams.get("count"));
  const price = Number(searchParams.get("price"));
  const rows = Number(searchParams.get("rows"));
  const cols = Number(searchParams.get("cols"));
  const bgType = searchParams.get("bgType");
  const bgValue = searchParams.get("bgValue") ?? "#60a5fa";

  const webcamRef = useRef<Webcam>(null);

  const [framesList, setFramesList] = useState<string[][]>(
    Array.from({ length: count }, () => []),
  );

  const [images, setImages] = useState<string[]>(
    Array.from({ length: count }, () => ""),
  );

  const [filter, setFilter] = useState("none");
  const [capturing, setCapturing] = useState(false);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

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

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const allFilled = useMemo(() => images.every((img) => img !== ""), [images]);

  const handleDelete = (index: number) => {
    setImages((prev) => {
      const updated = [...prev];
      updated[index] = "";
      return updated;
    });

    setFramesList((prev) => {
      const updated = [...prev];
      updated[index] = [];
      return updated;
    });

    setSelectedCell(index);
  };

  const handleCapture = useCallback(async () => {
    if (!webcamRef.current || selectedCell === null) return;

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
      updated[selectedCell] = frames;
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
            updated[selectedCell] = obj.image;
            return updated;
          });
        }

        setCapturing(false);
        setSelectedCell(null);
      },
    );
  }, [selectedCell, filter]);

  const generateLayoutGif = async () => {
    if (!allFilled || saving) return;

    setSaving(true);

    try {
      const FRAME_COUNT = 6;
      const CELL_SIZE = 260;
      const GAP = 20;
      const PADDING = 40;

      const layoutFrames: string[] = [];

      const canvasWidth = cols * CELL_SIZE + GAP * (cols - 1) + PADDING * 2;
      const canvasHeight = rows * CELL_SIZE + GAP * (rows - 1) + PADDING * 2;

      for (let f = 0; f < FRAME_COUNT; f++) {
        const canvas = document.createElement("canvas");

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        if (bgType === "image") {
          const bg = new Image();
          bg.crossOrigin = "anonymous";
          bg.src = bgValue;

          await new Promise((res) => (bg.onload = res));
          ctx.drawImage(bg, 0, 0, canvasWidth, canvasHeight);
        } else {
          ctx.fillStyle = bgValue;
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        }

        for (let i = 0; i < framesList.length; i++) {
          const frame = framesList[i]?.[f];
          if (!frame) continue;

          const img = new Image();
          img.src = frame;

          await new Promise((res) => (img.onload = res));

          const row = Math.floor(i / cols);
          const col = i % cols;

          const x = PADDING + col * (CELL_SIZE + GAP);
          const y = PADDING + row * (CELL_SIZE + GAP);

          const radius = 24;

          ctx.save();

          ctx.beginPath();
          ctx.moveTo(x + radius, y);
          ctx.lineTo(x + CELL_SIZE - radius, y);
          ctx.quadraticCurveTo(x + CELL_SIZE, y, x + CELL_SIZE, y + radius);
          ctx.lineTo(x + CELL_SIZE, y + CELL_SIZE - radius);
          ctx.quadraticCurveTo(
            x + CELL_SIZE,
            y + CELL_SIZE,
            x + CELL_SIZE - radius,
            y + CELL_SIZE,
          );
          ctx.lineTo(x + radius, y + CELL_SIZE);
          ctx.quadraticCurveTo(x, y + CELL_SIZE, x, y + CELL_SIZE - radius);
          ctx.lineTo(x, y + radius);
          ctx.quadraticCurveTo(x, y, x + radius, y);
          ctx.closePath();

          ctx.clip();

          ctx.drawImage(img, x, y, CELL_SIZE, CELL_SIZE);

          ctx.restore();
        }

        layoutFrames.push(canvas.toDataURL("image/jpeg"));
      }

      gifshot.createGIF(
        {
          images: layoutFrames,
          interval: 0.25,
          gifWidth: canvasWidth,
          gifHeight: canvasHeight,
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

          setSaving(false);
        },
      );
    } catch (error) {
      console.error(error);
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-500 via-pink-400 to-purple-600 text-white flex flex-col items-center justify-center p-10">
      <nav className="absolute top-0 w-full max-w-7xl flex items-center justify-between p-6">
        <Link href="/" className="text-2xl font-bold text-white">
          PhotoBooth
        </Link>
      </nav>

      <h1 className="text-3xl font-bold mb-12">Photobooth Capture</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 max-w-[1400px] w-full items-center">
        <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-10 shadow-xl flex flex-col items-center">
          <p className="mb-6 text-white/80">Template Preview</p>

          <div
            className="grid gap-4 p-4 rounded-xl"
            style={{
              background:
                bgType === "image" ? `url(${bgValue}) center/cover` : bgValue,
              gridTemplateColumns: `repeat(${cols},1fr)`,
            }}
          >
            {images.map((img, i) => (
              <div
                key={i}
                onClick={() => setSelectedCell(i)}
                className={`relative w-24 h-24 bg-white rounded-lg overflow-hidden group cursor-pointer ${
                  selectedCell === i ? "ring-4 ring-purple-400" : ""
                }`}
              >
                {img ? (
                  <img src={img} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    +
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center gap-8">
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="rounded-2xl shadow-xl w-[640px] h-[480px] object-cover"
            videoConstraints={{ facingMode: "user" }}
            style={{ filter }}
          />

          <button
            onClick={handleCapture}
            disabled={capturing || selectedCell === null}
            className="px-10 py-4 text-lg rounded-xl bg-white text-purple-600 font-semibold hover:scale-105 transition shadow-lg disabled:opacity-50"
          >
            {capturing ? "Capturing..." : "Capture"}
          </button>
        </div>

        <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-10 shadow-xl flex flex-col gap-4">
          <p className="text-white/80 mb-2">Filters</p>

          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-6 py-3 text-lg rounded-xl ${
                filter === f.value
                  ? "bg-white text-purple-600"
                  : "bg-white/30 hover:bg-white/50"
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>

      {allFilled && (
        <div className="mt-12">
          <button
            onClick={generateLayoutGif}
            disabled={saving}
            className="px-12 py-4 text-lg rounded-xl bg-white text-purple-600 font-semibold hover:scale-105 transition shadow-lg"
          >
            {saving ? "Saving..." : "Save Layout"}
          </button>
        </div>
      )}
    </div>
  );
}

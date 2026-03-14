"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useRef, useCallback, useMemo } from "react";
import Webcam from "react-webcam";
import { ArrowLeft } from "lucide-react";
import gifshot from "gifshot";
import html2canvas from "html2canvas";

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

  const [framesList, setFramesList] = useState<string[][]>(
    Array(count).fill([]),
  );
  const [images, setImages] = useState<string[]>(Array(count).fill(""));
  const [cameraIndex, setCameraIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("none");
  const [capturing, setCapturing] = useState(false);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const webcamRef = useRef<Webcam>(null);

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

  const allFilled = useMemo(
    () => images.filter(Boolean).length === count,
    [images, count],
  );

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

        /* -------- BACKGROUND -------- */

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

        /* -------- DRAW PHOTOS -------- */

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

      /* -------- CREATE FINAL GIF -------- */

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
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ image: obj.image }),
            });

            const data = await res.json();

            setSaving(false); // ✅ stop loading here

            router.push(
              `/payment?title=${encodeURIComponent(
                title,
              )}&price=${price}&img=${encodeURIComponent(data.url)}`,
            );
          } else {
            setSaving(false); // handle error
          }
        },
      );
    } catch (error) {
      console.error(error);
      setSaving(false);
    }
  };

  const gridCells = Array.from({ length: count });

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
          id="capture-grid"
          className="grid gap-3 mx-auto p-6 rounded-2xl w-fit"
          style={{
            background:
              bgType === "image"
                ? `url(${bgValue}) center/cover no-repeat`
                : bgValue,
            gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`,
          }}
        >
          {gridCells.map((_, index) => (
            <div
              key={index}
              className="relative w-32 sm:w-36 md:w-40 aspect-square bg-white rounded-lg overflow-hidden group"
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

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                <button
                  onClick={() => !saving && setCameraIndex(index)}
                  disabled={saving}
                  className={`px-4 py-2 rounded-lg cursor-pointer text-white ${
                    saving ? "bg-gray-400" : "bg-blue-300 hover:bg-blue-400"
                  }`}
                >
                  {images[index] ? "Recapture" : "Capture"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {allFilled && (
          <div className="mt-12 flex justify-center">
            <button
              onClick={generateLayoutGif}
              disabled={saving}
              className={`px-8 py-3 rounded-xl text-lg text-white ${
                saving
                  ? "bg-gray-400"
                  : "bg-blue-400 hover:bg-blue-500 cursor-pointer"
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

            <div className="flex gap-3 overflow-x-auto max-w-md pb-2 scrollbar-hide bg-blue-50 shadow-lg p-3 rounded-lg">
              {filters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-4 py-2 rounded-xl cursor-pointer text-sm ${
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
              className={`px-6 py-2 rounded-xl text-white ${
                capturing
                  ? "bg-gray-400"
                  : "bg-blue-500 hover:bg-blue-600 cursor-pointer"
              }`}
            >
              {capturing ? "Capturing..." : "Capture GIF"}
            </button>

            <button
              onClick={() => setCameraIndex(null)}
              className="bg-gray-300 px-6 py-2 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}

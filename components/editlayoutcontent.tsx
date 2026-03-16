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

  const CELL_SIZE = 120;
  const GAP = 8;
  const PREVIEW_PADDING = 24;

  const previewWidth =
    cols * CELL_SIZE + (cols - 1) * GAP + PREVIEW_PADDING * 2;

  const previewHeight =
    rows * CELL_SIZE + (rows - 1) * GAP + PREVIEW_PADDING * 2;

  const isWidePreview = previewWidth > 420;

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
      const CELL = 260;
      const GAP = 20;
      const PADDING = 40;

      const canvasWidth = cols * CELL + GAP * (cols - 1) + PADDING * 2;
      const canvasHeight = rows * CELL + GAP * (rows - 1) + PADDING * 2;

      const layoutFrames: string[] = [];

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
          await new Promise((r) => (bg.onload = r));
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
          await new Promise((r) => (img.onload = r));

          const row = Math.floor(i / cols);
          const col = i % cols;

          const x = PADDING + col * (CELL + GAP);
          const y = PADDING + row * (CELL + GAP);

          ctx.drawImage(img, x, y, CELL, CELL);
        }

        layoutFrames.push(canvas.toDataURL("image/jpeg"));
      }

      gifshot.createGIF(
        {
          images: layoutFrames,
          interval: 0.25,
          gifWidth: canvasWidth,
          gifHeight: canvasHeight,
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
    <div className="min-h-screen bg-gradient-to-r from-purple-500 via-pink-400 to-purple-600 text-white flex flex-col items-center p-10">
      {" "}
      <nav className="absolute top-0 w-full max-w-7xl flex justify-between p-6">
        {" "}
        <Link href="/" className="text-2xl font-bold">
          PhotoBooth{" "}
        </Link>{" "}
      </nav>
      <h1 className="text-3xl font-bold mb-12">Photobooth Capture</h1>
      <div
        className={`grid gap-10 w-full max-w-[1400px]
    ${
      isWidePreview
        ? "grid-cols-1 lg:grid-cols-2"
        : "grid-cols-1 lg:grid-cols-3"
    }`}
      >
        {/* PREVIEW */}
        <div
          className={`bg-white/20 backdrop-blur-lg p-10 rounded-2xl flex flex-col items-center
      ${isWidePreview ? "lg:col-span-2" : ""}`}
        >
          <p className="mb-6 text-white/80">Template Preview</p>

          <div className="w-full scrollbar-hide overflow-x-auto">
            <div className="min-w-max flex justify-center">
              <div
                className="rounded-xl flex items-center justify-center"
                style={{
                  width: previewWidth,
                  height: previewHeight,
                  background:
                    bgType === "image"
                      ? `url(${bgValue}) center/cover`
                      : bgValue,
                  padding: PREVIEW_PADDING,
                }}
              >
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: `repeat(${cols}, ${CELL_SIZE}px)`,
                    gridTemplateRows: `repeat(${rows}, ${CELL_SIZE}px)`,
                    gap: GAP,
                  }}
                >
                  {images.map((img, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedCell(i)}
                      className={`relative bg-white rounded-xl overflow-hidden cursor-pointer
            ${
              selectedCell === i
                ? "ring-4 ring-purple-500 ring-offset-2 ring-offset-white"
                : "hover:ring-2 hover:ring-white/60"
            }`}
                      style={{
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                      }}
                    >
                      {img ? (
                        <img src={img} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-lg font-bold">
                          +
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CAMERA */}
        <div className="flex flex-col items-center gap-6">
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
            className="px-10 py-4 bg-white text-purple-600 rounded-xl font-semibold"
          >
            {capturing ? "Capturing..." : "Capture"}
          </button>
        </div>

        {/* FILTERS */}
        <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-10 flex flex-col gap-4">
          <p className="text-white/80 mb-2">Filters</p>

          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-lg ${
                filter === f.value ? "bg-white text-purple-600" : "bg-white/30"
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>
      {allFilled && (
        <button
          onClick={generateLayoutGif}
          className="mt-12 px-12 py-4 bg-white text-purple-600 rounded-xl font-semibold"
        >
          Save Layout
        </button>
      )}
    </div>
  );
}

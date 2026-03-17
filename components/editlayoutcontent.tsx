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

  // Detect vertical layout
  const isVerticalLayout = rows > cols;

  // Responsive sizing
  const GAP = isVerticalLayout ? 6 : 8;
  const PREVIEW_PADDING = isVerticalLayout ? 16 : 24;

  // Auto-fit based on screen height
  const maxHeight =
    typeof window !== "undefined" ? window.innerHeight * 0.6 : 500;

  const CELL_SIZE = Math.min(
    120,
    Math.floor((maxHeight - PREVIEW_PADDING * 2 - GAP * (rows - 1)) / rows),
  );

  const previewWidth =
    cols * CELL_SIZE + (cols - 1) * GAP + PREVIEW_PADDING * 2;

  const previewHeight =
    rows * CELL_SIZE + (rows - 1) * GAP + PREVIEW_PADDING * 2;

  const isWidePreview = previewWidth > 420;

  const [framesList, setFramesList] = useState<string[][]>(
    Array.from({ length: count }, () => []),
  );

  const [staticImages, setStaticImages] = useState<string[]>(
    Array.from({ length: count }, () => ""),
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

    try {
      const frames: string[] = [];

      // 🎯 Capture frames
      for (let i = 0; i < 6; i++) {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        ctx.filter = filter;
        ctx.drawImage(video, 0, 0);

        frames.push(canvas.toDataURL("image/jpeg"));

        await new Promise((res) => setTimeout(res, 250));
      }

      // 🎯 Get middle frame (for static image)
      const middleIndex = Math.floor(frames.length / 2);
      const middleFrame = frames[middleIndex];

      // ✅ Save frames (for final layout GIF later)
      setFramesList((prev) => {
        const updated = [...prev];
        updated[selectedCell] = frames;
        return updated;
      });

      // ✅ Save STATIC IMAGE (middle frame)
      setStaticImages((prev) => {
        const updated = [...prev];
        updated[selectedCell] = middleFrame;
        return updated;
      });

      // 🎯 Create GIF
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
            // ✅ Save GIF
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
    } catch (err) {
      console.error(err);
      setCapturing(false);
    }
  }, [selectedCell, filter]);

  function drawRoundedImage(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ) {
    ctx.save();

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();

    ctx.clip();

    ctx.drawImage(img, x, y, width, height);

    ctx.restore();
  }

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

      // ================================
      // 🎞️ CREATE FINAL GIF
      // ================================
      for (let f = 0; f < FRAME_COUNT; f++) {
        const canvas = document.createElement("canvas");
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        // 🎨 Background
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

        // 🧩 Draw each cell frame
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

          drawRoundedImage(ctx, img, x, y, CELL, CELL, 20);
        }

        layoutFrames.push(canvas.toDataURL("image/jpeg"));
      }

      // ================================
      // 🖼️ CREATE FINAL IMAGE (MIDDLE FRAME)
      // ================================
      const imageCanvas = document.createElement("canvas");
      imageCanvas.width = canvasWidth;
      imageCanvas.height = canvasHeight;

      const imageCtx = imageCanvas.getContext("2d");
      if (!imageCtx) return;

      // 🎨 Background
      if (bgType === "image") {
        const bg = new Image();
        bg.crossOrigin = "anonymous";
        bg.src = bgValue;
        await new Promise((r) => (bg.onload = r));
        imageCtx.drawImage(bg, 0, 0, canvasWidth, canvasHeight);
      } else {
        imageCtx.fillStyle = bgValue;
        imageCtx.fillRect(0, 0, canvasWidth, canvasHeight);
      }

      // 🧩 Use STATIC IMAGES (middle frame)
      for (let i = 0; i < staticImages.length; i++) {
        const frame = staticImages[i];
        if (!frame) continue;

        const img = new Image();
        img.src = frame;
        await new Promise((r) => (img.onload = r));

        const row = Math.floor(i / cols);
        const col = i % cols;

        const x = PADDING + col * (CELL + GAP);
        const y = PADDING + row * (CELL + GAP);

        drawRoundedImage(imageCtx, img, x, y, CELL, CELL, 20);
      }

      const finalImage = imageCanvas.toDataURL("image/jpeg");

      // ================================
      // 🚀 CREATE GIF FILE
      // ================================
      gifshot.createGIF(
        {
          images: layoutFrames,
          interval: 0.25,
          gifWidth: canvasWidth,
          gifHeight: canvasHeight,
        },
        async (obj: GifResult) => {
          if (obj.error) {
            setSaving(false);
            return;
          }

          try {
            // ================================
            // ☁️ UPLOAD BOTH
            // ================================
            const res = await fetch("/api/upload", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                gif: obj.image,
                image: finalImage,
              }),
            });

            const data = await res.json();

            router.push(
              `/success?gif=${encodeURIComponent(
                data.gifUrl,
              )}&img=${encodeURIComponent(data.imageUrl)}`,
            );
          } catch (err) {
            console.error("Upload failed", err);
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
    <div className="min-h-screen bg-gradient-to-r from-purple-500 via-pink-400 to-purple-600 text-white flex flex-col items-center px-4 py-6">
      {/* HEADER */}
      <nav className="w-full max-w-6xl flex justify-between items-center mb-6">
        <Link href="/" className="text-xl sm:text-2xl font-bold">
          PhotoBooth
        </Link>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">
        Photobooth Capture
      </h1>

      {/* MAIN GRID */}
      <div
        className={`grid gap-6 w-full max-w-6xl
      ${isWidePreview ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 lg:grid-cols-3"}
    `}
      >
        {/* PREVIEW */}
        <div
          className={`bg-white/20 backdrop-blur-lg p-6 rounded-2xl flex flex-col items-center
        ${isWidePreview ? "lg:col-span-2" : ""}
      `}
        >
          <p className="mb-4 text-white/80">Template Preview</p>

          {/* SCROLL FIX */}
          <div className="w-full overflow-auto max-h-[70vh]">
            <div className="min-w-max flex justify-center items-center">
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
        <div className="flex flex-col items-center gap-4">
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="rounded-2xl shadow-xl w-full max-w-[500px] aspect-video object-cover"
            videoConstraints={{ facingMode: "user" }}
            style={{ filter }}
          />

          <button
            onClick={handleCapture}
            disabled={capturing || selectedCell === null}
            className="px-6 py-3 bg-white text-purple-600 rounded-xl font-semibold w-full max-w-[300px]"
          >
            {capturing ? "Capturing..." : "Capture"}
          </button>
        </div>

        {/* FILTERS */}
        <div className="bg-white/20 backdrop-blur-lg rounded-2xl p-6 flex flex-col gap-4 w-full">
          <p className="text-white/80 mb-2">Filters</p>

          {/* GRID FOR MOBILE */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-2 text-sm rounded-lg ${
                  filter === f.value
                    ? "bg-white text-purple-600"
                    : "bg-white/30"
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SAVE BUTTON */}
      {allFilled && (
        <button
          onClick={generateLayoutGif}
          className="mt-8 px-8 py-3 bg-white text-purple-600 rounded-xl font-semibold w-full max-w-[300px]"
        >
          Save Layout
        </button>
      )}
    </div>
  );
}

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

  const isVerticalLayout = rows > cols;

  const GAP = isVerticalLayout ? 6 : 8;
  const PREVIEW_PADDING = isVerticalLayout ? 16 : 24;

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
  const [saveProgress, setSaveProgress] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isAutoCapturing, setIsAutoCapturing] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);

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

  const allFilled = useMemo(() => staticImages.every((img) => img !== ""), [staticImages]);

  const handleCapture = useCallback(async (targetIndex?: number) => {
    const activeIndex = targetIndex !== undefined ? targetIndex : selectedCell;
    if (!webcamRef.current || activeIndex === null) return;

    const video = webcamRef.current.video;
    if (!video) return;

    setCapturing(true);

    return new Promise<void>(async (resolve) => {
      try {
        const frames: string[] = [];

        for (let i = 0; i < 6; i++) {
          const canvas = document.createElement("canvas");

          // Use crop to create a square image matching the aspect-square view
          const minDim = Math.min(video.videoWidth, video.videoHeight);
          canvas.width = minDim;
          canvas.height = minDim;

          const ctx = canvas.getContext("2d");
          if (!ctx) continue;

          const sx = (video.videoWidth - minDim) / 2;
          const sy = (video.videoHeight - minDim) / 2;

          ctx.drawImage(video, sx, sy, minDim, minDim, 0, 0, minDim, minDim);

          frames.push(canvas.toDataURL("image/jpeg", 1.0));

          await new Promise((res) => setTimeout(res, 250));
        }

        const middleIndex = Math.floor(frames.length / 2);
        const middleFrame = frames[middleIndex];

        setFramesList((prev) => {
          const updated = [...prev];
          updated[activeIndex] = frames;
          return updated;
        });

        setStaticImages((prev) => {
          const updated = [...prev];
          updated[activeIndex] = middleFrame;
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
                updated[activeIndex] = obj.image;
                return updated;
              });
            }

            setCapturing(false);
            if (targetIndex === undefined) setSelectedCell(null);
            resolve();
          },
        );
      } catch (err) {
        console.error(err);
        setCapturing(false);
        resolve();
      }
    });
  }, [selectedCell, filter]);

  const handleAutoCapture = useCallback(async () => {
    if (isAutoCapturing) return;

    setIsAutoCapturing(true);

    for (let i = 0; i < count; i++) {
      setSelectedCell(i);

      // Start Countdown
      for (let c = 3; c > 0; c--) {
        setCountdown(c);
        await delay(1000);
      }

      setCountdown(null); // Clear countdown for snapshot

      await handleCapture(i);

      // Small pause between captures
      await delay(1000);
    }

    setIsAutoCapturing(false);
    setSelectedCell(null);
  }, [count, handleCapture, isAutoCapturing]);

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
    setSaveProgress(0);

    try {
      const FRAME_COUNT = 6;
      const CELL = 1080;
      const GAP = 60;
      const PADDING = 120;

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

        ctx.filter = filter;

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

        layoutFrames.push(canvas.toDataURL("image/jpeg", 1.0));
      }

      const imageCanvas = document.createElement("canvas");
      imageCanvas.width = canvasWidth;
      imageCanvas.height = canvasHeight;

      const imageCtx = imageCanvas.getContext("2d");
      if (!imageCtx) return;

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

      imageCtx.filter = filter;

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

      const finalImage = imageCanvas.toDataURL("image/png");

      // Scale down GIF generation to prevent incredibly slow processing and huge uploads
      const maxGifSize = 600;
      const gifRatio = Math.min(1, maxGifSize / Math.max(canvasWidth, canvasHeight));
      const gifW = Math.round(canvasWidth * gifRatio);
      const gifH = Math.round(canvasHeight * gifRatio);

      gifshot.createGIF(
        {
          images: layoutFrames,
          interval: 0.25,
          gifWidth: gifW,
          gifHeight: gifH,
          numWorkers: 4,
          quality: 10,
          progressCallback: (captureProgress: number) => {
            setSaveProgress(Math.floor(captureProgress * 80)); // 0-80% for gif creation
          }
        },
        async (obj: GifResult) => {
          if (obj.error) {
            setSaving(false);
            setSaveProgress(0);
            return;
          }

          setSaveProgress(85); // GIF done, preparing upload

          try {
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

            setSaveProgress(100); // Upload done

            router.push(
              `/payment?title=${encodeURIComponent(title)}
  &price=${price}
  &gif=${encodeURIComponent(data.gifUrl)}
  &img=${encodeURIComponent(data.imageUrl)}
  &rows=${rows}
  &cols=${cols}`,
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
      <nav className="w-full max-w-6xl flex justify-between items-center mb-6">
        <Link href="/" className="text-xl sm:text-2xl font-bold cursor-pointer">
          PhotoBooth
        </Link>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">
        Photobooth Capture
      </h1>

      {/* Enlarged Capture Screen Section */}
      <div className="w-full max-w-5xl flex flex-col items-center gap-6 mb-12">
        <div className="relative w-full max-w-[500px] aspect-square rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] ring-8 ring-white/10 group">
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-full h-full object-cover transform scale-x-[-1]" // Balanced mirroring
            videoConstraints={{
              facingMode: "user",
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            }}
            style={{ filter }}
            onUserMediaError={(err) => {
              console.error("Camera Error:", err);
              if (typeof window !== "undefined" && window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
                setCamError("Camera requires HTTPS to work. Ensure your deployed site uses https://");
              } else {
                setCamError("Camera access denied or device not found. Please allow permissions in your browser.");
              }
            }}
          />

          {camError && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-6 z-30">
              <span className="text-red-400 text-4xl mb-4">⚠️</span>
              <h3 className="text-xl font-bold text-white mb-2">Camera Unavailable</h3>
              <p className="text-white/80">{camError}</p>
            </div>
          )}

          {/* Countdown Overlay */}
          {countdown !== null && (
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
              <div className="text-9xl font-black text-white drop-shadow-[0_0_20px_rgba(147,51,234,0.8)] animate-ping-once transition-all">
                {countdown}
              </div>
            </div>
          )}

          {/* Overlay when capturing */}
          {capturing && (
            <div className="absolute inset-0 z-10 bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xl font-bold tracking-widest uppercase">Capturing Moments...</p>
              </div>
            </div>
          )}

          {/* Slot Selection Hint overlay if no cell selected */}
          {selectedCell === null && !capturing && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="bg-white/90 text-purple-600 px-6 py-2 rounded-full font-bold shadow-lg">
                Select a slot in the template below
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => handleCapture()}
            disabled={capturing || selectedCell === null || isAutoCapturing || saving}
            className={`px-10 py-4 rounded-2xl font-bold text-lg shadow-xl transform active:scale-95 transition-all duration-300 flex items-center gap-3
              ${capturing || selectedCell === null || isAutoCapturing || saving
                ? "bg-white/40 text-white/50 cursor-not-allowed scale-95"
                : "bg-white text-purple-600 hover:bg-purple-50 hover:shadow-2xl cursor-pointer"
              }`}
          >
            <div className={`w-3 h-3 rounded-full ${capturing && !isAutoCapturing ? "bg-red-500 animate-ping" : "bg-purple-600"}`}></div>
            {capturing && !isAutoCapturing ? "Capturing..." : selectedCell === null ? "Select Slot Below" : "Snap Photo"}
          </button>

          <button
            onClick={handleAutoCapture}
            disabled={capturing || isAutoCapturing || saving}
            className={`px-10 py-4 rounded-2xl font-bold text-lg shadow-xl transform active:scale-95 transition-all duration-300 flex items-center gap-3
              ${capturing || isAutoCapturing || saving
                ? "bg-purple-800/40 text-white/50 cursor-not-allowed scale-95"
                : "bg-purple-600 text-white hover:bg-purple-700 hover:shadow-2xl cursor-pointer border border-white/20"
              }`}
          >
            <div className={`w-3 h-3 rounded-full ${isAutoCapturing ? "bg-red-500 animate-pulse" : "bg-white"}`}></div>
            {isAutoCapturing ? "Auto Sequence..." : "Capture All"}
          </button>
        </div>
      </div>

      <div
        className={`grid gap-8 w-full max-w-6xl
      ${isWidePreview ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}
    `}
      >
        <div
          className={`bg-white/20 backdrop-blur-lg p-8 rounded-3xl flex flex-col items-center shadow-xl
        ${isWidePreview ? "lg:col-span-2" : "lg:col-span-2"}
      `}
        >
          <div className="flex items-center justify-between w-full mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-2 h-6 bg-white rounded-full"></span>
              Template Preview
            </h2>
            <p className="text-white/60 text-sm">{allFilled ? "Perfect! Ready to save." : "Tap a slot to select"}</p>
          </div>

          <div className="w-full overflow-auto max-h-[60vh] custom-scrollbar rounded-xl">
            <div className="min-w-max flex justify-center items-center py-4 px-2">
              <div
                className="rounded-2xl shadow-2xl flex items-center justify-center transition-transform hover:scale-[1.02] duration-500"
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
                  {staticImages.map((img, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedCell(i)}
                      className={`relative bg-white rounded-xl overflow-hidden cursor-pointer shadow-md transition-all duration-300
                    ${selectedCell === i
                          ? "ring-4 ring-white ring-offset-4 ring-offset-purple-500 scale-105 z-10"
                          : "hover:ring-2 hover:ring-white/60 hover:scale-[1.03]"
                        }`}
                      style={{
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                      }}
                    >
                      {img ? (
                        <img src={img} className="w-full h-full object-cover" style={{ filter }} />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 group">
                          <span className="text-2xl font-bold group-hover:scale-125 transition-transform text-purple-200">+</span>
                          <span className="text-[10px] uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">Select</span>
                        </div>
                        //jhv
                      )}

                      {selectedCell === i && !img && (
                        <div className="absolute inset-0 bg-purple-500/20 animate-pulse flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-8 flex flex-col gap-6 w-full shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-6 bg-white rounded-full"></span>
            <h2 className="text-xl font-bold">Filters</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                disabled={saving}
                className={`px-4 py-3 text-sm rounded-2xl transition-all duration-300 font-medium ${filter === f.value
                  ? "bg-white text-purple-600 shadow-lg scale-105"
                  : "bg-white/10 hover:bg-white/20 text-white"
                  } ${saving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                {f.name}
              </button>
            ))}
          </div>

          <div className="mt-4 p-4 bg-purple-900/20 rounded-2xl border border-white/10">
            <p className="text-xs text-white/60 text-center italic">
              Filters affect both the live preview and the final capture.
            </p>
          </div>
        </div>
      </div>

      {allFilled && (
        <button
          onClick={generateLayoutGif}
          disabled={saving}
          className={`relative overflow-hidden mt-8 px-8 py-3 rounded-xl font-semibold w-full max-w-[300px] transition-all
    ${saving
              ? "bg-purple-900/50 text-white cursor-wait"
              : "bg-white text-purple-600 cursor-pointer hover:bg-white/90"
            }`}
        >
          {saving && (
            <>
              <div
                className="absolute left-0 top-0 bottom-0 bg-purple-500 transition-all duration-300 ease-out"
                style={{ width: `${saveProgress}%` }}
              ></div>
              {/* Wave/Shimmer effect layer */}
              <div
                className="absolute inset-0 animate-wave wave-bg z-0"
                style={{ opacity: saveProgress > 0 ? 1 : 0 }}
              ></div>
            </>
          )}

          <span className="relative z-10 flex flex-col items-center justify-center">
            {saving ? `Saving... ${saveProgress}%` : "Save Layout"}
          </span>
        </button>
      )}
    </div>
  );
}

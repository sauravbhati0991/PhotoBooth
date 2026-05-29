"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import Webcam from "react-webcam";
import gifshot from "gifshot";
import Link from "next/link";
import { Volume2, VolumeX, Square } from "lucide-react";
import { useVoicePrompt } from "@/hooks/useVoicePrompt";
import CustomModal from "./customModal";

type GifResult = { error: boolean; image: string };

export default function EditLayoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const id = searchParams.get("id");
  const title = searchParams.get("title") ?? "";
  const price = Number(searchParams.get("price")) || 0;

  const [layout, setLayout] = useState<any>(null);

  // Fetch custom layout configuration
  useEffect(() => {
    if (id) {
      fetch(`/api/layouts/${id}`)
        .then((res) => res.json())
        .then((data) => {
          setLayout(data);
          if (data.elements && data.elements.length > 0) {
            const placeholders = data.elements.filter((el: any) => el.type === "placeholder");
            const newCount = placeholders.length;
            setFramesList(Array.from({ length: newCount }, () => []));
            setStaticImages(Array.from({ length: newCount }, () => ""));
            setImages(Array.from({ length: newCount }, () => ""));
          }
        })
        .catch((err) => console.error("Error fetching layout:", err));
    }
  }, [id]);

  const webcamRef = useRef<Webcam>(null);

  const activeCount = layout && layout.elements
    ? layout.elements.filter((el: any) => el.type === "placeholder").length
    : 0;

  const maxHeight =
    typeof window !== "undefined" ? window.innerHeight * 0.6 : 500;

  // Set aspect ratio of 4x6 preview
  const previewHeight = Math.min(maxHeight, 480);
  const previewWidth = (previewHeight * 4) / 6;

  const [framesList, setFramesList] = useState<string[][]>([]);
  const [staticImages, setStaticImages] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);

  const [filter, setFilter] = useState("none");
  const [capturing, setCapturing] = useState(false);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isAutoCapturing, setIsAutoCapturing] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);

  // Custom Modal state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "alert" | "confirm";
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    type: "alert",
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const showAlert = (title: string, message: string) => {
    setModalState({
      isOpen: true,
      type: "alert",
      title,
      message,
      onConfirm: () => setModalState(prev => ({ ...prev, isOpen: false })),
    });
  };

  const closeDialog = () => setModalState(prev => ({ ...prev, isOpen: false }));

  const { speak, isMuted, toggleMute } = useVoicePrompt();

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

  const allFilled = useMemo(() => staticImages.length > 0 && staticImages.every((img) => img !== ""), [staticImages]);

  // Compute selected placeholder dimensions for dynamic camera sizing
  const selectedPlaceholder = useMemo(() => {
    if (selectedCell === null || !layout || !layout.elements) return null;
    const placeholders = layout.elements.filter((el: any) => el.type === "placeholder");
    return placeholders[selectedCell] || null;
  }, [selectedCell, layout]);

  const cameraAspectRatio = useMemo(() => {
    if (!selectedPlaceholder) return 1; // default square
    return selectedPlaceholder.width / selectedPlaceholder.height;
  }, [selectedPlaceholder]);

  // Max camera width constrained to 550px, height derived from aspect ratio
  const cameraMaxWidth = 550;
  const cameraWidth = cameraMaxWidth;
  const cameraHeight = Math.round(cameraWidth / cameraAspectRatio);

  // "Layout is ready" voice and reminder
  useEffect(() => {
    let firstTimeout: NodeJS.Timeout;
    let reminderInterval: NodeJS.Timeout;

    if (allFilled && !saving && !capturing && !isAutoCapturing) {
      firstTimeout = setTimeout(() => {
        speak("Your layout is ready. Select your filter and save.");

        reminderInterval = setInterval(() => {
          if (!saving) {
            speak("Your layout is ready. Please click save layout.");
          }
        }, 15000);
      }, 1500); // Delay to not overlap with "Great!"
    }

    return () => {
      clearTimeout(firstTimeout);
      clearInterval(reminderInterval);
    };
  }, [allFilled, saving, capturing, isAutoCapturing, speak]);

  const handleCapture = useCallback(async (targetIndex?: number) => {
    const activeIndex = targetIndex !== undefined ? targetIndex : selectedCell;
    if (!webcamRef.current || activeIndex === null) return;

    const video = webcamRef.current.video;
    if (!video) return;

    if (targetIndex === undefined) {
      // Manual single photo capture countdown
      for (let c = 3; c > 0; c--) {
        setCountdown(c);
        speak(c.toString());
        await delay(1000);
      }
      setCountdown(null);
      speak("Cheese!");
    }

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

          frames.push(canvas.toDataURL("image/jpeg", 0.8));

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
            gifWidth: 500,
            gifHeight: 500,
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
  }, [selectedCell, filter, speak]);

  const handleAutoCapture = useCallback(async () => {
    if (isAutoCapturing) return;

    setIsAutoCapturing(true);

    for (let i = 0; i < activeCount; i++) {
      setSelectedCell(i);

      if (i === activeCount - 1) {
        speak("Last one!");
      }

      // Start Countdown
      for (let c = 3; c > 0; c--) {
        setCountdown(c);
        speak(c.toString());
        await delay(1000);
      }

      setCountdown(null); // Clear countdown for snapshot

      if (i === activeCount - 1) {
        speak("Great!");
      } else if (i % 2 === 0) {
        speak("Cheese!");
      } else {
        speak("Smile!");
      }

      await handleCapture(i);

      // Small pause between captures
      await delay(1000);
    }

    setIsAutoCapturing(false);
    setSelectedCell(null);
  }, [activeCount, handleCapture, isAutoCapturing, speak]);

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
      const FRAME_COUNT = activeCount;
      const canvasWidth = 1200;
      const canvasHeight = 1800;

      // Pre-load all custom layers
      const loadedLayers: Record<string, HTMLImageElement> = {};
      if (layout && layout.elements) {
        for (const el of layout.elements) {
          if (el.type === "image" && el.src) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = el.src;
            await new Promise((r) => (img.onload = r));
            loadedLayers[el.id] = img;
          }
        }
      }

      // Pre-load all captured static photo slot images
      const loadedStaticImages: (HTMLImageElement | null)[] = [];
      for (let f = 0; f < FRAME_COUNT; f++) {
        if (staticImages[f]) {
          const img = new Image();
          img.src = staticImages[f];
          await new Promise((r) => (img.onload = r));
          loadedStaticImages[f] = img;
        } else {
          loadedStaticImages[f] = null;
        }
      }

      // Draw helper for elements
      const drawFrame = (ctx: CanvasRenderingContext2D, photoIndex: number | null) => {
        if (!layout || !layout.elements) return;

        // Fill background color
        ctx.fillStyle = layout.backgroundType === "color" ? layout.backgroundValue : "#ffffff";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Draw custom template layers: images first, text, then placeholders last (always on top)
        const sortedElements = [...layout.elements].sort((a: any, b: any) => {
          const order: Record<string, number> = { image: 1, text: 2, placeholder: 3 };
          return (order[a.type] || 0) - (order[b.type] || 0);
        });

        for (const el of sortedElements) {
          if (el.type === "image" && loadedLayers[el.id]) {
            ctx.drawImage(loadedLayers[el.id], el.x, el.y, el.width, el.height);
          } else if (el.type === "text") {
            ctx.save();
            ctx.fillStyle = "#000000";
            ctx.font = "bold 48px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(el.text || "", el.x + el.width / 2, el.y + el.height / 2);
            ctx.restore();
          } else if (el.type === "placeholder") {
            const placeholders = layout.elements.filter((item: any) => item.type === "placeholder");
            const placeholderIndex = placeholders.findIndex((item: any) => item.id === el.id);
            const targetIndex = photoIndex === null ? placeholderIndex : photoIndex;
            const img = loadedStaticImages[targetIndex];
            if (img) {
              ctx.drawImage(img, el.x, el.y, el.width, el.height);
            }
          }
        }
      };

      const layoutFrames: string[] = [];

      for (let f = 0; f < FRAME_COUNT; f++) {
        const canvas = document.createElement("canvas");
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) continue;

        ctx.filter = filter;
        drawFrame(ctx, f);

        layoutFrames.push(canvas.toDataURL("image/jpeg", 0.85));
      }

      const imageCanvas = document.createElement("canvas");
      imageCanvas.width = canvasWidth;
      imageCanvas.height = canvasHeight;

      const imageCtx = imageCanvas.getContext("2d");
      if (!imageCtx) return;

      imageCtx.filter = filter;
      drawFrame(imageCtx, null);

      // Target output resolution: fit within 1300x2100px bounding box
      const TARGET_W = 1300;
      const TARGET_H = 2100;
      const outputRatio = Math.min(1, TARGET_W / canvasWidth, TARGET_H / canvasHeight);
      const outW = Math.round(canvasWidth * outputRatio);
      const outH = Math.round(canvasHeight * outputRatio);

      // Resize static image to target output dimensions
      const resizedCanvas = document.createElement("canvas");
      resizedCanvas.width = outW;
      resizedCanvas.height = outH;
      const resizedCtx = resizedCanvas.getContext("2d");
      if (resizedCtx) {
        resizedCtx.drawImage(imageCanvas, 0, 0, outW, outH);
      }

      // Generate static image with adaptive quality to stay under Nginx limit
      let imageQuality = 0.85;
      let finalImage = resizedCanvas.toDataURL("image/jpeg", imageQuality);

      // GIF uses same output dimensions
      const gifW = outW;
      const gifH = outH;

      gifshot.createGIF(
        {
          images: layoutFrames,
          interval: 1,
          gifWidth: gifW,
          gifHeight: gifH,
          numWorkers: 4,
          quality: 3, // Lower number = better quality in gifshot
          progressCallback: (captureProgress: number) => {
            setSaveProgress(Math.floor(captureProgress * 70)); // 0-70% for gif creation
          }
        },
        async (obj: GifResult) => {
          if (obj.error) {
            setSaving(false);
            setSaveProgress(0);
            return;
          }

          setSaveProgress(75); // GIF done, checking sizes

          try {
            // Estimate base64 payload sizes (base64 is ~4/3 of binary)
            const gifSizeBytes = Math.ceil((obj.image.length - (obj.image.indexOf(',') + 1)) * 0.75);
            let imageSizeBytes = Math.ceil((finalImage.length - (finalImage.indexOf(',') + 1)) * 0.75);
            let totalSizeMB = (gifSizeBytes + imageSizeBytes) / (1024 * 1024);

            console.log(`GIF size: ${(gifSizeBytes / (1024 * 1024)).toFixed(2)}MB, Image size: ${(imageSizeBytes / (1024 * 1024)).toFixed(2)}MB, Total: ${totalSizeMB.toFixed(2)}MB`);

            // If total exceeds 20MB, progressively reduce image JPEG quality
            const MAX_UPLOAD_MB = 20;
            while (totalSizeMB > MAX_UPLOAD_MB && imageQuality > 0.3) {
              imageQuality -= 0.1;
              console.log(`Total ${totalSizeMB.toFixed(2)}MB exceeds ${MAX_UPLOAD_MB}MB, re-compressing image at quality ${imageQuality.toFixed(1)}`);
              finalImage = resizedCanvas.toDataURL("image/jpeg", imageQuality);
              imageSizeBytes = Math.ceil((finalImage.length - (finalImage.indexOf(',') + 1)) * 0.75);
              totalSizeMB = (gifSizeBytes + imageSizeBytes) / (1024 * 1024);
            }

            if (totalSizeMB > MAX_UPLOAD_MB) {
              showAlert("Upload Too Large", `Upload size (${totalSizeMB.toFixed(1)}MB) is too large. Please try a smaller layout.`);
              setSaving(false);
              setSaveProgress(0);
              return;
            }

            setSaveProgress(85); // Size OK, uploading

            const res = await fetch("/api/upload", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                gif: obj.image,
                image: finalImage,
                layoutTitle: title,
                rows: 1,
                cols: 1,
                amount: price,
                copies: 1,
              }),
            });

            if (!res.ok) {
              const errText = await res.text();
              console.error(`Upload failed with status ${res.status}:`, errText);
              showAlert("Upload Failed", `Upload failed (${res.status}). The image may be too large. Please try again.`);
              setSaving(false);
              setSaveProgress(0);
              return;
            }

            const data = await res.json();

            setSaveProgress(100); // Upload done

            router.push(
              `/payment?title=${encodeURIComponent(title)}&price=${price}&gif=${encodeURIComponent(data.gifUrl)}&img=${encodeURIComponent(data.imageUrl)}&rows=1&cols=1&orderId=${encodeURIComponent(data.orderId)}`,
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
        <div className="flex items-center gap-6">
          <button
            onClick={toggleMute}
            className="p-2 rounded-full hover:bg-white/20 transition-colors flex items-center justify-center"
            title={isMuted ? "Unmute Voice" : "Mute Voice"}
          >
            {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
          </button>
          <Link href="/about" className="text-lg font-medium text-white hover:text-white/80 transition-colors">
            About Us
          </Link>
          <Link href="/contact" className="text-lg font-medium text-white hover:text-white/80 transition-colors">
            Contact Us
          </Link>
        </div>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">
        Photobooth Capture
      </h1>

      {/* Main 3-column layout: Preview | Camera | Filters */}
      <div className="w-full max-w-7xl flex flex-col lg:flex-row items-start gap-6 mb-8">

        {/* 1. Template Preview */}
        <div className="bg-white/20 backdrop-blur-lg p-6 rounded-3xl flex flex-col items-center shadow-xl w-full lg:w-fit lg:min-w-[280px] lg:max-w-[480px] shrink-0">
          <div className="flex items-center justify-between w-full mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="w-2 h-6 bg-white rounded-full"></span>
              Template Preview
            </h2>
            <p className="text-white/60 text-xs">{allFilled ? "Ready to save!" : "Tap a slot"}</p>
          </div>

          <div className="w-full overflow-auto max-h-[55vh] custom-scrollbar rounded-xl">
            <div className="min-w-max flex justify-center items-center py-2 px-2">
              {!layout ? (
                <div
                  className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl"
                  style={{
                    width: previewWidth,
                    height: previewHeight,
                  }}
                >
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin mb-3"></div>
                  <p className="text-sm font-semibold opacity-70">Loading Template...</p>
                </div>
              ) : (
                <div
                  className="rounded-2xl shadow-2xl relative transition-transform hover:scale-[1.02] duration-500 overflow-hidden"
                  style={{
                    width: previewWidth,
                    height: previewHeight,
                    backgroundColor: layout.backgroundType === "color" ? layout.backgroundValue : "#ffffff",
                  }}
                >
                  {layout.elements?.map((el: any) => {
                    const scale = previewWidth / 1200;

                    if (el.type === "image") {
                      return (
                        <div
                          key={el.id}
                          className="absolute pointer-events-none"
                          style={{
                            left: el.x * scale,
                            top: el.y * scale,
                            width: el.width * scale,
                            height: el.height * scale,
                            zIndex: 10
                          }}
                        >
                          {el.src && (
                            <img
                              src={el.src}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                      );
                    }

                    if (el.type === "text") {
                      return (
                        <div
                          key={el.id}
                          className="absolute flex items-center justify-center text-slate-900 font-bold text-center leading-none pointer-events-none"
                          style={{
                            left: el.x * scale,
                            top: el.y * scale,
                            width: el.width * scale,
                            height: el.height * scale,
                            fontSize: 16 * scale,
                            zIndex: 20
                          }}
                        >
                          {el.text}
                        </div>
                      );
                    }

                    if (el.type === "placeholder") {
                      const placeholders = layout.elements.filter((item: any) => item.type === "placeholder");
                      const placeholderIndex = placeholders.findIndex((item: any) => item.id === el.id);
                      const img = staticImages[placeholderIndex];
                      const isSelected = selectedCell === placeholderIndex;

                      return (
                        <div
                          key={el.id}
                          onClick={() => setSelectedCell(placeholderIndex)}
                          className={`absolute overflow-hidden cursor-pointer shadow-md transition-all duration-300
                            ${isSelected
                              ? "ring-4 ring-white ring-offset-4 ring-offset-purple-500 scale-105"
                              : "hover:ring-2 hover:ring-white/60 hover:scale-[1.03]"
                            }`}
                          style={{
                            left: el.x * scale,
                            top: el.y * scale,
                            width: el.width * scale,
                            height: el.height * scale,
                            zIndex: isSelected ? 40 : 30
                          }}
                        >
                          {img ? (
                            <img
                              src={img}
                              className="w-full h-full object-cover"
                              style={{ filter }}
                            />
                          ) : (
                            <div className="w-full h-full bg-purple-50/85 border border-dashed border-purple-300 flex flex-col items-center justify-center text-purple-600 font-bold text-center select-none" style={{ padding: 4 * scale }}>
                              <Square size={Math.max(10, 20 * scale)} className="text-purple-400" style={{ marginBottom: 2 * scale }} />
                              <span className="tracking-tight uppercase" style={{ fontSize: Math.max(6, 10 * scale), lineHeight: 1 }}>Photo</span>
                            </div>
                          )}

                          {isSelected && !img && (
                            <div className="absolute inset-0 bg-purple-500/20 animate-pulse flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>
                      );
                    }

                    return null;
                  })}
                </div>
              )}
            </div>
          </div>

          {allFilled && (
            <button
              onClick={generateLayoutGif}
              disabled={saving}
              className={`relative overflow-hidden mt-6 px-8 py-3 rounded-xl font-semibold w-full transition-all
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

        {/* 2. Camera Screen */}
        <div className="flex flex-col items-center gap-4 flex-1 w-full">
          {selectedCell !== null && selectedPlaceholder && (
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold text-white/90 transition-all duration-300 animate-in">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              Slot {selectedCell + 1} — {Math.round(selectedPlaceholder.width)}×{Math.round(selectedPlaceholder.height)}px
            </div>
          )}
          <div
            className="relative rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] ring-8 ring-white/10 group transition-all duration-500 ease-in-out mx-auto"
            style={{
              width: '100%',
              maxWidth: cameraWidth,
              aspectRatio: `${cameraAspectRatio}`,
            }}
          >
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full h-full object-cover transform scale-x-[-1]"
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
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-4 z-30">
                <span className="text-red-400 text-3xl mb-3">⚠️</span>
                <h3 className="text-base font-bold text-white mb-1">Camera Unavailable</h3>
                <p className="text-white/80 text-xs">{camError}</p>
              </div>
            )}

            {/* Countdown Overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                <div className="text-8xl font-black text-white drop-shadow-[0_0_20px_rgba(147,51,234,0.8)] animate-ping-once transition-all">
                  {countdown}
                </div>
              </div>
            )}

            {/* Overlay when capturing */}
            {capturing && (
              <div className="absolute inset-0 z-10 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-base font-bold tracking-widest uppercase">Capturing...</p>
                </div>
              </div>
            )}

            {/* Slot Selection Hint overlay */}
            {selectedCell === null && !capturing && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="bg-white/90 text-purple-600 px-4 py-1.5 rounded-full font-bold shadow-lg text-sm">
                  Select a slot first
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 w-full mx-auto" style={{ maxWidth: cameraWidth }}>
            <button
              onClick={() => handleCapture()}
              disabled={capturing || selectedCell === null || isAutoCapturing || saving}
              className={`px-6 py-3 rounded-2xl font-bold text-base shadow-xl transform active:scale-95 transition-all duration-300 flex items-center justify-center gap-2
                ${capturing || selectedCell === null || isAutoCapturing || saving
                  ? "bg-white/40 text-white/50 cursor-not-allowed scale-95"
                  : "bg-white text-purple-600 hover:bg-purple-50 hover:shadow-2xl cursor-pointer"
                }`}
            >
              <div className={`w-3 h-3 rounded-full ${capturing && !isAutoCapturing ? "bg-red-500 animate-ping" : "bg-purple-600"}`}></div>
              {capturing && !isAutoCapturing ? "Capturing..." : selectedCell === null ? "Select Slot" : "Snap Photo"}
            </button>

            <button
              onClick={handleAutoCapture}
              disabled={capturing || isAutoCapturing || saving}
              className={`px-6 py-3 rounded-2xl font-bold text-base shadow-xl transform active:scale-95 transition-all duration-300 flex items-center justify-center gap-2
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

        {/* 3. Filters */}
        <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-6 flex flex-col gap-4 shadow-xl w-full lg:w-[180px] shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-6 bg-white rounded-full"></span>
            <h2 className="text-lg font-bold">Filters</h2>
          </div>

          <div className="flex flex-col gap-2">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                disabled={saving}
                className={`px-3 py-2.5 text-sm rounded-xl transition-all duration-300 font-medium text-center ${filter === f.value
                  ? "bg-white text-purple-600 shadow-lg scale-105"
                  : "bg-white/10 hover:bg-white/20 text-white"
                  } ${saving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                {f.name}
              </button>
            ))}
          </div>

          <div className="mt-2 p-3 bg-purple-900/20 rounded-xl border border-white/10">
            <p className="text-[10px] text-white/60 text-center italic">
              Filters affect preview and capture.
            </p>
          </div>
        </div>

      </div>

      <CustomModal
        isOpen={modalState.isOpen}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        onConfirm={modalState.onConfirm}
        onCancel={closeDialog}
      />
    </div>
  );
}

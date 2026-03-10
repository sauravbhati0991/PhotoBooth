"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useRef } from "react";
import Image from "next/image";
import Webcam from "react-webcam";
import html2canvas from "html2canvas-pro";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";

export default function EditLayoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const title = searchParams.get("title") || "";
  const count = Number(searchParams.get("count"));
  const price = Number(searchParams.get("price"));

  const [images, setImages] = useState<string[]>([]);
  const [cameraIndex, setCameraIndex] = useState<number | null>(null);

  const webcamRef = useRef<Webcam>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  function getGridCols(count: number) {
    if (count <= 3) return count;
    if (count === 4) return 2;
    if (count <= 6) return 3;
    if (count <= 8) return 4;
    return 5;
  }

  const handleUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);

    setImages((prev) => {
      const updated = [...prev];

      if (updated[index]) {
        URL.revokeObjectURL(updated[index]);
      }

      updated[index] = imageUrl;
      return updated;
    });
  };

  const handleCapture = () => {
    const imageSrc = webcamRef.current?.getScreenshot();

    if (!imageSrc || cameraIndex === null) return;

    setImages((prev) => {
      const updated = [...prev];
      updated[cameraIndex] = imageSrc;
      return updated;
    });

    setCameraIndex(null);
  };

  const allFilled = images.filter(Boolean).length === count;

  const generateLayoutImage = async () => {
    if (!gridRef.current) return;

    const canvas = await html2canvas(gridRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
    });

    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        const imageUrl = URL.createObjectURL(blob);

        router.push(
          `/payment?title=${encodeURIComponent(title)}&price=${price}&img=${encodeURIComponent(imageUrl)}`,
        );
      },
      "image/jpeg",
      0.9,
    );
  };

  return (
    <>
      <div className="w-full bg-blue-50 px-6 pt-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl"
        >
          <ArrowLeft size={18} />
          Back
        </button>
      </div>

      <div className="min-h-screen p-10 bg-blue-50">
        <h1 className="text-3xl font-bold text-blue-600 mb-10">{title}</h1>

        <div
          ref={gridRef}
          className="grid gap-6 max-w-6xl mx-auto p-6 rounded-xl"
          style={{
            backgroundColor: "#60a5fa",
            gridTemplateColumns: `repeat(${getGridCols(count)}, 1fr)`,
          }}
        >
          {Array.from({ length: count }).map((_, index) => (
            <div
              key={index}
              className="relative w-full aspect-square bg-white rounded-xl overflow-hidden group"
            >
              {images[index] ? (
                <Image
                  src={images[index]}
                  alt="photo"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <div className="text-4xl">+</div>
                  Add Image
                </div>
              )}

              <div className="absolute inset-0 bg-gray-400 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-3 transition">
                <label className="bg-white text-blue-600 px-4 py-2 rounded-lg cursor-pointer">
                  {images[index] ? "Replace" : "Upload"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleUpload(e, index)}
                  />
                </label>

                <button
                  onClick={() => setCameraIndex(index)}
                  className="px-4 py-2 rounded-lg text-white bg-blue-500"
                >
                  Capture
                </button>
              </div>
            </div>
          ))}
        </div>

        {allFilled && (
          <div className="mt-12 flex justify-center">
            <button
              onClick={generateLayoutImage}
              className="bg-blue-500 text-white px-8 py-3 rounded-xl text-lg cursor-pointer"
            >
              Save Layout
            </button>
          </div>
        )}
      </div>

      {cameraIndex !== null && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl flex flex-col items-center gap-4">
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="rounded-xl"
            />

            <button
              onClick={handleCapture}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg"
            >
              Capture Photo
            </button>

            <button
              onClick={() => setCameraIndex(null)}
              className="bg-gray-300 px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}

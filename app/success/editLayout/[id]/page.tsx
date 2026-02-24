"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useRef } from "react";
import Image from "next/image";
import Webcam from "react-webcam";
import { ArrowLeft } from "lucide-react";
import { useLayoutStore } from "@/app/strore/useLayoutStore";

interface GridItem {
  id: number;
  title: string;
  price: number;
  image: string;
  slots: number;
}

const gridData: GridItem[] = [
  { id: 1, title: "8-Grid Layout", price: 20, image: "/8-grid.png", slots: 8 },
  { id: 2, title: "6-Grid Layout", price: 15, image: "/6-grid.png", slots: 6 },
  { id: 3, title: "4-Grid Layout", price: 12, image: "/4-grid.png", slots: 4 },
  { id: 4, title: "3-Grid Layout", price: 10, image: "/3-grid.png", slots: 3 },
  { id: 5, title: "2-Grid Layout", price: 8, image: "/2-grid.png", slots: 2 },
  { id: 6, title: "Single Layout", price: 90, image: "/1-grid.png", slots: 1 },
];

export default function EditLayoutPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const id = Number(params.id);
  const printIndex = Number(searchParams.get("print"));
  const count = Number(searchParams.get("count"));

  const grid = gridData.find((item) => item.id === id);

  const [images, setImages] = useState<string[]>([]);
  const [cameraIndex, setCameraIndex] = useState<number | null>(null);
  const webcamRef = useRef<Webcam>(null);

  const setLayout = useLayoutStore((state) => state.setLayout);

  if (!grid) {
    return <div>Grid Not Found</div>;
  }

  const handleUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (!e.target.files) return;

    const file = e.target.files[0];
    const imageUrl = URL.createObjectURL(file);

    setImages((prev) => {
      const updated = [...prev];
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

  const allFilled = images.filter(Boolean).length === grid.slots;

  const saveAsSingleImage = async () => {
    const cols = Math.ceil(Math.sqrt(grid.slots));
    const rows = Math.ceil(grid.slots / cols);
    const size = 400;

    const canvas = document.createElement("canvas");
    canvas.width = cols * size;
    canvas.height = rows * size;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    for (let i = 0; i < grid.slots; i++) {
      const img = new window.Image();
      img.src = images[i];

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const x = (i % cols) * size;
      const y = Math.floor(i / cols) * size;

      ctx.drawImage(img, x, y, size, size);
    }

    const finalImage = canvas.toDataURL("image/png");

    setLayout(id, printIndex, finalImage);

    router.push(`/success?id=${id}&count=${count}`);
  };

  return (
    <>
      <div className="w-full bg-blue-50 px-6 pt-6">
        <button
          onClick={() => router.back()}
          className="flex items-center cursor-pointer gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl"
        >
          <ArrowLeft size={18} />
          Back
        </button>
      </div>

      <div className="min-h-screen p-10 bg-blue-50">
        <h1 className="text-3xl font-bold text-blue-600 mb-10">{grid.title}</h1>

        <div className="flex flex-wrap justify-center gap-6 max-w-6xl mx-auto">
          {Array.from({ length: grid.slots }).map((_, index) => (
            <div
              key={index}
              className="relative w-[260px] aspect-square bg-white rounded-2xl shadow-md overflow-hidden flex items-center justify-center group"
            >
              {/* Show image if exists */}
              {images[index] ? (
                <Image
                  src={images[index]}
                  alt={`Image ${index + 1}`}
                  fill
                  className="object-cover"
                />
              ) : (
                /* 🔥 Initial Empty State */
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <span className="text-4xl mb-2">+</span>
                  <span className="text-sm font-medium">Add Image</span>
                </div>
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-3">
                <label className="bg-white text-blue-600 px-4 py-2 rounded-lg cursor-pointer font-semibold hover:bg-blue-100">
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleUpload(e, index)}
                  />
                </label>

                <button
                  onClick={() => setCameraIndex(index)}
                  className="px-4 py-2 rounded-lg cursor-pointer text-white bg-blue-500 hover:bg-blue-600"
                >
                  {images[index] ? "Retake" : "Capture"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {allFilled && (
          <div className="mt-12 flex justify-center">
            <button
              onClick={saveAsSingleImage}
              className="bg-blue-500 text-white px-8 py-3 rounded-xl text-lg font-semibold"
            >
              Save Layout
            </button>
          </div>
        )}
      </div>

      {cameraIndex !== null && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl flex flex-col items-center gap-4 shadow-2xl">
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="rounded-xl"
            />

            <div className="flex gap-4">
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
        </div>
      )}
    </>
  );
}

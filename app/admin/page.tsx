"use client";

import Link from "next/link";
import { useState } from "react";
import { HexColorPicker } from "react-colorful";

type LayoutOption = {
  rows: number;
  cols: number;
};

type Layout = {
  name?: string;
  count: number;
  rows: number;
  cols: number;
  price: number;
  backgroundType: "color" | "image";
  backgroundValue: string;
};

export default function GridCardsSectionAdmin() {
  const [showBuilder, setShowBuilder] = useState(false);

  const [layoutName, setLayoutName] = useState("");
  const [count, setCount] = useState<number | null>(null);
  const [price, setPrice] = useState<number | null>(null);

  const [selectedLayout, setSelectedLayout] = useState<LayoutOption | null>(
    null,
  );

  const [bgType, setBgType] = useState<"color" | "image">("color");
  const [bgColor, setBgColor] = useState("#93c5fd");
  const [bgImage, setBgImage] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  const getLayouts = (count: number): LayoutOption[] => {
    const layouts: LayoutOption[] = [];

    for (let r = 1; r <= count; r++) {
      if (count % r === 0) {
        layouts.push({
          rows: r,
          cols: count / r,
        });
      }
    }

    return layouts;
  };

  const handleSaveLayout = async () => {
    if (!layoutName || !count || !price || !selectedLayout) {
      alert("Please fill all required fields");
      return;
    }

    if (bgType === "image" && !bgImage) {
      alert("Please upload a background image");
      return;
    }

    setSaving(true);

    try {
      const existingLayoutsRes = await fetch("/api/layouts");
      const existingLayouts: Layout[] = await existingLayoutsRes.json();

      const nameExists = existingLayouts.some(
        (layout) => layout.name?.toLowerCase() === layoutName.toLowerCase(),
      );

      if (nameExists) {
        alert("Layout name already exists");
        setSaving(false);
        return;
      }

      let backgroundValue = bgColor;

      if (bgType === "image" && bgImage) {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image: bgImage }),
        });

        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) {
          throw new Error(uploadData.error || "Image upload failed");
        }

        backgroundValue = uploadData.url;
      }

      const saveRes = await fetch("/api/layouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: layoutName,
          count,
          rows: selectedLayout.rows,
          cols: selectedLayout.cols,
          price,
          backgroundType: bgType,
          backgroundValue,
        }),
      });

      if (!saveRes.ok) {
        const error = await saveRes.json();
        throw new Error(error.error || "Failed to save layout");
      }

      alert("Layout saved successfully");

      setLayoutName("");
      setCount(null);
      setPrice(null);
      setSelectedLayout(null);
      setBgImage(null);
      setBgType("color");
      setBgColor("#93c5fd");
      setShowBuilder(false);
    } catch (error) {
      console.error(error);
      alert("Failed to save layout");
    } finally {
      setSaving(false);
    }
  };

  const layouts = count ? getLayouts(count) : [];
  const basicInfoFilled = layoutName && count && price;

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-500 via-pink-400 to-purple-600 text-white">
      {/* NAVBAR */}
      <nav className="max-w-7xl mx-auto flex items-center justify-between p-6">
        <Link href="/" className="text-2xl font-bold">
          PhotoBooth
        </Link>
      </nav>

      <div className="max-w-6xl mx-auto px-6 pb-20">
        <h1 className="text-3xl font-bold text-center mb-10">Layout Builder</h1>

        {!showBuilder && (
          <div className="flex justify-center">
            <button
              onClick={() => setShowBuilder(true)}
              className="bg-white text-purple-600 hover:scale-105 cursor-pointer px-6 py-3 rounded-xl shadow-lg transition"
            >
              Add Layout
            </button>
          </div>
        )}

        {showBuilder && (
          <div className="space-y-10">
            {/* LAYOUT DETAILS */}
            <div className="bg-white/20 backdrop-blur-lg p-6 rounded-xl shadow-xl">
              <h2 className="font-semibold mb-6 text-center">Layout Details</h2>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center">
                  <label className="mb-2 font-medium">Layout Name</label>
                  <input
                    type="text"
                    value={layoutName}
                    onChange={(e) => setLayoutName(e.target.value)}
                    className="border border-white/40 bg-white/30 text-white placeholder-white/70 rounded p-2 w-full text-center"
                    placeholder="ex: Wedding Layout"
                  />
                </div>

                <div className="flex flex-col items-center">
                  <label className="mb-2 font-medium">Number of Images</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={count ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;

                      if (value === "") {
                        setCount(null);
                        setSelectedLayout(null);
                        return;
                      }

                      const num = Number(value);

                      if (num >= 1 && num <= 10) {
                        setCount(num);
                        setSelectedLayout(null);
                      }
                    }}
                    className="border border-white/40 bg-white/30 text-white rounded p-2 w-full text-center"
                    placeholder="ex: 4"
                  />
                </div>

                <div className="flex flex-col items-center">
                  <label className="mb-2 font-medium">Layout Price</label>
                  <input
                    type="number"
                    min={0}
                    value={price ?? ""}
                    onChange={(e) => {
                      const value = e.target.value;

                      if (value === "") {
                        setPrice(null);
                        return;
                      }

                      setPrice(Number(value));
                    }}
                    className="border border-white/40 bg-white/30 text-white rounded p-2 w-full text-center"
                    placeholder="ex: 100"
                  />
                </div>
              </div>
            </div>

            {basicInfoFilled && (
              <div className="bg-white/20 backdrop-blur-lg p-6 rounded-xl shadow-xl">
                <h2 className="font-semibold mb-6 text-center">
                  Select Grid Layout
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 justify-items-center">
                  {layouts.map((layout, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedLayout(layout)}
                      className={`border rounded-lg cursor-pointer px-5 py-3 text-nowrap transition ${
                        selectedLayout?.rows === layout.rows &&
                        selectedLayout?.cols === layout.cols
                          ? "border-white bg-white/30"
                          : "border-white/40 hover:bg-white/20"
                      }`}
                    >
                      {layout.rows} × {layout.cols}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedLayout && (
              <div className="grid md:grid-cols-2 gap-8 items-start">
                {/* BACKGROUND */}
                <div className="bg-white/20 backdrop-blur-lg p-6 rounded-xl shadow-xl">
                  <h2 className="font-semibold mb-6">Background</h2>

                  <div className="flex gap-6 mb-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={bgType === "color"}
                        onChange={() => setBgType("color")}
                      />
                      Color
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={bgType === "image"}
                        onChange={() => setBgType("image")}
                      />
                      Image
                    </label>
                  </div>

                  {bgType === "color" && (
                    <HexColorPicker
                      color={bgColor}
                      onChange={setBgColor}
                      style={{ width: "100%" }}
                    />
                  )}

                  {bgType === "image" && (
                    <>
                      <label
                        htmlFor="imageUpload"
                        className="cursor-pointer bg-white text-purple-600 px-4 py-2 rounded-lg shadow"
                      >
                        Upload Background Image
                      </label>

                      <input
                        id="imageUpload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setBgImage(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </>
                  )}
                </div>

                {/* PREVIEW */}
                <div className="bg-white/20 backdrop-blur-lg p-6 rounded-xl shadow-xl h-fit flex flex-col items-center">
                  <h2 className="font-semibold mb-6">Layout Preview</h2>

                  <div
                    className="border-4 border-white rounded-2xl shadow-xl p-4 w-full max-w-md mx-auto"
                    style={{
                      aspectRatio: "1/1",
                      background:
                        bgType === "color"
                          ? bgColor
                          : `url(${bgImage}) center/cover`,
                    }}
                  >
                    <div
                      className="grid gap-3 w-full h-full"
                      style={{
                        gridTemplateColumns: `repeat(${selectedLayout.cols},1fr)`,
                        gridTemplateRows: `repeat(${selectedLayout.rows},1fr)`,
                      }}
                    >
                      {Array.from({
                        length: selectedLayout.rows * selectedLayout.cols,
                      }).map((_, i) => (
                        <div
                          key={i}
                          className={`rounded-lg ${
                            i < count! ? "bg-white" : "bg-transparent"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedLayout && (
              <div className="flex justify-center">
                <button
                  onClick={handleSaveLayout}
                  disabled={saving}
                  className={`px-8 py-3 rounded-xl font-semibold ${
                    saving
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-white text-purple-600 hover:scale-105 shadow-lg cursor-pointer"
                  }`}
                >
                  {saving ? "Uploading..." : "Upload Layout"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

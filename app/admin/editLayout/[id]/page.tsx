"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { HexColorPicker } from "react-colorful";

type Layout = {
  _id: string;
  name: string;
  price: number;
  rows: number;
  cols: number;
  count: number;
  backgroundType: "color" | "image";
  backgroundValue: string;
};

export default function EditLayoutPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [layout, setLayout] = useState<Layout | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState(1);
  const [cols, setCols] = useState(1);
  const [count, setCount] = useState(1);

  const [name, setName] = useState("");
  const [price, setPrice] = useState<number | null>(null);
  const [bgType, setBgType] = useState<"color" | "image">("color");
  const [bgColor, setBgColor] = useState("#93c5fd");
  const [bgImage, setBgImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        const res = await fetch(`/api/layouts/${id}`);
        if (!res.ok) throw new Error("Failed to fetch layout");

        const data: Layout = await res.json();
        setLayout(data);

        setName(data.name);
        setPrice(data.price);
        setBgType(data.backgroundType);
        setRows(data.rows);
        setCols(data.cols);
        setCount(data.count);

        if (data.backgroundType === "color") {
          setBgColor(data.backgroundValue);
        } else {
          setBgImage(data.backgroundValue);
        }
      } catch (err) {
        console.error(err);
        alert("Error loading layout");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchLayout();
  }, [id]);

  const handleDelete = async () => {
    const confirmDelete = confirm(
      "Are you sure you want to delete this layout?",
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/layouts/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");

      alert("Layout deleted successfully");

      router.push("/admin");
    } catch (err) {
      console.error(err);
      alert("Failed to delete layout");
    }
  };

  // 🔥 Save update
  const handleUpdate = async () => {
    if (!name || price === null || price === undefined) {
      alert("Fill all fields");
      return;
    }

    if (bgType === "image" && !bgImage) {
      alert("Upload image");
      return;
    }

    setSaving(true);

    try {
      let backgroundValue = bgColor;

      if (bgType === "image" && bgImage) {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: bgImage }),
        });

        const data = await uploadRes.json();
        if (!uploadRes.ok) throw new Error("Upload failed");

        backgroundValue = data.url;
      }

      const res = await fetch(`/api/layouts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          price,
          backgroundType: bgType,
          backgroundValue,
        }),
      });

      if (!res.ok) throw new Error("Update failed");

      alert("Layout updated successfully");
      router.back();
    } catch (err) {
      console.error(err);
      alert("Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-purple-600">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-500 via-pink-400 to-purple-600 text-white px-6">
      <div className="pt-6">
        <button
          onClick={() => router.back()}
          className="flex items-center cursor-pointer gap-2 bg-white text-purple-600 px-4 py-2 rounded-lg shadow hover:scale-105 transition"
        >
          ← Back
        </button>
      </div>

      <h1 className="text-3xl font-bold text-center">Edit Layout</h1>
      <div className="max-w-6xl mx-auto mt-10 grid md:grid-cols-2 gap-10 items-start">
        <div className="bg-white/20 backdrop-blur-lg p-6 rounded-xl shadow-xl space-y-6">
          <div>
            <label className="block mb-2">Layout Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 rounded bg-white/30 border border-white/40"
            />
          </div>

          <div>
            <label className="block mb-2">Price</label>
            <input
              type="number"
              value={price ?? ""}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full p-2 rounded bg-white/30 border border-white/40"
            />
          </div>

          <div className="flex gap-6">
            <label>
              <input
                type="radio"
                checked={bgType === "color"}
                onChange={() => setBgType("color")}
              />{" "}
              Color
            </label>

            <label>
              <input
                type="radio"
                checked={bgType === "image"}
                onChange={() => setBgType("image")}
              />{" "}
              Image
            </label>
          </div>

          {bgType === "color" && (
            <HexColorPicker color={bgColor} onChange={setBgColor} />
          )}

          {bgType === "image" && (
            <>
              <label className="cursor-pointer bg-white text-purple-600 px-4 py-2 rounded-lg shadow">
                Upload Image
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onloadend = () =>
                      setBgImage(reader.result as string);
                    reader.readAsDataURL(file);
                  }}
                />
              </label>

              {bgImage && (
                <img
                  src={bgImage}
                  className="mt-4 rounded-lg max-h-40 object-cover"
                />
              )}
            </>
          )}
        </div>

        <div className="w-full">
          <div className="bg-white/20 backdrop-blur-lg p-6 rounded-xl shadow-xl flex flex-col items-center">
            <h2 className="font-semibold mb-6">Live Preview</h2>

            <div
              className="border-4 border-white rounded-2xl shadow-xl p-3 w-64"
              style={{
                aspectRatio: "1/1",
                background:
                  bgType === "color" ? bgColor : `url(${bgImage}) center/cover`,
              }}
            >
              <div
                className="grid gap-3 w-full h-full"
                style={{
                  gridTemplateColumns: `repeat(${cols}, 1fr)`,
                  gridTemplateRows: `repeat(${rows}, 1fr)`,
                }}
              >
                {Array.from({ length: rows * cols }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-lg ${
                      i < count ? "bg-white" : "bg-transparent"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-center gap-10 my-10">
        <button
          onClick={handleUpdate}
          disabled={saving}
          className={`px-8 py-3 cursor-pointer rounded-xl font-semibold ${
            saving ? "bg-gray-400" : "bg-white text-purple-600 hover:scale-105"
          }`}
        >
          {saving ? "Updating..." : "Update Layout"}
        </button>

        <button
          onClick={handleDelete}
          className="px-8 py-3 cursor-pointer rounded-xl font-semibold bg-red-500 text-white hover:scale-105 shadow-lg"
        >
          Delete Layout
        </button>
      </div>
    </div>
  );
}

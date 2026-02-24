"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLayoutStore } from "@/app/strore/useLayoutStore";

interface GridItem {
  id: number;
  title: string;
  price: number;
  image: string;
}

const gridData: GridItem[] = [
  { id: 1, title: "8-Grid Layout", price: 20.0, image: "/8-grid.png" },
  { id: 2, title: "6-Grid Layout", price: 15.0, image: "/6-grid.png" },
  { id: 3, title: "4-Grid Layout", price: 12.0, image: "/4-grid.png" },
  { id: 4, title: "3-Grid Layout", price: 10.0, image: "/3-grid.png" },
  { id: 5, title: "2-Grid Layout", price: 8.0, image: "/2-grid.png" },
  { id: 6, title: "Single Layout", price: 90.0, image: "/1-grid.png" },
];

export default function SuccessContent() {
  const searchParams = useSearchParams();
  const layouts = useLayoutStore((state) => state.layouts);

  const id = Number(searchParams.get("id")) || 0;
  const count = Number(searchParams.get("count")) || 0;

  const grid = gridData.find((item) => item.id === id);

  if (!grid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl font-bold text-red-500">Grid Not Found</h1>
      </div>
    );
  }

  const handleDownload = (index: number) => {
    const imageSrc = layouts[id]?.[index] || grid.image;

    const link = document.createElement("a");
    link.href = imageSrc;
    link.download = `${grid.title}-print-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const amount = grid.price * count;

  return (
    <div className="min-h-screen bg-blue-50 px-6 py-12">
      {/* Success Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-6 shadow-md">
          <span className="text-4xl text-blue-500">✓</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-blue-600">
          Payment Successful
        </h1>

        <p className="text-blue-400 mt-3 text-lg">Your prints are ready 🎉</p>
      </div>

      {/* Order Summary */}
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl border border-blue-100 p-8 space-y-6 mb-10">
        <h2 className="text-2xl font-semibold text-blue-600 text-center">
          Order Summary
        </h2>

        <div className="space-y-4 text-gray-700 text-lg">
          <div className="flex justify-between border-b pb-3">
            <span className="text-blue-500 font-medium">Selected Grid</span>
            <span className="font-semibold text-gray-800">{grid.title}</span>
          </div>

          <div className="flex justify-between border-b pb-3">
            <span className="text-blue-500 font-medium">Price per Print</span>
            <span className="font-semibold text-gray-800">₹{grid.price}</span>
          </div>

          <div className="flex justify-between border-b pb-3">
            <span className="text-blue-500 font-medium">Total Prints</span>
            <span className="font-semibold text-gray-800">{count}</span>
          </div>

          <div className="flex justify-between pt-4 text-xl font-bold text-blue-600">
            <span>Total Paid</span>
            <span>₹{amount}</span>
          </div>
        </div>
      </div>

      {/* Prints */}
      <div className="bg-blue-300 shadow-2xl rounded-3xl overflow-x-auto">
        <div className="flex p-4 gap-6 w-max px-2">
          {Array.from({ length: count }).map((_, index) => (
            <div
              key={index}
              className="group relative min-w-[250px] rounded-lg overflow-hidden bg-white hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
            >
              <div className="relative w-full aspect-[7/5] overflow-hidden">
                <Image
                  src={layouts[id]?.[index] || grid.image}
                  alt={grid.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>

              <div className="flex flex-col gap-4 items-center p-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {grid.title}
                  </h3>
                  <p className="text-blue-600 font-bold">₹{grid.price}</p>
                </div>

                <div className="flex gap-3">
                  <Link
                    href={`/success/editLayout/${id}?print=${index}&count=${count}`}
                    className="px-4 py-2 rounded-xl bg-blue-400 text-white font-semibold shadow-md hover:bg-blue-500 transition"
                  >
                    Edit Layout
                  </Link>

                  <button
                    onClick={() => handleDownload(index)}
                    className="px-4 py-2 rounded-xl bg-blue-400 text-white font-semibold shadow-md hover:bg-blue-500 transition"
                  >
                    Download
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

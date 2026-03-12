"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLayoutStore } from "@/app/strore/useLayoutStore";

export default function GridEdit() {
  const searchParams = useSearchParams();
  const layouts = useLayoutStore((state) => state.layouts);

  const id = Number(searchParams.get("id")) || 0;
  const title = searchParams.get("title") || "Grid Layout";
  const count = Number(searchParams.get("count")) || 1;
  const price = Number(searchParams.get("price")) || 0;

  const amount = price * count;

  const handleDownload = (index: number) => {
    const imageSrc = layouts[id]?.[index] || "/image-1.png";

    const link = document.createElement("a");
    link.href = imageSrc;
    link.download = `${title}-print-${index + 1}.png`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <nav className="max-w-7xl bg-blue-50 mx-auto flex items-center justify-between p-6">
        <Link
          href="/"
          className="text-2xl font-bold text-blue-400 hover:underline"
        >
          PhotoBooth
        </Link>
      </nav>
      <div className="min-h-screen bg-blue-50 px-6 py-12">
        <div className="bg-blue-300 shadow-2xl rounded-3xl overflow-x-auto">
          <div className="flex p-4 gap-6 w-max px-2">
            {Array.from({ length: count }).map((_, index) => (
              <div
                key={index}
                className="group relative min-w-[250px] rounded-lg overflow-hidden bg-white hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
              >
                <div className="relative w-full aspect-[7/5] overflow-hidden">
                  <Image
                    src={layouts[id]?.[index] || "/image-1.png"}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>

                <div className="flex flex-col gap-4 items-center p-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {title}
                    </h3>
                    <p className="text-blue-600 font-bold">₹{price}</p>
                  </div>

                  <div className="flex gap-3">
                    <Link
                      href={`/success/editLayout/${id}?print=${index}&count=${count}&price=${price}&title=${title}`}
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

          <div className="p-6 text-center text-lg font-semibold text-blue-700">
            Total Amount: ₹{amount}
          </div>
        </div>
      </div>
    </>
  );
}

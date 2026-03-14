"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";

interface GridCardProps {
  title: string;
  count: number;
  mode?: "user" | "admin";
  onDelete?: () => void;
}

const GridCard = ({ title, count, mode = "user", onDelete }: GridCardProps) => {
  return (
    <div className="group relative flex flex-col rounded-3xl overflow-hidden bg-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
      <div className="flex items-center justify-between p-6">
        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>

        {mode === "user" && (
          <Link
            href={{
              pathname: "/layout-designs",
              query: { title, count },
            }}
            className="px-6 py-2 rounded-xl bg-blue-400 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:bg-blue-500 hover:scale-105 active:scale-95"
          >
            Select
          </Link>
        )}

        {mode === "admin" && (
          <button
            onClick={onDelete}
            className="flex items-center cursor-pointer gap-2 px-5 py-2 rounded-xl bg-red-400 hover:bg-red-500 text-white font-semibold shadow-md transition"
          >
            <Trash2 size={16} />
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default GridCard;

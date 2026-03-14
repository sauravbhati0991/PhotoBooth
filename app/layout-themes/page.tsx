"use client";

import { Suspense } from "react";
import LayoutThemes from "@/components/layoutThemePage";

export default function LayoutThemePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <LayoutThemes />
    </Suspense>
  );
}

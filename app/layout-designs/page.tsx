"use client";

import { Suspense } from "react";
import LayoutDesigns from "@/components/layoutDesigns";

export default function LayoutDesignPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <LayoutDesigns />
    </Suspense>
  );
}

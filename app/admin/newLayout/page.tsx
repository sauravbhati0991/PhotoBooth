"use client";

import { Suspense } from "react";
import NewLayout from "@/components/newLayout";

export default function NewLayoutPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <NewLayout />
    </Suspense>
  );
}

"use client";

import { Suspense } from "react";
import EditLayout from "@/components/editLayout";

export default function EditLayoutPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <EditLayout />
    </Suspense>
  );
}

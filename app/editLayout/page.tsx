"use client";

import { Suspense } from "react";
import EditLayoutContent from "@/components/editlayoutcontent";

export default function EditLayoutPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <EditLayoutContent />
    </Suspense>
  );
}

"use client";

import { Suspense } from "react";
import DownloadContent from "@/components/donloadContent";

export default function DownloadPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <DownloadContent />
    </Suspense>
  );
}

"use client";

import { Suspense } from "react";
import SuccessContent from "@/components/SuccessContent";

export const dynamic = "force-dynamic";

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-xl">
          Loading...
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}

"use client";

import { Suspense } from "react";
import SuccessContent from "@/components/successContent";

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}

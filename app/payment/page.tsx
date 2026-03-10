"use client";

import { Suspense } from "react";
import PaymentContent from "@/components/paymentcontent";

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <PaymentContent />
    </Suspense>
  );
}

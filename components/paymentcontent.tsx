"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { CreditCard, Tag, ShoppingCart, Lock, ArrowLeft, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PaymentContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const title = searchParams.get("title") || "Photo Layout";
  const price = Number(searchParams.get("price")) || 0;
  const img = searchParams.get("img");
  const gif = searchParams.get("gif");
  const rows = searchParams.get("rows");
  const cols = searchParams.get("cols");

  const [loading, setLoading] = useState(false);
  const [copies, setCopies] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const amount = price * copies;

  const handlePayment = async () => {
    if (amount === 0) {
      router.push(
        `/success?gif=${encodeURIComponent(gif || "")}&img=${encodeURIComponent(img || "")}&rows=${rows}&cols=${cols}`,
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Create order on the server
      const orderRes = await fetch("/api/createOrder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      if (!orderRes.ok) {
        throw new Error("Failed to create order. Please try again.");
      }

      const order = await orderRes.json();

      // Step 2: Open Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "PhotoBooth",
        description: `${title} \u00d7 ${copies}`,
        order_id: order.id,
        handler: async (response: any) => {
          try {
            // Step 3: Verify payment signature on the server
            const verifyRes = await fetch("/api/verifyPayment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyData.verified) {
              // Step 4: Redirect to success page
              router.push(
                `/success?gif=${encodeURIComponent(gif || "")}&img=${encodeURIComponent(img || "")}&rows=${rows}&cols=${cols}`,
              );
            } else {
              setError("Payment verification failed. Please contact support.");
              setLoading(false);
            }
          } catch {
            setError("Payment verification failed. Please try again.");
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
        theme: {
          color: "#9333ea",
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", (response: any) => {
        setError(
          response.error?.description ||
            "Payment failed. Please try again.",
        );
        setLoading(false);
      });

      rzp.open();
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-r from-purple-500 via-pink-400 to-purple-600 px-6 pb-16 text-white">
        <div className="pt-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 bg-white/20 backdrop-blur-lg text-white px-4 py-2 rounded-xl border border-white/30 hover:bg-white/30 hover:scale-105 transition"
          >
            <ArrowLeft size={18} />
            Back
          </button>
        </div>

        <div className="text-center mb-12 mt-6">
          <h1 className="text-4xl font-bold">Payment</h1>
          <p className="text-white/80 mt-2">
            Complete your payment to download your photo layout
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-8">
          {error && (
            <div className="bg-red-500/20 backdrop-blur-lg border border-red-400/40 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="text-red-200 shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-red-100">Payment Error</p>
                <p className="text-red-200/90 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-200/70 hover:text-white cursor-pointer text-lg"
              >
                ×
              </button>
            </div>
          )}

          <div className="bg-white/20 backdrop-blur-lg rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <ShoppingCart className="text-white" />
              <h2 className="text-xl font-semibold">Order Summary</h2>
            </div>

            <div className="space-y-4 text-white/90">
              <div className="flex justify-between">
                <span>Selected Layout</span>
                <span className="font-medium">{title}</span>
              </div>

              <div className="flex justify-between">
                <span>Price per Layout</span>
                 <span>{price === 0 ? "Free" : `₹${price}`}</span>
              </div>

              <div className="flex justify-between items-center bg-white/10 p-3 rounded-xl border border-white/10">
                <span className="font-medium">Number of Copies</span>
                <div className="flex items-center gap-4 bg-white/20 rounded-lg p-1">
                  <button
                    onClick={() => setCopies(Math.max(1, copies - 1))}
                    className="w-8 h-8 flex items-center cursor-pointer justify-center bg-white/20 rounded-md hover:bg-white/30 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-bold text-lg">{copies}</span>
                  <button
                    onClick={() => setCopies(copies + 1)}
                    className="w-8 h-8 flex items-center cursor-pointer justify-center bg-white/20 rounded-md hover:bg-white/30 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-white/30 mt-6 pt-6 flex justify-between text-lg font-semibold">
              <span>Total</span>
               <span>{amount === 0 ? "Free" : `₹${amount}`}</span>
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur-lg rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Tag className="text-white" />
              <h2 className="text-xl font-semibold">Promo Code</h2>
            </div>

            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Enter promo code"
                className="flex-1 px-4 py-3 rounded-xl border border-white/40 bg-white/30 text-white placeholder-white/70 outline-none"
              />

              <button className="px-6 cursor-pointer py-3 rounded-xl bg-white text-purple-600 font-semibold shadow hover:scale-105 transition">
                Apply
              </button>
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur-lg rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="text-white" />
              <h2 className="text-xl font-semibold">Payment Method</h2>
            </div>

            <div className="border-2 border-white/40 cursor-pointer rounded-xl p-5 flex justify-between items-center">
              <div>
                <p className="font-semibold">Online Payment</p>
                <p className="text-white/70 text-sm">
                  Pay securely via Razorpay
                </p>
              </div>

              <div className="w-6 h-6 rounded-full bg-white text-purple-600 flex items-center justify-center text-sm">
                ✓
              </div>
            </div>
          </div>

           <button
            onClick={handlePayment}
            disabled={loading}
            className={`w-full py-4 rounded-2xl text-lg font-semibold flex items-center justify-center gap-2 transition shadow-xl
              ${loading
                ? "bg-white/50 text-purple-400 cursor-not-allowed"
                : "bg-white text-purple-600 cursor-pointer hover:scale-105"
              }`}
          >
            <Lock size={18} />
             {loading ? "Processing..." : amount === 0 ? "Get for Free" : `Pay ₹${amount}`}
          </button>
        </div>

        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="lazyOnload"
        />
      </div>
    </>
  );
};

export default PaymentContent;

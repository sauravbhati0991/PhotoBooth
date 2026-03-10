/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { CreditCard, Tag, ShoppingCart, Lock, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Script from "next/script";

const PaymentContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const title = searchParams.get("title") || "Photo Layout";
  const price = Number(searchParams.get("price")) || 0;
  const img = searchParams.get("img");

  const [loading, setLoading] = useState(false);

  const amount = price;

  const createOrder = async () => {
    setLoading(true);

    router.push(
      `/success?img=${encodeURIComponent(img || "")}&title=${encodeURIComponent(
        title,
      )}&amount=${amount}`,
    );
  };

  // const createOrder = async () => {
  //   try {
  //     setLoading(true);

  //     const res = await fetch("/api/createOrder", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({ amount }),
  //     });

  //     const data = await res.json();

  //     const options = {
  //       key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  //       amount: data.amount,
  //       currency: "INR",
  //       name: "PhotoBooth",
  //       description: title,
  //       order_id: data.id,

  //       handler: async () => {
  //         router.push(
  //           `/success?img=${encodeURIComponent(img || "")}&title=${encodeURIComponent(title)}&amount=${amount}`
  //         );
  //       },

  //       theme: {
  //         color: "#60a5fa",
  //       },
  //     };

  //     const payment = new (window as any).Razorpay(options);
  //     payment.open();

  //     payment.on("payment.failed", () => {
  //       setLoading(false);
  //       alert("Payment Failed");
  //     });
  //   } catch (error) {
  //     console.error(error);
  //     setLoading(false);
  //   }
  // };

  return (
    <>
      {/* Back Button */}
      <div className="w-full px-12 pt-6 bg-blue-50">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 bg-blue-400 text-white px-4 py-2 rounded-xl hover:bg-blue-500 cursor-pointer"
        >
          <ArrowLeft size={18} />
          Back
        </button>
      </div>

      <div className="min-h-screen bg-blue-50 px-6 pb-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-400">Payment</h1>
          <p className="text-gray-600 mt-2">
            Complete your payment to download your photo layout
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-8">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-blue-100">
            <div className="flex items-center gap-3 mb-6">
              <ShoppingCart className="text-blue-400" />
              <h2 className="text-xl font-semibold text-blue-400">
                Order Summary
              </h2>
            </div>

            <div className="space-y-4 text-gray-700">
              <div className="flex justify-between">
                <span>Selected Layout</span>
                <span className="font-medium">{title}</span>
              </div>

              <div className="flex justify-between">
                <span>Price</span>
                <span>₹{price}</span>
              </div>
            </div>

            <div className="border-t mt-6 pt-6 flex justify-between text-lg font-semibold text-blue-500">
              <span>Total</span>
              <span>₹{amount}</span>
            </div>
          </div>

          {/* Promo Code */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-blue-100">
            <div className="flex items-center gap-3 mb-6">
              <Tag className="text-blue-400" />
              <h2 className="text-xl font-semibold text-blue-400">
                Promo Code
              </h2>
            </div>

            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Enter promo code"
                className="flex-1 px-4 py-3 rounded-xl border border-blue-300"
              />

              <button className="px-6 py-3 rounded-xl bg-blue-400 text-white font-semibold cursor-pointer">
                Apply
              </button>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-blue-100">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="text-blue-400" />
              <h2 className="text-xl font-semibold text-blue-400">
                Payment Method
              </h2>
            </div>

            <div className="border-2 border-blue-400 rounded-xl p-5 flex justify-between items-center">
              <div>
                <p className="font-semibold text-gray-800">Online Payment</p>
                <p className="text-gray-500 text-sm">
                  Pay securely via Razorpay
                </p>
              </div>

              <div className="w-6 h-6 rounded-full bg-blue-400 flex items-center justify-center text-white text-sm">
                ✓
              </div>
            </div>
          </div>

          {/* Payment Button */}
          <button
            onClick={createOrder}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-blue-400 text-white text-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-500 cursor-pointer shadow-lg"
          >
            <Lock size={18} />
            {loading ? "Processing Payment..." : "Proceed to Payment"}
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

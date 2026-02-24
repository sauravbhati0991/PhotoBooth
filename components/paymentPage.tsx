/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
  CreditCard,
  Tag,
  Printer,
  ShoppingCart,
  Lock,
  ArrowLeft,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";

interface PaymentPageProps {
  grid: {
    id: number;
    title: string;
    price: number;
  };
}

const PaymentPage = ({ grid }: PaymentPageProps) => {
  const [count, setCount] = useState(1);
  const price = grid.price;
  const router = useRouter();

  const increment = () => {
    setCount(count + 1);
  };

  const decrement = () => {
    setCount(count > 1 ? count - 1 : 1);
  };

  const createOrder = async () => {
    try {
      const res = await fetch("/api/createOrder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: "INR",
        name: "PhotoBooth",
        description: {
          title: grid.title,
          no_of_prints: count,
        },
        order_id: data.id,
        handler: async function (response: any) {
          console.log("Payment Success:", response);
          router.push(
            `/success?id=${encodeURIComponent(grid.id)}&count=${count}&amount=${amount}`,
          );
        },
      };

      const payment = new (window as any).Razorpay(options);
      payment.open();
    } catch (error) {
      console.log(error);
    }
  };

  const amount = price * count;

  return (
    <>
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white bg-blue-400 p-3 rounded-xl font-medium hover:bg-blue-500 hover:cursor-pointer transition"
        >
          <ArrowLeft size={20} />
          Back
        </button>
      </div>
      <div className="min-h-screen  from-blue-50 to-white px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-400">Payment</h1>
          <p className="text-gray-600 mt-2">
            Complete your payment to proceed with photo capture
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-md p-8 border border-blue-100">
              <div className="flex items-center gap-3 mb-6">
                <ShoppingCart className="text-blue-400" />
                <h2 className="text-xl font-semibold text-blue-400">
                  Order Summary
                </h2>
              </div>

              <div className="space-y-4 text-gray-700">
                <div className="flex justify-between">
                  <span>Selected Grid</span>
                  <span className="font-medium">{grid.title}</span>
                </div>
                <div className="flex justify-between">
                  <span>Photos</span>
                  <span>{count}</span>
                </div>
                <div className="flex justify-between">
                  <span>Prints</span>
                  <span>{count}</span>
                </div>
              </div>

              <div className="border-t mt-6 pt-6 flex justify-between text-lg font-semibold text-blue-500">
                <span>Total</span>
                <span>₹{amount}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-8 border border-blue-100">
              <div className="flex items-center gap-3 mb-6">
                <Printer className="text-blue-400" />
                <h2 className="text-xl font-semibold text-blue-400">
                  Print Selection
                </h2>
              </div>

              <div className="flex items-center justify-center gap-8">
                <button
                  onClick={decrement}
                  className="w-12 h-12 rounded-full bg-blue-100 text-blue-400 text-2xl font-bold hover:bg-blue-200 transition hover:cursor-pointer hover:shadow-lg"
                >
                  -
                </button>

                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-400">{count}</p>
                  <p className="text-gray-500">Prints</p>
                </div>

                <button
                  onClick={increment}
                  className="w-12 h-12 rounded-full bg-blue-400 text-white text-2xl font-bold hover:bg-blue-500 transition hover:cursor-pointer hover:shadow-lg"
                >
                  +
                </button>
              </div>

              <p className="text-center text-gray-500 mt-4">
                ₹{grid.price} per print
              </p>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-2xl shadow-md p-8 border border-blue-100">
              <div className="flex items-center gap-3 mb-6">
                <Tag className="text-blue-400" />
                <h2 className="text-xl font-semibold text-blue-400">
                  Promo Code
                </h2>
              </div>

              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Enter 3-digit code"
                  className="flex-1 px-4 py-3 rounded-xl border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button className="px-6 py-3 rounded-xl bg-blue-400 text-white font-semibold hover:bg-blue-400 transition hover:cursor-pointer hover:shadow-lg">
                  Apply
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-md p-8 border border-blue-100">
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="text-blue-400" />
                <h2 className="text-xl font-semibold text-blue-400">
                  Payment Method
                </h2>
              </div>

              <div className="border-2 border-blue-400 rounded-xl p-5 flex justify-between items-center hover:cursor-pointer">
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
            <Script
              type="text/javascript"
              src="https://checkout.razorpay.com/v1/checkout.js"
              strategy="lazyOnload"
            />

            <button
              onClick={createOrder}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-400 to-blue-400 text-white text-lg font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition flex items-center justify-center gap-2 hover:cursor-pointer active:bg-blue-500"
            >
              <Lock size={18} />
              Proceed to Payment
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentPage;

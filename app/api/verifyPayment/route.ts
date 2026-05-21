import { NextResponse } from "next/server";
import crypto from "crypto";
import clientPromise from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = await req.json();

    // Verify the payment signature using HMAC SHA256
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_ID as string)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Invalid payment signature", verified: false },
        { status: 400 },
      );
    }

    // Update the order in MongoDB with payment details
    if (orderId) {
      try {
        const client = await clientPromise;
        const db = client.db("photobooth");

        await db.collection("orders").updateOne(
          { orderId },
          {
            $set: {
              paymentStatus: "completed",
              paymentType: "online",
              razorpayOrderId: razorpay_order_id,
              razorpayPaymentId: razorpay_payment_id,
            },
          }
        );
        console.log(`Order ${orderId} marked as completed (online)`);
      } catch (dbError) {
        console.error("Failed to update order in DB:", dbError);
        // Don't fail the payment verification because of a DB error
      }
    }

    return NextResponse.json({
      verified: true,
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      { error: "Verification failed", verified: false },
      { status: 500 },
    );
  }
}


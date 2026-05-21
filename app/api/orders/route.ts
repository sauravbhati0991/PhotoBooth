import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

// Generate a short unique order ID: PB-YYYYMMDD-XXXX
function generateOrderId(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PB-${date}-${rand}`;
}

export async function GET(req: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("photobooth");

    const { searchParams } = new URL(req.url);
    const paymentType = searchParams.get("paymentType");
    const paymentStatus = searchParams.get("paymentStatus");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {};

    if (paymentType) query.paymentType = paymentType;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = toDate;
      }
    }

    const orders = await db
      .collection("orders")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(orders);
  } catch (error) {
    console.error("GET orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const client = await clientPromise;
    const db = client.db("photobooth");

    // Ensure unique orderId
    let orderId = generateOrderId();
    while (await db.collection("orders").findOne({ orderId })) {
      orderId = generateOrderId();
    }

    const newOrder = {
      orderId,
      gifUrl: body.gifUrl || "",
      imageUrl: body.imageUrl || "",
      layoutTitle: body.layoutTitle || "Unknown",
      rows: body.rows || 0,
      cols: body.cols || 0,
      amount: body.amount || 0,
      copies: body.copies || 1,
      paymentType: body.paymentType || "online",
      paymentStatus: body.paymentStatus || "pending",
      razorpayOrderId: body.razorpayOrderId || null,
      razorpayPaymentId: body.razorpayPaymentId || null,
      createdAt: new Date(),
    };

    await db.collection("orders").insertOne(newOrder);

    return NextResponse.json(newOrder);
  } catch (error) {
    console.error("POST orders error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

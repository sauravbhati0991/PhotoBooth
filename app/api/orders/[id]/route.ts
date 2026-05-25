import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await clientPromise;
    const db = client.db("photobooth");

    const order = await db.collection("orders").findOne({ orderId: id });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("GET order error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const client = await clientPromise;
    const db = client.db("photobooth");

    const updateFields: Record<string, any> = {};

    if (body.paymentStatus) updateFields.paymentStatus = body.paymentStatus;
    if (body.paymentType) updateFields.paymentType = body.paymentType;
    if (body.razorpayOrderId)
      updateFields.razorpayOrderId = body.razorpayOrderId;
    if (body.razorpayPaymentId)
      updateFields.razorpayPaymentId = body.razorpayPaymentId;
    if (body.amount !== undefined) updateFields.amount = body.amount;

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const result = await db
      .collection("orders")
      .updateOne({ orderId: id }, { $set: updateFields });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const updatedOrder = await db.collection("orders").findOne({ orderId: id });

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error("PATCH order error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await clientPromise;
    const db = client.db("photobooth");

    const result = await db.collection("orders").deleteOne({ orderId: id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("DELETE order error:", error);
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    );
  }
}


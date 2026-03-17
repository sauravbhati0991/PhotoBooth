import { NextRequest } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// ✅ GET
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params; // ✅ FIX

    console.log("API ID:", id);

    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("photobooth");

    const layout = await db.collection("layouts").findOne({
      _id: new ObjectId(id),
    });

    if (!layout) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json(layout);
  } catch (error) {
    console.error("GET error:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

// ✅ PUT
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const client = await clientPromise;
    const db = client.db("photobooth");

    await db
      .collection("layouts")
      .updateOne({ _id: new ObjectId(id) }, { $set: body });

    return Response.json({ success: true });
  } catch (error) {
    console.error("PUT error:", error);
    return Response.json({ error: "Failed to update layout" }, { status: 500 });
  }
}

// ✅ DELETE
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = await params;

    const client = await clientPromise;
    const db = client.db("photobooth");

    await db.collection("layouts").deleteOne({
      _id: new ObjectId(id),
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE error:", error);
    return Response.json({ error: "Failed to delete layout" }, { status: 500 });
  }
}

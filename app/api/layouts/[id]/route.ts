import { NextRequest } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const client = await clientPromise;
    const db = client.db("photobooth");

    await db.collection("layouts").deleteOne({
      _id: new ObjectId(id),
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE layout error:", error);

    return Response.json({ error: "Failed to delete layout" }, { status: 500 });
  }
}

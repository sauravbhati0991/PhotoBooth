import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest } from "next/server";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const client = await clientPromise;
    const db = client.db("photobooth");

    const result = await db.collection("layouts").deleteOne({
      _id: new ObjectId(params.id),
    });

    return Response.json({
      success: true,
      deleted: result.deletedCount,
    });
  } catch (error) {
    console.error("Delete error:", error);

    return Response.json({ error: "Failed to delete layout" }, { status: 500 });
  }
}

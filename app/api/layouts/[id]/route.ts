import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const client = await clientPromise;
    const db = client.db("photobooth");

    await db.collection("layouts").deleteOne({
      _id: new ObjectId(params.id),
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE layout error:", error);
    return Response.json({ error: "Failed to delete layout" }, { status: 500 });
  }
}

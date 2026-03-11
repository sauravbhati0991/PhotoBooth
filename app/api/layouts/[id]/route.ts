import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("photobooth");

    const layouts = await db
      .collection("layouts")
      .find({})
      .sort({ count: 1 })
      .toArray();

    return Response.json(layouts);
  } catch (error) {
    console.error(error);

    return Response.json([], { status: 500 });
  }
}

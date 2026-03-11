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

    const cleaned = layouts.map((layout) => ({
      _id: layout._id.toString(),
      title: layout.title,
      price: layout.price,
      count: layout.count,
    }));

    return Response.json(cleaned);
  } catch (error) {
    console.error("GET layouts error:", error);
    return Response.json({ error: "Failed to fetch layouts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const client = await clientPromise;
    const db = client.db("photobooth");

    const result = await db.collection("layouts").insertOne({
      title: body.title,
      price: body.price,
      count: body.count,
    });

    return Response.json({
      _id: result.insertedId.toString(),
      title: body.title,
      price: body.price,
      count: body.count,
    });
  } catch (error) {
    console.error("POST layouts error:", error);
    return Response.json({ error: "Failed to add layout" }, { status: 500 });
  }
}

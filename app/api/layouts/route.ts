import clientPromise from "@/lib/mongodb";

export async function GET() {
  const client = await clientPromise;
  const db = client.db("photobooth");

  const layouts = await db
    .collection("layouts")
    .find({})
    .sort({ count: 1 })
    .toArray();

  return Response.json(layouts);
}

export async function POST(req: Request) {
  const body = await req.json();

  const client = await clientPromise;
  const db = client.db("photobooth");

  const result = await db.collection("layouts").insertOne({
    title: body.title,
    price: body.price,
    count: body.count,
  });

  return Response.json({
    _id: result.insertedId,
    ...body,
  });
}

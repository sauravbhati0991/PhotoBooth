import clientPromise from "@/lib/mongodb";

type Layout = {
  name: string;
  count: number;
  rows: number;
  cols: number;
  price?: number;
  backgroundType?: "color" | "image";
  backgroundValue?: string;
};

export async function GET(req: Request) {
  try {
    const client = await clientPromise;
    const db = client.db("photobooth");

    const { searchParams } = new URL(req.url);

    const count = searchParams.get("count");
    const rows = searchParams.get("rows");
    const cols = searchParams.get("cols");

    const query: Partial<Layout> = {};

    if (count) query.count = Number(count);
    if (rows) query.rows = Number(rows);
    if (cols) query.cols = Number(cols);

    const layouts = await db
      .collection<Layout>("layouts")
      .find(query)
      .toArray();

    return Response.json(layouts);
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

    const existingLayout = await db.collection<Layout>("layouts").findOne({
      name: { $regex: `^${body.name}$`, $options: "i" }, // case insensitive
    });

    if (existingLayout) {
      return Response.json(
        { error: "Layout name already exists" },
        { status: 400 },
      );
    }

    const newLayout: Layout & { createdAt: Date } = {
      name: body.name,
      count: body.count,
      rows: body.rows,
      cols: body.cols,
      price: body.price,
      backgroundType: body.backgroundType,
      backgroundValue: body.backgroundValue,
      createdAt: new Date(),
    };

    const result = await db.collection("layouts").insertOne(newLayout);

    return Response.json({
      _id: result.insertedId.toString(),
      ...newLayout,
    });
  } catch (error) {
    console.error("POST layouts error:", error);

    return Response.json({ error: "Failed to create layout" }, { status: 500 });
  }
}

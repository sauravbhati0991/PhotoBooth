import { writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { image } = await req.json();

  const base64Data = image.replace(/^data:image\/jpeg;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  const fileName = `photo-${Date.now()}.jpg`;
  const filePath = path.join(process.cwd(), "public", fileName);

  await writeFile(filePath, buffer);

  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/${fileName}`;

  return NextResponse.json({ url });
}

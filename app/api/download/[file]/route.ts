import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET(
  req: Request,
  context: { params: Promise<{ file: string }> },
) {
  try {
    const { file } = await context.params;

    const filePath = path.join(process.cwd(), "public", file);

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": `attachment; filename="${file}"`,
      },
    });
  } catch (error) {
    return new NextResponse("File not found", { status: 404 });
  }
}

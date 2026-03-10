import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET(
  req: Request,
  { params }: { params: { file: string } },
) {
  try {
    const filePath = path.join(process.cwd(), "public", params.file);

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": `attachment; filename="${params.file}"`,
      },
    });
  } catch (error) {
    return new NextResponse("File not found", { status: 404 });
  }
}

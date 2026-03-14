import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: Request) {
  try {
    const { image } = await req.json();

    const upload = await cloudinary.uploader.upload(image, {
      folder: "photobooth/layouts",
    });

    return Response.json({
      url: upload.secure_url,
    });
  } catch (error) {
    console.error("Upload error:", error);

    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}

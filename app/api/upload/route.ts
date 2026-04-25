import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export async function POST(req: Request) {
  try {
    const { gif, image } = await req.json();

    // Single image upload (e.g. layout background)
    if (image && !gif) {
      const upload = await cloudinary.uploader.upload(image, {
        folder: "photobooth/backgrounds",
      });
      return Response.json({ url: upload.secure_url });
    }

    // Gif + image upload (photobooth capture)
    if (!gif || !image) {
      return Response.json({ error: "Missing gif or image" }, { status: 400 });
    }

    const gifUpload = await cloudinary.uploader.upload(gif, {
      folder: "photobooth/gifs",
      resource_type: "image", // important for base64 gif
    });

    const imageUpload = await cloudinary.uploader.upload(image, {
      folder: "photobooth/images",
    });

    return Response.json({
      gifUrl: gifUpload.secure_url,
      imageUrl: imageUpload.secure_url,
    });
  } catch (error) {
    console.error("Upload error:", error);

    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}

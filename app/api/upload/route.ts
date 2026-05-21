import { v2 as cloudinary } from "cloudinary";
import clientPromise from "@/lib/mongodb";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// Generate a short unique order ID: PB-YYYYMMDD-XXXX
function generateOrderId(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PB-${date}-${rand}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const bodyMB = (Buffer.byteLength(body, "utf-8") / (1024 * 1024)).toFixed(2);
    console.log(`Upload request body size: ${bodyMB}MB`);

    const { gif, image, layoutTitle, rows, cols, amount, copies } = JSON.parse(body);

    // Single image upload (e.g. layout background)
    if (image && !gif) {
      const upload = await cloudinary.uploader.upload(image, {
        folder: "photobooth/backgrounds",
        quality: "auto:good",
      });
      return Response.json({ url: upload.secure_url });
    }

    // Gif + image upload (photobooth capture)
    if (!gif || !image) {
      return Response.json({ error: "Missing gif or image" }, { status: 400 });
    }

    // Upload GIF and image in parallel for faster response
    const [gifUpload, imageUpload] = await Promise.all([
      cloudinary.uploader.upload(gif, {
        folder: "photobooth/gifs",
        resource_type: "image", // important for base64 gif
      }),
      cloudinary.uploader.upload(image, {
        folder: "photobooth/images",
        quality: "auto:good",
      }),
    ]);

    console.log(
      `Uploaded - GIF: ${(gifUpload.bytes / (1024 * 1024)).toFixed(2)}MB, Image: ${(imageUpload.bytes / (1024 * 1024)).toFixed(2)}MB`
    );

    // Create order record in MongoDB
    const client = await clientPromise;
    const db = client.db("photobooth");

    let orderId = generateOrderId();
    while (await db.collection("orders").findOne({ orderId })) {
      orderId = generateOrderId();
    }

    const newOrder = {
      orderId,
      gifUrl: gifUpload.secure_url,
      imageUrl: imageUpload.secure_url,
      layoutTitle: layoutTitle || "Unknown",
      rows: rows || 0,
      cols: cols || 0,
      amount: amount || 0,
      copies: copies || 1,
      paymentType: "online",
      paymentStatus: amount === 0 ? "completed" : "pending",
      razorpayOrderId: null,
      razorpayPaymentId: null,
      createdAt: new Date(),
    };

    await db.collection("orders").insertOne(newOrder);
    console.log(`Order created: ${orderId}`);

    return Response.json({
      gifUrl: gifUpload.secure_url,
      imageUrl: imageUpload.secure_url,
      orderId,
    });
  } catch (error) {
    console.error("Upload error:", error);

    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}


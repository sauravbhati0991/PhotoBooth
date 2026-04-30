import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("photobooth");
    
    const user = await db.collection("users").findOne({
      email: email,
      password: password, // Note: In a production app, use bcrypt to compare hashes
      role: "admin",
    });

    if (user) {
      // Set a cookie that will be checked by middleware
      const cookieStore = await cookies();
      cookieStore.set({
        name: "admin_token",
        value: "authenticated",
        httpOnly: true,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24, // 1 day
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Invalid email, password, or insufficient permissions" },
      { status: 401 },
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

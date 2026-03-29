import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildTransformation(action: string): any[] {
  switch (action) {
    case "remove-bg":
      return [{ effect: "background_removal" }, { quality: "auto:best", format: "png" }];
    case "enhance":
      return [
        { effect: "improve:indoor:50" },
        { effect: "sharpen:80" },
        { quality: "auto:best", format: "jpg" },
      ];
    case "resize":
      return [
        { width: 800, height: 800, crop: "pad", background: "white" },
        { quality: "auto:best", format: "jpg" },
      ];
    case "all":
      return [
        { effect: "background_removal" },
        { effect: "improve:indoor:50" },
        { effect: "sharpen:80" },
        { width: 800, height: 800, crop: "pad", background: "white" },
        { quality: "auto:best", format: "jpg" },
      ];
    default:
      return [{ effect: "improve" }, { quality: "auto", format: "jpg" }];
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  let body: { image: string; action: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { image, action } = body;
  if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });

  try {
    const transformation = buildTransformation(action);

    const result = await cloudinary.uploader.upload(image, {
      folder: "intactgh/ai-enhanced",
      public_id: `ai_${action}_${Date.now()}`,
      overwrite: false,
      eager: [{ transformation }],
      eager_async: false,
    });

    const enhancedUrl = result.eager?.[0]?.secure_url ?? result.secure_url;
    const originalUrl = result.secure_url;

    return NextResponse.json({ url: enhancedUrl, originalUrl, publicId: result.public_id });
  } catch (err) {
    console.error("Image enhancement error:", err);
    const msg = err instanceof Error ? err.message : "Processing failed";
    const isFeatureError =
      msg.toLowerCase().includes("background") || msg.toLowerCase().includes("add-on");
    return NextResponse.json(
      {
        error: isFeatureError
          ? "Background removal requires a Cloudinary paid add-on. Please try Enhance Quality or Resize & Crop instead."
          : `Image processing failed: ${msg}`,
      },
      { status: 422 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { verifyAdmin } from "@/lib/auth";

function signCloudinary(
  params: Record<string, string>,
  apiSecret: string
): string {
  const str = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(str + apiSecret).digest("hex");
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdmin(request);
  if (auth.error) return auth.error;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to your .env." },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File exceeds 10 MB limit." }, { status: 413 });
  }

  const timestamp = Math.round(Date.now() / 1000).toString();
  const folder = "intactghana/products";

  const sigParams: Record<string, string> = { folder, timestamp };
  const signature = signCloudinary(sigParams, apiSecret);

  const cloudForm = new FormData();
  cloudForm.append("file", file);
  cloudForm.append("api_key", apiKey);
  cloudForm.append("timestamp", timestamp);
  cloudForm.append("folder", folder);
  cloudForm.append("signature", signature);

  try {
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: cloudForm }
    );

    const data = await res.json();

    if (!res.ok || data.error) {
      console.error("[Cloudinary] upload error:", data.error);
      return NextResponse.json(
        { error: data.error?.message ?? "Cloudinary upload failed." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: data.secure_url as string,
      publicId: data.public_id as string,
      width: data.width as number,
      height: data.height as number,
    });
  } catch (err) {
    console.error("[Cloudinary] request error:", err);
    return NextResponse.json({ error: "Upload request failed." }, { status: 500 });
  }
}

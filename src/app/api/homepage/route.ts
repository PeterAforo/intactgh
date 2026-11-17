import { NextResponse } from "next/server";
import { getHomepageData } from "@/lib/homepage-data";

export async function GET() {
  try {
    const data = await getHomepageData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Homepage data error:", error);
    return NextResponse.json({ error: "Failed to load homepage" }, { status: 500 });
  }
}

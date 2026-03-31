import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, name, email, phone, coverLetter } = body;
    if (!name || !email) {
      return NextResponse.json({ error: "name and email are required" }, { status: 400 });
    }
    const application = await prisma.jobApplication.create({
      data: {
        jobId: jobId || null,
        name,
        email,
        phone: phone || null,
        coverLetter: coverLetter || null,
        status: "new",
      },
    });
    return NextResponse.json({ success: true, application }, { status: 201 });
  } catch (error) {
    console.error("Application submit error:", error);
    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }
}

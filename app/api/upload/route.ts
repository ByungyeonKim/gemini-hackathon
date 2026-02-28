import { NextResponse } from "next/server";
import type { UploadResponse } from "@/types/upload";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("video") ?? formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Video file is required." },
        { status: 400 }
      );
    }

    // TODO: 외부 프레임 추출 API로 전달 후 savedFrames, frames 수신
    const savedFrames = Math.floor(Math.random() * 46) + 5; // mock: 5~50
    const frames = Array.from(
      { length: savedFrames },
      (_, i) => `https://placehold.co/160x90?text=Frame+${i + 1}`
    );

    const body: UploadResponse = { savedFrames, frames };
    return NextResponse.json(body);
  } catch {
    return NextResponse.json(
      { error: "An error occurred while processing the upload." },
      { status: 500 }
    );
  }
}

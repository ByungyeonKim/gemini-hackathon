import { NextResponse } from "next/server";
import type { UploadResponse } from "@/types/upload";
import { spawn } from "child_process";
import { writeFile, unlink, mkdir } from "fs/promises";
import path from "path";
import os from "os";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("video") ?? formData.get("file");
    const tag = (formData.get("tag") as string) ?? "car";

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Video file is required." },
        { status: 400 }
      );
    }

    // Create unique ID and paths
    const videoId = `video_${Date.now()}`;
    const tmpDir = path.join(os.tmpdir(), "gemini-uploads");
    await mkdir(tmpDir, { recursive: true });

    const videoPath = path.join(tmpDir, `${videoId}.mp4`);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(videoPath, buffer);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const pythonProcess = spawn("python3", [
          "extract_frames.py",
          "--video", videoPath,
          "--tag", tag,
          "--video_id", videoId
        ]);

        pythonProcess.stdout.on("data", (data) => {
          controller.enqueue(encoder.encode(data.toString()));
        });

        pythonProcess.stderr.on("data", (data) => {
          // We still send stderr but maybe prefix it if we want to distinguish in the UI
          controller.enqueue(encoder.encode(`[ERROR] ${data.toString()}`));
        });

        pythonProcess.on("close", async (code) => {
          // Clean up temp video file
          await unlink(videoPath).catch(console.error);

          if (code !== 0) {
            controller.enqueue(encoder.encode(`\n[FATAL] Process exited with code ${code}\n`));
          }
          controller.close();
        });
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err.message || "An error occurred while processing the upload." },
      { status: 500 }
    );
  }
}

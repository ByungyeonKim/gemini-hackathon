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

    // Call Python script
    const pythonResult = await new Promise<string>((resolve, reject) => {
      const pythonProcess = spawn("python3", [
        "extract_frames.py",
        "--video", videoPath,
        "--tag", tag,
        "--video_id", videoId
      ]);

      let output = "";
      let errorOutput = "";

      pythonProcess.stdout.on("data", (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on("close", (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Python process failed with code ${code}: ${errorOutput}`));
        }
      });
    });

    // Parse Python JSON output
    let result;
    try {
      // Find the last line which should be our JSON
      const lines = pythonResult.trim().split("\n");
      const lastLine = lines[lines.length - 1];
      result = JSON.parse(lastLine);
    } catch (e) {
      console.error("Failed to parse Python output:", pythonResult);
      throw new Error("Invalid output from processing script.");
    }

    // Clean up temp video file
    await unlink(videoPath).catch(console.error);

    const body: UploadResponse = {
      savedFrames: result.processed_count,
      frames: result.frame_urls,
      datasetPath: result.dataset_path,
      datasetUrl: result.dataset_url
    };

    return NextResponse.json(body);
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err.message || "An error occurred while processing the upload." },
      { status: 500 }
    );
  }
}

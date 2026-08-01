import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import ffmpegPath from "ffmpeg-static";
import { getAdminViewer } from "@/lib/admin";

// Video re-encoding below can take a few seconds — give it real headroom
// instead of the framework's default.
export const maxDuration = 60;

const execFileAsync = promisify(execFile);

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};
// iPhones often export .mov (video/quicktime) — re-encoded to .mp4 below
// same as an .mp4 upload, so it doesn't matter which one came in.
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/quicktime"]);

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 150 * 1024 * 1024;

export async function POST(request: Request) {
  const { isAdmin } = await getAdminViewer();
  if (!isAdmin) {
    return NextResponse.json({ ok: false, reason: "not authorized" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, reason: "no file provided" }, { status: 400 });
  }

  const imageExt = ALLOWED_IMAGE_TYPES[file.type];
  const isVideo = ALLOWED_VIDEO_TYPES.has(file.type);
  if (!imageExt && !isVideo) {
    return NextResponse.json({ ok: false, reason: "unsupported file type" }, { status: 400 });
  }
  if (imageExt && file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json({ ok: false, reason: "file too large (max 8MB)" }, { status: 400 });
  }
  if (isVideo && file.size > MAX_VIDEO_BYTES) {
    return NextResponse.json({ ok: false, reason: "file too large (max 150MB)" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());

  if (imageExt) {
    const blob = await put(`${crypto.randomUUID()}.${imageExt}`, bytes, {
      access: "public",
      contentType: file.type,
    });
    return NextResponse.json({ ok: true, url: blob.url });
  }

  // Video: re-encode to H.264 + faststart before storing — the same
  // treatment as scripts/optimize-video.mjs — so nothing uploaded here can
  // end up as the "stuck on a frozen frame" HEVC/no-faststart problem.
  // Vercel's serverless functions can't write anywhere except os.tmpdir(),
  // so the source + re-encoded file both live there, cleaned up after.
  const tmpIn = path.join(os.tmpdir(), `${crypto.randomUUID()}-in.mp4`);
  const tmpOut = path.join(os.tmpdir(), `${crypto.randomUUID()}-out.mp4`);
  try {
    await writeFile(tmpIn, bytes);
    await execFileAsync(ffmpegPath as string, [
      "-i",
      tmpIn,
      "-c:v",
      "libx264",
      "-crf",
      "23",
      "-preset",
      "fast",
      "-c:a",
      "aac",
      "-b:a",
      "96k",
      "-movflags",
      "+faststart",
      tmpOut,
      "-y",
    ]);
    const optimized = await readFile(tmpOut);
    const blob = await put(`${crypto.randomUUID()}.mp4`, optimized, {
      access: "public",
      contentType: "video/mp4",
    });
    return NextResponse.json({ ok: true, url: blob.url });
  } catch (err) {
    console.error("Video optimize failed:", err);
    return NextResponse.json({ ok: false, reason: "couldn't process video" }, { status: 500 });
  } finally {
    await unlink(tmpIn).catch(() => {});
    await unlink(tmpOut).catch(() => {});
  }
}

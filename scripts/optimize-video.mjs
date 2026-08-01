// Re-encodes a video for the web: H.264 (universal browser/device support,
// unlike the HEVC phones often export by default), a reasonable quality
// bitrate via CRF, and "+faststart" so playback can begin before the whole
// file has downloaded — this is usually what actually fixes a hero/editorial
// video that feels "stuck" for a long time before it starts playing.
//
// Usage: node scripts/optimize-video.mjs public/videos/hero.mp4 [more files...]
// Run this any time a video gets swapped for a new one — overwrites in
// place; git history keeps the previous version if it's ever needed back.
import { execFileSync } from "node:child_process";
import { existsSync, renameSync, statSync } from "node:fs";
import ffmpegPath from "ffmpeg-static";

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("Usage: node scripts/optimize-video.mjs <video-file> [more files...]");
  process.exit(1);
}

for (const file of files) {
  if (!existsSync(file)) {
    console.error(`Skipping ${file} — not found.`);
    continue;
  }
  const before = statSync(file).size;
  const tmp = `${file}.optimized.mp4`;

  execFileSync(ffmpegPath, [
    "-i", file,
    "-c:v", "libx264",
    "-crf", "23",
    "-preset", "slow",
    "-c:a", "aac",
    "-b:a", "96k",
    "-movflags", "+faststart",
    tmp,
    "-y",
  ]);

  const after = statSync(tmp).size;
  renameSync(tmp, file);
  console.log(
    `${file}: ${(before / 1024 / 1024).toFixed(1)}MB -> ${(after / 1024 / 1024).toFixed(1)}MB`
  );
}

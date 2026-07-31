// Keeps public/images/home/hero.jpg in sync with public/videos/hero.mp4 —
// runs on every build/dev start so swapping the video file never leaves a
// stale, mismatched poster image behind (see lib/media.ts's getHeroImage()).
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import ffmpegPath from "ffmpeg-static";

const videoPath = "public/videos/hero.mp4";
const posterPath = "public/images/home/hero.jpg";

if (!existsSync(videoPath)) {
  process.exit(0);
}

execFileSync(ffmpegPath, [
  "-i", videoPath,
  "-vframes", "1",
  "-update", "1",
  "-q:v", "2",
  posterPath,
  "-y",
]);

console.log(`Generated ${posterPath} from ${videoPath}`);

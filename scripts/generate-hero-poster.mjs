// Keeps the hero poster images in sync with the hero video files — runs on
// every build/dev start so swapping a video file never leaves a stale,
// mismatched poster image behind (see lib/media.ts's getHeroMedia()).
//
// The mobile cut gets its own poster: it's a different edit of different
// footage, so reusing the desktop poster would flash a frame of the wrong
// video before playback starts on phones.
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import ffmpegPath from "ffmpeg-static";

const pairs = [
  { video: "public/videos/hero.mp4", poster: "public/images/home/hero.jpg" },
  { video: "public/videos/hero-mobile.mp4", poster: "public/images/home/hero-mobile.jpg" },
];

for (const { video, poster } of pairs) {
  // Both videos are optional — the homepage falls back to an image, and the
  // mobile cut only exists when someone has deliberately added one.
  if (!existsSync(video)) continue;

  execFileSync(ffmpegPath, [
    "-i", video,
    "-vframes", "1",
    "-update", "1",
    "-q:v", "2",
    poster,
    "-y",
  ]);

  console.log(`Generated ${poster} from ${video}`);
}

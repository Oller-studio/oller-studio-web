// Runs `next dev`, pinned to whatever port this worktree declares in its
// own untracked `.devport` file (one line, just the number) — so each of
// the parallel worktrees (Oller Studio, Oller-Studio-agent2, ...) always
// gets the same port regardless of which one's server started first.
// No `.devport` file present just falls back to Next's normal behavior
// (default 3000, auto-incrementing if taken).
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const portFile = path.join(root, ".devport");

const port = existsSync(portFile) ? readFileSync(portFile, "utf8").trim() : null;
const args = ["next", "dev", ...(port ? ["-p", port] : [])];

const result = spawnSync("npx", args, { stdio: "inherit", shell: true });
process.exit(result.status ?? 0);

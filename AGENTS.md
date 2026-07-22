<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Git workflow — read before touching git

This repo is worked on from **several parallel worktrees at once** (separate folders, each with its own VS Code window and its own Claude Code session): `Oller Studio`, `Oller-Studio-agent2`, `Oller-Studio-agent3`. Each folder has its own branch checked out. Follow this without being asked:

- **Never commit or push directly to `master`.** All work happens on a branch.
- **Before starting a new task**, confirm which branch is currently checked out in this folder (`git branch --show-current`). If it's `master`, or if the current branch clearly belongs to a different, already-finished task, create a new branch first with a descriptive name (`feature/...`, `fix/...`, `chore/...`) off an up-to-date `master`.
- **Never run `git checkout` to switch this folder to a different branch** if another agent might be relying on this folder's current branch — these folders are shared physical spaces; switching branches under someone else changes their files out from under them. If unsure, ask first.
- **Commit at meaningful checkpoints**, not mid-broken-state, with a message that says what changed and why — never "update" / "changes" / "wip".
- **When the task is done and verified working locally** (`npm run build` clean, manually checked in the browser), push the branch and open a Pull Request with `gh pr create`. Summarize what changed and how to test it in the PR body.
- **Never merge a PR into `master` without Alicia's explicit go-ahead** — opening the PR is the deliverable; merging is her call.
- Branch protection on GitHub is not available (private repo, free plan) — this workflow is the only safety net, so follow it even though GitHub won't enforce it.
- If `npm run dev`'s default port (3000) is taken by another worktree's server, Next.js will automatically pick the next free one (3001, 3002, ...) — that's expected when multiple worktrees run at once, not a bug.

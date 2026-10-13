# Persistent KaTeX delimiter patch

## Saved work

- Fork: https://github.com/haskfunQM/pi-web-ui
- Upstream pull request: https://github.com/xing-shuyin/pi-web-ui/pull/629
- Installed-release branch: `fix/backslash-math-local-v0.104.4` (based on official `v0.104.4`).
- Reusable code commit: `03d5f41` (`fix(markdown): support backslash-delimited KaTeX math`).
- Upstream PR branch: `fix/markdown-backslash-delimiters` (`ee5aa09`, based on upstream main).
- Portable mail patch: `backslash-math.patch` (local recovery file, not sent upstream).
- This checkout: `C:\Users\ADMIN\pi-web-ui-math`.

The installed-release branch includes the code, tests, this guide, and the Windows deployment helper. The upstream PR contains only the parser, Markdown integration, and regression tests; it does not include local deployment files or backups.

## Changes

`web/src/remark-backslash-math.ts` recognizes complete backslash-bracket display math and backslash-parenthesis inline math before Markdown escaping. It emits compatible math nodes for the existing KaTeX renderer. Both normal and hard-break Markdown pipelines register the extension. Dollar math, literal code, escaped delimiters, and list/quote boundaries are covered by tests.

No server, chat data, model settings, or prompts were changed. This is a maintained source patch, not an automatic updater or browser setting.

## Validation

Full typecheck, formatting, 73 relevant tests in five files, and frontend build passed on both the installed-release source and the upstream-main PR source. Independent focused review passed 22 additional boundary/literal-code checks. Upstream CI status can be checked on the PR; local validation does not mean the maintainer has merged it.

## Rebuild the current installed version (PowerShell)

```powershell
Set-Location "$env:USERPROFILE\pi-web-ui-math"
git switch fix/backslash-math-local-v0.104.4
npm ci --ignore-scripts --no-audit --no-fund
npm run typecheck
npx vitest run tests/unit/markdown-math.test.ts tests/unit/markdown.test.ts tests/unit/markdown-html.test.ts tests/unit/markdown-chunks.test.ts tests/unit/stream-markdown.test.ts
npm run build:web
node deploy-math-frontend.mjs
```

The deployment helper verifies that the checkout version matches the globally installed package and that the checkout descends from that release tag. It preserves old hashed assets and vendor files, backs up the frontend, then updates index.html last. Always build immediately before deploying; the helper does not prove the existing build belongs to the current checkout. Hard-refresh the browser afterward (Ctrl+F5). No server restart is required for this frontend-only patch.

## Updating before the upstream fix is released

1. Finish active agent work and back up important data before upgrading pi-web-ui.
2. Find the version installed by npm. Fetch its official source tag with `git fetch origin --tags`.
3. Create a new local branch from that exact tag, for example `git switch -c math-vNEW_VERSION vNEW_VERSION` (replace NEW_VERSION with the real version).
4. Apply only the reusable code change: `git cherry-pick 03d5f41`. Resolve conflicts deliberately; abort with `git cherry-pick --abort` if uncertain. If the new release already implements this feature, do not add a duplicate plugin.
5. Restore the local deployment helper into the new branch: `git restore --source fix/backslash-math-local-v0.104.4 --worktree -- deploy-math-frontend.mjs`.
6. Install that version's dependencies, format changed files, run its typecheck and relevant tests, and build its frontend.
7. Run `node deploy-math-frontend.mjs`. Do NOT deploy the old v0.104.4 frontend over a newer server.
8. Save the new branch to your fork: `git push -u fork HEAD`.

Installing/updating npm may overwrite the live patch, but it cannot overwrite the source branches saved in this separate checkout and GitHub fork.

Once PR #629 is merged and included in an official release, install that release, verify delimiter rendering, and stop applying the local patch.

## Recover if the local source checkout is lost

```powershell
git clone --branch fix/backslash-math-local-v0.104.4 https://github.com/haskfunQM/pi-web-ui.git pi-web-ui-math
```

This restores source and maintenance instructions, not your locally stored frontend backups or chat data. You can also apply `backslash-math.patch` to a suitable clean source checkout using `git am`.

## Rollback the original v0.104.4 frontend (PowerShell)

The original unmodified frontend backup is the flat `installed-web-dist-backup` directory created during the first patch. Later per-version backups preserve the frontend present immediately before later deployments, which may itself already be patched.

```powershell
Set-Location "$env:USERPROFILE\pi-web-ui-math"
Copy-Item '.\installed-web-dist-backup\index.html' "$env:APPDATA\npm\node_modules\pi-web-ui\web\dist\index.html" -Force
Copy-Item '.\installed-web-dist-backup\assets\*' "$env:APPDATA\npm\node_modules\pi-web-ui\web\dist\assets" -Recurse -Force
```

Use this rollback only while the installed package remains v0.104.4. Then hard-refresh. Extra hashed assets are harmless when no index references them.

## Scope and caveats

- There is no guarantee the upstream maintainer will merge the PR.
- Streaming segmentation is unchanged. Math spanning a blank-line segment boundary may only render correctly when the final full-document parse runs.
- Avoid rebasing or force-pushing published branches unless you understand the consequences; new version-specific branches are easier to preserve and recover.

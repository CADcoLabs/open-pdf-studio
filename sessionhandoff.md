# Session Handoff — Open PDF Studio (MAPI Edition)

**Session dates:** 2026-09-08 through 2026-09-09
**Repo:** `C:\Users\barrya\source\repos\open-PDF-studio`
**Branch:** `001` (off `main` @ `f83ce772`, upstream v1.95.0)
**Commit:** `0565cb43` — **local only, 10 commits ahead of `origin/001`, not pushed**
**Maintainer:** Barry Adams / CADcoLabs, for Mullet's Aluminum Products, Inc. (MAPI)

---

## Pick up here

1. **Run Task 2's SolidWorks smoke test** (see `open-pdf-studio/scripts/solidworks/README.md`
   and the plan's Task 2 Step 2): temporarily point `ROOT_FOLDER` in
   `ExportWeldmentProfiles.bas` at just `...\ansi inch\angle alum` (~12 files), run it in
   SolidWorks, confirm the DXFs look right and no source `.SLDLFP` was touched, then revert
   the constants back to the real paths.
2. **Run Task 5** (the plan's final task): the real batch export (~474 files, a few minutes),
   review `_export_log.txt`, regenerate `js/symbols/data/mapiProfiles.js` for real via
   `node scripts/mapi-profiles/generate.mjs "<export folder>" js/symbols/data/mapiProfiles.js`,
   re-run the four test files, visually spot-check the Symbol Palette, commit.
3. **Delete `completion_report.md`** (repo root, untracked) once its contents are no longer
   needed — it was Codex's task-completion note for this session, already relayed and
   validated below. Not committed, so it's not blocking anything, but it's clutter.
4. Decide whether to push these 10 commits to `origin/001` now or keep batching — nothing
   has been pushed this session.
5. After the symbol library ships, next in the agreed sequence:
   **tool chest** (sub-project 2) → **markup list/summary** (sub-project 3). Comparison/overlay
   is shelved per user decision — not part of this rollout.

---

## Why this repo exists

MAPI administration commissioned a free replacement for Bluebeam Revu. This is a **detached
internal fork** of [OpenAEC-Foundation/open-pdf-studio](https://github.com/OpenAEC-Foundation/open-pdf-studio),
cloned from `CADcoLabs/open-pdf-studio`. Distribution is internal-only.

**Before this rolls out to MAPI administration for approval**, the user wants the app
completely customized to MAPI and ready for a seamless Bluebeam → OpenPDFStudio-MAPI
transition for drawing review. That was decomposed (2026-09-09 brainstorming session) into
three sequenced sub-projects, based on which Bluebeam capabilities the user confirmed MAPI
actually relies on (markup/annotation, measurement/takeoff, markup list/summary, custom tool
chest — **not** batch/document-set tools, comparison/overlay shelved for later):

1. **Symbol library** *(in progress — this session)*
2. **Tool chest** — saved/reusable markup tools with MAPI default styles; symbol palettes +
   per-type default styles are a head start. Also a good place for the **Bluebeam Tool Chest
   (.btx) import** idea discovered this session (see below) — importing a user's own
   `.btx` file to carry their personal saved tools over from Bluebeam.
3. **Markup list/summary report** — per-markup list → Excel/PDF, extending the CSV-export
   pattern already used by `js/quantities/schedule-csv.js`.

---

## What was done this session (2026-09-09)

### 1. Branding pass (roadmap step 2, largely complete)
User chose: `productName`/window title/package/crate name → **`OpenPDFStudio-MAPI`**, deep-link
scheme → **`openpdfstudio-mapi`**, Snap/Flatpak explicitly left alone (Windows-only rollout).

| File | Change |
|---|---|
| `src-tauri/tauri.conf.json` | `productName`, window title, `fileAssociations.name`, deep-link scheme |
| `package.json` | `name` → `openpdfstudio-mapi`, description |
| `src-tauri/Cargo.toml` | `name`, `authors`, `license` (MIT → **LGPL-3.0-or-later**, matches `LICENSE.md`), `repository` |
| `src-tauri/nsis/hooks.nsh` | Registry ProgID synced to the renamed `fileAssociations.name` (was hardcoded separately — would have desynced file-association registration) |
| `.github/workflows/render-regression.yml`, `windows-arm64.yml` | Fixed two CI references broken by the Cargo package rename |
| `scripts/test-move-sweep.ps1`, `test-rotate-snap.ps1` | Stale exe-name comments updated |

Still open: `docs/superpowers/plans/2026-09-09-mapi-symbol-library.md`'s scope doesn't cover
it, and it wasn't otherwise touched this session — worth a follow-up look if anything else
still says "Open PDF Studio" instead of the new name.

### 2. Cut remaining live ties to OpenAEC infrastructure (`f0764c09`)
User: *"I don't want anything pulling from nor reaching out to open-aec.com nor the github
unless is ours."* Found and neutralized everything beyond last session's updater fix:

**Runtime code, hard-disabled (same `UPDATES_DISABLED`-style guard pattern):**
- `src-tauri/src/accounts.rs` — "Sign in with OpenAEC" OIDC login + cloud storage, 6 Tauri
  commands, reachable via IPC even with no UI wired to them. `ACCOUNTS_DISABLED = true` guard
  on all 6 network-touching commands.
- `js/solid/stores/symbolLibraryOnlineStore.js` — **silently fetched from
  `OpenAEC-Foundation/open-pdf-studio-library` on GitHub every time the Settings dialog
  opened.** `ONLINE_LIBRARY_DISABLED = true` guard.
- `js/help/previous-version.js` — queried `api.github.com` for OpenAEC-Foundation's own
  releases from the Help menu. `PREVIOUS_VERSION_DISABLED = true` guard.

**CI workflows moved to `DELETED/github-workflows-upstream-risk/`** (disables them without
deleting, per this repo's "never delete, move to DELETED" rule):
- `live.yml` — ran on **every push to `main`**, pulled a reusable workflow live from
  `OpenAEC-Foundation/github`, deployed to `open-aec.com`. The worst one.
- `snap.yml` — published to the Snap Store under upstream's listing on `v*` tag push.
- `auto-assign-issues.yml` — auto-assigned new issues to an upstream maintainer's handle.

**Left alone (not the same risk category):** the `pdfium-binaries` curl in CI pulls a
legitimate third-party OSS dependency, not OpenAEC's own infrastructure. The About dialog's
credit link to `github.com/OpenAEC-Foundation/open-pdf-studio` is manual/user-clicked, not
automatic — kept as attribution.

**Still dead code, not removed:** `accounts.rs` is now ~600 lines of guarded-off, unreachable
code. Left in place since nothing calls it; flagged in case the user wants it moved to
`DELETED/` outright later.

### 3. MAPI symbol library — spec, plan, and implementation (Tasks 1–4 of 5)

**Design spec:** `open-pdf-studio/docs/superpowers/specs/2026-09-09-mapi-symbol-library-design.md`
(`02bc667f`). Key findings from that brainstorming session:
- `js/symbols/templates/*.js` (parametric door/window/stairs/rebar/etc.) and
  `js/annotations/stamps.js` (APPROVED/REJECTED/etc.) already cover general drafting symbols —
  **no need to source an external OSS symbol library**, confirmed by a live web search that
  found no clean single option anyway.
- Real content gap was MAPI's own product profiles. Found two source-material locations the
  user pointed to:
  - `C:\Users\barrya\OneDrive - Mullets Aluminum Products, Inc\Desktop\TEMP` — Bluebeam Tool
    Chest files (`.btx`/`.bpx`/`.bhx`/`.blx`). Decoded the format (hex → zlib inflate → plain
    PDF annotation-dictionary syntax) — genuinely easy to parse. `My Tools.btx` turned out to
    be generic personal style presets, not MAPI symbols, but **this proves a "import your
    Bluebeam Tool Chest" feature is feasible** — noted for the Tool Chest sub-project. The
    other `.btx` files in that folder are Bluebeam's own stock content (shipped with their
    license) — correctly NOT used as source material (redistributing a competitor's bundled
    content would be a real problem; MAPI's own `My Tools.btx` is fine, that's their own work).
  - `P:\X-CAD TRANSFER\SOLIDWORKS\Master Weldment Profiles` — **~500 real MAPI aluminum
    product profiles** (`.SLDLFP`), including a `MULLET CUSTOM EXTRUSIONS` folder. This is the
    real content source.
- User decision: for symbols with no MAPI/American equivalent, fall back to the existing
  NEN 1414 building-safety content, relabeled "MAPI" (display only — the internal `NEN1414`
  id string stays untouched, it's read by `ifcCategoryMap.js`/`systeem-symbol-cache.js` for
  IFC classification) and translated from Dutch to English.

**Implementation plan:** `open-pdf-studio/docs/superpowers/plans/2026-09-09-mapi-symbol-library.md`
(`50e4da85`). Five tasks. Verified real API details via web research before writing any code
into the plan (no guessed APIs): `dxf-parser` npm package's actual entity shapes, and the
SolidWorks VBA API (`ProfileFeature` sketch identification, `OpenDoc6`, `EditCopy`/`Paste`/
`SaveAs` DXF export pattern) from real SolidWorks API documentation/examples.

**Execution: user chose to have Codex run the plan, with me validating.**

| Task | Commit | What |
|---|---|---|
| 1 | `bf9444d6` | NEN 1414 → MAPI: 7 category labels + 101 symbol names translated Dutch→English. Internal `nen1414-*` ids untouched. |
| 2 | `4cd11a64` | `scripts/solidworks/ExportWeldmentProfiles.bas` — batch DXF export macro + operator README. **Not yet run.** |
| 3 | `4a935774` | `scripts/mapi-profiles/dxf-to-svg.mjs` — DXF entity (LINE/CIRCLE/ARC/LWPOLYLINE) → SVG converter, `dxf-parser` dependency added. |
| 4 | `43693f82` | `scripts/mapi-profiles/generate.mjs` (folder-of-DXFs → data module) + `js/symbols/data/mapiProfiles.js` (2-category placeholder from test fixtures) + `symbolStore.js` wiring. |
| — | `da0625be` | (Unrelated small ask, done in between) About dialog: added a credit link to `https://cadcolabs.com`, the user's own free CAD/engineering tooling site. |
| fix | `0565cb43` | My validation pass found and fixed a duplicate `'Tn12': 'UPS'` entry Codex introduced while reformatting Task 1 (harmless — same value both times — but redundant). |

**Validation performed on Codex's work** (all passed except the one fix above):
- Re-ran all 13 tests across the 4 task test files myself — pass.
- Ran a real `npx vite build` specifically to check Codex's `import.meta.glob` guard (Vite's
  glob-import is a compile-time macro, not a runtime check — wrapping it wrong could silently
  break asset bundling). Confirmed the NEN1414 PNGs still bundle correctly.
- Confirmed the `NL NEN 1414` string Codex left in `ifcCategoryMap.js` is a Dutch comment, not
  a functional identifier — correctly out of scope for Task 1.
- Confirmed Codex's Windows-compatibility fix to `generate.mjs`'s CLI entry-point check
  (`fileURLToPath`/`path.resolve` instead of raw string concatenation) is correct — the
  plan's original version was genuinely broken on Windows.
- Diffed `ExportWeldmentProfiles.bas` against the plan's verified VBA line-by-line —
  **byte-for-byte identical**, zero transcription drift on code nobody can test until it's
  run.
- My own spec/plan said "108" NEN 1414 entries — that was **my miscount** (a grep that also
  matched the 7 `CATEGORY_META` keys); the real count is 101, and all 101 were correctly
  translated. Nothing is actually missing.

**Not done / blocked:**
- Task 2 Step 2 (manual SolidWorks smoke test) — needs a human.
- Task 4 Step 8 (visual check in the running app) — blocked, `cargo`/Tauri toolchain not
  available in Codex's environment. **Should be done before Task 5**, alongside Task 5's own
  visual check, since it's cheap once someone's looking at the running app anyway.
- Task 5 (the real ~474-file batch run + final data module + commit) — not started, correctly
  left for a human per the plan.

---

## Working notes / traps

- **Never round-trip source files through PowerShell `Get-Content` / `Set-Content`** — mangles
  UTF-8 (em-dashes, emoji). Use editor tools. This repo's new content (e.g. "MAPI — Angle
  Alum" category names) uses em-dashes throughout, so this is a live risk for any tool that
  touches these files via PowerShell.
- **`.gitignore` blocks `*.png`** — new image assets need a `!` negation line.
- **`DELETED/`** is gitignored but `git mv` into it still works (git tracks explicitly
  specified paths regardless of ignore rules) — confirmed working this session for the
  workflow files.
- Retired files go to `DELETED/`, never deleted outright.
- **Pushing needs the CADcoLabs GitHub account** (not the usual-active MulletsAluminum one) —
  see the 2026-09-08 session's notes on switching `gh` accounts around a push. Not needed this
  session since nothing was pushed.
- `git commit -m` with a PowerShell here-string breaks on embedded quotes — write the message
  to a file and use `git commit -F`, or use the Bash tool's heredoc.
- Per `open-pdf-studio/CLAUDE.md`'s Github commit process: version bump, pushing, triggering
  the release-build GitHub Action, and publishing a draft release are **explicitly deferred**
  until the user is ready to ship this and the subsequent sub-projects to MAPI administration
  — none of that has been done, and shouldn't happen automatically.
- `dxf-parser`'s `ARC`/`LWPOLYLINE`-with-bulge angle math is the one piece of this session's
  new code that's genuinely hard to fully verify without eyes on a rendered SVG — Task 3's
  plan built in a manual visual-check step for exactly this reason, and it passed (Codex's
  report: "L-angle was a clean bracket; quarter arc ran from 3 to 12 o'clock"), but worth
  extra attention if a real converted profile ever looks visually wrong.

---

## Verification status

| Check | Result |
|---|---|
| `npx vite build` | ✅ passes, 6.7s, confirmed NEN1414 PNG assets still bundle after the `import.meta.glob` guard |
| All 4 new task test files (13 tests) | ✅ independently re-run, all pass |
| `ExportWeldmentProfiles.bas` vs. plan | ✅ byte-for-byte identical |
| `tauri.conf.json` / `package.json` parse | ✅ valid JSON |
| NEN 1414 → MAPI translation completeness | ✅ all 101 real entries present (my "108" claim was a miscount, corrected) |
| Duplicate-key bug in `nen1414Library.js` | ✅ found and fixed (`0565cb43`) |
| Task 2 SolidWorks smoke test | ❌ not run — needs a human |
| Task 4 in-app visual check | ❌ blocked, no `cargo`/Tauri toolchain in Codex's environment |
| Task 5 (real batch export + final data module) | ❌ not started |
| Full `npx tauri build` | ❌ still not run this fork's lifetime |
| Push to `origin/001` | ❌ 10 commits ahead, not pushed |
| Assistant tested against a live API key | ❌ still not done (carried over from 2026-09-08) |

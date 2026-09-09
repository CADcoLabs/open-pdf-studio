# Design: MAPI product symbol library

Date: 2026-09-09
Status: approved, pending implementation plan
Repository: Open PDF Studio (MAPI Edition)

## Background

MAPI needs OpenPDFStudio-MAPI to be a drop-in replacement for Bluebeam Revu
for drawing review. Part of that is having a usable symbol palette: reviewers
need to drop MAPI's own product symbols (aluminum extrusion profiles) and
general building-drawing symbols (fire safety, egress, etc.) onto markups,
the way they would in Bluebeam.

The app's online symbol library (`symbolLibraryOnlineStore.js`) was disabled
this session because it silently pulled content from
`OpenAEC-Foundation/open-pdf-studio-library` on GitHub — a repo this fork has
no relationship with. This spec covers building MAPI's own replacement
content, entirely local, with no external dependency.

Investigation found two things already built in that are directly reusable:

- `js/symbols/templates/*.js` — a parametric, code-generated drafting-symbol
  system (door, window, stairs, north arrow, rebar, steel profiles, piles,
  grid lines, etc.), tagged `category: 'NEN1414'`. Original code, no
  licensing concern.
- `js/annotations/stamps.js` — standard review stamps (APPROVED, REJECTED,
  DRAFT, FOR REVIEW, REVISED, VOID, CONFIDENTIAL). Already sufficient.
- `js/solid/data/nen1414Library.js` — 108 raster (PNG) fire-safety/building
  symbols (fire alarm panels, smoke detectors, sprinklers, emergency
  lighting, egress) from the Dutch NEN 1414 standard. Content is generically
  useful for any building drawing, but every name is Dutch-only — a
  leftover from before the English-only pass.

What's genuinely missing is MAPI's own product content: aluminum extrusion
profiles, curtain wall/storefront sections, railing/gate parts. That exists
today as a ~500-file SolidWorks weldment-profile library
(`P:\X-CAD TRANSFER\SOLIDWORKS\Master Weldment Profiles`), not as anything
the app can render.

## Goals

- MAPI's real aluminum product profiles (from the SolidWorks weldment
  library) available as symbols in the app's existing Symbol Palette, fully
  offline.
- Where no MAPI/American profile exists for something reviewers need
  (general building/fire-safety symbols), the existing NEN 1414 content
  fills the gap — relabeled and translated so nothing Dutch or
  NEN-branded is visible to a MAPI user.
- Zero network dependency — everything ships bundled in the app, matching
  the "no reach-out to non-CADcoLabs infrastructure" work done earlier this
  session.
- Categories organized so a MAPI reviewer can find what they need without
  knowing the underlying source (SolidWorks folder vs. NEN 1414 vs.
  built-in template).

## Non-goals

- Tool chest (saved/reusable markup tools with default styles) — separate
  spec, next in sequence.
- Markup list/summary report — separate spec, after tool chest.
- Page comparison/overlay — shelved per user decision, not part of this
  rollout.
- Re-implementing or improving the existing NEN 1414 raster symbols'
  artwork — they're reused as-is, only relabeled and translated.
- Parametric behavior for MAPI profiles (adjustable width/angle like the
  door/window templates) — each SolidWorks profile is a fixed named
  catalog item, not a parametric family. Symbols are static SVGs.
- Importing individual users' personal Bluebeam Tool Chest (.btx) files —
  belongs to the Tool Chest spec.

## Source scope

From `P:\X-CAD TRANSFER\SOLIDWORKS\Master Weldment Profiles`:

- **Included:** everything under `ansi inch\` except the `acm clips old\`
  subfolder and `Thumbs.db` files — 474 files across ~48 category folders
  (`MULLET CUSTOM EXTRUSIONS`, `angle alum`, `acm clips`, `railing parts`,
  `gate parts`, vendor-named folders like `azenco USA` and `sundance`,
  etc.). These are profiles MAPI specifies/installs on real projects;
  reused here for internal reference use, not redistribution.
- **Excluded:** `iso\` (20 files, metric — not MAPI's working standard) and
  `acm clips old\` (superseded).

From `js/solid/data/nen1414Library.js`:

- All 108 entries retained as fallback content, with:
  - Display category label changed from "NEN 1414" (or "NEN1414") to
    "MAPI" wherever shown in the Symbol Palette UI.
  - Internal category id (`'NEN1414'` string literal) **left unchanged** —
    it's read by `js/solid/data/ifcCategoryMap.js` for IFC/BIM export
    classification and by `js/annotations/rendering/systeem-symbol-cache.js`
    for caching. Renaming it risks breaking IFC export correctness for a
    purely cosmetic gain; nothing but code ever sees the internal id.
  - All 108 Dutch `NAMES` entries translated to English (e.g.
    `Brandmeldcentrale` → "Fire Alarm Panel", `Rookmelder` → "Smoke
    Detector").

## Proposed pipeline

### 1. SolidWorks export (run once, inside SolidWorks, by a MAPI user)

A VBA macro, since SolidWorks' own macro editor gives reliable, correctly
typed API bindings (external COM automation from outside the process was
tested this session and hit binding issues on some calls — the in-app
macro path is the reliable one). The macro:

- Walks `ansi inch\` recursively, skipping `acm clips old\` and any
  `Thumbs.db`.
- Opens each `.SLDLFP`, locates its profile sketch, exports it to DXF into
  an output tree that mirrors the source folder structure (so category
  grouping in step 3 is a straight folder-name mapping).
- Logs any file it can't open or that has no exportable sketch to a text
  file instead of aborting the batch.
- Output handed back as a folder of DXF files (not committed to the repo
  raw — the SVGs derived from them in step 2 are what ships).

### 2. DXF → SVG conversion (Node script, run in this repo)

- Parses each DXF with an existing open-source DXF-parsing library (to be
  selected during planning — this is the legitimate "borrow OSS tooling"
  step; the library parses a neutral file format, it doesn't embed anyone's
  proprietary content).
- Emits one clean, self-contained SVG per profile: flat line-art, no
  scripts, no external references (matching the existing
  `isSafeSymbolSvg` safety convention used by `symbolLibraryOnline.js`),
  normalized to a consistent viewBox the way the built-in templates are.
- A profile whose DXF fails to parse is logged and skipped, not fatal to
  the batch.
- Category name per profile derived from its parent folder (e.g.
  `ansi inch/angle alum/1 X 1 X .125 ARCH. ANGLE.SLDLFP` →
  category "Angle Alum", symbol name "1 X 1 X .125 Arch. Angle").

### 3. Integration into the app

- New local data module (e.g. `js/symbols/data/mapiProfiles.js`) holding
  the converted SVGs, structured the same way `NEN1414_CATEGORIES` is
  structured today (array of `{ id, name, symbols: [{ id, name, svg }] }`
  groups).
- Registered into `symbolStore.js` alongside `BUILT_IN_CATEGORIES` and
  `NEN1414_CATEGORIES`, so it appears in the existing Symbol Palette UI
  with no new UI code needed.
- `nen1414Library.js`'s `NAMES` map gets its English translations; its
  category display label (wherever `symbolStore.js` / the palette
  component render a category header) changes to "MAPI" — grouped
  alongside, or merged with, the new profile categories so the palette
  reads as one coherent "MAPI" symbol set rather than two unrelated
  sources stitched together.

## Error handling

- SolidWorks macro: per-file try/catch, failures logged with filename and
  reason, batch continues. Never overwrites a source `.SLDLFP`.
- Conversion script: per-file try/catch, same logging pattern; a summary
  count (converted / skipped / failed) printed at the end.
- Neither step is destructive to source data — DXF and SVG outputs are new
  files in new locations.

## Testing

- Spot-check a representative sample of converted SVGs (a few from each
  major category: angle, tube, custom extrusion, vendor part) render
  correctly in the Symbol Palette at a few zoom levels.
- Verify converted symbol counts reconcile against source file counts
  (474 minus logged failures).
- Confirm the IFC export test/mapping (`ifcCategoryMap.js` consumers)
  still passes unchanged, proving the internal `'NEN1414'` id rename
  avoidance was correct.
- Confirm no `NEN1414`/Dutch text remains visible anywhere in the Symbol
  Palette UI after the translation pass.

## Open risks

- Some `.SLDLFP` files may contain multiple sketches or no cleanly
  exportable 2D profile (weldment library parts occasionally include
  reference geometry beyond the cross-section) — the macro's per-file
  logging surfaces these for manual handling rather than silently
  producing wrong artwork.
- DXF-to-SVG conversion quality depends on the chosen parser library's
  handling of arcs/splines in the source sketches — to be validated during
  implementation against a few real exports before running the full batch.

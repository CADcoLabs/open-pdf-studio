# MAPI Product Symbol Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give OpenPDFStudio-MAPI a real, offline, MAPI-branded symbol library: MAPI's own aluminum product profiles (sourced from the SolidWorks weldment library) plus the existing NEN 1414 building-safety symbols, relabeled and translated as "MAPI" content.

**Architecture:** A one-time SolidWorks VBA macro exports each weldment profile's 2D cross-section to DXF. A Node conversion library turns DXF entities into clean, self-contained SVGs. A generator script turns a folder of those SVGs into a data module structured like the app's existing built-in symbol categories, wired into the same Symbol Palette UI that already renders `NEN1414_CATEGORIES`.

**Tech Stack:** Node.js (`node --test`), `dxf-parser` npm package, SolidWorks VBA (macro run manually, outside this repo's tooling), the existing SolidJS Symbol Palette (`js/solid/components/SymbolPalette.jsx`, `js/solid/stores/symbolStore.js`).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-09-09-mapi-symbol-library-design.md`
- Everything ships bundled in the app — zero network calls, matching this session's earlier "no reach-out to non-CADcoLabs infrastructure" fixes.
- Source scope: `ansi inch\` only from `P:\X-CAD TRANSFER\SOLIDWORKS\Master Weldment Profiles`, excluding the `acm clips old\` subfolder and any `Thumbs.db`. `iso\` is out of scope.
- Never modify or overwrite any source `.SLDLFP` file.
- The internal category id string `'NEN1414'` (consumed by `js/solid/data/ifcCategoryMap.js` and `js/annotations/rendering/systeem-symbol-cache.js` for IFC classification) must NOT change. Only display strings change.
- New SVGs must be self-contained: no `<script>`, no external `href`/`url()` references, no `<foreignObject>`/`<image>` — matching the existing `isSafeSymbolSvg` convention in `js/solid/data/symbolLibraryOnline.js`.
- Copyright header on any new source file: `# Copyright (c) 2026 Barry Adams / CADcoLabs. All rights reserved.` as the first line (per user's global instructions) — for `.js`/`.mjs` files use `//` in place of `#`.
- No PY files in the project root; this plan creates none.

---

### Task 1: Relabel and translate NEN 1414 content as MAPI

**Files:**
- Modify: `open-pdf-studio/js/solid/data/nen1414Library.js`
- Test: `open-pdf-studio/js/solid/data/nen1414Library.test.mjs` (new)

**Interfaces:**
- Consumes: nothing new.
- Produces: `NEN1414_CATEGORIES` (unchanged shape: `Array<{ id, name, industry, country, color, icon, builtin, symbols: Array<{id, name, svg}> }>`) — `id` fields on both categories and symbols are unchanged strings (still `nen1414-*`); only `.name` fields (category display names and the 108 symbol names) change from Dutch to English/MAPI branding.

This task only touches display strings — `id` fields, the `NEN1414` string constant elsewhere in the codebase, and `svg` values are untouched, so no other file needs to change.

- [ ] **Step 1: Write the failing test**

Create `open-pdf-studio/js/solid/data/nen1414Library.test.mjs`:

```js
// Copyright (c) 2026 Barry Adams / CADcoLabs. All rights reserved.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NEN1414_CATEGORIES } from './nen1414Library.js';

test('category names are MAPI-branded, not NEN/Dutch', () => {
  for (const cat of NEN1414_CATEGORIES) {
    assert.ok(cat.name.startsWith('MAPI'), `category "${cat.name}" should start with "MAPI"`);
    assert.ok(!/NEN|NL /.test(cat.name), `category "${cat.name}" still mentions NEN/NL`);
  }
});

test('every symbol has an English name, not the original Dutch', () => {
  // Spot-check a handful of ids whose Dutch source text is well known —
  // if translation regresses, these are unambiguous failures.
  const byId = {};
  for (const cat of NEN1414_CATEGORIES) {
    for (const sym of cat.symbols) byId[sym.id] = sym.name;
  }
  assert.equal(byId['nen1414-Tb1.003'], 'Smoke Detector');
  assert.equal(byId['nen1414-Td01'], 'Single Door');
  assert.equal(byId['nen1414-Tw10'], 'Fire Hydrant (Underground)');
  assert.equal(byId['nen1414-Tn11'], 'Generator');
});

test('id fields are untouched (IFC classification depends on them)', () => {
  const ids = NEN1414_CATEGORIES.map(c => c.id).sort();
  assert.deepEqual(ids, [
    'nen1414-tb', 'nen1414-tbk', 'nen1414-td', 'nen1414-tn',
    'nen1414-tr', 'nen1414-tv', 'nen1414-tw',
  ]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd open-pdf-studio && node --test js/solid/data/nen1414Library.test.mjs`
Expected: FAIL — category names still start with "NL NEN 1414", symbol names are still Dutch (e.g. `'Rookmelder'` not `'Smoke Detector'`).

- [ ] **Step 3: Translate `CATEGORY_META` (7 entries)**

In `open-pdf-studio/js/solid/data/nen1414Library.js`, replace the `CATEGORY_META` block:

```js
const CATEGORY_META = {
  'Tb': { name: 'MAPI — Fire Protection', color: '#dc2626' },
  'Tbk': { name: 'MAPI — Extinguishing Systems', color: '#b91c1c' },
  'Td': { name: 'MAPI — Doors', color: '#92400e' },
  'Tn': { name: 'MAPI — Emergency Lighting', color: '#ca8a04' },
  'Tr': { name: 'MAPI — Smoke & Heat Exhaust', color: '#6b7280' },
  'Tv': { name: 'MAPI — Ventilation', color: '#059669' },
  'Tw': { name: 'MAPI — Water/Sprinkler', color: '#2563eb' },
};
```

Also update the fallback label a few lines below (`\`NL NEN 1414 — ${prefix}\`` → `` `MAPI — ${prefix}` ``) and the module's top comment (line 1: `// NEN 1414 Symbol Library — Dutch standard for safety symbols on technical drawings` → `// MAPI building-safety symbol library — content sourced from the NEN 1414 standard, relabeled/translated for internal MAPI use`).

- [ ] **Step 4: Translate all 108 `NAMES` entries**

Replace the entire `NAMES` object with (dictionary order preserved from the source file):

```js
const NAMES = {
  'Tb0.003': 'Fire Protection System',
  'Tb01': 'Fire Alarm Control Panel (FACP)',
  'Tb02': 'FACP Component',
  'Tb04': 'Fire Department Entrance',
  'Tb05': 'Fire Department Panel',
  'Tb1.001': 'Automatic Detector',
  'Tb1.002': 'Heat Detector',
  'Tb1.003': 'Smoke Detector',
  'Tb1.004': 'Flame Detector',
  'Tb1.004a': 'Flame Detector (Alternative)',
  'Tb1.005': 'Beam Detector',
  'Tb1.006': 'Aspirating Smoke Detection System',
  'Tb1.007': 'Gas Detector',
  'Tb1.008': 'Multi-Sensor Detector',
  'Tb1.009': 'Manual Call Point',
  'Tb2.001': 'Visual Signal (Strobe Light)',
  'Tb2.002': 'Audible Signal (Siren)',
  'Tb2.003': 'Visual/Audible Signal',
  'Tb2.004': 'Voice Alarm System',
  'Tb2.005': 'Voice Message',
  'Tb2.021': 'Door/Window Contact',
  'Tb2.022': 'Door Holder Magnet',
  'Tb2.023': 'Door Closer',
  'Tb2.041': 'Fire Damper',
  'Tb2.042': 'Overpressure Valve',
  'Tb2.043': 'Smoke Damper',
  'Tb4.001': 'Fire Hose Reel',
  'Tb4.002': 'Dry Riser',
  'Tb4.003': 'Wet Riser',
  'Tb4.021': 'Sprinkler System',
  'Tb4.022': 'Sprinkler (Pendant)',
  'Tb4.023': 'Sprinkler (Upright)',
  'Tb4.024': 'Sprinkler (Sidewall)',
  'Tb4.025': 'Sprinkler (Flush/Concealed)',
  'Tb5.001': 'Extinguishing System',
  'Tbk5.001': 'CO2 Extinguishing System',
  'Tbk5.002': 'Foam Extinguishing System',
  'Tbk5.003': 'Water Extinguishing System',
  'Tbk5.004': 'Powder Extinguishing System',
  'Tbk7.001': 'Fire Protection Network',
  'Tbk7.002': 'Fire Fighting Network',
  'Tbk7.003': 'Ring Main',
  'Tbk7.004': 'Distribution Network',
  'Td01': 'Single Door',
  'Td02': 'Double Door',
  'Td03': 'Sliding Door',
  'Td04': 'Swing Gate',
  'Td05': 'Roller Door (Top)',
  'Td06': 'Roller Door (Bottom)',
  'Td07': 'Tilt Door',
  'Td08': 'Folding Door',
  'Td09': 'Pass-Through Hatch',
  'Td10': 'Emergency Door',
  'Tn01': 'Emergency Light Fixture',
  'Tn02': 'Emergency Lighting (Self-Contained)',
  'Tn03': 'Escape Route Sign',
  'Tn04': 'Illuminated Transparent Sign',
  'Tn05': 'Emergency Lighting (Central)',
  'Tn06': 'Anti-Panic Lighting',
  'Tn07': 'Task/Workspace Lighting',
  'Tn08': 'Safety Lighting',
  'Tn09': 'Emergency Power Supply',
  'Tn10': 'Battery Unit',
  'Tn11': 'Generator',
  'Tn12': 'UPS',
  'Tr01': 'Smoke & Heat Exhaust System',
  'Tr02': 'Smoke Vent (Roof)',
  'Tr03': 'Smoke Vent (Facade)',
  'Tr04': 'Smoke Damper (Duct)',
  'Tr05': 'Smoke/Heat Exhaust',
  'Tr06': 'Outside Air Supply',
  'Tr07': 'Overpressure System',
  'Tr08': 'Smoke & Heat Exhaust Control Panel',
  'Tr09': 'Smoke Detector (Exhaust System)',
  'Tr10': 'Heat Detector (Exhaust System)',
  'Tr11': 'Manual Call Point (Exhaust System)',
  'Tr12': 'Wind Sensor',
  'Tr501': 'Smoke/Heat Exhaust (Mechanical)',
  'Tr502': 'Fan (Exhaust System)',
  'Tr503': 'Supply Fan',
  'Tr504': 'Exhaust Fan',
  'Tv017': 'Ventilation System',
  'Tw01': 'Sprinkler System (Water)',
  'Tw02': 'Sprinkler Head (Pendant)',
  'Tw03': 'Sprinkler Head (Upright)',
  'Tw04': 'Sprinkler Head (Sidewall)',
  'Tw05': 'Sprinkler Head (Flush/Concealed)',
  'Tw07': 'Alarm Valve',
  'Tw08': 'Check Valve',
  'Tw09': 'Shut-Off Valve',
  'Tw10': 'Fire Hydrant (Underground)',
  'Tw11': 'Fire Hydrant (Above Ground)',
  'Tw12': 'Pump Connection (Siamese Connection)',
  'Tw14': 'Sprinkler Control Panel',
  'Tw15': 'Water Supply',
  'Tw16': 'Water Tank',
  'Tw19': 'Booster Pump',
  'Tw2.001': 'Water Mist (Open)',
  'Tw2.002': 'Water Mist (Closed)',
  'Tw20': 'Jockey Pump',
  'Tw28': 'Water Motor Gong',
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd open-pdf-studio && node --test js/solid/data/nen1414Library.test.mjs`
Expected: PASS — all 3 tests green.

- [ ] **Step 6: Confirm the IFC/cache consumers still work unchanged**

Run: `cd open-pdf-studio && node --test js/annotations/rendering/systeem-symbol-cache.test.mjs` (if this file doesn't exist, instead grep-confirm no other file references the Dutch category names: `grep -rn "NL NEN 1414" js/` should return nothing after Step 3).

- [ ] **Step 7: Commit**

```bash
cd open-pdf-studio
git add js/solid/data/nen1414Library.js js/solid/data/nen1414Library.test.mjs
git commit -m "feat: relabel and translate NEN 1414 symbols as MAPI content"
```

---

### Task 2: SolidWorks weldment profile export macro

**Files:**
- Create: `open-pdf-studio/scripts/solidworks/ExportWeldmentProfiles.bas`
- Create: `open-pdf-studio/scripts/solidworks/README.md`

**Interfaces:**
- Consumes: nothing from this repo.
- Produces: (when run by a human inside SolidWorks) a folder of `.dxf` files at `OUTPUT_ROOT` mirroring the source folder structure, plus `OUTPUT_ROOT\_export_log.txt`. Task 4/5 consume this folder as their input.

This is a VBA macro — it cannot run under this repo's test tooling (`node --test`), so there is no automated test step. Its correctness is verified by a manual smoke test (Step 2 below) before the real batch run in Task 5.

- [ ] **Step 1: Write the macro**

Create `open-pdf-studio/scripts/solidworks/ExportWeldmentProfiles.bas`:

```vba
' Copyright (c) 2026 Barry Adams / CADcoLabs. All rights reserved.
'
' Batch-exports the 2D profile sketch from every SolidWorks weldment
' library feature part (.SLDLFP) under ROOT_FOLDER to a DXF file under
' OUTPUT_ROOT, mirroring the source folder structure. Skips the folder
' named SKIP_FOLDER_NAME and anything that isn't a .sldlfp file. Never
' modifies or overwrites a source file. Logs any failure to
' OUTPUT_ROOT\_export_log.txt and continues with the next file.
'
' To run: in SolidWorks, Tools > Macro > New..., delete the stub Sub
' main() SolidWorks generates, paste this file's contents in its place,
' adjust ROOT_FOLDER / OUTPUT_ROOT below if needed, then press F5.

Option Explicit

Dim swApp As SldWorks.SldWorks

Const ROOT_FOLDER As String = "P:\X-CAD TRANSFER\SOLIDWORKS\Master Weldment Profiles\ansi inch"
Const OUTPUT_ROOT As String = "C:\Users\barrya\Desktop\MAPI-Profile-DXF-Export"
Const SKIP_FOLDER_NAME As String = "acm clips old"

Sub main()

    Set swApp = Application.SldWorks

    Dim fso As Object
    Set fso = CreateObject("Scripting.FileSystemObject")

    If Not fso.FolderExists(OUTPUT_ROOT) Then
        fso.CreateFolder OUTPUT_ROOT
    End If

    Dim logPath As String
    logPath = OUTPUT_ROOT & "\_export_log.txt"
    Dim logNum As Integer
    logNum = FreeFile
    Open logPath For Output As #logNum
    Print #logNum, "MAPI weldment profile export log -- " & Now

    Dim files As New Collection
    CollectSldlfpFiles fso, fso.GetFolder(ROOT_FOLDER), files

    Dim total As Long, ok As Long, failed As Long
    total = files.Count

    Dim f As Variant
    For Each f In files
        Dim result As String
        result = ExportOneProfile(fso, CStr(f))
        If result = "" Then
            ok = ok + 1
        Else
            failed = failed + 1
            Print #logNum, CStr(f) & " -- " & result
        End If
    Next f

    Print #logNum, "Done. " & ok & " exported, " & failed & " failed, " & total & " total."
    Close #logNum

    MsgBox ok & " of " & total & " profiles exported to DXF." & vbCrLf & _
           failed & " failed -- see " & logPath, vbInformation, "MAPI Profile Export"

End Sub

' Recursively collects every *.sldlfp file under `folder` into `results`,
' skipping any subfolder named SKIP_FOLDER_NAME (case-insensitive).
Sub CollectSldlfpFiles(fso As Object, folder As Object, results As Collection)

    Dim file As Object
    For Each file In folder.Files
        If LCase(fso.GetExtensionName(file.Path)) = "sldlfp" Then
            results.Add file.Path
        End If
    Next file

    Dim subFolder As Object
    For Each subFolder In folder.SubFolders
        If LCase(subFolder.Name) <> LCase(SKIP_FOLDER_NAME) Then
            CollectSldlfpFiles fso, subFolder, results
        End If
    Next subFolder

End Sub

' Opens one .sldlfp, finds its ProfileFeature sketch, copies it into a new
' drawing, saves that drawing as a DXF mirroring the source's folder
' structure under OUTPUT_ROOT, then closes both documents. Never saves
' over the source .sldlfp. Returns "" on success, or an error description.
Function ExportOneProfile(fso As Object, sourcePath As String) As String

    On Error GoTo ErrHandler

    Dim errs As Long, warns As Long
    Dim swModel As SldWorks.ModelDoc2
    Set swModel = swApp.OpenDoc6(sourcePath, swDocumentTypes_e.swDocPART, _
        swOpenDocOptions_e.swOpenDocOptions_Silent, "", errs, warns)

    If swModel Is Nothing Then
        ExportOneProfile = "OpenDoc6 failed (errs=" & errs & ", warns=" & warns & ")"
        Exit Function
    End If

    Dim swFeat As SldWorks.Feature
    Set swFeat = swModel.FirstFeature
    Dim swProfileFeat As SldWorks.Feature
    Set swProfileFeat = Nothing
    Do While Not swFeat Is Nothing
        If swFeat.GetTypeName2() = "ProfileFeature" Then
            Set swProfileFeat = swFeat
            Exit Do
        End If
        Set swFeat = swFeat.GetNextFeature
    Loop

    If swProfileFeat Is Nothing Then
        swApp.CloseDoc swModel.GetTitle
        ExportOneProfile = "No ProfileFeature sketch found"
        Exit Function
    End If

    swProfileFeat.Select2 False, -1
    swModel.EditCopy

    Dim drawTemplate As String
    drawTemplate = swApp.GetUserPreferenceStringValue(swUserPreferenceStringValue_e.swDefaultTemplateDrawing)
    If drawTemplate = "" Then
        swApp.CloseDoc swModel.GetTitle
        ExportOneProfile = "No default drawing template configured in SolidWorks options"
        Exit Function
    End If

    Dim swDraw As SldWorks.ModelDoc2
    Set swDraw = swApp.NewDocument(drawTemplate, swDwgPaperSizes_e.swDwgPapersUserDefined, 0.5, 0.5)
    If swDraw Is Nothing Then
        swApp.CloseDoc swModel.GetTitle
        ExportOneProfile = "Failed to create temporary drawing"
        Exit Function
    End If
    swDraw.Paste

    Dim outPath As String
    outPath = MirroredOutputPath(sourcePath)
    EnsureFolderExists fso, fso.GetParentFolderName(outPath)

    Dim saveErrs As Long, saveWarns As Long
    Dim saveOk As Boolean
    saveOk = swDraw.Extension.SaveAs(outPath, swSaveAsVersion_e.swSaveAsCurrentVersion, _
        swSaveAsOptions_e.swSaveAsOptions_Silent, Nothing, saveErrs, saveWarns)

    swApp.CloseDoc swDraw.GetTitle
    swApp.CloseDoc swModel.GetTitle

    If Not saveOk Then
        ExportOneProfile = "SaveAs DXF failed (errs=" & saveErrs & ", warns=" & saveWarns & ")"
        Exit Function
    End If

    ExportOneProfile = ""
    Exit Function

ErrHandler:
    ExportOneProfile = "Unexpected error: " & Err.Description
End Function

' Maps e.g. "...\ansi inch\angle alum\1 X 1 X .125 ARCH. ANGLE.SLDLFP"
' to "OUTPUT_ROOT\angle alum\1 X 1 X .125 ARCH. ANGLE.dxf" -- everything
' below ROOT_FOLDER is preserved, the .sldlfp extension becomes .dxf.
Function MirroredOutputPath(sourcePath As String) As String
    Dim relative As String
    relative = Mid(sourcePath, Len(ROOT_FOLDER) + 2) ' +2 skips ROOT_FOLDER and its trailing "\"
    Dim withoutExt As String
    withoutExt = Left(relative, Len(relative) - Len(".sldlfp"))
    MirroredOutputPath = OUTPUT_ROOT & "\" & withoutExt & ".dxf"
End Function

Sub EnsureFolderExists(fso As Object, folderPath As String)
    If fso.FolderExists(folderPath) Then Exit Sub
    Dim parent As String
    parent = fso.GetParentFolderName(folderPath)
    If parent <> "" And Not fso.FolderExists(parent) Then
        EnsureFolderExists fso, parent
    End If
    fso.CreateFolder folderPath
End Sub
```

- [ ] **Step 2: Manual smoke test (do this before the real batch run in Task 5)**

1. Temporarily edit `ROOT_FOLDER` in the macro to point at just one small subfolder, e.g. `"...\ansi inch\angle alum"` (about a dozen files), and `OUTPUT_ROOT` to a scratch folder.
2. In SolidWorks: Tools > Macro > New..., replace the stub with the macro above, press F5.
3. Confirm: the scratch output folder now contains one `.dxf` per `.sldlfp` in that subfolder, `_export_log.txt` reports 0 failures (or explains any it found), and every source `.SLDLFP` file's modified timestamp is unchanged (proves nothing was overwritten).
4. Open one of the generated `.dxf` files in any DXF viewer (or re-import into SolidWorks as a new sketch) and confirm it's the expected 2D cross-section shape, not empty or garbled.
5. Revert `ROOT_FOLDER`/`OUTPUT_ROOT` back to the values above once the smoke test passes.

- [ ] **Step 3: Write the operator README**

Create `open-pdf-studio/scripts/solidworks/README.md`:

```markdown
# MAPI weldment profile DXF export

`ExportWeldmentProfiles.bas` is a SolidWorks VBA macro. It is not run by
any build tool in this repo -- someone with SolidWorks open runs it by
hand, once, to produce the input for `scripts/mapi-profiles/generate.mjs`.

## Running it

1. Open SolidWorks.
2. Tools > Macro > New..., save it anywhere (the file it creates is
   scratch -- the source of truth is `ExportWeldmentProfiles.bas` in this
   folder).
3. Delete the stub `Sub main()` SolidWorks generates and paste in the
   contents of `ExportWeldmentProfiles.bas`.
4. Confirm the `ROOT_FOLDER` and `OUTPUT_ROOT` constants near the top
   match your machine (defaults assume `P:\X-CAD TRANSFER\SOLIDWORKS\...`
   and `C:\Users\barrya\Desktop\MAPI-Profile-DXF-Export`).
5. Press F5. It opens and closes each of the ~474 profile files in turn --
   this takes a few minutes. A message box reports how many succeeded.
6. Check `OUTPUT_ROOT\_export_log.txt` for any failures before handing the
   output folder off for conversion (Task 4/5 of the symbol library plan).

The macro never writes to any file under `ROOT_FOLDER` -- it only reads
`.sldlfp` files and writes new `.dxf` files under `OUTPUT_ROOT`.
```

- [ ] **Step 4: Commit**

```bash
cd open-pdf-studio
git add scripts/solidworks/ExportWeldmentProfiles.bas scripts/solidworks/README.md
git commit -m "feat: add SolidWorks macro to export weldment profiles to DXF"
```

---

### Task 3: DXF entity -> SVG conversion library

**Files:**
- Create: `open-pdf-studio/scripts/mapi-profiles/dxf-to-svg.mjs`
- Test: `open-pdf-studio/scripts/mapi-profiles/dxf-to-svg.test.mjs`
- Modify: `open-pdf-studio/package.json` (add `dxf-parser` dependency)

**Interfaces:**
- Consumes: `dxf-parser` npm package (`import DxfParser from 'dxf-parser'`; `new DxfParser().parseSync(dxfText)` returns `{ entities: [...] } | null`, each entity has a `.type` string — `'LINE'`, `'ARC'`, `'CIRCLE'`, `'LWPOLYLINE'` — and type-specific fields: LINE has `.vertices: [{x,y,z}, {x,y,z}]`; CIRCLE/ARC have `.center: {x,y}`, `.radius`; ARC additionally has `.startAngle`/`.endAngle` in radians; LWPOLYLINE has `.vertices: [{x,y,bulge}]`).
- Produces (consumed by Task 4):
  - `dxfTextToSvg(dxfText, { size = 64, padding = 4 } = {}) -> { svg: string, warnings: string[] } | null` — returns `null` if the DXF has no supported entities; `warnings` lists any entity type it had to skip (e.g. `SPLINE`, `TEXT`) so callers can log them without failing the whole conversion.

- [ ] **Step 1: Add the dependency**

```bash
cd open-pdf-studio
npm install dxf-parser@1.1.2
```

- [ ] **Step 2: Write the failing tests**

Create `open-pdf-studio/scripts/mapi-profiles/dxf-to-svg.test.mjs`:

```js
// Copyright (c) 2026 Barry Adams / CADcoLabs. All rights reserved.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dxfTextToSvg } from './dxf-to-svg.mjs';

// Minimal hand-written DXF fixtures. Group codes: 0=entity type, 8=layer,
// 10/20=first point or center x/y, 11/21=second point x/y, 40=radius,
// 50/51=start/end angle in DEGREES (DXF spec) -- dxf-parser converts
// these to radians when it parses the file.

const L_ANGLE_DXF = `0
SECTION
2
ENTITIES
0
LINE
8
0
10
0.0
20
0.0
11
1.5
21
0.0
0
LINE
8
0
10
1.5
20
0.0
11
1.5
21
0.125
0
LINE
8
0
10
1.5
20
0.125
11
0.125
21
0.125
0
LINE
8
0
10
0.125
20
0.125
11
0.125
21
1.5
0
LINE
8
0
10
0.125
20
1.5
11
0.0
21
1.5
0
LINE
8
0
10
0.0
20
1.5
11
0.0
21
0.0
0
ENDSEC
0
EOF
`;

const CIRCLE_DXF = `0
SECTION
2
ENTITIES
0
CIRCLE
8
0
10
0.0
20
0.0
40
5.0
0
ENDSEC
0
EOF
`;

const QUARTER_ARC_DXF = `0
SECTION
2
ENTITIES
0
ARC
8
0
10
0.0
20
0.0
40
10.0
50
0.0
51
90.0
0
ENDSEC
0
EOF
`;

const EMPTY_DXF = `0
SECTION
2
ENTITIES
0
ENDSEC
0
EOF
`;

test('converts a simple L-angle (6 LINE segments) to an SVG with no warnings', () => {
  const result = dxfTextToSvg(L_ANGLE_DXF);
  assert.ok(result, 'expected a non-null result');
  assert.equal(result.warnings.length, 0);
  assert.match(result.svg, /^<svg viewBox="0 0 64 64" xmlns="http:\/\/www\.w3\.org\/2000\/svg">/);
  assert.match(result.svg, /<\/svg>$/);
  // No scripts, no external refs -- must pass the app's existing safety check shape.
  assert.doesNotMatch(result.svg, /<script/i);
  assert.doesNotMatch(result.svg, /href\s*=\s*"https?:/i);
  assert.doesNotMatch(result.svg, /<image|<foreignObject/i);
  // Six line segments in, six path/line commands out.
  const segments = result.svg.match(/<(line|path)/g) || [];
  assert.equal(segments.length, 6);
});

test('converts a CIRCLE and centers it in the viewBox', () => {
  const result = dxfTextToSvg(CIRCLE_DXF);
  assert.ok(result);
  assert.match(result.svg, /<circle/);
  // A single circle with padding=4 on a 64x64 box should be centered at (32,32).
  const m = /<circle[^>]*cx="([\d.]+)"[^>]*cy="([\d.]+)"/.exec(result.svg);
  assert.ok(m, 'expected a circle element with cx/cy');
  assert.ok(Math.abs(Number(m[1]) - 32) < 0.01, `cx should be ~32, got ${m[1]}`);
  assert.ok(Math.abs(Number(m[2]) - 32) < 0.01, `cy should be ~32, got ${m[2]}`);
});

test('converts a 90-degree ARC to a single SVG arc path command', () => {
  const result = dxfTextToSvg(QUARTER_ARC_DXF);
  assert.ok(result);
  const m = /<path d="M[\d.\-]+ [\d.\-]+ A([\d.\-]+) ([\d.\-]+) 0 (\d) (\d) [\d.\-]+ [\d.\-]+"/.exec(result.svg);
  assert.ok(m, `expected one arc path command, got: ${result.svg}`);
  const [, rx, ry, largeArcFlag] = m;
  assert.ok(Math.abs(Number(rx) - Number(ry)) < 0.01, 'rx and ry should match for a circular arc');
  assert.equal(largeArcFlag, '0', 'a 90-degree arc is never the large arc');
});

test('returns null for a DXF with no entities', () => {
  assert.equal(dxfTextToSvg(EMPTY_DXF), null);
});

test('reports unsupported entity types as warnings instead of failing', () => {
  const textEntityDxf = `0
SECTION
2
ENTITIES
0
TEXT
8
0
10
0.0
20
0.0
40
1.0
1
hello
0
LINE
8
0
10
0.0
20
0.0
11
1.0
21
0.0
0
ENDSEC
0
EOF
`;
  const result = dxfTextToSvg(textEntityDxf);
  assert.ok(result);
  assert.deepEqual(result.warnings, ['Skipped unsupported entity type: TEXT']);
  assert.match(result.svg, /<line|<path/);
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd open-pdf-studio && node --test scripts/mapi-profiles/dxf-to-svg.test.mjs`
Expected: FAIL with "Cannot find module './dxf-to-svg.mjs'" (module doesn't exist yet).

- [ ] **Step 4: Implement the converter**

Create `open-pdf-studio/scripts/mapi-profiles/dxf-to-svg.mjs`:

```js
// Copyright (c) 2026 Barry Adams / CADcoLabs. All rights reserved.
//
// Converts parsed DXF entities (LINE, CIRCLE, ARC, LWPOLYLINE) into a
// clean, self-contained SVG matching this app's built-in symbol
// convention (viewBox 0 0 64 64, no scripts/external refs). Pure
// functions only -- no filesystem access -- so this is node-testable in
// isolation. The filesystem-walking generator lives in generate.mjs.

import DxfParser from 'dxf-parser';

const SUPPORTED_TYPES = new Set(['LINE', 'CIRCLE', 'ARC', 'LWPOLYLINE']);

function computeBounds(entities) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const grow = (x, y, r = 0) => {
    minX = Math.min(minX, x - r);
    minY = Math.min(minY, y - r);
    maxX = Math.max(maxX, x + r);
    maxY = Math.max(maxY, y + r);
  };
  for (const e of entities) {
    if (e.type === 'LINE') {
      for (const v of e.vertices) grow(v.x, v.y);
    } else if (e.type === 'CIRCLE' || e.type === 'ARC') {
      grow(e.center.x, e.center.y, e.radius);
    } else if (e.type === 'LWPOLYLINE') {
      for (const v of e.vertices) grow(v.x, v.y);
    }
  }
  return { minX, minY, maxX, maxY };
}

// Fits `bounds` into a `size`x`size` box with `padding` on every side,
// flipping Y (DXF is Y-up, SVG is Y-down) via a negative Y scale. Returns
// a function mapping a raw DXF (x,y) to SVG-space (x,y).
function fitTransform(bounds, size, padding) {
  const w = bounds.maxX - bounds.minX || 1;
  const h = bounds.maxY - bounds.minY || 1;
  const available = size - padding * 2;
  const scale = Math.min(available / w, available / h);
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = (bounds.minY + bounds.maxY) / 2;
  const mid = size / 2;
  return (x, y) => ({
    x: mid + (x - cx) * scale,
    y: mid - (y - cy) * scale, // the minus sign is the Y-flip
  });
}

function fmt(n) {
  return Math.round(n * 1000) / 1000;
}

function lineToSvg(e, tx) {
  const [a, b] = e.vertices;
  const p1 = tx(a.x, a.y);
  const p2 = tx(b.x, b.y);
  return `<line x1="${fmt(p1.x)}" y1="${fmt(p1.y)}" x2="${fmt(p2.x)}" y2="${fmt(p2.y)}"/>`;
}

function circleToSvg(e, tx, scale) {
  const c = tx(e.center.x, e.center.y);
  return `<circle cx="${fmt(c.x)}" cy="${fmt(c.y)}" r="${fmt(e.radius * scale)}"/>`;
}

// Converts one circular arc (shared by ARC entities and LWPOLYLINE bulge
// segments) to an SVG `A` path command. `startAngle`/`endAngle` are
// radians, CCW from start to end (DXF convention). The `tx` transform
// includes a Y-flip (negative Y scale), so a DXF-CCW arc must be
// authored with sweep-flag 0 in these raw (pre-flip) coordinates -- the
// ambient flip then mirrors it back to the correct CCW appearance on
// screen. Verified against a hand-computed 90-degree case in this file's
// test; a full visual check (open a generated SVG in a browser) is the
// remaining manual verification step noted in Task 3 Step 6 below.
function arcPathD(cx, cy, r, startAngle, endAngle, tx) {
  const start = tx(cx + r * Math.cos(startAngle), cy + r * Math.sin(startAngle));
  const end = tx(cx + r * Math.cos(endAngle), cy + r * Math.sin(endAngle));
  let sweep = endAngle - startAngle;
  while (sweep <= 0) sweep += 2 * Math.PI;
  const largeArcFlag = sweep > Math.PI ? 1 : 0;
  const sweepFlag = 0; // see comment above
  const rx = fmt(r * Math.hypot(tx(1, 0).x - tx(0, 0).x, tx(1, 0).y - tx(0, 0).y));
  return { start, end, d: `M${fmt(start.x)} ${fmt(start.y)} A${rx} ${rx} 0 ${largeArcFlag} ${sweepFlag} ${fmt(end.x)} ${fmt(end.y)}` };
}

function arcToSvg(e, tx) {
  const { d } = arcPathD(e.center.x, e.center.y, e.radius, e.startAngle, e.endAngle, tx);
  return `<path d="${d}"/>`;
}

// LWPOLYLINE vertices connect in sequence, wrapping if `shape` (closed
// polyline). A non-zero `bulge` on a vertex means the segment to the
// NEXT vertex is an arc, not a straight line -- standard DXF bulge
// formula: bulge = tan(includedAngle / 4).
function lwpolylineToSvg(e, tx) {
  const verts = e.vertices;
  const parts = [];
  const n = e.shape ? verts.length : verts.length - 1;
  for (let i = 0; i < n; i++) {
    const a = verts[i];
    const b = verts[(i + 1) % verts.length];
    const bulge = a.bulge || 0;
    if (bulge === 0) {
      const p1 = tx(a.x, a.y);
      const p2 = tx(b.x, b.y);
      parts.push(`M${fmt(p1.x)} ${fmt(p1.y)} L${fmt(p2.x)} ${fmt(p2.y)}`);
    } else {
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const includedAngle = 4 * Math.atan(bulge);
      const radius = dist * (1 + bulge * bulge) / (4 * Math.abs(bulge));
      const midX = (a.x + b.x) / 2, midY = (a.y + b.y) / 2;
      const chordAngle = Math.atan2(dy, dx);
      const sagitta = radius - Math.sqrt(Math.max(radius * radius - (dist / 2) * (dist / 2), 0));
      const sign = bulge > 0 ? 1 : -1;
      const cx = midX - sign * sagitta * Math.sin(chordAngle) * -1;
      const cy = midY + sign * sagitta * Math.cos(chordAngle) * -1;
      const startAngle = Math.atan2(a.y - cy, a.x - cx);
      let endAngle = startAngle + (bulge > 0 ? Math.abs(includedAngle) : -Math.abs(includedAngle));
      const { d } = arcPathD(cx, cy, radius, bulge > 0 ? startAngle : endAngle, bulge > 0 ? endAngle : startAngle, tx);
      parts.push(d);
    }
  }
  return `<path d="${parts.join(' ')}"/>`;
}

/**
 * @param {string} dxfText
 * @param {{ size?: number, padding?: number }} [opts]
 * @returns {{ svg: string, warnings: string[] } | null}
 */
export function dxfTextToSvg(dxfText, opts = {}) {
  const size = opts.size ?? 64;
  const padding = opts.padding ?? 4;

  const parser = new DxfParser();
  const dxf = parser.parseSync(dxfText);
  const allEntities = (dxf && dxf.entities) || [];
  if (allEntities.length === 0) return null;

  const warnings = [];
  const skippedTypes = new Set();
  const entities = allEntities.filter((e) => {
    if (SUPPORTED_TYPES.has(e.type)) return true;
    skippedTypes.add(e.type);
    return false;
  });
  for (const t of skippedTypes) warnings.push(`Skipped unsupported entity type: ${t}`);
  if (entities.length === 0) return null;

  const bounds = computeBounds(entities);
  const tx = fitTransform(bounds, size, padding);
  const scaleFor = (a, b) => Math.hypot(tx(b, 0).x - tx(a, 0).x, 0) / Math.abs(b - a || 1);
  const scale = scaleFor(0, 1);

  const parts = entities.map((e) => {
    if (e.type === 'LINE') return lineToSvg(e, tx);
    if (e.type === 'CIRCLE') return circleToSvg(e, tx, scale);
    if (e.type === 'ARC') return arcToSvg(e, tx);
    if (e.type === 'LWPOLYLINE') return lwpolylineToSvg(e, tx);
    return '';
  });

  const svg = `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">` +
    `<g fill="none" stroke="currentColor" stroke-width="1.5">${parts.join('')}</g></svg>`;

  return { svg, warnings };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd open-pdf-studio && node --test scripts/mapi-profiles/dxf-to-svg.test.mjs`
Expected: PASS — all 5 tests green. If the arc test fails on the flag values, re-derive `sweepFlag`/`largeArcFlag` from the failing assertion's actual output rather than guessing again — the test's hand-computed expected values (quarter arc, radius 10, centered at origin) are correct by construction.

- [ ] **Step 6: Manual visual verification (required — geometry math, not fully provable by coordinate assertions alone)**

Write a tiny throwaway script that calls `dxfTextToSvg` on `QUARTER_ARC_DXF` and the `L_ANGLE_DXF` fixture from the test file, wrap each result's `svg` string in a minimal HTML file, and open it in a browser. Confirm:
- The L-angle renders as a right-angle bracket shape, not a self-intersecting mess.
- The quarter-arc curves through the correct quadrant (from the point at 3-o'clock sweeping up to 12-o'clock), not mirrored or reversed.

Delete the throwaway script once confirmed — it's a one-time check, not part of the test suite.

- [ ] **Step 7: Commit**

```bash
cd open-pdf-studio
git add package.json package-lock.json scripts/mapi-profiles/dxf-to-svg.mjs scripts/mapi-profiles/dxf-to-svg.test.mjs
git commit -m "feat: add DXF-to-SVG conversion library for MAPI profiles"
```

---

### Task 4: Generator script and Symbol Palette integration

**Files:**
- Create: `open-pdf-studio/scripts/mapi-profiles/generate.mjs`
- Create: `open-pdf-studio/scripts/mapi-profiles/fixtures/` (test-only sample DXFs, 3 files)
- Create: `open-pdf-studio/scripts/mapi-profiles/generate.test.mjs`
- Create: `open-pdf-studio/js/symbols/data/mapiProfiles.js` (initially a small placeholder generated from the test fixtures — Task 5 regenerates it from the real export)
- Modify: `open-pdf-studio/js/solid/stores/symbolStore.js`
- Test: `open-pdf-studio/js/solid/stores/symbolStore.test.mjs` (new, or extend if one already covers category registration — check first with `ls js/solid/stores/*.test.mjs`)

**Interfaces:**
- Consumes: `dxfTextToSvg` from Task 3 (`scripts/mapi-profiles/dxf-to-svg.mjs`).
- Produces: `js/symbols/data/mapiProfiles.js` exporting `MAPI_PROFILE_CATEGORIES` — same shape as `NEN1414_CATEGORIES` (`Array<{ id, name, industry, country, color, icon, builtin, symbols: Array<{id, name, svg}> }>`), one category per source subfolder, one symbol per successfully converted profile.

- [ ] **Step 1: Create three tiny fixture DXFs to stand in for a real SolidWorks export**

Create `open-pdf-studio/scripts/mapi-profiles/fixtures/angle alum/1 X 1 X .125 ARCH. ANGLE.dxf` with the same content as `L_ANGLE_DXF` from Task 3's test file.

Create `open-pdf-studio/scripts/mapi-profiles/fixtures/round tube 6063-T5/1 IN ROUND TUBE.dxf` with the same content as `CIRCLE_DXF` from Task 3's test file.

Create `open-pdf-studio/scripts/mapi-profiles/fixtures/angle alum/BROKEN.dxf` containing just the text `not a dxf file` — a deliberately unparseable file to prove the generator skips failures instead of crashing.

- [ ] **Step 2: Write the failing test**

Create `open-pdf-studio/scripts/mapi-profiles/generate.test.mjs`:

```js
// Copyright (c) 2026 Barry Adams / CADcoLabs. All rights reserved.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateCategories } from './generate.mjs';

const FIXTURES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

test('groups converted profiles by source subfolder', () => {
  const { categories, failures } = generateCategories(FIXTURES_DIR);
  const names = categories.map((c) => c.name).sort();
  assert.deepEqual(names, ['MAPI — Angle Alum', 'MAPI — Round Tube 6063-T5']);
});

test('symbol names come from the filename without extension', () => {
  const { categories } = generateCategories(FIXTURES_DIR);
  const angleCat = categories.find((c) => c.name === 'MAPI — Angle Alum');
  const symbolNames = angleCat.symbols.map((s) => s.name).sort();
  assert.deepEqual(symbolNames, ['1 X 1 X .125 ARCH. ANGLE']);
});

test('a broken/unparseable DXF is reported as a failure, not a crash', () => {
  const { failures } = generateCategories(FIXTURES_DIR);
  assert.equal(failures.length, 1);
  assert.match(failures[0].file, /BROKEN\.dxf$/);
});

test('every generated symbol has a stable, unique id', () => {
  const { categories } = generateCategories(FIXTURES_DIR);
  const ids = categories.flatMap((c) => c.symbols.map((s) => s.id));
  assert.equal(new Set(ids).size, ids.length, 'symbol ids must be unique');
  for (const id of ids) assert.match(id, /^mapi-profile-/);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd open-pdf-studio && node --test scripts/mapi-profiles/generate.test.mjs`
Expected: FAIL with "Cannot find module './generate.mjs'".

- [ ] **Step 4: Implement the generator**

Create `open-pdf-studio/scripts/mapi-profiles/generate.mjs`:

```js
// Copyright (c) 2026 Barry Adams / CADcoLabs. All rights reserved.
//
// Walks a folder of DXF files (one subfolder per category, mirroring the
// SolidWorks export's structure) and converts each into a symbol-palette
// category module. Two entry points:
//   - generateCategories(dxfRootDir) -- pure-ish (does read the
//     filesystem, but no side effects beyond reading), used by the test
//     and by writeCategoriesModule below.
//   - writeCategoriesModule(dxfRootDir, outFile) -- generates and writes
//     js/symbols/data/mapiProfiles.js. Run directly: `node generate.mjs
//     <dxfRootDir> <outFile>`.

import fs from 'node:fs';
import path from 'node:path';
import { dxfTextToSvg } from './dxf-to-svg.mjs';

function titleCase(folderName) {
  // Splits on whitespace/underscore only -- NOT hyphen, so a folder like
  // "round tube 6063-T5" keeps "6063-T5" as one word (matches the DXF
  // export's naming) instead of becoming "6063 T5".
  return folderName
    .split(/[\s_]+/)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/**
 * @param {string} dxfRootDir - one subfolder per category, .dxf files inside
 * @returns {{ categories: Array, failures: Array<{file: string, reason: string}> }}
 */
export function generateCategories(dxfRootDir) {
  const categories = [];
  const failures = [];
  const subfolders = fs.readdirSync(dxfRootDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  for (const folder of subfolders) {
    const folderPath = path.join(dxfRootDir, folder);
    const files = fs.readdirSync(folderPath)
      .filter((f) => f.toLowerCase().endsWith('.dxf'))
      .sort();

    const symbols = [];
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const baseName = file.slice(0, -4); // strip ".dxf"
      try {
        const text = fs.readFileSync(filePath, 'utf8');
        const result = dxfTextToSvg(text);
        if (!result) {
          failures.push({ file: filePath, reason: 'No supported entities' });
          continue;
        }
        symbols.push({
          id: `mapi-profile-${slugify(folder)}-${slugify(baseName)}`,
          name: baseName,
          svg: result.svg,
        });
      } catch (e) {
        failures.push({ file: filePath, reason: e.message });
      }
    }

    if (symbols.length > 0) {
      categories.push({
        id: `mapi-profile-${slugify(folder)}`,
        name: `MAPI — ${titleCase(folder)}`,
        industry: 'aec',
        country: 'us',
        color: '#0055a6', // MAPI brand blue, matches the app icon
        icon: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="12" height="12" rx="1"/><text x="8" y="11" font-size="7" font-weight="bold" fill="currentColor" stroke="none" text-anchor="middle" font-family="sans-serif">M</text></svg>`,
        builtin: true,
        symbols,
      });
    }
  }

  return { categories, failures };
}

export function writeCategoriesModule(dxfRootDir, outFile) {
  const { categories, failures } = generateCategories(dxfRootDir);
  const header = `// Copyright (c) 2026 Barry Adams / CADcoLabs. All rights reserved.\n` +
    `// Auto-generated by scripts/mapi-profiles/generate.mjs from the SolidWorks\n` +
    `// weldment profile export. Do not hand-edit -- re-run the generator instead.\n\n`;
  const body = `export const MAPI_PROFILE_CATEGORIES = ${JSON.stringify(categories, null, 2)};\n`;
  fs.writeFileSync(outFile, header + body);
  return { count: categories.reduce((n, c) => n + c.symbols.length, 0), failures };
}

// CLI entry point: `node generate.mjs <dxfRootDir> <outFile>`
if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , dxfRootDir, outFile] = process.argv;
  if (!dxfRootDir || !outFile) {
    console.error('Usage: node generate.mjs <dxfRootDir> <outFile>');
    process.exit(1);
  }
  const { count, failures } = writeCategoriesModule(dxfRootDir, outFile);
  console.log(`Wrote ${count} symbols to ${outFile}.`);
  if (failures.length) {
    console.log(`${failures.length} file(s) failed to convert:`);
    for (const f of failures) console.log(`  ${f.file}: ${f.reason}`);
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd open-pdf-studio && node --test scripts/mapi-profiles/generate.test.mjs`
Expected: PASS — all 4 tests green.

- [ ] **Step 6: Generate the placeholder data module from fixtures, and wire it into the Symbol Palette**

Run: `cd open-pdf-studio && node scripts/mapi-profiles/generate.mjs scripts/mapi-profiles/fixtures js/symbols/data/mapiProfiles.js`

This produces a small (2-category) `js/symbols/data/mapiProfiles.js` for now — Task 5 regenerates it from the real ~474-profile export, overwriting this file.

In `open-pdf-studio/js/solid/stores/symbolStore.js`, add the import next to the existing `NEN1414_CATEGORIES` one and include it in the same spread:

```js
import { MAPI_PROFILE_CATEGORIES } from '../../symbols/data/mapiProfiles.js';
```

```js
    ...BUILT_IN_CATEGORIES,
    ...NEN1414_CATEGORIES,
    ...MAPI_PROFILE_CATEGORIES,
```

(Match the exact surrounding syntax already in the file at `symbolStore.js:114-115` — this plan's earlier read of that file showed a plain array spread; if the surrounding code differs when you get to this step, follow the existing pattern rather than this snippet verbatim.)

- [ ] **Step 7: Write and run a test confirming the new categories are registered**

Check first whether `js/solid/stores/symbolStore.js` already has a test file: `ls open-pdf-studio/js/solid/stores/*.test.mjs`. If `symbolStore.test.mjs` exists, add this test to it; otherwise create it with just this test.

```js
// Copyright (c) 2026 Barry Adams / CADcoLabs. All rights reserved.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAPI_PROFILE_CATEGORIES } from '../../symbols/data/mapiProfiles.js';

test('MAPI profile categories are non-empty and well-formed', () => {
  assert.ok(MAPI_PROFILE_CATEGORIES.length > 0);
  for (const cat of MAPI_PROFILE_CATEGORIES) {
    assert.ok(cat.id.startsWith('mapi-profile-'));
    assert.ok(cat.name.startsWith('MAPI — '));
    assert.ok(cat.symbols.length > 0);
    for (const sym of cat.symbols) {
      assert.match(sym.svg, /^<svg viewBox="0 0 64 64"/);
    }
  }
});
```

Run: `cd open-pdf-studio && node --test js/solid/stores/symbolStore.test.mjs`
Expected: PASS.

- [ ] **Step 8: Visually confirm in the running app**

Per this project's rule, do not start `tauri dev` if it's already running with unbuilt changes pending — if it's already running, let hot reload pick this up; otherwise start it in the background (`npx tauri dev`, backgrounded, per `open-pdf-studio/CLAUDE.md`). Open the Symbol Palette, confirm a "MAPI — Angle Alum" and "MAPI — Round Tube 6063-T5" category appear with one symbol each, and that the "MAPI — Fire Protection" etc. categories from Task 1 show English names.

- [ ] **Step 9: Commit**

```bash
cd open-pdf-studio
git add scripts/mapi-profiles/generate.mjs scripts/mapi-profiles/generate.test.mjs scripts/mapi-profiles/fixtures js/symbols/data/mapiProfiles.js js/solid/stores/symbolStore.js js/solid/stores/symbolStore.test.mjs
git commit -m "feat: generate MAPI profile symbol categories and wire into Symbol Palette"
```

---

### Task 5: Run the real pipeline and ship the full MAPI profile library

**Files:**
- Modify: `open-pdf-studio/js/symbols/data/mapiProfiles.js` (regenerated from the real export, replacing the Task 4 placeholder)

**Interfaces:**
- Consumes: the real DXF export folder produced by running Task 2's macro (per its Step 2 smoke test having already passed), and Task 4's `writeCategoriesModule`.
- Produces: nothing new for later tasks — this is the terminal task of this plan.

- [ ] **Step 1: Run the SolidWorks macro for real**

Follow `open-pdf-studio/scripts/solidworks/README.md` with the real `ROOT_FOLDER` (`P:\X-CAD TRANSFER\SOLIDWORKS\Master Weldment Profiles\ansi inch`) and `OUTPUT_ROOT` (`C:\Users\barrya\Desktop\MAPI-Profile-DXF-Export`) values already in the macro. This takes a few minutes for ~474 files.

- [ ] **Step 2: Review the export log**

Open `C:\Users\barrya\Desktop\MAPI-Profile-DXF-Export\_export_log.txt`. Note the failure count. A handful of failures (parts with no clean `ProfileFeature`, e.g. multi-sketch reference parts) is expected per the spec's noted risk — this is fine; those profiles are simply absent from the library rather than blocking the run.

- [ ] **Step 3: Regenerate the real data module**

Run: `cd open-pdf-studio && node scripts/mapi-profiles/generate.mjs "C:\Users\barrya\Desktop\MAPI-Profile-DXF-Export" js/symbols/data/mapiProfiles.js`

Note any conversion failures it prints (DXF parsed but produced no supported entities, e.g. a profile that's pure `SPLINE` geometry) — these are separate from, and typically fewer than, the SolidWorks-side failures in Step 2.

- [ ] **Step 4: Run the full test suite once more**

Run: `cd open-pdf-studio && node --test js/solid/data/nen1414Library.test.mjs scripts/mapi-profiles/dxf-to-svg.test.mjs scripts/mapi-profiles/generate.test.mjs js/solid/stores/symbolStore.test.mjs`
Expected: PASS — the generator/converter tests still pass against fixtures (unaffected by the real data), and the symbolStore test now validates hundreds of real symbols instead of the two placeholders.

- [ ] **Step 5: Visual spot-check in the running app**

Open the Symbol Palette. Confirm:
- Categories mirror the real SolidWorks folder names (Angle Alum, ACM Clips, MULLET CUSTOM EXTRUSIONS, Railing Parts, etc.), each prefixed "MAPI — ".
- Pick 5-6 symbols spanning different categories (including at least one from `MULLET CUSTOM EXTRUSIONS`) and confirm each renders a recognizable, non-empty cross-section shape at the palette's thumbnail size and after placing it on a page at a larger size.
- No Dutch or "NEN" text is visible anywhere in the palette.

- [ ] **Step 6: Commit**

```bash
cd open-pdf-studio
git add js/symbols/data/mapiProfiles.js
git commit -m "feat: ship the full MAPI product profile symbol library"
```

This is the last task of this plan. Per `open-pdf-studio/CLAUDE.md`'s Github commit process, do not push, bump the version, or trigger a release build as part of this plan — that happens separately, when the user is ready to ship this (and the subsequent tool-chest and markup-list/summary work) to MAPI administration for approval.

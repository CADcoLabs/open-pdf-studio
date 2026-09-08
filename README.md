<h1 align="center">Open PDF Studio — MAPI Edition</h1>

<p align="center">
  <strong>Internal PDF markup, measurement, and takeoff tool for Mullets Aluminum Products, Inc.</strong>
</p>

<p align="center">
  <a href="LICENSE.md"><img src="https://img.shields.io/badge/license-LGPL--3.0-blue?style=flat-square" alt="License"></a>
  <img src="https://img.shields.io/badge/status-internal%20development-orange?style=flat-square" alt="Internal development">
  <img src="https://img.shields.io/badge/upstream-detached-lightgrey?style=flat-square" alt="Detached fork">
</p>

---

## About this repository

This is a **private, detached fork** maintained by CADcoLabs for **Mullets Aluminum Products, Inc. (MAPI)**.
It exists so we can develop, customize, and break things freely without any effect on the upstream project.

**This repository is not connected to upstream.** It has no upstream git remote, does not send pull
requests upstream, does not report issues upstream, and does not consume upstream's release or update
channels. Nothing done here reaches OpenAEC-Foundation. Do not file MAPI-specific issues upstream.

### Attribution

Open PDF Studio was created and is actively developed by the
**[OpenAEC Foundation](https://github.com/OpenAEC-Foundation/open-pdf-studio)**. All credit for the
original application — its architecture, rendering pipeline, annotation engine, measurement tools, and
the enormous amount of work behind them — belongs to that project and its contributors.

This fork adds MAPI-specific branding, tooling, and deployment packaging on top of their work. It is a
derivative work distributed under the same license. If you want the real, maintained, community version
of Open PDF Studio, get it from
[OpenAEC-Foundation/open-pdf-studio](https://github.com/OpenAEC-Foundation/open-pdf-studio) — not here.

---

## Goal

Provide MAPI personnel with a free, installable, no-subscription replacement for Bluebeam Revu covering
the work we actually do: **drawing markup, calibrated measurement, and material takeoff.**

We do not use Studio Sessions and are not trying to replicate them. If shared review ever becomes a
requirement, we will solve it our own way.

### Planned MAPI customizations

- Company branding — logo, splash, About dialog, application identity
- Bundled OCR so scanned drawings are searchable out of the box
- A MAPI tool chest of saved, reusable markup tools and standard annotations
- MAPI symbol libraries for our products and details
- Company standard stamps, title blocks, and page templates
- A single signed Windows installer for internal deployment

---

<p align="center">
  <img src="docs/screenshots/pdf-compare.jpg" alt="Side-by-side PDF compare with change list" width="100%">
</p>

<p align="center">
  <img src="docs/screenshots/drawing-tools.jpg" alt="CAD-style drawing, measurement, and markup tools on an architectural elevation" width="100%">
</p>

## Features

### Annotations & Markup (20+ Tools)
- **Text markup:** Highlight, underline, strikethrough
- **Shapes:** Rectangle, ellipse, polygon, cloud, cloud polyline, line, arrow, polyline
- **Hatch fill patterns:** Cross-hatch, diagonal, dots, and more for shape fills
- **Freehand drawing:** Pen tool with configurable color, width, and opacity
- **Text annotations:** Text box, callout with leader line, sticky notes with popup editing
- **Stamps:** 10 built-in stamps (Approved, Rejected, Draft, Confidential, Final, etc.)
- **Images:** Insert from file, paste from clipboard, or drag-and-drop, with non-destructive cropping
- **Signatures:** Draw multi-stroke signatures, save up to 5 for quick reuse
- **Redaction:** Mark areas and apply to permanently remove content

### Measurement Tools
- Distance, area, and perimeter measurement
- Scale calibration dialog with mm, cm, m, inches, feet, and points
- Per-line scale override, with fallback to the document scale
- Quick scale: right-click a dimension line and type a value (e.g. "12.3m") to recalibrate
- Draggable dimension text and endpoints with live recalculation
- Object snapping to endpoints, midpoints, centers, and edges
- Angle snapping with configurable increments

### PDF Compare
- Compare two PDF revisions in a dedicated compare tab, without leaving your workspace
- Side-by-side and overlay view modes with synchronized scrolling, panning, and zoom
- Automatic change detection classifies differences as added, removed, or modified
- Filterable change list with counts; click a change to jump straight to it
- Manual alignment offset (dx, dy, rotation) to line up drawings that shifted between revisions
- Page-pair navigation for multi-page documents

### Symbol Palettes
- Drag-and-drop symbol libraries onto the page for repetitive markup
- Searchable, collapsible categories; enable or disable groups per project
- Create custom symbol groups saved with your preferences
- Dockable to either side of the canvas or floated freely

### Quantities & Object Counting
- Count tool with named tally categories for on-drawing object counting (takeoff)
- Live quantities schedule that aggregates counts, lengths, and areas
- Grouping, sorting, filtering, subtotals, and grand totals
- CSV export of the schedule
- Configurable columns, formatting, and table appearance
- Place the generated schedule back onto the page as a table

### Screenshot
- Capture full page or a selected region as an image
- Copy to clipboard or save to file

### Crop Margins
- Auto-detect and trim whitespace around page content

### Text Editing
- Edit existing PDF text content inline
- Add new text annotations with font, size, and color control

### Page Management
- Insert blank pages (standard or custom sizes)
- Delete, extract, and replace pages
- Reorder pages via drag-and-drop thumbnails
- Merge multiple PDFs into one
- Page rotation (90/180/270 degrees)

### Watermarks & Headers/Footers
- Text and image watermarks with opacity, rotation, and position control
- Headers and footers with variables (`{page}`, `{pages}`, `{date}`, `{time}`, `{filename}`)
- Apply to all pages or specific ranges

### Forms
- Fill interactive PDF forms (AcroForms and XFA)
- Create text fields, checkboxes, and radio buttons
- JavaScript validation support

### Printing
- Full print dialog with live preview
- Page range, subset (odd/even), reverse order, copies, and collation
- Scaling: fit to page, actual size, or custom percentage
- Print content: document only, markups only, or both
- Print as image option
- Virtual printer installation (Windows)

### Export
- Export pages as PNG or JPEG (72, 150, 300, 600 DPI)
- Export as raster PDF
- Export/import annotations as XFDF

### Find & Search
- Text search with match case and whole word options
- Highlight all matches with result count
- Navigate results with F3

### Format & Styles
- 12 pre-defined style gallery for quick annotation styling
- Fill color, stroke color, line width, opacity, and border style
- Blend modes for annotation compositing
- Per-annotation-type default styles

### Multi-Select & Alignment
- Select multiple annotations with rubber band or Ctrl+Click
- Shared property editing across selected annotations
- 6-point alignment (left, center, right, top, middle, bottom)
- Horizontal and vertical distribution
- Match size (width, height, or both)
- Flip horizontal/vertical and rotate selected annotations
- Z-order control (bring to front/back, forward/backward)

### Object Snapping
- Snap to endpoints, midpoints, centers, and edges
- Snap to in-progress vertices while drawing polylines and measurements
- Configurable snap radius (3-30px)
- Angle snapping (1-90 degree increments)
- Optional grid overlay with grid snapping

### Tool Palette
- Floating or dockable toolbar with all annotation tools
- Dock to left or right side of the canvas
- Quick access without switching ribbon tabs

### PDF Viewing & Navigation
- High-quality native rendering via a multi-process PDFium worker pool — off the UI thread and crash-isolated, so a bad page never freezes or takes down the app
- Progressive tile rendering for very large CAD drawings: the page and its thumbnails fill in tile-by-tile across the worker pool instead of a seconds-long blank wait
- View modes: single page, continuous scroll, and book (two-page spread, page 1 on the right)
- Zoom: fit page, fit width, actual size, custom percentage, and cursor-anchored mouse-wheel zoom
- Page navigation: first, previous, next, last, go to page
- PDF/A compliance detection with read-only enforcement
- Digital signature validation panel

### Left Panel (10 Tabs)
Thumbnails, Bookmarks, Annotations, Attachments, Digital Signatures, Layers, Form Fields, Named Destinations, Links, Tags

### Bookmarks
- Create, edit, and delete bookmarks
- Hierarchical tree with expand/collapse
- Custom colors and text styling (bold, italic)

### Document Management
- Multi-tab interface for multiple PDFs
- Session save/restore (named workspace snapshots)
- Open PDF from URL
- Bookmarked folder places for quick file access
- Recent files with pin/unpin
- Unsaved changes detection with save prompt
- Document properties dialog
- File locking to prevent external writes

### Ribbon Interface
- Primary tabs: Home, Comment, Drawing, View, Organize, Help
- Contextual tabs: Format and Arrange appear automatically when annotations are selected

### Customization
- **5 themes:** Dark, Light, Blue, High Contrast, System (auto-detect)
- **39 languages** including RTL support

### Undo/Redo
- Up to 100 levels per document
- Covers annotations, page operations, watermarks, and text edits

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New document |
| `Ctrl+O` | Open file |
| `Ctrl+S` | Save |
| `Ctrl+Shift+S` | Save As |
| `Ctrl+P` | Print |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `Ctrl+F` | Find |
| `F3` | Find next |
| `Ctrl+A` | Select all annotations on page |
| `Ctrl+C` / `Ctrl+V` | Copy / Paste annotations |
| `Delete` | Delete selected annotation(s) |
| `Ctrl+D` | Document properties |
| `Ctrl+W` | Close active tab |
| `V` | Select tool |
| `H` | Hand tool |
| `T` | Text box tool |
| `N` | Sticky note tool |
| `Ctrl+=` / `Ctrl+-` | Zoom in / Zoom out |
| `Ctrl+0` | Actual size |
| `Ctrl+1` | Fit width |
| `Ctrl+2` | Fit page |
| `F9` | Toggle navigation panel |
| `F11` | Toggle annotations list |
| `F12` | Toggle properties panel |
| `F1` | Keyboard shortcuts |
| `Arrow keys` | Nudge annotation (1px, Shift for 10px) |
| `Enter` | Complete area/perimeter measurement |

## Installation

There are no public releases of this fork. MAPI builds are produced internally and distributed by
CADcoLabs. Until the internal installer exists, build from source.

## Building from Source

### Prerequisites
- [Node.js](https://nodejs.org/) 20+
- [Rust](https://www.rust-lang.org/tools/install) (stable)
- [CMake](https://cmake.org/download/) and a C/C++ toolchain
- System dependencies:
  - **Windows:** Visual Studio Build Tools with C++ workload
  - **Linux:** `libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf`
  - **macOS:** Xcode Command Line Tools

### Build

```bash
cd open-pdf-studio
npm ci
npx tauri build
```

Build artifacts are written to the workspace-level `target/release/bundle/` directory.

### Development

```bash
cd open-pdf-studio
npm ci
npx tauri dev
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop framework | [Tauri 2](https://tauri.app/) (Rust backend) |
| UI framework | [SolidJS](https://www.solidjs.com/) |
| Build tool | [Vite](https://vitejs.dev/) |
| Page rendering | Multi-process [PDFium](https://pdfium.googlesource.com/pdfium/) worker pool, with progressive tiling for large drawings |
| Text layer & structure | [PDF.js](https://mozilla.github.io/pdf.js/) |
| PDF manipulation | [pdf-lib](https://pdf-lib.js.org/) |

## Contributing

This is an internal MAPI repository. Contributions, issues, and pull requests are handled internally by
CADcoLabs.

If you have an improvement that is **not MAPI-specific** and would benefit everyone, please contribute it
to the upstream project at
[OpenAEC-Foundation/open-pdf-studio](https://github.com/OpenAEC-Foundation/open-pdf-studio) instead. Their
guidance is that a clear, well-described issue is usually more valuable than a pull request, and that
content contributions — symbol libraries, hatch patterns — are especially welcome.

## License

Open PDF Studio is licensed under the [GNU Lesser General Public License v3.0](LICENSE.md), and this fork
is distributed under the same license. Original copyright remains with the OpenAEC Foundation and the
Open PDF Studio contributors. MAPI-specific additions are copyright © 2026 Barry Adams / CADcoLabs and
are likewise released under the LGPL-3.0.

PDF.js is licensed under the Apache License 2.0. pdf-lib is licensed under the MIT License. PDFium is
licensed under the BSD 3-Clause License.

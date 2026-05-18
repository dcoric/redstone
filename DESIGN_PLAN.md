# Redstone — Google Stitch Design Plan

> **For Stitch “Start with your design”:** upload or paste [`DESIGN.md`](DESIGN.md) (open-standard spec + all screens). Use this file for extended per-screen prompts and workflow notes.

This document supplements [`DESIGN.md`](DESIGN.md) with copy-paste prompts, screen IDs, and the states Stitch should render.

**Product:** Redstone — Obsidian-like knowledge management (markdown notes, folders, tags, wiki links, graph view, multi-device sync).

**Platforms:** Web (Next.js, desktop-first) and Mobile (Expo React Native, iOS/Android).

**Implementation reference:** `apps/web/app/**`, `apps/mobile/app/**`, `PLAN.md`.

---

## How to use with Google Stitch

### Recommended workflow

1. **Create a Stitch project** named `Redstone`.
2. **Paste the [Master context](#master-context-paste-once)** into the project instructions (or first message).
3. **Paste the [Design system](#design-system-paste-once)** as a shared style reference.
4. **Generate one screen per prompt** using the screen IDs below (e.g. `web-home-default`). Keep IDs consistent for later export/handoff.
5. **Generate state variants** where listed (empty, loading, error, overlay open).
6. **Review for consistency** against the design system (colors, spacing, components).
7. Export assets/specs for engineering handoff.

### Stitch output checklist

For each screen ID, deliver:

- [ ] Default state (happy path with realistic sample data)
- [ ] Empty state (where applicable)
- [ ] Loading state (skeleton or spinner)
- [ ] Error state (inline or banner)
- [ ] Interactive overlays (dialogs, dropdowns, panels) as separate frames or variants
- [ ] Desktop **1440×900** for web; mobile **390×844** (iPhone 14) with safe areas

---

## Master context (paste once)

> **Project:** Redstone — a knowledge management app for storing, editing, and syncing markdown notes across web and mobile. Think Obsidian meets a clean writing tool.
>
> **Audience:** Knowledge workers, developers, and note-takers who want folders, tags, wiki links, and a graph of connections.
>
> **Principles:** Distraction-free writing, dark theme by default, warm orange accent, high information density without clutter, keyboard-friendly on web.
>
> **Web layout language:** Left sidebar (280px) + main content; full-screen editor and graph are exceptions.
>
> **Mobile layout language:** Single-column stacks, bottom tab bar for primary navigation (Files, Folders, Graph, Profile), native iOS/Android patterns.
>
> **Do not use:** Light-only themes, purple gradients, generic “AI app” aesthetics, cluttered dashboards, or stock photo hero sections.

---

## Design system (paste once)

> **Brand:** Clean, focused, distraction-free. Dark by default.
>
> **Color palette**
> - Background: `#0f172a` (slate 900)
> - Surface: `#1e293b` (slate 800)
> - Surface hover: `#334155` (slate 700)
> - Primary accent: `#f97316` (orange 500)
> - Primary accent muted: `#ea580c` (orange 600)
> - Text primary: `#f1f5f9` (slate 100)
> - Text secondary: `#94a3b8` (slate 400)
> - Destructive: `#ef4444` (red 500)
> - Success / connected: `#22c55e` (green 500)
> - Warning / broken links: `#f59e0b` (amber 500)
> - Border: `#334155` (slate 700)
> - Search highlight: `#fbbf24` at ~70% opacity on dark text
>
> **Typography:** Inter or SF Pro — 14px body, 1.5 line-height; headings 600 weight; editor monospace optional for code blocks.
>
> **Radius:** 8px components, 12px cards, 9999px pills/badges.
>
> **Icons:** Lucide-style, 2px stroke, 24px default, 16px inline.
>
> **Spacing:** 4px grid — 4, 8, 12, 16, 24, 32, 48, 64.
>
> **Components:** Outlined inputs on dark surface; primary CTA filled orange; secondary ghost/outline; tag pills orange outline; wiki links as orange pills with link icon; destructive actions red outline.

---

## Screen inventory

| Screen ID | Platform | Route / location | Status |
|-----------|----------|------------------|--------|
| `web-auth-signin` | Web | `/auth/signin` | Shipped |
| `web-auth-signup` | Web | `/auth/signup` | Shipped |
| `web-home-default` | Web | `/` | Shipped |
| `web-home-search` | Web | `/` (search active) | Shipped |
| `web-home-empty` | Web | `/` (no files) | Shipped |
| `web-dialog-folder-create` | Web | Sidebar modal | Shipped |
| `web-dialog-folder-delete` | Web | Sidebar modal | Shipped |
| `web-file-editor` | Web | `/files/[id]` | Shipped |
| `web-file-editor-tags` | Web | Editor (tag picker open) | Shipped |
| `web-file-editor-backlinks` | Web | Editor (backlinks panel) | Shipped |
| `web-file-editor-broken-links` | Web | Editor (warning bar) | Shipped |
| `web-file-editor-loading` | Web | Editor | Shipped |
| `web-file-editor-error` | Web | Editor | Shipped |
| `web-graph-view` | Web | `/graph` | Shipped |
| `web-graph-filters` | Web | `/graph` (filter panel) | Shipped |
| `mobile-auth` | Mobile | `/login` | Shipped (basic) |
| `mobile-home` | Mobile | `/(app)/` | Shipped (basic) |
| `mobile-new-file` | Mobile | `/new-file` | Shipped |
| `mobile-file-editor` | Mobile | `/file/[id]` | Shipped (basic) |
| `mobile-folders` | Mobile | Phase 5 | Planned |
| `mobile-search` | Mobile | Phase 5 | Planned |
| `mobile-graph` | Mobile | Phase 5 | Planned |
| `mobile-profile` | Mobile | Phase 5 | Planned |
| `mobile-sync-offline` | Mobile | Global banner | Planned |

---

## Web screens

### `web-auth-signin`

**Route:** `/auth/signin`  
**Goal:** Returning user signs in with email/password (NextAuth).

**Stitch prompt:**

> Design a sign-in screen for Redstone. Full viewport dark background with subtle radial gradient (slate 900 → slate 800). Centered card (max-width 400px, surface `#1e293b`, 12px radius, 1px border `#334155`).
>
> Card contents top to bottom: Orange gem/diamond logo mark + wordmark "Redstone"; heading "Welcome back"; subtitle "Sign in to your Redstone account"; email field (label + outlined input); password field; inline error text area (red, hidden in default); full-width orange "Sign in" button; footer link "Don't have an account? Sign up".
>
> States to show: default empty form; loading (button spinner); error ("Invalid email or password").

---

### `web-auth-signup`

**Route:** `/auth/signup`  
**Goal:** New user registration.

**Stitch prompt:**

> Design a sign-up screen for Redstone matching `web-auth-signin` card style.
>
> Fields: optional Name; Email; Password with helper "Must be at least 6 characters"; full-width orange "Sign up" button; footer "Already have an account? Sign in".
>
> States: default; validation error on short password; loading on submit.

---

### `web-home-default`

**Route:** `/` (authenticated home)  
**Goal:** Browse files by folder, create/import notes, open graph, see sync status.

**Stitch prompt:**

> Design the main dashboard for Redstone at 1440×900, three-region layout:
>
> **Left sidebar (280px, surface `#1e293b`):** Redstone logo + "Redstone" wordmark; "New Folder" button (+ icon, outline); nested folder tree with chevrons, folder icons, file-count badges; "All Files" row at top; active folder has orange 3px left border; bottom: user avatar circle, name "Test User", email, sign-out icon button.
>
> **Main header (56px):** Search input with magnifying glass, placeholder "Search files...", clear-X when typing; graph icon button linking to graph view; green dot = SSE connected; "New File" orange button; "Import" outline button (.md); user avatar dropdown (name, email, Sign out).
>
> **Main content:** Responsive grid of file cards (3 columns). Each card: title bold, 2-line content preview, folder name with folder icon, orange tag pills (`welcome`, `notes`), relative time "2h ago", hover lift + border brighten.
>
> Sample data: "Welcome to Redstone", "Meeting Notes", "Project Ideas" with realistic markdown snippets.

---

### `web-home-search`

**Route:** `/` with search query active  
**Goal:** Full-text search results with highlighting.

**Stitch prompt:**

> Same layout as `web-home-default`, but main content is a search results list (not card grid).
>
> Header search contains query "welcome". Subheader: "3 results for \"welcome\"". Each result row: highlighted title match (amber mark), snippet with highlighted match in body, folder breadcrumb, tags, chevron. Include one result with no snippet edge case.
>
> States: loading spinner in search field; zero results empty state "No files match your search"; error banner "Failed to search files".

---

### `web-home-empty`

**Route:** `/` filtered folder with no files  
**Goal:** Encourage first note in empty folder.

**Stitch prompt:**

> `web-home-default` layout with sidebar folder "Archive" selected (orange border). Main area centered empty state: document icon, "No files in this folder", secondary "Create a file or import markdown", orange "New File" button.

---

### `web-dialog-folder-create`

**Route:** Modal over home  
**Goal:** Create nested folder.

**Stitch prompt:**

> Dark modal dialog on dimmed overlay: title "Create folder"; description "Add a new folder to organize your notes"; text input "Folder name"; optional dropdown "Parent folder" (tree: My Notes, Work, Personal); Cancel (ghost) + Create (orange primary). Show validation: empty name disabled Create button.

---

### `web-dialog-folder-delete`

**Route:** Modal over home  
**Goal:** Confirm delete empty folder.

**Stitch prompt:**

> Destructive confirmation dialog: title "Delete folder?"; body "This will permanently delete \"Work\". Only empty folders can be deleted."; Cancel + red "Delete folder" button. Show error variant subtitle: "Folder is not empty" with disabled delete.

---

### `web-file-editor`

**Route:** `/files/[id]`  
**Goal:** Write markdown with live preview, save, export, tags, wiki links.

**Stitch prompt:**

> Design the file editor for Redstone, full viewport height, split view:
>
> **Top bar (56px):** Back arrow; editable title "Welcome to Redstone" (large semibold); orange dot + "Unsaved changes" text; Save button (orange, check icon); Export outline (download); Vim toggle pill (keyboard icon, off state gray); Backlinks button pill "Backlinks (2)" orange outline.
>
> **Tag row:** Pills `welcome` `getting-started` with X remove; dashed "+ Add tag" button.
>
> **Split panes (50/50):** Left — CodeMirror-style markdown editor, line numbers, dark `#282c34` background, syntax colors for headings/bold/code. Right — rendered preview with H1, lists, blockquote, code block. Wiki link `[[Meeting Notes]]` styled as orange pill with chain icon in preview.
>
> **Sample markdown in editor:** `# Welcome` paragraph, bullet list, `[[Meeting Notes]]` link.
>
> No broken-link bar in this variant.

---

### `web-file-editor-tags`

**Variant:** Tag autocomplete open

**Stitch prompt:**

> `web-file-editor` with tag input focused: dropdown below showing suggestions `welcome`, `work`, `ideas` (filtered); typed text "pr"; highlight first suggestion; keyboard hint "Enter to add · Esc to close".

---

### `web-file-editor-backlinks`

**Variant:** Backlinks panel expanded

**Stitch prompt:**

> `web-file-editor` with collapsible panel below header (full width, surface `#1e293b`): heading "Backlinks" with count; list of orange link pills "Meeting Notes", "Project Ideas" with file icons; empty state text "No other files link here yet".

---

### `web-file-editor-broken-links`

**Variant:** Broken wiki links warning

**Stitch prompt:**

> `web-file-editor` with amber/red warning bar under tags: warning icon, "2 broken links: [[Missing Note]], [[Old Draft]]" — links styled as muted red pills. Editor still usable below.

---

### `web-file-editor-loading` / `web-file-editor-error`

**Stitch prompt (loading):**

> Full screen dark background, centered spinner + "Loading file...".

**Stitch prompt (error):**

> Minimal top bar with back arrow only; center message "Failed to load file" (red muted) + outline "Back to Home" button.

---

### `web-graph-view`

**Route:** `/graph`  
**Goal:** Explore note connections from `[[wiki links]]`.

**Stitch prompt:**

> Design graph view for Redstone, full screen `#0f172a`:
>
> **Top bar:** Back arrow; title "Graph View"; search "Filter nodes..."; Filters toggle button with badge when active.
>
> **Canvas:** Force-directed graph — 8–12 circular nodes, thin gray edges, labels on hover tooltips. Node colors: default slate `#64748b`, tag-filtered blue, folder-filtered purple. Node size scales with degree. Subtle glow on hover.
>
> **Legend (bottom-left, semi-transparent card):** swatches — Default, Tag filter, Folder filter.
>
> Sample nodes: "Welcome to Redstone", "Meeting Notes", "Project Ideas", "API Design".

---

### `web-graph-filters`

**Variant:** Filter panel open

**Stitch prompt:**

> `web-graph-view` with right slide-over panel (320px): "Filters" title; Tag dropdown (selected: `welcome`); Folder dropdown (selected: `My Notes`); active filter pills with X; "Clear filters" text button. Graph dimmed behind panel.

---

## Mobile screens

### `mobile-auth`

**Route:** `/login` (sign-in + sign-up toggle)  
**Status:** Shipped (needs visual parity with web)

**Stitch prompt:**

> Design mobile auth for Redstone, 390×844, dark theme matching web palette.
>
> Safe area top/bottom. Centered: orange gem logo; "Welcome back" / toggle to "Create an account"; email + password fields (rounded 12px, dark inputs); orange full-width "Sign in" button; text toggle "Don't have an account? Sign up".
>
> **Variant `mobile-auth-register`:** heading "Create an account", subtitle "Get started with Redstone", same fields, "Sign up" CTA, toggle back to sign in.
>
> States: loading spinner on button; error alert style banner.

---

### `mobile-home`

**Route:** `/(app)/` file list  
**Status:** Shipped (basic)

**Stitch prompt:**

> Design mobile home for Redstone, 390×844, dark background.
>
> **Top bar:** "Redstone" title; search icon right; orange + icon for new file.
>
> **List:** Scrollable file rows — title bold, 1-line gray preview, folder icon + folder name, small orange tag pills, chevron right, thin dividers `#334155`. Pull-to-refresh indicator at top.
>
> **Bottom tab bar (64px + safe area):** Files (active orange), Folders, Graph, Profile — Lucide-style icons + labels.
>
> **Empty state:** "No files yet" + "Pull to sync or create a note" + orange "New File".
>
> Sample files match web seed data.

---

### `mobile-new-file`

**Route:** `/new-file`

**Stitch prompt:**

> Mobile screen: header "New note" with Cancel (left) and Create (orange, right). Fields: Title input; optional Folder picker row (chevron, "My Notes"); large multiline content area with placeholder markdown. Keyboard open variant showing toolbar above keyboard: bold, italic, link, list icons (muted).

---

### `mobile-file-editor`

**Route:** `/file/[id]`

**Stitch prompt:**

> Mobile file editor, dark theme: header with back, truncated title, Save icon (orange when dirty), overflow menu (Export HTML, Delete — destructive red).
>
> Title field editable. Tag row horizontal scroll (pills). Main area: tab switcher "Write | Preview" — Write shows monospace markdown editor; Preview shows rendered markdown with orange wiki links.
>
> States: saving spinner in header; delete confirmation bottom sheet.

---

### `mobile-folders` (Phase 5 — planned)

**Stitch prompt:**

> Mobile folders screen matching `web-home` sidebar tree: expandable nested folders, file counts, swipe actions Rename / Delete; FAB or header "+" for new folder; empty state "No folders yet". Bottom tab: Folders active.

---

### `mobile-search` (Phase 5 — planned)

**Stitch prompt:**

> Mobile search: full-width search bar autofocus; recent searches chips; results list like `web-home-search` with highlights; empty and error states. Accessible from home search icon and tab-less overlay mode.

---

### `mobile-graph` (Phase 5 — planned)

**Stitch prompt:**

> Mobile graph view: simplified force graph usable on touch — pinch zoom, pan, tap node opens bottom sheet with file title + "Open note" orange button. Compact filter chips (tags/folders) horizontal scroll under header. Tab: Graph active.

---

### `mobile-profile` (Phase 5 — planned)

**Stitch prompt:**

> Mobile profile/settings: avatar, name, email; sections — Account, Sync, Appearance (Dark default, Light disabled "coming soon"), About; "Sign out" destructive at bottom. Sync row shows "Last synced 2 min ago" green check or "Offline" amber icon.

---

### `mobile-sync-offline` (Phase 5 — planned)

**Stitch prompt:**

> Global banner component (attach to `mobile-home` and `mobile-file-editor` variants): amber bar below status bar — cloud-off icon, "You're offline — changes saved locally", thin progress when reconnecting. Companion: green toast "Synced 3 notes" on success.

---

## Cross-platform consistency matrix

| Feature | Web | Mobile (target) |
|---------|-----|-----------------|
| Auth (email/password) | Separate sign-in / sign-up pages | Single screen with toggle |
| File list + cards | Grid + sidebar folders | List + tab navigation |
| Markdown editor | Side-by-side edit + preview | Tabbed Write / Preview |
| Tags | Pills + autocomplete | Horizontal scroll pills |
| Wiki links `[[...]]` | Preview pills + broken banner | Preview pills |
| Backlinks | Collapsible panel | Bottom sheet |
| Graph view | Full desktop canvas | Touch graph + sheet |
| Real-time sync (SSE) | Green/red dot in header | Profile + banner |
| Import .md | Header button | Share sheet / Files picker (planned) |
| Export HTML | Editor button | Overflow menu |
| Folders CRUD | Sidebar + dialogs | Folders tab (planned) |
| Search | Inline header | Dedicated search (planned) |
| Vim mode | Toggle in editor | Omit on mobile |

---

## Sample content (use across all screens)

**Users**

- Name: Test User  
- Email: test@redstone.app  

**Folders**

- My Notes (root, 3 files)  
- Work (1 file)  
- Personal (nested under My Notes, 0 files)  

**Files**

1. **Welcome to Redstone** — tags: `welcome`, `getting-started` — contains `[[Meeting Notes]]`  
2. **Meeting Notes** — tags: `work` — links back to Welcome  
3. **Project Ideas** — folder: Work — tags: `ideas`  

**Tags (palette)**

`welcome`, `work`, `ideas`, `getting-started`

---

## Handoff notes for engineering

After Stitch export, map screens to code:

| Screen ID | Code path |
|-----------|-----------|
| `web-auth-signin` | `apps/web/app/auth/signin/page.tsx` |
| `web-auth-signup` | `apps/web/app/auth/signup/page.tsx` |
| `web-home-*` | `apps/web/app/page.tsx` + `components/features/file-browser/*` |
| `web-file-editor-*` | `apps/web/app/files/[id]/page.tsx` + `components/features/editor/*` |
| `web-graph-*` | `apps/web/app/graph/page.tsx` |
| `mobile-*` | `apps/mobile/app/**` |

Use Tailwind/shadcn (web) and NativeWind (mobile). Prefer existing tokens in the [Design system](#design-system-paste-once) when implementing.

---

## Revision history

| Date | Change |
|------|--------|
| 2026-05-18 | Initial design plan for Stitch — web shipped screens + mobile shipped/planned |

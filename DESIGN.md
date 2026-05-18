---
version: alpha
name: Redstone
description: Obsidian-like knowledge management — markdown notes, folders, tags, wiki links, graph view, web and mobile sync.
colors:
  primary: "#f97316"
  primary-muted: "#ea580c"
  secondary: "#94a3b8"
  tertiary: "#f1f5f9"
  neutral: "#0f172a"
  surface: "#1e293b"
  surface-hover: "#334155"
  on-surface: "#f1f5f9"
  on-surface-muted: "#94a3b8"
  border: "#334155"
  error: "#ef4444"
  success: "#22c55e"
  warning: "#f59e0b"
  search-highlight: "#fbbf24"
  editor-background: "#282c34"
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.4
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0.02em
  code-md:
    fontFamily: "JetBrains Mono"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.6
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  sidebar-width: 280px
  header-height: 56px
  gutter: 24px
rounded:
  sm: 8px
  md: 12px
  full: 9999px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    rounded: "{rounded.sm}"
    padding: 12px
  button-primary-hover:
    backgroundColor: "{colors.primary-muted}"
    textColor: "{colors.neutral}"
  button-secondary:
    backgroundColor: transparent
    textColor: "{colors.on-surface}"
    rounded: "{rounded.sm}"
    padding: 12px
  input-default:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.sm}"
    padding: 12px
  card-file:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: 16px
  tag-pill:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
    padding: 4px
  wiki-link-pill:
    backgroundColor: "{colors.surface-hover}"
    textColor: "{colors.primary}"
    rounded: "{rounded.full}"
---

# Redstone

## Overview

Redstone is a **knowledge management app** for people who think in linked notes — similar to Obsidian, with a cleaner, product-grade UI. Users write **markdown**, organize notes in **nested folders**, label with **tags**, connect ideas via **wiki links** (`[[Note Title]]`), and explore relationships in a **graph view**. Content syncs across **web** (Next.js) and **mobile** (Expo).

**Brand personality:** Focused, calm, technical-but-welcoming. Dark theme by default. Warm **orange** accent evokes the “Redstone” name (energy, craft) without feeling playful or childish.

**Audience:** Developers, writers, researchers, and anyone building a personal knowledge base.

**Layout languages:**
- **Web (1440×900):** Persistent left sidebar (280px) + main content. Full-bleed editor and graph views.
- **Mobile (390×844):** Single-column; bottom tab bar — Files, Folders, Graph, Profile.

**Logo:** Simple orange **gem/diamond** mark + wordmark “Redstone”.

**Generate all screens listed in [Screens](#screens)** including empty, loading, and error variants.

## Colors

The UI is **dark-first**. Neutrals carry structure; orange is the **only** strong accent for primary actions and links.

- **Neutral / Background (`#0f172a`):** Page canvas, deepest layer.
- **Surface (`#1e293b`):** Sidebar, cards, panels.
- **Surface hover (`#334155`):** Hover rows, borders, secondary surfaces.
- **On-surface (`#f1f5f9`):** Primary text.
- **On-surface muted (`#94a3b8`):** Secondary text, placeholders, metadata.
- **Primary (`#f97316`):** CTAs, active nav, wiki-link pills, tag accents.
- **Primary muted (`#ea580c`):** Hover on primary buttons.
- **Success (`#22c55e`):** Real-time sync connected indicator.
- **Error (`#ef4444`):** Destructive actions, form errors.
- **Warning (`#f59e0b`):** Broken wiki-link banner.
- **Search highlight (`#fbbf24`):** Inline match highlight in search results (~70% opacity on dark).
- **Editor background (`#282c34`):** CodeMirror-style markdown pane.

## Typography

- **Headlines:** Inter Semi-Bold — trustworthy, readable at a glance.
- **Body:** Inter Regular 14px — default UI copy and previews.
- **Labels:** Inter Medium 12px — tags, timestamps, folder counts.
- **Editor / code:** JetBrains Mono 13px — markdown source and fenced code blocks.
- **Preview:** Inter for rendered markdown (headings scale: H1 24px, H2 20px, H3 18px).

## Layout

**Web grid**
- Sidebar: fixed **280px**, full height.
- Main: fluid; header **56px**; content scrolls.
- File home: **3-column card grid** on desktop (2 on tablet, 1 on narrow).
- Editor: **50/50** split — markdown left, preview right.
- Graph: full viewport under top bar.

**Mobile**
- Safe areas for notch and home indicator.
- List rows: min height 72px; 16px horizontal padding.
- Bottom tabs: 64px + safe area; active tab uses `{colors.primary}`.

**Spacing scale:** 4px base — use 4, 8, 12, 16, 24, 32, 48, 64 for rhythm.

## Elevation & Depth

Prefer **tonal layers** over heavy shadows on dark UI.

- Cards: 1px border `{colors.border}`, optional subtle shadow `0 4px 24px rgba(0,0,0,0.25)` on hover.
- Modals: overlay `rgba(15, 23, 42, 0.8)`; dialog surface `{colors.surface}`.
- Dropdowns: same surface + border; 8px offset from trigger.

## Shapes

- **Buttons & inputs:** 8px radius (`rounded.sm`).
- **File cards & dialogs:** 12px radius (`rounded.md`).
- **Tags, wiki links, status dots:** full pill (`rounded.full`).

**Icons:** Lucide-style, 2px stroke, 24px toolbar, 16px inline.

## Components

### Buttons

- **Primary:** Filled `{colors.primary}`, white/dark text, hover `{colors.primary-muted}`. Use once per view for the main action (Save, Sign in, New File).
- **Secondary:** Ghost or outline on `{colors.border}`; for Import, Export, Cancel.
- **Destructive:** Red outline or red fill for Delete folder / Delete file.
- **Icon:** 36×36 ghost, rounded full for toolbar.

### Inputs

- Dark field on `{colors.neutral}` or transparent with border `{colors.border}`.
- Focus ring: 2px `{colors.primary}` at 40% opacity.
- Search: leading search icon; trailing clear (X) or spinner.

### File card (web)

- Title (semibold), 2-line content preview (muted), folder row with icon, orange tag pills, relative time (“2h ago”).
- Hover: border brightens, slight lift.

### Tag pill

- Outline orange, small X to remove when editable.
- “+ Add tag” dashed border pill.

### Wiki link (preview)

- Orange pill with chain icon; label `[[Title]]` or rendered title.

### Folder tree (sidebar)

- Chevron expand/collapse; folder icon; name; file-count badge.
- Active: **3px orange left border**.
- Row menu (⋮): Rename, Delete.

### Sync indicator

- **Connected:** 8px green dot near user menu.
- **Disconnected:** 8px red dot.

### Bottom tab bar (mobile)

- Four tabs: Files, Folders, Graph, Profile.
- Active: orange icon + label; inactive: `{colors.on-surface-muted}`.

### Dialogs

- Title + description + fields + footer (Cancel ghost, Confirm primary/destructive).

## Screens

Generate each screen at the listed size. Use [sample content](#sample-content) for realistic data.

### Web — Authentication

#### `web-auth-signin` (390×900 card centered on 1440×900)

Centered card on dark gradient background. Orange gem logo + “Redstone”. “Welcome back” / “Sign in to your Redstone account”. Email + password fields. Orange “Sign in”. Link “Don't have an account? Sign up”. **Variants:** loading button; inline error “Invalid email or password”.

#### `web-auth-signup`

Same card style. “Create an account” / “Get started with Redstone”. Optional name, email, password (helper: “Must be at least 6 characters”). Orange “Sign up”. Link to sign in.

### Web — Home

#### `web-home-default` (1440×900)

**Sidebar:** Logo, “New Folder”, tree (All Files, My Notes ▾, Work, Personal), user block + sign out.

**Header:** Search “Search files…”, graph icon, sync dot (green), “New File”, “Import”, avatar menu.

**Content:** Grid of file cards — “Welcome to Redstone”, “Meeting Notes”, “Project Ideas” with tags and timestamps.

#### `web-home-search`

Same chrome; search filled with “welcome”; results list with **highlighted** matches in title and snippet; “3 results for \"welcome\"”. **Variants:** loading; zero results; error banner.

#### `web-home-empty`

Folder “Archive” selected; empty state: icon, “No files in this folder”, “New File” CTA.

#### `web-dialog-folder-create`

Modal: “Create folder”, name input, parent folder select, Cancel / Create.

#### `web-dialog-folder-delete`

Modal: “Delete folder?”, warning copy, Cancel / red Delete. Variant: folder not empty (disabled delete).

### Web — File editor

#### `web-file-editor` (1440×900)

**Header:** Back, editable title, “Unsaved changes”, Save (orange), Export, Vim toggle (off), “Backlinks (2)”.

**Tags:** `welcome` `getting-started` pills + “+ Add tag”.

**Split:** Left markdown editor (line numbers, `#282c34`); right preview with H1, list, orange wiki pill `[[Meeting Notes]]`.

#### `web-file-editor-tags`

Tag dropdown open with suggestions; typed “pr”.

#### `web-file-editor-backlinks`

Panel below header listing backlink pills.

#### `web-file-editor-broken-links`

Amber warning bar: “2 broken links: [[Missing Note]], [[Old Draft]]”.

#### `web-file-editor-loading` / `web-file-editor-error`

Spinner + “Loading file…” / error + “Back to Home”.

### Web — Graph

#### `web-graph-view` (1440×900)

Dark canvas, force-directed graph (~10 nodes, gray edges), top bar (back, title, filter search, Filters). Legend: default / tag / folder node colors.

#### `web-graph-filters`

Right panel 320px: tag + folder dropdowns, active pills, Clear filters.

### Mobile — Authentication

#### `mobile-auth` (390×844)

Dark full screen. Logo, “Welcome back”, email/password, orange “Sign in”, toggle to sign up.

#### `mobile-auth-register`

“Create an account”, sign up CTA, toggle back.

### Mobile — Core

#### `mobile-home`

Header: Redstone, search icon, +. File list rows with preview, folder, tags, chevron. Bottom tabs (Files active). **Variants:** empty list; pull-to-refresh.

#### `mobile-new-file`

Title, folder picker “My Notes”, markdown body, Cancel / Create. Keyboard toolbar variant (bold, italic, link, list).

#### `mobile-file-editor`

Back, title, save (dirty state orange), overflow (Export, Delete). Tags row. **Write | Preview** tabs. Delete confirmation sheet.

### Mobile — Phase 5 (include in full design pass)

#### `mobile-folders`

Expandable folder tree, swipe rename/delete, FAB new folder.

#### `mobile-search`

Search bar, highlighted results, recent chips.

#### `mobile-graph`

Pinch-zoom graph; tap node → bottom sheet “Open note”.

#### `mobile-profile`

Avatar, email, Sync status, Sign out.

#### `mobile-sync-offline`

Amber banner: “You're offline — changes saved locally”; green “Synced” toast variant.

## Sample content

| Entity | Values |
|--------|--------|
| User | Test User · test@redstone.app |
| Folders | My Notes (3), Work (1), Personal (0, nested) |
| Files | Welcome to Redstone · Meeting Notes · Project Ideas |
| Tags | welcome, work, ideas, getting-started |
| Wiki link | `[[Meeting Notes]]` from Welcome note |

## Do's and Don'ts

**Do**
- Use dark backgrounds and orange only for primary actions and links.
- Keep web sidebar + header consistent across home, search, and list states.
- Show realistic markdown in editor and preview panes.
- Design empty, loading, and error states for every list and editor screen.
- Maintain WCAG AA contrast for body text on surfaces.

**Don't**
- Use light-only theme, purple gradients, or generic “AI assistant” layouts.
- Put more than one filled orange button per screen.
- Use stock photography or marketing hero sections.
- Mix sharp and overly rounded corners (stick to 8px / 12px / pill).
- Omit mobile safe areas or bottom tab bar on main mobile screens.

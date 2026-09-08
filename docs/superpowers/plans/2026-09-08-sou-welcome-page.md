# SOU Technology Welcome Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-screen interactive tech poster welcome page for SOU Technology Solutions at `frontend/app/page.tsx`.

**Architecture:** A single-viewport Next.js page component (`app/page.tsx`) with dark aesthetics, ambient glow effects, responsive 2-column poster layout, and interactive service highlight cards.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4.

## Global Constraints
- Target directory: `frontend/`
- Zero new runtime npm dependencies (pure Tailwind CSS + React).
- Viewport: Strict single screen `min-h-dvh max-h-dvh overflow-hidden` (no accidental scrollbars on desktop).
- Brand copy must be exact: `SoU`, `TECHNOLOGY SOLUTIONS`, `PEOPLE`, `TECHNOLOGY`, `SOLUTIONS`, `A BRIGHTER TOMORROW`, `SOFTWARE`, `AI`, `CLOUD`, `SYSTEMS INTEGRATION`, `soutechnology.vn`.

---

### Task 1: Update Global Theme and Background Utilities

**Files:**
- Modify: `frontend/app/globals.css`

**Interfaces:**
- Consumes: Tailwind CSS v4 setup
- Produces: CSS variables and utility classes for background dark gradient and tech grid pattern

- [ ] **Step 1: Check existing globals.css**
Review `frontend/app/globals.css` to verify Tailwind v4 import structure.

- [ ] **Step 2: Add ambient background utilities to globals.css**
Update `frontend/app/globals.css` to ensure dark mode defaults and helper styles for radial gradients and grid backdrop.

- [ ] **Step 3: Verify frontend builds without CSS errors**
Run: `cd frontend && npm run build`
Expected: Build passes.

- [ ] **Step 4: Commit globals.css changes**
```bash
git add frontend/app/globals.css
git commit -m "style: configure dark theme and tech background styles"
```

---

### Task 2: Implement SOU Interactive Welcome Page Component

**Files:**
- Modify: `frontend/app/page.tsx`

**Interfaces:**
- Consumes: Tailwind v4 classes and global background styles
- Produces: Complete root Next.js page for SOU Technology

- [ ] **Step 1: Replace default Next.js template in page.tsx with SOU Welcome Poster**
Implement:
1. Ambient lighting effects (top-left & bottom-right cyan/blue radial glows, SVG dot grid with radial fade mask).
2. Header/Brand zone with custom SOU typography mark and tracked subtitle `TECHNOLOGY SOLUTIONS`.
3. Left column vertical stacked typographic slogan: `PEOPLE / TECHNOLOGY / SOLUTIONS / A BRIGHTER TOMORROW`.
4. Bottom left status indicator: domain `soutechnology.vn` + pulsing live indicator.
5. Right column core service cards: `01 SOFTWARE`, `02 AI`, `03 CLOUD`, `04 SYSTEMS INTEGRATION` with interactive hover states and cyan accent borders.
6. Clean responsive adjustments for mobile screens.

- [ ] **Step 2: Verify page compilation and linting**
Run: `cd frontend && npm run build && npm run lint`
Expected: 0 errors, build successful.

- [ ] **Step 3: Commit page implementation**
```bash
git add frontend/app/page.tsx
git commit -m "feat: implement SOU Technology welcome full page"
```

---

### Task 3: Visual Verification and Final Polish

**Files:**
- Test/Verify: `frontend/app/page.tsx`

- [ ] **Step 1: Start dev server or inspect build output**
Verify Next.js dev server starts cleanly and no hydration mismatch exists.

- [ ] **Step 2: Check responsive layout on desktop and mobile viewports**
Ensure content stays within 100dvh without horizontal or vertical clipping.

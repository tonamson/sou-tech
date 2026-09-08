# SOU Technology Welcome Page Design Specification

## Overview
Transform the `frontend` root landing page (`app/page.tsx`) into an ultra-modern, interactive, full-screen tech poster inspired by the SOU Technology Solutions brand banner.

## Layout & Architecture
- **Container**: Full-height viewport (`100dvh`, `overflow-hidden`), dark theme (`#05080e` gradient).
- **Background**: Ambient radial glow (cyan & electric blue) + SVG tech grid/dots pattern with radial mask.
- **Left Column (Brand Identity & Tagline)**:
  - Top: SOU brand logomark & typography with tracking `TECHNOLOGY SOLUTIONS`.
  - Center: Large high-contrast vertical typographic stack:
    - `PEOPLE`
    - `TECHNOLOGY`
    - `SOLUTIONS`
    - `A BRIGHTER`
    - `TOMORROW`
  - Bottom: Domain indicator `soutechnology.vn` with pulsing online radar dot.
- **Right Column (Core Capabilities)**:
  - Vertical list of 4 core domains:
    1. `SOFTWARE`
    2. `AI`
    3. `CLOUD`
    4. `SYSTEMS INTEGRATION`
  - Hover micro-interactions: Cyan neon border glow, subtle slide-x, high-contrast illumination.

## Responsive Design
- **Desktop (`lg` / `md`)**: Balanced 2-column poster composition.
- **Mobile (`< md`)**: Cohesive vertical layout with compact service pills/grid at bottom, preserving the single-screen viewport without forced scrolling.

## Tech Stack & Implementation
- Framework: Next.js App Router (`frontend/app/page.tsx`).
- Styling: Tailwind CSS v4 (`@tailwindcss/postcss`).
- Dependencies: Zero extra dependencies. Pure modern CSS & semantic React.

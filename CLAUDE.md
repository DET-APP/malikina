# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Malikina** is a mobile-first Islamic education PWA for Al Moutahabbina Fillahi (Dahira des Étudiants Tidianes). It features prayer times, Quran viewing, Xassidas (Tidiane poems), Islamic calendar, and community features.

## Commands

### Frontend (root)
```bash
npm run dev        # Dev server at http://localhost:8080
npm run build      # Production build → dist/
npm run lint       # ESLint
npm run preview    # Preview production build
```

### Backend (api/)
```bash
cd api && npm run dev       # API server at http://localhost:5000 (tsx watch)
cd api && npm run build     # Compile TypeScript → api/dist/
cd api && npm run db:migrate  # Run migrations
cd api && npm run db:seed     # Seed SQLite database
```

## Architecture

### Navigation Model
The entire app uses **state-based screen management**, not URL routing. `pages/Index.tsx` holds `activeScreen` state and renders the active screen via a switch. Navigation params (e.g., surah ID for Quran deep-links) are passed via a separate `navigationParams` state. The `BottomNavigation` and `FloatingMenu` components call `onNavigate()` to switch screens.

Screens: `home | prayer | quran | calendar | qassidas | fiqh | community | news | admin-xassidas`

### Data Flow
- **External APIs**: Prayer times via Aladhan API, Quran verses via Quran.com API (`services/quranApi.ts`)
- **Backend API**: Express + SQLite at `localhost:5000/api` for Xassidas, authors, verses (CRUD)
- **Static fallback**: `src/data/*.ts` files contain local Xassida data used when the API returns empty results
- **Custom hooks** in `src/hooks/` encapsulate all data fetching logic using TanStack Query

### Backend
`api/server.ts` is an Express app with Swagger docs. The SQLite database (`xassidas.db`) has three tables: `authors`, `xassidas`, `verses`. Routes in `api/routes/` handle CRUD. There is optional PDF/OCR support via OCR Space API (requires `OCR_SPACE_API_KEY`).

### PWA
Service Worker (`public/service-worker.js`) uses cache-first for assets, network-first for API calls, and cache-first with 50-entry limit for audio. Install prompt appears after 5 seconds. The `usePWA.ts` hook handles install/update detection.

## Environment Variables

Frontend (`.env.local`):
```
VITE_API_URL=http://localhost:5000/api
```

Backend (`api/.env`):
```
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
OCR_SPACE_API_KEY=   # Optional
```

## Key Conventions

- **TypeScript is loose**: `strictNullChecks: false`, `noImplicitAny: false` — this is intentional
- **Path alias**: `@/` maps to `src/`
- **Styling**: Tailwind utility classes; `cn()` from `lib/utils.ts` for conditional class merging; custom colors defined in `tailwind.config.ts` (gold, green palette)
- **Arabic text**: Use `font-arabic` class (Amiri font) and `HeaderWithArabic` component for bilingual headers
- **Component split**: Screens live in `components/screens/`, their sub-components in named folders (`home/`, `prayer/`, `quran/`, `qassidas/`)
- **shadcn-ui**: Add new components via `npx shadcn-ui@latest add <component>`; they land in `components/ui/`
- **Lovable integration**: `lovable-tagger` in Vite config syncs components to the Lovable UI editor — preserve component naming/structure

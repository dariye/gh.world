# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Real-time 3D globe visualization of GitHub commits worldwide. Shows live commit activity with geolocation and programming language detection.

**Stack:** Next.js 16 (App Router) + React 19 + Convex + Tailwind CSS 4 + shadcn/ui + react-globe.gl

## Commands

```bash
# Development (runs frontend + backend in parallel)
npm run dev

# Individual processes
npm run dev:frontend   # Next.js on localhost:3000
npm run dev:backend    # Convex dev server

# Build & lint
npm run build
npm run lint
```

No test suite is currently configured.

## Architecture

### Data Flow
1. Client polls GitHub Events API every 30 seconds via Convex action
2. Action fetches PushEvents, extracts user locations, geocodes via Nominatim (OSM)
3. Commits stored in Convex with coordinates (when available) and language data
4. Client queries Convex for recent commits, renders on 3D globe

### Key Directories
- `app/` - Next.js App Router (page.tsx is main orchestrator)
- `convex/` - Backend: schema, queries, mutations, and actions
- `components/` - React components including Globe.tsx (dynamic import, no SSR)
- `components/ui/` - shadcn primitives

### Convex Backend
- **schema.ts** - Two tables: `commits` (sha, author, coordinates, language) and `locationCache` (username geocoding cache)
- **actions.ts** - `pollPublicEvents()` action handles GitHub API + geocoding
- **commits.ts** - Queries/mutations for commit data

### Rate Limiting
- GitHub API: Monitors `x-ratelimit-remaining`, only enriches language data if >500 requests remain
- Nominatim: 1 request/second limit (enforced server-side)

## Environment Variables

Required in `.env.local`:
```
CONVEX_DEPLOYMENT=<convex deployment>
GITHUB_TOKEN=<personal access token>
NEXT_PUBLIC_CONVEX_URL=<convex URL>
```

## Feature Spec

See `gh-world-spec.md` for detailed feature requirements including:
- Language filter pills
- 6-hour timelapse playback
- Stats panel
- Mobile responsiveness

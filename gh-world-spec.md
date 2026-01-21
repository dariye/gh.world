# gh.world — Implementation Spec

## Overview

Real-time 3D globe visualization of public GitHub commits. Data collection starts from today only—no historical backfill.

**Stack:** React + Vite, globe.gl (Three.js), Convex, Vercel

---

## Feature 1: Live Globe

Continuously updating 3D globe showing commits as colored dots.

### Behavior
- Poll GitHub Events API every 30 seconds for PushEvents
- Each commit with geolocation renders as a colored dot at lat/lng
- Dots fade out after 10 seconds
- User can drag to rotate (desktop) or swipe (mobile)
- Pinch/scroll to zoom
- Click/tap a dot to show commit details (author, repo, message, language)

### Geolocation
- Lookup author username in `locationCache`
- If miss: fetch GitHub profile, extract location field, geocode via Nominatim
- Cache result for 30 days (including failures)
- Expect 30-50% success rate—most profiles have no usable location

### Dot Colors (by language)
```
Python:     #3572A5
JavaScript: #F7DF1E
TypeScript: #3178C6
Go:         #00ADD8
Rust:       #DEA584
Java:       #B07219
Ruby:       #CC342D
C++:        #F34B7D
PHP:        #4F5D95
Swift:      #F05138
Kotlin:     #A97BFF
Other:      #8B8B8B
```

---

## Feature 2: Atmospheric Pulses

Commits without geolocation appear as ambient pulses radiating from random globe points.

### Behavior
- When `hasLocation: false`, skip dot rendering
- Instead, trigger a pulse animation at a random visible point on globe surface
- Pulse: expanding ring that fades out over 2 seconds
- Color matches commit language
- Creates "breathing" effect showing global activity even without precise locations

### Implementation
- Use globe.gl `ringsData` layer
- Ring properties: `lat`, `lng`, `maxRadius: 3`, `propagationSpeed: 2`, `repeatPeriod: 0`
- Remove ring from data array after animation completes

---

## Feature 3: Language Filter

Filter visualization to show only commits in selected language(s).

### UI
- Horizontal row of pill buttons at top of viewport
- Pills: "All", "Python", "JavaScript", "TypeScript", "Go", "Rust", "Java", "Other"
- Single-select (tap one to filter, tap "All" to reset)
- Active pill highlighted with language color

### Behavior
- Filter applies to both dots and pulses
- Filter persists during timelapse playback
- When filtered, stats panel updates to show filtered counts

---

## Feature 4: Six-Hour Timelapse

Replay last 6 hours of commit activity as animation.

### UI
- Play/Pause button
- Speed selector: 1x, 2x, 4x, 8x
- Scrubber bar showing 6-hour window with current playback position
- Timestamp display (e.g., "3 hours ago")

### Behavior
- Query commits from `now - 6 hours` to `now`
- Playback renders commits at accelerated rate based on their original timestamps
- At 1x speed, 6 hours compresses to ~2 minutes (180x acceleration)
- Dots and pulses appear/fade as they did historically
- Language filter applies during playback
- Reaching end loops back to start (or pauses, user preference)

### Data
- No pre-aggregation needed—query raw commits with timestamp range
- Sort by timestamp ascending for playback
- Batch into 1-minute buckets for smooth rendering

---

## Feature 5: Mobile Responsive

Mobile is first-class. Must work on 375px+ screens at 30fps on mid-range devices.

### Layout (Mobile)
```
┌─────────────────────────┐
│ [Py] [JS] [TS] [Go] ... │  ← Language filter pills (horizontal scroll)
├─────────────────────────┤
│                         │
│                         │
│        [GLOBE]          │  ← Full viewport minus top/bottom bars
│                         │
│                         │
├─────────────────────────┤
│ ▶ [====●=====] 2x  ⓘ   │  ← Timelapse controls + stats button
└─────────────────────────┘
```

### Touch Gestures
| Gesture | Action |
|---------|--------|
| Single-finger drag | Rotate globe |
| Pinch | Zoom in/out |
| Two-finger drag | Tilt/pan camera |
| Tap on dot | Show commit details (bottom sheet) |
| Tap ⓘ | Open stats panel (bottom sheet) |

### Performance
- Limit visible dots to 500 max (remove oldest when exceeded)
- Use instanced rendering for pulses
- Throttle re-renders to 30fps on mobile
- Lazy-load commit details on tap (don't pre-fetch)

### Commit Details Bottom Sheet
```
┌─────────────────────────┐
│ ──────                  │  ← Drag handle
│ repo/name               │
│ "commit message..."     │
│ @author · Python · 2m   │
│ [View on GitHub →]      │
└─────────────────────────┘
```

### Stats Panel Bottom Sheet
```
┌─────────────────────────┐
│ ────── January 2026     │
│ 1.2M commits            │
│ 89K contributors        │
│ 34% geolocated          │
│                         │
│ Python     ████████ 42% │
│ JavaScript ██████   31% │
│ TypeScript ███      15% │
│ Other      ██       12% │
└─────────────────────────┘
```

---

## Data Schema (Convex)

### commits
```typescript
{
  sha: string,           // unique
  author: string,        // GitHub username
  authorEmail: string,   // for unique contributor counts
  repo: string,          // "owner/repo"
  message: string,       // truncated to 200 chars
  language: string | null,
  timestamp: number,     // unix ms
  lat: number | null,
  lng: number | null,
  hasLocation: boolean
}
```

### locationCache
```typescript
{
  username: string,      // unique
  lat: number | null,
  lng: number | null,
  locationText: string | null,
  resolvedAt: number,
  expiresAt: number      // resolvedAt + 30 days
}
```

### monthlyStats
```typescript
{
  month: string,         // "2026-01"
  totalCommits: number,
  uniqueContributors: number,
  byLanguage: Record<string, number>,
  geolocationRate: number,
  updatedAt: number
}
```

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| GitHub API down | Show cached data, banner: "Live updates paused" |
| No WebGL support | Fallback to 2D Leaflet map with markers |
| Commit has no language | Render as "Other" (gray) |
| Geolocation fails | Render as atmospheric pulse |
| Slow connection | Skeleton loader, progressive data load |
| Database unavailable | Full-page error with retry button |

---

## API Endpoints (Convex)

### Mutations
- `ingestCommits(events: PushEvent[])` — process GitHub events, resolve locations, store commits
- `updateMonthlyStats(month: string)` — recompute aggregates for month

### Queries
- `getRecentCommits(since: number, language?: string)` — live feed for globe
- `getCommitsInRange(start: number, end: number, language?: string)` — timelapse data
- `getMonthlyStats(month: string)` — stats panel data
- `getLocationFromCache(username: string)` — location lookup

### HTTP Endpoint
- `POST /ingest` — called by external cron every 30s, fetches GitHub Events API and calls `ingestCommits`

---

## External Services

| Service | Purpose | Rate Limit |
|---------|---------|------------|
| GitHub Events API | Commit data | 5000 req/hr (we use ~120) |
| Nominatim | Geocoding | 1 req/sec (cached aggressively) |
| EasyCron | Trigger polling | Free tier sufficient |

---

## Success Criteria

MVP is done when:
- [ ] Data pipeline runs 48+ hours without errors
- [ ] Globe renders at 30fps on iPhone 11
- [ ] Language filter works correctly
- [ ] 6-hour timelapse plays with speed controls
- [ ] Stats panel shows accurate counts
- [ ] All error states handled (no blank screens)
- [ ] Works on 375px screens

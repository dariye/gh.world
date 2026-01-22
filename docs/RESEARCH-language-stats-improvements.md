# Research: Language Breakdowns & Stats Improvements

## Executive Summary

This document proposes enhancements to gh.world's language visualization and stats features, inspired by Stack Overflow Survey 2025, Shadcn Charts, and GitHub contribution visualizations.

## Current State Analysis

### What We Have

1. **Global Stats (StatsSidebar)**
   - RadialBarChart showing top 6 languages
   - Area chart for 7-day activity trend
   - Line chart for collaborator growth
   - Total commits ticker

2. **Profile Stats (ProfileCard)**
   - Top 3 languages via horizontal progress bars
   - Commit count with percentile rank
   - Location with estimated local time
   - Latest commit message

3. **Data Available**
   - `commits` table: author, language, timestamp, coordinates, repo
   - `monthlyStats`: totalCommits, uniqueContributors, byLanguage
   - `dailyStats`: per-day aggregations
   - `locationCache`: user locations

### Limitations

- Language display limited to 6 (global) or 3 (profile) languages
- No historical language trends
- No "aspirational" or "growth" metrics
- No comparison between users
- No visualization of coding patterns over time

---

## Proposed Improvements

### 1. Expandable Language Breakdown (ALL Languages)

**Problem:** Current radial chart only shows top 6 languages, hiding the "long tail" of language diversity.

**Solution:** Tiered display inspired by Stack Overflow Survey:

```
┌─────────────────────────────────────────┐
│  PRIMARY LANGUAGES (Radial Chart)       │
│  [Top 6 as concentric rings]            │
│                                         │
│  ALL LANGUAGES (Expandable List)        │
│  ▼ Show 23 more...                      │
│                                         │
│  7. Kotlin      ████░░░░░░░░ 4.2%       │
│  8. Swift       ████░░░░░░░░ 3.8%       │
│  9. C#          ███░░░░░░░░░ 3.1%       │
│  ... (scrollable)                       │
└─────────────────────────────────────────┘
```

**Implementation:**
- Keep radial chart for top 6 (visual impact)
- Add collapsible ranked list below showing ALL languages
- Horizontal bar chart format (simpler, fits more)

**Chart Type:** Horizontal Bar Chart (Recharts BarChart layout="vertical")

---

### 2. Enhanced Profile Stats Page

**Problem:** Profile view only shows 3 languages and limited metrics.

**Proposed New Metrics:**

| Metric | Description | Why Useful |
|--------|-------------|------------|
| **Coding Streak** | Consecutive days with commits | Gamification, consistency |
| **Peak Hours** | Most active time of day | Self-awareness |
| **Language Journey** | Languages adopted over time | Growth visualization |
| **Repo Diversity** | Unique repos contributed to | Breadth indicator |
| **Commit Velocity** | Commits per day/week trend | Activity health |

**Visual Layout:**

```
┌──────────────────────────────────────────────┐
│  @username                                    │
│  Top 5% globally · 423 commits since Jan 1   │
├──────────────────────────────────────────────┤
│  LANGUAGES         │  ACTIVITY               │
│  [Radial/Pie]      │  [7-day sparkline]      │
│                    │                         │
│  All 8 languages:  │  🔥 12-day streak       │
│  Python 45%        │  ⏰ Peak: 2-4pm         │
│  TypeScript 30%    │  📦 18 repos            │
│  Go 15%            │                         │
│  +5 more...        │                         │
├──────────────────────────────────────────────┤
│  LANGUAGE JOURNEY (Area Chart)               │
│  [Stacked area showing language adoption]    │
│  Jan    Feb    Mar    Apr    May             │
└──────────────────────────────────────────────┘
```

---

### 3. Global Activity Dashboard

**Problem:** No aggregate dashboard for overall platform health.

**Proposed Sections:**

1. **Hero Stats Row**
   - Total commits (animated)
   - Unique contributors
   - Languages tracked
   - Countries represented

2. **Language Popularity Over Time**
   - Stacked area chart showing language trends
   - Toggle between absolute counts and percentages
   - Similar to Stack Overflow's yearly trends

3. **Regional Activity Map**
   - Already have globe, enhance with choropleth overlay
   - Show commits per region as heat intensity

4. **Leaderboard (Optional)**
   - Top contributors this month
   - Rising stars (biggest improvement)
   - Most diverse (most languages used)

---

### 4. Recommended Chart Types

Based on Shadcn/Recharts capabilities:

| Use Case | Recommended Chart | Why |
|----------|------------------|-----|
| Language % distribution | **Pie Chart** | Clean for 5-8 items |
| All languages (20+) | **Horizontal Bar** | Fits many items |
| Trends over time | **Area Chart** (stacked) | Shows composition change |
| User comparison | **Radar Chart** | Multi-dimension compare |
| Activity sparkline | **Line Chart** (minimal) | Compact inline |
| Commit frequency | **Bar Chart** | Daily/weekly buckets |

---

### 5. Specific Implementation Suggestions

#### 5.1 Replace Radial with Pie for Global Languages
The radial bar chart is visually impressive but hard to read. A pie chart with labels would be clearer for top 6 languages.

#### 5.2 Add Language Trend Chart
New section: "Language Trends" showing how language popularity changes over 7/30/90 days using stacked area chart.

#### 5.3 Profile Page Overhaul
Create dedicated `/profile/[username]` page with:
- Full language breakdown (not just top 3)
- Activity heatmap (GitHub-style contribution calendar)
- Time-of-day activity distribution
- Language adoption timeline

#### 5.4 "Your Stats vs Global" Comparison
Radar chart comparing user's metrics against platform averages:
- Commit frequency
- Language diversity
- Consistency (streak)
- Peak activity alignment

---

## Data Requirements

### New Queries Needed

1. `getLanguageTrends(days)` - Historical language percentages
2. `getUserStreak(username)` - Consecutive active days
3. `getUserPeakHours(username)` - Activity by hour
4. `getLanguageJourney(username)` - When user started each language
5. `getUserRepoCount(username)` - Unique repos

### Schema Additions

Consider adding to `dailyStats`:
- `byHour`: Record<hour (0-23), count>
- `uniqueRepos`: number

---

## Priority Recommendations

### High Priority (Most Impact)
1. **Expandable language list** - Shows ALL languages (key requirement)
2. **Enhanced profile page** - More engaging user experience

### Medium Priority
3. **Language trend chart** - Adds temporal dimension
4. **Coding streak** - Gamification drives engagement

### Lower Priority
5. **Global dashboard** - Nice to have, lots of work
6. **Radar comparison** - Cool but complex

---

## Next Steps

1. Create implementation issues for each approved feature
2. Start with "Expandable language list" as it directly addresses the "show ALL languages" requirement
3. Profile page enhancement as second priority

---

*Research compiled by polecat/rust, 2026-01-22*

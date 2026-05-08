# LOVABLE IMPORT PROMPT — Feature Group 4: Home & Dashboard

> **Instructions**: Copy everything below the "PROMPT START" line and paste it as a single prompt into Lovable.
> **Prerequisites**: Groups 1–3 (Admin, Auth, Onboarding) must be deployed first.

---

## PROMPT START

Add the **OSIA Life Command Center** — the main authenticated home dashboard. This is the user's primary view after login, a rich widget-based dashboard that visualizes their Life Area health scores, active focus areas, today's priority task, personality blueprint summary, journey level, and connections. It also includes the global `AppLayout` shell with top navigation, avatar dropdown, and KYC banner.

Continue using the OSIA design system: `#02050F` page, `#0A1128` cards, `#38A3A5` teal, Inter font, glassmorphism, Framer Motion, Lucide React icons.

---

### 1. APP LAYOUT SHELL

Create a fixed top navigation bar used across all authenticated pages.

**Header** (`fixed top-0 left-0 right-0 h-20 z-50`):
- Background: `bg-[#0A1128]/40 backdrop-blur-xl border-b border-white/5`
- **Left:** OSIA logo (`/logo.png`, h-7, 90% opacity, brightness-0 invert filter, links to `/home`)
- **Center:** Horizontal pill nav bar (`bg-white/[0.03] rounded-full px-2 py-1 border border-white/5 backdrop-blur-md`):

| Nav Item | Icon | Path | Match Paths |
|---|---|---|---|
| Home | Home | /home | /home |
| Vision | Zap | /vision | /vision |
| Insights | Sparkles | /thesis | /thesis, /patterns |
| Connect | Share2 | /connect | /connect |
| Circles | Users | /teams | /teams, /team, /organizations |
| Practice | RefreshCw | /practice | /practice |
| Journey | Zap | /journey | /journey, /history, /readiness |

**Active nav item**: `bg-[#38A3A5] text-white shadow-[0_0_15px_rgba(56,163,165,0.4)] rounded-full`
**Inactive nav item**: `text-[#757575] hover:text-white hover:bg-white/5 rounded-full`
Each item: `px-5 py-2 text-xs font-bold uppercase tracking-wider`

**Connect badge**: If `requestCount > 0`, show red pulse badge `px-1.5 py-0.5 text-[8px] bg-red-500 text-white rounded-full` next to Connect label. Fetch count from `/api/connect/requests` every 30s.

- **Right:** Avatar dropdown button (`px-3 py-1.5 rounded-full border border-white/10 bg-white/5`):
  - 24×24 circle: shows avatar image if available, else 2-letter initials (`bg-osia-neutral-200 text-[#0A1128]`)
  - ChevronDown icon (rotates 180° when open)
  - Click to toggle dropdown

**Avatar Dropdown** (`absolute top-full right-0 mt-2 w-64 bg-[#0A1128]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl`):
- Header row: full name (sm, white) + email or "Seed Twin • Developing" (xs, neutral-500)
- Menu items:
  - Profile → `/settings?tab=profile` (User icon)
  - Settings → `/settings?tab=security` (Settings icon)
  - Admin Portal → `/admin` (Shield icon, **only shown if `userProfile.isAdmin`**)
- Sign Out (LogOut icon, red-400 text, `hover:bg-red-500/10`)
- Click outside to close (click-away handler on ref)

**Mobile (md:hidden):**
- Hamburger/X toggle button replaces center nav
- Full-screen overlay slide-down menu showing all nav items vertically
- Same active/inactive styling as desktop

**KYC Banner** — Appears just below the fixed header as a sticky warning if user's KYC is pending/overdue (see Group 11 for full KYC spec; render as a yellow/amber dismissible ribbon here as placeholder).

**Main content area**: `pt-24 px-6 min-h-screen` with `max-w-7xl mx-auto pb-12` inner wrapper

**Background**: `PlexusBackground` canvas animation fixed behind everything:
- 100 particles moving slowly (vx/vy ±0.25)
- Teal particle dots: `rgba(56,163,165,0.5)`, size 1-3px
- Connection lines between particles within 150px: `rgba(56,163,165, opacity*0.2)`, 0.5px
- Canvas `fixed inset-0 z-[-1] bg-[#050816]`, opacity 60%
- Resizes on window resize, cancelAnimationFrame on cleanup

---

### 2. TWIN HOME — Life Command Center

**Route:** `/home`

**Layout:** `max-w-5xl mx-auto space-y-8 pb-8`

**Widget Error Boundary:** Wrap every widget in an error boundary class. On error: show `"Widget failed to load"` in a faint `bg-white/[0.02] rounded-xl border border-white/5 p-4` placeholder.

**Data Sources:**
```
GET /api/dashboard/summary → { areas[], activeFocusAreas[], needsAttention[], oneToday }
GET /api/dashboard/stats   → { practiceStreak, weeklyCompletions, weeklyRefinements,
                                overallScore, completionSparkline[], refinementSparkline[],
                                scoreTrendByArea, completionsByDay, activeDaysThisWeek,
                                totalCompletions, insights[], milestones[], blueprint{},
                                evolution{}, journey{}, connections{}, protocols{} }
```
Fetch both in parallel on mount. `stats` is optional (gracefully skip widgets if null).

---

#### WIDGET 1 — Welcome Header

```
[Teal sparkles icon box 12×12] Welcome back, {firstName}
                                 Focusing on {active area labels} | "Your life command center."
```
- Icon box: `rounded-2xl bg-[#38A3A5]/10 border border-[#38A3A5]/20`
- Heading: `text-2xl font-extrabold tracking-tight`
- Subtitle: `text-sm text-[#757575] font-medium`
- Animate: `opacity: 0→1, y: 20→0` on mount

---

#### WIDGET 2 — Activity Pulse Strip

Shown only if `stats` is loaded. A horizontal row of 3 stat cards:

| Card | Value | Sparkline | Delta |
|---|---|---|---|
| Practice Streak | `{practiceStreak} days` | `completionSparkline` | `+{completionDelta}%` |
| Weekly Completions | `{weeklyCompletions}` | `refinementSparkline` | `+{refinementDelta}%` |
| Overall Score | `{overallScore}/10` | `scoreSparkline` | `+{scoreDelta}` |

Each card: glassmorphism card, label (9px uppercase), large value (xl bold), mini sparkline (SVG 40px wide, 20px tall, teal stroke), delta badge (green if positive, red if negative).

Plus two more small stats below:
- `{protocolsActive} Active Protocols` (teal dot)
- `Blueprint Depth: {blueprintDepth}%` (purple progress sliver)

---

#### WIDGET 3 — Main Grid (Life Area Radar + Right Column)

**2-column grid (lg:grid-cols-2), gap-6**

**Left — Life Area Radar Card:**
- Card header: "LIFE AREA RADAR" (10px uppercase neutral-400) + "Click to edit scores" (9px white/20)
- **SVG Spider/Radar Chart** (350×350px centered):
  - 7 axes: Spiritual Life 🕯️, Physical Health 💪, Personal Life 🪞, Key Relationships ❤️, Career 📈, Business 🏢, Finances 💰
  - 5 concentric polygon rings (scores 2/4/6/8/10) at 20% opacity
  - Axis lines from center to edge, 10% opacity
  - Axis labels at tips (10px, neutral-500)
  - Filled polygon for user data: `fill: rgba(56,163,165,0.15)`, `stroke: #38A3A5`, strokeWidth 2
  - Dot at each data point: 6px circle, teal fill, hover scales to 10px
  - **Clicking a dot opens the Score Edit Modal**
  - Animate filled polygon: draw from center outward on mount (stroke-dasharray animation)
- Empty state: "Add your first life area scores to see your radar." with teal + button

**Right Column (space-y-6):**

**Active Focus Areas:**
- Header: "ACTIVE FOCUS" (10px uppercase)
- If no focus areas: empty card with "+ Add Focus" button (outline style)
- Each focus area card: emoji icon + area label (sm bold white) + health score badge + "×" remove button
- "+ Add Focus Area" ghost button at bottom (opens Add Focus Modal)

**One Today Card** (if `dashboard.oneToday` exists):
- Header: "ONE THING TODAY" (10px uppercase teal)
- Area emoji + area label
- Task text (sm white)
- "Mark Complete" button: teal outline → teal filled + checkmark when completed
- Completed state: strikethrough text, green check badge

**Needs Attention Panel** (if `dashboard.needsAttention.length > 0`):
- Header: "NEEDS ATTENTION" (10px uppercase amber-400)
- List of areas with score ≤ 4:
  - Area emoji + label + score/10 (red if ≤3, amber if 4)
  - Clickable → opens Score Edit Modal for that area

---

#### WIDGET 4 — Score Trajectory Chart

Shown if `stats.scoreTrendByArea` exists.

Full-width card, header: "SCORE TRAJECTORY" (10px uppercase)

**Multi-line chart** (SVG, full width, 200px height):
- One polyline per life area, each a different color (teal, purple, amber, blue, green, pink, red)
- X-axis: last 8 weeks (dates)
- Y-axis: 0–10 scale
- Hover: vertical cursor line + tooltip showing all area scores for that week
- Legend row: colored dots + area labels

---

#### WIDGET 5 — Practice Heatmap

Shown if `stats.completionsByDay` exists.

Full-width card, header: "PRACTICE HEATMAP" (10px uppercase)

**GitHub-style calendar grid:**
- 52 weeks × 7 days grid of small squares (10×10px, 2px gap)
- Color: 0 completions = `white/5`, 1 = `teal/20`, 2 = `teal/40`, 3+ = `teal/70`
- Hover: show tooltip with date + count
- Bottom stats: `{activeDaysThisWeek} active days this week` + `{totalCompletions} total completions`

---

#### WIDGET 6 — Weekly Insight & Milestones

Shown if `stats.insights.length > 0` or `stats.milestones.length > 0`.

**2-column grid inside card:**

**Left — Insights:**
- Header: "THIS WEEK'S INSIGHTS" (10px uppercase teal)
- Each insight: teal left-border card, insight text (sm white), area badge

**Right — Milestones:**
- Header: "MILESTONES" (10px uppercase amber)
- Each milestone: trophy emoji + milestone text (sm white), date badge
- If empty: "Keep practising to unlock milestones" (xs neutral-500)

---

#### WIDGET 7 — Blueprint Summary + Evolution Timeline (2-col grid)

**Blueprint Summary Card (left):**
- Header: Fingerprint icon (teal) + "BLUEPRINT SUMMARY" (10px uppercase)
- Depth score ring: circular progress (60×60px SVG), `{depthScore}%` center label
- Strengths list: green check + trait name (up to 3)
- Developing list: amber circle + trait name (up to 3)
- Footer: `{snapshotCount} snapshots · {totalTraits} traits mapped`

**Evolution Timeline Card (right):**
- Header: TrendingUp icon (purple) + "EVOLUTION TIMELINE" (10px uppercase)
- 3 stat rows: `+{overallGrowth}%` Overall Growth, `+{stabilityGrowth}%` Stability, `{patternsDiscovered}` Patterns Discovered
- Improvement areas: green up-arrow badges
- Attention areas: amber warning badges
- Pattern changes: list of recent shift descriptions
- Footer: `Based on {snapshotCount} snapshots`

---

#### WIDGET 8 — Journey Level + Connection Orbit (2-col grid)

**Journey Level Card (left):**
- Header: Zap icon (amber) + "JOURNEY LEVEL" (10px uppercase)
- Large level number (4xl bold teal)
- Level title (lg bold white)
- XP progress bar: `{totalPoints}/{totalPoints+pointsToNextLevel}` with teal fill
- "Next: {nextLevelTitle}" label
- Badge row: emoji badges for `badgesEarned[]`
- Bottom: `{creditDiscount}% credit discount · {totalCredits} credits`

**Connection Orbit Card (right):**
- Header: Share2 icon (purple) + "CONNECTIONS" (10px uppercase)
- Total count (2xl bold white) + "connections" label
- Type breakdown: pill badges per type (e.g., "Personal 3", "Professional 2")
- Pending requests badge (red pulse if `pendingCount > 0`)
- Avatar row: circular avatar chips for `recentAvatars[]` (up to 5, overlapping)
- "+ {remainder} more" if >5

---

#### WIDGET 9 — Quick Actions Row

**3-column grid:**

| Action | Icon | Path | Gradient |
|---|---|---|---|
| View Insights | BarChart3 | /thesis | teal/20 → teal/5 |
| Team Setup | Users | /team | purple/20 → purple/5 |
| Settings | Settings | /settings | white/10 → white/5 |

Each: `rounded-2xl border border-white/5 bg-[#0a1128]/40 backdrop-blur-xl` card
On hover: gradient overlay fades in (`opacity: 0 → 100%`), icon + label turn white
Animate: `delay: 0.4s`

---

### 3. SCORE EDIT MODAL

Triggered by clicking a radar axis dot or a "Needs Attention" area.

**Modal** (`fixed inset-0 z-50 bg-black/60 flex items-center justify-center`):
- Backdrop click → dismiss
- Inner card: `bg-[#0a1128] border border-white/10 rounded-3xl p-6 max-w-sm w-full shadow-2xl`
- Animate: `scale: 0.9→1, y: 20→0`

**Content:**
- Header: emoji + area label + X close
- "How healthy is this area? (1-10)" (10px uppercase white/30)
- **Slider** (`type="range" min=1 max=10`): teal accent, h-2 rounded track
- Score display: current score (2xl bold) → color: `≥7=green-400, ≥4=amber-400, <4=red-400`
- Labels: "Crisis" (red) | "Okay" (amber) | "Thriving" (green)
- "Save Score" button: teal bg, full width, checkmark icon, spinner when loading

---

### 4. ADD FOCUS MODAL

Triggered by "Add Focus Area" button.

**Modal** (same overlay style):
- Inner card: `max-w-md`
- Header: Target icon (teal) + "Set Active Focus" + X close
- Subtitle: "Choose an area to focus on. You can have up to 3 active focus areas."
- Scrollable area list (`max-h-[250px] overflow-y-auto`): shows only areas NOT already in focus
  - Each: emoji + area label + health score, click to set focus immediately
- Optional goal input: "What's your goal for this area?" (placeholder, borderless style)

---

### 5. DASHBOARD DOMAIN METADATA

```typescript
const DOMAIN_META = {
  spiritual:       { label: 'Spiritual Life',   icon: '🕯️' },
  physical_health: { label: 'Physical Health',  icon: '💪' },
  personal:        { label: 'Personal Life',    icon: '🪞' },
  relationships:   { label: 'Key Relationships',icon: '❤️' },
  career:          { label: 'Career/Job',       icon: '📈' },
  business:        { label: 'Business',         icon: '🏢' },
  finances:        { label: 'Finances',         icon: '💰' },
};
```

---

### 6. ANIMATION SCHEDULE

All widgets use Framer Motion with `initial={{ opacity:0, y:20 }}` and `animate={{ opacity:1, y:0 }}`:

| Widget | Delay |
|---|---|
| Welcome Header | 0s |
| Activity Pulse | 0.05s |
| Radar + Right Column | 0.1s / 0.2s / 0.3s / 0.35s |
| Quick Actions | 0.4s |
| Score Trajectory | 0.45s |
| Practice Heatmap | 0.5s |
| Weekly Insight | 0.55s |
| Blueprint + Evolution | 0.6s / 0.65s |
| Journey + Connections | 0.7s / 0.75s |

---

### 7. SUPABASE SCHEMA

```sql
-- Life areas (one per user per domain)
create table life_areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  domain text not null,
  health_score integer default 5 check (health_score between 1 and 10),
  is_focus boolean default false,
  focus_goal text,
  last_updated timestamptz default now(),
  created_at timestamptz default now(),
  unique (user_id, domain)
);

-- Daily practice completions (for heatmap + streak)
create table practice_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  domain text,
  completed_at date not null default current_date,
  source text,
  created_at timestamptz default now()
);

-- Dashboard insights (weekly generated)
create table dashboard_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  insight_text text not null,
  domain text,
  week_of date,
  created_at timestamptz default now()
);

-- RLS
alter table life_areas enable row level security;
alter table practice_completions enable row level security;
alter table dashboard_insights enable row level security;

create policy "User owns life areas" on life_areas for all using (auth.uid() = user_id);
create policy "User owns completions" on practice_completions for all using (auth.uid() = user_id);
create policy "User owns insights" on dashboard_insights for all using (auth.uid() = user_id);
```

---

### 8. API ENDPOINTS

```
GET  /api/dashboard/summary         → areas[], activeFocusAreas[], needsAttention[], oneToday
GET  /api/dashboard/stats           → sparklines, heatmap, blueprint, evolution, journey, connections
POST /api/life-areas/:domain/score  → { score } — update health score
POST /api/life-areas/:domain/focus  → { focused: bool, goal?: string } — set/unset focus
POST /api/practice/complete/:domain → mark today's practice as complete
GET  /api/connect/requests          → pending connection requests (for badge count)
```

---

### 9. LOADING STATES

- **Full page loading:** centered `Loader2` teal spinner (`w-6 h-6 animate-spin`)
- **Widget loading:** each widget card shows 3 skeleton rows (`animate-pulse bg-white/5 rounded-lg`)
- **Action loading:** "Save Score" button shows `Loader2` micro-spinner inline

---

### 10. SEED DATA

Pre-populate for demo users:
- 7 life areas with varied scores (2–9) for the radar chart
- 2 active focus areas (e.g., career + physical_health)
- 1 "oneToday" task for the highest-focus area
- 60 days of practice completions (for heatmap)
- 2 weekly insights and 1 milestone
- Blueprint: 3 strengths, 2 developing traits, depth score 68%
- Journey: Level 3 "Reflector", 840 XP, next level 1000

---

### 11. INTEGRATION WITH GROUP 3 (ONBOARDING)

After onboarding completes:
- `PATCH /api/users/onboarding` marks `onboardingCompleted: true`
- User is redirected to `/home`
- Life areas are auto-initialized with default score 5 for all 7 domains

If user navigates to `/home` before completing onboarding → redirect back to `/welcome`.

---

## PROMPT END

# LOVABLE IMPORT PROMPT — Feature Group 9: Journey, Practice & Daily Check-In

> **Prerequisites**: Groups 1–8 deployed. Origin Seed traits from Group 3 required for Readiness signals.

---

## PROMPT START

Add the **OSIA Growth & Practice System** — four interconnected features that drive daily engagement, gamified progress, behavioural nudges, and reflective check-ins. This is the core retention and habit-formation engine of the platform.

- **JourneyPage** (`/journey`) — XP levels, badges, subscription credit engine, milestone map, pattern evolution
- **PracticeHubPage** (`/practice`) — Values discovery, practice nudges, log, blueprint refinement
- **CheckInPage** (`/checkin`) — Lightweight daily reflection entry point
- **ReadinessPage** (`/readiness`) — Signal-readiness map showing which layers are active vs. waiting

Design system: `#02050F` page, `#0A1128` cards, `#38A3A5` teal, Inter font, Framer Motion, Lucide React.

---

### 1. JOURNEY PAGE

**Route:** `/journey`

**Data (parallel fetch on mount):**
```
GET /api/journey/progress    → JourneyProgress
GET /api/journey/level       → LevelData
GET /api/journey/badges      → Badge[]
GET /api/journey/evolution   → EvolutionTimeline | null
GET /api/journey/reflection  → EvolutionReflection | null
GET /api/journey/next-steps  → { recommendations: string[] }
```

**Interfaces:**
```typescript
interface LevelData {
  level: number;
  title: string;             // e.g. "Explorer", "Architect"
  totalPoints: number;
  pointsToNextLevel: number;
  nextLevelTitle: string;
  perks: string[];
}
interface JourneyProgress {
  phaseName: string;
  completedMilestones: Milestone[];
  nextMilestones: Milestone[];
  activeDaysThisMonth: number;
  subscriptionCredits: {
    totalCredits: number;
    discountPercentage: number;   // 0–100
  };
}
interface Milestone {
  id: string;
  milestoneId?: string;
  name: string;
  description: string;
  badgeLevel: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlockedAt?: string;
}
interface EvolutionTimeline {
  patternChanges: {
    patternName: string;
    direction: 'improving' | 'declining' | 'stable';
    changePercent: number;
    currentStability: number;
  }[];
}
interface EvolutionReflection {
  pastSelf: string;
  presentSelf: string;
  keyEvolutions: { area: string; fromState: string; toState: string; significance: 'major' | 'minor' }[];
}
```

**Badge color system:**
```typescript
const BADGE_COLORS = {
  bronze:   'from-amber-700 to-amber-900',
  silver:   'from-gray-400 to-gray-600',
  gold:     'from-yellow-400 to-yellow-600',
  platinum: 'from-blue-300 to-purple-400',
}
const BADGE_GLOW = {
  bronze:   'shadow-[0_0_20px_rgba(217,119,6,0.3)]',
  silver:   'shadow-[0_0_20px_rgba(156,163,175,0.3)]',
  gold:     'shadow-[0_0_20px_rgba(234,179,8,0.4)]',
  platinum: 'shadow-[0_0_20px_rgba(168,85,247,0.4)]',
}
```

---

#### LAYOUT (`max-w-7xl mx-auto space-y-8 pb-12`)

**Header row (flex md:flex-row justify-between gap-6):**
- Left: "Growth Journey" (4xl bold) + "Your engagement rewards & growth milestones" (neutral-400)
- Right: **Level card** (`p-6 bg-gradient-to-br from-teal/10 to-purple/10 border-teal/30 min-w-[280px]`):
  - User avatar (64px circle, ring-2 ring-teal) + "Level {n}" (2xl bold) + TrendingUp icon (teal)
  - Level title (sm teal-300) + "N points earned" (xs neutral-500)
  - XP progress bar: `h-2 bg-white/10 rounded-full`, fill `bg-gradient-to-r from-teal to-purple`
  - Width: `(totalPoints / (totalPoints + pointsToNextLevel)) * 100%`
  - Label: "{pointsToNextLevel} pts to {nextLevelTitle}" (10px neutral-600)

**Subscription Credits Card** (`p-8 bg-gradient-to-br from-green/10 via-teal/5 to-purple/10 border-green/30`):
- Left: SVG circular progress (`w-32 h-32`, `-rotate-90`):
  - Track circle: `stroke rgba(255,255,255,0.1)` strokeWidth 12
  - Fill arc: `strokeDasharray="{discountPct * 3.52} 352"`, gradient green→purple, `strokeLinecap="round"`
  - Center label: `{discountPercentage}%` (3xl bold white) + "OFF" (xs neutral-400)
- Right: Gift icon + "Next Month's Discount" (2xl bold) + description
- Tier chips (25/50/75/100): earned = `bg-green/20 border-green/50 text-green-300`, locked = `bg-white/5`
- "{totalCredits} credits earned this month" (sm, teal-400 bold value)

**How to Earn Credits grid** (`grid-cols-2 md:grid-cols-4 gap-4`):

| Action | Credits | Icon |
|---|---|---|
| Daily Check-in | +2 | Calendar |
| Protocol Step | +3 | Zap |
| Team Message | +1 | Sparkles |
| Join Team | +5 | TrendingUp |
| Create Team | +10 | Star |
| Make Connection | +8 | Award |
| Refine Blueprint | +5 | TrendingUp |
| Daily Session | +1 | Calendar |

Each card: `p-4 bg-white/[0.02] hover:bg-white/[0.05]` — Icon (teal) + action name (sm white) + "+N credits" (xs green-400)

**Level Perks card** (only if `level.perks.length > 0`, purple border):
- Star icon (purple) + "Your Level {n} Perks"
- Perk chips: `bg-purple/20 text-purple-300`

**Stats row** (`grid grid-cols-2 md:grid-cols-3 gap-6`):
- Current Phase (teal icon, Sparkles)
- Milestones earned (purple, Award)
- Active Days this month (blue, Calendar)

**Evolution grid** (`md:grid-cols-2 gap-6`):

*Pattern Evolution card* (teal border, `from-teal/5`):
- TrendingUp + "Pattern Evolution"
- For each change (up to 4): colored dot (green=improving, amber=declining, neutral=stable) + pattern name + `±N%` + stability
- Empty: "Complete more Blueprint sessions to track pattern evolution."

*Reflection: Past vs Present card* (purple border, `from-purple/5`):
- Sparkles + "Reflection: Past vs Present"
- "THEN" box: `border-l-2 border-neutral-600`, pastSelf text (sm neutral-300)
- "NOW" box: `border-l-2 border-teal`, presentSelf text (sm white)
- Evolution chips: `bg-purple/20 text-purple-300` (major) or `bg-white/10 text-neutral-400` (minor), format: "{area}: {fromState} → {toState}"

**Next Steps Forward card** (green border, only if recommendations exist):
- Zap (green) + numbered items in `md:grid-cols-2 gap-3`
- Each: green circle number badge + step text (sm neutral-300)

**Milestone Map** (`relative`, vertical timeline line):
- Timeline line: `absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal/20 via-purple/20 to-transparent`
- "Milestone Map" (2xl bold) + "Check for New Milestones" outline sm button → `POST /api/journey/milestones/check`

*Completed milestones* (`pl-20`, `motion.div initial={{ opacity:0, x:-20 }}, stagger 0.1s`):
- Left badge: `w-16 h-16 rounded-2xl bg-gradient-to-br {BADGE_COLORS[level]} {BADGE_GLOW[level]}`, Award icon
- Card: `from-white/[0.05] to-transparent border-teal/30`
- Name + badge level chip (colored) + description + "Unlocked {date}" (teal, Check icon)

*Locked milestones* (next 3, `opacity-50 pl-20`):
- Left badge: `bg-white/5 border border-white/10`, Lock icon (neutral-600)
- Card: `bg-white/[0.02] border-white/10`
- Name (neutral-500) + badge level chip (neutral) + description (neutral-600)

**Badge Collection** (only if `badges.length > 0`):
- `grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4`
- Each badge: `motion.div whileHover={{ scale:1.05 }}`, gradient bg, glow, Award icon (w-12 white) + name (xs bold white)

---

### 2. PRACTICE HUB PAGE

**Route:** `/practice`

**Data (parallel fetch):**
```
GET /api/practice/values          → { values: Value[], discoveryCompleted: boolean }
GET /api/practice/nudges          → { nudges: Nudge[] }
GET /api/practice/log?days=30     → PracticeLog
GET /api/practice/summary         → PracticeSummary
```

**Interfaces:**
```typescript
interface Value {
  id: string;
  name: string;
  description?: string;
  tomorrowAction?: string;   // from Socratic discovery
  nudgeActivity?: string;
}
interface Nudge {
  id: string;
  valueId: string;
  title: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'situational';
  context: 'morning' | 'evening' | 'anytime';
  notifyAt?: string;          // "06:30" | "12:30" | "19:00" | ""
  isActive: boolean;
  streak?: number;
}
interface PracticeSummary {
  activeNudgesCount: number;
  todayCompleted: string[];   // nudge IDs completed today
  currentStreaks: { nudgeId: string; streak: number }[];
}
```

**3 render states:**
1. `!discoveryCompleted` → Discovery CTA
2. `discoveryCompleted && nudges.length === 0` → ValuesMap + Create Nudge CTA
3. Full hub (4 tabs)

---

#### STATE 1: Discovery CTA

Centered card (`max-w-md text-center`):
- Target icon (`w-16 h-16 rounded-2xl bg-teal/10 border border-teal/20 mx-auto mb-6`)
- "Discover Your Values" (2xl extrabold)
- "A reflective dialogue to uncover your core values — then build daily practices around them." (sm white/30)
- "Begin Discovery" button: `bg-gradient-to-r from-teal to-emerald`, Sparkles icon, → opens `SocraticDialogue`

---

#### SOCRATIC DIALOGUE COMPONENT

**Component:** `src/features/practice/components/SocraticDialogue.tsx`

**Props:** `onComplete: (values: DiscoveredValue[]) => void`, `onCancel: () => void`

A Groq-powered conversational value discovery:
- 5-7 turn dialogue, each turn: AI question + user text/chip response
- Questions explore: what drains energy, what matters most, friction points, ideal day, when most alive
- After final turn: `POST /api/practice/values/discover { responses[] }` → returns discovered values with nudgeActivity
- Loading spinner during AI response (`Loader2 animate-spin teal`)
- Progress dots at bottom (filled = completed turns)
- "Cancel" ghost button throughout

---

#### STATE 3: MAIN HUB — 4 tabs

**Tab bar** (`flex items-center gap-1 p-1 bg-white/[0.02] rounded-xl border border-white/5`):

| Tab | Icon | Description |
|---|---|---|
| practice | Target | Active nudges |
| refine | RefreshCw | Blueprint refinement |
| values | Sparkles | Values map |
| log | BookOpen | Practice history |

Active: `bg-teal/10 text-teal` | Inactive: `text-white/25`

**Header:** Target icon box (teal) + "Practice" (xl extrabold) + "{activeCount} active · {todayDone} done today · 🔥 {bestStreak}d best streak"
- "Add Nudge" button (Plus, top-right) → opens Create Nudge modal

---

#### TAB: PRACTICE → `NudgeManager`

**Component:** `src/features/practice/components/NudgeManager.tsx`

**Props:** `nudges`, `valueName(id)`, `todayCompleted`, `onComplete`, `onToggleActive`, `onDelete`

Nudge cards (`space-y-3`):
- Value name chip (10px teal) + nudge title (sm bold white)
- Context badge + frequency badge (neutral-500, xs)
- Streak: Flame icon (amber) + "{n}d streak" (if streak > 0)
- If completed today: green Check + "Done today" — no action buttons
- If not completed: "Complete" teal button (triggers optional reflection textarea, then `onComplete`)
- Toggle active switch + Delete X button (neutral-500)

Empty: "No active nudges. Add your first practice nudge." + "Add Nudge" button

---

#### TAB: REFINE → `BlueprintRefine`

**Component:** `src/features/practice/components/BlueprintRefine.tsx`

Two sections:
1. **Trait Feedback** — 3 trait cards (from `origin_seeds.traits`), each with Fits/Partially/Doesn't Fit buttons → `POST /api/claims/{traitId}/feedback`
2. **Add Signal** — Textarea for free-form reflection → `POST /api/signals { text, source: 'refinement' }`

---

#### TAB: VALUES → `ValuesMap`

**Component:** `src/features/practice/components/ValuesMap.tsx`

**Props:** `values: Value[]`, `nudgeCounts: Record<string, number>`

Grid of value cards (`grid-cols-2 md:grid-cols-3 gap-4`):
- Value name (lg bold) + nudge count badge (teal)
- Description (xs neutral-400)
- tomorrowAction (xs italic teal/60, if present)
- "Re-discover Values" ghost link at bottom → restarts Socratic dialogue

---

#### TAB: LOG → `PracticeLog`

**Component:** `src/features/practice/components/PracticeLog.tsx`

**Props:** `entries[]`, `totalCompletions`, `activeDays`

Stats strip: Total Completions + Active Days (sm teal values)

Entries list (grouped by date):
- Date divider (10px neutral-600 uppercase)
- Each entry: nudge title + value name chip + completion time + optional reflection (italic neutral-400)

---

#### CREATE NUDGE MODAL

`fixed inset-0 z-50 bg-black/60`, `AnimatePresence`:
Inner card: `bg-[#0A1128] border border-white/10 rounded-3xl p-6 max-w-md max-h-[85vh] overflow-y-auto`

**Linked Value chips** — all user values as toggle chips:
- Selected: `bg-teal/20 text-teal-400 border border-teal/40`, Check icon inline
- Unselected: `bg-white/[0.03] text-white/40 border border-white/5`

**Activity suggestions** (shown when value selected, pulled from `value.tomorrowAction` + generated generics):
- 6 suggestion chips: selected `bg-teal/20 text-teal-400`, unselected `bg-white/5 text-white/30`
- Generics pattern: "5 minutes of {value} reflection", "Practice {value} in one interaction", etc.

**Frequency pills:** daily | weekly | situational (3 equal pills)

**Context pills:** morning | evening | anytime (3 equal pills)

**Notification time chips:** 🌅 Morning (06:30) | ☀️ Midday (12:30) | 🌙 Evening (19:00) | ⏰ Off
- Selected: `bg-amber/15 text-amber-400 border border-amber/30`
- On time selection with notification API: `Notification.requestPermission()`

**Preview summary** (when valueId + title both set):
`p-3 bg-teal/5 border-teal/10` → "✨ {title} — {frequency}, {context} · 🔔 {notifyAt}"

**Create Nudge button:** full-width teal, `disabled:opacity-30` when incomplete

```
POST /api/practice/nudges { valueId, title, description, frequency, context, notifyAt }
```

---

### 3. DAILY CHECK-IN PAGE

**Route:** `/checkin`

**Layout:** `min-h-screen bg-[#02050F]`, PlexusBackground, `max-w-2xl mx-auto px-6 pt-8 pb-20`

**2 steps** (`AnimatePresence mode="wait"`, `opacity:0↔1, y:±20`):

**Step 1 — Type selection:**
- "What are you checking in about?" (4xl bold tracking-tight)
- "This is optional. A few words is enough." (xs neutral-500 italic)
- `grid-cols-2 md:grid-cols-3 gap-4` of 6 type cards:

| id | Label | Icon |
|---|---|---|
| conversation | A conversation | 💬 |
| decision | A decision | 🎯 |
| emotional_shift | An emotional shift | 🌊 |
| friction | A moment of friction | ⚡ |
| went_well | Something that went well | ✨ |
| other | Something else | 🌀 |

Card: `p-8 border-white/5 bg-[#0A1128]/40 hover:border-teal/30 flex flex-col items-center gap-4`
Emoji: `text-4xl grayscale group-hover:grayscale-0`
Label: `text-[10px] uppercase tracking-widest neutral-400 group-hover:text-white`
On click: `setSelectedType(id)` → step 'reflect'

**Step 2 — Reflection input:**
- Dynamic heading per type:
  - conversation → "What stood out in that conversation?"
  - decision → "Tell us about the decision."
  - emotional_shift → "What changed in your energy?"
  - friction → "Where did the friction come from?"
  - went_well → "What worked well?"
  - other → "What's on your mind?"
- "Short is better than detailed." (xs neutral-500 italic)
- Textarea: `min-h-[160px] bg-black/40 border-white/10 rounded-2xl p-6 text-xl text-white placeholder-neutral-700 resize-none focus:border-teal/50`

**Tags section** ("Anything you want to tag?"):
8 toggle chips (rounded-full):
- Energy up | Energy down | Felt aligned | Felt stuck | Avoided something | Said what mattered | Held back | Surprised myself
- Selected: `bg-teal border-teal text-white shadow-[0_0_15px_rgba(56,163,165,0.3)]`
- Unselected: `bg-white/5 border-white/10 text-neutral-500 hover:border-white/20`

**Footer (border-t pt-10 flex gap-4):**
- "Save check-in" primary (`flex-1 py-6 text-lg`)
- "Cancel" secondary → step 'type'
- Privacy notice: teal pulse dot + "This reflection stays private." (10px neutral-600 uppercase)

**On save:**
```
POST /api/checkin { type: selectedType, text, tags: selectedTags[] }
→ navigate('/home')
```
Earns +2 credits (handled server-side).

---

### 4. READINESS PAGE

**Route:** `/readiness`

**Layout:** `min-h-screen bg-[#02050F]`, PlexusBackground, `max-w-4xl mx-auto px-6 pt-8 pb-20`

**3 sections:** Now | Next | Later

```typescript
const sections = [
  { id: 'now',  label: 'Now',  color: '#38A3A5', description: 'Enough signal to explore meaningfully right now.' },
  { id: 'next', label: 'Next', color: '#ffffff', description: 'Close to becoming clear, but need a bit more context.' },
  { id: 'later',label: 'Later',color: '#404060', description: "Not ready yet — and that's okay." },
]
```

**Header:** "Where things stand." (4xl bold tracking-tight) + "Some areas are active now. Others need time or context." (xs neutral-500 italic)

**Section structure** (each `space-y-8`):
- Section heading: label (2xl black uppercase tracking-[0.2em]) in section color + full-width `h-px bg-white/5` divider
- Description (sm neutral-500)
- `md:grid-cols-2 gap-4` item cards:
  - "Later" items: `opacity-50 grayscale`
  - "Now" items: `whileHover={{ scale: 1.01 }}`
  - Card: `p-6 border-white/5 bg-[#0A1128]/40`, title (lg bold) + status badge + description (11px neutral-400)
  - "Now" items: "Explore →" ArrowUpRight link (10px teal, `hover:gap-2` transition) → `/layers/{slug}`

**Layer slug map** (title → URL):
- Decision Patterns → `/layers/decision_patterns`
- Energy & Recovery → `/layers/energy_recovery`
- Relational Dynamics → `/layers/relational_dynamics`

**Readiness info footer** (`pt-16 border-t border-white/5 text-center`):
- "How OSIA decides what's ready?" (10px bold white uppercase)
- "OSIA looks for repetition across time and context. When a pattern appears consistently — and you confirm or refine it — related areas become meaningful to explore." (xs neutral-500 max-w-xl)
- "You can't fall behind here. If life is quiet, your map stays steady." (sm teal italic)

---

### 5. SUPABASE SCHEMA

```sql
-- Journey progress
create table journey_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  level integer default 1,
  total_points integer default 0,
  phase_name text default 'Foundation',
  active_days_this_month integer default 0,
  subscription_credits integer default 0,
  discount_percentage integer default 0,
  updated_at timestamptz default now()
);

-- Badges / milestones
create table user_milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  milestone_id text not null,
  name text not null,
  description text,
  badge_level text check (badge_level in ('bronze','silver','gold','platinum')),
  unlocked_at timestamptz default now(),
  unique (user_id, milestone_id)
);

-- Values
create table user_values (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  description text,
  tomorrow_action text,
  nudge_activity text,
  discovery_completed boolean default false,
  created_at timestamptz default now()
);

-- Practice nudges
create table practice_nudges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  value_id uuid references user_values(id) on delete cascade,
  title text not null,
  description text,
  frequency text default 'daily' check (frequency in ('daily','weekly','situational')),
  context text default 'anytime' check (context in ('morning','evening','anytime')),
  notify_at text,
  is_active boolean default true,
  streak integer default 0,
  created_at timestamptz default now()
);

-- Practice completions
create table practice_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  nudge_id uuid references practice_nudges(id) on delete cascade,
  reflection text,
  completed_at timestamptz default now()
);

-- Daily check-ins
create table daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  type text not null,
  text text,
  tags text[] default '{}',
  created_at timestamptz default now()
);

-- RLS
alter table journey_progress enable row level security;
alter table user_milestones enable row level security;
alter table user_values enable row level security;
alter table practice_nudges enable row level security;
alter table practice_completions enable row level security;
alter table daily_checkins enable row level security;

create policy "Own journey" on journey_progress for all using (auth.uid() = user_id);
create policy "Own milestones" on user_milestones for all using (auth.uid() = user_id);
create policy "Own values" on user_values for all using (auth.uid() = user_id);
create policy "Own nudges" on practice_nudges for all using (auth.uid() = user_id);
create policy "Own completions" on practice_completions for all using (auth.uid() = user_id);
create policy "Own checkins" on daily_checkins for all using (auth.uid() = user_id);
```

---

### 6. API ENDPOINTS

```
GET  /api/journey/progress
GET  /api/journey/level
GET  /api/journey/badges
GET  /api/journey/evolution
GET  /api/journey/reflection
GET  /api/journey/next-steps
POST /api/journey/milestones/check          → { unlockedCount }

GET  /api/practice/values
POST /api/practice/values                   → save discovered values
POST /api/practice/values/discover          → { responses[] } → Groq analysis → values[]
GET  /api/practice/nudges
POST /api/practice/nudges                   → create nudge
PATCH /api/practice/nudges/:id              → { isActive } / update
DELETE /api/practice/nudges/:id
POST /api/practice/nudges/:id/complete      → { reflection? }
GET  /api/practice/log?days=30
GET  /api/practice/summary

POST /api/checkin                           → { type, text, tags[] } → +2 credits
GET  /api/readiness                         → section data from traits
```

---

### 7. ROUTING

```
/journey     → JourneyPage
/practice    → PracticeHubPage
/checkin     → CheckInPage
/readiness   → ReadinessPage
```

All require authentication (ProtectedRoute).

---

## PROMPT END

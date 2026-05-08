# LOVABLE IMPORT PROMPT — Feature Group 6: Insights & Patterns Engine

> **Instructions**: Copy everything below the "PROMPT START" line and paste it as a single prompt into Lovable.
> **Prerequisites**: Groups 1–5 must be deployed. Origin Seed / traits data from Group 3 (Onboarding) must be present.

---

## PROMPT START

Add the **OSIA Insights & Patterns Engine** — the intelligence layer that surfaces personalized psychological analysis from the user's trait data. This group covers four interconnected views:

1. **ThesisPage** (`/thesis`) — 7-section Personality Thesis with a markdown prose renderer
2. **PatternsPage** (`/patterns`) — Pattern signal cards with 3-way resonance feedback
3. **InsightsHubPage** (`/insights`) — Domain-specific "One Thing" insight hub across 7 life areas
4. **LayerDetail** (`/layers/:layerId`) — Deep-dive view for any of the 15 psychological layers

All four views share the OSIA design system: `#02050F` page, `#0A1128` cards, `#38A3A5` teal, Inter font, glassmorphism, Framer Motion.

---

### 1. THESIS PAGE

**Route:** `/thesis`

**Data:** `GET /api/thesis` → `PersonalityThesis`

```typescript
interface ThesisSection {
  sectionType: string;           // e.g. "foundational_overview"
  content: string;               // Markdown or plain prose
  sourcePatternIds: string[];    // e.g. ["PAT.IND.calm_decisive"]
  sourceClaimIds?: string[];
  wordCount: number;
}

interface PersonalityThesis {
  userId: string;
  generatedAt: string;           // ISO timestamp
  sections: ThesisSection[];     // 7 sections
  totalWordCount: number;
  patternCount: number;
  themeCount: number;
  stabilityIndex: number;        // 0.0–1.0
}
```

**Section metadata:**

```typescript
const SECTION_CONFIG = {
  foundational_overview:          { label: 'Foundational Overview',         icon: '◈', gradient: 'from-teal-500/20 via-cyan-500/10 to-transparent' },
  cognitive_emotional_blueprint:  { label: 'Cognitive & Emotional Blueprint',icon: '⬡', gradient: 'from-purple-500/20 via-violet-500/10 to-transparent' },
  core_strengths:                 { label: 'Core Strengths & Capacities',    icon: '◆', gradient: 'from-emerald-500/20 via-green-500/10 to-transparent' },
  friction_zones:                 { label: 'Friction Zones & Vulnerabilities',icon: '⬢', gradient: 'from-amber-500/20 via-orange-500/10 to-transparent' },
  behavioral_relational:          { label: 'Behavioral & Relational Style',  icon: '◇', gradient: 'from-rose-500/20 via-pink-500/10 to-transparent' },
  growth_trajectories:            { label: 'Growth Trajectories',             icon: '△', gradient: 'from-blue-500/20 via-indigo-500/10 to-transparent' },
  closing_reflection:             { label: 'Closing Reflection',              icon: '○', gradient: 'from-teal-500/20 via-teal-500/10 to-transparent' },
};
```

---

#### AMBIENT BACKGROUND

Three fixed gradient blobs (pointer-events-none):
- Top-right: `w-[600px] h-[600px] bg-teal-500/5 blur-[150px] animate-pulse` (8s)
- Bottom-left: `w-[500px] h-[500px] bg-purple-500/5 blur-[120px] animate-pulse` (12s, 2s delay)
- Center radial: `w-[800px] h-[800px] bg-gradient-radial from-teal-500/3 to-transparent`

---

#### LAYOUT (relative z-10, max-w-5xl mx-auto)

**Cross-nav pill** (same pattern as AppLayout nav, shared between Thesis and Patterns):
- "Thesis" → `/thesis` (active: teal pill)
- "Patterns" → `/patterns` (inactive: neutral-400 hover white)

**Hero Header (text-center, pt-8 pb-12):**
- Badge pill: teal pulse dot + "Module 1 • Personality Thesis" (10px uppercase tracking-[0.25em])
- H1: "Your Psychological" (gradient white→neutral-400) + line break + "Architecture" (gradient teal-400→cyan-400), 4xl–5xl font-black
- Subtitle: "A comprehensive analysis of your inner blueprint..." (neutral-400, sm, max-w-lg)

**Stats Row (flex justify-center gap-6 md:gap-12):**

4 stat boxes, each `w-16 h-16 rounded-2xl`:
| Stat | Value | Color |
|---|---|---|
| Stability | `Math.round(stabilityIndex * 100)%` | teal-400 |
| Patterns | `patternCount` | purple-400 |
| Themes | `themeCount` | cyan-400 |
| Words | `totalWordCount.toLocaleString()` | amber-400 |

Each box: gradient bg from color/20 to color/5, border color/20, hover border color/40.
Label: 10px uppercase neutral-500 tracking-widest below box.

**Section Navigation Tabs:**
- `flex flex-wrap gap-2`
- Active: `bg-gradient-to-r from-teal-500 to-teal-400 text-white shadow-lg shadow-teal-500/25`
- Inactive: `bg-white/5 text-neutral-400 hover:bg-white/10 border border-white/5`
- Icon: teal when active (scale 110 on group-hover)
- Label: hidden on mobile (show index number instead)
- Right side toggle: "Show All" / "Show Single" (xs teal-400 link)

---

#### SECTION CARD COMPONENT

Used for both single-section view and "show all" scrollable view:

**Outer wrapper (relative group):**
- Gradient overlay: `absolute inset-0 bg-gradient-to-br {config.gradient} rounded-3xl opacity-50 group-hover:opacity-70`

**Inner card (`bg-[#0A1128]/80 backdrop-blur-xl rounded-3xl border border-white/10`):**

**Header (px-8 py-6 border-b border-white/5):**
- Icon box: `w-12 h-12 rounded-2xl bg-gradient-to-br from-teal/30 to-teal/10 border border-teal/20`, symbol inside (xl teal-400)
- "Section {n} of 7" (10px uppercase neutral-500)
- Section label (xl bold white)

**Content (px-8 py-8 space-y-6):**

Content parser — `parseContentToParagraphs(content: string)`:
- If content has `\n`: parse line-by-line as markdown (headers `#/##/###`, list items `- / • / 1.`, blockquotes `>`, paragraphs)
- If plain prose: split on sentence boundaries `(?<=[.!?])\s+(?=[A-Z])`, group into 3-sentence paragraphs, break early on transitional words (However, Furthermore, Additionally, Moreover, In contrast, This, Consequently, Therefore, Your, You…)

Renderer:
- `header` (h2/h3/h4): `text-2xl/xl/lg font-bold text-white mt-8/6/5`
- `quote` (blockquote): left-border `border-l-2 border-teal/50 bg-teal/5`, opening `"` symbol (teal/30 2xl absolute)
- `list-item`: teal dot `w-1.5 h-1.5 rounded-full bg-teal mt-2.5` + text neutral-200
- `paragraph`: neutral-300, first paragraph gets `text-lg text-neutral-100 first-letter:text-4xl first-letter:font-bold first-letter:text-teal-400 first-letter:mr-1 first-letter:float-left first-letter:leading-none`

Inline formatting via `dangerouslySetInnerHTML`:
- `**text**` → `<strong class="text-white font-semibold">text</strong>`
- `*text*` → `<em class="text-teal-300">text</em>`
- `_text_` → `<em class="text-neutral-300">text</em>`

**Section Footer (px-8 py-4 border-t border-white/5 bg-white/[0.02]):**
- Only shown if `sourcePatternIds.length > 0`
- "Supporting Patterns" (9px uppercase neutral-500)
- Chips per ID: `px-3 py-1 text-[10px] bg-teal/10 text-teal-400 rounded-full border border-teal/20`
- ID display: strip `PAT.IND.` prefix, replace `_` with space

---

#### LOADING STATE
- Three-ring spinner: outer pulse ring + spinning border-t-teal + inner static ring (all w-20 h-20)
- "Loading your thesis" + "Assembling psychological architecture..." (sm neutral-300/500)

#### EMPTY / ERROR STATE
- Card `max-w-md`, heading (isNoData ? "Thesis Not Yet Generated" : "Thesis Not Ready")
- Description explaining what's needed
- "Return Home" button

#### FOOTER
- "View Insights Hub →" outline button → `/insights`
- Generation timestamp: `10px neutral-600`, full date+time format

---

### 2. PATTERNS PAGE

**Route:** `/patterns`

**Data:** Read directly from `userProfile.origin_seed_profile.traits` (already in auth context / Supabase profile).

**Trait interface:**
```typescript
interface UserTrait {
  traitId: string;      // e.g. "L01_CORE_DISPOSITION"
  layerId: number;
  score: number;        // 0–100
  confidence: number;   // 0.0–1.0
  description: string;  // Multi-paragraph, separated by \n\n
}
```

**Pattern data computed from traits:**
```typescript
const PATTERN_CARDS = [
  { title: 'Energy Orientation',  traitId: 'L02_ENERGY_ORIENTATION',    layerId: 2  },
  { title: 'Decision Logic',      traitId: 'L04_INTERNAL_FOUNDATION',    layerId: 4  },
  { title: 'Architectural Focus', traitId: 'L10_ARCHITECTURAL_FOCUS',    layerId: 10 },
]

// Summary card uses L01_CORE_DISPOSITION
// Confidence: trait.confidence > 0.8 → "Stable" else "Emerging"
// Density: traits.length > 10 → "High" else "Low"
```

Description parser for trait descriptions (split on `\n\n`):
```typescript
const formatDescription = (desc: string) => {
  const parts = desc.split('\n\n').filter(Boolean)
  return {
    insight:  parts[0] || 'Signal stabilizing...',
    showsUp:  parts.length > 1 ? [parts[1]] : ['Awaiting behavioral resonance...'],
    prompt:   parts.length > 2 ? parts[2].replace(/["\.]/g, '') : 'How does this manifest in your daily flow?'
  }
}
```

---

#### LAYOUT

**Ambient glows** (absolute top-right, bottom-left, teal/5 blur):
Same as ThesisPage.

**Cross-nav pill** (same component, Patterns tab active)

**Header (text-center space-y-2 mb-6):**
- "FOUNDATIONAL PATTERNS" (10px uppercase teal tracking-[0.6em])
- "Here's what's starting to emerge." h1 (3xl extrabold), period in teal
- "Your feedback shapes how your digital twin evolves." (xs neutral-400/70)

**Pattern Grid** (`grid grid-cols-1 lg:grid-cols-4 gap-5`):

**Summary Card (col 1):**
- Style: `border-teal/20 bg-teal/[0.02] hover:bg-teal/[0.04]`
- Teal pulse dot + "Resonance Summary"
- Italic summary text (xs neutral-300, quoted)
- 2×2 mini stats: Confidence (teal-400) + Density (white)

**3 Pattern Cards (cols 2–4):**
Each card: `bg-[#0A1128]/40 border hover:border-teal/30 transition-all duration-500 overflow-hidden`

Card content:
- Header row: title (10px uppercase teal-300/80) + "Verified Signal" badge (8px neutral-500)
- **Content** (`overflow-y-auto max-h scrollbar mask-fade-bottom`):
  - "HYPOTHESIS" label + insight text (sm neutral-300)
  - "EMERGENCE CONTEXT" label + bullet list (xs neutral-400, teal dots)
  - Border-t divider + "INNER PROMPT" label + italic teal/80 quote text
- **Feedback Row** (shrink-0 pt-4 border-t border-white/10):

  *Idle/Submitting state:* 3 flex-1 buttons:
  | Button | Color | Icon | Resonance |
  |---|---|---|---|
  | Matches | green-400 | Check | 'fits' |
  | Neutral | yellow-400 | Minus | 'partial' |
  | Doesn't Fit | red-400 | X | 'doesnt_fit' |
  Style: `rounded-xl bg-white/5 hover:bg-{color}/10 border hover:border-{color}/30` + `disabled:opacity-50`
  Show `Loader2 animate-spin` on the active button during submission.

  *Submitted state:* 
  - Left: Check icon + "{label} — shaping your twin" (10px teal)
  - Right: "Refine →" link (9px neutral-500 → teal-400, ArrowRight icon) → `/refinement`

**Feedback API:**
```
POST /api/claims/{traitId}/feedback
Body: { resonance: 'fits' | 'partial' | 'doesnt_fit', sources: ['patterns_page'] }
```

**Navigation Footer (mt-8 border-t pt-6 flex justify-between):**
- Left: "Your digital twin evolves as you interact." (10px neutral-500, max-w-200px)
- Right: "Skip" ghost link + "Merge with Digital Twin" primary button → `/home`

---

### 3. INSIGHTS HUB PAGE

**Route:** `/insights`

**Data:** `GET /api/insights/hub` → `CoreInsightsHub`

```typescript
interface DomainInsight {
  domain: string;          // e.g. "career"
  coreTheme: string;       // Summary of patterns (may have **bold** markdown)
  primaryChallenge: string;
  oneThing: string;        // The one actionable thing (may have **bold** markdown)
  appliedOutcome: string;  // Expected result of doing the one thing
}

interface CoreInsightsHub {
  userId: string;
  generatedAt: string;
  domainInsights: DomainInsight[];
  primaryFocusDomain: string;   // auto-expand on load
  coverageScore: number;        // 0.0–1.0
}
```

**Domain metadata (same 7 domains as Group 4):**
```typescript
const DOMAIN_ICONS  = { spiritual:'🕯️', physical_health:'💪', personal:'🪞', relationships:'❤️', career:'📈', business:'🏢', finances:'💰' }
const DOMAIN_LABELS = { spiritual:'Spiritual & Purpose', physical_health:'Physical & Health', personal:'Personal Development', relationships:'Relationships', career:'Career', business:'Business & Leadership', finances:'Finances' }
```

---

#### LAYOUT

**Background glows** (same teal/5 pattern)

**Header (text-center mb-8):**
- "Module 2" (10px uppercase teal tracking-[0.6em])
- "Core Insights Hub." (3xl extrabold white, period teal)
- '"The One Thing" for each life domain' (xs neutral-400/70)

**Coverage Score (flex justify-center mb-8):**
- `px-8 py-4 bg-teal/10 rounded-xl border border-teal/20`
- "COVERAGE" (9px uppercase neutral-500) + `{Math.round(coverageScore * 100)}%` (2xl black teal-400)

**Domain Grid** (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto`):

Each domain card (clickable to expand/collapse):
- Base: `border-white/10 hover:border-teal/30 cursor-pointer transition-all duration-300`
- Primary domain: `border-teal/50 ring-2 ring-teal/20`
- Expanded: spans `md:col-span-2 lg:col-span-3`

**Card header:**
- Domain emoji + domain label (sm bold white)
- "Primary Focus" badge (teal, 9px, only for `primaryFocusDomain`)

**Core Theme:**
- `text-xs neutral-300 leading-relaxed mb-3`
- Render `**text**` → `<strong class="text-white">text</strong>` via dangerouslySetInnerHTML

**Expanded content** (AnimatePresence or `animate-fadeIn`, border-t pt-4 mt-4):
- "Primary Challenge" label + challenge text (sm neutral-300)
- "✨ The One Thing" teal box (`bg-teal/10 rounded-lg p-4 border border-teal/20`):
  - Label: 9px teal-400 uppercase
  - Text: sm white font-medium, `**text**` → teal-400 bold
  - Expected: xs neutral-400 italic

**Expand indicator:** `▼ Expand` / `▲ Collapse` (10px neutral-500 centered)

**Auto-expand:** On load, `setExpandedDomain(hub.primaryFocusDomain)`

**Empty/Error state:**
- "Insights Not Yet Generated" + "✨ Generate Now" primary button → calls `POST /api/insights/regenerate`
- Falls back to "Return Home" if not regeneratable

**Navigation Footer (mt-8 flex justify-center gap-4):**
- "← View Thesis" outline button → `/thesis`
- "View Connectors →" primary button → `/connect`

---

### 4. LAYER DETAIL PAGE

**Route:** `/layers/:layerId`

**Layer ID mapping** (URL slug → system trait ID):
```typescript
const LAYER_ID_MAPPING = {
  decision_patterns:    3,   // COGNITIVE_METHOD
  energy_recovery:      2,   // ENERGY_ORIENTATION
  relational_dynamics:  7,   // RELATIONAL_STANCE
  communication_style:  11,  // SOCIAL_RESONANCE
  growth_edge:          8,   // TRANSFORMATIVE_POTENTIAL
}
```

**15 full layer content objects** — each has:
- `name`, `definition`, `summary`
- `insights[]`: `{ title, status, text, showsUpAs[], reflectionQ }`
- `experiment`: `{ prompt, whyItHelps }`

Include all 15 layers from the complete layer library (identity_core, foundational_archetypes, motivational_drivers, processing_patterns, creative_expression, pressure_response, emotional_safety, leadership, communication, values_relationships, trust_commitment, group_presence, integration, adaptability, change_navigation) **plus** the 5 navigation-specific layer IDs (decision_patterns, energy_recovery, relational_dynamics, communication_style, growth_edge).

**Dynamic data overlay:** If user has a matching trait in `origin_seeds.traits` (by `layerId`):
- Override `summary` with `trait.description`
- Show confidence badge: `Math.round(trait.confidence * 100)%`
- Status: confidence > 80% → "Stable", else "Developing"

---

#### LAYOUT (`min-h-screen bg-[#02050F]`, PlexusBackground canvas behind, `pt-8 pb-20 max-w-4xl mx-auto px-6`)

**Framer Motion wrapper:** `initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}`

**Hero Section:**
- H1: layer name (4xl bold)
- Status badge: `text-[10px] uppercase tracking-widest px-2 py-1 rounded bg-white/10 text-white` (Stable/Developing/Emerging)
- Definition paragraph (lg neutral-400 leading-relaxed)

**What's Showing Up Section:**
- "WHAT'S SHOWING UP" (10px teal uppercase tracking-widest)
- Summary text (xl white font-medium leading-relaxed)
- "Show contributing signals" ghost button (HelpCircle 14px icon) — on click: shows toast "Showing {n} signal tokens that contributed to this summary."

**Insights Grid (`md:grid-cols-2 gap-6`):**
Each insight card (`p-8 border-white/5 bg-[#0A1128]/40`):
- Header: insight title (lg bold white) + status badge (9px uppercase neutral-500)
- Insight text (sm neutral-400 italic leading-relaxed)
- "OFTEN SHOWS UP AS:" (9px neutral-600 uppercase) + bullet list (xs neutral-500, teal dot)
- Divider `border-t border-white/5`
- "REFLECTION PROMPT:" (9px teal uppercase) + question (xs white font-medium)
- Feedback row: 3 flex-1 pill buttons: "Fits" / "Somewhat" / "No"
  - Style: `rounded-lg border border-white/5 bg-white/[0.02] hover:border-teal/30 hover:text-white text-[10px] uppercase tracking-widest neutral-500`
  - On click: `POST /api/layers/{layerId}/feedback { insightId, feedback }`
  - Show success toast: "Feedback captured: {label}"

**Experiment Section:**
Full-width card (`p-10 border-white/5 bg-teal/[0.03]`):
- "SOMETHING TO TRY" (10px teal uppercase tracking-[0.3em])
- Experiment prompt (2xl bold tracking-tight)
- "Why this helps:" (bold teal uppercase) + explanation (sm neutral-400)
- "I'll try this" primary button → `POST /api/protocols { prompt, layerId, status: 'active' }` + request browser notification permission + show Notification API notification: "OSIA Ritual Activated"
- "Not now" secondary button → `POST /api/protocols { ... status: 'skipped' }`

**Footer (border-t pt-10 flex justify-between):**
- "Review another layer" ghost button (10px uppercase neutral-500)
- "As you interact with this layer, its confidence may increase, decrease, or split." (9px neutral-700 italic)

**Toast system** (`useToast` hook): success/info/error variants, auto-dismiss 3s

---

### 5. SUPABASE SCHEMA

```sql
-- AI-generated thesis storage
create table personality_thesis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  generated_at timestamptz default now(),
  sections jsonb not null default '[]',
  total_word_count integer default 0,
  pattern_count integer default 0,
  theme_count integer default 0,
  stability_index decimal default 0,
  updated_at timestamptz default now()
);

-- Domain-specific insights hub
create table insights_hub (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  generated_at timestamptz default now(),
  domain_insights jsonb not null default '[]',
  primary_focus_domain text,
  coverage_score decimal default 0,
  updated_at timestamptz default now()
);

-- Pattern resonance feedback
create table claim_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  trait_id text not null,
  resonance text check (resonance in ('fits', 'partial', 'doesnt_fit')),
  sources text[] default '{}',
  created_at timestamptz default now()
);

-- Layer-level insight feedback
create table layer_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  layer_id text not null,
  insight_id text not null,
  feedback text not null,
  created_at timestamptz default now()
);

-- User rituals / protocols
create table user_protocols (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  layer_id text,
  prompt text not null,
  status text default 'active' check (status in ('active', 'skipped', 'completed')),
  activated_at timestamptz,
  created_at timestamptz default now()
);

-- RLS
alter table personality_thesis enable row level security;
alter table insights_hub enable row level security;
alter table claim_feedback enable row level security;
alter table layer_feedback enable row level security;
alter table user_protocols enable row level security;

create policy "User owns thesis" on personality_thesis for all using (auth.uid() = user_id);
create policy "User owns hub" on insights_hub for all using (auth.uid() = user_id);
create policy "User owns claim feedback" on claim_feedback for all using (auth.uid() = user_id);
create policy "User owns layer feedback" on layer_feedback for all using (auth.uid() = user_id);
create policy "User owns protocols" on user_protocols for all using (auth.uid() = user_id);
```

---

### 6. SUPABASE EDGE FUNCTIONS

**`supabase/functions/generate-thesis/index.ts`:**
- Auth-verify → load `origin_seeds.traits` for user
- Call Groq (llama3-8b-8192) with traits data as context
- Generate 7 thesis sections with specific prompts per section type
- Parse response → store in `personality_thesis`
- Return thesis JSON

**`supabase/functions/generate-insights/index.ts`:**
- Auth-verify → load `origin_seeds` + `life_areas` for user
- For each of 7 life domains, call Groq to generate: coreTheme, primaryChallenge, oneThing, appliedOutcome
- Determine primaryFocusDomain (lowest health score OR most active focus)
- Store in `insights_hub` + return

**Client endpoints:**
```
GET  /api/thesis                     → fetch PersonalityThesis (or 404 if not generated)
POST /api/thesis/generate            → trigger Edge Function generation
GET  /api/insights/hub               → fetch CoreInsightsHub
POST /api/insights/regenerate        → trigger re-generation
POST /api/claims/:traitId/feedback   → { resonance, sources }
POST /api/layers/:layerId/feedback   → { insightId, feedback }
POST /api/protocols                  → { prompt, layerId, status }
```

---

### 7. ROUTING

```
/thesis         → ThesisPage
/patterns       → PatternsPage
/insights       → InsightsHubPage
/layers/:layerId → LayerDetail
```

All require authentication (wrap in `ProtectedRoute`).
`/layers/:layerId` also uses `PlexusBackground` component (carried over from Group 4).

---

### 8. ANIMATION

| Element | Animation |
|---|---|
| ThesisPage hero | `opacity:0→1, y:20→0, delay:0.1s` |
| Stats row items | `stagger 0.05s each` |
| Section tab buttons | `opacity:0→1, x:-10→0, stagger 0.03s` |
| Section card (single) | `opacity:0→1, y:20→0` on `activeSection` change |
| Pattern cards | `opacity:0→1, y:20→0, stagger 0.1s` |
| Domain card expand | `height:auto` transition or AnimatePresence height animation |
| LayerDetail | `motion.div opacity:0→1, y:20→0` wraps entire page |
| Feedback submitted | `Check` icon scales in with spring animation |

---

## PROMPT END

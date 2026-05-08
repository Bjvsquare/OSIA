# LOVABLE IMPORT PROMPT — Feature Group 10: Blueprint, Digital Twin & Evolution

> **Prerequisites**: Groups 1–9 deployed. `origin_seeds`, `layer_feedback`, and `claim_feedback` tables from Groups 3 & 6.

---

## PROMPT START

Add the **OSIA Blueprint & Digital Twin** system — the living psychological model at the heart of the platform. This group covers the evolving symbolic visual representation of the user (Digital Twin), the Blueprint profile refinement workflow, the pattern evolution timeline, and the connected 15-layer library. These features make OSIA's intelligence feel alive, personalized, and growing.

Design system: `#02050F` page, `#0A1128` cards, `#38A3A5` teal, Inter font, Framer Motion, Lucide React.

---

### 1. DIGITAL TWIN PAGE

**Route:** `/twin`

**Component:** `src/features/twin/DigitalTwin.tsx`

**Data:**
```
GET /api/twin/state   → TwinState
GET /api/twin/traits  → { traits: Trait[], phase: string }
```

```typescript
interface TwinState {
  phase: 'seed' | 'forming' | 'crystallizing' | 'mature';
  evolutionScore: number;    // 0–100
  activeTraits: string[];
  dominantLayer: string;
  auraColor: string;         // hex
  resonanceFrequency: number; // 0.0–1.0
  lastEvolved: string;
}
```

**Layout:** `min-h-screen bg-[#02050F]`, PlexusBackground, `max-w-4xl mx-auto px-6 pt-8 pb-20`

**Header:** "Your Living Blueprint" (4xl bold tracking-tight) + "An evolving model of how you actually function." (xs neutral-500 italic)

**Twin Visualization** (`relative mx-auto w-64 h-64`):
- Central orb (SVG): 3 concentric animated circles
  - Outer: `stroke: auraColor, opacity:0.2, stroke-dasharray`, slow clockwise rotation
  - Middle: `stroke: auraColor, opacity:0.4`, counter-clockwise
  - Inner fill: `fill: auraColor, opacity:0.8`, gentle pulse (`animate-pulse`)
- Phase label below: `{phase.toUpperCase()}` (12px teal uppercase tracking-widest)
- Evolution score ring: `strokeDasharray="{evolutionScore * 5.03} 503"` (circumference of r=80)

**Dominant Layer badge** (below orb): active layer name + Sparkles icon (teal)

**Phase progress bar** (4 phases as milestones):
- Phases: seed → forming → crystallizing → mature
- Bar: `h-2 bg-white/10 rounded-full`, fill stops at current phase (25/50/75/100%)
- Labels below: each phase name, current = teal

**Active Traits cloud** (wrapping chips):
- Each trait: `px-3 py-1.5 rounded-full text-xs border`
- Teal chips for top 3 strongest; neutral for rest

**Evolution timeline strip** (last 5 events, small horizontal scroll):
- Each event card: `px-4 py-3 bg-white/5 rounded-xl border border-white/5 shrink-0`
- Date + event label (xs neutral-400)

**"Refine Blueprint" CTA button** → `/practice?tab=refine` (teal, full-width, RefreshCw icon)

---

### 2. TWIN RENDERER COMPONENT

**Component:** `src/features/twin/TwinRenderer.tsx`

**Props:** `twinState: TwinState`, `size?: number` (default 200), `animate?: boolean` (default true)

Reusable visual used across Home Dashboard widget and Twin page.

```typescript
// Animation config
const PHASE_ANIMATIONS = {
  seed:          { pulseSpeed: 3, ringCount: 1, opacity: 0.5 },
  forming:       { pulseSpeed: 2, ringCount: 2, opacity: 0.65 },
  crystallizing: { pulseSpeed: 1.5, ringCount: 3, opacity: 0.8 },
  mature:        { pulseSpeed: 1, ringCount: 3, opacity: 1.0 },
}
```

- SVG `viewBox="0 0 200 200"` — scalable
- Outer glow ring: `filter: blur(20px)`, auraColor fill
- 3 rings with `animateTransform` (clockwise/counter-clockwise alternating)
- Central orb with user's first initial (bold white)

---

### 3. BLUEPRINT REFINE — Trait Feedback Loop

**Component:** `src/features/practice/components/BlueprintRefine.tsx`
(Referenced in PracticeHubPage → Refine tab)

**Data:**
```
GET /api/blueprint/traits-for-review  → { traits: TraitForReview[] }
GET /api/blueprint/signals-prompt     → { prompt: string }
```

```typescript
interface TraitForReview {
  id: string;
  name: string;
  description: string;
  confidenceScore: number;   // 0–100
  source: 'origin_seed' | 'layer_feedback' | 'pattern';
  lastFeedback?: 'fits' | 'partial' | 'doesnt_fit';
}
```

**Trait review cards** (space-y-4):
- Trait name (sm bold white) + confidence badge (`{score}%`, teal if > 70, amber if 50–70, neutral if < 50)
- Source chip: "From onboarding" / "From layer feedback" / "From patterns" (10px neutral-500)
- Description (xs neutral-400)
- 3 feedback buttons:
  - "Fits" (teal): `POST /api/claims/{traitId}/feedback { response: 'fits' }`
  - "Partially" (amber): `{ response: 'partial' }`
  - "Doesn't Fit" (red ghost): `{ response: 'doesnt_fit' }`
- After selection: button highlights, +3 credits toast, card fades out after 1s

**Signal input section:**
- Textarea: "Add a raw signal — describe a recent experience, decision, or pattern you noticed." (placeholder)
- "Submit Signal" button → `POST /api/signals { text, source: 'refinement' }`
- Success: "+5 credits earned" toast (green)

**Footer note:** "Your feedback directly reshapes your blueprint. Patterns confirmed more than once carry more weight." (10px neutral-600)

---

### 4. PATTERN EVOLUTION TIMELINE PAGE

**Route:** `/journey/timeline`

**Component:** `src/features/journey/TimelinePage.tsx`

**Data:**
```
GET /api/journey/evolution-timeline  → { events: EvolutionEvent[], summary: string }
```

```typescript
interface EvolutionEvent {
  id: string;
  type: 'trait_shift' | 'layer_unlock' | 'milestone' | 'connection' | 'practice_streak';
  title: string;
  description: string;
  timestamp: string;
  significance: 'major' | 'minor';
  relatedLayer?: string;
  changeData?: { from: string; to: string };
}
```

**Layout:** `min-h-screen bg-[#02050F]`, `max-w-3xl mx-auto px-6 pt-8 pb-20`

**Header:** "Your Evolution" (4xl bold) + "A record of how you've shifted over time." (xs neutral-500 italic)

**Timeline** (`relative`):
- Vertical gradient line: `absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal/40 to-transparent`
- Each event (`pl-16 relative mb-8`):
  - Left icon box (40px absolute left-0):
    - `trait_shift`: TrendingUp (teal)
    - `layer_unlock`: Lock→Unlock (purple)
    - `milestone`: Award (gold)
    - `connection`: Users (sky)
    - `practice_streak`: Flame (amber)
  - Major events: `border-teal/30 bg-teal/[0.03]`; minor: `border-white/5 bg-white/[0.02]`
  - Title (sm bold white) + timestamp (10px neutral-600, relative)
  - Description (xs neutral-400)
  - Change chip: `{changeData.from} → {changeData.to}` (if present, emerald)
  - relatedLayer: linked chip → `/layers/{slug}`

**AI Summary card** (teal border, top):
- Sparkles icon + "YOUR EVOLUTION STORY" (10px uppercase)
- AI-generated paragraph (sm neutral-200 italic)

**Empty state:** "Your evolution timeline will appear as patterns emerge and shift." + "Begin Check-in" teal button

---

### 5. SUPABASE SCHEMA

```sql
-- Digital twin state
create table twin_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  phase text default 'seed' check (phase in ('seed','forming','crystallizing','mature')),
  evolution_score integer default 0,
  active_traits text[] default '{}',
  dominant_layer text,
  aura_color text default '#38A3A5',
  resonance_frequency numeric default 0.0,
  last_evolved timestamptz default now(),
  updated_at timestamptz default now()
);

-- Evolution events
create table evolution_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  type text not null,
  title text not null,
  description text,
  significance text default 'minor' check (significance in ('major','minor')),
  related_layer text,
  change_data jsonb,
  created_at timestamptz default now()
);

-- RLS
alter table twin_states enable row level security;
alter table evolution_events enable row level security;
create policy "Own twin" on twin_states for all using (auth.uid() = user_id);
create policy "Own events" on evolution_events for all using (auth.uid() = user_id);
```

---

### 6. API ENDPOINTS

```
GET  /api/twin/state
GET  /api/twin/traits
GET  /api/blueprint/traits-for-review
GET  /api/blueprint/signals-prompt
GET  /api/journey/evolution-timeline
POST /api/signals                        → { text, source }
POST /api/claims/:traitId/feedback       → { response: 'fits'|'partial'|'doesnt_fit' }
```

---

### 7. ROUTING

```
/twin              → DigitalTwin page
/journey/timeline  → TimelinePage
/practice          → tab=refine shows BlueprintRefine (Group 9)
```

---

## PROMPT END

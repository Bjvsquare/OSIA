# LOVABLE IMPORT PROMPT — Feature Group 3: Onboarding & Origin Seed

> **Instructions**: Copy everything below the "PROMPT START" line and paste it as a single prompt into Lovable.
> **Prerequisites**: Group 1 (Admin Dashboard) and Group 2 (Auth) must be deployed first.

---

## PROMPT START

Add the complete **OSIA Onboarding Flow** to the existing app. This is the first-run experience that introduces users to the platform, collects consent, gathers personality signals, and generates their first OSIA Blueprint hypothesis. The flow is multi-stage, state-managed, privacy-first, and deeply animated. It culminates in the user's "Digital Twin" being initialized.

Continue using the OSIA design system throughout: `#02050F` page background, `#0A1128` cards, `#38A3A5` teal accent, Inter font, glassmorphism cards, pill buttons, Framer Motion animations, Lucide React icons.

---

### 1. ONBOARDING STATE MANAGEMENT

Create an `OnboardingContext` with a reducer and provider that persists to `localStorage` key `onboardingState`.

**State Shape:**
```typescript
interface OnboardingState {
  currentStageId: string;           // e.g. 'BLUEPRINT'
  completedStages: string[];
  answers: Record<string, Answer>;  // Keyed by question_id
  consentLedger: ConsentEntry[];
  sessionId: string;                // UUID, set on mount
  events: EventSchema[];            // Append-only audit log
}

interface Answer {
  user_id: string;
  question_id: string;
  answered_at: string;
  value: any;
  confidence?: string;
  derived?: Record<string, any>;
}

interface ConsentEntry {
  entry_id: string;
  user_id: string;
  domains: {
    account?: boolean;
    personal_twin?: boolean;
    relational_connect?: boolean;
    team_org?: boolean;
    research_validation?: boolean;
  };
  granted: boolean;
  policy: string;
  occurred_at: string;
}

interface EventSchema {
  event_id: string;
  event_name: string;
  occurred_at: string;
  user_id: string;
  session_id: string;
  screen_id: string;
  consent_snapshot: Record<string, any>;
  properties: Record<string, any>;
}
```

**Reducer Actions:**
- `SET_STAGE` — Change `currentStageId`
- `COMPLETE_STAGE` — Add stage to `completedStages`
- `SET_ANSWER` — Store/update an answer
- `UPDATE_CONSENT` — Add a `ConsentEntry` to ledger
- `RECORD_EVENT` — Append to events log

**Stage Sequence:**
```
BLUEPRINT → DEEPENING → RELATIONAL_CONNECT → TEAM_CONTEXT → INTEGRATION_RITUALS → RENEWAL_EXIT
```

**Visibility Rules (consent-gated stage skipping):**
- `RELATIONAL_CONNECT` — only if `consentLedger` has `relational_connect: true` AND `BLUEPRINT` is completed
- `TEAM_CONTEXT` — only if `consentLedger` has `team_org: true`

---

### 2. ONBOARDING FLOW ROUTER

The main `OnboardingFlow` component manages URL-based routing across stages.

**Routes:**
- `/welcome` — Entry point: ExpectationsScreen → ConsentScreen → OriginSyncScreen
- `/onboarding` — Main stage loop (question rendering)
- `/onboarding/q/:questionId` — Individual question URLs
- `/insight/first` — Hypothesis testing after signals

**Logic on `/welcome`:**
1. If `consentLedger` is empty → show `ExpectationsScreen`
2. After expectations → show `ConsentScreen`
3. After consent → if `origin_seed_profile` already has traits OR `OSIA_origin_sync_done` in sessionStorage → skip to `/onboarding`, else show `OriginSyncScreen`
4. On returning with consent already done → skip directly to `BLUEPRINT` stage

**On stage complete:**
- Save completed stage, advance to next eligible stage
- If `RENEWAL_EXIT` reached → navigate to `/home`
- If no more stages → navigate to `/home`

**"Save & Exit"** — Record event and navigate to `/home`, resuming later from stored state.

---

### 3. SCREEN: ExpectationsScreen

**Route:** First screen at `/welcome`

**Layout:** Full-page centered, max-w-2xl

**Content:**
- OSIA logo (h-8, 80% opacity)
- "What OSIA actually is." heading (4xl bold white, tracking-tight)
- 3 expectation cards in a grid (2-col on desktop):
  - **Card 1:** Eye icon (teal) — "A Pattern Mirror" — "OSIA reflects patterns in how you think, respond and relate. Not a diagnosis. Not a label."
  - **Card 2:** Shield icon (teal) — "Your Data, Your Rules" — "Every feature requires your explicit consent. You can revoke, export, or delete at any time."
  - **Card 3:** Zap icon (amber) — "Evolves With You" — "Your Blueprint deepens as you engage. Early signals are marked as emerging — nothing is fixed."
- "I understand — let's begin" primary button (full width, large, teal glow)
- Footer: "~5 minutes to get your first insights" (10px neutral-500 uppercase)

---

### 4. SCREEN: ConsentScreen

**Route:** Second step at `/welcome`

**Layout:** 2-column grid (visual left, card right) on desktop, stacked on mobile

**Left Column (Visual):**
- "Data Sovereign Protocol" teal pill badge (Shield icon)
- Heading: "Control your" + line break + "cognitive footprint." (teal highlighted)
- Subtitle about radical transparency
- Two feature cards:
  - ✓ "Full Data Ownership" — export/delete anytime
  - ✓ "Zero Third-Party Sharing" — never sold or shared

**Right Column (Card: `bg-[#0a1128]/60 backdrop-blur-xl`):**
- "Platform Agreement" label (10px uppercase neutral-500)
- Scrollable agreement text (h-64, thin scrollbar, font-mono text-xs) containing 5 sections:
  1. Core Participation — Digital Twin processing consent
  2. Relational Connectivity — mutual consent for connections
  3. Organisational Ethics — team data anonymisation
  4. Research & Improvement — anonymised telemetry only
  5. Data Rights — right to deletion, export, human intervention
- **Consent Toggle:**
  - Animated toggle switch: white/10 → teal-500 with glow on active
  - Toggle handle slides right when enabled
  - Label: "I accept the OSIA Data & Ethics Policy"
  - Sub-label: "Agreement is required to initialize your Digital Twin"
- **"INITIALIZE OSIA" button** (primary, full-width, large): disabled + grayscale until toggled, full teal glow when enabled
- Links row: T&CS | PRIVACY | ETHICS (each opens legal modal)

**Legal Modal** (click T&CS/Privacy/Ethics):
- Full-screen overlay (black/70, backdrop-blur)
- `max-w-2xl max-h-[85vh]` modal card
- Sticky header with title + X close button
- Scrollable content body
- Sticky footer with "Close" button

**Legal Content to include:**

*Terms & Conditions:* 6 sections — Acceptance, Account Responsibilities, Intellectual Property, Service Availability, Limitation of Liability, Termination

*Privacy Policy:* 5 sections — Data Collection (account info, birth data, signal responses, usage patterns; NOT browsing/third-party), Data Processing (encrypted, derived patterns not raw data), Data Sharing (never sold), Your Rights (access/export/correct/revoke/delete), Security

*Ethics Framework:* 5 sections — Core Philosophy (hypotheses not diagnoses), Consent & Autonomy (granular, revocable, transparent), No Harm Principle (never expose to employers without consent), Bias & Fairness (audits, flag mechanism), Human Override (user always wins)

**On Continue:** Record `consent_updated` event + `UPDATE_CONSENT` action with all 4 domains as `true`, call `refreshProfile()`, advance to next step.

---

### 5. SCREEN: OriginSyncScreen

**Purpose:** Loading screen while the foundational blueprint processes in the background.

**Layout:** Full-page centered, `min-h-screen bg-[#02050F]`

**Content:**
- Animated orb: 160×160px rounded-full, `bg-[#38A3A5]/20`, with `blur-3xl` diffuse glow behind it, slow pulse animation
- "Initialising your OSIA." heading (3xl bold, tracking-tight, teal period)
- Progress steps list (appear one-by-one with staggered 800ms delay each):
  1. ✓ "Origin signals locked" (green)
  2. ✓ "Pattern engine engaged" (green, 800ms delay)
  3. ⟳ "Generating your first blueprint..." (teal pulse, 1600ms delay)
  4. ○ "Calibrating confidence thresholds" (neutral, 2400ms delay)
- After 3-second auto-complete → call `onComplete()` prop

**Note:** This is a UX loading screen. The real blueprint generation happens asynchronously on the backend.

---

### 6. SCREEN: SignalsEntryScreen

**Purpose:** Word-selection exercise to capture initial personality signals.

**Route:** Renders within BLUEPRINT stage

**Header:**
- OSIA logo (h-6, 80% opacity)
- "Let's start with a few small signals." heading (4xl extrabold, teal period)
- "There are no right answers here. Share what feels easy — you can skip anything." (sm neutral-400)
- "Step 1 of 3 — ~2 minutes" (10px uppercase neutral-500)

**4 Signal Buckets** (2×2 grid, each in a glassmorphism card):

| Bucket | Question | Limit | Word Options |
|---|---|---|---|
| `best` | "When you're at your best, which words fit you?" | 5 | Calm, Curious, Direct, Warm, Focused, Playful, Grounded, Decisive, Reflective, Open, Independent, Collaborative |
| `energize` | "What tends to energise you?" | 3 | Open-ended conversations, Clear goals, Creative problem-solving, Structure and routines, Autonomy, Collaboration, Learning something new, Helping others, Quiet focus time |
| `pressure` | "When under pressure, which words tend to show up?" | 5 | Withdrawn, Overthinking, Impatient, Reactive, Guarded, Avoidant, Controlling, Anxious, Blunt, Rigid, Self-critical, Tense |
| `drain` | "What tends to drain you?" | 3 | Ambiguity without context, Conflict avoidance, Constant urgency, Micromanagement, Unclear expectations, Over-socialising, Isolation, Repetitive tasks, High emotional tension |

**Tag Button Styling (`.tag-glow`):**
```
px-4 py-2 rounded-full border border-white/10 bg-white/5
text-xs font-bold text-[#757575] transition-all duration-300
hover:border-white/20 hover:text-white

.tag-glow-active:
bg-[#38A3A5]/10 border-[#38A3A5] text-white
shadow-[0_0_12px_rgba(56,163,165,0.3)]
```

**Selection Counter** (per bucket): `N/max selected` label, turns teal when full

**Disabled state** when bucket is full and word is unselected: `opacity-30 cursor-not-allowed`

**Insight Box** (below grid):
- Teal-tinted rounded box: "OSIA looks for patterns only when signals repeat. Early insights are marked as emerging and change easily."

**Footer CTA:**
- "Generate my first insights" primary button (px-16, large)
- "Skip for now" text link (neutral-400, underline)

---

### 7. QUESTION RENDERER

**Purpose:** Renders individual onboarding questions for non-BLUEPRINT stages.

**Layout:** `max-w-xl mx-auto min-h-[80vh]` flex column

**Top Bar:**
- ← back chevron button (left)
- Stage name label (center, sm neutral-500)
- "💾 Save & exit" button (right, text-xs neutral-400)

**Question Prompt:**
- Heading: `question.prompt` (2xl bold white, tight leading)
- Sub-text: "Provide your honest reflection. There are no wrong answers."

**Input Types (rendered based on `question.type`):**

| Type | Component |
|---|---|
| `short_text` | Input, bg-black/40, lg py-6, focus teal border |
| `long_text` | Textarea, min-h-[200px], same style, resize-none |
| `single_select` | Clickable option cards with teal highlight + checkmark dot |
| `multi_select` | Same as single_select but toggleable |
| `likert_1_5` | 5 square buttons (1–5), teal glow on selected, "Not at all" / "Extremely" labels |
| `word_list_n` | N stacked Input fields (exact_items from constraints) |
| `text_list` | N stacked Input fields (max_items from constraints) |
| `tag_select` | Pill buttons, teal on selected |
| `consent_toggle` | Toggle row card with animated teal switch |

**"Why we ask" toggle** (bottom, HelpCircle icon):
- Animates height from 0 to auto
- Shows: "This signal helps us map your [consent_domain] layer, which is foundational for understanding your [stage_id] patterns."

**CTA Row:**
- "Not sure yet" secondary button (flex-1, large) — triggers skip
- "Next →" primary button (flex-1, large) — triggers submit + advance
  - Shows `Loader2` spinner while submitting
  - Disabled if `question.required && !value`
  - 600ms simulated delay on submit

**Events emitted:**
- `onboarding_question_viewed` on mount
- `onboarding_answer_submitted` on next or skip (with `is_skip: true/false`)

---

### 8. SCREEN: HypothesisTester

**Route:** `/insight/first`

**Purpose:** Show the user their first generated insight hypothesis for validation.

**Layout:** Full-page centered, max-w-xl

**Content:**
- "Your first signal." heading (3xl bold)
- Subtitle: "Based on your answers, here's what OSIA is beginning to notice:"
- **Insight card** (glassmorphism, teal left-border): 
  - Hypothesis text (sm text-white, leading-relaxed)
  - Confidence label: "Emerging Hypothesis" badge (amber, 9px uppercase)
  - "This insight will sharpen as you add more signals."
- **Validation buttons:**
  - "This resonates" — teal bg (records positive signal)
  - "Not quite" — ghost (records negative signal)
  - "Skip for now" — text link

**On any selection:** Calls `onComplete()`, advances to next stage.

**Sample hypothesis text:**
> "You appear to operate with a reflective-analytical disposition — deliberate in decisions, energised by deep focus, and cautious under pressure. This is an early signal, not a conclusion."

---

### 9. SCREEN: RENEWAL_EXIT (Completion)

**Renders when:** `currentStageId === 'RENEWAL_EXIT'`

**Layout:** Full-page centered, dark bg, text-center

**Content:**
- Animated icon: 6×6rem rounded-[2.5rem] bg teal/20 box with Sparkles icon (teal, 3rem)
- Diffuse glow behind icon: `blur-3xl animate-pulse teal/20`
- "Your Map is Live." heading (4xl bold white, tracking-tight)
- "The foundation of your digital twin is set. As you interact with OSIA daily, patterns will sharpen and resonance will deepen." (neutral-400)
- "Enter My OSIA" primary button (full width, max-w-sm, py-8, text-lg, teal glow shadow, rounded-full)
- "Calibration Complete" footer (10px uppercase neutral-600, tracking-[0.3em])

**On button click:** Navigate to `/home`, mark `onboardingCompleted: true` in user profile via API.

---

### 10. FLOATING VOICE TRIGGER

When the `SignalsEntryScreen` is showing, display a floating action button (bottom-right, fixed):
- 4×4rem circle, teal bg, Mic icon (white, lg)
- Hover: scale 110%, active: scale 95%
- Teal glow shadow
- Tooltip bubble above: "Try Voice Sync" (10px, teal, animate-bounce)
- On click: switch to `VoiceInteraction` mode (show placeholder screen: "Voice sync coming soon — continue with text for now", with back button)

---

### 11. SUPABASE SCHEMA

```sql
-- Onboarding state (server-side backup of localStorage)
create table onboarding_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  current_stage text default 'BLUEPRINT',
  completed_stages text[] default '{}',
  answers jsonb default '{}',
  events jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Consent ledger (immutable audit trail)
create table consent_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  domains jsonb not null,
  granted boolean not null,
  policy_version text not null,
  occurred_at timestamptz not null,
  created_at timestamptz default now()
);

-- Origin seed (foundational signal data)
create table origin_seeds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  birth_date date,
  birth_time time,
  birth_location text,
  latitude numeric,
  longitude numeric,
  timezone text,
  birth_time_confidence text default 'UNKNOWN',
  traits jsonb default '[]',
  precision_score numeric default 0,
  generated_at timestamptz,
  created_at timestamptz default now()
);

-- Onboarding answers (flat table for analytics)
create table onboarding_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  session_id uuid references onboarding_sessions,
  question_id text not null,
  stage_id text not null,
  value jsonb,
  confidence text,
  derived jsonb,
  is_skip boolean default false,
  answered_at timestamptz not null
);

-- RLS policies
alter table onboarding_sessions enable row level security;
alter table consent_ledger enable row level security;
alter table origin_seeds enable row level security;
alter table onboarding_answers enable row level security;

create policy "Users access own data" on onboarding_sessions
  for all using (auth.uid() = user_id);

create policy "Users access own consent" on consent_ledger
  for all using (auth.uid() = user_id);

create policy "Users access own origin seed" on origin_seeds
  for all using (auth.uid() = user_id);

create policy "Users access own answers" on onboarding_answers
  for all using (auth.uid() = user_id);
```

---

### 12. API ENDPOINTS

```
POST /api/auth/signup         → Creates user + initializes onboarding_session
GET  /api/origin-seed         → Get user's origin seed profile (traits[])
POST /api/origin-seed/signals → Save signal bucket selections
POST /api/users/snapshot      → Persist blueprint traits snapshot
PATCH /api/users/onboarding   → Mark onboarding completed
POST /api/onboarding/answers  → Batch save answers
GET  /api/onboarding/questions?stage=BLUEPRINT → Load questions for stage
GET  /api/onboarding/enums/:ref → Load enum options for a question
```

---

### 13. GLOBAL STYLES TO ADD

```css
/* Tag pill buttons */
.tag-glow {
  padding: 0.375rem 1rem;
  border-radius: 9999px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.05);
  font-size: 0.75rem;
  font-weight: 700;
  color: #757575;
  transition: all 300ms;
  cursor: pointer;
}
.tag-glow:hover {
  border-color: rgba(255,255,255,0.2);
  color: white;
}
.tag-glow-active {
  background: rgba(56,163,165,0.1);
  border-color: #38A3A5;
  color: white;
  box-shadow: 0 0 12px rgba(56,163,165,0.3);
}

/* Thin scrollbar */
.scrollbar-thin::-webkit-scrollbar { width: 4px; }
.scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
.scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
```

---

### 14. ROUTING

Add these routes to the app router (inside `AuthRoute` protection):
```
/welcome           → OnboardingFlow (entry point, no stage guard)
/onboarding        → OnboardingFlow
/onboarding/q/:id  → OnboardingFlow (question-specific URL)
/insight/first     → HypothesisTester
```

Redirect logic:
- If `auth.onboardingCompleted === true` → `/welcome` and `/onboarding` redirect to `/home`
- If `auth.isAuthenticated === false` → all above redirect to `/login`

---

### 15. INTEGRATION WITH GROUP 2 (AUTH)

The signup flow (from Group 2) should:
1. Accept optional birth data fields: `birthDate`, `birthTime`, `birthLocation`, `latitude`, `longitude`, `timezone`, `birthTimeConfidence`
2. After signup → navigate to `/welcome` to begin onboarding
3. After login → if `!onboardingCompleted` → navigate to `/welcome`
4. After login → if `onboardingCompleted` → navigate to `/home`

---

## PROMPT END

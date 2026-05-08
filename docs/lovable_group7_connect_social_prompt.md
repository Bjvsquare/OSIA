# LOVABLE IMPORT PROMPT — Feature Group 7: Connect & Social Graph

> **Instructions**: Copy everything below the "PROMPT START" line and paste it as a single prompt into Lovable.
> **Prerequisites**: Groups 1–6 must be deployed. Supabase Auth profiles table required.

---

## PROMPT START

Add the **OSIA Inner Circle & Social Graph** — a privacy-first relational intelligence system. Users can view their connections in a 3D galaxy visualization, send consent-gated invites, discover other users, manage incoming requests, propose relationship type changes with mutual approval, and participate in symmetric shared reflection sessions. All relational data is governed by explicit consent — nothing is shared without both parties agreeing.

Continue using the OSIA design system: `#02050F` page, `#0A1128` cards, `#38A3A5` teal, Inter font, glassmorphism, Framer Motion, Lucide React.

---

### 1. CONNECT PAGE — Inner Circle Hub

**Route:** `/connect`

**4 tabs:** Galaxy | My Circle | Discover | Requests

**Data fetched on mount (React Query / `useQuery`):**
```
GET /api/connect/list     → connections[]     (refetch on focus)
GET /api/connect/requests → requests[]        (refetchInterval: 10 000ms)
GET /api/users/profile    → { avatarUrl }     (staleTime: 60 000ms)
```

---

#### LAYOUT

**Header row (flex md:flex-row justify-between items-start md:items-center gap-4):**
- Left: H1 "Inner Circle" (3xl bold white) + subtitle "Your trusted connections. Deep relational intelligence awaits." (neutral-400)
- Right: **Tab pill bar** (`flex bg-white/5 p-1 rounded-xl border border-white/10`)

**Tab buttons:**

| Tab key | Label | Icon |
|---|---|---|
| `galaxy` | Galaxy | Orbit |
| `circle` | My Circle | Users |
| `discover` | Discover | Search |
| `requests` | Requests | Inbox |

- Active: `bg-teal-500 text-white shadow-lg rounded-lg`
- Inactive: `text-neutral-400 hover:text-white rounded-lg`
- "Requests" tab: if `requestCount > 0`, show red badge + `animate-pulse` on icon and label

**Content area** (`AnimatePresence mode="wait"`):
- Each tab: `motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }} transition={{ duration:0.2 }}`
- `galaxy` tab: `h-[600px] rounded-2xl overflow-hidden border border-white/5 bg-black/30` wrapper → `GalaxyScene`
- `circle` tab → `ConnectionList`
- `discover` tab → `UserSearch`
- `requests` tab → `IncomingRequests`

---

### 2. GALAXY SCENE — 3D Connection Visualization

**Component:** `src/features/connect/canvas/GalaxyScene.tsx`

**Canvas setup:** HTML5 Canvas, `requestAnimationFrame` loop, responsive to container size.

**Props:**
```typescript
interface GalaxySceneProps {
  connections: ConnectionNode[];
  centralOrbColor?: string;    // default "#00ffff"
  centralOrbSize?: number;     // default 1.5 (multiplier)
  className?: string;
  portraitUrl?: string | null;
}

interface ConnectionNode {
  userId: string;
  name: string;
  avatarUrl?: string;
  cluster: 'family' | 'friends' | 'colleagues' | 'team' | 'org';
  strength: number;   // 0.0–1.0 (from compatibilityScore / 100)
  subType?: string;
}
```

**Cluster color palette:**
```typescript
const CLUSTER_COLORS = {
  family:     '#f43f5e',   // rose
  friends:    '#38bdf8',   // sky
  colleagues: '#a78bfa',   // violet
  team:       '#34d399',   // emerald
  org:        '#fbbf24',   // amber
}
```

**Scene composition:**

*Central Orb (user):*
- Position: canvas center (cx, cy)
- If `portraitUrl` available: draw circular clipped image (radius 28px)
- Else: glowing circle, `fill: centralOrbColor`, radius 24px with outer pulse rings
- Outer rings: 3 concentric dashed circles, `strokeStyle: rgba(0,255,255,0.1)`, animating outward

*Connection nodes:*
- Distributed around center using golden angle spacing within cluster arcs
- Each cluster occupies a 72° arc (360° / 5 clusters)
- Node radius: 12–20px based on `strength`
- Node color: cluster color at 0.8 opacity
- Orbit radius: random between 120–260px from center

*Connection lines:*
- Line from center to each node
- Color: cluster color at `strength * 0.3` opacity
- Line width: `strength * 1.5`

*Labels:*
- First name + subType badge below each node (10px, white/70)

*Animation:*
- Nodes slowly orbit center: each node has an `angle` that increments by `0.0003` per frame (adjusted by `strength`)
- On hover (mousemove distance check): node enlarges, label brightens, connection line thickens
- On click: show tooltip with full name, cluster type, strength score

*Empty state:*
- "Your galaxy is empty" text at center
- Pulsing central orb only
- "Invite someone" text prompt

**Backend data mapping** (done in ConnectPage before passing to GalaxyScene):
```typescript
function mapConnectionType(type?: string): RelationshipCluster {
  switch (type?.toLowerCase()) {
    case 'family': case 'parent': case 'sibling': return 'family';
    case 'colleague': case 'work': case 'professional': return 'colleagues';
    case 'team': return 'team';
    case 'org': case 'organization': return 'org';
    default: return 'friends';
  }
}
// Map each connection:
{ userId, name, avatarUrl, cluster: mapConnectionType(conn.connectionType), 
  strength: conn.compatibilityScore ? conn.compatibilityScore / 100 : 0.5, 
  subType: conn.connectionType }
```

---

### 3. CONNECTION LIST — My Circle

**Component:** `src/features/connect/components/ConnectionList.tsx`

**Data:** `GET /api/connect/list` → connections[]

**Connection card** (for each connection):
- Avatar (40px circle, initials fallback if no `avatarUrl`)
- Name (sm bold white) + username (xs neutral-500) + `connectionType` badge (colored by cluster)
- Compatibility score: `{score}% compatible` (teal dot if > 70, neutral otherwise)
- Action buttons:
  - "View Profile" → `/profile/{userId}`
  - "Shared Reflection" → `/connect/shared-prompts?with={userId}`
  - ⋯ menu → opens `ProposeTypeChangeModal`

**Sort/filter bar:** Filter by cluster (family/friends/colleagues/team/org), sort by name / compatibility / date connected

**Empty state:** "No connections yet." + "Send an invite" teal button → `/connect/invite`

**TypeChangeNotifications banner** — shown above list if any pending type-change requests (see §6)

---

### 4. USER SEARCH — Discover

**Component:** `src/features/connect/components/UserSearch.tsx`

**State:** `query` (string), `results[]`, `sentRequests` (Set of userIds), `loading`

**Search input:** Full-width glassmorphism input, Search icon left, clears on X, debounce 300ms

```
GET /api/users/search?q={query} → UserSearchResult[]
```

```typescript
interface UserSearchResult {
  userId: string;
  username: string;
  name?: string;
  avatarUrl?: string;
  mutualCount?: number;    // mutual connections
  isConnected?: boolean;
  isPending?: boolean;
}
```

**Result cards:**
- Avatar (48px) + name (sm bold) + `@username` (xs neutral-500) + `{mutualCount} mutual` (xs teal if > 0)
- "Connect" button: teal outline → becomes "Pending ✓" after sending (disabled)
- If `isConnected`: "Connected ✓" chip (emerald, disabled)

**On "Connect" click:**
```
POST /api/connect/request { targetUserId }
→ add userId to sentRequests set
```

**Empty/no-query state:** "Search by name or username to discover people" (neutral-500 center)

---

### 5. INCOMING REQUESTS — Requests Tab

**Component:** `src/features/connect/components/IncomingRequests.tsx`

**Data:** `GET /api/connect/requests` → IncomingRequest[]

```typescript
interface IncomingRequest {
  requestId: string;
  fromUserId: string;
  fromUsername: string;
  fromName?: string;
  fromAvatar?: string;
  message?: string;        // optional personal note
  sentAt: string;
}
```

**Request card:**
- Avatar (48px, initials fallback) + name/username + "wants to connect with you" (xs neutral-500)
- `sentAt` timestamp (relative: "2 days ago")
- Personal note if provided (italic neutral-400 quote card)
- Action row:
  - "Decline" ghost button (neutral → red-400 hover)
  - "Accept" teal button with Check icon

**On Accept:**
```
POST /api/connect/accept { requestId }
→ remove from list, increment connection count, invalidate ['connections']
```
**On Decline:**
```
POST /api/connect/decline { requestId }
→ remove from list
```

**Empty state:** "No pending requests" (neutral-500 center, Inbox icon)

---

### 6. CONNECTION TYPE REVIEW SYSTEM

#### ProposeTypeChangeModal

Triggered from ConnectionList ⋯ menu → "Review Connection".

**Modal overlay** (`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm`):
- Card `bg-[#0d1117] border border-white/10 rounded-2xl p-6 max-w-md` with spring animation

**Header:**
- ArrowRightLeft icon (teal, `w-10 h-10 rounded-full bg-teal/20`)
- "Review Connection" + "Change how you're connected with **{name}**" (neutral-400)

**Current type box:** `p-3 rounded-lg bg-white/5 border border-white/5`
- "CURRENT" label + `connectionType` value

**Proposed Type grid** (`grid-cols-2 gap-2`):

5 type buttons:
| Type | Icon | Selected colors |
|---|---|---|
| family | Heart | rose-400, bg-rose/15, border-rose/30 |
| friends | Users | sky-400, bg-sky/15, border-sky/30 |
| colleagues | Briefcase | violet-400, bg-violet/15, border-violet/30 |
| team | Star | emerald-400, bg-emerald/15, border-emerald/30 |
| org | GraduationCap | amber-400, bg-amber/15, border-amber/30 |

Unselected: `bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10`

**Subtype pills** (AnimatePresence height animation, shown when type selected):

```typescript
const SUBTYPE_MAP = {
  family:     ['spouse', 'partner', 'parent', 'child', 'sibling', 'extended_family'],
  friends:    ['best_friend', 'close_friend', 'acquaintance'],
  colleagues: ['direct_team', 'cross_team', 'manager', 'mentor', 'mentee'],
  team:       ['direct_team', 'manager'],
  org:        ['mentor', 'mentee'],
}
```

Selected subtype: `bg-teal/20 border-teal/40 text-teal-400`

**Action row:** Cancel ghost + "Propose" teal (disabled if no change from current, or if pending)
- Loader2 spinner during mutation

**On submit:**
```
POST /api/connect/propose-type-change { targetUserId, proposedType, proposedSubType? }
→ invalidate ['type-change-requests']
```

**Footer note:** "Both users must approve for the change to take effect." (xs neutral-500)

---

#### TypeChangeNotifications Banner

Shown above ConnectionList when pending type-change requests exist.

**Data:** `GET /api/connect/type-change-requests` → `{ pending[], all[] }` (refetchInterval: 15 000ms)

**Collapsed state (if pendingCount > 0):**
- Bell icon + "{n} connection review{s} pending" + count badge + ChevronDown
- Style: `bg-teal/10 border border-teal/20 text-teal-400 rounded-xl`

**Expanded state (AnimatePresence height):**
For each pending `TypeChangeRequest`:
- Avatar + requester name + "wants to change connection type" (xs neutral-500)
- **Type change visualization:**
  - Current type pill: `[Icon] currentType` in its cluster color
  - ArrowRightLeft icon (neutral-500)
  - Proposed type pill: `[Icon] proposedSubType || proposedType` in cluster color
- Actions: "Decline" (ghost → red hover) + "Approve" (teal)
```
POST /api/connect/respond-type-change { requestId, action: 'approve' | 'reject' }
→ invalidate ['type-change-requests', 'connections']
```

---

### 7. CONNECT INVITE PAGE

**Route:** `/connect/invite`

**Layout:** `min-h-screen bg-[#02050F]`, PlexusBackground, `max-w-2xl mx-auto px-6 pt-8 pb-20`

**State:** `email`, `selectedType`, `note`, `sent: boolean`

**Framer Motion:** `initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}`

**Pre-send view:**

Header (text-center):
- "Invite someone to a shared reflection." (4xl bold tracking-tight)
- "Relational Connect is mutual and limited by design." (xs neutral-500 italic)

**Consent card** (`border-teal/20 bg-teal/[0.02]`):
- ShieldCheck icon (14px teal) + "What sharing means" label
- 4 consent bullet points (`grid-cols-1 md:grid-cols-2 gap-4`):
  - "No full personal map sharing"
  - "Symmetrical shared view"
  - "Always consensual & revocable"
  - "No tracking or logging outside session"

**Connection type selector** ("Who is this with?"):

5 type cards (`grid-cols-2 md:grid-cols-3 gap-3`), each a clickable card:
| id | Label | Icon |
|---|---|---|
| partner | Partner / Spouse | ❤️ |
| friend | Friend | 🤝 |
| colleague | Colleague | 🏢 |
| team | Team Member | 👥 |
| other | Other | 🌀 |

Card style: `p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:border-teal/30 transition-all`
Selected: `border-teal/40 bg-teal/5`

**Invite form:**
- Email input (`type="email"`, required, `bg-black/40 border-white/10`)
- Personal note textarea (`h-24`, borderless focus: `border-teal/50`, placeholder "Add a personal note (optional)")
- "Send invite" primary button (`w-full py-6 text-lg`)

**On submit:**
```
POST /api/connect/invite { email, connectionType: selectedType, note }
→ setSent(true)
```

**Sent confirmation view** (`initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}`):
- ShieldCheck icon (32px teal, `w-20 h-20 rounded-full bg-teal/10 border border-teal/20`)
- "Invite sent." (3xl bold)
- "We've sent a secure invite to {email}. They won't see anything until they accept and agree to the shared consent." (neutral-400 max-w-md)
- "Back to My OSIA" secondary button → `/home`

---

### 8. SHARED PROMPTS PAGE — Symmetric Reflection

**Route:** `/connect/shared-prompts?with={userId}`

**Layout:** `min-h-screen bg-[#02050F]`, PlexusBackground, `max-w-2xl mx-auto px-6 pt-8 pb-20`

**State:** `step: 1 | 2 | 3`, `answers: Record<step, string[]>`, `waiting: boolean`

**Header:**
- "A shared reflection space." (4xl bold)
- "Answer privately. Patterns appear only after both respond." (xs neutral-500)

**Rules strip** (`grid-cols-2 md:grid-cols-4 gap-2`, 9px uppercase neutral-600):
- "No explaining others" | "No scoring" | "Curiosity first" | "Symmetry"

**Prompt card** (single card, `p-10 border-white/5 bg-[#0A1128]/40`):
- "PROMPT {step} OF 3" (10px teal uppercase tracking-widest)

**Step 1 — Energy rising:**
- "In your interactions together, when does energy tend to increase?"
- 6 answer chips (toggle-select, multiple allowed):
  - Open-ended conversations | Clear goals or plans | Lightness or humour | Working through tension | Shared focus time | Novel experiences
- Chip style: `px-5 py-3 rounded-xl border border-white/5 bg-white/[0.02]`
- Selected: `border-teal/40 bg-teal/10 text-teal-300`

**Step 2 — Friction points:**
- "When things feel stuck between you, what's often present?"
- 6 answer chips:
  - Unclear expectations | Timing mismatches | Emotional intensity | Avoidance | Different priorities | Fatigue or stress

**Step 3 — Reset:**
- "Optional: what tends to help things reset?"
- Freetext textarea (`min-h-[120px] bg-black/40 border-white/10 rounded-xl p-4 text-white resize-none`)

**Card footer:**
- Lock icon + "Private Response" (10px neutral-600 uppercase)
- "Next Prompt" / "Complete" primary button (`px-10`)

**On Complete (step 3 submit):**
```
POST /api/connect/shared-prompts { 
  withUserId, 
  answers: { step1: string[], step2: string[], step3: string } 
}
→ setWaiting(true)
→ after 3s → navigate to /connect/shared-view?with={userId}
```

**Waiting state** (AnimatePresence mode="wait"):
- Pulsing CheckCircle2 with ping rings (3 concentric circles)
- "Response captured." (3xl bold)
- "Waiting for the other participant... Pattern view will appear instantly when both are ready." (neutral-400 max-w-sm)

---

### 9. SHARED VIEW PAGE

**Route:** `/connect/shared-view?with={userId}`

**Data:** `GET /api/connect/shared-view?with={userId}` → `SharedPatternResult`

```typescript
interface SharedPatternResult {
  status: 'waiting' | 'ready';
  patterns?: {
    energisers: string[];    // overlap between both users' step 1 answers
    frictions: string[];     // overlap between both users' step 2 answers
    compatibilityInsight: string;  // AI-generated 1-paragraph analysis
    growthEdge: string;            // one suggestion for the relationship
  }
}
```

**Waiting state** (status === 'waiting'):
- Same pulsing orb animation as SharedPromptsPage waiting state
- "Waiting for {name} to complete their reflection"
- "Check back once they've responded" (neutral-400)
- Auto-refresh every 10s via `useQuery refetchInterval`

**Ready state** (status === 'ready'):
- Header: "Relational Patterns" (3xl bold) + connection name (teal)

- **Shared Energisers card** (`border-emerald/20 bg-emerald/5`):
  - Zap icon (emerald) + "WHAT LIFTS YOU BOTH" (10px uppercase)
  - Chip list of overlap energisers (emerald pills)

- **Shared Frictions card** (`border-amber/20 bg-amber/5`):
  - AlertTriangle icon (amber) + "WHAT CHALLENGES YOU BOTH" (10px uppercase)
  - Chip list of overlap frictions (amber pills)

- **Compatibility Insight card** (teal border):
  - Sparkles icon (teal) + "OSIA INSIGHT" (10px uppercase)
  - Paragraph text (sm neutral-200 leading-relaxed)

- **Growth Edge card** (`border-purple/20 bg-purple/5`):
  - TrendingUp icon (purple) + "GROWTH EDGE" (10px uppercase)
  - Single suggestion text (sm white italic)

- Footer: "Return to Inner Circle" outline button → `/connect` + "Invite another connection" ghost button → `/connect/invite`

---

### 10. SUPABASE SCHEMA

```sql
-- Connections (bidirectional via two rows)
create table connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  connected_user_id uuid references auth.users not null,
  connection_type text not null default 'friends',
  connection_sub_type text,
  compatibility_score integer default 50,
  status text default 'active' check (status in ('active', 'blocked', 'removed')),
  connected_at timestamptz default now(),
  unique (user_id, connected_user_id)
);

-- Connection requests
create table connection_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid references auth.users not null,
  to_user_id uuid references auth.users not null,
  message text,
  status text default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz default now(),
  responded_at timestamptz,
  unique (from_user_id, to_user_id)
);

-- Connection invites (email-based, pre-registration)
create table connection_invites (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid references auth.users not null,
  email text not null,
  connection_type text,
  note text,
  token text unique not null default gen_random_uuid()::text,
  status text default 'pending' check (status in ('pending', 'accepted', 'expired')),
  expires_at timestamptz default (now() + interval '7 days'),
  created_at timestamptz default now()
);

-- Relationship type change requests (mutual approval)
create table type_change_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid references auth.users not null,
  to_user_id uuid references auth.users not null,
  current_type text not null,
  proposed_type text not null,
  proposed_sub_type text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now(),
  responded_at timestamptz
);

-- Shared reflection sessions
create table shared_reflections (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid references auth.users not null,
  user_b_id uuid references auth.users not null,
  user_a_answers jsonb,
  user_b_answers jsonb,
  shared_patterns jsonb,          -- populated when both have answered
  status text default 'waiting' check (status in ('waiting', 'ready')),
  created_at timestamptz default now(),
  completed_at timestamptz,
  unique (user_a_id, user_b_id)
);

-- RLS policies
alter table connections enable row level security;
alter table connection_requests enable row level security;
alter table connection_invites enable row level security;
alter table type_change_requests enable row level security;
alter table shared_reflections enable row level security;

create policy "Users see own connections" on connections for all using (auth.uid() = user_id);
create policy "Users see own requests" on connection_requests for all using (auth.uid() = from_user_id or auth.uid() = to_user_id);
create policy "Users see own invites" on connection_invites for all using (auth.uid() = inviter_id);
create policy "Users see type changes" on type_change_requests for all using (auth.uid() = from_user_id or auth.uid() = to_user_id);
create policy "Users see shared reflections" on shared_reflections for all using (auth.uid() = user_a_id or auth.uid() = user_b_id);
```

---

### 11. API ENDPOINTS

```
GET  /api/connect/list                              → connections[]
GET  /api/connect/requests                          → incoming requests[]
POST /api/connect/request          { targetUserId } → send request
POST /api/connect/accept           { requestId }    → accept request
POST /api/connect/decline          { requestId }    → decline request
POST /api/connect/invite           { email, connectionType, note }
GET  /api/connect/type-change-requests              → { pending[], all[] }
POST /api/connect/propose-type-change { targetUserId, proposedType, proposedSubType? }
POST /api/connect/respond-type-change { requestId, action: 'approve'|'reject' }
POST /api/connect/shared-prompts   { withUserId, answers }
GET  /api/connect/shared-view?with={userId}        → SharedPatternResult
GET  /api/users/search?q={query}                   → UserSearchResult[]
```

---

### 12. ROUTING

```
/connect                    → ConnectPage (4-tab hub)
/connect/invite             → ConnectInvitePage
/connect/shared-prompts     → SharedPromptsPage (?with=userId)
/connect/shared-view        → SharedViewPage (?with=userId)
```

All routes require authentication (ProtectedRoute).

---

### 13. REQUEST BADGE IN NAV (AppLayout integration)

The `requestCount` from `GET /api/connect/requests` is used in the AppLayout top nav (from Group 4):
- Poll every 30s
- If `requestCount > 0`: show red pulse badge on "Connect" nav item
- Badge: `px-1.5 py-0.5 text-[8px] bg-red-500 text-white rounded-full`

---

## PROMPT END

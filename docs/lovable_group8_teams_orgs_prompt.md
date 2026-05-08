# LOVABLE IMPORT PROMPT — Feature Group 8: Teams & Organizations

> **Instructions**: Copy everything below the "PROMPT START" line and paste it as a single prompt into Lovable.
> **Prerequisites**: Groups 1–7 must be deployed. Connections and profiles from Group 7 required.

---

## PROMPT START

Add the **OSIA Teams & Collective Intelligence** system — a privacy-first group layer where users form team circles, run check-in sessions, view anonymized aggregate patterns, and communicate. Teams operate on strict ethical boundaries: no individual scores are revealed, participation is always voluntary, and aggregate data is anonymized. Also includes a context-switcher to the Organizations layer.

Continue using the OSIA design system: `#02050F` page, `#0A1128` cards, `#38A3A5` teal, Inter font, glassmorphism, Framer Motion, Lucide React.

---

### 1. TEAM HOME PAGE — Circles Hub

**Route:** `/teams`

**Layout:** `min-h-screen bg-[#02050F]`, PlexusBackground, `max-w-5xl mx-auto px-6 pb-12`

**Data on mount:**
```
GET /api/teams/my-teams      → Team[]
GET /api/teams/join-requests → JoinRequest[]  (user's outgoing requests)
```

---

#### LAYOUT STRUCTURE

**Context Switcher pill** (`w-fit`, same pill nav style as Thesis/Patterns):
- "My Circles" → `/teams` (active: teal pill)
- "Organizations" → `/organizations` (inactive: neutral-400)

**Header row (`flex flex-col md:flex-row md:items-end justify-between gap-4`):**
- Left: "Collective Context." (4xl bold tracking-tight) + "Aggregate patterns, never individual scores." (xs neutral-500 italic)
- Right: "Find Teams" outline button (Search icon) + "Create New Team" primary button (Plus icon) → `/teams/create`

**Search Panel** (toggled by "Find Teams", card with teal border):
- Header: Search icon (teal) + "Find & Join Teams" + X close button
- Search row: text input (`onKeyDown Enter`) + "Search" button
  - `GET /api/teams/search?q={query}` → results[]
- Results list: team name + type + purpose (xs neutral-500)
  - "Request to Join" outline button (UserPlus icon)
  - On click: inline expand → optional message input + "Send" button + X cancel
  - `POST /api/teams/{teamId}/join-request { message }`
  - After send: remove from results, reload `myRequests`
- Empty result: "No teams found matching "{query}""

**Pending Join Requests banner** (if `pendingRequests.length > 0`, amber card):
- Clock icon (amber) + "Pending Join Requests" (sm amber-400)
- List: teamName + "Awaiting approval" (xs yellow-400, Clock icon)

**Teams Grid** (`md:grid-cols-2 gap-6`):

Each team card (`p-8 border-white/5 bg-[#0A1128]/40 group hover:border-teal/20`):
- **Header:** team name (2xl bold, `group-hover:text-teal transition`) + "{n} members" + "Session Active" teal pulse dot (if `activeSessions > 0`) + "Access Intelligence →" ghost right-arrow (opacity-0, shows on group-hover)
- **Action grid** (2×1 buttons):
  - "▶ Enter Session" teal: `bg-teal/10 border-teal/20 text-teal` hover `bg-teal/20` → `/teams/{id}/session`
  - "◈ View Patterns": `bg-white/5 border-white/5 text-neutral-400` hover `text-white` → `/teams/{id}/patterns`

**Loading state:** "Syncing team networks..." (animate-pulse, neutral-500, centered)

**Empty state:** Dashed border box, "You are not part of any teams yet." + "Find Existing Team" outline + "Create New Team" primary

**Ethical Boundary Reminder card** (always shown, bottom, `border-teal/20 bg-teal/[0.03]`):
- "TEAM BOUNDARIES" (10px teal uppercase)
- 3-col grid (sm:grid-cols-3):
  | Title | Description |
  |---|---|
  | Anonymized | Individual inputs are never revealed at the group level. |
  | Voluntary | Anyone can pause or stop team participation at any time. |
  | No Scoring | OSIA does not rank or compare team members. |

---

### 2. TEAM PAGE — Individual Team View

**Route:** `/teams/:teamId` (also handles `/teams/create` as creation mode)

**Data:** `GET /api/teams/{teamId}` → `{ team, members[], recentCheckins[], patterns }`

**Tabs** (pill bar `bg-white/5 rounded-xl border border-white/10`):

| Tab | Icon | Shown to |
|---|---|---|
| dashboard | BarChart3 | All members |
| checkin | CheckSquare | All members |
| comms | MessageSquare | All members |
| settings | Settings | Leaders/Admins/Creator only |

Active: `bg-teal-500 text-white shadow-lg`

**Role logic:**
```typescript
const memberRecord = team.members.find(m => m.userId === userProfile?.id)
const userRole = memberRecord?.role  // 'Leader' | 'Admin' | 'Member'
const isCreator = team.creatorId === userProfile?.id
const canManage = userRole === 'Leader' || userRole === 'Admin' || isCreator
```

**Header row:**
- Team name (3xl bold) + type badge (`px-2 py-0.5 bg-white/10 text-neutral-400 rounded 10px uppercase`)
- Purpose text (sm neutral-400)
- Tab bar (right, overflow-x-auto)

**AnimatePresence** (`initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}`):

---

#### TAB: DASHBOARD → `TeamDashboard`

**Component:** `src/features/team/components/TeamDashboard.tsx`

**Data:** `GET /api/teams/{teamId}/dashboard` → TeamDashboard

```typescript
interface TeamDashboard {
  team: { id, name, type, purpose, memberCount }
  recentCheckins: CheckinSummary[]
  aggregatePatterns: {
    topStrengths: string[]
    topChallenges: string[]
    energyProfile: string
    collaborationStyle: string
  }
  checkInStats: {
    totalSessions: number
    avgParticipation: number   // 0.0–1.0
    lastCheckin?: string       // ISO date
  }
}
```

**Layout (space-y-8):**

**Stats row** (3 cards `grid grid-cols-3 gap-4`):
- Total Sessions (blue)
- Avg Participation `{Math.round(avgParticipation * 100)}%` (teal)
- Last Check-in (amber, relative date)

**Aggregate Patterns card** (if data exists, `border-teal/20 bg-teal/[0.02]`):
- "COLLECTIVE PATTERNS" (10px teal uppercase)
- Energy Profile: teal badge
- Collaboration Style: purple badge
- Top Strengths: green chips list (up to 3)
- Top Challenges: amber chips list (up to 3)
- Footer note: "Patterns are aggregate-only. No individual data is visible here." (9px neutral-600 italic)

**Recent Check-ins timeline** (last 5):
- Each: date + participation count + "View Summary" link
- Clicking expands anonymized summary for that session

**Empty dashboard:** "Run your first check-in to see collective patterns emerge." + "Start Check-in" teal button

---

#### TAB: CHECK-IN → `TeamCheckIn`

**Component:** `src/features/team/components/TeamCheckIn.tsx`

**Props:** `onComplete: (data: any) => void`

A 3-step guided check-in flow for the team:

**Step 1 — Energy level:**
- "How is your energy heading into this session?"
- 5 emoji options: 🔋 Full | ⚡ High | 🌊 Steady | 🌙 Low | 🔌 Drained
- Selection highlights with teal glow

**Step 2 — Current state:**
- "What's most present for you right now?"
- 6 word chips (multi-select): Focused | Scattered | Creative | Overwhelmed | Motivated | Uncertain
- Selected: teal border + bg

**Step 3 — Team intention:**
- "What do you most need from the team today?"
- 6 chips: Clarity | Support | Challenge | Space | Focus | Momentum

**Progress indicator:** 3 dots, active = teal filled

**Card footer:** Lock icon + "Your response is private" (10px neutral-600) + "Next" / "Submit" primary button

**On submit:**
```
POST /api/teams/{teamId}/checkin {
  energy: string,
  state: string[],
  intention: string[]
}
→ onComplete(data)
→ navigate to 'dashboard' tab
```

**Post-submit state:** CheckCircle2 animation + "Your check-in is contributing to the collective pattern." (neutral-400)

---

#### TAB: COMMS → `TeamChat`

**Component:** `src/features/team/components/TeamChat.tsx`

**Props:** `teamId: string`, `currentUserRole: string`

**Layout:** `grid lg:grid-cols-3 gap-8`
- Left (lg:col-span-2): Chat area
- Right: Active Members sidebar

**Chat area:**
- Messages list: user avatar/initials + name + timestamp + message text
- Leader/Admin messages: teal name color
- Own messages: right-aligned, teal bubble
- Others: left-aligned, `bg-white/5` bubble
- Input bar: `flex gap-3`, text input + Send button (SendHorizonal icon)

**Data:**
```
GET /api/teams/{teamId}/messages → Message[]
POST /api/teams/{teamId}/messages { text } → Message
```

**Active Members sidebar** (`bg-white/5 rounded-2xl p-6 border border-white/10 h-fit`):
- "ACTIVE MEMBERS" (sm bold uppercase tracking-widest)
- Each member: avatar (8px circle, Leader = teal bg, others = white/10) + name + role (10px neutral-500 uppercase) + green online dot (`shadow-[0_0_8px_rgba(34,197,94,0.5)]`)
- Leader indicator: teal background avatar

---

#### TAB: SETTINGS (canManage only)

**Layout:** `max-w-2xl mx-auto bg-[#0A1128]/40 p-8 rounded-3xl border border-white/5`

**Team Administration section:**
- "Team Administration" (xl bold white)
- "Manage team configuration and lifecycle." (sm neutral-400)

**Danger Zone:**
- "DANGER ZONE" (sm bold red-400 uppercase tracking-widest)
- Red card (`bg-red/10 border border-red/20`):
  - "Dissolve Team" (bold sm white) + "Permanently delete this team and all aggregated history." (xs red-300/60)
  - "Confirm Dissolution" button (red border/text, Trash2 icon)
  - On click: confirm dialog → `DELETE /api/teams/{teamId}` → navigate to `/teams`

---

### 3. TEAM SETUP — Create Flow

**Route:** `/teams/create` (renders `TeamSetup` inside TeamPage with `teamId === 'create'`)

**Component:** `src/features/team/components/TeamSetup.tsx`

**Props:** `onComplete: (data: any) => void`

**Header:** "Initialize Team Protocol" (3xl bold) + "Define the parameters of your collective intelligence unit." (neutral-400)

**Form fields:**

1. **Team Name** — text input, required, max 60 chars
2. **Team Type** — select/pill choice:
   - Work Team 💼 | Study Group 📚 | Family 🏠 | Friend Group 🤝 | Community 🌱
3. **Purpose** — textarea, "Describe the team's focus or shared goal" (optional, 150 chars)
4. **Privacy** — toggle:
   - Private (default): Invite-only, not discoverable in search
   - Public: Discoverable via team search

**Invite members section:**
- "Invite by email (optional)" label
- Dynamic email input + "Add" button → adds to list
- Added emails shown as dismissable chips

**Submit:** "Create Team" primary button (full width)

```
POST /api/teams/create {
  name, type, purpose, privacy, inviteEmails: string[]
}
→ onComplete({ id: newTeamId })
→ navigate('/teams/{newTeamId}')
```

---

### 4. TEAM SESSION PAGE

**Route:** `/teams/:teamId/session`

**Component:** `src/features/team/TeamSessionPage.tsx`

A focused real-time team session view — all members check in simultaneously.

**Phases:**
1. **Lobby** — "Session starting..." waiting for others, member presence list
2. **Check-in** — Renders `TeamCheckIn` component
3. **Results** — Shows aggregate results as they come in (anonymized):
   - Energy distribution bar chart (emoji labels + %)
   - State word cloud (larger = more selected)
   - Intention overlap: which intentions are shared

**Real-time updates:** Poll `GET /api/teams/{teamId}/session/status` every 5s

**Exit:** "Leave Session" button (ghost, always visible)

---

### 5. TEAM PATTERNS PAGE

**Route:** `/teams/:teamId/patterns`

**Component:** `src/features/team/TeamPatternsPage.tsx`

**Data:** `GET /api/teams/{teamId}/patterns` → TeamPatternsData

```typescript
interface TeamPatternsData {
  totalCheckins: number
  memberCount: number
  energyTrend: { week: string; avg: number }[]    // last 8 weeks
  topStrengths: { label: string; frequency: number }[]
  topChallenges: { label: string; frequency: number }[]
  intentionMap: { label: string; count: number }[]
  collectiveInsight: string    // Groq-generated paragraph
  lastUpdated: string
}
```

**Layout (space-y-8):**

**Header:**
- Back arrow → `/teams/{teamId}`
- "Collective Patterns" (3xl bold) + team name (teal)
- "Based on {totalCheckins} check-ins from {memberCount} members" (xs neutral-500)

**Energy Trend chart:** SVG line chart, 8 weeks, 0–5 scale (emoji labels on Y), teal line

**Strengths & Challenges** (2-col grid):
- Each: frequency bar + label (sorted by frequency desc)
- Strengths: green fill | Challenges: amber fill

**Shared Intentions:** horizontal ranked list (bold label + faint count)

**Collective Insight card** (teal border, Sparkles icon):
- Groq-generated paragraph (sm neutral-200 leading-relaxed)
- "Generated from anonymized team data" (9px neutral-600 italic)
- "Regenerate" ghost button → `POST /api/teams/{teamId}/patterns/regenerate`

**Privacy footer:** "All data is aggregated. Individual responses are never shown." (10px neutral-600)

---

### 6. SUPABASE SCHEMA

```sql
-- Teams
create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  purpose text,
  privacy text default 'private' check (privacy in ('private', 'public')),
  creator_id uuid references auth.users not null,
  active_sessions integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Team members
create table team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade not null,
  user_id uuid references auth.users not null,
  role text default 'Member' check (role in ('Leader', 'Admin', 'Member')),
  joined_at timestamptz default now(),
  unique (team_id, user_id)
);

-- Team join requests
create table team_join_requests (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade not null,
  user_id uuid references auth.users not null,
  message text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now(),
  responded_at timestamptz,
  unique (team_id, user_id)
);

-- Team check-ins (anonymized aggregate)
create table team_checkins (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade not null,
  user_id uuid references auth.users not null,
  session_id uuid,
  energy text not null,
  state text[] default '{}',
  intention text[] default '{}',
  created_at timestamptz default now()
);

-- Team messages (chat)
create table team_messages (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade not null,
  user_id uuid references auth.users not null,
  text text not null,
  created_at timestamptz default now()
);

-- Team aggregate patterns (cached)
create table team_patterns (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade not null unique,
  top_strengths text[] default '{}',
  top_challenges text[] default '{}',
  energy_profile text,
  collaboration_style text,
  collective_insight text,
  total_checkins integer default 0,
  last_updated timestamptz default now()
);

-- RLS
alter table teams enable row level security;
alter table team_members enable row level security;
alter table team_join_requests enable row level security;
alter table team_checkins enable row level security;
alter table team_messages enable row level security;
alter table team_patterns enable row level security;

-- Teams: readable if member or public
create policy "Members see teams" on teams for select
  using (privacy = 'public' or exists (
    select 1 from team_members where team_id = teams.id and user_id = auth.uid()
  ));
create policy "Creator manages team" on teams for all using (creator_id = auth.uid());

create policy "Members see members" on team_members for select
  using (exists (select 1 from team_members tm where tm.team_id = team_members.team_id and tm.user_id = auth.uid()));
create policy "Leaders manage members" on team_members for all
  using (exists (select 1 from team_members tm where tm.team_id = team_members.team_id and tm.user_id = auth.uid() and tm.role in ('Leader', 'Admin')));

create policy "Members see checkins" on team_checkins for select
  using (exists (select 1 from team_members where team_id = team_checkins.team_id and user_id = auth.uid()));
create policy "Members insert checkins" on team_checkins for insert
  with check (auth.uid() = user_id);

create policy "Members see messages" on team_messages for select
  using (exists (select 1 from team_members where team_id = team_messages.team_id and user_id = auth.uid()));
create policy "Members send messages" on team_messages for insert
  with check (auth.uid() = user_id);

create policy "Members see patterns" on team_patterns for select
  using (exists (select 1 from team_members where team_id = team_patterns.team_id and user_id = auth.uid()));
```

---

### 7. API ENDPOINTS

```
GET  /api/teams/my-teams                    → Team[] (teams user is member of)
GET  /api/teams/search?q={query}            → Team[] (public teams)
POST /api/teams/create                      → { id } new team
GET  /api/teams/:teamId                     → { team, members[], ... }
DELETE /api/teams/:teamId                   → (creator/leader only)
GET  /api/teams/:teamId/dashboard           → TeamDashboard
POST /api/teams/:teamId/checkin             → { energy, state[], intention[] }
GET  /api/teams/:teamId/messages            → Message[]
POST /api/teams/:teamId/messages            → { text }
POST /api/teams/:teamId/join-request        → { message }
GET  /api/teams/join-requests               → JoinRequest[] (my outgoing)
POST /api/teams/:teamId/join-request/respond → { requestId, action: 'approve'|'reject' }
GET  /api/teams/:teamId/patterns            → TeamPatternsData
POST /api/teams/:teamId/patterns/regenerate → triggers Groq re-analysis
GET  /api/teams/:teamId/session/status      → { phase, participants[] }
```

---

### 8. ROUTING

```
/teams                    → TeamHomePage (Circles Hub)
/teams/create             → TeamPage (isCreating mode → TeamSetup)
/teams/:teamId            → TeamPage (4-tab view)
/teams/:teamId/session    → TeamSessionPage
/teams/:teamId/patterns   → TeamPatternsPage
```

All routes require authentication (ProtectedRoute).

---

### 9. ANIMATION SCHEDULE

| Element | Animation |
|---|---|
| TeamHomePage mount | `opacity:0→1, y:20→0` |
| Team cards | stagger `0.07s each` |
| Search panel | `height:0→auto, opacity:0→1` (AnimatePresence) |
| Tab content | `opacity:0→1, y:10→0, duration:0.2s` |
| Check-in steps | `opacity:0→1, x:20→0` (step forward) / `x:-20→0` (back) |
| Pattern bars | `width:0→{value}%` on mount |
| Chat messages | `opacity:0→1, y:5→0` on each new message |

---

## PROMPT END

# LOVABLE IMPORT PROMPT — Feature Group 1: Admin Dashboard + DevOps

> **Instructions**: Copy everything below the "PROMPT START" line and paste it as a single prompt into Lovable.

---

## PROMPT START

Build a premium, enterprise-grade **Admin Command Center** for the OSIA platform — a SaaS personality intelligence system. This is the administrative backbone: a dark-mode dashboard with 10 tabbed views, real-time analytics, user management, a DevOps kanban board, KYC review queue, feedback triage, and system diagnostics.

Use **React + TypeScript + TailwindCSS + Supabase** (for auth and database). Use **shadcn/ui** as the component base, but override all styling to match the custom OSIA design system described below. Use **Framer Motion** for all transitions and **Lucide React** for icons.

---

### 1. DESIGN SYSTEM — "OSIA SaaS-Modern-Dark"

**Color Palette (Custom Tailwind Tokens):**
```
Background:      #02050F (page), #0A1128 (cards/panels)
Card Glass:      bg-[#0a1128]/40 backdrop-blur-xl border border-white/10
                 hover:border-[#38A3A5]/30 (teal glow on hover)
Primary Teal:    #38A3A5 (buttons, accents, active states)
                 Glow: shadow-[0_0_20px_rgba(56,163,165,0.4)]
Purple Accent:   #6B4C9A
Amber Accent:    #D4A373
Neutrals:        #757575 (muted text), #121212 (dark surfaces)
```

**Typography:**
- Font: `Inter` from Google Fonts
- All labels: `text-[10px] font-black uppercase tracking-[0.2em]` or `tracking-widest`
- Headings: `font-black text-white tracking-tighter` or `tracking-tight`
- Values: `font-bold text-white`
- Muted: `text-[#757575]` or `text-white/40`

**Card Component:**
```
rounded-2xl border border-white/10 bg-[#0a1128]/40 backdrop-blur-xl
shadow-2xl transition-all duration-300 hover:border-[#38A3A5]/30
```

**Button Variants:**
- **Primary**: `bg-[#38A3A5] text-white rounded-full font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(56,163,165,0.4)] hover:shadow-[0_0_30px_rgba(56,163,165,0.6)] active:scale-95`
- **Secondary**: `bg-white/5 text-white border border-white/10 backdrop-blur-md rounded-full`
- **Outline**: `border border-[#38A3A5]/20 bg-transparent text-[#80CED7] hover:bg-[#38A3A5]/10 rounded-full`
- **Ghost**: `hover:bg-white/5 text-[#757575] hover:text-white rounded-full`

**Toast Notifications:**
- Fixed bottom-right, rounded-2xl, backdrop-blur, auto-dismiss 4s
- Success: border-[#38A3A5]/30, Error: border-red-500/30, Warning: border-amber-500/30, Info: border-blue-500/30

---

### 2. PAGE STRUCTURE — AdminPage

**Route:** `/admin` (protected by admin role check)

**Header Section:**
- Top-left: Shield icon + "COMMAND CENTER" micro-label (10px, teal, tracking-[0.4em]) + "OSIA Admin ." heading (4xl, white, teal period)
- Top-right: Horizontal pill-shaped tab bar with 10 tabs. Active tab: teal background with glow shadow. Inactive: muted text, hover white.

**Tabs:** Analytics | KYC | DevOps | Founding Circle | Feedback | Planning | Interactions | Users | Errors | System

**Quick Stats Grid** (4 columns below header):
| Stat | Icon | Color |
|---|---|---|
| Verified Identities | Globe | teal |
| Active Sessions | Zap | purple |
| System Health (100%) | Server | green |
| Sync Completion (%) | Activity | blue |

Each stat card: label (9px uppercase), value (xl bold white), status badge (8px, green if Stable/Live/High).

**Tab Content Area:** AnimatePresence with fade+slide transitions (y: 20→0 enter, 0→-20 exit, 400ms ease-out).

---

### 3. TAB 1 — Analytics

**DAU/WAU/MAU Row** (4 colored metric cards):
- DAU: teal bg tint, Activity icon
- WAU: purple bg tint, Calendar icon
- MAU: blue bg tint, Users icon
- Retention: green bg tint, TrendingUp icon

Each shows: icon + label (10px), large value (2xl), description (9px muted).

**Signal Activity Chart** (7-day bar chart):
- 7 vertical bars with gradient `from-[#38A3A5]/20 to-[#38A3A5]`
- Hover: gradient shifts to purple
- Tooltip on hover showing value
- D/W/M period selector pills (W active by default)
- Animated entry: each bar grows from height 0, staggered 100ms

**Regional Distribution Panel:**
- List of feature areas with percentage progress bars
- Bar colors: teal, purple, blue, amber (rotating)
- Animated width from 0 to target percentage

**Data Source:** `GET /api/admin/analytics` returns `{ totalUsers, activeUsers, completionRate, dau, wau, mau, retention, growth_over_time[], regional_clusters[] }`

---

### 4. TAB 2 — KYC Review Panel

**Stats Overview** (7-column grid):
Total | Pending (amber) | Submitted (blue) | Under Review (indigo) | Verified (green) | Rejected (red) | Locked (dark red)

**View Toggle:** "Review Queue" / "All Records" pill toggle.

**Review Queue View:**
Each pending record card shows:
- Left: 80x80px portrait thumbnail (click to enlarge in modal)
- Center: User ID (truncated), status badge (color-coded), account type badge, registration date, document links (Portrait, ID Document, Business Doc)
- Right: Eye button (expand details), Approve button (primary), Reject button (red ghost)

**Expanded Details:** Animated accordion showing verification history timeline + rejection reason input field + "Confirm Reject" button.

**All Records Table:**
Columns: User ID (mono), Type, Status (color-coded badge with dot), Registered, Deadline, Verified.
Search by user ID + status filter dropdown.

**Status Color Coding:**
| Status | Background | Text | Dot |
|---|---|---|---|
| pending | amber-500/10 | amber-400 | amber-500 |
| submitted | blue-500/10 | blue-400 | blue-500 |
| under_review | indigo-500/10 | indigo-400 | indigo-500 |
| verified | green-500/10 | green-400 | green-500 |
| rejected | red-500/10 | red-400 | red-500 |
| locked | red-500/15 | red-400 | red-600 |
| locked_final | red-600/20 | red-500 | red-700 |

**Image Preview Modal:** Click portrait → fullscreen overlay with 80vw/80vh max image, click-to-dismiss.

**Supabase Tables:**
```sql
create table kyc_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  account_type text check (account_type in ('individual', 'organization')),
  status text default 'pending',
  registered_at timestamptz default now(),
  kyc_deadline timestamptz,
  extended_deadline timestamptz,
  unlock_used boolean default false,
  portrait_url text,
  portrait_uploaded_at timestamptz,
  portrait_validation_status text,
  portrait_rejection_reason text,
  portrait_metadata jsonb,
  id_document_url text,
  id_document_uploaded_at timestamptz,
  org_logo_url text,
  org_business_name text,
  org_business_reg_doc_url text,
  org_tax_id text,
  org_contact_email text,
  org_logo_validation text,
  verified_at timestamptz,
  verified_by uuid,
  created_at timestamptz default now()
);

create table kyc_verification_history (
  id uuid primary key default gen_random_uuid(),
  kyc_record_id uuid references kyc_records not null,
  event text not null,
  details text,
  timestamp timestamptz default now()
);
```

---

### 5. TAB 3 — DevOps (Collaboration Hub) — COLOR-CODED

This is the **System Sync Board** — a full Kanban task management system with Git integration.

**Header:**
- Title: Target icon + "System Sync Board" (2xl bold white)
- Subtitle: "Coordinate tasks, declare active focus, and run sign-off workflows."
- "New Task" button (primary, Plus icon)

**Active Focus Points Banner:**
If any task has `isFocusPoint=true` and `status != done`, show blue-tinted cards at top:
- Blue gradient card with `border-blue-500/30 bg-blue-500/5 shadow-[0_0_30px_rgba(59,130,246,0.1)]`
- Avatar circle (blue-500/20), "Current Focus" label, task title (clickable), description, "Unfocus" button

**Kanban Board** (4 columns, equal width):

| Column | Title | Top Border Color | Meaning |
|---|---|---|---|
| `todo` | 📋 To Do | `border-t-2 border-t-[#757575]` | Backlog / queued |
| `in_progress` | ⚡ In Progress | `border-t-2 border-t-blue-500/50` | Actively being worked on |
| `review` | 👀 In Review | `border-t-2 border-t-yellow-500/50` | Awaiting sign-off |
| `done` | ✅ Done | `border-t-2 border-t-green-500/50` | Completed & approved |

Each column: fixed 600px height, scrollable task list, header with title + count badge.

**Task Card (within column):**
- Title (sm bold white, hover turns teal)
- Status dropdown (appears on hover, 10px, positioned top-right)
- Assignee avatar circle (5x5, first letter)
- Comment count (if any, MessageSquare icon)
- Focus toggle button (blue highlight when active, white/5 when inactive)
- If focus point: blue 1px left border strip

**Task Review Modal** (opens on card click, rendered via Portal):
- Full-screen overlay (black/80 backdrop-blur)
- Split layout: 1/3 left detail panel + 2/3 right feedback thread

**Left Panel (Details & Actions):**
- Status badge, title (2xl bold), description, assignee, created date
- Bottom actions (pinned):
  - If status=`review`: "Request Changes" (red outline) + "Approve & Sign-off" (green bg)
  - Otherwise: status dropdown (Todo / In Progress / Submit for Review)

**Right Panel (Feedback Thread):**
- Chat-style message thread:
  - Current user messages: right-aligned, teal tint
  - Other messages: left-aligned, white/5 tint
  - Supports text, inline images (base64), and audio playback
- Bottom input bar:
  - Image upload button (hidden file input)
  - Voice recording button (red pulse when recording, uses MediaRecorder API)
  - Text input (auto-height textarea)
  - Send button (teal, Send icon)

**New Task Modal:**
- Title input, Assignee dropdown (team members), Description textarea
- "Create Task" button (primary, spinner when loading)

**Git Pulse Panel** (bottom-left):
- Header: GitBranch icon (purple-400) + branch name
- Uncommitted changes list: status code + filename (mono font)

**CONTEXT.md Panel** (bottom-right):
- Rendered markdown (prose-invert)
- Edit button toggles textarea + Save button
- Uses react-markdown with remark-gfm

**DevOps Color-Coding Summary:**
```
Infrastructure Environment:
  Production  → green-500 (stable/deployed)
  Staging     → yellow-500 (in review/testing)
  Development → blue-500 (in progress/active)
  Backlog     → neutral-600 (queued)

Severity (Error Log):
  CRITICAL → red-500 (left border + bg tint + text)
  ERROR    → amber-500 (left border + bg tint + text)
  WARNING  → yellow-500
  INFO     → blue-500

Task Status:
  todo        → gray/neutral
  in_progress → blue (active development)
  review      → yellow/amber (staging/QA)
  done        → green (production/shipped)

Focus Point → blue-500 accent (glowing card + left strip)
```

**Supabase Tables:**
```sql
create table devops_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  assignee text default 'Unassigned',
  status text default 'todo' check (status in ('todo','in_progress','review','done')),
  is_focus_point boolean default false,
  reviewer text,
  comments jsonb default '[]',
  created_at timestamptz default now()
);
```

---

### 6. TAB 4 — Founding Circle

**Stats Grid** (5 columns): Total Signups | Pending (yellow) | Approved (blue) | Activated (green) | Slots Left (teal)

**Actions Bar:** Filter pills (all/pending/approved/activated) + Refresh + "Approve First 150" bulk action + Export CSV

**Members Table:**
Columns: Queue # (bold), Email (+ referral source sub-text), Status (color-coded pill with icon), Access Code (mono), Joined date, Actions (Approve button if pending + Delete button)

**Status Colors:**
- pending: yellow-500
- approved: blue-500
- activated: green-500

**Supabase Table:**
```sql
create table founding_members (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  queue_number serial,
  access_code text,
  status text default 'pending' check (status in ('pending','approved','activated')),
  signed_up_at timestamptz default now(),
  approved_at timestamptz,
  activated_at timestamptz,
  referral_source text,
  notes text
);
```

---

### 7. TAB 5 — Feedback Management

**Stats Row** (4 cards): Total | New (blue) | In Progress (yellow) | Resolved (green)

**Filters:** Status dropdown + Category dropdown (bug/feature/improvement/other) + Priority dropdown (critical/high/medium/low) + Refresh button

**Split Layout** (2 columns):
- Left: Scrollable feedback list (max 600px height)
  - Each item: category icon (Bug=red, Feature=yellow, Improvement=blue) + title + status badge + description preview + submitter name + priority color + date
  - Selected item has teal ring highlight
- Right: Detail panel (sticky)
  - Title, submitter name/email, status/category/priority badges, description, page URL link, screenshot link, status update buttons row, timestamps

**Category Icons:**
- bug → Bug (red)
- feature → Lightbulb (yellow)
- improvement → AlertTriangle (blue)
- other → MessageSquare (neutral)

**Priority Colors:** low=gray, medium=blue, high=orange, critical=red

**Supabase Table:**
```sql
create table feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  user_name text,
  user_email text,
  category text check (category in ('bug','feature','improvement','other')),
  priority text default 'medium' check (priority in ('low','medium','high','critical')),
  title text not null,
  description text,
  page_url text,
  screenshot_path text,
  status text default 'new' check (status in ('new','in_progress','resolved','closed')),
  admin_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

---

### 8. TAB 6 — Platform Planning (Roadmap)

**Stats Row** (4 cards): Total Items | Completed (green) | In Progress (yellow) | Planned (blue)

**Quarter Filter:** Pill buttons for each quarter + "All Quarters"

**Roadmap Timeline:** Vertical list of roadmap items, each showing:
- Status icon (color-coded: Clock=planned/gray, Flag=in_progress/yellow, CheckCircle=completed/green, Flag=blocked/red)
- Title + status badge + high-priority star (orange)
- Description, quarter label, category badge
- Progress bar for in-progress items (gradient teal to purple)
- Staggered fade-in animation (100ms delay per item)

**"Add Roadmap Item" button** at bottom (outline style)

**Supabase Table:**
```sql
create table roadmap_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text default 'planned' check (status in ('planned','in_progress','completed','blocked')),
  priority text default 'medium' check (priority in ('low','medium','high')),
  category text,
  quarter text,
  progress integer default 0,
  created_at timestamptz default now()
);
```

---

### 9. TAB 7 — Interactions (Audit Log)

**Header:** "Interaction Logs" + count + Refresh button + "Audit Log" live indicator (pulsing teal dot)

**Error Banner:** Red-tinted card if API fails, with retry button.

**Filters:** Search input (by user/action) + Type dropdown (All/Signals/Reflections/Connections/Delegations)

**Log Entries:** Vertical list with:
- Category icon (color varies: teal=signal, purple=reflection, red=connection, amber=delegation)
- User name + category pill badge
- Action name (10px uppercase)
- Details text
- Expandable metadata panel (key-value pairs, toggled by Eye icon)
- Time ago label (right-aligned)
- Staggered slide-in animation

**Footer:** "Showing latest N interactions — Sourced from platform audit logs"

**Loading State:** 4 skeleton cards with pulsing animation

**Supabase Table:**
```sql
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  user_id uuid,
  username text,
  details text,
  metadata jsonb,
  timestamp timestamptz default now()
);
```

---

### 10. TAB 8 — Users (Identity Directory)

**Header:** "Identity Directory" + "Managing N Verified Identities" + Search input + Refresh button

**Users Table:**
| Column | Content |
|---|---|
| Identity | Avatar (gradient bg or image) + admin shield badge + name + email + deletion-pending dot |
| System Role | Status dot (teal glow if admin) + role label (Administrator/Verified User/DELETION PENDING in red pulse) |
| Created | Date (10px mono) |
| Actions | BLUEPRINT button (Fingerprint icon) + PROMOTE/DEMOTE toggle (teal/purple) + Delete (Trash2, red) |

**Blueprint Drill-Down View:**
When clicking BLUEPRINT, replace the table with:
- Back button ("Back to Directory")
- User header with Fingerprint icon
- `UserBlueprintDetail` component showing:
  - Left sidebar: Snapshot timeline (selectable history entries)
  - Main content: 15-layer personality grid grouped by 5 clusters:
    - Cluster A — Core Being (Layers 1-3): Core Disposition, Energy Orientation, Perception & Information Processing
    - Cluster B — Cognitive & Motivational (Layers 4-6): Decision Logic, Motivational Drivers, Stress & Pressure Patterns
    - Cluster C — Emotional & Behavioural (Layers 7-9): Emotional Regulation & Expression, Behavioural Rhythm & Execution, Communication Mode
    - Cluster D — Relational & Social (Layers 10-12): Relational Energy & Boundaries, Relational Patterning, Social Role & Influence Expression
    - Cluster E — Trajectory & Development (Layers 13-15): Identity Coherence & Maturity, Growth Arc & Learning Orientation, Life Navigation & Current Edge
  - Each layer card: number badge, name, description/evidence preview, confidence percentage
  - Click card opens modal with full evidence text, signal protocol ID, confidence rating, layer definition

**Supabase Tables:**
```sql
create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text,
  avatar_url text,
  is_admin boolean default false,
  status text default 'active',
  created_at timestamptz default now()
);

create table blueprint_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  source text,
  traits jsonb default '[]',
  created_at timestamptz default now()
);
```

---

### 11. TAB 9 — Errors (System Events)

**Header:** "System Events & Latency" + "Security Audit Level: High-Fidelity" (red) + "Clear Buffer" button

**Error Cards** (severity color-coded):

| Level | Left Border | Icon BG | Badge Colors |
|---|---|---|---|
| CRITICAL | `border-l-4 border-l-red-500` | red-500 | bg-red-500/10 text-red-500 border-red-500/20 |
| ERROR | `border-l-4 border-l-amber-500` | amber-500 | bg-amber-500/10 text-amber-500 border-amber-500/20 |
| WARNING | `border-l-4 border-l-blue-500` | blue-500 | bg-blue-500/10 text-blue-500 border-blue-500/20 |
| INFO | `border-l-4 border-l-blue-500` | blue-500 | bg-blue-500/10 text-blue-500 border-blue-500/20 |

Each card shows: Terminal icon, severity badge, service name (10px uppercase bold), message, error code (mono), time ago.

**Advanced Threat Detection Panel:**
- ShieldAlert icon + title (teal)
- Status message about monitoring
- "View Security Policy" link

**Supabase Table:**
```sql
create table error_logs (
  id uuid primary key default gen_random_uuid(),
  level text check (level in ('CRITICAL','ERROR','WARNING','INFO')),
  service text,
  message text,
  code text,
  resolved boolean default false,
  created_at timestamptz default now()
);
```

---

### 12. TAB 10 — System

**Two-column layout:**

**Left — Core Cognitive Services:**
4 service status cards:
- Identity Oracle (Not Connected, amber)
- Emergent Pattern Engine (Not Connected, amber)
- Relational Context Router (Not Connected, amber)
- Evidence Persistence Vault (JSON File Store, amber)

Each: name, load indicator, status dot (amber glow), status label.

**Right Top — System Integrity:**
- RefreshCw icon (hover rotate animation)
- "System Integrity" title + description
- "Run Full Diagnostics" button (primary, full-width)
- On click: shows toast with API reachability result

**Right Bottom — Deployment Portal:**
- Globe icon (teal) + "Deployment Portal" + "View staging & production"
- ArrowUpRight icon, clickable card style

---

### 13. ADMIN ROUTE GUARD

- Check `auth.isAdmin` from Supabase user metadata
- If not authenticated, redirect to `/login`
- If authenticated but not admin, redirect to `/home`
- Loading state: "Verifying Credentials..." centered on dark bg

---

### 14. GLOBAL BEHAVIORS

- **Auto-refresh:** Analytics, feedback count, and KYC pending count poll every 60 seconds
- **DevOps data** polls every 30 seconds
- **Optimistic updates** for task status changes and focus point toggles
- **All modals** use `createPortal` to render at document.body level
- **All animations** use Framer Motion with `AnimatePresence mode="wait"`
- **Tab switching** animates content with opacity+y slide (enter from below, exit upward)
- **Notification badges** on Feedback tab (red pulse) and KYC tab (amber pulse) showing unread/pending counts

---

### 15. SEED DATA

Pre-populate with sample data for demo purposes:
- 5 sample users (mix of admin and regular)
- 4 error log entries (1 CRITICAL, 1 ERROR, 1 WARNING, 1 INFO)
- 6 roadmap items across Q4 2025 — Q2 2026
- 3 DevOps tasks in different columns
- 2 founding circle members
- 2 feedback items

---

## PROMPT END

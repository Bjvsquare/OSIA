# LOVABLE IMPORT PROMPT — Feature Group 12: Settings, Profile & Privacy

> **Prerequisites**: Groups 1–11 deployed. Auth context, tour system, nudge schedule, Supabase Storage for avatars.

---

## PROMPT START

Add the **OSIA Settings, Profile & Privacy** system — a left-nav 5-tab settings hub and a standalone privacy dashboard. This is the final feature group. It covers identity/profile editing, notification nudge scheduling, 2FA security, commercial/subscription management, data sovereignty controls, and a separate full-screen privacy consent manager.

Design system: `#02050F` page, `#0A1128` cards, `#38A3A5` teal, Inter font, Framer Motion, Lucide React.

---

### 1. SETTINGS PAGE

**Route:** `/settings` (with optional `?tab=` query param)

**Component:** `src/features/settings/SettingsPage.tsx`

**Layout:** `min-h-screen bg-[#02050F]`, PlexusBackground, `max-w-4xl mx-auto px-6 pt-8 pb-20`

**Grid:** `grid md:grid-cols-[240px_1fr] gap-16`

---

#### LEFT NAV (aside, space-y-2):

5 nav buttons (full-width):

| id | Label | Icon |
|---|---|---|
| profile | Identity & Profile | User |
| notifications | Insights & Nudges | Bell |
| security | Security (2FA) | Lock |
| commercial | Commercial Status | CreditCard |
| data | Data Sovereignty | ShieldCheck |

Button style:
- Active: `bg-teal/10 text-teal-400 border border-teal/20`
- Inactive: `text-neutral-500 hover:text-neutral-300`
- Label: `text-[11px] font-black uppercase tracking-wider`

**URL sync:** On mount, read `?tab=` → `setActiveTab(tab)`. On tab change → `navigate(/settings?tab={id})` (replace).

---

#### RIGHT CONTENT (AnimatePresence mode="wait"):

Each panel: `motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}`

---

#### TAB: PROFILE — Identity & Profile

**Avatar section (`flex items-center gap-8`):**
- Avatar container: `w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-teal/20 to-purple/20 border border-white/10 overflow-hidden shadow-2xl`
  - If `avatarUrl`: `<img src="{resolveAvatarUrl(url)}?t={refreshKey}" />`
  - Else: initial letter in `text-2xl font-black text-teal-400`
- Camera label (absolute -bottom-2 -right-2): `p-2 bg-[#0A1128] border border-white/10 rounded-full`, Camera icon (14px)
  - Hidden file input `accept="image/*"` → `handleAvatarUpload`
  - Validates: must be image/*, < 15MB → `POST /api/users/avatar` (FormData)
- Name (2xl bold) + Status: "Fortified" (if 2FA) or "Stable Calibration" (xs neutral-500 uppercase)

**Profile card** (`p-8 border-white/5 bg-[#0A1128]/40`):
- "COGNITIVE DISPLAY NAME" (10px neutral-600 uppercase)
- View mode: name text + "Edit Profile" secondary button
- Edit mode: text input (autofocus) + "Cancel" + "Save Changes" primary
  - `PATCH /api/users/profile { name }` → refreshProfile()
- Divider + "VERIFIABLE EMAIL" label + email (read-only)

**Professional Affiliations card** (Building2 icon, purple):
- Fetch on tab switch: `GET /api/organizations/my-memberships`
- If memberships: list cards with org logo (initial fallback) + org name + role (purple) + department
  - "Share" outline button (opacity-0, group-hover:opacity-100) → copies org profile URL
- Empty: dashed border + "You are not a member of any organization." + "Find or Create Organization" → `/signup/organization`

---

#### TAB: NOTIFICATIONS — Insights & Nudges

**Platform Tour card:**
- Play icon (teal, `w-12 h-12 rounded-2xl bg-teal/20`) + "Guided Platform Tour" (sm bold)
- If tour completed: "You've completed the tour. Restart anytime."
- Button: "Start Tour" / "Restart Tour" outline → `localStorage.removeItem('osia_tour_completed')` + `startTour()` + `navigate('/home')`

**Daily Nudge card:**
- Bell icon (teal) + "Evening Practice Nudge" + "{time} scheduled" or "No nudge scheduled"
- "QUICK SELECT" (10px neutral-600): 4 preset buttons (`grid-cols-4 gap-3`):
  - 6 PM (18:00) | 7 PM (19:00) | 8 PM (20:00) | 9 PM (21:00)
  - Selected: `bg-teal/15 border-teal ring-1 ring-teal text-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.15)]`
  - On click: auto-save `PUT /api/practice/nudge-schedule { notifyAt: time }`
- "EXACT TIME" (10px neutral-600): `<input type="time">` + "Set Time" primary button → same API
- Disable link (if time set, border-t pt-2): "Disable nudge" (xs neutral-500 hover:red-400) → `DELETE /api/practice/nudge-schedule`

---

#### TAB: SECURITY — 2FA

**Header:** "Access Control" (2xl bold) + "Secure your digital twin with industrial-grade authentication." (sm neutral-400)

**2FA Card** (`p-8 border-white/5 bg-[#0A1128]/40`):

**State 1 — idle:**
- Smartphone icon (teal) + "2-Factor Authentication" + "Use an authenticator app (Authy, Google) for secure login."
- "Configure" outline sm button → `handle2FASetup`
  - `POST /api/auth/2fa/setup` → `{ qrCodeUrl, secret }`
  - → state = 'setup'

**State 2 — setup:**
- Smartphone icon + "Scan QR Code" + "Use Google Authenticator or Authy"
- QR code image: `<img src={qrCodeUrl} className="w-48 h-48" />` in white bg container (`p-6 bg-white rounded-2xl`)
- Manual code (font-mono xs gray-600 below)
- "Enter 6-digit code" label + `<input type="text" maxLength={6} pattern="\d*">` (monospace, text-center, text-2xl, `w-full tracking-widest`)
- Cancel ghost + "Verify & Enable" primary (disabled if code.length !== 6)
  - `POST /api/auth/2fa/verify { secret, code }` → state = 'enabled'

**State 3 — enabled:**
- Check icon (green `w-12 h-12 rounded-2xl bg-green/10`) + "2FA is Active" + "Your account is protected..."
- "Disable" outline sm (red text, red border) → `DELETE /api/auth/2fa` → state = 'idle'

**WebAuthn row** (disabled, `opacity-60 grayscale cursor-not-allowed`):
- ShieldCheck icon + "Security Keys (WebAuthn)" + "Yubikey and biometrics. Coming later." + "Beta" chip

**Sign out section:** "Sign out of all sessions" — red text secondary → `POST /api/auth/signout-all` → `navigate('/')`

---

#### TAB: COMMERCIAL — Commercial Status

Renders `<SubscriptionManagement />` (from Group 11) inline.

---

#### TAB: DATA — Data Sovereignty

**Header:** "Data Sovereignty" (2xl bold) + "Manage your digital twin's footprint and identity persistence." (sm neutral-400)

**Persistence Guard card** (teal border/bg):
- ShieldCheck (teal) + "Persistence Guard" + "Active State Monitoring"
- Description: "Your data is captured periodically and on exit to ensure your digital twin remains in sync..."
- Status chip: Check icon + "Continuous Persistence Enabled" (9px teal uppercase)

**Purge Identity card** (red border/bg):
- X icon (red) + "Purge Identity" + "Permanent Data Removal"
- Description: "Requesting deletion will notify administrators to permanently remove your account, biometric signals, and all 15 layers..."
- If `userProfile.status === 'deletion_pending'`:
  - Red card: "Status: Deletion Pending" + "An administrator is reviewing your request." (10px red-300/60)
- Else: "Request Account Deletion" red ghost button → confirm dialog → `POST /api/users/deletion-request` → refreshProfile()

---

### 2. PRIVACY DASHBOARD

**Route:** `/privacy`

**Component:** `src/features/settings/PrivacyDashboard.tsx`

**Layout:** `min-h-screen bg-[#02050F]`, PlexusBackground, `max-w-4xl mx-auto px-6 pt-8 pb-20`, `space-y-16`

**Header (text-center):**
- "Your data. Your choice." (4xl bold tracking-tight)
- "Trust isn't a feature. It's the foundation." (xs neutral-500 italic)

**Data at a glance** (`sm:grid-cols-3 gap-6`):

| Label | Status | Icon |
|---|---|---|
| Personal Insights | Active | Eye |
| Reflections | {count} Stored | Shield |
| Connect Sessions | None Active | Lock |

Cards: `p-6 border-white/5 bg-[#0A1128]/40` — icon (teal 20px) + label (10px neutral-400 uppercase) + status (xl bold white)

**Permissions section:**

3 consent items (card `p-6 flex items-center justify-between`):

| Title | Status |
|---|---|
| Personal Insights & Living Map | Active (Required) |
| Relational Connect | Paused |
| Product Improvement & Research | Inactive |

Each: title (sm bold white) + "Status: {status}" (10px neutral-500 uppercase) + "Change" secondary button
- On "Change": `PATCH /api/privacy/consent { consentId, status }` → refetch

**Your choices section** (`sm:grid-cols-2 gap-4`):

- **Export my data** card (Download icon teal): `hover:bg-white/5` → `POST /api/users/export-data` → download ZIP
- **Delete account** card (Trash2 icon red): `hover:bg-red/5` → confirm dialog → `POST /api/users/deletion-request`

Footer note: "OSIA does not sell, scrape, or infer beyond what you share." (10px neutral-700 italic centered pt-8)

---

### 3. SUPABASE SCHEMA

```sql
-- Notification schedules
create table nudge_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  notify_at text not null,   -- "19:00"
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Privacy consents
create table privacy_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  consent_id text not null,  -- 'personal' | 'relational' | 'research'
  status text default 'inactive' check (status in ('active','paused','inactive')),
  updated_at timestamptz default now(),
  unique (user_id, consent_id)
);

-- RLS
alter table nudge_schedules enable row level security;
alter table privacy_consents enable row level security;
create policy "Own nudge schedule" on nudge_schedules for all using (auth.uid() = user_id);
create policy "Own consents" on privacy_consents for all using (auth.uid() = user_id);
```

---

### 4. API ENDPOINTS

```
PATCH  /api/users/profile                → { name }
POST   /api/users/avatar                 → FormData { avatar }
GET    /api/organizations/my-memberships → OrgMembership[]
GET    /api/practice/nudge-schedule      → { schedule: { notifyAt } }
PUT    /api/practice/nudge-schedule      → { notifyAt }
DELETE /api/practice/nudge-schedule
POST   /api/auth/2fa/setup               → { qrCodeUrl, secret }
POST   /api/auth/2fa/verify              → { secret, code }
DELETE /api/auth/2fa
POST   /api/auth/signout-all
POST   /api/users/deletion-request
POST   /api/users/export-data            → download ZIP
GET    /api/privacy/consents             → UserConsent[]
PATCH  /api/privacy/consent              → { consentId, status }
```

---

### 5. ROUTING

```
/settings          → SettingsPage (?tab=profile|notifications|security|commercial|data)
/privacy           → PrivacyDashboard
```

Both require authentication (ProtectedRoute).

---

## PROMPT END

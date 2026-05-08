# OSIA / Synapse → Lovable: Full Platform Feature Inventory

> **Purpose**: Compartmentalize every feature in the Synapse platform into self-contained, shippable groups for sequential import into Lovable.

---

## Platform Overview

| Attribute | Value |
|---|---|
| **Platform Name** | OSIA (Open Self-Intelligence Architecture) |
| **Codebase** | `sentari-app` — Vite + React + TypeScript + TailwindCSS |
| **Backend** | Express.js + JSON file-based DB (`JsonDb`) |
| **Auth** | JWT + bcrypt, admin role gating |
| **Design System** | Custom dark-mode "SaaS-Modern-Dark" with `osia-*` color tokens |
| **Key Libraries** | Framer Motion, Lucide React, React Markdown, clsx/tailwind-merge |

---

## Design System Tokens (Shared Across ALL Groups)

```
osia-deep-900: #0A1128    osia-deep-800: #132046    osia-deep-700: #1C2F64
osia-purple-900: #1A103C  osia-purple-500: #6B4C9A  osia-purple-300: #9D84C2
osia-teal-900: #0D2B28    osia-teal-500: #38A3A5    osia-teal-300: #80CED7
osia-amber-500: #D4A373   osia-amber-300: #E9C46A   osia-amber-100: #FEFAE0
osia-neutral-900: #121212  osia-neutral-800: #1E1E1E  osia-neutral-500: #757575
Font: Inter
```

---

## Feature Groups (Ship Order)

### 🚀 GROUP 1 — Admin Dashboard + DevOps ← SHIP FIRST

| Component | Type | Description |
|---|---|---|
| `AdminPage.tsx` | Page | Main command center with 10-tab navigation, quick stats grid |
| `Analytics.tsx` | Panel | DAU/WAU/MAU metrics, signal activity chart (7d bar), regional distribution |
| `UserManagement.tsx` | Panel | Identity directory table with search, promote/demote, delete, blueprint drill-down |
| `UserBlueprintDetail.tsx` | Panel | 15-layer personality blueprint viewer with snapshot timeline, cluster grouping, detail modal |
| `ErrorLog.tsx` | Panel | Severity-coded system event log (CRITICAL/ERROR/WARNING/INFO), threat detection |
| `Interactions.tsx` | Panel | Audit log viewer with category filters (signal/reflection/connection/delegation) |
| `FoundingCircle.tsx` | Panel | Founding member queue management, bulk approve, CSV export, delete |
| `FeedbackManagement.tsx` | Panel | Bug/feature/improvement tracker with status workflow, screenshot/page-url links |
| `PlatformPlanning.tsx` | Panel | Roadmap timeline with quarter filters, status badges, progress bars |
| `CollaborationHub.tsx` (DevOps) | Panel | Kanban sync board (4 columns), focus-point system, task review modal with multimedia feedback (text/image/audio), Git pulse activity, CONTEXT.md editor |
| `AdminRoute.tsx` | Guard | Client-side role-based route protection |
| `adminMiddleware.ts` | Middleware | Server-side JWT + DB admin check |
| `AdminService.ts` | Service | User CRUD, analytics aggregation |
| `adminRoutes.ts` | Routes | 15 endpoints for users, analytics, errors, interactions, blueprint, devops, tasks |
| `AuditLogger.ts` | Service | Append-only audit log |
| `ErrorLogger.ts` | Service | Error persistence and resolution |

**Backend API Endpoints:**
- `GET /api/admin/users` — List all users (with profiles, origin seeds)
- `GET /api/admin/users/:id` — User detail
- `DELETE /api/admin/users/:id` — Delete user + cascade
- `PATCH /api/admin/users/:id/role` — Toggle admin role
- `GET /api/admin/analytics` — Platform analytics (growth, regional, activity)
- `GET /api/admin/errors` — Error log
- `POST /api/admin/errors/:id/resolve` — Resolve error
- `GET /api/admin/interactions` — Audit logs (latest 200)
- `GET /api/admin/blueprint/:userId/history` — Blueprint snapshot history
- `GET /api/admin/blueprint/snapshot/:id` — Snapshot detail
- `POST /api/admin/migrate` — Trigger migration
- `GET /api/admin/devops` — Git branch, log, status, CONTEXT.md
- `PUT /api/admin/devops/context` — Update CONTEXT.md
- `GET /api/admin/devops/tasks` — List tasks
- `POST /api/admin/devops/tasks` — Create task
- `PATCH /api/admin/devops/tasks/:id` — Update task (status, focus, comments)
- `DELETE /api/admin/devops/tasks/:id` — Delete task

**DevOps Color Coding:**

| Status | Color | Border |
|---|---|---|
| To Do | Neutral gray | `border-osia-neutral-600` |
| In Progress | Blue | `border-blue-500/50` |
| In Review | Yellow/Amber | `border-yellow-500/50` |
| Done | Green | `border-green-500/50` |
| CRITICAL error | Red left-border | `border-l-red-500` |
| ERROR | Amber left-border | `border-l-amber-500` |
| WARNING/INFO | Blue left-border | `border-l-blue-500` |
| Focus Point | Blue accent bar | `bg-blue-500` left strip |

**Dependencies:** Auth context (Group 2), UI components (Card, Button, Toast)

---

### 🔐 GROUP 2 — Authentication & Authorization

| Component | Files |
|---|---|
| Login/Signup | `LoginPage.tsx`, `AuthContext.tsx` |
| Magic Link | `CheckEmailScreen.tsx`, `ExpiredLinkScreen.tsx` |
| Route Guards | `AdminRoute.tsx`, auth middleware |
| JWT Service | `jwt.ts`, `UserService.ts` |

---

### 🧬 GROUP 3 — Onboarding & Origin Seed

| Component | Files |
|---|---|
| Onboarding Flow | `OnboardingFlow.tsx`, `QuestionRenderer.tsx`, `ConsentScreen.tsx`, `SignalsEntryScreen.tsx` |
| Origin Seed | `OriginSeedService.ts`, `originSeedRoutes.ts` |
| Consent | `ConsentLedger` model |

---

### 🏠 GROUP 4 — Home & Dashboard

| Component | Files |
|---|---|
| Twin Home | `TwinHome.tsx` |
| Dashboard | `dashboard/*` |
| Visual Components | `OriginOrb.tsx`, `PlexusBackground.tsx`, `CosmicField.tsx`, `Scene.tsx` |

---

### 🧠 GROUP 5 — OSIA Intelligence Engine

| Component | Files |
|---|---|
| Personality Thesis | `PersonalityThesisGenerator.ts`, `thesis/*` |
| Core Insights Hub | `CoreInsightsHubGenerator.ts`, `insights/*` |
| Relational Connectors | `RelationalConnectorsGenerator.ts`, `connectors/*` |
| OSIA Evolution | `OSIAEvolutionService.ts`, `OSIAIntelligenceService.ts` |
| Narrative Synthesizer | `NarrativeSynthesizer.ts`, `HolisticSynthesizer.ts` |
| Claim Engine | `ClaimEngine.ts` |
| Snapshot Store | `OSIASnapshotStore.ts`, `SnapshotCascadeService.ts` |

---

### 🔄 GROUP 6 — Patterns & Recalibration

| Component | Files |
|---|---|
| Patterns Page | `PatternsPage.tsx` |
| Pattern Engine | `PatternEngine.ts` |
| Recalibration | `RecalibrationService.ts` |
| Protocols | `ProtocolService.ts`, `ProtocolRecommendationService.ts` |
| Thought Experiments | `ThoughtExperimentService.ts` |

---

### 🗺️ GROUP 7 — Journey & Gamification

| Component | Files |
|---|---|
| Timeline | `TimelinePage.tsx` |
| Journey Service | `JourneyService.ts` |
| Readiness | `ReadinessPage.tsx` |
| Badges & Levels | Journey API endpoints |
| Check-in | `CheckInPage.tsx` |

---

### 📐 GROUP 8 — Blueprint & Layers

| Component | Files |
|---|---|
| Blueprint Page | `blueprint/*` |
| Layer Detail | `LayerDetail.tsx` |
| Blueprint Service | `BlueprintService.ts` |
| Life Areas | `LifeAreaService.ts` |

---

### 👥 GROUP 9 — Teams & Organizations

| Component | Files |
|---|---|
| Team Page | `TeamPage.tsx` |
| Team Service | `TeamService.ts`, `TeamAnalyticsService.ts`, `TeamDynamicsService.ts` |
| Organizations | `organization/*`, `organizations/*`, `OrganizationService.ts` |
| Org Culture | `OrgCultureService.ts` |

---

### 🔗 GROUP 10 — Connect & Compatibility

| Component | Files |
|---|---|
| Connect Invite | `ConnectInvitePage.tsx` |
| Shared View | `SharedViewPage.tsx` |
| Connection Service | `ConnectionService.ts` |
| Compatibility | `CompatibilityService.ts` |
| Synastry | `SynastryService.ts` |

---

### ⚙️ GROUP 11 — Settings, KYC & Privacy

| Component | Files |
|---|---|
| Settings | `settings/*` |
| Privacy Dashboard | `PrivacyDashboard.tsx` |
| KYC Flow | `kyc/*`, `KYCService.ts`, `ImageValidationService.ts` |
| Data Export/Delete | Privacy API endpoints |

---

### 🎙️ GROUP 12 — Voice, Rituals & Advanced

| Component | Files |
|---|---|
| Voice Agent | `voice/*` |
| Rituals | `rituals/*` |
| Practice | `practice/*` |
| Lab | `lab/*` |
| Behavioral Activation | `BehavioralActivationService.ts` |
| Nudges | `NudgesService.ts` |
| Astrology | `AstrologyService.ts` |
| Pro Features | `pro/*` |
| Subscription | `subscription/*`, `StripeService.ts` |
| Marketing/Landing | `marketing/*`, `LandingPage.tsx` |
| Tour | `tour/*` |
| Founding/Renewal | `founding/*`, `renewal/*` |

---

## Shared Infrastructure (Ship with Group 1)

| Component | Purpose |
|---|---|
| `Card.tsx` | Glass-morphism card with rounded-2xl, backdrop-blur, hover glow |
| `Button.tsx` | 4 variants (primary/secondary/outline/ghost), 3 sizes, pill-shaped |
| `Toast.tsx` | 4 types (success/error/info/warning), auto-dismiss, bottom-right fixed |
| `AppLayout.tsx` | Sidebar navigation shell |
| `api.ts` | Centralized API service with auth token injection |
| `resolveAvatarUrl.ts` | Avatar URL resolver utility |
| TailwindCSS Config | Custom `osia-*` color palette, Inter font |

---

## Ship Sequence Dependency Graph

```
Group 1: Admin + DevOps
  └── Group 2: Auth
        ├── Group 3: Onboarding
        │     └── Group 4: Home/Dashboard
        │           ├── Group 5: OSIA Intelligence
        │           │     ├── Group 6: Patterns
        │           │     ├── Group 8: Blueprint/Layers
        │           │     ├── Group 10: Connect
        │           │     └── Group 12: Voice/Advanced
        │           └── Group 7: Journey
        ├── Group 9: Teams/Orgs
        └── Group 11: Settings/KYC
```

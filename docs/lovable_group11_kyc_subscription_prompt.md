# LOVABLE IMPORT PROMPT — Feature Group 11: KYC & Subscription

> **Prerequisites**: Groups 1–10 deployed. Stripe integration required for subscription checkout. Supabase Storage for portrait uploads.

---

## PROMPT START

Add the **OSIA Identity Verification (KYC) and Subscription** system — the trust and monetization layer of the platform. KYC is a photo-based identity verification with a deadline, countdown, extension request, and verification history timeline. Subscription covers 3 primary tiers (Entry/Core/Pro) + Teams/Enterprise and API tiers, Stripe-powered checkout, and subscription management.

Design system: `#02050F` page, `#0A1128` cards, `#38A3A5` teal, Inter font, Framer Motion, Lucide React.

---

### 1. KYC SUBMISSION FLOW

**Route:** `/kyc`

**Component:** `src/features/kyc/KYCSubmissionFlow.tsx`

**Multi-step flow** (5 steps):

```typescript
type KYCStep = 'intro' | 'consent' | 'photo' | 'review' | 'submitted';
```

**Step 1 — Intro:**
- Shield icon (teal, `w-20 h-20 rounded-full bg-teal/10 border border-teal/20`)
- "Verify Your Identity" (3xl bold)
- "OSIA uses a single portrait photo to verify you're a real person. No ID documents required."
- "What we need" list (3 items with Check icons):
  - A clear photo of your face
  - Consistent with your profile picture
  - Taken in good lighting
- "Privacy Promise" amber card: photo stored securely, never shared, deleted after verification
- "Begin Verification" teal button

**Step 2 — Consent:**
- "Before we continue" (2xl bold)
- 4 consent checkboxes (all must be checked to proceed):
  1. "I consent to OSIA processing my portrait photo for identity verification"
  2. "I understand my photo will be stored securely and deleted after verification"
  3. "I confirm this photo accurately represents me"
  4. "I agree to OSIA's biometric data processing policy"
- "I Agree & Continue" teal button (`disabled` until all checked)

**Step 3 — Photo capture:**
- Camera capture area (`aspect-square max-w-sm mx-auto rounded-2xl overflow-hidden border-2 border-teal/30`):
  - If camera active: live `<video>` element
  - Overlay: face guide oval (`border-2 border-teal/50 rounded-full`)
  - "Take Photo" button (Camera icon, teal circle at bottom)
  - Or: "Upload instead" file input (`accept="image/*"`)
- Preview mode (after capture): captured image + "Retake" ghost + "Use this photo" teal button
- Tips: "Look directly at camera", "Ensure face is well lit", "Remove glasses if possible"

**Step 4 — Review:**
- Preview of photo (200px circle, ring-2 ring-teal)
- "This is how your verification photo will appear."
- "Submit for Verification" primary button → `POST /api/kyc/submit` (multipart/form-data photo)
- Loader2 spinner during upload

**Step 5 — Submitted:**
- CheckCircle2 animation (ping rings, teal)
- "Verification submitted." (3xl bold)
- "We'll review your photo within 24 hours. You'll be notified when complete."
- Timeline shows: submitted → under_review → verified
- "Back to Home" button → `/home`

---

### 2. KYC STATUS PAGE

**Route:** `/kyc/status`

**Component:** `src/features/kyc/KYCStatusPage.tsx`

**Data:** `GET /api/kyc/status` → KYCRecord (refetchInterval: 30s)

```typescript
interface KYCRecord {
  status: 'pending' | 'submitted' | 'under_review' | 'verified' | 'rejected' | 'locked' | 'locked_final';
  registeredAt: string;
  kycDeadline: string;
  extendedDeadline?: string;
  unlockUsed: boolean;
  portrait?: { imageUrl: string; uploadedAt: string; validationStatus: string; rejectionReason?: string };
  verificationHistory: { event: string; timestamp: string; details?: string }[];
  verifiedAt?: string;
  timeRemaining?: { days: number; hours: number; minutes: number };
  isOverdue: boolean;
}
```

**Status config:**
| Status | Label | Color | Icon |
|---|---|---|---|
| pending | Pending | amber-400 | Clock |
| submitted / under_review | Under Review | blue-400 | Shield |
| verified | Verified | green-400 | CheckCircle |
| rejected | Rejected | red-400 | XCircle |
| locked | Locked | red-400 | AlertTriangle |
| locked_final | Permanently Locked | red-500 | AlertTriangle |

**Layout** (`max-w-2xl mx-auto py-8`):
- Back arrow button → navigate(-1)
- "Verification Status" (2xl bold)

**Status Card** (`{config.bg} border border-white/10 rounded-2xl p-6`):
- Icon box + status label (lg bold, config.color) + contextual subtitle:
  - pending → "Time remaining: {days}d {hours}h {minutes}m"
  - verified → "Verified on {date}"
  - rejected → rejectionReason || "Please resubmit your photo"
  - locked → "Deadline has passed"
- Action buttons:
  - pending/rejected → "Complete Verification" / "Resubmit Photo" teal → `/kyc`
  - locked (unlockUsed = false) → "Request 3-Day Extension" amber (RefreshCw) → `POST /api/kyc/extend`
- Extension error display (xs red-400)

**Countdown timer** (if pending and timeRemaining):
- `grid grid-cols-3 gap-4 mt-4`
- Days | Hours | Minutes — each: `bg-white/5 rounded-xl p-4 text-center`
- Value (3xl bold white) + label (10px neutral-600 uppercase)

**Submitted Portrait** (if portrait exists):
- 200px rounded preview + "Uploaded {datetime}" (xs neutral-500)
- Rejection reason card (red border) if `rejectionReason`

**Verification Timeline** (dot + vertical line):
- `bg-white/[0.03] border border-white/5 rounded-2xl p-6`
- Each event: teal dot + line connector + event name (formatted, capitalized) + details (xs neutral-500) + timestamp (10px neutral-600)

---

### 3. PRICING PAGE

**Route:** `/pricing`

**Component:** `src/features/subscription/PricingPage.tsx`

**Layout:** `min-h-screen bg-[#02050F]`, PlexusBackground, `relative z-10 pt-32 container mx-auto px-6`

**Header (text-center max-w-3xl mx-auto mb-20):**
- "Pricing Architecture." (5xl bold tracking-tight, `initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}`)
- "Choose the depth of your journey. From individual curiosity to professional deployment." (neutral-400 text-lg, delay 0.1s)

**Primary tiers grid** (`md:grid-cols-3 gap-8 max-w-6xl mx-auto`):

| Tier | Price | Features |
|---|---|---|
| Entry | Free | 3 foundational layers, Basic symbolic twin, 1 connector comparison, Relational highlight summary |
| Core ⭐ | $29/mo | Full 15-layer unlock path, Evolving symbolic twin, Unlimited connectors, Growth dashboard, Weekly insight cycles, 7-day free trial |
| Pro | $299/yr | Multi-profile management, Professional dashboard, Group chemistry reports, Exportable client reports, Certification L1 |

Card styles: `p-8 flex flex-col border-white/5 bg-[#0A1128]/40 hover:border-white/10`
Core (highlighted): `ring-2 ring-teal/50 transform scale-105 z-20`
- Tier name: `text-sm font-bold uppercase tracking-[0.3em] text-teal-500`
- Price: 4xl bold + suffix (neutral-500 sm)
- Description (sm neutral-500 leading-relaxed mt-4)
- Feature list: Check icon (teal) + feature text (sm neutral-300)
- CTA button: Core = primary, others = secondary; disabled + "Current Plan" if active tier

**On CTA click:**
```typescript
// Free tier
if (tier === 'Entry') navigate('/home');
// Paid tiers
POST /api/subscriptions/create-checkout-session { 
  priceId, 
  successUrl: '{origin}/home?session_id={CHECKOUT_SESSION_ID}',
  cancelUrl: '{origin}/pricing'
}
→ window.location.href = response.data.url  // Stripe redirect
```

**Enterprise row** (`mt-20 grid md:grid-cols-2 gap-8 max-w-6xl mx-auto`):
- Teams/Enterprise card: Shield icon (purple), "Department rollout, team dashboards, predictive analytics." → `price_team_custom`
- API Infrastructure card: Code icon (teal), "Usage-based billing for human-intelligence integrations." → `price_api_usage`
- Both: `p-8 flex items-center justify-between group cursor-pointer hover:bg-white/[0.04]`
- ArrowRight ghost button (opacity-0, `group-hover:opacity-100`)

**Ethics footer** (`mt-20 text-center max-w-2xl mx-auto`):
- "ETHICAL PROPORTIONALITY" (10px teal uppercase)
- "OSIA gates advanced tooling and reports, never basic safety or clarity. Data collection is always proportionate to the value returned." (xs neutral-500 italic)

---

### 4. SUBSCRIPTION MANAGEMENT PAGE

**Route:** `/subscription`

**Component:** `src/features/subscription/SubscriptionManagement.tsx`

**Data:**
```
GET /api/subscriptions/status → { tier, status, renewalDate, cancelAtPeriodEnd, credits }
```

**Layout** (`max-w-2xl mx-auto py-8 space-y-6`):

**Current Plan card** (`bg-gradient-to-br from-teal/10 to-purple/10 border-teal/30 p-6`):
- Crown icon (teal) + tier name (2xl bold) + status badge (active=green, cancelled=amber)
- "Renews {date}" or "Cancels {date}" (xs neutral-500)
- `{credits} engagement credits this month` (xs teal)
- "Upgrade Plan" teal button → `/pricing` (if not Pro)
- "Manage Billing" ghost → `POST /api/subscriptions/portal` → Stripe Customer Portal redirect

**Credit Engine card** (green border):
- "ENGAGEMENT CREDITS" (10px green uppercase)
- SVG circular progress (same as JourneyPage) showing `{discountPercentage}%` off
- "{totalCredits} credits earned — applies to next billing cycle"
- "Learn how to earn more" link → `/journey`

**Cancel section** (`bg-red/[0.03] border border-red/10 rounded-2xl p-6`):
- "DANGER ZONE" (10px red uppercase)
- "Cancel Subscription" — on click: confirm dialog → `POST /api/subscriptions/cancel`
- After cancel: show reactivation option

---

### 5. CHECKOUT SIMULATION / SUCCESS PAGE

**Route:** `/subscription/success`

**Component:** `src/features/subscription/CheckoutSimulationPage.tsx`

Shown after Stripe redirect with `?session_id=`:
- Verify session: `GET /api/subscriptions/verify?session_id={id}`
- CheckCircle2 animation (teal pulse rings)
- "You're now on the {tier} plan." (3xl bold)
- Tier benefits recap (3 feature chips)
- "Continue to OSIA" button → `/home`

---

### 6. SUPABASE SCHEMA

```sql
-- KYC records
create table kyc_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  status text default 'pending',
  portrait_url text,
  portrait_uploaded_at timestamptz,
  portrait_validation_status text,
  portrait_rejection_reason text,
  kyc_deadline timestamptz,
  extended_deadline timestamptz,
  unlock_used boolean default false,
  verified_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- KYC verification history
create table kyc_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  event text not null,
  details text,
  created_at timestamptz default now()
);

-- Subscriptions
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  tier text default 'free' check (tier in ('free','core','pro','teams','api')),
  status text default 'active' check (status in ('active','cancelled','past_due','trialing')),
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  trial_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table kyc_records enable row level security;
alter table kyc_history enable row level security;
alter table subscriptions enable row level security;
create policy "Own KYC" on kyc_records for all using (auth.uid() = user_id);
create policy "Own KYC history" on kyc_history for select using (auth.uid() = user_id);
create policy "Own subscription" on subscriptions for select using (auth.uid() = user_id);
```

---

### 7. SUPABASE EDGE FUNCTION: KYC PORTRAIT UPLOAD

**Function:** `supabase/functions/kyc-upload/index.ts`

```typescript
// Receives multipart form-data with portrait image
// 1. Validates file: must be image/*, < 5MB, minimum 200×200 px
// 2. Uploads to Supabase Storage: kyc-portraits/{userId}/{timestamp}.jpg
// 3. Creates KYC record row with status='submitted'
// 4. Inserts kyc_history event 'portrait_submitted'
// 5. Returns { success: true, portraitUrl }
```

---

### 8. API ENDPOINTS

```
GET  /api/kyc/status
POST /api/kyc/submit                  → multipart portrait upload
POST /api/kyc/extend                  → request 3-day extension

GET  /api/subscriptions/status
POST /api/subscriptions/create-checkout-session  → { priceId, successUrl, cancelUrl }
GET  /api/subscriptions/verify        → { session_id } → tier confirmation
POST /api/subscriptions/portal        → → Stripe Customer Portal URL
POST /api/subscriptions/cancel
```

---

### 9. ROUTING

```
/kyc          → KYCSubmissionFlow
/kyc/status   → KYCStatusPage
/pricing      → PricingPage
/subscription → SubscriptionManagement
/subscription/success → CheckoutSimulationPage
```

---

## PROMPT END

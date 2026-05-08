# LOVABLE IMPORT PROMPT — Feature Group 2: Authentication & Authorization

> **Instructions**: Copy everything below the "PROMPT START" line and paste it as a single prompt into Lovable.
> **Prerequisite**: Group 1 (Admin Dashboard) should already be deployed.

---

## PROMPT START

Add a complete **Authentication & Authorization system** to the existing OSIA Admin Command Center app. This includes a multi-state login page, signup flow, OAuth (Google + Apple), magic link email verification, two-factor authentication (TOTP), persistent session management, and role-based route guards. The entire system uses Supabase Auth as the backend.

Continue using the existing OSIA design system: dark backgrounds (#02050F page, #0A1128 cards), teal accents (#38A3A5), Inter font, glassmorphism cards, pill-shaped buttons, Framer Motion animations, and Lucide React icons.

---

### 1. AUTH CONTEXT — Global State Provider

Create an `AuthContext` that wraps the entire app and provides:

**State Shape:**
```typescript
interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  token?: string;
  onboardingCompleted?: boolean;
  isAdmin?: boolean;
}

interface UserProfile {
  id: string;
  username: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  isAdmin?: boolean;
  isFoundingMember?: boolean;
  onboardingCompleted?: boolean;
  subscriptionTier?: 'free' | 'pro' | 'founding';
  twoFactorEnabled?: boolean;
  status?: string;
  origin_seed_profile?: any;
}
```

**Context API:**
```typescript
interface AuthContextType {
  auth: AuthState;
  userProfile: UserProfile | null;
  isLoading: boolean;
  setUserProfile: (profile: UserProfile | null) => void;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (username: string, password: string, birthData?: any) => Promise<boolean>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  completeAuth: (token: string, user: UserProfile) => void;
}
```

**Behaviors:**
- On mount: Read auth state from `localStorage` key `OSIA_auth`
- If token exists: Set a placeholder profile immediately (username from stored data, `isPlaceholder: true`), then fetch real profile from Supabase in background
- `refreshProfile()`: Fetches `/api/users/profile` + `/api/origin-seed` with 5-second timeouts each. Updates `userProfile` and syncs `isAdmin`/`onboardingCompleted` to localStorage
- `completeAuth(token, user)`: Stores auth state to localStorage, sets profile, triggers background `refreshProfile()`
- `login(username, password)`: POST to Supabase auth, on success calls `completeAuth()`
- `signup(username, password, birthData)`: POST to Supabase auth with optional birth data fields, on success calls `completeAuth()`
- `logout()`: Persists a blueprint snapshot (POST `/api/users/snapshot` with current traits), clears auth state and localStorage keys (`OSIA_auth`, `onboardingState`, `tourCompleted`), navigates to `/login`
- On `beforeunload` event: Attempts to persist snapshot with `keepalive: true`
- Guest session (no token): Immediately releases loading lock (`isLoading = false`)

---

### 2. LOGIN PAGE — Multi-State Authentication

**Route:** `/login`

**Auth States (AnimatePresence transitions between these):**
1. `WELCOME` — Main login form
2. `CHECK_EMAIL` — Magic link sent confirmation
3. `SIGNING_IN` — Loading indicator
4. `MFA_REQUIRED` — 2FA code entry
5. `EXPIRED` — Expired magic link

**WELCOME State:**
- **Card**: `bg-[#0a1128]/60 backdrop-blur-3xl shadow-[0_0_80px_rgba(0,0,0,0.6)]` min-height 480px, centered on page
- **Header above card**: OSIA logo (8px height), "Data & Ethics" and "Help" nav links (10px uppercase)
- **Card content:**
  - "Welcome back" heading (2xl bold white)
  - "Enter your credentials to access your workspace." subtitle (sm, neutral-400)
  - Error banner (if error): red-500/10 bg, red-500/20 border, red-400 text, 10px uppercase
  - Email input: Label "EMAIL ADDRESS" (10px uppercase neutral-500), Input with `bg-black/40 border-white/10`
  - Password input: Label "PASSWORD" (10px uppercase neutral-500), Input type password, `bg-black/40 border-white/10`
  - "Sign In" button (primary, full width)
  - Helper text: "Enter your credentials to access your Digital Twin." (10px neutral-500)
  - Divider: "or continue with" (9px uppercase neutral-600)
  - Google Sign-In button (use Supabase OAuth `signInWithOAuth({ provider: 'google' })`)
  - Apple Sign-In button: White bg, black text, Apple icon, full width, pill shape
- **Footer below divider:**
  - "Having trouble? See help" link (10px teal underline)
  - "We never sell your data. You control what you share." (9px neutral-600)

**CHECK_EMAIL State:**
- Same card styling
- "Check your email" heading
- Message with highlighted email address
- Help tips with icons: check spam (💡), can take a minute (⏱️), link expires (🛡️)
- "Resend link" button (primary) + "Use a different email" link (teal underline)
- Footer: "This link is private. Don't forward it." (10px italic neutral-600)

**SIGNING_IN State:**
- "Signing you in..." heading with text-glow class
- "Please wait while we verify your credentials." subtitle
- 6 placeholder boxes (10x12 each) with pulsing dots inside

**MFA_REQUIRED State:**
- "Verification Required" heading with text-glow
- "Enter the 6-digit code from your authenticator app." subtitle
- Single centered input: `text-3xl font-mono tracking-widest`, max 6 chars, numeric only, auto-focus
- "Verify Identity" button (primary, disabled until 6 digits)
- "Back to login" link (10px uppercase neutral-600)

**EXPIRED State:**
- "That link has expired" heading
- Security explanation
- "Send a new sign-in link" button + "Use a different email" link
- "If already used:" explanation section

**Page Footer:**
- Terms | Privacy Policy | Data & Ethics links (9px uppercase neutral-600)
- "You can change permissions, revoke consent, and delete your data from your dashboard." (max-w-xs, 60% opacity)

**All state transitions** use Framer Motion with `opacity: 0→1, x: 20→0` enter and `opacity: 1→0, x: 0→-20` exit.

---

### 3. INPUT COMPONENT

```
Input: h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-2
       text-sm text-white placeholder:text-[#757575]
       focus-visible:ring-2 focus-visible:ring-[#38A3A5]/50
       
Textarea variant: min-h-[100px], same styling
```

---

### 4. ROUTE GUARDS

**AdminRoute Guard:**
- Wraps `/admin` routes
- Checks `auth.isAdmin` OR `userProfile?.isAdmin`
- Not authenticated → redirect to `/login`
- Authenticated but not admin → redirect to `/home`
- Loading state: "Verifying Credentials..." centered on `bg-[#0A1128]` full screen, mono font

**AuthRoute Guard (for protected routes):**
- Checks `auth.isAuthenticated`
- Not authenticated → redirect to `/login`
- Loading state: same "Verifying Credentials..." pattern

---

### 5. TWO-FACTOR AUTHENTICATION (TOTP)

**Setup Flow** (in Settings page):
1. User clicks "Enable 2FA"
2. Backend generates TOTP secret + QR code data URL
3. Frontend shows QR code image for scanning with authenticator app
4. User enters 6-digit verification code
5. Backend verifies code → enables 2FA on user record

**Login Flow with 2FA:**
1. User submits email + password
2. Backend verifies credentials
3. If `twoFactorEnabled`, returns `{ mfaRequired: true, userId }` instead of token
4. Frontend transitions to `MFA_REQUIRED` state
5. User enters 6-digit TOTP code
6. Backend verifies against stored secret → returns full JWT token

**Disable Flow:**
1. POST to disable endpoint
2. Clears `twoFactorEnabled` and `twoFactorSecret` from user record

---

### 6. OAUTH PROVIDERS

**Google OAuth:**
- Use Supabase `signInWithOAuth({ provider: 'google' })`
- On callback: Check if user exists. If not, show "Account not found" error and redirect to signup after 3 seconds
- If 2FA enabled, transition to MFA state
- On success: call `completeAuth()` and navigate to `/welcome`

**Apple Sign-In:**
- Redirect-based flow using Apple's authorize URL
- Parameters: `response_type: 'code id_token'`, `scope: 'name email'`, `response_mode: 'form_post'`
- Callback decodes Apple's JWT id_token to extract email
- If user doesn't exist → redirect to signup
- If 2FA enabled → redirect to login with MFA params
- On success: issue JWT, redirect to `/auth/callback` with token in query params

---

### 7. SESSION PERSISTENCE

**On Login/Signup Success:**
- Store `{ isAuthenticated, username, token, onboardingCompleted, isAdmin }` in `localStorage` as `OSIA_auth`

**On Logout:**
- Persist blueprint snapshot before clearing state
- Remove keys: `OSIA_auth`, `onboardingState`, `tourCompleted`
- Navigate to `/login`

**On Page Close/Refresh:**
- `beforeunload` listener attempts snapshot persistence with `keepalive: true`
- Only persists if traits are loaded (prevents empty snapshots overwriting data)

**On App Mount:**
- Read from localStorage → create placeholder profile → fetch real profile in background
- Profile fetch has 5s timeout to prevent indefinite loading

---

### 8. SUPABASE SCHEMA

Use Supabase Auth for core authentication. Additional profile data:

```sql
-- Extends Supabase auth.users with application-specific fields
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique,
  name text,
  bio text,
  avatar_url text,
  is_admin boolean default false,
  onboarding_completed boolean default false,
  subscription_tier text default 'free' check (subscription_tier in ('free', 'pro', 'founding')),
  subscription_status text default 'inactive',
  stripe_customer_id text,
  subscription_id text,
  two_factor_enabled boolean default false,
  two_factor_secret text,
  google_id text,
  status text default 'active',
  deletion_requested_at timestamptz,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Row level security
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );
```

---

### 9. ADMIN EMAIL AUTO-PROMOTION

Maintain a list of admin emails in an environment variable `ADMIN_EMAILS` (comma-separated). On profile fetch, if the user's email matches any admin email and they are not already marked as admin, auto-promote them and persist the change.

---

### 10. API ENDPOINTS SUMMARY

**Auth Routes (public):**
- `POST /api/auth/signup` — Create account (email, password, optional birth data)
- `POST /api/auth/login` — Login (returns token or mfaRequired flag)
- `POST /api/auth/login/2fa` — Verify TOTP code, returns full token
- `POST /api/auth/google/verify` — Google OAuth token verification
- `POST /api/auth/apple/callback` — Apple OAuth redirect callback
- `POST /api/auth/apple/verify` — Apple token verification (native apps)
- `POST /api/auth/waitlist` — Waitlist signup

**Auth Routes (authenticated):**
- `POST /api/auth/2fa/setup` — Generate TOTP secret + QR code
- `POST /api/auth/2fa/verify` — Verify code and enable 2FA
- `POST /api/auth/2fa/disable` — Disable 2FA
- `GET /api/auth/2fa/status` — Check 2FA enabled status

**User Routes (authenticated):**
- `GET /api/users/profile` — Get full profile (with OSIA data, KYC status, founding status)
- `POST /api/users/profile` — Update name/bio
- `POST /api/users/avatar` — Upload avatar (multipart, 15MB limit)
- `POST /api/users/snapshot` — Persist blueprint snapshot
- `POST /api/users/request-deletion` — Request account deletion

---

### 11. INTEGRATION WITH GROUP 1 (ADMIN)

The Admin Dashboard from Group 1 should now use the real `AuthContext`:
- Admin tabs should check `auth.isAdmin` before rendering
- User Management should use the same `profiles` table
- The quick stats "Verified Identities" count should query the real profiles table
- All admin API calls should include `Authorization: Bearer ${auth.token}` header

---

### 12. SEED DATA

Create 3 test accounts:
1. Admin user: `admin@osia.dev` / `admin123` (isAdmin: true)
2. Regular user: `user@osia.dev` / `user123` (isAdmin: false, onboardingCompleted: true)
3. New user: `new@osia.dev` / `new123` (isAdmin: false, onboardingCompleted: false)

---

## PROMPT END

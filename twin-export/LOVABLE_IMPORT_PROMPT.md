# NEXUS Digital Twin — Lovable Import Prompt

## Prompt for Lovable

> **Paste this entire block into Lovable as your prompt, then upload the zip file.**

---

### SYSTEM CONTEXT

I'm importing the **NEXUS Digital Twin** module into my existing OSIA platform. This is a complete Digital Twin system that needs to be integrated with my existing Supabase/React architecture. The zip contains all the source files.

### WHAT THIS MODULE DOES

The Digital Twin is a 3D interactive avatar that serves as the **primary user interaction layer** for the OSIA personality intelligence platform. It:

1. **Captures a photo** → extracts 478 facial landmarks using MediaPipe → renders a glowing 3D point-cloud portrait using Three.js/React-Three-Fiber
2. **Voice interaction** → Web Speech API for STT (speech-to-text) and TTS (text-to-speech) with real-time lip-sync mouth animation
3. **Text chat** → Full text input alongside voice, with scrollable chat panel
4. **AI Brain** → Sends user messages to Claude (Anthropic API), using the user's complete OSIA personality profile (15-layer traits, thesis, insights, patterns) as context
5. **Profile feedback loop** → AI extracts check-ins (mood/energy) and reflections from conversation and writes them back to the user profile
6. **Proactive greeting** → When the twin loads, it generates a context-aware greeting using active nudges, focus areas, time of day, and conversation freshness
7. **Floating mini-chat (FAB)** → A persistent floating chat button on every page for quick twin access
8. **Main navigation** → Twin tab in the nav bar

### FILE STRUCTURE IN THE ZIP

```
frontend-twin/                    # React components (src/features/twin/)
├── TwinFacePage.tsx              # Main page: 3D scene + voice + text chat
├── TwinFaceCapture.tsx           # Photo upload / webcam capture UI
├── PlexusTwinScene.tsx           # R3F canvas with bloom + orbit controls
├── DigitalTwin.tsx               # Legacy wrapper (can be ignored)
├── TwinRenderer.tsx              # Legacy wrapper (can be ignored)
├── engine/
│   ├── FaceLandmarkEngine.ts     # MediaPipe face mesh integration
│   ├── ColorSampler.ts           # Pixel color extraction from photo
│   ├── BustGenerator.ts          # Procedural bust/neck geometry
│   ├── VoiceEngine.ts            # Web Speech STT/TTS + mic amplitude
│   └── MouthAnimator.ts          # Lip landmark displacement mapping
├── components/
│   ├── FacePointCloud.tsx        # GLSL shader point cloud with mouth anim
│   ├── FaceTessellation.tsx      # Wireframe connection lines
│   ├── BustPointCloud.tsx        # Bust/neck points renderer
│   ├── AmbientParticles.tsx      # Background floating particles
│   ├── ProcessingAnimation.tsx   # Loading/processing stage animation
│   ├── WebcamCapture.tsx         # Webcam capture component
│   └── TwinChatFAB.tsx           # Floating action button mini-chat
├── store/
│   └── twinStore.ts              # Zustand state management
└── types/
    └── TwinTypes.ts              # TypeScript type definitions

TwinBrainService.ts               # Server: AI brain (Claude integration)
twinRoutes.ts                     # Server: REST API endpoints
```

### INTEGRATION REQUIREMENTS FOR LOVABLE

#### 1. Dependencies to Install
```json
{
  "@mediapipe/face_mesh": "^0.4.x",
  "@react-three/fiber": "^8.x",
  "@react-three/drei": "^9.x",
  "three": "^0.160.x",
  "@anthropic-ai/sdk": "^0.x",
  "zustand": "^4.x"
}
```

#### 2. Supabase Adaptations Needed

The original code uses a custom `JsonDb` (file-based JSON storage). For Lovable/Supabase, you need to:

**Create these Supabase tables:**

```sql
-- Twin avatar data (3D mesh points)
CREATE TABLE twin_avatars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  landmarks JSONB NOT NULL,
  colors JSONB NOT NULL,
  bust_points JSONB,
  source_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Twin conversation history
CREATE TABLE twin_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'twin')),
  content TEXT NOT NULL,
  emotion TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Twin check-ins (extracted from conversations)
CREATE TABLE twin_check_ins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  energy INTEGER CHECK (energy BETWEEN 1 AND 5),
  mood TEXT,
  context TEXT,
  source TEXT DEFAULT 'twin_conversation',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Twin reflections (extracted from conversations)
CREATE TABLE twin_reflections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  layer_ids INTEGER[],
  source TEXT DEFAULT 'twin_conversation',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE twin_avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE twin_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE twin_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE twin_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own twin avatar" ON twin_avatars
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own conversations" ON twin_conversations
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own check-ins" ON twin_check_ins
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own reflections" ON twin_reflections
  FOR ALL USING (auth.uid() = user_id);
```

#### 3. Edge Function for AI Brain

The `TwinBrainService.ts` needs to become a **Supabase Edge Function**:

```
supabase/functions/twin-brain/index.ts
```

It should:
- Accept POST with `{ message: string }` and the user's JWT
- Load user profile data from Supabase (personality layers, OSIA output, life areas)
- Send to Claude API with the system prompt from `TwinBrainService.ts`
- Parse the JSON response
- If `profileUpdates` exist, write check-ins/reflections to the respective tables
- Save conversation messages to `twin_conversations`
- Return the response

Similarly for the greeting:
```
supabase/functions/twin-greeting/index.ts
```

#### 4. Frontend API Calls to Update

In the uploaded files, API calls use `fetch('/api/twin/...')`. These need to change to Supabase Edge Function calls:

```typescript
// Before (Express):
fetch('/api/twin/message', { ... })

// After (Supabase):
supabase.functions.invoke('twin-brain', { body: { message } })
```

#### 5. Store Adaptation (twinStore.ts)

The zustand store saves/loads avatar data via REST. Update to use Supabase client:

```typescript
// Save avatar
const { error } = await supabase
  .from('twin_avatars')
  .upsert({ user_id, landmarks, colors, bust_points });

// Load avatar
const { data } = await supabase
  .from('twin_avatars')
  .select('*')
  .eq('user_id', userId)
  .single();
```

#### 6. Route Registration

Add to your React Router:
```tsx
<Route path="/twin-face" element={<TwinFacePage />} />
```

Add to your navigation (shown in the zip's patterns):
```tsx
{ name: 'Twin', path: '/twin-face', icon: MessageCircle }
```

Add `<TwinChatFAB />` to your root layout for the floating chat button.

#### 7. Environment Variable

Ensure `ANTHROPIC_API_KEY` is set in your Supabase Edge Function secrets:
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

### DESIGN SYSTEM

The twin uses a dark theme with:
- Background: `#0a1128` (deep navy)
- Accent: `cyan-500` (the twin's signature color)
- Chat bubbles: User = `cyan-500/15`, Twin = `white/[0.04]`
- Status colors: Listening = red, Speaking = green, Thinking = amber, Active = cyan
- All text: white with varying opacity
- Borders: `white/5` to `white/10`
- Backdrop blur everywhere

### KEY CONTEXT FROM OSIA PLATFORM

The twin's AI brain needs access to these existing OSIA data structures:
- **15-Layer Personality Profile** (traits with layerId 1-15)
- **OSIA Personality Thesis** (sections with foundational_overview)
- **Core Insights Hub** (7 life domain insights)
- **Detected Patterns** (name + oneLiner)
- **Life Area Scores** (7 domains with healthScore 1-10)
- **Active Focus Areas** (user-selected priority domains)
- **Daily Nudges** (behavioral micro-suggestions)
- **Practice Rituals** (active daily practices)

All of these should already exist in your Supabase schema from the previous OSIA migration.

### SUMMARY

Import all files from the zip. Create the Supabase tables. Convert the server-side services to Edge Functions. Update the API calls in the frontend. Wire into your existing navigation and layout. The twin becomes the primary user interaction mode for the platform.

---

**Upload the `nexus-digital-twin.zip` file alongside this prompt.**

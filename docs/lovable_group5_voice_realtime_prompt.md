# LOVABLE IMPORT PROMPT — Feature Group 5: Voice Intelligence & Realtime Engine

> **Instructions**: Copy everything below the "PROMPT START" line and paste it as a single prompt into Lovable.
> **Prerequisites**: Groups 1–4 must be deployed.
> **Architecture Note**: This implementation uses a **fully free** voice stack:
> - **Web Speech API** (browser-native) for Speech-to-Text and Text-to-Speech — zero cost
> - **Groq API** (free tier) for LLM conversational responses — llama3-8b-8192
> - No WebRTC, no OpenAI Realtime, no per-minute API costs

---

## PROMPT START

Add the **OSIA Voice Intelligence System** — a real-time voice interface that connects users to their AI Sentient Mirror using browser-native Web Speech API and Groq's free LLM tier. The system uses turn-based conversation: the user speaks → transcript is extracted → Groq generates a brief OSIA response → browser speaks it aloud. No paid voice API required.

Includes a floating Voice Agent button with wave animation on all authenticated pages, a full-screen voice session modal with live signal extraction, and a developer Voice Lab test page.

Continue using the OSIA design system: `#02050F` page, `#0A1128` cards, `#38A3A5` teal, cyan/purple gradients for voice UI, Inter font, Framer Motion, Lucide React.

---

### 1. SUPABASE EDGE FUNCTION — Groq Conversational Response

Create `supabase/functions/voice-respond/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Verify auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

    const { transcript, history } = await req.json()

    // Call Groq free API
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: `You are OSIA, the user's Sentient Mirror. 
Speak ONLY in English. Be brief — maximum 2 short sentences.
Reflect the user's tone. Be natural, not scripted.
You are helping the user discover patterns about themselves.
Ask one gentle follow-up question about what they've shared.`
          },
          ...(history || []),
          { role: 'user', content: transcript }
        ],
        max_tokens: 100,
        temperature: 0.7,
      })
    })

    const groqData = await groqRes.json()
    const reply = groqData.choices?.[0]?.message?.content || "Tell me more about that."

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
```

**Required Supabase Edge Function secrets:**
- `GROQ_API_KEY` — Get free at [console.groq.com](https://console.groq.com) (free tier: 30 req/min, 6k tokens/min)

**Client-side call:**
```
POST /functions/v1/voice-respond
Authorization: Bearer {supabase_session_token}
Body: { transcript: string, history: Array<{role, content}> }
```

---

### 2. VOICE INTERACTION COMPONENT

Create `src/features/voice/VoiceInteraction.tsx` — full-screen voice session modal.

**Props:**
```typescript
interface VoiceInteractionProps {
  onComplete: (data: {
    selectedWords: Record<string, string[]>;
    situation: string;
  }) => void;
  onCancel: (error?: string) => void;
}
```

**State:**
```typescript
const [isListening, setIsListening] = useState(false);
const [isSpeaking, setIsSpeaking] = useState(false);   // AI is speaking
const [isThinking, setIsThinking] = useState(false);   // Groq is processing
const [transcript, setTranscript] = useState('');       // Latest user speech
const [aiResponse, setAiResponse] = useState('');      // Latest OSIA reply
const [volume, setVolume] = useState(0);                // 0.0–1.0 mic level
const [conversationHistory, setConversationHistory] = useState<Array<{role: string, content: string}>>([]);
const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
const [extractedData, setExtractedData] = useState({
  selectedWords: { best: [], pressure: [], energize: [], drain: [] },
  situation: ''
});
const [error, setError] = useState<string | null>(null);
const [turnCount, setTurnCount] = useState(0);

// Refs
const recognitionRef = useRef<SpeechRecognition | null>(null);
const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
const audioContextRef = useRef<AudioContext | null>(null);
const streamRef = useRef<MediaStream | null>(null);
const isActiveRef = useRef(false);
```

---

#### INITIALIZATION

On component mount:
1. Check browser support: `'SpeechRecognition' in window || 'webkitSpeechRecognition' in window`
   - If not supported: `setError('Voice not supported in this browser. Try Chrome or Edge.')`
2. Load available TTS voices: `speechSynthesis.getVoices()` — find a preferred English voice (prefer "Google UK English Female" or "Samantha" or first `lang.startsWith('en')`)
3. Store chosen voice in `voice` state
4. Set up mic volume analyser:
   - `getUserMedia({ audio: true })`
   - Create `AudioContext`, `MediaStreamSource`, `AnalyserNode`
   - `rAF` loop reading average frequency data → `setVolume(avg / 128)`
5. Start first listening turn

Cleanup on unmount:
- Stop SpeechRecognition
- Cancel SpeechSynthesis
- Stop all mic tracks
- Close AudioContext
- Cancel rAF loop

---

#### CONVERSATION TURN LOOP

**`startListening()` function:**
```
1. If !isActiveRef.current → return
2. Cancel any ongoing speech synthesis
3. Create SpeechRecognition:
   - recognition.continuous = false
   - recognition.interimResults = true
   - recognition.lang = 'en-US'
4. recognition.onresult → update transcript with latest result
5. recognition.onend → call handleUserTurnComplete(finalTranscript)
6. recognition.onerror → setError(error.message)
7. recognition.start()
8. setIsListening(true)
```

**`handleUserTurnComplete(text)` function:**
```
1. setIsListening(false)
2. if !text.trim() → restart listening (empty turn)
3. extractSignals(text)
4. append { role: 'user', content: text } to conversationHistory
5. setIsThinking(true)
6. Call Groq Edge Function → await reply
7. setIsThinking(false)
8. append { role: 'assistant', content: reply } to conversationHistory
9. setAiResponse(reply)
10. speakResponse(reply)
11. Increment turnCount
```

**`speakResponse(text)` function:**
```
1. setIsSpeaking(true)
2. const utterance = new SpeechSynthesisUtterance(text)
3. utterance.voice = voice  (preferred EN voice)
4. utterance.rate = 0.95
5. utterance.pitch = 1.0
6. utterance.volume = 1.0
7. utterance.onend → setIsSpeaking(false) → if turnCount < 5 → startListening()
8. synthRef.current.speak(utterance)
```

**Auto-complete:** After 5 conversational turns (or if `hasData` and user clicks "Sync Insights"), call `onComplete(extractedData)`.

---

#### SIGNAL EXTRACTION

**`extractSignals(text: string)` — same as before:**

Match against 4 buckets (case-insensitive):
```typescript
const wordOptions = {
  best:     ["Calm","Curious","Direct","Warm","Focused","Playful","Grounded",
              "Decisive","Reflective","Open","Independent","Collaborative"],
  pressure: ["Withdrawn","Overthinking","Impatient","Reactive","Guarded",
              "Avoidant","Controlling","Anxious","Blunt","Rigid","Self-critical","Tense"],
  energize: ["Open-ended conversations","Clear goals","Creative problem-solving",
              "Structure and routines","Autonomy","Collaboration",
              "Learning something new","Helping others","Quiet focus time"],
  drain:    ["Ambiguity without context","Conflict avoidance","Constant urgency",
              "Micromanagement","Unclear expectations","Over-socialising",
              "Isolation","Repetitive tasks","High emotional tension"]
}
```
- Only add if not already in bucket
- If text > 50 chars AND no explicit bucket keyword → set as `situation`

**`removeWord(bucket, word)`** — removes a word from extracted signals (user correction)

---

#### UI — FULL SCREEN OVERLAY

**Container:** `fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#0A1128]/90 backdrop-blur-xl`

**Inner panel (max-w-xl w-full text-center space-y-8):**

**State Indicator Row:**
- Volume2 icon (teal if volume > 0.1, else neutral-600)
- Status label (10px uppercase tracking-widest):
  - `isListening` → "Listening..." (teal, animate-pulse)
  - `isThinking` → "Processing..." (amber)
  - `isSpeaking` → "OSIA Speaking" (purple)
  - else → "Ready"

**Animated Orb (h-48 relative):**
- Background bloom: `motion.div` scale `1 + volume*0.5`, opacity `0.2 + volume*0.3`, `bg-teal/20 blur-3xl rounded-full absolute inset-0`
- Foreground orb `w-28 h-28 rounded-[3rem]`:
  - `isListening`: `bg-teal/10 border-teal/30` + Mic icon (teal)
  - `isThinking`: `bg-amber-500/10 border-amber-500/30` + Loader2 icon (amber, animate-spin)
  - `isSpeaking`: `bg-purple-500/10 border-purple-500/30` + Volume2 icon (purple, animate-pulse)
  - default: `bg-white/5 border-white/10` + Mic icon (neutral)
- Both wrapped in `AnimatePresence`

**Prompt text:**
- "Speak your truth." (3xl extrabold white tracking-tight)
- "Tell OSIA about your best self, your pressure points, and what moves you." (sm neutral-400)

**Live transcript** (if any): italic teal/60, 10px, line-clamp-2, quoted

**OSIA response** (if `aiResponse` and `isSpeaking`):
- `p-3 rounded-xl bg-purple-500/10 border border-purple-500/20`
- Sparkles icon (purple) + response text (sm white italic)

**Conversation progress:** `Turn {turnCount}/5` (9px neutral-600, if turnCount > 0)

**Extracted Signal Chips** — same as original spec:
- `AnimatePresence` rows per bucket with data
- Each row: bucket label (teal) + word chips with X dismiss buttons

**Browser support warning** (if `error`):
- Red error card: `bg-red-500/10 border border-red-500/20 text-red-400 text-sm`

**Footer:**
- "✕ Cancel" ghost button
- "✓ Sync Insights" primary button (only when `hasData`)

---

#### BROWSER COMPATIBILITY

Web Speech API is supported in: **Chrome 33+**, **Edge 79+**, **Safari 14.1+**
NOT supported in: Firefox (without flag)

Show browser warning in VoiceLab and tooltip when unsupported:
```typescript
const isSpeechSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
```

---

### 3. VOICE AGENT BUTTON — Floating FAB

Create `src/features/voice/VoiceAgentButton.tsx` — persistent floating button.

**Mount:** Render in `AppLayout`, above `<main>`, always visible when authenticated.

**Position:** `fixed bottom-6 right-6 z-50`
**Spring entrance:** `initial={{ scale:0, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ delay:0.5, type:'spring', stiffness:200 }}`

**Wave SVG Animation** (same as designed — `absolute inset-0 w-full h-full`, `transform scale(2.5)`):
4 rotating `motion.ellipse` layers with gradient fills:
- Layer 1 (rx=80 ry=40): rotates 360° in 8s, breathing scale
- Layer 2 (rx=70 ry=35): rotates -360° in 10s, counter scale
- Layer 3 (rx=60 ry=30): rotates 360° in 6s, large scale range
- Layer 4 (rx=50 ry=25): rotates -360° in 12s, subtle
- 2 animated flowing `motion.path` bezier curves
- SVG gradients: `waveGradient1` (sky→sky→violet), `waveGradient2` (violet→purple→sky), `waveGradient3` (cyan→violet)
- Always animating (`isAnimating = true`)

**Central Orb Button (w-12 h-12 rounded-full):**
- `bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-cyan-500/30 shadow-lg shadow-cyan-500/20 backdrop-blur-sm`
- Hover: scale 1.1, cyan glow shadow
- Tap: scale 0.95
- Inner glow layer: `bg-gradient-to-br from-cyan-500/10 to-purple-500/10`
- Mic icon (cyan-400, w-5)

**Hover Tooltip** (AnimatePresence, slides in from right):
- `"Voice Intelligence"` label with cyan pulse dot
- If supported: `"Click to begin"` — If not: `"Chrome/Edge required"`

**State:**
- `isOpen` — controls VoiceInteraction modal
- Click → open VoiceInteraction (no tier gate — free model means free access)

**Admin indicator dot** (`-top-1 -right-1`, emerald-500, pulsing scale)

---

### 4. VOICE LAB — Developer Test Page

**Route:** `/voice-lab` (AdminRoute)

**Layout & content:** Same as previously specified:
- `min-h-screen bg-[#02050F]`, centered card, max-w-2xl
- Mic icon header + "Voice Lab" title
- "Initiate Testing" button → opens VoiceInteraction
- Results grid showing captured signals per bucket
- Reset & Retest button
- Footer note: "Uses browser Web Speech API + Groq API. No API costs."

---

### 5. SUBSCRIPTION ACCESS — UPDATED (No Tier Gate)

Since we're using a free stack (Web Speech API + Groq free tier), voice is now **available to all users**. Remove the Pro gate screen entirely.

| Feature | Free | Pro | Founding | Admin |
|---|---|---|---|---|
| VoiceAgentButton (visible) | ✓ | ✓ | ✓ | ✓ |
| Voice session | ✓ | ✓ | ✓ | ✓ |
| Voice Lab test page | ✗ | ✗ | ✗ | ✓ |

---

### 6. SIGNAL PERSISTENCE (unchanged from original spec)

After `onComplete`:
- Merge voice-extracted signals into `origin_seeds.traits` in Supabase
- Tag each trait with `source: 'voice'`
- Overwrite existing voice-sourced traits (re-merge on each session)

---

### 7. INTEGRATION POINTS

**AppLayout:** `<VoiceAgentButton />` rendered below KYC banner, above `<main>`

**OnboardingFlow (BLUEPRINT stage):**
- Floating Mic FAB (bottom-right) → open `VoiceInteraction` modal
- On complete → save signals → navigate to `/insight/first`
- On cancel → return to `SignalsEntryScreen`

**Admin dropdown:** "Voice Lab" link → `/voice-lab` (admin only, Mic icon)

**Routing:**
```
/voice-lab  → VoiceTestPage  (AdminRoute protected)
```

---

### 8. ERROR HANDLING

| Scenario | Response |
|---|---|
| Browser doesn't support Web Speech API | Show `"Voice requires Chrome or Edge"` error card |
| Mic permission denied | `onCancel('Microphone permission denied')` |
| Groq API error / rate limit | Show amber warning, retry button, continue without AI responses |
| Empty speech turn | Restart listening silently (no error) |
| No speech detected (timeout) | After 8s silence → prompt user: "Still there? Try speaking closer." |
| SpeechSynthesis not available | Skip TTS, show AI response as text only |

---

### 9. SUPABASE SCHEMA ADDITIONS

```sql
-- Track voice session usage (analytics only)
create table voice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  turn_count integer default 0,
  signals_extracted jsonb default '{}',
  situation_text text,
  status text default 'completed' check (status in ('completed', 'cancelled', 'error')),
  created_at timestamptz default now()
);

alter table voice_sessions enable row level security;
create policy "Users own sessions" on voice_sessions for all using (auth.uid() = user_id);
```

---

## PROMPT END

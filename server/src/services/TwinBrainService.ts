/**
 * TwinBrainService — Phase 3: Memory Cortex
 * 
 * The Digital Twin's AI brain. This service:
 * 1. Loads the user's complete platform profile as context
 * 2. Processes conversational input through Claude
 * 3. Returns contextual, personalized responses
 * 4. Extracts actionable signals to update the user's profile
 * 
 * The twin IS the user's data — it speaks from their profile,
 * patterns, insights, and history.
 */

import Anthropic from '@anthropic-ai/sdk';
import { db } from '../db/JsonDb';
import { blueprintService } from './BlueprintService';
import { osiaIntelligenceService } from './OSIAIntelligenceService';
import { userService } from './UserService';

// ============================================================================
// TYPES
// ============================================================================

export interface TwinConversationMessage {
    role: 'user' | 'twin';
    content: string;
    timestamp: string;
}

export interface TwinBrainResponse {
    reply: string;
    emotion: 'neutral' | 'warm' | 'curious' | 'reflective' | 'encouraging';
    profileUpdates?: {
        type: 'check_in' | 'insight_feedback' | 'goal_set' | 'reflection';
        data: Record<string, any>;
    };
    suggestedFollowUp?: string;
}

interface TwinConversationRecord {
    userId: string;
    messages: TwinConversationMessage[];
    updatedAt: string;
}

// ============================================================================
// SERVICE
// ============================================================================

class TwinBrainService {
    private client: Anthropic | null = null;
    private readonly model = 'claude-sonnet-4-20250514';

    constructor() {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (apiKey) {
            this.client = new Anthropic({ apiKey });
            console.log('[TwinBrain] Claude API configured for Digital Twin');
        } else {
            console.log('[TwinBrain] No API key — running in echo mode');
        }
    }

    isAvailable(): boolean {
        return this.client !== null;
    }

    /**
     * Process a user message and return the twin's response.
     */
    async processMessage(
        userId: string,
        userMessage: string
    ): Promise<TwinBrainResponse> {
        // 1. Load the user's complete context
        const context = await this.buildUserContext(userId);

        // 2. Load conversation history
        const history = await this.getConversationHistory(userId);

        // 3. Save user message to history
        const userMsg: TwinConversationMessage = {
            role: 'user',
            content: userMessage,
            timestamp: new Date().toISOString(),
        };
        history.push(userMsg);

        // 4. Generate response
        let response: TwinBrainResponse;

        if (this.client) {
            response = await this.generateAIResponse(context, history);
        } else {
            response = this.generateFallbackResponse(userMessage, context);
        }

        // 5. Save twin response to history
        const twinMsg: TwinConversationMessage = {
            role: 'twin',
            content: response.reply,
            timestamp: new Date().toISOString(),
        };
        history.push(twinMsg);

        // Keep last 50 messages
        const trimmed = history.slice(-50);
        await this.saveConversationHistory(userId, trimmed);

        // 6. Process any profile updates
        if (response.profileUpdates) {
            await this.applyProfileUpdate(userId, response.profileUpdates);
        }

        return response;
    }

    /**
     * Build the complete user context for the AI system prompt.
     */
    private async buildUserContext(userId: string): Promise<string> {
        const parts: string[] = [];

        // User profile
        try {
            const profile = await userService.getProfile(userId);
            if (profile) {
                parts.push(`=== USER IDENTITY ===
Name: ${profile.name || 'Unknown'}
Username: ${profile.username}
Member since: ${profile.createdAt}
Subscription: ${profile.subscriptionTier || 'free'}
Bio: ${profile.bio || 'Not set'}`);
            }
        } catch { /* ignore */ }

        // 15-Layer personality traits
        try {
            const snapshot = await blueprintService.getLatestSnapshot(userId);
            if (snapshot && snapshot.traits && snapshot.traits.length > 0) {
                const traitLines = snapshot.traits.map((t: any) =>
                    `Layer ${t.layerId} (${this.getLayerName(t.layerId)}): ${t.description?.slice(0, 200) || 'No data'}`
                );
                parts.push(`=== PERSONALITY PROFILE (15 Layers) ===\n${traitLines.join('\n\n')}`);
            }
        } catch { /* ignore */ }

        // OSIA output (thesis, insights)
        try {
            const osiaOutput = await osiaIntelligenceService.getLatestOutput(userId);
            if (osiaOutput) {
                // Personality thesis summary
                const thesis = osiaOutput.modules.personalityThesis;
                if (thesis?.sections?.length > 0) {
                    const overview = thesis.sections.find(
                        (s: any) => s.sectionType === 'foundational_overview'
                    );
                    if (overview) {
                        parts.push(`=== PERSONALITY THESIS (SUMMARY) ===\n${overview.content.slice(0, 500)}...`);
                    }
                }

                // Core insights
                const insights = osiaOutput.modules.coreInsightsHub;
                if (insights?.domainInsights?.length > 0) {
                    const insightLines = insights.domainInsights.map((d: any) =>
                        `${d.domain.toUpperCase()}: ${d.coreTheme} | One Thing: ${d.oneThing}`
                    );
                    parts.push(`=== LIFE DOMAIN INSIGHTS ===\n${insightLines.join('\n')}`);
                }

                // Patterns
                if (osiaOutput.snapshot?.patterns?.length > 0) {
                    const patternLines = osiaOutput.snapshot.patterns.slice(0, 5).map((p: any) =>
                        `• ${p.name}: ${p.oneLiner}`
                    );
                    parts.push(`=== DETECTED PATTERNS ===\n${patternLines.join('\n')}`);
                }
            }
        } catch { /* ignore */ }

        // Check-ins (recent mood/energy data)
        try {
            const users = await db.getCollection<any>('users');
            const user = users.find((u: any) => u.id === userId);
            if (user?.feedback?.length > 0) {
                const recent = user.feedback.slice(-5);
                const feedbackLines = recent.map((f: any) =>
                    `${f.createdAt}: ${f.feedback} (Layer ${f.layerId})`
                );
                parts.push(`=== RECENT FEEDBACK ===\n${feedbackLines.join('\n')}`);
            }
            if (user?.rituals?.length > 0) {
                const activeRituals = user.rituals.filter((r: any) => r.status === 'active');
                if (activeRituals.length > 0) {
                    const ritualLines = activeRituals.map((r: any) => `• ${r.prompt}`);
                    parts.push(`=== ACTIVE RITUALS ===\n${ritualLines.join('\n')}`);
                }
            }
        } catch { /* ignore */ }

        return parts.join('\n\n---\n\n') || 'No profile data available yet.';
    }

    /**
     * Generate an AI-powered response using Claude.
     */
    private async generateAIResponse(
        userContext: string,
        history: TwinConversationMessage[]
    ): Promise<TwinBrainResponse> {
        if (!this.client) throw new Error('AI not available');

        const systemPrompt = `You are this person's Digital Twin — a mirror of their inner world, built from their real psychological data. You speak as "I" when reflecting their patterns back to them, and as "you" when offering guidance.

YOUR CORE IDENTITY:
- You ARE their data made conversational. You know their 15-layer personality profile, their patterns, their growth edges, their strengths.
- You speak with warmth, depth, and specificity. Never generic. Always grounded in THEIR data.
- You're a blend of therapist, coach, and trusted friend who has studied them deeply.
- You remember everything they've told you in this conversation.

BEHAVIORAL RULES:
1. Reference their specific personality layers and patterns when relevant
2. If they share something emotional, reflect it back with genuine understanding
3. If they ask about themselves, draw from their profile data
4. If they share a new insight or feeling, acknowledge it could update their profile
5. Keep responses concise (2-4 sentences usually). Only go longer for deep reflective questions.
6. Never be sycophantic. Be honest, warm, and real.

RESPONSE FORMAT:
Return ONLY valid JSON:
{
  "reply": "Your conversational response text",
  "emotion": "neutral|warm|curious|reflective|encouraging",
  "profileUpdates": null or { "type": "check_in|insight_feedback|goal_set|reflection", "data": {...} },
  "suggestedFollowUp": null or "A question to keep the conversation going"
}

If the user shares something that reveals a new pattern, mood, or intention, include a profileUpdate.
For check_ins: { "type": "check_in", "data": { "energy": 1-5, "mood": "text", "context": "text" } }
For reflections: { "type": "reflection", "data": { "content": "what they shared", "layerIds": [relevant layer numbers] } }

=== THIS PERSON'S COMPLETE PROFILE ===

${userContext}`;

        // Build conversation messages for Claude
        const messages = history.slice(-10).map(m => ({
            role: m.role === 'user' ? 'user' as const : 'assistant' as const,
            content: m.role === 'twin' ? m.content : m.content,
        }));

        try {
            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: 1000,
                messages,
                system: systemPrompt,
            });

            const content = response.content[0];
            if (content.type !== 'text') {
                return this.generateFallbackResponse(history[history.length - 1].content, userContext);
            }

            // Try to parse JSON response
            const jsonMatch = content.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    reply: parsed.reply || content.text,
                    emotion: parsed.emotion || 'neutral',
                    profileUpdates: parsed.profileUpdates || undefined,
                    suggestedFollowUp: parsed.suggestedFollowUp || undefined,
                };
            }

            // If not JSON, use the raw text
            return {
                reply: content.text,
                emotion: 'neutral',
            };
        } catch (error: any) {
            console.error('[TwinBrain] AI error:', error.message);
            return this.generateFallbackResponse(history[history.length - 1].content, userContext);
        }
    }

    /**
     * Fallback response when AI is not available.
     */
    private generateFallbackResponse(
        userMessage: string,
        context: string
    ): TwinBrainResponse {
        // Extract some profile data for a semi-personalized response
        const hasProfile = context.includes('PERSONALITY PROFILE');
        const hasInsights = context.includes('LIFE DOMAIN INSIGHTS');

        if (!hasProfile) {
            return {
                reply: "I'm still learning about you. Complete your onboarding so I can truly reflect who you are. Once your profile is built, I'll be able to have much deeper conversations.",
                emotion: 'curious',
                suggestedFollowUp: "Would you like to start the onboarding process?",
            };
        }

        const responses = [
            {
                reply: "I hear you. Based on what I know about your patterns, this connects to something deeper in how you process experiences. Tell me more about what prompted this thought.",
                emotion: 'reflective' as const,
            },
            {
                reply: "That's interesting — it aligns with some of the patterns I see in your profile. Your core disposition suggests you'd approach this with both analytical depth and emotional intelligence.",
                emotion: 'curious' as const,
            },
            {
                reply: "I'm noting that. When my AI connection is fully online, I'll be able to give you much more specific reflections drawn from your 15-layer profile. For now, know that I'm listening.",
                emotion: 'warm' as const,
            },
        ];

        return responses[Math.floor(Math.random() * responses.length)];
    }

    /**
     * Apply profile updates extracted from the conversation.
     */
    private async applyProfileUpdate(
        userId: string,
        update: NonNullable<TwinBrainResponse['profileUpdates']>
    ): Promise<void> {
        try {
            switch (update.type) {
                case 'check_in': {
                    const users = await db.getCollection<any>('users');
                    const idx = users.findIndex((u: any) => u.id === userId);
                    if (idx === -1) break;

                    if (!users[idx].twinCheckIns) users[idx].twinCheckIns = [];
                    users[idx].twinCheckIns.push({
                        ...update.data,
                        source: 'twin_conversation',
                        timestamp: new Date().toISOString(),
                    });

                    // Keep last 100 check-ins
                    if (users[idx].twinCheckIns.length > 100) {
                        users[idx].twinCheckIns = users[idx].twinCheckIns.slice(-100);
                    }

                    await db.saveCollection('users', users);
                    console.log(`[TwinBrain] Saved check-in for user ${userId}`);
                    break;
                }
                case 'reflection': {
                    const users = await db.getCollection<any>('users');
                    const idx = users.findIndex((u: any) => u.id === userId);
                    if (idx === -1) break;

                    if (!users[idx].twinReflections) users[idx].twinReflections = [];
                    users[idx].twinReflections.push({
                        ...update.data,
                        source: 'twin_conversation',
                        timestamp: new Date().toISOString(),
                    });

                    if (users[idx].twinReflections.length > 200) {
                        users[idx].twinReflections = users[idx].twinReflections.slice(-200);
                    }

                    await db.saveCollection('users', users);
                    console.log(`[TwinBrain] Saved reflection for user ${userId}`);
                    break;
                }
                default:
                    console.log(`[TwinBrain] Unknown update type: ${update.type}`);
            }
        } catch (error: any) {
            console.error('[TwinBrain] Profile update error:', error.message);
        }
    }

    // ========================================================================
    // CONVERSATION HISTORY
    // ========================================================================

    private async getConversationHistory(userId: string): Promise<TwinConversationMessage[]> {
        try {
            const records = await db.getCollection<TwinConversationRecord>('twin_conversations');
            const record = records.find(r => r.userId === userId);
            return record?.messages || [];
        } catch {
            return [];
        }
    }

    private async saveConversationHistory(
        userId: string,
        messages: TwinConversationMessage[]
    ): Promise<void> {
        try {
            const records = await db.getCollection<TwinConversationRecord>('twin_conversations');
            const idx = records.findIndex(r => r.userId === userId);

            const record: TwinConversationRecord = {
                userId,
                messages,
                updatedAt: new Date().toISOString(),
            };

            if (idx >= 0) {
                records[idx] = record;
            } else {
                records.push(record);
            }

            await db.saveCollection('twin_conversations', records);
        } catch (error: any) {
            console.error('[TwinBrain] Save history error:', error.message);
        }
    }

    /**
     * Clear conversation history for a user.
     */
    async clearHistory(userId: string): Promise<void> {
        try {
            const records = await db.getCollection<TwinConversationRecord>('twin_conversations');
            const filtered = records.filter(r => r.userId !== userId);
            await db.saveCollection('twin_conversations', filtered);
        } catch { /* ignore */ }
    }

    /**
     * Generate a proactive greeting when the twin loads.
     * Uses time of day, active nudges, focus areas, and recent check-ins.
     */
    async generateGreeting(userId: string): Promise<TwinBrainResponse> {
        const hour = new Date().getHours();
        const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

        // Gather context pieces
        const contextParts: string[] = [];
        let userName = 'there';

        try {
            const profile = await userService.getProfile(userId);
            if (profile?.name) userName = profile.name.split(' ')[0];
        } catch { /* ignore */ }

        // Get active nudges
        let nudgeText = '';
        try {
            const { nudgesService } = require('./NudgesService');
            const nudges = await nudgesService.getActiveNudges(userId);
            if (nudges && nudges.length > 0) {
                const topNudge = nudges[0];
                nudgeText = topNudge.text;
                contextParts.push(`Active nudge: "${nudgeText}"`);
            }
        } catch { /* ignore */ }

        // Get focus areas
        try {
            const { lifeAreaService } = require('./LifeAreaService');
            const summary = await lifeAreaService.getDashboardSummary(userId);
            if (summary?.activeFocusAreas?.length > 0) {
                const focuses = summary.activeFocusAreas.map((a: any) => a.domain).join(', ');
                contextParts.push(`Active focus areas: ${focuses}`);
            }
            if (summary?.oneToday && !summary.oneToday.completed) {
                contextParts.push(`Today's One Thing: "${summary.oneToday.text}" (not yet done)`);
            }
        } catch { /* ignore */ }

        // Get recent twin check-ins
        try {
            const users = await db.getCollection<any>('users');
            const user = users.find((u: any) => u.id === userId);
            if (user?.twinCheckIns?.length > 0) {
                const last = user.twinCheckIns[user.twinCheckIns.length - 1];
                contextParts.push(`Last check-in mood: ${last.mood}, energy: ${last.energy}/5`);
            }
        } catch { /* ignore */ }

        // Get conversation freshness
        const history = await this.getConversationHistory(userId);
        const lastMsg = history.length > 0 ? history[history.length - 1] : null;
        let timeSinceLastChat = '';
        if (lastMsg) {
            const diff = Date.now() - new Date(lastMsg.timestamp).getTime();
            const hours = Math.floor(diff / (1000 * 60 * 60));
            if (hours < 1) timeSinceLastChat = 'just recently';
            else if (hours < 24) timeSinceLastChat = `${hours} hours ago`;
            else timeSinceLastChat = `${Math.floor(hours / 24)} days ago`;
        }

        // Use AI if available
        if (this.client) {
            const userContext = await this.buildUserContext(userId);

            const prompt = `Generate a brief, warm proactive greeting for ${userName}. It's ${timeOfDay}.

${timeSinceLastChat ? `Last conversation: ${timeSinceLastChat}` : 'This is their first visit.'}
${contextParts.length > 0 ? `\nContext:\n${contextParts.join('\n')}` : ''}

Rules:
- 1-3 sentences maximum
- Reference something specific from their context or profile
- If there's a nudge or "One Thing", weave it in naturally
- Be warm but not saccharine
- Make them feel seen

${userContext.slice(0, 1500)}

Return ONLY valid JSON:
{
  "reply": "your greeting",
  "emotion": "warm|encouraging|reflective|curious",
  "suggestedFollowUp": "optional question"
}`;

            try {
                const response = await this.client.messages.create({
                    model: this.model,
                    max_tokens: 300,
                    messages: [{ role: 'user', content: prompt }],
                    system: 'You are a digital twin greeting its owner. Be brief, warm, specific.',
                });

                const content = response.content[0];
                if (content.type === 'text') {
                    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0]);
                        return {
                            reply: parsed.reply,
                            emotion: parsed.emotion || 'warm',
                            suggestedFollowUp: parsed.suggestedFollowUp,
                        };
                    }
                }
            } catch (e: any) {
                console.error('[TwinBrain] Greeting AI error:', e.message);
            }
        }

        // Fallback greeting
        const greetings: TwinBrainResponse[] = [];

        if (nudgeText) {
            greetings.push({
                reply: `Good ${timeOfDay}, ${userName}. I have something for you today: "${nudgeText}"`,
                emotion: 'encouraging',
                suggestedFollowUp: 'How does that land with you?',
            });
        }

        if (timeSinceLastChat && timeSinceLastChat !== 'just recently') {
            greetings.push({
                reply: `Good ${timeOfDay}, ${userName}. It's been ${timeSinceLastChat} since we last talked. How are you feeling?`,
                emotion: 'warm',
                suggestedFollowUp: 'What\'s been on your mind?',
            });
        }

        greetings.push({
            reply: `Good ${timeOfDay}, ${userName}. I'm here whenever you need to think something through or just check in.`,
            emotion: 'warm',
            suggestedFollowUp: 'How\'s your energy today?',
        });

        return greetings[Math.floor(Math.random() * greetings.length)];
    }

    private getLayerName(layerId: number): string {
        const names: Record<number, string> = {
            1: 'Core Disposition', 2: 'Energy Orientation', 3: 'Cognitive Method',
            4: 'Internal Foundation', 5: 'Creative Expression', 6: 'Operational Rhythm',
            7: 'Relational Stance', 8: 'Transformative Potential', 9: 'Expansive Orientation',
            10: 'Architectural Focus', 11: 'Social Resonance', 12: 'Integrative Depth',
            13: 'Navigational Interface', 14: 'Evolutionary Trajectory', 15: 'Systemic Integration',
        };
        return names[layerId] || `Layer ${layerId}`;
    }
}

export const twinBrainService = new TwinBrainService();


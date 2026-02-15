import type { Question, Answer, ConsentLedgerEntry, TraitProbability } from '../core/models';

/**
 * OSIA API Service (Mock)
 * Implements "Guardrail Middleware" as per Spec v1.1
 */

export const api = {
    /**
     * Fetches questions for a specific stage.
     */
    async getQuestions(stageId: string): Promise<Question[]> {
        const response = await fetch('/src/core/data/manifest.json');
        const data = await response.json();

        // Find questions belonging to this stage
        const questions: Question[] = [];
        Object.values(data.sets).forEach((set: any) => {
            if (set.stage_id === stageId) {
                set.question_ids.forEach((id: string) => {
                    const q = data.questions[id];
                    if (q) questions.push({ ...q, question_id: id });
                });
            }
        });

        return questions;
    },

    /**
     * Fetches enums for a specific reference.
    */
    async getEnums(ref: string): Promise<string[]> {
        const response = await fetch('/src/core/data/manifest.json');
        const data = await response.json();
        return data.enums[ref] || [];
    },

    /**
     * Guardrail Middleware: Consent Gate
     * Rejects or redacts data based on the provided consent ledger.
     */
    applyConsentGate(data: any, domain: string, ledger: ConsentLedgerEntry[]): any {
        const isGranted = ledger.some(entry => entry.domains[domain] && entry.granted);

        if (!isGranted) {
            console.warn(`[Guardrail] Access denied for domain: ${domain}`);
            return null; // Or return redacted version
        }

        return data;
    },

    /**
     * Gu ardrail Middleware: PII Minimisation
     * Redacts potential identifiers from narrative text.
     */
    minimisePII(text: string): string {
        // Simple mock redaction for names/emails/phones
        return text
            .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL REDACTED]")
            .replace(/\b\d{10,}\b/g, "[PHONE REDACTED]");
    },

    /**
     * Saves an answer with guardrails applied.
     */
    async saveAnswer(answer: Answer): Promise<void> {
        // 1. Check Domain Consent
        // (In a real app, the backend would do this)

        // 2. Minimise PII if it's a narrative/text field
        if (typeof answer.value === 'string') {
            answer.value = this.minimisePII(answer.value);
        }

        console.log('[API] Answer saved with guardrails:', answer);
    },

    /**
     * Fetches aggregate team data from the backend.
     */
    async getTeamData(teamId: string): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch(`/api/teams/${teamId}/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch team data');
        return response.json();
    },

    async createTeam(data: any): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch('/api/teams', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to create team');
        return response.json();
    },

    async joinTeam(teamId: string): Promise<void> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch(`/api/teams/${teamId}/join`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to join team');
    },

    async getMyTeams(): Promise<any[]> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch('/api/teams/my-teams', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch teams');
        return response.json();
    },

    async searchTeamMembers(query: string): Promise<any[]> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch(`/api/teams/members/search?q=${encodeURIComponent(query)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Search failed');
        return response.json();
    },

    async addTeamMember(teamId: string, userId: string): Promise<void> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch(`/api/teams/${teamId}/members`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId })
        });
        if (!response.ok) throw new Error('Failed to add member');
    },

    // ===== TEAM SEARCH & JOIN REQUEST METHODS =====

    async searchTeams(query: string): Promise<any[]> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch(`/api/teams/search?q=${encodeURIComponent(query)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Search failed');
        return response.json();
    },

    async requestToJoinTeam(teamId: string, message?: string): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch(`/api/teams/${teamId}/request-join`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to submit join request');
        }
        return response.json();
    },

    async getMyJoinRequests(): Promise<any[]> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch('/api/teams/my-requests', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch requests');
        return response.json();
    },

    async getTeamJoinRequests(teamId: string): Promise<any[]> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch(`/api/teams/${teamId}/join-requests`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch join requests');
        return response.json();
    },

    async handleJoinRequest(teamId: string, requestId: string, action: 'approve' | 'reject'): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch(`/api/teams/${teamId}/join-requests/${requestId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action })
        });
        if (!response.ok) throw new Error('Failed to handle request');
        return response.json();
    },

    async leaveTeam(teamId: string): Promise<void> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch(`/api/teams/${teamId}/leave`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Failed to leave team');
    },

    async removeTeamMember(teamId: string, userId: string): Promise<void> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch(`/api/teams/${teamId}/members/${userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to remove member');
    },

    async deleteTeamMessage(teamId: string, messageId: string): Promise<void> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch(`/api/teams/${teamId}/messages/${messageId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to delete message');
    },

    async deleteTeam(teamId: string): Promise<void> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch(`/api/teams/${teamId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to delete team');
    },

    // Journey APIs
    async getJourneyProgress(): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch('/api/journey/progress', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch journey progress');
        return response.json();
    },

    async getJourneyBadges(): Promise<any[]> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch('/api/journey/badges', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch badges');
        return response.json();
    },

    async getJourneyLevel(): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch('/api/journey/level', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch level');
        return response.json();
    },

    async checkMilestones(): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch('/api/journey/check-milestones', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to check milestones');
        return response.json();
    },

    // OSIA Evolution APIs
    async getEvolutionTimeline(): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch('/api/evolution/timeline', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch evolution timeline');
        return response.json();
    },

    async getEvolutionReflection(): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch('/api/evolution/reflection', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch reflection');
        return response.json();
    },

    async getEvolutionNextSteps(): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch('/api/evolution/next-steps', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch next steps');
        return response.json();
    },

    // Protocol APIs
    async getRecommendedProtocols(): Promise<any[]> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch('/api/protocols/recommended', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch recommendations');
        return response.json();
    },

    async getActiveProtocols(): Promise<any[]> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch('/api/protocols/active', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch protocols');
        return response.json();
    },

    async getProtocolStats(): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch('/api/protocols/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch stats');
        return response.json();
    },

    async completeProtocolStep(protocolId: string, data?: { notes?: string; blueprintImpact?: any }): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch(`/api/protocols/${protocolId}/complete`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data || {})
        });
        if (!response.ok) throw new Error('Failed to complete protocol');
        return response.json();
    },

    async createProtocol(protocolData: any): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch('/api/protocols', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(protocolData)
        });
        if (!response.ok) throw new Error('Failed to create protocol');
        return response.json();
    },

    async getProtocolHistory(): Promise<any[]> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch('/api/protocols/history', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch protocol history');
        return response.json();
    },

    // ===== RECALIBRATION APIs =====

    async startRecalibrationSession(protocolType: string): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch('/api/protocols/recalibration/start', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ protocolType })
        });
        if (!response.ok) throw new Error('Failed to start recalibration session');
        return response.json();
    },

    async submitRecalibrationResponse(sessionId: string, questionId: string, value: number): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch(`/api/protocols/recalibration/${sessionId}/respond`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ questionId, value })
        });
        if (!response.ok) throw new Error('Failed to submit response');
        return response.json();
    },

    async completeRecalibrationSession(sessionId: string): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch(`/api/protocols/recalibration/${sessionId}/complete`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to complete session');
        return response.json();
    },

    async getBlueprintHistory(limit: number = 10): Promise<any[]> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch(`/api/protocols/blueprint/history?limit=${limit}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch Blueprint history');
        return response.json();
    },

    async getBlueprintTrends(traitId?: string): Promise<Record<string, any>> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const url = traitId
            ? `/api/protocols/blueprint/trends?trait=${traitId}`
            : '/api/protocols/blueprint/trends';
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch Blueprint trends');
        return response.json();
    },

    async updateTeamMemberRole(teamId: string, userId: string, role: string): Promise<void> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch(`/api/teams/${teamId}/members/${userId}/role`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role })
        });
        if (!response.ok) throw new Error('Failed to update member role');
    },

    /**
     * Saves a configured ritual.
     */
    async saveRitual(ritual: any): Promise<void> {
        console.log('[API] Ritual saved:', ritual);
    },

    /**
     * Updates integration nudge preferences.
     */
    async updateNudgeSettings(settings: any): Promise<void> {
        console.log('[API] Nudge settings updated:', settings);
    },

    /**
     * Exports all user data in a spec-compliant JSON format.
     */
    async exportData(): Promise<any> {
        console.log('[API] Data export initiated');
        return {
            version: '1.1',
            exported_at: new Date().toISOString(),
            data: {
                answers: [], // In a real app, fetch all answers
                events: [],  // In a real app, fetch all events
                consent_ledger: []
            }
        };
    },

    /**
     * Permanently deletes all user data.
     */
    async deleteData(): Promise<void> {
        console.log('[API] PERMANENT DATA DELETION EXECUTED');
    },

    /**
     * Pauses all signal acquisition.
     */
    async pauseAcquisition(paused: boolean): Promise<void> {
        console.log(`[API] Signal acquisition ${paused ? 'PAUSED' : 'RESUMED'}`);
    },

    /**
     * Assessment & Refinement API
     */
    async getHypotheses(): Promise<TraitProbability[]> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch('/api/origin-seed/assessment/hypotheses', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch hypotheses');
        return response.json();
    },

    async refineHypothesis(layerId: number, iteration: number): Promise<TraitProbability> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch('/api/origin-seed/assessment/refine', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ layerId, iteration })
        });
        if (!response.ok) throw new Error('Refinement failed');
        return response.json();
    },

    /**
     * Helper for fetching with timeout
     */
    async fetchWithTimeout(resource: string, options: any = {}, timeout = 60000) {
        const { signal, ...rest } = options;
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(resource, {
                ...rest,
                signal: controller.signal
            });
            clearTimeout(id);
            return response;
        } catch (error: any) {
            clearTimeout(id);
            if (error.name === 'AbortError') {
                throw new Error('Request timed out');
            }
            throw error;
        }
    },

    async completeAssessment(traits: TraitProbability[]): Promise<void> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;

        // Use a generous 90s timeout for complete assessment as it involves AI generation
        const response = await this.fetchWithTimeout('/api/origin-seed/assessment/complete', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ traits })
        }, 90000);

        if (!response.ok) throw new Error('Finalization failed');
    },

    /**
     * Team Messaging
     */
    async getTeamMessages(teamId: string): Promise<any[]> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch(`/api/teams/${teamId}/messages`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch messages');
        return response.json();
    },

    async sendTeamMessage(teamId: string, content: string): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch(`/api/teams/${teamId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content })
        });
        if (!response.ok) throw new Error('Failed to send message');
        return response.json();
    },

    // ===== OSIA INTELLIGENCE API =====

    /**
     * Get the latest OSIA output (Thesis, Insights, Connectors)
     */
    async getOSIALatest(): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch('/api/osia/latest', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch OSIA output');
        return response.json();
    },

    /**
     * Get Personality Thesis
     */
    async getPersonalityThesis(format: 'json' | 'markdown' = 'json'): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch(`/api/osia/thesis?format=${format}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to fetch thesis');
        }
        return response.json();
    },

    /**
     * Get Core Insights Hub
     */
    async getCoreInsightsHub(format: 'json' | 'markdown' = 'json'): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch(`/api/osia/insights?format=${format}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to fetch insights');
        }
        return response.json();
    },

    /**
     * Get Relational Connectors
     */
    async getRelationalConnectors(types?: string[], format: 'json' | 'markdown' = 'json'): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const typeParam = types ? `&types=${types.join(',')}` : '';
        const response = await fetch(`/api/osia/connectors?format=${format}${typeParam}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to fetch connectors');
        }
        return response.json();
    },

    /**
     * Submit claim resonance feedback
     */
    async submitClaimFeedback(claimId: string, resonance: 'fits' | 'partial' | 'doesnt_fit', contextTags?: string[]): Promise<void> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch('/api/osia/feedback', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ claimId, resonance, contextTags })
        });
        if (!response.ok) throw new Error('Failed to submit feedback');
    },

    /**
     * Get OSIA snapshot history
     */
    async getOSIAHistory(limit: number = 10): Promise<any[]> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch(`/api/osia/history?limit=${limit}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch history');
        return response.json();
    },

    /**
     * Regenerate OSIA output from existing profile data
     */
    async regenerateOSIA(): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch('/api/osia/regenerate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to regenerate OSIA output');
        }
        return response.json();
    },

    // ===== REFINEMENT APIs =====

    async getRefinementBlueprint(): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch('/api/refinement/current', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch refinement blueprint');
        return response.json();
    },

    async getRefinementQuestion(layerId: number): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch(`/api/refinement/question/${layerId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to generate question');
        return response.json();
    },

    async submitRefinementResponse(experimentId: string, answer: string): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch('/api/refinement/submit', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ experimentId, answer })
        });
        if (!response.ok) throw new Error('Failed to submit response');
        return response.json();
    },

    async completeRefinementSession(): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch('/api/refinement/complete', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Failed to complete refinement');
        return response.json();
    },

    async getRefinementHistory(limit: number = 20): Promise<any[]> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch(`/api/refinement/history?limit=${limit}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch refinement history');
        return response.json();
    },

    // ── Organization Domain ──────────────────────────────────────────

    async getOrganization(orgId: string): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch(`/api/organizations/${orgId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response;
    },

    async getOrganizationPublic(orgId: string): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch(`/api/organizations/${orgId}/public`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response;
    },

    async getOrganizationBySlug(slug: string): Promise<Response> {
        return fetch(`/api/organizations/slug/${slug}`);
    },

    async getMyMemberships(): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch('/api/organizations/my/memberships', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response;
    },

    async getOrgMembers(orgId: string): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch(`/api/organizations/${orgId}/members`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response;
    },

    async getOrgAnalytics(orgId: string): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch(`/api/organizations/${orgId}/analytics`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response;
    },

    async getOrgRoles(orgId: string): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch(`/api/organizations/${orgId}/roles`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return response;
    },

    async createOrgRole(orgId: string, data: { title: string; department: string; idealTraits: any }): Promise<Response> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        return fetch(`/api/organizations/${orgId}/roles`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    },

    async updateOrgSettings(orgId: string, settings: any): Promise<Response> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        return fetch(`/api/organizations/${orgId}/settings`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
    },

    async approveMember(orgId: string, memberId: string): Promise<Response> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        return fetch(`/api/organizations/${orgId}/members/${memberId}/approve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    },

    async removeMember(orgId: string, memberId: string): Promise<Response> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        return fetch(`/api/organizations/${orgId}/members/${memberId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    },

    async updateMemberRole(orgId: string, memberId: string, role: string): Promise<Response> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        return fetch(`/api/organizations/${orgId}/members/${memberId}/role`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ role })
        });
    },

    async addMember(orgId: string, data: { email: string; role: string }): Promise<Response> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        return fetch(`/api/organizations/${orgId}/members/add`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    },

    async updateMemberConsent(orgId: string, memberId: string, updates: any): Promise<Response> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        return fetch(`/api/organizations/${orgId}/members/${memberId}/consent`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
    },

    async searchOrganizations(query: string): Promise<Response> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return fetch(`/api/organizations/search?q=${encodeURIComponent(query)}`, { headers });
    },

    async joinOrganization(orgId: string, data: any): Promise<Response> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        return fetch(`/api/organizations/${orgId}/join`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    },

    async getOrgQuestionnaire(): Promise<any[]> {
        const response = await fetch('/api/organizations/questionnaire');
        return response.json();
    },

    async createOrganization(data: any): Promise<Response> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        return fetch('/api/organizations', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    },

    async setOrgBlueprint(orgId: string, responses: Record<string, number>): Promise<Response> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        return fetch(`/api/organizations/${orgId}/blueprint`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ responses })
        });
    },

    // ── Org Culture (OSIA) ───────────────────────────────────────────

    async getOrgCulture(orgId: string): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch(`/api/orgs/osia/${orgId}/culture`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch culture data');
        return response.json();
    },

    async analyzeOrgCulture(orgId: string): Promise<Response> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        return fetch(`/api/orgs/osia/${orgId}/analyze`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
    },

    // ── Team Dynamics (OSIA) ─────────────────────────────────────────

    async getTeamDynamics(teamId: string): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch(`/api/teams/osia/${teamId}/dynamics`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch team dynamics');
        return response.json();
    },

    async analyzeTeamDynamics(teamId: string): Promise<Response> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        return fetch(`/api/teams/osia/${teamId}/analyze`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
    },

    // ── Settings / User ──────────────────────────────────────────────

    async setup2FA(): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch('/api/auth/2fa/setup', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error('Failed to initiate 2FA setup');
        return response.json();
    },

    async verify2FA(secret: string, code: string): Promise<Response> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        return fetch('/api/auth/2fa/verify', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ secret, code })
        });
    },

    async disable2FA(): Promise<Response> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        return fetch('/api/auth/2fa/disable', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
    },

    async uploadAvatar(formData: FormData): Promise<Response> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        return fetch('/api/users/avatar', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
    },

    async updateProfile(data: { name: string }): Promise<Response> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        return fetch('/api/users/profile', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    },

    async requestDeletion(): Promise<Response> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        return fetch('/api/users/request-deletion', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    },

    // ── Admin ────────────────────────────────────────────────────────

    async getAdminAnalytics(): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch('/api/admin/analytics', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch admin analytics');
        return response.json();
    },

    async getUnreadFeedbackCount(): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const response = await fetch('/api/feedback/unread-count', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch unread feedback count');
        return response.json();
    },

    // ── Feedback ─────────────────────────────────────────────────────

    async submitFeedback(formData: FormData): Promise<Response> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        return fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
    },

    // ── Layer Feedback & Protocols ───────────────────────────────────

    async submitLayerFeedback(data: { insightId: string; feedback: string; layerId: string }): Promise<Response> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        return fetch('/api/users/feedback', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    },

    async submitCustomProtocol(data: { prompt: string; layerId: string; status: string }): Promise<Response> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        return fetch('/api/users/protocols', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    },

    // ── Founding Circle ──────────────────────────────────────────────

    async joinFoundingCircle(data: { email: string; referralSource: string }): Promise<Response> {
        return fetch('/api/founding-circle/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    },

    // ── Organization Culture ─────────────────────────────────────────

    async getOrgCulture(orgId: string): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const res = await fetch(`/api/organizations/${orgId}/culture`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Failed to fetch culture data' }));
            throw new Error(err.error || 'Failed to fetch culture data');
        }
        return res.json();
    },

    async analyzeOrgCulture(orgId: string): Promise<Response> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        return fetch(`/api/organizations/${orgId}/culture/analyze`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
    },

    // ── Subscription Management ──────────────────────────────────────

    async getSubscription(): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const res = await fetch('/api/subscriptions/current', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Failed to fetch subscription' }));
            throw new Error(err.error || 'Failed to fetch subscription');
        }
        return res.json();
    },

    async createCheckout(priceId: string): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const res = await fetch('/api/subscriptions/create-checkout', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                priceId,
                successUrl: `${window.location.origin}/settings?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: `${window.location.origin}/settings?checkout=cancelled`
            })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Failed to create checkout' }));
            throw new Error(err.error || 'Failed to create checkout');
        }
        return res.json();
    },

    async openBillingPortal(): Promise<any> {
        const authData = localStorage.getItem('OSIA_auth');
        const token = authData ? JSON.parse(authData).token : null;
        const res = await fetch('/api/subscriptions/customer-portal', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ returnUrl: window.location.href })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Failed to open billing portal' }));
            throw new Error(err.error || 'Failed to open billing portal');
        }
        return res.json();
    }
};

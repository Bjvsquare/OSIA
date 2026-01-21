export class RealtimeService {
    private readonly apiKey: string;

    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY || '';
        if (!this.apiKey) {
            console.warn('[RealtimeService] OPENAI_API_KEY is not set in environment variables.');
        } else {
            console.log('[RealtimeService] API Key is present (length: ' + this.apiKey.length + ')');
        }
    }

    /**
     * Creates an ephemeral session token for the OpenAI Realtime API.
     * This token is used by the frontend to connect via WebRTC.
     */
    async createSessionToken(voice: string = 'verse') {
        if (!this.apiKey) {
            console.error('[RealtimeService] Cannot create session: API Key missing');
            throw new Error('OPENAI_API_KEY is missing');
        }

        try {
            console.log(`[RealtimeService] Requesting session token from OpenAI (Voice: ${voice})...`);
            const response = await fetch(
                'https://api.openai.com/v1/realtime/sessions',
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o-realtime-preview-2024-12-17',
                        voice: voice,
                    }),
                }
            );

            const data: any = await response.json();

            if (!response.ok) {
                console.error('[RealtimeService] OpenAI API Error:', {
                    status: response.status,
                    data
                });
                throw new Error(`OpenAI API failed: ${data.error?.message || response.statusText}`);
            }

            console.log('[RealtimeService] Success: Session token received');
            return data;
        } catch (error: any) {
            console.error('[RealtimeService] Unexpected Error:', error.message);
            throw new Error('Failed to create Realtime session token: ' + error.message);
        }
    }
}

export const realtimeService = new RealtimeService();

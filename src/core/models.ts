export type LayerId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

export interface TraitProbability {
    traitId: string;
    layerId: number;
    score: number;
    confidence: number;
    description?: string;
}

export interface Layer {
    id: LayerId;
    name: string;
    value: number; // 0.0 to 1.0
    confidence: number; // 0.0 to 1.0
    status: 'unformed' | 'emerging' | 'developed' | 'integrated';
    stability: number; // 0.0 to 1.0
    signal_density: number;
    convergenceCount: number;
    userValidation?: 'resonates' | 'not_sure' | 'doesnt_fit';
    evidence_summary: string[];
    description?: string;
}

export interface Profile {
    userId: string;
    layers: Record<LayerId, Layer>;
    maturity: 'emerging' | 'developing' | 'established';
    updatedAt: string;
}

export type QuestionType =
    | 'consent_toggle'
    | 'single_select'
    | 'multi_select'
    | 'likert_1_5'
    | 'short_text'
    | 'long_text'
    | 'word_list_n'
    | 'text_list'
    | 'tag_select'
    | 'datetime_pref';

export interface QuestionConstraints {
    min_select?: number;
    max_select?: number;
    min_chars?: number;
    max_chars?: number;
    exact_items?: number;
    min_items?: number;
    max_items?: number;
    other_requires_text?: boolean;
    enum_ref?: string;
}

export interface Question {
    question_id: string;
    stage_id: string;
    set_id: string;
    prompt: string;
    type: QuestionType;
    required: boolean;
    enum_ref?: string;
    constraints?: QuestionConstraints;
    consent_domain: string;
    sensitivity: 'low' | 'medium' | 'high';
    maps_to_layers: number[];
    emits_signals: string[];
    visibility_rule?: string;
    confidence_marker?: boolean;
    options?: string[];
}

export interface Answer {
    user_id: string;
    question_id: string;
    answered_at: string;
    value: any;
    confidence?: string;
    derived?: {
        word_count?: number;
        clean_tokens?: string[];
        [key: string]: any;
    };
}

// --- OSIA SPEC V1.1 DATA OBJECTS ---

export interface ConsentLedgerEntry {
    entry_id: string;
    user_id: string;
    domains: Record<string, boolean>; // e.g., { personal_intelligence: true, relational_connect: false }
    granted: boolean;
    policy: string; // e.g., 'v1.1'
    occurred_at: string;
}

export interface BaselineResponseSet {
    set_id: string;
    user_id: string;
    context: 'work' | 'personal' | 'other';
    energise_situations: string[]; // exactly 3
    drain_situations: string[]; // exactly 3
    created_at: string;
}

export interface LexicalDescriptorSet {
    set_id: string;
    user_id: string;
    best_words: string[]; // exactly 5
    stress_words: string[]; // exactly 5
    observer_words?: string[]; // exactly 5
    created_at: string;
}

export interface NarrativeEntry {
    entry_id: string;
    user_id: string;
    prompt_key: string;
    text: string;
    created_at: string;
    redaction_flag: boolean;
}

export interface InsightCard {
    insight_id: string;
    user_id: string;
    layer_refs: LayerId[];
    text: string;
    confidence_band: 'low' | 'medium' | 'high';
    created_at: string;
    provenance: string[]; // input types used
}

export interface UserFeedback {
    feedback_id: string;
    user_id: string;
    insight_id: string;
    feedback_enum: 'resonates' | 'not_sure' | 'off';
    created_at: string;
}

export interface CheckIn {
    checkin_id: string;
    user_id: string;
    prompt_id: string;
    response: string;
    tags: {
        energy: number; // 1-5
        tone: string;
        context: string;
    };
    created_at: string;
}

export interface RelationalPromptSet {
    set_id: string;
    link_id: string;
    user_id: string;
    responses: string[];
    created_at: string;
}

export interface TeamMembership {
    membership_id: string;
    team_id: string;
    user_id: string;
    opt_in: boolean;
    visibility_mode: 'aggregate_only' | 'named_with_consent';
    created_at: string;
}

export interface TeamCheckIn {
    checkin_id: string;
    team_id: string;
    user_id: string;
    items: number[];
    created_at: string;
}

export interface EventSchema {
    event_id: string;
    event_name: string; // e.g., 'blueprint_baseline_submitted', 'consent_changed'
    occurred_at: string;
    user_id: string;
    session_id: string;
    screen_id: string;
    consent_snapshot: Record<string, boolean>;
    properties: Record<string, any>;
}

export interface FocusJourney {
    id: string;
    status: 'active' | 'completed' | 'deferred';
    started_at: string;
    focus_area: string;
}

export interface RelationalLink {
    user_a: string;
    user_b: string;
    status: 'pending' | 'active' | 'revoked';
    mutual_opt_in: boolean;
}

// --- ONBOARDING STATE ---

export interface OnboardingState {
    currentStageId: string;
    answers: Record<string, Answer>;
    completedStages: string[];
    consentLedger: ConsentLedgerEntry[];
    sessionId: string;
}

export interface ProfileThesis {
    overview: string;
    cognitiveBlueprint: string;
    strengths: { title: string; description: string }[];
    frictionZones: { title: string; description: string }[];
    growthTrajectories: { title: string; description: string }[];
    closingReflection: string;
}

export interface CoreInsightDomain {
    domain: string;
    coreTheme: string;
    challenge: string;
    oneThing: string;
    outcome: string;
}

export interface RelationalConnector {
    type: string;
    strength: string;
    friction: string;
    growthFocus: string;
}

export interface RelationalProfile {
    coreStyle: string;
    strengths: { title: string; description: string }[];
    challenges: { title: string; description: string }[];
    connectors: RelationalConnector[];
    onePractice: string;
}

export interface FullUserProfile {
    thesis: ProfileThesis;
    coreInsights: CoreInsightDomain[];
    relational: RelationalProfile;
}

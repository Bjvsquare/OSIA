import { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';

interface ThesisSection {
    sectionType: string;
    content: string;
    sourcePatternIds: string[];
    sourceClaimIds?: string[];
    wordCount: number;
}

interface PersonalityThesis {
    userId: string;
    generatedAt: string;
    sections: ThesisSection[];
    totalWordCount: number;
    patternCount: number;
    themeCount: number;
    stabilityIndex: number;
}

const SECTION_CONFIG: Record<string, { label: string; icon: string; gradient: string }> = {
    foundational_overview: {
        label: 'Foundational Overview',
        icon: '◈',
        gradient: 'from-teal-500/20 via-cyan-500/10 to-transparent'
    },
    cognitive_emotional_blueprint: {
        label: 'Cognitive & Emotional Blueprint',
        icon: '⬡',
        gradient: 'from-purple-500/20 via-violet-500/10 to-transparent'
    },
    core_strengths: {
        label: 'Core Strengths & Capacities',
        icon: '◆',
        gradient: 'from-emerald-500/20 via-green-500/10 to-transparent'
    },
    friction_zones: {
        label: 'Friction Zones & Vulnerabilities',
        icon: '⬢',
        gradient: 'from-amber-500/20 via-orange-500/10 to-transparent'
    },
    behavioral_relational: {
        label: 'Behavioral & Relational Style',
        icon: '◇',
        gradient: 'from-rose-500/20 via-pink-500/10 to-transparent'
    },
    growth_trajectories: {
        label: 'Growth Trajectories',
        icon: '△',
        gradient: 'from-blue-500/20 via-indigo-500/10 to-transparent'
    },
    closing_reflection: {
        label: 'Closing Reflection',
        icon: '○',
        gradient: 'from-osia-teal-500/20 via-teal-500/10 to-transparent'
    }
};

// Parse content into structured paragraphs - handles both formatted and plain prose
function parseContentToParagraphs(content: string): { type: 'header' | 'paragraph' | 'list-item' | 'quote'; text: string; level?: number }[] {
    if (!content) return [];

    // Check if content has line breaks (markdown formatted)
    const hasLineBreaks = content.includes('\n');

    if (hasLineBreaks) {
        // Content has formatting - parse normally
        const lines = content.split('\n').filter(line => line.trim());
        const result: { type: 'header' | 'paragraph' | 'list-item' | 'quote'; text: string; level?: number }[] = [];

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('### ')) {
                result.push({ type: 'header', text: trimmed.replace('### ', ''), level: 3 });
            } else if (trimmed.startsWith('## ')) {
                result.push({ type: 'header', text: trimmed.replace('## ', ''), level: 2 });
            } else if (trimmed.startsWith('# ')) {
                result.push({ type: 'header', text: trimmed.replace('# ', ''), level: 1 });
            } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
                result.push({ type: 'list-item', text: trimmed.replace(/^[-•]\s/, '') });
            } else if (trimmed.startsWith('> ')) {
                result.push({ type: 'quote', text: trimmed.replace('> ', '') });
            } else if (trimmed.match(/^\d+\.\s/)) {
                result.push({ type: 'list-item', text: trimmed.replace(/^\d+\.\s/, '') });
            } else {
                result.push({ type: 'paragraph', text: trimmed });
            }
        }
        return result;
    }

    // Content is plain prose - intelligently split into paragraphs
    // Split on sentence endings followed by capital letters (new thoughts)
    const result: { type: 'header' | 'paragraph' | 'list-item' | 'quote'; text: string; level?: number }[] = [];

    // Clean up the content
    const cleaned = content.replace(/\s+/g, ' ').trim();

    // Split into sentences
    const sentences = cleaned.split(/(?<=[.!?])\s+(?=[A-Z])/);

    // Group sentences into paragraphs (3-4 sentences each for readability)
    const SENTENCES_PER_PARAGRAPH = 3;
    let currentParagraph: string[] = [];

    for (let i = 0; i < sentences.length; i++) {
        currentParagraph.push(sentences[i]);

        // Create a new paragraph every N sentences, or at natural break points
        const shouldBreak =
            currentParagraph.length >= SENTENCES_PER_PARAGRAPH ||
            sentences[i].match(/\.\s*$/) && sentences[i + 1]?.match(/^(However|Furthermore|Additionally|Moreover|In contrast|On the other hand|This|That said|Consequently|Therefore|As a result|Because of this|When|For|Your|You)/i);

        if (shouldBreak || i === sentences.length - 1) {
            result.push({
                type: 'paragraph',
                text: currentParagraph.join(' ')
            });
            currentParagraph = [];
        }
    }

    return result;
}


// Render inline formatting (bold, italic)

function renderFormattedText(text: string): string {
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
        .replace(/\*(.+?)\*/g, '<em class="text-osia-teal-300">$1</em>')
        .replace(/_(.+?)_/g, '<em class="text-osia-neutral-300">$1</em>');
}

export function ThesisPage() {
    const [thesis, setThesis] = useState<PersonalityThesis | null>(null);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState(0);
    const [showAllSections, setShowAllSections] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchThesis = async () => {
            try {
                const data = await api.getPersonalityThesis('json');
                setThesis(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchThesis();
    }, []);

    if (loading) {
        return (
            <div className="min-h-full flex items-center justify-center">
                <div className="text-center space-y-6">
                    <div className="relative">
                        <div className="w-20 h-20 border-2 border-osia-teal-500/20 rounded-full animate-pulse" />
                        <div className="absolute inset-0 w-20 h-20 border-2 border-transparent border-t-osia-teal-500 rounded-full animate-spin" />
                        <div className="absolute inset-2 w-16 h-16 border border-osia-teal-500/10 rounded-full" />
                    </div>
                    <div>
                        <p className="text-osia-neutral-300 text-sm font-medium">Loading your thesis</p>
                        <p className="text-osia-neutral-500 text-xs mt-1">Assembling psychological architecture...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !thesis) {
        const isNoData = error?.includes('No thesis found') || error?.includes('No output found');

        return (
            <div className="min-h-full flex items-center justify-center">
                <Card className="p-8 max-w-md text-center space-y-4">
                    <h2 className="text-xl font-bold text-white">
                        {isNoData ? 'Thesis Not Yet Generated' : 'Thesis Not Ready'}
                    </h2>
                    <p className="text-osia-neutral-400 text-sm">
                        {isNoData
                            ? 'Your Personality Thesis will be generated automatically once your onboarding profile is complete. Check your onboarding status to proceed.'
                            : error || 'Complete more of your profile to access your Personality Thesis.'}
                    </p>
                    <div className="flex flex-col gap-2">
                        <Button onClick={() => navigate('/')} variant="primary">
                            Return Home
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    const currentSection = thesis.sections[activeSection];
    const sectionConfig = SECTION_CONFIG[currentSection?.sectionType] || {
        label: currentSection?.sectionType || 'Section',
        icon: '◉',
        gradient: 'from-osia-teal-500/20 to-transparent'
    };
    const parsedContent = parseContentToParagraphs(currentSection?.content || '');

    return (
        <div className="min-h-full text-white relative pb-16 overflow-hidden">
            {/* Ambient background effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-200px] right-[-100px] w-[600px] h-[600px] bg-osia-teal-500/5 rounded-full blur-[150px] animate-pulse"
                    style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-[-150px] left-[-50px] w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] animate-pulse"
                    style={{ animationDuration: '12s', animationDelay: '2s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-osia-teal-500/3 to-transparent rounded-full" />
            </div>

            {/* Cross-navigation tabs */}
            <div className="relative z-10 flex items-center gap-1 bg-white/[0.03] rounded-full p-1 border border-white/5 backdrop-blur-md w-fit mb-4">
                <span className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-full bg-osia-teal-500 text-white shadow-[0_0_15px_rgba(56,163,165,0.4)]">
                    Thesis
                </span>
                <button
                    onClick={() => navigate('/patterns')}
                    className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-full text-osia-neutral-400 hover:text-white hover:bg-white/5 transition-all"
                >
                    Patterns
                </button>
            </div>

            {/* Hero Header */}
            <div className="relative z-10 text-center pt-8 pb-12 px-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-osia-teal-500/10 border border-osia-teal-500/20 mb-6">
                    <span className="w-2 h-2 rounded-full bg-osia-teal-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-osia-teal-400 uppercase tracking-[0.25em]">
                        Module 1 • Personality Thesis
                    </span>
                </div>

                <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
                    <span className="bg-gradient-to-r from-white via-white to-osia-neutral-400 bg-clip-text text-transparent">
                        Your Psychological
                    </span>
                    <br />
                    <span className="bg-gradient-to-r from-osia-teal-400 via-osia-teal-300 to-cyan-400 bg-clip-text text-transparent">
                        Architecture
                    </span>
                </h1>

                <p className="text-osia-neutral-400 text-sm max-w-lg mx-auto leading-relaxed">
                    A comprehensive analysis of your inner blueprint — the patterns, strengths,
                    and trajectories that define your unique psychological signature.
                </p>
            </div>

            {/* Stats Row */}
            <div className="relative z-10 flex justify-center gap-6 md:gap-12 mb-10 px-4">
                <div className="text-center group">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-osia-teal-500/20 to-osia-teal-500/5 border border-osia-teal-500/20 flex items-center justify-center mb-2 group-hover:border-osia-teal-500/40 transition-colors">
                        <span className="text-2xl font-black text-osia-teal-400">{Math.round(thesis.stabilityIndex * 100)}%</span>
                    </div>
                    <span className="text-[10px] font-bold text-osia-neutral-500 uppercase tracking-widest">Stability</span>
                </div>
                <div className="text-center group">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/20 flex items-center justify-center mb-2 group-hover:border-purple-500/40 transition-colors">
                        <span className="text-2xl font-black text-purple-400">{thesis.patternCount}</span>
                    </div>
                    <span className="text-[10px] font-bold text-osia-neutral-500 uppercase tracking-widest">Patterns</span>
                </div>
                <div className="text-center group">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/20 flex items-center justify-center mb-2 group-hover:border-cyan-500/40 transition-colors">
                        <span className="text-2xl font-black text-cyan-400">{thesis.themeCount}</span>
                    </div>
                    <span className="text-[10px] font-bold text-osia-neutral-500 uppercase tracking-widest">Themes</span>
                </div>
                <div className="text-center group">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/20 flex items-center justify-center mb-2 group-hover:border-amber-500/40 transition-colors">
                        <span className="text-2xl font-black text-amber-400">{thesis.totalWordCount.toLocaleString()}</span>
                    </div>
                    <span className="text-[10px] font-bold text-osia-neutral-500 uppercase tracking-widest">Words</span>
                </div>
            </div>

            {/* Section Navigation Tabs */}
            <div className="relative z-10 max-w-5xl mx-auto px-4 mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-bold text-osia-neutral-500 uppercase tracking-widest">
                        Thesis Sections
                    </h2>
                    <button
                        onClick={() => setShowAllSections(!showAllSections)}
                        className="text-xs text-osia-teal-400 hover:text-osia-teal-300 transition-colors"
                    >
                        {showAllSections ? 'Show Single' : 'Show All'}
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {thesis.sections.map((section, idx) => {
                        const config = SECTION_CONFIG[section.sectionType] || { label: section.sectionType, icon: '◉' };
                        return (
                            <button
                                key={section.sectionType}
                                onClick={() => {
                                    setActiveSection(idx);
                                    setShowAllSections(false);
                                }}
                                className={`group flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 ${activeSection === idx && !showAllSections
                                    ? 'bg-gradient-to-r from-osia-teal-500 to-osia-teal-400 text-white shadow-lg shadow-osia-teal-500/25'
                                    : 'bg-white/5 text-osia-neutral-400 hover:bg-white/10 hover:text-white border border-white/5 hover:border-white/10'
                                    }`}
                            >
                                <span className={`transition-transform group-hover:scale-110 ${activeSection === idx && !showAllSections ? 'text-white' : 'text-osia-teal-500'}`}>
                                    {config.icon}
                                </span>
                                <span className="hidden md:inline">{config.label}</span>
                                <span className="md:hidden">{idx + 1}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Area */}
            <div className="relative z-10 max-w-4xl mx-auto px-4">
                {showAllSections ? (
                    // All sections view
                    <div className="space-y-8">
                        {thesis.sections.map((section, idx) => {
                            const config = SECTION_CONFIG[section.sectionType] || { label: section.sectionType, icon: '◉', gradient: 'from-osia-teal-500/20 to-transparent' };
                            const parsed = parseContentToParagraphs(section.content || '');
                            return (
                                <SectionCard
                                    key={section.sectionType}
                                    section={section}
                                    config={config}
                                    parsedContent={parsed}
                                    sectionNumber={idx + 1}
                                />
                            );
                        })}
                    </div>
                ) : (
                    // Single section view
                    <SectionCard
                        section={currentSection}
                        config={sectionConfig}
                        parsedContent={parsedContent}
                        sectionNumber={activeSection + 1}
                    />
                )}
            </div>

            {/* Action Footer */}
            <div className="relative z-10 flex justify-center mt-12">
                <Button onClick={() => navigate('/insights')} variant="outline" size="lg">
                    View Insights Hub →
                </Button>
            </div>

            {/* Generation timestamp */}
            <div className="relative z-10 text-center mt-8">
                <p className="text-[10px] text-osia-neutral-600">
                    Generated {new Date(thesis.generatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </p>
            </div>
        </div>
    );
}

// Section Card Component
function SectionCard({
    section,
    config,
    parsedContent,
    sectionNumber
}: {
    section: ThesisSection;
    config: { label: string; icon: string; gradient: string };
    parsedContent: { type: string; text: string; level?: number }[];
    sectionNumber: number;
}) {
    return (
        <div className="relative group">
            {/* Gradient overlay */}
            <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} rounded-3xl opacity-50 group-hover:opacity-70 transition-opacity`} />

            <div className="relative bg-osia-deep-800/80 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden">
                {/* Section Header */}
                <div className="px-8 py-6 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-osia-teal-500/30 to-osia-teal-500/10 flex items-center justify-center border border-osia-teal-500/20">
                            <span className="text-xl text-osia-teal-400">{config.icon}</span>
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-osia-neutral-500 uppercase tracking-widest mb-1">
                                Section {sectionNumber} of 7
                            </div>
                            <h3 className="text-xl font-bold text-white">{config.label}</h3>
                        </div>
                    </div>
                </div>

                {/* Section Content */}
                <div className="px-8 py-8 space-y-6">
                    {parsedContent.map((item, idx) => {
                        if (item.type === 'header') {
                            const HeaderTag = item.level === 1 ? 'h2' : item.level === 2 ? 'h3' : 'h4';
                            const headerClasses = item.level === 1
                                ? 'text-2xl font-bold text-white mt-8 mb-4'
                                : item.level === 2
                                    ? 'text-xl font-bold text-white mt-6 mb-3'
                                    : 'text-lg font-semibold text-osia-teal-400 mt-5 mb-2';
                            return (
                                <HeaderTag key={idx} className={headerClasses}>
                                    {item.text}
                                </HeaderTag>
                            );
                        }

                        if (item.type === 'quote') {
                            return (
                                <blockquote
                                    key={idx}
                                    className="relative pl-6 py-4 my-6 border-l-2 border-osia-teal-500/50 bg-osia-teal-500/5 rounded-r-xl"
                                >
                                    <span className="absolute left-2 top-2 text-2xl text-osia-teal-500/30">"</span>
                                    <p
                                        className="text-osia-neutral-200 italic leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: renderFormattedText(item.text) }}
                                    />
                                </blockquote>
                            );
                        }

                        if (item.type === 'list-item') {
                            return (
                                <div key={idx} className="flex gap-3 items-start ml-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-osia-teal-500 mt-2.5 flex-shrink-0" />
                                    <p
                                        className="text-osia-neutral-200 leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: renderFormattedText(item.text) }}
                                    />
                                </div>
                            );
                        }

                        // Paragraph - with special styling for first paragraph
                        return (
                            <p
                                key={idx}
                                className={`leading-relaxed ${idx === 0
                                    ? 'text-lg text-osia-neutral-100 first-letter:text-4xl first-letter:font-bold first-letter:text-osia-teal-400 first-letter:mr-1 first-letter:float-left first-letter:leading-none'
                                    : 'text-osia-neutral-300'
                                    }`}
                                dangerouslySetInnerHTML={{ __html: renderFormattedText(item.text) }}
                            />
                        );
                    })}
                </div>

                {/* Section Footer - Pattern Citations */}
                {section.sourcePatternIds && section.sourcePatternIds.length > 0 && (
                    <div className="px-8 py-4 border-t border-white/5 bg-white/[0.02]">
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-[9px] font-bold text-osia-neutral-500 uppercase tracking-widest">
                                Supporting Patterns
                            </span>
                            {section.sourcePatternIds.map(id => (
                                <span
                                    key={id}
                                    className="px-3 py-1 text-[10px] font-medium bg-osia-teal-500/10 text-osia-teal-400 rounded-full border border-osia-teal-500/20"
                                >
                                    {id.replace('PAT.IND.', '').replace(/_/g, ' ')}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

import { motion } from 'framer-motion';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PlexusBackground } from '../../components/viz/PlexusBackground';
import { useParams } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../auth/AuthContext';
import { api } from '../../services/api';

export function LayerDetail() {
    const { layerId } = useParams();
    const { showToast, ToastComponent } = useToast();
    const { userProfile, auth } = useAuth();

    // Map UI layer IDs to 15-layer system IDs (OriginSeedService)
    const LAYER_ID_MAPPING: Record<string, number> = {
        'decision_patterns': 3,   // COGNITIVE_METHOD
        'energy_recovery': 2,     // ENERGY_ORIENTATION
        'relational_dynamics': 7, // RELATIONAL_STANCE
        'communication_style': 11, // SOCIAL_RESONANCE
        'growth_edge': 8          // TRANSFORMATIVE_POTENTIAL
    };

    // Layer-specific content for all 15 layers
    const LAYER_CONTENT: Record<string, {
        name: string;
        definition: string;
        summary: string;
        insights: Array<{ title: string; status: string; text: string; showsUpAs: string[]; reflectionQ: string }>;
        experiment: { prompt: string; whyItHelps: string };
    }> = {
        'identity_core': {
            name: 'Identity Core',
            definition: 'This layer explores who you are at your deepest level — your essential sense of self that remains constant across different situations.',
            summary: 'Your identity appears rooted in authenticity and self-expression. You tend to stay true to yourself even when external pressures push for conformity.',
            insights: [
                { title: 'Core Stability', status: 'Developing', text: 'You seem to have a strong internal compass that guides major life decisions.', showsUpAs: ['Consistent values across contexts', 'Resistance to peer pressure'], reflectionQ: 'What part of yourself would you never compromise on?' },
                { title: 'Identity Expression', status: 'Emerging', text: 'There may be aspects of yourself you hold back in certain environments.', showsUpAs: ['Different personas at work vs home', 'Selective self-disclosure'], reflectionQ: 'Where do you feel most free to be yourself?' }
            ],
            experiment: { prompt: 'Today, express one authentic opinion you usually keep to yourself in a safe conversation.', whyItHelps: 'It strengthens the connection between your inner and outer self.' }
        },
        'foundational_archetypes': {
            name: 'Foundational Archetypes',
            definition: 'This layer reveals the deep patterns and roles you naturally embody — the archetypal energies that shape how you move through the world.',
            summary: 'You carry a blend of nurturer and seeker archetypes. There\'s a pull between caring for others and pursuing your own growth journey.',
            insights: [
                { title: 'Caretaker Pattern', status: 'Developing', text: 'You often prioritize others\' needs, sometimes at the expense of your own.', showsUpAs: ['Being the "go-to" person', 'Difficulty saying no'], reflectionQ: 'When did caring for yourself last feel as natural as caring for others?' },
                { title: 'Explorer Drive', status: 'Emerging', text: 'There\'s a restless curiosity that seeks new experiences and understanding.', showsUpAs: ['Interest in diverse topics', 'Periodic life changes'], reflectionQ: 'What territory — inner or outer — is calling you to explore?' }
            ],
            experiment: { prompt: 'Identify one way you\'ve been playing the caretaker this week, and consciously redirect that energy to yourself.', whyItHelps: 'It balances giving with receiving.' }
        },
        'motivational_drivers': {
            name: 'Motivational Drivers',
            definition: 'This layer uncovers what truly motivates you — the underlying forces that energize action and sustained effort.',
            summary: 'Your motivation seems strongest when connected to meaning and impact. Pure achievement without purpose tends to feel hollow.',
            insights: [
                { title: 'Purpose-Driven', status: 'Developing', text: 'You\'re energized by work that connects to something larger than yourself.', showsUpAs: ['Seeking "why" behind tasks', 'Passion for mission-aligned projects'], reflectionQ: 'What impact do you most want your efforts to have?' },
                { title: 'Autonomy Need', status: 'Emerging', text: 'External control or micromanagement seems to drain your motivation quickly.', showsUpAs: ['Preference for self-direction', 'Frustration with rigid structures'], reflectionQ: 'How much freedom do you currently have in your daily work?' }
            ],
            experiment: { prompt: 'Before starting your next task, write down why it matters to you personally — not just what needs to be done.', whyItHelps: 'It anchors action in meaning.' }
        },
        'processing_patterns': {
            name: 'Processing Patterns',
            definition: 'This layer examines how you take in, analyze, and make sense of information — your cognitive style and mental habits.',
            summary: 'You tend to process deeply before responding, preferring thoroughness over speed. Complex problems energize rather than overwhelm you.',
            insights: [
                { title: 'Deep Processing', status: 'Developing', text: 'You naturally look for connections and patterns others might miss.', showsUpAs: ['Asking "what if" questions', 'Connecting disparate ideas'], reflectionQ: 'When does deep thinking serve you, and when does it become overthinking?' },
                { title: 'Synthesis Mode', status: 'Emerging', text: 'You prefer integrating multiple perspectives before forming conclusions.', showsUpAs: ['Gathering diverse inputs', 'Delayed but solid decisions'], reflectionQ: 'What helps you know when you have enough information to act?' }
            ],
            experiment: { prompt: 'For your next decision, set a time limit for gathering information, then decide — even if it feels premature.', whyItHelps: 'It builds trust in good-enough decisions.' }
        },
        'creative_expression': {
            name: 'Creative Expression',
            definition: 'This layer reveals how you channel creativity — your unique ways of bringing new ideas, beauty, or innovation into the world.',
            summary: 'Your creativity seems to flow best through structured improvisation. Complete freedom can feel paralyzing, but constraints spark ingenuity.',
            insights: [
                { title: 'Constraint Creativity', status: 'Developing', text: 'Limitations often unlock rather than block your creative flow.', showsUpAs: ['Thriving with deadlines', 'Innovative problem-solving'], reflectionQ: 'What constraints actually help you create better?' },
                { title: 'Expression Channel', status: 'Emerging', text: 'You may have preferred mediums where creativity flows more naturally.', showsUpAs: ['Comfort in certain creative forms', 'Avoidance of others'], reflectionQ: 'What creative territory have you been avoiding?' }
            ],
            experiment: { prompt: 'Create something small today using only materials within arm\'s reach — no preparation allowed.', whyItHelps: 'It bypasses perfectionism and accesses raw creativity.' }
        },
        'pressure_response': {
            name: 'Pressure Response',
            definition: 'This layer looks at how you respond to stress, deadlines, and high-stakes situations — your patterns under pressure.',
            summary: 'Under pressure, you tend to either hyperfocus or retreat. The response depends heavily on whether the pressure feels meaningful or arbitrary.',
            insights: [
                { title: 'Meaningful Pressure', status: 'Developing', text: 'You rise to challenges that connect to your values and goals.', showsUpAs: ['Peak performance in crises', 'Clarity under real stakes'], reflectionQ: 'What makes pressure feel meaningful versus just stressful?' },
                { title: 'Retreat Pattern', status: 'Emerging', text: 'Arbitrary or prolonged pressure may trigger withdrawal or avoidance.', showsUpAs: ['Procrastination on low-meaning tasks', 'Energy depletion'], reflectionQ: 'How do you currently recover from pressure periods?' }
            ],
            experiment: { prompt: 'Next time you feel pressured, pause and ask: "Is this pressure aligned with what matters to me?"', whyItHelps: 'It separates productive stress from draining demands.' }
        },
        'emotional_safety': {
            name: 'Emotional Safety',
            definition: 'This layer explores what you need to feel emotionally secure — the conditions that allow vulnerability and authentic connection.',
            summary: 'You seem to need consistency and reliability to feel emotionally safe. Unpredictability in relationships creates significant tension.',
            insights: [
                { title: 'Predictability Need', status: 'Developing', text: 'You feel safer when you can anticipate how others will respond.', showsUpAs: ['Preference for reliable people', 'Discomfort with emotional volatility'], reflectionQ: 'What does emotional predictability look like in your ideal relationships?' },
                { title: 'Trust Building', status: 'Emerging', text: 'Trust seems to be earned gradually through consistent small actions.', showsUpAs: ['Slow-to-trust patterns', 'Deep loyalty once established'], reflectionQ: 'What\'s one thing someone did that significantly increased your trust in them?' }
            ],
            experiment: { prompt: 'Share one small vulnerability with someone who has been consistent with you lately.', whyItHelps: 'It deepens connection while staying within safe boundaries.' }
        },
        'leadership': {
            name: 'Leadership',
            definition: 'This layer reveals your natural leadership style — how you influence, guide, and inspire others toward shared goals.',
            summary: 'Your leadership tends to be empowering rather than directive. You lead by developing others rather than commanding them.',
            insights: [
                { title: 'Developer Style', status: 'Developing', text: 'You naturally invest in growing the capabilities of those around you.', showsUpAs: ['Mentoring tendencies', 'Patience with learning curves'], reflectionQ: 'Who have you helped grow, and what did that mean to you?' },
                { title: 'Reluctant Authority', status: 'Emerging', text: 'You may resist formal authority even when well-suited for leadership roles.', showsUpAs: ['Deflecting recognition', 'Leading from behind'], reflectionQ: 'What would change if you fully claimed your leadership capacity?' }
            ],
            experiment: { prompt: 'Take the lead on one small decision today without seeking consensus first.', whyItHelps: 'It builds comfort with directive leadership when appropriate.' }
        },
        'communication': {
            name: 'Communication',
            definition: 'This layer examines how you share ideas and connect with others — your natural communication patterns and preferences.',
            summary: 'You communicate with precision and depth, preferring substance over small talk. Written expression may feel more natural than verbal.',
            insights: [
                { title: 'Depth Over Breadth', status: 'Developing', text: 'You prefer meaningful exchanges to surface-level chatter.', showsUpAs: ['Quick exit from small talk', 'Deep dives in conversation'], reflectionQ: 'How do you create space for the deeper conversations you crave?' },
                { title: 'Processing Mode', status: 'Emerging', text: 'You may process thoughts better in writing than real-time speech.', showsUpAs: ['Preference for written communication', 'Needing time to formulate responses'], reflectionQ: 'When does verbal communication flow easily for you?' }
            ],
            experiment: { prompt: 'In your next conversation, share a thought before you\'ve fully polished it.', whyItHelps: 'It builds comfort with imperfect but authentic expression.' }
        },
        'values_relationships': {
            name: 'Values & Relationships',
            definition: 'This layer explores what you value most in relationships — the principles that guide how you connect and commit to others.',
            summary: 'You seem to value authenticity and mutual growth in relationships. Superficial connections drain you; depth sustains you.',
            insights: [
                { title: 'Authenticity Filter', status: 'Developing', text: 'You\'re drawn to people who show their true selves openly.', showsUpAs: ['Quick detection of inauthenticity', 'Comfort with quirky people'], reflectionQ: 'What does authentic connection feel like in your body?' },
                { title: 'Growth Partnership', status: 'Emerging', text: 'You value relationships that challenge and develop you.', showsUpAs: ['Seeking partners who push you', 'Discomfort with stagnant relationships'], reflectionQ: 'How do you balance comfort and growth in your closest relationships?' }
            ],
            experiment: { prompt: 'Ask someone close to you: "What\'s one way I\'ve helped you grow?"', whyItHelps: 'It reveals the impact you have that you might not see.' }
        },
        'trust_commitment': {
            name: 'Trust & Commitment',
            definition: 'This layer reveals how you approach trust and long-term commitment — your patterns in building and maintaining lasting bonds.',
            summary: 'You take commitment seriously, perhaps even cautiously. Once committed, you tend to be remarkably loyal and invested.',
            insights: [
                { title: 'Careful Commitment', status: 'Developing', text: 'You evaluate thoroughly before making binding promises.', showsUpAs: ['Hesitation before major commitments', 'Reliability once committed'], reflectionQ: 'What needs to be true for you to fully commit to something?' },
                { title: 'Loyalty Depth', status: 'Emerging', text: 'Your loyalty runs deep, sometimes even when relationships have run their course.', showsUpAs: ['Staying too long', 'Difficulty letting go'], reflectionQ: 'How do you know when loyalty is serving you versus holding you back?' }
            ],
            experiment: { prompt: 'Identify one commitment you\'re holding onto out of obligation rather than genuine desire.', whyItHelps: 'It distinguishes true commitment from outdated loyalty.' }
        },
        'group_presence': {
            name: 'Group Presence',
            definition: 'This layer examines how you show up in groups — your natural role in teams and collective environments.',
            summary: 'In groups, you tend to observe before engaging. You contribute significantly but often in ways that don\'t seek the spotlight.',
            insights: [
                { title: 'Observer Entry', status: 'Developing', text: 'You naturally read group dynamics before inserting yourself.', showsUpAs: ['Quiet initial presence', 'Strategic contributions'], reflectionQ: 'What do you notice about groups that others typically miss?' },
                { title: 'Behind-Scenes Impact', status: 'Emerging', text: 'Much of your group contribution happens through 1:1 connections or background work.', showsUpAs: ['Private follow-ups', 'Unrecognized contributions'], reflectionQ: 'How do you feel about the visibility of your group contributions?' }
            ],
            experiment: { prompt: 'In your next group setting, share one thought in the first five minutes — before you\'re fully ready.', whyItHelps: 'It builds comfort with less-processed public contribution.' }
        },
        'integration': {
            name: 'Integration',
            definition: 'This layer looks at how you bring together different parts of yourself — the work of becoming whole and coherent.',
            summary: 'You\'re in an active process of integrating past experiences and present insights. Some parts are well-integrated; others are still finding their place.',
            insights: [
                { title: 'Shadow Work', status: 'Developing', text: 'You\'re becoming aware of parts of yourself you previously rejected or ignored.', showsUpAs: ['Recognizing old patterns', 'Compassion for past self'], reflectionQ: 'What part of yourself are you currently learning to accept?' },
                { title: 'Coherence Building', status: 'Emerging', text: 'You\'re working to align your actions with your evolving values.', showsUpAs: ['Lifestyle changes', 'Difficult but necessary conversations'], reflectionQ: 'Where is the biggest gap between who you are and how you live?' }
            ],
            experiment: { prompt: 'Write a short letter to a past version of yourself, acknowledging what they were going through.', whyItHelps: 'It heals by connecting present wisdom with past pain.' }
        },
        'adaptability': {
            name: 'Adaptability',
            definition: 'This layer reveals how you respond to change — your flexibility and resilience when circumstances shift unexpectedly.',
            summary: 'You adapt well to change when you can find meaning in it. Random or purposeless change tends to feel disorienting rather than exciting.',
            insights: [
                { title: 'Meaningful Change', status: 'Developing', text: 'You embrace change that aligns with growth or purpose.', showsUpAs: ['Initiating purposeful changes', 'Resistance to arbitrary disruption'], reflectionQ: 'What makes change feel like opportunity versus threat?' },
                { title: 'Reorientation Need', status: 'Emerging', text: 'After major changes, you need time to re-establish your bearings.', showsUpAs: ['Post-change processing periods', 'Need for new routines'], reflectionQ: 'What helps you find your footing after significant life changes?' }
            ],
            experiment: { prompt: 'Deliberately change one small routine today — and notice how it feels.', whyItHelps: 'It builds comfort with minor disruptions.' }
        },
        'change_navigation': {
            name: 'Change Navigation',
            definition: 'This layer looks at how you navigate major life transitions — your approach to transformation and becoming.',
            summary: 'You\'re experiencing or approaching a significant transformation. The old is giving way, but the new hasn\'t fully formed yet.',
            insights: [
                { title: 'Threshold Moment', status: 'Developing', text: 'You may be standing at the edge of a major life transition.', showsUpAs: ['Restlessness with status quo', 'Glimpses of a different future'], reflectionQ: 'What would you need to let go of to fully step into what\'s next?' },
                { title: 'Emergence Pattern', status: 'Emerging', text: 'Your next chapter seems to be revealing itself in fragments rather than all at once.', showsUpAs: ['Unclear but compelling hints', 'Patience being tested'], reflectionQ: 'What\'s one thing you already know about where you\'re heading?' }
            ],
            experiment: { prompt: 'Spend 10 minutes imagining your life one year from now, assuming the best possible outcome.', whyItHelps: 'It clarifies what you\'re actually moving toward.' }
        },
        // Actual layer IDs used in TwinHome navigation
        'decision_patterns': {
            name: 'Decision Patterns',
            definition: 'This layer looks at how you tend to approach choices — especially under uncertainty or pressure.',
            summary: 'So far, OSIA is seeing a pattern where decisions feel easier when the stakes are clear and personal, and slower when choices affect others or carry emotional weight.',
            insights: [
                { title: 'Decision Rhythm', status: 'Developing', text: 'You may move quickly when internal alignment is strong, and slow down when relational impact is high.', showsUpAs: ['Clear decisions in solo contexts', 'Pausing when outcomes affect others'], reflectionQ: 'What helps you regain momentum without overriding care for others?' },
                { title: 'Second-Guessing Loop', status: 'Emerging', text: 'You might revisit decisions after new information appears, even if the core choice hasn\'t changed.', showsUpAs: ['Re-checking past choices', 'Seeking reassurance after deciding'], reflectionQ: 'What information actually changes the decision — and what just adds noise?' }
            ],
            experiment: { prompt: 'Before your next decision that affects others, write down one sentence that names what matters most to you in that choice — before asking for input.', whyItHelps: 'It separates your internal clarity from external feedback.' }
        },
        'energy_recovery': {
            name: 'Energy & Recovery',
            definition: 'This layer tracks how you generate, spend, and restore your vital energy throughout the day and across longer cycles.',
            summary: 'You appear to have distinct energy rhythms — periods of high output followed by a need for deep restoration. The balance between these phases seems important.',
            insights: [
                { title: 'Energy Cadence', status: 'Stable', text: 'Your energy naturally flows in waves rather than steady streams.', showsUpAs: ['Bursts of productivity', 'Recovery periods that aren\'t optional'], reflectionQ: 'How do you currently honor your low-energy phases?' },
                { title: 'Restoration Mode', status: 'Developing', text: 'Certain activities restore you more than others — and some "rest" doesn\'t actually recharge.', showsUpAs: ['Specific recovery rituals', 'Drained after certain activities'], reflectionQ: 'What truly recharges you versus what just passes time?' }
            ],
            experiment: { prompt: 'Track your energy levels (high/medium/low) at three points today and notice what preceded each state.', whyItHelps: 'It reveals patterns you can work with rather than against.' }
        },
        'relational_dynamics': {
            name: 'Relational Dynamics',
            definition: 'This layer explores how you navigate close relationships — the patterns in how you connect, attach, and create intimacy.',
            summary: 'Your relational style seems to balance closeness with independence. You value deep connection but also need space to maintain your sense of self.',
            insights: [
                { title: 'Attachment Pattern', status: 'Emerging', text: 'You may lean toward connection but pull back when vulnerability feels too exposed.', showsUpAs: ['Desire for intimacy with periodic distance', 'Testing before trusting fully'], reflectionQ: 'What makes closeness feel safe versus threatening?' },
                { title: 'Boundary Awareness', status: 'Developing', text: 'You\'re learning where your edges are in relationships — what you need to protect.', showsUpAs: ['Clearer "no\'s" over time', 'Discomfort when boundaries are crossed'], reflectionQ: 'What boundary are you still learning to hold?' }
            ],
            experiment: { prompt: 'In your next interaction with someone close, notice the moment you feel like pulling back — and pause before acting.', whyItHelps: 'It creates choice where there was only reaction.' }
        },
        'communication_style': {
            name: 'Communication Style',
            definition: 'This layer examines how you express ideas, share emotions, and create understanding with others.',
            summary: 'You communicate with precision and care, often thinking before speaking. Written expression may come more naturally than spontaneous verbal exchange.',
            insights: [
                { title: 'Processing Mode', status: 'Developing', text: 'You prefer to formulate thoughts fully before sharing them.', showsUpAs: ['Preference for written over verbal', 'Needing time to respond thoughtfully'], reflectionQ: 'When does speaking before you\'re ready actually serve you?' },
                { title: 'Depth Preference', status: 'Stable', text: 'Surface-level conversation tends to drain you; meaningful exchange energizes.', showsUpAs: ['Quick exit from small talk', 'Deep dives in the right context'], reflectionQ: 'How do you transition conversations from surface to depth?' }
            ],
            experiment: { prompt: 'In your next conversation, share a thought before it\'s fully polished and notice what happens.', whyItHelps: 'It builds comfort with imperfect but authentic expression.' }
        },
        'growth_edge': {
            name: 'Growth Edge',
            definition: 'This layer points to where you\'re currently being stretched — the frontier of your personal development.',
            summary: 'You\'re in an active phase of evolution. Something is shifting, even if it\'s not yet fully clear what\'s emerging or what needs to be released.',
            insights: [
                { title: 'Threshold Moment', status: 'Emerging', text: 'You may be standing at the edge of a significant personal transition.', showsUpAs: ['Restlessness with status quo', 'Glimpses of a different future'], reflectionQ: 'What would you need to let go of to step fully into what\'s next?' },
                { title: 'Integration Work', status: 'Later', text: 'Parts of your past may be asking to be understood in a new light.', showsUpAs: ['Old patterns resurfacing', 'Questions about past choices'], reflectionQ: 'What past experience is asking to be seen differently now?' }
            ],
            experiment: { prompt: 'Spend 10 minutes imagining your life one year from now, assuming the best possible outcome.', whyItHelps: 'It clarifies what you\'re actually growing toward.' }
        }
    };

    // Get layer-specific content or use fallback
    const layerKey = layerId?.toLowerCase().replace(/\s+/g, '_') || 'decision_patterns';
    const content = LAYER_CONTENT[layerKey] || LAYER_CONTENT['decision_patterns'];

    // Attempt to find real user insight from traits
    const systemLayerId = LAYER_ID_MAPPING[layerKey] || 0;
    const userTrait = userProfile?.origin_seed_profile?.traits?.find((t: any) => t.layerId === systemLayerId);

    // Use dynamic description if available, otherwise fall back to static summary
    const dynamicSummary = userTrait?.description || content.summary;
    const dynamicConfidence = userTrait ? Math.round(userTrait.confidence * 100) : null;

    const handleFeedback = async (insightTitle: string, feedback: string) => {
        if (!auth.token) return;
        try {
            await api.submitLayerFeedback({
                insightId: insightTitle,
                feedback,
                layerId: layerId!
            });
            showToast(`Feedback captured: ${feedback}`, 'success');
        } catch (e) {
            console.error(e);
            showToast('Failed to save feedback', 'error');
        }
    };

    const handleRitual = async (prompt: string, status: 'active' | 'skipped') => {
        if (!auth.token) return;

        if (status === 'active' && 'Notification' in window) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                new Notification('OSIA Ritual Activated', {
                    body: `Reminder set: ${prompt}`,
                    icon: '/favicon.png'
                });
            }
        }

        try {
            await api.submitCustomProtocol({
                prompt,
                layerId: layerId!,
                status
            });
            showToast(status === 'active' ? 'Ritual activated + Notification set.' : 'Ritual skipped.', 'success');
        } catch (e) {
            console.error(e);
            showToast('Failed to update ritual status', 'error');
        }
    };

    const layerData = {
        id: layerId,
        name: content.name,
        definition: content.definition,
        status: dynamicConfidence ? (dynamicConfidence > 80 ? 'Stable' : 'Developing') : 'Developing',
        summary: dynamicSummary,
        insights: content.insights,
        experiment: content.experiment
    };


    return (
        <div className="min-h-screen bg-osia-deep-900 text-white relative overflow-hidden" >
            <PlexusBackground />

            <main className="relative z-10 pt-8 container mx-auto px-6 pb-20 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-16"
                >
                    {/* Hero */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-4">
                            <h1 className="text-4xl font-bold tracking-tight">{layerData.name}</h1>
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-white/10 text-white">
                                {layerData.status}
                            </span>
                        </div>
                        <p className="text-lg text-osia-neutral-400 leading-relaxed">
                            {layerData.definition}
                        </p>
                    </section>

                    {/* Summary */}
                    <section className="space-y-6">
                        <h3 className="text-[10px] font-bold text-osia-teal-500 uppercase tracking-widest">What's showing up</h3>
                        <p className="text-xl text-white leading-relaxed font-medium">
                            {layerData.summary}
                        </p>
                        <button onClick={() => showToast('Showing 12 signal tokens that contributed to this summary.', 'info')} className="flex items-center gap-2 text-[9px] font-bold text-osia-neutral-600 hover:text-osia-neutral-400 uppercase tracking-widest transition-colors">
                            <HelpCircle size={14} />
                            Show contributing signals
                        </button>
                    </section>

                    {/* Insights */}
                    <section className="grid md:grid-cols-2 gap-6">
                        {layerData.insights.map((insight, i) => (
                            <Card key={i} className="p-8 border-white/5 bg-[#0a1128]/40 space-y-6">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-white text-lg">{insight.title}</h4>
                                    <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/5 text-osia-neutral-500">
                                        {insight.status}
                                    </span>
                                </div>
                                <p className="text-sm text-osia-neutral-400 leading-relaxed italic">
                                    {insight.text}
                                </p>
                                <div className="space-y-3">
                                    <div className="text-[9px] font-bold text-osia-neutral-600 uppercase tracking-widest">Often shows up as:</div>
                                    <ul className="space-y-2">
                                        {insight.showsUpAs.map((item, j) => (
                                            <li key={j} className="text-xs text-osia-neutral-500 flex gap-2">
                                                <span className="text-osia-teal-500">•</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="pt-4 border-t border-white/5">
                                    <div className="text-[9px] font-bold text-osia-teal-500 uppercase tracking-widest mb-2">Reflection prompt:</div>
                                    <p className="text-xs text-white font-medium leading-relaxed">{insight.reflectionQ}</p>
                                </div>
                                <div className="flex gap-2 pt-4">
                                    {['Fits', 'Somewhat', 'No'].map(label => (
                                        <button key={label} onClick={() => handleFeedback(insight.title, label)} className="flex-1 py-2 rounded-lg border border-white/5 bg-white/[0.02] text-[10px] font-bold uppercase tracking-widest text-osia-neutral-500 hover:border-osia-teal-500/30 hover:text-white transition-all">
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </Card>
                        ))}
                    </section>

                    {/* Experiment */}
                    <section>
                        <Card className="p-10 border-white/5 bg-osia-teal-500/[0.03]">
                            <div className="max-w-2xl space-y-6">
                                <div className="text-[10px] font-bold text-osia-teal-500 uppercase tracking-[0.3em]">Something to try</div>
                                <h3 className="text-2xl font-bold tracking-tight">{layerData.experiment.prompt}</h3>
                                <p className="text-sm text-osia-neutral-400">
                                    <span className="font-bold text-osia-teal-500 uppercase tracking-tighter mr-2">Why this helps:</span>
                                    {layerData.experiment.whyItHelps}
                                </p>
                                <div className="flex gap-4 pt-4">
                                    <Button onClick={() => handleRitual(layerData.experiment.prompt, 'active')} variant="primary" className="px-8">I'll try this</Button>
                                    <Button onClick={() => handleRitual(layerData.experiment.prompt, 'skipped')} variant="secondary" className="px-8">Not now</Button>
                                </div>
                            </div>
                        </Card>
                    </section>
                    <ToastComponent />

                    <footer className="pt-10 border-t border-white/5 flex items-center justify-between">
                        <button className="text-[10px] font-bold uppercase tracking-widest text-osia-neutral-500 hover:text-white transition-colors">
                            Review another layer
                        </button>
                        <p className="text-[9px] text-osia-neutral-700 italic">
                            As you interact with this layer, its confidence may increase, decrease, or split.
                        </p>
                    </footer>
                </motion.div>
            </main>
        </div >
    );
}

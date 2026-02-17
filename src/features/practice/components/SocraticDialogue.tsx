import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../../../components/ui/Card';
import { ArrowRight, ArrowLeft, Sparkles, Check, Loader2, Search } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   SocraticDialogue — Values Discovery via Selectable Chips
   ═══════════════════════════════════════════════════════════ */

interface ValueEntry { name: string; category: string; }

const VALUE_CATEGORIES = [
    { id: 'character', label: 'Character & Integrity', icon: '🛡️', description: 'Who you are at your core' },
    { id: 'growth', label: 'Growth & Learning', icon: '🌱', description: 'How you evolve and improve' },
    { id: 'relationships', label: 'Relationships & Community', icon: '❤️', description: 'How you connect with others' },
    { id: 'purpose', label: 'Purpose & Impact', icon: '🎯', description: 'The difference you want to make' },
    { id: 'wellbeing', label: 'Well-being & Inner Life', icon: '✨', description: 'What nourishes your soul' },
    { id: 'freedom', label: 'Freedom & Expression', icon: '🦅', description: 'How you express your individuality' },
    { id: 'achievement', label: 'Achievement & Success', icon: '🏆', description: 'What drives your ambition' },
];

const ALL_VALUES: ValueEntry[] = [
    { name: 'Accountability', category: 'character' }, { name: 'Authenticity', category: 'character' },
    { name: 'Commitment', category: 'character' }, { name: 'Courage', category: 'character' },
    { name: 'Dedication', category: 'character' }, { name: 'Diligence', category: 'character' },
    { name: 'Dignity', category: 'character' }, { name: 'Ethics', category: 'character' },
    { name: 'Fairness', category: 'character' }, { name: 'Honesty', category: 'character' },
    { name: 'Humility', category: 'character' }, { name: 'Integrity', category: 'character' },
    { name: 'Loyalty', category: 'character' }, { name: 'Patience', category: 'character' },
    { name: 'Reliability', category: 'character' }, { name: 'Respect', category: 'character' },
    { name: 'Responsibility', category: 'character' }, { name: 'Self-discipline', category: 'character' },
    { name: 'Transparency', category: 'character' }, { name: 'Trust', category: 'character' },
    { name: 'Truth', category: 'character' },
    { name: 'Adaptability', category: 'growth' }, { name: 'Ambition', category: 'growth' },
    { name: 'Challenge', category: 'growth' }, { name: 'Competence', category: 'growth' },
    { name: 'Creativity', category: 'growth' }, { name: 'Curiosity', category: 'growth' },
    { name: 'Drive', category: 'growth' }, { name: 'Excellence', category: 'growth' },
    { name: 'Growth', category: 'growth' }, { name: 'Initiative', category: 'growth' },
    { name: 'Innovation', category: 'growth' }, { name: 'Intelligence', category: 'growth' },
    { name: 'Knowledge', category: 'growth' }, { name: 'Learning', category: 'growth' },
    { name: 'Mastery', category: 'growth' }, { name: 'Perseverance', category: 'growth' },
    { name: 'Resourcefulness', category: 'growth' }, { name: 'Risk-taking', category: 'growth' },
    { name: 'Wisdom', category: 'growth' },
    { name: 'Belonging', category: 'relationships' }, { name: 'Caring', category: 'relationships' },
    { name: 'Collaboration', category: 'relationships' }, { name: 'Community', category: 'relationships' },
    { name: 'Compassion', category: 'relationships' }, { name: 'Connection', category: 'relationships' },
    { name: 'Cooperation', category: 'relationships' }, { name: 'Family', category: 'relationships' },
    { name: 'Forgiveness', category: 'relationships' }, { name: 'Friendship', category: 'relationships' },
    { name: 'Generosity', category: 'relationships' }, { name: 'Giving back', category: 'relationships' },
    { name: 'Gratitude', category: 'relationships' }, { name: 'Kindness', category: 'relationships' },
    { name: 'Love', category: 'relationships' }, { name: 'Teamwork', category: 'relationships' },
    { name: 'Understanding', category: 'relationships' }, { name: 'Unity', category: 'relationships' },
    { name: 'Wholeheartedness', category: 'relationships' },
    { name: 'Advocacy', category: 'purpose' }, { name: 'Altruism', category: 'purpose' },
    { name: 'Contribution', category: 'purpose' }, { name: 'Future generations', category: 'purpose' },
    { name: 'Impact', category: 'purpose' }, { name: 'Justice', category: 'purpose' },
    { name: 'Leadership', category: 'purpose' }, { name: 'Legacy', category: 'purpose' },
    { name: 'Making a difference', category: 'purpose' }, { name: 'Service', category: 'purpose' },
    { name: 'Stewardship', category: 'purpose' }, { name: 'Vision', category: 'purpose' },
    { name: 'Abundance', category: 'wellbeing' }, { name: 'Balance', category: 'wellbeing' },
    { name: 'Beauty', category: 'wellbeing' }, { name: 'Comfort', category: 'wellbeing' },
    { name: 'Contentment', category: 'wellbeing' }, { name: 'Faith', category: 'wellbeing' },
    { name: 'Fun', category: 'wellbeing' }, { name: 'Harmony', category: 'wellbeing' },
    { name: 'Health', category: 'wellbeing' }, { name: 'Home', category: 'wellbeing' },
    { name: 'Hope', category: 'wellbeing' }, { name: 'Humor', category: 'wellbeing' },
    { name: 'Joy', category: 'wellbeing' }, { name: 'Leisure', category: 'wellbeing' },
    { name: 'Nature', category: 'wellbeing' }, { name: 'Openness', category: 'wellbeing' },
    { name: 'Optimism', category: 'wellbeing' }, { name: 'Peace', category: 'wellbeing' },
    { name: 'Playfulness', category: 'wellbeing' }, { name: 'Serenity', category: 'wellbeing' },
    { name: 'Spirituality', category: 'wellbeing' }, { name: 'Well-being', category: 'wellbeing' },
    { name: 'Adventure', category: 'freedom' }, { name: 'Freedom', category: 'freedom' },
    { name: 'Independence', category: 'freedom' }, { name: 'Individuality', category: 'freedom' },
    { name: 'Originality', category: 'freedom' }, { name: 'Self-expression', category: 'freedom' },
    { name: 'Self-reliance', category: 'freedom' }, { name: 'Travel', category: 'freedom' },
    { name: 'Uniqueness', category: 'freedom' }, { name: 'Vulnerability', category: 'freedom' },
    { name: 'Achievement', category: 'achievement' }, { name: 'Being the best', category: 'achievement' },
    { name: 'Career', category: 'achievement' }, { name: 'Competition', category: 'achievement' },
    { name: 'Confidence', category: 'achievement' }, { name: 'Efficiency', category: 'achievement' },
    { name: 'Financial stability', category: 'achievement' }, { name: 'Order', category: 'achievement' },
    { name: 'Power', category: 'achievement' }, { name: 'Pride', category: 'achievement' },
    { name: 'Recognition', category: 'achievement' }, { name: 'Security', category: 'achievement' },
    { name: 'Structure', category: 'achievement' }, { name: 'Success', category: 'achievement' },
    { name: 'Wealth', category: 'achievement' },
];

// ─── Suggestions: value-specific + category fallback ──

const SPECIFIC_ACTIONS: Record<string, string[]> = {
    'Accountability': ['Review one commitment and follow through', 'Ask someone for honest feedback'],
    'Authenticity': ['Share one honest opinion today', 'Say no to something that doesn\'t feel right'],
    'Commitment': ['Finish one thing you started', 'Renew a promise to someone'],
    'Courage': ['Do one thing that scares you a little', 'Stand up for what you believe'],
    'Dedication': ['Spend 30 extra minutes on something you care about', 'Show up fully to one task'],
    'Diligence': ['Double-check your work on one task', 'Complete a task ahead of schedule'],
    'Dignity': ['Treat someone with extra respect today', 'Set a boundary with kindness'],
    'Ethics': ['Make a decision based on principle, not convenience', 'Question one assumption today'],
    'Fairness': ['Listen to both sides before forming an opinion', 'Share credit with someone'],
    'Honesty': ['Tell a difficult truth gently', 'Be transparent about a mistake'],
    'Humility': ['Ask for help on something', 'Acknowledge someone else\'s expertise'],
    'Integrity': ['Keep a promise you made', 'Do the right thing when no one is watching'],
    'Loyalty': ['Check in on a friend', 'Stand by someone going through a hard time'],
    'Patience': ['Practice 3 deep breaths before reacting', 'Wait 5 seconds before responding'],
    'Reliability': ['Show up on time for every commitment', 'Follow through on one small promise'],
    'Respect': ['Listen fully without interrupting', 'Acknowledge someone\'s feelings'],
    'Responsibility': ['Own one mistake without excuses', 'Take charge of one task proactively'],
    'Self-discipline': ['Finish one task before checking your phone', 'Stick to a planned routine'],
    'Transparency': ['Share your reasoning behind a decision', 'Be open about what you don\'t know'],
    'Trust': ['Delegate something you usually control', 'Give someone the benefit of the doubt'],
    'Truth': ['Speak honestly in one difficult conversation', 'Fact-check one belief you hold'],
    'Adaptability': ['Try a different approach to a familiar task', 'Embrace one change today'],
    'Ambition': ['Set one stretch goal for the week', 'Take one step toward a big dream'],
    'Challenge': ['Tackle the hardest task on your list first', 'Attempt something slightly beyond your comfort'],
    'Competence': ['Practice a skill for 15 minutes', 'Seek feedback on your work'],
    'Creativity': ['Spend 10 minutes sketching, writing, or brainstorming freely', 'Approach a problem from a new angle'],
    'Curiosity': ['Ask a thoughtful question about something you don\'t understand', 'Explore a new topic for 10 minutes'],
    'Drive': ['Identify your #1 priority and act on it', 'Push through one moment of resistance'],
    'Excellence': ['Refine one piece of work until you\'re proud', 'Raise your standard on one task'],
    'Growth': ['Try something new today', 'Reflect on one lesson from a recent mistake'],
    'Initiative': ['Start something without being asked', 'Propose one new idea'],
    'Innovation': ['Brainstorm 3 creative solutions to a problem', 'Try an unconventional approach'],
    'Intelligence': ['Read an article on a new subject', 'Solve a puzzle or logic challenge'],
    'Knowledge': ['Learn one new fact and share it', 'Read for 15 minutes on a new topic'],
    'Learning': ['Watch a tutorial or lecture', 'Take notes on something you\'re studying'],
    'Mastery': ['Practice a skill deliberately for 20 minutes', 'Teach someone something you know well'],
    'Perseverance': ['Continue a task you wanted to quit', 'Retry something that failed yesterday'],
    'Resourcefulness': ['Solve a problem with what you have', 'Find a creative workaround'],
    'Risk-taking': ['Pitch an unconventional idea', 'Try something with uncertain outcome'],
    'Wisdom': ['Read for 15 minutes on a deep topic', 'Ask a thoughtful question instead of giving advice'],
    'Belonging': ['Join a group activity', 'Reach out to someone you haven\'t spoken to recently'],
    'Caring': ['Ask someone how they\'re really doing', 'Do something thoughtful for a loved one'],
    'Collaboration': ['Work with someone on a shared task', 'Ask for input before making a decision'],
    'Community': ['Attend a local event or gathering', 'Help a neighbor with something small'],
    'Compassion': ['Listen deeply to someone who is struggling', 'Offer help without being asked'],
    'Connection': ['Have a meaningful conversation with someone', 'Put your phone away during a meal with others'],
    'Cooperation': ['Compromise on something for the team', 'Offer to help a colleague'],
    'Family': ['Call or message a family member', 'Share a meal together without screens'],
    'Forgiveness': ['Let go of one grudge or resentment', 'Offer grace to someone who made a mistake'],
    'Friendship': ['Reach out to a friend just to say hello', 'Plan quality time with a close friend'],
    'Generosity': ['Give something — time, money, or attention — freely', 'Share a resource with someone'],
    'Giving back': ['Volunteer 30 minutes of your time', 'Help someone without expecting anything in return'],
    'Gratitude': ['Write down 3 things you\'re grateful for', 'Thank someone sincerely today'],
    'Kindness': ['Do one unexpected kind act for someone', 'Speak gently in a tense moment'],
    'Love': ['Tell someone you care about them', 'Give your full presence to someone for 10 minutes'],
    'Teamwork': ['Collaborate on a task with a colleague', 'Celebrate a team member\'s contribution'],
    'Understanding': ['Seek to understand before responding', 'Ask an open-ended question'],
    'Unity': ['Find common ground with someone you disagree with', 'Include someone who is on the outside'],
    'Wholeheartedness': ['Commit fully to one activity today', 'Show up with full energy and presence'],
    'Advocacy': ['Speak up for someone who can\'t', 'Share information about a cause you believe in'],
    'Altruism': ['Do something generous with no expectation of return', 'Prioritize someone else\'s need'],
    'Contribution': ['Add value to a project or conversation', 'Share your skills to help others'],
    'Future generations': ['Make one choice with long-term impact in mind', 'Teach something to a younger person'],
    'Impact': ['Focus energy on your highest-impact activity', 'Measure the effect of one decision'],
    'Justice': ['Stand up for what\'s fair', 'Listen to a perspective you\'ve been ignoring'],
    'Leadership': ['Offer to help someone with their challenge', 'Set a positive example in one interaction'],
    'Legacy': ['Work on something that will outlast today', 'Write down what you want to be remembered for'],
    'Making a difference': ['Do one thing that improves someone\'s day', 'Take action on an issue you care about'],
    'Service': ['Volunteer your time or skills', 'Ask someone what they need and provide it'],
    'Stewardship': ['Take care of something entrusted to you', 'Use resources wisely and mindfully'],
    'Vision': ['Spend 10 minutes envisioning your ideal future', 'Share your vision with someone'],
    'Abundance': ['Focus on what you have, not what you lack', 'Share generously from your surplus'],
    'Balance': ['Set one boundary to protect your energy', 'Schedule both work and rest today'],
    'Beauty': ['Notice and appreciate beauty around you', 'Create something aesthetically pleasing'],
    'Comfort': ['Create a cozy moment for yourself', 'Make someone else comfortable'],
    'Contentment': ['Enjoy what you have right now', 'Express satisfaction with one aspect of life'],
    'Faith': ['Spend 5 minutes in quiet reflection or prayer', 'Trust the process in one area of uncertainty'],
    'Fun': ['Do something purely for fun today', 'Laugh with someone'],
    'Harmony': ['Resolve one source of tension', 'Create peace in your environment'],
    'Health': ['Take a 15-minute walk', 'Prepare one healthy meal from scratch'],
    'Home': ['Tidy one area of your living space', 'Create a moment of warmth at home'],
    'Hope': ['Identify one thing to look forward to', 'Encourage someone who is discouraged'],
    'Humor': ['Share a joke or funny story', 'Find the humor in a stressful situation'],
    'Joy': ['Do something that brings you genuine happiness', 'Notice and savor a joyful moment'],
    'Leisure': ['Take a proper break without guilt', 'Enjoy a hobby for 30 minutes'],
    'Nature': ['Spend 15 minutes outdoors', 'Observe something in nature closely'],
    'Openness': ['Listen to a perspective you usually dismiss', 'Try something outside your comfort zone'],
    'Optimism': ['Identify the positive in one challenging situation', 'Express confidence about the future'],
    'Peace': ['Spend 5 minutes in silent stillness', 'Choose peace over being right in one situation'],
    'Playfulness': ['Approach a task with a playful attitude', 'Do something spontaneous and fun'],
    'Serenity': ['Practice a calming ritual', 'Let go of one worry you can\'t control'],
    'Spirituality': ['Meditate or pray for 10 minutes', 'Reflect on your purpose and meaning'],
    'Well-being': ['Do one thing that nourishes body, mind, or soul', 'Check in with yourself emotionally'],
    'Adventure': ['Explore somewhere new, even nearby', 'Say yes to an unexpected opportunity'],
    'Freedom': ['Make a choice purely for yourself', 'Let go of an obligation that doesn\'t serve you'],
    'Independence': ['Make one decision without seeking approval', 'Solve a problem on your own'],
    'Individuality': ['Express something unique about yourself', 'Celebrate a way you\'re different'],
    'Originality': ['Create something that\'s uniquely yours', 'Share an original idea'],
    'Self-expression': ['Express yourself through art, writing, or conversation', 'Share your true feelings'],
    'Self-reliance': ['Handle one challenge independently', 'Build a skill that increases self-sufficiency'],
    'Travel': ['Plan one future trip or explore locally', 'Learn about a new culture or place'],
    'Uniqueness': ['Celebrate what makes you different', 'Share your unique perspective on something'],
    'Vulnerability': ['Share something personal with someone you trust', 'Ask for help when you need it'],
    'Achievement': ['Complete one meaningful task', 'Celebrate a recent accomplishment'],
    'Being the best': ['Give 100% effort to one task', 'Study someone who excels and learn from them'],
    'Career': ['Take one step toward a career goal', 'Network or connect with a professional contact'],
    'Competition': ['Set a personal best in one area', 'Challenge yourself to improve on yesterday'],
    'Confidence': ['Take decisive action without second-guessing', 'Affirm your strengths'],
    'Efficiency': ['Streamline one process or routine', 'Eliminate one time-waster'],
    'Financial stability': ['Review your budget briefly', 'Save or invest one small amount'],
    'Order': ['Organize one space or system', 'Plan tomorrow in advance'],
    'Power': ['Take ownership of a decision', 'Exercise your influence positively'],
    'Pride': ['Do something you can be proud of', 'Reflect on a recent accomplishment'],
    'Recognition': ['Acknowledge someone else\'s work', 'Share your own achievements appropriately'],
    'Security': ['Take one step to protect your future', 'Build an emergency fund or safety net'],
    'Structure': ['Create a routine for one part of your day', 'Use a checklist for an important task'],
    'Success': ['Define what success means for today', 'Complete your most important task'],
    'Wealth': ['Learn one thing about investing or saving', 'Create value for someone else'],
};

const SPECIFIC_NUDGES: Record<string, string[]> = {
    'Accountability': ['Weekly self-review session', 'Track one commitment per day', 'Daily check-in with an accountability partner'],
    'Authenticity': ['Daily honest journal entry', 'Weekly authenticity check-in', 'Practice saying no to one thing daily'],
    'Commitment': ['Review commitments each morning', 'Daily follow-through check', 'Weekly promise-keeping audit'],
    'Courage': ['One uncomfortable conversation per week', 'Speak up once in every group meeting', 'Daily courage journal'],
    'Dedication': ['30 minutes of focused deep work daily', 'Weekly dedication review', 'Daily commitment renewal'],
    'Diligence': ['Daily quality check on key task', 'Weekly thorough review session', 'Morning intention-setting ritual'],
    'Dignity': ['Daily respectful communication practice', 'Weekly boundary-setting reflection', 'Mindful interaction check-in'],
    'Ethics': ['Daily ethical decision reflection', 'Weekly values alignment check', 'Monthly ethics self-audit'],
    'Fairness': ['Listen before judging — daily practice', 'Weekly perspective-taking exercise', 'Daily equity reflection'],
    'Honesty': ['Daily honesty journal', 'Weekly transparent conversation', 'Practice radical honesty once daily'],
    'Humility': ['Ask for feedback once daily', 'Weekly learning-from-others session', 'Daily gratitude for others\' contributions'],
    'Integrity': ['Evening integrity check-in', 'Daily alignment review', 'Weekly values-action audit'],
    'Loyalty': ['Daily check-in with a loved one', 'Weekly friendship nurturing activity', 'Monthly loyalty reflection'],
    'Patience': ['3 deep breaths before every meeting', 'Mindful pause before meals', 'Daily patience practice log'],
    'Reliability': ['Morning commitments review', 'Daily on-time check', 'Weekly reliability self-score'],
    'Respect': ['Practice active listening daily', 'Daily appreciation message', 'Weekly respectful interaction review'],
    'Responsibility': ['Own one task fully each day', 'Daily responsibility journal', 'Weekly ownership reflection'],
    'Self-discipline': ['First task before phone check', 'Structured evening routine', 'Daily habit tracker review'],
    'Transparency': ['Share reasoning behind one decision daily', 'Weekly open communication practice', 'Daily vulnerability moment'],
    'Trust': ['Delegate one task daily', 'Practice trust-building action', 'Weekly trust reflection journal'],
    'Truth': ['Daily truth-telling practice', 'Weekly belief-questioning exercise', 'Honest evening reflection'],
    'Adaptability': ['Try a new approach to one task daily', 'Weekly flexibility challenge', 'Daily change-embracing moment'],
    'Ambition': ['Daily goal progress check', 'Weekly stretch goal setting', 'Morning ambition visualization'],
    'Challenge': ['Tackle hardest task first each day', 'Weekly challenge yourself goal', 'Daily comfort-zone expansion'],
    'Competence': ['15 minutes skill practice daily', 'Weekly competence-building session', 'Daily performance review'],
    'Creativity': ['Morning pages — 10 min freewriting', 'Weekly creative exploration hour', 'Daily creative micro-exercise'],
    'Curiosity': ['Learn one new thing daily', 'Weekly question exploration', 'Daily curiosity journal entry'],
    'Drive': ['Daily priority identification & action', 'Weekly motivation review', 'Morning drive activation ritual'],
    'Excellence': ['Daily work quality review', 'Weekly excellence standard check', 'Refine one thing until excellent daily'],
    'Growth': ['Learn one new thing daily', 'Weekly skill practice session', 'Daily growth reflection'],
    'Initiative': ['Start one thing proactively daily', 'Weekly initiative challenge', 'Daily idea generation session'],
    'Innovation': ['Daily brainstorming session (5 min)', 'Weekly creative problem-solving', 'Monthly innovation experiment'],
    'Intelligence': ['Read for 15 minutes daily', 'Weekly puzzle or logic challenge', 'Daily critical thinking exercise'],
    'Knowledge': ['Read 10 pages daily', 'Weekly knowledge review session', 'Daily fact-learning practice'],
    'Learning': ['15-minute daily learning session', 'Weekly tutorial or lecture', 'Daily study notes review'],
    'Mastery': ['20 minutes deliberate practice daily', 'Weekly skill assessment', 'Daily mastery journal'],
    'Perseverance': ['Continue one challenging task daily', 'Weekly resilience reflection', 'Daily grit practice'],
    'Resourcefulness': ['Daily creative problem-solving', 'Weekly resource audit', 'Find one creative solution daily'],
    'Risk-taking': ['One calculated risk per week', 'Daily comfort-zone expansion', 'Weekly risk reflection'],
    'Wisdom': ['Read 10 pages daily', 'Evening reflection journal', 'Weekly wisdom-seeking conversation'],
    'Belonging': ['Reach out to one person daily', 'Weekly group participation', 'Daily connection moment'],
    'Caring': ['Daily caring action for someone', 'Weekly check-in with loved ones', 'Morning caring intention'],
    'Collaboration': ['Daily teamwork practice', 'Weekly collaborative project time', 'Daily input-seeking habit'],
    'Community': ['Weekly community participation', 'Daily community contribution', 'Monthly neighborhood engagement'],
    'Compassion': ['Daily compassion meditation', 'Weekly empathy practice', 'Daily kindness action'],
    'Connection': ['10 minutes of present conversation daily', 'Weekly meaningful connection', 'Daily phone-free interaction'],
    'Cooperation': ['Daily compromise practice', 'Weekly team collaboration', 'Daily helping action'],
    'Family': ['Daily family check-in call', 'Weekly family quality time', 'Screen-free family meal daily'],
    'Forgiveness': ['Daily letting-go practice', 'Weekly forgiveness reflection', 'Evening grace meditation'],
    'Friendship': ['Daily friend outreach', 'Weekly friend quality time', 'Monthly friendship deepening activity'],
    'Generosity': ['One generous act daily', 'Weekly sharing practice', 'Daily giving intention'],
    'Giving back': ['Weekly volunteer session', 'Daily helping action', 'Monthly charitable contribution'],
    'Gratitude': ['Write in a gratitude journal each morning', 'Thank one person daily', 'Evening gratitude reflection'],
    'Kindness': ['One random act of kindness daily', 'Compliment someone sincerely each day', 'Daily kindness intention'],
    'Love': ['Express appreciation to someone daily', '10 minutes of fully present conversation', 'Daily love letter or message'],
    'Teamwork': ['Daily team acknowledgment', 'Weekly team celebration', 'Daily collaborative action'],
    'Understanding': ['Practice active listening daily', 'Weekly perspective-taking exercise', 'Daily question-asking habit'],
    'Unity': ['Daily common-ground finding', 'Weekly inclusion practice', 'Daily bridge-building action'],
    'Wholeheartedness': ['Full presence practice daily', 'Weekly wholehearted commitment review', 'Daily energy investment check'],
    'Advocacy': ['Daily cause awareness action', 'Weekly advocacy activity', 'Monthly community engagement'],
    'Altruism': ['Daily selfless act', 'Weekly volunteer time', 'Daily generosity practice'],
    'Contribution': ['Add value to one interaction daily', 'Weekly skill sharing', 'Daily contribution reflection'],
    'Future generations': ['Daily sustainability choice', 'Weekly mentoring session', 'Monthly legacy-building action'],
    'Impact': ['Daily high-impact activity', 'Weekly impact measurement', 'Daily purpose alignment check'],
    'Justice': ['Daily fairness practice', 'Weekly justice reflection', 'Daily equity action'],
    'Leadership': ['Daily positive example setting', 'Weekly mentoring moment', 'Daily leadership reflection'],
    'Legacy': ['Daily legacy-building action', 'Weekly purpose reflection', 'Monthly vision review'],
    'Making a difference': ['Daily impact action', 'Weekly change-making activity', 'Daily difference check-in'],
    'Service': ['Daily service act', 'Weekly volunteer time', 'Daily helping practice'],
    'Stewardship': ['Daily mindful resource use', 'Weekly care audit', 'Daily stewardship reflection'],
    'Vision': ['Daily visualization practice (5 min)', 'Weekly vision board review', 'Monthly goal alignment check'],
    'Abundance': ['Daily abundance gratitude', 'Weekly sharing practice', 'Daily abundance mindset check'],
    'Balance': ['Daily work-rest balance check', 'Weekly life balance audit', 'Daily boundary-setting practice'],
    'Beauty': ['Daily beauty appreciation moment', 'Weekly creative expression', 'Daily aesthetic creation'],
    'Comfort': ['Daily self-care moment', 'Weekly comfort ritual', 'Daily environment check'],
    'Contentment': ['Daily contentment reflection', 'Weekly satisfaction inventory', 'Daily enough-ness practice'],
    'Faith': ['5 minutes of prayer or meditation', 'Weekly devotional reading', 'Daily faith reflection'],
    'Fun': ['Daily fun activity (10 min)', 'Weekly play time', 'Daily laughter practice'],
    'Harmony': ['Daily conflict resolution practice', 'Weekly harmony check-in', 'Daily peace-creating action'],
    'Health': ['10-minute morning stretch', '8 glasses of water daily', 'Daily movement practice'],
    'Home': ['Daily home-tending ritual', 'Weekly space organization', 'Daily home gratitude moment'],
    'Hope': ['Daily hopeful thought practice', 'Weekly future visioning', 'Daily encouragement action'],
    'Humor': ['Daily humor practice', 'Weekly comedy or laughter time', 'Daily playful moment'],
    'Joy': ['Daily joy journaling', 'Weekly joy-seeking activity', 'Daily savoring practice'],
    'Leisure': ['Daily guilt-free rest (15 min)', 'Weekly hobby time', 'Daily leisure moment'],
    'Nature': ['Daily 15-minute outdoor time', 'Weekly nature walk', 'Daily nature observation'],
    'Openness': ['Daily open-minded practice', 'Weekly new perspective exploration', 'Daily assumption-questioning'],
    'Optimism': ['Daily positive reframing', 'Weekly optimism journal', 'Morning positive intention'],
    'Peace': ['Daily 5-minute stillness', 'Weekly peace meditation', 'Daily calm practice'],
    'Playfulness': ['Daily playful moment', 'Weekly creative play time', 'Daily spontaneity practice'],
    'Serenity': ['Daily calming ritual', 'Weekly serenity practice', 'Daily letting-go moment'],
    'Spirituality': ['Daily meditation or prayer (10 min)', 'Weekly spiritual reading', 'Daily mindfulness practice'],
    'Well-being': ['Daily body-mind check-in', 'Weekly well-being audit', 'Daily nourishment practice'],
    'Adventure': ['Daily micro-adventure', 'Weekly exploration activity', 'Daily try-something-new habit'],
    'Freedom': ['Daily autonomous choice', 'Weekly freedom practice', 'Daily liberation reflection'],
    'Independence': ['Daily independent decision', 'Weekly self-reliance practice', 'Daily autonomy exercise'],
    'Individuality': ['Daily unique expression', 'Weekly individuality celebration', 'Daily authenticity practice'],
    'Originality': ['Daily original creation', 'Weekly innovation exercise', 'Daily unique idea generation'],
    'Self-expression': ['Daily creative expression (10 min)', 'Weekly art or writing session', 'Daily authentic sharing'],
    'Self-reliance': ['Daily independent problem-solving', 'Weekly skill-building session', 'Daily self-sufficiency practice'],
    'Travel': ['Daily armchair travel (new culture learning)', 'Weekly local exploration', 'Daily wanderlust journaling'],
    'Uniqueness': ['Daily unique perspective sharing', 'Weekly difference celebration', 'Daily self-appreciation'],
    'Vulnerability': ['Daily honest sharing', 'Weekly vulnerability practice', 'Daily courage in openness'],
    'Achievement': ['Daily goal completion', 'Weekly achievement review', 'Daily progress tracking'],
    'Being the best': ['Daily personal best challenge', 'Weekly excellence pursuit', 'Daily improvement practice'],
    'Career': ['Daily career development step', 'Weekly professional networking', 'Daily skill advancement'],
    'Competition': ['Daily personal best challenge', 'Weekly competitive goal', 'Daily improvement tracking'],
    'Confidence': ['Daily affirmation practice', 'Weekly confidence-building action', 'Daily decisive action'],
    'Efficiency': ['Daily time optimization', 'Weekly process streamlining', 'Daily waste elimination'],
    'Financial stability': ['Daily budget check', 'Weekly savings review', 'Daily mindful spending practice'],
    'Order': ['Daily organization ritual', 'Weekly planning session', 'Daily space tidying'],
    'Power': ['Daily empowerment practice', 'Weekly influence exercise', 'Daily ownership action'],
    'Pride': ['Daily pride-worthy action', 'Weekly accomplishment review', 'Daily self-respect practice'],
    'Recognition': ['Daily acknowledgment of others', 'Weekly achievement sharing', 'Daily contribution celebration'],
    'Security': ['Daily security-building step', 'Weekly safety net review', 'Daily preparedness practice'],
    'Structure': ['Morning planning routine', 'Weekly schedule review', 'Daily checklist practice'],
    'Success': ['Daily success definition & action', 'Weekly goal review', 'Daily priority completion'],
    'Wealth': ['Daily financial learning (5 min)', 'Weekly wealth-building action', 'Daily value creation practice'],
};

// ─── Component Types ──────────────────────────────────

interface DiscoveredValue {
    name: string;
    definition: string;
    source: 'admired' | 'anti_flip' | 'direct';
    selfRating: number;
    timeSpentRating: 'none' | 'little' | 'some' | 'lots';
    tomorrowAction?: string;
    nudgeActivity?: string;
}

interface SocraticDialogueProps {
    onComplete: (values: DiscoveredValue[]) => void;
    onCancel: () => void;
}

const STEP_COUNT = 6;
const STEP_META = [
    { title: 'Select Your Values', description: 'Tap every value that resonates with you' },
    { title: 'Your Top Values', description: 'Narrow down to the 5–7 that matter most' },
    { title: 'Self-Assessment', description: 'How strongly do you embody each one?' },
    { title: 'Time Audit', description: 'How much time did you spend on each last week?' },
    { title: 'Tomorrow\'s Commitment', description: 'Select what you\'ll practice tomorrow' },
    { title: 'Build a Practice', description: 'Pick a recurring daily activity for each value' },
];

// Helper to get suggestions for a value
function getActions(name: string): string[] {
    return SPECIFIC_ACTIONS[name] || [`Spend 10 minutes reflecting on ${name}`, `Practice ${name} in one interaction today`, `Journal about what ${name} means to you`];
}
function getNudges(name: string): string[] {
    return SPECIFIC_NUDGES[name] || [`Daily ${name.toLowerCase()} reflection (5 min)`, `Weekly ${name.toLowerCase()} practice session`, `Morning ${name.toLowerCase()} intention setting`];
}

// ─── Component ────────────────────────────────────────

export function SocraticDialogue({ onComplete, onCancel }: SocraticDialogueProps) {
    const [step, setStep] = useState(0);
    const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set());
    const [topValues, setTopValues] = useState<string[]>([]);
    const [valueData, setValueData] = useState<DiscoveredValue[]>([]);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [searchFilter, setSearchFilter] = useState('');
    const [saving, setSaving] = useState(false);

    const progress = ((step + 1) / STEP_COUNT) * 100;

    const toggleValue = (name: string) => {
        setSelectedValues(prev => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name); else next.add(name);
            return next;
        });
    };

    const toggleTopValue = (name: string) => {
        setTopValues(prev => {
            if (prev.includes(name)) return prev.filter(v => v !== name);
            if (prev.length >= 7) return prev;
            return [...prev, name];
        });
    };

    const handleNext = () => {
        if (step === 0 && selectedValues.size === 0) return;
        if (step === 1 && topValues.length === 0) return;
        if (step === 0 && topValues.length === 0) setTopValues([...selectedValues].slice(0, 7));
        if (step === 1) {
            setValueData(topValues.map(name => ({
                name, definition: '', source: 'direct' as const, selfRating: 5,
                timeSpentRating: 'some' as const, tomorrowAction: '', nudgeActivity: '',
            })));
        }
        setStep(s => Math.min(s + 1, STEP_COUNT - 1));
    };

    const handleBack = () => setStep(s => Math.max(0, s - 1));

    const handleFinish = async () => {
        setSaving(true);
        try { onComplete(valueData); } finally { setSaving(false); }
    };

    const updateField = (index: number, field: keyof DiscoveredValue, value: any) => {
        setValueData(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
    };

    const isNextDisabled = () => {
        if (step === 0) return selectedValues.size === 0;
        if (step === 1) return topValues.length === 0;
        return false;
    };

    const filteredValues = ALL_VALUES.filter(v => {
        if (activeCategory && v.category !== activeCategory) return false;
        if (searchFilter) return v.name.toLowerCase().includes(searchFilter.toLowerCase());
        return true;
    });

    return (
        <div className="max-w-3xl mx-auto">
            {/* Progress */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-osia-teal-500">
                        Step {step + 1} of {STEP_COUNT}
                    </span>
                    <button onClick={onCancel} className="text-[9px] font-bold text-white/20 hover:text-white/40 uppercase tracking-widest">Cancel</button>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-gradient-to-r from-osia-teal-500 to-osia-teal-400 rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
                </div>
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-5 h-5 text-osia-teal-500" />
                <h2 className="text-[10px] font-black uppercase tracking-widest text-osia-teal-500">{STEP_META[step].title}</h2>
            </div>
            <p className="text-xs text-white/30 mb-5">{STEP_META[step].description}</p>

            {/* Steps */}
            <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>

                    {/* Step 1: Browse & Select */}
                    {step === 0 && (
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/15" />
                                <input type="text" value={searchFilter} onChange={e => setSearchFilter(e.target.value)} placeholder="Search values..."
                                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/15 focus:outline-none focus:border-osia-teal-500/50" />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => setActiveCategory(null)}
                                    className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all ${!activeCategory ? 'bg-osia-teal-500/20 text-osia-teal-500 border border-osia-teal-500/30' : 'bg-white/5 text-white/25 border border-white/5 hover:bg-white/10'}`}>All</button>
                                {VALUE_CATEGORIES.map(cat => (
                                    <button key={cat.id} onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                                        className={`px-3 py-1.5 rounded-full text-[9px] font-bold transition-all ${activeCategory === cat.id ? 'bg-osia-teal-500/20 text-osia-teal-500 border border-osia-teal-500/30' : 'bg-white/5 text-white/25 border border-white/5 hover:bg-white/10'}`}>
                                        {cat.icon} {cat.label}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] font-bold text-white/20">{selectedValues.size} selected — tap everything that resonates</p>
                            <div className="flex flex-wrap gap-2 max-h-[350px] overflow-y-auto pr-1 pb-2">
                                {filteredValues.map(v => {
                                    const sel = selectedValues.has(v.name);
                                    return (
                                        <motion.button key={v.name} onClick={() => toggleValue(v.name)} whileTap={{ scale: 0.95 }}
                                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${sel ? 'bg-osia-teal-500/20 text-osia-teal-400 border border-osia-teal-500/40 shadow-[0_0_12px_rgba(45,212,191,0.1)]' : 'bg-white/[0.03] text-white/40 border border-white/5 hover:bg-white/[0.06] hover:text-white/60'}`}>
                                            {sel && <Check className="w-3 h-3 inline mr-1 -mt-0.5" />}{v.name}
                                        </motion.button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Top 5-7 */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <p className="text-[10px] font-bold text-white/20">{topValues.length}/7 selected — choose the ones that define you most</p>
                            <div className="flex flex-wrap gap-2">
                                {[...selectedValues].map(name => {
                                    const isTop = topValues.includes(name);
                                    return (
                                        <motion.button key={name} onClick={() => toggleTopValue(name)} whileTap={{ scale: 0.95 }} layout
                                            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${isTop ? 'bg-gradient-to-br from-osia-teal-500/25 to-emerald-500/15 text-osia-teal-300 border border-osia-teal-500/40 shadow-lg shadow-osia-teal-500/5' : 'bg-white/[0.03] text-white/30 border border-white/5 hover:bg-white/[0.06]'}`}>
                                            {isTop && <Check className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />}{name}
                                        </motion.button>
                                    );
                                })}
                            </div>
                            {topValues.length > 0 && (
                                <Card className="p-3 bg-osia-teal-500/5 border-osia-teal-500/10">
                                    <p className="text-[10px] text-osia-teal-500/70 font-medium">✨ Your core: {topValues.join(', ')}</p>
                                </Card>
                            )}
                        </div>
                    )}

                    {/* Step 3: Self-Rate */}
                    {step === 2 && (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                            {valueData.map((val, i) => (
                                <Card key={i} className="p-4 border-white/5 bg-white/[0.02]">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-bold text-white/70">{val.name}</span>
                                        <span className={`text-sm font-black ${val.selfRating >= 7 ? 'text-green-400' : val.selfRating >= 4 ? 'text-amber-400' : 'text-red-400'}`}>{val.selfRating}/10</span>
                                    </div>
                                    <input type="range" min={1} max={10} value={val.selfRating} onChange={e => updateField(i, 'selfRating', parseInt(e.target.value))} className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-osia-teal-500" />
                                    <div className="flex justify-between text-[7px] font-bold text-white/15 mt-1 uppercase tracking-wider"><span>I struggle</span><span>I embody this</span></div>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Step 4: Time Audit */}
                    {step === 3 && (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                            {valueData.map((val, i) => (
                                <Card key={i} className="p-4 border-white/5 bg-white/[0.02]">
                                    <p className="text-sm font-bold text-white/70 mb-3">{val.name}</p>
                                    <div className="flex gap-2">
                                        {(['none', 'little', 'some', 'lots'] as const).map(level => (
                                            <button key={level} onClick={() => updateField(i, 'timeSpentRating', level)}
                                                className={`flex-1 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${val.timeSpentRating === level ? 'bg-osia-teal-500/20 text-osia-teal-500 border border-osia-teal-500/30' : 'bg-white/5 text-white/30 border border-white/5 hover:bg-white/10'}`}>
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Step 5: Tomorrow's Commitment — ALL selectable */}
                    {step === 4 && (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                            {valueData.map((val, i) => {
                                const suggestions = getActions(val.name);
                                return (
                                    <Card key={i} className="p-4 border-white/5 bg-white/[0.02]">
                                        <p className="text-sm font-bold text-white/70 mb-2">{val.name}</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {suggestions.map((s, si) => (
                                                <button key={si} onClick={() => updateField(i, 'tomorrowAction', s)}
                                                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all ${val.tomorrowAction === s ? 'bg-osia-teal-500/20 text-osia-teal-400 border border-osia-teal-500/30' : 'bg-white/5 text-white/30 border border-white/5 hover:bg-white/10'}`}>
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}

                    {/* Step 6: Build Practice — ALL selectable */}
                    {step === 5 && (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                            {valueData.map((val, i) => {
                                const suggestions = getNudges(val.name);
                                return (
                                    <Card key={i} className="p-4 border-white/5 bg-white/[0.02]">
                                        <p className="text-sm font-bold text-white/70 mb-2">{val.name}</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {suggestions.map((s, si) => (
                                                <button key={si} onClick={() => updateField(i, 'nudgeActivity', s)}
                                                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all ${val.nudgeActivity === s ? 'bg-osia-teal-500/20 text-osia-teal-400 border border-osia-teal-500/30' : 'bg-white/5 text-white/30 border border-white/5 hover:bg-white/10'}`}>
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
                <button onClick={handleBack} disabled={step === 0}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white/30 text-xs font-bold hover:text-white/50 disabled:opacity-20 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
                {step < STEP_COUNT - 1 ? (
                    <button onClick={handleNext} disabled={isNextDisabled()}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-osia-teal-500 text-white text-xs font-black uppercase tracking-widest hover:bg-osia-teal-600 disabled:opacity-30 transition-colors">
                        Continue <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                ) : (
                    <button onClick={handleFinish} disabled={saving}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-osia-teal-500 to-emerald-500 text-white text-xs font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all">
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        Complete Discovery
                    </button>
                )}
            </div>
        </div>
    );
}

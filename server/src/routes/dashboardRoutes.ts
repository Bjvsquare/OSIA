import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { lifeAreaService } from '../services/LifeAreaService';
import { behavioralActivationService } from '../services/BehavioralActivationService';
import { blueprintService } from '../services/BlueprintService';
import { osiaEvolutionService } from '../services/OSIAEvolutionService';
import { protocolService } from '../services/ProtocolService';
import { journeyService } from '../services/JourneyService';
import { connectionService } from '../services/ConnectionService';
import { nudgesService } from '../services/NudgesService';
import { db } from '../db/JsonDb';

const router = express.Router();

/* ═══════════════════════════════════════════════════════════
   Dashboard Stats — /api/dashboard

   Comprehensive intelligence center pulling from ALL
   platform systems: Practice, Life Areas, Blueprint, OSIA,
   Protocols, Journey, Connections, Nudges, and Calibrations.
   ═══════════════════════════════════════════════════════════ */

const LAYER_NAMES: Record<number, string> = {
    1: 'Core Disposition', 2: 'Energy Orientation', 3: 'Cognitive Processing',
    4: 'Emotional Foundation', 5: 'Creative Expression', 6: 'Operational Style',
    7: 'Relational Dynamics', 8: 'Leadership Capacity', 9: 'Communication',
    10: 'Values & Relationships', 11: 'Trust & Commitment', 12: 'Group Presence',
    13: 'Navigational Interface', 14: 'Evolutionary Trajectory', 15: 'Systemic Integration',
};

router.get('/stats', authMiddleware, async (req: any, res: any) => {
    try {
        const userId = req.user.id || req.user.userId;
        const now = new Date();
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const twoWeeksAgo = new Date(now);
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        // ═══════════════════════════════════════════════════
        // 1. PRACTICE DATA
        // ═══════════════════════════════════════════════════
        const practiceSummary = await behavioralActivationService.getPracticeSummary(userId);
        const practiceLog = await behavioralActivationService.getPracticeLog(userId, 500);

        const practiceStreak = practiceSummary.currentStreaks.length > 0
            ? Math.max(...practiceSummary.currentStreaks.map(s => s.streak))
            : 0;

        const weeklyCompletions = practiceLog.entries.filter(
            (e: any) => new Date(e.timestamp) >= weekAgo
        ).length;

        const prevWeekCompletions = practiceLog.entries.filter(
            (e: any) => {
                const t = new Date(e.timestamp);
                return t >= twoWeeksAgo && t < weekAgo;
            }
        ).length;

        // Completions by day (84 days for heatmap)
        const daysBack84 = new Date(now);
        daysBack84.setDate(daysBack84.getDate() - 84);
        const completionsByDay: Record<string, number> = {};
        for (let d = new Date(daysBack84); d <= now; d.setDate(d.getDate() + 1)) {
            completionsByDay[d.toISOString().split('T')[0]] = 0;
        }
        for (const entry of practiceLog.entries) {
            const day = new Date(entry.timestamp).toISOString().split('T')[0];
            if (completionsByDay[day] !== undefined) completionsByDay[day]++;
        }
        const completionsByDayArr = Object.entries(completionsByDay)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // ═══════════════════════════════════════════════════
        // 2. CALIBRATION / REFINEMENT DATA
        // ═══════════════════════════════════════════════════
        const calibrations = await db.getCollection<any>('calibrations');
        const userCalibrations = calibrations.filter(
            (c: any) => c.userId === userId && c.response !== undefined
        );
        const weeklyRefinements = userCalibrations.filter(
            (c: any) => new Date(c.timestamp) >= weekAgo
        ).length;
        const prevWeekRefinements = userCalibrations.filter(
            (c: any) => {
                const t = new Date(c.timestamp);
                return t >= twoWeeksAgo && t < weekAgo;
            }
        ).length;
        const totalRefinements = userCalibrations.length;

        // Refinements by day sparkline
        const refinementsByDay: Record<string, number> = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            refinementsByDay[d.toISOString().split('T')[0]] = 0;
        }
        for (const cal of userCalibrations) {
            const day = new Date(cal.timestamp).toISOString().split('T')[0];
            if (refinementsByDay[day] !== undefined) refinementsByDay[day]++;
        }
        const refinementsByDayArr = Object.entries(refinementsByDay)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Layers refined (unique layers touched by calibrations)
        const layersRefined = [...new Set(
            userCalibrations
                .filter((c: any) => c.layerId)
                .map((c: any) => Number(c.layerId))
        )];

        // ═══════════════════════════════════════════════════
        // 3. LIFE AREA SCORES
        // ═══════════════════════════════════════════════════
        const dashboardSummary = await lifeAreaService.getDashboardSummary(userId);
        const scoreTrendByArea: Record<string, { date: string; score: number }[]> = {};
        for (const area of dashboardSummary.areas) {
            scoreTrendByArea[area.domain] = area.scoreHistory
                .slice(-30)
                .map((s: any) => ({ date: s.date, score: s.score }));
        }
        const completionSparkline = completionsByDayArr.slice(-7);

        // Score sparkline
        const allScorePoints: { date: string; score: number }[] = [];
        for (const area of dashboardSummary.areas) {
            for (const s of area.scoreHistory) {
                allScorePoints.push({ date: s.date, score: s.score });
            }
        }
        const scoreByDate: Record<string, number[]> = {};
        for (const p of allScorePoints) {
            (scoreByDate[p.date] ||= []).push(p.score);
        }
        const scoreSparkline = Object.entries(scoreByDate)
            .map(([date, scores]) => ({
                date,
                score: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
            }))
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-7);

        // ── Deltas ───────────────────────────────────────
        const completionDelta = prevWeekCompletions > 0
            ? Math.round(((weeklyCompletions - prevWeekCompletions) / prevWeekCompletions) * 100)
            : weeklyCompletions > 0 ? 100 : 0;
        const refinementDelta = prevWeekRefinements > 0
            ? Math.round(((weeklyRefinements - prevWeekRefinements) / prevWeekRefinements) * 100)
            : weeklyRefinements > 0 ? 100 : 0;

        const prevScoreEntries = allScorePoints.filter(p => new Date(p.date) < weekAgo);
        const prevScoreByDate: Record<string, number[]> = {};
        for (const p of prevScoreEntries) { (prevScoreByDate[p.date] ||= []).push(p.score); }
        const prevScoreDates = Object.keys(prevScoreByDate).sort();
        const prevOverallScore = prevScoreDates.length > 0
            ? (() => {
                const lastDate = prevScoreDates[prevScoreDates.length - 1];
                const scores = prevScoreByDate[lastDate];
                return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
            })()
            : dashboardSummary.overallScore;
        const scoreDelta = prevOverallScore > 0
            ? Math.round(((dashboardSummary.overallScore - prevOverallScore) / prevOverallScore) * 100)
            : 0;

        // Active days this week
        const activeDaysThisWeek = completionsByDayArr.slice(-7).filter(d => d.count > 0).length;
        const totalCompletions = practiceSummary.totalCompletions;

        // ═══════════════════════════════════════════════════
        // 4. BLUEPRINT INTELLIGENCE (fail-safe)
        // ═══════════════════════════════════════════════════
        let blueprint: any = null;
        try {
            const latestSnapshot = await blueprintService.getLatestSnapshot(userId);
            if (latestSnapshot && latestSnapshot.traits && latestSnapshot.traits.length > 0) {
                const traits = latestSnapshot.traits;
                const sorted = [...traits].sort((a, b) => b.score - a.score);
                const strengths = sorted.slice(0, 5).map(t => ({
                    traitId: t.traitId,
                    layerId: t.layerId,
                    layerName: LAYER_NAMES[t.layerId] || `Layer ${t.layerId}`,
                    score: Math.round(t.score * 100) / 100,
                    confidence: Math.round((t.confidence || 0) * 100) / 100,
                }));
                const developing = sorted.filter(t => t.score < 0.4).slice(0, 3).map(t => ({
                    traitId: t.traitId,
                    layerId: t.layerId,
                    layerName: LAYER_NAMES[t.layerId] || `Layer ${t.layerId}`,
                    score: Math.round(t.score * 100) / 100,
                }));
                const avgConfidence = traits.reduce((sum, t) => sum + (t.confidence || 0), 0) / traits.length;
                const history = await blueprintService.getHistory(userId);

                blueprint = {
                    strengths,
                    developing,
                    depthScore: Math.round(avgConfidence * 100),
                    snapshotCount: history.length,
                    totalTraits: traits.length,
                };
            }
        } catch (err) {
            console.warn('[Dashboard] Blueprint data unavailable:', (err as Error).message);
        }

        // ═══════════════════════════════════════════════════
        // 5. OSIA EVOLUTION (fail-safe)
        // ═══════════════════════════════════════════════════
        let evolution: any = null;
        try {
            const timeline = await osiaEvolutionService.getEvolutionTimeline(userId, 5);
            if (timeline) {
                evolution = {
                    overallGrowth: timeline.overallGrowth?.overallProgress || 0,
                    stabilityGrowth: timeline.overallGrowth?.stabilityGrowth || 0,
                    patternsDiscovered: timeline.overallGrowth?.newPatternsDiscovered || 0,
                    improvementAreas: timeline.overallGrowth?.areasOfImprovement || [],
                    attentionAreas: timeline.overallGrowth?.areasNeedingAttention || [],
                    patternChanges: (timeline.patternChanges || []).slice(0, 4).map(p => ({
                        name: p.patternName,
                        direction: p.direction,
                        changePercent: Math.round(p.changePercent),
                    })),
                    snapshotCount: timeline.snapshots?.length || 0,
                };
            }
        } catch (err) {
            console.warn('[Dashboard] OSIA evolution unavailable:', (err as Error).message);
        }

        // ═══════════════════════════════════════════════════
        // 6. PROTOCOL ENGINE (fail-safe)
        // ═══════════════════════════════════════════════════
        let protocols: any = null;
        try {
            const stats = await protocolService.getProtocolStats(userId);
            const active = await protocolService.getActiveProtocols(userId);
            protocols = {
                activeCount: stats.totalActive,
                completedCount: stats.totalCompleted,
                totalCompletions: stats.totalCompletions,
                streakDays: stats.streakDays,
                activeNames: active.slice(0, 3).map(p => p.title || p.type),
                layersImpacted: [...new Set(
                    active.flatMap(p =>
                        (p.completions || [])
                            .filter(c => c.blueprintImpact)
                            .map(c => c.blueprintImpact!.layerId)
                    )
                )],
            };
        } catch (err) {
            console.warn('[Dashboard] Protocol data unavailable:', (err as Error).message);
        }

        // ═══════════════════════════════════════════════════
        // 7. JOURNEY PROGRESS (fail-safe)
        // ═══════════════════════════════════════════════════
        let journey: any = null;
        try {
            const progress = await journeyService.getJourneyProgress(userId);
            if (progress) {
                const badges = await journeyService.getUserBadges(userId);
                journey = {
                    level: progress.level?.level || 1,
                    title: progress.level?.title || 'Explorer',
                    totalPoints: progress.level?.totalPoints || 0,
                    pointsToNextLevel: progress.level?.pointsToNextLevel || 100,
                    nextLevelTitle: progress.level?.nextLevelTitle || 'Practitioner',
                    badgesEarned: badges.slice(-6).map(b => ({
                        name: b.name,
                        badgeLevel: b.badgeLevel,
                        icon: b.category === 'onboarding' ? '🌱' :
                            b.category === 'protocols' ? '⚡' :
                                b.category === 'team' ? '👥' :
                                    b.category === 'blueprint' ? '🧬' :
                                        b.category === 'connection' ? '🔗' : '🏅',
                        unlockedAt: b.unlockedAt,
                    })),
                    creditDiscount: progress.credits?.discountPercentage || 0,
                    totalCredits: progress.credits?.totalCredits || 0,
                };
            }
        } catch (err) {
            console.warn('[Dashboard] Journey data unavailable:', (err as Error).message);
        }

        // ═══════════════════════════════════════════════════
        // 8. CONNECTIONS (fail-safe)
        // ═══════════════════════════════════════════════════
        let connections: any = null;
        try {
            const conns = await connectionService.getConnections(userId);
            const pending = await connectionService.getPendingRequests(userId);
            const typeBreakdown: Record<string, number> = {};
            for (const c of conns) {
                typeBreakdown[c.connectionType] = (typeBreakdown[c.connectionType] || 0) + 1;
            }
            connections = {
                totalCount: conns.length,
                pendingCount: pending.length,
                typeBreakdown: Object.entries(typeBreakdown).map(([type, count]) => ({ type, count })),
                recentAvatars: conns.slice(0, 5).map(c => ({
                    name: c.name || c.username,
                    avatar: c.avatarUrl,
                })),
            };
        } catch (err) {
            console.warn('[Dashboard] Connection data unavailable:', (err as Error).message);
        }

        // ═══════════════════════════════════════════════════
        // 9. NUDGE ENGAGEMENT (fail-safe)
        // ═══════════════════════════════════════════════════
        let nudges: any = null;
        try {
            const todaysNudges = await nudgesService.generateDailyNudges(userId);
            const activeNudges = await nudgesService.getActiveNudges(userId);
            if (todaysNudges) {
                const total = todaysNudges.nudges.length;
                const completed = todaysNudges.nudges.filter(n => n.completed).length;
                const dismissed = todaysNudges.nudges.filter(n => n.dismissed).length;
                nudges = {
                    todayTotal: total,
                    todayCompleted: completed,
                    todayDismissed: dismissed,
                    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
                    activeCount: activeNudges.length,
                };
            }
        } catch (err) {
            console.warn('[Dashboard] Nudge data unavailable:', (err as Error).message);
        }

        // ═══════════════════════════════════════════════════
        // 10. CONTEXTUAL INSIGHTS (from ALL sources)
        // ═══════════════════════════════════════════════════
        const insights: string[] = [];

        // Practice insights
        if (weeklyCompletions > prevWeekCompletions && prevWeekCompletions > 0) {
            insights.push(`Your practice is accelerating — ${weeklyCompletions} completions this week, up from ${prevWeekCompletions} last week.`);
        } else if (weeklyCompletions > 0 && prevWeekCompletions === 0) {
            insights.push(`Great start this week! You completed ${weeklyCompletions} practice${weeklyCompletions > 1 ? 's' : ''}.`);
        } else if (weeklyCompletions === 0 && prevWeekCompletions > 0) {
            insights.push(`You completed ${prevWeekCompletions} practices last week. Ready to pick up where you left off?`);
        }
        if (practiceStreak > 0) {
            insights.push(`You're on a ${practiceStreak}-day streak. Keep the momentum going!`);
        }

        // Blueprint insights
        if (blueprint && blueprint.snapshotCount > 1) {
            insights.push(`Your blueprint has been refined ${blueprint.snapshotCount} times — deepening self-knowledge with each iteration.`);
        }
        if (blueprint && blueprint.strengths.length > 0) {
            const top = blueprint.strengths[0];
            insights.push(`Your strongest trait is in ${top.layerName} — that's your superpower.`);
        }

        // Evolution insights
        if (evolution && evolution.overallGrowth > 0) {
            insights.push(`Your OSIA evolution shows ${evolution.overallGrowth}% overall growth — you're evolving.`);
        }
        if (evolution && evolution.patternsDiscovered > 0) {
            insights.push(`You've discovered ${evolution.patternsDiscovered} new patterns in your behavioral data.`);
        }

        // Protocol insights
        if (protocols && protocols.activeCount > 0) {
            insights.push(`${protocols.activeCount} active protocol${protocols.activeCount > 1 ? 's' : ''} running — building compound habits.`);
        }

        // Connection insights
        if (connections && connections.totalCount > 0) {
            insights.push(`You have ${connections.totalCount} connection${connections.totalCount > 1 ? 's' : ''} in your network.`);
        }

        // Area improvement insights
        const areaChanges: { domain: string; change: number }[] = [];
        const domainLabels: Record<string, string> = {
            spiritual: 'Spiritual Life', physical_health: 'Physical Health',
            personal: 'Personal Life', relationships: 'Key Relationships',
            career: 'Career', business: 'Business', finances: 'Finances',
        };
        for (const area of dashboardSummary.areas) {
            const history = area.scoreHistory;
            if (history.length >= 2) {
                const recent = history[history.length - 1].score;
                const prev = history[Math.max(0, history.length - 3)].score;
                if (recent !== prev) areaChanges.push({ domain: area.domain, change: recent - prev });
            }
        }
        areaChanges.sort((a, b) => b.change - a.change);
        if (areaChanges.length > 0 && areaChanges[0].change > 0) {
            insights.push(`${domainLabels[areaChanges[0].domain] || areaChanges[0].domain} improved by +${areaChanges[0].change} points recently.`);
        }

        // ═══════════════════════════════════════════════════
        // 11. MILESTONES
        // ═══════════════════════════════════════════════════
        const milestones: { icon: string; label: string; achieved: boolean }[] = [];
        if (practiceStreak >= 3) milestones.push({ icon: '🔥', label: '3-Day Streak', achieved: true });
        if (practiceStreak >= 7) milestones.push({ icon: '⚡', label: '7-Day Streak', achieved: true });
        if (practiceStreak >= 14) milestones.push({ icon: '🌟', label: '2-Week Streak', achieved: true });
        if (practiceStreak >= 30) milestones.push({ icon: '💎', label: 'Month-Long Streak', achieved: true });
        if (totalCompletions >= 10) milestones.push({ icon: '🎯', label: '10 Completions', achieved: true });
        if (totalCompletions >= 50) milestones.push({ icon: '🏆', label: '50 Completions', achieved: true });
        if (totalCompletions >= 100) milestones.push({ icon: '👑', label: 'Century Club', achieved: true });
        if (totalRefinements >= 5) milestones.push({ icon: '🔬', label: '5 Calibrations', achieved: true });
        if (totalRefinements >= 20) milestones.push({ icon: '🧬', label: '20 Calibrations', achieved: true });
        // Blueprint milestones
        if (blueprint && blueprint.snapshotCount >= 3) milestones.push({ icon: '🧠', label: 'Blueprint Refined 3×', achieved: true });
        // Protocol milestones
        if (protocols && protocols.totalCompletions >= 5) milestones.push({ icon: '📋', label: '5 Protocol Steps', achieved: true });
        // Connection milestones
        if (connections && connections.totalCount >= 1) milestones.push({ icon: '🤝', label: 'First Connection', achieved: true });
        if (connections && connections.totalCount >= 5) milestones.push({ icon: '🌐', label: '5 Connections', achieved: true });

        // Next milestone
        const nextStreak = practiceStreak < 3 ? 3 : practiceStreak < 7 ? 7 : practiceStreak < 14 ? 14 : practiceStreak < 30 ? 30 : null;
        if (nextStreak) {
            milestones.push({ icon: nextStreak <= 7 ? '🔥' : '⚡', label: `${nextStreak}-Day Streak`, achieved: false });
        }

        // ═══════════════════════════════════════════════════
        // RESPONSE
        // ═══════════════════════════════════════════════════
        res.json({
            // Practice core
            practiceStreak,
            weeklyCompletions,
            weeklyRefinements,
            overallScore: dashboardSummary.overallScore,
            completionSparkline,
            refinementSparkline: refinementsByDayArr,
            scoreSparkline,
            completionsByDay: completionsByDayArr,
            scoreTrendByArea,
            // Deltas
            completionDelta,
            refinementDelta,
            scoreDelta,
            // Totals
            totalCompletions,
            totalRefinements,
            activeDaysThisWeek,
            // Deep integration
            blueprint,
            evolution,
            protocols,
            journey,
            connections,
            nudges,
            // Insights & milestones
            milestones: milestones.slice(-8),
            insights: insights.slice(0, 5),
            // Legacy
            activeNudgesCount: practiceSummary.activeNudgesCount,
            valuesCount: practiceSummary.valuesCount,
        });
    } catch (error: any) {
        console.error('[Dashboard] Stats error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

export default router;

import React, { useState, useMemo } from 'react';
import { QuarterSummaryData, Player, FormationStats, PlayerStats, Play, Highlight } from '../types';
import { PassingIcon, RunningIcon, TacklingIcon, FieldGoalIcon, TurnoverIcon, SparklesIcon, SpinnerIcon } from './icons';
import { getLastName, parseSimpleMarkdown } from '../utils';
import { GoogleGenAI } from "@google/genai";
import { useGameState } from '../contexts/GameStateContext';

const getOrdinal = (n: number) => {
  if (n > 3 && n < 21) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
};

const FormationStatsCard: React.FC<{ name: string; stats: QuarterSummaryData['formationStats'][string] }> = ({ name, stats }) => {
    const isKickingFormation = name.toLowerCase().includes('pat') || name.toLowerCase().includes('p.a.t') || name.toLowerCase().includes('field goal');

    if (isKickingFormation && stats.attempts && stats.attempts > 0) {
        const successRate = Math.round(((stats.makes || 0) / stats.attempts) * 100);
        return (
            <div className="bg-[var(--bg-tertiary)] p-3 rounded-lg">
                <div className="flex justify-between items-center">
                    <h4 className="font-bold text-sm text-white">{name}</h4>
                    <div className="text-right">
                        <p className={`text-base font-bold font-mono text-green-400`}>+{stats.pointsScored} pts</p>
                        <p className="text-xs text-[var(--text-secondary)]">{stats.attempts} attempts</p>
                    </div>
                </div>
                <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-[var(--text-secondary)]">Success Rate</span>
                        <span className="text-xs font-bold text-white">{`${stats.makes || 0}/${stats.attempts} (${successRate}%)`}</span>
                    </div>
                    <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2">
                        <div className="bg-[var(--accent-primary)] h-2 rounded-full" style={{ width: `${successRate}%` }}></div>
                    </div>
                </div>
            </div>
        );
    }
    
    const successRate = stats.playCount > 0 ? Math.round((stats.positivePlays / stats.playCount) * 100) : 0;
    const yardsColor = stats.totalYards > 0 ? 'text-green-400' : stats.totalYards < 0 ? 'text-red-400' : 'text-gray-300';

    return (
        <div className="bg-[var(--bg-tertiary)] p-3 rounded-lg">
            <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm text-white">{name}</h4>
                <div className="text-right">
                    <p className={`text-base font-bold font-mono ${yardsColor}`}>{stats.totalYards > 0 ? `+${stats.totalYards}` : stats.totalYards} yds</p>
                    <p className="text-xs text-[var(--text-secondary)]">{stats.playCount} plays</p>
                </div>
            </div>
            <div className="mt-2">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-[var(--text-secondary)]">Success Rate</span>
                    <span className="text-xs font-bold text-white">{successRate}%</span>
                </div>
                <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2">
                    <div className="bg-[var(--accent-primary)] h-2 rounded-full" style={{ width: `${successRate}%` }}></div>
                </div>
            </div>
        </div>
    );
};

const PlayerStatLine: React.FC<{
    player: Player | undefined;
    stats: PlayerStats;
    statType: 'yards' | 'count' | 'kicking';
}> = ({ player, stats, statType }) => {
    if (!player) return null;

    let statDisplay = '';
    switch (statType) {
        case 'yards':
            statDisplay = `${stats.count} for ${stats.yards > 0 ? '+' : ''}${stats.yards} yds`;
            break;
        case 'kicking':
            statDisplay = `${stats.makes || 0}/${stats.attempts || 0} FGs`;
            break;
        case 'count':
        default:
            statDisplay = `${stats.count} total`;
            break;
    }
    
    return (
        <li className="flex justify-between text-sm">
            <span>#{player.jerseyNumber} {getLastName(player.name)}</span>
            <span className="font-bold text-[var(--text-primary)] font-mono">{statDisplay}</span>
        </li>
    );
};


const TopPerformerItem: React.FC<{
    icon: React.ReactElement;
    category: string;
    playerStats: QuarterSummaryData['topPerformers'][keyof QuarterSummaryData['topPerformers']];
    playerMap: Map<string, Player>;
    statType: 'yards' | 'count' | 'kicking';
}> = ({ icon, category, playerStats, playerMap, statType }) => {
    const sortedPlayers = Object.entries(playerStats)
        .sort(([, a], [, b]) => {
            const statsA = a as PlayerStats;
            const statsB = b as PlayerStats;
            if (statType === 'yards') {
                if (statsB.yards !== statsA.yards) return statsB.yards - statsA.yards;
            }
            if (statType === 'kicking') {
                if ((statsB.makes || 0) !== (statsA.makes || 0)) return (statsB.makes || 0) - (statsA.makes || 0);
            }
            return statsB.count - statsA.count; // Fallback sort by count
        })
        .slice(0, 3);

    if (sortedPlayers.length === 0) return null;

    return (
        <div className="bg-[var(--bg-tertiary)] p-3 rounded-lg flex items-start gap-3">
            <div className="flex-shrink-0 text-[var(--accent-primary)] mt-0.5">{icon}</div>
            <div className="flex-grow">
                <h4 className="font-bold text-sm text-white">{category}</h4>
                <ul className="text-sm text-[var(--text-secondary)] mt-1 space-y-1">
                    {sortedPlayers.map(([playerId, stats]) => (
                        <PlayerStatLine key={playerId} player={playerMap.get(playerId)} stats={stats as PlayerStats} statType={statType} />
                    ))}
                </ul>
            </div>
        </div>
    );
};


const QuarterSummaryModal: React.FC = () => {
    const { 
        isQuarterSummaryModalOpen, 
        startNextQuarter, 
        quarterSummaryData, 
        currentQuarter, 
        players, 
        quarterPlaysForSummary, 
        opponentNames, 
        selectedWeek 
    } = useGameState();

    const [aiInsights, setAiInsights] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    
    const isOpen = isQuarterSummaryModalOpen;
    const summaryData = quarterSummaryData;
    const quarter = currentQuarter;
    const quarterPlays = quarterPlaysForSummary;
    const opponentName = opponentNames[selectedWeek] || 'Opponent';

    if (!isOpen) return null;

    const showStats = summaryData !== null;

    const modalTitle = useMemo(() => {
        if (quarter === 1) return "End of 1st Quarter";
        if (quarter === 2) return "Halftime Report";
        if (quarter === 3) return "End of 3rd Quarter";
        if (quarter === 4) return "End of Game Summary";
        return "Quarter Summary";
    }, [quarter]);

    const playerMap = new Map(players.map(p => [p.id, p]));
    const { formationStats, topPerformers } = summaryData || { formationStats: {}, topPerformers: {} };
    
    const sortedFormations = Object.entries(formationStats)
        .sort(([, a], [, b]) => (b as FormationStats).playCount - (a as FormationStats).playCount);
    
    const handleGenerateInsights = async () => {
        setIsGenerating(true);
        setAiError(null);
        setAiInsights(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

            const simplifiedPlays = quarterPlays.map(play => ({
                down: play.down,
                formation: play.formationName,
                playType: play.type,
                result: play.playResult,
                yardsGained: play.yardsGained,
                highlights: play.highlights ?
                    (Object.keys(play.highlights) as (keyof Highlight)[]).reduce((acc: Partial<Record<keyof Highlight, string>>, key) => {
                        const playerId = play.highlights![key];
                        if (playerId) {
                            const player = playerMap.get(playerId) as Player | undefined;
                            if (player) {
                                acc[key] = `#${player.jerseyNumber} ${getLastName(player.name)}`;
                                return acc;
                            }
                        }
                        acc[key] = 'N/A';
                        return acc;
                    }, {})
                : {},
            }));
            
            const period = quarter === 2 ? "the first half" : "the game";

            const prompt = `
                You are an expert junior football coaching assistant. Analyze the following play-by-play data for Cheshire against ${opponentName} for ${period}.

                Your task is to provide a concise, tactical summary for a coach. The summary should be easy to read and focus on actionable insights. Please structure your response with the following sections using markdown formatting (e.g., **Bold Headers**):

                1.  **Offensive Bright Spots:** Identify 1-2 offensive formations or specific plays that were most successful. Mention yards gained or positive outcomes. Name any key players who made significant contributions (e.g., passing, rushing, receiving).

                2.  **Defensive Standouts:** Highlight 1-2 successful defensive outcomes. Mention any key defensive players involved in tackles, sacks, or turnovers.

                3.  **Areas for Improvement:** Point out 1-2 patterns where the team struggled. This could be a specific formation that was ineffective, a type of play the opponent exploited, or a general area needing attention.

                Keep the tone professional and analytical. Use player jersey numbers and last names for clarity.

                Here is the play data in JSON format:
                ${JSON.stringify(simplifiedPlays, null, 2)}
            `;

            const response = await ai.models.generateContent({
              model: 'gemini-3-flash-preview',
              contents: prompt,
            });

            if (!response.text) {
                throw new Error("Received an empty response from the AI.");
            }
            setAiInsights(response.text);
        } catch (e) {
            console.error("Error generating AI insights:", e);
            setAiError("Sorry, there was an error generating insights. Please check your connection and try again.");
        } finally {
            setIsGenerating(false);
        }
    };


    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="glass-effect rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-fade-in">
                <header className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center sticky top-0 bg-transparent z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white">{modalTitle}</h2>
                        {showStats ? (
                            <p className="text-sm text-[var(--text-secondary)]">Review the stats before starting the next period.</p>
                        ) : (
                            <p className="text-sm text-[var(--text-secondary)]">The clock has expired.</p>
                        )}
                    </div>
                    <button onClick={startNextQuarter} className="p-2 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]" aria-label="Close summary">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>

                <main className="flex-grow p-4 overflow-y-auto">
                    {showStats && summaryData && topPerformers ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <section>
                                <h3 className="text-lg font-bold text-white mb-2">Playbook Analytics</h3>
                                <div className="space-y-3">
                                {sortedFormations.length > 0 ? (
                                        sortedFormations.map(([name, stats]) => (
                                            <FormationStatsCard key={name} name={name} stats={stats as FormationStats} />
                                        ))
                                ) : (
                                        <p className="text-sm text-[var(--text-secondary)] text-center py-8">No formations were run.</p>
                                )}
                                </div>
                            </section>
                            <section className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-2">Top Performers</h3>
                                    <div className="space-y-3">
                                        <TopPerformerItem icon={<PassingIcon className="w-6 h-6"/>} category="Passing" playerStats={topPerformers.passers} playerMap={playerMap} statType="yards" />
                                        <TopPerformerItem icon={<RunningIcon className="w-6 h-6"/>} category="Rushing" playerStats={topPerformers.runners} playerMap={playerMap} statType="yards" />
                                        <TopPerformerItem icon={<PassingIcon className="w-6 h-6 transform -scale-x-100 opacity-70"/>} category="Receiving" playerStats={topPerformers.receivers} playerMap={playerMap} statType="yards" />
                                        <TopPerformerItem icon={<RunningIcon className="w-6 h-6 opacity-70"/>} category="Returns" playerStats={topPerformers.returners} playerMap={playerMap} statType="yards" />
                                        <TopPerformerItem icon={<TacklingIcon className="w-6 h-6"/>} category="Tackles" playerStats={topPerformers.tacklers} playerMap={playerMap} statType="count" />
                                        <TopPerformerItem icon={<TurnoverIcon className="w-6 h-6"/>} category="Takeaways" playerStats={topPerformers.interceptors} playerMap={playerMap} statType="count" />
                                        <TopPerformerItem icon={<FieldGoalIcon className="w-6 h-6"/>} category="Kicking" playerStats={topPerformers.kickers} playerMap={playerMap} statType="kicking" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                                        <SparklesIcon className="w-5 h-5 text-[var(--accent-primary)]" />
                                        AI-Powered Insights
                                    </h3>
                                    <div className="bg-[var(--bg-tertiary)] p-3 rounded-lg min-h-[120px] flex flex-col justify-center">
                                        {isGenerating ? (
                                            <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)]">
                                                <SpinnerIcon className="w-5 h-5" />
                                                <span>Generating analysis...</span>
                                            </div>
                                        ) : aiError ? (
                                            <div className="text-red-400 text-sm p-2">{aiError}</div>
                                        ) : aiInsights ? (
                                            <div className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap font-sans w-full prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(aiInsights) }}></div>
                                        ) : (
                                            <button
                                                onClick={handleGenerateInsights}
                                                disabled={quarterPlays.length === 0}
                                                className="mx-auto flex items-center justify-center gap-2 px-4 py-2 bg-[var(--accent-primary)] text-white font-bold rounded-lg hover:bg-[var(--accent-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)] focus:ring-[var(--accent-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <SparklesIcon className="w-4 h-4" />
                                                Generate Insights
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </section>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full min-h-[300px]">
                            <p className="text-xl text-[var(--text-secondary)]">The clock has expired.</p>
                        </div>
                    )}
                </main>

                <footer className="p-4 border-t border-[var(--border-primary)] flex justify-end">
                    <button
                        onClick={startNextQuarter}
                        className="px-6 py-2 bg-[var(--accent-primary)] text-white font-bold rounded-lg hover:bg-[var(--accent-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)] focus:ring-[var(--accent-primary)]"
                    >
                        {quarter < 4 ? `Start ${getOrdinal(quarter + 1)} Quarter` : 'Finalize Game'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default QuarterSummaryModal;
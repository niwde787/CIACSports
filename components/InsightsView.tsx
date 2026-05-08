import React, { useState, useMemo } from 'react';
import { Player, Play, Highlight, PlayResult, Drive, PlayerStats, AiSummary } from '../types';
import { SpinnerIcon, SparklesIcon } from './icons';
import { GoogleGenAI, Type } from "@google/genai";
import { getLastName, calculateDrives, parseGameTime, formatTime, parseSimpleMarkdown } from '../utils';
import DriveChart from './DriveChart';
import GameMomentumChart from './GameMomentumChart';
import { useGameState } from '../contexts/GameStateContext';

const TeamStatRow: React.FC<{ label: string; ourValue: string | number; oppValue: string | number; invertColors?: boolean }> = ({ label, ourValue, oppValue, invertColors = false }) => {
    const ourValNum = typeof ourValue === 'number' ? ourValue : parseFloat(ourValue);
    const oppValNum = typeof oppValue === 'number' ? oppValue : parseFloat(oppValue) || 0;
    const total = ourValNum + oppValNum;
    
    const ourWidth = total > 0 ? (ourValNum / total) * 100 : (ourValNum > 0 ? 100 : (oppValNum > 0 ? 0 : 50));
    
    const isOurBetter = invertColors ? ourValNum < oppValNum : ourValNum > oppValNum;
    const isOppBetter = invertColors ? ourValNum > oppValNum : ourValNum < oppValNum;
    const isEqual = ourValNum === oppValNum;

    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className={`font-mono font-bold text-lg ${isOurBetter ? 'text-white' : 'text-[var(--text-secondary)]'}`}>{ourValue}</span>
                <span className="text-sm text-[var(--text-secondary)]">{label}</span>
                <span className={`font-mono font-bold text-lg ${isOppBetter ? 'text-white' : 'text-[var(--text-secondary)]'}`}>{oppValue}</span>
            </div>
            <div className="flex h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                <div className={`transition-all duration-500 ${isOurBetter && !isEqual ? 'bg-[var(--accent-primary)]' : 'bg-[var(--border-primary)]'}`} style={{ width: `${ourWidth}%` }}></div>
                <div className={`transition-all duration-500 ${isOppBetter && !isEqual ? 'bg-[var(--accent-special)]' : 'bg-[var(--border-primary)]'}`} style={{ width: `${100 - ourWidth}%` }}></div>
            </div>
        </div>
    );
};

const InsightCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-[var(--bg-tertiary)] p-4 rounded-lg">
        <h4 className="text-md font-bold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-2 mb-3">{title}</h4>
        {children}
    </div>
);

const InsightsView: React.FC = () => {
    const { playHistory, players, opponentNames, selectedWeek, fieldLogoUrl, ourStats, opponentStats, teamName, aiSummary, setAiSummary } = useGameState();
    const opponentName = opponentNames[selectedWeek];

    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [summaryError, setSummaryError] = useState<string | null>(null);
    const [activeInsightTab, setActiveInsightTab] = useState<'stats' | 'charts' | 'summary'>('stats');
    
    const playerMap = useMemo(() => new Map(players.map(p => [p.id, p])), [players]);
    const allDrives = useMemo(() => calculateDrives(playHistory), [playHistory]);

    const handleGenerateSummary = async () => {
        setIsGeneratingSummary(true);
        setSummaryError(null);
        setAiSummary(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

            const simplifiedPlays = playHistory.map(play => ({ quarter: play.quarter, down: play.down, formation: play.formationName, playType: play.type, result: play.playResult, yardsGained: play.yardsGained, highlights: play.highlights ? (Object.keys(play.highlights) as (keyof Highlight)[]).reduce((acc: Partial<Record<keyof Highlight, string>>, key) => { const playerId = play.highlights![key]; if (playerId) { const player = playerMap.get(playerId); if (player) { acc[key] = `#${player.jerseyNumber} ${getLastName(player.name)}`; return acc; } } acc[key] = 'N/A'; return acc; }, {}) : {} }));

            const prompt = `
                You are an expert football coaching analyst. Analyze the provided play-by-play data for the team "${teamName}" against "${opponentName}".

                Your task is to provide a comprehensive, tactical summary for a coach in five distinct parts. The output must be a valid JSON object matching the provided schema.

                1.  **gameBreakdown**: A general overview of the game flow in markdown format. Discuss key moments, scoring drives, and the overall narrative.
                2.  **impactPlays**: An array of 2-4 of the most game-changing plays. For each play, provide a concise description, the quarter, game time, and the result.
                3.  **thingsToWorkOn**: A markdown-formatted list of 2-3 specific, actionable areas for improvement based on patterns in the data (e.g., struggling against a certain play type, penalties, ineffective formations).
                4.  **formationAnalysis**: A markdown-formatted analysis of the most and least efficient formations for both offense and defense.
                5.  **playerHighlights**: A markdown-formatted summary of standout individual player contributions (positive or negative).

                Keep the tone professional and analytical.

                Here is the play data in JSON format:
                ${JSON.stringify(simplifiedPlays, null, 2)}
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            gameBreakdown: { type: Type.STRING },
                            impactPlays: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        playDescription: { type: Type.STRING },
                                        quarter: { type: Type.NUMBER },
                                        gameTime: { type: Type.STRING },
                                        result: { type: Type.STRING }
                                    }
                                }
                            },
                            thingsToWorkOn: { type: Type.STRING },
                            formationAnalysis: { type: Type.STRING },
                            playerHighlights: { type: Type.STRING }
                        }
                    }
                }
            });
            if (!response.text) throw new Error("Received an empty response from the AI.");
            const jsonResponse = JSON.parse(response.text) as AiSummary;
            setAiSummary(jsonResponse);
        } catch (e) {
            console.error("Error generating AI summary:", e);
            setSummaryError("AI summary is currently unavailable. Please check your API key and network connection.");
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    const handleDriveJump = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const driveId = event.target.value;
        if (driveId) {
            const element = document.getElementById(driveId);
            if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const formatEfficiency = (conversions: number, attempts: number) => {
        const conv = conversions || 0;
        const att = attempts || 0;
        if (att === 0) return '0/0 (0%)';
        const percent = Math.round((conv / att) * 100);
        return `${conv}/${att} (${percent}%)`;
    };
    
    const inactiveTabClass = "border-transparent text-[var(--text-secondary)] hover:text-white";
    const activeTabClass = "border-[var(--accent-primary)] text-[var(--accent-primary)]";

    return (
        <div className="bg-[var(--bg-secondary)] shadow-2xl border border-[var(--border-primary)]">
            <div className="p-4 border-b border-[var(--border-primary)]">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">Insights</h2>
            </div>
            
            <div className="px-4 border-b border-[var(--border-primary)] flex">
                <button onClick={() => setActiveInsightTab('stats')} className={`py-3 px-4 font-bold border-b-2 transition-colors duration-200 text-sm ${activeInsightTab === 'stats' ? activeTabClass : inactiveTabClass}`}>Team Stats</button>
                <button onClick={() => setActiveInsightTab('charts')} className={`py-3 px-4 font-bold border-b-2 transition-colors duration-200 text-sm ${activeInsightTab === 'charts' ? activeTabClass : inactiveTabClass}`}>Drive Chart</button>
                <button onClick={() => setActiveInsightTab('summary')} className={`py-3 px-4 font-bold border-b-2 transition-colors duration-200 text-sm ${activeInsightTab === 'summary' ? activeTabClass : inactiveTabClass}`}>AI Tactical Breakdown</button>
            </div>

            <div className="p-4">
                {activeInsightTab === 'charts' && (
                    <div className="bg-[var(--bg-primary)] p-4 rounded-lg">
                        {allDrives.length > 0 && (
                            <div className="mb-4">
                                <label htmlFor="drive-jump" className="text-sm font-medium text-[var(--text-secondary)] mr-2">Jump to Drive:</label>
                                <select id="drive-jump" onChange={handleDriveJump} className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm rounded-md p-2 focus:ring-1 focus:ring-[var(--accent-primary)]">
                                    <option value="">Select a Drive...</option>
                                    {allDrives.map(drive => (
                                        <option key={drive.driveNumber} value={`drive-chart-${drive.driveNumber}`}>Drive #{drive.driveNumber} ({drive.summary.playCount} plays, {drive.summary.yards > 0 ? '+' : ''}{drive.summary.yards} yds)</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="flex flex-col items-center justify-start gap-6 max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
                            {allDrives.length > 0 ? (
                                allDrives.map(drive => (
                                    <div key={drive.driveNumber} id={`drive-chart-${drive.driveNumber}`} className="w-full bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-primary)]">
                                        <div className="flex justify-between items-baseline mb-2 flex-wrap gap-x-4">
                                            <h4 className="font-bold text-lg text-[var(--text-primary)]">Drive #{drive.driveNumber}</h4>
                                            <p className="text-xs text-[var(--text-secondary)] font-mono">{drive.summary.playCount} plays | {drive.summary.yards > 0 ? '+' : ''}{drive.summary.yards} yds | {drive.summary.timeOfPossession}</p>
                                        </div>
                                        <p className="text-sm text-[var(--text-secondary)] mb-3"><span className="font-semibold">Result:</span> {drive.summary.result}</p>
                                        <DriveChart drivePlays={drive.plays.map(p => p.play)} fieldLogoUrl={fieldLogoUrl} players={players} />
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center text-[var(--text-secondary)] py-16">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    <p className="text-sm">No drive data to visualize.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {activeInsightTab === 'stats' && (
                    <div>
                        <GameMomentumChart playHistory={playHistory} teamName={teamName} opponentName={opponentName} />
                        <div className="flex justify-between items-baseline mb-3">
                            <h3 className="text-lg font-bold text-white">Team Stats</h3>
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[var(--accent-primary)]"></span> {teamName}</div>
                                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[var(--accent-special)]"></span> {opponentName}</div>
                            </div>
                        </div>
                        <div className="bg-[var(--bg-primary)] p-4 rounded-lg space-y-4">
                            <TeamStatRow label="First Downs" ourValue={ourStats.firstDowns} oppValue={opponentStats.firstDowns} />
                            <TeamStatRow label="Total Yards" ourValue={ourStats.totalYards} oppValue={opponentStats.totalYards} />
                            <TeamStatRow label="3rd Down Eff." ourValue={formatEfficiency(ourStats.thirdDownConversions, ourStats.thirdDownAttempts)} oppValue={formatEfficiency(opponentStats.thirdDownConversions, opponentStats.thirdDownAttempts)} />
                            <TeamStatRow label="4th Down Eff." ourValue={formatEfficiency(ourStats.fourthDownConversions, ourStats.fourthDownAttempts)} oppValue={formatEfficiency(opponentStats.fourthDownConversions, opponentStats.fourthDownAttempts)} />
                            <TeamStatRow label="PAT Eff." ourValue={formatEfficiency(ourStats.patConversions, ourStats.patAttempts)} oppValue={formatEfficiency(opponentStats.patConversions, opponentStats.patAttempts)} />
                            <TeamStatRow label="Turnovers" ourValue={ourStats.turnovers} oppValue={opponentStats.turnovers} invertColors={true} />
                            <TeamStatRow label="Penalties / Yards" ourValue={`${ourStats.penalties} / ${ourStats.penaltyYards}`} oppValue={`${opponentStats.penalties} / ${opponentStats.penaltyYards}`} invertColors={true} />
                            <TeamStatRow label="Time of Possession" ourValue={formatTime(ourStats.timeOfPossession)} oppValue={formatTime(opponentStats.timeOfPossession)} />
                        </div>
                    </div>
                )}
                {activeInsightTab === 'summary' && (
                    <div className="bg-[var(--bg-primary)] p-4 rounded-lg min-h-[400px] flex flex-col">
                        {isGeneratingSummary ? (
                            <div className="flex-grow flex items-center justify-center">
                                <div className="text-center">
                                    <SpinnerIcon className="w-10 h-10 text-[var(--accent-primary)] mx-auto" />
                                    <p className="mt-2 font-semibold text-[var(--text-primary)]">Generating AI Summary...</p>
                                    <p className="text-sm text-[var(--text-secondary)]">This may take a moment.</p>
                                </div>
                            </div>
                        ) : summaryError ? (
                            <div className="flex-grow flex items-center justify-center">
                                <div className="text-center text-red-400 bg-red-900/40 p-4 rounded-lg"><p className="font-bold">Error</p><p>{summaryError}</p></div>
                            </div>
                        ) : aiSummary ? (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-6">
                                    <InsightCard title="Game Breakdown">
                                        <div className="prose prose-sm prose-invert max-w-none text-[var(--text-secondary)]" dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(aiSummary.gameBreakdown) }}></div>
                                    </InsightCard>
                                    <InsightCard title="Things to Work On">
                                        <div className="prose prose-sm prose-invert max-w-none text-[var(--text-secondary)]" dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(aiSummary.thingsToWorkOn) }}></div>
                                    </InsightCard>
                                    <InsightCard title="Formation Analysis">
                                         <div className="prose prose-sm prose-invert max-w-none text-[var(--text-secondary)]" dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(aiSummary.formationAnalysis) }}></div>
                                    </InsightCard>
                                </div>
                                <div className="lg:col-span-1 space-y-6">
                                    <InsightCard title="Impact Plays">
                                        <ul className="space-y-3">
                                            {(aiSummary.impactPlays || []).slice(0, 5).map((play, index) => (
                                                <li key={index} className="bg-[var(--bg-secondary)] p-2 rounded-md">
                                                    <p className="text-xs text-[var(--text-secondary)] font-semibold">Q{play.quarter} - {play.gameTime}</p>
                                                    <p className="text-sm font-medium text-[var(--text-primary)] mt-1">{play.playDescription}</p>
                                                     <p className="text-xs text-[var(--accent-primary)] mt-1 font-bold">{play.result}</p>
                                                </li>
                                            ))}
                                        </ul>
                                    </InsightCard>
                                    <InsightCard title="Player Highlights">
                                        <div className="prose prose-sm prose-invert max-w-none text-[var(--text-secondary)]" dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(aiSummary.playerHighlights) }}></div>
                                    </InsightCard>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-grow flex items-center justify-center">
                                <div className="text-center">
                                    <SparklesIcon className="w-12 h-12 text-[var(--accent-primary)] mx-auto" />
                                    <h3 className="mt-2 text-lg font-bold text-[var(--text-primary)]">Get a Tactical Breakdown</h3>
                                    <p className="mt-1 text-sm text-[var(--text-secondary)] max-w-md">Let AI analyze the full game's play-by-play data to generate actionable insights, identify trends, and highlight key performers.</p>
                                    <button onClick={handleGenerateSummary} disabled={playHistory.length === 0} className="mt-4 flex items-center justify-center gap-2 px-6 py-2 bg-[var(--accent-primary)] text-white font-bold rounded-lg hover:bg-[var(--accent-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)] focus:ring-[var(--accent-primary)] disabled:opacity-50 disabled:cursor-not-allowed mx-auto">
                                        <SparklesIcon className="w-5 h-5" /> Generate Game Summary
                                    </button>
                                    {playHistory.length === 0 && <p className="text-xs text-[var(--text-secondary)] mt-2">No plays recorded yet.</p>}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default InsightsView;
import React, { useMemo } from 'react';
import { Player, QuarterSummaryData, PlayerStats, PlayResult, FormationStats, Play, PlayerContribution, PlayType } from '../types';
import { getLastName, formatTime } from '../utils';
import Scoreboard from './Scoreboard';
import { useGameState } from '../contexts/GameStateContext';
import { SpinnerIcon, CalendarIcon, TrophyIcon } from './icons';
import { DEFAULT_PLAYER_IMAGE } from '../constants';

const getParticipationGroup = (percentage: number) => {
    if (percentage >= 100) return { borderColor: 'border-emerald-400', bgColor: 'bg-emerald-500/10', progressColor: 'bg-emerald-400' };
    if (percentage >= 75) return { borderColor: 'border-green-400', bgColor: 'bg-green-500/10', progressColor: 'bg-green-400' };
    if (percentage >= 50) return { borderColor: 'border-yellow-400', bgColor: 'bg-yellow-500/10', progressColor: 'bg-yellow-400' };
    if (percentage >= 25) return { borderColor: 'border-orange-400', bgColor: 'bg-orange-500/10', progressColor: 'bg-orange-400' };
    return { borderColor: 'border-red-400', bgColor: 'bg-red-500/10', progressColor: 'bg-red-400' };
};

export const SnapsRankingCard: React.FC<{ players: Player[]; playHistory: Play[]; }> = ({ players, playHistory }) => {
    const totalPlays = playHistory.length;
    const rankedPlayers = useMemo(() => {
        const playerStats = new Map<string, { offense: number, defense: number, special: number }>();
        playHistory.forEach(play => {
            play.playerIds.forEach(playerId => {
                const stats = playerStats.get(playerId) || { offense: 0, defense: 0, special: 0 };
                if (play.type === PlayType.Offense) stats.offense++;
                else if (play.type === PlayType.Defense) stats.defense++;
                else if (play.type === PlayType.SpecialTeams) stats.special++;
                playerStats.set(playerId, stats);
            });
        });

        return [...players]
            .map(p => {
                const stats = playerStats.get(p.id) || { offense: 0, defense: 0, special: 0 };
                const playerTotalPlays = stats.offense + stats.defense + stats.special;
                const participation = totalPlays > 0 ? Math.round((playerTotalPlays / totalPlays) * 100) : 0;
                return { ...p, totalPlays: playerTotalPlays, participation };
            })
            .filter(p => p.totalPlays > 0)
            .sort((a, b) => b.totalPlays - a.totalPlays)
            .slice(0, 5);
    }, [players, playHistory, totalPlays]);

    return (
        <div className="bg-[var(--bg-primary)] rounded-lg p-3 h-auto flex flex-col border border-[var(--border-primary)]/50">
            <h3 className="text-sm font-bold text-[var(--logo-color)] border-b border-[var(--border-primary)] pb-1.5 mb-2 flex-shrink-0 uppercase tracking-wider">Snaps Ranking</h3>
            {rankedPlayers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-4 text-center text-[var(--text-secondary)]">
                    <TrophyIcon className="h-8 w-8 mb-1" />
                    <p className="text-xs">No plays run yet.</p>
                </div>
            ) : (
                <ul className="space-y-1.5">
                    {rankedPlayers.map((player, index) => {
                        const group = getParticipationGroup(player.participation);
                        return (
                             <li key={player.id} className={`flex items-center gap-2 p-1.5 rounded-md border-l-2 ${group.borderColor} ${group.bgColor}`}>
                                <span className="font-bold text-sm text-[var(--text-secondary)] w-4 text-center">{index + 1}</span>
                                <img className="h-7 w-7 rounded-full object-cover border border-white/10" src={player.imageUrl || DEFAULT_PLAYER_IMAGE} alt="" />
                                <div className="flex-grow min-w-0">
                                    <div className="flex justify-between items-baseline">
                                        <p className="font-semibold truncate text-xs text-[var(--text-primary)]">#{player.jerseyNumber} {getLastName(player.name)}</p>
                                        <span className="font-mono font-bold text-sm text-[var(--text-primary)]">{player.totalPlays}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div className="w-full bg-black/20 rounded-full h-1">
                                            <div className={`${group.progressColor} h-1 rounded-full`} style={{ width: `${player.participation}%` }}></div>
                                        </div>
                                        <span className="font-mono text-[10px] w-8 text-right text-[var(--text-secondary)]">{player.participation}%</span>
                                    </div>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    );
};

export const FormationEfficiencyCard: React.FC<{ formationStats: Record<string, FormationStats> }> = ({ formationStats }) => {
    const sortedFormations = (Object.entries(formationStats) as [string, FormationStats][]).sort(([, a], [, b]) => b.playCount - a.playCount).slice(0, 5);
    return (
        <div className="bg-[var(--bg-primary)] rounded-lg p-3 h-auto flex flex-col border border-[var(--border-primary)]/50">
            <h3 className="text-sm font-bold text-[var(--logo-color)] border-b border-[var(--border-primary)] pb-1.5 mb-2 flex-shrink-0 uppercase tracking-wider">Formation Efficiency</h3>
            {sortedFormations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-4 text-center text-[var(--text-secondary)]">
                    <TrophyIcon className="h-8 w-8 mb-1" />
                    <p className="text-xs">No data yet.</p>
                </div>
            ) : (
                <ul className="space-y-1.5">
                    {sortedFormations.map(([name, stats]) => {
                        const isKickingFormation = name.toLowerCase().includes('pat') || name.toLowerCase().includes('p.a.t') || name.toLowerCase().includes('field goal');
                        
                        if (isKickingFormation && stats.attempts && stats.attempts > 0) {
                            const successRate = Math.round(((stats.makes || 0) / stats.attempts) * 100);
                            return (
                                <li key={name} className="bg-[var(--bg-secondary)] p-1.5 rounded-md border border-[var(--border-primary)]/30">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-[var(--text-primary)] truncate pr-2">{name}</span>
                                        <div className="text-right flex items-center gap-2 flex-shrink-0">
                                            <span className={`font-mono text-xs font-bold text-green-400`}>+{stats.pointsScored}p</span>
                                            <span className="text-[10px] text-[var(--text-secondary)] font-mono">({stats.attempts} att)</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center mt-0.5">
                                        <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-1 mr-2"><div className="bg-[var(--accent-primary)] h-1 rounded-full" style={{ width: `${successRate}%` }}></div></div>
                                        <span className="text-[10px] font-mono font-bold text-[var(--accent-primary)]">{`${stats.makes || 0}/${stats.attempts}`}</span>
                                    </div>
                                </li>
                            );
                        }

                        const successRate = stats.playCount > 0 ? Math.round((stats.positivePlays / stats.playCount) * 100) : 0;
                        const yardsColor = stats.totalYards > 0 ? 'text-green-400' : stats.totalYards < 0 ? 'text-red-400' : 'text-gray-300';
                        return (
                            <li key={name} className="bg-[var(--bg-secondary)] p-1.5 rounded-md border border-[var(--border-primary)]/30">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-bold text-[var(--text-primary)] truncate pr-2">{name}</span>
                                    <div className="text-right flex items-center gap-2 flex-shrink-0">
                                        <span className={`font-mono text-xs font-bold ${yardsColor}`}>{stats.totalYards > 0 ? `+${stats.totalYards}` : stats.totalYards}y</span>
                                        <span className="text-[10px] text-[var(--text-secondary)] font-mono">({stats.playCount} pl)</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mt-0.5">
                                    <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-1 mr-2"><div className="bg-[var(--accent-primary)] h-1 rounded-full" style={{ width: `${successRate}%` }}></div></div>
                                    <span className="text-[10px] font-mono font-bold text-[var(--accent-primary)]">{successRate}%</span>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

const TeamStatRow: React.FC<{ label: string; ourValue: string | number; oppValue: string | number; invertColors?: boolean }> = ({ label, ourValue, oppValue, invertColors = false }) => {
    const ourValNum = typeof ourValue === 'number' ? ourValue : parseFloat(ourValue) || 0;
    const oppValNum = typeof oppValue === 'number' ? oppValue : parseFloat(oppValue) || 0;
    const total = ourValNum + oppValNum;
    
    const ourWidth = total > 0 ? (ourValNum / total) * 100 : (ourValNum > 0 ? 100 : (oppValNum > 0 ? 0 : 50));
    
    const isOurBetter = invertColors ? ourValNum < oppValNum : ourValNum > oppValNum;
    const isOppBetter = invertColors ? ourValNum > oppValNum : ourValNum < oppValNum;
    const isEqual = ourValNum === oppValNum;

    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className={`font-mono font-bold text-base ${isOurBetter ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{ourValue}</span>
                <span className="text-xs text-[var(--text-secondary)]">{label}</span>
                <span className={`font-mono font-bold text-base ${isOppBetter ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{oppValue}</span>
            </div>
            <div className="flex h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                <div className={`transition-all duration-500 ${isOurBetter && !isEqual ? 'bg-[var(--accent-primary)]' : 'bg-[var(--border-primary)]'}`} style={{ width: `${ourWidth}%` }}></div>
                <div className={`transition-all duration-500 ${isOppBetter && !isEqual ? 'bg-[var(--accent-special)]' : 'bg-[var(--border-primary)]'}`} style={{ width: `${100 - ourWidth}%` }}></div>
            </div>
        </div>
    );
};

export const TeamStatsComparisonCard: React.FC<{ ourStats: any; opponentStats: any; opponentName: string; teamName: string; }> = ({ ourStats, opponentStats, opponentName, teamName }) => {
    const formatEfficiency = (conversions: number, attempts: number) => {
        const conv = conversions || 0;
        const att = attempts || 0;
        if (att === 0) return '0/0 (0%)';
        const percent = Math.round((conv / att) * 100);
        return `${conv}/${att} (${percent}%)`;
    };
    
    return (
        <div className="bg-[var(--bg-primary)] rounded-lg p-3 h-auto flex flex-col border border-[var(--border-primary)]/50">
            <div className="flex-shrink-0 border-b border-[var(--border-primary)] pb-1.5 mb-2">
                <h3 className="text-sm font-bold text-[var(--logo-color)] uppercase tracking-wider">Team Comparison</h3>
                <div className="flex items-center justify-between gap-4 text-[10px] font-semibold mt-0.5">
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]"></span> {teamName}</div>
                    <div className="flex items-center gap-1.5">{opponentName} <span className="w-2 h-2 rounded-full bg-[var(--accent-special)]"></span></div>
                </div>
            </div>
            {(ourStats.totalYards === 0 && opponentStats.totalYards === 0) ? (
                 <div className="flex flex-col items-center justify-center py-4 text-center text-[var(--text-secondary)]"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg><p className="text-xs">No stats yet.</p></div>
            ) : (
                <div className="space-y-2.5">
                    <TeamStatRow label="Total Yards" ourValue={ourStats.totalYards} oppValue={opponentStats.totalYards} />
                    <TeamStatRow label="3rd Down" ourValue={formatEfficiency(ourStats.thirdDownConversions, ourStats.thirdDownAttempts)} oppValue={formatEfficiency(opponentStats.thirdDownConversions, opponentStats.thirdDownAttempts)} />
                    <TeamStatRow label="4th Down" ourValue={formatEfficiency(ourStats.fourthDownConversions, ourStats.fourthDownAttempts)} oppValue={formatEfficiency(opponentStats.fourthDownConversions, opponentStats.fourthDownAttempts)} />
                    <TeamStatRow label="PAT" ourValue={formatEfficiency(ourStats.patConversions, ourStats.patAttempts)} oppValue={formatEfficiency(opponentStats.patConversions, opponentStats.patAttempts)} />
                    <TeamStatRow label="Turnovers" ourValue={ourStats.turnovers} oppValue={opponentStats.turnovers} invertColors={true} />
                    <TeamStatRow label="Penalties" ourValue={ourStats.penalties} oppValue={opponentStats.penalties} invertColors={true} />
                    <TeamStatRow label="Time of Poss." ourValue={formatTime(ourStats.timeOfPossession)} oppValue={formatTime(opponentStats.timeOfPossession)} />
                </div>
            )}
        </div>
    );
};

export const PlayerStatLine: React.FC<{ player: Player | undefined; stats: PlayerStats; statType: 'yards' | 'count' | 'kicking'; }> = ({ player, stats, statType }) => {
    if (!player) return null;
    let statDisplay = '';
    switch (statType) {
        case 'yards': statDisplay = `${stats.count} for ${stats.yards > 0 ? '+' : ''}${stats.yards}y`; break;
        case 'kicking': statDisplay = `${stats.makes || 0}/${stats.attempts || 0} FG`; break;
        default: statDisplay = `${stats.count} tot`; break;
    }
    return ( <li className="flex justify-between items-center bg-[var(--bg-secondary)] p-1.5 rounded-md border border-[var(--border-primary)]/20"> <div className="flex items-center gap-1.5"> <img className="h-6 w-6 rounded-full object-cover border border-white/5" src={player.imageUrl || DEFAULT_PLAYER_IMAGE} alt="" /> <span className="font-semibold text-xs text-[var(--text-primary)]">#{player.jerseyNumber} {getLastName(player.name)}</span> </div> <span className="font-bold text-[var(--text-primary)] font-mono text-xs">{statDisplay}</span> </li> );
};

export const TopPerformersList: React.FC<{ playerStats: QuarterSummaryData['topPerformers'][keyof QuarterSummaryData['topPerformers']]; playerMap: Map<string, Player>; statType: 'yards' | 'count' | 'kicking'; title: string; }> = ({ playerStats, playerMap, statType, title }) => {
    const sortedPlayers = Object.entries(playerStats).sort(([, a], [, b]) => { const statsA = a as PlayerStats; const statsB = b as PlayerStats; if (statType === 'yards') { if (statsB.yards !== statsA.yards) return statsB.yards - statsA.yards; } if (statType === 'kicking') { if ((statsB.makes || 0) !== (statsA.makes || 0)) return (statsB.makes || 0) - (statsA.makes || 0); } return statsB.count - statsA.count; }).slice(0, 5);
    if (sortedPlayers.length === 0) return ( <div> <h4 className="font-bold text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mb-1">{title}</h4> <p className="text-[10px] text-center py-2 text-[var(--text-secondary)]">No data.</p> </div> )
    return ( <div> <h4 className="font-bold text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">{title}</h4> <ul className="space-y-1"> {sortedPlayers.map(([playerId, stats]) => ( <PlayerStatLine key={playerId} player={playerMap.get(playerId)} stats={stats as PlayerStats} statType={statType} /> ))} </ul> </div> );
}

export const PassingStatsCard: React.FC<{ topPerformers: QuarterSummaryData['topPerformers']; playerMap: Map<string, Player> }> = ({ topPerformers, playerMap }) => ( <div className="bg-[var(--bg-primary)] rounded-lg p-3 h-auto flex flex-col border border-[var(--border-primary)]/50"> <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-1.5 mb-2 flex-shrink-0 uppercase tracking-wider">Passing</h3> <div className="space-y-3 flex-grow flex flex-col justify-center"> <TopPerformersList playerStats={topPerformers.passers} playerMap={playerMap} statType="yards" title="Top Passers" /> </div> </div> );

export const RushingStatsCard: React.FC<{ topPerformers: QuarterSummaryData['topPerformers']; playerMap: Map<string, Player> }> = ({ topPerformers, playerMap }) => ( <div className="bg-[var(--bg-primary)] rounded-lg p-3 h-auto flex flex-col border border-[var(--border-primary)]/50"> <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-1.5 mb-2 flex-shrink-0 uppercase tracking-wider">Rushing</h3> <div className="space-y-3 flex-grow flex flex-col justify-center"> <TopPerformersList playerStats={topPerformers.runners} playerMap={playerMap} statType="yards" title="Top Rushers" /> </div> </div> );

export const ReceivingStatsCard: React.FC<{ topPerformers: QuarterSummaryData['topPerformers']; playerMap: Map<string, Player> }> = ({ topPerformers, playerMap }) => {
    return (
        <div className="bg-[var(--bg-primary)] rounded-lg p-3 h-auto flex flex-col border border-[var(--border-primary)]/50">
            <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-1.5 mb-2 flex-shrink-0 uppercase tracking-wider">Receiving</h3>
            <div className="space-y-3 flex-grow flex flex-col justify-center">
                <TopPerformersList playerStats={topPerformers.receivers} playerMap={playerMap} statType="yards" title="Top Receivers" />
            </div>
        </div>
    );
};

export const DefensiveStatsCard: React.FC<{ topPerformers: QuarterSummaryData['topPerformers']; playerMap: Map<string, Player> }> = ({ topPerformers, playerMap }) => ( 
    <div className="bg-[var(--bg-primary)] rounded-lg p-3 h-auto flex flex-col border border-[var(--border-primary)]/50"> 
        <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-1.5 mb-2 flex-shrink-0 uppercase tracking-wider">Defense</h3> 
        <div className="space-y-3 flex-grow flex flex-col justify-center"> 
            <TopPerformersList playerStats={topPerformers.tacklers} playerMap={playerMap} statType="count" title="Top Tacklers" /> 
        </div> 
    </div> 
);

export const InterceptionStatsCard: React.FC<{ topPerformers: QuarterSummaryData['topPerformers']; playerMap: Map<string, Player> }> = ({ topPerformers, playerMap }) => ( 
    <div className="bg-[var(--bg-primary)] rounded-lg p-3 h-auto flex flex-col border border-[var(--border-primary)]/50"> 
        <h3 className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border-primary)] pb-1.5 mb-2 flex-shrink-0 uppercase tracking-wider">Interceptions</h3> 
        <div className="space-y-3 flex-grow flex flex-col justify-center"> 
            <TopPerformersList playerStats={topPerformers.interceptors} playerMap={playerMap} statType="count" title="Top Interceptors" /> 
        </div> 
    </div> 
);

export const ScoringSummaryCard: React.FC<{ playHistory: Play[] }> = ({ playHistory }) => {
    const scoringPlays = useMemo(() => {
        const scoringResults = [
            PlayResult.PassTouchdown, PlayResult.RunTouchdown, PlayResult.FieldGoalGood, 
            PlayResult.PATGood, PlayResult.PAT_2pt_KickGood, PlayResult.TwoPointConversion_Pass_Good, 
            PlayResult.TwoPointConversion_Run_Good, PlayResult.OffensiveSafety, PlayResult.DefensiveSafety,
            PlayResult.OffensiveFumbleRecoveryTD, PlayResult.InterceptionReturnTD, PlayResult.FumbleReturnTD,
            PlayResult.KickReturnTD, PlayResult.PuntReturnTD, PlayResult.OpponentTouchdownRun,
            PlayResult.OpponentTouchdownPass, PlayResult.OpponentPAT1ptGood, PlayResult.OpponentPAT2ptGood
        ];
        
        return playHistory.filter(p => scoringResults.includes(p.playResult as PlayResult)).slice(-5).reverse();
    }, [playHistory]);

    return (
        <div className="bg-[var(--bg-primary)] rounded-lg p-3 h-auto flex flex-col border border-[var(--border-primary)]/50">
            <h3 className="text-sm font-bold text-[var(--logo-color)] border-b border-[var(--border-primary)] pb-1.5 mb-2 flex-shrink-0 uppercase tracking-wider">Scoring Summary</h3>
            {scoringPlays.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-4 text-center text-[var(--text-secondary)]">
                    <p className="text-xs">No scoring plays yet.</p>
                </div>
            ) : (
                <ul className="space-y-1.5">
                    {scoringPlays.map((play, idx) => (
                        <li key={idx} className="flex justify-between items-center bg-[var(--bg-secondary)] p-1.5 rounded-md border border-[var(--border-primary)]/20">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-[var(--accent-primary)] uppercase">Q{play.quarter} - {play.playResult}</span>
                                <span className="text-[11px] text-[var(--text-primary)] font-medium truncate max-w-[120px]">{play.formationName}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-black text-white tabular-nums">{play.ourScore}-{play.opponentScore}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const WeekDashboard: React.FC = () => {
    const { players, playHistory, gameSummaryData, opponentNames, selectedWeek, ourStats, opponentStats, isWeekLoading, teamName, seasonWeeks, setIsWeekSelectorModalOpen, weekDates, homeAwayStatus, handleWeekChange, handleTabChange } = useGameState();
    const opponentName = opponentNames[selectedWeek] || 'Opponent';
    const playerMap = useMemo(() => new Map(players.map(p => [p.id, p])), [players]);
    const totalPlays = playHistory.length;
    
    const nextGame = useMemo(() => {
        if (!seasonWeeks || seasonWeeks.length === 0) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const nextGameIndex = seasonWeeks.findIndex(week => {
            const gameDateStr = weekDates[week];
            if (!gameDateStr) return false;
            const gameDate = new Date(gameDateStr + 'T00:00:00');
            return gameDate >= today;
        });

        if (nextGameIndex === -1) {
            return null;
        }
        
        const nextGameWeek = seasonWeeks[nextGameIndex];
        
        return {
            week: nextGameWeek,
            opponent: opponentNames[nextGameWeek] || 'OPP',
            date: weekDates[nextGameWeek],
            homeAway: homeAwayStatus[nextGameWeek] || 'Home',
            displayWeek: `WK${nextGameIndex + 1}`,
        };
    }, [seasonWeeks, weekDates, opponentNames, homeAwayStatus]);

    const displaySummaryData = useMemo(() => {
        return gameSummaryData || {
            formationStats: {},
            topPerformers: { passers: {}, receivers: {}, runners: {}, tacklers: {}, interceptors: {}, kickers: {}, returners: {} }
        };
    }, [gameSummaryData]);

    if (isWeekLoading) {
        return (
             <div className="bg-[var(--bg-secondary)] shadow-2xl border border-[var(--border-primary)]">
                <Scoreboard />
                <div className="p-8 text-center text-[var(--text-secondary)] flex items-center justify-center gap-2 h-96">
                    <SpinnerIcon className="w-6 h-6" />
                    <span className="text-lg">Loading statistics...</span>
                </div>
            </div>
        )
    }

    if (!isWeekLoading && seasonWeeks.length === 0) {
        return (
            <div className="bg-[var(--bg-secondary)] shadow-2xl border border-[var(--border-primary)]">
                <Scoreboard />
                <div className="p-8 text-center text-[var(--text-secondary)] flex flex-col items-center justify-center gap-4 h-96">
                    <CalendarIcon className="w-16 h-16 text-gray-500" />
                    <h2 className="text-xl font-bold text-white">No Events Scheduled</h2>
                    <p>Your calendar is empty. Go to the calendar to add your first game or practice.</p>
                    <button onClick={() => setIsWeekSelectorModalOpen(true)} className="mt-2 px-4 py-2 bg-[var(--accent-primary)] text-white font-bold rounded-lg hover:bg-[var(--accent-primary-hover)]">
                        Open Calendar
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-[var(--bg-secondary)] shadow-2xl border border-[var(--border-primary)] overflow-hidden h-full flex flex-col no-scrollbar">
            <Scoreboard />
            <div className="p-2 sm:p-3 flex-grow overflow-y-auto no-scrollbar space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <SnapsRankingCard players={players} playHistory={playHistory} />
                    <FormationEfficiencyCard formationStats={displaySummaryData.formationStats} />
                    <TeamStatsComparisonCard ourStats={ourStats} opponentStats={opponentStats} opponentName={opponentName} teamName={teamName} />
                    <ScoringSummaryCard playHistory={playHistory} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    <PassingStatsCard topPerformers={displaySummaryData.topPerformers} playerMap={playerMap} />
                    <RushingStatsCard topPerformers={displaySummaryData.topPerformers} playerMap={playerMap} />
                    <ReceivingStatsCard topPerformers={displaySummaryData.topPerformers} playerMap={playerMap} />
                    <DefensiveStatsCard topPerformers={displaySummaryData.topPerformers} playerMap={playerMap} />
                    <InterceptionStatsCard topPerformers={displaySummaryData.topPerformers} playerMap={playerMap} />
                </div>
            </div>
        </div>
    );
};

export default WeekDashboard;
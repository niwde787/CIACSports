import React, { useState, useEffect, useMemo } from 'react';
import { getAllTeamData } from '../firebase';
import { SpinnerIcon } from './icons';
import { Play, Player, PlayResult } from '../types';

declare const window: any;

interface GlobalPlayerStat {
    playerId: string;
    playerName: string;
    teamName: string;
    teamId: string;
    ageGroup: string;
    position: string;
    totalSnaps: number;
    passingYards: number;
    rushingYards: number;
    receivingYards: number;
    tackles: number;
    sacks: number;
    interceptions: number;
    kickReturnYards: number;
    puntReturnYards: number;
    fieldGoalsMade: number;
}

interface TeamStat {
    teamId: string;
    teamName: string;
    gamesPlayed: number;
    offensiveYards: number;
    defensiveYardsAllowed: number;
    turnoversCommitted: number;
    turnoversForced: number;
    penalties: number;
    penaltyYards: number;
}

const CATEGORIZED_STATS: { [key: string]: { key: keyof GlobalPlayerStat; label: string }[] } = {
    Offensive: [
      { key: 'passingYards', label: 'Passing Yards' },
      { key: 'rushingYards', label: 'Rushing Yards' },
      { key: 'receivingYards', label: 'Receiving Yards' },
    ],
    Defensive: [
      { key: 'tackles', label: 'Tackles' },
      { key: 'sacks', label: 'Sacks' },
      { key: 'interceptions', label: 'Interceptions' },
    ],
    'Special Teams': [
      { key: 'kickReturnYards', label: 'Kick Return Yards' },
      { key: 'puntReturnYards', label: 'Punt Return Yards' },
      { key: 'fieldGoalsMade', label: 'Field Goals Made' },
    ],
};


const POSITION_GROUPS = ['All', 'QB', 'RB', 'WR', 'TE', 'OL', 'DE', 'DT', 'LB', 'CB', 'S', 'K', 'P', 'H', 'LS', 'KR', 'GNR', 'BLK'];

const SortableHeader: React.FC<{
    label: string;
    sortKey: keyof TeamStat | 'turnoverDifferential';
    sortConfig: { key: keyof TeamStat | 'turnoverDifferential'; direction: 'asc' | 'desc' };
    onSort: (key: keyof TeamStat | 'turnoverDifferential') => void;
    className?: string;
    title?: string;
}> = ({ label, sortKey, sortConfig, onSort, className, title }) => {
    const isSorting = sortConfig.key === sortKey;
    const arrow = isSorting ? (sortConfig.direction === 'desc' ? ' ▼' : ' ▲') : '';
    return (
        <th className={`px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider ${className}`}>
            <button className="flex items-center gap-1 group" onClick={() => onSort(sortKey)} title={title || `Sort by ${label}`}>
                <span className="group-hover:text-white">{label}</span>
                <span className={`text-[var(--accent-primary)] w-3`}>{arrow}</span>
            </button>
        </th>
    );
};

const PlayerStatCard: React.FC<{
    player: GlobalPlayerStat;
    rank: number;
    statLabel: string;
    statKey: keyof GlobalPlayerStat;
}> = ({ player, rank, statLabel, statKey }) => {
    return (
        <div className="bg-[var(--bg-tertiary)] p-3 rounded-lg flex items-center gap-4">
            <div className="font-bold text-lg text-center w-8 text-[var(--text-secondary)]">{rank}</div>
            <div className="flex-grow">
                <p className="font-semibold text-sm text-white">{player.playerName}</p>
                <p className="text-xs text-[var(--text-secondary)]">{player.teamName} &bull; {player.position}</p>
            </div>
            <div className="text-right">
                <p className="font-mono font-bold text-base text-[var(--accent-primary)]">{player[statKey]}</p>
                <p className="text-xs text-[var(--text-secondary)]">{statLabel}</p>
            </div>
        </div>
    );
}

const TeamStatCard: React.FC<{
    team: TeamStat;
    rank: number;
}> = ({ team, rank }) => {
    const turnoverDiff = team.turnoversForced - team.turnoversCommitted;
    return (
        <div className="bg-[var(--bg-tertiary)] p-3 rounded-lg space-y-2">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <span className="font-bold text-lg text-center w-8 text-[var(--text-secondary)]">{rank}</span>
                    <p className="font-semibold text-sm text-white">{team.teamName}</p>
                </div>
                <span className="text-xs text-[var(--text-secondary)]">GP: {team.gamesPlayed}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs border-t border-[var(--border-primary)] pt-2">
                <div className="flex justify-between"><span>Off. Yds:</span><span className="font-mono font-semibold text-base text-white">{team.offensiveYards}</span></div>
                <div className="flex justify-between"><span>Def. Yds:</span><span className="font-mono font-semibold text-base text-white">{team.defensiveYardsAllowed}</span></div>
                <div className="flex justify-between"><span>TO Diff:</span><span className={`font-mono font-semibold text-base ${turnoverDiff > 0 ? 'text-green-400' : turnoverDiff < 0 ? 'text-red-400' : 'text-white'}`}>{turnoverDiff > 0 ? `+${turnoverDiff}` : turnoverDiff}</span></div>
                <div className="flex justify-between"><span>Pen. Yds:</span><span className="font-mono font-semibold text-base text-white">{team.penaltyYards}</span></div>
            </div>
        </div>
    );
};

const LeaderboardView: React.FC = () => {
    const [stats, setStats] = useState<GlobalPlayerStat[]>([]);
    const [teamStats, setTeamStats] = useState<TeamStat[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [activeView, setActiveView] = useState<'players' | 'teams'>('teams');
    const [activeCategory, setActiveCategory] = useState<'Offensive' | 'Defensive' | 'Special Teams'>('Offensive');
    const [positionFilter, setPositionFilter] = useState('All');
    const [ageGroupFilter, setAgeGroupFilter] = useState('All');
    const [statFilter, setStatFilter] = useState<keyof GlobalPlayerStat>('passingYards');

    const [teamSortConfig, setTeamSortConfig] = useState<{ key: keyof TeamStat | 'turnoverDifferential', direction: 'asc' | 'desc' }>({ key: 'offensiveYards', direction: 'desc' });

    useEffect(() => {
        if (activeView === 'players') {
            const newStatKey = CATEGORIZED_STATS[activeCategory][0].key;
            setStatFilter(newStatKey);
        }
    }, [activeCategory, activeView]);


    useEffect(() => {
        const processPlayerData = (rawData: any[]): GlobalPlayerStat[] => {
            const playerStatsMap = new Map<string, GlobalPlayerStat>();

            rawData.forEach(team => {
                const teamPlayers = new Map<string, Player>();

                if (team.weeks && team.weeks.length > 0) {
                    const lastWeek = team.weeks.reduce((latest: any, current: any) => {
                        return new Date(latest.date || 0) > new Date(current.date || 0) ? latest : current;
                    }, team.weeks[0]);
                    (lastWeek.players || []).forEach((p: Player) => {
                        teamPlayers.set(p.id, p);
                    });
                }
                
                team.weeks.forEach((week: any) => {
                    (week.playHistory || []).forEach((play: Play & { playerIds: string[] }) => {
                        (play.playerIds || []).forEach((playerId: string) => {
                             const playerInfo = teamPlayers.get(playerId);
                             if (!playerInfo) return;
                             
                             const mapKey = `${team.userId}-${playerId}`;
                             if (!playerStatsMap.has(mapKey)) {
                                 playerStatsMap.set(mapKey, {
                                     playerId, playerName: playerInfo.name, teamName: team.teamName, teamId: team.userId, ageGroup: team.ageGroup || 'N/A',
                                     position: playerInfo.position || '',
                                     totalSnaps: 0, passingYards: 0, rushingYards: 0, receivingYards: 0, tackles: 0, sacks: 0, interceptions: 0,
                                     kickReturnYards: 0, puntReturnYards: 0, fieldGoalsMade: 0,
                                 });
                             }
                             const pStats = playerStatsMap.get(mapKey)!;
                             pStats.totalSnaps++;

                             if (play.highlights) {
                                if (play.highlights.passerId === playerId) pStats.passingYards += play.yardsGained || 0;
                                if (play.highlights.runnerId === playerId) pStats.rushingYards += play.yardsGained || 0;
                                if (play.highlights.receiverId === playerId) pStats.receivingYards += play.yardsGained || 0;
                                if (play.highlights.tacklerId === playerId) pStats.tackles++;
                                if (play.highlights.interceptorId === playerId) pStats.interceptions++;
                                if (play.highlights.returnerId === playerId) {
                                    const returnYards = play.yardsGained || 0;
                                    if(play.playResult === PlayResult.KickReturn || play.playResult === PlayResult.KickReturnTD) pStats.kickReturnYards += returnYards;
                                    if(play.playResult === PlayResult.PuntReturn || play.playResult === PlayResult.PuntReturnTD) pStats.puntReturnYards += returnYards;
                                }
                                if (play.highlights.kickerId === playerId && play.playResult === PlayResult.FieldGoalGood) {
                                    pStats.fieldGoalsMade++;
                                }
                             }
                             if ((play.playResult === PlayResult.DefenseSack || play.playResult === PlayResult.SackTaken) && play.highlights?.tacklerId === playerId) pStats.sacks++;
                        });
                    });
                });
            });

            return Array.from(playerStatsMap.values());
        };
        
        const processTeamData = (rawData: any[]): TeamStat[] => {
            const teamStatsMap = new Map<string, TeamStat>();
            rawData.forEach(team => {
                const teamStat: TeamStat = {
                    teamId: team.userId,
                    teamName: team.teamName,
                    gamesPlayed: 0,
                    offensiveYards: 0,
                    defensiveYardsAllowed: 0,
                    turnoversCommitted: 0,
                    turnoversForced: 0,
                    penalties: 0,
                    penaltyYards: 0,
                };

                const weeksWithPlays = team.weeks.filter((w: any) => w.playHistory && w.playHistory.length > 0);
                teamStat.gamesPlayed = weeksWithPlays.length;

                weeksWithPlays.forEach((week: any) => {
                    (week.playHistory || []).forEach((play: Play & { playerIds: string[] }) => {
                        const yards = play.yardsGained || 0;

                        if (play.type === 'Offense') {
                            teamStat.offensiveYards += yards;
                            if (play.playResult === PlayResult.FumbleLost || play.playResult === PlayResult.InterceptionThrown) {
                                teamStat.turnoversCommitted++;
                            }
                        } else if (play.type === 'Defense') {
                            teamStat.defensiveYardsAllowed += yards;
                            const takeawayResults = [PlayResult.Interception, PlayResult.FumbleRecovery, PlayResult.BlockedKickRecovery, PlayResult.DefensiveSafety];
                            if (takeawayResults.includes(play.playResult as PlayResult)) {
                                teamStat.turnoversForced++;
                            }
                        }

                        if (play.playResult === PlayResult.PenaltyAccepted && play.penaltyOn === 'offense') { // Assuming penaltyOn 'offense' is our offense
                            teamStat.penalties++;
                            teamStat.penaltyYards += Math.abs(yards);
                        }
                    });
                });
                teamStatsMap.set(team.userId, teamStat);
            });
            return Array.from(teamStatsMap.values());
        };


        const fetchData = async () => {
            setIsLoading(true);
            try {
                const rawData = await getAllTeamData();
                const processedPlayerData = processPlayerData(rawData);
                const processedTeamData = processTeamData(rawData);
                setStats(processedPlayerData);
                setTeamStats(processedTeamData);
            } catch (err) {
                console.error(err);
                setError("Failed to fetch global data. This may be a permissions issue.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);
    
    const filteredAndSortedStats = useMemo(() => {
        return stats
            .filter(player => {
                const posMatch = positionFilter === 'All' || (() => {
                    const pos = player.position.toUpperCase();
                    return pos.includes(positionFilter);
                })();
                const ageMatch = ageGroupFilter === 'All' || player.ageGroup === ageGroupFilter;
                return posMatch && ageMatch;
            })
            .sort((a, b) => {
                const valA = a[statFilter];
                const valB = b[statFilter];
                if (typeof valA === 'number' && typeof valB === 'number') {
                    return valB - valA;
                }
                return 0;
            });
    }, [stats, positionFilter, ageGroupFilter, statFilter]);

    const sortedTeamStats = useMemo(() => {
        return [...teamStats].sort((a, b) => {
            const { key, direction } = teamSortConfig;
            let aVal, bVal;

            if (key === 'turnoverDifferential') {
                aVal = a.turnoversForced - a.turnoversCommitted;
                bVal = b.turnoversForced - b.turnoversCommitted;
            } else {
                aVal = a[key];
                bVal = b[key];
            }

            if (aVal < bVal) return direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [teamStats, teamSortConfig]);

    const handleTeamSort = (key: keyof TeamStat | 'turnoverDifferential') => {
        let direction: 'asc' | 'desc' = 'desc';
        const isLowValueGood = ['defensiveYardsAllowed', 'turnoversCommitted', 'penalties', 'penaltyYards'].includes(key);

        if (teamSortConfig.key === key) {
            direction = teamSortConfig.direction === 'asc' ? 'desc' : 'asc';
        } else if (isLowValueGood) {
            direction = 'asc';
        }
        setTeamSortConfig({ key, direction });
    };

    const handleExportPdf = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('Global Player Stats', 14, 22);
        doc.setFontSize(12);
        const statLabel = CATEGORIZED_STATS[activeCategory].find(c => c.key === statFilter)?.label || 'Stat';
        doc.text(`Top Players by ${statLabel} (${activeCategory} / Position: ${positionFilter})`, 14, 30);
        
        const tableHead = [['Rank', 'Player', 'Team', 'Position', statLabel]];
        const tableBody = filteredAndSortedStats.slice(0, 100).map((p, index) => [
            index + 1,
            p.playerName,
            p.teamName,
            p.position,
            p[statFilter]
        ]);

        doc.autoTable({ startY: 40, head: tableHead, body: tableBody, theme: 'grid' });
        doc.save(`leaderboard_${activeCategory}_${statFilter}_${positionFilter}.pdf`);
    };

    const handleTeamExportPdf = () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text('Global Team Stats', 14, 22);
        
        const tableHead = [['Rank', 'Team', 'GP', 'Off. Yds', 'Def. Yds', 'TO', 'TK', '+/-', 'Pen', 'Pen Yds']];
        const tableBody = sortedTeamStats.map((t, index) => [
            index + 1,
            t.teamName,
            t.gamesPlayed,
            t.offensiveYards,
            t.defensiveYardsAllowed,
            t.turnoversCommitted,
            t.turnoversForced,
            t.turnoversForced - t.turnoversCommitted,
            t.penalties,
            t.penaltyYards,
        ]);

        doc.autoTable({ startY: 30, head: tableHead, body: tableBody, theme: 'grid' });
        doc.save(`leaderboard_teams.pdf`);
    };

    if (isLoading) return <div className="flex justify-center items-center h-full"><SpinnerIcon className="w-12 h-12 text-[var(--accent-primary)]" /></div>;
    if (error) return <div className="text-red-400 bg-red-900/30 p-4 rounded-lg">{error}</div>;

    const currentStatLabel = activeView === 'players' ? CATEGORIZED_STATS[activeCategory].find(c => c.key === statFilter)?.label : '';
    
    const viewTabButtonStyle = "py-3 px-4 font-bold border-b-2 transition-colors duration-200 text-base";
    const activeViewTabStyle = "border-[var(--accent-primary)] text-[var(--accent-primary)]";
    const inactiveViewTabStyle = "border-transparent text-[var(--text-secondary)] hover:text-white";
    
    const statCatTabButtonStyle = "flex-1 py-3 px-2 text-sm font-bold border-b-2 transition-colors duration-200 focus:outline-none focus:bg-white/5";
    const activeStatCatTabStyle = "border-[var(--accent-primary)] text-[var(--accent-primary)]";
    const inactiveStatCatTabStyle = "border-transparent text-[var(--text-secondary)] hover:text-white";

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Global Team Stats</h2>
            
            <div className="px-4 border-b border-[var(--border-primary)]">
                <nav className="flex -mb-px">
                    <button onClick={() => setActiveView('players')} className={`${viewTabButtonStyle} ${activeView === 'players' ? activeViewTabStyle : inactiveViewTabStyle}`}>Player Stats</button>
                    <button onClick={() => setActiveView('teams')} className={`${viewTabButtonStyle} ${activeView === 'teams' ? activeViewTabStyle : inactiveViewTabStyle}`}>Team Stats</button>
                </nav>
            </div>
            
            {activeView === 'players' && (
                <>
                    <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)]">
                        <div className="px-4 border-b border-[var(--border-primary)]">
                            <nav className="flex -mb-px">
                                {Object.keys(CATEGORIZED_STATS).map(category => (
                                    <button 
                                        key={category} 
                                        onClick={() => setActiveCategory(category as any)} 
                                        className={`${statCatTabButtonStyle} ${activeCategory === category ? activeStatCatTabStyle : inactiveStatCatTabStyle}`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </nav>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 p-4">
                            <div className="flex-1">
                                <label htmlFor="stat-filter" className="text-xs font-semibold text-[var(--text-secondary)]">Stat Category</label>
                                <select id="stat-filter" value={statFilter} onChange={e => setStatFilter(e.target.value as keyof GlobalPlayerStat)} className="block w-full mt-1 bg-[var(--bg-tertiary)] border-[var(--border-primary)] rounded-md p-2">
                                    {CATEGORIZED_STATS[activeCategory].map(cat => <option key={cat.key} value={cat.key}>{cat.label}</option>)}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label htmlFor="pos-filter" className="text-xs font-semibold text-[var(--text-secondary)]">Position Group</label>
                                <select id="pos-filter" value={positionFilter} onChange={e => setPositionFilter(e.target.value)} className="block w-full mt-1 bg-[var(--bg-tertiary)] border-[var(--border-primary)] rounded-md p-2">
                                    {POSITION_GROUPS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                                </select>
                            </div>
                            <div className="flex-1">
                                <label htmlFor="age-filter" className="text-xs font-semibold text-[var(--text-secondary)]">Age Group</label>
                                <select id="age-filter" value={ageGroupFilter} onChange={e => setAgeGroupFilter(e.target.value)} className="block w-full mt-1 bg-[var(--bg-tertiary)] border-[var(--border-primary)] rounded-md p-2">
                                    <option value="All">All</option>
                                    <option value="6U">6U</option>
                                    <option value="8U">8U</option>
                                    <option value="10U">10U</option>
                                    <option value="12U">12U</option>
                                    <option value="14U">14U</option>
                                </select>
                            </div>
                             <div className="flex items-end">
                                <button onClick={handleExportPdf} className="w-full sm:w-auto px-4 py-2 bg-[var(--accent-primary)] text-white font-bold rounded-lg hover:bg-[var(--accent-primary-hover)]">Export PDF</button>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)] hidden md:block">
                        <table className="min-w-full divide-y divide-[var(--border-primary)]">
                            <thead className="bg-[var(--bg-tertiary)]/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Rank</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Player</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Team</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Position</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">{currentStatLabel}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-primary)]">
                                {filteredAndSortedStats.slice(0, 5).map((p, index) => (
                                    <tr key={`${p.teamId}-${p.playerId}`} className="hover:bg-[var(--bg-tertiary)]">
                                        <td className="px-6 py-4 whitespace-nowrap text-lg font-bold text-[var(--text-secondary)]">{index + 1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[var(--text-primary)]">{p.playerName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-[var(--text-secondary)]">{p.teamName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-[var(--text-secondary)]">{p.position}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-[var(--accent-primary)]">{p[statFilter as keyof GlobalPlayerStat]}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="md:hidden space-y-3">
                        {filteredAndSortedStats.slice(0, 5).map((p, index) => (
                            <PlayerStatCard 
                                key={`${p.teamId}-${p.playerId}`}
                                player={p}
                                rank={index + 1}
                                statLabel={currentStatLabel || ''}
                                statKey={statFilter}
                            />
                        ))}
                        {filteredAndSortedStats.length === 0 && (
                            <p className="text-center py-8 text-[var(--text-secondary)]">No players found for the selected filters.</p>
                        )}
                    </div>
                </>
            )}

            {activeView === 'teams' && (
                <>
                    <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)] p-4 flex justify-end">
                        <button onClick={handleTeamExportPdf} className="px-4 py-2 bg-[var(--accent-primary)] text-white font-bold rounded-lg hover:bg-[var(--accent-primary-hover)]">Export PDF</button>
                    </div>
                    <div className="overflow-x-auto bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)] hidden md:block">
                        <table className="min-w-full divide-y divide-[var(--border-primary)]">
                            <thead className="bg-[var(--bg-tertiary)]/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Rank</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Team</th>
                                    <SortableHeader label="GP" sortKey="gamesPlayed" sortConfig={teamSortConfig} onSort={handleTeamSort} title="Games Played" />
                                    <SortableHeader label="Off. Yds" sortKey="offensiveYards" sortConfig={teamSortConfig} onSort={handleTeamSort} title="Offensive Yards" />
                                    <SortableHeader label="Def. Yds" sortKey="defensiveYardsAllowed" sortConfig={teamSortConfig} onSort={handleTeamSort} title="Defensive Yards Allowed" />
                                    <SortableHeader label="TO" sortKey="turnoversCommitted" sortConfig={teamSortConfig} onSort={handleTeamSort} title="Turnovers Committed" />
                                    <SortableHeader label="TK" sortKey="turnoversForced" sortConfig={teamSortConfig} onSort={handleTeamSort} title="Takeaways" />
                                    <SortableHeader label="+/-" sortKey="turnoverDifferential" sortConfig={teamSortConfig} onSort={handleTeamSort} title="Turnover Differential" />
                                    <SortableHeader label="Pen" sortKey="penalties" sortConfig={teamSortConfig} onSort={handleTeamSort} title="Penalties" />
                                    <SortableHeader label="Pen Yds" sortKey="penaltyYards" sortConfig={teamSortConfig} onSort={handleTeamSort} title="Penalty Yards" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-primary)]">
                                {sortedTeamStats.map((t, index) => {
                                    const turnoverDiff = t.turnoversForced - t.turnoversCommitted;
                                    return (
                                        <tr key={t.teamId} className="hover:bg-[var(--bg-tertiary)]">
                                            <td className="px-4 py-4 whitespace-nowrap text-lg font-bold text-[var(--text-secondary)]">{index + 1}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-[var(--text-primary)]">{t.teamName}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-xs text-center text-[var(--text-secondary)]">{t.gamesPlayed}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-base text-center font-bold text-[var(--accent-primary)]">{t.offensiveYards}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-base text-center text-[var(--text-secondary)]">{t.defensiveYardsAllowed}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-base text-center text-[var(--text-secondary)]">{t.turnoversCommitted}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-base text-center text-[var(--text-secondary)]">{t.turnoversForced}</td>
                                            <td className={`px-4 py-4 whitespace-nowrap text-base text-center font-bold ${turnoverDiff > 0 ? 'text-green-400' : turnoverDiff < 0 ? 'text-red-400' : 'text-[var(--text-secondary)]'}`}>{turnoverDiff > 0 ? `+${turnoverDiff}` : turnoverDiff}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-base text-center text-[var(--text-secondary)]">{t.penalties}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-base text-center text-[var(--text-secondary)]">{t.penaltyYards}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                     <div className="md:hidden space-y-3">
                        {sortedTeamStats.map((t, index) => (
                            <TeamStatCard key={t.teamId} team={t} rank={index + 1} />
                        ))}
                        {sortedTeamStats.length === 0 && (
                            <p className="text-center py-8 text-[var(--text-secondary)]">No team data available to display.</p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default LeaderboardView;

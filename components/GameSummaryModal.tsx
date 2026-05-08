import React, { useMemo, useState } from 'react';
import { Player, QuarterSummaryData, FormationStats, PlayerStats } from '../types';
import { formatTime, getLastName } from '../utils';
import { PassingIcon, RunningIcon, TacklingIcon, FieldGoalIcon, TurnoverIcon } from './icons';
import { useGameState } from '../contexts/GameStateContext';

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
            return statsB.count - statsA.count;
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


const GameSummaryModal: React.FC = () => {
  const { 
    players, playHistory, setIsSummaryModalOpen, opponentNames, selectedWeek,
    ourScore, opponentScore, gameSummaryData 
  } = useGameState();

  const [activeTab, setActiveTab] = useState<'players' | 'formations' | 'performers'>('players');
  const onClose = () => setIsSummaryModalOpen(false);

  const { formationStats, topPerformers } = gameSummaryData || {};

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      const totalA = a.offensePlayCount + a.defensePlayCount + a.specialTeamsPlayCount;
      const totalB = b.offensePlayCount + b.defensePlayCount + b.specialTeamsPlayCount;
      if (totalB !== totalA) {
        return totalB - totalA;
      }
      return a.jerseyNumber - b.jerseyNumber;
    });
  }, [players]);

  const totalPlays = playHistory.length;
  const playerMap = useMemo(() => new Map(players.map(p => [p.id, p])), [players]);
  
  const sortedFormations = useMemo(() => {
    if (!formationStats) return [];
    return Object.entries(formationStats)
      .sort(([, a], [, b]) => (b as FormationStats).playCount - (a as FormationStats).playCount);
  }, [formationStats]);

  const tabButtonStyle = "flex-1 py-3 px-2 text-sm font-bold border-b-2 transition-colors duration-200 focus:outline-none focus:bg-white/5";
  const activeTabStyle = "border-[var(--accent-primary)] text-[var(--accent-primary)]";
  const inactiveTabStyle = "border-transparent text-[var(--text-secondary)] hover:text-white";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 font-sans">
      <div className="glass-effect rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-fade-in">
        <header className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center sticky top-0 bg-transparent z-10">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Game Summary</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10" aria-label="Close summary"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </header>

        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-[var(--border-primary)] bg-transparent">
          <div>
            <label htmlFor="opponentName" className="block text-xs font-medium text-[var(--text-secondary)]">Opponent Name</label>
            <input type="text" id="opponentName" value={opponentNames[selectedWeek] || ''} className="mt-1 block w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md shadow-sm py-2 px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]" readOnly/>
          </div>
          <div><label htmlFor="ourScore" className="block text-xs font-medium text-[var(--text-secondary)]">Our Score</label><input type="number" id="ourScore" value={ourScore.toString()} className="mt-1 block w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md shadow-sm py-2 px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]" readOnly/></div>
          <div><label htmlFor="opponentScore" className="block text-xs font-medium text-[var(--text-secondary)]">Opponent Score</label><input type="number" id="opponentScore" value={opponentScore.toString()} className="mt-1 block w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md shadow-sm py-2 px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]" readOnly/></div>
        </div>

        <main className="flex-grow flex flex-col min-h-0">
            <div className="px-4 border-b border-[var(--border-primary)] flex-shrink-0">
                <nav className="flex justify-around -mb-px">
                    <button onClick={() => setActiveTab('players')} className={`${tabButtonStyle} ${activeTab === 'players' ? activeTabStyle : inactiveTabStyle}`}>Player Stats</button>
                    <button onClick={() => setActiveTab('formations')} className={`${tabButtonStyle} ${activeTab === 'formations' ? activeTabStyle : inactiveTabStyle}`}>Playbook</button>
                    <button onClick={() => setActiveTab('performers')} className={`${tabButtonStyle} ${activeTab === 'performers' ? activeTabStyle : inactiveTabStyle}`}>Performers</button>
                </nav>
            </div>

            <div className="p-4 overflow-y-auto">
                {activeTab === 'players' && (
                    <table className="min-w-full divide-y divide-[var(--border-primary)]">
                        <thead className="bg-[var(--bg-tertiary)]/50"><tr><th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">Jer #</th><th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase">Name</th><th className="px-3 py-3 text-center text-xs font-medium text-[var(--text-secondary)] uppercase">Off</th><th className="px-3 py-3 text-center text-xs font-medium text-[var(--text-secondary)] uppercase">Def</th><th className="px-3 py-3 text-center text-xs font-medium text-[var(--text-secondary)] uppercase">ST</th><th className="px-3 py-3 text-center text-xs font-medium text-[var(--text-secondary)] uppercase">Total</th><th className="px-3 py-3 text-center text-xs font-medium text-[var(--text-secondary)] uppercase">Time</th><th className="px-4 py-3 text-center text-xs font-medium text-[var(--text-secondary)] uppercase">% Plays</th></tr></thead>
                        <tbody className="bg-transparent divide-y divide-[var(--border-primary)]">
                            {sortedPlayers.map(p => {
                                const total = p.offensePlayCount + p.defensePlayCount + p.specialTeamsPlayCount;
                                const participation = totalPlays > 0 ? Math.round((total / totalPlays) * 100) : 0;
                                return (<tr key={p.id}>
                                    <td className="px-4 py-4 text-sm font-bold text-center">{p.jerseyNumber}</td><td className="px-6 py-4 text-sm">{p.name}</td>
                                    <td className="px-3 py-4 text-center text-base font-mono">{p.offensePlayCount}</td><td className="px-3 py-4 text-center text-base font-mono">{p.defensePlayCount}</td>
                                    <td className="px-3 py-4 text-center text-base font-mono">{p.specialTeamsPlayCount}</td><td className="px-3 py-4 text-center text-base font-bold">{total}</td>
                                    <td className="px-3 py-4 text-center text-sm font-mono text-[var(--accent-primary)]">{formatTime(p.timeOnField)}</td>
                                    <td className="px-4 py-4"><div className="flex items-center justify-center"><span className="mr-2 text-sm font-mono w-8 text-right">{participation}%</span><div className="w-24 bg-[var(--bg-tertiary)] rounded-full h-2.5"><div className="bg-[var(--accent-primary)] h-2.5 rounded-full" style={{width: `${participation}%`}}></div></div></div></td>
                                </tr>)
                            })}
                        </tbody>
                    </table>
                )}
                {activeTab === 'formations' && (
                    <div className="space-y-3">
                        {sortedFormations.length > 0 ? sortedFormations.map(([name, stats]) => <FormationStatsCard key={name} name={name} stats={stats as FormationStats}/>) : <p className="text-center py-8 text-[var(--text-secondary)]">No formations to analyze.</p>}
                    </div>
                )}
                {activeTab === 'performers' && topPerformers && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <TopPerformerItem icon={<PassingIcon className="w-6 h-6"/>} category="Passing" playerStats={topPerformers.passers} playerMap={playerMap} statType="yards" />
                        <TopPerformerItem icon={<RunningIcon className="w-6 h-6"/>} category="Rushing" playerStats={topPerformers.runners} playerMap={playerMap} statType="yards" />
                        <TopPerformerItem icon={<PassingIcon className="w-6 h-6 transform -scale-x-100 opacity-70"/>} category="Receiving" playerStats={topPerformers.receivers} playerMap={playerMap} statType="yards" />
                        <TopPerformerItem icon={<RunningIcon className="w-6 h-6 opacity-70"/>} category="Returns" playerStats={topPerformers.returners} playerMap={playerMap} statType="yards" />
                        <TopPerformerItem icon={<TacklingIcon className="w-6 h-6"/>} category="Tackles" playerStats={topPerformers.tacklers} playerMap={playerMap} statType="count" />
                        <TopPerformerItem icon={<TurnoverIcon className="w-6 h-6"/>} category="Takeaways" playerStats={topPerformers.interceptors} playerMap={playerMap} statType="count" />
                        <TopPerformerItem icon={<FieldGoalIcon className="w-6 h-6"/>} category="Kicking" playerStats={topPerformers.kickers} playerMap={playerMap} statType="kicking" />
                    </div>
                )}
            </div>
        </main>
         <footer className="p-4 border-t border-[var(--border-primary)] flex justify-end">
            <button onClick={onClose} className="px-6 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--border-primary)] focus:outline-none">Close</button>
        </footer>
      </div>
    </div>
  );
};

export default GameSummaryModal;
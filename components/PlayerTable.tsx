import React, { useState, useMemo, useCallback } from 'react';
import { Player, PlayType, PlayerStatus, FormationCollection } from '../types';
import { useGameState } from '../contexts/GameStateContext';
import PlayerStatusModal from './PlayerStatusModal';
import AddPlayerModal from './AddPlayerModal';
import RosterImportModal from './RosterImportModal';
import { formatTime, getLastName, getOrdinal, getStatusColorClasses } from '../utils';
import { PlusCircleIcon, ImportIcon, StarIcon, ChevronRightIcon } from './icons';
import { DEFAULT_PLAYER_IMAGE, OFFENSE_DISPLAY_GROUPS, DEFENSE_DISPLAY_GROUPS, ST_DISPLAY_GROUPS, POSITION_GROUPS, POSITION_FULL_NAMES } from '../constants';

const AvailablePlayerItem: React.FC<{ player: Player; onDragStart: () => void; isDragging: boolean }> = ({ player, onDragStart, isDragging }) => {
    return (
        <div
            draggable
            onDragStart={onDragStart}
            className={`flex items-center gap-2 bg-[var(--bg-secondary)] p-1.5 rounded-md border border-[var(--border-primary)]/20 cursor-grab hover:border-[var(--border-primary)] transition-colors ${isDragging ? 'opacity-30' : ''}`}
        >
             <img src={player.imageUrl || DEFAULT_PLAYER_IMAGE} alt={player.name} className="h-6 w-6 rounded-full object-cover border border-white/5 flex-shrink-0" referrerPolicy="no-referrer" />
             <div className="flex-grow min-w-0 flex items-center gap-1.5">
                <span className="font-semibold text-xs text-[var(--text-primary)] truncate">#{player.jerseyNumber} {getLastName(player.name)}</span>
             </div>
        </div>
    );
};

const DepthPlayerRow: React.FC<{
    player: Player;
    rank: number;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: (e: React.DragEvent) => void;
    isDragging: boolean;
}> = ({ player, rank, onDragStart, onDragEnd, isDragging }) => {
    const isAvailable = player.status === 'Playing';
    const isStarter = isAvailable && rank === 1;

    let statusText = '';
    if (player.status === 'Injured') statusText = 'INJ';
    else if (player.status === 'Absent') statusText = 'ABS';
    else if (player.status === 'Discipline') statusText = 'SUSP';

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            className={`flex items-center gap-2 p-1.5 rounded-md border border-[var(--border-primary)]/20 cursor-move transition-colors ${isDragging ? 'opacity-30' : 'hover:border-[var(--border-primary)]'} ${isAvailable ? 'bg-[var(--bg-secondary)]' : 'bg-red-900/20 opacity-60'}`}
        >
            <div className="w-5 flex-shrink-0 flex items-center justify-center">
                {isStarter ? (
                    <StarIcon className="w-4 h-4 text-lime-400" />
                ) : !isAvailable ? (
                    <span className="text-[9px] font-bold text-red-400 tracking-tighter">{statusText}</span>
                ) : null}
            </div>
            <div className="min-w-0 flex-grow flex items-center gap-1.5">
                <span className={`font-semibold text-xs ${isStarter ? 'text-lime-400' : isAvailable ? 'text-[var(--text-primary)]' : 'text-red-400'} truncate ${!isAvailable ? 'line-through decoration-red-400/50' : ''}`}>
                    #{player.jerseyNumber} {player.name}
                </span>
            </div>
        </div>
    );
};

const PositionGroupCard: React.FC<{
    group: string;
    players: Player[];
    onPlayerDragStart: (playerId: string) => void;
    onDrop: (dropIndex: number) => void;
    onDragEnd: () => void;
    isDragOver: boolean;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    draggedPlayerId: string | null;
}> = ({ group, players, onPlayerDragStart, onDrop, onDragEnd, isDragOver, onDragOver, onDragLeave, draggedPlayerId }) => {
    
    return (
        <div 
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={(e) => { e.preventDefault(); onDrop(players.length); }} // Drop at the end if dropping on the card itself
            className={`bg-[var(--bg-primary)] rounded-lg p-3 h-auto flex flex-col border transition-colors ${isDragOver ? 'border-[var(--accent-primary)]' : 'border-[var(--border-primary)]/50'}`}
        >
            <h3 className="text-sm font-bold text-[var(--logo-color)] border-b border-[var(--border-primary)] pb-1.5 mb-2 flex-shrink-0 uppercase tracking-wider text-center">
                {group}
            </h3>
            <div className="space-y-1.5 flex-grow min-h-[40px]">
                {players.map((player, index) => {
                    const isAvailable = player.status === 'Playing';
                    const rank = isAvailable ? players.slice(0, index + 1).filter(p => p.status === 'Playing').length : -1;
                    return (
                        <div
                            key={player.id}
                            onDrop={e => { e.preventDefault(); e.stopPropagation(); onDrop(index); }}
                            className="rounded"
                        >
                            <DepthPlayerRow
                                player={player}
                                rank={rank}
                                onDragStart={() => onPlayerDragStart(player.id)}
                                onDragEnd={onDragEnd}
                                isDragging={draggedPlayerId === player.id}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const PositionLegend: React.FC = () => {
    const { offenseFormations, defenseFormations, specialTeamsFormations } = useGameState();

    const getDynamicLabels = (defaultLabels: string[], formations: FormationCollection) => {
        const labels = new Set(defaultLabels);
        Object.values(formations).forEach(f => {
            f.positions.forEach(p => labels.add(p.label));
        });
        return Array.from(labels).sort();
    };

    const offenseLabels = useMemo(() => getDynamicLabels(POSITION_GROUPS.OFFENSE, offenseFormations), [offenseFormations]);
    const defenseLabels = useMemo(() => getDynamicLabels(POSITION_GROUPS.DEFENSE, defenseFormations), [defenseFormations]);
    const specialLabels = useMemo(() => getDynamicLabels(POSITION_GROUPS.SPECIALISTS, specialTeamsFormations), [specialTeamsFormations]);

    const renderPositionList = (title: string, positions: string[], accentColor: string) => (
      <div>
        <h4 className="text-lg font-bold mb-2" style={{ color: accentColor }}>
            {title}
        </h4>
        <ul className="space-y-1 max-h-48 overflow-y-auto no-scrollbar pr-2">
          {positions.map(pos => (
            <li key={pos} className="text-xs flex items-baseline">
              <span className="font-bold text-[var(--text-primary)] w-12 inline-block flex-shrink-0">{pos}</span>
              <span className="text-[var(--text-secondary)]">- {POSITION_FULL_NAMES[pos] || pos}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  
    return (
        <details className="bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-primary)]">
            <summary className="p-3 cursor-pointer text-lg font-bold text-[var(--text-secondary)] flex items-center justify-between list-none">
                <div className="flex items-center gap-2">
                    <ChevronRightIcon className="w-5 h-5 text-[var(--text-secondary)] transition-transform details-open-rotate" />
                    <span>Position Legend</span>
                </div>
            </summary>
            <div className="p-4 border-t border-[var(--border-primary)] grid grid-cols-2 md:grid-cols-3 gap-4">
              {renderPositionList('Offense', offenseLabels, 'var(--accent-secondary)')}
              {renderPositionList('Defense', defenseLabels, 'var(--accent-defense)')}
              {renderPositionList('Specialists', specialLabels, 'var(--accent-special)')}
            </div>
        </details>
    );
};

const PlayerTable: React.FC = () => {
    const { 
        players, 
        playHistory, 
        handleUpdatePlayer, 
        handleDeletePlayer, 
        handleAddPlayer, 
        handleRosterImport, 
        depthChart, 
        handleUpdateDepthChart, 
        isAddPlayerModalOpen, 
        setIsAddPlayerModalOpen, 
        editingPlayer, 
        setEditingPlayer,
        offenseFormations,
        defenseFormations,
        specialTeamsFormations
    } = useGameState();
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    
    const [activeTab, setActiveTab] = useState<'roster' | 'depthChart'>('roster');
    const [activeDepthChartTab, setActiveDepthChartTab] = useState<PlayType.Offense | PlayType.Defense | PlayType.SpecialTeams>(PlayType.Offense);
    
    const [draggedItem, setDraggedItem] = useState<{ sourceGroup: string | 'pool'; playerId: string } | null>(null);
    const [dragOverGroup, setDragOverGroup] = useState<string | null>(null);

    const totalGamePlays = playHistory.length;
    
    const getPlayerPositions = useCallback((playerId: string) => {
        const positions: string[] = [];
        Object.entries(depthChart).forEach(([pos, ids]) => {
            if (ids.includes(playerId)) {
                positions.push(pos);
            }
        });
        return positions;
    }, [depthChart]);

    const sortedPlayers = useMemo(() => {
        return [...players].sort((a,b) => a.jerseyNumber - b.jerseyNumber);
    }, [players]);

    const { currentDisplayGroups, tabConfig } = useMemo(() => {
        const getDynamicGroups = (defaultGroups: Record<string, string[]>, formations: FormationCollection) => {
            const groups = { ...defaultGroups };
            Object.values(formations).forEach(f => {
                f.positions.forEach(p => {
                    if (!groups[p.label]) {
                        groups[p.label] = [p.label];
                    }
                });
            });
            return groups;
        };

        switch (activeDepthChartTab) {
            case PlayType.Defense:
                return { 
                    currentDisplayGroups: getDynamicGroups(DEFENSE_DISPLAY_GROUPS, defenseFormations), 
                    tabConfig: { active: 'border-[var(--accent-defense)] text-[var(--accent-defense)]', inactive: 'border-transparent text-[var(--text-secondary)] hover:text-[var(--accent-defense)]' }
                };
            case PlayType.SpecialTeams:
                return { 
                    currentDisplayGroups: getDynamicGroups(ST_DISPLAY_GROUPS, specialTeamsFormations), 
                    tabConfig: { active: 'border-[var(--accent-special)] text-[var(--accent-special)]', inactive: 'border-transparent text-[var(--text-secondary)] hover:text-[var(--accent-special)]' }
                };
            case PlayType.Offense:
            default:
                return { 
                    currentDisplayGroups: getDynamicGroups(OFFENSE_DISPLAY_GROUPS, offenseFormations), 
                    tabConfig: { active: 'border-[var(--accent-secondary)] text-[var(--accent-secondary)]', inactive: 'border-transparent text-[var(--text-secondary)] hover:text-[var(--accent-secondary)]' }
                };
        }
    }, [activeDepthChartTab, offenseFormations, defenseFormations, specialTeamsFormations]);
    
    const poolPlayers = useMemo(() => {
        // Get all unique player IDs that are currently assigned to any position group on the active tab.
        const assignedPlayerIds = new Set<string>();
        Object.keys(currentDisplayGroups).forEach(groupName => {
            const playerIds = depthChart[groupName] || [];
            playerIds.forEach(id => assignedPlayerIds.add(id));
        });

        // Filter the main players list to only include those not already assigned on this tab.
        return players
            .filter(player => player.status === 'Playing' && !assignedPlayerIds.has(player.id))
            .sort((a, b) => a.jerseyNumber - b.jerseyNumber);
    }, [players, depthChart, currentDisplayGroups]);

    const getPlayersForGroup = useCallback((group: string): Player[] => {
        const playerMap = new Map(players.map(p => [p.id, p]));
        const orderedPlayerIds = depthChart[group] || [];
        return orderedPlayerIds.map(id => playerMap.get(id)).filter((p): p is Player => !!p);
    }, [players, depthChart]);

    const handleDragStart = (sourceGroup: string | 'pool', playerId: string) => {
        setDraggedItem({ sourceGroup, playerId });
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setDragOverGroup(null);
    };

    const handleDropOnGroup = (targetGroup: string, dropIndex: number) => {
        if (!draggedItem) return;
        const { sourceGroup, playerId } = draggedItem;

        if (sourceGroup === targetGroup) { // Re-ordering within the same group
            const groupOrder = (depthChart[targetGroup] || []);
            const reordered = [...groupOrder];
            const oldIndex = reordered.indexOf(playerId);
            if (oldIndex > -1) {
                reordered.splice(oldIndex, 1);
            }
            reordered.splice(dropIndex, 0, playerId);
            handleUpdateDepthChart(targetGroup, reordered);
        } else { // Moving from pool or another group
            if (sourceGroup !== 'pool') {
                const sourceOrder = (depthChart[sourceGroup] || []).filter(id => id !== playerId);
                handleUpdateDepthChart(sourceGroup, sourceOrder);
            }

            const targetOrder = [...(depthChart[targetGroup] || [])];
            const existingIndex = targetOrder.indexOf(playerId);
            if (existingIndex > -1) {
                targetOrder.splice(existingIndex, 1);
            }
            targetOrder.splice(dropIndex, 0, playerId);
            handleUpdateDepthChart(targetGroup, targetOrder);
        }
        handleDragEnd();
    };

    const handleDropOnPool = () => {
        if (!draggedItem || draggedItem.sourceGroup === 'pool') return;
        const { sourceGroup, playerId } = draggedItem;
        
        const sourceOrder = (depthChart[sourceGroup] || []).filter(id => id !== playerId);
        handleUpdateDepthChart(sourceGroup, sourceOrder);
        handleDragEnd();
    };
    
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const tabButtonStyle = "py-2 px-4 font-bold border-b-2 transition-colors duration-200 text-sm";
    const mainTabButtonStyle = "py-3 px-4 font-bold border-b-2 transition-colors duration-200 text-base";
    const activeMainTabStyle = "border-[var(--accent-primary)] text-[var(--accent-primary)]";
    const inactiveMainTabStyle = "border-transparent text-[var(--text-secondary)] hover:text-white";

    return (
        <div className="bg-[var(--bg-secondary)] shadow-2xl border border-[var(--border-primary)] flex flex-col h-full">
             <header className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center flex-shrink-0">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">{activeTab === 'roster' ? `Roster (${sortedPlayers.length})` : 'Depth Chart'}</h2>
                 <div className="flex items-center gap-2">
                    <button id="walkthrough-add-player-button" onClick={() => setIsAddPlayerModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-tertiary)] rounded-md hover:bg-[var(--border-primary)] hover:text-[var(--text-primary)]"><PlusCircleIcon className="w-4 h-4" /> Add Player</button>
                    <button id="walkthrough-import-roster-button" onClick={() => setIsImportModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-tertiary)] rounded-md hover:bg-[var(--border-primary)] hover:text-[var(--text-primary)]"><ImportIcon className="w-4 h-4" /> Import Roster</button>
                </div>
            </header>
            
            <div className="px-4 border-b border-[var(--border-primary)] flex-shrink-0">
                <nav className="flex items-center -mb-px">
                     <button onClick={() => setActiveTab('roster')} className={`${mainTabButtonStyle} ${activeTab === 'roster' ? activeMainTabStyle : inactiveMainTabStyle}`}>Roster</button>
                     <button onClick={() => setActiveTab('depthChart')} className={`${mainTabButtonStyle} ${activeTab === 'depthChart' ? activeMainTabStyle : inactiveMainTabStyle}`}>Depth Chart</button>
                </nav>
            </div>

            {activeTab === 'roster' && (
                <div className="flex flex-col flex-grow min-h-0">
                    <main className="p-4 overflow-y-auto flex-grow space-y-4">
                        {sortedPlayers.length > 0 ? (
                            <div className="overflow-x-auto rounded-xl border border-[var(--border-primary)] shadow-sm bg-[var(--bg-tertiary)]">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-[var(--bg-primary)]/50 text-[var(--text-secondary)] border-b border-[var(--border-primary)]">
                                        <tr>
                                            <th className="px-4 py-3">#</th>
                                            <th className="px-4 py-3">Player</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3 text-center">Offense</th>
                                            <th className="px-4 py-3 text-center">Defense</th>
                                            <th className="px-4 py-3 text-center">Special</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-primary)]">
                                        {sortedPlayers.map(player => {
                                            const statusColors = getStatusColorClasses(player.status);
                                            return (
                                                <tr key={player.id} onClick={() => setEditingPlayer(player)} className="hover:bg-[var(--bg-secondary)] cursor-pointer transition-colors">
                                                    <td className="px-4 py-3 font-bold text-lg">{player.jerseyNumber}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <img src={player.imageUrl || DEFAULT_PLAYER_IMAGE} alt={player.name} className="w-8 h-8 rounded-full object-cover border border-[var(--border-primary)]" referrerPolicy="no-referrer" />
                                                            <div>
                                                                <div className="font-bold text-[var(--text-primary)]">{player.name}</div>
                                                                <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">{player.position || 'PLAYER'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusColors.bg} ${statusColors.text} shadow-sm border border-black/10`}>
                                                            {player.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-mono font-semibold">{player.offensePlayCount}</td>
                                                    <td className="px-4 py-3 text-center font-mono font-semibold">{player.defensePlayCount}</td>
                                                    <td className="px-4 py-3 text-center font-mono font-semibold">{player.specialTeamsPlayCount}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center p-8 text-[var(--text-secondary)]">
                                <p>No players match the current filter. Click 'Add Player' or 'Import Roster' to get started.</p>
                            </div>
                        )}
                        <PositionLegend />
                    </main>
                </div>
            )}

            {activeTab === 'depthChart' && (
                <div className="flex flex-col flex-grow min-h-0">
                    <div className="px-4 border-b border-[var(--border-primary)] flex-shrink-0">
                         <nav className="flex justify-around -mb-px">
                            <button onClick={() => setActiveDepthChartTab(PlayType.Offense)} className={`${tabButtonStyle} ${activeDepthChartTab === PlayType.Offense ? tabConfig.active : tabConfig.inactive}`}>Offense</button>
                            <button onClick={() => setActiveDepthChartTab(PlayType.Defense)} className={`${tabButtonStyle} ${activeDepthChartTab === PlayType.Defense ? tabConfig.active : tabConfig.inactive}`}>Defense</button>
                            <button onClick={() => setActiveDepthChartTab(PlayType.SpecialTeams)} className={`${tabButtonStyle} ${activeDepthChartTab === PlayType.SpecialTeams ? tabConfig.active : tabConfig.inactive}`}>Special Teams</button>
                        </nav>
                    </div>
                    <main className="p-4 overflow-y-auto flex-grow space-y-4">
                        <div className="grid grid-cols-5 gap-4">
                            {Object.keys(currentDisplayGroups).map(group => (
                                <PositionGroupCard
                                    key={group}
                                    group={group}
                                    players={getPlayersForGroup(group)}
                                    onPlayerDragStart={(playerId) => handleDragStart(group, playerId)}
                                    onDrop={(dropIndex) => handleDropOnGroup(group, dropIndex)}
                                    onDragEnd={handleDragEnd}
                                    isDragOver={dragOverGroup === group}
                                    onDragOver={handleDragOver}
                                    onDragLeave={() => setDragOverGroup(null)}
                                    draggedPlayerId={draggedItem?.playerId || null}
                                />
                            ))}
                        </div>

                        <div
                            onDrop={handleDropOnPool}
                            onDragOver={handleDragOver}
                            onDragEnter={() => setDragOverGroup('pool')}
                            onDragLeave={() => setDragOverGroup(null)}
                            className={`bg-[var(--bg-primary)] rounded-lg p-3 h-auto flex flex-col border transition-colors ${dragOverGroup === 'pool' ? 'border-[var(--accent-primary)]' : 'border-[var(--border-primary)]/50'}`}
                        >
                            <h3 className="text-sm font-bold text-[var(--logo-color)] border-b border-[var(--border-primary)] pb-1.5 mb-2 flex-shrink-0 uppercase tracking-wider">
                                Available Players ({poolPlayers.length})
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                                {poolPlayers.length > 0 ? (
                                    poolPlayers.map(p => (
                                        <AvailablePlayerItem 
                                            key={p.id} 
                                            player={p} 
                                            onDragStart={() => handleDragStart('pool', p.id)}
                                            isDragging={draggedItem?.playerId === p.id}
                                        />
                                    ))
                                ) : <p className="text-sm text-[var(--text-secondary)] col-span-full text-center">All players are on the depth chart. Drag a player here to make them available.</p>}
                            </div>
                        </div>
                        <PositionLegend />
                    </main>
                </div>
            )}
            
            {isImportModalOpen && <RosterImportModal onClose={() => setIsImportModalOpen(false)} onImport={handleRosterImport} />}
            
            <svg className="invisible absolute" width="0" height="0" xmlns="http://www.w3.org/2000/svg" version="1.1">
                <defs>
                    <filter id="rounded-sm">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="blur-sm"></feGaussianBlur>
                        <feColorMatrix in="blur-sm" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo"></feColorMatrix>
                        <feComposite in="SourceGraphic" in2="goo" operator="atop"></feComposite>
                    </filter>
                </defs>
            </svg>
        </div>
    );
};

export default PlayerTable;
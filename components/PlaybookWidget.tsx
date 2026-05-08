import React, { useMemo, useState } from 'react';
import { Player, FormationCollection, PlayType, FormationPosition } from '../types';
import TeamFormation from './TeamFormation';
import { FinalizeIcon } from './icons';
import { useGameState } from '../contexts/GameStateContext';
import { DEFAULT_PLAYER_IMAGE } from '../constants';
import { getLastName } from '../utils';

interface PlaybookWidgetProps {
    players: Player[];
    activeTab: PlayType;
    formations: FormationCollection;
    selectedFormationName: string;
    setSelectedFormationName: (name: string) => void;
    assignments: (Player | null)[];
    setAssignments: (assignments: (Player | null)[]) => void;
    onFieldPlayers: Set<string>;
    isLineupComplete: boolean;
    formationPositions: FormationPosition[];
    handleConfirm: () => void;
    handleSlotClick: (index: number) => void;
    nextPlayNumber: number;
}

const PLAY_TYPE_CONFIG = {
    [PlayType.Offense]: {
        buttonClass: 'bg-[var(--accent-secondary)] hover:bg-[var(--accent-secondary-hover)] focus:ring-[var(--accent-secondary)]',
        textColorClass: 'text-[var(--accent-secondary)]',
        activeTabClass: 'border-[var(--accent-secondary)] text-[var(--accent-secondary)]',
    },
    [PlayType.Defense]: {
        buttonClass: 'bg-[var(--accent-defense)] hover:bg-[var(--accent-defense-hover)] focus:ring-[var(--accent-defense)]',
        textColorClass: 'text-[var(--accent-defense)]',
        activeTabClass: 'border-[var(--accent-defense)] text-[var(--accent-defense)]',
    },
    [PlayType.SpecialTeams]: {
        buttonClass: 'bg-[var(--accent-special)] hover:bg-[var(--accent-special-hover)] focus:ring-[var(--accent-special)]',
        textColorClass: 'text-[var(--accent-special)]',
        activeTabClass: 'border-[var(--accent-special)] text-[var(--accent-special)]',
    },
    [PlayType.Formations]: {
        buttonClass: 'bg-gray-600 hover:bg-gray-500 focus:ring-gray-400',
        textColorClass: 'text-gray-300',
        activeTabClass: 'border-gray-400 text-white',
    },
};

const AvailablePlayerChip: React.FC<{ player: Player; onDragStart: (e: React.DragEvent) => void; isDragging: boolean }> = ({ player, onDragStart, isDragging }) => {
    return (
        <div
            draggable
            onDragStart={onDragStart}
            className={`flex-shrink-0 flex items-center gap-2 cursor-grab p-1.5 rounded-lg transition-all hover:bg-white/10 ${isDragging ? 'opacity-30' : ''}`}
        >
             <img
                src={player.imageUrl || DEFAULT_PLAYER_IMAGE}
                alt={player.name}
                className="w-8 h-8 border-2 border-[var(--border-primary)] rounded-full object-cover flex-shrink-0"
             />
             <div className="text-left min-w-0">
                <p className="text-xs text-[var(--text-primary)] font-bold leading-tight">#{player.jerseyNumber}</p>
                <p className="text-[10px] text-[var(--text-secondary)] leading-tight truncate w-20">{getLastName(player.name)}</p>
             </div>
        </div>
    );
};


const PlaybookWidget: React.FC<PlaybookWidgetProps> = ({ 
    players,
    activeTab,
    formations,
    selectedFormationName,
    setSelectedFormationName,
    assignments,
    setAssignments,
    onFieldPlayers,
    isLineupComplete,
    formationPositions,
    handleConfirm,
    handleSlotClick,
    nextPlayNumber,
}) => {
    
    const { handleUpdateLineup } = useGameState();
    const [draggedItem, setDraggedItem] = useState<{ player: Player; fromIndex: number } | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const availablePlayers = useMemo(() => 
        players.filter(p => !onFieldPlayers.has(p.id))
               .sort((a, b) => a.jerseyNumber - b.jerseyNumber),
    [players, onFieldPlayers]);

    const handleFieldDragStart = (e: React.DragEvent, fromIndex: number) => {
        const player = assignments[fromIndex];
        if (player) {
            e.dataTransfer.setData('playerId', player.id);
            e.dataTransfer.setData('sourceType', 'field');
            e.dataTransfer.setData('fromIndex', fromIndex.toString());
            setDraggedItem({ player, fromIndex });
        }
    };

    const handleAvailableDragStart = (e: React.DragEvent, player: Player) => {
        e.dataTransfer.setData('playerId', player.id);
        e.dataTransfer.setData('sourceType', 'pool');
        setDraggedItem({ player, fromIndex: -1 }); // -1 indicates from pool
    };

    const handleDropOnSlot = (e: React.DragEvent, toIndex: number) => {
        e.preventDefault();
        const sourceType = e.dataTransfer.getData('sourceType');
        
        const newAssignments = [...assignments];

        if (sourceType === 'field') {
            const fromIndex = parseInt(e.dataTransfer.getData('fromIndex'));
            if (!isNaN(fromIndex) && fromIndex !== toIndex) {
                // Swap players
                const playerA = newAssignments[fromIndex];
                const playerB = newAssignments[toIndex];
                newAssignments[toIndex] = playerA;
                newAssignments[fromIndex] = playerB;
            }
        } else if (sourceType === 'pool') {
            const playerId = e.dataTransfer.getData('playerId');
            const incomingPlayer = players.find(p => p.id === playerId);
            if (incomingPlayer) {
                // The available players list is filtered to not include on-field players,
                // so we don't need to worry about swapping from another on-field position.
                // We just place the new player in the slot.
                newAssignments[toIndex] = incomingPlayer;
            }
        } else {
            setDraggedItem(null);
            setDragOverIndex(null);
            return;
        }
        
        const newLineupIds = newAssignments.map(p => p ? p.id : null);
        handleUpdateLineup(selectedFormationName, newLineupIds, activeTab);
        
        setDraggedItem(null);
        setDragOverIndex(null);
    };
    
    const handleSlotDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedItem) {
             setDragOverIndex(index);
        }
    };
    
    const handleSlotDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setDragOverIndex(null);
    };

    const handleDropOnBackground = (e: React.DragEvent) => {
        e.preventDefault();
        const sourceType = e.dataTransfer.getData('sourceType');
        if (sourceType === 'field') {
            const fromIndex = parseInt(e.dataTransfer.getData('fromIndex'));
            if (!isNaN(fromIndex)) {
                const newAssignments = [...assignments];
                newAssignments[fromIndex] = null; // Unassign player
                const newLineupIds = newAssignments.map(p => p ? p.id : null);
                handleUpdateLineup(selectedFormationName, newLineupIds, activeTab);
            }
        }
        handleDragEnd(); // Reset state
    };


    const { buttonClass: confirmButtonColor, textColorClass, activeTabClass } = useMemo(() => {
        return PLAY_TYPE_CONFIG[activeTab];
    }, [activeTab]);

    const centeredFormationPositions = useMemo(() => {
        return formationPositions.map(pos => {
            const topValue = parseFloat(pos.top);
            if (topValue < 50) {
                const newTop = 100 - topValue;
                return { ...pos, top: `${newTop}%` };
            }
            return pos;
        });
    }, [formationPositions]);
    
    return (
        <main className="flex-grow p-2 sm:p-3 flex flex-col min-h-0">
            {selectedFormationName ? (
                <div className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg flex flex-col flex-grow min-h-0">
                    {/* Formation Tabs */}
                    <div className="flex-shrink-0 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]/30 overflow-x-auto no-scrollbar min-h-[60px] flex items-center">
                        <div className="flex justify-center w-full px-4 gap-4 py-2">
                            {Object.keys(formations).map(name => (
                                <button
                                    key={name}
                                    onClick={() => setSelectedFormationName(name)}
                                    className={`px-2 py-1 text-sm font-bold transition-all whitespace-nowrap ${
                                        selectedFormationName === name
                                            ? `underline ${textColorClass}`
                                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:underline'
                                    }`}
                                >
                                    {name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-grow py-2 sm:py-3 px-0 flex items-center justify-center min-h-0 relative" onDragEnd={handleDragEnd} onDrop={handleDropOnBackground} onDragOver={(e) => { e.preventDefault(); setDragOverIndex(null); }}>
                        <TeamFormation 
                            allPlayers={players}
                            playType={activeTab}
                            formation={centeredFormationPositions}
                            formationName={selectedFormationName}
                            assignments={assignments}
                            onAssignmentsChange={setAssignments}
                            onSlotClick={handleSlotClick}
                            onDrop={handleDropOnSlot}
                            onDragOver={handleSlotDragOver}
                            onDragLeave={handleSlotDragLeave}
                            onDragStart={handleFieldDragStart}
                            draggedIndex={draggedItem ? draggedItem.fromIndex : null}
                            dragOverIndex={dragOverIndex}
                        />

                        {isLineupComplete && (
                             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 glass-effect p-4 sm:p-6 rounded-2xl shadow-2xl w-[90%] max-w-80 text-center">
                                <h3 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                                    Confirm <span className={textColorClass}>{selectedFormationName}</span>
                                </h3>
                                <p className="text-base sm:text-lg text-[var(--text-secondary)] mt-1 sm:mt-2">
                                    {onFieldPlayers.size} / {formationPositions.length} Players Assigned
                                </p>
                                <button
                                    onClick={handleConfirm}
                                    className={`mt-4 sm:mt-6 w-full flex items-center justify-center gap-2 px-4 py-2 sm:py-3 text-base sm:text-lg font-bold text-white rounded-lg shadow-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)] ${confirmButtonColor}`}
                                    aria-label={`Confirm and run play number ${nextPlayNumber}`}
                                >
                                    <FinalizeIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                                    <span>Play #{nextPlayNumber}</span>
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-shrink-0 h-24 bg-black/20 p-2 border-t border-[var(--border-primary)] flex flex-col">
                        <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider px-2 pb-1 flex-shrink-0">Available Players ({availablePlayers.length})</h3>
                        <div className="relative h-full flex-grow min-h-0">
                            <div className="absolute inset-0 flex gap-3 overflow-x-auto no-scrollbar items-center px-2">
                                {availablePlayers.length > 0 ? (
                                    availablePlayers.map(player => (
                                        <AvailablePlayerChip 
                                            key={player.id} 
                                            player={player} 
                                            onDragStart={(e) => handleAvailableDragStart(e, player)}
                                            isDragging={!!(draggedItem && draggedItem.fromIndex === -1 && draggedItem.player.id === player.id)}
                                        />
                                    ))
                                ) : (
                                    <div className="w-full text-center">
                                        <p className="text-sm text-[var(--text-secondary)]">All available players are on the field.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-grow flex items-center justify-center">
                    <p className="text-[var(--text-secondary)] text-center py-10">No formations available for this play type.</p>
                </div>
            )}
        </main>
    );
};

export default PlaybookWidget;
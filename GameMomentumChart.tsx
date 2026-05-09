import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Player, FormationPosition, PlayerStatus } from '../types';
import { getLastName } from '../utils';
import { DEFAULT_PLAYER_IMAGE } from '../constants';
import { SubstitutionIcon } from './icons';

interface SubPlayerChipProps {
    player: Player;
    isDragging?: boolean;
    isDragOver?: boolean;
    isSelected?: boolean;
    draggable?: boolean;
    size?: 'large' | 'small';
    onClick?: () => void;
    onDragStart?: (e: React.DragEvent) => void;
    onDragEnd?: (e: React.DragEvent) => void;
    onDragOver?: (e: React.DragEvent) => void;
    onDragLeave?: (e: React.DragEvent) => void;
    onDrop?: (e: React.DragEvent) => void;
}

const SubPlayerChip: React.FC<SubPlayerChipProps> = ({
    player,
    isDragging = false,
    isDragOver = false,
    isSelected = false,
    size = 'large',
    ...eventHandlers
}) => {
    const isLarge = size === 'large';
    const sizeClasses = isLarge ? 'w-12 h-12' : 'w-10 h-10';
    const textContainerHeight = isLarge ? 'h-8' : 'h-8';
    const jerseySize = 'text-xs';
    const nameSize = 'text-xs';
    
    const baseStyle = 'flex flex-col items-center justify-center gap-1 transition-all duration-200 p-1 rounded-lg';
    const selectableStyle = eventHandlers.draggable ? 'cursor-grab hover:scale-105 hover:bg-[var(--border-primary)]' : (eventHandlers.onClick ? 'cursor-pointer hover:bg-[var(--border-primary)]' : '');
    const draggingStyle = isDragging ? 'opacity-30 scale-90' : 'opacity-100';
    const dragOverStyle = isDragOver ? 'bg-[var(--accent-primary)]/30 scale-110 ring-2 ring-[var(--accent-primary)]' : '';
    const selectedStyle = isSelected ? 'bg-[var(--accent-primary)]/20 ring-4 ring-[var(--accent-primary)] scale-105' : '';

    return (
        <div 
            className={`${baseStyle} ${selectableStyle} ${draggingStyle} ${dragOverStyle} ${selectedStyle}`} 
            {...eventHandlers}
        >
            <div 
                className={`relative ${sizeClasses} rounded-full flex-shrink-0 bg-[var(--bg-tertiary)] border-2 border-[var(--border-primary)] flex items-center justify-center bg-cover bg-center shadow-lg`}
                style={{ backgroundImage: `url(${player.imageUrl || DEFAULT_PLAYER_IMAGE})` }}
            >
                <div className="absolute inset-0 bg-black/40 rounded-full"></div>
            </div>
            <div className={`text-center mt-1 w-full ${textContainerHeight} flex flex-col items-center justify-center`}>
                <p className={`font-bold text-[var(--text-primary)] leading-tight ${jerseySize}`}>#{player.jerseyNumber}</p>
                <p className={`text-[var(--text-secondary)] leading-tight truncate w-full ${nameSize}`}>{getLastName(player.name)}</p>
            </div>
        </div>
    );
};

const EmptySlotChip: React.FC<{
    isDragOver?: boolean;
    isSelected?: boolean;
    size?: 'large' | 'small';
    onClick?: () => void;
    onDragOver?: (e: React.DragEvent) => void;
    onDragLeave?: (e: React.DragEvent) => void;
    onDrop?: (e: React.DragEvent) => void;
}> = ({
    isDragOver = false,
    isSelected = false,
    size = 'large',
    ...eventHandlers
}) => {
    const isLarge = size === 'large';
    const sizeClasses = isLarge ? 'w-12 h-12' : 'w-10 h-10';
    const iconSize = isLarge ? 'h-6 w-6' : 'h-5 w-5';
    const textContainerHeight = isLarge ? 'h-8' : 'h-8';

    const baseStyle = 'flex flex-col items-center justify-center gap-1 transition-all duration-200 p-1 rounded-lg';
    const selectableStyle = eventHandlers.onClick ? 'cursor-pointer hover:bg-[var(--border-primary)]' : '';
    const dragOverStyle = isDragOver ? 'bg-[var(--accent-primary)]/30 scale-110 ring-2 ring-[var(--accent-primary)]' : '';
    const selectedStyle = isSelected ? 'bg-[var(--accent-primary)]/20 ring-4 ring-[var(--accent-primary)] scale-105' : '';

    return (
        <div 
            className={`${baseStyle} ${selectableStyle} ${dragOverStyle} ${selectedStyle}`}
            {...eventHandlers}
        >
            <div className={`relative ${sizeClasses} rounded-full flex-shrink-0 bg-[var(--bg-tertiary)] border-2 border-dashed border-[var(--border-primary)] flex items-center justify-center shadow-lg`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`${iconSize} text-[var(--text-secondary)]`} fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </div>
            <div className={`text-center mt-1 w-full ${textContainerHeight} flex flex-col items-center justify-start`}>
                {/* This div is intentionally left empty to maintain vertical alignment with player chips */}
            </div>
        </div>
    );
};


interface WaveSubModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (newAssignments: (Player | null)[]) => void;
    allPlayers: Player[];
    currentAssignments: (Player | null)[];
    formationPositions: FormationPosition[];
    stagedSlotIndex?: number | null;
}

type Substitution = {
    type: 'sub';
    playerIn: Player;
    playerOut: Player | null;
    onFieldIndex: number;
} | {
    type: 'swap';
    playerA: Player;
    playerB: Player;
};


type StagedSub = {
    playerOut: Player | null;
    onFieldIndex: number;
}

const WaveSubModal: React.FC<WaveSubModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    allPlayers,
    currentAssignments,
    formationPositions,
    stagedSlotIndex,
}) => {
    const [assignments, setAssignments] = useState<(Player | null)[]>([]);
    const [initialAssignments, setInitialAssignments] = useState<(Player | null)[]>([]);
    const [pendingSubs, setPendingSubs] = useState<Substitution[]>([]);
    const [draggedPlayer, setDraggedPlayer] = useState<Player | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [stagedSub, setStagedSub] = useState<StagedSub | null>(null);

    useEffect(() => {
        if (isOpen) {
            const initial = [...currentAssignments];
            setAssignments(initial);
            setInitialAssignments(initial);
            setPendingSubs([]);
            setDraggedPlayer(null);
            setDragOverIndex(null);
            
            if (stagedSlotIndex != null) {
                const playerToStage = currentAssignments[stagedSlotIndex] || null;
                setStagedSub({ playerOut: playerToStage, onFieldIndex: stagedSlotIndex });
            } else {
                setStagedSub(null);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, stagedSlotIndex]);

    const offFieldPlayers = useMemo(() => {
        const onFieldIds = new Set(assignments.filter(Boolean).map(p => p!.id));
        return allPlayers
            .filter(p => p.status === PlayerStatus.Playing && !onFieldIds.has(p.id))
            .sort((a, b) => a.jerseyNumber - b.jerseyNumber);
    }, [assignments, allPlayers]);

    const handleOnFieldSlotClick = (index: number) => {
        const clickedPlayer = assignments[index] || null;

        if (stagedSub) { // A slot is already selected
            if (stagedSub.onFieldIndex === index) {
                // Unselect if clicking the same slot
                setStagedSub(null);
            } else {
                // A different on-field slot is clicked. The user wants to swap.
                const newAssignments = [...assignments];
                const playerFromStagedSlot = stagedSub.playerOut;
                const stagedIndex = stagedSub.onFieldIndex;
    
                newAssignments[stagedIndex] = clickedPlayer;
                newAssignments[index] = playerFromStagedSlot;
    
                setAssignments(newAssignments);
                if (playerFromStagedSlot && clickedPlayer) {
                    setPendingSubs(prev => [...prev, { type: 'swap', playerA: playerFromStagedSlot, playerB: clickedPlayer }]);
                }
                setStagedSub(null); // Clear selection after swap
            }
        } else { // No slot is selected, select this one
            setStagedSub({ playerOut: clickedPlayer, onFieldIndex: index });
        }
    };

    const handleOffFieldPlayerClick = (playerIn: Player) => {
        if (stagedSub) {
            const { playerOut, onFieldIndex } = stagedSub;

            const newAssignments = [...assignments];
            newAssignments[onFieldIndex] = playerIn;

            setAssignments(newAssignments);
            setPendingSubs(prev => [...prev, { type: 'sub', playerIn, playerOut, onFieldIndex }]);
            setStagedSub(null);
        }
    };


    const handleDragStart = (e: React.DragEvent, player: Player) => {
        setStagedSub(null);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('playerId', player.id);
        setDraggedPlayer(player);
    };

    const handleDrop = (e: React.DragEvent, droppedOnIndex: number) => {
        e.preventDefault();
        const incomingPlayerId = e.dataTransfer.getData('playerId');
        const playerIn = allPlayers.find(p => p.id === incomingPlayerId);
        const playerOut = assignments[droppedOnIndex] || null;

        if (playerIn) {
            // Since only off-field players are draggable, this is a simple substitution, not a swap.
            const newAssignments = [...assignments];
            newAssignments[droppedOnIndex] = playerIn;
            
            setAssignments(newAssignments);
            setPendingSubs(prev => [...prev, { type: 'sub', playerIn, playerOut, onFieldIndex: droppedOnIndex }]);
        }
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedPlayer(null);
        setDragOverIndex(null);
    };
    
    const handleReset = () => {
        setAssignments([...initialAssignments]);
        setPendingSubs([]);
        setStagedSub(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="glass-effect rounded-2xl shadow-2xl w-full max-w-7xl h-[80vh] max-h-[800px] flex flex-col animate-fade-in" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-[var(--text-primary)]">Wave Substitution</h2>
                        <p className="text-[var(--text-secondary)] text-xs">Swap multiple players, then confirm your changes.</p>
                    </div>
                    <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]" aria-label="Close"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </header>

                <main className="flex-grow flex flex-col md:flex-row p-4 overflow-hidden gap-4">
                    <div className="w-full md:w-2/5 flex flex-col bg-[var(--bg-primary)] rounded-lg p-3 min-h-0">
                        <h3 className="text-base font-semibold text-center text-[var(--text-primary)] mb-2 flex-shrink-0">On Field ({formationPositions.length})</h3>
                        <div className="flex-grow overflow-y-auto no-scrollbar grid grid-cols-2 lg:grid-cols-3 gap-2 content-start p-2">
                            {assignments.map((player, index) => {
                                return player ? (
                                    <SubPlayerChip
                                        key={`${player.id}-${index}`}
                                        player={player}
                                        isSelected={stagedSub?.onFieldIndex === index}
                                        isDragOver={dragOverIndex === index}
                                        onClick={() => handleOnFieldSlotClick(index)}
                                        onDragOver={(e) => { e.preventDefault(); setDragOverIndex(index); }}
                                        onDragLeave={() => setDragOverIndex(null)}
                                        onDrop={(e) => handleDrop(e, index)}
                                    />
                                ) : (
                                    <EmptySlotChip
                                        key={`empty-${index}`}
                                        isSelected={stagedSub?.onFieldIndex === index}
                                        isDragOver={dragOverIndex === index}
                                        onClick={() => handleOnFieldSlotClick(index)}
                                        onDragOver={(e) => { e.preventDefault(); setDragOverIndex(index); }}
                                        onDragLeave={() => setDragOverIndex(null)}
                                        onDrop={(e) => handleDrop(e, index)}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    <div className="w-full md:w-1/5 flex flex-col bg-[var(--bg-primary)] rounded-lg p-3 min-h-0">
                        <h3 className="text-base font-semibold text-center text-[var(--text-primary)] mb-2 flex-shrink-0">Changes ({pendingSubs.length + (stagedSub ? 1 : 0)})</h3>
                        <div className="flex-grow overflow-y-auto no-scrollbar space-y-2 p-2">
                            {pendingSubs.map((sub, idx) => {
                                if (sub.type === 'swap') {
                                    return (
                                        <div key={`swap-${idx}`} className="bg-[var(--bg-tertiary)] p-1.5 rounded-lg flex items-center justify-around gap-1 relative group">
                                            <SubPlayerChip player={sub.playerA} size="small" />
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--accent-primary)] flex-shrink-0" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                                            <SubPlayerChip player={sub.playerB} size="small" />
                                        </div>
                                    )
                                }
                                return (
                                    <div key={idx} className="bg-[var(--bg-tertiary)] p-1.5 rounded-lg flex items-center justify-around gap-1 relative group">
                                        {sub.playerOut ? <SubPlayerChip player={sub.playerOut} size="small"/> : <EmptySlotChip size="small" />}
                                        <SubstitutionIcon className="h-5 w-5 text-[var(--accent-primary)] flex-shrink-0" />
                                        <SubPlayerChip player={sub.playerIn} size="small" />
                                    </div>
                                );
                            })}
                             {stagedSub && (
                                <div className="bg-[var(--bg-tertiary)] p-1.5 rounded-lg flex items-center justify-around gap-1 ring-2 ring-[var(--accent-primary)] ring-inset animate-pulse">
                                    {stagedSub.playerOut ? <SubPlayerChip player={stagedSub.playerOut} size="small" /> : <EmptySlotChip size="small" />}
                                    <SubstitutionIcon className="h-5 w-5 text-[var(--accent-primary)] flex-shrink-0" />
                                    <div className="flex flex-col items-center justify-center gap-1 p-1 rounded-lg w-[76px]">
                                        <div className="relative w-10 h-10 rounded-full flex-shrink-0 bg-[var(--bg-tertiary)] border-2 border-dashed border-[var(--border-primary)] flex items-center justify-center shadow-lg"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--text-secondary)]" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
                                        <div className="text-center mt-1 w-full h-[32px] flex items-center justify-center"><p className="text-xs text-[var(--text-secondary)]">Select Player</p></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="w-full md:w-2/5 flex flex-col bg-[var(--bg-primary)] rounded-lg p-3 min-h-0">
                        <h3 className="text-base font-semibold text-center text-[var(--text-primary)] mb-2 flex-shrink-0">Off-Field ({offFieldPlayers.length})</h3>
                        <div className="flex-grow overflow-y-auto no-scrollbar p-2">
                           {offFieldPlayers.length > 0 ? (
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                    {offFieldPlayers.map(player => (
                                        <SubPlayerChip
                                            key={player.id}
                                            player={player}
                                            draggable
                                            isDragging={draggedPlayer?.id === player.id}
                                            onClick={() => handleOffFieldPlayerClick(player)}
                                            onDragStart={(e) => handleDragStart(e, player)}
                                            onDragEnd={handleDragEnd}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex h-full items-center justify-center text-center text-sm text-[var(--text-secondary)]">
                                    <p>All available players are on the field.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
                
                <footer className="p-4 border-t border-[var(--border-primary)] flex justify-between items-center flex-shrink-0">
                   <button 
                        onClick={handleReset} 
                        className="px-6 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold rounded-lg hover:bg-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)] focus:ring-[var(--border-primary)]"
                    >
                        Reset Changes
                    </button>
                   <div className="space-x-4">
                        <button onClick={onClose} className="px-6 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--border-primary)] focus:outline-none">Cancel</button>
                        <button onClick={() => onConfirm(assignments)} className="px-6 py-2 bg-[var(--accent-primary)] text-white font-bold rounded-lg hover:bg-[var(--accent-primary-hover)] focus:outline-none">Confirm Changes</button>
                   </div>
                </footer>
            </div>
        </div>
    );
};

export default WaveSubModal;

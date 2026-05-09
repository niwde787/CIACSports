import React from 'react';
import { Player, PlayerStatus, PlayType, FormationPositions } from '../types';
import { getLastName, formatPosition } from '../utils';
import FootballFieldBackground from './FootballFieldBackground';
import { useGameState } from '../contexts/GameStateContext';
import { DEFAULT_PLAYER_IMAGE } from '../constants';

interface TeamFormationProps {
    allPlayers: Player[];
    playType: PlayType;
    formation: FormationPositions;
    formationName: string;
    assignments: (Player | null)[];
    onAssignmentsChange: (newAssignments: (Player | null)[]) => void;
    onSlotClick: (index: number) => void;
    onDrop?: (e: React.DragEvent, index: number) => void;
    onDragOver?: (e: React.DragEvent, index: number) => void;
    onDragLeave?: () => void;
    onDragStart?: (e: React.DragEvent, index: number) => void;
    draggedIndex?: number | null;
    dragOverIndex?: number | null;
}

const getStatusStyles = (status: PlayerStatus | undefined, playType: PlayType): { borderColor: string; bgColor: string } => {
    switch (status) {
        case PlayerStatus.Injured:
            return { borderColor: 'border-[var(--status-injured)]', bgColor: 'bg-[var(--status-injured)]/50' };
        case PlayerStatus.Absent:
            return { borderColor: 'border-[var(--status-absent)]', bgColor: 'bg-[var(--status-absent)]/50' };
        case PlayerStatus.Discipline:
            return { borderColor: 'border-[var(--status-discipline)]', bgColor: 'bg-[var(--status-discipline)]/50' };
        case PlayerStatus.Playing:
        default:
            const playTypeBorder = playType === PlayType.Offense ? 'border-[var(--accent-secondary)]'
                : playType === PlayType.Defense ? 'border-[var(--accent-defense)]'
                : 'border-[var(--accent-special)]';
            return { borderColor: playTypeBorder, bgColor: 'bg-black/50' };
    }
};

const AnimatedSlot: React.FC<{
    player: Player | null;
    position: { top: string; left: string, label: string };
    playType: PlayType;
    onClick: () => void;
    onDrop?: (e: React.DragEvent) => void;
    onDragOver?: (e: React.DragEvent) => void;
    onDragLeave?: () => void;
    onDragStart?: (e: React.DragEvent) => void;
    isDragging: boolean;
    isDragOver: boolean;
}> = ({ player, position, playType, onClick, onDrop, onDragOver, onDragLeave, onDragStart, isDragging, isDragOver }) => {
    const { borderColor, bgColor } = getStatusStyles(player?.status, playType);
    const isEmpty = !player;

    const slotClasses = `absolute flex flex-col items-center transition-all duration-500 ease-in-out transform -translate-x-1/2 -translate-y-1/2 focus:outline-none rounded-full 
        ${isDragging ? 'opacity-30' : ''}
        ${isDragOver ? 'scale-110 z-20' : 'z-10'}
        ${!isEmpty ? 'cursor-grab' : ''}`;

    return (
        <div
            draggable={!isEmpty && !!onDragStart}
            onClick={onClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDragStart={onDragStart}
            style={{ top: position.top, left: position.left }}
            aria-label={player ? `Player #${player.jerseyNumber} at ${position.label}` : `Empty slot at ${position.label}`}
            className={slotClasses}
        >
            <div
                className={`w-10 h-10 sm:w-12 sm:h-12 border-2 rounded-full flex items-center justify-center relative bg-cover bg-center shadow-lg transition-all duration-300 ${
                    isEmpty 
                        ? 'bg-black/60 border-dashed border-gray-500 hover:bg-white/10 hover:border-[var(--accent-primary)]' 
                        : borderColor
                } ${isDragOver ? 'ring-4 ring-[var(--accent-primary)]' : ''}`}
                style={{ backgroundImage: isEmpty ? 'none' : `url(${player.imageUrl || DEFAULT_PLAYER_IMAGE})` }}
            >
                {player && (
                    <>
                        <div className={`absolute inset-0 rounded-full ${bgColor}`}></div>
                        <span className="relative z-10 text-white font-bold text-sm">{player.jerseyNumber}</span>
                    </>
                )}
            </div>
            <div className="mt-1 text-center flex flex-col items-center justify-center">
                <p className={`text-xs font-semibold bg-black/60 px-1.5 py-0.5 rounded-md ${isEmpty ? 'text-gray-400' : 'text-white'}`}>{formatPosition(position.label)}</p>
                {player && (
                    <p className="text-xs font-medium text-gray-300 bg-black/60 px-1.5 py-0.5 rounded-md mt-0.5 whitespace-nowrap">{getLastName(player.name)}</p>
                )}
            </div>
        </div>
    );
};

const TeamFormation: React.FC<TeamFormationProps> = ({ playType, formation, assignments, onSlotClick, onDrop, onDragOver, onDragLeave, onDragStart, draggedIndex, dragOverIndex }) => {
    const { fieldLogoUrl, nextPlayState, possession, homeStatus } = useGameState();
    const startYard = 46;
    const endYard = 86;
    const totalYards = endYard - startYard;
    
    const lineOfScrimmageYard = nextPlayState.startYardLine;
    const playDirection = (possession === 'home' && homeStatus === 'Home') || (possession === 'away' && homeStatus === 'Away') ? 'up' : 'down';

    return (
        <div className="relative w-full max-h-full aspect-[21/9] overflow-hidden rounded-xl shadow-2xl">
            <FootballFieldBackground 
                logoUrl={fieldLogoUrl} 
                startYard={startYard} 
                endYard={endYard} 
                lineOfScrimmageYard={lineOfScrimmageYard}
                playDirection={playDirection}
            />
            {(formation || []).map((position, index) => {
                const player = assignments[index];
                
                // Remap the top percentage (which represents yards 0-100) 
                // to the focused container's height (startYard to endYard)
                const originalYard = parseFloat(position.top);
                const remappedTop = ((originalYard - startYard) / totalYards) * 100;
                const remappedPosition = { ...position, top: `${remappedTop}%` };

                return (
                    <AnimatedSlot
                        key={index}
                        player={player}
                        position={remappedPosition}
                        playType={playType}
                        onClick={() => onSlotClick(index)}
                        onDrop={(e) => onDrop?.(e, index)}
                        onDragOver={(e) => onDragOver?.(e, index)}
                        onDragLeave={() => onDragLeave?.()}
                        onDragStart={(e) => onDragStart?.(e, index)}
                        isDragging={draggedIndex === index}
                        isDragOver={dragOverIndex === index}
                    />
                );
            })}
        </div>
    );
};

export default TeamFormation;
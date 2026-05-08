import React, { useMemo } from 'react';
import { useGameState } from '../contexts/GameStateContext';
import { PlayResult } from '../types';
import { getLastName } from '../utils';

const LiveActivityBar: React.FC = () => {
    const { playHistory, players, ourScore, opponentScore, teamName, opponentNames, selectedWeek } = useGameState();
    const playerMap = useMemo(() => new Map((players || []).map(p => [p.id, p])), [players]);
    const lastPlay = playHistory && playHistory.length > 0 ? playHistory[playHistory.length - 1] : undefined;
    const opponentName = (opponentNames && selectedWeek ? opponentNames[selectedWeek] : undefined) || 'Opponent';

    if (!lastPlay) {
        return (
            <div className="bg-[var(--bg-primary)]/80 backdrop-blur-md border-t border-[var(--border-primary)] py-2 px-4 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                <span>Waiting for kickoff...</span>
                <span>{teamName} Game Day</span>
            </div>
        );
    }

    const yardsDisp = lastPlay.yardsGained !== undefined ? `${lastPlay.yardsGained > 0 ? '+' : ''}${lastPlay.yardsGained}y` : '';
    const resultDisp = lastPlay.playResult || 'Complete';
    
    return (
        <div className="bg-[var(--bg-primary)]/80 backdrop-blur-md border-t border-[var(--border-primary)] py-2 px-4 flex justify-between items-center overflow-hidden">
            <div className="flex items-center gap-4 animate-fade-in truncate">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-[var(--accent-primary)] uppercase">Last Play</span>
                    <span className="text-xs font-bold text-[var(--text-primary)] truncate max-w-[200px]">
                        {lastPlay.formationName}: {resultDisp} {yardsDisp}
                    </span>
                </div>
                <div className="hidden sm:flex h-8 w-px bg-[var(--border-primary)] mx-2"></div>
                <div className="hidden sm:flex flex-col">
                    <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase">Game Status</span>
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                        {teamName} {ourScore} - {opponentScore} {opponentName}
                    </span>
                </div>
            </div>
            
            <div className="flex-shrink-0 flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-[var(--text-secondary)] tracking-tighter uppercase whitespace-nowrap">Live Connection</span>
            </div>
        </div>
    );
};

export default LiveActivityBar;

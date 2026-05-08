import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { Play, PlayType, PlayResult, Drive } from '../types';
import { getOrdinal, calculateDrives, generatePlayDescription } from '../utils';
import { ChevronRightIcon, EditIcon, PlayResultIcon, TrashIcon, PlusCircleIcon } from './icons';
import ConfirmationModal from './ConfirmationModal';
import { useGameState } from '../contexts/GameStateContext';

const getPlayTypeStyles = (playType: PlayType) => {
    switch (playType) {
        case PlayType.Offense: return { borderColor: 'border-[var(--accent-secondary)]', tagColor: 'bg-[var(--accent-secondary)]/20 text-[var(--accent-secondary)]' };
        case PlayType.Defense: return { borderColor: 'border-[var(--accent-defense)]', tagColor: 'bg-[var(--accent-defense)]/20 text-[var(--accent-defense)]' };
        case PlayType.SpecialTeams: return { borderColor: 'border-[var(--accent-special)]', tagColor: 'bg-[var(--accent-special)]/20 text-[var(--accent-special)]' };
        default: return { borderColor: 'border-gray-600', tagColor: 'bg-gray-500/20 text-gray-300' };
    }
}

const DriveSummary: React.FC<{ drive: Drive }> = ({ drive }) => {
    const { summary, team } = drive;
    const yardsColor = summary.yards > 0 ? 'text-green-400' : summary.yards < 0 ? 'text-red-400' : 'text-gray-300';
    const driveTypeStyles = getPlayTypeStyles(team);

    return (
        <summary className={`px-4 py-3 font-bold text-lg text-[var(--text-primary)] cursor-pointer hover:bg-white/5 flex justify-between items-center list-none ${driveTypeStyles.borderColor} border-l-4`}>
            <div className="flex items-center gap-3">
                <ChevronRightIcon className="w-6 h-6 text-[var(--text-secondary)] transition-transform details-open-rotate" />
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                    <span className="text-lg">Drive #{drive.driveNumber}</span>
                    <div className="flex items-center gap-3 text-xs font-medium text-[var(--text-secondary)]">
                        <span>{summary.playCount} Plays</span>
                        <span className={yardsColor}>{summary.yards > 0 ? '+' : ''}{summary.yards} Yards</span>
                        <span>TOP: {summary.timeOfPossession}</span>
                        <span className="font-bold text-white bg-black/30 px-2 py-0.5 rounded-md">{summary.result}</span>
                    </div>
                </div>
            </div>
        </summary>
    )
};

const PlayLog: React.FC = () => {
    const { playHistory, players, handleEditPlay, handleDeletePlay, handleReorderPlay, handleInitiateInsert, scrollToPlayIndex, setScrollToPlayIndex, editingPlayIndex } = useGameState();
    const [deletePlayIndex, setDeletePlayIndex] = useState<number | null>(null);
    const playerMap = React.useMemo(() => new Map(players.map(p => [p.id, p])), [players]);
    const [filters, setFilters] = useState({ quarter: 'all', playResult: 'all', formation: 'all', playerSearch: '' });
    const playItemRefs = useRef<(HTMLDivElement | null)[]>([]);

    const confirmDelete = () => {
        if (deletePlayIndex !== null) {
            handleDeletePlay(deletePlayIndex);
            setDeletePlayIndex(null);
        }
    };

    useEffect(() => {
        playItemRefs.current = playItemRefs.current.slice(0, playHistory.length);
    }, [playHistory]);

    useEffect(() => {
        if (scrollToPlayIndex !== null) {
            const timer = setTimeout(() => {
                const playElement = playItemRefs.current[scrollToPlayIndex];
                if (playElement) {
                    playElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                setScrollToPlayIndex(null); 
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [scrollToPlayIndex, setScrollToPlayIndex]);

    const uniqueOptions = useMemo(() => {
        const results = new Set<PlayResult>();
        const formations = new Set<string>();
        playHistory.forEach(p => {
            if (p.playResult) results.add(p.playResult);
            if (p.formationName) formations.add(p.formationName);
        });
        return { results: Array.from(results).sort(), formations: Array.from(formations).sort() };
    }, [playHistory]);
    
    const filteredDrives = useMemo((): Drive[] => {
        // Step 1: Calculate all drives from the full history first.
        const allDrives = calculateDrives(playHistory);
    
        const { quarter, playResult, formation, playerSearch } = filters;
        const noFilters = quarter === 'all' && playResult === 'all' && formation === 'all' && !playerSearch;
    
        // Step 2: If no filters are active, return all drives as they are.
        if (noFilters) {
            return allDrives;
        }
    
        // Step 3: Map over the drives, filtering the plays within each one.
        const drivesWithFilteredPlays = allDrives.map(drive => {
            const filteredPlaysInDrive = drive.plays.filter(({ play }) => {
                if (quarter !== 'all' && play.quarter?.toString() !== quarter) return false;
                if (playResult !== 'all' && play.playResult !== playResult) return false;
                if (formation !== 'all' && play.formationName !== formation) return false;
                if (playerSearch) {
                    const searchTerm = playerSearch.toLowerCase();
                    const playerInvolved = Array.from(play.playerIds).some(pid => {
                        const player = playerMap.get(pid);
                        return player && (player.name.toLowerCase().includes(searchTerm) || player.jerseyNumber.toString().includes(searchTerm));
                    });
                    if (!playerInvolved) return false;
                }
                return true;
            });
    
            // Return a new drive object with only the filtered plays.
            return {
                ...drive,
                plays: filteredPlaysInDrive,
            };
        });
    
        // Step 4: Filter out any drives that are now empty after filtering their plays.
        return drivesWithFilteredPlays.filter(drive => drive.plays.length > 0);
    }, [playHistory, filters, playerMap]);

    if (playHistory.length === 0) {
        return (
            <div className="bg-[var(--bg-secondary)] shadow-2xl border border-[var(--border-primary)]">
                <div className="p-4 border-b border-[var(--border-primary)]"><h2 className="text-2xl font-bold text-[var(--text-primary)]">Action Log</h2></div>
                <div className="text-center p-8"><h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">No Plays Recorded</h2><p className="text-[var(--text-secondary)]">Go to the 'Game' tab to start adding plays.</p></div>
            </div>
        );
    }
    
    return (
        <div className="bg-[var(--bg-secondary)] shadow-2xl border border-[var(--border-primary)]">
            <div className="p-4 border-b border-[var(--border-primary)]"><h2 className="text-2xl font-bold text-[var(--text-primary)]">Action Log</h2></div>
            <div className="p-3 bg-[var(--bg-primary)] border-b border-[var(--border-primary)]">
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <input type="text" placeholder="Filter by player..." value={filters.playerSearch} onChange={e => setFilters(f => ({ ...f, playerSearch: e.target.value }))} className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-xs rounded-md py-2 px-3 focus:ring-1 focus:ring-[var(--accent-primary)]" />
                    <select value={filters.quarter} onChange={e => setFilters(f => ({ ...f, quarter: e.target.value }))} className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-xs rounded-md py-2 px-3 focus:ring-1 focus:ring-[var(--accent-primary)]"><option value="all">All Quarters</option><option value="1">Q1</option><option value="2">Q2</option><option value="3">Q3</option><option value="4">Q4</option></select>
                    <select value={filters.formation} onChange={e => setFilters(f => ({ ...f, formation: e.target.value }))} className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-xs rounded-md py-2 px-3 focus:ring-1 focus:ring-[var(--accent-primary)]"><option value="all">All Formations</option>{(uniqueOptions.formations || []).map(f => <option key={f} value={f}>{f}</option>)}</select>
                    <select value={filters.playResult} onChange={e => setFilters(f => ({ ...f, playResult: e.target.value }))} className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-xs rounded-md py-2 px-3 focus:ring-1 focus:ring-[var(--accent-primary)]"><option value="all">All Results</option>{(uniqueOptions.results || []).map(r => <option key={r} value={r}>{r}</option>)}</select>
                </div>
            </div>
            <div className="p-4 space-y-4">
                {filteredDrives.length > 0 ? 
                    filteredDrives.map(drive => (
                        <details key={drive.driveNumber} className="bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg overflow-hidden group">
                            <DriveSummary drive={drive} />
                            <div className="border-t border-[var(--border-primary)] p-2 space-y-2">
                                {drive.plays.map(({ play, originalIndex }) => {
                                    const playNumber = originalIndex + 1;
                                    const isFlagged = play.isFlag;
                                    const typeStyles = getPlayTypeStyles(play.type);
                                    const borderColorClass = isFlagged ? 'border-[var(--accent-warning)]' : typeStyles.borderColor;
                                    const yards = play.yardsGained;
                                    const isEditing = editingPlayIndex === originalIndex;
                                    let yardsDisplay = null;
                                    if (yards !== undefined) {
                                        const yardsColor = yards > 0 ? 'text-green-400 bg-green-500/10' : yards < 0 ? 'text-red-400 bg-red-500/10' : 'text-gray-300 bg-gray-500/20';
                                        yardsDisplay = <span className={`px-2 py-1 text-xs font-bold rounded-md ${yardsColor}`}>{yards > 0 ? `+${yards}` : yards} YD</span>;
                                    }
                                    return (
                                        <div key={`${play.timestamp}-${originalIndex}`} ref={el => { if (el) playItemRefs.current[originalIndex] = el; }} className={`bg-[var(--bg-tertiary)] rounded-lg shadow-md border-l-4 ${borderColorClass} overflow-hidden transition-all duration-300 ${isEditing ? 'ring-2 ring-[var(--accent-primary)] ring-offset-2 ring-offset-[var(--bg-primary)]' : ''}`}>
                                            <div className="p-3">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-lg text-[var(--text-primary)]">Play #{playNumber}</h4>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => handleInitiateInsert(originalIndex)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded-md hover:bg-[var(--accent-primary)]/20 hover:text-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-tertiary)] focus:ring-[var(--accent-primary)]" aria-label={`Insert play before play number ${playNumber}`}>
                                                            <PlusCircleIcon className="w-3 h-3" />
                                                            Insert
                                                        </button>
                                                        <button onClick={() => handleEditPlay(originalIndex)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded-md hover:bg-[var(--border-primary)] hover:text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-tertiary)] focus:ring-[var(--accent-primary)]" aria-label={`Edit play number ${playNumber}`}><EditIcon className="w-3 h-3" />Edit</button>
                                                        <button onClick={() => setDeletePlayIndex(originalIndex)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg-secondary)] rounded-md hover:bg-[var(--accent-danger)]/20 hover:text-[var(--accent-danger)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-tertiary)] focus:ring-[var(--accent-danger)]" aria-label={`Delete play number ${playNumber}`}><TrashIcon className="w-3 h-3" />Delete</button>
                                                    </div>
                                                </div>
                                                <p className="text-[var(--text-secondary)] font-medium text-sm -mt-1">{play.formationName}</p>
                                                
                                                <p className="text-base text-[var(--text-primary)] mt-3">
                                                    {generatePlayDescription(play, playerMap)}
                                                </p>
                                                
                                                <div className="mt-3 pt-3 border-t border-[var(--border-primary)]/50">
                                                    <div className="flex items-center flex-wrap gap-2">
                                                        <PlayResultIcon result={play.playResult || PlayResult.PenaltyAccepted} />
                                                        <span className={`px-2 py-1 text-xs font-bold rounded-md ${typeStyles.tagColor}`}>{play.type}</span>
                                                        {yardsDisplay}
                                                        {play.playResult && (<span className="px-2 py-1 text-xs font-bold rounded-md bg-[var(--bg-secondary)] text-[var(--text-secondary)]">{play.playResult}</span>)}
                                                    </div>
                                                    {play.down !== undefined && play.gameTime && (<p className="text-xs text-[var(--text-secondary)] mt-2 font-mono">{getOrdinal(play.down)} Down | Q{play.quarter} {play.gameTime} | Score: {play.ourScore}-{play.opponentScore}</p>)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </details>
                    )) : (
                    <div className="text-center p-8"><h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">No Matching Plays</h2><p className="text-[var(--text-secondary)]">Clear some filters to see more results.</p></div>
                )}
            </div>
            <ConfirmationModal 
                isOpen={deletePlayIndex !== null} 
                onClose={() => setDeletePlayIndex(null)} 
                onConfirm={confirmDelete} 
                title="Delete Play" 
                message="Are you sure you want to delete this play?" 
            />
        </div>
    );
};

export default PlayLog;
import React, { useMemo } from 'react';
import { useGameState } from '../contexts/GameStateContext';
import { ImportIcon, PlusCircleIcon, EditIcon } from './icons';

const GameDayCard: React.FC<{
    game: {
        week: string;
        opponent: string;
        date: string;
        homeAway: 'Home' | 'Away';
        result: { ourScore: number; opponentScore: number } | null;
    };
    displayWeek: string;
    isSelected: boolean;
    onWeekChange: (week: string) => void;
    onEdit: () => void;
}> = ({ game, displayWeek, isSelected, onWeekChange, onEdit }) => {
    const { week, opponent, date, homeAway, result } = game;

    const dateObj = new Date(date + 'T00:00:00'); // Add time to avoid timezone issues
    const month = dateObj.toLocaleString('default', { month: 'short' });
    const day = dateObj.getDate();

    const isWin = result && result.ourScore > result.opponentScore;
    const isLoss = result && result.ourScore < result.opponentScore;
    const isTie = result && result.ourScore === result.opponentScore;

    const resultClass = isWin ? 'text-green-400' : isLoss ? 'text-red-400' : 'text-yellow-400';
    const resultText = result ? `${isWin ? 'W' : isLoss ? 'L' : 'T'} ${result.ourScore}-${result.opponentScore}` : 'Upcoming';

    return (
        <div className="relative group">
            <button
                onClick={() => onWeekChange(week)}
                className={`p-3 w-full h-full rounded-lg flex flex-col items-center justify-center text-center transition-all duration-200 transform hover:scale-105
                    ${isSelected 
                        ? 'bg-[var(--accent-primary)] text-white ring-2 ring-offset-2 ring-offset-[var(--bg-secondary)] ring-[var(--accent-primary)]' 
                        : 'bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)]'
                    }`
                }
            >
                <div className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-[var(--text-primary)]'}`}>{displayWeek}</div>
                <div className={`text-xs ${isSelected ? 'text-gray-200' : 'text-[var(--text-secondary)]'}`}>{date ? `${month} ${day}`: ''}</div>
                <div className={`mt-2 font-semibold text-base ${isSelected ? 'text-white' : 'text-[var(--text-primary)]'}`}>vs {opponent}</div>
                <div className={`text-xs mt-1 ${isSelected ? 'text-gray-200' : 'text-[var(--text-secondary)]'}`}>
                    {homeAway === 'Home' 
                        ? <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">Home</span> 
                        : <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">Away</span>
                    }
                </div>
                <div className={`mt-2 font-mono text-sm font-bold ${isSelected ? 'text-white' : resultClass}`}>
                    {resultText}
                </div>
            </button>
            <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="absolute top-2 right-2 p-1.5 bg-black/30 rounded-full text-white/70 hover:bg-black/60 hover:text-white transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label={`Edit event for ${displayWeek}`}
            >
                <EditIcon className="w-4 h-4" />
            </button>
        </div>
    );
};


const WeekSelectorModal: React.FC = () => {
    const { isWeekSelectorModalOpen, setIsWeekSelectorModalOpen, seasonWeeks, selectedWeek, handleWeekChange, opponentNames, homeAwayStatus, weekResults, weekDates, setIsImportModalOpen, handleAddNewEvent, handleEditEvent } = useGameState();
    
    const onClose = () => setIsWeekSelectorModalOpen(false);
    const onWeekChange = (week: string) => {
        handleWeekChange(week);
        onClose();
    };
    
    const onOpenImport = () => {
        setIsWeekSelectorModalOpen(false); // Close current modal
        setIsImportModalOpen(true);     // Open import modal
    };
    
    const onOpenAddEvent = () => {
        handleAddNewEvent();
    };

    const games = useMemo(() => {
        return seasonWeeks.map(week => {
            const date = weekDates[week];
            return {
                week,
                opponent: opponentNames[week] || 'OPP',
                date: date,
                homeAway: homeAwayStatus[week] || 'Home',
                result: weekResults[week] || null
            };
        });
    }, [seasonWeeks, opponentNames, weekDates, homeAwayStatus, weekResults]);


    if (!isWeekSelectorModalOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="glass-effect rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Game Schedule</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={onOpenAddEvent} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-md hover:bg-[var(--border-primary)] hover:text-white transition-colors">
                            <PlusCircleIcon className="w-4 h-4" />
                            Add Event
                        </button>
                        <button onClick={onOpenImport} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-md hover:bg-[var(--border-primary)] hover:text-white transition-colors">
                            <ImportIcon className="w-4 h-4" />
                            Import Plan
                        </button>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10" aria-label="Close">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </header>
                <main className="p-4 overflow-y-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {games.map((game, index) => (
                            <GameDayCard 
                                key={game.week}
                                game={game}
                                displayWeek={`WK${index + 1}`}
                                isSelected={game.week === selectedWeek}
                                onWeekChange={onWeekChange}
                                onEdit={() => handleEditEvent(game.week)}
                            />
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default WeekSelectorModal;
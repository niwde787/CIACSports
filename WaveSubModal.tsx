import React, { useMemo } from 'react';
import { useGameState } from '../contexts/GameStateContext';
import { LogoutIcon, SpinnerIcon, ChevronLeftIcon } from './icons';

const TopHeader: React.FC<{ showBack?: boolean; onBack?: () => void; }> = ({ showBack, onBack }) => {
    const { user, teamName, coachName, navBarPosition, syncState, selectedWeek, opponentNames, handleSignOut, isSigningOut, seasonWeeks } = useGameState();

    const isViewerMode = !user?.email;

    const wrapperClasses = useMemo(() => {
        return 'fixed top-0 left-0 right-0 z-40 pointer-events-none';
    }, []);

    const innerContainerClasses = useMemo(() => {
        const isVertical = navBarPosition === 'left' || navBarPosition === 'right';
        const padding = isVertical ? '' : 'px-2 sm:px-4';
        return `w-full ${padding} pointer-events-auto`;
    }, [navBarPosition]);

    const headerBoxClasses = useMemo(() => {
        const margin = {
            bottom: '',
            top: '',
            left: 'ml-24',
            right: 'mr-24',
        }[navBarPosition];
        return `h-14 grid grid-cols-3 items-center glass-effect border-b border-[var(--border-primary)] px-4 ${margin}`;
    }, [navBarPosition]);
    
    const statusInfo = useMemo(() => {
        switch (syncState) {
            case 'syncing':
                return { color: 'bg-yellow-400 animate-pulse', text: 'Syncing...' };
            case 'synced':
                return { color: 'bg-green-400', text: 'Up to date' };
            case 'offline':
                return { color: 'bg-red-500', text: 'Offline' };
            case 'idle':
            default:
                return { color: 'bg-gray-500', text: 'Idle' };
        }
    }, [syncState]);
    
    const opponentName = opponentNames[selectedWeek] || 'Opponent';

    const displayWeek = useMemo(() => {
        const index = seasonWeeks.findIndex(w => w === selectedWeek);
        return index > -1 ? `WK${index + 1}` : selectedWeek;
    }, [selectedWeek, seasonWeeks]);

    return (
        <div className={wrapperClasses}>
            <div className={innerContainerClasses}>
                <div className={headerBoxClasses}>
                    <div className="flex items-center gap-4 justify-start">
                        {showBack ? (
                             <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold text-[var(--text-secondary)] hover:text-white">
                                <ChevronLeftIcon className="w-6 h-6" />
                                <span>Back</span>
                            </button>
                        ) : (
                            <>
                                <div className="flex items-center gap-2">
                                    <div 
                                        className={`w-3 h-3 rounded-full transition-colors duration-300 ${statusInfo.color}`} 
                                        title={`Status: ${statusInfo.text}`}
                                    ></div>
                                    <h1 className="text-base font-bold text-[var(--text-primary)] truncate">
                                        {isViewerMode ? (teamName || 'Team View') : `Coach: ${coachName || 'N/A'}`}
                                    </h1>
                                </div>
                                
                            </>
                        )}
                    </div>
                    
                    <div className="text-center truncate">
                        <p className="text-base font-bold text-[var(--text-primary)]" title={`${displayWeek}: vs ${opponentName}`}>
                            {displayWeek} <span className="text-[var(--text-secondary)]">vs</span> {opponentName}
                        </p>
                    </div>

                    <div className="flex justify-end items-center">
                       {!showBack && (
                           <button
                                onClick={handleSignOut}
                                disabled={isSigningOut}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-transparent text-[var(--text-secondary)] rounded-md hover:bg-[var(--bg-tertiary)] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Return to Main Menu"
                            >
                                {isSigningOut ? (
                                    <SpinnerIcon className="w-5 h-5" />
                                ) : (
                                    <LogoutIcon className="w-5 h-5" />
                                )}
                                <span className="hidden sm:inline">Main Menu</span>
                            </button>
                       )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TopHeader;
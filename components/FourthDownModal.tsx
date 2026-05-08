import React from 'react';
import { useGameState } from '../contexts/GameStateContext';

const FourthDownModal: React.FC = () => {
    const { handleFourthDownDecision, nextPlayState } = useGameState();

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="glass-effect rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in">
                <header className="p-4 border-b border-[var(--border-primary)]">
                    <h2 className="text-xl font-bold text-[var(--text-primary)] text-center">
                        4th Down & {nextPlayState.distance}
                    </h2>
                </header>
                <main className="p-6 space-y-3">
                     <button 
                        onClick={() => handleFourthDownDecision('go')}
                        className="w-full px-6 py-4 bg-[var(--accent-secondary)] text-white text-lg font-bold rounded-lg hover:bg-[var(--accent-secondary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)] focus:ring-[var(--accent-secondary)]"
                    >
                        Go for It
                    </button>
                     <button 
                        onClick={() => handleFourthDownDecision('punt')}
                        className="w-full px-6 py-3 bg-[var(--accent-special)] text-white font-bold rounded-lg hover:bg-[var(--accent-special-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)] focus:ring-[var(--accent-special)]"
                    >
                        Punt
                    </button>
                    <button 
                        onClick={() => handleFourthDownDecision('fg')}
                        className="w-full px-6 py-3 bg-[var(--accent-primary)] text-white font-bold rounded-lg hover:bg-[var(--accent-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)] focus:ring-[var(--accent-primary)]"
                    >
                        Field Goal
                    </button>
                </main>
            </div>
        </div>
    );
};

export default FourthDownModal;
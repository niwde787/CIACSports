import React, { useState } from 'react';
import { useGameState } from '../contexts/GameStateContext';

const CoinTossModal: React.FC = () => {
    const { handleStartGameFromCoinToss, teamName, opponentNames, selectedWeek, setIsCoinTossModalOpen } = useGameState();
    const [winner, setWinner] = useState<'us' | 'them'>('us');
    const [choice, setChoice] = useState<'receive' | 'defer'>('receive');

    const opponentName = opponentNames[selectedWeek] || 'Opponent';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleStartGameFromCoinToss(winner, choice);
    };

    const handleClose = () => {
        setIsCoinTossModalOpen(false);
    };

    const radioBaseClass = "flex items-center justify-center w-full px-4 py-3 text-sm font-medium transition-colors border rounded-md focus:outline-none";
    const radioActive_us = "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white";
    const radioInactive = "bg-transparent border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[var(--border-primary)]";
    const radioActive_them = "bg-[var(--accent-special)] border-[var(--accent-special)] text-white";

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <form onSubmit={handleSubmit} className="glass-effect rounded-2xl shadow-2xl w-full max-w-sm animate-fade-in">
                <header className="p-4 border-b border-[var(--border-primary)]">
                    <h2 className="text-xl font-bold text-[var(--text-primary)] text-center">Game Start: Coin Toss</h2>
                </header>
                <main className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2 text-center">Who won the toss?</label>
                        <div className="grid grid-cols-2 gap-2">
                             <button type="button" onClick={() => setWinner('us')} className={`${radioBaseClass} ${winner === 'us' ? radioActive_us : radioInactive}`}>{teamName}</button>
                             <button type="button" onClick={() => setWinner('them')} className={`${radioBaseClass} ${winner === 'them' ? radioActive_them : radioInactive}`}>{opponentName}</button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2 text-center">What did they choose?</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => setChoice('receive')} className={`${radioBaseClass} ${choice === 'receive' ? radioInactive : radioInactive} ${choice === 'receive' ? 'bg-[var(--border-primary)] text-white' : ''}`}>Receive</button>
                            <button type="button" onClick={() => setChoice('defer')} className={`${radioBaseClass} ${choice === 'defer' ? radioInactive : radioInactive} ${choice === 'defer' ? 'bg-[var(--border-primary)] text-white' : ''}`}>Defer</button>
                        </div>
                    </div>
                </main>
                <footer className="p-4 border-t border-[var(--border-primary)] space-y-2">
                    <button type="submit" className="w-full px-6 py-3 bg-[var(--accent-primary)] text-white font-bold rounded-lg hover:bg-[var(--accent-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)] focus:ring-[var(--accent-primary)]">
                        Start Game
                    </button>
                    <button type="button" onClick={handleClose} className="w-full px-6 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--border-primary)] focus:outline-none">
                        Start Later
                    </button>
                </footer>
            </form>
        </div>
    );
};

export default CoinTossModal;
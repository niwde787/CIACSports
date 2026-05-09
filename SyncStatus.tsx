import React from 'react';

interface RoleSelectionScreenProps {
    onRoleSelect: (role: 'coach' | 'viewer') => void;
}

const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({ onRoleSelect }) => {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-2xl text-center">
                <img src="https://raw.githubusercontent.com/niwde787/CJF/main/SNAPS_S.svg" alt="Snaps Logo" className="h-24 mx-auto mb-8" />
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">How will you be using Live Snaps?</h1>
                <p className="mt-2 text-lg text-[var(--text-secondary)]">Choose your role to get started.</p>

                <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Coach Option */}
                    <button
                        onClick={() => onRoleSelect('coach')}
                        className="group bg-[var(--bg-secondary)] p-8 rounded-lg shadow-xl border border-[var(--border-primary)] hover:border-[var(--accent-primary)] hover:scale-105 transition-all duration-200"
                    >
                        <div className="w-16 h-16 mx-auto bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center text-[var(--accent-primary)] group-hover:bg-[var(--accent-primary)] group-hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </div>
                        <h2 className="mt-4 text-xl font-bold text-[var(--text-primary)]">Set Up My Team</h2>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">For coaches who want to manage rosters, track plays, and analyze game data.</p>
                    </button>

                    {/* Viewer Option */}
                    <button
                        onClick={() => onRoleSelect('viewer')}
                        className="group bg-[var(--bg-secondary)] p-8 rounded-lg shadow-xl border border-[var(--border-primary)] hover:border-[var(--accent-primary)] hover:scale-105 transition-all duration-200"
                    >
                         <div className="w-16 h-16 mx-auto bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center text-[var(--accent-primary)] group-hover:bg-[var(--accent-primary)] group-hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 002 2h3m10 0h3a2 2 0 002-2v-3a2 2 0 00-2-2h-3m-3.5 6.344A17.936 17.936 0 0112 21.75c-2.676 0-5.216-.584-7.5-1.656M3.5 16.12A17.94 17.94 0 0112 2.25c2.676 0 5.216.584 7.5 1.656m-15 0a17.94 17.94 0 0015 0" />
                            </svg>
                        </div>
                        <h2 className="mt-4 text-xl font-bold text-[var(--text-primary)]">Follow a Game</h2>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">For parents, fans, and players who want to view live play-by-play and game schedules.</p>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoleSelectionScreen;

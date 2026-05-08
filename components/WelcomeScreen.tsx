import React, { useState } from 'react';
import { SpinnerIcon, LogoutIcon } from './icons';
import { signOut } from '../firebase';
import ConfirmationModal from './ConfirmationModal';

interface WelcomeScreenProps {
    onTeamCreate: (teamName: string, coachName: string, ageGroup: string) => Promise<void>;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onTeamCreate }) => {
    const [teamName, setTeamName] = useState('');
    const [coachName, setCoachName] = useState('');
    const [ageGroup, setAgeGroup] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!teamName.trim() || !coachName.trim() || !ageGroup.trim()) {
            setError('Please enter your name, team name, and select an age group.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await onTeamCreate(teamName.trim(), coachName.trim(), ageGroup);
        } catch (err) {
            setError('Could not create team. Please try again.');
            setIsLoading(false);
        }
    };

    const handleSignOut = () => {
        setIsSignOutConfirmOpen(true);
    };

    const confirmSignOut = async () => {
        setIsSigningOut(true);
        try {
            await signOut();
            window.location.reload();
        } catch (error) {
            console.error("Sign out error:", error);
            setError("Could not sign out. Please try again.");
            setIsSigningOut(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col justify-center items-center p-4 relative">
             <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-transparent text-[var(--text-secondary)] rounded-md hover:bg-[var(--bg-tertiary)] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
                aria-label="Return to Main Menu"
            >
                {isSigningOut ? (
                    <SpinnerIcon className="w-5 h-5" />
                ) : (
                    <LogoutIcon className="w-5 h-5" />
                )}
                <span className="hidden sm:inline">Main Menu</span>
            </button>
            <div className="w-full max-w-md text-center">
                <img src="https://raw.githubusercontent.com/niwde787/CJF/main/SNAPS_S.svg" alt="Snaps Logo" className="h-24 mx-auto mb-8" />
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">Welcome, Coach!</h1>
                <p className="mt-2 text-lg text-[var(--text-secondary)]">Let's get your team set up.</p>

                <form onSubmit={handleSubmit} className="mt-8">
                    {error && (
                        <div className="bg-red-500/20 text-red-300 text-sm p-3 rounded-md mb-4">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4 mb-6">
                        <div>
                            <label htmlFor="coachName" className="block text-sm font-medium text-[var(--text-secondary)] mb-1 text-left">Your Name</label>
                            <input
                                type="text"
                                id="coachName"
                                value={coachName}
                                onChange={(e) => setCoachName(e.target.value)}
                                required
                                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md py-3 px-4 text-lg text-[var(--text-primary)] focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]"
                                placeholder="e.g., John Smith"
                            />
                        </div>
                        <div>
                            <label htmlFor="teamName" className="block text-sm font-medium text-[var(--text-secondary)] mb-1 text-left">Team Name</label>
                            <input
                                type="text"
                                id="teamName"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                required
                                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md py-3 px-4 text-lg text-[var(--text-primary)] focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]"
                                placeholder="e.g., Cheshire Rams"
                            />
                        </div>
                        <div>
                            <label htmlFor="ageGroup" className="block text-sm font-medium text-[var(--text-secondary)] mb-1 text-left">Age Group</label>
                            <select
                                id="ageGroup"
                                value={ageGroup}
                                onChange={(e) => setAgeGroup(e.target.value)}
                                required
                                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md py-3 px-4 text-lg text-[var(--text-primary)] focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]"
                            >
                                <option value="">Select Age Group</option>
                                <option value="6U">6U</option>
                                <option value="8U">8U</option>
                                <option value="10U">10U</option>
                                <option value="12U">12U</option>
                                <option value="14U">14U</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-[var(--accent-primary)] text-white font-bold text-lg rounded-lg hover:bg-[var(--accent-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)] focus:ring-[var(--accent-primary)] disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        {isLoading && <SpinnerIcon className="w-5 h-5" />}
                        {isLoading ? 'Creating Team...' : 'Get Started'}
                    </button>
                </form>
            </div>
            {isSignOutConfirmOpen && (
                <ConfirmationModal
                    isOpen={isSignOutConfirmOpen}
                    onClose={() => setIsSignOutConfirmOpen(false)}
                    onConfirm={confirmSignOut}
                    title="Sign Out"
                    message="Are you sure you want to sign out? You will have to sign in again to complete your team setup."
                />
            )}
        </div>
    );
};

export default WelcomeScreen;
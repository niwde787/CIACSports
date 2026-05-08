import React, { useState, useEffect } from 'react';
import { db, signOut, getAllTeamData } from '../firebase';
import ConfirmationModal from './ConfirmationModal';
import { SpinnerIcon, SearchIcon, LogoutIcon } from './icons';

interface Team {
    id: string;
    teamName: string;
    teamCity: string;
    coachName: string;
}

interface TeamSearchScreenProps {
    onTeamSelect: (teamId: string) => void;
}

const TeamSearchScreen: React.FC<TeamSearchScreenProps> = ({ onTeamSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [allTeams, setAllTeams] = useState<Team[]>([]);
    const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [isSignOutConfirmOpen, setIsSignOutConfirmOpen] = useState(false);

    useEffect(() => {
        const fetchTeams = async () => {
            setIsLoading(true);
            try {
                const snapshot = await db.collection('users').where('role', '==', 'coach').get();
                const teamsData: Team[] = snapshot.docs
                    .map((doc: any) => ({ id: doc.id, ...doc.data() }))
                    .filter((team: any) => team.teamName)
                    .map((team: any) => ({
                        id: team.id,
                        teamName: team.teamName,
                        teamCity: team.teamCity || '',
                        coachName: team.coachName || 'N/A'
                    }));
                setAllTeams(teamsData);
                // Initially, the filtered list is empty until a search is performed.
                setFilteredTeams([]);
            } catch (error) {
                console.error("Error fetching teams:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTeams();
    }, []);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredTeams([]);
            return;
        }
        const lowercasedTerm = searchTerm.toLowerCase();
        const results = allTeams.filter(team =>
            team.teamName.toLowerCase().includes(lowercasedTerm) ||
            team.teamCity.toLowerCase().includes(lowercasedTerm) ||
            team.coachName.toLowerCase().includes(lowercasedTerm)
        );
        setFilteredTeams(results);
    }, [searchTerm, allTeams]);

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
            setIsSigningOut(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center p-4 pt-10 sm:pt-20">
            <div className="w-full max-w-2xl text-center relative">
                 <button
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="absolute top-0 right-0 flex items-center gap-2 px-3 py-1.5 text-sm font-semibold bg-transparent text-[var(--text-secondary)] rounded-md hover:bg-[var(--bg-tertiary)] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
                    aria-label="Return to Main Menu"
                >
                    {isSigningOut ? (
                        <SpinnerIcon className="w-5 h-5" />
                    ) : (
                        <LogoutIcon className="w-5 h-5" />
                    )}
                    <span className="hidden sm:inline">Main Menu</span>
                </button>
                <img src="https://raw.githubusercontent.com/niwde787/CJF/main/SNAPS_S.svg" alt="Snaps Logo" className="h-20 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">Find a Team</h1>
                <p className="mt-2 text-lg text-[var(--text-secondary)]">Search for a team to view their schedule and live games.</p>
            </div>
            <div className="w-full max-w-2xl">
                <div className="mt-8 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <SearchIcon className="h-5 w-5 text-[var(--text-secondary)]" />
                    </div>
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by team name, city, or coach..."
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg py-3 pl-10 pr-4 text-lg text-[var(--text-primary)] focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]"
                    />
                </div>

                <div className="mt-6 max-h-[50vh] overflow-y-auto pr-2 no-scrollbar">
                    {isLoading ? (
                        <div className="flex justify-center items-center p-8">
                            <SpinnerIcon className="w-8 h-8 text-[var(--accent-primary)]" />
                        </div>
                    ) : searchTerm ? (
                        <ul className="space-y-3">
                            {filteredTeams.length > 0 ? (
                                filteredTeams.map(team => (
                                    <li key={team.id}>
                                        <button
                                            onClick={() => onTeamSelect(team.id)}
                                            className="w-full text-left bg-[var(--bg-tertiary)] p-4 rounded-lg hover:bg-[var(--border-primary)] transition-colors"
                                        >
                                            <p className="font-bold text-lg text-[var(--text-primary)]">{team.teamName}</p>
                                            <p className="text-sm text-[var(--text-secondary)]">
                                                {team.teamCity && `${team.teamCity} • `}Coach: {team.coachName}
                                            </p>
                                        </button>
                                    </li>
                                ))
                            ) : (
                                <p className="text-center text-[var(--text-secondary)] py-8">No teams found for "{searchTerm}".</p>
                            )}
                        </ul>
                    ) : (
                         <p className="text-center text-[var(--text-secondary)] py-8">Start typing to search for a team.</p>
                    )}
                </div>
            </div>
            {isSignOutConfirmOpen && (
                <ConfirmationModal
                    isOpen={isSignOutConfirmOpen}
                    onClose={() => setIsSignOutConfirmOpen(false)}
                    onConfirm={confirmSignOut}
                    title="Sign Out"
                    message="Are you sure you want to sign out?"
                />
            )}
        </div>
    );
};

export default TeamSearchScreen;
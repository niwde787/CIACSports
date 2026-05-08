import React, { useState } from 'react';
import { SpinnerIcon, TrashIcon } from './icons';
import { saveInitialRoster, db } from '../firebase';
import { PlayerStatus } from '../types';

interface NewPlayer {
    jerseyNumber: number;
    name: string;
    position: string;
}

interface RosterSetupScreenProps {
    user: any;
    onComplete: () => void;
}

const RosterSetupScreen: React.FC<RosterSetupScreenProps> = ({ user, onComplete }) => {
    const [players, setPlayers] = useState<NewPlayer[]>([]);
    const [jersey, setJersey] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAddPlayer = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const jerseyNum = parseInt(jersey, 10);
        if (!jerseyNum || !name.trim()) {
            setError('Jersey and name are required.');
            return;
        }
        if (players.some(p => p.jerseyNumber === jerseyNum)) {
            setError(`Player with jersey #${jerseyNum} already exists.`);
            return;
        }
        setPlayers([...players, { jerseyNumber: jerseyNum, name: name.trim(), position: '' }].sort((a,b) => a.jerseyNumber - b.jerseyNumber));
        setJersey('');
        setName('');
        document.getElementById('jerseyNumber')?.focus();
    };

    const handleRemovePlayer = (jerseyNum: number) => {
        setPlayers(players.filter(p => p.jerseyNumber !== jerseyNum));
    };

    const handleSaveRoster = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // The schedule is created with default weeks during user initialization.
            // We just need to save the initial (possibly empty) roster to those weeks.
            const userDoc = await db.collection('users').doc(user.uid).get();
            const schedule = userDoc.data()?.schedule;
            const seasonWeeks = schedule?.weeks || ['WK1', 'WK2', 'WK3', 'WK4', 'WK5', 'WK6', 'WK7', 'WK8'];
            
            const playersToSave = players.map(p => ({ ...p, status: PlayerStatus.Playing }));
            await saveInitialRoster(user.uid, seasonWeeks, playersToSave);
            onComplete();
        } catch (err) {
            console.error(err);
            setError('Could not save roster. Please try again.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-2xl text-center">
                 <img src="https://raw.githubusercontent.com/niwde787/CJF/main/SNAPS_S.svg" alt="Snaps Logo" className="h-20 mx-auto mb-6" />
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">Set Up Your Roster</h1>
                <p className="mt-2 text-lg text-[var(--text-secondary)]">Add players for the season. You can add more or import a roster later.</p>

                <div className="mt-8 text-left bg-[var(--bg-secondary)] p-6 rounded-lg shadow-xl">
                    <form onSubmit={handleAddPlayer} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                        <div className="sm:col-span-1">
                            <label htmlFor="jerseyNumber" className="block text-sm font-medium text-[var(--text-secondary)]">Jersey #</label>
                            <input type="number" id="jerseyNumber" value={jersey} onChange={e => setJersey(e.target.value)} className="mt-1 w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md py-2 px-3 text-[var(--text-primary)]" />
                        </div>
                        <div className="sm:col-span-2">
                            <label htmlFor="playerName" className="block text-sm font-medium text-[var(--text-secondary)]">Player Name</label>
                            <input type="text" id="playerName" value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md py-2 px-3 text-[var(--text-primary)]" placeholder="Lastname, Firstname" />
                        </div>
                        <button type="submit" className="sm:col-span-1 w-full py-2 px-4 bg-[var(--accent-primary)] text-white font-bold rounded-lg hover:bg-[var(--accent-primary-hover)]">Add</button>
                    </form>
                    
                    {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
                    
                    <div className="mt-6 max-h-60 overflow-y-auto pr-2 no-scrollbar">
                        {players.length > 0 ? (
                            <ul className="space-y-2">
                                {players.map(p => (
                                    <li key={p.jerseyNumber} className="flex justify-between items-center bg-[var(--bg-tertiary)] p-2 rounded-md">
                                        <p>
                                            <span className="font-bold text-lg text-[var(--text-primary)] w-12 inline-block">#{p.jerseyNumber}</span>
                                            <span className="font-semibold text-sm text-[var(--text-secondary)] w-12 inline-block">{p.position}</span>
                                            <span className="text-[var(--text-secondary)]">{p.name}</span>
                                        </p>
                                        <button onClick={() => handleRemovePlayer(p.jerseyNumber)} className="text-red-400 hover:text-red-300 p-1"><TrashIcon className="w-5 h-5" /></button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center text-[var(--text-secondary)] py-8">You can add players now, or skip and import a roster later.</p>
                        )}
                    </div>
                </div>

                <div className="mt-8">
                    <button onClick={handleSaveRoster} disabled={isLoading} className="w-full max-w-xs mx-auto flex justify-center items-center gap-2 py-3 px-4 bg-[var(--accent-primary)] text-white font-bold text-lg rounded-lg hover:bg-[var(--accent-primary-hover)] disabled:bg-gray-500">
                        {isLoading && <SpinnerIcon className="w-5 h-5" />}
                        {isLoading ? 'Saving...' : 'Save & Continue to Calendar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RosterSetupScreen;

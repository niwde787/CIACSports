import React, { useState, useMemo, useEffect } from 'react';
import { useGameState } from '../contexts/GameStateContext';

const AddEventModal: React.FC = () => {
    const { 
        setIsAddEventModalOpen, 
        editingEventWeek, 
        setEditingEventWeek, 
        opponentNames, 
        opponentCities,
        homeAwayStatus, 
        weekDates, 
        handleSaveEvent, 
        handleDeleteEvent, 
        seasonWeeks 
    } = useGameState();
    
    const isEditMode = editingEventWeek !== null && !editingEventWeek.startsWith('NEW_');
    const isNewMode = editingEventWeek !== null && editingEventWeek.startsWith('NEW_');

    const [opponentName, setOpponentName] = useState('');
    const [opponentCity, setOpponentCity] = useState('');
    const [homeAway, setHomeAway] = useState<'Home' | 'Away' | 'OPP'>('Home');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [time, setTime] = useState('10:00');

    useEffect(() => {
        if (isEditMode && editingEventWeek) {
            setOpponentName(opponentNames[editingEventWeek] || 'OPP');
            setOpponentCity(opponentCities[editingEventWeek] || '');
            setHomeAway(homeAwayStatus[editingEventWeek] || 'Home');
            setDate(weekDates[editingEventWeek] || new Date().toISOString().split('T')[0]);
        } else {
            // Defaults for a new event
            setOpponentName('');
            setOpponentCity('');
            setHomeAway('Home');
            const nextSaturday = new Date();
            nextSaturday.setDate(nextSaturday.getDate() + (6 - nextSaturday.getDay() + 7) % 7);
            setDate(nextSaturday.toISOString().split('T')[0]);
            setTime('10:00');
        }
    }, [isEditMode, editingEventWeek, opponentNames, opponentCities, homeAwayStatus, weekDates]);

    const onClose = () => {
        setIsAddEventModalOpen(false);
        setEditingEventWeek(null);
    };
    
    const handleSave = () => {
        const week = editingEventWeek ? editingEventWeek.replace('NEW_', '') : `WK${seasonWeeks.length + 1}`;
        handleSaveEvent({
            week,
            isNew: isNewMode,
            opponentName: opponentName.trim() || 'OPP',
            opponentCity: opponentCity.trim(),
            homeAway,
            date,
        });
    };

    const handleDelete = () => {
        if (isEditMode && editingEventWeek) {
            handleDeleteEvent(editingEventWeek);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 font-sans" onClick={onClose}>
            <div className="glass-effect rounded-2xl shadow-2xl w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">{isEditMode ? 'Edit Event' : 'Add New Event'}</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10" aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>

                <main className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="opponentName" className="block text-sm font-medium text-[var(--text-secondary)]">Opponent Name</label>
                            <input
                                type="text"
                                id="opponentName"
                                value={opponentName}
                                onChange={e => setOpponentName(e.target.value)}
                                className="mt-1 w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md py-2 px-3 text-white"
                                placeholder="e.g., Knights"
                            />
                        </div>
                        <div>
                            <label htmlFor="opponentCity" className="block text-sm font-medium text-[var(--text-secondary)]">City</label>
                            <input
                                type="text"
                                id="opponentCity"
                                value={opponentCity}
                                onChange={e => setOpponentCity(e.target.value)}
                                className="mt-1 w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md py-2 px-3 text-white"
                                placeholder="e.g., Southington"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="eventDate" className="block text-sm font-medium text-[var(--text-secondary)]">Date</label>
                            <input
                                type="date"
                                id="eventDate"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="mt-1 w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md py-2 px-3 text-white"
                            />
                        </div>
                        <div>
                            <label htmlFor="homeAway" className="block text-sm font-medium text-[var(--text-secondary)]">Location</label>
                            <select
                                id="homeAway"
                                value={homeAway}
                                onChange={e => setHomeAway(e.target.value as any)}
                                className="mt-1 w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md py-2.5 px-3 text-white"
                            >
                                <option value="Home">Home</option>
                                <option value="Away">Away</option>
                                <option value="OPP">OPP</option>
                            </select>
                        </div>
                    </div>
                </main>

                <footer className="p-4 border-t border-[var(--border-primary)] flex justify-between items-center">
                    <div>
                        {isEditMode && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-500/20 text-red-300 font-bold rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                            >
                                Delete Event
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2">
                         <button type="button" onClick={onClose} className="px-6 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--border-primary)]">Cancel</button>
                        <button type="button" onClick={handleSave} className="px-6 py-2 bg-[var(--accent-primary)] text-white font-bold rounded-lg hover:bg-[var(--accent-primary-hover)]">Save</button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default AddEventModal;
import React, { useState, useEffect } from 'react';
import { SpinnerIcon } from './icons';
import { getUserSchedule, saveSchedule, db } from '../firebase';

interface CalendarSetupScreenProps {
    user: any;
    onComplete: () => void;
}

const CalendarSetupScreen: React.FC<CalendarSetupScreenProps> = ({ user, onComplete }) => {
    const [schedule, setSchedule] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                const userSchedule = await getUserSchedule(user.uid);
                if (userSchedule) {
                    setSchedule(userSchedule);
                } else {
                    setError("Could not load schedule.");
                }
            } catch (e) {
                setError("Could not load schedule.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchSchedule();
    }, [user.uid]);

    const handleFieldChange = (week: string, field: string, value: string) => {
        setSchedule((prev: any) => ({
            ...prev,
            [field]: {
                ...prev[field],
                [week]: value
            }
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        try {
            await saveSchedule(user.uid, schedule);
            await db.collection('users').doc(user.uid).set({ setupCompleted: true }, { merge: true });
            onComplete();
        } catch (e) {
            setError("Failed to save schedule. Please try again.");
            setIsSaving(false);
        }
    };
    
    if (isLoading) {
        return <div className="min-h-screen bg-[var(--bg-primary)] flex justify-center items-center"><SpinnerIcon className="w-12 h-12 text-[var(--accent-primary)]" /></div>;
    }
    
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-4xl text-center">
                <img src="https://raw.githubusercontent.com/niwde787/CJF/main/SNAPS_S.svg" alt="Snaps Logo" className="h-20 mx-auto mb-6" />
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">Configure Your Schedule</h1>
                <p className="mt-2 text-lg text-[var(--text-secondary)]">Set opponents, dates, and locations for each game.</p>
                
                <div className="mt-8 text-left bg-[var(--bg-secondary)] p-6 rounded-lg shadow-xl">
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
                        {schedule && schedule.weeks.map((week: string) => (
                            <div key={week} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-[var(--bg-tertiary)] p-3 rounded-md">
                                <strong className="sm:col-span-1 text-[var(--text-primary)]">{week}</strong>
                                <div className="sm:col-span-5">
                                    <label className="block text-xs text-[var(--text-secondary)]">Opponent</label>
                                    <input type="text" value={schedule.opponents[week] || ''} onChange={e => handleFieldChange(week, 'opponents', e.target.value)} className="mt-1 w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md py-1 px-2 text-sm" />
                                </div>
                                <div className="sm:col-span-3">
                                    <label className="block text-xs text-[var(--text-secondary)]">Date</label>
                                    <input type="date" value={schedule.dates[week] || ''} onChange={e => handleFieldChange(week, 'dates', e.target.value)} className="mt-1 w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md py-1 px-2 text-sm" />
                                </div>
                                <div className="sm:col-span-3">
                                    <label className="block text-xs text-[var(--text-secondary)]">Location</label>
                                    <select value={schedule.homeAway[week] || 'Home'} onChange={e => handleFieldChange(week, 'homeAway', e.target.value)} className="mt-1 w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md py-1.5 px-2 text-sm">
                                        <option>Home</option>
                                        <option>Away</option>
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-8">
                    {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
                    <button onClick={handleSave} disabled={isSaving} className="w-full max-w-xs mx-auto flex justify-center items-center gap-2 py-3 px-4 bg-[var(--accent-primary)] text-white font-bold text-lg rounded-lg hover:bg-[var(--accent-primary-hover)] disabled:bg-gray-500">
                        {isSaving && <SpinnerIcon className="w-5 h-5" />}
                        Finish Setup & Enter App
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CalendarSetupScreen;
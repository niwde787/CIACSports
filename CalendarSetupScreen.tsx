import React, { useState } from 'react';
import { SpinnerIcon } from './icons';
import { PlayerStatus } from '../types';
import { DEFAULT_PLAYER_IMAGE } from '../constants';
import { CameraIcon } from './icons';

interface AddPlayerModalProps {
    onClose: () => void;
    onAddPlayer: (player: { jerseyNumber: number; name: string; position: string; status: PlayerStatus; imageUrl?: string }) => Promise<void>;
}

const AddPlayerModal: React.FC<AddPlayerModalProps> = ({ onClose, onAddPlayer }) => {
    const [jersey, setJersey] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [status, setStatus] = useState<PlayerStatus>(PlayerStatus.Playing);
    const [imageUrl, setImageUrl] = useState(DEFAULT_PLAYER_IMAGE);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => setImageUrl(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        const jerseyNum = parseInt(jersey, 10);
        if (!jerseyNum || !firstName.trim() || !lastName.trim()) {
            setError('Jersey, first name, and last name are required.');
            return;
        }
        setIsLoading(true);
        const name = `${lastName.trim()}, ${firstName.trim()}`;
        await onAddPlayer({ 
            jerseyNumber: jerseyNum, 
            name, 
            position: '',
            status,
            imageUrl: imageUrl !== DEFAULT_PLAYER_IMAGE ? imageUrl : undefined
        });
        setIsLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
            <form 
                onSubmit={handleSubmit} 
                className="glass-effect rounded-2xl shadow-2xl w-full max-w-md my-auto border border-[var(--border-primary)] overflow-hidden animate-fade-in" 
                onClick={e => e.stopPropagation()}
            >
                <header className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Add New Player</h2>
                    <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-[var(--text-secondary)]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <main className="p-6 space-y-6">
                    <div className="flex flex-col items-center mb-4">
                        <div className="relative group flex-shrink-0">
                            <img 
                                src={imageUrl} 
                                alt="Player Preview" 
                                referrerPolicy="no-referrer"
                                className="w-24 h-24 rounded-full object-cover border-2 border-[var(--border-primary)] aspect-square flex-shrink-0" 
                            />
                            <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()} 
                                className="absolute bottom-0 right-0 bg-[var(--bg-secondary)] p-2 rounded-full border border-[var(--border-primary)] hover:bg-[var(--bg-tertiary)] transition-colors shadow-lg"
                                title="Upload Picture"
                            >
                                <CameraIcon className="w-4 h-4 text-[var(--text-primary)]" />
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleFileChange} 
                                accept="image/*" 
                                className="hidden" 
                            />
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mt-2">Click camera to upload picture</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-1">
                            <label htmlFor="add-jerseyNumber" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Jersey #</label>
                            <input 
                                type="number" 
                                id="add-jerseyNumber" 
                                value={jersey} 
                                onChange={e => setJersey(e.target.value)} 
                                required 
                                placeholder="00"
                                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg py-2.5 px-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent outline-none transition-all" 
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="add-firstName" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">First Name</label>
                            <input 
                                type="text" 
                                id="add-firstName" 
                                value={firstName} 
                                onChange={e => setFirstName(e.target.value)} 
                                required 
                                placeholder="John"
                                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg py-2.5 px-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent outline-none transition-all" 
                            />
                        </div>
                        <div>
                            <label htmlFor="add-lastName" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Last Name</label>
                            <input 
                                type="text" 
                                id="add-lastName" 
                                value={lastName} 
                                onChange={e => setLastName(e.target.value)} 
                                required 
                                placeholder="Doe"
                                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg py-2.5 px-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent outline-none transition-all" 
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="add-status" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Status</label>
                        <select 
                            id="add-status" 
                            value={status} 
                            onChange={e => setStatus(e.target.value as PlayerStatus)} 
                            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg py-2.5 px-3 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent outline-none transition-all"
                        >
                            {Object.values(PlayerStatus).map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    {error && <p className="text-red-400 text-sm text-center font-medium">{error}</p>}
                </main>
                <footer className="p-4 border-t border-[var(--border-primary)] flex justify-end space-x-3">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-6 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--border-primary)] transition-colors text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={isLoading} 
                        className="flex items-center justify-center gap-2 px-6 py-2 bg-[var(--accent-primary)] text-white font-bold rounded-lg hover:bg-[var(--accent-primary-hover)] disabled:bg-gray-600 transition-all shadow-lg shadow-orange-500/20 text-sm"
                    >
                        {isLoading && <SpinnerIcon className="w-5 h-5" />}
                        {isLoading ? 'Adding...' : 'Add Player'}
                    </button>
                </footer>
            </form>
        </div>
    );
};

export default AddPlayerModal;

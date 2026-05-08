import React from 'react';
import { SpinnerIcon } from './icons';
import { useGameState } from '../contexts/GameStateContext';

const ActionButton: React.FC<{ onClick: () => void; disabled?: boolean; icon: React.ReactNode; text: string; isPrimary?: boolean; }> = ({ onClick, disabled, icon, text, isPrimary }) => {
    const primaryClasses = 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary-hover)] focus:ring-[var(--accent-primary)]';
    const secondaryClasses = 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--border-primary)] focus:ring-[var(--border-primary)]';
    
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`w-full flex items-center justify-center gap-3 px-4 py-3 font-bold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)] disabled:opacity-50 transition-colors ${isPrimary ? primaryClasses : secondaryClasses}`}
        >
            {icon}
            <span>{text}</span>
        </button>
    );
};

const ReportsModal: React.FC = () => {
    const {
        isReportsModalOpen,
        isExportingPdf,
        setIsReportsModalOpen,
        handleExportPdf,
        handleTriggerImport,
        handleExportJson,
    } = useGameState();

    const onClose = () => setIsReportsModalOpen(false);

    if (!isReportsModalOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="glass-effect rounded-2xl shadow-2xl w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Game Reports</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10" aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <main className="p-6 space-y-4">
                    <p className="text-sm text-[var(--text-secondary)] text-center">Export reports or manage game data files.</p>
                    
                    <ActionButton
                        onClick={handleExportPdf}
                        disabled={isExportingPdf}
                        icon={isExportingPdf ? <SpinnerIcon className="w-5 h-5" /> : <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                        text={isExportingPdf ? 'Generating PDF...' : 'Export Game Report (PDF)'}
                        isPrimary
                    />

                    <ActionButton
                        onClick={handleExportJson}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>}
                        text="Export Game Data (JSON)"
                    />
                    
                    <ActionButton
                        onClick={handleTriggerImport}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>}
                        text="Import Game Data (JSON)"
                    />
                </main>
                <footer className="p-4 border-t border-[var(--border-primary)] flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--border-primary)] focus:outline-none">Close</button>
                </footer>
            </div>
        </div>
    );
};

export default ReportsModal;

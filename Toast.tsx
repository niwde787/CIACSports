import React, { useState, useEffect, useRef } from 'react';

type SyncState = 'idle' | 'syncing' | 'synced' | 'offline';

const SyncStatus: React.FC<{ syncState: SyncState }> = ({ syncState }) => {
    const [animateCheck, setAnimateCheck] = useState(false);
    const prevSyncState = useRef(syncState);

    useEffect(() => {
        if (prevSyncState.current !== 'synced' && syncState === 'synced') {
            setAnimateCheck(true);
            const timer = setTimeout(() => setAnimateCheck(false), 600); // Animation duration + buffer
            return () => clearTimeout(timer);
        }
        prevSyncState.current = syncState;
    }, [syncState]);
    
    const ICONS: Record<SyncState, React.ReactNode> = {
        idle: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
        syncing: <svg className="animate-spin h-4 w-4 text-[var(--accent-primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>,
        synced: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" className={animateCheck ? 'animate-draw-check' : ''} />
            </svg>
        ),
        offline: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
    };

    const LABELS: Record<SyncState, string> = {
        idle: 'Idle',
        syncing: 'Syncing...',
        synced: 'Up to date',
        offline: 'Offline',
    };

    return (
        <div className="flex items-center gap-1.5" title={LABELS[syncState]}>
            {ICONS[syncState]}
            <span className="text-xs font-semibold">{LABELS[syncState]}</span>
        </div>
    );
};

export default SyncStatus;
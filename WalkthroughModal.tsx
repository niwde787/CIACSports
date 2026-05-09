import React, { useMemo } from 'react';
import { useGameState } from '../contexts/GameStateContext';

const ICONS = {
    success: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    error: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    info: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    )
}

const Toast: React.FC = () => {
    const { toast, showToast, navBarPosition } = useGameState();
    const onClose = () => showToast('', 'info'); // Hacky way to clear toast by setting empty message

    React.useEffect(() => {
        if (toast && toast.message) {
            const timer = setTimeout(() => {
                onClose();
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [toast, onClose]);

    const toastPositionClasses = useMemo(() => {
        switch (navBarPosition) {
            case 'bottom':
                return 'bottom-52 right-6';
            case 'right':
                return 'bottom-24 right-[6.5rem]';
            case 'top':
                return 'top-52 right-6';
            case 'left':
            default:
                return 'bottom-24 right-6';
        }
    }, [navBarPosition]);

    if (!toast || !toast.message) return null;

    const Icon = ICONS[toast.type];
    const typeClasses = {
        success: 'border-green-500/50',
        error: 'border-red-500/50',
        info: 'border-blue-500/50'
    }[toast.type];

    return (
        <div className={`fixed z-[70] w-full max-w-sm p-4 rounded-lg shadow-2xl glass-effect border-l-4 ${typeClasses} animate-slide-in-from-right ${toastPositionClasses}`}>
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">{Icon}</div>
                <div className="flex-grow">
                    <p className="font-bold text-[var(--text-primary)]">Notification</p>
                    <p className="text-sm text-[var(--text-secondary)]">{toast.message}</p>
                </div>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10" aria-label="Close notification">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default Toast;

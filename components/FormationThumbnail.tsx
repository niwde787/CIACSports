import React from 'react';
import { Formation } from '../types';

interface FormationThumbnailProps {
    formation: Formation;
    name?: string;
    isActive?: boolean;
    onClick?: () => void;
    className?: string;
}

const FormationThumbnail: React.FC<FormationThumbnailProps> = ({ formation, name, isActive = false, onClick, className = "" }) => {
    const content = (
        <div className={`relative w-full h-full bg-[#0a2a0a] rounded-lg overflow-hidden shadow-lg transition-colors border-2 ${isActive ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/20' : 'border-transparent'}`}>
            {/* Field lines */}
            <div className="absolute inset-0 flex flex-col justify-between py-1 opacity-20">
                <div className="h-px bg-white w-full" />
                <div className="h-px bg-white w-full" />
                <div className="h-px bg-white w-full" />
                <div className="h-px bg-white w-full" />
                <div className="h-px bg-white w-full" />
            </div>
            <div className="absolute inset-0 flex justify-center opacity-10">
                <div className="w-px h-full bg-white" />
            </div>

            {/* Positions */}
            {formation.positions.map((pos, idx) => (
                <div
                    key={idx}
                    className="absolute w-1.5 h-1.5 bg-white rounded-full border border-black/20 shadow-sm flex items-center justify-center"
                    style={{
                        top: pos.top,
                        left: pos.left,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    <span className="text-[2px] font-bold text-black select-none">{pos.label}</span>
                </div>
            ))}
        </div>
    );

    if (onClick) {
        return (
            <button 
                onClick={onClick}
                className={`group relative flex flex-col items-center gap-1 transition-all duration-200 ${isActive ? 'scale-105' : 'hover:scale-102'} ${className}`}
            >
                <div className="w-20 aspect-video">
                    {content}
                </div>
                {name && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider truncate w-20 text-center transition-colors underline ${isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'}`}>
                        {name}
                    </span>
                )}
            </button>
        );
    }

    return (
        <div className={`relative flex flex-col items-center gap-1 ${className}`}>
            {content}
            {name && (
                <span className="text-[10px] font-bold uppercase tracking-wider truncate w-full text-center text-[var(--text-secondary)] underline">
                    {name}
                </span>
            )}
        </div>
    );
};

export default FormationThumbnail;

import React from 'react';

interface FootballFieldBackgroundProps {
    logoUrl?: string;
    startYard?: number;
    endYard?: number;
    orientation?: 'horizontal' | 'vertical';
    lineOfScrimmageYard?: number;
    playDirection?: 'up' | 'down';
}

const FootballFieldBackground: React.FC<FootballFieldBackgroundProps> = ({ 
    logoUrl = "https://raw.githubusercontent.com/niwde787/CJF/1f4df5f83d0fbb85bc6ea1ac8ed36765f518e995/SNAPS_H.svg",
    startYard = 35,
    endYard = 65,
    orientation = 'vertical',
    lineOfScrimmageYard,
    playDirection = 'up'
}) => {
    const totalYards = endYard - startYard;
    const yardMarkers = [];
    for (let i = Math.ceil(startYard / 10) * 10; i <= endYard; i += 10) {
        yardMarkers.push(i);
    }

    const isVertical = orientation === 'vertical';
    const losPosition = lineOfScrimmageYard !== undefined ? ((lineOfScrimmageYard - startYard) / totalYards) * 100 : null;

    return (
        <div className={`absolute inset-0 bg-[#0d2b1a] overflow-hidden text-white/60 ${isVertical ? 'border-x' : 'border-y'} border-white/10`}>
            {/* Grass Stripes */}
            <div className="absolute inset-0 opacity-15" style={{ 
                backgroundImage: `linear-gradient(${isVertical ? '0deg' : '90deg'}, rgba(255,255,255,0.05) 50%, transparent 50%)`,
                backgroundSize: isVertical ? '100% 32px' : '32px 100%'
            }}></div>
            
            {/* Sidelines */}
            {isVertical ? (
                <>
                    <div className="absolute inset-y-0 left-0 w-1 bg-white/40 shadow-[2px_0_10px_rgba(255,255,255,0.1)]"></div>
                    <div className="absolute inset-y-0 right-0 w-1 bg-white/40 shadow-[-2px_0_10px_rgba(255,255,255,0.1)]"></div>
                </>
            ) : (
                <>
                    <div className="absolute inset-x-0 top-0 h-1 bg-white/40 shadow-[0_2px_10px_rgba(255,255,255,0.1)]"></div>
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-white/40 shadow-[0_-2px_10px_rgba(255,255,255,0.1)]"></div>
                </>
            )}

            {/* Line of Scrimmage */}
            {losPosition !== null && (
                <div 
                    className={`absolute ${isVertical ? 'w-full h-0.5' : 'h-full w-0.5'} border-dashed border-yellow-400 z-20`}
                    style={isVertical ? { top: `${losPosition}%` } : { left: `${losPosition}%` }}
                >
                    {/* Directional Arrow & Possession Indicator */}
                    <div className={`absolute ${isVertical ? 'left-1/2 -translate-x-1/2' : 'top-1/2 -translate-y-1/2'} ${playDirection === 'up' ? '-top-7' : 'top-7'} flex flex-col items-center gap-0.5 z-30`}>
                        <div className={`text-yellow-400 text-lg font-black drop-shadow-[0_0_8px_rgba(250,204,21,0.6)] animate-pulse`}>
                            {isVertical ? (playDirection === 'up' ? '▲' : '▼') : (playDirection === 'up' ? '◀' : '▶')}
                        </div>
                        <div className="bg-yellow-400/20 backdrop-blur-sm border border-yellow-400/50 px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest text-yellow-400 shadow-lg">
                            Possession
                        </div>
                    </div>
                </div>
            )}

            {/* Yard Lines */}
            {yardMarkers.map(yard => {
                const position = ((yard - startYard) / totalYards) * 100;
                const displayYard = yard <= 50 ? yard : 100 - yard;
                
                return (
                    <div 
                        key={yard} 
                        className={`absolute ${isVertical ? 'w-full flex-row' : 'h-full flex-col'} flex items-center`} 
                        style={isVertical ? { top: `${position}%` } : { left: `${position}%` }}
                    >
                        <div className={`${isVertical ? 'h-px w-full' : 'w-px h-full'} ${yard === 50 ? 'bg-white/60' : 'bg-white/30'} flex-grow`}></div>
                        <div className={`${isVertical ? 'px-3' : 'py-3'} flex flex-col items-center`}>
                             <span className={`text-[10px] font-black tracking-tighter opacity-40 select-none ${!isVertical ? '-rotate-90' : ''}`}>{displayYard}</span>
                        </div>
                        <div className={`${isVertical ? 'h-px w-full' : 'w-px h-full'} ${yard === 50 ? 'bg-white/60' : 'bg-white/30'} flex-grow`}></div>
                    </div>
                );
            })}

            {/* Hash Marks (Simplified) */}
            {isVertical ? (
                <>
                    <div className="absolute inset-y-0 left-1/4 w-px border-l border-dashed border-white/10"></div>
                    <div className="absolute inset-y-0 right-1/4 w-px border-l border-dashed border-white/10"></div>
                </>
            ) : (
                <>
                    <div className="absolute inset-x-0 top-1/4 h-px border-t border-dashed border-white/10"></div>
                    <div className="absolute inset-x-0 bottom-1/4 h-px border-t border-dashed border-white/10"></div>
                </>
            )}

            {/* Logo */}
            <img 
                src={logoUrl} 
                alt="" 
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${isVertical ? 'w-1/2' : 'h-1/2'} opacity-5 pointer-events-none grayscale brightness-200`} 
                referrerPolicy="no-referrer"
            />
        </div>
    );
};

export default FootballFieldBackground;
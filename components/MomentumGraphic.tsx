import React, { useMemo } from 'react';
import { Play } from '../types';

interface MomentumGraphicProps {
    playHistory: Play[];
    teamName: string;
    opponentName: string;
}

const MomentumGraphic: React.FC<MomentumGraphicProps> = ({ playHistory, teamName, opponentName }) => {
    const advantage = useMemo(() => {
        if (playHistory.length === 0) return 50;

        const lastPlay = playHistory[playHistory.length - 1];
        const ourScore = lastPlay.ourScore || 0;
        const opponentScore = lastPlay.opponentScore || 0;

        // Base advantage from score (each point is ~3% advantage)
        let scoreAdvantage = 50 + (ourScore - opponentScore) * 3;

        // Momentum factor: last 5 plays yards
        const last5Plays = playHistory.slice(-5);
        let ourRecentYards = 0;
        let oppRecentYards = 0;

        last5Plays.forEach(p => {
            if (p.type === 'Offense') {
                ourRecentYards += p.yardsGained || 0;
            } else if (p.type === 'Defense') {
                // In defense plays, yardsGained is usually positive for the opponent
                oppRecentYards += p.yardsGained || 0;
            }
        });

        // Roughly 1% per 4 net yards in recent plays
        const momentumBonus = (ourRecentYards - oppRecentYards) / 4; 
        
        let totalAdvantage = scoreAdvantage + momentumBonus;

        // Clamp between 5 and 95 to keep both sides visible
        return Math.max(5, Math.min(95, totalAdvantage));
    }, [playHistory]);

    const ourProb = advantage.toFixed(1);
    const oppProb = (100 - advantage).toFixed(1);

    return (
        <div className="w-full bg-[#0F1115] p-6 rounded-lg border border-[#1F2937] mb-6 shadow-xl">
            <div className="text-center mb-4">
                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Match Outcome Probabilities</span>
            </div>
            
            <div className="flex justify-between text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 px-1">
                <span>{teamName}</span>
                <span>{opponentName}</span>
            </div>
            
            <div className="relative h-10 w-full bg-[#111827] flex overflow-hidden">
                {/* Our Team Bar (Blue) */}
                <div 
                    className="h-full bg-[#60A5FA] transition-all duration-1000 ease-out flex items-center justify-center relative"
                    style={{ width: `${advantage}%` }}
                >
                    {advantage > 15 && (
                        <span className="text-white font-black text-lg tracking-tight drop-shadow-md z-10">{ourProb}%</span>
                    )}
                </div>
                
                {/* Opponent Bar (Green) */}
                <div 
                    className="h-full bg-[#34D399] transition-all duration-1000 ease-out flex items-center justify-center relative"
                    style={{ width: `${100 - advantage}%` }}
                >
                    {(100 - advantage) > 15 && (
                        <span className="text-white font-black text-lg tracking-tight drop-shadow-md z-10">{oppProb}%</span>
                    )}
                </div>

                {/* Center Divider/Indicator */}
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-black/30 z-20"></div>
            </div>

            {/* Scale Numbers (0, 10, 20, 30, 40) */}
            <div className="flex justify-between mt-2 px-0">
                {[0, 10, 20, 30, 40].map((num) => (
                    <div key={num} className="flex flex-col items-center">
                        <div className="h-1 w-px bg-[#374151] mb-1"></div>
                        <span className="text-[11px] font-bold text-white font-mono">
                            {num}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MomentumGraphic;

import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Play } from '../types';

interface GameMomentumChartProps {
    playHistory: Play[];
    teamName: string;
    opponentName: string;
}

const GameMomentumChart: React.FC<GameMomentumChartProps> = ({ playHistory, teamName, opponentName }) => {
    const chartData = useMemo(() => {
        if (playHistory.length === 0) return [];

        let currentOurScore = 0;
        let currentOppScore = 0;

        return playHistory.map((play, index) => {
            currentOurScore = play.ourScore ?? currentOurScore;
            currentOppScore = play.opponentScore ?? currentOppScore;

            // Base advantage from score (each point is ~3% advantage)
            let scoreAdvantage = 50 + (currentOurScore - currentOppScore) * 3;

            // Momentum factor: last 5 plays yards
            const recentPlays = playHistory.slice(Math.max(0, index - 4), index + 1);
            let ourRecentYards = 0;
            let oppRecentYards = 0;

            recentPlays.forEach(p => {
                if (p.type === 'Offense') {
                    ourRecentYards += p.yardsGained || 0;
                } else if (p.type === 'Defense') {
                    oppRecentYards += p.yardsGained || 0;
                }
            });

            const momentumBonus = (ourRecentYards - oppRecentYards) / 4;
            let totalAdvantage = scoreAdvantage + momentumBonus;
            
            // Clamp
            const advantage = Math.max(5, Math.min(95, totalAdvantage));

            return {
                playIndex: index + 1,
                advantage: advantage,
                ourScore: currentOurScore,
                oppScore: currentOppScore,
                playResult: play.playResult,
                yards: play.yardsGained
            };
        });
    }, [playHistory]);

    if (playHistory.length === 0) return null;

    return (
        <div className="bg-[var(--bg-primary)] rounded-lg p-4 border border-[var(--border-primary)]/50 shadow-xl">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-[var(--logo-color)] uppercase tracking-wider">Game Momentum & Win Probability</h3>
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#60A5FA]"></span>
                        <span className="text-[var(--text-secondary)]">{teamName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#34D399]"></span>
                        <span className="text-[var(--text-secondary)]">{opponentName}</span>
                    </div>
                </div>
            </div>

            <div className="h-24 sm:h-32 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorAdvantage" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#60A5FA" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                        <XAxis 
                            dataKey="playIndex" 
                            hide 
                        />
                        <YAxis 
                            domain={[0, 100]} 
                            ticks={[0, 25, 50, 75, 100]}
                            stroke="#4B5563"
                            fontSize={10}
                            tickFormatter={(val) => `${val}%`}
                        />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', fontSize: '12px' }}
                            itemStyle={{ color: '#60A5FA' }}
                            labelStyle={{ color: '#9CA3AF', marginBottom: '4px' }}
                            labelFormatter={(label) => `Play #${label}`}
                            formatter={(value: any) => [`${parseFloat(value).toFixed(1)}%`, 'Win Prob']}
                        />
                        <ReferenceLine y={50} stroke="#374151" strokeDasharray="3 3" />
                        <Area 
                            type="monotone" 
                            dataKey="advantage" 
                            stroke="#60A5FA" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorAdvantage)" 
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            
            <div className="mt-2 flex justify-between text-[10px] text-[var(--text-secondary)] font-medium uppercase tracking-tighter">
                <span>Kickoff</span>
                <span>Game Progress</span>
                <span>Final</span>
            </div>
        </div>
    );
};

export default GameMomentumChart;

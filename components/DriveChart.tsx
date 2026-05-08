import React, { useMemo } from 'react';
import { Play, Player, Highlight, PlayResult } from '../types';
import FootballFieldBackground from './FootballFieldBackground';
import { getVisuallyOrientedPath, getLastName } from '../utils';
import { useGameState } from '../contexts/GameStateContext';

interface DriveChartProps {
    drivePlays: Play[];
    currentPlay?: Play;
    fieldLogoUrl: string;
    players: Player[];
}

const DriveChart: React.FC<DriveChartProps> = ({ drivePlays, currentPlay, fieldLogoUrl, players }) => {

    const playerMap = useMemo(() => new Map(players.map(p => [p.id, p])), [players]);
    const { opponentNames, selectedWeek, teamName } = useGameState();
    const opponentName = opponentNames[selectedWeek] || 'VISITOR';


    const getName = (id?: string): string => {
        if (!id) return '';
        const player = playerMap.get(id);
        return player ? `#${player.jerseyNumber} ${getLastName(player.name)}` : '';
    };

    const getHighlightsText = (highlights?: Highlight): string => {
        if (!highlights || Object.keys(highlights).length === 0) {
            return '';
        }

        const parts: string[] = [];
        const { runnerId, passerId, receiverId, tacklerId, interceptorId, kickerId, holderId, returnerId } = highlights;

        if (runnerId) parts.push(`Runner: ${getName(runnerId)}`);
        if (passerId) parts.push(`Passer: ${getName(passerId)}`);
        if (receiverId) parts.push(`Receiver: ${getName(receiverId)}`);
        if (tacklerId) parts.push(`Tackler: ${getName(tacklerId)}`);
        if (interceptorId) parts.push(`Interceptor: ${getName(interceptorId)}`);
        if (returnerId) parts.push(`Returner: ${getName(returnerId)}`);
        if (kickerId) parts.push(`Kicker: ${getName(kickerId)}`);
        if (holderId) parts.push(`Holder: ${getName(holderId)}`);

        if (parts.length === 0) return '';
        return `\n------------------\n${parts.join('\n')}`;
    };

    const allPlays = currentPlay ? [...drivePlays, currentPlay] : drivePlays;
    if (!allPlays || allPlays.length === 0) {
        return (
            <div className="relative w-full max-h-full aspect-[2/1]">
                <FootballFieldBackground logoUrl={fieldLogoUrl} />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none rounded-lg">
                    <p className="text-white font-bold text-lg">No drive data to display.</p>
                </div>
            </div>
        );
    }
    
    const isDefensiveDrive = allPlays[0]?.type === 'Defense';
    const verticalOffset = 100 / (allPlays.length + 1);
    const BAR_HEIGHT = 4;

    const turnoverResults = [
        PlayResult.InterceptionThrown, PlayResult.FumbleLost, PlayResult.TurnoverOnDowns,
        PlayResult.Interception, PlayResult.FumbleRecovery, PlayResult.PuntBlocked,
        PlayResult.FieldGoalBlocked, PlayResult.MuffedPuntLost
    ];

    const playElements = allPlays.map((play, index) => {
        const yPos = (index + 1) * verticalOffset;
        const startX = play.startYardLine || 0; // 0-100 scale
        let endX = startX + (isDefensiveDrive ? -(play.yardsGained || 0) : (play.yardsGained || 0));
        
        endX = Math.max(0, Math.min(100, endX));

        // Get oriented path on 0-100 scale
        const [startPoint_unscaled, endPoint_unscaled] = getVisuallyOrientedPath(
            [{ x: startX, y: yPos }, { x: endX, y: yPos }],
            play.quarter
        );
        
        // Scale to 0-200 for the new viewbox to prevent distortion
        const startPoint = { x: startPoint_unscaled.x * 2, y: startPoint_unscaled.y };
        const endPoint = { x: endPoint_unscaled.x * 2, y: endPoint_unscaled.y };

        const leftX = Math.min(startPoint.x, endPoint.x);
        const rightX = Math.max(startPoint.x, endPoint.x);

        const result = play.playResult || '';
        const isPass = result.toLowerCase().includes('pass');
        const isIncomplete = isPass && result.toLowerCase().includes('incomplete');
        const isRun = result.toLowerCase().includes('run');
        const isPenalty = result.toLowerCase().includes('penalty');
        const isTurnover = turnoverResults.includes(result as PlayResult) && !isPass;

        let fillColor = 'var(--accent-primary)';
        let iconColor = '#6D4C41'; // A richer brown for the football
        let useDashedLine = false;

        if (isPass) {
            if (isIncomplete) {
                fillColor = 'var(--text-secondary)';
                iconColor = 'var(--accent-danger)';
                useDashedLine = true;
            } else {
                fillColor = 'var(--accent-secondary)';
                iconColor = 'var(--accent-secondary)';
            }
        } else if (isRun) {
            fillColor = 'var(--accent-primary)';
        } else if (isTurnover) {
            fillColor = 'var(--accent-danger)';
            iconColor = 'var(--accent-danger)';
        } else if (isPenalty) {
            fillColor = 'var(--accent-warning)';
        } else { // Default for Special Teams etc.
            fillColor = 'var(--accent-special)';
        }

        const isCurrentPlay = currentPlay === play;
        const gain = endPoint.x - startPoint.x;

        const pathData = `
          M ${leftX},${startPoint.y - BAR_HEIGHT / 2}
          L ${rightX},${startPoint.y - BAR_HEIGHT / 2}
          L ${rightX},${startPoint.y + BAR_HEIGHT / 2}
          L ${leftX},${startPoint.y + BAR_HEIGHT / 2}
          Z
        `;

        const highlightsText = getHighlightsText(play.highlights);
        const tooltipText = `${play.playResult || 'Play'} (${play.yardsGained != null ? (play.yardsGained >= 0 ? '+' : '') + play.yardsGained : '0'} yds)${highlightsText}`;
        
        const footballIconPath = "M-5 0 C -2.5,-4 2.5,-4 5,0 C 2.5,4 -2.5,4 -5,0 Z";
        const lacesPath = "M 0,-2 L 0,2 M -1.5,0 L 1.5,0";
        
        const angle = Math.atan2(0, gain) * (180 / Math.PI);

        const circleRadius = 2.5;
        const circleStrokeWidth = 0.4;
        const fontSize = 2.5;
        const textDy = 0.9;
        const circleXOffset = 6;

        return (
            <g key={play.timestamp || `current-${index}`} opacity={isCurrentPlay ? 1 : 0.85}>
                <title>{tooltipText}</title>
                <path
                    d={pathData}
                    fill={fillColor}
                    stroke={isCurrentPlay ? 'white' : 'none'}
                    strokeWidth={isCurrentPlay ? 0.5 : 0}
                    strokeDasharray={useDashedLine ? "0.5, 0.5" : "none"}
                    style={{
                        transformOrigin: `${leftX}px ${startPoint.y}px`,
                        animation: isCurrentPlay ? `draw-arrow 0.5s ease-out forwards, pulse-border 1.5s infinite` : `draw-arrow 0.5s ${index * 100}ms ease-out forwards`
                    }}
                />
                 <g
                    transform={`translate(${endPoint.x}, ${endPoint.y})`}
                    style={{ animation: `fade-in 0.4s ${index * 100 + 200}ms ease-out forwards`, opacity: 0 }}
                >
                    <g transform={`rotate(${angle}) scale(0.35)`}>
                        <path d={footballIconPath} fill={iconColor} stroke="#331a00" strokeWidth="0.8" />
                        <path d={lacesPath} stroke="white" strokeWidth="0.7" strokeLinecap="round" />
                    </g>
                </g>
                {play.down && (
                    <g style={{ animation: `fade-in 0.4s ${index * 100 + 200}ms ease-out forwards`, opacity: 0 }}>
                        <circle cx={startPoint.x - circleXOffset} cy={startPoint.y} r={circleRadius} fill="rgba(0,0,0,0.7)" stroke="white" strokeWidth={circleStrokeWidth} />
                        <text x={startPoint.x - circleXOffset} y={startPoint.y} dy={textDy} textAnchor="middle" fill="white" fontSize={fontSize} fontWeight="900">
                            {play.down}
                        </text>
                    </g>
                )}
            </g>
        );
    });
    
    const leftEndzoneName = isDefensiveDrive ? opponentName.toUpperCase() : teamName.toUpperCase();
    const rightEndzoneName = isDefensiveDrive ? teamName.toUpperCase() : opponentName.toUpperCase();
    const cheshireColor = 'bg-[var(--accent-secondary)]/80';
    const opponentColor = 'bg-[var(--accent-special)]/80';
    const leftEndzoneColor = isDefensiveDrive ? opponentColor : cheshireColor;
    const rightEndzoneColor = isDefensiveDrive ? cheshireColor : opponentColor;

    return (
        <div className="w-full max-h-full flex" style={{ aspectRatio: '120 / 53.33' }}>
             <style>{`
                @keyframes pulse-border {
                    0%, 100% { stroke-width: 0.5; }
                    50% { stroke-width: 1.5; }
                }
            `}</style>
            
            <div className={`h-full ${leftEndzoneColor} flex items-center justify-center rounded-l-lg`} style={{ width: '8.33%' }}>
                <span className="text-white font-black text-sm md:text-xl tracking-widest opacity-60 -rotate-90 select-none whitespace-nowrap">{leftEndzoneName}</span>
            </div>
            
            <div className="relative h-full" style={{ width: '83.34%' }}>
                <FootballFieldBackground logoUrl={fieldLogoUrl} orientation="horizontal" startYard={0} endYard={100} />
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="none">
                    {playElements}
                </svg>
            </div>

            <div className={`h-full ${rightEndzoneColor} flex items-center justify-center rounded-r-lg`} style={{ width: '8.33%' }}>
                <span className="text-white font-black text-sm md:text-xl tracking-widest opacity-60 -rotate-90 select-none whitespace-nowrap">{rightEndzoneName}</span>
            </div>
        </div>
    );
};

export default DriveChart;

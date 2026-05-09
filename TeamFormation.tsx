import React, { useState, useEffect } from 'react';
import { FootballIcon, SpinnerIcon } from './icons';
import { formatTime } from '../utils';
import { useGameState } from '../contexts/GameStateContext';
import { LEAGUE_STANDINGS } from '../constants';

const parseTimeToSeconds = (timeStr: string): number | null => {
    if (!timeStr.includes(':')) {
        const seconds = parseInt(timeStr, 10);
        return isNaN(seconds) ? null : seconds;
    }
    const parts = timeStr.split(':');
    if (parts.length !== 2) return null;
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    if (isNaN(minutes) || isNaN(seconds) || minutes < 0 || seconds > 59) return null;
    return minutes * 60 + seconds;
};

interface TeamPanelProps {
    teamName: string;
    teamAbbreviation: string;
    score: number;
    timeouts: number;
    onScoreChange: (newScore: number) => void;
    isHome: boolean;
    hasPossession: boolean;
    onPossessionClick: () => void;
    onUseTimeout: () => void;
    record: string;
}

const TeamPanel: React.FC<TeamPanelProps> = ({ teamName, teamAbbreviation, score, timeouts, onScoreChange, isHome, hasPossession, onPossessionClick, onUseTimeout, record }) => {
    const teamColorVar = isHome ? 'var(--accent-secondary)' : 'var(--accent-special)';
    
    return (
        <div className={`flex-1 flex items-center bg-black/30 p-1 sm:p-2 rounded-lg gap-1 sm:gap-3 min-w-0 border-2 transition-all duration-500 ${hasPossession ? 'border-[var(--accent-primary)] shadow-[0_0_20px_rgba(0,230,118,0.4)] bg-[var(--accent-primary)]/5' : 'border-transparent'}`}>
             <button onClick={onPossessionClick} className="p-1.5 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/30 focus:ring-[var(--accent-primary)]" aria-label={`Set possession to ${teamName}`}>
                <FootballIcon className={`w-6 h-auto sm:w-8 transition-all duration-500 ${hasPossession ? 'text-[var(--accent-primary)] animate-football-glow' : 'text-[var(--text-secondary)]/70 hover:text-[var(--text-secondary)] scale-90'}`} />
            </button>
            <div className="flex-grow min-w-0">
                <p className={`text-lg font-black uppercase truncate tracking-wider transition-colors duration-500 ${hasPossession ? 'text-white' : 'text-[var(--text-secondary)]'}`}>
                    {teamName}
                    <span className="font-normal text-xs text-[var(--text-secondary)] ml-2">{record}</span>
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs font-semibold text-[var(--text-secondary)] hidden sm:block">{teamAbbreviation}</span>
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className={`w-3 h-3 rounded-full border-2 transition-colors ${i < timeouts ? 'bg-white' : 'bg-transparent border-gray-600'}`} style={{ borderColor: i < timeouts ? teamColorVar : '' }}></div>
                    ))}
                    <button
                        onClick={onUseTimeout}
                        disabled={timeouts === 0}
                        className="ml-1 sm:ml-2 px-2 py-0.5 text-xs font-bold bg-[var(--bg-tertiary)] rounded-md text-[var(--text-secondary)] hover:bg-[var(--border-primary)] hover:text-[var(--text-primary)] disabled:bg-[var(--bg-tertiary)] disabled:text-[var(--text-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Use a timeout for ${teamName}`}
                    >
                        T/O
                    </button>
                </div>
            </div>
            <div className="relative group">
                <p className="text-4xl sm:text-6xl font-black text-[var(--text-primary)] w-16 sm:w-24 text-center tabular-nums">{score}</p>
                <div className="absolute inset-y-0 -right-2 flex flex-col justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onScoreChange(score + 1)} className="w-6 h-6 bg-[var(--bg-tertiary)] hover:bg-[var(--accent-primary)] rounded-full text-white font-bold flex items-center justify-center">+</button>
                    <button onClick={() => onScoreChange(Math.max(0, score - 1))} className="w-6 h-6 bg-[var(--bg-tertiary)] hover:bg-[var(--accent-danger)] rounded-full text-white font-bold flex items-center justify-center">-</button>
                </div>
            </div>
        </div>
    );
};

const Scoreboard: React.FC = () => {
    const {
        gameTime, isClockRunning, ourScore, opponentScore, 
        handleScoreChange, currentQuarter, homeStatus, homeTimeouts, awayTimeouts, handleUseTimeout, 
        handleGameTimeChange, possession, handlePossessionChange,
        opponentNames, selectedWeek, downAndDistance, isWeekLoading, teamName, teamCity,
        seasonRecord,
    } = useGameState();
    
    const [editedTime, setEditedTime] = useState(formatTime(gameTime));
    
    useEffect(() => {
        setEditedTime(formatTime(gameTime));
    }, [gameTime]);

    const handleTimeBlur = () => {
        const newTimeInSeconds = parseTimeToSeconds(editedTime);
        if (newTimeInSeconds !== null && newTimeInSeconds !== gameTime) {
            handleGameTimeChange(newTimeInSeconds);
        } else {
            setEditedTime(formatTime(gameTime));
        }
    };

    const homeTeamName = homeStatus === 'Home' ? teamName : opponentNames[selectedWeek];
    const awayTeamName = homeStatus === 'Away' ? teamName : opponentNames[selectedWeek];

    const getAbbreviation = (name: string) => name ? name.substring(0, 3).toUpperCase() : 'OPP';
    
    const homeTeamAbbreviation = homeStatus === 'Home' ? getAbbreviation(teamCity) : getAbbreviation(opponentNames[selectedWeek]);
    const awayTeamAbbreviation = homeStatus === 'Away' ? getAbbreviation(teamCity) : getAbbreviation(opponentNames[selectedWeek]);

    const ourTeamRecordString = `(${seasonRecord.wins}-${seasonRecord.losses}-${seasonRecord.ties})`;
    
    const opponentName = opponentNames[selectedWeek] || 'Opponent';
    const opponentRecordKey = Object.keys(LEAGUE_STANDINGS).find(key => opponentName.includes(key));
    const opponentRecord = opponentRecordKey ? LEAGUE_STANDINGS[opponentRecordKey] : null;
    const opponentRecordString = opponentRecord ? `(${opponentRecord.w}-${opponentRecord.l}-${opponentRecord.t})` : `(0-0-0)`;

    const homeTeamIsOurTeam = homeStatus === 'Home';

    return (
        <div className="bg-[var(--bg-secondary)] border-b-2 border-black/20 p-1 sm:p-2">
            <div className="flex items-stretch justify-between gap-1 sm:gap-2">
                <TeamPanel 
                    teamName={homeTeamName}
                    teamAbbreviation={homeTeamAbbreviation}
                    score={homeStatus === 'Home' ? ourScore : opponentScore}
                    timeouts={homeTimeouts}
                    onScoreChange={(newScore) => handleScoreChange(homeStatus === 'Home' ? newScore : ourScore, homeStatus === 'Home' ? opponentScore : newScore)}
                    isHome={true}
                    hasPossession={possession === 'home'}
                    onPossessionClick={() => handlePossessionChange('home')}
                    onUseTimeout={() => handleUseTimeout('home')}
                    record={homeTeamIsOurTeam ? ourTeamRecordString : opponentRecordString}
                />
                
                <div className="flex flex-col items-center justify-center text-center px-1 py-1 flex-shrink-0 w-20 sm:w-28">
                    {isWeekLoading ? (
                        <SpinnerIcon className="w-6 h-6 text-[var(--accent-primary)]" />
                    ) : (
                        <input
                            type="text"
                            value={editedTime}
                            onChange={(e) => setEditedTime(e.target.value)}
                            onBlur={handleTimeBlur}
                            className="text-2xl sm:text-3xl font-black text-white bg-transparent w-full text-center tabular-nums focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] rounded"
                            aria-label="Game Clock"
                        />
                    )}
                    <div className="flex flex-col items-center -mt-1">
                        <p className="text-base font-bold text-[var(--accent-primary)]">Q{currentQuarter}</p>
                        <p className="text-[10px] font-semibold text-[var(--text-secondary)] whitespace-nowrap">{downAndDistance}</p>
                    </div>
                </div>

                <TeamPanel
                    teamName={awayTeamName}
                    teamAbbreviation={awayTeamAbbreviation}
                    score={homeStatus === 'Away' ? ourScore : opponentScore}
                    timeouts={awayTimeouts}
                    onScoreChange={(newScore) => handleScoreChange(homeStatus === 'Away' ? newScore : ourScore, homeStatus === 'Away' ? opponentScore : newScore)}
                    isHome={false}
                    hasPossession={possession === 'away'}
                    onPossessionClick={() => handlePossessionChange('away')}
                    onUseTimeout={() => handleUseTimeout('away')}
                    record={!homeTeamIsOurTeam ? ourTeamRecordString : opponentRecordString}
                />
            </div>
        </div>
    );
};

export default Scoreboard;
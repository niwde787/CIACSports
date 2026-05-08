import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useGameState } from '../contexts/GameStateContext';
import { generatePlayDescription, getOrdinal, calculateDrives, calculateScoreAdjustments, generateSportscasterNarration, parseGameTime } from '../utils';
import { Play, Drive, PlayResult } from '../types';
import DriveChart from './DriveChart';
import TopHeader from './TopHeader';
import { SpeakerOnIcon, SpeakerOffIcon, SpinnerIcon, ReplayPrevIcon, StopIcon, ChevronRightIcon, ClockPlayIcon, ClockPauseIcon, ReplayNextIcon } from './icons';
import OnFieldStatusView from './OnFieldStatusView';
import { GoogleGenAI, Modality } from "@google/genai";
import { SnapsRankingCard, FormationEfficiencyCard, TeamStatsComparisonCard, PassingStatsCard, RushingStatsCard, ReceivingStatsCard, DefensiveStatsCard, InterceptionStatsCard } from './WeekDashboard';
import { LEAGUE_STANDINGS } from '../constants';

// --- INLINE ICONS for Bottom Nav ---
const LiveIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>);
const DrivesIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>);
const StatsIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>);
const OnFieldIcon: React.FC<{className?: string}> = ({className}) => (<svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>);


const GameDayCard: React.FC<{ game: { week: string; opponent: string; date: string; homeAway: 'Home' | 'Away'; result: { ourScore: number; opponentScore: number } | null; }; onSelect: () => void; }> = ({ game, onSelect }) => {
    const { opponent, date, homeAway, result } = game;
    const dateObj = new Date(date + 'T00:00:00');
    const month = dateObj.toLocaleString('default', { month: 'short' });
    const day = dateObj.getDate();
    const isWin = result && result.ourScore > result.opponentScore;
    const isLoss = result && result.ourScore < result.opponentScore;
    const resultClass = isWin ? 'text-green-400' : isLoss ? 'text-red-400' : 'text-yellow-400';
    const resultText = result ? `${isWin ? 'W' : isLoss ? 'L' : 'T'} ${result.ourScore}-${result.opponentScore}` : 'Upcoming';
    
    const opponentRecordKey = Object.keys(LEAGUE_STANDINGS).find(key => opponent.includes(key));
    const opponentRecord = opponentRecordKey ? LEAGUE_STANDINGS[opponentRecordKey] : null;
    const recordString = opponentRecord ? `(${opponentRecord.w}-${opponentRecord.l}-${opponentRecord.t})` : '';

    const isLive = useMemo(() => {
        if (!date) return false;
        const gameDate = new Date(date + 'T00:00:00');
        const today = new Date();
        today.setHours(0,0,0,0);
        return gameDate.getTime() === today.getTime() && !result; // Live if today and no result yet
    }, [date, result]);


    return (
        <button
            onClick={onSelect}
            className={`relative p-3 w-full rounded-lg flex items-center justify-between text-left transition-all duration-200 transform hover:scale-[1.02] ${isLive ? 'ring-2 ring-red-500/70 animate-pulse' : ''} bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]`}
        >
            {isLive && (
                <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                    <div className="w-2 h-2 rounded-full bg-white animate-ping"></div>
                    <span>LIVE</span>
                </div>
            )}
            <div className="flex items-center gap-4">
                <div className="flex flex-col items-center justify-center bg-[var(--bg-secondary)] p-2 rounded-md w-16 h-16 flex-shrink-0">
                    <span className="text-sm font-bold text-[var(--text-primary)]">{month.toUpperCase()}</span>
                    <span className="text-2xl font-black text-[var(--text-primary)]">{day}</span>
                </div>
                <div>
                    <p className="font-bold text-lg text-[var(--text-primary)]">vs {opponent} <span className="text-sm font-normal text-[var(--text-secondary)]">{recordString}</span></p>
                    <p className="text-sm text-[var(--text-secondary)]">{homeAway} &bull; {game.week}</p>
                </div>
            </div>
            <div className="text-right ml-4">
                <p className={`font-mono text-lg font-bold ${resultClass}`}>{resultText}</p>
            </div>
        </button>
    );
};

const ReadOnlyScoreboard: React.FC = () => {
    const { ourScore, opponentScore, currentQuarter, gameTime, homeStatus, teamName, opponentNames, selectedWeek, downAndDistance, homeTimeouts, awayTimeouts } = useGameState();
    const homeTeamName = homeStatus === 'Home' ? teamName : opponentNames[selectedWeek];
    const awayTeamName = homeStatus === 'Away' ? teamName : opponentNames[selectedWeek];
    const homeScore = homeStatus === 'Home' ? ourScore : opponentScore;
    const awayScore = homeStatus === 'Away' ? ourScore : opponentScore;

    return (
        <div className="glass-effect border-b border-[var(--border-primary)] p-2 sm:p-4 flex items-center justify-between text-white fixed top-14 left-0 right-0 z-10">
            <div className="flex-1 text-left">
                <p className="font-bold text-lg sm:text-2xl truncate">{homeTeamName}</p>
                <p className="font-mono text-3xl sm:text-4xl font-black">{homeScore}</p>
                 <p className="text-xs mt-1">Timeouts: {homeTimeouts}</p>
            </div>
            <div className="text-center px-2">
                <p className="font-mono text-2xl sm:text-3xl font-black">{new Date(gameTime * 1000).toISOString().substr(14, 5)}</p>
                <p className="font-bold text-lg sm:text-xl">Q{currentQuarter}</p>
                <p className="text-xs font-semibold">{downAndDistance}</p>
            </div>
            <div className="flex-1 text-right">
                <p className="font-bold text-lg sm:text-2xl truncate">{awayTeamName}</p>
                <p className="font-mono text-3xl sm:text-4xl font-black">{awayScore}</p>
                <p className="text-xs mt-1">Timeouts: {awayTimeouts}</p>
            </div>
        </div>
    );
};

const TeamStatRow: React.FC<{ label: string; ourValue: string | number; oppValue: string | number; invertColors?: boolean }> = ({ label, ourValue, oppValue, invertColors = false }) => {
    const ourValNum = typeof ourValue === 'number' ? ourValue : parseFloat(ourValue);
    const oppValNum = typeof oppValue === 'number' ? oppValue : parseFloat(oppValue) || 0;
    const total = ourValNum + oppValNum;
    const ourWidth = total > 0 ? (ourValNum / total) * 100 : (ourValNum > 0 ? 100 : (oppValNum > 0 ? 0 : 50));
    const isOurBetter = invertColors ? ourValNum < oppValNum : ourValNum > oppValNum;
    const isOppBetter = invertColors ? ourValNum > oppValNum : ourValNum < oppValNum;
    const isEqual = ourValNum === oppValNum;

    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className={`font-mono font-bold text-lg ${isOurBetter ? 'text-white' : 'text-[var(--text-secondary)]'}`}>{ourValue}</span>
                <span className="text-sm text-[var(--text-secondary)]">{label}</span>
                <span className={`font-mono font-bold text-lg ${isOppBetter ? 'text-white' : 'text-[var(--text-secondary)]'}`}>{oppValue}</span>
            </div>
            <div className="flex h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                <div className={`transition-all duration-500 ${isOurBetter && !isEqual ? 'bg-[var(--accent-primary)]' : 'bg-[var(--border-primary)]'}`} style={{ width: `${ourWidth}%` }}></div>
                <div className={`transition-all duration-500 ${isOppBetter && !isEqual ? 'bg-[var(--accent-special)]' : 'bg-[var(--border-primary)]'}`} style={{ width: `${100 - ourWidth}%` }}></div>
            </div>
        </div>
    );
};


function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const GameDetailView: React.FC<{ weekId: string; onBack: () => void }> = ({ weekId, onBack }) => {
    const { handleWeekChange, playHistory, players, fieldLogoUrl, showToast, teamName, teamCity, opponentNames, homeStatus, selectedWeek, ourStats, opponentStats, gameSummaryData, weekDates, weekResults, ourScore, opponentScore, currentQuarter } = useGameState();
    const [activeTab, setActiveTab] = useState<'live' | 'drives' | 'stats' | 'on-field'>('live');
    const [isNarrationEnabled, setIsNarrationEnabled] = useState(false);
    const feedRef = useRef<HTMLDivElement>(null);
    const opponentName = opponentNames[selectedWeek] || 'Opponent';
    
    // --- Replay State ---
    const [isReplayMode, setIsReplayMode] = useState(false);
    const [isReplayPaused, setIsReplayPaused] = useState(true);
    const [replayIndex, setReplayIndex] = useState(-1);
    const replayHasRun = useRef(false);
    const replayActiveRef = useRef(false);

    // --- Narration State ---
    const audioContextRef = useRef<AudioContext | null>(null);
    const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
    const introPlayedRef = useRef(false);

    useEffect(() => {
        replayActiveRef.current = isReplayMode && !isReplayPaused;
    }, [isReplayMode, isReplayPaused]);
    
    const isLiveGame = useMemo(() => {
        const date = weekDates[selectedWeek];
        const result = weekResults[selectedWeek];
        if (!date) return false;
        const gameDate = new Date(date + 'T00:00:00');
        const today = new Date();
        today.setHours(0,0,0,0);
        return gameDate.getTime() === today.getTime() && !result;
    }, [selectedWeek, weekDates, weekResults]);

    const displayedPlays = useMemo(() => {
        if (isReplayMode) {
            return playHistory.slice(0, replayIndex + 1);
        }
        if (isLiveGame) {
            return playHistory;
        }
        return replayHasRun.current ? playHistory : [];
    }, [isReplayMode, replayIndex, playHistory, isLiveGame]);
    
    useEffect(() => {
        handleWeekChange(weekId);
        replayHasRun.current = false;
        introPlayedRef.current = false;
    }, [weekId, handleWeekChange]);

    useEffect(() => {
        if (feedRef.current) {
            feedRef.current.scrollTop = feedRef.current.scrollHeight;
        }
    }, [displayedPlays]);

    const playerMap = useMemo(() => new Map(players.map(p => [p.id, p])), [players]);
    const drives = useMemo(() => calculateDrives(playHistory), [playHistory]);
    const totalPlays = playHistory.length;

    const displaySummaryData = useMemo(() => {
        return gameSummaryData || {
            formationStats: {},
            topPerformers: { passers: {}, receivers: {}, runners: {}, tacklers: {}, interceptors: {}, kickers: {}, returners: {} }
        };
    }, [gameSummaryData]);

    const playNarration = useCallback(async (textToNarrate: string) => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
            const response = await ai.models.generateContent({
                model: "gemini-3.1-flash-tts-preview",
                contents: [{ parts: [{ text: textToNarrate }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                },
            });
            
            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (!base64Audio) {
                showToast("No audio data returned from API.", "error");
                return;
            }
            
            if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            const audioContext = audioContextRef.current;

            if (currentAudioSourceRef.current) {
                currentAudioSourceRef.current.stop();
            }

            const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            
            return new Promise<void>((resolve) => {
                source.onended = () => {
                    if (currentAudioSourceRef.current === source) {
                        currentAudioSourceRef.current = null;
                    }
                    resolve();
                };
                source.start(0);
                currentAudioSourceRef.current = source;
            });

        } catch (error) {
            console.error("Narration error:", error);
            showToast("A narration clip failed to load due to an API error.", "error");
        }
    }, [showToast]);

    const narrateIntro = useCallback(async () => {
        const introText = `Welcome to today's game coverage, brought to you by LiveSnaps! We're live from beautiful ${teamCity} for a matchup between your ${teamName} and the visiting ${opponentName}.`;
        await playNarration(introText);
    }, [teamName, teamCity, opponentName, playNarration]);

    const narratePlay = useCallback(async (play: Play) => {
        if (!isNarrationEnabled) return;
        const textToNarrate = generateSportscasterNarration(play, playerMap, teamName, teamCity);
        if (textToNarrate) {
            await playNarration(textToNarrate);
        }
    }, [isNarrationEnabled, playerMap, teamName, teamCity, playNarration]);
    
    const stopAllAudio = useCallback(() => {
        if (currentAudioSourceRef.current) {
            currentAudioSourceRef.current.stop();
            currentAudioSourceRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (isNarrationEnabled && !introPlayedRef.current) {
            narrateIntro();
            introPlayedRef.current = true;
        }
    }, [isNarrationEnabled, narrateIntro]);
    
    const handleStartReplay = () => {
        if (playHistory.length === 0) return;
        stopAllAudio();
        setIsReplayMode(true);
        replayHasRun.current = true;
        setReplayIndex(0);
        setIsReplayPaused(false);
    };

    const handleStopReplay = useCallback(() => {
        stopAllAudio();
        setIsReplayMode(false);
        setIsReplayPaused(true);
        setReplayIndex(-1);
    }, [stopAllAudio]);
    
    const handleTogglePlayPause = useCallback(() => {
        if (!isReplayPaused) { // If it's currently playing and we're about to pause it
            stopAllAudio();
        }
        setIsReplayPaused(p => !p);
    }, [isReplayPaused, stopAllAudio]);

    const handleNextPlay = useCallback(() => {
        stopAllAudio();
        const nextIndex = Math.min(replayIndex + 1, playHistory.length - 1);
        setReplayIndex(nextIndex);
        if (isReplayPaused && playHistory[nextIndex] && isNarrationEnabled) {
            narratePlay(playHistory[nextIndex]);
        }
    }, [replayIndex, playHistory, isReplayPaused, isNarrationEnabled, narratePlay, stopAllAudio]);
    
    const handlePrevPlay = useCallback(() => {
        stopAllAudio();
        const prevIndex = Math.max(replayIndex - 1, 0);
        setReplayIndex(prevIndex);
        if (isReplayPaused && playHistory[prevIndex] && isNarrationEnabled) {
            narratePlay(playHistory[prevIndex]);
        }
    }, [replayIndex, playHistory, isReplayPaused, isNarrationEnabled, narratePlay, stopAllAudio]);

    useEffect(() => {
        const runReplayStep = async () => {
            if (isReplayMode && !isReplayPaused && replayIndex < playHistory.length && replayIndex !== -1) {
                if (isNarrationEnabled) {
                    await narratePlay(playHistory[replayIndex]);
                    
                    // Pause for natural pacing only if we're still active after narration.
                    if (replayActiveRef.current) {
                        await new Promise(resolve => setTimeout(resolve, 750));
                    }
                } else {
                    // If narration is off, just use a standard delay for visual stepping.
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
    
                // Check if still active before proceeding to the next step.
                if (replayActiveRef.current) {
                    const nextIndex = replayIndex + 1;
                    if (nextIndex >= playHistory.length) {
                        handleStopReplay();
                        showToast("Replay finished.", "info");
                    } else {
                        setReplayIndex(nextIndex);
                    }
                }
            }
        };
    
        runReplayStep();
    }, [replayIndex, isReplayMode, isReplayPaused, playHistory, isNarrationEnabled, handleStopReplay, narratePlay, showToast]);

    useEffect(() => {
        const lastLivePlay = isLiveGame ? playHistory[playHistory.length - 1] : null;
        if(lastLivePlay && isNarrationEnabled && !isReplayMode) {
            narratePlay(lastLivePlay);
        }
    }, [playHistory, isLiveGame, isNarrationEnabled, isReplayMode, narratePlay]);

    useEffect(() => {
        return () => { // Cleanup on component unmount
            stopAllAudio();
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
        };
    }, [stopAllAudio]);

    return (
        <div className="bg-[var(--bg-secondary)] shadow-2xl border border-[var(--border-primary)] rounded-lg flex flex-col h-full">
            <TopHeader showBack onBack={onBack} />
            <ReadOnlyScoreboard />
            
            <main className="flex-grow flex flex-col overflow-hidden pt-36 pb-16">
                {activeTab === 'live' && (
                    <div ref={feedRef} className="flex-grow overflow-y-auto">
                        <div className="p-2 sm:p-4 space-y-3">
                            {displayedPlays.map((play) => (
                                <div key={play.timestamp} className={`bg-[var(--bg-primary)] p-3 rounded-lg border-l-4 ${play.type === 'Offense' ? 'border-[var(--accent-secondary)]' : play.type === 'Defense' ? 'border-[var(--accent-defense)]' : 'border-[var(--accent-special)]'} animate-fade-in`}>
                                    <p className="text-xs font-mono text-[var(--text-secondary)] mb-1">Q{play.quarter} - {play.gameTime}</p>
                                    <p className="text-sm text-[var(--text-primary)]">{generateSportscasterNarration(play, playerMap, teamName, teamCity)}</p>
                                </div>
                            ))}
                            {playHistory.length === 0 && <p className="text-center text-[var(--text-secondary)] py-10">Waiting for kickoff...</p>}
                        </div>
                    </div>
                )}
                {activeTab === 'drives' && (
                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                        {drives.length > 0 ? drives.map(drive => (
                            <details key={drive.driveNumber} className="bg-[var(--bg-primary)] rounded-lg border border-[var(--border-primary)] overflow-hidden group">
                                <summary className="p-3 flex items-center gap-2 cursor-pointer list-none hover:bg-white/5">
                                    <ChevronRightIcon className="w-5 h-5 text-[var(--text-secondary)] transition-transform details-open-rotate" />
                                    <div className="flex-grow flex justify-between items-baseline flex-wrap gap-x-4">
                                        <h4 className="font-bold text-lg text-[var(--text-primary)]">Drive #{drive.driveNumber}</h4>
                                        <p className="text-xs text-[var(--text-secondary)] font-mono">{drive.summary.playCount} plays | {drive.summary.yards > 0 ? '+' : ''}{drive.summary.yards} yds | {drive.summary.timeOfPossession}</p>
                                    </div>
                                    <p className="text-sm font-semibold ml-4">{drive.summary.result}</p>
                                </summary>
                                <div className="p-3 border-t border-[var(--border-primary)]">
                                    <DriveChart drivePlays={drive.plays.map(p => p.play)} fieldLogoUrl={fieldLogoUrl} players={players} />
                                </div>
                            </details>
                        )) : <p className="text-center text-[var(--text-secondary)] py-10">No drives to display.</p>}
                    </div>
                )}
                 {activeTab === 'stats' && (
                     <div className="flex-grow overflow-y-auto p-4 space-y-4">
                        <TeamStatsComparisonCard 
                            ourStats={ourStats} 
                            opponentStats={opponentStats} 
                            opponentName={opponentName} 
                            teamName={teamName} 
                        />
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <SnapsRankingCard players={players} totalPlays={totalPlays} />
                            <FormationEfficiencyCard formationStats={displaySummaryData.formationStats} />
                        </div>

                        <h3 className="text-xl font-bold text-white pt-4 border-t border-[var(--border-primary)]">Team Leaders</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <PassingStatsCard topPerformers={displaySummaryData.topPerformers} playerMap={playerMap} />
                            <RushingStatsCard topPerformers={displaySummaryData.topPerformers} playerMap={playerMap} />
                            <ReceivingStatsCard topPerformers={displaySummaryData.topPerformers} playerMap={playerMap} />
                            <DefensiveStatsCard topPerformers={displaySummaryData.topPerformers} playerMap={playerMap} />
                            <InterceptionStatsCard topPerformers={displaySummaryData.topPerformers} playerMap={playerMap} />
                        </div>
                    </div>
                )}
                 {activeTab === 'on-field' && (
                    <div className="flex-grow overflow-y-auto p-4">
                        <OnFieldStatusView />
                    </div>
                )}
            </main>

            <div className="fixed bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 p-2 bg-[var(--bg-tertiary)]/80 backdrop-blur-sm rounded-full shadow-lg border border-[var(--border-primary)]">
                {isReplayMode ? (
                    <>
                        <button onClick={handleStopReplay} className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700" title="Stop Replay"><StopIcon className="w-6 h-6" /></button>
                        <button onClick={handlePrevPlay} className="w-12 h-12 rounded-full bg-gray-600 text-white flex items-center justify-center hover:bg-gray-700" title="Previous Play"><ReplayPrevIcon className="w-6 h-6" /></button>
                        <button onClick={handleTogglePlayPause} className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600" title={isReplayPaused ? "Play" : "Pause"}>{isReplayPaused ? <ClockPlayIcon className="w-7 h-7" /> : <ClockPauseIcon className="w-7 h-7" />}</button>
                        <button onClick={handleNextPlay} className="w-12 h-12 rounded-full bg-gray-600 text-white flex items-center justify-center hover:bg-gray-700" title="Next Play"><ReplayNextIcon className="w-6 h-6" /></button>
                    </>
                ) : (
                    <button onClick={handleStartReplay} disabled={playHistory.length === 0} className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center disabled:opacity-50 hover:bg-blue-600" title="Start Replay"><ClockPlayIcon className="w-7 h-7" /></button>
                )}
                <div className="w-px h-8 bg-[var(--border-primary)] mx-1"></div>
                <button onClick={() => setIsNarrationEnabled(p => !p)} className={`w-12 h-12 rounded-full text-white flex items-center justify-center transition-colors ${isNarrationEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'}`} title={isNarrationEnabled ? "Disable Narration" : "Enable Narration"}>
                    {isNarrationEnabled ? <SpeakerOnIcon className="w-7 h-7" /> : <SpeakerOffIcon className="w-7 h-7" />}
                </button>
            </div>
            
            <footer className="fixed bottom-0 left-0 right-0 h-16 glass-effect border-t border-[var(--border-primary)] flex justify-around items-center z-20">
                {(['live', 'on-field', 'drives', 'stats'] as const).map(tab => {
                    const isActive = activeTab === tab;
                    const Icon = tab === 'live' ? LiveIcon : tab === 'drives' ? DrivesIcon : tab === 'stats' ? StatsIcon : OnFieldIcon;
                    return (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`flex flex-col items-center gap-1 p-2 rounded-lg w-20 ${isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`}>
                            <Icon className="w-6 h-6" />
                            <span className="text-xs font-bold capitalize">{tab.replace('-', ' ')}</span>
                        </button>
                    )
                })}
            </footer>
        </div>
    );
};

const ViewerExperience: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { seasonWeeks, opponentNames, weekDates, homeAwayStatus, weekResults, teamName } = useGameState();
    const [view, setView] = useState<'list' | 'detail'>('list');
    const [activeWeek, setActiveWeek] = useState<string | null>(null);

    const games = useMemo(() => {
        return seasonWeeks.map(week => ({
            week,
            opponent: opponentNames[week] || 'OPP',
            date: weekDates[week],
            homeAway: homeAwayStatus[week] || 'Home',
            result: weekResults[week] || null
        }));
    }, [seasonWeeks, opponentNames, weekDates, homeAwayStatus, weekResults]);

    const handleSelectGame = (week: string) => {
        setActiveWeek(week);
        setView('detail');
    };

    const handleBackToList = () => {
        setView('list');
        setActiveWeek(null);
    };

    return (
        <div className="font-sans min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
            <div className="w-full h-screen">
                {view === 'list' ? (
                    <div className="bg-[var(--bg-secondary)] shadow-2xl border border-[var(--border-primary)] rounded-lg flex flex-col h-full">
                        <TopHeader showBack onBack={onBack} />
                        <div className="p-4 pt-20 flex-grow overflow-y-auto flex flex-col">
                            <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4 flex-shrink-0">Schedule for {teamName}</h2>
                            <div className="space-y-4">
                                {games.map(game => (
                                    <GameDayCard key={game.week} game={game} onSelect={() => handleSelectGame(game.week)} />
                                ))}
                            </div>
                             {games.length === 0 && (
                                <div className="flex-grow flex items-center justify-center text-center text-[var(--text-secondary)]">
                                    <p>No games scheduled for this team.</p>
                                </div>
                             )}
                        </div>
                    </div>
                ) : activeWeek ? (
                    <GameDetailView weekId={activeWeek} onBack={handleBackToList} />
                ) : null}
            </div>
        </div>
    );
};

export default ViewerExperience;
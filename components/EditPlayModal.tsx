import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Player, Play, FormationCollection, PlayType, FormationPositions, PlayResult, Highlight, FormationPosition } from '../types';
import TeamFormation from './TeamFormation';
import WaveSubModal from './WaveSubModal';
import { getPlayResultOptionsForType, calculateScoreAdjustments, getLastName, formatTime, parseGameTime } from '../utils';
import { ChevronRightIcon } from './icons';
import { useGameState } from '../contexts/GameStateContext';

type HighlightKey = keyof Highlight;

const getHighlightFields = (playResult: PlayResult): { key: HighlightKey, label: string }[] => {
    switch(playResult) {
        case PlayResult.PassCompleted:
        case PlayResult.PassTouchdown:
        case PlayResult.Pass1ptConversionGood:
        case PlayResult.PassCompletedOutOfBounds:
          return [{ key: 'passerId', label: 'Passer' }, { key: 'receiverId', label: 'Receiver' }];
        
        case PlayResult.PassIncomplete:
          return [{ key: 'passerId', label: 'Passer' }, { key: 'receiverId', label: 'Intended Receiver' }];
        
        case PlayResult.Run:
        case PlayResult.RunTouchdown:
        case PlayResult.Run1ptConversionGood:
        case PlayResult.RunOutOfBounds:
          return [{ key: 'runnerId', label: 'Runner' }];
        
        case PlayResult.SackTaken:
            return [{ key: 'passerId', label: 'Player Sacked' }, { key: 'tacklerId', label: 'Sacked By' }];

        case PlayResult.DefenseTackle:
        case PlayResult.DefenseTackleForLoss:
        case PlayResult.DefenseSack:
          return [{ key: 'tacklerId', label: 'Tackler' }];
        
        case PlayResult.DefensePassDefended:
            return [{ key: 'tacklerId', label: 'Defender' }];
        
        case PlayResult.FumbleRecovery:
        case PlayResult.FumbleReturnTD:
        case PlayResult.BlockedKickRecovery:
            return [{ key: 'tacklerId', label: 'Recovered By' }];
        
        case PlayResult.Interception:
        case PlayResult.InterceptionReturnTD:
          return [{ key: 'interceptorId', label: 'Interceptor' }];
  
        case PlayResult.PATGood:
        case PlayResult.FieldGoalGood:
        case PlayResult.PATFailed:
        case PlayResult.FieldGoalFailed:
        case PlayResult.PAT_2pt_KickGood:
        case PlayResult.PAT_2pt_KickFailed:
        case PlayResult.FieldGoalBlocked:
          return [{ key: 'kickerId', label: 'Kicker' }, { key: 'holderId', label: 'Holder' }];
        
        case PlayResult.Punt:
        case PlayResult.PuntTouchback:
        case PlayResult.PuntBlocked:
          return [{ key: 'kickerId', label: 'Punter' }];

        case PlayResult.KickoffTackle:
            return [{ key: 'kickerId', label: 'Kicker' }, { key: 'tacklerId', label: 'Tackler' }];

        case PlayResult.KickoffTouchback:
        case PlayResult.KickoffOutOfBounds:
            return [{ key: 'kickerId', label: 'Kicker' }];
        
        case PlayResult.OnsideKickRecovered:
            return [{ key: 'kickerId', label: 'Kicker' }, { key: 'returnerId', label: 'Recovered By' }];
        
        case PlayResult.OnsideKickLost:
            return [{ key: 'kickerId', label: 'Kicker' }];
          
        case PlayResult.KickReturn:
        case PlayResult.KickReturnOutOfBounds:
        case PlayResult.KickReturnTD:
        case PlayResult.PuntReturn:
        case PlayResult.PuntReturnOutOfBounds:
        case PlayResult.PuntReturnTD:
        case PlayResult.BlockedPuntReturnTD:
        case PlayResult.BlockedFieldGoalReturnTD:
          return [{ key: 'returnerId', label: 'Returner' }];
  
        default:
          return [];
    }
};

interface HighlightSelectorProps {
    playResult: PlayResult;
    players: Player[];
    highlights: Highlight;
    onHighlightChange: React.Dispatch<React.SetStateAction<Highlight>>;
    formationPositions: FormationPosition[];
    lineup: (string | null)[];
}

const HighlightSelector: React.FC<HighlightSelectorProps> = ({ playResult, players, highlights, onHighlightChange, formationPositions, lineup }) => {
    const fields = getHighlightFields(playResult);

    const handleSelect = (key: HighlightKey, playerId: string) => {
        onHighlightChange(prev => {
            const newHighlights = Object.assign({}, prev);
            if (playerId === '') {
                delete newHighlights[key];
            } else {
                newHighlights[key] = playerId;
            }
            return newHighlights;
        });
    };
    
    if (fields.length === 0) return null;
    
    const getFilteredPlayers = (key: HighlightKey): Player[] => {
        // Return all players on the field for any selection.
        return players;
    };

    return (
        <details className="group" open>
            <summary className="list-none flex items-center justify-between cursor-pointer">
                <h3 className="text-sm font-bold text-[var(--text-secondary)] pb-1">Tag Players (Optional)</h3>
                <ChevronRightIcon className="w-5 h-5 text-[var(--text-secondary)] transition-transform group-open:rotate-90" />
            </summary>
            <div className="grid grid-cols-2 gap-2 pt-2">
                {fields.map(({ key, label }) => {
                    const filteredPlayers = getFilteredPlayers(key);
                    const sortedPlayers = [...filteredPlayers].sort((a,b) => a.jerseyNumber - b.jerseyNumber);
                    return (
                        <div key={String(key)}>
                            <label htmlFor={`highlight-${String(key)}`} className="block text-sm font-medium text-[var(--text-secondary)]">{label}</label>
                            <select
                                id={`highlight-${String(key)}`}
                                value={highlights[key] || ''}
                                onChange={(e) => handleSelect(key, e.target.value)}
                                className="mt-1 block w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md shadow-sm py-1 px-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
                            >
                                <option value="">- Select -</option>
                                {sortedPlayers.map(p => (
                                    <option key={p.id} value={p.id}>
                                        #{p.jerseyNumber} {getLastName(p.name)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    );
                })}
            </div>
        </details>
    );
};


const getFormationsForType = (
    playType: PlayType,
    offense: FormationCollection,
    defense: FormationCollection,
    specialTeams: FormationCollection
): FormationCollection => {
    switch (playType) {
        case PlayType.Offense: return offense;
        case PlayType.Defense: return defense;
        case PlayType.SpecialTeams: return specialTeams;
        default: return {};
    }
};

const EditPlayModal: React.FC = () => {
    const {
        editingPlayIndex,
        setEditingPlayIndex,
        playHistory,
        players: allPlayers,
        handleSaveEditedPlay,
        offenseFormations,
        defenseFormations,
        specialTeamsFormations,
        homeStatus,
        fieldLogoUrl,
        getFormationsForEditModal,
    } = useGameState();
    
    const modalRoot = document.getElementById('modal-root');
    const play = editingPlayIndex !== null ? playHistory[editingPlayIndex] : null;

    const formations = useMemo(() => {
        if (!play) return {};
        const currentFormations = getFormationsForType(play.type, offenseFormations, defenseFormations, specialTeamsFormations);
        return getFormationsForEditModal(play.type, currentFormations);
    }, [play, offenseFormations, defenseFormations, specialTeamsFormations, getFormationsForEditModal]);

    const getInitialAssignments = useCallback(() => {
        if (!play) return [];
        const playerMap = new Map(allPlayers.map(p => [p.id, p]));
        const lineupPlayerIds = (play.lineup && play.lineup.length > 0) ? play.lineup : Array.from(play.playerIds);
        const initialAssignments = lineupPlayerIds.map(id => id ? playerMap.get(id) || null : null);
        const formationPositions = formations[play.formationName]?.positions || [];
        const finalAssignments = new Array(formationPositions.length).fill(null);
        for(let i=0; i<formationPositions.length; i++){
            finalAssignments[i] = initialAssignments[i] || null;
        }
        return finalAssignments;
    }, [play, allPlayers, formations]);

    if (editingPlayIndex === null || !play) {
        return null;
    }

    const playNumber = editingPlayIndex + 1;
    const onClose = () => setEditingPlayIndex(null);
    const onSave = handleSaveEditedPlay;
    
    const scoreBeforePlay = useMemo(() => {
        if (editingPlayIndex === 0) {
            return { ourScore: 0, opponentScore: 0 };
        }
        const prevPlay = playHistory[editingPlayIndex - 1];
        return { ourScore: prevPlay.ourScore || 0, opponentScore: prevPlay.opponentScore || 0 };
    }, [editingPlayIndex, playHistory]);
    
    const [assignments, setAssignments] = useState<(Player | null)[]>(getInitialAssignments);
    const [down, setDown] = useState<number>(play.down || 1);
    const [quarter, setQuarter] = useState<number>(play.quarter || 1);
    const [gameTime, setGameTime] = useState<string>(play.gameTime || '10:00');
    const [endTime, setEndTime] = useState<string>(() => {
        const startTimeSeconds = parseGameTime(play.gameTime || '10:00');
        const durationSeconds = play.playDuration || 6; // Default to 6s if not present
        return formatTime(Math.max(0, startTimeSeconds - durationSeconds));
    });
    const [ourScore, setOurScore] = useState<string>(play.ourScore != null ? play.ourScore.toString() : '');
    const [opponentScore, setOpponentScore] = useState<string>(play.opponentScore != null ? play.opponentScore.toString() : '');
    const [isFlag, setIsFlag] = useState(play.isFlag || false);
    const [yardsGained, setYardsGained] = useState<string>(
        play.yardsGained != null ? play.yardsGained.toString() : ''
    );
    const [startYardLine, setStartYardLine] = useState<number>(play.startYardLine ?? 25);
    const [waveSubState, setWaveSubState] = useState<{ isOpen: boolean; stagedSlotIndex: number | null }>({ isOpen: false, stagedSlotIndex: null });
    const [playResult, setPlayResult] = useState<PlayResult>(play.playResult || PlayResult.Run);
    const [highlights, setHighlights] = useState<Highlight>(play.highlights || {});

    const { type: playType } = play;
    const [formationName, setFormationName] = useState<string>(play.formationName);
    
    const [penaltyOn, setPenaltyOn] = useState<'offense' | 'defense'>(play.penaltyOn || 'offense');
    const [isAutoFirstDown, setIsAutoFirstDown] = useState(play.isAutoFirstDown || false);
    const [isLossOfDown, setIsLossOfDown] = useState(play.isLossOfDown || false);
    const [isRepeatDown, setIsRepeatDown] = useState(play.isRepeatDown || false);

    const playResultOptions = useMemo(() => getPlayResultOptionsForType(playType), [playType]);
    
    const { onHomeTeamSide, displayYardLineForRender } = useMemo(() => {
        const onSideGreaterThan50 = startYardLine > 50;
        const onHomeTeamSide = !onSideGreaterThan50;
        const displayYard = onSideGreaterThan50 ? 100 - startYardLine : startYardLine;
        return { onHomeTeamSide, displayYardLineForRender: Math.round(displayYard).toString() };
    }, [startYardLine]);

    const yardsGainedLabel = useMemo(() => {
        if (isFlag) return 'Penalty Yards';
        const result = playResult || '';
        if (result.includes('Turnover') || result.includes('Interception') || result.includes('Fumble') || result.includes('Blocked')) {
            return 'Net Yardage on Play';
        }
        if (playType === PlayType.Defense) {
            return 'Yards Gained by Opponent';
        }
        return 'Yards Gained by Offense';
    }, [isFlag, playResult, playType]);

    const handleSideChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSideIsHome = e.target.value === 'home';
        if (newSideIsHome === onHomeTeamSide) return;
        setStartYardLine(100 - startYardLine);
    };

    const handleYardLineInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (/^\d*$/.test(val)) {
            const num = parseInt(val, 10);
            if (val === '' || (num >= 0 && num <= 50)) {
                const newNum = num || 0;
                const newStartYardLine = onHomeTeamSide ? newNum : 100 - newNum;
                setStartYardLine(newStartYardLine);
            }
        }
    };

    const handleFormationChange = (newFormationName: string) => {
        setFormationName(newFormationName);
        const newFormationData = formations[newFormationName];
        if (!newFormationData) return;
    
        const presetIds = newFormationData.presetPlayerIds || [];
        const positions = newFormationData.positions || [];
        const playerMap = new Map(allPlayers.map(p => [p.id, p]));
    
        const newAssignments = presetIds.map(id => id ? playerMap.get(id) || null : null);
    
        const finalAssignments = new Array(positions.length).fill(null);
        for (let i = 0; i < positions.length; i++) {
            finalAssignments[i] = newAssignments[i] || null;
        }
        setAssignments(finalAssignments);
        setHighlights({}); // Reset highlights as players/positions have changed
    };
    
    const formationData = useMemo(() => formations[formationName], [formations, formationName]);
    const formationPositions = useMemo(() => formationData?.positions || [], [formationData]);

    const centeredFormationPositions = useMemo(() => {
        return formationPositions.map(pos => {
            const topValue = parseFloat(pos.top);
            if (topValue < 50) {
                const newTop = 100 - topValue;
                return { ...pos, top: `${newTop}%` };
            }
            return pos;
        });
    }, [formationPositions]);
    
    const playersOnField = useMemo(() => assignments.filter((p): p is Player => p !== null), [assignments]);
    const onFieldPlayerIds = useMemo(() => new Set(playersOnField.map(p => p.id)), [playersOnField]);

    useEffect(() => {
        setIsFlag([PlayResult.PenaltyAccepted, PlayResult.PenaltyDeclined, PlayResult.PenaltyOffsetting].includes(playResult));
    }, [playResult]);

    useEffect(() => {
        const { ourScoreAdjustment, opponentScoreAdjustment } = calculateScoreAdjustments(playResult);
        setOurScore((scoreBeforePlay.ourScore + ourScoreAdjustment).toString());
        setOpponentScore((scoreBeforePlay.opponentScore + opponentScoreAdjustment).toString());
    }, [playResult, scoreBeforePlay]);


    const handleSave = () => {
        const lineupIds = assignments.map(p => p ? p.id : null);
        const ourScoreNum = parseInt(ourScore, 10) || 0;
        const opponentScoreNum = parseInt(opponentScore, 10) || 0;
        
        const displayYardLineNum = parseInt(displayYardLineForRender, 10);
        if (isNaN(displayYardLineNum) || displayYardLineNum < 0 || displayYardLineNum > 50) {
            alert("Please enter a valid yard line between 0 and 50.");
            return;
        }
        
        const startTimeSeconds = parseGameTime(gameTime) ?? 0;
        const endTimeSeconds = parseGameTime(endTime) ?? startTimeSeconds;
        const duration = Math.max(0, startTimeSeconds - endTimeSeconds);

        onSave(onFieldPlayerIds, lineupIds, formationName, {
            down,
            quarter,
            gameTime,
            ourScore: ourScoreNum,
            opponentScore: opponentScoreNum,
            isFlag,
            yardsGained: parseInt(yardsGained, 10) || 0,
            playDuration: duration,
            startYardLine,
            playResult,
            highlights,
            penaltyOn,
            isAutoFirstDown,
            isLossOfDown,
            isRepeatDown,
        });
    };
    
    const handleSlotClick = (index: number) => {
        setWaveSubState({ isOpen: true, stagedSlotIndex: index });
    };

    const handleConfirmSubstitutions = (newAssignments: (Player | null)[]) => {
        setAssignments(newAssignments);
        setWaveSubState({ isOpen: false, stagedSlotIndex: null });
    };

    const isHomeGame = homeStatus === 'Home';
    const homeScore = isHomeGame ? ourScore : opponentScore;
    const awayScore = isHomeGame ? opponentScore : ourScore;
    const setHomeScore = (value: string) => isHomeGame ? setOurScore(value) : setOpponentScore(value);
    const setAwayScore = (value: string) => isHomeGame ? setOpponentScore(value) : setOurScore(value);

    const playTypeColor = playType === PlayType.Offense ? 'text-[var(--accent-secondary)]'
        : playType === PlayType.Defense ? 'text-[var(--accent-defense)]'
        : 'text-[var(--accent-special)]';
        
    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                <div className="glass-effect rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col animate-fade-in">
                    <header className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center flex-wrap gap-4">
                        <div className="flex-grow">
                            <h2 className="text-xl font-bold">
                                Editing <span className={playTypeColor}>{playType}</span> Play #{playNumber}
                            </h2>
                            <div className="flex items-center space-x-2 mt-1">
                                <label htmlFor="edit-formation-select" className="text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap">Alignment:</label>
                                <select
                                    id="edit-formation-select"
                                    value={formationName}
                                    onChange={(e) => handleFormationChange(e.target.value)}
                                    className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-primary)] text-sm rounded-md focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] block p-1.5"
                                >
                                    {Object.keys(formations).map(name => (
                                        <option key={name} value={name}>{name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="text-lg font-semibold text-right">
                            <span className={onFieldPlayerIds.size === formationPositions.length ? 'text-[var(--accent-primary)]' : 'text-[var(--accent-warning)]'}>{onFieldPlayerIds.size}</span>
                            <span className="text-[var(--text-secondary)]"> / {formationPositions.length} Players on Field</span>
                        </div>
                    </header>

                    <main className="flex-grow p-4 overflow-y-auto flex flex-col lg:flex-row gap-4 min-h-0">
                        <div className="lg:flex-grow flex flex-col">
                            <div className="flex-grow relative flex items-center justify-center">
                                <TeamFormation
                                    allPlayers={allPlayers}
                                    playType={playType}
                                    formation={centeredFormationPositions}
                                    formationName={formationName}
                                    assignments={assignments}
                                    onAssignmentsChange={setAssignments}
                                    onSlotClick={handleSlotClick}
                                />
                            </div>
                        </div>

                        <div className="lg:w-1/3 xl:w-1/4 bg-black/20 p-4 rounded-lg space-y-4 flex-shrink-0 overflow-y-auto">
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-[var(--text-secondary)] border-b border-[var(--border-primary)] pb-1">Play Outcome</h3>
                                <div>
                                    <label htmlFor="playResult" className="block text-sm font-medium text-[var(--text-secondary)]">Result</label>
                                    <select id="playResult" value={playResult} onChange={e => setPlayResult(e.target.value as PlayResult)} className="mt-1 block w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md shadow-sm py-2 px-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]">
                                        {playResultOptions.map(group => (
                                            <optgroup key={group.label} label={group.label}>
                                                {group.options.map(result => (
                                                    <option key={result} value={result}>{result}</option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="startYardLine" className="block text-sm font-medium text-[var(--text-secondary)]">Start Line</label>
                                        <div className="mt-1 flex rounded-md shadow-sm">
                                            <select value={onHomeTeamSide ? 'home' : 'away'} onChange={handleSideChange} className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-[var(--border-primary)] bg-[var(--bg-tertiary)] text-gray-300 text-sm">
                                                <option value="home">Home</option>
                                                <option value="away">Away</option>
                                            </select>
                                            <input type="text" value={displayYardLineForRender} onChange={handleYardLineInputChange} min="0" max="50" className="block w-full rounded-none rounded-r-md bg-[var(--bg-secondary)] border-[var(--border-primary)] py-2 px-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]" />
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="yardsGained" className="block text-sm font-medium text-[var(--text-secondary)]">{yardsGainedLabel}</label>
                                        <input
                                            type="text"
                                            id="yardsGained"
                                            value={yardsGained}
                                            onChange={e => setYardsGained(e.target.value.replace(/[^0-9-]/g, ''))}
                                            className="mt-1 block w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md shadow-sm py-2 px-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                {playResult === PlayResult.PenaltyAccepted && (
                                    <fieldset className="space-y-2 border-t border-[var(--border-primary)] pt-3">
                                        <legend className="text-sm font-bold text-[var(--text-secondary)] pb-1">Penalty Details</legend>
                                        <div>
                                            <div className="flex gap-4 mt-1">
                                                <label className="flex items-center text-sm text-[var(--text-secondary)]"><input type="radio" value="offense" checked={penaltyOn === 'offense'} onChange={() => setPenaltyOn('offense')} className="mr-2 h-4 w-4 text-[var(--accent-primary)] bg-[var(--bg-tertiary)] border-[var(--border-primary)] focus:ring-[var(--accent-primary)]"/> Offense</label>
                                                <label className="flex items-center text-sm text-[var(--text-secondary)]"><input type="radio" value="defense" checked={penaltyOn === 'defense'} onChange={() => setPenaltyOn('defense')} className="mr-2 h-4 w-4 text-[var(--accent-primary)] bg-[var(--bg-tertiary)] border-[var(--border-primary)] focus:ring-[var(--accent-primary)]"/> Defense</label>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2">
                                            <label className="flex items-center text-sm text-[var(--text-secondary)]"><input type="checkbox" checked={isAutoFirstDown} onChange={e => setIsAutoFirstDown(e.target.checked)} className="mr-2 h-4 w-4 text-[var(--accent-primary)] bg-[var(--bg-tertiary)] border-[var(--border-primary)] rounded focus:ring-[var(--accent-primary)]"/> Auto 1st Down</label>
                                            <label className="flex items-center text-sm text-[var(--text-secondary)]"><input type="checkbox" checked={isLossOfDown} onChange={e => setIsLossOfDown(e.target.checked)} className="mr-2 h-4 w-4 text-[var(--accent-primary)] bg-[var(--bg-tertiary)] border-[var(--border-primary)] rounded focus:ring-[var(--accent-primary)]"/> Loss of Down</label>
                                            <label className="flex items-center text-sm text-[var(--text-secondary)]"><input type="checkbox" checked={isRepeatDown} onChange={e => setIsRepeatDown(e.target.checked)} className="mr-2 h-4 w-4 text-[var(--accent-primary)] bg-[var(--bg-tertiary)] border-[var(--border-primary)] rounded focus:ring-[var(--accent-primary)]"/> Repeat Down</label>
                                        </div>
                                    </fieldset>
                                )}
                                <HighlightSelector 
                                    playResult={playResult}
                                    players={playersOnField}
                                    highlights={highlights}
                                    onHighlightChange={setHighlights}
                                    formationPositions={formationPositions}
                                    lineup={assignments.map(p => p ? p.id : null)}
                                />
                            </div>
                            <hr className="border-[var(--border-primary)]" />
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-[var(--text-secondary)] border-b border-[var(--border-primary)] pb-1">Game State</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="quarter" className="block text-sm font-medium text-[var(--text-secondary)]">Quarter</label>
                                        <select
                                            id="quarter"
                                            value={quarter}
                                            onChange={e => setQuarter(Number(e.target.value))}
                                            className="mt-1 block w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md shadow-sm py-2 px-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]"
                                        >
                                            <option value="1">1st Quarter</option>
                                            <option value="2">2nd Quarter</option>
                                            <option value="3">3rd Quarter</option>
                                            <option value="4">4th Quarter</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Down</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[1, 2, 3, 4].map(d => (
                                                <button type="button" key={d} onClick={() => setDown(d)} className={`p-3 rounded-lg font-bold text-center transition-colors ${down === d ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--border-primary)]'}`}>{d}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="gameTime" className="block text-sm font-medium text-[var(--text-secondary)]">Start Time</label>
                                        <input id="gameTime" type="text" value={gameTime} onChange={e => setGameTime(e.target.value)} className="mt-1 block w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md shadow-sm py-2 px-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]" placeholder="MM:SS" required />
                                    </div>
                                    <div>
                                        <label htmlFor="endTime" className="block text-sm font-medium text-[var(--text-secondary)]">End Time</label>
                                        <input
                                            type="text"
                                            id="endTime"
                                            value={endTime}
                                            onChange={e => setEndTime(e.target.value)}
                                            className="mt-1 block w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md shadow-sm py-2 px-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                                            placeholder="MM:SS"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="homeScore" className="block text-sm font-medium text-[var(--text-secondary)]">Home Score</label>
                                        <input id="homeScore" type="text" placeholder="0" value={homeScore} onChange={e => setHomeScore(e.target.value.replace(/[^0-9]/g, ''))} className="mt-1 block w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md shadow-sm py-2 px-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]" required />
                                    </div>
                                    <div>
                                        <label htmlFor="awayScore" className="block text-sm font-medium text-[var(--text-secondary)]">Away Score</label>
                                        <input id="awayScore" type="text" placeholder="0" value={awayScore} onChange={e => setAwayScore(e.target.value.replace(/[^0-9]/g, ''))} className="mt-1 block w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md shadow-sm py-2 px-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]" required />
                                    </div>
                                </div>
                                <div className="flex items-center justify-start pt-2">
                                    <input id="editIsFlag" type="checkbox" checked={isFlag} readOnly className="h-4 w-4 text-[var(--accent-warning)] bg-[var(--bg-secondary)] border-[var(--border-primary)] rounded focus:ring-[var(--accent-warning)]" />
                                    <label htmlFor="editIsFlag" className="ml-2 block text-sm font-medium text-[var(--accent-warning)]">Flag on play (set via Result)</label>
                                </div>
                            </div>
                        </div>
                    </main>

                    <footer className="p-4 border-t border-[var(--border-primary)] flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-400"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={onFieldPlayerIds.size === 0}
                            className="px-6 py-2 bg-[var(--accent-primary)] text-white font-bold rounded-lg hover:bg-[var(--accent-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-[var(--accent-primary)] disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                            Save Changes
                        </button>
                    </footer>
                </div>
            </div>
            {waveSubState.isOpen && modalRoot && createPortal(
                <WaveSubModal
                    isOpen={waveSubState.isOpen}
                    onClose={() => setWaveSubState({ isOpen: false, stagedSlotIndex: null })}
                    onConfirm={handleConfirmSubstitutions}
                    allPlayers={allPlayers}
                    currentAssignments={assignments}
                    formationPositions={formationPositions}
                    stagedSlotIndex={waveSubState.stagedSlotIndex}
                />,
                modalRoot
            )}
        </>
    );
};

export default EditPlayModal;
import React, { useState, useMemo, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { z } from 'zod';
import { Play, Player, PlayResult, PlayType, Highlight, FormationPosition } from '../types';
import { getPlayResultOptionsForType, getLastName, formatTime, calculateDrives, parseGameTime } from '../utils';
import { POSITION_FULL_NAMES } from '../constants';
import DriveChart from './DriveChart';
import TeamFormation from './TeamFormation';
import { ChevronRightIcon } from './icons';
import { useGameState } from '../contexts/GameStateContext';

// Schema for play details validation
const PlayDetailsSchema = z.object({
    down: z.number().min(1).max(4),
    startYardLine: z.number().min(0).max(100),
    yardsGained: z.number(),
    playResult: z.nativeEnum(PlayResult),
    highlights: z.record(z.string(), z.string().optional()),
    penaltyOn: z.enum(['offense', 'defense']).optional(),
    isAutoFirstDown: z.boolean().optional(),
    isLossOfDown: z.boolean().optional(),
    isRepeatDown: z.boolean().optional(),
    gameTime: z.string(),
    playDuration: z.number().min(0),
});

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


const getFilteredPlayersForHighlight = (key: HighlightKey, players: Player[]): Player[] => {
    const getPositions = (p: Player) => p.position.split(',').map(pos => pos.trim().toUpperCase());
    const isPos = (p: Player, abbreviations: string[]) => {
        const pPositions = getPositions(p);
        return pPositions.some(pPos => 
            abbreviations.includes(pPos) || 
            abbreviations.some(abbr => POSITION_FULL_NAMES[abbr]?.toUpperCase() === pPos)
        );
    };

    const filtered = players.filter(p => {
        let match = false;
        switch(key) {
            case 'passerId': match = isPos(p, ['QB']); break;
            case 'receiverId': match = isPos(p, ['WR', 'TE', 'RB']); break;
            case 'runnerId': match = isPos(p, ['RB', 'WR']); break;
            case 'tacklerId':
            case 'interceptorId': match = isPos(p, ['DE', 'DT', 'LB', 'CB', 'S']); break;
            case 'kickerId': match = isPos(p, ['K', 'P']); break;
            case 'holderId': match = isPos(p, ['H']); break;
            case 'returnerId': match = isPos(p, ['KR', 'WR', 'RB']); break;
            default: match = true;
        }
        return match;
    });

    return filtered;
};

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

    return (
        <details className="group" open>
            <summary className="list-none flex items-center justify-between cursor-pointer">
                <h3 className="text-sm font-bold text-[var(--text-secondary)] pb-1">Tag Players (Optional)</h3>
                <ChevronRightIcon className="w-5 h-5 text-[var(--text-secondary)] transition-transform group-open:rotate-90" />
            </summary>
            <div className="grid grid-cols-2 gap-2 pt-2">
                {fields.map(({ key, label }) => {
                    // Show all players currently on the field for any selection.
                    const sortedPlayers = [...players].sort((a,b) => a.jerseyNumber - b.jerseyNumber);

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


const PlayDetailsModal: React.FC = () => {
  const {
      handleClosePlayDetails,
      handleSavePlayDetails,
      playHistory,
      tempPlayData,
      players: allPlayers,
      homeStatus,
      currentQuarter: quarter,
      gameTime: currentGameTime,
      fieldLogoUrl,
      insertionIndex,
      nextPlayState,
      showToast,
  } = useGameState();

  // Snapshot of game state to detect stale closures
  const historySnapshotRef = useRef(playHistory.length);
  const modalRoot = document.getElementById('modal-root');

  const onSave = handleSavePlayDetails;
  const onClose = handleClosePlayDetails;

  useEffect(() => {
      // Cleanup logic if needed
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!tempPlayData.current) {
      return null;
  }

  const { playType, formationName, playerIds, lineup, formationPositions } = tempPlayData.current;
  
  const suggestedState = useMemo(() => {
    const { down, startYardLine: initialStartYardLine } = nextPlayState;

    const lastPlay = insertionIndex !== null ? (insertionIndex > 0 ? playHistory[insertionIndex - 1] : undefined) : (playHistory.length > 0 ? playHistory[playHistory.length - 1] : undefined);
    
    let finalStartYardLine = initialStartYardLine;
    const quarterChanged = lastPlay && lastPlay.quarter !== undefined && quarter !== lastPlay.quarter;
    if (quarterChanged) {
        finalStartYardLine = 100 - finalStartYardLine;
    }

    return { down, startYardLine: finalStartYardLine };
}, [nextPlayState, playHistory, insertionIndex, quarter]);

  const playResultOptions = useMemo(() => getPlayResultOptionsForType(playType), [playType]);

  const defaultResult = useMemo(() => {
    if (playType === PlayType.Offense) return PlayResult.Run;
    if (playType === PlayType.Defense) return PlayResult.DefenseTackle;
    
    // Robust lookup for special teams
    const name = formationName.toLowerCase();
    if (name.includes('return')) return PlayResult.KickReturn;
    if (name.includes('kickoff')) return PlayResult.KickoffTackle;
    if (name.includes('p.a.t')) return PlayResult.PATGood;
    
    return playResultOptions[0]?.options[0] || PlayResult.PenaltyAccepted;
  }, [playType, formationName, playResultOptions]);
  
  const [down, setDown] = useState<number>(suggestedState.down);
  const [isFlag, setIsFlag] = useState(false);
  const [playResult, setPlayResult] = useState<PlayResult>(defaultResult);
  const [highlights, setHighlights] = useState<Highlight>(tempPlayData.current.highlights || {});
  
  const [startYardLine, setStartYardLine] = useState(suggestedState.startYardLine);
  const [yardsGained, setYardsGained] = useState<string>('');
  const [endTime, setEndTime] = useState<string>(formatTime(Math.max(0, currentGameTime - 6))); // Default 6s play
  const [activeSubTab, setActiveSubTab] = useState<'lineup' | 'driveChart'>('lineup');

    const [penaltyOn, setPenaltyOn] = useState<'offense' | 'defense'>('offense');
    const [isAutoFirstDown, setIsAutoFirstDown] = useState(false);
    const [isLossOfDown, setIsLossOfDown] = useState(false);
    const [isRepeatDown, setIsRepeatDown] = useState(false);

  const playerMap = useMemo(() => new Map(allPlayers.map(p => [p.id, p])), [allPlayers]);
  const playersOnField = useMemo(() => {
    const filtered = allPlayers.filter(p => playerIds.has(p.id));
    return filtered;
  }, [playerIds, allPlayers]);
  const assignments = useMemo(() => lineup.map(id => id ? playerMap.get(id) || null : null), [lineup, playerMap]);
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

  const { onHomeTeamSide, displayYardLineForRender } = useMemo(() => {
    const onSideGreaterThan50 = startYardLine > 50;
    const onHomeTeamSide = !onSideGreaterThan50;
    const displayYard = onSideGreaterThan50 ? 100 - startYardLine : startYardLine;
    return { onHomeTeamSide, displayYardLineForRender: Math.round(displayYard).toString() };
  }, [startYardLine]);

    const yardsGainedLabel = useMemo(() => {
        if (isFlag) return 'Penalty Yards';

        const isTurnoverOrBlocked = [
            PlayResult.TurnoverOnDowns,
            PlayResult.InterceptionThrown,
            PlayResult.FumbleLost,
            PlayResult.FumbleTouchback,
            PlayResult.Interception,
            PlayResult.FumbleRecovery,
            PlayResult.MuffedPuntLost,
            PlayResult.BlockedKickRecovery,
            PlayResult.PuntBlocked,
            PlayResult.FieldGoalBlocked,
            PlayResult.BlockedPuntReturnTD,
            PlayResult.BlockedFieldGoalReturnTD,
        ].includes(playResult);

        if (isTurnoverOrBlocked) {
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

  useEffect(() => {
    setIsFlag([PlayResult.PenaltyAccepted, PlayResult.PenaltyDeclined, PlayResult.PenaltyOffsetting].includes(playResult));
    
    // Auto-populate highlights
    const fields = getHighlightFields(playResult);
    const newHighlights = { ...highlights };
    
    // Remove highlights that are no longer relevant
    const relevantKeys = fields.map(f => f.key);
    Object.keys(newHighlights).forEach(key => {
        if (!relevantKeys.includes(key as HighlightKey)) {
            delete newHighlights[key];
        }
    });

    let changed = false;
    
    fields.forEach(({ key }) => {
        if (!newHighlights[key]) {
            const filtered = getFilteredPlayersForHighlight(key, playersOnField);
            if (filtered.length === 1) {
                newHighlights[key] = filtered[0].id;
                changed = true;
            }
        }
    });
    
    if (changed || Object.keys(newHighlights).length !== Object.keys(highlights).length) {
        setHighlights(newHighlights);
    }
  }, [playResult, playersOnField]);
  
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
        // State synchronization check
        if (playHistory.length !== historySnapshotRef.current && insertionIndex === null) {
            const confirmSave = window.confirm("The game state has changed since you opened this modal. Do you still want to save these details?");
            if (!confirmSave) return;
        }

        const num = parseInt(displayYardLineForRender, 10);
        if (isNaN(num) || num < 0 || num > 50) {
            throw new Error("Please enter a valid yard line between 0 and 50.");
        }

        const startTimeSeconds = currentGameTime;
        const endTimeSeconds = parseGameTime(endTime) ?? startTimeSeconds;
        const duration = Math.max(0, startTimeSeconds - endTimeSeconds);

        const details = { 
            gameTime: formatTime(currentGameTime), 
            down, 
            yardsGained: parseInt(yardsGained, 10) || 0, 
            playDuration: duration, 
            startYardLine, 
            playResult, 
            highlights, 
            penaltyOn, 
            isAutoFirstDown, 
            isLossOfDown, 
            isRepeatDown 
        };

        // Validate with Zod
        const validatedDetails = PlayDetailsSchema.parse(details);

        onSave(validatedDetails);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const firstError = error.issues[0]?.message || "Validation failed";
            showToast(`Validation Error: ${firstError}`, 'error');
        } else if (error instanceof Error) {
            showToast(error.message, 'error');
        } else {
            showToast("An unexpected error occurred while saving.", 'error');
        }
        console.error("Save Play Details Error:", error);
    }
  };

  const handlePenaltyPreset = (
      team: 'offense' | 'defense', 
      { autoFirst = false, lossDown = false, repeat = false }
  ) => {
      setPenaltyOn(team);
      setIsAutoFirstDown(autoFirst);
      setIsLossOfDown(lossDown);
      setIsRepeatDown(repeat);
  };
  
    const drivePlays = useMemo(() => {
      const drives = calculateDrives(playHistory);
      if (drives.length === 0) return [];
  
      const lastDrive = drives[drives.length - 1];
      const lastPlay = playHistory.length > 0 ? playHistory[playHistory.length - 1] : undefined;
      
      if(lastPlay && (lastPlay.quarter === 2 && quarter === 3)) {
          return [];
      }
      return lastDrive.plays.map(p => p.play);
  }, [playHistory, quarter]);


  const currentPlayForChart = useMemo((): Play => ({
    type: playType,
    playerIds: new Set(playersOnField.map(p => p.id)),
    formationName,
    timestamp: Date.now(),
    down,
    startYardLine,
    yardsGained: parseInt(yardsGained, 10) || 0,
    playResult,
    quarter,
    gameTime: formatTime(currentGameTime),
    highlights,
  }), [playType, playersOnField, formationName, down, startYardLine, yardsGained, playResult, quarter, currentGameTime, highlights]);

  const inactiveTabClass = "border-transparent text-[var(--text-secondary)] hover:text-white";
  const activeTabClass = "border-[var(--accent-primary)] text-[var(--accent-primary)]";

  const modalContent = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <form onSubmit={handleSave} className="glass-effect rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col animate-fade-in overflow-hidden">
        <header className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center bg-transparent">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Play Details: {formationName}</h2>
            <p className="text-[var(--text-secondary)] text-xs">Confirm play outcome and details</p>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--text-secondary)] hover:text-white p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>

        <main className="flex-grow p-4 overflow-y-auto flex flex-col lg:flex-row gap-4 min-h-0 bg-[var(--bg-primary)]">
            <div className="lg:flex-grow flex flex-col">
                <div className="flex border-b border-[var(--border-primary)] mb-2 flex-shrink-0">
                    <button type="button" onClick={() => setActiveSubTab('lineup')} className={`py-2 px-4 font-bold border-b-2 transition-colors duration-200 text-sm ${activeSubTab === 'lineup' ? activeTabClass : inactiveTabClass}`}>Lineup & Outcome</button>
                    <button type="button" onClick={() => setActiveSubTab('driveChart')} className={`py-2 px-4 font-bold border-b-2 transition-colors duration-200 text-sm ${activeSubTab === 'driveChart' ? activeTabClass : inactiveTabClass}`}>Drive Chart</button>
                </div>
                <div className="flex-grow relative flex items-center justify-center">
                    {activeSubTab === 'lineup' && (
                        <TeamFormation 
                            allPlayers={playersOnField} 
                            playType={playType} 
                            formation={centeredFormationPositions}
                            formationName={formationName}
                            assignments={assignments}
                            onAssignmentsChange={() => {}}
                            onSlotClick={() => {}}
                        />
                    )}
                    {activeSubTab === 'driveChart' && (
                       <DriveChart 
                            drivePlays={drivePlays}
                            currentPlay={currentPlayForChart}
                            fieldLogoUrl={fieldLogoUrl} 
                            players={allPlayers} 
                        />
                    )}
                </div>
            </div>

            {activeSubTab === 'lineup' ? (
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
                        {isFlag && playResult === PlayResult.PenaltyAccepted && (
                            <fieldset className="space-y-2 border-t border-[var(--border-primary)] pt-3">
                                <legend className="text-sm font-bold text-[var(--text-secondary)] pb-1">Common Penalties</legend>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <button type="button" onClick={() => handlePenaltyPreset('defense', { autoFirst: true })} className="p-2 bg-[var(--bg-secondary)] hover:bg-[var(--border-primary)] rounded-md">Def. Pass Interference (Auto 1st)</button>
                                    <button type="button" onClick={() => handlePenaltyPreset('offense', { repeat: true })} className="p-2 bg-[var(--bg-secondary)] hover:bg-[var(--border-primary)] rounded-md">Off. Holding (Repeat Down)</button>
                                    <button type="button" onClick={() => handlePenaltyPreset('offense', { lossDown: true })} className="p-2 bg-[var(--bg-secondary)] hover:bg-[var(--border-primary)] rounded-md">Int. Grounding (Loss of Down)</button>
                                    <button type="button" onClick={() => handlePenaltyPreset('defense', {})} className="p-2 bg-[var(--bg-secondary)] hover:bg-[var(--border-primary)] rounded-md">Def. Offsides (No Down Change)</button>
                                </div>
                                <div className="grid grid-cols-3 gap-x-4 gap-y-2 pt-2">
                                    <label className="flex items-center text-sm text-[var(--text-secondary)]"><input type="checkbox" checked={isAutoFirstDown} onChange={e => setIsAutoFirstDown(e.target.checked)} className="mr-2 h-4 w-4 text-[var(--accent-primary)] bg-[var(--bg-tertiary)] border-[var(--border-primary)] rounded focus:ring-[var(--accent-primary)]"/> Auto 1st</label>
                                    <label className="flex items-center text-sm text-[var(--text-secondary)]"><input type="checkbox" checked={isLossOfDown} onChange={e => setIsLossOfDown(e.target.checked)} className="mr-2 h-4 w-4 text-[var(--accent-primary)] bg-[var(--bg-tertiary)] border-[var(--border-primary)] rounded focus:ring-[var(--accent-primary)]"/> Loss Down</label>
                                    <label className="flex items-center text-sm text-[var(--text-secondary)]"><input type="checkbox" checked={isRepeatDown} onChange={e => setIsRepeatDown(e.target.checked)} className="mr-2 h-4 w-4 text-[var(--accent-primary)] bg-[var(--bg-tertiary)] border-[var(--border-primary)] rounded focus:ring-[var(--accent-primary)]"/> Repeat</label>
                                </div>
                            </fieldset>
                        )}
                        <HighlightSelector
                            playResult={playResult}
                            players={playersOnField}
                            highlights={highlights}
                            onHighlightChange={setHighlights}
                            formationPositions={formationPositions}
                            lineup={lineup}
                        />
                    </div>
                    <hr className="border-[var(--border-primary)]" />
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-[var(--text-secondary)] border-b border-[var(--border-primary)] pb-1">Game State</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Down</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[1, 2, 3, 4].map(d => (
                                        <button type="button" key={d} onClick={() => setDown(d)} className={`p-3 rounded-lg font-bold text-center transition-colors ${down === d ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--border-primary)]'}`}>{d}</button>
                                    ))}
                                </div>
                            </div>
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
                        </div>
                         <div className="grid grid-cols-2 gap-4">
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
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)]">Start Time</label>
                                <div className="mt-1 block w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md shadow-sm py-2 px-3 text-[var(--text-primary)]">
                                    {formatTime(currentGameTime)}
                                </div>
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
                    </div>
                </div>
            ) : (
                <div className="lg:w-1/3 xl:w-1/4 bg-black/20 p-4 rounded-lg flex flex-col items-center justify-center text-center space-y-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h4.5M7.5 21h9" />
                    </svg>
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">Drive Chart</h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                        This chart shows the progression of all plays in the current drive.
                    </p>
                </div>
            )}
        </main>

        <footer className="p-4 border-t border-[var(--border-primary)] flex justify-end space-x-4 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-[var(--accent-primary)] text-white font-bold rounded-lg hover:bg-[var(--accent-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-[var(--accent-primary)]"
          >
            Save Play
          </button>
        </footer>
      </form>
    </div>
  );

  return modalContent;
};

export default PlayDetailsModal;
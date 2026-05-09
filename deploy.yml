import React, { createContext, useState, useEffect, useCallback, useMemo, useRef, useContext, ReactNode } from 'react';
import { Player, Play, PlayType, PlayerStatus, ActiveTab, FormationCollection, ParsedRosterUpdate, ParsedFormation, ParsedOpponentUpdate, WeekData, Formation, PlayResult, Highlight, QuarterSummaryData, FormationStats, FormationPosition, NavBarPosition, ScoreboardProps, PlayerStats, CustomFormations, SelectablePlayType, Theme, CustomTheme, AiSummary, Drive, GameStateContextType, SerializablePlay, StoredGameState, AgeDivision } from '../types';
import { db, listenToGameState, saveGameStateToFirebase, listenToUserSettings, saveUserSettingsToFirebase, addPlayerToAllWeeks, updatePlayerInAllWeeks, updateRosterForAllWeeks, firestore, deletePlayerFromAllWeeks, saveSchedule, signOut, savePlay, deletePlay, resetPlaysForWeek, markWalkthroughCompleted } from '../firebase';
import { GAME_DATA, WEEKLY_OPPONENTS, WEEKS, WEEKLY_HOME_AWAY, WEEK_DATES, WEEKLY_RESULTS, DEFAULT_PLAYER_IMAGE, BLANK_WEEK_DATA, OFFENSE_DISPLAY_GROUPS, DEFENSE_DISPLAY_GROUPS, ST_DISPLAY_GROUPS, LEAGUE_STANDINGS } from '../constants';
import { calculateScoreAdjustments, getOrdinal, formatTime, parseGameTime, calculateDrives, deepCopy, getLastName, parseSimpleMarkdown } from '../utils';
import { GoogleGenAI } from "@google/genai";
import { DEFAULT_OFFENSE_FORMATIONS, DEFAULT_DEFENSE_FORMATIONS, DEFAULT_SPECIAL_TEAMS_FORMATIONS } from '../defaultFormations';

const tabOrder: ActiveTab[] = ['overview', 'game', 'play-log', 'roster', 'formations', 'insights', 'leaderboards'];
type SyncState = 'idle' | 'syncing' | 'synced' | 'offline';

const DEFAULT_FIELD_LOGO = "https://raw.githubusercontent.com/niwde787/CJF/1f4df5f83d0fbb85bc6ea1ac8ed36765f518e995/SNAPS_H.svg";

const DEFAULT_CUSTOM_THEME: CustomTheme = {
  bgPrimary: '#111827',
  bgSecondary: '#1F2937',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  borderPrimary: '#4B5563',
  accentPrimary: '#3B82F6',
  accentSecondary: '#10B981',
  accentDefense: '#EF4444',
  accentSpecial: '#A855F7',
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

const shouldClockRunAfterPlay = (playResult: PlayResult): boolean => {
    const clockStoppingResults: PlayResult[] = [
        PlayResult.PassIncomplete,
        PlayResult.PassCompletedOutOfBounds,
        PlayResult.RunOutOfBounds,
        PlayResult.KickReturnOutOfBounds,
        PlayResult.PuntReturnOutOfBounds,
        PlayResult.DefensePassDefended,
        // All scoring plays stop the clock
        PlayResult.PassTouchdown, PlayResult.RunTouchdown, PlayResult.InterceptionReturnTD, PlayResult.FumbleReturnTD, PlayResult.KickReturnTD, PlayResult.PuntReturnTD,
        PlayResult.BlockedPuntReturnTD, PlayResult.BlockedFieldGoalReturnTD,
        PlayResult.InterceptionReturnTD_Opponent, PlayResult.FumbleReturnTD_Opponent, PlayResult.OpponentScored, PlayResult.KickoffReturnTD_Opponent,
        PlayResult.PATGood, PlayResult.PATFailed, PlayResult.Pass1ptConversionGood, PlayResult.Pass1ptConversionFailed, PlayResult.Run1ptConversionGood, PlayResult.Run1ptConversionFailed,
        PlayResult.FieldGoalGood, PlayResult.FieldGoalFailed,
        PlayResult.OffensiveSafety, PlayResult.DefensiveSafety,
        // All turnovers stop the clock
        PlayResult.InterceptionThrown, PlayResult.FumbleLost, PlayResult.Interception, PlayResult.FumbleRecovery,
        PlayResult.TurnoverOnDowns, PlayResult.PuntBlocked, PlayResult.FieldGoalBlocked,
        PlayResult.OnsideKickLost, PlayResult.MuffedPuntLost,
        // Special teams events that stop clock
        PlayResult.Punt,
        PlayResult.PuntFairCatch,
        PlayResult.PuntTouchback,
        PlayResult.KickoffTouchback,
        PlayResult.KickoffOutOfBounds,
        // Penalties
        PlayResult.PenaltyAccepted, PlayResult.PenaltyDeclined, PlayResult.PenaltyOffsetting,
        // Specific plays
        PlayResult.KneelDown,
    ];
    return !clockStoppingResults.includes(playResult);
};

type TeamStats = {
    firstDowns: number;
    totalYards: number;
    passingYards: number;
    rushingYards: number;
    turnovers: number;
    penalties: number;
    penaltyYards: number;
    timeOfPossession: number;
    thirdDownAttempts: number;
    thirdDownConversions: number;
    fourthDownAttempts: number;
    fourthDownConversions: number;
    patAttempts: number;
    patConversions: number;
};

type ImportedRosterPlayer = {
    jerseyNumber: number;
    name: string;
    position: string;
    status: PlayerStatus;
};

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

export const useGameState = (): GameStateContextType => {
    const context = useContext(GameStateContext);
    if (context === undefined) {
        throw new Error('useGameState must be used within a GameStateProvider');
    }
    return context;
};

const sortPlays = (a: Play, b: Play) => {
    if (a.quarter !== b.quarter) {
        return (a.quarter || 0) - (b.quarter || 0);
    }
    const timeA = parseGameTime(a.gameTime);
    const timeB = parseGameTime(b.gameTime);
    if (timeA !== timeB) {
        return timeB - timeA;
    }
    return (a.timestamp || 0) - (b.timestamp || 0); // Tie-breaker
};

export const GameStateProvider: React.FC<{ children: ReactNode; user: any; initialShowWalkthrough: boolean }> = ({ children, user, initialShowWalkthrough }) => {
    const [teamName, setTeamName] = useState('My Team');
    const [teamCity, setTeamCity] = useState('');
    const [coachName, setCoachName] = useState('');
    const [ageDivision, setAgeDivision] = useState<AgeDivision | null>(null);
    const [seasonWeeks, setSeasonWeeks] = useState<string[]>([]);
    const [opponentNames, setOpponentNames] = useState<Record<string, string>>({});
    const [opponentCities, setOpponentCities] = useState<Record<string, string>>({});
    const [homeAwayStatus, setHomeAwayStatus] = useState<Record<string, 'Home' | 'Away'>>({});
    const [weekDates, setWeekDates] = useState<Record<string, string>>({});
    const [weekResults, setWeekResults] = useState<Record<string, any>>({});
    const [selectedWeek, setSelectedWeek] = useState<string>('');

    const [players, setPlayers] = useState<Player[]>([]);
    const [playHistory, setPlayHistory] = useState<Play[]>([]);
    const [undoStack, setUndoStack] = useState<Play[][]>([]);
    const [redoStack, setRedoStack] = useState<Play[][]>([]);
    const [currentLineups, setCurrentLineups] = useState<Record<string, (string | null)[]>>({});
    
    // Combined (default + user) formations for UI display
    const [offenseFormations, setOffenseFormations] = useState<FormationCollection>(DEFAULT_OFFENSE_FORMATIONS);
    const [defenseFormations, setDefenseFormations] = useState<FormationCollection>(DEFAULT_DEFENSE_FORMATIONS);
    const [specialTeamsFormations, setSpecialTeamsFormations] = useState<FormationCollection>(DEFAULT_SPECIAL_TEAMS_FORMATIONS);

    // User-only formations for persistence
    const [userOffenseFormations, setUserOffenseFormations] = useState<FormationCollection>({});
    const [userDefenseFormations, setUserDefenseFormations] = useState<FormationCollection>({});
    const [userSpecialTeamsFormations, setUserSpecialTeamsFormations] = useState<FormationCollection>({});

    const [depthChart, setDepthChart] = useState<Record<string, string[]>>({});
    const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
    const [playbookTab, setPlaybookTab] = useState<SelectablePlayType>(PlayType.Offense);
    const [selectedFormationName, setSelectedFormationName] = useState('');
    const [animationClass, setAnimationClass] = useState('animate-fade-in');
    const activeTabIndexRef = useRef(tabOrder.indexOf('overview'));
    const [isCoinTossModalOpen, setIsCoinTossModalOpen] = useState(false);
    const [isFourthDownModalOpen, setIsFourthDownModalOpen] = useState(false);
    const [showWalkthrough, setShowWalkthrough] = useState(false);

    const handleCompleteWalkthrough = useCallback(async () => {
        setShowWalkthrough(false);
        if (user?.uid) {
            await markWalkthroughCompleted(user.uid);
        }
    }, [user]);
    const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [isQuarterSummaryModalOpen, setIsQuarterSummaryModalOpen] = useState(false);
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
    const [quarterSummaryData, setQuarterSummaryData] = useState<QuarterSummaryData | null>(null);
    const [quarterPlaysForSummary, setQuarterPlaysForSummary] = useState<Play[]>([]);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [initialImportTab, setInitialImportTab] = useState<'season' | 'playbook'>('season');
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
    const [isAddPlayerModalOpen, setIsAddPlayerModalOpen] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
    const [editingPlayIndex, setEditingPlayIndex] = useState<number | null>(null);
    const [editingFormation, setEditingFormation] = useState<{ playType: PlayType; name?: string; isCreating: boolean } | null>(null);
    const [editingEventWeek, setEditingEventWeek] = useState<string | null>(null);
    const [isPlayDetailsModalOpen, setIsPlayDetailsModalOpen] = useState(false);
    const tempPlayData = useRef<{ playType: PlayType; playerIds: Set<string>; formationName: string; lineup: (string | null)[]; formationPositions: FormationPosition[] } | null>(null);
    const [theme, setTheme] = useState<Theme>('dark');
    const [customTheme, setCustomTheme] = useState<CustomTheme>(DEFAULT_CUSTOM_THEME);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [isWeekLoading, setIsWeekLoading] = useState(true);
    const [fieldLogoUrl, setFieldLogoUrl] = useState(DEFAULT_FIELD_LOGO);
    const [isWeekSelectorModalOpen, setIsWeekSelectorModalOpen] = useState(false);
    const [navBarPosition, setNavBarPosition] = useState<NavBarPosition>('bottom');
    const [ourScore, setOurScore] = useState(0);
    const [opponentScore, setOpponentScore] = useState(0);
    const [currentQuarter, setCurrentQuarter] = useState(1);
    const [gameTime, setGameTime] = useState(10 * 60);
    const [isClockRunning, setIsClockRunning] = useState(false);
    const [homeTimeouts, setHomeTimeouts] = useState(3);
    const [awayTimeouts, setAwayTimeouts] = useState(3);
    const [possession, setPossession] = useState<'home' | 'away' | null>(null);
    const [coinToss, setCoinToss] = useState<{ winner: 'us' | 'them'; choice: 'receive' | 'defer' } | undefined>();
    const isInitialLoadRef = useRef(true);
    const [insertionIndex, setInsertionIndex] = useState<number | null>(null);
    const [scrollToPlayIndex, setScrollToPlayIndex] = useState<number | null>(null);
    const [syncState, setSyncState] = useState<SyncState>('idle');
    const saveTimeoutRef = useRef<number | null>(null);
    const [dbError, setDbError] = useState<string | null>(null);
    const syncStateRef = useRef(syncState);
        const [aiSummary, setAiSummary] = useState<AiSummary | null>(null);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);
    const [isCheckingForUpdate, setIsCheckingForUpdate] = useState(false);
    const [isResettingFormations, setIsResettingFormations] = useState(false);
    const [customIconSheet, setCustomIconSheet] = useState<string | null>(null);
    const [defaultIconSheet, setDefaultIconSheet] = useState<string>('');
    
    useEffect(() => {
        fetch('/assets/icons.svg').then(res => res.text()).then(setDefaultIconSheet);
    }, []);

    useEffect(() => {
        const MIGRATION_KEY = 'v1_clear_player_positions';
        const migrationRun = localStorage.getItem(MIGRATION_KEY);

        if (!migrationRun && user?.uid && seasonWeeks.length > 0) {
            console.log('Running one-time migration to clear player positions.');
            const clearPositions = async () => {
                const batch = db.batch();
                let writesNeeded = false;
                for (const weekId of seasonWeeks) {
                    const weekDocRef = db.collection('users').doc(user.uid).collection('weeks').doc(weekId);
                    try {
                        const doc = await weekDocRef.get();
                        if (doc.exists) {
                            const players = doc.data().players as Player[];
                            if (players && players.some(p => p.position)) {
                                writesNeeded = true;
                                const updatedPlayers = players.map(p => (Object.assign({}, p, { position: '' })));
                                batch.update(weekDocRef, { players: updatedPlayers });
                            }
                        }
                    } catch (e) {
                        console.error(`Could not read week ${weekId} for migration`, e);
                    }
                }
                if (writesNeeded) {
                    await batch.commit();
                    console.log('Migration complete: Player positions cleared in DB.');
                } else {
                    console.log('Migration check complete: No player positions needed clearing.');
                }
                localStorage.setItem(MIGRATION_KEY, 'true');
            };
            
            clearPositions().catch(err => {
                console.error("Player position migration failed:", err);
            });
        }
    }, [user, seasonWeeks]);

    useEffect(() => {
        syncStateRef.current = syncState;
    }, [syncState]);

    const recalculateAllScores = useCallback((history: Play[]): Play[] => {
        let lastOurScore = 0;
        let lastOpponentScore = 0;
        
        // The history is assumed to be chronologically sorted before this function is called.
        return history.map(play => {
            const { ourScoreAdjustment, opponentScoreAdjustment } = calculateScoreAdjustments(play.playResult as PlayResult);
            const newOurScore = lastOurScore + ourScoreAdjustment;
            const newOpponentScore = lastOpponentScore + opponentScoreAdjustment;
            
            lastOurScore = newOurScore;
            lastOpponentScore = newOpponentScore;
    
            // Return a new object to ensure state updates are triggered
            return {
                ...play,
                ourScore: newOurScore,
                opponentScore: newOpponentScore,
            };
        });
    }, []);

    const homeStatus = homeAwayStatus[selectedWeek] || 'Home';

    const getFormationsKey = (playType: PlayType): 'offense' | 'defense' | 'specialTeams' | null => {
        if (playType === PlayType.Offense) return 'offense';
        if (playType === PlayType.Defense) return 'defense';
        if (playType === PlayType.SpecialTeams) return 'specialTeams';
        return null;
    };

    const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ message, type });
    }, []);

    // Load and save user settings (including global formations)
    useEffect(() => {
        if (!user?.uid) return;
        const unsubscribe = listenToUserSettings(user.uid, (settings) => {
            setTheme(settings.theme || 'dark');
            setNavBarPosition(settings.navBarPosition || 'bottom');
            setFieldLogoUrl(settings.fieldLogoUrl || DEFAULT_FIELD_LOGO);
            setTeamName(settings.teamName || 'My Team');
            setTeamCity(settings.teamCity || '');
            setCoachName(settings.coachName || '');
            setAgeDivision(settings.ageDivision || null);
            setCustomTheme(settings.customTheme || DEFAULT_CUSTOM_THEME);
            setCustomIconSheet(settings.customIconSheet || null);

            const userFormations = settings.formations || {};
            const userOffense = userFormations.offense || {};
            const userDefense = userFormations.defense || {};
            const userSpecial = userFormations.specialTeams || {};

            setUserOffenseFormations(userOffense);
            setUserDefenseFormations(userDefense);
            setUserSpecialTeamsFormations(userSpecial);
            
            const mergeAndFilter = (defaults: FormationCollection, customs: FormationCollection | { [key: string]: Formation | null }) => {
                const merged = Object.assign({}, defaults, customs);
                const final: FormationCollection = {};
                for (const key in merged) {
                    if (Object.prototype.hasOwnProperty.call(merged, key) && merged[key] !== null) {
                        final[key] = merged[key] as Formation;
                    }
                }
                return final;
            };
            
            setOffenseFormations(mergeAndFilter(DEFAULT_OFFENSE_FORMATIONS, userOffense));
            setDefenseFormations(mergeAndFilter(DEFAULT_DEFENSE_FORMATIONS, userDefense));
            setSpecialTeamsFormations(mergeAndFilter(DEFAULT_SPECIAL_TEAMS_FORMATIONS, userSpecial));

            if (settings.schedule) {
                const scheduleWeeksRaw = settings.schedule.weeks || [];
                const weekDatesData = settings.schedule.dates || {};
                
                // Sort weeks by date to ensure chronological order
                const sortedWeeks = [...scheduleWeeksRaw].sort((a, b) => {
                    const dateA = new Date(weekDatesData[a] || 0).getTime();
                    const dateB = new Date(weekDatesData[b] || 0).getTime();
                    return dateA - dateB;
                });
                
                setSeasonWeeks(sortedWeeks);
                setOpponentNames(settings.schedule.opponents || {});
                setOpponentCities(settings.schedule.cities || {});
                setHomeAwayStatus(settings.schedule.homeAway || {});
                setWeekDates(weekDatesData);
                setWeekResults(settings.schedule.results || {});

                if (selectedWeek === '' && sortedWeeks.length > 0) {
                   const today = new Date();
                   today.setHours(0, 0, 0, 0);
                   const upcomingGame = sortedWeeks.find((week: string) => {
                       const gameDateStr = weekDatesData?.[week];
                       if (!gameDateStr) return false;
                       const gameDate = new Date(gameDateStr + 'T00:00:00');
                       return gameDate >= today;
                   });
                   
                   if (upcomingGame) {
                       setSelectedWeek(upcomingGame);
                   } else {
                       setSelectedWeek(sortedWeeks[sortedWeeks.length - 1]);
                   }
                } else if (sortedWeeks.length === 0) {
                    setSelectedWeek('');
                }
            } else {
                setSeasonWeeks(WEEKS);
                setOpponentNames(WEEKLY_OPPONENTS);
                setOpponentCities({});
                setHomeAwayStatus(WEEKLY_HOME_AWAY);
                setWeekDates(WEEK_DATES);
                setWeekResults(WEEKLY_RESULTS);
                if (selectedWeek === '') {
                    setSelectedWeek('WK1');
                }
            }
        });
        return () => unsubscribe();
    }, [user, selectedWeek]);

    const handleThemeChange = async (newTheme: Theme) => {
        setSyncState('syncing');
        setTheme(newTheme);
        try {
            await saveUserSettingsToFirebase(user.uid, { theme: newTheme });
            setSyncState('synced');
            showToast(`Theme updated to ${newTheme}.`, 'info');
        } catch (error) {
            setSyncState('offline');
            showToast('Failed to save theme.', 'error');
        }
    };
    
    useEffect(() => {
        document.documentElement.removeAttribute('style');

        if (theme === 'custom' && customTheme) {
            document.documentElement.setAttribute('data-theme', 'dark'); // Base for fallbacks
            
            document.documentElement.style.setProperty('--bg-primary', customTheme.bgPrimary);
            document.documentElement.style.setProperty('--bg-secondary', customTheme.bgSecondary);
            document.documentElement.style.setProperty('--text-primary', customTheme.textPrimary);
            document.documentElement.style.setProperty('--text-secondary', customTheme.textSecondary);
            document.documentElement.style.setProperty('--border-primary', customTheme.borderPrimary);
            document.documentElement.style.setProperty('--accent-primary', customTheme.accentPrimary);
            document.documentElement.style.setProperty('--accent-secondary', customTheme.accentSecondary);
            document.documentElement.style.setProperty('--accent-defense', customTheme.accentDefense);
            document.documentElement.style.setProperty('--accent-special', customTheme.accentSpecial);
            
            // Derived colors
            document.documentElement.style.setProperty('--accent-button-primary', customTheme.accentPrimary);
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
    }, [theme, customTheme]);
    
    const handleCustomThemeChange = async (newCustomTheme: CustomTheme) => {
        setSyncState('syncing');
        setCustomTheme(newCustomTheme);
        try {
            await saveUserSettingsToFirebase(user.uid, { customTheme: newCustomTheme });
            setSyncState('synced');
            showToast('Custom theme saved.', 'success');
        } catch (error) {
            setSyncState('offline');
            showToast('Failed to save custom theme.', 'error');
        }
    };
    
    const handleNavBarPositionChange = async (position: NavBarPosition) => {
        setSyncState('syncing');
        setNavBarPosition(position);
        try {
            await saveUserSettingsToFirebase(user.uid, { navBarPosition: position });
            setSyncState('synced');
            showToast(`Navigation bar moved to ${position}.`, 'info');
        } catch (error) {
            setSyncState('offline');
            showToast('Failed to save nav position.', 'error');
        }
    };

    const handleSaveFieldLogo = async (newUrl: string) => {
        setSyncState('syncing');
        const urlToSave = newUrl || '';
        setFieldLogoUrl(urlToSave || DEFAULT_FIELD_LOGO);
        try {
            await saveUserSettingsToFirebase(user.uid, { fieldLogoUrl: urlToSave });
            setSyncState('synced');
            showToast('Field logo updated.', 'success');
        } catch (error) {
            setSyncState('offline');
            showToast('Failed to save logo.', 'error');
        }
    };

    const handleSaveCustomIconSheet = async (svgString: string) => {
        setSyncState('syncing');
        const sheetToSave = svgString.trim() === defaultIconSheet.trim() ? null : svgString;
        // Optimistically update local state
        setCustomIconSheet(sheetToSave);
        try {
            await saveUserSettingsToFirebase(user.uid, { customIconSheet: sheetToSave });
            setSyncState('synced');
            showToast('Custom icon set saved successfully.', 'success');
        } catch (error) {
            setSyncState('offline');
            showToast('Failed to save custom icon set.', 'error');
            // Revert on error if needed, though listener might handle it
        }
    };

    const handleTeamInfoChange = async (newName: string, newCity: string, newCoachName: string) => {
        const trimmedName = newName.trim();
        const trimmedCity = newCity.trim();
        const trimmedCoachName = newCoachName.trim();
        if (!trimmedName) {
            showToast('Team name cannot be empty.', 'error');
            return;
        }
        setSyncState('syncing');
        setTeamName(trimmedName);
        setTeamCity(trimmedCity);
        setCoachName(trimmedCoachName);
        try {
            await saveUserSettingsToFirebase(user.uid, { teamName: trimmedName, teamCity: trimmedCity, coachName: trimmedCoachName });
            setSyncState('synced');
            showToast('Team info updated.', 'success');
        } catch (error) {
            setSyncState('offline');
            showToast('Failed to save team info.', 'error');
        }
    };

    const handleAgeDivisionChange = async (division: AgeDivision) => {
        setSyncState('syncing');
        setAgeDivision(division);
        try {
            await saveUserSettingsToFirebase(user.uid, { ageDivision: division });
            setSyncState('synced');
            showToast(`Age division updated to ${division}.`, 'info');
        } catch (error) {
            setSyncState('offline');
            showToast('Failed to save age division.', 'error');
        }
    };

    const mainPaddingClass = useMemo(() => {
        const isVertical = navBarPosition === 'left' || navBarPosition === 'right';
        if (isVertical) {
            return `${navBarPosition === 'left' ? 'md:pl-24' : 'md:pr-24'} pb-28 md:pb-0`;
        }
        return `${navBarPosition === 'top' ? 'pt-28' : 'pb-28'}`;
    }, [navBarPosition]);


    const resetToDefault = useCallback((week: string) => {
        setPlayers([]);
        setPlayHistory([]);
        setUndoStack([]);
        setRedoStack([]);
        setCurrentLineups({});
        setOurScore(0);
        setOpponentScore(0);
        setCurrentQuarter(1);
        setGameTime(10 * 60);
        setIsClockRunning(false);
        setHomeTimeouts(3);
        setAwayTimeouts(3);
        setPossession(null);
        setCoinToss(undefined);
        setDepthChart({});
    }, []);

    const calculatePossessionAfterPlay = useCallback((play: Play): 'home' | 'away' | null => {
        const currentHomeStatus = homeAwayStatus[selectedWeek] || 'Home';
        const ourTeam = currentHomeStatus === 'Home' ? 'home' : 'away';
        const opponentTeam = currentHomeStatus === 'Home' ? 'away' : 'home';
        
        // Determine who had possession DURING the play
        let possessionDuringPlay: 'home' | 'away';
        if (play.type === PlayType.Defense) {
            possessionDuringPlay = opponentTeam;
        } else if (play.type === PlayType.Offense) {
            possessionDuringPlay = ourTeam;
        } else {
            // Special Teams - who is kicking?
            // If we are receiving or blocking, the opponent has the ball.
            const isOpponentKicking = [
                PlayResult.KickReturn, PlayResult.KickReturnOutOfBounds, PlayResult.KickReturnTD,
                PlayResult.PuntReturn, PlayResult.PuntReturnOutOfBounds, PlayResult.PuntReturnTD,
                PlayResult.PuntFairCatch, PlayResult.MuffedPuntLost,
                PlayResult.OpponentPAT1ptGood, PlayResult.OpponentPAT2ptGood, PlayResult.OpponentPATFailed,
                PlayResult.OpponentScored, PlayResult.OpponentTouchdownRun, PlayResult.OpponentTouchdownPass,
                PlayResult.PAT_2pt_Return_Opponent, PlayResult.KickoffReturnTD_Opponent,
                PlayResult.InterceptionReturnTD_Opponent, PlayResult.FumbleReturnTD_Opponent
            ].includes(play.playResult as PlayResult);
            
            possessionDuringPlay = isOpponentKicking ? opponentTeam : ourTeam;
        }

        switch (play.playResult) {
            // === RETAIN POSSESSION (Scoring team keeps ball for PAT/Kickoff) ===
            case PlayResult.PassTouchdown:
            case PlayResult.RunTouchdown:
            case PlayResult.InterceptionReturnTD:
            case PlayResult.FumbleReturnTD:
            case PlayResult.KickReturnTD:
            case PlayResult.PuntReturnTD:
            case PlayResult.BlockedPuntReturnTD:
            case PlayResult.BlockedFieldGoalReturnTD:
            case PlayResult.OffensiveFumbleRecoveryTD:
            case PlayResult.PATGood:
            case PlayResult.PATFailed:
            case PlayResult.FieldGoalGood:
            case PlayResult.PAT_2pt_KickGood:
            case PlayResult.PAT_2pt_KickFailed:
            case PlayResult.PAT_1pt_ConversionGood:
            case PlayResult.PAT_1pt_ConversionFailed:
            case PlayResult.PAT_1pt_Safety_Offense:
            case PlayResult.Pass1ptConversionGood:
            case PlayResult.Pass1ptConversionFailed:
            case PlayResult.Run1ptConversionGood:
            case PlayResult.Run1ptConversionFailed:
            case PlayResult.TwoPointConversion_Pass_Good:
            case PlayResult.TwoPointConversion_Pass_Failed:
            case PlayResult.TwoPointConversion_Run_Good:
            case PlayResult.TwoPointConversion_Run_Failed:
                return ourTeam;

            case PlayResult.OpponentTouchdownRun:
            case PlayResult.OpponentTouchdownPass:
            case PlayResult.OpponentScored:
            case PlayResult.InterceptionReturnTD_Opponent:
            case PlayResult.FumbleReturnTD_Opponent:
            case PlayResult.KickoffReturnTD_Opponent:
            case PlayResult.OpponentPAT1ptGood:
            case PlayResult.OpponentPAT2ptGood:
            case PlayResult.OpponentPATFailed:
            case PlayResult.PAT_2pt_Return_Opponent:
                return opponentTeam;

            // === CHANGE POSSESSION (After Kickoff/Punt or Turnover) ===
            case PlayResult.KickoffTackle:
            case PlayResult.KickoffTouchback:
            case PlayResult.KickoffOutOfBounds:
            case PlayResult.Punt:
            case PlayResult.PuntTouchback:
            case PlayResult.PuntBlocked:
            case PlayResult.FieldGoalBlocked:
            case PlayResult.FieldGoalFailed:
            case PlayResult.InterceptionThrown:
            case PlayResult.FumbleLost:
            case PlayResult.TurnoverOnDowns:
            case PlayResult.MuffedPuntLost:
            case PlayResult.OnsideKickLost:
            case PlayResult.OffensiveSafety:
                return opponentTeam;

            case PlayResult.KickReturn:
            case PlayResult.KickReturnOutOfBounds:
            case PlayResult.PuntReturn:
            case PlayResult.PuntReturnOutOfBounds:
            case PlayResult.PuntFairCatch:
            case PlayResult.Interception:
            case PlayResult.FumbleRecovery:
            case PlayResult.BlockedKickRecovery:
            case PlayResult.OnsideKickRecovered:
            case PlayResult.DefensiveSafety:
                return ourTeam;

            default:
                return possessionDuringPlay;
        }
    }, [homeAwayStatus, selectedWeek]);
    
    const updatePlaybookTabAfterStateChange = useCallback((newPlayHistory: Play[], newPossession: 'home' | 'away' | null) => {
        if (newPlayHistory.length === 0) {
            setPlaybookTab(PlayType.Offense);
            return;
        }
    
        const currentHomeStatus = homeAwayStatus[selectedWeek] || 'Home';
        const ourTeam = currentHomeStatus === 'Home' ? 'home' : 'away';

        const lastPlay = newPlayHistory[newPlayHistory.length - 1];
        const result = lastPlay.playResult;
        const playType = lastPlay.type;
    
        // --- Scenario-based transitions ---
    
        // SCENARIO: We just kicked off (Kickoff Tackle, Touchback, Out of Bounds)
        if (playType === PlayType.SpecialTeams && (
            result === PlayResult.KickoffTackle || 
            result === PlayResult.KickoffTouchback || 
            result === PlayResult.KickoffOutOfBounds || 
            result === PlayResult.OnsideKickLost
        )) {
            setPlaybookTab(PlayType.Defense);
            const baseDefense = Object.keys(defenseFormations).find(name => name.includes('4-3') || name.includes('3-4'));
            if (baseDefense) {
                setSelectedFormationName(baseDefense);
            } else if (Object.keys(defenseFormations).length > 0) {
                setSelectedFormationName(Object.keys(defenseFormations)[0]);
            }
            showToast('Kickoff complete. Switching to Defense.', 'info');
            return;
        }

        // SCENARIO: Opponent scored a TD, we need to defend the PAT.
        const isOpponentTD = (
            result === PlayResult.OpponentTouchdownRun || 
            result === PlayResult.OpponentTouchdownPass || 
            result === PlayResult.OpponentScored ||
            result === PlayResult.InterceptionReturnTD_Opponent ||
            result === PlayResult.FumbleReturnTD_Opponent ||
            result === PlayResult.KickoffReturnTD_Opponent
        );
        if (isOpponentTD) {
            setPlaybookTab(PlayType.SpecialTeams);
            const fgBlockFormation = Object.keys(specialTeamsFormations).find(name => name.toLowerCase().includes('block') || name.toLowerCase().includes('defensive p.a.t'));
            if (fgBlockFormation) {
                setSelectedFormationName(fgBlockFormation);
            }
            showToast('Opponent TD. Switching to PAT/Field Goal Block.', 'info');
            return;
        }
    
        // SCENARIO: We just scored a TD (Offense/Defense/ST), now we kick the PAT.
        const isOurTD = (
            result === PlayResult.RunTouchdown || 
            result === PlayResult.PassTouchdown || 
            result === PlayResult.InterceptionReturnTD ||
            result === PlayResult.FumbleReturnTD ||
            result === PlayResult.KickReturnTD ||
            result === PlayResult.PuntReturnTD ||
            result === PlayResult.BlockedPuntReturnTD ||
            result === PlayResult.BlockedFieldGoalReturnTD ||
            result === PlayResult.OffensiveFumbleRecoveryTD
        );
        if (isOurTD) {
            setPlaybookTab(PlayType.SpecialTeams);
            const patFormation = Object.keys(specialTeamsFormations).find(name => name.toLowerCase().includes('p.a.t') || name.toLowerCase().includes('field goal'));
            if (patFormation) {
                setSelectedFormationName(patFormation);
            }
            showToast('Touchdown! Switching to Special Teams for the PAT.', 'success');
            return;
        }
    
        // SCENARIO: We just attempted a PAT/FG/Conv, now we kick off.
        const isOurKickingPlay = (playType === PlayType.SpecialTeams || playType === PlayType.Offense) && (
            result?.includes('PAT') || result?.includes('Field Goal') || result?.includes('Conv.') || result === PlayResult.OffensiveSafety
        );
        if (isOurKickingPlay) {
            setPlaybookTab(PlayType.SpecialTeams);
            const kickoffFormation = Object.keys(specialTeamsFormations).find(name => name.toLowerCase().includes('kickoff') && !name.toLowerCase().includes('return'));
            if (kickoffFormation) {
                setSelectedFormationName(kickoffFormation);
            }
            showToast('Kick is away! Switching to Special Teams for the kickoff.', 'info');
            return;
        }

        // SCENARIO: Opponent just kicked a PAT/FG/Conv, now we receive kickoff.
        const isOpponentKickingPlay = (playType === PlayType.Defense || playType === PlayType.SpecialTeams) && (
            result?.includes('Opponent PAT') || result?.includes('Opponent Scored') || result?.includes('Return TD (Opponent)') || result === PlayResult.DefensiveSafety
        );
        if (isOpponentKickingPlay) {
            setPlaybookTab(PlayType.SpecialTeams);
            const kickoffReturnFormation = Object.keys(specialTeamsFormations).find(name => name.toLowerCase().includes('kickoff return'));
            if (kickoffReturnFormation) {
                setSelectedFormationName(kickoffReturnFormation);
            }
            showToast('Opponent kick is away! Switching to Special Teams for the kickoff return.', 'info');
            return;
        }

        // SCENARIO: We just recorded a Special Teams play (like kickoff or punt).
        if (playType === PlayType.SpecialTeams) {
            const isScoringOrKickoffTrigger = result?.includes('PAT') || result?.includes('Field Goal') || result?.includes('Conv.') || result?.includes('Safety');
            
            if (!isScoringOrKickoffTrigger) {
                if (newPossession === ourTeam) {
                    setPlaybookTab(PlayType.Offense);
                    showToast('Special Teams play complete. Switching to Offense.', 'info');
                } else {
                    setPlaybookTab(PlayType.Defense);
                    const baseDefense = Object.keys(defenseFormations).find(name => name.includes('4-3') || name.includes('3-4'));
                    if (baseDefense) {
                        setSelectedFormationName(baseDefense);
                    } else if (Object.keys(defenseFormations).length > 0) {
                        setSelectedFormationName(Object.keys(defenseFormations)[0]);
                    }
                    showToast('Special Teams play complete. Switching to Defense.', 'info');
                }
                return;
            }
        }
    
        // --- Fallback to possession-based transitions for turnovers, punts, etc. ---
    
        if (!newPossession) {
            // If possession is unclear (e.g., offsetting penalties), don't change the tab.
            return;
        }
        
        const possessionBeforeLastPlay = newPlayHistory.length > 1
            ? calculatePossessionAfterPlay(newPlayHistory[newPlayHistory.length - 2])
            : (ourTeam === 'home' ? 'away' : 'home'); // Assume opponent has it before first play
    
        if (newPossession !== possessionBeforeLastPlay) {
            if (newPossession === ourTeam) {
                setPlaybookTab(PlayType.Offense);
                showToast('Possession gained! Switching to Offense.', 'info');
            } else {
                setPlaybookTab(PlayType.Defense);
                showToast('Turnover! Switching to Defense.', 'info');
            }
        }
    
    }, [homeAwayStatus, selectedWeek, showToast, calculatePossessionAfterPlay, defenseFormations, specialTeamsFormations]);

    useEffect(() => {
        if (!user?.uid) return;

        if (!selectedWeek) {
            if (seasonWeeks.length === 0) {
                resetToDefault('');
                setIsWeekLoading(false);
                setSyncState('idle');
            }
            return;
        }
    
        isInitialLoadRef.current = true;
        setIsWeekLoading(true);
        setSyncState('syncing');
    
        const unsubscribe = listenToGameState(user.uid, selectedWeek, ({ data, error }) => {
            setAiSummary(null); // Clear AI summary on any data change
            if (syncStateRef.current === 'syncing' && !isInitialLoadRef.current) {
                return;
            }

            if (error && error.code === 'not-found') {
                setDbError(`**Firestore Database Not Found!**...`);
                setIsWeekLoading(false);
                setSyncState('offline');
                return;
            }

            if (error) { showToast(`Syncing issue: ${error.message}`, 'error'); }
            setDbError(null);
    
            if (!data && !error) {
                showToast(`Error loading data for ${selectedWeek}.`, 'error');
                setIsWeekLoading(false);
                setSyncState('offline');
                return;
            }
    
            const isFullGameState = data && 'playHistory' in data;
            const sanitizePlayers = (playerList: Player[] | undefined) => (playerList || []).map(p => ({ ...p, imageUrl: p.imageUrl || DEFAULT_PLAYER_IMAGE }));

            if (isFullGameState) {
                const savedState = data as StoredGameState;
                setPlayers(sanitizePlayers(savedState.players));
                const historyWithSets = (savedState.playHistory || []).map((p: SerializablePlay) => ({ ...p, playerIds: new Set(p.playerIds) }));
                historyWithSets.sort(sortPlays);
                const recalculatedHistory = recalculateAllScores(historyWithSets);
                setPlayHistory(recalculatedHistory);
                
                // Set score from the single source of truth: the play history.
                const lastPlay = recalculatedHistory.length > 0 ? recalculatedHistory[recalculatedHistory.length - 1] : null;
                if (lastPlay) {
                    setOurScore(lastPlay.ourScore || 0);
                    setOpponentScore(lastPlay.opponentScore || 0);
                } else {
                    // No plays, so score must be what's in the main doc (could be a manual override)
                    setOurScore(savedState.ourScore || 0);
                    setOpponentScore(savedState.opponentScore || 0);
                }

                setCurrentLineups(savedState.currentLineups || {});
                setDepthChart(savedState.depthChart || {});
                if (savedState.opponentName) { setOpponentNames(prev => ({ ...prev, [selectedWeek]: savedState.opponentName! })); }
                setCurrentQuarter(savedState.currentQuarter || 1);
                setGameTime(savedState.gameTime || 600);
                setIsClockRunning(savedState.isClockRunning || false);
                setHomeTimeouts(savedState.homeTimeouts ?? 3);
                setAwayTimeouts(savedState.awayTimeouts ?? 3);
                setPossession(savedState.possession || null);
                setCoinToss(savedState.coinToss);
            } else if (data) {
                const weekData = data as StoredGameState; // Cast to access potential score properties
                setPlayers(sanitizePlayers(weekData.players));
                setPlayHistory([]);
                setCurrentLineups({});
                setDepthChart(weekData.depthChart || {});
                
                // Respect score from main document if it exists, even with no plays
                setOurScore(weekData.ourScore || 0);
                setOpponentScore(weekData.opponentScore || 0);

                setCurrentQuarter(1);
                setGameTime(600);
                setIsClockRunning(false);
                setHomeTimeouts(3);
                setAwayTimeouts(3);
                setPossession(null);
                setCoinToss(undefined);
            } else {
                resetToDefault(selectedWeek);
            }
    
            if (isInitialLoadRef.current) {
                setIsWeekLoading(false);
                setSyncState('synced');
                setTimeout(() => { isInitialLoadRef.current = false; }, 500);
            } else {
                setSyncState('synced');
            }
        });
    
        return () => unsubscribe();
    }, [user, selectedWeek, seasonWeeks.length, resetToDefault, showToast, recalculateAllScores]);

    // Debounced save of metadata to Firestore
    useEffect(() => {
        if (isInitialLoadRef.current || isWeekLoading || !user?.uid || !selectedWeek) return;
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        setSyncState('syncing');
        saveTimeoutRef.current = window.setTimeout(async () => {
            try {
                const gameState = {
                    players: players,
                    currentLineups,
                    opponentName: opponentNames[selectedWeek],
                    ourScore,
                    opponentScore,
                    currentQuarter,
                    gameTime,
                    isClockRunning,
                    homeTimeouts,
                    awayTimeouts,
                    possession,
                    depthChart,
                    coinToss,
                };
                
                await saveGameStateToFirebase(user.uid, selectedWeek, gameState);
                setSyncState('synced');
            } catch (error) {
                console.error("Firebase save error:", error);
                setSyncState('offline');
                showToast("Failed to save changes. Check connection.", 'error');
            }
        }, 1500);

        return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
    }, [players, currentLineups, opponentNames, selectedWeek, ourScore, opponentScore, currentQuarter, gameTime, isClockRunning, homeTimeouts, awayTimeouts, possession, coinToss, depthChart, isWeekLoading, showToast, user]);
    
    const handleWeekChange = useCallback((week: string) => {
        // If the user selects a new week from the calendar, check if the game has started.
        // If not, prompt for the coin toss. This is the only place this modal should be triggered automatically.
        if (week !== selectedWeek && user?.uid) {
            // First, check if a result for this week already exists. If so, game is finished.
            if (weekResults[week]) {
                // Do nothing, game is over.
            } else {
                // Game is not finished, now check if it has started.
                const weekDocRef = db.collection('users').doc(user.uid).collection('weeks').doc(week);
                
                // We need to check two things: the coinToss field on the main doc, and if the 'plays' subcollection is empty.
                Promise.all([
                    weekDocRef.get(),
                    weekDocRef.collection('plays').limit(1).get()
                ]).then(([weekDoc, playsSnapshot]) => {
                    const weekData = weekDoc.data() || {};
                    const hasPlays = !playsSnapshot.empty;
                    const gameHasStarted = hasPlays || !!weekData.coinToss;

                    if (!gameHasStarted) {
                        setIsCoinTossModalOpen(true);
                    }
                }).catch(error => {
                    console.error("Error checking if game has started:", error);
                    // Fail gracefully, don't show the modal.
                });
            }
        }
        
        // Always set the selected week to trigger data loading.
        setSelectedWeek(week);
    }, [selectedWeek, user, weekResults, setIsCoinTossModalOpen]);

    const handleResetWeek = useCallback(async () => {
        if (window.confirm('Are you sure you want to reset all game data for this week? This clears the play log, scores, and resets all player stats for this week only. Your roster and formations will not be deleted.')) {
            setSyncState('syncing');
            try {
                const resetPlayers = players.map(player => Object.assign({}, player, { offensePlayCount: 0, defensePlayCount: 0, specialTeamsPlayCount: 0, timeOnField: 0 }));
                const resetState = {
                    players: resetPlayers,
                    currentLineups: {},
                    ourScore: 0,
                    opponentScore: 0,
                    currentQuarter: 1,
                    gameTime: 600,
                    isClockRunning: false,
                    homeTimeouts: 3,
                    awayTimeouts: 3,
                    possession: null,
                    depthChart: firestore.FieldValue.delete(),
                    coinToss: firestore.FieldValue.delete(),
                };
                await saveGameStateToFirebase(user.uid, selectedWeek, resetState);
                await resetPlaysForWeek(user.uid, selectedWeek);

                setSyncState('synced');
                showToast(`Game data for ${selectedWeek} has been reset.`, 'info');
            } catch (err) {
                console.error("Reset week error:", err);
                setSyncState('offline');
                showToast("Failed to reset week.", 'error');
            }
        }
    }, [selectedWeek, showToast, user, players]);

    const handleFourthDownDecision = useCallback((decision: 'go' | 'punt' | 'fg') => {
        setIsFourthDownModalOpen(false);
        if (decision === 'go') {
            setPlaybookTab(PlayType.Offense);
        } else if (decision === 'punt') {
            setPlaybookTab(PlayType.SpecialTeams);
            const puntFormation = Object.keys(specialTeamsFormations).find(name => name.toLowerCase().includes('punt'));
            if (puntFormation) {
                setSelectedFormationName(puntFormation);
            }
        } else if (decision === 'fg') {
            setPlaybookTab(PlayType.SpecialTeams);
            const fgFormation = Object.keys(specialTeamsFormations).find(name => name.toLowerCase().includes('field goal'));
            if (fgFormation) {
                setSelectedFormationName(fgFormation);
            }
        }
    }, [specialTeamsFormations]);

    const handleStartGameFromCoinToss = useCallback(async (winner: 'us' | 'them', choice: 'receive' | 'defer') => {
        const toss = { winner, choice };
        setCoinToss(toss);
        setIsCoinTossModalOpen(false);
        
        const currentHomeStatus = homeAwayStatus[selectedWeek] || 'Home';
        const ourTeam = currentHomeStatus === 'Home' ? 'home' : 'away';
        const opponentTeam = currentHomeStatus === 'Home' ? 'away' : 'home';

        let initialPossession: 'home' | 'away' | null = null;
        if (winner === 'us') {
            initialPossession = choice === 'receive' ? ourTeam : opponentTeam;
        } else {
            initialPossession = choice === 'receive' ? opponentTeam : ourTeam;
        }
        
        setPossession(initialPossession);
        
        // Prepare initial formation
        setPlaybookTab(PlayType.SpecialTeams);
        const formationName = initialPossession === ourTeam 
            ? Object.keys(specialTeamsFormations).find(name => name.toLowerCase().includes('kickoff return'))
            : Object.keys(specialTeamsFormations).find(name => name.toLowerCase().includes('kickoff'));
        
        if (formationName) setSelectedFormationName(formationName);

        try {
            await saveGameStateToFirebase(user.uid, selectedWeek, {
                coinToss: toss,
                possession: initialPossession
            });
            showToast('Game started!', 'success');
        } catch (error) {
            console.error("Error starting game:", error);
            showToast('Failed to start game in database.', 'error');
        }
    }, [user, homeAwayStatus, selectedWeek, specialTeamsFormations, showToast]);
    
    const allDrives = useMemo(() => calculateDrives(playHistory), [playHistory]);
    const gameSummaryData = useMemo((): QuarterSummaryData | null => {
        if (playHistory.length === 0) return null;

        const formationStats: Record<string, FormationStats> = {};
        const allFormations = Object.assign({}, offenseFormations, defenseFormations, specialTeamsFormations);
        for (const name in allFormations) { // <-- Here we are iterating keys
            formationStats[name] = { playCount: 0, totalYards: 0, positivePlays: 0, negativePlays: 0, zeroYdPlays: 0, pointsScored: 0, attempts: 0, makes: 0 };
        }
        const topPerformers: QuarterSummaryData['topPerformers'] = { passers: {}, receivers: {}, runners: {}, tacklers: {}, interceptors: {}, kickers: {}, returners: {} };
    
        for (const play of playHistory) {
            if (formationStats[play.formationName]) {
                const stats = formationStats[play.formationName];
                stats.playCount++;
                const yards = play.yardsGained ?? 0;
                stats.totalYards += yards;
                
                const result = play.playResult;
                const isKickingFormation = play.formationName.toLowerCase().includes('pat') || play.formationName.toLowerCase().includes('p.a.t') || play.formationName.toLowerCase().includes('field goal');

                if (isKickingFormation) {
                    const successfulKicks = [PlayResult.PATGood, PlayResult.FieldGoalGood, PlayResult.PAT_1pt_ConversionGood, PlayResult.PAT_2pt_KickGood, PlayResult.Pass1ptConversionGood, PlayResult.Run1ptConversionGood];
                    const failedKicks = [PlayResult.PATFailed, PlayResult.FieldGoalFailed, PlayResult.PAT_1pt_ConversionFailed, PlayResult.PAT_2pt_KickFailed, PlayResult.Pass1ptConversionFailed, PlayResult.Run1ptConversionFailed];
                    const isKickingPlay = successfulKicks.includes(result as PlayResult) || failedKicks.includes(result as PlayResult);

                    if (isKickingPlay) {
                        stats.attempts = (stats.attempts || 0) + 1;
                        if (successfulKicks.includes(result as PlayResult)) {
                            stats.makes = (stats.makes || 0) + 1;
                            stats.pointsScored = (stats.pointsScored || 0) + calculateScoreAdjustments(result as PlayResult).ourScoreAdjustment;
                            stats.positivePlays++;
                        } else {
                            stats.negativePlays++;
                        }
                    } else { // It's a kicking formation, but not a kick play (e.g. penalty)
                        if (yards > 0) stats.positivePlays++;
                        else if (yards < 0) stats.negativePlays++;
                        else stats.zeroYdPlays++;
                    }
                } else { // Standard logic for non-kicking formations
                    if (yards > 0) stats.positivePlays++;
                    else if (yards < 0) stats.negativePlays++;
                    else stats.zeroYdPlays++;
                }
            }
           
            if (play.highlights) {
                const { passerId, receiverId, runnerId, tacklerId, interceptorId, kickerId, returnerId } = play.highlights;
                const yards = play.yardsGained ?? 0;
                const updatePerformer = (id: string | undefined, category: keyof typeof topPerformers, addYards: boolean) => {
                    if (!id) return;
                    const cat = topPerformers[category];
                    if (!cat[id]) cat[id] = { count: 0, yards: 0 };
                    cat[id].count++;
                    if (addYards) cat[id].yards += yards;
                };
                updatePerformer(passerId, 'passers', true);
                updatePerformer(receiverId, 'receivers', true);
                updatePerformer(runnerId, 'runners', true);
                updatePerformer(returnerId, 'returners', true);
                updatePerformer(tacklerId, 'tacklers', false);
                updatePerformer(interceptorId, 'interceptors', false);
                if (kickerId) {
                    const cat = topPerformers.kickers;
                    if (!cat[kickerId]) cat[kickerId] = { count: 0, yards: 0, attempts: 0, makes: 0 };
                    cat[kickerId].count++;
                    if (play.playResult === PlayResult.FieldGoalGood || play.playResult === PlayResult.FieldGoalFailed) {
                        cat[kickerId].attempts = (cat[kickerId].attempts || 0) + 1;
                        if (play.playResult === PlayResult.FieldGoalGood) cat[kickerId].makes = (cat[kickerId].makes || 0) + 1;
                    }
                }
            }
        }
        return { formationStats, topPerformers };
    }, [playHistory, offenseFormations, defenseFormations, specialTeamsFormations]);

    const { ourStats, opponentStats } = useMemo(() => {
        const ourTeamStats: TeamStats = { firstDowns: 0, totalYards: 0, passingYards: 0, rushingYards: 0, turnovers: 0, penalties: 0, penaltyYards: 0, timeOfPossession: 0, thirdDownAttempts: 0, thirdDownConversions: 0, fourthDownAttempts: 0, fourthDownConversions: 0, patAttempts: 0, patConversions: 0 };
        const oppTeamStats: TeamStats = { firstDowns: 0, totalYards: 0, passingYards: 0, rushingYards: 0, turnovers: 0, penalties: 0, penaltyYards: 0, timeOfPossession: 0, thirdDownAttempts: 0, thirdDownConversions: 0, fourthDownAttempts: 0, fourthDownConversions: 0, patAttempts: 0, patConversions: 0 };

        if (playHistory.length === 0) {
            return { ourStats: ourTeamStats, opponentStats: oppTeamStats };
        }

        allDrives.forEach(drive => {
            const driveIsOurs = drive.team !== PlayType.Defense;
            for (let i = 0; i < drive.plays.length; i++) {
                const { play } = drive.plays[i];
                const nextPlayInDrive = i + 1 < drive.plays.length ? drive.plays[i+1].play : null;
                const madeFirstDown = nextPlayInDrive?.down === 1 || play.isAutoFirstDown || (play.yardsGained || 0) >= 10;
                
                if(driveIsOurs) {
                    if (play.down === 3) {
                        ourTeamStats.thirdDownAttempts++;
                        if (madeFirstDown) ourTeamStats.thirdDownConversions++;
                    } else if (play.down === 4) {
                        ourTeamStats.fourthDownAttempts++;
                        if (madeFirstDown) ourTeamStats.fourthDownConversions++;
                    }
                } else {
                     if (play.down === 3) {
                        oppTeamStats.thirdDownAttempts++;
                        if (madeFirstDown) oppTeamStats.thirdDownConversions++;
                    } else if (play.down === 4) {
                        oppTeamStats.fourthDownAttempts++;
                        if (madeFirstDown) oppTeamStats.fourthDownConversions++;
                    }
                }
            }
        });

        playHistory.forEach((play, index) => {
            const yards = play.yardsGained ?? 0;
            
            if (play.type === 'Offense') {
                ourTeamStats.totalYards += yards;
                if (play.playResult?.toLowerCase().includes('pass')) ourTeamStats.passingYards += yards;
                if (play.playResult?.toLowerCase().includes('run')) ourTeamStats.rushingYards += yards;
                if (play.playResult === PlayResult.FumbleLost || play.playResult === PlayResult.InterceptionThrown) ourTeamStats.turnovers++;
                if(play.down === 1) ourTeamStats.firstDowns++;
            } else if (play.type === 'Defense') {
                oppTeamStats.totalYards += yards;
                const takeawayResults = [PlayResult.Interception, PlayResult.FumbleRecovery, PlayResult.BlockedKickRecovery, PlayResult.DefensiveSafety];
                if (takeawayResults.includes(play.playResult as PlayResult)) ourTeamStats.turnovers++; // Opponent turnover is our takeaway
                if (yards >= 10 || play.playResult?.includes('Opponent Scored') || play.playResult?.includes('Opponent Touchdown')) oppTeamStats.firstDowns++;
            }
            
            if (play.playResult === PlayResult.PenaltyAccepted) {
                if (play.penaltyOn === 'offense') { ourTeamStats.penalties++; ourTeamStats.penaltyYards += Math.abs(yards); } 
                else if (play.penaltyOn === 'defense') { oppTeamStats.penalties++; oppTeamStats.penaltyYards += Math.abs(yards); }
            }

            // Time of possession
            if(index < playHistory.length - 1) {
                const nextPlay = playHistory[index + 1];
                const time1 = parseGameTime(play.gameTime); const time2 = parseGameTime(nextPlay.gameTime);
                const q1 = play.quarter || 1; const q2 = nextPlay.quarter || 1;
                let duration = 0;
                if (q1 === q2) duration = time1 - time2;
                else if (q2 > q1) duration = time1 + ((q2 - q1 - 1) * 600) + (600 - time2);
                if(duration > 0 && duration < 900) {
                    if (play.type === 'Offense' || (play.type === 'SpecialTeams' && !play.playResult?.includes('Kickoff'))) ourTeamStats.timeOfPossession += duration;
                    else oppTeamStats.timeOfPossession += duration;
                }
            }

            // PAT Stats
            const result = play.playResult;
            const isOurPlay = play.type !== 'Defense';

            const ourPatSuccessResults = [
                PlayResult.PATGood, PlayResult.PAT_1pt_ConversionGood, PlayResult.PAT_2pt_KickGood,
                PlayResult.Pass1ptConversionGood, PlayResult.Run1ptConversionGood, PlayResult.PAT_1pt_Safety_Offense
            ];
            const ourPatFailResults = [
                PlayResult.PATFailed, PlayResult.PAT_1pt_ConversionFailed, PlayResult.PAT_2pt_KickFailed,
                PlayResult.Pass1ptConversionFailed, PlayResult.Run1ptConversionFailed, PlayResult.PAT_2pt_Return_Opponent
            ];
        
            const opponentPatSuccessResults = [
                PlayResult.OpponentPAT1ptGood, PlayResult.OpponentPAT2ptGood, PlayResult.OpponentPATGood_DEPRECATED
            ];
            const opponentPatFailResults = [
                PlayResult.OpponentPATFailed, PlayResult.PAT_2pt_Return_Defense
            ];

            if (isOurPlay) {
                if (ourPatSuccessResults.includes(result as PlayResult)) {
                    ourTeamStats.patAttempts++;
                    ourTeamStats.patConversions++;
                } else if (ourPatFailResults.includes(result as PlayResult)) {
                    ourTeamStats.patAttempts++;
                }
            } else { // It's a defensive play for us, so opponent is on offense
                if (opponentPatSuccessResults.includes(result as PlayResult)) {
                    oppTeamStats.patAttempts++;
                    oppTeamStats.patConversions++;
                } else if (opponentPatFailResults.includes(result as PlayResult)) {
                    oppTeamStats.patAttempts++;
                }
            }
        });

        return { ourStats: ourTeamStats, opponentStats: oppTeamStats };
    }, [playHistory, allDrives]);

    const seasonRecord = useMemo(() => {
        let wins = 0;
        let losses = 0;
        let ties = 0;

        if (!weekResults) {
            return { wins, losses, ties };
        }

        for (const week in weekResults) {
            const result = weekResults[week];
            if (result && typeof result.ourScore === 'number' && typeof result.opponentScore === 'number') {
                if (result.ourScore > result.opponentScore) {
                    wins++;
                } else if (result.ourScore < result.opponentScore) {
                    losses++;
                } else {
                    ties++;
                }
            }
        }
        return { wins, losses, ties };
    }, [weekResults]);

    const calculateQuarterSummary = useCallback((quarterPlays: Play[]): QuarterSummaryData => {
        const formationStats: Record<string, FormationStats> = {};
        const topPerformers: QuarterSummaryData['topPerformers'] = { passers: {}, receivers: {}, runners: {}, tacklers: {}, interceptors: {}, kickers: {}, returners: {} };
        for (const play of quarterPlays) {
            if (!formationStats[play.formationName]) formationStats[play.formationName] = { playCount: 0, totalYards: 0, positivePlays: 0, negativePlays: 0, zeroYdPlays: 0, pointsScored: 0, attempts: 0, makes: 0 };
            const stats = formationStats[play.formationName];
            stats.playCount++;
            const yards = play.yardsGained ?? 0;
            stats.totalYards += yards;

            const result = play.playResult;
            const isKickingFormation = play.formationName.toLowerCase().includes('pat') || play.formationName.toLowerCase().includes('p.a.t') || play.formationName.toLowerCase().includes('field goal');
    
            if (isKickingFormation) {
                const successfulKicks = [
                    PlayResult.PATGood, PlayResult.FieldGoalGood,
                    PlayResult.PAT_1pt_ConversionGood, PlayResult.PAT_2pt_KickGood,
                    PlayResult.Pass1ptConversionGood, PlayResult.Run1ptConversionGood
                ];
                const failedKicks = [
                    PlayResult.PATFailed, PlayResult.FieldGoalFailed,
                    PlayResult.PAT_1pt_ConversionFailed, PlayResult.PAT_2pt_KickFailed,
                    PlayResult.Pass1ptConversionFailed, PlayResult.Run1ptConversionFailed
                ];
                const isKickingPlay = successfulKicks.includes(result as PlayResult) || failedKicks.includes(result as PlayResult);
        
                if (isKickingPlay) {
                    stats.attempts = (stats.attempts || 0) + 1;
                    if (successfulKicks.includes(result as PlayResult)) {
                        stats.makes = (stats.makes || 0) + 1;
                        stats.pointsScored = (stats.pointsScored || 0) + calculateScoreAdjustments(result as PlayResult).ourScoreAdjustment;
                        stats.positivePlays++;
                    } else {
                        stats.negativePlays++;
                    }
                } else {
                    if (yards > 0) stats.positivePlays++;
                    else if (yards < 0) stats.negativePlays++;
                    else stats.zeroYdPlays++;
                }
            } else {
                if (yards > 0) stats.positivePlays++;
                else if (yards < 0) stats.negativePlays++;
                else stats.zeroYdPlays++;
            }

            if (play.highlights) {
                const { passerId, receiverId, runnerId, tacklerId, interceptorId, kickerId, returnerId } = play.highlights;
                const updatePerformer = (id: string | undefined, category: keyof typeof topPerformers, addYards: boolean) => {
                    if (!id) return;
                    const cat = topPerformers[category];
                    if (!cat[id]) cat[id] = { count: 0, yards: 0 };
                    cat[id].count++;
                    if (addYards) cat[id].yards += yards;
                };
                updatePerformer(passerId, 'passers', true);
                updatePerformer(receiverId, 'receivers', true);
                updatePerformer(runnerId, 'runners', true);
                updatePerformer(returnerId, 'returners', true);
                updatePerformer(tacklerId, 'tacklers', false);
                updatePerformer(interceptorId, 'interceptors', false);
                if (kickerId) {
                    const cat = topPerformers.kickers;
                    if (!cat[kickerId]) cat[kickerId] = { count: 0, yards: 0, attempts: 0, makes: 0 };
                    cat[kickerId].count++;
                    if (play.playResult === PlayResult.FieldGoalGood || play.playResult === PlayResult.FieldGoalFailed) {
                        cat[kickerId].attempts = (cat[kickerId].attempts || 0) + 1;
                        if (play.playResult === PlayResult.FieldGoalGood) cat[kickerId].makes = (cat[kickerId].makes || 0) + 1;
                    }
                }
            }
        }
        return { formationStats, topPerformers };
    }, []);

    const startNextQuarter = useCallback(async () => {
        if (currentQuarter < 4) {
            const nextQuarter = currentQuarter + 1;
            setCurrentQuarter(nextQuarter);
            setGameTime(10 * 60);
            setIsClockRunning(false);
            if (nextQuarter === 3) { setHomeTimeouts(3); setAwayTimeouts(3); }
        } else {
            const newWeekResults = {
                ...weekResults,
                [selectedWeek]: { ourScore, opponentScore }
            };
            const newSchedule = {
                weeks: seasonWeeks,
                opponents: opponentNames,
                homeAway: homeAwayStatus,
                dates: weekDates,
                results: newWeekResults,
            };
            setSyncState('syncing');
            try {
                await saveSchedule(user.uid, newSchedule);
                setSyncState('synced');
                showToast('Game result saved!', 'success');
                setIsReportsModalOpen(true);
            } catch (e) {
                setSyncState('offline');
                showToast('Could not save game result.', 'error');
            }
        }
        setIsQuarterSummaryModalOpen(false);
        setQuarterSummaryData(null);
        setQuarterPlaysForSummary([]);
    }, [currentQuarter, weekResults, selectedWeek, ourScore, opponentScore, seasonWeeks, opponentNames, homeAwayStatus, weekDates, user, showToast]);

    const handleQuarterEnd = useCallback((quarter: number) => {
        // Q1 & Q3: Show prompt only
        if (quarter === 1 || quarter === 3) {
            setQuarterPlaysForSummary([]);
            setQuarterSummaryData(null);
            setIsQuarterSummaryModalOpen(true);
            return;
        }
        
        // Q2: Halftime report
        if (quarter === 2) {
            const halftimePlays = playHistory.filter(p => p.quarter === 1 || p.quarter === 2);
            if (halftimePlays.length === 0) {
                startNextQuarter(); // Nothing to show, just advance
                return;
            }
            const summary = calculateQuarterSummary(halftimePlays);
            setQuarterPlaysForSummary(halftimePlays);
            setQuarterSummaryData(summary);
            setIsQuarterSummaryModalOpen(true);
            return;
        }

        // Q4: End of game report
        if (quarter === 4) {
            const gamePlays = playHistory; // All plays for the whole game
            if (gamePlays.length === 0) {
                startNextQuarter();
                return;
            }
            const summary = calculateQuarterSummary(gamePlays);
            setQuarterPlaysForSummary(gamePlays);
            setQuarterSummaryData(summary);
            setIsQuarterSummaryModalOpen(true);
            return;
        }
    }, [playHistory, calculateQuarterSummary, startNextQuarter]);

    const handleUndo = () => {
        if (undoStack.length > 0) {
            const lastPlayHistory = undoStack[undoStack.length - 1];
            // Find the play that was added. It's in the current history but not the previous one.
            const playToDelete = playHistory.find(p => !lastPlayHistory.some(lp => lp.timestamp === p.timestamp));
            if (playToDelete) {
                if (!selectedWeek) {
                    showToast('No week selected. Cannot delete play.', 'error');
                    return;
                }
                deletePlay(user.uid, selectedWeek, playToDelete); // Delete from DB
            }
            
            const newUndoStack = undoStack.slice(0, undoStack.length - 1);
            setRedoStack(prev => [...prev, playHistory]); // current history becomes the redo state
            setUndoStack(newUndoStack);

            showToast('Undo successful.', 'info');
        }
    };
    
    const handleRedo = () => {
        if (redoStack.length > 0) {
            const nextPlayHistory = redoStack[redoStack.length - 1];
            // Find the play that was undone. It's in the next history but not the current one.
            const playToAdd = nextPlayHistory.find(p => !playHistory.some(lp => lp.timestamp === p.timestamp));
             if (playToAdd) {
                if (!selectedWeek) {
                    showToast('No week selected. Cannot save play.', 'error');
                    return;
                }
                savePlay(user.uid, selectedWeek, playToAdd); // Re-add to DB
            }
            
            const newRedoStack = redoStack.slice(0, redoStack.length - 1);
            setUndoStack(prev => [...prev, playHistory]); // current history becomes undo state
            setRedoStack(newRedoStack);
            
            showToast('Redo successful.', 'info');
        }
    };

    const handleTabChange = useCallback((tab: ActiveTab) => {
        const currentIndex = activeTabIndexRef.current;
        const newIndex = tabOrder.indexOf(tab);
        if (newIndex > currentIndex) setAnimationClass('animate-slide-in-from-right');
        else if (newIndex < currentIndex) setAnimationClass('animate-slide-in-from-left');
        activeTabIndexRef.current = newIndex;
        setActiveTab(tab);
    }, []);

    const handleInitiateInsert = useCallback((index: number) => {
        setInsertionIndex(index);
        handleTabChange('game');
        showToast(`Inserting a play before Play #${index + 1}. Select a formation.`, 'info');
    }, [handleTabChange, showToast]);

    const handleCancelInsert = useCallback(() => {
        setInsertionIndex(null);
        showToast('Play insertion cancelled.', 'info');
    }, [showToast]);

    const handleToggleClock = useCallback(() => setIsClockRunning(prev => !prev), []);

    useEffect(() => {
        let timer: number | undefined;
        if (isClockRunning && gameTime > 0) {
            timer = window.setInterval(() => {
                setGameTime(gt => {
                    const newTime = gt - 1;
                    if (newTime > 0) {
                        return newTime;
                    }
                    
                    setIsClockRunning(false);
                    handleQuarterEnd(currentQuarter);
                    return 0;
                });
            }, 1000);
        }
        return () => window.clearInterval(timer);
    }, [isClockRunning, gameTime, handleQuarterEnd, currentQuarter]);
    
    const handleScoreChange = useCallback((newOurScore: number, newOpponentScore: number) => {
        setOurScore(newOurScore);
        setOpponentScore(newOpponentScore);
    }, []);

    const handleGameTimeChange = useCallback((newTimeInSeconds: number) => setGameTime(newTimeInSeconds), []);
    const handlePossessionChange = useCallback((team: 'home' | 'away') => setPossession(team), []);
    const playersWithStats = useMemo(() => {
        const statsMap: Record<string, { offense: number; defense: number; specialTeams: number; time: number }> = {};
        
        players.forEach(p => {
            statsMap[p.id] = { offense: 0, defense: 0, specialTeams: 0, time: 0 };
        });

        playHistory.forEach(play => {
            if (!play.playerIds) return;
            const duration = play.playDuration || 0;
            play.playerIds.forEach(id => {
                if (!statsMap[id]) statsMap[id] = { offense: 0, defense: 0, specialTeams: 0, time: 0 };
                
                if (play.type === PlayType.Offense) statsMap[id].offense++;
                else if (play.type === PlayType.Defense) statsMap[id].defense++;
                else if (play.type === PlayType.SpecialTeams) statsMap[id].specialTeams++;
                
                statsMap[id].time += duration;
            });
        });

        return players.map(p => ({
            ...p,
            offensePlayCount: statsMap[p.id]?.offense || 0,
            defensePlayCount: statsMap[p.id]?.defense || 0,
            specialTeamsPlayCount: statsMap[p.id]?.specialTeams || 0,
            timeOnField: statsMap[p.id]?.time || 0,
        }));
    }, [players, playHistory]);

    const lastPlay = playHistory.length > 0 ? playHistory[playHistory.length - 1] : undefined;
    
    const nextPlayState = useMemo(() => {
        const defaultState = { down: 1, startYardLine: 25, distance: 10 as (number | 'Goal'), isOurDrive: true };
        if (!lastPlay) return defaultState;
    
        const currentDrive = allDrives.find(drive => drive.plays.some(p => p.originalIndex === playHistory.length - 1));
        const lastPlayIsOurDrive = !currentDrive || currentDrive.team !== PlayType.Defense;
        
        const calculateEndSpot = (play: Play): number => {
            const gain = play.yardsGained ?? 0;
            const start = play.startYardLine ?? (lastPlay ? calculateEndSpot(lastPlay) : 0);
            const effectiveGain = (play.type !== PlayType.Defense) ? gain : -gain;
            return Math.max(0, Math.min(100, start + effectiveGain));
        };
    
        const lastEndSpot = calculateEndSpot(lastPlay);
        const lastResult = lastPlay.playResult;
    
        const ourTouchdowns = [PlayResult.PassTouchdown, PlayResult.RunTouchdown, PlayResult.InterceptionReturnTD, PlayResult.FumbleReturnTD, PlayResult.KickReturnTD, PlayResult.PuntReturnTD, PlayResult.BlockedPuntReturnTD, PlayResult.BlockedFieldGoalReturnTD];
        if (ourTouchdowns.includes(lastResult as PlayResult)) return { down: 1, startYardLine: 97, distance: 'Goal' as const, isOurDrive: true };
    
        const opponentTouchdowns = [PlayResult.OpponentTouchdownRun, PlayResult.OpponentTouchdownPass, PlayResult.OpponentScored, PlayResult.InterceptionReturnTD_Opponent, PlayResult.FumbleReturnTD_Opponent, PlayResult.KickoffReturnTD_Opponent];
        if (opponentTouchdowns.includes(lastResult as PlayResult)) return { down: 1, startYardLine: 3, distance: 'Goal' as const, isOurDrive: false };
    
        const ourKickoffNext = [PlayResult.PATGood, PlayResult.PATFailed, PlayResult.FieldGoalGood, PlayResult.PAT_2pt_KickGood, PlayResult.PAT_2pt_KickFailed, PlayResult.PAT_1pt_ConversionGood, PlayResult.PAT_1pt_ConversionFailed, PlayResult.PAT_1pt_Safety_Offense, PlayResult.PAT_2pt_Return_Defense, PlayResult.Pass1ptConversionGood, PlayResult.Run1ptConversionGood, PlayResult.Pass1ptConversionFailed, PlayResult.Run1ptConversionFailed];
        if (ourKickoffNext.includes(lastResult as PlayResult)) {
            return { down: 1, startYardLine: 40, distance: 10, isOurDrive: true };
        }
    
        const opponentKickoffNext = [PlayResult.DefensiveSafety, PlayResult.OpponentPAT1ptGood, PlayResult.OpponentPAT2ptGood, PlayResult.OpponentPATFailed, PlayResult.PAT_2pt_Return_Opponent];
        if (opponentKickoffNext.includes(lastResult as PlayResult)) return { down: 1, startYardLine: 0, distance: 10, isOurDrive: true };
    
        const turnoverAtSpot = [PlayResult.InterceptionThrown, PlayResult.FumbleLost, PlayResult.Punt, PlayResult.PuntBlocked, PlayResult.FieldGoalFailed, PlayResult.FieldGoalBlocked, PlayResult.MuffedPuntLost, PlayResult.OnsideKickLost, PlayResult.OffensiveSafety, PlayResult.PuntTouchback, PlayResult.KickoffTouchback];
        if (turnoverAtSpot.includes(lastResult as PlayResult)) {
            let startLine = 100 - lastEndSpot;
            if (lastResult === PlayResult.OffensiveSafety) startLine = 20;
            if (lastResult === PlayResult.PuntTouchback) startLine = 20;
            if (lastResult === PlayResult.KickoffTouchback) startLine = 25;
            return { down: 1, startYardLine: startLine, distance: 10, isOurDrive: false };
        }
    
        const takeawayAtSpot = [PlayResult.Interception, PlayResult.FumbleRecovery, PlayResult.BlockedKickRecovery, PlayResult.OnsideKickRecovered];
        if (takeawayAtSpot.includes(lastResult as PlayResult)) return { down: 1, startYardLine: lastEndSpot, distance: 10, isOurDrive: true };
    
        if (!currentDrive) return defaultState;
    
        const firstDownPlay = [...currentDrive.plays].reverse().find(p => p.play.down === 1)?.play || currentDrive.plays[0].play;
        const lineOfScrimmageForSetOfDowns = firstDownPlay.startYardLine ?? (lastPlayIsOurDrive ? 25 : 75);

        // Calculate yards gained since the first down of this series
        const firstDownIndexInDrive = currentDrive.plays.findIndex(p => p.play === firstDownPlay);
        const yardsGainedSinceFirstDown = currentDrive.plays
            .slice(firstDownIndexInDrive)
            .reduce((sum, p) => {
                const playYards = p.play.yardsGained ?? 0;
                // If it's a penalty, we should use the net yardage. 
                // In our system, yardsGained for a penalty play is the penalty yardage.
                return sum + playYards;
            }, 0);
        
        // If a first down was achieved, reset to 1st & 10.
        if (lastPlay.isAutoFirstDown || yardsGainedSinceFirstDown >= 10) {
            return { down: 1, startYardLine: lastEndSpot, distance: 10, isOurDrive: lastPlayIsOurDrive };
        }
        
        // If no first down, check for a turnover on downs.
        if (lastPlay.down === 4) {
            // It was 4th down and they didn't convert. It's a turnover.
            // The other team gets the ball at the current spot, flipped to their perspective.
            return { down: 1, startYardLine: 100 - lastEndSpot, distance: 10, isOurDrive: !lastPlayIsOurDrive };
        }
        
        // If not a first down and not a turnover on downs, calculate the next down.
        let nextDown = (lastPlay.down ?? 0) + 1;
        let nextDistance: number | 'Goal' = 10 - yardsGainedSinceFirstDown;

        if (lastPlay.isLossOfDown) {
            nextDown++;
            nextDistance += Math.abs(lastPlay.yardsGained ?? 0);
        }
        if (lastPlay.isRepeatDown) {
            nextDown = lastPlay.down ?? 1;
            nextDistance += Math.abs(lastPlay.yardsGained ?? 0);
        }

        const yardsToGoal = lastPlayIsOurDrive ? 100 - lastEndSpot : lastEndSpot;
        if (nextDistance >= yardsToGoal) {
            nextDistance = 'Goal';
        }

        return { down: nextDown, startYardLine: lastEndSpot, distance: nextDistance, isOurDrive: lastPlayIsOurDrive };
    }, [lastPlay, allDrives, playHistory.length]);

    const downAndDistance = useMemo(() => {
        if (playHistory.length === 0) return "1st & 10";
        if (nextPlayState.down > 4) return `Turnover on Downs`;
        return `${getOrdinal(nextPlayState.down)} & ${nextPlayState.distance}`;
    }, [nextPlayState, playHistory.length]);
    
    // ... all other functions ...
    const handleOpenReportsModal = () => setIsReportsModalOpen(true);
    
    const handleImportGame = (jsonString: string) => {
        try {
            const data = JSON.parse(jsonString);
            if(window.confirm('This will overwrite all current game data for this week. Are you sure?')) {
                // Basic validation
                if (data.playHistory && data.players && data.ourScore !== undefined) {
                const historyWithSets = (data.playHistory || []).map((p: any) => ({ ...p, playerIds: new Set(p.playerIds) }));
                    const recalculatedHistory = recalculateAllScores(historyWithSets);
                    const lastPlay = recalculatedHistory[recalculatedHistory.length - 1];

                    const loadedState = {
                        ...data,
                        playHistory: recalculatedHistory,
                        ourScore: lastPlay?.ourScore ?? 0,
                        opponentScore: lastPlay?.opponentScore ?? 0,
                    };
                    saveGameStateToFirebase(user.uid, selectedWeek, loadedState);
                    showToast('Game data imported successfully.', 'success');
                } else {
                    throw new Error("Invalid game data format.");
                }
            }
        } catch(e) {
            console.error("Import error:", e);
            showToast('Failed to import game data. Invalid file.', 'error');
        }
        setIsReportsModalOpen(false);
    };

    const handleClosePlayDetails = useCallback(() => {
        setIsPlayDetailsModalOpen(false);
        tempPlayData.current = null;
    }, []);

    const handleUpdatePlayer = useCallback(async (playerId: string, updates: Partial<Player>) => {
        setSyncState('syncing');
        const originalPlayers = players;
        setPlayers(currentPlayers => currentPlayers.map(p => p.id === playerId ? { ...p, ...updates } : p));
        try {
            await updatePlayerInAllWeeks(user.uid, seasonWeeks, playerId, updates);
            setSyncState('synced');
            showToast('Player updated successfully across all weeks.', 'success');
        } catch (error) {
            console.error("Error updating player:", error);
            setSyncState('offline');
            showToast('Failed to update player.', 'error');
            setPlayers(originalPlayers);
        }
    }, [user, seasonWeeks, showToast, players]);
    
    const handleDeletePlayer = useCallback(async (playerId: string) => {
        setSyncState('syncing');
        try {
            await deletePlayerFromAllWeeks(user.uid, seasonWeeks, playerId);
            setSyncState('synced');
            showToast('Player deleted from all weeks.', 'success');
        } catch (error) {
            console.error("Error deleting player: ", error);
            setSyncState('offline');
            showToast('Failed to delete player.', 'error');
        }
    }, [user, seasonWeeks, showToast]);

    const handleAddPlayer = async (player: { jerseyNumber: number; name: string; position: string; status: PlayerStatus; imageUrl?: string }) => {
        const newId = (players.length > 0 ? Math.max(...players.map(p => parseInt(p.id, 10))) : 0) + 1;
        const newPlayer: Player = {
            ...player,
            id: newId.toString(),
            offensePlayCount: 0,
            defensePlayCount: 0,
            specialTeamsPlayCount: 0,
            timeOnField: 0,
            imageUrl: player.imageUrl || DEFAULT_PLAYER_IMAGE,
        };
    
        // Store original players for potential rollback
        const originalPlayers = players;
    
        // Optimistic update
        setPlayers(prevPlayers => [...prevPlayers, newPlayer].sort((a, b) => a.jerseyNumber - b.jerseyNumber));
        setSyncState('syncing');
        
        try {
            await addPlayerToAllWeeks(user.uid, seasonWeeks, newPlayer);
            // The listener will eventually update state from Firestore, solidifying the change.
            setSyncState('synced');
            showToast('Player added to all weeks.', 'success');
        } catch (error) {
            console.error('Error adding player:', error);
            // Rollback on error
            setPlayers(originalPlayers);
            setSyncState('offline');
            showToast('Failed to add player. Reverting change.', 'error');
        }
    };
    
    const handleRosterImport = async (importedPlayers: ImportedRosterPlayer[]) => {
        setSyncState('syncing');
        const updatedPlayers = [...players];
        let updatedCount = 0;
        let addedCount = 0;
        for (const imp of importedPlayers) {
            const existingPlayerIndex = updatedPlayers.findIndex(p => p.name.toLowerCase() === imp.name.toLowerCase() || p.jerseyNumber === imp.jerseyNumber);
            if (existingPlayerIndex > -1) {
                const existingPlayer = updatedPlayers[existingPlayerIndex];
                updatedPlayers[existingPlayerIndex] = { ...existingPlayer, jerseyNumber: imp.jerseyNumber, position: imp.position, status: imp.status, imageUrl: existingPlayer.imageUrl || DEFAULT_PLAYER_IMAGE };
                updatedCount++;
            } else {
                const newId = (Math.max(0, ...updatedPlayers.map(p => parseInt(p.id))) || 0) + 1;
                const newPlayer: Player = { id: newId.toString(), jerseyNumber: imp.jerseyNumber, name: imp.name, position: imp.position, status: imp.status, offensePlayCount: 0, defensePlayCount: 0, specialTeamsPlayCount: 0, timeOnField: 0, imageUrl: DEFAULT_PLAYER_IMAGE };
                updatedPlayers.push(newPlayer);
                addedCount++;
            }
        }
        try {
            await updateRosterForAllWeeks(user.uid, seasonWeeks, updatedPlayers);
            setPlayers(updatedPlayers.sort((a,b) => a.jerseyNumber - b.jerseyNumber));
            setSyncState('synced');
            showToast(`Roster updated: ${addedCount} added, ${updatedCount} updated.`, 'success');
        } catch (error) {
            console.error("Error updating roster from import:", error);
            setSyncState('offline');
            showToast("Failed to update roster.", 'error');
        }
    };
    
    const handleLineupConfirm = useCallback((playType: PlayType, selectedPlayerIds: Set<string>, formationName: string, lineup: (string | null)[]) => {
        const formationData = getFormationsForType(playType, offenseFormations, defenseFormations, specialTeamsFormations)[formationName];
        if (!formationData) return;

        tempPlayData.current = {
            playType,
            playerIds: selectedPlayerIds,
            formationName,
            lineup,
            formationPositions: formationData.positions,
        };
        setIsPlayDetailsModalOpen(true);
    }, [offenseFormations, defenseFormations, specialTeamsFormations]);
    
    const handleUpdateLineup = useCallback((formationName: string, lineup: (string | null)[], playType: PlayType) => {
        setCurrentLineups(prev => ({ ...prev, [formationName]: lineup }));
    }, []);

    const handleResetLineupToDefault = useCallback((formationName: string) => {
        setCurrentLineups(prev => {
            const newCurrentLineups = { ...prev };
            delete newCurrentLineups[formationName];
            return newCurrentLineups;
        });
        showToast(`Default lineup for ${formationName} loaded.`, 'info');
    }, [showToast]);

    const handleSavePlayDetails = useCallback((details: Partial<Play>) => {
        if (!tempPlayData.current) return;
        const { playType, playerIds, formationName, lineup } = tempPlayData.current;

        let finalDetails = Object.assign({}, details);
        const startLine = finalDetails.startYardLine ?? 0;
        const yardsGained = finalDetails.yardsGained ?? 0;
        const currentResult = finalDetails.playResult;

        if (playType === PlayType.Offense) {
            if (startLine + yardsGained >= 100) {
                if (currentResult === PlayResult.Run || currentResult === PlayResult.RunOutOfBounds) finalDetails.playResult = PlayResult.RunTouchdown;
                else if (currentResult === PlayResult.PassCompleted || currentResult === PlayResult.PassCompletedOutOfBounds) finalDetails.playResult = PlayResult.PassTouchdown;
            }
        } else if (playType === PlayType.Defense) {
            if (startLine - yardsGained <= 0) {
                if (currentResult === PlayResult.DefenseTackle || currentResult === PlayResult.DefensePassDefended) finalDetails.playResult = PlayResult.OpponentScored;
            }
        }
        
        const basePlay = {
            type: playType, formationName, playerIds, lineup,
            timestamp: Date.now(), quarter: currentQuarter,
        };

        // Calculate current score before saving
        const currentScore = playHistory.reduce((acc, p) => {
            const adj = calculateScoreAdjustments(p.playResult as PlayResult);
            return {
                our: acc.our + adj.ourScoreAdjustment,
                opp: acc.opp + adj.opponentScoreAdjustment
            };
        }, { our: 0, opp: 0 });

        const playAdjustment = calculateScoreAdjustments(finalDetails.playResult as PlayResult);
        const newOurScore = currentScore.our + playAdjustment.ourScoreAdjustment;
        const newOpponentScore = currentScore.opp + playAdjustment.opponentScoreAdjustment;

        const newPlay: Play = Object.assign({}, basePlay, finalDetails, { 
            ourScore: newOurScore, 
            opponentScore: newOpponentScore,
            yardsGained: finalDetails.yardsGained ?? 0
        });

        // Update main game clock from play duration
        if (newPlay.playDuration && typeof newPlay.playDuration === 'number' && newPlay.playDuration > 0 && newPlay.gameTime) {
            const startTimeSeconds = parseGameTime(newPlay.gameTime);
            setGameTime(startTimeSeconds);
        }

        const wasOffensivePlay = newPlay.type === PlayType.Offense;
        const wasThirdDown = newPlay.down === 3;
        const wasFourthDown = newPlay.down === 4;
        const distanceNeeded = typeof nextPlayState.distance === 'number' ? nextPlayState.distance : (100 - (newPlay.startYardLine ?? 0));
        const gainedFirstDown = (newPlay.yardsGained ?? 0) >= distanceNeeded || newPlay.isAutoFirstDown;

        // Smart 4th Down Logic: If it's 4th down and they don't gain the first down, it's a turnover on downs.
        if (wasOffensivePlay && wasFourthDown && !gainedFirstDown) {
            const isScoringOrTurnover = [
                PlayResult.RunTouchdown, PlayResult.PassTouchdown, 
                PlayResult.InterceptionThrown, PlayResult.FumbleLost,
                PlayResult.Punt, PlayResult.FieldGoalGood, PlayResult.FieldGoalFailed,
                PlayResult.FieldGoalBlocked, PlayResult.PuntBlocked, PlayResult.OffensiveSafety
            ].includes(newPlay.playResult as PlayResult);
            
            if (!isScoringOrTurnover) {
                newPlay.playResult = PlayResult.TurnoverOnDowns;
            }
        }

        const newPossession = calculatePossessionAfterPlay(newPlay);
        const currentHomeStatus = homeAwayStatus[selectedWeek] || 'Home';
        const ourTeam = currentHomeStatus === 'Home' ? 'home' : 'away';
        const possessionWasLostOnPlay = newPossession !== ourTeam;
        
        // Smart Possession Notification
        if (possession !== null && newPossession !== possession) {
            const homeTeamName = currentHomeStatus === 'Home' ? teamName : (opponentNames[selectedWeek] || 'Opponent');
            const awayTeamName = currentHomeStatus === 'Away' ? teamName : (opponentNames[selectedWeek] || 'Opponent');
            const newTeamName = newPossession === 'home' ? homeTeamName : awayTeamName;
            showToast(`Possession changed to ${newTeamName}`, 'info');
        }

        const shouldShowFourthDownModal = wasThirdDown && wasOffensivePlay && !gainedFirstDown && !possessionWasLostOnPlay;

        setUndoStack(prev => [...prev, playHistory]);
        setRedoStack([]);

        if (!selectedWeek) {
            showToast('No week selected. Cannot save play.', 'error');
            return;
        }

        savePlay(user.uid, selectedWeek, newPlay).catch(err => {
            showToast('Failed to save play. Data may be out of sync.', 'error');
        });
        
        const tempNewHistory = [...playHistory.slice(0, insertionIndex ?? playHistory.length), newPlay, ...playHistory.slice(insertionIndex ?? playHistory.length)].sort(sortPlays);

        setPossession(newPossession);
        updatePlaybookTabAfterStateChange(tempNewHistory, newPossession);

        const shouldClockRun = shouldClockRunAfterPlay(newPlay.playResult as PlayResult);
        setIsClockRunning(shouldClockRun);

        if (shouldShowFourthDownModal) {
            setIsFourthDownModalOpen(true);
        }

        if (insertionIndex !== null) {
            setInsertionIndex(null);
            // We can't know the final index after resorting, so we'll just scroll to the end
            // which is the most likely place. A better solution would involve finding the play post-sort.
            setScrollToPlayIndex(tempNewHistory.length - 1);
        }
        
        handleClosePlayDetails();
    }, [playHistory, insertionIndex, currentQuarter, calculatePossessionAfterPlay, updatePlaybookTabAfterStateChange, homeStatus, handleClosePlayDetails, nextPlayState, selectedWeek, user, showToast]);

    const handleEditPlay = (index: number) => setEditingPlayIndex(index);
    const handleSaveEditedPlay = (newPlayerIds: Set<string>, newLineup: (string | null)[], newFormationName: string, newDetails: Partial<Play>) => {
        if(editingPlayIndex === null) return;

        const originalPlay = playHistory[editingPlayIndex];
        const updatedPlay: Play = { ...originalPlay, playerIds: newPlayerIds, lineup: newLineup, formationName: newFormationName, ...newDetails };
        
        setUndoStack(prev => [...prev, playHistory]);
        setRedoStack([]);
        
        if (!selectedWeek) {
            showToast('No week selected. Cannot update play.', 'error');
            return;
        }
        savePlay(user.uid, selectedWeek, updatedPlay).catch(err => {
            showToast('Failed to update play.', 'error');
        });
        
        setEditingPlayIndex(null);
        showToast('Play updated. Scores will recalculate.', 'success');
    };
    const handleDeletePlay = (index: number) => {
        if (window.confirm('Are you sure you want to delete this play?')) {
            const playToDelete = playHistory[index];
            
            setUndoStack(prev => [...prev, playHistory]);
            setRedoStack([]);

            if (!selectedWeek) {
                showToast('No week selected. Cannot delete play.', 'error');
                return;
            }
            deletePlay(user.uid, selectedWeek, playToDelete).catch(err => {
                showToast('Failed to delete play.', 'error');
            });
            
            showToast('Play deleted.', 'success');
        }
    };
    const handleReorderPlay = (draggedIndex: number, targetIndex: number) => {
        showToast('Reordering plays is currently disabled to improve performance.', 'info');
    };

    const handleEditFormation = (playType: PlayType, formationName: string) => setEditingFormation({ playType, name: formationName, isCreating: false });
    const handleCreateFormation = (playType: PlayType) => setEditingFormation({ playType, isCreating: true });
    
    const handleSaveFormation = async (playType: PlayType, formationName: string, formation: Formation, originalName?: string) => {
        setSyncState('syncing');
        const key = getFormationsKey(playType);
        if (!key) {
            showToast('Invalid play type for saving formation.', 'error');
            setSyncState('idle');
            return;
        }
    
        const userFormations = {
            offense: userOffenseFormations,
            defense: userDefenseFormations,
            specialTeams: userSpecialTeamsFormations,
        };
    
        const currentUserFormationSet = { ...userFormations[key] };
    
        if (originalName && originalName !== formationName) {
            delete currentUserFormationSet[originalName];
        }
        currentUserFormationSet[formationName] = formation;
    
        const formationsToSave = {
            offense: key === 'offense' ? currentUserFormationSet : userOffenseFormations,
            defense: key === 'defense' ? currentUserFormationSet : userDefenseFormations,
            specialTeams: key === 'specialTeams' ? currentUserFormationSet : userSpecialTeamsFormations,
        };
        
        try {
            await saveUserSettingsToFirebase(user.uid, { formations: formationsToSave });
            setSyncState('synced');
            showToast(`Formation "${formationName}" saved.`, 'success');
            setEditingFormation(null);
        } catch(e) {
            setSyncState('offline');
            showToast('Error saving formation.', 'error');
        }
    };
    
    const handleDeleteFormation = async (playType: PlayType, formationName: string) => {
        setSyncState('syncing');
        const key = getFormationsKey(playType);
        if (!key) {
            showToast('Invalid play type for deleting formation.', 'error');
            setSyncState('idle');
            return;
        }

        const baseFormations = playType === PlayType.Offense ? DEFAULT_OFFENSE_FORMATIONS : playType === PlayType.Defense ? DEFAULT_DEFENSE_FORMATIONS : DEFAULT_SPECIAL_TEAMS_FORMATIONS;
        const isDefault = Object.prototype.hasOwnProperty.call(baseFormations, formationName);

        let updateValue;
        if (isDefault) {
            // "Hide" a default formation by setting a null tombstone.
            updateValue = null;
        } else {
            // Permanently delete a custom formation field.
            updateValue = firestore.FieldValue.delete();
        }

        const formationsToSave = {
            [key]: {
                [formationName]: updateValue
            }
        };

        try {
            // Use set with merge: true to apply the delta update to Firestore.
            await saveUserSettingsToFirebase(user.uid, { formations: formationsToSave });
            setSyncState('synced');
            showToast(`Formation "${formationName}" deleted.`, 'success');
            setEditingFormation(null);
        } catch(e) {
            setSyncState('offline');
            showToast('Error deleting formation.', 'error');
            console.error("Delete formation error:", e);
        }
    };

    const handleDuplicateFormation = useCallback((playType: PlayType, formationNameToCopy: string) => {
        const key = getFormationsKey(playType);
        if (!key) {
            showToast('Invalid play type.', 'error');
            return;
        }
        
        const allFormations = { offense: offenseFormations, defense: defenseFormations, specialTeams: specialTeamsFormations };
        const formationToCopy = allFormations[key][formationNameToCopy];

        if (!formationToCopy) {
            showToast(`Formation "${formationNameToCopy}" not found.`, 'error');
            return;
        }

        let newName = `${formationNameToCopy} (Copy)`;
        let counter = 2;
        while (allFormations[key][newName]) {
            newName = `${formationNameToCopy} (Copy ${counter})`;
            counter++;
        }
        
        const newFormation: Formation = deepCopy(formationToCopy);

        handleSaveFormation(playType, newName, newFormation);
    }, [offenseFormations, defenseFormations, specialTeamsFormations, handleSaveFormation, showToast]);
    
    const handleImport = async (rosterUpdates: ParsedRosterUpdate[], formationUpdates: ParsedFormation[], opponentUpdates: ParsedOpponentUpdate[]) => {
        setSyncState('syncing');
        try {
            const batch = db.batch();
            const playerMapByJersey: Map<number, Player> = new Map();
            let currentPlayers = players;
    
            // Process roster updates first to create an up-to-date player list for the current session.
            if (rosterUpdates.length > 0) {
                const updatedPlayerMap = new Map(players.map(p => [p.jerseyNumber, p]));
                for (const update of rosterUpdates) {
                    if (updatedPlayerMap.has(update.jerseyNumber)) {
                        const existingPlayer = updatedPlayerMap.get(update.jerseyNumber);
                        if (existingPlayer) {
                            const updatedPlayer = Object.assign({}, existingPlayer, { status: update.status }) as Player;
                            updatedPlayerMap.set(update.jerseyNumber, updatedPlayer);
                        }
                    }
                }
                currentPlayers = Array.from(updatedPlayerMap.values());
            }
            currentPlayers.forEach(p => playerMapByJersey.set(p.jerseyNumber, p));
    
            // Apply roster status updates to each week's document
            if (rosterUpdates.length > 0) {
                for (const week of seasonWeeks) {
                    const weekDocRef = db.collection('users').doc(user.uid).collection('weeks').doc(week);
                    const doc = await weekDocRef.get();
                    if (doc.exists) {
                        const weekPlayers = (doc.data().players as Player[]).map(p => {
                            const update = rosterUpdates.find(u => u.week === week && u.jerseyNumber === p.jerseyNumber);
                            return update ? { ...p, status: update.status } : p;
                        });
                        batch.update(weekDocRef, { players: weekPlayers });
                    }
                }
            }
    
            // Process formation updates using the up-to-date player map
            if (formationUpdates.length > 0) {
                const formationsToUpdate = {
                    offense: { ...userOffenseFormations },
                    defense: { ...userDefenseFormations },
                    specialTeams: { ...userSpecialTeamsFormations }
                };

                formationUpdates.forEach(update => {
                    const key = getFormationsKey(update.playType);
                    if (key) {
                        const formationData = { ...update.formation };
                        if (update.presetPlayerJerseys) {
                            formationData.presetPlayerIds = (update.presetPlayerJerseys || []).map(jersey => playerMapByJersey.get(jersey)?.id || null);
                        }
                        formationsToUpdate[key][update.formationName] = formationData;
                    }
                });
                batch.set(db.collection('users').doc(user.uid), { formations: formationsToUpdate }, { merge: true });
            }
    
            // Process opponent updates
            if (opponentUpdates.length > 0) {
                const scheduleUpdate = { ...opponentNames };
                opponentUpdates.forEach(update => {
                    scheduleUpdate[update.week] = update.opponentName;
                });
                batch.set(db.collection('users').doc(user.uid), { schedule: { opponents: scheduleUpdate } }, { merge: true });
            }
    
            await batch.commit();
            setSyncState('synced');
            setIsImportModalOpen(false);
            showToast('Import successful!', 'success');
        } catch(error) {
            setSyncState('offline');
            console.error("Import error: ", error);
            showToast('Import failed.', 'error');
        }
    };

    const handleExportJson = () => {
        const gameState = { players: players, playHistory, ourScore, opponentScore, currentQuarter, gameTime };
        const serializableState = JSON.stringify(Object.assign({}, gameState, { playHistory: (gameState.playHistory || []).map(p => Object.assign({}, p, { playerIds: Array.from(p.playerIds) })) }), null, 2);
        const blob = new Blob([serializableState], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `game-data-${selectedWeek}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setIsReportsModalOpen(false);
    };

    const handleTriggerImport = useCallback((initialTab: 'season' | 'playbook' = 'season') => {
        setInitialImportTab(initialTab);
        setIsImportModalOpen(true);
    }, []);
    
    const handleExportPdf = async () => {
        setIsExportingPdf(true);
        try {
            const { jsPDF } = (window as any).jspdf;
            const doc = new jsPDF();
    
            const opponentName = opponentNames[selectedWeek] || 'Opponent';
            const totalPlays = playHistory.length;
    
            // ---- PAGE 1: HEADER & PLAYER STATS ----
            doc.setFontSize(18);
            doc.text(`Game Report: ${teamName} vs ${opponentName}`, 14, 22);
            doc.setFontSize(12);
            doc.text(`Week: ${selectedWeek}`, 14, 30);
            doc.text(`Final Score: ${teamName} ${ourScore} - ${opponentName} ${opponentScore}`, 14, 36);
    
            doc.setFontSize(14);
            doc.text('Player Statistics', 14, 50);
            const playerTableHead = [['#', 'Name', 'Off', 'Def', 'ST', 'Total', 'Time', 'Part. %']];
            const playerTableBody = players
                .sort((a, b) => (b.offensePlayCount + b.defensePlayCount + b.specialTeamsPlayCount) - (a.offensePlayCount + a.defensePlayCount + a.specialTeamsPlayCount))
                .map(p => {
                    const total = p.offensePlayCount + p.defensePlayCount + p.specialTeamsPlayCount;
                    const participation = totalPlays > 0 ? Math.round((total / totalPlays) * 100) : 0;
                    return [p.jerseyNumber, p.name, p.offensePlayCount, p.defensePlayCount, p.specialTeamsPlayCount, total, formatTime(p.timeOnField), `${participation}%`];
                });
    
            doc.autoTable({ startY: 55, head: playerTableHead, body: playerTableBody, theme: 'grid' });
    
            // ---- PAGE 2: TEAM & FORMATION STATS ----
            doc.addPage();
            doc.setFontSize(14);
            doc.text('Team Comparison', 14, 20);
            const formatEfficiency = (c: number, a: number) => a === 0 ? '0/0 (0%)' : `${c}/${a} (${Math.round((c/a)*100)}%)`;
            const teamTableBody = [
                ['First Downs', ourStats.firstDowns, opponentStats.firstDowns],
                ['Total Yards', ourStats.totalYards, opponentStats.totalYards],
                ['3rd Down Eff.', formatEfficiency(ourStats.thirdDownConversions, ourStats.thirdDownAttempts), formatEfficiency(opponentStats.thirdDownConversions, opponentStats.thirdDownAttempts)],
                ['4th Down Eff.', formatEfficiency(ourStats.fourthDownConversions, ourStats.fourthDownAttempts), formatEfficiency(opponentStats.fourthDownConversions, opponentStats.fourthDownAttempts)],
                ['Turnovers', ourStats.turnovers, opponentStats.turnovers],
                ['Penalties / Yds', `${ourStats.penalties} / ${ourStats.penaltyYards}`, `${opponentStats.penalties} / ${opponentStats.penaltyYards}`],
                ['Time of Poss.', formatTime(ourStats.timeOfPossession), formatTime(opponentStats.timeOfPossession)],
            ];
            doc.autoTable({ startY: 25, head: [['Statistic', teamName, opponentName]], body: teamTableBody, theme: 'grid' });
            let lastY = doc.autoTable.previous.finalY;
    
            if (gameSummaryData && Object.keys(gameSummaryData.formationStats).length > 0) {
                doc.setFontSize(14);
                doc.text('Formation Efficiency', 14, lastY + 15);
                const formationTableBody = Object.entries(gameSummaryData.formationStats)
                    .sort(([, a], [, b]) => (b as FormationStats).playCount - (a as FormationStats).playCount)
                    .map(([name, stats]) => {
                        const typedStats = stats as FormationStats;
                        const successRate = typedStats.playCount > 0 ? `${Math.round((typedStats.positivePlays / typedStats.playCount) * 100)}%` : '0%';
                        return [name, typedStats.playCount, typedStats.totalYards, successRate];
                    });
                doc.autoTable({ startY: lastY + 20, head: [['Formation', 'Plays', 'Total Yds', 'Success Rate']], body: formationTableBody, theme: 'grid' });
            }
    
            // ---- PAGE 3+: ACTION LOG ----
            const allDrives = calculateDrives(playHistory);
            if (allDrives.length > 0) {
                doc.addPage();
                doc.setFontSize(14);
                doc.text('Action Log - Drives', 14, 20);
                let driveLastY = 25;
                allDrives.forEach(drive => {
                    const summaryText = `Drive #${drive.driveNumber}: ${drive.summary.playCount} plays, ${drive.summary.yards > 0 ? '+' : ''}${drive.summary.yards} yds, ${drive.summary.timeOfPossession} TOP - Result: ${drive.summary.result}`;
                    if (driveLastY > 270) { doc.addPage(); driveLastY = 20; }
                    doc.setFontSize(12);
                    doc.setFont(undefined, 'bold');
                    doc.text(summaryText, 14, driveLastY);
                    doc.setFont(undefined, 'normal');
                    driveLastY += 7;
    
                    const drivePlayBody = drive.plays.map(({ play, originalIndex }) => {
                        const los = play.startYardLine ? (play.startYardLine > 50 ? `OPP ${100 - play.startYardLine}` : `OWN ${play.startYardLine}`) : '-';
                        return [originalIndex + 1, play.down ? getOrdinal(play.down) : '-', los, play.playResult || '-', play.yardsGained ?? 0];
                    });
                    doc.autoTable({ startY: driveLastY, head: [['#', 'Down', 'LOS', 'Result', 'Yds']], body: drivePlayBody, theme: 'striped', headStyles: { fillColor: [100, 100, 100] }, didDrawPage: (data: any) => { driveLastY = data.cursor.y + 10; } });
                    driveLastY = doc.autoTable.previous.finalY + 10;
                });
            }
    
            // ---- FINAL PAGE: AI SUMMARY ----
            if (aiSummary) {
                doc.addPage();
                doc.setFontSize(18);
                doc.text('AI Tactical Breakdown', 14, 22);
                let currentY = 30;
                const addSection = (title: string, content: string) => {
                    if (currentY > 260) { doc.addPage(); currentY = 20; }
                    doc.setFontSize(14); doc.setFont(undefined, 'bold');
                    doc.text(title, 14, currentY); currentY += 7;
                    doc.setFontSize(10); doc.setFont(undefined, 'normal');
                    const textLines = doc.splitTextToSize(content.replace(/\*\*/g, '').replace(/(\d+\.)/g, '\n$1'), doc.internal.pageSize.getWidth() - 28);
                    doc.text(textLines, 14, currentY);
                    currentY += textLines.length * 4 + 5;
                };
    
                addSection('Game Breakdown', aiSummary.gameBreakdown);
                addSection('Things to Work On', aiSummary.thingsToWorkOn);
                addSection('Formation Analysis', aiSummary.formationAnalysis);
                addSection('Player Highlights', aiSummary.playerHighlights);
            }
    
            doc.save(`Game_Report_${teamName}_vs_${opponentName}_${selectedWeek}.pdf`);
            showToast('PDF report generated.', 'success');
        } catch (err) {
            console.error("PDF export error:", err);
            showToast('Failed to generate PDF report.', 'error');
        } finally {
            setIsExportingPdf(false);
            setIsReportsModalOpen(false);
        }
    };

    const getFormationsForEditModal = useCallback((playType: PlayType, currentFormations: FormationCollection): FormationCollection => {
        const baseFormations = playType === 'Offense' ? DEFAULT_OFFENSE_FORMATIONS : playType === 'Defense' ? DEFAULT_DEFENSE_FORMATIONS : DEFAULT_SPECIAL_TEAMS_FORMATIONS;
        return { ...baseFormations, ...currentFormations };
    }, []);

    const handleSetFormationAsDefault = async (playType: PlayType, formationName: string) => {
        if (!currentLineups[formationName]) {
            showToast("No lineup set for this formation.", 'error');
            return;
        }
        setSyncState('syncing');
        const key = getFormationsKey(playType);
        if (!key) {
            showToast('Invalid play type for setting default.', 'error');
            setSyncState('idle');
            return;
        }
        const formationsToUpdate = { offense: offenseFormations, defense: defenseFormations, specialTeams: specialTeamsFormations };
        const formationToUpdate = formationsToUpdate[key][formationName];
        if (!formationToUpdate) {
            showToast("Formation not found.", 'error');
            setSyncState('idle');
            return;
        }
        formationToUpdate.presetPlayerIds = currentLineups[formationName];
        try {
            await saveUserSettingsToFirebase(user.uid, { formations: formationsToUpdate });
            setSyncState('synced');
            showToast(`Lineup saved as default for "${formationName}".`, 'success');
        } catch(e) {
            setSyncState('offline');
            showToast('Error saving default lineup.', 'error');
        }
    };

    const handleUpdateDepthChart = useCallback((group: string, playerIds: string[]) => {
        setDepthChart(prev => {
            const newChart = Object.assign({}, prev);
            newChart[group] = playerIds;
            return newChart;
        });
    }, []);
    
    const handleSetPlayerAsStarter = useCallback((playerId: string) => {
        const player = players.find(p => p.id === playerId);
        if (!player || !player.position) {
            showToast('Player has no assigned positions.', 'error');
            return;
        }
    
        const playerPositions = player.position.split(',').map(p => p.trim().toUpperCase());
        const newDepthChart: Record<string, string[]> = deepCopy(depthChart);
    
        const allDisplayGroups: Record<string, string[]> = { ...OFFENSE_DISPLAY_GROUPS, ...DEFENSE_DISPLAY_GROUPS, ...ST_DISPLAY_GROUPS };
    
        const positionToGroupMap: { [key: string]: string } = {};
        for (const group in allDisplayGroups) {
            for (const pos of allDisplayGroups[group]) {
                positionToGroupMap[pos] = group;
            }
        }
    
        const relevantGroups = new Set<string>();
        playerPositions.forEach(pos => {
            const group = positionToGroupMap[pos];
            if (group) {
                relevantGroups.add(group);
            }
        });
    
        if (relevantGroups.size === 0) {
            showToast(`${getLastName(player.name)} is not in any depth chart groups.`, 'info');
            return;
        }
    
        relevantGroups.forEach(groupName => {
            let groupOrder = (newDepthChart[groupName] || []).slice();
            
            if (groupOrder.length === 0) {
                const positionsInGroup = allDisplayGroups[groupName];
                const availablePlayers = players.filter(p => p.position && p.position.split(',').map(x => x.trim().toUpperCase()).some(playerPos => positionsInGroup.includes(playerPos)));
                groupOrder = availablePlayers.map(p => p.id);
            }

            const currentIndex = groupOrder.indexOf(playerId);
            if (currentIndex > 0) {
                groupOrder.splice(currentIndex, 1);
                groupOrder.unshift(playerId);
            } else if (currentIndex === -1) {
                groupOrder.unshift(playerId);
            }
            
            newDepthChart[groupName] = groupOrder;
        });
    
        setDepthChart(newDepthChart);
        showToast(`${getLastName(player.name)} set as starter in relevant positions.`, 'success');
    }, [players, depthChart, showToast]);
    
    const handleAddNewEvent = useCallback(() => {
        const newWeekNum = seasonWeeks.length + 1;
        const newWeekId = `WK${newWeekNum}`;
        setEditingEventWeek(`NEW_${newWeekId}`);
        setIsAddEventModalOpen(true);
    }, [seasonWeeks]);

    const handleEditEvent = useCallback((week: string) => {
        setEditingEventWeek(week);
        setIsAddEventModalOpen(true);
    }, []);

    const handleSaveEvent = useCallback(async (data: { week: string, isNew: boolean, opponentName: string, opponentCity: string, homeAway: 'Home' | 'Away' | 'OPP', date: string }) => {
        setSyncState('syncing');
        const { week, isNew, opponentName, opponentCity, homeAway, date } = data;
    
        const newWeeksRaw = isNew ? seasonWeeks.concat([week]) : seasonWeeks.slice();
        const newDates = Object.assign({}, weekDates, { [week]: date });

        // Sort the weeks array based on the new dates object to ensure chronological order
        const sortedWeeks = newWeeksRaw.sort((a, b) => {
            const dateA = new Date(newDates[a] || 0).getTime();
            const dateB = new Date(newDates[b] || 0).getTime();
            return dateA - dateB;
        });

        const newSchedule = {
            weeks: sortedWeeks,
            opponents: Object.assign({}, opponentNames, { [week]: opponentName }),
            cities: Object.assign({}, opponentCities, { [week]: opponentCity }),
            homeAway: Object.assign({}, homeAwayStatus, { [week]: homeAway }),
            dates: newDates,
            results: Object.assign({}, weekResults, { [week]: weekResults[week] || null })
        };
    
        try {
            await saveSchedule(user.uid, newSchedule);
            if (isNew) {
                // When creating a new week document, initialize it with players but also other essential blank fields.
                const newWeekData = {
                    ...BLANK_WEEK_DATA,
                    players, 
                };
                await saveGameStateToFirebase(user.uid, week, newWeekData);
            }
            setSyncState('synced');
            showToast(`Event for ${week} saved successfully.`, 'success');
            setIsAddEventModalOpen(false);
            setEditingEventWeek(null);
        } catch (error) {
            console.error('Error saving event:', error);
            setSyncState('offline');
            showToast('Failed to save event.', 'error');
        }
    }, [user, seasonWeeks, opponentNames, opponentCities, homeAwayStatus, weekDates, weekResults, players, showToast]);

    const handleDeleteEvent = useCallback(async (week: string) => {
        if (window.confirm(`Are you sure you want to permanently delete the event for ${week}? This action cannot be undone.`)) {
            setSyncState('syncing');

            const newSchedule = {
                weeks: seasonWeeks.filter(w => w !== week),
                opponents: Object.assign({}, opponentNames),
                homeAway: Object.assign({}, homeAwayStatus),
                dates: Object.assign({}, weekDates),
                results: Object.assign({}, weekResults)
            };
            delete newSchedule.opponents[week];
            delete newSchedule.homeAway[week];
            delete newSchedule.dates[week];
            delete newSchedule.results[week];
            
            try {
                await saveSchedule(user.uid, newSchedule);
                // Also delete the week's data subcollection
                await db.collection('users').doc(user.uid).collection('weeks').doc(week).delete();

                setSyncState('synced');
                showToast(`Event for ${week} deleted.`, 'success');
                setIsAddEventModalOpen(false);
                setEditingEventWeek(null);
                
                // If the deleted week was the selected one, switch to another one
                if (selectedWeek === week) {
                    const newSelectedWeek = newSchedule.weeks.length > 0 ? newSchedule.weeks[0] : '';
                    setSelectedWeek(newSelectedWeek);
                }
            } catch (error) {
                console.error("Error deleting event:", error);
                setSyncState('offline');
                showToast('Failed to delete event.', 'error');
            }
        }
    }, [user, seasonWeeks, opponentNames, homeAwayStatus, weekDates, weekResults, selectedWeek, showToast]);

    const handleSignOut = useCallback(async () => {
        setIsSigningOut(true);
        try {
            await signOut();
            window.location.reload();
            // onAuthStateChanged in App.tsx will handle redirecting.
        } catch (error) {
            console.error("Sign out error:", error);
            showToast("Could not sign out. Please try again.", 'error');
            setIsSigningOut(false);
        }
    }, [showToast]);

    const handleClearCacheAndSignOut = useCallback(async () => {
        if (window.confirm('Are you sure you want to clear local cache and sign out? This will reload the application and require you to sign in again.')) {
            setIsSigningOut(true);
            try {
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (const registration of registrations) {
                        await registration.unregister();
                    }
                }
                const keys = await window.caches.keys();
                await Promise.all(keys.map(key => window.caches.delete(key)));
                await signOut();
                window.location.reload();
            } catch (error) {
                console.error("Error during cache clear and sign out:", error);
                showToast("An error occurred during cleanup.", 'error');
                setIsSigningOut(false);
            }
        }
    }, [showToast]);

    const handleCheckForUpdate = useCallback(async () => {
        if (!('serviceWorker' in navigator)) {
            showToast('Updates are not supported in this browser.', 'error');
            return;
        }

        setIsCheckingForUpdate(true);
        showToast('Checking for updates...', 'info');

        try {
            const registration = await navigator.serviceWorker.getRegistration();
            if (!registration) {
                showToast('Could not find app registration.', 'error');
                setIsCheckingForUpdate(false);
                return;
            }

            // This tells the browser to check the server for a new version of the sw.js file.
            await registration.update();

            // The update process happens in the background. If a new worker is found,
            // it will be in the `installing` state.
            if (registration.installing) {
                // There's a new version being installed. We can listen for it to be ready.
                registration.installing.onstatechange = () => {
                    if (registration.waiting) {
                        // A new worker is installed and waiting to take control.
                        if (window.confirm('A new version is available! Reload to update?')) {
                            // Send a message to the waiting service worker to activate immediately.
                            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                            // The page will reload once the new service worker has taken control.
                        }
                    }
                };
            } else if (registration.waiting) {
                 // A new worker is already installed and waiting.
                if (window.confirm('A new version is ready! Reload to update?')) {
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
            } else {
                // No new version was found on the server.
                showToast('Application is up to date.', 'success');
            }

            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!refreshing) {
                    window.location.reload();
                    refreshing = true;
                }
            });

        } catch (error) {
            console.error('Error during update check:', error);
            showToast('Error checking for updates.', 'error');
        } finally {
            // Let the user know the check is complete if no update was found.
            // The callbacks above handle the "update found" case.
            setTimeout(() => setIsCheckingForUpdate(false), 1000);
        }
    }, [showToast]);

    const handleResetAllFormations = async () => {
        if (window.confirm('Are you sure you want to delete ALL custom formations? This action cannot be undone and will restore the default playbook.')) {
            setIsResettingFormations(true);
            setSyncState('syncing');
            try {
                // Setting to empty objects will clear all user-defined formations from the DB.
                // The listener will then pick this up and the state will re-merge with just the defaults.
                await saveUserSettingsToFirebase(user.uid, { 
                    formations: {
                        offense: {},
                        defense: {},
                        specialTeams: {}
                    }
                });
                setSyncState('synced');
                showToast('All custom formations have been reset.', 'success');
            } catch (error) {
                console.error("Error resetting formations:", error);
                setSyncState('offline');
                showToast('Failed to reset formations.', 'error');
            } finally {
                setIsResettingFormations(false);
            }
        }
    };

    // *******************************************************************
    // ** PRESENTATION DATA GENERATION
    // *******************************************************************
    const handleLoadDemoData = useCallback(async () => {
        if (!window.confirm("This will overwrite game data for WK1 and replace the roster for ALL weeks with a new set of 45 randomized players. This is intended for presentation purposes. Are you sure you want to continue?")) {
            return;
        }

        setIsGeneratingDemo(true);
        try {
            const { generateDemoRoster, generateDemoPlayLog } = await import('../demo-data');
            const demoRoster = generateDemoRoster();
            const demoGameData = generateDemoPlayLog(demoRoster, { offense: offenseFormations, defense: defenseFormations, specialTeams: specialTeamsFormations });

            const batch = db.batch();
            
            // Apply new roster to ALL weeks
            for (const weekId of seasonWeeks) {
                const weekDocRef = db.collection('users').doc(user.uid).collection('weeks').doc(weekId);
                batch.update(weekDocRef, { players: demoRoster });
            }

            // Apply game log specifically to WK1
            const wk1DocRef = db.collection('users').doc(user.uid).collection('weeks').doc('WK1');
            batch.update(wk1DocRef, {
                ...demoGameData,
                opponentName: 'Garnet Golems'
            });

            // Also update the schedule object on the main user doc for consistency
            const userDocRef = db.collection('users').doc(user.uid);
            batch.set(userDocRef, { 
                schedule: { 
                    opponents: { 
                        'WK1': 'Garnet Golems' 
                    } 
                } 
            }, { merge: true });


            await batch.commit();

            showToast('Presentation data loaded into WK1!', 'success');
            setIsSettingsModalOpen(false); // Close the settings modal

            // If the user is not on WK1, switch them to it to see the data.
            if (selectedWeek !== 'WK1') {
                setSelectedWeek('WK1');
            }

        } catch (error) {
            console.error("Error loading presentation data:", error);
            showToast('Failed to load presentation data. See console for details.', 'error');
        } finally {
            setIsGeneratingDemo(false);
        }
    }, [user, seasonWeeks, showToast, offenseFormations, defenseFormations, specialTeamsFormations, setIsSettingsModalOpen, selectedWeek]);


    return (
        <GameStateContext.Provider value={{
            isResettingFormations,
            handleResetAllFormations,
            isCheckingForUpdate,
            handleCheckForUpdate,
            isGeneratingDemo,
            handleLoadDemoData,
            user,
            syncState,
            selectedWeek,
            seasonWeeks,
            players: playersWithStats,
            playHistory,
            undoStack,
            redoStack,
            currentLineups,
            offenseFormations,
            defenseFormations,
            specialTeamsFormations,
            depthChart,
            activeTab,
            playbookTab,
            selectedFormationName,
            animationClass,
            isSummaryModalOpen,
            setIsSummaryModalOpen,
            isReportsModalOpen,
            setIsReportsModalOpen,
            isExportingPdf,
            gameSummaryData,
            isQuarterSummaryModalOpen,
            quarterSummaryData,
            quarterPlaysForSummary,
            isImportModalOpen,
            setIsImportModalOpen,
            initialImportTab,
            isSettingsModalOpen,
            setIsSettingsModalOpen,
            isAddEventModalOpen,
            setIsAddEventModalOpen,
            isAddPlayerModalOpen,
            setIsAddPlayerModalOpen,
            editingPlayer,
            setEditingPlayer,
            editingPlayIndex,
            setEditingPlayIndex,
            editingFormation,
            setEditingFormation,
            editingEventWeek,
            setEditingEventWeek,
            isPlayDetailsModalOpen,
            tempPlayData,
            theme,
            toast,
            isWeekLoading,
            fieldLogoUrl,
            isWeekSelectorModalOpen,
            setIsWeekSelectorModalOpen,
            navBarPosition,
            opponentNames,
            opponentCities,
            homeAwayStatus,
            weekDates,
            weekResults,
            ourScore,
            opponentScore,
            currentQuarter,
            gameTime,
            isClockRunning,
            homeTimeouts,
            awayTimeouts,
            possession,
            homeStatus,
            insertionIndex,
            scrollToPlayIndex,
            ourStats,
            opponentStats,
            nextPlayState,
            isCoinTossModalOpen,
            setIsCoinTossModalOpen,
            isFourthDownModalOpen,
            setIsFourthDownModalOpen,
            showWalkthrough,
            setShowWalkthrough,
            handleCompleteWalkthrough,
            aiSummary,
            seasonRecord,
            customIconSheet,
            defaultIconSheet,
            handleSaveCustomIconSheet,
            setAiSummary,
            setScrollToPlayIndex,
            handleInitiateInsert,
            handleCancelInsert,
            handleThemeChange,
            showToast,
            handleNavBarPositionChange,
            mainPaddingClass,
            handleWeekChange,
            handleResetWeek,
            handleFourthDownDecision,
            handleStartGameFromCoinToss,
            handleUndo,
            handleRedo,
            handleTabChange,
            handleToggleClock,
            handleScoreChange,
            handleGameTimeChange,
            handlePossessionChange,
            lastPlay,
            downAndDistance,
            handleLineupConfirm,
            handleUpdateLineup,
            handleSavePlayDetails,
            handleOpenReportsModal,
            handleImportGame,
            handleClosePlayDetails,
            handleUpdatePlayer,
            handleDeletePlayer,
            handleEditPlay,
            handleSaveEditedPlay,
            handleDeletePlay,
            handleReorderPlay,
            handleEditFormation,
            handleCreateFormation,
            handleSaveFormation,
            handleDuplicateFormation,
            handleDeleteFormation,
            handleImport,
            handleSaveFieldLogo,
            handleExportJson,
            handleTriggerImport,
            handleExportPdf,
            startNextQuarter,
            handleQuarterEnd,
            getFormationsForEditModal,
            scoreboardProps: { gameTime, isClockRunning, onToggleClock: handleToggleClock, ourScore, opponentScore, onScoreChange: handleScoreChange, currentQuarter, homeStatus, homeTimeouts, awayTimeouts, onUseTimeout: (team: 'home' | 'away') => { if (team === 'home') setHomeTimeouts(prev => Math.max(0, prev - 1)); else setAwayTimeouts(prev => Math.max(0, prev - 1)); }, onEndPeriod: () => handleQuarterEnd(currentQuarter), onGameTimeChange: handleGameTimeChange, lastPlay, possession, onPossessionChange: handlePossessionChange, opponentNames, selectedWeek, downAndDistance, isWeekLoading },
            setPlaybookTab,
            setSelectedFormationName,
            handleAddNewEvent,
            handleEditEvent,
            handleSaveEvent,
            handleDeleteEvent,
            teamName,
            teamCity,
            coachName,
            ageDivision,
            handleAgeDivisionChange,
            handleTeamInfoChange,
            handleAddPlayer,
            handleRosterImport,
            handleSetFormationAsDefault,
            handleSetPlayerAsStarter,
            handleUpdateDepthChart,
            customTheme,
            handleCustomThemeChange,
            isSigningOut,
            handleSignOut,
            handleClearCacheAndSignOut,
            handleResetLineupToDefault,
        }}>
            {dbError ? (
                <div className="min-h-screen bg-red-900/50 text-white flex flex-col items-center justify-center p-4 text-center">
                    <h1 className="text-3xl font-bold mb-4">Connection Error</h1>
                    <div className="max-w-xl bg-black/30 p-4 rounded-lg" dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(dbError) }}></div>
                    <p className="mt-4">Please check your network settings and refresh the page.</p>
                </div>
            ) : children}
        </GameStateContext.Provider>
    );
};
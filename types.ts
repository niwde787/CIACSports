// types.ts
export enum AgeDivision {
    U8 = 'U8',
    U10 = 'U10',
    U12 = 'U12',
    U14 = 'U14',
}

export const AgeDivisionLabels: Record<AgeDivision, string> = {
    [AgeDivision.U8]: 'U8 (8 and under)',
    [AgeDivision.U10]: 'U10 (10 and under)',
    [AgeDivision.U12]: 'U12 (12 and under)',
    [AgeDivision.U14]: 'U14 (14 and under)',
};

export enum PlayerStatus {
    Playing = 'Playing',
    Injured = 'Injured',
    Absent = 'Absent',
    Discipline = 'Discipline',
}

export interface Player {
    id: string;
    name: string;
    jerseyNumber: number;
    position: string;
    status: PlayerStatus;
    offensePlayCount: number;
    defensePlayCount: number;
    specialTeamsPlayCount: number;
    timeOnField: number; // in seconds
    imageUrl?: string;
}

import React from 'react';

export enum PlayType {
    Offense = 'Offense',
    Defense = 'Defense',
    SpecialTeams = 'Special Teams',
    Formations = 'Formations', // used in playbookwidget
}

export type SelectablePlayType = PlayType.Offense | PlayType.Defense | PlayType.SpecialTeams;

export interface FormationPosition {
    label: string;
    top: string;
    left: string;
}

export type FormationPositions = FormationPosition[];

export interface Formation {
    positions: FormationPositions;
    presetPlayerIds?: (string | null)[];
    presetPlayerJerseys?: number[];
}

export type FormationCollection = Record<string, Formation>;

export interface Highlight {
    passerId?: string;
    receiverId?: string;
    runnerId?: string;
    tacklerId?: string;
    interceptorId?: string;
    kickerId?: string;
    returnerId?: string;
    holderId?: string;
}

export interface Play {
    playerIds: Set<string>;
    lineup?: (string | null)[];
    type: PlayType;
    formationName: string;
    timestamp: number;
    down?: number;
    distance?: number | 'Goal';
    startYardLine?: number;
    yardsGained: number;
    penaltyYards?: number;
    playResult?: PlayResult;
    quarter?: number;
    gameTime?: string;
    playDuration?: number; // in seconds
    ourScore?: number;
    opponentScore?: number;
    highlights?: Highlight;
    isFlag?: boolean;
    penaltyOn?: 'offense' | 'defense';
    isAutoFirstDown?: boolean;
    isLossOfDown?: boolean;
    isRepeatDown?: boolean;
    __originalIndex?: number; // for filtering
}

export interface SerializablePlay extends Omit<Play, 'playerIds'> {
    playerIds: string[];
}

export interface Drive {
    driveNumber: number;
    team: PlayType.Offense | PlayType.Defense;
    plays: { play: Play; originalIndex: number }[];
    summary: {
        playCount: number;
        yards: number;
        timeOfPossession: string;
        result: string;
        startYardLine: number;
        endYardLine: number;
    };
}


export enum PlayResult {
    // Pass Plays
    PassCompleted = 'Pass Completed',
    PassCompletedOutOfBounds = 'Pass Completed (Out of Bounds)',
    PassIncomplete = 'Pass Incomplete',
    PassTouchdown = 'Pass Touchdown',
    // Run Plays
    Run = 'Run',
    RunOutOfBounds = 'Run (Out of Bounds)',
    RunTouchdown = 'Run Touchdown',
    KneelDown = 'Kneel Down',
    // Turnovers / Sacks
    InterceptionThrown = 'Interception Thrown',
    FumbleLost = 'Fumble Lost',
    FumbleRecoveredByOffense = 'Fumble Recovered by Offense',
    FumbleOutOfBounds_Offense = 'Fumble Out of Bounds (Offense Retains)',
    OffensiveFumbleRecoveryTD = 'Fumble Recovery TD (Offense)',
    FumbleTouchback = 'Fumble Touchback (Turnover)',
    SackTaken = 'Sack',
    TurnoverOnDowns = 'Turnover on Downs',
    // Safeties
    OffensiveSafety = 'Safety (Offense)',
    DefensiveSafety = 'Safety (Defense)',
    // Penalties
    PenaltyAccepted = 'Penalty (Accepted)',
    PenaltyDeclined = 'Penalty (Declined)',
    PenaltyOffsetting = 'Penalty (Offsetting)',
    // Defensive Plays
    DefenseTackle = 'Tackle',
    DefenseTackleForLoss = 'Tackle for Loss',
    DefenseSack = 'Sack (Defense)',
    DefensePassDefended = 'Pass Defended',
    // Defensive Takeaways
    Interception = 'Interception',
    InterceptionReturnTD = 'Interception Return TD',
    FumbleRecovery = 'Fumble Recovery',
    FumbleReturnTD = 'Fumble Return TD',
    BlockedKickRecovery = 'Blocked Kick Recovery',
    // Special Teams - Kicking
    PATGood = 'PAT Good', // Legacy
    PATFailed = 'PAT Failed', // Legacy
    PAT_Blocked = 'PAT Blocked',
    FieldGoalGood = 'Field Goal Good',
    FieldGoalFailed = 'Field Goal Failed',
    Punt = 'Punt',
    PuntTouchback = 'Punt Touchback',
    PuntBlocked = 'Punt Blocked',
    FieldGoalBlocked = 'Field Goal Blocked',
    // Special Teams - Kickoff
    KickoffTackle = 'Kickoff - Tackle',
    KickoffTouchback = 'Kickoff - Touchback',
    KickoffOutOfBounds = 'Kickoff - Out of Bounds',
    OnsideKickRecovered = 'Onside Kick - Recovered',
    OnsideKickLost = 'Onside Kick - Lost',
    // Special Teams - Returns
    KickReturn = 'Kick Return',
    KickReturnOutOfBounds = 'Kick Return (Out of Bounds)',
    KickReturnTD = 'Kick Return TD',
    PuntReturn = 'Punt Return',
    PuntReturnOutOfBounds = 'Punt Return (Out of Bounds)',
    PuntReturnTD = 'Punt Return TD',
    PuntFairCatch = 'Punt - Fair Catch',
    BlockedPuntReturnTD = 'Blocked Punt Return TD',
    BlockedFieldGoalReturnTD = 'Blocked FG Return TD',
    MuffedPuntLost = 'Muffed Punt (Lost)',

    // Opponent Scoring - to be recorded on a defensive play
    OpponentScored = 'Opponent Scored', // Generic
    OpponentTouchdownRun = 'Opponent Touchdown (Run)',
    OpponentTouchdownPass = 'Opponent Touchdown (Pass)',
    OpponentPAT1ptGood = 'Opponent PAT (1pt Good)',
    OpponentPAT2ptGood = 'Opponent PAT (2pt Good)',
    OpponentPATFailed = 'Opponent PAT (Failed)',
    OpponentPATGood_DEPRECATED = 'Opponent PAT Good',
    InterceptionReturnTD_Opponent = 'Interception Return TD (Opponent)',
    FumbleReturnTD_Opponent = 'Fumble Return TD (Opponent)',
    KickoffReturnTD_Opponent = 'Kickoff Return TD (Opponent)',

    // --- NEW, MORE SPECIFIC 2-POINT CONVERSIONS ---
    TwoPointConversion_Pass_Good = '2pt Pass Conversion Good',
    TwoPointConversion_Pass_Failed = '2pt Pass Conversion Failed',
    TwoPointConversion_Run_Good = '2pt Run Conversion Good',
    TwoPointConversion_Run_Failed = '2pt Run Conversion Failed',

    // Conversions (Newer Rules)
    PAT_1pt_ConversionGood = '1pt Conv. Good',
    PAT_1pt_ConversionFailed = '1pt Conv. Failed',
    PAT_2pt_KickGood = '2pt Conv. Good (Kick)',
    PAT_2pt_KickFailed = '2pt Conv. Failed (Kick)',
    PAT_2pt_Return_Defense = '2pt PAT Return (Defense)',
    PAT_2pt_Return_Opponent = '2pt PAT Return (Opponent)',
    PAT_1pt_Safety_Offense = '1pt Safety (Offense)',

    // Conversions (Legacy)
    Pass1ptConversionGood = '1pt Pass Conv. Good',
    Pass1ptConversionFailed = '1pt Pass Conv. Failed',
    Run1ptConversionGood = '1pt Run Conv. Good',
    Run1ptConversionFailed = '1pt Run Conv. Failed',
}

export type ActiveTab = 'overview' | 'game' | 'roster' | 'play-log' | 'formations' | 'insights' | 'leaderboards';
export type NavBarPosition = 'bottom' | 'top' | 'left' | 'right';
export type Theme = 'dark' | 'light' | 'material-you' | 'custom';

export interface CustomTheme {
    bgPrimary: string;
    bgSecondary: string;
    textPrimary: string;
    textSecondary: string;
    borderPrimary: string;
    accentPrimary: string;
    accentSecondary: string;
    accentDefense: string;
    accentSpecial: string;
}

export interface PlayerStats {
    count: number;
    yards: number;
    attempts?: number;
    makes?: number;
}
export type PlayerContribution = Record<string, PlayerStats>;

export interface FormationStats {
    playCount: number;
    totalYards: number;
    positivePlays: number;
    negativePlays: number;
    zeroYdPlays: number;
    pointsScored?: number;
    attempts?: number;
    makes?: number;
}

export interface QuarterSummaryData {
    formationStats: Record<string, FormationStats>;
    topPerformers: {
        passers: PlayerContribution;
        receivers: PlayerContribution;
        runners: PlayerContribution;
        tacklers: PlayerContribution;
        interceptors: PlayerContribution;
        kickers: PlayerContribution;
        returners: PlayerContribution;
    };
}

export interface WeekData {
    players: Player[];
    offenseFormations: FormationCollection;
    defenseFormations: FormationCollection;
    specialTeamsFormations: FormationCollection;
    presetLineups: Record<string, (string | null)[]>;
    depthChart?: Record<string, string[]>;
}

export interface StoredGameState extends WeekData {
    playHistory: SerializablePlay[];
    currentLineups: Record<string, (string | null)[]>;
    opponentName?: string;
    ourScore: number;
    opponentScore: number;
    currentQuarter: number;
    gameTime: number;
    isClockRunning: boolean;
    homeTimeouts: number;
    awayTimeouts: number;
    possession: 'home' | 'away' | null;
    coinToss?: { winner: 'us' | 'them'; choice: 'receive' | 'defer' };
    depthChart?: Record<string, string[]>;
    aiSummary?: AiSummary;
    customIconSheet?: string | null;
    defaultIconSheet?: string;
    customTheme?: CustomTheme;
    seasonRecord?: { wins: number; losses: number; ties: number };
}

export interface CustomFormations {
    offense: FormationCollection;
    defense: FormationCollection;
    specialTeams: FormationCollection;
}


export interface ScoreboardProps {
    gameTime: number;
    isClockRunning: boolean;
    onToggleClock: () => void;
    ourScore: number;
    opponentScore: number;
    onScoreChange: (ourScore: number, oppScore: number) => void;
    currentQuarter: number;
    homeStatus: 'Home' | 'Away';
    homeTimeouts: number;
    awayTimeouts: number;
    onUseTimeout: (team: 'home' | 'away') => void;
    onEndPeriod: () => void;
    onGameTimeChange: (newTime: number) => void;
    lastPlay: Play | undefined;
    possession: 'home' | 'away' | null;
    onPossessionChange: (team: 'home' | 'away') => void;
    opponentNames: Record<string, string>;
    selectedWeek: string;
    downAndDistance: string;
    isWeekLoading: boolean;
}

// For import from spreadsheet
export interface ParsedRosterUpdate {
    week: string;
    jerseyNumber: number;
    status: PlayerStatus;
}
export interface ParsedFormation {
    week?: string;
    playType: PlayType;
    formationName: string;
    formation: Formation;
    presetPlayerJerseys?: number[];
}
export interface ParsedOpponentUpdate {
    week: string;
    opponentName: string;
}

export interface AiSummary {
    gameBreakdown: string;
    impactPlays: {
        playDescription: string;
        quarter: number;
        gameTime: string;
        result: string;
    }[];
    thingsToWorkOn: string;
    formationAnalysis: string;
    playerHighlights: string;
}

export interface GameStateContextType {
    ageDivision: AgeDivision | null;
    handleAgeDivisionChange: (division: AgeDivision) => void;
    isResettingFormations: boolean;
    handleResetAllFormations: () => void;
    isCheckingForUpdate: boolean;
    handleCheckForUpdate: () => void;
    isSigningOut: boolean;
    handleSignOut: () => void;
    handleClearCacheAndSignOut: () => void;
    user: any;
    syncState: 'idle' | 'syncing' | 'synced' | 'offline';
    selectedWeek: string;
    seasonWeeks: string[];
    players: Player[];
    playHistory: Play[];
    undoStack: Play[][];
    redoStack: Play[][];
    currentLineups: Record<string, (string | null)[]>;
    offenseFormations: FormationCollection;
    defenseFormations: FormationCollection;
    specialTeamsFormations: FormationCollection;
    depthChart: Record<string, string[]>;
    activeTab: ActiveTab;
    playbookTab: SelectablePlayType;
    selectedFormationName: string;
    animationClass: string;
    isSummaryModalOpen: boolean;
    setIsSummaryModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isCoinTossModalOpen: boolean;
    setIsCoinTossModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isFourthDownModalOpen: boolean;
    setIsFourthDownModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    showWalkthrough: boolean;
    setShowWalkthrough: React.Dispatch<React.SetStateAction<boolean>>;
    handleCompleteWalkthrough: () => Promise<void>;
    isReportsModalOpen: boolean;
    setIsReportsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isExportingPdf: boolean;
    gameSummaryData: QuarterSummaryData | null;
    isQuarterSummaryModalOpen: boolean;
    quarterSummaryData: QuarterSummaryData | null;
    quarterPlaysForSummary: Play[];
    isImportModalOpen: boolean;
    setIsImportModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    initialImportTab: 'season' | 'playbook';
    isSettingsModalOpen: boolean;
    setIsSettingsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isAddEventModalOpen: boolean;
    setIsAddEventModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isAddPlayerModalOpen: boolean;
    setIsAddPlayerModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    editingPlayer: Player | null;
    setEditingPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
    editingPlayIndex: number | null;
    setEditingPlayIndex: React.Dispatch<React.SetStateAction<number | null>>;
    editingFormation: { playType: PlayType; name?: string; isCreating: boolean } | null;
    setEditingFormation: React.Dispatch<React.SetStateAction<{ playType: PlayType; name?: string; isCreating: boolean } | null>>;
    editingEventWeek: string | null;
    setEditingEventWeek: React.Dispatch<React.SetStateAction<string | null>>;
    isPlayDetailsModalOpen: boolean;
    tempPlayData: React.MutableRefObject<{ playType: PlayType; playerIds: Set<string>; formationName: string; lineup: (string | null)[]; formationPositions: FormationPosition[] } | null>;
    theme: Theme;
    toast: { message: string; type: 'success' | 'error' | 'info' } | null;
    isWeekLoading: boolean;
    fieldLogoUrl: string;
    isWeekSelectorModalOpen: boolean;
    setIsWeekSelectorModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    navBarPosition: NavBarPosition;
    opponentNames: Record<string, string>;
    opponentCities: Record<string, string>;
    homeAwayStatus: Record<string, 'Home' | 'Away'>;
    weekDates: Record<string, string>;
    weekResults: Record<string, any>;
    ourScore: number;
    opponentScore: number;
    currentQuarter: number;
    gameTime: number;
    isClockRunning: boolean;
    homeTimeouts: number;
    awayTimeouts: number;
    possession: 'home' | 'away' | null;
    homeStatus: 'Home' | 'Away';
    insertionIndex: number | null;
    scrollToPlayIndex: number | null;
    ourStats: any; // Simplified for brevity
    opponentStats: any; // Simplified for brevity
    nextPlayState: { down: number, startYardLine: number, distance: number | 'Goal', isOurDrive: boolean };
    aiSummary: AiSummary | null;
    teamName: string;
    teamCity: string;
    coachName: string;
    customTheme: CustomTheme;
    seasonRecord: { wins: number; losses: number; ties: number; };
    customIconSheet: string | null;
    defaultIconSheet: string;
    handleSaveCustomIconSheet: (svgString: string) => Promise<void>;
    setAiSummary: React.Dispatch<React.SetStateAction<AiSummary | null>>;
    setScrollToPlayIndex: React.Dispatch<React.SetStateAction<number | null>>;
    handleInitiateInsert: (index: number) => void;
    handleCancelInsert: () => void;
    handleThemeChange: (theme: Theme) => void;
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    handleNavBarPositionChange: (position: NavBarPosition) => void;
    mainPaddingClass: string;
    handleWeekChange: (week: string) => void;
    handleUseTimeout: (team: 'home' | 'away') => void;
    handleStartGameFromCoinToss: (winner: 'us' | 'them', choice: 'receive' | 'defer') => void;
    handleFourthDownDecision: (decision: 'go' | 'punt' | 'fg') => void;
    handleResetWeek: () => void;
    handleUndo: () => void;
    handleRedo: () => void;
    handleTabChange: (tab: ActiveTab) => void;
    handleToggleClock: () => void;
    handleScoreChange: (newOurScore: number, newOpponentScore: number) => void;
    handleGameTimeChange: (newTimeInSeconds: number) => void;
    handlePossessionChange: (team: 'home' | 'away') => void;
    lastPlay: Play | undefined;
    downAndDistance: string;
    handleLineupConfirm: (playType: PlayType, selectedPlayerIds: Set<string>, formationName: string, lineup: (string | null)[]) => void;
    handleUpdateLineup: (formationName: string, lineup: (string | null)[], playType: PlayType) => void;
    handleSavePlayDetails: (details: Partial<Play>) => void;
    handleOpenReportsModal: () => void;
    handleImportGame: (jsonString: string) => void;
    handleClosePlayDetails: () => void;
    handleUpdatePlayer: (playerId: string, updates: Partial<Player>) => void;
    handleDeletePlayer: (playerId: string) => void;
    handleEditPlay: (index: number) => void;
    handleSaveEditedPlay: (newPlayerIds: Set<string>, newLineup: (string | null)[], newFormationName: string, newDetails: Partial<Play>) => void;
    handleDeletePlay: (index: number) => void;
    handleReorderPlay: (draggedIndex: number, targetIndex: number) => void;
    handleEditFormation: (playType: PlayType, formationName: string) => void;
    handleCreateFormation: (playType: PlayType) => void;
    handleSaveFormation: (playType: PlayType, formationName: string, formation: Formation, originalName?: string) => void;
    handleDuplicateFormation: (playType: PlayType, formationNameToCopy: string) => void;
    handleDeleteFormation: (playType: PlayType, formationName: string) => void;
    handleImport: (rosterUpdates: ParsedRosterUpdate[], formationUpdates: ParsedFormation[], opponentUpdates: ParsedOpponentUpdate[]) => void;
    handleSaveFieldLogo: (newUrl: string) => void;
    handleExportJson: () => void;
    handleTriggerImport: (initialTab?: 'season' | 'playbook') => void;
    handleExportPdf: () => void;
    startNextQuarter: () => void;
    handleQuarterEnd: (quarter: number) => void;
    getFormationsForEditModal: (playType: PlayType, currentFormations: FormationCollection) => FormationCollection;
    scoreboardProps: ScoreboardProps;
    setPlaybookTab: React.Dispatch<React.SetStateAction<SelectablePlayType>>;
    setSelectedFormationName: React.Dispatch<React.SetStateAction<string>>;
    handleAddNewEvent: () => void;
    handleEditEvent: (week: string) => void;
    handleSaveEvent: (data: { week: string; isNew: boolean; opponentName: string; opponentCity: string; homeAway: 'Home' | 'Away' | 'OPP'; date: string; }) => Promise<void>;
    handleDeleteEvent: (week: string) => Promise<void>;
    handleTeamInfoChange: (name: string, city: string, coachName: string) => void;
    handleAddPlayer: (player: { jerseyNumber: number; name: string; position: string; status: PlayerStatus; imageUrl?: string; }) => Promise<void>;
    handleRosterImport: (players: any[]) => Promise<void>;
    handleSetFormationAsDefault: (playType: PlayType, formationName: string) => void;
    handleSetPlayerAsStarter: (playerId: string) => void;
    handleUpdateDepthChart: (group: string, playerIds: string[]) => void;
    handleCustomThemeChange: (theme: CustomTheme) => void;
    handleResetLineupToDefault: (formationName: string) => void;
    isGeneratingDemo: boolean;
    handleLoadDemoData: () => Promise<void>;
}


import { Player, PlayerStatus, Play, PlayType, PlayResult, FormationCollection, Highlight } from './types';
import { DEFAULT_PLAYER_IMAGE } from './constants';
import { formatTime, calculateScoreAdjustments } from './utils';

// --- DATA SETS FOR RANDOMIZATION ---
const FIRST_NAMES = ["Liam", "Noah", "Oliver", "Elijah", "James", "William", "Henry", "Lucas", "Benjamin", "Theodore", "Owen", "Levi", "Mason", "Ezra", "Luca", "Ethan", "Aiden", "Leo", "Jack", "Jackson", "David", "Joseph", "Samuel", "Michael", "Daniel", "Jacob", "Logan", "Carter", "Jayden", "Luke", "Matthew", "John", "Ryan", "Nathan", "Eli", "Isaac", "Aaron", "Caleb", "Christian", "Hunter", "Connor", "Gabriel", "Wyatt", "Dylan", "Anthony", "Grayson", "Julian", "Dylan", "Adam", "Andrew", "Austin"];
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Green", "Baker", "Adams", "Nelson", "Hill", "Hall", "Campbell", "Mitchell", "Carter", "Roberts"];
const ROSTER_TEMPLATE: { [key: string]: number } = { 'QB': 2, 'RB': 3, 'WR': 6, 'TE': 2, 'OL': 10, 'DE': 4, 'DT': 4, 'LB': 6, 'CB': 4, 'S': 3, 'K': 1, 'P': 1 };

// --- ROSTER GENERATION ---
export const generateDemoRoster = (): Player[] => {
    const players: Player[] = [];
    const usedNames = new Set<string>();
    const usedJerseys = new Set<number>();
    let playerIdCounter = 1;

    Object.entries(ROSTER_TEMPLATE).forEach(([pos, count]) => {
        for (let i = 0; i < count; i++) {
            let name: string;
            do {
                name = `${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}, ${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]}`;
            } while (usedNames.has(name));
            usedNames.add(name);

            let jerseyNumber: number;
            do {
                jerseyNumber = Math.floor(Math.random() * 99) + 1;
            } while (usedJerseys.has(jerseyNumber));
            usedJerseys.add(jerseyNumber);

            players.push({
                id: (playerIdCounter++).toString(),
                name,
                jerseyNumber,
                position: '',
                status: PlayerStatus.Playing,
                imageUrl: DEFAULT_PLAYER_IMAGE,
                offensePlayCount: 0,
                defensePlayCount: 0,
                specialTeamsPlayCount: 0,
                timeOnField: 0,
            });
        }
    });

    return players.sort((a, b) => a.jerseyNumber - b.jerseyNumber);
};

// --- GAME SIMULATION ---
export const generateDemoPlayLog = (roster: Player[], formations: { offense: FormationCollection, defense: FormationCollection, specialTeams: FormationCollection }) => {
    let playHistory: Play[] = [];
    const Roster = {
        Offense: roster.filter(p => ['QB', 'RB', 'WR', 'TE', 'OL'].includes(p.position) || p.position === ''),
        Defense: roster.filter(p => ['DE', 'DT', 'LB', 'CB', 'S'].includes(p.position) || p.position === ''),
        Special: roster.filter(p => ['K', 'P', 'H', 'LS', 'KR', 'GNR', 'BLK'].includes(p.position) || p.position === ''),
    };

    const getPlayerId = (pos: string, type: 'Offense' | 'Defense' | 'Special'): string | undefined => {
        const team = type === 'Special' ? [...Roster.Offense, ...Roster.Special] : Roster[type];
        const candidates = team.filter(p => p.position === pos);
        if (candidates.length > 0) return candidates[Math.floor(Math.random() * candidates.length)].id;
        if (team.length > 0) return team[Math.floor(Math.random() * team.length)].id;
        return undefined;
    };
    
    const getPlayers = (count: number, type: 'Offense' | 'Defense' | 'Special') => {
        const team = Roster[type];
        return new Set(team.slice(0, count).map(p => p.id));
    };

    let sim = { q: 1, time: 600, down: 1, distance: 10, yardLine: 25, ourScore: 0, oppScore: 0, isOurDrive: true };
    
    const play = ( type: PlayType, result: PlayResult, yards: number, formation: string, { timeUsed = 25, isTurnover = false, isScore = false, isFirstDown = false } = {}) => {
        const playerIds = getPlayers(11, type === PlayType.Defense ? 'Defense' : 'Offense');
        sim.time -= timeUsed;
        if (sim.time < 0) sim.time = 0;

        const highlights: Highlight = {};
        switch (result) {
            case PlayResult.Run: case PlayResult.RunTouchdown: highlights.runnerId = getPlayerId('RB', 'Offense'); break;
            case PlayResult.PassCompleted: case PlayResult.PassIncomplete: case PlayResult.PassTouchdown:
                highlights.passerId = getPlayerId('QB', 'Offense');
                highlights.receiverId = getPlayerId('WR', 'Offense');
                break;
            case PlayResult.InterceptionThrown:
                highlights.passerId = getPlayerId('QB', 'Offense');
                highlights.receiverId = getPlayerId('WR', 'Offense');
                highlights.interceptorId = getPlayerId('CB', 'Defense') || getPlayerId('S', 'Defense');
                break;
            case PlayResult.KickReturn: highlights.returnerId = getPlayerId('WR', 'Offense'); break;
            case PlayResult.PAT_1pt_ConversionGood: case PlayResult.FieldGoalGood: highlights.kickerId = getPlayerId('K', 'Special'); break;
            case PlayResult.KickoffTouchback: case PlayResult.Punt: highlights.kickerId = getPlayerId('K', 'Special'); break;
            case PlayResult.DefenseTackle: case PlayResult.DefensePassDefended: case PlayResult.DefenseSack: highlights.tacklerId = getPlayerId('LB', 'Defense'); break;
            case PlayResult.SackTaken: highlights.passerId = getPlayerId('QB', 'Offense'); break;
            case PlayResult.KneelDown: highlights.runnerId = getPlayerId('QB', 'Offense'); break;
            case PlayResult.FumbleRecovery: highlights.tacklerId = getPlayerId('DT', 'Defense'); break;
        }

        playHistory.push({ type, playResult: result, yardsGained: yards, formationName: formation, playerIds, timestamp: Date.now() + playHistory.length, quarter: sim.q, gameTime: formatTime(sim.time), ourScore: sim.ourScore, opponentScore: sim.oppScore, down: sim.down, startYardLine: sim.yardLine, highlights });

        const { ourScoreAdjustment, opponentScoreAdjustment } = calculateScoreAdjustments(result);
        sim.ourScore += ourScoreAdjustment;
        sim.oppScore += opponentScoreAdjustment;
        if (sim.isOurDrive) sim.yardLine += yards; else sim.yardLine -= yards;

        if (isTurnover || isScore) {
            sim.isOurDrive = !sim.isOurDrive;
            sim.down = 1; sim.distance = 10;
            sim.yardLine = 100 - sim.yardLine;
            if (sim.yardLine < 0 || sim.yardLine > 100) sim.yardLine = 25;
        } else if (isFirstDown || yards >= sim.distance) {
            sim.down = 1; sim.distance = 10;
        } else {
            sim.down++; sim.distance -= yards;
        }
        
        if (sim.down > 4) play(PlayType.Offense, PlayResult.TurnoverOnDowns, 0, formation, { isTurnover: true });
        if (sim.time <= 0 && sim.q < 4) { sim.q++; sim.time = 600; }
    };
    
    // Q1
    play(PlayType.SpecialTeams, PlayResult.KickReturn, 25, 'Kick Return', { timeUsed: 8 }); 
    play(PlayType.Offense, PlayResult.Run, 8, 'I-Formation', { timeUsed: 30 });
    play(PlayType.Offense, PlayResult.PassCompleted, 15, 'Shotgun', { timeUsed: 25, isFirstDown: true });
    play(PlayType.Offense, PlayResult.Run, 5, 'I-Formation', { timeUsed: 32 });
    play(PlayType.Offense, PlayResult.PassCompleted, 22, 'Shotgun', { timeUsed: 28, isFirstDown: true });
    play(PlayType.Offense, PlayResult.RunTouchdown, 25, 'I-Formation', { timeUsed: 30, isScore: true });
    play(PlayType.SpecialTeams, PlayResult.PAT_1pt_ConversionGood, 0, 'Field Goal / PAT', { timeUsed: 0, isScore: true });
    play(PlayType.SpecialTeams, PlayResult.KickoffTouchback, 0, 'Kickoff', { timeUsed: 6, isTurnover: true }); 

    // Q2
    play(PlayType.Defense, PlayResult.DefenseTackle, 4, '4-3 Defense', { timeUsed: 28 });
    play(PlayType.Defense, PlayResult.DefenseTackle, 7, '4-3 Defense', { timeUsed: 31, isFirstDown: true });
    play(PlayType.Defense, PlayResult.DefensePassDefended, 0, 'Nickel', { timeUsed: 15 });
    play(PlayType.Defense, PlayResult.DefenseTackle, 2, '4-3 Defense', { timeUsed: 29 });
    play(PlayType.Defense, PlayResult.DefenseSack, -8, 'Nickel', { timeUsed: 20 });
    play(PlayType.SpecialTeams, PlayResult.Punt, 40, 'Punt', { timeUsed: 8, isTurnover: true });
    play(PlayType.Offense, PlayResult.Run, 3, 'I-Formation', { timeUsed: 25 });
    play(PlayType.Offense, PlayResult.PassIncomplete, 0, 'Shotgun', { timeUsed: 10 });
    play(PlayType.Offense, PlayResult.InterceptionThrown, 15, 'Shotgun', { timeUsed: 20, isTurnover: true }); 

    // Q3
    play(PlayType.Defense, PlayResult.OpponentTouchdownPass, 30, '4-3 Defense', { timeUsed: 25, isScore: true });
    play(PlayType.Defense, PlayResult.OpponentPAT1ptGood, 0, 'Field Goal Block', { timeUsed: 0, isScore: true });

    play(PlayType.SpecialTeams, PlayResult.KickReturn, 35, 'Kick Return', { timeUsed: 10 });
    play(PlayType.Offense, PlayResult.Run, 4, 'I-Formation', { timeUsed: 28 });
    play(PlayType.Offense, PlayResult.Run, 2, 'I-Formation', { timeUsed: 25 });
    play(PlayType.Offense, PlayResult.PenaltyAccepted, 15, 'Shotgun', { isFirstDown: true });
    play(PlayType.Offense, PlayResult.PassCompleted, 44, 'Shotgun', { timeUsed: 33, isFirstDown: true });
    play(PlayType.Offense, PlayResult.RunTouchdown, 1, 'I-Formation', { timeUsed: 20, isScore: true });
    play(PlayType.SpecialTeams, PlayResult.PAT_1pt_ConversionGood, 0, 'Field Goal / PAT', { timeUsed: 0, isScore: true });
    
    // Q4
    play(PlayType.SpecialTeams, PlayResult.KickoffTackle, 0, 'Kickoff', { timeUsed: 7, isTurnover: true });
    play(PlayType.Defense, PlayResult.DefenseTackle, 3, '4-3 Defense', { timeUsed: 26 });
    play(PlayType.Defense, PlayResult.FumbleRecovery, -5, '4-3 Defense', { timeUsed: 22, isTurnover: true }); 
    
    play(PlayType.Offense, PlayResult.SackTaken, -8, 'Shotgun', { timeUsed: 18 });
    play(PlayType.Offense, PlayResult.PassCompleted, 12, 'Shotgun', { timeUsed: 24 });
    play(PlayType.Offense, PlayResult.Run, 3, 'I-Formation', { timeUsed: 29 });
    play(PlayType.SpecialTeams, PlayResult.Punt, 45, 'Punt', { timeUsed: 8, isTurnover: true });

    play(PlayType.Defense, PlayResult.KneelDown, -1, 'Goal Line Defense', { timeUsed: 35 });
    play(PlayType.Defense, PlayResult.KneelDown, -1, 'Goal Line Defense', { timeUsed: 35 });
    
    sim.time = 0; sim.q = 4;
    play(PlayType.Defense, PlayResult.KneelDown, -1, 'Goal Line Defense', { timeUsed: 0 });

    return {
        playHistory: playHistory.map(p => ({...p, playerIds: Array.from(p.playerIds)})),
        ourScore: sim.ourScore,
        opponentScore: sim.oppScore,
        currentQuarter: 4,
        gameTime: 0,
        isClockRunning: false,
        possession: 'away',
        homeTimeouts: 0,
        awayTimeouts: 0,
        coinToss: { winner: 'us', choice: 'defer' },
        currentLineups: {},
        depthChart: {}
    };
};

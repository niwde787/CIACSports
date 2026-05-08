import { PlayResult, PlayType, PlayerStatus, Play, Drive, Player, Highlight } from './types';
import { POSITION_FULL_NAMES } from './constants';

export const deepCopy = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

export const getFirstName = (name: string): string => {
  if (!name) return '';
  const parts = name.split(',').map(s => s.trim());
  if (parts.length > 1 && parts[1]) {
    return parts[1];
  }
  return parts[0]; // Fallback for single names
};

export const getLastName = (name: string): string => {
  if (!name) return '';
  return name.split(',')[0];
};

export const formatPlayerNameForDepthChart = (name: string): string => {
    if (!name || !name.includes(',')) return (name || '');
    const parts = name.split(',').map(s => s.trim());
    const lastName = parts[0];
    const firstName = parts[1];
    return `${firstName} ${lastName}`;
};

export const formatTime = (totalSeconds: number): string => {
  if (!totalSeconds || totalSeconds < 0) totalSeconds = 0;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const formatPosition = (pos: string | undefined): string => {
    if (!pos) return '';
    return pos.split(',').map(p => p.trim().toUpperCase()).join(', ');
};

export const parseGameTime = (timeStr?: string): number => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return parts[0] * 60 + parts[1];
    }
    return 0;
};

export const removeUndefinedValues = (obj: any): any => {
    if (obj === null || obj === undefined) {
        return null;
    }
    if (Array.isArray(obj)) {
        return obj.map(removeUndefinedValues);
    }
    // Don't modify Sets; they are converted to arrays before this function is called.
    if (obj instanceof Set) {
        return obj;
    }
    if (typeof obj === 'object' && obj.constructor === Object) {
        const newObj: { [key: string]: any } = {};
        for (const key of Object.keys(obj)) {
            const value = obj[key];
            if (value !== undefined) {
                newObj[key] = removeUndefinedValues(value);
            }
        }
        return newObj;
    }
    return obj;
};

export const getStatusColorClasses = (status: PlayerStatus) => {
  switch (status) {
    case PlayerStatus.Playing:
      return { bg: 'bg-[var(--status-playing)]', text: 'text-[var(--status-playing-text)]', border: 'border-[var(--status-playing)]' };
    case PlayerStatus.Injured:
      return { bg: 'bg-[var(--status-injured)]', text: 'text-[var(--status-injured-text)]', border: 'border-[var(--status-injured)]' };
    case PlayerStatus.Absent:
      return { bg: 'bg-[var(--status-absent)]', text: 'text-[var(--status-absent-text)]', border: 'border-[var(--status-absent)]' };
    case PlayerStatus.Discipline:
      return { bg: 'bg-[var(--status-discipline)]', text: 'text-[var(--status-discipline-text)]', border: 'border-[var(--status-discipline)]' };
    default:
      return { bg: 'bg-gray-500', text: 'text-white', border: 'border-gray-500' };
  }
};

export const getPlayResultOptionsForType = (playType: PlayType): { label: string; options: PlayResult[] }[] => {
  const penaltyOptions = [PlayResult.PenaltyAccepted, PlayResult.PenaltyDeclined, PlayResult.PenaltyOffsetting];
  switch (playType) {
    case PlayType.Offense:
      return [
        {
          label: 'Pass Plays',
          options: [
            PlayResult.PassCompleted,
            PlayResult.PassCompletedOutOfBounds,
            PlayResult.PassIncomplete,
            PlayResult.PassTouchdown,
          ],
        },
        {
          label: 'Run Plays',
          options: [
            PlayResult.Run,
            PlayResult.RunOutOfBounds,
            PlayResult.RunTouchdown,
            PlayResult.KneelDown,
          ],
        },
        {
          label: '2pt Conversions',
          options: [
            PlayResult.TwoPointConversion_Pass_Good,
            PlayResult.TwoPointConversion_Pass_Failed,
            PlayResult.TwoPointConversion_Run_Good,
            PlayResult.TwoPointConversion_Run_Failed,
          ],
        },
        {
          label: 'PAT / Conversion (Standard Rules)',
          options: [
            PlayResult.PAT_1pt_ConversionGood,
            PlayResult.PAT_1pt_ConversionFailed,
            PlayResult.PAT_2pt_Return_Opponent, // Opponent returns turnover on our 2-pt attempt
          ]
        },
        {
          label: 'Turnovers / Sacks / Safeties',
          options: [
            PlayResult.InterceptionThrown,
            PlayResult.InterceptionReturnTD_Opponent,
            PlayResult.FumbleLost,
            PlayResult.FumbleRecoveredByOffense,
            PlayResult.FumbleOutOfBounds_Offense,
            PlayResult.OffensiveFumbleRecoveryTD,
            PlayResult.FumbleTouchback,
            PlayResult.FumbleReturnTD_Opponent,
            PlayResult.SackTaken,
            PlayResult.TurnoverOnDowns,
            PlayResult.OffensiveSafety,
            PlayResult.PAT_1pt_Safety_Offense, // Rare 1-pt safety for offense
          ],
        },
        {
            label: 'Conversions (Legacy Rules)',
            options: [
                PlayResult.Pass1ptConversionGood,
                PlayResult.Pass1ptConversionFailed,
                PlayResult.Run1ptConversionGood,
                PlayResult.Run1ptConversionFailed,
            ]
        },
        { label: 'Penalties', options: penaltyOptions }
      ];
    case PlayType.Defense:
      return [
        {
          label: 'Tackles & Sacks',
          options: [
            PlayResult.DefenseTackle,
            PlayResult.DefenseTackleForLoss,
            PlayResult.DefenseSack,
            PlayResult.DefensePassDefended,
          ],
        },
        {
          label: 'Takeaways',
          options: [
            PlayResult.Interception,
            PlayResult.InterceptionReturnTD,
            PlayResult.FumbleRecovery,
            PlayResult.FumbleReturnTD,
            PlayResult.BlockedKickRecovery,
          ],
        },
        {
            label: 'Scoring',
            options: [
                PlayResult.DefensiveSafety,
                PlayResult.PAT_2pt_Return_Defense, // Our defense scores on opponent's PAT attempt
            ]
        },
        {
            label: 'Opponent Scoring',
            options: [
                PlayResult.OpponentTouchdownRun,
                PlayResult.OpponentTouchdownPass,
                PlayResult.OpponentPAT1ptGood,
                PlayResult.OpponentPAT2ptGood,
                PlayResult.OpponentPATFailed,
                PlayResult.OpponentScored, // Fallback
            ]
        },
        { label: 'Penalties', options: penaltyOptions }
      ];
    case PlayType.SpecialTeams:
      return [
        {
          label: 'PAT Kicks (Standard Rules)',
          options: [
            PlayResult.PAT_2pt_KickGood,
            PlayResult.PAT_2pt_KickFailed,
            PlayResult.PAT_2pt_Return_Opponent, // Opponent returns blocked kick
          ]
        },
        {
          label: 'Field Goals & Punts',
          options: [
            PlayResult.FieldGoalGood,
            PlayResult.FieldGoalFailed,
            PlayResult.Punt,
            PlayResult.PuntTouchback,
            PlayResult.PuntBlocked,
            PlayResult.FieldGoalBlocked,
          ],
        },
        {
          label: 'Kicking (Legacy PAT)',
          options: [
            PlayResult.PATGood,
            PlayResult.PATFailed,
            PlayResult.PAT_Blocked,
          ],
        },
        {
          label: 'Kickoff',
          options: [
            PlayResult.KickoffTackle,
            PlayResult.KickoffTouchback,
            PlayResult.KickoffOutOfBounds,
            PlayResult.OnsideKickRecovered,
            PlayResult.OnsideKickLost,
            PlayResult.KickoffReturnTD_Opponent,
          ],
        },
        {
          label: 'Returns',
          options: [
            PlayResult.KickReturn,
            PlayResult.KickReturnOutOfBounds,
            PlayResult.KickReturnTD,
            PlayResult.PuntReturn,
            PlayResult.PuntReturnOutOfBounds,
            PlayResult.PuntReturnTD,
            PlayResult.PuntFairCatch,
            PlayResult.BlockedPuntReturnTD,
            PlayResult.BlockedFieldGoalReturnTD,
            PlayResult.MuffedPuntLost,
          ],
        },
        { label: 'Penalties', options: penaltyOptions }
      ];
    default:
      return [];
  }
};


export const calculateScoreAdjustments = (playResult: PlayResult): { ourScoreAdjustment: number; opponentScoreAdjustment: number } => {
  let ourScoreAdjustment = 0;
  let opponentScoreAdjustment = 0;

  switch (playResult) {
    // Our Touchdowns (+6)
    case PlayResult.PassTouchdown:
    case PlayResult.RunTouchdown:
    case PlayResult.InterceptionReturnTD:
    case PlayResult.FumbleReturnTD:
    case PlayResult.KickReturnTD:
    case PlayResult.PuntReturnTD:
    case PlayResult.BlockedPuntReturnTD:
    case PlayResult.BlockedFieldGoalReturnTD:
    case PlayResult.OffensiveFumbleRecoveryTD:
        ourScoreAdjustment = 6;
        break;

    // Opponent Touchdowns (+6)
    case PlayResult.InterceptionReturnTD_Opponent:
    case PlayResult.FumbleReturnTD_Opponent:
    case PlayResult.OpponentScored:
    case PlayResult.KickoffReturnTD_Opponent:
    case PlayResult.OpponentTouchdownRun:
    case PlayResult.OpponentTouchdownPass:
        opponentScoreAdjustment = 6;
        break;
        
    // Our Other Scores
    case PlayResult.Pass1ptConversionGood:
    case PlayResult.Run1ptConversionGood:
        ourScoreAdjustment = 1;
        break;
    case PlayResult.DefensiveSafety:
        ourScoreAdjustment = 2;
        break;
    case PlayResult.PATGood:
        ourScoreAdjustment = 2;
        break;
    case PlayResult.FieldGoalGood:
        ourScoreAdjustment = 3;
        break;

    // Opponent Other Scores
    case PlayResult.OffensiveSafety:
        opponentScoreAdjustment = 2;
        break;

    // ADDED for new 2pt conversions
    case PlayResult.TwoPointConversion_Pass_Good:
    case PlayResult.TwoPointConversion_Run_Good:
        ourScoreAdjustment = 2;
        break;
    
    // ADDED for new PAT rules
    case PlayResult.PAT_1pt_ConversionGood:
    case PlayResult.PAT_1pt_Safety_Offense:
      ourScoreAdjustment = 1;
      break;
    case PlayResult.PAT_2pt_KickGood:
    case PlayResult.PAT_2pt_Return_Defense:
      ourScoreAdjustment = 2;
      break;
    
    // Corrected opponent PAT scoring
    case PlayResult.OpponentPAT1ptGood:
    case PlayResult.OpponentPATGood_DEPRECATED: // Treat legacy as 1 pt
        opponentScoreAdjustment = 1;
        break;
    case PlayResult.OpponentPAT2ptGood:
    case PlayResult.PAT_2pt_Return_Opponent:
        opponentScoreAdjustment = 2;
        break;
  }
  
  return { ourScoreAdjustment, opponentScoreAdjustment };
};

export const getOrdinal = (n: number | undefined) => {
    if (n === undefined) return '';
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Flips the horizontal coordinates of a path if the play occurs in the 2nd or 4th quarter.
 * This ensures the visualization always shows the team driving left-to-right.
 * @param path - The array of {x, y} coordinates (0-100).
 * @param quarter - The quarter the play occurred in.
 * @returns A new path array with potentially flipped coordinates.
 */
export const getVisuallyOrientedPath = (path: { x: number; y: number }[], quarter: number | undefined): { x: number; y: number }[] => {
    if (!path || !quarter) return path;

    const needsFlip = quarter === 2 || quarter === 4;

    if (needsFlip) {
        return path.map(point => ({
            x: 100 - point.x,
            y: point.y,
        }));
    }

    return path;
};


export const driveEndingResults: (PlayResult | undefined)[] = [
    // Scoring plays (TDs, FGs, Safeties) that end a possession
    PlayResult.PassTouchdown,
    PlayResult.RunTouchdown,
    PlayResult.InterceptionReturnTD,
    PlayResult.FumbleReturnTD,
    PlayResult.KickReturnTD,
    PlayResult.PuntReturnTD,
    PlayResult.BlockedPuntReturnTD,
    PlayResult.BlockedFieldGoalReturnTD,
    PlayResult.OffensiveFumbleRecoveryTD,
    PlayResult.OpponentTouchdownRun,
    PlayResult.OpponentTouchdownPass,
    PlayResult.OpponentScored,
    PlayResult.InterceptionReturnTD_Opponent,
    PlayResult.FumbleReturnTD_Opponent,
    PlayResult.FieldGoalGood, 
    PlayResult.OffensiveSafety,
    PlayResult.DefensiveSafety,

    // Turnovers that change possession
    PlayResult.InterceptionThrown, 
    PlayResult.FumbleLost, 
    PlayResult.FumbleTouchback,
    PlayResult.TurnoverOnDowns, 
    PlayResult.MuffedPuntLost, 
    PlayResult.OnsideKickLost,
    PlayResult.Interception, 
    PlayResult.FumbleRecovery,
    
    // Kicking plays that give up possession
    PlayResult.FieldGoalFailed,
    PlayResult.Punt, 
    PlayResult.PuntTouchback,
    PlayResult.PuntBlocked, 
    PlayResult.FieldGoalBlocked,
    PlayResult.PAT_Blocked,

    // Kickoffs explicitly transfer possession
    PlayResult.KickoffTackle,
    PlayResult.KickoffTouchback,
    PlayResult.KickoffOutOfBounds,
    PlayResult.KickoffReturnTD_Opponent,
];

export const calculateDrives = (playHistory: (Play & { __originalIndex?: number })[]): Drive[] => {
    if (playHistory.length === 0) return [];

    const allPlays = playHistory.map((play, index) => ({ 
        play, 
        originalIndex: play.__originalIndex ?? index 
    }));
    const driveGroups: { play: Play; originalIndex: number }[][] = [];
    let currentDrivePlays: { play: Play; originalIndex: number }[] = [];
    
    // Explicitly define possession. 'us' means Offense or Special Teams. 'opponent' means Defense.
    type PossessionTeam = 'us' | 'opponent';
    let currentPossessionTeam: PossessionTeam | null = null;

    const getPossessionTeam = (playType: PlayType): PossessionTeam => {
        return playType === PlayType.Defense ? 'opponent' : 'us';
    }

    for (const item of allPlays) {
        const lastPlayInDrive = currentDrivePlays.length > 0 ? currentDrivePlays[currentDrivePlays.length - 1].play : null;
        
        let playPossessionTeam = getPossessionTeam(item.play.type);

        // If the current play is a PAT, it belongs to the same "possession" as the preceding TD
        const resultString = item.play.playResult || '';
        const isPATPlay = resultString.includes('PAT') || resultString.includes('Conv.');
        if (isPATPlay && currentPossessionTeam) {
            playPossessionTeam = currentPossessionTeam; // Force PAT to belong to the previous drive's team
        }

        if (currentDrivePlays.length === 0) {
            currentDrivePlays.push(item);
            currentPossessionTeam = playPossessionTeam;
        } else {
            const endOfDrive = driveEndingResults.includes(lastPlayInDrive!.playResult) ||
                               currentPossessionTeam !== playPossessionTeam ||
                               (lastPlayInDrive!.quarter === 2 && item.play.quarter === 3);

            if (endOfDrive) {
                driveGroups.push(currentDrivePlays);
                currentDrivePlays = [item];
                currentPossessionTeam = playPossessionTeam;
            } else {
                currentDrivePlays.push(item);
            }
        }
    }
    if (currentDrivePlays.length > 0) {
        driveGroups.push(currentDrivePlays);
    }

    return driveGroups.map((drive, index) => {
        const firstPlay = drive[0].play;
        const lastPlay = drive[drive.length - 1].play;
        const yards = drive.reduce((sum, { play }) => sum + (play.yardsGained || 0), 0);
        
        const firstTime = parseGameTime(firstPlay.gameTime);
        const lastTime = parseGameTime(lastPlay.gameTime);
        const quarterSpan = (lastPlay.quarter || 1) - (firstPlay.quarter || 1);
        const topSeconds = (firstTime - lastTime) + (quarterSpan * 10 * 60);

        let result = "Drive Ended";
        const significantPlay = [...drive].reverse().find(({ play }) => driveEndingResults.includes(play.playResult))?.play;
        
        const touchdownPlay = [...drive].reverse().find(({play}) => play.playResult?.includes('Touchdown') || play.playResult?.includes('TD'))?.play;
        if (touchdownPlay?.playResult) {
            result = touchdownPlay.playResult;
        } else if (significantPlay?.playResult) {
            result = significantPlay.playResult;
        }
        
        const team = getPossessionTeam(firstPlay.type) === 'opponent' ? PlayType.Defense : PlayType.Offense;

        const calculateEndSpot = (play: Play): number => {
            const gain = play.yardsGained ?? 0;
            const start = play.startYardLine ?? 0;
            const effectiveGain = (play.type !== PlayType.Defense) ? gain : -gain;
            return Math.max(0, Math.min(100, start + effectiveGain));
        };

        const lastEndSpot = calculateEndSpot(lastPlay);

        return {
            driveNumber: index + 1,
            team,
            plays: drive,
            summary: {
                playCount: drive.length,
                yards,
                timeOfPossession: formatTime(topSeconds > 0 ? topSeconds : 0),
                result,
                startYardLine: firstPlay.startYardLine || 0,
                endYardLine: lastEndSpot
            }
        };
    });
};

export const parseSimpleMarkdown = (text: string): string => {
  // Replace **bold** with <strong>
  let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Replace numbered lists like "1. Item" with <ol><li>...
  // This regex finds blocks of numbered lines.
  html = html.replace(/(?:^\d+\.\s.*(?:\r\n|\n|$))+/gm, (match) => {
    const items = match.trim().split(/\r\n|\n/);
    const listItems = items.map(item => `<li>${item.replace(/^\d+\.\s/, '')}</li>`).join('');
    return `<ol>${listItems}</ol>`;
  });

  return html;
};

export const generatePlayDescription = (play: Play, playerMap: Map<string, Player>): string => {
    const yards = play.yardsGained ?? 0;
    const yardsStr = yards > 0 ? ` for ${yards} yards` : yards < 0 ? ` for a loss of ${Math.abs(yards)} yards` : ` for no gain`;

    const getName = (id?: string): string => {
        if (!id) return 'Player';
        const p = playerMap.get(id);
        if (!p) return 'Player';

        // 70% chance to say "Number X, Name", 30% to say "Position, Name"
        if (Math.random() < 0.7) {
            return `number ${p.jerseyNumber}, ${getLastName(p.name)}`;
        } else {
            return `${p.position}, ${getLastName(p.name)}`;
        }
    };

    const h = play.highlights || {};

    switch (play.playResult) {
        case PlayResult.PassCompleted:
        case PlayResult.PassCompletedOutOfBounds:
            return `${getName(h.passerId)} pass complete to ${getName(h.receiverId)}${yardsStr}.`;
        case PlayResult.PassIncomplete:
            return `${getName(h.passerId)} pass incomplete to ${getName(h.receiverId)}.`;
        case PlayResult.PassTouchdown:
            return `TOUCHDOWN! ${getName(h.passerId)} pass complete to ${getName(h.receiverId)} for ${yards} yards.`;
        case PlayResult.Run:
        case PlayResult.RunOutOfBounds:
            return `${getName(h.runnerId)} run${yardsStr}.`;
        case PlayResult.RunTouchdown:
            return `TOUCHDOWN! ${getName(h.runnerId)} run for ${yards} yards.`;
        case PlayResult.KneelDown:
            return `${getName(h.runnerId)} kneels down.`;
        case PlayResult.InterceptionThrown:
            return `INTERCEPTION! ${getName(h.passerId)} pass intended for ${getName(h.receiverId)} intercepted by ${getName(h.interceptorId)}.`;
        case PlayResult.FumbleLost:
            return `FUMBLE! ${getName(h.runnerId)} fumbles, recovered by the defense.`;
        case PlayResult.SackTaken:
            return `SACK! ${getName(h.passerId)} sacked${yardsStr}.`;
        case PlayResult.DefenseTackle:
            return `Tackle by ${getName(h.tacklerId)}.`;
        case PlayResult.DefenseTackleForLoss:
            return `Tackle for loss by ${getName(h.tacklerId)}.`;
        case PlayResult.DefenseSack:
            return `SACK! ${getName(h.tacklerId)} sacks the QB${yardsStr}.`;
        case PlayResult.FieldGoalGood:
            return `${getName(h.kickerId)} field goal is GOOD.`;
        case PlayResult.FieldGoalFailed:
            return `${getName(h.kickerId)} field goal is NO GOOD.`;
        case PlayResult.Punt:
            return `${getName(h.kickerId)} punts.`;
        case PlayResult.PenaltyAccepted:
            return `PENALTY on ${play.penaltyOn}, ${yards} yards.`;
        default:
            return play.playResult || "Play recorded.";
    }
};

export const generateSportscasterNarration = (play: Play, playerMap: Map<string, Player>, teamName: string, teamCity: string): string => {
    const yards = play.yardsGained ?? 0;
    const absYards = Math.abs(yards);
    const yardsStr = yards > 0 ? ` a gain of ${yards} yards` : yards < 0 ? ` a loss of ${absYards} yards` : ` no gain`;
    const h = play.highlights || {};

    const getName = (id?: string) => {
        if (!id) return 'an unassigned player';
        const p = playerMap.get(id);
        if (!p) return 'an unknown player';
        return `number ${p.jerseyNumber}, ${getLastName(p.name)}`;
    };

    const downOrdinal = play.down ? getOrdinal(play.down) : '';
    const downPrefix = downOrdinal ? `On ${downOrdinal} down, ` : '';
    
    let baseNarration = '';

    switch (play.playResult) {
        // High-impact plays
        case PlayResult.PassTouchdown:
            baseNarration = `TOUCHDOWN ${teamName.toUpperCase()}! A ${yards} yard strike from ${getName(h.passerId)} finds ${getName(h.receiverId)} in the endzone!`;
            break;
        case PlayResult.RunTouchdown:
            baseNarration = `HE'S IN! TOUCHDOWN! ${getName(h.runnerId)} powers through the defense for a ${yards} yard score!`;
            break;
        case PlayResult.InterceptionThrown:
            baseNarration = `PICKED OFF! ${downPrefix}the pass from ${getName(h.passerId)} is intercepted by ${getName(h.interceptorId)}! A huge turn of events.`;
            break;
        case PlayResult.InterceptionReturnTD:
             baseNarration = `PICK-SIX! ${getName(h.interceptorId)} intercepts the pass and takes it all the way to the house! What a play!`;
             break;
        case PlayResult.FumbleLost:
            baseNarration = `FUMBLE! The ball is loose! And it looks like the defense has recovered! A critical turnover.`;
            break;
        case PlayResult.SackTaken:
            baseNarration = `SACKED! ${downPrefix}the pocket collapses and ${getName(h.passerId)} is brought down for a loss of ${absYards}!`;
            break;
        case PlayResult.DefenseSack:
            baseNarration = `SACK ON THE PLAY! ${getName(h.tacklerId)} gets to the quarterback for a loss of ${absYards}.`;
            break;
        case PlayResult.FieldGoalGood:
            baseNarration = `The kick is up... and it's GOOD! ${getName(h.kickerId)} splits the uprights.`;
            break;
        case PlayResult.TurnoverOnDowns:
             baseNarration = `Turnover on downs! The offense couldn't convert, and the defense holds strong.`;
             break;
        
        // Standard plays
        case PlayResult.PassCompleted:
        case PlayResult.PassCompletedOutOfBounds:
            baseNarration = `${downPrefix}a pass from ${getName(h.passerId)}... caught by ${getName(h.receiverId)} for ${yardsStr}.`;
            break;
        case PlayResult.PassIncomplete:
            baseNarration = `${downPrefix}the pass from ${getName(h.passerId)} intended for ${getName(h.receiverId)} falls incomplete.`;
            break;
        case PlayResult.Run:
        case PlayResult.RunOutOfBounds:
            baseNarration = `${downPrefix}a hand off to ${getName(h.runnerId)}, brought down after a run for ${yardsStr}.`;
            break;
        case PlayResult.DefenseTackle:
            baseNarration = `A solid tackle on the play by ${getName(h.tacklerId)}.`;
            break;
        case PlayResult.DefenseTackleForLoss:
             baseNarration = `A stop in the backfield! Tackle for a loss by ${getName(h.tacklerId)}.`;
             break;
        case PlayResult.PenaltyAccepted:
            baseNarration = `There's a flag on the play. Penalty, ${play.penaltyOn}. That'll be a ${absYards} yard penalty.`;
            break;

        // Default fallback to the simpler description
        default:
            baseNarration = generatePlayDescription(play, playerMap);
            break;
    }

    const finalNarration: string[] = [baseNarration];

    if (Math.random() < 0.25) {
        const { ourScore = 0, opponentScore = 0, quarter = 1 } = play;
        const contextPhrases = [
            `The score is ${teamName} ${ourScore}, to ${opponentScore}.`,
            `Here in the ${getOrdinal(quarter)} quarter.`,
            `It's a beautiful day for some football here in ${teamCity}.`
        ];
        finalNarration.push(contextPhrases[Math.floor(Math.random() * contextPhrases.length)]);
    }
    
    return finalNarration.join(' ');
};
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Player, PlayerStatus, PlayType, Play, PlayResult } from '../types';
import { DEFAULT_PLAYER_IMAGE, ALL_POSITION_OPTIONS } from '../constants';
import { StarIcon, SpinnerIcon, CameraIcon, TrashIcon, SparklesIcon } from './icons';
import { useGameState } from '../contexts/GameStateContext';
import { formatPosition, parseSimpleMarkdown, getOrdinal } from '../utils';
import { GoogleGenAI } from "@google/genai";
import { getAllTeamPlaysForSeason } from '../firebase';

import ConfirmationModal from './ConfirmationModal';

interface PlayerStatusModalProps {
    player: Player;
    onClose: () => void;
    onSave: (playerId: string, updates: Partial<Player>) => void;
    onDelete: (playerId: string) => void;
}

const PlayerStatusModal: React.FC<PlayerStatusModalProps> = ({ player, onClose, onSave, onDelete }) => {
    const [status, setStatus] = useState(player.status);
    const [jersey, setJersey] = useState(player.jerseyNumber.toString());
    
    // Parse name: "LastName, FirstName"
    const nameParts = player.name.split(', ');
    const initialLastName = nameParts[0] || '';
    const initialFirstName = nameParts[1] || '';
    
    const [firstName, setFirstName] = useState(initialFirstName);
    const [lastName, setLastName] = useState(initialLastName);
    const [imageUrl, setImageUrl] = useState(player.imageUrl || DEFAULT_PLAYER_IMAGE);
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { 
        handleSetPlayerAsStarter, 
        playHistory,
        seasonWeeks,
        opponentNames,
        homeAwayStatus,
        weekResults,
        selectedWeek,
        user
    } = useGameState();

    const [seasonPlays, setSeasonPlays] = useState<Play[]>([]);
    const [isLoadingSeasonStats, setIsLoadingSeasonStats] = useState(false);

    useEffect(() => {
        if (!user?.uid || !seasonWeeks.length) return;
        setIsLoadingSeasonStats(true);
        getAllTeamPlaysForSeason(user.uid, seasonWeeks).then(plays => {
            const playsForPlayer = plays.filter(p => {
                // Ensure we handle both Set and Array for playerIds due to serialization
                const ids = p.playerIds as any;
                return (ids instanceof Set ? ids.has(player.id) : (Array.isArray(ids) ? ids.includes(player.id) : false));
            });
            setSeasonPlays(playsForPlayer);
        }).finally(() => {
            setIsLoadingSeasonStats(false);
        });
    }, [user?.uid, seasonWeeks, player.id]);

    const [analysis, setAnalysis] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);

    const playerPlays = useMemo(() => {
        return playHistory.filter(p => p.playerIds.has(player.id));
    }, [playHistory, player.id]);

    const offensePlays = playerPlays.filter(p => p.type === PlayType.Offense).length;
    const defensePlays = playerPlays.filter(p => p.type === PlayType.Defense).length;
    const specialPlays = playerPlays.filter(p => p.type === PlayType.SpecialTeams).length;
    const totalPlays = playerPlays.length;

    const seasonStats = useMemo(() => {
        let passYds = 0, passAtt = 0;
        let rushYds = 0, rushAtt = 0;
        let recYds = 0, recAtt = 0;
        let tackles = 0, ints = 0;
        let kickRetYds = 0, puntRetYds = 0;
        let fgMade = 0;

        seasonPlays.forEach(play => {
            const yds = play.yardsGained || 0;
            if (play.highlights) {
                if (play.highlights.passerId === player.id) { passAtt++; passYds += yds; }
                if (play.highlights.runnerId === player.id) { rushAtt++; rushYds += yds; }
                if (play.highlights.receiverId === player.id) { recAtt++; recYds += yds; }
                if (play.highlights.tacklerId === player.id) tackles++;
                if (play.highlights.interceptorId === player.id) ints++;
                if (play.highlights.returnerId === player.id) {
                    if (play.playResult === PlayResult.KickReturn || play.playResult === PlayResult.KickReturnTD) kickRetYds += yds;
                    if (play.playResult === PlayResult.PuntReturn || play.playResult === PlayResult.PuntReturnTD) puntRetYds += yds;
                }
                if (play.highlights.kickerId === player.id && play.playResult === PlayResult.FieldGoalGood) {
                    fgMade++;
                }
            }
        });

        return { passYds, passAtt, rushYds, rushAtt, recYds, recAtt, tackles, ints, kickRetYds, puntRetYds, fgMade };
    }, [seasonPlays, player.id]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => setImageUrl(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        const updates: Partial<Player> = {};
        if (status !== player.status) updates.status = status;
        const jerseyNum = parseInt(jersey, 10);
        if (jerseyNum !== player.jerseyNumber) updates.jerseyNumber = jerseyNum;
        
        const newFullName = `${lastName.trim()}, ${firstName.trim()}`;
        if (newFullName !== player.name) updates.name = newFullName;
        if (imageUrl !== player.imageUrl) updates.imageUrl = imageUrl;
        
        await onSave(player.id, updates);
        setIsSaving(false);
    };

    const handleDelete = () => {
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        onDelete(player.id);
        setShowDeleteConfirm(false);
    };

    const generateAnalysis = async () => {
        setIsGenerating(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
            const prompt = `You are a youth football coach. Analyze the performance of player ${player.name} (Jersey #${player.jerseyNumber}). 
            They have participated in ${totalPlays} total plays: ${offensePlays} offense, ${defensePlays} defense, and ${specialPlays} special teams plays.
            Here is their play history summary: ${JSON.stringify(playerPlays.map(p => ({ 
                type: p.type, 
                down: p.down, 
                distance: p.distance, 
                formation: p.formationName, 
                result: p.playResult, 
                yards: p.yardsGained 
            }))) }.
            Provide a short, encouraging 2-3 paragraph scouting report and player profile based on this data.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setAnalysis(response.text || 'No analysis generated.');
        } catch (error) {
            console.error(error);
            setAnalysis('Failed to generate analysis.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 xl:p-8 overflow-y-auto" onClick={onClose}>
            <div className="glass-effect rounded-2xl shadow-2xl w-full max-w-4xl my-auto border border-[var(--border-primary)] overflow-hidden flex flex-col max-h-[90vh] animate-fade-in" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Player Profile & Stats</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={handleDelete} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-full" title="Delete Player"><TrashIcon className="w-5 h-5" /></button>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-[var(--text-secondary)]" aria-label="Close">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </header>
                
                <main className="p-6 space-y-8 overflow-y-auto">
                    {/* Top Section: Edit Info & Basic Stats */}
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Edit Info (Left) */}
                        <div className="flex-1 space-y-6">
                            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">Edit Details</h3>
                            <div className="flex items-start gap-4">
                                <div className="relative flex-shrink-0">
                                    <img src={imageUrl} alt={player.name} referrerPolicy="no-referrer" className="w-24 h-24 rounded-full object-cover aspect-square flex-shrink-0" />
                                    <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-gray-800 p-2 rounded-full border-2 border-[var(--bg-secondary)] hover:bg-gray-700">
                                        <CameraIcon className="w-5 h-5 text-white" />
                                    </button>
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                                </div>
                                <div className="flex-grow space-y-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="col-span-1">
                                            <label htmlFor="jerseyNumber" className="block text-sm font-medium text-[var(--text-secondary)]">Jersey #</label>
                                            <input type="number" id="jerseyNumber" value={jersey} onChange={e => setJersey(e.target.value)} className="mt-1 w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md py-2 px-3 text-[var(--text-primary)]" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="firstName" className="block text-sm font-medium text-[var(--text-secondary)]">First Name</label>
                                            <input type="text" id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} className="mt-1 w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md py-2 px-3 text-[var(--text-primary)]" />
                                        </div>
                                        <div>
                                            <label htmlFor="lastName" className="block text-sm font-medium text-[var(--text-secondary)]">Last Name</label>
                                            <input type="text" id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} className="mt-1 w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-md py-2 px-3 text-[var(--text-primary)]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-secondary)]">Status</label>
                                <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {Object.values(PlayerStatus).map(s => (
                                        <button key={s} onClick={() => setStatus(s)} className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors ${status === s ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-primary)]'}`}>{s}</button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Stats Summary (Right) */}
                        <div className="md:w-1/3 space-y-4">
                            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2">Participation Stats</h3>
                            <div className="bg-[var(--bg-tertiary)] rounded-xl p-4 border border-[var(--border-primary)] space-y-4 flex flex-col">
                                <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-[var(--border-primary)]/50">
                                    <span className="text-sm font-medium text-[var(--text-secondary)] uppercase">Total Snaps</span>
                                    <span className="text-2xl font-black text-white">{totalPlays}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="bg-black/20 p-2 rounded-lg border border-[var(--border-primary)]/50 text-center flex flex-col justify-center">
                                        <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Offense</span>
                                        <span className="text-xl font-bold text-blue-400">{offensePlays}</span>
                                    </div>
                                    <div className="bg-black/20 p-2 rounded-lg border border-[var(--border-primary)]/50 text-center flex flex-col justify-center">
                                        <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Defense</span>
                                        <span className="text-xl font-bold text-red-400">{defensePlays}</span>
                                    </div>
                                    <div className="bg-black/20 p-2 rounded-lg border border-[var(--border-primary)]/50 text-center flex flex-col justify-center">
                                        <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Special</span>
                                        <span className="text-xl font-bold text-orange-400">{specialPlays}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr className="border-[var(--border-primary)]" />

                    {/* Season Stats Section */}
                    {isLoadingSeasonStats ? (
                        <div className="flex justify-center items-center py-4">
                            <SpinnerIcon className="w-6 h-6 text-[var(--accent-primary)] animate-spin" />
                            <span className="ml-2 text-[var(--text-secondary)] text-sm">Loading season stats...</span>
                        </div>
                    ) : seasonPlays.length > 0 ? (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Calculated Season Stats</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {(seasonStats.passAtt > 0 || seasonStats.passYds > 0) && (
                                    <div className="bg-[var(--bg-tertiary)] p-3 rounded-lg border border-[var(--border-primary)]">
                                        <div className="text-xs text-[var(--text-secondary)] uppercase font-bold mb-1">Passing</div>
                                        <div className="text-lg font-bold text-white">{seasonStats.passAtt} <span className="text-sm text-[var(--text-secondary)] font-normal">att</span> / {seasonStats.passYds} <span className="text-sm text-[var(--text-secondary)] font-normal">yds</span></div>
                                    </div>
                                )}
                                {(seasonStats.rushAtt > 0 || seasonStats.rushYds > 0) && (
                                    <div className="bg-[var(--bg-tertiary)] p-3 rounded-lg border border-[var(--border-primary)]">
                                        <div className="text-xs text-[var(--text-secondary)] uppercase font-bold mb-1">Rushing</div>
                                        <div className="text-lg font-bold text-white">{seasonStats.rushAtt} <span className="text-sm text-[var(--text-secondary)] font-normal">att</span> / {seasonStats.rushYds} <span className="text-sm text-[var(--text-secondary)] font-normal">yds</span></div>
                                    </div>
                                )}
                                {(seasonStats.recAtt > 0 || seasonStats.recYds > 0) && (
                                    <div className="bg-[var(--bg-tertiary)] p-3 rounded-lg border border-[var(--border-primary)]">
                                        <div className="text-xs text-[var(--text-secondary)] uppercase font-bold mb-1">Receiving</div>
                                        <div className="text-lg font-bold text-white">{seasonStats.recAtt} <span className="text-sm text-[var(--text-secondary)] font-normal">rec</span> / {seasonStats.recYds} <span className="text-sm text-[var(--text-secondary)] font-normal">yds</span></div>
                                    </div>
                                )}
                                {seasonStats.tackles > 0 && (
                                    <div className="bg-[var(--bg-tertiary)] p-3 rounded-lg border border-[var(--border-primary)]">
                                        <div className="text-xs text-[var(--text-secondary)] uppercase font-bold mb-1">Tackles</div>
                                        <div className="text-lg font-bold text-white">{seasonStats.tackles}</div>
                                    </div>
                                )}
                                {seasonStats.ints > 0 && (
                                    <div className="bg-[var(--bg-tertiary)] p-3 rounded-lg border border-[var(--border-primary)]">
                                        <div className="text-xs text-[var(--text-secondary)] uppercase font-bold mb-1">Interceptions</div>
                                        <div className="text-lg font-bold text-white">{seasonStats.ints}</div>
                                    </div>
                                )}
                                {seasonStats.kickRetYds > 0 && (
                                    <div className="bg-[var(--bg-tertiary)] p-3 rounded-lg border border-[var(--border-primary)]">
                                        <div className="text-xs text-[var(--text-secondary)] uppercase font-bold mb-1">Kick Ret Yds</div>
                                        <div className="text-lg font-bold text-white">{seasonStats.kickRetYds}</div>
                                    </div>
                                )}
                                {seasonStats.puntRetYds > 0 && (
                                    <div className="bg-[var(--bg-tertiary)] p-3 rounded-lg border border-[var(--border-primary)]">
                                        <div className="text-xs text-[var(--text-secondary)] uppercase font-bold mb-1">Punt Ret Yds</div>
                                        <div className="text-lg font-bold text-white">{seasonStats.puntRetYds}</div>
                                    </div>
                                )}
                                {seasonStats.fgMade > 0 && (
                                    <div className="bg-[var(--bg-tertiary)] p-3 rounded-lg border border-[var(--border-primary)]">
                                        <div className="text-xs text-[var(--text-secondary)] uppercase font-bold mb-1">Field Goals</div>
                                        <div className="text-lg font-bold text-white">{seasonStats.fgMade}</div>
                                    </div>
                                )}
                                {seasonStats.passAtt === 0 && seasonStats.rushAtt === 0 && seasonStats.recAtt === 0 && seasonStats.tackles === 0 && seasonStats.ints === 0 && seasonStats.kickRetYds === 0 && seasonStats.puntRetYds === 0 && seasonStats.fgMade === 0 && (
                                    <div className="col-span-full py-4 text-center text-[var(--text-secondary)] text-sm">
                                        No major stats recorded for {firstName} this season.
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}

                    {seasonPlays.length > 0 && <hr className="border-[var(--border-primary)]" />}

                    {/* Recent Games Section */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Recent Games</h3>
                        <div className="overflow-x-auto rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
                            <table className="w-full text-left text-sm text-[var(--text-secondary)]">
                                <thead className="bg-black/20 text-xs uppercase border-b border-[var(--border-primary)]">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold text-[var(--text-primary)]">Week</th>
                                        <th className="px-4 py-3 font-semibold text-[var(--text-primary)]">Opponent</th>
                                        <th className="px-4 py-3 font-semibold text-[var(--text-primary)]">Result</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {seasonWeeks.slice(0, Math.max(1, seasonWeeks.indexOf(selectedWeek) + 1)).reverse().map(week => {
                                        const opp = opponentNames[week] || 'TBD';
                                        const ha = homeAwayStatus[week] === 'Home' ? 'vs' : '@';
                                        const result = weekResults[week];
                                        let resultText = 'Upcoming';
                                        let resultColor = 'text-[var(--text-secondary)]';
                                        if (result && typeof result.ourScore !== 'undefined') {
                                            const isWin = result.ourScore > result.opponentScore;
                                            const isLoss = result.ourScore < result.opponentScore;
                                            resultColor = isWin ? 'text-green-400' : isLoss ? 'text-red-400' : 'text-yellow-400';
                                            resultText = `${isWin ? 'W' : isLoss ? 'L' : 'T'} ${result.ourScore}-${result.opponentScore}`;
                                        }
                                        return (
                                            <tr key={week} className={`border-b border-[var(--border-primary)]/50 last:border-0 ${week === selectedWeek ? 'bg-[var(--accent-primary)]/10' : ''}`}>
                                                <td className="px-4 py-3 font-medium flex items-center gap-2">{week} {week === selectedWeek && <span className="px-1.5 py-0.5 rounded-sm bg-lime-400 text-black text-[9px] font-bold uppercase">Current</span>}</td>
                                                <td className="px-4 py-3">{ha} {opp}</td>
                                                <td className={`px-4 py-3 font-bold ${resultColor}`}>{resultText}</td>
                                            </tr>
                                        );
                                    })}
                                    {seasonWeeks.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-6 text-center text-[var(--text-secondary)]">No schedule found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <hr className="border-[var(--border-primary)]" />

                    {/* AI Player Analysis Section */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">AI Player Analysis</h3>
                            <button 
                                onClick={generateAnalysis} 
                                disabled={isGenerating || totalPlays === 0}
                                className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white font-bold rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? <SpinnerIcon className="w-4 h-4" /> : <SparklesIcon className="w-4 h-4" />}
                                {isGenerating ? 'Analyzing...' : 'Generate AI Profile'}
                            </button>
                        </div>
                        <div className="bg-[var(--bg-tertiary)] p-5 rounded-xl border border-[var(--border-primary)] min-h-[120px]">
                            {analysis ? (
                                <div className="prose prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(analysis) }} />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-[var(--text-secondary)] text-sm py-6">
                                    {totalPlays > 0 ? (
                                        <p>Click "Generate AI Profile" to analyze {firstName}'s performance.</p>
                                    ) : (
                                        <p>No play history available for analysis yet.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
                
                <footer className="p-4 border-t border-[var(--border-primary)] flex justify-between items-center flex-shrink-0">
                    <button onClick={() => handleSetPlayerAsStarter(player.id)} className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-300 font-bold rounded-lg hover:bg-yellow-500/30 text-sm">
                        <StarIcon className="w-5 h-5" /> Set as Starter
                    </button>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-6 py-2 bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] rounded-lg hover:bg-[var(--border-primary)] transition-colors font-medium">Cancel</button>
                        <button onClick={handleSave} disabled={isSaving} className="flex items-center justify-center gap-2 px-6 py-2 bg-[var(--accent-primary)] text-sm text-white font-bold rounded-lg hover:bg-[var(--accent-primary-hover)] disabled:bg-gray-500 transition-all">
                            {isSaving ? <SpinnerIcon className="w-5 h-5" /> : 'Save'}
                        </button>
                    </div>
                </footer>
                
                <ConfirmationModal 
                    isOpen={showDeleteConfirm} 
                    onClose={() => setShowDeleteConfirm(false)} 
                    onConfirm={confirmDelete} 
                    title="Delete Player" 
                    message={`Are you sure you want to delete ${player.name}? This will remove them from all weeks and cannot be undone.`} 
                />
            </div>
        </div>
    );
};

export default PlayerStatusModal;

import React, { useMemo, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import PlaybookWidget from './PlaybookWidget';
import PlayDetailsModal from './PlayDetailsModal';
import WaveSubModal from './WaveSubModal';
import { Player, FormationCollection, PlayType, PlayerStatus, SelectablePlayType } from '../types';
import { useGameState } from '../contexts/GameStateContext';
import { StarIcon } from './icons';
import { OFFENSE_DISPLAY_GROUPS, DEFENSE_DISPLAY_GROUPS, ST_DISPLAY_GROUPS } from '../constants';

const PLAY_TYPE_CONFIG = {
    [PlayType.Offense]: {
        activeTabClass: 'border-[var(--accent-secondary)] text-[var(--accent-secondary)]',
    },
    [PlayType.Defense]: {
        activeTabClass: 'border-[var(--accent-defense)] text-[var(--accent-defense)]',
    },
    [PlayType.SpecialTeams]: {
        activeTabClass: 'border-[var(--accent-special)] text-[var(--accent-special)]',
    },
};

const TABS: SelectablePlayType[] = [PlayType.Offense, PlayType.Defense, PlayType.SpecialTeams];
const Dashboard: React.FC = () => {
    const { 
        players, offenseFormations, defenseFormations, specialTeamsFormations,
        handleLineupConfirm, playHistory, currentLineups, handleUpdateLineup,
        playbookTab, setPlaybookTab, selectedFormationName, setSelectedFormationName,
        insertionIndex, handleCancelInsert, handleSetFormationAsDefault,
        depthChart,
        handleResetLineupToDefault,
        isPlayDetailsModalOpen,
    } = useGameState();

    const [assignments, setAssignments] = useState<(Player | null)[]>([]);
    const [lineupIds, setLineupIds] = useState<(string | null)[]>([]);
    const [waveSubState, setWaveSubState] = useState<{ isOpen: boolean; stagedSlotIndex: number | null }>({ isOpen: false, stagedSlotIndex: null });

    const modalRoot = document.getElementById('modal-root');

    const playingPlayers = useMemo(() => players.filter(p => p.status === PlayerStatus.Playing), [players]);
    const playingPlayerIds = useMemo(() => new Set(playingPlayers.map(p => p.id)), [playingPlayers]);
  
    const formations = useMemo(() => {
        switch (playbookTab) {
            case PlayType.Defense: return defenseFormations;
            case PlayType.SpecialTeams: return specialTeamsFormations;
            case PlayType.Offense: default: return offenseFormations;
        }
    }, [playbookTab, offenseFormations, defenseFormations, specialTeamsFormations]);

    useEffect(() => {
        if (!formations[selectedFormationName]) {
            const firstFormationName = Object.keys(formations)[0];
            if (firstFormationName) {
                setSelectedFormationName(firstFormationName);
            } else {
                setSelectedFormationName('');
            }
        }
    }, [formations, selectedFormationName, setSelectedFormationName]);

    const formationData = useMemo(() => formations[selectedFormationName], [formations, selectedFormationName]);
    const formationPositions = useMemo(() => formationData?.positions || [], [formationData]);

    useEffect(() => {
        if (!selectedFormationName) {
            setLineupIds([]);
            return;
        }

        const getInitialLineupIds = () => {
            const finalLineup = new Array(formationPositions.length).fill(null);
            const usedPlayerIds = new Set<string>();

            let presetLineup: (string | null)[] = [];

            // 1. Prioritize current lineup saved in the session state for in-game edits
            if (currentLineups[selectedFormationName]) {
                presetLineup = currentLineups[selectedFormationName];
            } else if (formationData?.presetPlayerIds) {
                // 2. Check for preset player IDs in the formation definition
                presetLineup = formationData.presetPlayerIds;
            } else if (formationData?.presetPlayerJerseys) {
                // 3. Fallback for legacy preset jersey numbers
                const jerseyToIdMap = new Map(players.map(p => [p.jerseyNumber, p.id]));
                presetLineup = (formationData.presetPlayerJerseys || []).map(jersey => (jersey ? jerseyToIdMap.get(jersey) || null : null));
            }

            // A. Pre-fill slots with explicitly valid preset players
            presetLineup.forEach((playerId, index) => {
                if (index < finalLineup.length && playerId && playingPlayerIds.has(playerId) && !usedPlayerIds.has(playerId)) {
                    finalLineup[index] = playerId;
                    usedPlayerIds.add(playerId);
                }
            });

            // B. Fill remaining null slots using the depth chart
            const allDisplayGroups = { ...OFFENSE_DISPLAY_GROUPS, ...DEFENSE_DISPLAY_GROUPS, ...ST_DISPLAY_GROUPS };
            const groupPriority = [
                ...Object.keys(OFFENSE_DISPLAY_GROUPS),
                ...Object.keys(DEFENSE_DISPLAY_GROUPS),
                ...Object.keys(ST_DISPLAY_GROUPS)
            ];

            const genericGroupUsageCounter: Record<string, number> = {};

            formationPositions.forEach((position, index) => {
                if (finalLineup[index] !== null) {
                    return; // Slot already filled by preset/current
                }

                const posLabel = position.label.toUpperCase();
                
                let potentialGroups = groupPriority.filter(groupName => 
                    allDisplayGroups[groupName]?.includes(posLabel)
                );

                if (potentialGroups.length === 0 && depthChart[posLabel]) {
                    potentialGroups = [posLabel];
                }

                if (potentialGroups.length === 0) {
                    return; // No matching group for this position label, skip.
                }

                const groupIndexToTry = genericGroupUsageCounter[posLabel] || 0;
                const groupNameToUse = potentialGroups[groupIndexToTry % potentialGroups.length];
                
                if (groupNameToUse && depthChart[groupNameToUse]) {
                    for (const playerId of depthChart[groupNameToUse]) {
                        if (playerId && !usedPlayerIds.has(playerId) && playingPlayerIds.has(playerId)) {
                            finalLineup[index] = playerId;
                            usedPlayerIds.add(playerId);
                            genericGroupUsageCounter[posLabel] = groupIndexToTry + 1;
                            break; 
                        }
                    }
                }
            });
            
            return finalLineup;
        };
    
        const initialIds = getInitialLineupIds();
        const finalIds = new Array(formationPositions.length).fill(null);
        initialIds.forEach((id, index) => {
            if (index < finalIds.length) {
                finalIds[index] = id;
            }
        });

        setLineupIds(finalIds);
    }, [selectedFormationName, formationPositions, currentLineups, depthChart, players, formationData, playingPlayerIds, setSelectedFormationName]);

    useEffect(() => {
      const playerMap = new Map(playingPlayers.map(p => [p.id, p]));
      const hydratedAssignments = lineupIds.map(id => {
        if (!id) return null;
        const player = playerMap.get(id); 
        return player || null;
      });
      setAssignments(hydratedAssignments);
    }, [lineupIds, playingPlayers]);

    const onFieldPlayers = useMemo(() => new Set(assignments.filter((p): p is Player => p !== null).map(p => p.id)), [assignments]);
    const isLineupComplete = useMemo(() => formationPositions.length > 0 && onFieldPlayers.size === formationPositions.length, [onFieldPlayers.size, formationPositions.length]);

    const handleConfirm = () => {
        handleLineupConfirm(playbookTab, onFieldPlayers, selectedFormationName, lineupIds);
    };

    const handleConfirmSubstitutions = (newAssignments: (Player | null)[]) => {
        const newLineupIds = newAssignments.map(p => p ? p.id : null);
        handleUpdateLineup(selectedFormationName, newLineupIds, playbookTab);
        setWaveSubState({ isOpen: false, stagedSlotIndex: null });
    };

    const handleSlotClick = (index: number) => {
        setWaveSubState({ isOpen: true, stagedSlotIndex: index });
    };

    const handleSmartRoster = () => {
        if (!selectedFormationName || !formationData) return;

        const usedPlayerIds = new Set<string>();
        const depthChartLineup = new Array(formationPositions.length).fill(null);
        const allDisplayGroups = { ...OFFENSE_DISPLAY_GROUPS, ...DEFENSE_DISPLAY_GROUPS, ...ST_DISPLAY_GROUPS };

        const groupPriority = [
            ...Object.keys(OFFENSE_DISPLAY_GROUPS),
            ...Object.keys(DEFENSE_DISPLAY_GROUPS),
            ...Object.keys(ST_DISPLAY_GROUPS)
        ];

        const genericGroupUsageCounter: Record<string, number> = {};

        formationPositions.forEach((position, index) => {
            const posLabel = position.label.toUpperCase();
            
            const potentialGroups = groupPriority.filter(groupName => 
                allDisplayGroups[groupName].includes(posLabel)
            );

            if (potentialGroups.length === 0) return;

            const groupIndexToTry = genericGroupUsageCounter[posLabel] || 0;
            const groupNameToUse = potentialGroups[groupIndexToTry % potentialGroups.length];
            
            if (groupNameToUse && depthChart[groupNameToUse]) {
                for (const playerId of depthChart[groupNameToUse]) {
                    if (playerId && !usedPlayerIds.has(playerId) && playingPlayerIds.has(playerId)) {
                        depthChartLineup[index] = playerId;
                        usedPlayerIds.add(playerId);
                        genericGroupUsageCounter[posLabel] = groupIndexToTry + 1;
                        break;
                    }
                }
            }
        });

        handleUpdateLineup(selectedFormationName, depthChartLineup, playbookTab);
    };

    return (
      <>
        <div className="bg-[var(--bg-secondary)] shadow-2xl border border-[var(--border-primary)] w-full flex flex-col relative rounded-xl overflow-hidden">
            {insertionIndex !== null && (
                <div className="p-3 bg-[var(--accent-primary)]/20 border-b border-[var(--accent-primary)] flex justify-between items-center text-sm">
                    <p className="font-semibold text-[var(--accent-primary)]">
                        Inserting new play before Play #{insertionIndex + 1}. Select formation and confirm lineup.
                    </p>
                    <button onClick={handleCancelInsert} className="px-3 py-1 bg-red-500/20 text-red-300 rounded-md font-semibold hover:bg-red-500/40">
                        Cancel Insert
                    </button>
                </div>
            )}
            <header className="flex justify-between items-center border-b border-[var(--border-primary)] px-4 py-1.5 flex-shrink-0 gap-4">
                <div className="flex items-center">
                    {TABS.map(tab => {
                        const isActive = playbookTab === tab;
                        const config = PLAY_TYPE_CONFIG[tab];
                        return (
                            <button
                                key={tab}
                                onClick={() => setPlaybookTab(tab)}
                                className={`py-2 px-4 font-bold border-b-2 transition-colors duration-200 text-base ${isActive ? config.activeTabClass : 'border-transparent text-[var(--text-secondary)] hover:text-white'}`}
                            >
                                {tab}
                            </button>
                        )
                    })}
                </div>
                <div className="flex items-center gap-2">
                       <button onClick={handleSmartRoster} className="px-3 py-1.5 text-xs font-semibold bg-[var(--accent-primary)] text-[var(--accent-button-text-color)] rounded-md hover:bg-[var(--accent-primary-hover)] transition-colors">Smart Roster</button>
                </div>
            </header>
            <PlaybookWidget
                players={playingPlayers}
                activeTab={playbookTab}
                formations={formations}
                selectedFormationName={selectedFormationName}
                setSelectedFormationName={setSelectedFormationName}
                assignments={assignments}
                setAssignments={setAssignments}
                onFieldPlayers={onFieldPlayers}
                isLineupComplete={isLineupComplete}
                formationPositions={formationPositions}
                handleConfirm={handleConfirm}
                handleSlotClick={handleSlotClick}
                nextPlayNumber={playHistory.length + 1}
            />
        </div>
        {isPlayDetailsModalOpen && <PlayDetailsModal />}
        {waveSubState.isOpen && modalRoot && createPortal(
            <WaveSubModal
                isOpen={waveSubState.isOpen}
                onClose={() => setWaveSubState({ isOpen: false, stagedSlotIndex: null })}
                onConfirm={handleConfirmSubstitutions}
                allPlayers={playingPlayers}
                currentAssignments={assignments}
                formationPositions={formationPositions}
                stagedSlotIndex={waveSubState.stagedSlotIndex}
            />,
            modalRoot
        )}
      </>
    );
};

export default Dashboard;
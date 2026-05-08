import React, { useMemo } from 'react';
import { Player } from '../types';
import { useGameState } from '../contexts/GameStateContext';
import { DEFAULT_PLAYER_IMAGE } from '../constants';
import { getLastName } from '../utils';

const PlayerChip: React.FC<{ player: Player }> = ({ player }) => {
    const totalSnaps = player.offensePlayCount + player.defensePlayCount + player.specialTeamsPlayCount;
    
    return (
        <div className="bg-[var(--bg-tertiary)] p-2 rounded-lg flex items-center gap-3">
            <img src={player.imageUrl || DEFAULT_PLAYER_IMAGE} alt={player.name} className="w-10 h-10 rounded-full object-cover" />
            <div className="flex-grow min-w-0">
                <p className="font-bold text-sm text-[var(--text-primary)] truncate">#{player.jerseyNumber} {getLastName(player.name)}</p>
                <p className="text-xs text-[var(--text-secondary)]">{player.position}</p>
            </div>
            <div className="text-right">
                <p className="font-mono font-bold text-lg text-[var(--accent-primary)]">{totalSnaps}</p>
                <p className="text-xs text-[var(--text-secondary)]">Snaps</p>
            </div>
        </div>
    );
};


const OnFieldStatusView: React.FC = () => {
    const { players, playHistory } = useGameState();

    const { onField, onSideline } = useMemo(() => {
        const lastPlay = playHistory.length > 0 ? playHistory[playHistory.length - 1] : null;
        const sortedPlayers = [...players].sort((a,b) => a.jerseyNumber - b.jerseyNumber);

        if (!lastPlay) {
            return { onField: [], onSideline: sortedPlayers };
        }
        
        const onFieldPlayers = sortedPlayers.filter(p => lastPlay.playerIds.has(p.id));
        const onSidelinePlayers = sortedPlayers.filter(p => !lastPlay.playerIds.has(p.id));
        return { onField: onFieldPlayers, onSideline: onSidelinePlayers };
    }, [playHistory, players]);


    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            <div className="bg-[var(--bg-primary)] p-3 rounded-lg flex flex-col">
                <h3 className="text-lg font-bold text-center text-green-400 mb-3 flex-shrink-0">On Field ({onField.length})</h3>
                <div className="overflow-y-auto space-y-2 flex-grow pr-1 no-scrollbar">
                    {onField.map(player => <PlayerChip key={player.id} player={player} />)}
                    {onField.length === 0 && <p className="text-center text-sm text-[var(--text-secondary)] pt-8">No players on field for the last play.</p>}
                </div>
            </div>
            <div className="bg-[var(--bg-primary)] p-3 rounded-lg flex flex-col">
                <h3 className="text-lg font-bold text-center text-yellow-400 mb-3 flex-shrink-0">On Sideline ({onSideline.length})</h3>
                 <div className="overflow-y-auto space-y-2 flex-grow pr-1 no-scrollbar">
                    {onSideline.map(player => <PlayerChip key={player.id} player={player} />)}
                     {onSideline.length === 0 && <p className="text-center text-sm text-[var(--text-secondary)] pt-8">All players are on the field.</p>}
                </div>
            </div>
        </div>
    );
};

export default OnFieldStatusView;

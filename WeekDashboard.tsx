import React, { useState } from 'react';
import { GameStateProvider } from '../contexts/GameStateContext';
import TeamSearchScreen from './TeamSearchScreen';
import ViewerExperience from './ViewerExperience';

const ViewerContainer: React.FC = () => {
    const [viewingTeamId, setViewingTeamId] = useState<string | null>(null);

    if (viewingTeamId) {
        // We have selected a team to view. Now, we create a "fake" user object
        // for GameStateProvider that has the ID of the team we are viewing.
        const viewingUser = { uid: viewingTeamId };
        return (
            <GameStateProvider user={viewingUser} initialShowWalkthrough={false}>
                <ViewerExperience onBack={() => setViewingTeamId(null)} />
            </GameStateProvider>
        );
    } else {
        return <TeamSearchScreen onTeamSelect={(teamId) => setViewingTeamId(teamId)} />;
    }
};

export default ViewerContainer;

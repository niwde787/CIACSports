import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { GameStateProvider, useGameState } from './contexts/GameStateContext';
import LoginScreen from './components/LoginScreen';
import MainMenuScreen from './components/MainMenuScreen';
import WelcomeScreen from './components/WelcomeScreen';
import RoleSelectionScreen from './components/RoleSelectionScreen';
import ViewerContainer from './components/ViewerContainer';
import AdminContainer from './components/AdminContainer';
import { onAuthStateChanged, db, setUserRoleInDb, initializeNewUser } from './firebase';
import { SpinnerIcon } from './components/icons';
import { PlayType, GameStateContextType } from './types';
import TopHeader from './components/TopHeader';
import WeekDashboard from './components/WeekDashboard';
import Dashboard from './components/Dashboard';
import DepthChart from './components/PlayerTable';
import PlayLog from './components/PlayLog';
import FormationManager from './components/FormationManager';
import InsightsView from './components/InsightsView';
import LeaderboardView from './components/LeaderboardView';
import PlayDetailsModal from './components/PlayDetailsModal';
import EditPlayModal from './components/EditPlayModal';
import GameSummaryModal from './components/GameSummaryModal';
import ReportsModal from './components/FinalizeGameModal';
import QuarterSummaryModal from './components/QuarterSummaryModal';
import FormationEditorModal from './components/FormationEditorModal';
import ImportModal from './components/ImportModal';
import SettingsModal from './components/SettingsModal';
import WeekSelectorModal from './components/WeekSelectorModal';
import AddPlayerModal from './components/AddPlayerModal';
import PlayerStatusModal from './components/PlayerStatusModal';
import CoinTossModal from './components/CoinTossModal';
import FourthDownModal from './components/FourthDownModal';
import AddEventModal from './components/AddEventModal';
import ClockFab from './components/ClockFab';
import Toast from './components/Toast';
import WalkthroughModal from './components/WalkthroughModal';
import { BottomNavBar } from './components/BottomNavBar';
import LiveActivityBar from './components/LiveActivityBar';
import SyncStatus from './components/SyncStatus';

type PreAuthSyncState = 'idle' | 'offline';

const PreAuthFooter: React.FC = () => {
    const [version, setVersion] = useState('Live Snaps');
    const [versionDate, setVersionDate] = useState('');
    const [syncState, setSyncState] = useState<PreAuthSyncState>('idle');

    useEffect(() => {
        fetch('/metadata.json')
            .then(response => response.json())
            .then(data => {
                if (data && data.name) {
                    setVersion(data.name);
                }
                if (data && data.versionDate) {
                    setVersionDate(data.versionDate);
                }
            })
            .catch(() => setVersion('Live Snaps 9.05'));
    }, []);

    useEffect(() => {
        const updateOnlineStatus = () => {
            setSyncState(navigator.onLine ? 'idle' : 'offline');
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        
        updateOnlineStatus();

        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
        };
    }, []);

    return (
        <footer className="fixed bottom-0 left-0 right-0 p-4 flex justify-center items-center text-xs text-[var(--text-secondary)] gap-4 backdrop-blur-sm bg-[var(--bg-primary)]/50">
            <span>{version} {versionDate && `(${versionDate})`}</span>
            <SyncStatus syncState={syncState} />
        </footer>
    );
};


const App: React.FC = () => {
    const [user, setUser] = useState<any | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [onboardingStep, setOnboardingStep] = useState<'login' | 'role_selection' | 'welcome' | 'complete'>('login');
    const [userRole, setUserRole] = useState<'coach' | 'viewer' | 'admin' | null>(null);
    const [initialShowWalkthrough, setInitialShowWalkthrough] = useState(false);
    const [authPath, setAuthPath] = useState<'coach' | 'viewer' | 'admin' | null>(null);
    const [initialAuthMode, setInitialAuthMode] = useState<'login' | 'signup'>('login');

    // Use a ref to track the authPath so the onAuthStateChanged listener doesn't need to be re-bound.
    const authPathRef = useRef(authPath);
    useEffect(() => {
        authPathRef.current = authPath;
    }, [authPath]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(async (authUser: any) => {
            setIsAuthLoading(true);
            if (authUser) {
                setUser(authUser);
                const userDoc = await db.collection('users').doc(authUser.uid).get();
                const userData = userDoc.data();

                if (userDoc.exists && userData?.role) {
                    setUserRole(userData.role);
                    if (userData.role === 'admin') {
                        setOnboardingStep('complete');
                    } else if (userData.role === 'coach' && userData.teamName) {
                        setOnboardingStep('complete');
                        setInitialShowWalkthrough(!userData.walkthroughCompleted);
                    } else if (userData.role === 'viewer') {
                        setOnboardingStep('complete');
                        setInitialShowWalkthrough(false); // No walkthrough for viewers
                    } else { // Has role but not setup (e.g. coach who bailed on team name)
                        setOnboardingStep('welcome');
                    }
                } else { // New user or user without a role
                     if (authPathRef.current) { // Use the ref to get the latest value
                        await setUserRoleInDb(authUser.uid, authPathRef.current, authUser.email);
                        setUserRole(authPathRef.current);
                        if (authPathRef.current === 'coach') {
                            setOnboardingStep('welcome');
                        } else { // viewer or admin
                            setOnboardingStep('complete');
                        }
                    } else {
                        // Edge case: user exists in auth, but not in our DB, and didn't come from MainMenu
                        setOnboardingStep('role_selection');
                    }
                }
            } else {
                setUser(null);
                setUserRole(null);
                setOnboardingStep('login');
                setAuthPath(null); // Reset path on logout
            }
            setIsAuthLoading(false);
        });
        return () => unsubscribe();
    }, []); // Dependency array is now empty to prevent re-subscribing.

    const handleSetAuthPath = (path: 'coach' | 'viewer' | 'admin', initialMode: 'login' | 'signup') => {
        setAuthPath(path);
        setInitialAuthMode(initialMode);
    };

    const handleRoleSelect = async (role: 'coach' | 'viewer' | 'admin') => {
        if (user) {
            setIsAuthLoading(true);
            await setUserRoleInDb(user.uid, role, user.email);
            setUserRole(role);
            if (role === 'coach') {
                setOnboardingStep('welcome');
            } else {
                setOnboardingStep('complete');
            }
            setIsAuthLoading(false);
        }
    };

    const handleTeamCreate = async (teamName: string, coachName: string, ageGroup: string) => {
        if (user) {
            await initializeNewUser(user.uid, teamName, coachName, user.email, ageGroup);
            setOnboardingStep('complete');
        }
    };

    if (isAuthLoading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex justify-center items-center">
                <SpinnerIcon className="w-12 h-12 text-[var(--accent-primary)]" />
            </div>
        );
    }
    
    // New pre-authentication flow
    if (!user) {
        if (authPath) {
            return <>
                <LoginScreen onBack={() => setAuthPath(null)} initialMode={initialAuthMode} />
                <PreAuthFooter />
            </>;
        }
        return <>
            <MainMenuScreen setAuthPath={handleSetAuthPath} />
            <PreAuthFooter />
        </>;
    }

    // Authenticated user flow
    if (onboardingStep === 'role_selection') return <>
        <RoleSelectionScreen onRoleSelect={handleRoleSelect} />
        <PreAuthFooter />
    </>;
    if (onboardingStep === 'welcome') return <>
        <WelcomeScreen onTeamCreate={handleTeamCreate} />
        <PreAuthFooter />
    </>;

    // Final 'complete' state render
    if (userRole === 'coach') {
      return (
          <GameStateProvider user={user} initialShowWalkthrough={initialShowWalkthrough}>
              <AppContent />
          </GameStateProvider>
      );
    }

    if (userRole === 'viewer') {
        return <ViewerContainer />;
    }

    if (userRole === 'admin') {
        return <AdminContainer user={user} />;
    }

    return null; // Should not be reached
};


const DynamicIconSpriteInjector: React.FC = () => {
    const { customIconSheet, defaultIconSheet } = useGameState();
    const svgContent = customIconSheet || defaultIconSheet;
  
    if (!svgContent) {
      return null;
    }
  
    // This div is hidden but makes the SVG symbols available to <use> tags throughout the app.
    return <div dangerouslySetInnerHTML={{ __html: svgContent }} style={{ display: 'none' }} />;
};

const AppContent: React.FC = () => {
    const {
        activeTab,
        animationClass,
        isPlayDetailsModalOpen,
        editingPlayIndex,
        isSummaryModalOpen,
        isReportsModalOpen,
        isQuarterSummaryModalOpen,
        editingFormation,
        setEditingFormation,
        handleSaveFormation,
        handleDeleteFormation,
        players,
        offenseFormations,
        defenseFormations,
        specialTeamsFormations,
        isImportModalOpen,
        isSettingsModalOpen,
        setIsSettingsModalOpen,
        isAddEventModalOpen,
        isAddPlayerModalOpen,
        setIsAddPlayerModalOpen,
        editingPlayer,
        setEditingPlayer,
        handleUpdatePlayer,
        handleDeletePlayer,
        handleAddPlayer,
        mainPaddingClass,
        toast,
        isCoinTossModalOpen,
        isFourthDownModalOpen,
        showWalkthrough,
        isWeekSelectorModalOpen,
        navBarPosition,
    } = useGameState();

    const modalRoot = document.getElementById('modal-root');
    
    const formationToEdit = useMemo(() => {
        if (!editingFormation || editingFormation.isCreating || !editingFormation.name) {
            return undefined;
        }
        switch (editingFormation.playType) {
            case PlayType.Offense:
                return offenseFormations[editingFormation.name];
            case PlayType.Defense:
                return defenseFormations[editingFormation.name];
            case PlayType.SpecialTeams:
                return specialTeamsFormations[editingFormation.name];
            default:
                return undefined;
        }
    }, [editingFormation, offenseFormations, defenseFormations, specialTeamsFormations]);


    return (
        <div className={`font-sans min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300 ${mainPaddingClass} overflow-hidden`}>
            <DynamicIconSpriteInjector />
            <TopHeader />
            <div className={`w-full px-2 sm:px-4 ${activeTab === 'overview' ? 'py-2 h-[calc(100vh-4rem)]' : 'py-4'} pt-16 overflow-hidden`}>
                
                <div className={`${animationClass} h-full`}>
                    {activeTab === 'overview' && <WeekDashboard />}
                    {activeTab === 'game' && <Dashboard />}
                    {activeTab === 'roster' && <DepthChart />}
                    {activeTab === 'play-log' && <PlayLog />}
                    {activeTab === 'formations' && <FormationManager />}
                    {activeTab === 'insights' && <InsightsView />}
                    {activeTab === 'leaderboards' && <LeaderboardView />}
                </div>

                {editingPlayIndex !== null && modalRoot && createPortal(
                    <EditPlayModal key={editingPlayIndex} />,
                    modalRoot
                )}
                
                {isSummaryModalOpen && modalRoot && createPortal(
                    <GameSummaryModal />,
                    modalRoot
                )}
                
                {isReportsModalOpen && modalRoot && createPortal(
                    <ReportsModal />,
                    modalRoot
                )}

                {isQuarterSummaryModalOpen && modalRoot && createPortal(
                    <QuarterSummaryModal />,
                    modalRoot
                )}

                 {editingFormation && modalRoot && createPortal(
                    <FormationEditorModal
                        isOpen={!!editingFormation}
                        onClose={() => setEditingFormation(null)}
                        onSave={handleSaveFormation}
                        onDelete={handleDeleteFormation}
                        playType={editingFormation.playType}
                        allPlayers={players}
                        isCreating={editingFormation.isCreating}
                        formationToEdit={formationToEdit}
                        originalFormationName={editingFormation.name}
                    />,
                    modalRoot
                )}

                {isImportModalOpen && modalRoot && createPortal(
                    <ImportModal />,
                    modalRoot
                )}

                {isSettingsModalOpen && modalRoot && createPortal(
                    <SettingsModal
                        isOpen={isSettingsModalOpen}
                        onClose={() => setIsSettingsModalOpen(false)}
                    />,
                    modalRoot
                )}
                 {isWeekSelectorModalOpen && modalRoot && createPortal(
                    <WeekSelectorModal />,
                    modalRoot
                )}
                {isCoinTossModalOpen && modalRoot && createPortal(
                    <CoinTossModal />,
                    modalRoot
                )}
                {isFourthDownModalOpen && modalRoot && createPortal(
                    <FourthDownModal />,
                    modalRoot
                )}
                 {isAddEventModalOpen && modalRoot && createPortal(
                    <AddEventModal />,
                    modalRoot
                )}
                {isAddPlayerModalOpen && modalRoot && createPortal(
                    <AddPlayerModal onClose={() => setIsAddPlayerModalOpen(false)} onAddPlayer={handleAddPlayer} />,
                    modalRoot
                )}
                {editingPlayer && modalRoot && createPortal(
                    <PlayerStatusModal 
                        player={editingPlayer} 
                        onClose={() => setEditingPlayer(null)} 
                        onSave={(id, updates) => { handleUpdatePlayer(id, updates); setEditingPlayer(null); }} 
                        onDelete={(id) => { handleDeletePlayer(id); setEditingPlayer(null); }} 
                    />,
                    modalRoot
                )}
            </div>

            {activeTab === 'game' && <ClockFab />}

            {toast && modalRoot && createPortal(
                <Toast />,
                modalRoot
            )}

            {showWalkthrough && modalRoot && createPortal(<WalkthroughModal />, modalRoot)}

            <div className={`fixed bottom-${navBarPosition === 'bottom' ? '28' : '0'} left-0 right-0 z-40`}>
                 <LiveActivityBar />
            </div>

            <BottomNavBar />
        </div>
    );
};


export default App;
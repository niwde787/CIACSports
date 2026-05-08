import React, { useState } from 'react';
import LeaderboardView from './LeaderboardView';
import AdminUserManagement from './AdminUserManagement';
import AwardsView from './AwardsView';
import { LogoutIcon, SpinnerIcon } from './icons';
import { signOut } from '../firebase';

const AdminIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048" className={className} fill="none" stroke="currentColor">
        <g strokeWidth="76" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 102,522 V 1888 H 1300 V 1729" />
            <path d="M 276,344 V 1710 H 1476 V 138 H 560 Z M 560,138 V 344 H 276 m 1200,112 h 99 L 1685.5946,311.22155 M 1476,674 h 136 l 68,-94 h 108 m -312,340 h 168 m -168,248 h 136 l 68,92 h 108 m -312,124 h 98 l 116.0153,150.9597" />
            <path d="m 592,466 h 51.99998 M 834,466 h 94 m 192,0 h 52 M 456,618 h 52 m 186,0 h 94 m 188,0 h 94 m 186,0 h 52 M 456,770 h 52 m 186,0 h 94 m 188,0 h 94 m 186,0 h 52 M 456,924 h 52 m 186,0 h 94 m 188,0 h 94 m 186,0 h 52 m -852,152 h 52 m 186,0 h 94 m 188,0 h 94 m 186,0 h 52 m -852,152 h 52 m 186,0 h 94 m 188,0 h 94 m 186,0 h 52 m -852,152 h 52 m 186,0 h 94 m 188,0 h 94 m 186,0 h 52 m -852,154 h 52 m 186,0 h 94 m 188,0 h 94 m 186,0 h 52" />
            <circle cx="1740" cy="240" r="80" />
            <circle cx="1868" cy="580" r="80" />
            <circle cx="1724" cy="920" r="80" />
            <circle cx="1868" cy="1260" r="80" />
            <circle cx="1740" cy="1600" r="80" />
        </g>
    </svg>
);

const LeaderboardIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

const UserManagementIcon: React.FC<{className?: string}> = ({className}) => (
    <svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64.1 53.96" className={className} fill="currentColor">
      <g id="Layer_1-2" data-name="Layer 1">
        <path d="M48.58,50.97c-2.13,1.02-4.4,1.75-6.72,2.21-8.36,1.66-17.07.55-25.12-2.01l-.19-.18c.01-3.19-.22-6.49-.07-9.69.28-5.68,3.68-10.56,9.38-11.87,2.58-.59,8.79-.52,11.57-.32,5.85.42,10.79,5.31,11.19,11.18.23,3.46-.17,7.19-.03,10.67Z"/>
        <path d="M.11,29.99c.45-4.59,4.2-8.73,8.53-10.03,2.76-.83,7.95-.76,10.91-.6.48.03.93.17,1.42.14.21,3.12,1.48,5.89,3.64,8.11-4.94,1.28-9.04,5.84-9.96,10.85-.35,1.9-.29,3.85-.29,5.77-2.07-.27-4.2-.42-6.28-.78-2.7-.48-5.32-1.32-7.97-1.97.26-3.69-.35-7.87,0-11.5Z"/>
        <path d="M50.73,44.24c-.04-1.8.12-3.62-.16-5.4-.81-5.23-4.87-9.81-9.96-11.22-.05-.19.05-.21.12-.31.3-.43.86-.88,1.23-1.4,1.22-1.72,1.79-3.42,2.13-5.49.05-.32-.11-.92.22-1.03,2.51.06,5.11-.15,7.6-.02,6.52.34,11.43,4.47,12.19,11.05l-.07,10.82c-4.04,2.13-8.79,2.77-13.31,3Z"/>
        <circle cx="32.58" cy="19.14" r="9.43"/>
        <path d="M21.08,17.46c-.07.07-.93.52-1.1.59-8.75,3.86-16.98-6.17-11.67-13.92S26.15.57,25.46,10.04c-1.66,1.36-3,3.11-3.73,5.14-.14.39-.57,2.2-.65,2.28Z"/>
        <path d="M47.33.03c4.37-.38,8.62,2.53,9.81,6.74,2.21,7.83-5.49,14.5-12.9,11.28-.34-.93-.45-1.9-.79-2.84-.5-1.41-1.54-3.1-2.59-4.16-.39-.4-2.06-1.54-2.13-1.87-.17-.83.35-2.62.69-3.43,1.3-3.15,4.52-5.42,7.91-5.71Z"/>
      </g>
    </svg>
);

const AwardsIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64.38 126.64" className={className} fill="currentColor">
        <path d="M32.27,0C-.03.02-12.22,41.58,15.08,59.46c.63.42,2.26,1.05,2.48,1.65v51.38s.21,1.17.21,1.17l12.71,12.71c.69.29.99.27,1.66.28.58,0,.94,0,1.52-.14l12.84-12.84c.37-2.08.6-5.15.35-7.25-.34-2.92-2.94-3.29-4.63-5.32,1.29-1.65,4.74-4.53,4.59-6.7-.15-2.05-3.28-4.49-4.39-6.21,1.03-2.06,4.51-2.7,4.43-5.39,0-.26-.29-1.39-.41-1.52l-4.35-4.35,4.35-4.35c.92-.92.12-9.94.46-11.72,8.58-4.51,14.77-12.5,16.78-21.97C67.89,18.95,52.74-.01,32.27,0ZM40.87,20.43c0,4.77-3.82,8.67-8.6,8.76-3.17-.06-6.12-1.6-7.72-4.33-1.6-2.73-1.6-6.12,0-8.86,1.6-2.73,4.56-4.39,7.72-4.33,4.77.09,8.6,3.99,8.6,8.76Z"/>
    </svg>
);


const AdminContainer: React.FC<{ user: any }> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<'leaderboards' | 'users' | 'awards'>('leaderboards');
    const [isSigningOut, setIsSigningOut] = useState(false);

    const handleSignOut = async () => {
        setIsSigningOut(true);
        try {
            await signOut();
            window.location.reload();
        } catch (error) {
            console.error("Sign out error:", error);
            setIsSigningOut(false);
        }
    };

    const NavButton: React.FC<{
        label: string;
        icon: React.FC<{className?: string}>;
        isActive: boolean;
        onClick: () => void;
        isMobile?: boolean;
    }> = ({ label, icon: Icon, isActive, onClick, isMobile }) => {
        const activeClass = isMobile ? 'text-[var(--accent-primary)]' : 'bg-[var(--accent-primary)] text-white';
        const inactiveClass = isMobile ? 'text-[var(--text-secondary)] hover:text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-white';
        
        if (isMobile) {
            return (
                <button 
                    onClick={onClick}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg w-24 transition-colors ${isActive ? activeClass : inactiveClass}`}
                >
                    <Icon className="w-6 h-6" />
                    <span className="text-xs font-bold">{label}</span>
                </button>
            )
        }
    
        return (
            <li>
                <button 
                    onClick={onClick}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${isActive ? activeClass : inactiveClass}`}
                >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                </button>
            </li>
        );
    };
    
    const navItems = [
        { id: 'leaderboards', label: 'Team Stats', icon: LeaderboardIcon },
        { id: 'users', label: 'Users', icon: UserManagementIcon },
        { id: 'awards', label: 'Awards', icon: AwardsIcon }
    ];

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] md:flex">
            {/* Desktop Sidebar */}
            <nav className="hidden md:flex w-64 bg-[var(--bg-secondary)] p-4 flex-col border-r border-[var(--border-primary)] flex-shrink-0">
                <div className="flex items-center gap-3 mb-8 px-2">
                    <AdminIcon className="w-8 h-8 text-[var(--accent-primary)]" />
                    <h1 className="text-xl font-bold">Admin Portal</h1>
                </div>
                <ul className="space-y-2 flex-grow">
                     {navItems.map(item => (
                         <NavButton 
                            key={item.id}
                            label={item.label} 
                            icon={item.icon} 
                            isActive={activeTab === item.id} 
                            onClick={() => setActiveTab(item.id as any)} 
                        />
                    ))}
                </ul>
                <div className="border-t border-[var(--border-primary)] pt-4">
                     <p className="px-4 text-xs text-center text-[var(--text-secondary)] truncate">Logged in as {user.email}</p>
                     <button
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                        className="w-full mt-2 flex items-center justify-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors text-[var(--text-secondary)] hover:bg-[var(--accent-danger)]/20 hover:text-red-300"
                    >
                        {isSigningOut ? <SpinnerIcon className="w-5 h-5" /> : <LogoutIcon className="w-5 h-5" />}
                        <span>Sign Out</span>
                    </button>
                </div>
            </nav>

            {/* Mobile Content Wrapper */}
            <div className="flex-1 flex flex-col">
                {/* Mobile Header */}
                 <header className="md:hidden p-4 border-b border-[var(--border-primary)] flex justify-between items-center glass-effect sticky top-0 z-30">
                    <div className="flex items-center gap-2">
                         <AdminIcon className="w-6 h-6 text-[var(--accent-primary)]" />
                         <h1 className="text-xl font-bold">Admin: {activeTab === 'leaderboards' ? 'Team Stats' : activeTab === 'users' ? 'Users' : 'Awards'}</h1>
                    </div>
                 </header>

                <main className="flex-grow p-4 sm:p-6 overflow-y-auto pb-20 md:pb-6">
                    {activeTab === 'leaderboards' && <LeaderboardView />}
                    {activeTab === 'users' && <AdminUserManagement />}
                    {activeTab === 'awards' && <AwardsView />}
                </main>

                {/* Mobile Bottom Nav */}
                <footer className="md:hidden fixed bottom-0 left-0 right-0 h-16 glass-effect border-t border-[var(--border-primary)] flex justify-around items-center z-30">
                    {navItems.map(item => (
                        <NavButton
                            key={item.id}
                            label={item.label}
                            icon={item.icon}
                            isActive={activeTab === item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            isMobile
                        />
                    ))}
                    <button 
                        onClick={handleSignOut} 
                        disabled={isSigningOut}
                        className="flex flex-col items-center gap-1 p-2 rounded-lg w-24 text-[var(--text-secondary)] hover:text-white"
                    >
                         {isSigningOut ? <SpinnerIcon className="w-6 h-6" /> : <LogoutIcon className="w-6 h-6" />}
                         <span className="text-xs font-bold">Sign Out</span>
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default AdminContainer;
import React from 'react';

interface MainMenuScreenProps {
    setAuthPath: (path: 'coach' | 'viewer' | 'admin', initialMode: 'login' | 'signup') => void;
}

const MenuCard: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    onClick: () => void;
    size?: 'large' | 'small';
}> = ({ title, description, icon, onClick, size = 'large' }) => {
    const baseClasses = "group w-full h-full text-left rounded-2xl transition-all duration-300 ease-in-out transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/50";
    const styleClasses = "bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 focus:ring-white/50";

    if (size === 'large') {
        return (
            <button
                onClick={onClick}
                className={`${baseClasses} ${styleClasses} p-6`}
            >
                <div className="flex items-start gap-6">
                    <div className="text-[var(--accent-primary)] flex-shrink-0 mt-1">
                        {icon}
                    </div>
                    <div>
                        <h3 className="font-bold text-xl text-[var(--text-primary)]">{title}</h3>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">{description}</p>
                    </div>
                </div>
            </button>
        );
    }

    // Small size card
    return (
        <button
            onClick={onClick}
            className={`${baseClasses} ${styleClasses} p-4`}
        >
            <div className="flex items-center gap-4">
                <div className="text-[var(--accent-primary)] flex-shrink-0">
                    {icon}
                </div>
                <div className="flex-grow">
                    <h3 className="font-bold text-base text-[var(--text-primary)]">{title}</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">{description}</p>
                </div>
            </div>
        </button>
    );
};


const CoachPortalIcon: React.FC = () => (
    <svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 67 80.21" className="h-10 w-10" fill="currentColor">
        <g id="Layer_2-2" data-name="Layer 2"><g>
            <path d="M32.22,76.66c-.05-.08-1.24-.58-1.57-.81-3.08-2.12-3.02-6.87-.08-9.07v-.19s-9.51-17.43-9.51-17.43c-.31-.19-3.02.69-3.58.87-7.8,2.47-10.95,4.93-14.3,12.38-.87,1.92-2.31,5.05-2.88,6.98-.14.47-.4,1.25-.26,1.72.21.66,5.35,2.66,6.31,3.04,5.98,2.35,12.39,4.41,18.75,5.38,2.52.38,5.06.52,7.6.68.62-.31.04-.68-.05-1.09-.09-.45-.27-2.22-.43-2.46Z"></path>
            <path d="M27.88,54.91l5.63,10.52h.48s5.62-10.86,5.62-10.86c-.85.32-1.6.91-2.46,1.2-3.05,1.03-6.43.55-9.27-.86Z"></path>
            <path d="M62.62,59.94c-2.91-5.51-5.91-7.38-11.71-9.45-.63-.23-4.51-1.53-4.82-1.33l-9.04,17.23c-.03.3.36.34.61.58.66.63,1.41,1.51,1.69,2.39.55,1.71.33,7.04.26,9.09-.01.44-.2.83-.17,1.27,4.44-.26,8.8-1.38,13.04-2.67,4.18-1.27,9.05-3,12.99-4.85,1.32-.62,1.77-.7,1.41-2.34-.51-2.37-3.09-7.69-4.26-9.92Z"></path>
            <path d="M35.35,69.11c-2.58-1.55-5.17,1.82-3.22,3.9.47.52,1.56.71,2.1,1.13,1.27.98,1.29,3.74,1.49,3.86.17.1.6-.01.83.02v-7.22c0-.4-.82-1.47-1.2-1.69Z"></path>
            <path d="M14.46,17.02c-2.05.82-3.75,1.72-3.57,4.33.07,1.09,1.15,4.83,1.67,5.81.71,1.33,1.44,1.94,2.92,2.26.77.17,1.45.32,2.21-.09-1.47-4.04-2.56-8.32-2.55-12.65-.42-.18-.62.31-.68.34Z"></path>
            <path d="M33.58,43.2c3.44.04,6.89-3.7,8.57-6.39-.74.4-3.25.39-3.74.68-.1.06-.71,1.2-1.03,1.51-1.23,1.2-3.53,1.31-5.17,1.13-3.81-.41-5.15-5.37-1.94-7.55,1.69-1.15,5.28-1.06,6.87.24.61.51.84,1.17,1.36,1.55.99-.16,1.98-.37,2.94-.66.52-.15,2.96-1.01,3.22-1.28.26-.26,1.11-2.34,1.31-2.84,1.4-3.41,2.39-7.2,2.74-10.87-.11-.21-1.32-.95-1.62-1.11-5.77-3.09-20.15-3-26.12-.45-.35.15-2.48,1.26-2.57,1.42-.33.57.96,5.8,1.24,6.76,1.62,5.64,7,17.78,13.94,17.86Z"></path>
            <path d="M40.97,43.19l-2.27,1.55c-4.53,2.65-8.64,1.61-12.52-1.55-.29,2.72-.72,4.43.95,6.78,3.14,4.41,10.16,4.28,13.02-.38,1.38-2.25.98-3.9.82-6.4Z"></path>
            <path d="M44.71,13.36c1.33.36,2.56.95,3.9,1.28.16-4-1.86-8.36-4.83-10.98-6.91-6.09-19.07-4.42-23.54,3.8-1.17,2.15-1.67,4.93-1.87,7.35,4.47-2.23,9.27-2.47,14.18-2.55,4.1-.07,8.14,0,12.16,1.1Z"></path>
            <path d="M50.99,29.59c3.29-.24,4.08-3.43,4.71-6.08.32-1.35.78-2.53.26-3.9-.5-1.3-2.15-2.34-3.44-2.76-.15-.05-.28-.23-.51-.17-.11,3.29-.72,6.52-1.61,9.68-.14.49-1.09,2.86-.93,3.05.52.1.98.22,1.52.18Z"></path>
        </g></g>
    </svg>
);


const CreateTeamIcon = () => (
    <svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 69.33 59.02" className="h-10 w-10" fill="currentColor">
        <g id="Layer_2-2" data-name="Layer 2">
            <path d="M68.73,41.78c-.03-.88-.77-1.59-1.65-1.56l-10.49.2c-.56-3.37-1.07-6.96-1.49-10.44,1.87-.05,3.43-.15,3.76-.33.9-.5.32-9.45-1.01-10.28-.45-.28-1.77-.39-3.33-.41C50.75,7.93,40.32,0,28.01,0,12.54,0,0,12.54,0,28.01c0,6.58,1.07,17,4.87,21.78,2.75,3.46,9.94-.32,14.34.36,3.8.59,4.68,5.86,8.79,5.86,6.8,0,13.02-2.42,17.87-6.44.94-.78,3.96-2.63,4.66-5.78l3.27-.06c2.78,15.29,5.49,15.29,6.51,15.29h7.4c.44,0,.86-.18,1.17-.5s.47-.75,.45-1.19l-.61-15.54h.01ZM32.56,47.98c-1.74,0-3.16-1.41-3.16-3.16s1.42-3.16,3.16,3.16,3.16,1.41,3.16,3.16-1.41,3.16-3.16,3.16ZM50.46,40.53c-.9-4.2-3.86-9.94.29-10.49h1.09c.47,4,.94,7.47,1.42,10.45l-2.8.05h0ZM60.61,55.76c-1.04-1.1-2.3-5.97-3.45-12.1l8.39-.16.48,12.26h-5.42Z"></path>
        </g>
    </svg>
);

const FollowTeamIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
    </svg>
);

const AdminPortalIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048" className="h-10 w-10">
        <g fill="none" stroke="currentColor" strokeWidth="76" strokeLinecap="round" strokeLinejoin="round">
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


const MainMenuScreen: React.FC<MainMenuScreenProps> = ({ setAuthPath }) => {
    return (
        <div className="min-h-screen main-menu-background flex flex-col justify-center items-center p-4 sm:p-6">
            <div className="relative z-10 w-full max-w-4xl text-center">
                <img src="https://raw.githubusercontent.com/niwde787/CJF/main/SNAPS_S.svg" alt="Snaps Logo" className="h-20 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-white mb-2">Welcome to Live Snaps</h1>
                <p className="text-lg text-gray-300 max-w-xl mx-auto mb-10">
                    The all-in-one digital toolkit for modern football coaching. Track plays, analyze players, and generate AI-powered insights.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <MenuCard
                        title="Coach Portal"
                        description="Manage teams, track player performance, build depth charts, and access real-time game insights—all in one place."
                        icon={<CoachPortalIcon />}
                        onClick={() => setAuthPath('coach', 'login')}
                        size="large"
                    />
                    <MenuCard
                        title="Create a Team"
                        description="For new coaches setting up their team for the first time."
                        icon={<CreateTeamIcon />}
                        onClick={() => setAuthPath('coach', 'signup')}
                        size="large"
                    />
                    <MenuCard
                        title="Follow a Team"
                        description="Track every snap with real-time recaps showing drives, downs, and key plays—passes, runs, tackles, and touchdowns—all in one clear visual timeline."
                        icon={<FollowTeamIcon />}
                        onClick={() => setAuthPath('viewer', 'login')}
                        size="large"
                    />
                    <MenuCard
                        title="Admin Portal"
                        description="For system administrators to manage users and data."
                        icon={<AdminPortalIcon />}
                        onClick={() => setAuthPath('admin', 'login')}
                        size="large"
                    />
                </div>
            </div>
        </div>
    );
};

export default MainMenuScreen;
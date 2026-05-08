import React, { useMemo, useState, useEffect } from 'react';
import {
    DashboardIcon, GameIcon, RosterIcon, PlayLogIcon, FormationIcon, SparklesIcon,
    CalendarIcon, SettingsIcon, ResetIcon, ReportsIcon, UndoIcon, RedoIcon, TrophyIcon
} from './icons';
import { ActiveTab, NavBarPosition } from '../types';
import { useGameState } from '../contexts/GameStateContext';
import SyncStatus from './SyncStatus';

const NavItem: React.FC<{
    domId?: string;
    id: ActiveTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    isActive: boolean;
    onClick: () => void;
    position: NavBarPosition;
}> = ({ domId, id, label, icon: Icon, isActive, onClick, position }) => {
    const activeClass = 'text-[var(--accent-primary)]';
    const inactiveClass = 'text-[var(--text-secondary)] hover:text-white';
    const isVertical = position === 'left' || position === 'right';

    return (
        <button
            id={domId}
            onClick={onClick}
            className={`flex flex-col items-center justify-center gap-1.5 flex-shrink-0 pt-2 pb-1 transition-colors duration-200 focus:outline-none rounded-lg focus:bg-white/5 ${isVertical ? 'w-full' : 'w-20'} ${isActive ? activeClass : inactiveClass}`}
            aria-current={isActive ? 'page' : undefined}
        >
            <Icon className="w-6 h-6" />
            <span className="text-xs font-bold tracking-wide">{label}</span>
        </button>
    );
};

const ActionItem: React.FC<{
    domId?: string;
    label: string;
    icon: React.FC<{ className?: string }>;
    onClick: () => void;
    disabled?: boolean;
    position: NavBarPosition;
}> = ({ domId, label, icon: Icon, onClick, disabled = false, position }) => {
    const isVertical = position === 'left' || position === 'right';
    return (
        <button
            id={domId}
            onClick={onClick}
            disabled={disabled}
            className={`flex flex-col items-center justify-center gap-1.5 flex-shrink-0 pt-2 pb-1 text-[var(--text-secondary)] hover:text-white transition-colors duration-200 focus:outline-none rounded-lg focus:bg-white/5 disabled:text-gray-600 disabled:hover:bg-transparent disabled:cursor-not-allowed ${isVertical ? 'w-full' : 'w-20'}`}
        >
            <Icon className="w-6 h-6" />
            <span className="text-xs font-bold tracking-wide">{label}</span>
        </button>
    );
};

export const BottomNavBar: React.FC = () => {
    const {
        activeTab,
        handleTabChange,
        handleResetWeek,
        handleOpenReportsModal,
        setIsWeekSelectorModalOpen,
        setIsSettingsModalOpen,
        handleUndo,
        undoStack,
        handleRedo,
        redoStack,
        navBarPosition,
        syncState,
    } = useGameState();

    const [version, setVersion] = useState('Live Snaps');
    const [versionDate, setVersionDate] = useState('');

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
            .catch(() => setVersion('Live Snaps 8.56')); // Fallback
    }, []);

    const navItems = [
        { id: 'overview', label: 'Overview', icon: DashboardIcon, domId: 'walkthrough-dashboard-tab' },
        { id: 'game', label: 'Game', icon: GameIcon, domId: 'walkthrough-game-tab' },
        { id: 'play-log', label: 'Play Log', icon: PlayLogIcon, domId: 'walkthrough-play-log-tab' },
        { id: 'roster', label: 'Roster', icon: RosterIcon, domId: 'walkthrough-roster-tab' },
        { id: 'formations', label: 'Playbook', icon: FormationIcon, domId: 'walkthrough-formations-tab' },
        { id: 'insights', label: 'Insights', icon: SparklesIcon, domId: 'walkthrough-insights-tab' },
        { id: 'leaderboards', label: 'Team Stats', icon: TrophyIcon, domId: 'walkthrough-leaderboards-tab' },
    ];
    
    const isVertical = navBarPosition === 'left' || navBarPosition === 'right';

    const separatorClasses = useMemo(() => {
        return isVertical
            ? 'w-16 h-px bg-[var(--border-primary)] my-2'
            : 'h-12 w-px bg-[var(--border-primary)] mx-2';
    }, [isVertical]);

    const contentContainerClasses = useMemo(() => {
        return `flex ${isVertical ? 'flex-col h-full w-full justify-center gap-1 p-2' : 'flex-grow items-center justify-around w-full px-2'} no-scrollbar ${isVertical ? 'overflow-y-auto' : 'overflow-x-auto'}`;
    }, [isVertical]);

    const navContent = (
        <div className={contentContainerClasses}>
            {navItems.map(item => (
                <NavItem
                    key={item.id}
                    domId={item.domId}
                    id={item.id as ActiveTab}
                    label={item.label}
                    icon={item.icon}
                    isActive={activeTab === item.id}
                    onClick={() => handleTabChange(item.id as ActiveTab)}
                    position={navBarPosition}
                />
            ))}
            <div className={separatorClasses}></div>
            <ActionItem label="Undo" icon={UndoIcon} onClick={handleUndo} disabled={undoStack.length === 0} position={navBarPosition} />
            <ActionItem label="Redo" icon={RedoIcon} onClick={handleRedo} disabled={redoStack.length === 0} position={navBarPosition} />
            <ActionItem label="Reset" icon={ResetIcon} onClick={handleResetWeek} position={navBarPosition} />
            <ActionItem label="Reports" icon={ReportsIcon} onClick={handleOpenReportsModal} position={navBarPosition} />
            <div className={separatorClasses}></div>
            <ActionItem domId="walkthrough-calendar-button" label="Calendar" icon={CalendarIcon} onClick={() => setIsWeekSelectorModalOpen(true)} position={navBarPosition} />
            <ActionItem domId="walkthrough-settings-button" label="Settings" icon={SettingsIcon} onClick={() => setIsSettingsModalOpen(true)} position={navBarPosition} />
        </div>
    );
    
    const wrapperClasses = useMemo(() => {
        const base = 'fixed z-50 pointer-events-none';
        const position = {
            bottom: 'bottom-0 left-0 right-0',
            top: 'top-0 left-0 right-0',
            left: 'left-0 top-0 bottom-0',
            right: 'right-0 top-0 bottom-0',
        }[navBarPosition];
        return `${base} ${position}`;
    }, [navBarPosition]);

    const innerContainerClasses = useMemo(() => {
        const padding = isVertical ? 'py-2 sm:py-4' : 'px-2 sm:px-4';
        const size = isVertical ? 'h-full' : 'w-full';
        return `${size} ${padding} pointer-events-auto`;
    }, [isVertical]);

    const navBoxClasses = useMemo(() => {
        const size = isVertical ? 'w-24 h-full' : 'h-28 w-full';
        const border = {
            bottom: 'border-t',
            top: 'border-b',
            left: 'border-r',
            right: 'border-l',
        }[navBarPosition];
        return `${size} flex flex-col glass-effect border-[var(--border-primary)] ${border}`;
    }, [isVertical, navBarPosition]);

    return (
        <div className={wrapperClasses}>
            <div className={innerContainerClasses}>
                <div className={navBoxClasses}>
                    {navContent}
                    <div className={`text-xs text-[var(--text-secondary)] border-[var(--border-primary)] flex-shrink-0 flex items-center justify-center gap-4 ${isVertical ? 'py-3 border-t' : 'py-2 border-t'}`}>
                        <p className={`${isVertical ? 'transform rotate-180 [writing-mode:vertical-rl]' : 'hidden sm:block'}`}>{version} {versionDate && `(${versionDate})`}</p>
                        <div className={`${isVertical ? 'hidden' : 'flex'}`}>
                            <SyncStatus syncState={syncState} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
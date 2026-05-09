import React, { useMemo } from 'react';
import { ClockPlayIcon, ClockPauseIcon } from './icons';
import { formatTime } from '../utils';
import { useGameState } from '../contexts/GameStateContext';

const ClockFab: React.FC = () => {
  const { isClockRunning, handleToggleClock, gameTime, navBarPosition } = useGameState();

  const buttonClass = isClockRunning
    ? 'bg-[var(--accent-danger)] hover:bg-[var(--accent-danger-hover)] focus:ring-[var(--accent-danger)]'
    : 'bg-[var(--accent-button-primary)] hover:bg-[var(--accent-button-primary-hover)] focus:ring-[var(--accent-button-primary)]';
  
  const Icon = isClockRunning ? ClockPauseIcon : ClockPlayIcon;
  const label = isClockRunning ? `Stop Clock at ${formatTime(gameTime)}` : `Start Clock from ${formatTime(gameTime)}`;

  const fabPositionClasses = useMemo(() => {
    switch (navBarPosition) {
        case 'bottom':
            return 'bottom-[7.5rem] right-6';
        case 'top':
             return 'top-[7.5rem] right-6';
        case 'right':
            return 'bottom-6 right-[6.5rem]';
        case 'left':
        default:
            return 'bottom-6 right-6';
    }
  }, [navBarPosition]);

  return (
    <button
      onClick={handleToggleClock}
      aria-label={label}
      className={`fixed z-[60] h-20 w-20 rounded-full text-white shadow-2xl flex flex-col items-center justify-center gap-0.5 pt-1 transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-offset-[var(--bg-primary)] ${buttonClass} ${fabPositionClasses}`}
    >
      <Icon className="w-8 h-8" />
      <span className="text-base font-black font-mono tabular-nums tracking-wider">{formatTime(gameTime)}</span>
    </button>
  );
};

export default ClockFab;

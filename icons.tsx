import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useGameState } from '../contexts/GameStateContext';

interface WalkthroughStep {
  targetId?: string;
  title: string;
  content: string;
  action?: () => void;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  highlightPadding?: number;
}

const WalkthroughModal: React.FC = () => {
    const { handleCompleteWalkthrough, handleTabChange, navBarPosition } = useGameState();
    const [stepIndex, setStepIndex] = useState(0);
    const [styles, setStyles] = useState<{ highlight: React.CSSProperties, dialog: React.CSSProperties }>({
        highlight: { opacity: 0 },
        dialog: { opacity: 0, transform: 'scale(0.95)' },
    });

    const STEPS: WalkthroughStep[] = useMemo(() => [
        {
            title: "Welcome to Live Snaps!",
            content: "Let's take a quick tour to get you started with the key features.",
            placement: 'center',
        },
        {
            targetId: 'walkthrough-settings-button',
            title: "App Settings",
            content: "Customize your experience, manage team info, and change the app's appearance here.",
            placement: navBarPosition === 'top' ? 'bottom' : 'top',
        },
        {
            targetId: 'walkthrough-calendar-button',
            title: "Game Calendar",
            content: "Manage your season schedule. Add new games, edit opponents, and select which week's data to view.",
            placement: navBarPosition === 'top' ? 'bottom' : 'top',
        },
        {
            targetId: 'walkthrough-roster-tab',
            title: "Manage Your Roster",
            content: "Next, we'll look at how to manage your team's roster. Click 'Next' to continue.",
            action: () => handleTabChange('roster'),
            placement: navBarPosition === 'top' ? 'bottom' : 'top',
        },
        {
            targetId: 'walkthrough-add-player-button',
            title: "Add Players",
            content: "You can add players to your team one by one using this button.",
            placement: 'bottom',
        },
        {
            targetId: 'walkthrough-import-roster-button',
            title: "Import a Full Roster",
            content: "Or, save time by importing your entire roster from a spreadsheet.",
            placement: 'bottom',
        },
        {
            title: "You're All Set!",
            content: "You've learned the basics. You can now start tracking plays, managing formations, and gaining insights into your games. Good luck, Coach!",
            placement: 'center',
        }
    ], [handleTabChange, navBarPosition]);

    const currentStep = STEPS[stepIndex];

    const updateLayout = useCallback(() => {
        if (!currentStep) return;

        const dialogStyle: React.CSSProperties = {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 1,
            transition: 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out',
        };

        let highlightStyle: React.CSSProperties;

        if (!currentStep.targetId) {
            highlightStyle = {
                position: 'fixed',
                top: '50%',
                left: '50%',
                width: '0px',
                height: '0px',
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
                transition: 'all 0.3s ease-in-out',
            };
        } else {
            const targetElement = document.getElementById(currentStep.targetId);
            if (!targetElement) {
                console.warn(`Walkthrough target not found: ${currentStep.targetId}`);
                // Fallback to a centered, zero-size highlight if target is not found
                highlightStyle = {
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    width: '0px',
                    height: '0px',
                    transform: 'translate(-50%, -50%)',
                    borderRadius: '50%',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
                    transition: 'all 0.3s ease-in-out',
                };
            } else {
                const rect = targetElement.getBoundingClientRect();
                const padding = currentStep.highlightPadding ?? 8;
                
                highlightStyle = {
                    position: 'fixed',
                    top: `${rect.top - padding}px`,
                    left: `${rect.left - padding}px`,
                    width: `${rect.width + padding * 2}px`,
                    height: `${rect.height + padding * 2}px`,
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease-in-out',
                };
            }
        }

        setStyles({ highlight: highlightStyle, dialog: dialogStyle });

    }, [currentStep]);

    useEffect(() => {
        setStyles(prev => ({
            highlight: { ...prev.highlight, opacity: 0 },
            dialog: { ...prev.dialog, opacity: 0, transform: `${prev.dialog.transform || ''} scale(0.95)` }
        }));
        
        const timer = setTimeout(() => {
            if (currentStep.action) {
                currentStep.action();
            }
            // Another timeout to wait for potential re-renders (like tab switching)
            const layoutTimer = setTimeout(updateLayout, 100);
            return () => clearTimeout(layoutTimer);
        }, 300); // Wait for fade out

        window.addEventListener('resize', updateLayout);
        
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateLayout);
        };
    }, [stepIndex, currentStep, updateLayout]);

    const handleNext = () => {
        if (stepIndex < STEPS.length - 1) {
            setStepIndex(s => s + 1);
        } else {
            handleCompleteWalkthrough();
        }
    };
    
    return (
        <div className="fixed inset-0 z-[10000] pointer-events-none backdrop-blur-[2px]">
            <div style={styles.highlight} className="pointer-events-auto" />
            <div style={styles.dialog} className="bg-[var(--bg-secondary)] rounded-2xl shadow-2xl w-full max-w-sm pointer-events-auto border border-[var(--border-primary)]">
                <div className="p-6">
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">{currentStep.title}</h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-2">{currentStep.content}</p>
                </div>
                <div className="p-4 border-t border-[var(--border-primary)] flex justify-between items-center">
                    <button onClick={handleCompleteWalkthrough} className="text-sm font-semibold text-[var(--text-secondary)] hover:text-white">
                        Skip Tour
                    </button>
                    <button onClick={handleNext} className="px-6 py-2 bg-[var(--accent-primary)] text-white font-bold rounded-lg hover:bg-[var(--accent-primary-hover)]">
                        {stepIndex === STEPS.length - 1 ? 'Finish' : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WalkthroughModal;
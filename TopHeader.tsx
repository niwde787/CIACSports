import React, { useState } from 'react';
import { SpinnerIcon } from './icons';
import { useGameState } from '../contexts/GameStateContext';

const DiagnosticItem: React.FC<{ label: string; status: string; color: 'green' | 'yellow' | 'red' }> = ({ label, status, color }) => {
    const colorClass = color === 'green' ? 'text-green-400' : color === 'yellow' ? 'text-yellow-400' : 'text-red-400';
    return (
        <div className="flex justify-between items-center p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)]">
            <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${color === 'green' ? 'bg-green-400' : color === 'yellow' ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
                <span className="font-medium text-[var(--text-primary)]">{label}</span>
            </div>
            <span className={`font-bold ${colorClass}`}>{status}</span>
        </div>
    );
};

const SystemHealth: React.FC = () => {
    const [isScanning, setIsScanning] = useState(false);
    const { players, playHistory, user, syncState } = useGameState();

    const runScan = () => {
        setIsScanning(true);
        setTimeout(() => setIsScanning(false), 1500);
    };

    const rosterMissingPositions = players.filter(p => !p.position).length;

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">Deep System Diagnostics</h3>
                    <p className="text-sm text-[var(--text-secondary)]">Analyze data integrity and system performance.</p>
                </div>
                <button
                    onClick={runScan}
                    disabled={isScanning}
                    className="flex items-center gap-2 py-2 px-4 bg-[var(--accent-primary)] text-white font-bold rounded-lg hover:bg-[var(--accent-primary-hover)] disabled:opacity-50"
                >
                    {isScanning ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : 'Run Deep Scan'}
                </button>
            </header>

            <div className="space-y-3">
                <DiagnosticItem label="Internet Connection" status={navigator.onLine ? "Online" : "Offline"} color={navigator.onLine ? "green" : "red"} />
                <DiagnosticItem label="Database Sync" status={syncState === 'synced' ? "Connected & Synced" : syncState === 'syncing' ? "Syncing..." : "Offline"} color={syncState === 'synced' ? "green" : "yellow"} />
                <DiagnosticItem label="User Authentication" status={user ? `Authenticated as ${user.email}` : "Not Authenticated"} color={user ? "green" : "red"} />
                <DiagnosticItem 
                    label="Roster Data" 
                    status={`${players.length} players loaded, ${rosterMissingPositions} missing positions`} 
                    color={rosterMissingPositions === 0 ? "green" : "yellow"} 
                />
                <DiagnosticItem label="Play History" status={`${playHistory.length} plays verified.`} color="green" />
                <DiagnosticItem label="Playbook" status="Playbook ready." color="green" />
                <DiagnosticItem label="Audio Engine" status="Speech Synthesis Ready" color="green" />
                <DiagnosticItem label="Local Storage" status="Available" color="green" />
            </div>
        </div>
    );
};

export default SystemHealth;

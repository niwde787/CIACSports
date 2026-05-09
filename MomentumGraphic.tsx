
import React, { useState, useCallback, useEffect } from 'react';
import { PlayerStatus, PlayType, FormationPosition, ParsedRosterUpdate, ParsedFormation, ParsedOpponentUpdate } from '../types';
import { SpinnerIcon } from './icons';
import { useGameState } from '../contexts/GameStateContext';

declare const XLSX: any;

const InfoIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  </svg>
);


const ImportModal: React.FC = () => {
    const { setIsImportModalOpen, handleImport, seasonWeeks, opponentNames, weekDates, homeAwayStatus, initialImportTab } = useGameState();
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'season' | 'playbook'>('season');

    useEffect(() => {
        if (initialImportTab) {
            setActiveTab(initialImportTab);
        }
    }, [initialImportTab]);

    const onClose = () => setIsImportModalOpen(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFile(event.target.files[0]);
            setError(null);
            setSuccessMessage(null);
        }
    };

    const handleDownloadSeasonTemplate = () => {
        const wb = XLSX.utils.book_new();

        seasonWeeks.forEach(week => {
            const ws_data = [
                ["Opponent:", opponentNames[week] || ''],
                ["Date (YYYY-MM-DD):", weekDates[week] || ''],
                ["Home/Away:", homeAwayStatus[week] || ''],
                [],
                ["ROSTER FOR THIS WEEK (Status options: Playing, Injured, Absent, Discipline)"],
                ["Jersey Number", "Name", "Status"],
                ["1", "Player, First", "Playing"],
                ["2", "Player, Second", "Playing"],
                [],
                ["FORMATIONS FOR THIS WEEK (Add new rows for more formations)"],
                ["Play Type", "Formation Name", "Position Labels (comma-separated)", "Position Coordinates (left%:top%,...)", "Preset Player Jerseys (comma-separated)"],
                ["Offense", "My Custom Spread", "QB,RB,WR,WR,LT,LG,C,RG,RT,TE,WR", "50%:65%,43%:70%,5%:50%,25%:50%,35%:52%,43%:52%,50%:52%,57%:52%,65%:52%,75%:52%,95%:50%", "1,2,3,4,5,6,7,8,9,10,11"],
            ];
            
            const ws = XLSX.utils.aoa_to_sheet(ws_data);
            ws['!cols'] = [ {wch: 15}, {wch: 25}, {wch: 40}, {wch: 40}, {wch: 40} ];
            XLSX.utils.book_append_sheet(wb, ws, week);
        });

        XLSX.writeFile(wb, "Season_Planner_Template.xlsx");
    };

    const handleDownloadPlaybookTemplate = () => {
        const wb = XLSX.utils.book_new();
        const ws_data = [
            ["PLAYBOOK IMPORT: Add new rows for more formations. This will add or overwrite formations globally for your team."],
            ["Play Type", "Formation Name", "Position Labels (comma-separated)", "Position Coordinates (left%:top%,...)", "Preset Player Jerseys (comma-separated)"],
            ["Offense", "My Custom Spread", "QB,RB,WR,WR,LT,LG,C,RG,RT,TE,WR", "50%:65%,43%:70%,5%:50%,25%:50%,35%:52%,43%:52%,50%:52%,57%:52%,65%:52%,75%:52%,95%:50%", "1,2,3,4,5,6,7,8,9,10,11"],
            ["Defense", "My 3-4 Cover", "NT,DE,DE,OLB,ILB,ILB,OLB,CB,CB,FS,SS", "48%:50%,48%:38%,48%:62%,45%:25%,35%:45%,35%:55%,45%:75%,25%:5%,25%:95%,15%:60%,20%:40%"]
        ];
        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        ws['!cols'] = [ {wch: 15}, {wch: 25}, {wch: 40}, {wch: 40}, {wch: 40} ];
        XLSX.utils.book_append_sheet(wb, ws, "Formations");
        XLSX.writeFile(wb, "Playbook_Import_Template.xlsx");
    };

    const handleProcessSeasonPlan = useCallback(async () => {
        if (!file) return;
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const rosterUpdates: ParsedRosterUpdate[] = [];
        const formationUpdates: ParsedFormation[] = [];
        const opponentUpdates: ParsedOpponentUpdate[] = [];
        let processedFormations = 0;
        let processedRosters = 0;

        for (const week of workbook.SheetNames) {
            if (!seasonWeeks.includes(week)) continue;
            const sheet = workbook.Sheets[week];
            const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
            const opponentName = rows[0]?.[1]?.toString().trim();
            if (opponentName) opponentUpdates.push({ week, opponentName });
            let rosterHeaderIndex = -1;
            let formationHeaderIndex = -1;
            for(let i=0; i<rows.length; i++) {
                if (rows[i][0] === "Jersey Number") rosterHeaderIndex = i;
                if (rows[i][0] === "Play Type") formationHeaderIndex = i;
                if (rosterHeaderIndex !== -1 && formationHeaderIndex !== -1) break;
            }
            
            if (rosterHeaderIndex !== -1) {
                for (let i = rosterHeaderIndex + 1; i < rows.length; i++) {
                    const row = rows[i];
                    if (row[0] === null || row[2] === null) continue;
                    const jerseyNumber = parseInt(row[0], 10);
                    const status = row[2]?.toString();
                    if (!Number.isFinite(jerseyNumber) || !status) continue;
                    const validStatus = Object.values(PlayerStatus).find(s => s.toLowerCase() === String(status).toLowerCase());
                    if (validStatus) { rosterUpdates.push({ week, jerseyNumber, status: validStatus }); processedRosters++; }
                    else throw new Error(`Invalid status "${status}" for jersey #${jerseyNumber} in sheet '${week}'.`);
                }
            }
            
            if (formationHeaderIndex !== -1) {
                for (let i = formationHeaderIndex + 1; i < rows.length; i++) {
                    const row = rows[i];
                    const [playTypeStr, formationName, labelsStr, coordsStr, jerseysStr] = [row[0], row[1], row[2], row[3], row[4]];
                    if (!playTypeStr || !formationName || !labelsStr || !coordsStr) continue;
                    const playType = Object.values(PlayType).find(pt => pt.toLowerCase() === String(playTypeStr).toLowerCase());
                    if (!playType) throw new Error(`Invalid 'Play Type' "${playTypeStr}" in sheet '${week}'.`);
                    const labels = labelsStr.toString().split(',').map((s:string) => s.trim());
                    const coords = coordsStr.toString().split(',').map((s:string) => s.trim());
                    if (labels.length !== coords.length) throw new Error(`Mismatched labels and coordinates for "${formationName}" in sheet '${week}'.`);
                    const positions: FormationPosition[] = coords.map((c: string, index: number) => {
                        const [left, top] = c.split(':');
                        if (!left || !top) throw new Error(`Invalid coordinate format "${c}" for "${formationName}" in sheet '${week}'.`);
                        return { label: labels[index], left, top };
                    });
                    const presetPlayerJerseys = jerseysStr ? jerseysStr.toString().split(',').map((s:string) => parseInt(s.trim(), 10)).filter(Number.isFinite) : undefined;
                    formationUpdates.push({ week, playType, formationName, formation: { positions }, presetPlayerJerseys });
                    processedFormations++;
                }
            }
        }
        handleImport(rosterUpdates, formationUpdates, opponentUpdates);
        setSuccessMessage(`Import successful! ${processedRosters} player statuses and ${processedFormations} formations processed across all weeks.`);

    }, [file, handleImport, seasonWeeks]);

    const handleProcessPlaybook = useCallback(async () => {
        if (!file) return;
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);

        if (!workbook.SheetNames.includes('Formations')) {
            throw new Error("Invalid playbook file. The file must contain a sheet named 'Formations'.");
        }

        const sheet = workbook.Sheets['Formations'];
        const allRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
        const formationUpdates: ParsedFormation[] = [];

        // Find the header row index. This is more robust than a fixed range.
        const headerRowIndex = allRows.findIndex(row => row && row[0] === 'Play Type' && row[1] === 'Formation Name');
        
        if (headerRowIndex === -1) {
            throw new Error("Could not find the header row ('Play Type', 'Formation Name', etc.) in the 'Formations' sheet. Please use the template.");
        }

        const startRow = headerRowIndex + 1;

        for (let i = startRow; i < allRows.length; i++) {
            const row = allRows[i];
            if (!row || row.length === 0 || !row[0]) continue; // Skip empty rows

            const [playTypeStr, formationName, labelsStr, coordsStr, jerseysStr] = [row[0], row[1], row[2], row[3], row[4]];
            
            if (!playTypeStr || !formationName || !labelsStr || !coordsStr) continue;

            const playType = Object.values(PlayType).find(pt => pt.toLowerCase() === String(playTypeStr).toLowerCase());
            if (!playType) {
                throw new Error(`Invalid 'Play Type' "${playTypeStr}" for formation "${formationName}".`);
            }

            const labels = String(labelsStr).split(',').map(s => s.trim());
            const coords = String(coordsStr).split(',').map(s => s.trim());
            if (labels.length !== coords.length) {
                throw new Error(`Mismatched labels and coordinates for "${formationName}". Expected ${labels.length} coordinates, but found ${coords.length}.`);
            }

            const positions: FormationPosition[] = coords.map((c, index) => {
                if (!c || !c.includes(':')) {
                    throw new Error(`Invalid coordinate format "${c}" for position "${labels[index]}" in formation "${formationName}". Expected "left%:top%".`);
                }
                const [left, top] = c.split(':');
                if (!left || !top) {
                    throw new Error(`Invalid coordinate format "${c}" for position "${labels[index]}" in formation "${formationName}". Expected "left%:top%".`);
                }
                return { label: labels[index], left, top };
            });

            const presetPlayerJerseys = jerseysStr ? String(jerseysStr).split(',').map(s => parseInt(s.trim(), 10)).filter(Number.isFinite) : undefined;
            formationUpdates.push({ playType, formationName, formation: { positions }, presetPlayerJerseys });
        }

        if (formationUpdates.length === 0) {
            // This is not an error, just info.
            setSuccessMessage("No new formations found in the file to import.");
        } else {
            handleImport([], formationUpdates, []);
            setSuccessMessage(`Playbook import successful! ${formationUpdates.length} formations processed.`);
        }

    }, [file, handleImport]);

    const handleProcess = useCallback(async () => {
        if (!file) { setError("Please select a file first."); return; }
        setIsLoading(true); setError(null); setSuccessMessage(null);
        try {
            if (activeTab === 'season') {
                await handleProcessSeasonPlan();
            } else {
                await handleProcessPlaybook();
            }
        } catch (e: any) {
            setError(e.message || "An unexpected error occurred while processing the file.");
        } finally {
            setIsLoading(false);
        }
    }, [file, activeTab, handleProcessSeasonPlan, handleProcessPlaybook]);

    const tabButtonStyle = "flex-1 py-3 px-2 text-sm font-bold border-b-2 transition-colors duration-200 focus:outline-none focus:bg-white/5";
    const activeTabStyle = "border-[var(--accent-primary)] text-[var(--accent-primary)]";
    const inactiveTabStyle = "border-transparent text-[var(--text-secondary)] hover:text-white";

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="glass-effect rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Import Data</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-[var(--text-primary)]" aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>

                <div className="px-6 border-b border-[var(--border-primary)]">
                    <nav className="flex -mb-px">
                        <button onClick={() => setActiveTab('season')} className={`${tabButtonStyle} ${activeTab === 'season' ? activeTabStyle : inactiveTabStyle}`}>Season Plan</button>
                        <button onClick={() => setActiveTab('playbook')} className={`${tabButtonStyle} ${activeTab === 'playbook' ? activeTabStyle : inactiveTabStyle}`}>Playbook</button>
                    </nav>
                </div>

                <main className="p-6 overflow-y-auto space-y-4">
                    {activeTab === 'season' && (
                        <>
                            <div>
                                <h3 className="font-semibold text-lg text-[var(--text-primary)] mb-2">Instructions</h3>
                                <div className="text-sm text-[var(--text-secondary)] bg-black/20 p-3 rounded-lg space-y-2">
                                <p><InfoIcon /> This will generate a single Excel file with a tab for each week of the season.</p>
                                <p><InfoIcon /> In each tab, you can set the opponent, update player statuses, and define custom formations for that week.</p>
                                <p><InfoIcon /> All changes across all tabs will be saved when you import the file.</p>
                                </div>
                            </div>
                            <div>
                                <button onClick={handleDownloadSeasonTemplate} className="w-full justify-center flex items-center gap-2 px-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold rounded-lg hover:bg-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-400 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    Download Season Plan Template
                                </button>
                            </div>
                        </>
                    )}
                     {activeTab === 'playbook' && (
                        <>
                            <div>
                                <h3 className="font-semibold text-lg text-[var(--text-primary)] mb-2">Instructions</h3>
                                <div className="text-sm text-[var(--text-secondary)] bg-black/20 p-3 rounded-lg space-y-2">
                                <p><InfoIcon /> Use this template to bulk-add or update your team's formations.</p>
                                <p><InfoIcon /> The file should contain one sheet named "Formations".</p>
                                <p><InfoIcon /> This will add or overwrite formations globally for your team and apply to all weeks.</p>
                                </div>
                            </div>
                            <div>
                                <button onClick={handleDownloadPlaybookTemplate} className="w-full justify-center flex items-center gap-2 px-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold rounded-lg hover:bg-[var(--border-primary)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-400 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    Download Playbook Template
                                </button>
                            </div>
                        </>
                    )}
                    <div>
                        <label htmlFor="file-upload" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Upload Completed Template</label>
                        <input id="file-upload" type="file" onChange={handleFileChange} accept=".xlsx, .xls" className="block w-full text-sm text-[var(--text-secondary)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--bg-tertiary)] file:text-[var(--text-primary)] hover:file:bg-[var(--border-primary)]" />
                    </div>
                    
                    {error && <div className="p-3 text-sm text-red-400 bg-red-900/40 rounded-lg" role="alert">{error}</div>}
                    {successMessage && <div className="p-3 text-sm text-green-400 bg-green-900/40 rounded-lg" role="alert">{successMessage}</div>}
                </main>
                <footer className="p-4 border-t border-[var(--border-primary)] flex justify-end space-x-4">
                    <button onClick={onClose} className="px-6 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold rounded-lg hover:bg-[var(--border-primary)] focus:outline-none">Cancel</button>
                    <button onClick={handleProcess} disabled={!file || isLoading} className="flex items-center justify-center gap-2 px-6 py-2 bg-[var(--accent-primary)] text-white font-bold rounded-lg hover:bg-[var(--accent-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-[var(--accent-primary)] disabled:bg-gray-500 disabled:cursor-not-allowed">
                        {isLoading && <SpinnerIcon className="w-5 h-5" />}
                        {isLoading ? 'Processing...' : 'Import & Apply'}
                    </button>
                </footer>
            </div>
        </div>
    );
};
export default ImportModal;

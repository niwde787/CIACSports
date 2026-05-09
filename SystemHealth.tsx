import React, { useState, useCallback } from 'react';
import { SpinnerIcon } from './icons';
import { PlayerStatus } from '../types';

declare const XLSX: any;

interface ImportedPlayer {
    jerseyNumber: number;
    name: string;
    position: string;
    status: PlayerStatus;
}

interface RosterImportModalProps {
    onClose: () => void;
    onImport: (players: ImportedPlayer[]) => Promise<void>;
}

const RosterImportModal: React.FC<RosterImportModalProps> = ({ onClose, onImport }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFile(event.target.files[0]);
            setError(null);
        }
    };

    const handleDownloadTemplate = () => {
        const ws_data = [
            ["Jersey Number", "First Name", "Last Name", "Position (Optional)", "Status"],
            [1, "John", "Doe", "QB", "Playing"],
            [2, "Jane", "Smith", "LT,LG", "Injured"],
            ["", "", "", "", "(Playing, Injured, Absent, Discipline)"]
        ];
        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        ws['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 }];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Roster");
        XLSX.writeFile(wb, "Roster_Template.xlsx");
    };

    const handleProcessFile = useCallback(async () => {
        if (!file) {
            setError("Please select a file first.");
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const rows: any[] = XLSX.utils.sheet_to_json(sheet, { header: ["jerseyNumber", "firstName", "lastName", "position", "status"], range: 1 });

            const importedPlayers: ImportedPlayer[] = [];
            for (const row of rows) {
                const jerseyNumber = parseInt(row.jerseyNumber, 10);
                
                // Only process rows that have at least a jersey number to avoid empty helper rows.
                if (Number.isFinite(jerseyNumber)) {
                    const firstName = row.firstName?.toString().trim();
                    const lastName = row.lastName?.toString().trim();
                    const position = row.position?.toString().trim().toUpperCase() || '';
                    const statusStr = row.status?.toString().trim();

                    if (!firstName || !lastName || !statusStr) {
                         throw new Error(`Row for Jersey #${jerseyNumber} is missing required data. Please fill in First Name, Last Name, and Status.`);
                    }

                    const name = `${lastName}, ${firstName}`;
                    
                    const validStatus = Object.values(PlayerStatus).find(s => String(s).toLowerCase() === String(statusStr).toLowerCase());
                    if (!validStatus) {
                        throw new Error(`Invalid status "${statusStr}" for jersey #${jerseyNumber}. Valid statuses are: Playing, Injured, Absent, Discipline.`);
                    }

                    importedPlayers.push({ jerseyNumber, name, position, status: validStatus });
                }
            }

            if (importedPlayers.length === 0) {
                throw new Error("No valid player data found in the file. Ensure the file is not empty and columns are correctly filled.");
            }

            await onImport(importedPlayers);
            onClose();

        } catch (e: any) {
            setError(e.message || "An unexpected error occurred while processing the file.");
        } finally {
            setIsLoading(false);
        }
    }, [file, onImport, onClose]);


    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="glass-effect rounded-lg shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Import Roster</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-[var(--text-primary)]" aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </header>
                <main className="p-6 space-y-4">
                    <p className="text-sm text-[var(--text-secondary)]">Import players from an Excel (.xlsx, .xls) or CSV file. The file should have columns: 'Jersey Number', 'First Name', 'Last Name', 'Position', and 'Status'. The 'Position' column is optional and can be left blank. Multiple positions can be added, separated by a comma (e.g., "QB,WR"). Players with matching names or jersey numbers will be updated; new players will be added.</p>
                    <button onClick={handleDownloadTemplate} className="w-full justify-center flex items-center gap-2 px-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold rounded-lg hover:bg-[var(--border-primary)]">Download Template</button>
                    <div>
                        <label htmlFor="roster-file-upload" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Upload File</label>
                        <input id="roster-file-upload" type="file" onChange={handleFileChange} accept=".xlsx, .xls, .csv" className="block w-full text-sm text-[var(--text-secondary)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--bg-tertiary)] file:text-[var(--text-primary)] hover:file:bg-[var(--border-primary)]" />
                    </div>
                    {error && <div className="p-3 text-sm text-red-400 bg-red-900/40 rounded-lg" role="alert">{error}</div>}
                </main>
                <footer className="p-4 border-t border-[var(--border-primary)] flex justify-end space-x-4">
                    <button onClick={onClose} className="px-6 py-2 bg-[var(--bg-secondary)] text-[var(--text-primary)] font-semibold rounded-lg hover:bg-[var(--border-primary)]">Cancel</button>
                    <button onClick={handleProcessFile} disabled={!file || isLoading} className="flex items-center justify-center gap-2 px-6 py-2 bg-[var(--accent-primary)] text-white font-bold rounded-lg hover:bg-[var(--accent-primary-hover)] disabled:bg-gray-500">
                        {isLoading && <SpinnerIcon className="w-5 h-5" />}
                        {isLoading ? 'Importing...' : 'Import & Merge'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default RosterImportModal;

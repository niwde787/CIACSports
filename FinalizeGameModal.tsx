import React from 'react';
import { createPortal } from 'react-dom';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]">
            <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl shadow-2xl border border-[var(--border-primary)] w-full max-w-sm animate-fade-in">
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">{title}</h2>
                <p className="text-[var(--text-secondary)] mb-6">{message}</p>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-tertiary)] rounded-md hover:bg-[var(--border-primary)]">Cancel</button>
                    <button onClick={() => { onConfirm(); onClose(); }} className="px-4 py-2 text-sm font-medium text-white bg-[var(--accent-danger)] rounded-md hover:bg-[var(--accent-danger)]/80">Confirm</button>
                </div>
            </div>
        </div>,
        document.getElementById('modal-root')!
    );
};

export default ConfirmationModal;

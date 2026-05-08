import React from 'react';
import { PlayResult } from '../types';

export const ResetIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none">
        <circle cx="12" cy="12" r="10" />
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="12px" fontWeight="bold" fill="currentColor" stroke="none">R</text>
    </svg>
);

export const UndoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l4-4m-4 4l4 4" />
    </svg>
);

export const RedoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-4-4m4 4l-4 4" />
    </svg>
);

export const ReportsIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

export const ImportIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);

export const DuplicateIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
);

export const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 31.58 31.58" fill="currentColor">
        <path d="M31.58,18.25v-4.93l-3.75-.75c-.29-1.07-.71-2.08-1.25-3.02l2.12-3.18-3.49-3.49-3.18,2.12c-.94-.54-1.95-.96-3.02-1.25l-.75-3.75h-4.93l-.75,3.75c-1.07.28-2.09.71-3.02,1.25l-3.19-2.12-3.48,3.49,2.13,3.19c-.55.93-.97,1.94-1.26,3.01l-3.76.75v4.93l3.76.75c.29,1.07.71,2.08,1.25,3.02l-2.12,3.19,3.48,3.49,3.19-2.13c.93.54,1.95.97,3.02,1.25l.75,3.76h4.93l.75-3.76c1.07-.28,2.08-.71,3.02-1.25l3.18,2.13,3.49-3.49-2.12-3.19c.55-.94.97-1.95,1.25-3.02l3.75-.75ZM15.79,23.3c-4.14,0-7.51-3.36-7.51-7.51s3.37-7.51,7.51-7.51,7.52,3.36,7.52,7.51-3.37,7.51-7.52,7.51Z"/>
    </svg>
);

export const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 21.75l-.648-1.188a2.25 2.25 0 01-1.4-1.4L13.25 18l1.188-.648a2.25 2.25 0 011.4-1.4L16.25 15l.648 1.188a2.25 2.25 0 011.4 1.4L19.25 18l-1.188.648a2.25 2.25 0 01-1.4 1.4z" />
    </svg>
);

export const ClockPlayIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
);

export const ClockPauseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
    </svg>
);

export const DashboardIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 83.33" className={className} fill="currentColor">
      <g>
        <path d="M40.88,71.66c-5.49,11.02-19.48,14.91-30.15,8.75C-.17,74.12-3.3,59.68,3.83,49.29c.43-.63,2.77-3.2,2.83-3.41.51-1.72-.3-5.48.06-7.43C-.01,36.89-.01,28.09,6.72,26.53V4.28C7.04,1.92,8.77.22,11.17,0h84.34c2.17.2,3.69,1.54,4.33,3.59.34,21.16.04,42.39.15,63.58-.22,2.11-1.55,3.73-3.59,4.33-18.48.35-37.02,0-55.52.18ZM42.3,68.3h52.78c.83,0,1.71-1.35,1.57-2.18-.15-20.54.25-41.14-.2-61.65-.31-.83-1.14-1.12-1.98-1.14H12.21c-.83-.14-2.18.74-2.18,1.57v22.38l.95-.2,7.71-6.88c-.08-1.27-.47-2.31-.32-3.64.24-2.17,2.37-4.5,4.53-4.84,5.47-.87,8.85,4.21,6.32,8.99,1.31.69,5.54,4.93,6.59,5.09.48.08,1.63-.71,2.45-.8.61-.07,1.64-.05,2.24.05.9.15,1.66,1.13,2.43.46l8.77-7.26c.27-1.07-.17-2.3,0-3.53.58-4.16,5.9-6.11,9.25-3.66,5.07,3.72,1.69,11.67-4.74,10.57-.77-.13-1.56-.91-2.24-.7-.98,1.1-9.24,7.12-9.3,7.72-.02.2.31.7.34,1.06.6,8.92-10.51,8.8-11.59,2.43-.21-1.21.1-2.4.06-3.59l-6.98-5.51c-1.83.55-3.55.41-5.3-.32l-8.14,7.09c-.2.37.28,1.35.33,1.97.21,2.39-.64,4.2-2.52,5.62-.29.22-.82.28-.82.32v5.62c17.13-10.85,38.61,5.7,32.27,24.98ZM57.43,13.41c-3.17.09-3.04,4.94.14,4.85s3.04-4.94-.14-4.85ZM24.12,15.07c-3.17.09-3.04,4.94.14,4.85s3.04-4.94-.14-4.85ZM39.11,28.4c-3.17.09-3.04,4.94.14,4.85s3.04-4.94-.14-4.85ZM7.46,30.06c-3.17.09-3.04,4.94.14,4.85s3.04-4.94-.14-4.85ZM20.03,43.52C7.91,44.41-.03,57.58,4.93,68.71l15.1-8.22v-16.97ZM39.81,59.97c-.62-8.59-7.87-15.83-16.45-16.45v16.45h16.45ZM39.81,63.3h-17.59l-15.5,8.45c3.47,5.93,11.03,8.96,17.73,7.94,8.12-1.24,14.76-8.15,15.36-16.39Z"/>
        <path d="M55.01,61.64v-19.26c0-.76,1.36-2.04,2.12-2.25.93-.27,4.82-.27,5.76,0,.7.2,2.12,1.63,2.12,2.25v19.26h1.67v-24.26c0-.76,1.36-2.04,2.12-2.25.93-.27,4.82-.27,5.76,0,.7.2,2.12,1.63,2.12,2.25v24.26h1.67v-14.26c0-.76,1.36-2.04,2.12-2.25.93-.27,4.82-.27,5.76,0,.7.2,2.12,1.63,2.12,2.25v14.26h4.06c.07,0,.84.79.89.98.32,1.05-.16,2.21-1.3,2.36h-37.5c-2.45-.28-4.25-1.98-4.48-4.48l.12-28.01c.84-1.3,2.67-1.18,3.22.31v26.85c.13,1.15.56,1.67,1.67,1.98ZM73.33,38.32h-3.33v23.32h3.33v-23.32ZM61.67,43.31h-3.33v18.32h3.33v-18.32ZM84.99,48.31h-3.33v13.32h3.33v-13.32Z"/>
        <path d="M74.31,10.05l16.19-.04c1.7.54,1.55,3.11-.19,3.34l-15.83-.02c-1.55-.56-1.6-2.55-.17-3.28Z"/>
        <path d="M74.31,16.71l16.19-.04c1.7.54,1.55,3.11-.19,3.34l-15.83-.02c-1.55-.56-1.6-2.55-.17-3.28Z"/>
        <path d="M74.31,23.37l16.19-.04c1.7.54,1.55,3.11-.19,3.34l-15.83-.02c-1.55-.56-1.6-2.55-.17-3.28Z"/>
        <path d="M69.31,10.05c3.16-.94,3.16,4.18,0,3.24-1.34-.4-1.34-2.84,0-3.24Z"/>
        <path d="M69.31,16.71c3.16-.94,3.16,4.18,0,3.24-1.34-.4-1.34-2.84,0-3.24Z"/>
        <path d="M69.31,23.37c3.16-.94,3.16,4.18,0,3.24-1.34-.4-1.34-2.84,0-3.24Z"/>
      </g>
    </svg>
);

export const GameIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 41.42 35.25" className={className} fill="currentColor">
        <path d="M41.05,24.96c-.02-.53-.46-.95-.99-.93l-6.27.12c-.34-2.01-.64-4.16-.89-6.24,1.12-.03,2.05-.09,2.24-.2.54-.3.19-5.64-.6-6.14-.27-.17-1.06-.23-1.99-.24C30.31,4.74,24.08,0,16.73,0,7.49,0,0,7.49,0,16.73c0,3.93.64,10.16,2.91,13.01,1.64,2.07,5.94-.19,8.57.22,2.27.35,2.79,3.5,5.25,3.5,4.06,0,7.78-1.44,10.68-3.85.56-.47,2.36-1.57,2.79-3.46l1.95-.04c1.66,9.13,3.28,9.13,3.89,9.13h4.42c.26,0,.52-.11,.7-.3.18-.19,.28-.45,.27-.71l-.36-9.28ZM19.45,28.66c-1.04,0-1.89-.84-1.89-1.89s.85-1.89,1.89-1.89,1.89.84,1.89,1.89-.84,1.89-1.89-1.89ZM30.14,24.21c-.54-2.51-2.3-5.94.17-6.27.21,0,.43,0,.65,0,.28,2.39.56,4.46.85,6.24l-1.67.03ZM36.2,33.31c-.62-.66-1.38-3.56-2.06-7.23l5.01-.09.29,7.32h-3.24Z"/>
    </svg>
);

export const RosterIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44.57 33.04" className={className} fill="currentColor">
        <g>
            <path d="M43.28,8.58l-6.9,6.9,1.25,1.33c2.97-2.97,4.99-4.99,6.94-6.94,0,0-.51-.51-1.29-1.29Z"/>
            <path d="M26.45,13.89c-.63,0-1.04.58-1.04.9v6.27c0,.33.41.89,1.04.89s1.02-.56,1.02-.89v-6.27c0-.33-.41-.9-1.02-.9Z"/>
            <path d="M1.58,8.29c-.95.94-1.58,1.58-1.58,1.58,4.51,4.51,2.9,2.9,6.94,6.94l1.53-1.63L1.58,8.29Z"/>
            <path d="M42.08,7.38c-2.07-2.07-4.89-4.89-6.21-6.21-2.09-2.09-8.53-.85-8.53-.28,0,2.78-2.25,5.03-5.03,5.03,0,0-.02,0-.03,0,0,0-.01,0-.02,0-2.78,0-5.03-2.25-5.03-5.03,0-.57-6.43-1.82-8.53.28-1.26,1.26-3.88,3.88-5.92,5.92l6.86,6.86,1.25-1.33v16.17c0,2.35,1.91,4.26,4.26,4.26h14.26c2.35,0,4.26-1.91,4.26-4.26V12.61l1.53,1.63,6.87-6.87ZM20.32,17.82s-.49.45-1.48,1.4c-.95.9-1.07,1.85-1.07,2.32,0,.17.02.28.02.28h3.9v1.56h-6.07s-.22-.22-.22-1.37c0-1.42.77-2.8,1.62-3.69l2.13-2.23c.49-.53.63-.86.63-1.34s-.45-.86-.97-.86-.95.42-.95,1.18v.45h-2.13v-.76c0-1.45,1.28-2.43,3.08-2.43s3.14.95,3.14,2.43-.5,1.84-1.62,3.05ZM29.62,21.09c0,1.1-1.02,2.43-3.17,2.43s-3.19-1.32-3.19-2.43v-6.31c0-1.11,1.04-2.44,3.19-2.44s3.17,1.34,3.17,2.44v6.31Z"/>
        </g>
    </svg>
);

export const PlayLogIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 39.29 48.94" className={className} fill="currentColor">
      <g>
        <path d="M37.81,0H1.48C.66,0,0,.66,0,1.48v45.98c0,.82.66,1.48,1.48,1.48h36.33c.82,0,1.48-.66,1.48-1.48V1.48c0-.82-.66-1.48-1.48-1.48ZM3.78,2.29c0-.61.49-1.1,1.1-1.1s1.1.49,1.1,1.1-.49,1.1-1.1,1.1-1.1-.49,1.1-1.1ZM25.22,44.19H5.16v-4.94h20.06v4.94ZM25.22,34.68H5.16v-4.94h20.06v4.94ZM25.22,25.17H5.16v-4.94h20.06v4.94ZM25.22,15.66H5.16v-4.94h20.06v4.94ZM35.12,44.68c0,.32-.26.57-.57.57h-5.34c-.32,0-.57-.26-.57-.57v-5.34c0-.32.26-.57.57-.57h5.34c.32,0,.57.26,.57.57v5.34ZM35.12,34.97c0,.32-.26.57-.57.57h-5.34c-.32,0-.57-.26-.57-.57v-5.34c0-.32.26-.57.57-.57h5.34c.32,0,.57.26,.57.57v5.34ZM35.12,25.27c0,.32-.26.57-.57.57h-5.34c-.32,0-.57-.26-.57-.57v-5.34c0-.32.26-.57.57-.57h5.34c.32,0,.57.26,.57.57v5.34ZM35.12,15.57c0,.32-.26.57-.57.57h-5.34c-.32,0-.57-.26-.57-.57v-1.73c-.14-.26-.14-.56,0-.82v-2.79c0-.32.26-.57.57-.57h5.34c.32,0,.57.26,.57.57v.73c.11.23.1.49,0,.71v3.89ZM35.12,3.39c-.61,0-1.1-.49-1.1-1.1s.49-1.1,1.1-1.1,1.1.49,1.1,1.1-.49,1.1-1.1-1.1Z"/>
        <path d="M35.12,10.96c-.05-.1-.11-.19-.2-.27-.35-.32-.9-.3-1.22.06l-2.77,3.03-.94-.96c-.34-.34-.88-.34-1.22,0-.06.06-.09.13-.13.2-.14.26-.14-.56,0,.82.04.07.07.14.13.2l1.58,1.6c.16.16.38.25.61.25,0,0,.01,0,.02,0,.24,0,.46-.11.62-.28l3.38-3.7c.06-.07.1-.15.14-.24.1-.23.11-.49,0-.71Z"/>
      </g>
    </svg>
);

export const FormationIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 73.53 64.09" className={className} fill="currentColor">
        <g>
            <path d="M11.59,35.05c-.72-.72-1.88-.72-2.6,0l-2.31,2.31-2.31-2.31c-.72-.72-1.88-.72-2.6,0-.72.72-.72,1.88,0,2.6l2.31,2.31-2.31,2.31c-.72.72-.72,1.88,0,2.6.72.72,1.88.72,2.6,0l2.31-2.31,2.31,2.31c.72.72,1.88.72,2.6,0,.72-.72.72-1.88,0-2.6l-2.31-2.31,2.31-2.31c.72-.72.72-1.88,0-2.6Z"/>
            <path d="M23.21,37.64l2.31,2.31-2.31,2.31c-.72.72-.72,1.88,0,2.6.72.72,1.88.72,2.6,0l2.31-2.31,2.31,2.31c.72.72,1.88.72,2.6,0,.72-.72.72-1.88,0-2.6l-2.31-2.31,2.31-2.31c.72-.72.72,1.88,0-2.6-.72-.72-1.88-.72-2.6,0l-2.31,2.31-2.31-2.31c-.72-.72-1.88-.72-2.6,0-.72.72-.72,1.88,0,2.6Z"/>
            <path d="M33.02,19.13c-.72-.72-1.88-.72-2.6,0l-2.31,2.31-2.31-2.31c-.72-.72-1.88-.72-2.6,0-.72.72-.72,1.88,0,2.6l2.31,2.31-2.31,2.31c-.72.72-.72,1.88,0,2.6.72.72,1.88.72,2.6,0l2.31-2.31,2.31,2.31c.72.72,1.88.72,2.6,0,.72-.72.72-1.88,0-2.6l-2.31-2.31,2.31-2.31c.72-.72.72-1.88,0-2.6Z"/>
            <path d="M47.54,24.44l-2.31,2.31c-.72.72-.72,1.88,0,2.6.72.72,1.88.72,2.6,0l2.31-2.31,2.31,2.31c.72.72,1.88.72,2.6,0,.72-.72.72-1.88,0-2.6l-2.31-2.31,2.31-2.31c.72-.72.72,1.88,0-2.6-.72-.72-1.88-.72-2.6,0l-2.31,2.31-2.31-2.31c-.72-.72-1.88-.72-2.6,0-.72.72-.72,1.88,0,2.6l2.31,2.31Z"/>
            <path d="M50.14,46.64c3.69,0,6.68-3,6.68-6.68s-3-6.69-6.68-6.69-6.69,3-6.69,6.69,3,6.68,6.69,6.68ZM50.14,36.94c1.66,0,3.01,1.35,3.01,3.01s-1.35,3.01-3.01-3.01-3.01-1.35-3.01-3.01,1.35-3.01,3.01-3.01Z"/>
            <path d="M28.12,0c-3.69,0-6.69,3-6.69,6.69s3,6.68,6.69,6.68,6.68-3,6.68-6.68S31.8,0,28.12,0ZM28.12,9.7c-1.66,0-3.01-1.35-3.01-3.01s1.35-3.01,3.01,3.01,3.01,1.35,3.01,3.01-1.35,3.01-3.01-3.01Z"/>
            <path d="M65.86,14.7c3.69,0,6.68-3,6.68-6.68s-3-6.68-6.68-6.68-6.69,3-6.69,6.68,3,6.68,6.69,6.68ZM65.86,5c1.66,0,3.01,1.35,3.01,3.01s-1.35,3.01-3.01-3.01-3.01-1.35-3.01-3.01,1.35-3.01,3.01-3.01Z"/>
            <path d="M6.69,17.76c-3.69,0-6.69,3-6.69,6.69s3,6.68,6.69,6.68,6.68-3,6.68-6.68-3-6.69-6.68-6.69ZM6.69,27.45c-1.66,0-3.01-1.35-3.01-3.01s1.35-3.01,3.01,3.01,3.01,1.35,3.01,3.01-1.35,3.01-3.01-3.01Z"/>
            <path d="M28.12,50.72c-3.69,0-6.69,3-6.69,6.69s3,6.68,6.69,6.68,6.68-3,6.68-6.68-3-6.69-6.68-6.69ZM28.12,60.41c-1.66,0-3.01-1.35-3.01-3.01s1.35-3.01,3.01,3.01,3.01,1.35,3.01,3.01-1.35,3.01-3.01-3.01Z"/>
            <path d="M73.13,26.91l-4.74-6.23c-.39-.51-1-.81-1.64-.78-.64.02-1.23.35-1.59.89l-4.38,6.63c-.6.91-.35,2.14.56,2.74.34.22.72.33,1.09.33.64,0,1.27-.31,1.65-.89l1.17-1.78v16.93c0,8.55-2.62,11.74-9.68,11.74h-15.33v3.67h15.33c11.97,0,13.35-8.79,13.35-15.41v-16.81l1.04,1.37c.66.87,1.91,1.04,2.78.38.87-.66,1.04-1.91.38-2.78Z"/>
        </g>
    </svg>
);

export const EditIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
);

export const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);

export const PlusCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
    </svg>
);

export const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

export const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);

export const LogoutIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

export const FootballIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50.67 29.65" className={className} fill="currentColor">
        <g>
            <path d="M6.54,5.34C2.48,8.07,0,11.51,0,14.83c0,3.09,2.63,6.28,6.54,8.91V5.34Z"/>
            <path d="M40.16,3.26c-4.18-1.97-9.31-3.26-14.83-3.26-5.21,0-10.08,1.08-14.13,2.82v23.52c4.39,2.02,9.48,3.31,14.13,3.31,4.89,0,10.28-1.53,14.83-3.79V3.26ZM35.95,16.16h-.69v.09c0,.68-.55,1.23-1.23,1.23s-1.24-.55-1.24-1.23v-.09h-1.42v.09c0,.68-.55,1.23-1.23,1.23s-1.24-.55-1.24-1.23v-.09h-1.42v.09c0,.68-.55,1.23-1.23,1.23s-1.23-.55-1.23-1.23v-.09h-1.42v.09c0,.68-.55,1.23-1.23,1.23s-1.24-.55-1.24-1.23v-.09h-1.42v.09c0,.68-.55,1.23-1.24,1.23s-1.23-.55-1.23-1.23v-.09h-.96c-.63,0-1.14-.51-1.14-1.14s.51-1.14,1.14-1.14h.96v-.32c0-.68.55-1.23,1.23-1.23s1.24.55,1.24,1.23v.32h1.42v-.32c0-.68.55,1.23,1.24-1.23s1.23.55,1.23,1.23v.32h1.42v-.32c0-.68.55-1.23,1.23-1.23s1.23.55,1.23,1.23v.32h1.42v-.32c0-.68.55-1.23,1.24-1.23s1.23.55,1.23,1.23v.32h1.42v-.32c0-.68.55-1.23,1.24-1.23s1.23.55,1.23,1.23v.32h.69c.63,0,1.14.51,1.14,1.14s-.51,1.14-1.14-1.14Z"/>
            <path d="M44.83,6.02v17.04c3.52-2.56,5.84-5.52,5.84-8.23,0-2.92-2.2-6.12-5.84-8.81Z"/>
        </g>
    </svg>
);

export const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const TouchdownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

export const TurnoverIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
    </svg>
);

const SafetyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5.268l4.262-4.262a1 1 0 111.414 1.414L13.414 8.5h5.268a1 1 0 01.954 1.285l-4.485 9.967a1 1 0 01-1.89-.853L13.732 12H8.464a1 1 0 01-.954-1.285l4.485-9.967a1 1 0 01.305-.702z" clipRule="evenodd" />
    </svg>
);

export const FieldGoalIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M10 18V9" />
        <path d="M4 9h12" />
        <path d="M4 9V3" />
        <path d="M16 9V3" />
    </svg>
);

export const StarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);

export const PassingIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
    </svg>
  );
  
  export const RunningIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM.464 10.536a1 1 0 011.414 0L4 12.621V7a1 1 0 112 0v6a1 1 0 01-1 1H1a1 1 0 110-2h2.121L.464 11.95a1 1 0 010-1.414zM11.121 4.879A1 1 0 0112 4h4a1 1 0 011 1v2.121l-2.05-2.05a1 1 0 010-1.414zM11 13a1 1 0 100 2h5a1 1 0 100-2h-5z" clipRule="evenodd" />
    </svg>
  );
  
  export const TacklingIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-8a1 1 0 10-2 0v4a1 1 0 102 0v-4zm2 0a1 1 0 10-2 0v4a1 1 0 102 0v-4zm2 0a1 1 0 10-2 0v4a1 1 0 102 0v-4z" clipRule="evenodd" />
    </svg>
  );

export const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

export const FinalizeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const SpeakerOnIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    </svg>
);

export const SpeakerOffIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 19L5 5" />
    </svg>
);

export const ReplayPrevIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
    </svg>
);

export const ReplayNextIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
    </svg>
);

export const StopIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h6v4H9z" />
    </svg>
);

export const SubstitutionIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg id="Layer_2" data-name="Layer 2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 93.5" className={className} fill="currentColor">
      <g id="Layer_1-2" data-name="Layer 1">
        <g>
          <path d="M99.9,36.89c-1.25,4.3-6.45,4.07-9.91,3.13-3.39-1.46-2.35-4.56-3.27-7.37-1.12-3.44-4.88-6.4-8.57-6.4,0,0-56.19,0-56.19,0,6.82,6.58,6.39,6.74-.49,13.02-1.18.83-2.72.82-3.84-.09-23.49-24.51-23.5-14.1,0-38.47,1.12-.92,2.67-.92,3.85-.09,6.87,6.28,7.32,6.43.49,13.02h58.55c10.65.54,20.63,12.64,19.39,23.27Z"/>
          <path d="M.1,56.6c1.25-4.3,6.45-4.07,9.91-3.13,3.39,1.46,2.35,4.56,3.27,7.37,1.12,3.44,4.88,6.4,8.57,6.4h56.19c-6.82-6.58-6.39-6.74.49-13.02,1.18-.83,2.72-.82,3.84.09,23.49,24.51,23.5,14.1,0,38.47-1.12.92,2.67.92,3.85.09-6.87-6.28-7.32-6.43-.49-13.02H19.49C8.84,79.33-1.14,67.23.1,56.6Z"/>
        </g>
      </g>
    </svg>
);

export const PlayResultIcon: React.FC<{ result: PlayResult }> = ({ result }) => {
    // Touchdowns
    if (result.includes('Touchdown') || result.includes('Opponent Scored') || result.includes('TD')) {
        return <TouchdownIcon className="w-5 h-5 text-[var(--accent-secondary)]" />;
    }
    // Turnovers
    if (result.includes('Turnover') || result.includes('Interception') || result.includes('Fumble') || result.includes('Lost') || result.includes('Blocked')) {
        return <TurnoverIcon className="w-5 h-5 text-[var(--accent-warning)]" />;
    }
    // Safeties
    if (result.includes('Safety')) {
        return <SafetyIcon className="w-5 h-5 text-[var(--accent-danger)]" />;
    }
    // Field Goals & PATs
    if (result.includes('Field Goal') || result.includes('PAT')) {
        return <FieldGoalIcon className="w-5 h-5 text-[var(--accent-primary)]" />;
    }
    // Sacks
    if (result.includes('Sack')) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[var(--accent-defense)]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v10.586l3.293-3.293a1 1 0 111.414 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 111.414-1.414L9 14.586V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
        );
    }
    // Tackle for Loss
    if (result.includes('Tackle for Loss')) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[var(--accent-defense)]" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM6.343 6.343a1 1 0 011.414 0L10 8.586l2.243-2.243a1 1 0 111.414 1.414L11.414 10l2.243 2.243a1 1 0 01-1.414 1.414L10 11.414l-2.243 2.243a1 1 0 01-1.414-1.414L8.586 10 6.343 7.757a1 1 0 010-1.414z" />
            </svg>
        );
    }
    // Out of Bounds
    if (result.includes('Out of Bounds')) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[var(--text-secondary)]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
        );
    }
    // Default/General
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[var(--text-secondary)]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C7.03 2 3 6.03 3 11v5.5c0 .83.67 1.5 1.5 1.5H6v2h4v-2h4v2h4v-2h1.5c.83 0 1.5-.67 1.5-1.5V11c0-4.97-4.03-9-9-9zm0 2c3.86 0 7 3.14 7 7H5c0-3.86 3.14-7 7-7zm3 9v3H9v-3h6z"/>
        </svg>
    );
};
export const CameraIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
);

export const TrophyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6V3m0 18v-3a6 6 0 006-6H6a6 6 0 006 6z" />
    </svg>
);

export const Icon: React.FC<{ name: string; className?: string }> = ({ name, className }) => (
    <svg className={className} aria-hidden="true">
        <use href={`#${name}`} />
    </svg>
);

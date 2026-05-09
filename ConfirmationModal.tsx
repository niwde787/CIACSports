import React from 'react';

const AwardsView: React.FC = () => {
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Awards &amp; Recognition</h2>
            <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)] p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64.38 126.64" className="h-24 w-24 text-[var(--accent-primary)] mb-4" fill="currentColor">
                    <path d="M32.27,0C-.03.02-12.22,41.58,15.08,59.46c.63.42,2.26,1.05,2.48,1.65v51.38s.21,1.17.21,1.17l12.71,12.71c.69.29.99.27,1.66.28.58,0,.94,0,1.52-.14l12.84-12.84c.37-2.08.6-5.15.35-7.25-.34-2.92-2.94-3.29-4.63-5.32,1.29-1.65,4.74-4.53,4.59-6.7-.15-2.05-3.28-4.49-4.39-6.21,1.03-2.06,4.51-2.7,4.43-5.39,0-.26-.29-1.39-.41-1.52l-4.35-4.35,4.35-4.35c.92-.92.12-9.94.46-11.72,8.58-4.51,14.77-12.5,16.78-21.97C67.89,18.95,52.74-.01,32.27,0ZM40.87,20.43c0,4.77-3.82,8.67-8.6,8.76-3.17-.06-6.12-1.6-7.72-4.33-1.6-2.73-1.6-6.12,0-8.86,1.6-2.73,4.56-4.39,7.72-4.33,4.77.09,8.6,3.99,8.6,8.76Z"/>
                </svg>
                <p className="text-lg text-[var(--text-secondary)]">This section is under development. It will feature team and player awards based on performance data.</p>
            </div>
        </div>
    );
};

export default AwardsView;

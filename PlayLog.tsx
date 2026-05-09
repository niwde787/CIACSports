import React, { useState } from 'react';
import { signIn, signUp } from '../firebase';
import { SpinnerIcon, ChevronLeftIcon } from './icons';

interface LoginScreenProps {
    onBack: () => void;
    initialMode?: 'login' | 'signup';
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onBack, initialMode = 'login' }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSigningUp, setIsSigningUp] = useState(initialMode === 'signup');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (isSigningUp && password.length < 6) {
            setError('Password must be at least 6 characters long.');
            setIsLoading(false);
            return;
        }

        try {
            if (isSigningUp) {
                await signUp(email, password);
            } else {
                const finalEmail = email.toLowerCase() === 'admin' ? 'livesnaps.admin@gmail.com' : email;
                await signIn(finalEmail, password);
            }
        } catch (err: any) {
            let message = err.message || 'An unknown error occurred.';
            if (message.includes('auth/invalid-credential') || message.includes('auth/wrong-password') || message.includes('auth/user-not-found')) {
                message = 'Invalid username or password. Please try again.';
            }
             if (isSigningUp && message.includes('auth/email-already-in-use')) {
                message = 'An account with this email already exists. Please sign in instead.';
            }
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-sm">
                 <div className="relative mb-8 text-center">
                    <button onClick={onBack} className="absolute left-0 top-1/2 -translate-y-1/2 p-2 text-[var(--text-secondary)] hover:text-white rounded-full hover:bg-white/10 transition-colors" aria-label="Go back">
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    <img src="https://raw.githubusercontent.com/niwde787/CJF/main/SNAPS_S.svg" alt="Snaps Logo" className="h-24 mx-auto" />
                </div>

                <form onSubmit={handleAuth} className="glass-effect rounded-2xl p-8 shadow-2xl animate-fade-in">
                    <h2 className="text-2xl font-bold text-center text-[var(--text-primary)] mb-6">{isSigningUp ? 'Create Account' : 'Sign In'}</h2>
                    
                    {error && (
                        <div className="bg-red-500/20 text-red-300 text-sm p-3 rounded-md mb-4 text-center">
                            {error}
                        </div>
                    )}

                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email or Username</label>
                        <input
                            type="text"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md py-2 px-3 text-[var(--text-primary)] focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]"
                            placeholder="you@example.com or Admin"
                            autoCapitalize="none"
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="password" className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={isSigningUp ? 6 : undefined}
                            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-md py-2 px-3 text-[var(--text-primary)] focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)]"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-[var(--accent-primary)] text-white font-bold rounded-lg hover:bg-[var(--accent-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)] focus:ring-[var(--accent-primary)] disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        {isLoading && <SpinnerIcon className="w-5 h-5" />}
                        {isLoading ? 'Processing...' : (isSigningUp ? 'Sign Up' : 'Sign In')}
                    </button>

                    <div className="text-center mt-4">
                        <button
                            type="button"
                            onClick={() => {
                                setIsSigningUp(!isSigningUp);
                                setError(null);
                            }}
                            className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-primary)]"
                        >
                            {isSigningUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginScreen;
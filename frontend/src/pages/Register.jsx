import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Toast } from '../components/ui/UIComponents';

export default function Register() {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
            setToast({ message: 'Please fill in all fields', type: 'error' });
            return;
        }

        if (username.length < 3) {
            setToast({ message: 'Username must be at least 3 characters', type: 'error' });
            return;
        }

        if (password.length < 6) {
            setToast({ message: 'Password must be at least 6 characters', type: 'error' });
            return;
        }

        if (password !== confirmPassword) {
            setToast({ message: 'Passwords do not match', type: 'error' });
            return;
        }

        setLoading(true);
        try {
            await register(username, password);
            navigate('/');
        } catch (error) {
            console.error('Register error:', error);
            const message = error.response?.data?.message || 'Registration failed';
            setToast({ message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f6f8f6] flex flex-col items-center justify-center p-6">
            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}

            <div className="w-full max-w-sm">
                {/* Logo/Title */}
                <div className="text-center mb-8">
                    <img
                        src="/favicon.png"
                        alt="HealthNHabits Logo"
                        className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-lg"
                    />
                    <h1 className="text-2xl font-black text-gray-900">Create Account</h1>
                    <p className="text-sm text-gray-500 mt-1">Start your health journey today</p>
                </div>

                {/* Register Form */}
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    {/* Username */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">person</span>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Choose a username"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#13ec13]/50 focus:border-[#13ec13] outline-none transition-all"
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">At least 3 characters</p>
                    </div>

                    {/* Password */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">lock</span>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Create a password"
                                className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#13ec13]/50 focus:border-[#13ec13] outline-none transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <span className="material-symbols-outlined text-xl">
                                    {showPassword ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">At least 6 characters</p>
                    </div>

                    {/* Confirm Password */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">lock</span>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm your password"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#13ec13]/50 focus:border-[#13ec13] outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#13ec13] hover:bg-[#0fd60f] text-black font-bold py-3.5 rounded-xl shadow-lg shadow-[#13ec13]/25 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="material-symbols-outlined animate-spin text-xl">sync</span>
                                Creating account...
                            </>
                        ) : (
                            <>
                                Sign Up
                                <span className="material-symbols-outlined text-xl">check</span>
                            </>
                        )}
                    </button>
                </form>

                {/* Login Link */}
                <p className="text-center text-sm text-gray-600 mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="text-[#13ec13] font-semibold hover:underline">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}

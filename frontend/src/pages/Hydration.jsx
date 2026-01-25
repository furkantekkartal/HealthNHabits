import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard, getLogByDate, addWaterEntry, removeWaterEntry, getProfile, updateProfile } from '../services/api';
import { useDate } from '../context/DateContext';
import { PageLoading, Toast } from '../components/ui/UIComponents';

// CSS for wave animation
const waveStyles = `
    .wave-container {
        position: relative;
        overflow: hidden;
        transform: translate3d(0, 0, 0);
    }
    .wave {
        opacity: 0.4;
        position: absolute;
        top: 10%;
        left: 50%;
        background: #bae6fd;
        width: 200%;
        height: 200%;
        margin-left: -100%;
        margin-top: -100%;
        transform-origin: 50% 48%;
        border-radius: 43%;
        animation: drift 6000ms infinite linear;
    }
    .wave.-three {
        animation: drift 8000ms infinite linear;
        opacity: 0.2;
        background: #7dd3fc;
    }
    .wave.-two {
        animation: drift 10000ms infinite linear;
        opacity: 0.1;
        background: #e0f2fe;
    }
    @keyframes drift {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;

const QUICK_AMOUNTS = [
    { amount: 200, label: '+200ml', icon: 'local_cafe', desc: 'Glass' },
    { amount: 500, label: '+500ml', icon: 'water_bottle', desc: 'Bottle', featured: true },
];

export default function Hydration() {
    const navigate = useNavigate();
    const { selectedDate, changeDate, isToday, formatDate, getDateString } = useDate();
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [water, setWater] = useState({ current: 0, goal: 2000 });
    const [dailyGoal, setDailyGoal] = useState(2000);
    const [showCustom, setShowCustom] = useState(false);
    const [customAmount, setCustomAmount] = useState('');
    const [showInsight, setShowInsight] = useState(true);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const profileRes = await getProfile();
                const waterGoal = profileRes.data?.dailyWaterGoal || 2000;
                setDailyGoal(waterGoal);

                if (isToday()) {
                    const dashRes = await getDashboard();
                    setWater({
                        current: dashRes.data.water?.current || 0,
                        goal: waterGoal
                    });
                } else {
                    try {
                        const logRes = await getLogByDate(getDateString());
                        setWater({
                            current: logRes.data.summary?.waterIntake || 0,
                            goal: waterGoal
                        });
                    } catch (e) {
                        setWater({ current: 0, goal: waterGoal });
                    }
                }
            } catch (err) {
                console.error('Error fetching water data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedDate]);

    const addWater = async (amount) => {
        setUpdating(true);
        try {
            const dateStr = isToday() ? undefined : getDateString();
            await addWaterEntry(amount, dateStr);
            setWater(prev => ({ ...prev, current: Math.max(0, prev.current + amount) }));
            setToast({ message: `+${amount}ml added!`, type: 'success' });
        } catch (err) {
            console.error('Error adding water:', err);
            setToast({ message: 'Failed to add water', type: 'error' });
        } finally {
            setUpdating(false);
        }
    };

    const removeWater = async (amount) => {
        setUpdating(true);
        try {
            const dateStr = isToday() ? undefined : getDateString();
            await removeWaterEntry(amount, dateStr);
            setWater(prev => ({ ...prev, current: Math.max(0, prev.current - amount) }));
            setToast({ message: `-${amount}ml removed`, type: 'success' });
        } catch (err) {
            console.error('Error removing water:', err);
            setToast({ message: 'Failed to remove water', type: 'error' });
        } finally {
            setUpdating(false);
        }
    };

    const addCustom = async () => {
        const amount = parseInt(customAmount);
        if (amount > 0) {
            await addWater(amount);
            setCustomAmount('');
            setShowCustom(false);
        }
    };

    const adjustGoal = async (change) => {
        const newGoal = Math.max(500, dailyGoal + change);
        setDailyGoal(newGoal);
        try {
            await updateProfile({ dailyWaterGoal: newGoal });
            setWater(prev => ({ ...prev, goal: newGoal }));
            setToast({ message: 'Goal updated!', type: 'success' });
        } catch (err) {
            console.error('Error updating goal:', err);
        }
    };

    const progress = Math.min(100, (water.current / water.goal) * 100);
    const waveTop = 100 - progress; // Wave position based on progress

    // Get motivational message
    const getMotivationalMessage = () => {
        const diff = water.current - (water.goal * (new Date().getHours() / 24));
        if (progress >= 100) return { title: "🎉 Goal reached!", subtitle: "Great job staying hydrated today!" };
        if (diff > 0) return { title: `You're ${Math.round(diff)}ml ahead!`, subtitle: "Optimal hydration boosts your metabolism by up to 3%." };
        if (progress >= 50) return { title: "Keep it up!", subtitle: "You're halfway there. Stay hydrated!" };
        return { title: "Stay hydrated!", subtitle: "Optimal hydration boosts your metabolism by up to 3%." };
    };

    const motivationalMsg = getMotivationalMessage();

    if (loading) {
        return <PageLoading message="Loading hydration data..." />;
    }

    return (
        <>
            <style>{waveStyles}</style>
            {/* Fixed width wrapper to prevent layout shift */}
            <div className="mx-auto w-full max-w-md min-h-screen relative flex flex-col bg-[#f6f8f6] overflow-hidden" style={{ width: '100%', maxWidth: '448px' }}>
                {/* Toast */}
                {toast && (
                    <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
                )}

                {/* Header */}
                <header className="flex items-center justify-between p-4 sticky top-0 z-20 bg-[#f6f8f6]/95 backdrop-blur-md border-b border-gray-100">
                    <button onClick={() => navigate(-1)} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/5 transition-colors">
                        <span className="material-symbols-outlined text-2xl">arrow_back</span>
                    </button>
                    <div className="flex flex-col items-center">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            {isToday() ? 'Today' : formatDate()}
                        </span>
                        <h1 className="text-lg font-bold text-slate-900">Hydration</h1>
                    </div>
                    <div className="w-10"></div>
                </header>

                {/* Date Navigation */}
                <div className="px-6 pb-4">
                    <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl">
                        <button
                            onClick={() => changeDate(-1)}
                            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white transition-colors"
                        >
                            <span className="material-symbols-outlined text-gray-500">chevron_left</span>
                        </button>
                        <span className="text-sm font-bold">{isToday() ? 'Today' : formatDate()}</span>
                        <button
                            onClick={() => changeDate(1)}
                            disabled={isToday()}
                            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white transition-colors disabled:opacity-30"
                        >
                            <span className="material-symbols-outlined text-gray-500">chevron_right</span>
                        </button>
                    </div>
                </div>

                {/* AI Insight Banner */}
                {showInsight && (
                    <div className="px-6 py-2 z-20">
                        <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-sky-50 to-white border border-sky-100 p-4 shadow-sm flex items-start gap-3">
                            <div className="flex-shrink-0 bg-emerald-500/20 rounded-full p-1.5 mt-0.5">
                                <span className="material-symbols-outlined text-emerald-600" style={{ fontSize: '20px' }}>smart_toy</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-slate-800">{motivationalMsg.title}</p>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{motivationalMsg.subtitle}</p>
                            </div>
                            <button
                                onClick={() => setShowInsight(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Main Progress Circle with Wave Animation */}
                <main className="flex-1 flex flex-col items-center justify-center relative py-6 z-10">
                    {/* Background blur effect */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-sky-100/50 rounded-full blur-3xl -z-10"></div>

                    {/* Floating decorative dots */}
                    <div className="absolute right-8 top-10 animate-bounce" style={{ animationDelay: '0.7s' }}>
                        <div className="w-2 h-2 rounded-full bg-sky-400"></div>
                    </div>
                    <div className="absolute left-10 bottom-20 animate-bounce" style={{ animationDelay: '1s', animationDuration: '3s' }}>
                        <div className="w-3 h-3 rounded-full bg-emerald-500/60"></div>
                    </div>

                    <div className="relative w-64 h-64 flex items-center justify-center">
                        {/* Progress Ring SVG */}
                        <svg className="absolute w-full h-full transform -rotate-90">
                            {/* Background circle */}
                            <circle
                                className="text-slate-100"
                                cx="128" cy="128"
                                fill="transparent"
                                r="120"
                                stroke="currentColor"
                                strokeWidth="8"
                            />
                            {/* Progress circle */}
                            <circle
                                className="text-sky-500 transition-all duration-1000 ease-out"
                                cx="128" cy="128"
                                fill="transparent"
                                r="120"
                                stroke="currentColor"
                                strokeDasharray={2 * Math.PI * 120}
                                strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
                                strokeLinecap="round"
                                strokeWidth="8"
                            />
                        </svg>

                        {/* Inner circle with wave animation */}
                        <div className="w-52 h-52 rounded-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-center relative overflow-hidden border-4 border-white">
                            {/* Wave container */}
                            <div className="absolute inset-0 z-0 wave-container bg-sky-50">
                                <div className="wave -three" style={{ top: `${waveTop}%` }}></div>
                                <div className="wave -two" style={{ top: `${waveTop}%` }}></div>
                                <div className="wave" style={{ top: `${waveTop}%`, background: '#bae6fd' }}></div>
                            </div>

                            {/* Center content - fixed width to prevent layout shift */}
                            <div className="relative z-10 flex flex-col items-center text-center" style={{ minWidth: '140px' }}>
                                <span className="material-symbols-outlined text-sky-600 mb-1" style={{ fontSize: '28px' }}>water_drop</span>
                                <div className="flex items-baseline gap-1 justify-center">
                                    <span className="text-4xl font-black text-slate-800 tracking-tight tabular-nums" style={{ minWidth: '100px', textAlign: 'center' }}>{water.current.toLocaleString()}</span>
                                    <span className="text-sm font-medium text-slate-500">ml</span>
                                </div>
                                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/60 backdrop-blur-sm border border-white/20">
                                    <span className="text-xs font-bold text-sky-700">{Math.round(progress)}%</span>
                                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">of Goal</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Motivational text */}
                    <div className="mt-8 text-center px-8">
                        <p className="text-slate-600 font-medium">
                            {progress >= 100
                                ? "Amazing! You've crushed your goal! 💪"
                                : `Keep it up! You're ${progress >= 50 ? 'halfway' : 'on your way'} there.`
                            }
                        </p>
                    </div>
                </main>

                {/* Bottom Sheet - added extra padding for bottom navigation */}
                <div className="bg-white rounded-t-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.04)] z-20 pb-24 pt-2">
                    {/* Handle bar */}
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 mb-6"></div>

                    {/* Quick Add Section */}
                    <div className="px-6 mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-slate-900">Quick Add</h3>
                            <button
                                onClick={() => setShowCustom(!showCustom)}
                                className="text-xs font-semibold text-emerald-500 hover:text-emerald-600 transition-colors"
                            >
                                Custom Amount
                            </button>
                        </div>

                        {/* Custom Amount Input */}
                        {showCustom && (
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="number"
                                    value={customAmount}
                                    onChange={(e) => setCustomAmount(e.target.value)}
                                    placeholder="Enter ml..."
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 text-base focus:ring-2 focus:ring-sky-500 outline-none"
                                />
                                <button
                                    onClick={addCustom}
                                    disabled={!customAmount || updating}
                                    className="px-6 h-12 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl disabled:opacity-50 transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                        )}

                        {/* Quick Add Buttons Grid */}
                        <div className="grid grid-cols-3 gap-3">
                            {/* Glass - 200ml */}
                            <div className="relative group">
                                <button
                                    onClick={() => addWater(200)}
                                    disabled={updating}
                                    className="w-full h-full group relative flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-sky-50 border border-transparent hover:border-sky-200 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:shadow-md transition-all text-sky-500">
                                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>local_cafe</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-xs font-bold text-slate-800 group-hover:text-sky-600">+200ml</span>
                                        <span className="block text-[10px] text-slate-400">Glass</span>
                                    </div>
                                </button>
                                {/* Undo button */}
                                <button
                                    onClick={() => removeWater(200)}
                                    disabled={updating || water.current < 200}
                                    aria-label="Undo 200ml addition"
                                    className="absolute top-1 left-1 w-6 h-6 flex items-center justify-center rounded-full bg-white/60 hover:bg-white text-slate-400 hover:text-red-500 transition-colors z-10 disabled:opacity-30"
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>remove</span>
                                </button>
                            </div>

                            {/* Bottle - 500ml (Featured) */}
                            <div className="relative group">
                                <button
                                    onClick={() => addWater(500)}
                                    disabled={updating}
                                    className="w-full h-full group relative flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-sky-100 border border-sky-200 hover:bg-sky-200 transition-all active:scale-95 shadow-sm disabled:opacity-50"
                                >
                                    {/* Ping indicator */}
                                    <div className="absolute -top-1 -right-1 flex h-4 w-4">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>water_bottle</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="block text-xs font-bold text-slate-900">+500ml</span>
                                        <span className="block text-[10px] text-slate-500">Bottle</span>
                                    </div>
                                </button>
                                {/* Undo button */}
                                <button
                                    onClick={() => removeWater(500)}
                                    disabled={updating || water.current < 500}
                                    aria-label="Undo 500ml addition"
                                    className="absolute top-1 left-1 w-6 h-6 flex items-center justify-center rounded-full bg-white/60 hover:bg-white text-slate-500 hover:text-red-500 transition-colors z-10 disabled:opacity-30"
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>remove</span>
                                </button>
                            </div>

                            {/* Other - Custom */}
                            <button
                                onClick={() => setShowCustom(true)}
                                className="group relative flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-slate-50 border border-transparent hover:border-slate-200 transition-all active:scale-95"
                            >
                                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-slate-600">
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-xs font-bold text-slate-600">Other</span>
                                    <span className="block text-[10px] text-slate-400">Custom</span>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Daily Goal Section */}
                    <div className="px-6">
                        <div className="bg-slate-50 rounded-xl p-4 flex items-center justify-between border border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '20px' }}>flag</span>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium">Daily Goal</p>
                                    <p className="text-sm font-bold text-slate-900">{dailyGoal.toLocaleString()} ml</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 bg-white rounded-lg p-1 shadow-sm border border-slate-100">
                                <button
                                    onClick={() => adjustGoal(-250)}
                                    disabled={dailyGoal <= 500}
                                    className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-slate-50 text-slate-400 transition-colors disabled:opacity-30"
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>remove</span>
                                </button>
                                <div className="w-px h-4 bg-slate-200"></div>
                                <button
                                    onClick={() => adjustGoal(250)}
                                    className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-emerald-50 text-emerald-500 transition-colors"
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom spacer for safe area */}
                <div className="h-1 bg-white"></div>
            </div>
        </>
    );
}

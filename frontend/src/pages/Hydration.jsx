import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard, getLogByDate, addWaterEntry, removeWaterEntry, getProfile, updateProfile } from '../services/api';
import { useDate } from '../context/DateContext';
import { PageLoading, Toast } from '../components/ui/UIComponents';

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
    const [showGoalModal, setShowGoalModal] = useState(false);
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

    const setNewGoal = async (newGoal) => {
        setDailyGoal(newGoal);
        setShowGoalModal(false);
        try {
            await updateProfile({ dailyWaterGoal: newGoal });
            setWater(prev => ({ ...prev, goal: newGoal }));
            setToast({ message: 'Goal updated!', type: 'success' });
        } catch (err) {
            console.error('Error updating goal:', err);
        }
    };

    const progress = Math.min(100, (water.current / water.goal) * 100);
    const remaining = Math.max(0, water.goal - water.current);

    if (loading) {
        return <PageLoading message="Loading hydration data..." />;
    }

    return (
        <div className="mx-auto max-w-md min-h-screen relative flex flex-col bg-white shadow-xl overflow-hidden pb-20">
            {/* Toast */}
            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}

            {/* Header */}
            <header className="flex items-center justify-between p-6 pb-2 pt-8 z-20">
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                        {isToday() ? `Today, ${formatDate()}` : formatDate()}
                    </span>
                    <h1 className="text-2xl font-bold tracking-tight">Hydration</h1>
                </div>
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                    <span className="material-symbols-outlined text-slate-600" style={{ fontSize: '28px' }}>close</span>
                </button>
            </header>

            {/* Date Navigation */}
            <div className="px-6 pb-4">
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl">
                    <button onClick={() => changeDate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white transition-colors">
                        <span className="material-symbols-outlined text-gray-500">chevron_left</span>
                    </button>
                    <span className="text-sm font-bold">{isToday() ? 'Today' : formatDate()}</span>
                    <button onClick={() => changeDate(1)} disabled={isToday()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white transition-colors disabled:opacity-30">
                        <span className="material-symbols-outlined text-gray-500">chevron_right</span>
                    </button>
                </div>
            </div>

            {/* AI Insight */}
            <div className="px-6 py-2 z-20">
                <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 flex items-start gap-3">
                    <div className="flex-shrink-0 bg-primary/20 rounded-full p-1.5 mt-0.5">
                        <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>smart_toy</span>
                    </div>
                    <p className="text-sm font-medium text-slate-700">
                        {progress >= 100
                            ? "🎉 Goal reached! Great job staying hydrated!"
                            : progress >= 50
                                ? "You're halfway there! Keep it up."
                                : "Stay hydrated! Optimal hydration boosts metabolism by up to 3%."}
                    </p>
                </div>
            </div>

            {/* Main Progress Circle - Fixed width container */}
            <main className="flex-1 flex flex-col items-center justify-center relative py-4 z-10">
                <div className="relative flex items-center justify-center" style={{ width: '224px', height: '224px' }}>
                    <svg className="absolute w-full h-full transform -rotate-90">
                        <circle className="text-slate-100" cx="112" cy="112" fill="transparent" r="100" stroke="currentColor" strokeWidth="10"></circle>
                        <circle
                            className="text-cyan-500 transition-all duration-1000 ease-out"
                            cx="112" cy="112" fill="transparent" r="100" stroke="currentColor"
                            strokeDasharray={2 * Math.PI * 100}
                            strokeDashoffset={2 * Math.PI * 100 * (1 - progress / 100)}
                            strokeLinecap="round" strokeWidth="10"
                        ></circle>
                    </svg>

                    {/* Center Content - Fixed width to prevent layout shift */}
                    <div className="relative z-10 flex flex-col items-center text-center" style={{ minWidth: '120px' }}>
                        <span className="material-symbols-outlined text-cyan-500 mb-1" style={{ fontSize: '24px' }}>water_drop</span>
                        <div className="flex items-baseline gap-1 justify-center">
                            <span className="text-4xl font-black text-slate-800 tracking-tight tabular-nums" style={{ minWidth: '80px', textAlign: 'center' }}>
                                {water.current.toLocaleString()}
                            </span>
                            <span className="text-base font-medium text-slate-400">ml</span>
                        </div>
                        <div className="mt-1 text-xs font-bold text-cyan-600">{Math.round(progress)}% <span className="text-slate-400 font-medium uppercase">of goal</span></div>
                    </div>
                </div>

                <div className="mt-4 text-center">
                    <p className="text-slate-500 font-medium">{remaining.toLocaleString()}ml remaining</p>
                </div>
            </main>

            {/* Bottom Sheet */}
            <div className="bg-white rounded-t-3xl shadow-[0_-4px_20px_rgb(0,0,0,0.05)] z-20 pt-2 pb-6">
                <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mt-2 mb-4"></div>

                {/* Quick Add */}
                <div className="px-6 mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-bold">Quick Add</h3>
                        <button
                            onClick={() => setShowCustom(!showCustom)}
                            className="text-xs font-semibold text-cyan-600 hover:underline"
                        >
                            Custom Amount
                        </button>
                    </div>

                    {showCustom && (
                        <div className="flex gap-2 mb-4">
                            <input
                                type="number"
                                value={customAmount}
                                onChange={(e) => setCustomAmount(e.target.value)}
                                placeholder="Enter ml..."
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 h-12 text-base focus:ring-2 focus:ring-cyan-500 outline-none"
                            />
                            <button
                                onClick={addCustom}
                                disabled={!customAmount || updating}
                                className="px-6 h-12 bg-cyan-500 hover:bg-cyan-600 text-white font-bold rounded-xl disabled:opacity-50"
                            >
                                Add
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-4 gap-3">
                        {/* Add Water Buttons */}
                        {QUICK_AMOUNTS.map((item) => (
                            <button
                                key={item.amount}
                                onClick={() => addWater(item.amount)}
                                disabled={updating}
                                className={`group relative flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all active:scale-95 disabled:opacity-50 ${item.featured
                                        ? 'bg-cyan-100 border border-cyan-200 hover:bg-cyan-200'
                                        : 'bg-slate-50 border border-transparent hover:border-slate-200'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-full ${item.featured ? 'bg-white' : 'bg-white'} shadow-sm flex items-center justify-center text-cyan-500`}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{item.icon}</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-xs font-bold text-slate-800">{item.label}</span>
                                    <span className="block text-[10px] text-slate-400">{item.desc}</span>
                                </div>
                            </button>
                        ))}

                        {/* Remove Water Buttons - Design Reference */}
                        <button
                            onClick={() => removeWater(200)}
                            disabled={updating || water.current < 200}
                            className="group relative flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-red-50 border border-red-100 hover:bg-red-100 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-red-500">
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>remove</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-xs font-bold text-red-600">-200ml</span>
                                <span className="block text-[10px] text-red-400">Remove</span>
                            </div>
                        </button>

                        <button
                            onClick={() => removeWater(500)}
                            disabled={updating || water.current < 500}
                            className="group relative flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-red-50 border border-red-100 hover:bg-red-100 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-red-500">
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>remove</span>
                            </div>
                            <div className="text-center">
                                <span className="block text-xs font-bold text-red-600">-500ml</span>
                                <span className="block text-[10px] text-red-400">Remove</span>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Daily Goal Section */}
                <div className="px-6">
                    <button
                        onClick={() => setShowGoalModal(true)}
                        className="w-full bg-slate-50 rounded-xl p-4 flex items-center justify-between border border-slate-100 hover:border-slate-200 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                <span className="material-symbols-outlined text-cyan-500" style={{ fontSize: '20px' }}>flag</span>
                            </div>
                            <div className="text-left">
                                <p className="text-xs text-slate-500 font-medium">Daily Goal</p>
                                <p className="text-sm font-bold">{dailyGoal.toLocaleString()} ml</p>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-slate-400">chevron_right</span>
                    </button>
                </div>
            </div>

            {/* Goal Modal */}
            {showGoalModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowGoalModal(false)}>
                    <div className="bg-white rounded-t-3xl w-full max-w-md p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-center mb-4">Set Daily Target</h3>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {[1500, 2000, 2500, 3000].map((goal) => (
                                <button
                                    key={goal}
                                    onClick={() => setNewGoal(goal)}
                                    className={`p-4 rounded-xl border-2 font-bold transition-all ${dailyGoal === goal
                                            ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                                            : 'border-slate-200 hover:border-slate-300'
                                        }`}
                                >
                                    {goal.toLocaleString()} ml
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setShowGoalModal(false)} className="w-full py-3 text-slate-500 font-medium">
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

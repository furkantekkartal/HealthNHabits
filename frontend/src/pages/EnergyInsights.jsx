import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard, getLogByDate, getProfile } from '../services/api';
import { useDate } from '../context/DateContext';
import { PageLoading } from '../components/ui/UIComponents';

export default function EnergyInsights() {
    const navigate = useNavigate();
    const { selectedDate, changeDate, isToday, formatDate, getDateString } = useDate();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [data, setData] = useState({
        eaten: 0,
        burned: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [profileRes, dashRes] = await Promise.all([
                    getProfile(),
                    getDashboard()
                ]);
                setProfile(profileRes.data);

                if (isToday()) {
                    setData({
                        eaten: dashRes.data.calories?.eaten || 0,
                        burned: dashRes.data.calories?.burned || 0
                    });
                } else {
                    try {
                        const logRes = await getLogByDate(getDateString());
                        setData({
                            eaten: logRes.data.summary?.caloriesEaten || 0,
                            burned: logRes.data.summary?.caloriesBurned || 0
                        });
                    } catch (e) {
                        setData({ eaten: 0, burned: 0 });
                    }
                }
            } catch (err) {
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedDate]);

    // Calculate BMR with activity multiplier
    const calculateBMR = () => {
        if (!profile) return 1800;
        const weight = profile.weight?.value || 70;
        const height = profile.height?.value || 170;
        const age = profile.birthYear ? new Date().getFullYear() - profile.birthYear : 30;
        const isMale = profile.gender === 'male';
        const baseBmr = isMale
            ? 10 * weight + 6.25 * height - 5 * age + 5
            : 10 * weight + 6.25 * height - 5 * age - 161;

        const multipliers = {
            sedentary: 1.2,
            lightly_active: 1.35,
            active: 1.5,
            very_active: 1.7
        };
        return Math.round(baseBmr * (multipliers[profile.activityLevel] || 1.35));
    };

    const bmr = calculateBMR();
    const activity = data.burned;
    const eaten = data.eaten;
    const totalOutput = bmr + activity;
    const energyGap = totalOutput - eaten;
    const isDeficit = energyGap > 0;

    // Weekly projection (7 days)
    const weeklyChange = (energyGap * 7) / 7700; // kg per week
    const dailyFatBurn = energyGap / 7700; // kg per day

    // Bar heights (max height = 280px)
    const maxValue = Math.max(eaten, totalOutput);
    const inBarHeight = maxValue > 0 ? (eaten / maxValue) * 100 : 0;
    const outBarHeight = maxValue > 0 ? (totalOutput / maxValue) * 100 : 0;
    const bmrPct = totalOutput > 0 ? (bmr / totalOutput) * 100 : 100;
    const actPct = totalOutput > 0 ? (activity / totalOutput) * 100 : 0;

    if (loading) {
        return <PageLoading message="Loading energy data..." />;
    }

    return (
        <div className="relative flex flex-col min-h-screen bg-white pb-24">
            {/* Header */}
            <div className="flex items-center px-4 py-3 justify-between sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-gray-200">
                <button
                    onClick={() => navigate(-1)}
                    className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back_ios_new</span>
                </button>
                <h2 className="text-lg font-bold leading-tight tracking-tight">Energy Gap Analysis</h2>
                <div className="w-10"></div>
            </div>

            {/* Date Navigation */}
            <div className="px-4 py-3">
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl">
                    <button onClick={() => changeDate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white transition-colors">
                        <span className="material-symbols-outlined text-gray-500">chevron_left</span>
                    </button>
                    <span className="text-sm font-bold">{isToday() ? `Today, ${formatDate()}` : formatDate()}</span>
                    <button onClick={() => changeDate(1)} disabled={isToday()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white transition-colors disabled:opacity-30">
                        <span className="material-symbols-outlined text-gray-500">chevron_right</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-col px-4 pt-2 pb-6">
                {/* Net Energy Gap Header */}
                <div className="flex flex-col items-center justify-center gap-1 mb-6">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Net Energy Gap</p>
                    <div className="flex items-baseline gap-2">
                        <span className={`material-symbols-outlined text-3xl font-bold ${isDeficit ? 'text-green-600' : 'text-orange-500'}`}>
                            {isDeficit ? 'trending_down' : 'trending_up'}
                        </span>
                        <h1 className="text-5xl font-black leading-none tracking-tight">
                            {isDeficit ? '-' : '+'}{Math.abs(energyGap).toLocaleString()}
                            <span className="text-lg font-bold text-slate-400 ml-1">kcal</span>
                        </h1>
                    </div>
                    <div className={`mt-2 px-3 py-1 rounded-full ${isDeficit ? 'bg-green-500/10' : 'bg-orange-500/10'}`}>
                        <p className={`text-xs font-bold ${isDeficit ? 'text-green-600' : 'text-orange-600'}`}>
                            Estimated {isDeficit ? 'Loss' : 'Gain'}: {Math.abs(weeklyChange).toFixed(1)}kg/week
                        </p>
                    </div>
                </div>

                {/* Dual Bar Visualization */}
                <div className="relative w-full bg-slate-50 rounded-3xl p-6 border border-gray-200">
                    <div className="flex justify-around items-end h-[240px] gap-8">
                        {/* IN Bar */}
                        <div className="flex flex-col items-center w-24 h-full justify-end group">
                            <span className="mb-3 text-sm font-bold text-slate-800">{eaten.toLocaleString()}</span>
                            <div
                                className="w-full bg-orange-500 rounded-2xl shadow-sm relative flex items-end justify-center transition-all duration-300"
                                style={{ height: `${Math.max(10, inBarHeight)}%` }}
                            >
                                <span className="text-[11px] font-black text-white absolute top-4 uppercase">Food</span>
                            </div>
                            <span className="mt-4 text-[11px] font-black uppercase tracking-widest text-slate-400">In</span>
                        </div>

                        {/* OUT Bar */}
                        <div className="flex flex-col items-center w-24 h-full justify-end group">
                            <span className="mb-3 text-sm font-bold text-slate-800">{totalOutput.toLocaleString()}</span>
                            <div
                                className="w-full relative flex flex-col justify-end rounded-2xl overflow-hidden shadow-sm transition-all duration-300"
                                style={{ height: `${Math.max(10, outBarHeight)}%` }}
                            >
                                {actPct > 0 && (
                                    <div className="w-full bg-emerald-500 flex items-center justify-center" style={{ height: `${actPct}%`, minHeight: '20px' }}>
                                        <span className="text-[10px] font-black text-white">ACT</span>
                                    </div>
                                )}
                                <div className="w-full bg-emerald-300 flex items-center justify-center flex-1" style={{ minHeight: '40px' }}>
                                    <span className="text-[10px] font-black text-emerald-700/80">BMR</span>
                                </div>
                            </div>
                            <span className="mt-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Out</span>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="mt-6 flex justify-center gap-4 border-t border-slate-200 pt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Consumed</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Active</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-300"></div>
                            <span className="text-[10px] text-slate-500 font-bold uppercase">Resting</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Weekly Projection Card */}
            <div className="px-4 pb-4">
                <div className={`${isDeficit ? 'bg-green-500/10 border-green-500/20' : 'bg-orange-500/10 border-orange-500/20'} border rounded-2xl p-4 flex items-center gap-4`}>
                    <div className={`size-12 rounded-xl ${isDeficit ? 'bg-green-600' : 'bg-orange-500'} flex items-center justify-center text-white shrink-0`}>
                        <span className="material-symbols-outlined text-2xl font-bold">{isDeficit ? 'trending_down' : 'trending_up'}</span>
                    </div>
                    <div>
                        <p className={`text-xs font-bold uppercase tracking-wider ${isDeficit ? 'text-green-600' : 'text-orange-600'}`}>Weekly Projection</p>
                        <p className="text-slate-900 font-black text-xl">
                            {isDeficit ? '-' : '+'}{Math.abs(weeklyChange).toFixed(1)}kg
                            <span className="text-sm font-medium text-slate-500"> / week</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="flex flex-col gap-3 px-4 pb-4">
                <h3 className="text-base font-bold px-1">Breakdown</h3>

                {/* BMR */}
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-200">
                    <div className="flex items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 shrink-0 size-12">
                        <span className="material-symbols-outlined font-bold">bolt</span>
                    </div>
                    <div className="flex flex-col flex-1">
                        <p className="text-sm font-bold">Metabolism (BMR)</p>
                        <p className="text-slate-500 text-xs">Automatic daily burn</p>
                    </div>
                    <div className="shrink-0 text-right">
                        <p className="text-base font-black">{bmr.toLocaleString()}</p>
                        <p className="text-slate-400 text-[10px] font-bold uppercase">kcal</p>
                    </div>
                </div>

                {/* Activity */}
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-200">
                    <div className="flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0 size-12">
                        <span className="material-symbols-outlined font-bold">directions_run</span>
                    </div>
                    <div className="flex flex-col flex-1">
                        <p className="text-sm font-bold">Activity</p>
                        <p className="text-slate-500 text-xs">Steps & Exercise</p>
                    </div>
                    <div className="shrink-0 text-right">
                        <p className="text-base font-black">{activity}</p>
                        <p className="text-slate-400 text-[10px] font-bold uppercase">kcal</p>
                    </div>
                </div>

                {/* Total Consumed */}
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-200">
                    <div className="flex items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 shrink-0 size-12">
                        <span className="material-symbols-outlined font-bold">restaurant</span>
                    </div>
                    <div className="flex flex-col flex-1">
                        <p className="text-sm font-bold">Total Consumed</p>
                        <p className="text-slate-500 text-xs">Food & Drink</p>
                    </div>
                    <div className="shrink-0 text-right">
                        <p className="text-base font-black">{eaten.toLocaleString()}</p>
                        <p className="text-slate-400 text-[10px] font-bold uppercase">kcal</p>
                    </div>
                </div>
            </div>

            {/* Fat Conversion Card */}
            <div className="px-4 pb-6">
                <div className="bg-slate-900 rounded-2xl p-5 relative overflow-hidden">
                    <div className="flex items-start gap-4 relative z-10">
                        <span className="material-symbols-outlined text-white text-2xl mt-0.5">science</span>
                        <div>
                            <h4 className="text-white font-bold text-sm mb-1">Fat Conversion</h4>
                            <p className="text-slate-300 text-xs leading-relaxed">
                                <span className="font-bold text-white">7,700 kcal</span> ≈ 1kg of fat.
                                Your <span className={`font-bold ${isDeficit ? 'text-green-400' : 'text-orange-400'}`}>{Math.abs(energyGap).toLocaleString()} kcal</span> {isDeficit ? 'deficit' : 'surplus'} today
                                = <span className="font-bold text-white">{Math.abs(dailyFatBurn).toFixed(2)}kg</span> {isDeficit ? 'loss' : 'gain'}.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

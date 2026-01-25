import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDashboard, getLogByDate, getProfile, getWeightHistory } from '../services/api';
import { useDate } from '../context/DateContext';
import { PageLoading } from '../components/ui/UIComponents';

export default function Dashboard() {
    const navigate = useNavigate();
    const { selectedDate, changeDate, isToday, formatDate, getDateString } = useDate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [profile, setProfile] = useState(null);
    const [weightHistory, setWeightHistory] = useState([]);
    const [data, setData] = useState({
        user: { name: 'User' },
        calories: { goal: 2000, eaten: 0, burned: 0 },
        water: { current: 0, goal: 2000 },
        steps: { current: 0, goal: 10000 },
        weight: { current: 70 },
        macros: { protein: 0, carbs: 0, fat: 0, fiber: 0 }
    });

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const [dashRes, profileRes, weightRes] = await Promise.all([
                getDashboard(),
                getProfile(),
                getWeightHistory(7)
            ]);
            const apiData = dashRes.data;
            setProfile(profileRes.data);
            setWeightHistory(weightRes.data || []);

            let logData = apiData;
            if (!isToday()) {
                try {
                    const logRes = await getLogByDate(getDateString());
                    logData = {
                        ...apiData,
                        calories: {
                            goal: apiData.calories.goal,
                            eaten: logRes.data.summary?.caloriesEaten || 0,
                            burned: logRes.data.summary?.caloriesBurned || 0
                        },
                        water: {
                            current: logRes.data.summary?.waterIntake || 0,
                            goal: apiData.water.goal
                        },
                        steps: {
                            current: logRes.data.summary?.steps || 0,
                            goal: apiData.steps.goal
                        },
                        macros: {
                            protein: logRes.data.summary?.protein || 0,
                            carbs: logRes.data.summary?.carbs || 0,
                            fat: logRes.data.summary?.fat || 0,
                            fiber: logRes.data.summary?.fiber || 0
                        }
                    };
                } catch (e) {
                    logData = {
                        ...apiData,
                        calories: { goal: apiData.calories.goal, eaten: 0, burned: 0 },
                        water: { current: 0, goal: apiData.water.goal },
                        steps: { current: 0, goal: apiData.steps.goal },
                        macros: { protein: 0, carbs: 0, fat: 0, fiber: 0 }
                    };
                }
            } else {
                logData.macros = {
                    protein: apiData.macros?.protein || 0,
                    carbs: apiData.macros?.carbs || 0,
                    fat: apiData.macros?.fat || 0,
                    fiber: apiData.macros?.fiber || 0
                };
            }

            setData({
                user: { name: profileRes.data?.name || 'User' },
                calories: logData.calories,
                water: logData.water,
                steps: logData.steps,
                weight: { current: profileRes.data?.weight?.value || 70 },
                macros: logData.macros
            });
            setError(null);
        } catch (err) {
            console.error('Dashboard fetch error:', err);
            setError('Using offline mode');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, [selectedDate]);

    // Calculate BMR using Mifflin-St Jeor and apply activity multiplier
    const calculateBMR = () => {
        if (!profile) return 1800;
        const weight = profile.weight?.value || 70;
        const height = profile.height?.value || 170;
        const age = profile.birthYear ? new Date().getFullYear() - profile.birthYear : 30;
        const isMale = profile.gender === 'male';
        let bmr = isMale
            ? 10 * weight + 6.25 * height - 5 * age + 5
            : 10 * weight + 6.25 * height - 5 * age - 161;

        const multipliers = {
            sedentary: 1.2,
            lightly_active: 1.35,
            active: 1.5,
            very_active: 1.7
        };
        return Math.round(bmr * (multipliers[profile.activityLevel] || 1.35));
    };

    const bmr = calculateBMR();
    const activity = data.calories.burned;
    const eaten = data.calories.eaten;
    const totalOutput = bmr + activity; // This is what body burns
    const energyGap = totalOutput - eaten; // Positive = deficit, negative = surplus
    const isDeficit = energyGap > 0;
    const fatGrams = Math.abs(Math.round((energyGap / 7700) * 1000)); // grams

    // 2-color donut: Orange = Eaten, Green = Remaining (BMR+Activity combined)
    const total = totalOutput;
    const eatenPct = Math.min(100, (eaten / total) * 100);
    const remainingPct = 100 - eatenPct;
    const circumference = 2 * Math.PI * 40;

    // Macro goals from profile
    const macroGoals = {
        protein: profile?.dailyProteinGoal || 50,
        carbs: profile?.dailyCarbsGoal || 250,
        fat: profile?.dailyFatGoal || 65,
        fiber: profile?.dailyFiberGoal || 25
    };

    const waterProgress = (data.water.current / data.water.goal) * 100;
    const stepsProgress = (data.steps.current / data.steps.goal) * 100;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    if (loading) {
        return <PageLoading message="Loading your dashboard..." />;
    }

    return (
        <div className="flex-1 overflow-y-auto pb-24 animate-fade-in bg-[#f6f8f6]">
            {/* Header */}
            <header className="flex p-6 items-center justify-between sticky top-0 z-10 bg-[#f6f8f6]/90 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <Link to="/profile" className="h-12 w-12 rounded-full bg-gray-200 border-2 border-primary bg-center bg-cover flex items-center justify-center overflow-hidden">
                        {profile?.profileImage ? (
                            <img src={profile.profileImage} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-xl">👤</span>
                        )}
                    </Link>
                    <div className="flex flex-col">
                        <p className="text-sm text-gray-500 font-medium">{getGreeting()},</p>
                        <h2 className="text-xl font-bold leading-tight">{data.user.name}</h2>
                    </div>
                </div>
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-white shadow-sm border border-gray-100">
                    <span className="material-symbols-outlined text-gray-600">notifications</span>
                </div>
            </header>

            {/* Date Selector */}
            <div className="px-6 pb-2">
                <div className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                    <button onClick={() => changeDate(-1)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <span className="material-symbols-outlined text-gray-500">chevron_left</span>
                    </button>
                    <div className="flex flex-col items-center">
                        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                            {isToday() ? 'Today' : 'Past'}
                        </span>
                        <span className="text-sm font-bold">{formatDate()}</span>
                    </div>
                    <button onClick={() => changeDate(1)} disabled={isToday()} className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-30">
                        <span className="material-symbols-outlined text-gray-500">chevron_right</span>
                    </button>
                </div>
            </div>

            {/* Energy Donut - 2 Colors Only: Orange (Eaten) vs Green (Remaining) */}
            <Link to="/energy" className="block">
                <div className="flex flex-col items-center justify-center py-6 relative">
                    <div className="relative w-64 h-64 flex items-center justify-center cursor-pointer active:scale-95 transition-transform">
                        <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                            {/* Background */}
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                            {/* Green - Remaining/Output (BMR+Activity) */}
                            <circle
                                cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="10"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={0}
                                className="transition-all duration-1000"
                            />
                            {/* Orange - Eaten */}
                            <circle
                                cx="50" cy="50" r="40" fill="none" stroke="#f97316" strokeWidth="10"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={circumference * (1 - eatenPct / 100)}
                                className="transition-all duration-1000"
                            />
                        </svg>
                        <div className="flex flex-col items-center justify-center z-10 text-center">
                            <span className={`material-symbols-outlined mb-1 text-3xl ${isDeficit ? 'text-emerald-500' : 'text-orange-500'}`}>
                                {isDeficit ? 'trending_down' : 'trending_up'}
                            </span>
                            <h1 className="text-3xl font-extrabold tracking-tighter">
                                {isDeficit ? '-' : '+'}{Math.abs(energyGap).toLocaleString()} <span className="text-lg">kcal</span>
                            </h1>
                            <p className={`text-lg font-bold mt-0.5 ${isDeficit ? 'text-emerald-600' : 'text-orange-600'}`}>
                                ≈ {isDeficit ? '-' : '+'}{fatGrams}g Fat
                            </p>
                            <div className="mt-2 text-[10px] text-gray-400 uppercase tracking-widest font-semibold flex items-center gap-1">
                                <span>Tap for details</span>
                                <span className="material-symbols-outlined text-xs">chevron_right</span>
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="mt-2 flex items-center gap-6 px-4 py-2 bg-gray-100 rounded-full">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                            <span className="text-xs font-medium text-gray-600">Eaten ({eaten.toLocaleString()})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            <span className="text-xs font-medium text-gray-600">Output ({totalOutput.toLocaleString()})</span>
                        </div>
                    </div>
                </div>
            </Link>

            {/* Macros Section */}
            <div className="px-6 mb-6">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Daily Macros</h3>
                    <div className="grid grid-cols-4 gap-3">
                        {/* Protein */}
                        <div className="flex flex-col items-center">
                            <div className="relative w-12 h-12 mb-2">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                    <circle cx="18" cy="18" r="14" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                                    <circle cx="18" cy="18" r="14" fill="none" stroke="#8b5cf6" strokeWidth="4" strokeLinecap="round"
                                        strokeDasharray={2 * Math.PI * 14}
                                        strokeDashoffset={2 * Math.PI * 14 * (1 - Math.min(1, data.macros.protein / macroGoals.protein))}
                                    />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-purple-600">
                                    {data.macros.protein}g
                                </span>
                            </div>
                            <span className="text-[10px] font-medium text-gray-500">Protein</span>
                            <span className="text-[9px] text-gray-400">{macroGoals.protein}g</span>
                        </div>
                        {/* Carbs */}
                        <div className="flex flex-col items-center">
                            <div className="relative w-12 h-12 mb-2">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                    <circle cx="18" cy="18" r="14" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                                    <circle cx="18" cy="18" r="14" fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round"
                                        strokeDasharray={2 * Math.PI * 14}
                                        strokeDashoffset={2 * Math.PI * 14 * (1 - Math.min(1, data.macros.carbs / macroGoals.carbs))}
                                    />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-amber-600">
                                    {data.macros.carbs}g
                                </span>
                            </div>
                            <span className="text-[10px] font-medium text-gray-500">Carbs</span>
                            <span className="text-[9px] text-gray-400">{macroGoals.carbs}g</span>
                        </div>
                        {/* Fat */}
                        <div className="flex flex-col items-center">
                            <div className="relative w-12 h-12 mb-2">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                    <circle cx="18" cy="18" r="14" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                                    <circle cx="18" cy="18" r="14" fill="none" stroke="#ef4444" strokeWidth="4" strokeLinecap="round"
                                        strokeDasharray={2 * Math.PI * 14}
                                        strokeDashoffset={2 * Math.PI * 14 * (1 - Math.min(1, data.macros.fat / macroGoals.fat))}
                                    />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-red-600">
                                    {data.macros.fat}g
                                </span>
                            </div>
                            <span className="text-[10px] font-medium text-gray-500">Fat</span>
                            <span className="text-[9px] text-gray-400">{macroGoals.fat}g</span>
                        </div>
                        {/* Fiber */}
                        <div className="flex flex-col items-center">
                            <div className="relative w-12 h-12 mb-2">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                    <circle cx="18" cy="18" r="14" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                                    <circle cx="18" cy="18" r="14" fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round"
                                        strokeDasharray={2 * Math.PI * 14}
                                        strokeDashoffset={2 * Math.PI * 14 * (1 - Math.min(1, data.macros.fiber / macroGoals.fiber))}
                                    />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-green-600">
                                    {data.macros.fiber}g
                                </span>
                            </div>
                            <span className="text-[10px] font-medium text-gray-500">Fiber</span>
                            <span className="text-[9px] text-gray-400">{macroGoals.fiber}g</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Stats - Row */}
            <div className="px-6 grid grid-cols-2 gap-4 mb-6">
                {/* Eaten Card */}
                <Link to="/catalog" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2 hover:border-orange-200 transition-colors">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                            <span className="material-symbols-outlined text-[18px]">restaurant</span>
                        </div>
                        <span className="text-sm font-medium text-gray-500">Eaten</span>
                    </div>
                    <p className="text-2xl font-bold">{eaten.toLocaleString()} <span className="text-xs text-gray-400">kcal</span></p>
                </Link>

                {/* Burned Card */}
                <Link to="/steps" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2 hover:border-emerald-200 transition-colors">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <span className="material-symbols-outlined text-[18px]">local_fire_department</span>
                        </div>
                        <span className="text-sm font-medium text-gray-500">Output</span>
                    </div>
                    <p className="text-2xl font-bold">{totalOutput.toLocaleString()} <span className="text-xs text-gray-400">kcal</span></p>
                </Link>
            </div>

            {/* Secondary Cards */}
            <div className="px-6 flex flex-col gap-4 mb-8">
                {/* Water Card */}
                <Link to="/water" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-cyan-200 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-600">
                                <span className="material-symbols-outlined">water_drop</span>
                            </div>
                            <div>
                                <p className="text-sm font-bold">Water</p>
                                <p className="text-xs text-gray-500">Goal: {data.water.goal.toLocaleString()}ml</p>
                            </div>
                        </div>
                        <span className="text-lg font-bold text-cyan-600">{data.water.current.toLocaleString()}<span className="text-xs text-gray-400 ml-0.5">ml</span></span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${Math.min(100, waterProgress)}%` }}></div>
                    </div>
                </Link>

                {/* Steps Card */}
                <Link to="/steps" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-purple-200 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                                <span className="material-symbols-outlined">footprint</span>
                            </div>
                            <div>
                                <p className="text-sm font-bold">Steps</p>
                                <p className="text-xs text-gray-500">Goal: {data.steps.goal.toLocaleString()}</p>
                            </div>
                        </div>
                        <span className="text-lg font-bold text-purple-600">{data.steps.current.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, stepsProgress)}%` }}></div>
                    </div>
                </Link>

                {/* Weight Card */}
                <Link to="/weight" className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-emerald-200 transition-colors">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <span className="material-symbols-outlined">monitor_weight</span>
                            </div>
                            <div>
                                <p className="text-sm font-bold">Weight</p>
                                <p className="text-xs text-gray-500">Log your weight</p>
                            </div>
                        </div>
                        <span className="text-lg font-bold text-emerald-600">{data.weight.current.toFixed(1)}<span className="text-xs text-gray-400 ml-0.5">kg</span></span>
                    </div>
                </Link>
            </div>
        </div>
    );
}

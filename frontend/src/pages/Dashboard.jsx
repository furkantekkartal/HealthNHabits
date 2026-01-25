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
                        weight: {
                            current: logRes.data.summary?.weight || profileRes.data?.weight?.value || 70
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
                        weight: { current: profileRes.data?.weight?.value || 70 },
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
                logData.weight = { current: apiData.weight || profileRes.data?.weight?.value || 70 };
            }

            setData({
                user: { name: profileRes.data?.name || 'User' },
                calories: logData.calories,
                water: logData.water,
                steps: logData.steps,
                weight: logData.weight,
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

    // Calculate BMR with activity multiplier (TDEE)
    const calculateTDEE = () => {
        if (!profile) return 2000;
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

    const tdee = calculateTDEE(); // Total Daily Energy Expenditure (BMR with activity)
    const activity = data.calories.burned;
    const eaten = data.calories.eaten;
    const totalOutput = tdee + activity;
    const energyGap = totalOutput - eaten;
    const isDeficit = energyGap > 0;
    const fatGrams = Math.round(Math.abs(energyGap) / 7.7); // grams (7700kcal per kg)

    // Donut chart: 3 segments - Eaten (orange), Activity (blue), Remaining (green)
    const totalForDonut = totalOutput; // Max value for donut
    const eatenPct = (eaten / totalForDonut) * 100;
    const activityPct = (activity / totalForDonut) * 100;
    const remainingPct = Math.max(0, 100 - eatenPct - activityPct);

    // SVG calculations for donut segments
    const circumference = 2 * Math.PI * 40; // r=40
    const eatenStroke = (eatenPct / 100) * circumference;
    const activityStroke = (activityPct / 100) * circumference;
    const remainingStroke = (remainingPct / 100) * circumference;

    // Macro goals from profile
    const macroGoals = {
        protein: profile?.dailyProteinGoal || 160,
        carbs: profile?.dailyCarbsGoal || 250,
        fat: profile?.dailyFatGoal || 70,
        fiber: profile?.dailyFiberGoal || 35
    };

    const waterProgress = (data.water.current / data.water.goal) * 100;
    const stepsProgress = (data.steps.current / data.steps.goal) * 100;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    // Get weight for selected date
    const getDateWeight = () => {
        if (isToday()) {
            return data.weight.current;
        }
        // Find weight for selected date from history
        const dateStr = getDateString();
        const historyEntry = weightHistory.find(h => h.date === dateStr);
        return historyEntry?.weight || data.weight.current;
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

            {/* Energy Donut - 3 Colors: Orange (Eaten), Blue (Activity), Green (Remaining) */}
            <Link to="/energy" className="block">
                <div className="flex flex-col items-center justify-center py-6 relative">
                    <div className="relative w-72 h-72 flex items-center justify-center cursor-pointer active:scale-95 transition-transform">
                        <div className="absolute inset-4 rounded-full border border-gray-200"></div>
                        <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                            {/* Background */}
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                            {/* Eaten (Orange) */}
                            <circle
                                cx="50" cy="50" r="40" fill="none" stroke="#f97316" strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${eatenStroke} ${circumference}`}
                                strokeDashoffset="0"
                                className="transition-all duration-1000"
                            />
                            {/* Activity (Blue) */}
                            <circle
                                cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${activityStroke} ${circumference}`}
                                strokeDashoffset={-eatenStroke}
                                className="transition-all duration-1000"
                            />
                            {/* Remaining (Green) */}
                            <circle
                                cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${remainingStroke} ${circumference}`}
                                strokeDashoffset={-(eatenStroke + activityStroke)}
                                className="transition-all duration-1000"
                            />
                        </svg>
                        <div className="flex flex-col items-center justify-center z-10 text-center">
                            <span className="material-symbols-outlined text-emerald-500 mb-1 text-3xl">monitor_heart</span>
                            <h1 className="text-3xl font-extrabold tracking-tighter">
                                {Math.abs(energyGap).toLocaleString()} <span className="text-lg">kcal</span>
                            </h1>
                            <p className="text-lg font-bold text-gray-700 mt-0.5">
                                ≈ {isDeficit ? '-' : '+'}{fatGrams}g Fat
                            </p>
                            <div className="mt-2 text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
                                Energy Gap Insights
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="mt-2 flex items-center gap-4 px-4 py-2 bg-gray-100 rounded-full">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                            <span className="text-xs font-medium text-gray-600">Eaten</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="text-xs font-medium text-gray-600">Activity</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <span className="text-xs font-medium text-gray-600">Remaining</span>
                        </div>
                    </div>
                </div>
            </Link>

            {/* Daily Macros - Bar Style from Design */}
            <div className="px-6 mb-6">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        {/* Carbs */}
                        <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center text-[11px] font-bold">
                                <span className="text-gray-500 uppercase tracking-wider">Carbs</span>
                                <span className="text-gray-700">{data.macros.carbs}g / {macroGoals.carbs}g</span>
                            </div>
                            <div className="h-1.5 w-full bg-sky-100 rounded-full overflow-hidden">
                                <div className="h-full bg-sky-400 rounded-full" style={{ width: `${Math.min(100, (data.macros.carbs / macroGoals.carbs) * 100)}%` }}></div>
                            </div>
                        </div>
                        {/* Protein */}
                        <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center text-[11px] font-bold">
                                <span className="text-gray-500 uppercase tracking-wider">Protein</span>
                                <span className="text-gray-700">{data.macros.protein}g / {macroGoals.protein}g</span>
                            </div>
                            <div className="h-1.5 w-full bg-purple-100 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, (data.macros.protein / macroGoals.protein) * 100)}%` }}></div>
                            </div>
                        </div>
                        {/* Fat */}
                        <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center text-[11px] font-bold">
                                <span className="text-gray-500 uppercase tracking-wider">Fat</span>
                                <span className="text-gray-700">{data.macros.fat}g / {macroGoals.fat}g</span>
                            </div>
                            <div className="h-1.5 w-full bg-yellow-100 rounded-full overflow-hidden">
                                <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${Math.min(100, (data.macros.fat / macroGoals.fat) * 100)}%` }}></div>
                            </div>
                        </div>
                        {/* Fiber */}
                        <div className="flex flex-col gap-1.5">
                            <div className="flex justify-between items-center text-[11px] font-bold">
                                <span className="text-gray-500 uppercase tracking-wider">Fiber</span>
                                <span className="text-gray-700">{data.macros.fiber}g / {macroGoals.fiber}g</span>
                            </div>
                            <div className="h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (data.macros.fiber / macroGoals.fiber) * 100)}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Energy Gap Card */}
            <div className="px-6 mb-6">
                <Link to="/energy" className="block bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-gray-400">equalizer</span>
                            <h3 className="text-base font-bold text-gray-900">Energy Gap</h3>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${isDeficit ? 'text-emerald-600 bg-emerald-100' : 'text-orange-600 bg-orange-100'}`}>
                            {Math.abs(energyGap).toLocaleString()} {isDeficit ? 'Deficit' : 'Surplus'}
                        </span>
                    </div>
                    <div className="space-y-6">
                        {/* Total Output Bar */}
                        <div>
                            <div className="flex justify-between text-xs font-medium text-gray-500 mb-1.5">
                                <span className="flex items-center gap-1">Total Output <span className="text-[10px] font-normal text-gray-400">(TDEE + Burned)</span></span>
                                <span>{totalOutput.toLocaleString()} kcal</span>
                            </div>
                            <div className="h-3 w-full rounded-full flex overflow-hidden bg-gray-100">
                                <div className="h-full bg-gray-300" style={{ width: `${(tdee / totalOutput) * 100}%` }}></div>
                                <div className="h-full bg-blue-500" style={{ width: `${(activity / totalOutput) * 100}%` }}></div>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-400 mt-1.5 px-0.5">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                                    <span>TDEE ({tdee.toLocaleString()})</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    <span>Activity ({activity})</span>
                                </div>
                            </div>
                        </div>
                        {/* Total Consumed Bar */}
                        <div>
                            <div className="flex justify-between text-xs font-medium text-gray-500 mb-1.5">
                                <span>Total Consumed</span>
                                <span>{eaten.toLocaleString()} kcal</span>
                            </div>
                            <div className="h-3 w-full rounded-full overflow-hidden bg-gray-100 relative">
                                <div className="h-full bg-orange-500 absolute left-0 top-0 rounded-full" style={{ width: `${(eaten / totalOutput) * 100}%` }}></div>
                            </div>
                            <div className="flex justify-start text-[10px] text-gray-400 mt-1.5 px-0.5">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                    <span>Food & Drink</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Eaten / Burned Cards */}
            <div className="px-6 grid grid-cols-2 gap-4 mb-6">
                <Link to="/catalog" className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                            <span className="material-symbols-outlined text-[18px]">restaurant</span>
                        </div>
                        <span className="text-sm font-medium text-gray-500">Eaten</span>
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{eaten.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">kcal</p>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="bg-orange-500 h-full rounded-full" style={{ width: `${Math.min(100, (eaten / data.calories.goal) * 100)}%` }}></div>
                    </div>
                </Link>

                <Link to="/steps" className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <span className="material-symbols-outlined text-[18px]">directions_run</span>
                        </div>
                        <span className="text-sm font-medium text-gray-500">Burned</span>
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{activity}</p>
                        <p className="text-xs text-gray-400">kcal</p>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-1">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(100, (activity / 500) * 100)}%` }}></div>
                    </div>
                </Link>
            </div>

            {/* Weight Card with Graph */}
            <div className="px-6 mb-6">
                <Link to="/weight" className="block bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <span className="material-symbols-outlined">monitor_weight</span>
                            </div>
                            <div>
                                <p className="text-base font-bold">Weight</p>
                                <p className="text-xs text-gray-500">Last 7 Days</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-lg font-bold text-emerald-600">{getDateWeight()?.toFixed?.(1) || getDateWeight()}</span>
                            <span className="text-xs text-gray-400 ml-0.5">kg</span>
                        </div>
                    </div>
                    {/* Mini Weight Graph */}
                    <div className="relative w-full h-24">
                        <div className="absolute inset-0 flex flex-col h-20">
                            <div className="flex-1 bg-orange-100/30 border-b border-dashed border-orange-200/50"></div>
                            <div className="flex-[1.5] bg-emerald-50/40 border-b border-dashed border-emerald-100/50"></div>
                            <div className="flex-1 bg-blue-50/40"></div>
                        </div>
                        <div className="flex justify-between w-full text-[10px] text-gray-400 absolute bottom-0 pt-2">
                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                                <span key={i}>{day}</span>
                            ))}
                        </div>
                    </div>
                </Link>
            </div>

            {/* Water Intake Card */}
            <div className="px-6 flex flex-col gap-4 mb-6">
                <Link to="/water" className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-600">
                                <span className="material-symbols-outlined">water_drop</span>
                            </div>
                            <div>
                                <p className="text-base font-bold">Water Intake</p>
                                <p className="text-xs text-gray-500">Daily Goal: {data.water.goal.toLocaleString()}ml</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-lg font-bold text-cyan-600">{data.water.current.toLocaleString()}</span>
                            <span className="text-xs text-gray-400 ml-0.5">ml</span>
                        </div>
                    </div>
                    {/* Water Bar Glasses */}
                    <div className="flex justify-between gap-1 mt-2">
                        {[...Array(6)].map((_, i) => (
                            <div
                                key={i}
                                className={`h-8 flex-1 rounded-md ${i < Math.ceil(waterProgress / (100 / 6)) ? 'bg-cyan-500' : 'bg-cyan-500/20'}`}
                            ></div>
                        ))}
                    </div>
                </Link>

                {/* Steps Card */}
                <Link to="/steps" className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                                <span className="material-symbols-outlined">footprint</span>
                            </div>
                            <div>
                                <p className="text-base font-bold">Steps</p>
                                <p className="text-xs text-gray-500">Goal: {data.steps.goal.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-lg font-bold text-purple-600">{data.steps.current.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className="absolute top-0 left-0 h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, stepsProgress)}%` }}></div>
                    </div>
                </Link>
            </div>

            {/* Floating Action Buttons */}
            <div className="fixed bottom-24 right-6 z-20 flex flex-col gap-3 items-end">
                <button onClick={() => navigate('/weight')} className="flex items-center gap-2 group">
                    <span className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Log Weight
                    </span>
                    <div className="flex items-center justify-center w-10 h-10 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/40 hover:scale-105 transition-transform active:scale-95 text-white">
                        <span className="material-symbols-outlined text-[20px]">monitor_weight</span>
                    </div>
                </button>
                <button onClick={() => navigate('/analyze')} className="group relative flex items-center justify-center w-14 h-14 bg-primary rounded-full shadow-lg shadow-primary/40 hover:scale-105 transition-transform active:scale-95">
                    <span className="material-symbols-outlined text-black text-3xl font-bold">add</span>
                </button>
            </div>
        </div>
    );
}

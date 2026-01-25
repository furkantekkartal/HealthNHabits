import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard, getLogByDate, addStepsEntry, getProfile } from '../services/api';
import { useDate } from '../context/DateContext';
import { PageLoading, Toast } from '../components/ui/UIComponents';

export default function Steps() {
    const navigate = useNavigate();
    const { selectedDate, changeDate, isToday, formatDate, getDateString } = useDate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [stepsInput, setStepsInput] = useState('');
    const [stepsData, setStepsData] = useState({ current: 0, goal: 10000 });
    const [profile, setProfile] = useState(null);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [profileRes] = await Promise.all([getProfile()]);
                setProfile(profileRes.data);
                const stepsGoal = profileRes.data?.dailyStepsGoal || 10000;

                if (isToday()) {
                    const dashRes = await getDashboard();
                    setStepsData({
                        current: dashRes.data.steps?.current || 0,
                        goal: stepsGoal
                    });
                    setStepsInput(String(dashRes.data.steps?.current || ''));
                } else {
                    try {
                        const logRes = await getLogByDate(getDateString());
                        const steps = logRes.data.summary?.steps || 0;
                        setStepsData({
                            current: steps,
                            goal: stepsGoal
                        });
                        setStepsInput(String(steps || ''));
                    } catch (e) {
                        setStepsData({ current: 0, goal: stepsGoal });
                        setStepsInput('');
                    }
                }
            } catch (err) {
                console.error('Error fetching steps data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedDate]);

    const handleNumberClick = (num) => {
        if (stepsInput.length < 6) {
            setStepsInput(prev => prev + num);
        }
    };

    const handleBackspace = () => {
        setStepsInput(prev => prev.slice(0, -1));
    };

    const handleClear = () => {
        setStepsInput('');
    };

    const handleSave = async () => {
        const steps = parseInt(stepsInput) || 0;
        if (steps === 0) {
            setToast({ message: 'Please enter step count', type: 'error' });
            return;
        }

        setSaving(true);
        try {
            const dateStr = isToday() ? undefined : getDateString();
            await addStepsEntry(steps, dateStr);
            setStepsData(prev => ({ ...prev, current: steps }));
            setToast({ message: 'Steps saved successfully!', type: 'success' });
        } catch (err) {
            console.error('Error saving steps:', err);
            setToast({ message: 'Failed to save steps', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    // Calculate stats
    const steps = parseInt(stepsInput) || 0;
    const weight = profile?.weight?.value || 70;
    const height = profile?.height?.value || 170;
    const strideLength = height * 0.415 / 100; // meters
    const distance = (steps * strideLength / 1000).toFixed(2);
    const caloriesBurned = Math.round(steps * 0.04 * (weight / 70));
    const progress = Math.min(100, (steps / stepsData.goal) * 100);

    if (loading) {
        return <PageLoading message="Loading steps data..." />;
    }

    return (
        <div className="flex flex-col min-h-full bg-[#f6f8f6] animate-fade-in pb-20">
            {/* Toast */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Header */}
            <header className="flex items-center justify-between p-4 sticky top-0 z-10 bg-[#f6f8f6]/95 backdrop-blur-md border-b border-gray-100">
                <button onClick={() => navigate(-1)} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/5 transition-colors">
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </button>
                <h1 className="text-lg font-bold">Steps</h1>
                <div className="w-10"></div>
            </header>

            {/* Date Navigation */}
            <div className="px-4 py-3">
                <div className="flex items-center justify-between bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                    <button onClick={() => changeDate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                        <span className="material-symbols-outlined text-gray-500">chevron_left</span>
                    </button>
                    <span className="text-sm font-bold">{isToday() ? `Today, ${formatDate()}` : formatDate()}</span>
                    <button onClick={() => changeDate(1)} disabled={isToday()} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors disabled:opacity-30">
                        <span className="material-symbols-outlined text-gray-500">chevron_right</span>
                    </button>
                </div>
            </div>

            <main className="flex-1 overflow-y-auto p-6 pb-24">
                {/* Steps Display */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-40 h-40 rounded-full bg-purple-100 border-8 border-purple-200 mb-4 relative">
                        {/* Progress Ring */}
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="42" fill="none" stroke="#e9d5ff" strokeWidth="8" />
                            <circle
                                cx="50" cy="50" r="42" fill="none" stroke="#a855f7" strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 42}`}
                                strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress / 100)}`}
                                className="transition-all duration-500"
                            />
                        </svg>
                        <div className="flex flex-col items-center z-10">
                            <span className="material-symbols-outlined text-purple-600 text-3xl mb-1">footprint</span>
                            <span className="text-2xl font-black text-purple-700">{steps.toLocaleString()}</span>
                        </div>
                    </div>
                    <p className="text-sm font-medium text-gray-600">
                        Goal: {stepsData.goal.toLocaleString()} steps
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-blue-500 text-lg">straighten</span>
                            <span className="text-sm text-gray-500">Distance</span>
                        </div>
                        <p className="text-xl font-bold text-blue-600">{distance} km</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-orange-500 text-lg">local_fire_department</span>
                            <span className="text-sm text-gray-500">Calories</span>
                        </div>
                        <p className="text-xl font-bold text-orange-600">{caloriesBurned} kcal</p>
                    </div>
                </div>

                {/* Number Input Display */}
                <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
                    <div className="h-16 flex items-center justify-center">
                        <span className="text-4xl font-black text-gray-800 tracking-wider">
                            {stepsInput || '0'}
                        </span>
                    </div>
                </div>

                {/* Number Pad */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button
                            key={num}
                            onClick={() => handleNumberClick(String(num))}
                            className="h-14 bg-white rounded-xl shadow-sm border border-gray-100 text-xl font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
                        >
                            {num}
                        </button>
                    ))}
                    <button
                        onClick={handleClear}
                        className="h-14 bg-gray-100 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-200 active:scale-95 transition-all"
                    >
                        Clear
                    </button>
                    <button
                        onClick={() => handleNumberClick('0')}
                        className="h-14 bg-white rounded-xl shadow-sm border border-gray-100 text-xl font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
                    >
                        0
                    </button>
                    <button
                        onClick={handleBackspace}
                        className="h-14 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-200 active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined">backspace</span>
                    </button>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving || !stepsInput}
                    className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    {saving ? (
                        <>
                            <span className="material-symbols-outlined animate-spin text-xl">sync</span>
                            Saving...
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-xl">check</span>
                            Save Steps
                        </>
                    )}
                </button>
            </main>
        </div>
    );
}

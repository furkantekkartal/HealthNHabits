import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { addWeightEntry, getLogByDate, getProfile, getWeightHistory } from '../services/api';
import { useDate } from '../context/DateContext';
import { PageLoading, Toast } from '../components/ui/UIComponents';

export default function Weight() {
    const navigate = useNavigate();
    const { selectedDate, changeDate, isToday, formatDate, getDateString } = useDate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [profile, setProfile] = useState(null);
    const [weight, setWeight] = useState(70.0);
    const [startWeight, setStartWeight] = useState(null);
    const [weekAgoWeight, setWeekAgoWeight] = useState(null);
    const wheelRef = useRef(null);
    const isScrolling = useRef(false);

    // Generate weight values (30-200 kg with 0.1 increments)
    const minWeight = 30;
    const maxWeight = 200;
    const step = 0.1;
    const weights = [];
    for (let w = minWeight; w <= maxWeight; w = parseFloat((w + step).toFixed(1))) {
        weights.push(w);
    }

    const ITEM_HEIGHT = 64;

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [profileRes, historyRes] = await Promise.all([
                    getProfile(),
                    getWeightHistory(14) // Get 14 days to find 7-day-ago weight
                ]);

                setProfile(profileRes.data);
                const currentWeight = profileRes.data?.weight?.value || 70;

                // Check if there's a weight for the selected date
                try {
                    const logRes = await getLogByDate(getDateString());
                    const weightEntry = logRes.data?.entries?.find(e => e.type === 'weight');
                    if (weightEntry) {
                        setWeight(weightEntry.data.weight);
                    } else {
                        setWeight(currentWeight);
                    }
                } catch (e) {
                    setWeight(currentWeight);
                }

                // Find weight from 7 days ago (not yesterday)
                const history = historyRes.data || [];
                if (history.length > 0) {
                    // Get first recorded weight as start weight
                    const firstWithWeight = history.find(h => h.weight !== null);
                    if (firstWithWeight) {
                        setStartWeight(firstWithWeight.weight);
                    }

                    // Find weight from 7 days before selected date
                    const selectedDateObj = new Date(selectedDate);
                    const weekAgoDate = new Date(selectedDateObj);
                    weekAgoDate.setDate(weekAgoDate.getDate() - 7);
                    const weekAgoStr = weekAgoDate.toISOString().split('T')[0];

                    const weekAgoEntry = history.find(h => h.date === weekAgoStr && h.weight !== null);
                    if (weekAgoEntry) {
                        setWeekAgoWeight(weekAgoEntry.weight);
                    } else {
                        // Fallback: find closest weight to 7 days ago
                        const validWeights = history.filter(h => h.weight !== null);
                        if (validWeights.length >= 2) {
                            setWeekAgoWeight(validWeights[0].weight); // Oldest available
                        }
                    }
                }
            } catch (err) {
                console.error('Error fetching weight data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedDate]);

    // Scroll to current weight on load
    useEffect(() => {
        if (wheelRef.current && !loading) {
            const index = weights.findIndex(w => Math.abs(w - weight) < 0.05);
            if (index !== -1) {
                isScrolling.current = true;
                wheelRef.current.scrollTop = index * ITEM_HEIGHT;
                setTimeout(() => { isScrolling.current = false; }, 100);
            }
        }
    }, [loading]);

    // Handle wheel scroll with debounce
    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 1 : -1;
        const currentIndex = weights.findIndex(w => Math.abs(w - weight) < 0.05);
        const newIndex = Math.max(0, Math.min(weights.length - 1, currentIndex + delta));
        setWeight(weights[newIndex]);

        if (wheelRef.current) {
            isScrolling.current = true;
            wheelRef.current.scrollTop = newIndex * ITEM_HEIGHT;
            setTimeout(() => { isScrolling.current = false; }, 100);
        }
    };

    // Handle + and - buttons
    const adjustWeight = (delta) => {
        const currentIndex = weights.findIndex(w => Math.abs(w - weight) < 0.05);
        const newIndex = Math.max(0, Math.min(weights.length - 1, currentIndex + delta));
        setWeight(weights[newIndex]);

        if (wheelRef.current) {
            isScrolling.current = true;
            wheelRef.current.scrollTop = newIndex * ITEM_HEIGHT;
            setTimeout(() => { isScrolling.current = false; }, 100);
        }
    };

    // Handle scroll end
    const handleScrollEnd = () => {
        if (isScrolling.current) return;

        if (wheelRef.current) {
            const scrollTop = wheelRef.current.scrollTop;
            const index = Math.round(scrollTop / ITEM_HEIGHT);
            const alignedScroll = index * ITEM_HEIGHT;

            isScrolling.current = true;
            wheelRef.current.scrollTo({ top: alignedScroll, behavior: 'smooth' });

            if (weights[index]) {
                setWeight(weights[index]);
            }
            setTimeout(() => { isScrolling.current = false; }, 150);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const dateStr = isToday() ? undefined : getDateString();
            await addWeightEntry(weight, 'kg', dateStr);
            setToast({ message: 'Weight saved!', type: 'success' });
            setTimeout(() => navigate('/'), 1000);
        } catch (err) {
            console.error('Error saving weight:', err);
            setToast({ message: 'Failed to save weight', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    // Calculate difference from 7 days ago
    const weightDiff = weekAgoWeight ? (weight - weekAgoWeight).toFixed(1) : null;
    const isDown = weightDiff && parseFloat(weightDiff) < 0;
    const isUp = weightDiff && parseFloat(weightDiff) > 0;

    if (loading) {
        return <PageLoading message="Loading weight data..." />;
    }

    return (
        <div className="relative flex flex-col min-h-screen bg-[#f6f8f6]">
            {/* Toast */}
            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}

            {/* Header */}
            <header className="flex items-center justify-between px-4 pt-6 pb-2 z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="text-neutral-500 hover:text-slate-900 transition-colors text-base font-medium h-10 px-2 -ml-2 rounded-lg hover:bg-black/5"
                >
                    Cancel
                </button>
                <h1 className="text-lg font-bold tracking-tight text-primary">Log Weight</h1>
                <div className="w-16"></div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center px-4 pt-4 pb-32 relative overflow-y-auto">
                {/* Date Selector - Clickable */}
                <div className="w-full flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full text-primary">
                            <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                        </div>
                        <span className="font-medium text-base text-slate-700">Date</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => changeDate(-1)}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                        >
                            <span className="material-symbols-outlined text-gray-400">chevron_left</span>
                        </button>
                        <span className="text-primary font-semibold">{isToday() ? `Today, ${formatDate()}` : formatDate()}</span>
                        <button
                            onClick={() => changeDate(1)}
                            disabled={isToday()}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 disabled:opacity-30"
                        >
                            <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                        </button>
                    </div>
                </div>

                {/* Weight Display */}
                <div className="flex flex-col items-center justify-center w-full mb-6">
                    <h2 className="text-[80px] leading-none font-black tracking-tighter text-slate-900 tabular-nums">
                        {weight.toFixed(1)}
                    </h2>
                    <span className="text-2xl font-bold text-primary mt-1">kg</span>
                </div>

                {/* Wheel Picker with +/- buttons */}
                <div className="relative h-48 w-full max-w-[320px] mb-8 select-none">
                    {/* Selection Highlight Box with +/- buttons */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-16 border-y-2 border-primary/30 pointer-events-none z-10 bg-primary/5 rounded-lg flex items-center justify-between px-4">
                        <button
                            onClick={() => adjustWeight(-1)}
                            className="pointer-events-auto w-10 h-10 flex items-center justify-center rounded-full bg-white shadow hover:bg-gray-50 active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-primary text-2xl">remove</span>
                        </button>
                        <button
                            onClick={() => adjustWeight(1)}
                            className="pointer-events-auto w-10 h-10 flex items-center justify-center rounded-full bg-white shadow hover:bg-gray-50 active:scale-95 transition-all"
                        >
                            <span className="material-symbols-outlined text-primary text-2xl">add</span>
                        </button>
                    </div>

                    {/* Scrollable Weight List */}
                    <div
                        ref={wheelRef}
                        onWheel={handleWheel}
                        onScroll={handleScrollEnd}
                        className="h-full overflow-y-auto no-scrollbar snap-y snap-mandatory py-16"
                        style={{
                            scrollSnapType: 'y mandatory',
                            maskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)',
                            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)'
                        }}
                    >
                        {weights.map((w) => {
                            const isSelected = Math.abs(w - weight) < 0.05;
                            return (
                                <div
                                    key={w}
                                    onClick={() => {
                                        setWeight(w);
                                        const index = weights.indexOf(w);
                                        if (wheelRef.current && index !== -1) {
                                            isScrolling.current = true;
                                            wheelRef.current.scrollTo({ top: index * ITEM_HEIGHT, behavior: 'smooth' });
                                            setTimeout(() => { isScrolling.current = false; }, 150);
                                        }
                                    }}
                                    className={`snap-center h-16 flex items-center justify-center cursor-pointer transition-all ${isSelected
                                            ? 'text-5xl font-black text-slate-900'
                                            : 'text-2xl font-bold text-neutral-300 hover:text-neutral-400'
                                        }`}
                                    style={{ scrollSnapAlign: 'center' }}
                                >
                                    {w.toFixed(1)}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Feedback Indicator - Shows difference from 7 days ago */}
                <div className="flex flex-col items-center justify-center gap-2 animate-fade-in">
                    {weightDiff && (
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isDown
                                ? 'bg-green-100 border-green-200'
                                : isUp
                                    ? 'bg-orange-100 border-orange-200'
                                    : 'bg-gray-100 border-gray-200'
                            }`}>
                            <span className={`material-symbols-outlined text-lg ${isDown ? 'text-green-600' : isUp ? 'text-orange-600' : 'text-gray-600'
                                }`}>
                                {isDown ? 'trending_down' : isUp ? 'trending_up' : 'trending_flat'}
                            </span>
                            <p className={`text-sm font-medium ${isDown ? 'text-green-800' : isUp ? 'text-orange-800' : 'text-gray-800'
                                }`}>
                                <span className="font-bold">{Math.abs(parseFloat(weightDiff))}kg</span>
                                {isDown ? ' down' : isUp ? ' up' : ''} since 7 days ago
                            </p>
                        </div>
                    )}
                    {startWeight && (
                        <p className="text-xs text-neutral-400 font-medium">
                            Start weight: <span className="font-bold text-neutral-600">{startWeight.toFixed(1)}kg</span>
                        </p>
                    )}
                </div>
            </main>

            {/* Save Button - Fixed at bottom, GREEN by default */}
            <div className="fixed bottom-20 left-0 right-0 p-6 bg-gradient-to-t from-[#f6f8f6] via-[#f6f8f6] to-transparent pt-12 max-w-md mx-auto z-20">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-primary hover:bg-[#0fd60f] active:scale-[0.98] transition-all text-black font-bold text-lg h-14 rounded-full shadow-[0_8px_20px_-6px_rgba(19,236,19,0.4)] hover:shadow-[0_12px_24px_-6px_rgba(19,236,19,0.5)] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    <span>{saving ? 'Saving...' : 'Save Weight'}</span>
                    <span className="material-symbols-outlined text-2xl">check_circle</span>
                </button>
            </div>
        </div>
    );
}

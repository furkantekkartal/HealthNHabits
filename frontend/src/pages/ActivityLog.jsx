import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLogByDate, getTodayLog, deleteEntry, updateEntry } from '../services/api';
import { useDate } from '../context/DateContext';
import { PageLoading, Toast } from '../components/ui/UIComponents';

export default function ActivityLog() {
    const navigate = useNavigate();
    const { selectedDate, changeDate, isToday, formatDate, getDateString } = useDate();
    const [loading, setLoading] = useState(true);
    const [log, setLog] = useState(null);
    const [toast, setToast] = useState(null);
    const [editingEntry, setEditingEntry] = useState(null);

    const fetchLog = async () => {
        try {
            setLoading(true);
            let res;
            if (isToday()) {
                res = await getTodayLog();
            } else {
                res = await getLogByDate(getDateString());
            }
            setLog(res.data);
        } catch (err) {
            console.error('Error fetching log:', err);
            setLog({ entries: [], summary: {} });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLog();
    }, [selectedDate]);

    const handleDelete = async (entryId) => {
        try {
            const dateStr = isToday() ? undefined : getDateString();
            await deleteEntry(entryId, dateStr);
            setToast({ message: 'Entry deleted', type: 'success' });
            fetchLog();
        } catch (err) {
            console.error('Error deleting entry:', err);
            setToast({ message: 'Failed to delete', type: 'error' });
        }
    };

    const getEntryIcon = (type) => {
        switch (type) {
            case 'food': return { icon: 'restaurant', color: 'bg-orange-100 text-orange-600' };
            case 'water': return { icon: 'water_drop', color: 'bg-blue-100 text-blue-500' };
            case 'steps': return { icon: 'directions_walk', color: 'bg-primary/20 text-green-700' };
            case 'weight': return { icon: 'monitor_weight', color: 'bg-emerald-100 text-emerald-600' };
            default: return { icon: 'circle', color: 'bg-gray-100 text-gray-500' };
        }
    };

    const getEntryTitle = (entry) => {
        switch (entry.type) {
            case 'food': return entry.data.mealType ? entry.data.mealType.charAt(0).toUpperCase() + entry.data.mealType.slice(1) : 'Food';
            case 'water': return 'Hydration';
            case 'steps': return 'Activity';
            case 'weight': return 'Weight Log';
            default: return 'Entry';
        }
    };

    const getEntryDescription = (entry) => {
        switch (entry.type) {
            case 'food': return entry.data.name || 'Food item';
            case 'water': return `${entry.data.amount}ml Water`;
            case 'steps': return `${entry.data.steps?.toLocaleString()} steps • ${entry.data.caloriesBurned} kcal`;
            case 'weight': return `${entry.data.weight} ${entry.data.weightUnit || 'kg'}`;
            default: return '';
        }
    };

    const getEntryBadge = (entry) => {
        if (entry.type === 'food' && entry.data.calories) {
            return { text: `${entry.data.calories} kcal`, color: 'text-orange-600 bg-orange-50' };
        }
        if (entry.type === 'steps' && entry.data.steps) {
            return { text: `${entry.data.steps?.toLocaleString()} steps`, color: 'text-primary bg-primary/10' };
        }
        return null;
    };

    const formatTime = (time) => {
        const date = new Date(time);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const summary = log?.summary || {};
    const entries = log?.entries || [];

    // Sort entries by time (newest first for display, but timeline shows oldest first)
    const sortedEntries = [...entries].sort((a, b) => new Date(a.time) - new Date(b.time));

    if (loading) {
        return <PageLoading message="Loading activity log..." />;
    }

    return (
        <div className="bg-[#f6f8f6] min-h-screen relative pb-24">
            {/* Toast */}
            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}

            {/* Header */}
            <header className="sticky top-0 z-20 bg-[#f6f8f6]/95 backdrop-blur-sm border-b border-zinc-200 transition-colors duration-300">
                <div className="flex items-center justify-between p-4 pb-2">
                    <button
                        onClick={() => changeDate(-1)}
                        className="flex size-10 items-center justify-center rounded-full hover:bg-zinc-100 transition-colors"
                    >
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <div className="flex flex-col items-center flex-1">
                        <h2 className="text-lg font-bold leading-tight tracking-tight">
                            {isToday() ? 'Today' : formatDate()}
                        </h2>
                    </div>
                    <button
                        onClick={() => changeDate(1)}
                        disabled={isToday()}
                        className="flex size-10 items-center justify-center rounded-full hover:bg-zinc-100 transition-colors disabled:opacity-30"
                    >
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                </div>
            </header>

            {/* Summary Cards */}
            <section className="p-4">
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    <div className="flex min-w-[140px] flex-1 flex-col gap-1 rounded-2xl p-4 bg-white shadow-sm border border-zinc-100">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-orange-500 text-[20px]">local_fire_department</span>
                            <p className="text-zinc-500 text-sm font-medium">Calories</p>
                        </div>
                        <div className="flex items-end gap-2">
                            <p className="text-2xl font-bold leading-none">{(summary.caloriesEaten || 0).toLocaleString()}</p>
                            <p className="text-zinc-400 text-xs font-medium mb-1">kcal</p>
                        </div>
                    </div>
                    <div className="flex min-w-[140px] flex-1 flex-col gap-1 rounded-2xl p-4 bg-white shadow-sm border border-zinc-100">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-blue-500 text-[20px]">egg_alt</span>
                            <p className="text-zinc-500 text-sm font-medium">Protein</p>
                        </div>
                        <div className="flex items-end gap-2">
                            <p className="text-2xl font-bold leading-none">{summary.protein || 0}g</p>
                        </div>
                    </div>
                    <div className="flex min-w-[140px] flex-1 flex-col gap-1 rounded-2xl p-4 bg-white shadow-sm border border-zinc-100">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-primary text-[20px]">directions_walk</span>
                            <p className="text-zinc-500 text-sm font-medium">Steps</p>
                        </div>
                        <div className="flex items-end gap-2">
                            <p className="text-2xl font-bold leading-none">{(summary.steps || 0).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Timeline */}
            <section className="mt-2 px-4">
                {sortedEntries.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500">
                        <span className="material-symbols-outlined text-4xl mb-2">event_busy</span>
                        <p className="font-medium">No entries for this day</p>
                        <p className="text-sm">Start logging your activities!</p>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {sortedEntries.map((entry, index) => {
                            const { icon, color } = getEntryIcon(entry.type);
                            const badge = getEntryBadge(entry);
                            const isLast = index === sortedEntries.length - 1;

                            return (
                                <div key={entry._id} className="grid grid-cols-[48px_1fr] gap-x-2 relative group">
                                    {/* Timeline Icon */}
                                    <div className="flex flex-col items-center h-full">
                                        {index > 0 && <div className="w-0.5 bg-zinc-200 h-4 -mb-2"></div>}
                                        <div className={`flex items-center justify-center size-8 rounded-full ${color} z-10 ring-4 ring-[#f6f8f6]`}>
                                            <span className="material-symbols-outlined text-[18px]">{icon}</span>
                                        </div>
                                        {!isLast && <div className="w-0.5 bg-zinc-200 h-full -mt-2"></div>}
                                    </div>

                                    {/* Entry Content */}
                                    <div className="pb-6 pt-1">
                                        <div className="flex flex-col gap-2 rounded-xl p-3 bg-white border border-zinc-100 shadow-sm">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-base font-semibold">{getEntryTitle(entry)}</p>
                                                    <p className="text-zinc-600 text-sm">{getEntryDescription(entry)}</p>
                                                </div>
                                                <span className="text-xs font-medium text-zinc-400 bg-zinc-100 px-2 py-1 rounded-md">
                                                    {formatTime(entry.time)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between mt-1">
                                                {badge ? (
                                                    <span className={`text-xs font-semibold ${badge.color} px-1.5 py-0.5 rounded`}>
                                                        {badge.text}
                                                    </span>
                                                ) : <div></div>}
                                                <div className="flex items-center gap-1">
                                                    {entry.type === 'food' ? (
                                                        <button
                                                            onClick={() => navigate('/analyze', { state: { editEntry: entry } })}
                                                            className="size-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => {
                                                                if (entry.type === 'water') navigate('/water');
                                                                else if (entry.type === 'steps') navigate('/steps');
                                                                else if (entry.type === 'weight') navigate('/weight');
                                                            }}
                                                            className="size-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(entry._id)}
                                                        className="size-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Fade out timeline */}
                        <div className="grid grid-cols-[48px_1fr] gap-x-2 relative h-8">
                            <div className="flex flex-col items-center h-full">
                                <div className="w-0.5 bg-gradient-to-b from-zinc-200 to-transparent h-full"></div>
                            </div>
                            <div></div>
                        </div>
                    </div>
                )}
            </section>

            {/* FAB */}
            <div className="fixed bottom-24 right-6 z-50">
                <button
                    onClick={() => navigate('/analyze')}
                    className="flex items-center justify-center size-14 rounded-full bg-primary text-black shadow-lg shadow-green-500/30 hover:bg-[#0fdc0f] hover:scale-105 active:scale-95 transition-all duration-200"
                >
                    <span className="material-symbols-outlined text-[32px]">add</span>
                </button>
            </div>
        </div>
    );
}

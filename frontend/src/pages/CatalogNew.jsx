import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createProduct, updateEntry } from '../services/api';
import { useDate } from '../context/DateContext';
import { Toast } from '../components/ui/UIComponents';

const CATEGORIES = ['Meal', 'Fruit', 'Coffee', 'Snack', 'Drink', 'Custom'];

export default function CatalogNew() {
    const navigate = useNavigate();
    const location = useLocation();
    const { getDateString, isToday } = useDate();
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [entryId, setEntryId] = useState(null);
    const [entryDate, setEntryDate] = useState(null);

    // Check if coming from analyze page - use both location.state and sessionStorage
    const [returnTo, setReturnTo] = useState(null);

    useEffect(() => {
        console.log('CatalogNew - location.state:', location.state);
        console.log('CatalogNew - location.state?.returnTo:', location.state?.returnTo);

        // First check location.state
        if (location.state?.returnTo) {
            console.log('CatalogNew - Setting returnTo from location.state:', location.state.returnTo);
            setReturnTo(location.state.returnTo);
            // Also save to sessionStorage as backup
            sessionStorage.setItem('catalogNewReturnTo', location.state.returnTo);
        } else {
            // Check sessionStorage as fallback
            const savedReturnTo = sessionStorage.getItem('catalogNewReturnTo');
            console.log('CatalogNew - sessionStorage returnTo:', savedReturnTo);
            if (savedReturnTo) {
                console.log('CatalogNew - Setting returnTo from sessionStorage:', savedReturnTo);
                setReturnTo(savedReturnTo);
            }
        }
    }, [location.state]);

    const [formData, setFormData] = useState({
        name: '',
        emoji: '🍽️',
        category: 'Meal',
        servingSize: 100,
        servingUnit: 'g',
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0
    });

    // Check if we're editing a food entry from ActivityLog
    useEffect(() => {
        if (location.state?.editFoodEntry) {
            const entry = location.state.editFoodEntry;
            setIsEditMode(true);
            setEntryId(entry._id);

            // Get the date from the entry time
            const entryTime = new Date(entry.time);
            const dateStr = entryTime.toISOString().split('T')[0];
            setEntryDate(dateStr);

            setFormData({
                name: entry.data?.name || '',
                emoji: '🍽️',
                category: 'Meal',
                servingSize: entry.data?.portion || 100,
                servingUnit: entry.data?.unit || 'g',
                calories: entry.data?.calories || 0,
                protein: entry.data?.protein || 0,
                carbs: entry.data?.carbs || 0,
                fat: entry.data?.fat || 0,
                fiber: entry.data?.fiber || 0
            });
        }
    }, [location.state]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            setToast({ message: 'Please enter a name', type: 'error' });
            return;
        }

        setSaving(true);
        try {
            if (isEditMode && entryId) {
                // Update existing food entry
                await updateEntry(entryId, {
                    name: formData.name,
                    calories: formData.calories,
                    protein: formData.protein,
                    carbs: formData.carbs,
                    fat: formData.fat,
                    fiber: formData.fiber,
                    portion: formData.servingSize,
                    unit: formData.servingUnit
                }, entryDate);
                setToast({ message: 'Entry updated!', type: 'success' });
                setTimeout(() => navigate('/log'), 1000);
            } else {
                // Create new product
                const newProduct = {
                    name: formData.name,
                    emoji: formData.emoji,
                    category: formData.category,
                    servingSize: { value: formData.servingSize, unit: formData.servingUnit },
                    nutrition: {
                        calories: formData.calories,
                        protein: formData.protein,
                        carbs: formData.carbs,
                        fat: formData.fat,
                        fiber: formData.fiber
                    }
                };

                await createProduct(newProduct);
                setToast({ message: 'Product created!', type: 'success' });

                // If coming from analyze page, save the product to be added to detected items
                if (returnTo === '/analyze') {
                    const existingState = sessionStorage.getItem('foodAnalysisState');
                    if (existingState) {
                        try {
                            const parsed = JSON.parse(existingState);
                            // Add new item to the result items
                            const newItem = {
                                id: Date.now(),
                                name: formData.name,
                                calories: formData.calories,
                                protein: formData.protein,
                                carbs: formData.carbs,
                                fat: formData.fat,
                                fiber: formData.fiber,
                                portion: formData.servingSize,
                                basePortion: formData.servingSize,
                                baseCalories: formData.calories,
                                baseProtein: formData.protein,
                                baseCarbs: formData.carbs,
                                baseFat: formData.fat,
                                baseFiber: formData.fiber,
                                unit: formData.servingUnit
                            };
                            parsed.result = parsed.result || { items: [] };
                            parsed.result.items = [...(parsed.result.items || []), newItem];
                            sessionStorage.setItem('foodAnalysisState', JSON.stringify(parsed));
                        } catch (e) {
                            console.error('Error updating state:', e);
                        }
                    }
                }

                // Navigate back to returnTo if set, otherwise to catalog
                const destination = returnTo || '/catalog';
                console.log('CatalogNew - handleSave - returnTo:', returnTo);
                console.log('CatalogNew - handleSave - destination:', destination);
                // Clear the returnTo from sessionStorage
                sessionStorage.removeItem('catalogNewReturnTo');
                setTimeout(() => navigate(destination), 1000);
            }
        } catch (err) {
            console.error('Error saving:', err);
            setToast({ message: 'Failed to save', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col min-h-full bg-[#f6f8f6] pb-24">
            {/* Toast */}
            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}

            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#f6f8f6]/95 backdrop-blur-sm border-b border-gray-100">
                <div className="flex items-center justify-between p-4 h-16">
                    <button onClick={() => {
                        sessionStorage.removeItem('catalogNewReturnTo');
                        navigate(returnTo || -1);
                    }} className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-black/5">
                        <span className="material-symbols-outlined text-[24px]">arrow_back</span>
                    </button>
                    <h1 className="text-lg font-bold">{isEditMode ? 'Edit Food Entry' : 'New Product'}</h1>
                    <div className="w-10"></div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4">
                <div className="max-w-md mx-auto space-y-4">
                    {/* Name & Emoji */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="text-4xl">{formData.emoji}</div>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder="Food name..."
                                className="flex-1 text-lg font-semibold bg-transparent border-none p-0 focus:ring-0 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Category (for new products only) */}
                    {!isEditMode && (
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                            <label className="text-xs text-gray-500 font-medium mb-2 block">Category</label>
                            <div className="flex flex-wrap gap-2">
                                {CATEGORIES.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => handleChange('category', cat)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${formData.category === cat
                                            ? 'bg-primary text-black'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Serving Size */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <label className="text-xs text-gray-500 font-medium mb-2 block">Serving Size</label>
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                value={formData.servingSize}
                                onChange={(e) => handleChange('servingSize', parseInt(e.target.value) || 0)}
                                className="flex-1 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                            <select
                                value={formData.servingUnit}
                                onChange={(e) => handleChange('servingUnit', e.target.value)}
                                className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 focus:ring-2 focus:ring-primary focus:border-primary"
                            >
                                <option value="g">g</option>
                                <option value="ml">ml</option>
                                <option value="pc">pc</option>
                            </select>
                        </div>
                    </div>

                    {/* Nutrition */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <label className="text-xs text-gray-500 font-medium mb-3 block">Nutrition (per serving)</label>
                        <div className="grid grid-cols-2 gap-3">
                            {/* Calories */}
                            <div className="col-span-2">
                                <label className="text-xs text-gray-400 mb-1 block">Calories</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={formData.calories}
                                        onChange={(e) => handleChange('calories', parseInt(e.target.value) || 0)}
                                        className="flex-1 bg-orange-50 rounded-xl px-3 py-3 border border-orange-200 text-center font-bold text-lg focus:ring-2 focus:ring-orange-400"
                                    />
                                    <span className="text-xs text-gray-500 w-8">kcal</span>
                                </div>
                            </div>
                            {/* Protein */}
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Protein</label>
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        value={formData.protein}
                                        onChange={(e) => handleChange('protein', parseInt(e.target.value) || 0)}
                                        className="flex-1 bg-purple-50 rounded-xl px-3 py-2 border border-purple-200 text-center font-medium focus:ring-2 focus:ring-purple-400"
                                    />
                                    <span className="text-xs text-gray-500 w-4">g</span>
                                </div>
                            </div>
                            {/* Carbs */}
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Carbs</label>
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        value={formData.carbs}
                                        onChange={(e) => handleChange('carbs', parseInt(e.target.value) || 0)}
                                        className="flex-1 bg-amber-50 rounded-xl px-3 py-2 border border-amber-200 text-center font-medium focus:ring-2 focus:ring-amber-400"
                                    />
                                    <span className="text-xs text-gray-500 w-4">g</span>
                                </div>
                            </div>
                            {/* Fat */}
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Fat</label>
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        value={formData.fat}
                                        onChange={(e) => handleChange('fat', parseInt(e.target.value) || 0)}
                                        className="flex-1 bg-red-50 rounded-xl px-3 py-2 border border-red-200 text-center font-medium focus:ring-2 focus:ring-red-400"
                                    />
                                    <span className="text-xs text-gray-500 w-4">g</span>
                                </div>
                            </div>
                            {/* Fiber */}
                            <div>
                                <label className="text-xs text-gray-400 mb-1 block">Fiber</label>
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        value={formData.fiber}
                                        onChange={(e) => handleChange('fiber', parseInt(e.target.value) || 0)}
                                        className="flex-1 bg-green-50 rounded-xl px-3 py-2 border border-green-200 text-center font-medium focus:ring-2 focus:ring-green-400"
                                    />
                                    <span className="text-xs text-gray-500 w-4">g</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Save Button */}
            <div className="fixed bottom-16 left-0 right-0 p-4 bg-[#f6f8f6]/80 backdrop-blur-md">
                <div className="max-w-md mx-auto">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full bg-primary hover:bg-[#0fd60f] active:scale-[0.98] text-black font-bold py-4 rounded-xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined">check</span>
                        {saving ? 'Saving...' : isEditMode ? 'Update Entry' : 'Save Product'}
                    </button>
                </div>
            </div>
        </div>
    );
}

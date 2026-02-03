import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getProduct, updateProduct, deleteProduct, addFoodEntry, getLocalDateString } from '../services/api';
import { useDate } from '../context/DateContext';
import { PageLoading, Toast } from '../components/ui/UIComponents';
import { getMealTypeFromTime } from '../utils/getMealTypeFromTime';

const MEAL_TYPES = [
    { id: 'breakfast', label: 'Breakfast', icon: 'egg_alt' },
    { id: 'lunch', label: 'Lunch', icon: 'lunch_dining' },
    { id: 'dinner', label: 'Dinner', icon: 'dinner_dining' },
    { id: 'snack', label: 'Snack', icon: 'cookie' },
];

export default function ProductDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { getDateString } = useDate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [product, setProduct] = useState(null);
    const [toast, setToast] = useState(null);
    const [selectedMealType, setSelectedMealType] = useState(() => getMealTypeFromTime());

    // Editable state
    const [mealName, setMealName] = useState('');
    const [items, setItems] = useState([]);
    const [imageUrl, setImageUrl] = useState(null);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await getProduct(id);
                const p = res.data;
                setProduct(p);
                setMealName(p.name || '');
                setImageUrl(p.imageUrl);

                // Load ingredients if available, otherwise create single item from product
                if (p.ingredients && p.ingredients.length > 0) {
                    setItems(p.ingredients.map((ing, idx) => ({
                        ...ing,
                        id: ing.id || idx
                    })));
                } else {
                    // Fallback: treat product as single ingredient
                    setItems([{
                        id: 1,
                        name: p.name,
                        calories: p.nutrition?.calories || 0,
                        protein: p.nutrition?.protein || 0,
                        carbs: p.nutrition?.carbs || 0,
                        fat: p.nutrition?.fat || 0,
                        fiber: p.nutrition?.fiber || 0,
                        portion: p.servingSize?.value || 100,
                        basePortion: p.servingSize?.value || 100,
                        baseCalories: p.nutrition?.calories || 0,
                        baseProtein: p.nutrition?.protein || 0,
                        baseCarbs: p.nutrition?.carbs || 0,
                        baseFat: p.nutrition?.fat || 0,
                        baseFiber: p.nutrition?.fiber || 0,
                        unit: p.servingSize?.unit || 'g'
                    }]);
                }
            } catch (err) {
                console.error('Error fetching product:', err);
                setToast({ message: 'Failed to load product', type: 'error' });
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    // Calculate totals from items
    const totals = items.reduce((acc, item) => ({
        calories: acc.calories + (item.calories || 0),
        protein: acc.protein + (item.protein || 0),
        carbs: acc.carbs + (item.carbs || 0),
        fat: acc.fat + (item.fat || 0),
        fiber: acc.fiber + (item.fiber || 0),
        portion: acc.portion + (item.portion || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, portion: 0 });

    // Update item portion and recalculate macros
    const updateItemPortion = (itemId, newPortion) => {
        setItems(prev => prev.map(item => {
            if (item.id !== itemId) return item;
            const ratio = newPortion / (item.basePortion || 100);
            return {
                ...item,
                portion: newPortion,
                calories: Math.round((item.baseCalories || 0) * ratio),
                protein: Math.round(((item.baseProtein || 0) * ratio) * 10) / 10,
                carbs: Math.round(((item.baseCarbs || 0) * ratio) * 10) / 10,
                fat: Math.round(((item.baseFat || 0) * ratio) * 10) / 10,
                fiber: Math.round(((item.baseFiber || 0) * ratio) * 10) / 10
            };
        }));
    };

    // Delete item
    const deleteItem = (itemId) => {
        setItems(prev => prev.filter(item => item.id !== itemId));
    };

    // Save changes and add to log
    const handleSave = async () => {
        if (items.length === 0) {
            setToast({ message: 'Add at least one item', type: 'error' });
            return;
        }

        setSaving(true);
        try {
            // Update product with new ingredients and totals
            await updateProduct(id, {
                name: mealName,
                ingredients: items,
                servingSize: { value: totals.portion, unit: 'g' },
                nutrition: {
                    calories: totals.calories,
                    protein: Math.round(totals.protein * 10) / 10,
                    carbs: Math.round(totals.carbs * 10) / 10,
                    fat: Math.round(totals.fat * 10) / 10,
                    fiber: Math.round(totals.fiber * 10) / 10
                }
            });

            // Add to daily log
            await addFoodEntry({
                productId: id,
                name: mealName,
                calories: totals.calories,
                protein: Math.round(totals.protein * 10) / 10,
                carbs: Math.round(totals.carbs * 10) / 10,
                fat: Math.round(totals.fat * 10) / 10,
                fiber: Math.round(totals.fiber * 10) / 10,
                portion: totals.portion,
                unit: 'g',
                mealType: selectedMealType,
                date: getDateString()
            });

            setToast({ message: `${mealName} added to ${selectedMealType}!`, type: 'success' });
            setTimeout(() => navigate('/'), 1000);
        } catch (err) {
            console.error('Error saving:', err);
            setToast({ message: 'Failed to save', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Delete "${mealName}"?`)) return;
        try {
            await deleteProduct(id);
            setToast({ message: 'Product deleted', type: 'success' });
            setTimeout(() => navigate('/catalog'), 500);
        } catch (err) {
            setToast({ message: 'Failed to delete', type: 'error' });
        }
    };

    // Navigate to catalog to add item
    const addItem = () => {
        // Save current state to sessionStorage
        sessionStorage.setItem('productDetailState', JSON.stringify({
            productId: id,
            mealName,
            items,
            selectedMealType
        }));
        navigate('/catalog', { state: { returnTo: `/catalog/view/${id}` } });
    };

    // Check for returned item from catalog
    useEffect(() => {
        const savedState = sessionStorage.getItem('productDetailState');
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                if (parsed.productId === id) {
                    // Restore state
                    if (parsed.mealName) setMealName(parsed.mealName);
                    if (parsed.items) setItems(parsed.items);
                    if (parsed.selectedMealType) setSelectedMealType(parsed.selectedMealType);
                }
                sessionStorage.removeItem('productDetailState');
            } catch (e) {
                console.error('Error restoring state:', e);
            }
        }
    }, [id]);

    if (loading) {
        return <PageLoading message="Loading product..." />;
    }

    if (!product) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <p className="text-gray-500">Product not found</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-full bg-[#f6f8f6]">
            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}

            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#f6f8f6]/95 backdrop-blur-sm border-b border-gray-100">
                <div className="flex items-center p-4 h-16">
                    <button onClick={() => navigate(-1)} className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-black/5 active:scale-95 transition-all">
                        <span className="material-symbols-outlined text-[24px]">arrow_back</span>
                    </button>
                    <h1 className="text-lg font-bold leading-tight flex-1 text-center pr-8">
                        {items.length > 0 ? 'Edit Meal' : 'Product Details'}
                    </h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto pb-40">
                {/* Image Section */}
                <div className="px-4 py-3">
                    <div className="relative">
                        <div
                            className="w-full min-h-[160px] rounded-2xl bg-cover bg-center flex flex-col justify-end overflow-hidden shadow-sm"
                            style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : { backgroundColor: '#f3f4f6' }}
                        >
                            {!imageUrl && (
                                <div className="flex items-center justify-center h-[160px]">
                                    <span className="text-6xl">{product.emoji || '🍽️'}</span>
                                </div>
                            )}
                            {imageUrl && (
                                <>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-2xl" />
                                    <div className="relative z-10 p-4">
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/90 backdrop-blur-sm">
                                            <span className="material-symbols-outlined text-black text-[16px]">restaurant</span>
                                            <span className="text-xs font-bold text-black uppercase tracking-wide">Saved Meal</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Meal Name Input */}
                <div className="px-4 py-2">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Meal Name</label>
                        <input
                            type="text"
                            value={mealName}
                            onChange={(e) => setMealName(e.target.value)}
                            className="text-xl font-bold w-full border-none p-0 mt-1 focus:ring-0 bg-transparent"
                            placeholder="Enter meal name"
                        />
                    </div>
                </div>

                {/* Total Macros Summary */}
                <div className="px-4 py-2">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">TOTAL</div>
                        <div className="flex items-center justify-between">
                            <div className="text-center">
                                <span className="text-3xl font-bold">{Math.round(totals.calories)}</span>
                                <span className="text-sm text-gray-500 block">kcal</span>
                            </div>
                            <div className="grid grid-cols-4 gap-3 text-center flex-1 ml-4">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] text-gray-500 font-medium">Protein</span>
                                    <span className="text-sm font-bold text-purple-600">{Math.round(totals.protein)}g</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] text-gray-500 font-medium">Carbs</span>
                                    <span className="text-sm font-bold text-amber-600">{Math.round(totals.carbs)}g</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] text-gray-500 font-medium">Fat</span>
                                    <span className="text-sm font-bold text-red-600">{Math.round(totals.fat)}g</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] text-gray-500 font-medium">Fiber</span>
                                    <span className="text-sm font-bold text-green-600">{Math.round(totals.fiber)}g</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Meal Type Selector */}
                <div className="px-4 py-2">
                    <div className="flex gap-2">
                        {MEAL_TYPES.map((meal) => (
                            <button
                                key={meal.id}
                                onClick={() => setSelectedMealType(meal.id)}
                                className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl transition-all border ${selectedMealType === meal.id
                                    ? 'bg-primary/10 border-primary'
                                    : 'bg-white border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <span className={`material-symbols-outlined text-[20px] ${selectedMealType === meal.id ? 'text-primary' : 'text-gray-400'
                                    }`}>{meal.icon}</span>
                                <span className={`text-xs font-medium ${selectedMealType === meal.id ? 'text-primary' : 'text-gray-500'
                                    }`}>{meal.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Detected Items Header */}
                <div className="px-4 py-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold">Detected Items</h3>
                        <button
                            onClick={addItem}
                            className="text-primary text-sm font-semibold flex items-center gap-1 hover:opacity-80"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            Add Item
                        </button>
                    </div>
                </div>

                {/* Items List */}
                <div className="px-4 flex flex-col gap-3">
                    {items.map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-start gap-3">
                                <div className="size-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl shrink-0">
                                    🍽️
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <div>
                                            <p className="font-semibold text-sm truncate">{item.name}</p>
                                            <p className="text-primary font-bold text-sm">{item.calories} kcal</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => navigate('/catalog/new', {
                                                    state: {
                                                        returnTo: `/catalog/view/${id}`,
                                                        editDetectedItem: item
                                                    }
                                                })}
                                                className="text-gray-400 hover:text-primary transition-colors p-1"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">edit</span>
                                            </button>
                                            <button
                                                onClick={() => deleteItem(item.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Macros Row */}
                                    <div className="flex gap-2 text-[10px] mb-2">
                                        <span className="text-purple-600 font-medium">P: {Math.round(item.protein)}g</span>
                                        <span className="text-amber-600 font-medium">C: {Math.round(item.carbs)}g</span>
                                        <span className="text-red-600 font-medium">F: {Math.round(item.fat)}g</span>
                                        <span className="text-green-600 font-medium">Fi: {Math.round(item.fiber || 0)}g</span>
                                    </div>

                                    {/* Portion Control */}
                                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                                        <span className="text-xs text-gray-500 font-medium">Portion</span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => updateItemPortion(item.id, Math.max(1, (item.portion || 100) - 10))}
                                                className="flex size-6 items-center justify-center rounded-md bg-white shadow-sm text-gray-600 hover:text-primary border border-gray-100"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">remove</span>
                                            </button>
                                            <div className="flex items-baseline gap-1 min-w-[3.5rem] justify-center">
                                                <input
                                                    type="number"
                                                    value={item.portion || 100}
                                                    onChange={(e) => updateItemPortion(item.id, parseInt(e.target.value) || 0)}
                                                    className="w-10 p-0 text-center bg-transparent border-none focus:ring-0 font-bold text-sm"
                                                />
                                                <span className="text-[10px] text-gray-500">{item.unit || 'g'}</span>
                                            </div>
                                            <button
                                                onClick={() => updateItemPortion(item.id, (item.portion || 100) + 10)}
                                                className="flex size-6 items-center justify-center rounded-md bg-white shadow-sm text-gray-600 hover:text-primary border border-gray-100"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">add</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Delete Button */}
                <div className="px-4 pt-6 pb-4">
                    <button
                        onClick={handleDelete}
                        className="w-full py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                        Delete Product
                    </button>
                </div>
            </main>

            {/* Fixed Footer with Save Button */}
            <div className="fixed bottom-20 left-0 right-0 z-30 px-4 pb-2">
                <div className="max-w-md mx-auto bg-white rounded-xl border border-gray-200 shadow-lg p-3">
                    <button
                        onClick={handleSave}
                        disabled={saving || items.length === 0}
                        className="flex items-center justify-center gap-2 w-full h-12 bg-primary hover:bg-[#0fd60f] active:scale-[0.98] transition-all rounded-xl disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-black text-[20px]">check</span>
                        <span className="text-black font-bold text-base">
                            {saving ? 'Saving...' : 'Save as Meal'}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}

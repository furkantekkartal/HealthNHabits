import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
    const [name, setName] = useState('');
    const [portion, setPortion] = useState(100);
    const [basePortion, setBasePortion] = useState(100);
    const [calories, setCalories] = useState(0);
    const [protein, setProtein] = useState(0);
    const [carbs, setCarbs] = useState(0);
    const [fat, setFat] = useState(0);
    const [fiber, setFiber] = useState(0);

    // Base values for scaling
    const [baseCalories, setBaseCalories] = useState(0);
    const [baseProtein, setBaseProtein] = useState(0);
    const [baseCarbs, setBaseCarbs] = useState(0);
    const [baseFat, setBaseFat] = useState(0);
    const [baseFiber, setBaseFiber] = useState(0);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await getProduct(id);
                const p = res.data;
                setProduct(p);
                setName(p.name || '');

                const servingValue = p.servingSize?.value || 100;
                setPortion(servingValue);
                setBasePortion(servingValue);

                setCalories(p.nutrition?.calories || 0);
                setProtein(p.nutrition?.protein || 0);
                setCarbs(p.nutrition?.carbs || 0);
                setFat(p.nutrition?.fat || 0);
                setFiber(p.nutrition?.fiber || 0);

                setBaseCalories(p.nutrition?.calories || 0);
                setBaseProtein(p.nutrition?.protein || 0);
                setBaseCarbs(p.nutrition?.carbs || 0);
                setBaseFat(p.nutrition?.fat || 0);
                setBaseFiber(p.nutrition?.fiber || 0);
            } catch (err) {
                console.error('Error fetching product:', err);
                setToast({ message: 'Failed to load product', type: 'error' });
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    // Update macros when portion changes
    const updatePortion = (newPortion) => {
        if (newPortion < 1) newPortion = 1;
        const ratio = newPortion / basePortion;
        setPortion(newPortion);
        setCalories(Math.round(baseCalories * ratio));
        setProtein(Math.round(baseProtein * ratio * 10) / 10);
        setCarbs(Math.round(baseCarbs * ratio * 10) / 10);
        setFat(Math.round(baseFat * ratio * 10) / 10);
        setFiber(Math.round(baseFiber * ratio * 10) / 10);
    };

    const handleAddToLog = async () => {
        setSaving(true);
        try {
            await addFoodEntry({
                productId: id,
                name: name,
                calories: calories,
                protein: protein,
                carbs: carbs,
                fat: fat,
                fiber: fiber,
                portion: portion,
                unit: product?.servingSize?.unit || 'g',
                mealType: selectedMealType,
                date: getDateString()
            });
            setToast({ message: `${name} added to ${selectedMealType}!`, type: 'success' });
            setTimeout(() => navigate('/'), 1000);
        } catch (err) {
            console.error('Error adding to log:', err);
            setToast({ message: 'Failed to add to log', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Delete "${name}"?`)) return;
        try {
            await deleteProduct(id);
            setToast({ message: 'Product deleted', type: 'success' });
            setTimeout(() => navigate('/catalog'), 500);
        } catch (err) {
            setToast({ message: 'Failed to delete', type: 'error' });
        }
    };

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
                    <h1 className="text-lg font-bold leading-tight flex-1 text-center">Product Details</h1>
                    <button
                        onClick={() => navigate(`/catalog/edit/${id}`)}
                        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/5 transition-all"
                    >
                        <span className="material-symbols-outlined text-[20px] text-gray-600">edit</span>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto pb-40">
                {/* Image Section */}
                <div className="px-4 py-3">
                    <div className="relative">
                        <div
                            className="w-full min-h-[160px] rounded-2xl bg-cover bg-center flex flex-col justify-end overflow-hidden shadow-sm bg-gray-100"
                            style={product.imageUrl ? { backgroundImage: `url(${product.imageUrl})` } : {}}
                        >
                            {!product.imageUrl && (
                                <div className="flex items-center justify-center h-[160px]">
                                    <span className="text-6xl">{product.emoji || '🍽️'}</span>
                                </div>
                            )}
                            {product.imageUrl && (
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-2xl" />
                            )}
                        </div>
                    </div>
                </div>

                {/* Product Info Card */}
                <div className="px-4 py-2">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        {/* Name - Editable */}
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="text-xl font-bold w-full border-none p-0 focus:ring-0 bg-transparent mb-2"
                            placeholder="Product name"
                        />

                        {/* Total Macros Summary */}
                        <div className="flex items-center justify-between bg-primary/10 rounded-xl p-3 mb-4">
                            <div className="text-center">
                                <span className="text-2xl font-bold text-primary">{calories}</span>
                                <span className="text-xs text-gray-600 block">kcal</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-center flex-1 ml-4">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] text-gray-500 font-medium">Protein</span>
                                    <span className="text-sm font-bold text-purple-600">{protein}g</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] text-gray-500 font-medium">Carbs</span>
                                    <span className="text-sm font-bold text-amber-600">{carbs}g</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] text-gray-500 font-medium">Fat</span>
                                    <span className="text-sm font-bold text-red-600">{fat}g</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] text-gray-500 font-medium">Fiber</span>
                                    <span className="text-sm font-bold text-green-600">{fiber}g</span>
                                </div>
                            </div>
                        </div>

                        {/* Meal Type Selector */}
                        <div className="flex gap-2 py-2 mb-4">
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

                        {/* Portion Control */}
                        <div className="bg-gray-50 p-3 rounded-xl">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Portion Size</span>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => updatePortion(Math.max(1, portion - 10))}
                                        className="flex size-8 items-center justify-center rounded-lg bg-white shadow-sm text-gray-600 hover:text-primary border border-gray-100"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">remove</span>
                                    </button>
                                    <div className="flex items-baseline gap-1 min-w-[4rem] justify-center">
                                        <input
                                            type="number"
                                            value={portion}
                                            onChange={(e) => updatePortion(parseInt(e.target.value) || 0)}
                                            className="w-14 p-0 text-center bg-transparent border-none focus:ring-0 font-bold text-lg"
                                        />
                                        <span className="text-sm text-gray-500">{product?.servingSize?.unit || 'g'}</span>
                                    </div>
                                    <button
                                        onClick={() => updatePortion(portion + 10)}
                                        className="flex size-8 items-center justify-center rounded-lg bg-white shadow-sm text-gray-600 hover:text-primary border border-gray-100"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">add</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Delete Button */}
                <div className="px-4 pt-4">
                    <button
                        onClick={handleDelete}
                        className="w-full py-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                        Delete Product
                    </button>
                </div>
            </main>

            {/* Fixed Footer with Add Button */}
            <div className="fixed bottom-20 left-0 right-0 z-30 px-4 pb-2">
                <div className="max-w-md mx-auto bg-white rounded-xl border border-gray-200 shadow-lg p-3">
                    <button
                        onClick={handleAddToLog}
                        disabled={saving}
                        className="flex items-center justify-center gap-2 w-full h-12 bg-primary hover:bg-[#0fd60f] active:scale-[0.98] transition-all rounded-xl disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-black text-[20px]">add</span>
                        <span className="text-black font-bold text-base">
                            {saving ? 'Adding...' : `Add to ${selectedMealType.charAt(0).toUpperCase() + selectedMealType.slice(1)}`}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}

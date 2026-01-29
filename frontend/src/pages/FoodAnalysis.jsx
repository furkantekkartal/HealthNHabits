import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { analyzeFood, addFoodEntry, createProduct, getProducts, getLocalDateString } from '../services/api';
import { Toast } from '../components/ui/UIComponents';
import { getMealTypeFromTime } from '../utils/getMealTypeFromTime';

const MEAL_TYPES = [
    { id: 'breakfast', label: 'Breakfast', icon: 'egg_alt' },
    { id: 'lunch', label: 'Lunch', icon: 'lunch_dining' },
    { id: 'dinner', label: 'Dinner', icon: 'dinner_dining' },
    { id: 'snack', label: 'Snack', icon: 'cookie' },
];

export default function FoodAnalysis() {
    const navigate = useNavigate();
    const location = useLocation();
    const fileInputRef = useRef(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [selectedMealType, setSelectedMealType] = useState(() => getMealTypeFromTime());
    const [toast, setToast] = useState(null);
    const [mealName, setMealName] = useState('');

    // Add Item Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    // Image Source Modal State
    const [showImageSourceModal, setShowImageSourceModal] = useState(false);
    const cameraInputRef = useRef(null);

    // Restore state from sessionStorage if coming back from catalog/new
    useEffect(() => {
        const savedState = sessionStorage.getItem('foodAnalysisState');
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                if (parsed.result) setResult(parsed.result);
                if (parsed.mealName) setMealName(parsed.mealName);
                if (parsed.selectedMealType) setSelectedMealType(parsed.selectedMealType);
                if (parsed.imagePreview) setImagePreview(parsed.imagePreview);
                // Clear the saved state after restoring
                sessionStorage.removeItem('foodAnalysisState');
            } catch (e) {
                console.error('Error restoring state:', e);
            }
        }
    }, []);

    // Check if we're editing an existing entry
    useEffect(() => {
        if (location.state?.editEntry) {
            const entry = location.state.editEntry;
            setResult({
                items: [{
                    id: entry._id || Date.now(),
                    name: entry.data?.name || 'Food Item',
                    calories: entry.data?.calories || 0,
                    protein: entry.data?.protein || 0,
                    carbs: entry.data?.carbs || 0,
                    fat: entry.data?.fat || 0,
                    fiber: entry.data?.fiber || 0,
                    portion: entry.data?.portion || 100,
                    basePortion: entry.data?.portion || 100,
                    baseCalories: entry.data?.calories || 0,
                    baseProtein: entry.data?.protein || 0,
                    baseCarbs: entry.data?.carbs || 0,
                    baseFat: entry.data?.fat || 0,
                    baseFiber: entry.data?.fiber || 0,
                    unit: entry.data?.unit || 'g'
                }]
            });
            setMealName(entry.data?.name || 'Food Item');
            setSelectedMealType(entry.data?.mealType || 'lunch');
        }
    }, [location.state]);

    // Save state to sessionStorage before navigating away
    const saveStateAndNavigate = (path) => {
        const stateToSave = {
            result,
            mealName,
            selectedMealType,
            imagePreview
        };
        sessionStorage.setItem('foodAnalysisState', JSON.stringify(stateToSave));
        navigate(path, { state: { returnTo: '/analyze' } });
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setResult(null);
            setError(null);
        }
    };

    const handleAnalyze = async () => {
        if (!imageFile) return;

        setAnalyzing(true);
        setError(null);

        try {
            const response = await analyzeFood(imageFile);
            if (response.data.success) {
                // Add base values for portion calculations
                const itemsWithBase = response.data.items.map(item => ({
                    ...item,
                    basePortion: item.portion || 100,
                    baseCalories: item.calories || 0,
                    baseProtein: item.protein || 0,
                    baseCarbs: item.carbs || 0,
                    baseFat: item.fat || 0,
                    baseFiber: item.fiber || 0
                }));
                // Store the server imageUrl for product creation (not the blob URL)
                setResult({
                    ...response.data,
                    items: itemsWithBase,
                    serverImageUrl: response.data.imageUrl // Save the server URL
                });
                // Set meal name from first item or combine names
                if (response.data.items.length === 1) {
                    setMealName(response.data.items[0].name);
                } else {
                    setMealName(response.data.items.map(i => i.name).join(' + '));
                }
            } else {
                setError(response.data.error || 'Could not identify food in image');
            }
        } catch (err) {
            console.error('Analysis error:', err);
            setError(err.response?.data?.error || 'Failed to analyze image. Please try again.');
        } finally {
            setAnalyzing(false);
        }
    };

    // Update item and recalculate macros based on portion change
    const updateItemPortion = (id, newPortion) => {
        setResult(prev => ({
            ...prev,
            items: prev.items.map(item => {
                if (item.id === id) {
                    const ratio = newPortion / (item.basePortion || 100);
                    return {
                        ...item,
                        portion: newPortion,
                        calories: Math.round((item.baseCalories || 0) * ratio),
                        protein: Math.round((item.baseProtein || 0) * ratio),
                        carbs: Math.round((item.baseCarbs || 0) * ratio),
                        fat: Math.round((item.baseFat || 0) * ratio),
                        fiber: Math.round((item.baseFiber || 0) * ratio)
                    };
                }
                return item;
            })
        }));
    };

    const deleteItem = (id) => {
        setResult(prev => ({
            ...prev,
            items: prev.items.filter(item => item.id !== id)
        }));
    };

    // Search for products
    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const res = await getProducts({ search: query });
            setSearchResults(res.data.slice(0, 10));
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setSearching(false);
        }
    };

    // Add product from catalog to detected items
    const addProductToItems = (product) => {
        const newItem = {
            id: Date.now(),
            name: product.name,
            calories: product.nutrition?.calories || 0,
            protein: product.nutrition?.protein || 0,
            carbs: product.nutrition?.carbs || 0,
            fat: product.nutrition?.fat || 0,
            fiber: product.nutrition?.fiber || 0,
            portion: product.servingSize?.value || 100,
            basePortion: product.servingSize?.value || 100,
            baseCalories: product.nutrition?.calories || 0,
            baseProtein: product.nutrition?.protein || 0,
            baseCarbs: product.nutrition?.carbs || 0,
            baseFat: product.nutrition?.fat || 0,
            baseFiber: product.nutrition?.fiber || 0,
            unit: product.servingSize?.unit || 'g'
        };

        setResult(prev => ({
            ...prev,
            items: [...(prev?.items || []), newItem]
        }));

        setShowAddModal(false);
        setSearchQuery('');
        setSearchResults([]);
        setToast({ message: `${product.name} added!`, type: 'success' });
    };

    // Save as Meal - saves the whole meal as one item to log AND catalog
    const handleSaveAsMeal = async () => {
        if (!result?.items?.length) return;

        setLoading(true);
        try {
            // Create combined meal for catalog (auto-add)
            // Use the server imageUrl returned by AI (not blob URL which is session-local)
            const combinedProduct = {
                name: mealName || 'Custom Meal',
                emoji: '🍽️',
                category: 'Meal',
                imageUrl: result.serverImageUrl || null, // Use server-stored image path
                servingSize: { value: totals.portion, unit: 'g' },
                nutrition: {
                    calories: totals.calories,
                    protein: totals.protein,
                    carbs: totals.carbs,
                    fat: totals.fat,
                    fiber: totals.fiber
                }
            };

            // Save to catalog for "Most Used"
            await createProduct(combinedProduct);

            // Save to daily log
            await addFoodEntry({
                name: mealName || 'Custom Meal',
                calories: totals.calories,
                protein: totals.protein,
                carbs: totals.carbs,
                fat: totals.fat,
                fiber: totals.fiber,
                portion: totals.portion,
                unit: 'g',
                mealType: selectedMealType,
                date: getLocalDateString() // Always send user's local date for correct timezone
            });

            setToast({ message: `${mealName || 'Meal'} saved!`, type: 'success' });
            setTimeout(() => navigate('/'), 1500);
        } catch (err) {
            console.error('Save error:', err);
            setToast({ message: 'Failed to save meal', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const totals = result?.items?.reduce((acc, item) => ({
        calories: acc.calories + (item.calories || 0),
        protein: acc.protein + (item.protein || 0),
        carbs: acc.carbs + (item.carbs || 0),
        fat: acc.fat + (item.fat || 0),
        fiber: acc.fiber + (item.fiber || 0),
        portion: acc.portion + (item.portion || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, portion: 0 }) || { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, portion: 0 };

    return (
        <div className="flex flex-col min-h-full bg-[#f6f8f6]">
            {/* Toast */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#f6f8f6]/95 backdrop-blur-sm border-b border-gray-100">
                <div className="flex items-center p-4 h-16">
                    <button onClick={() => navigate(-1)} className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-black/5 active:scale-95 transition-all">
                        <span className="material-symbols-outlined text-[24px]">arrow_back</span>
                    </button>
                    <h1 className="text-lg font-bold leading-tight flex-1 text-center pr-8">
                        {result ? 'Analysis Result' : 'AI Food Scan'}
                    </h1>
                </div>
            </header>

            {/* Main Content - Scrollable with proper padding for fixed footer */}
            <main className="flex-1 overflow-y-auto pb-40">
                {/* Image Section */}
                <div className="px-4 py-3">
                    {!imagePreview && !result ? (
                        <div
                            onClick={() => setShowImageSourceModal(true)}
                            className="w-full min-h-[180px] rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                        >
                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-4xl">photo_camera</span>
                            </div>
                            <div className="text-center">
                                <p className="font-semibold text-gray-700">Take a Photo or Upload</p>
                                <p className="text-sm text-gray-500">AI will analyze calories & macros</p>
                            </div>
                        </div>
                    ) : imagePreview ? (
                        <div className="relative">
                            <div
                                className="w-full min-h-[160px] rounded-2xl bg-cover bg-center flex flex-col justify-end overflow-hidden shadow-sm"
                                style={{ backgroundImage: `url(${imagePreview})` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-2xl"></div>
                                {result && (
                                    <div className="relative z-10 p-4">
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/90 backdrop-blur-sm">
                                            <span className="material-symbols-outlined text-black text-[16px]">check_circle</span>
                                            <span className="text-xs font-bold text-black uppercase tracking-wide">Scan Complete</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    setImagePreview(null);
                                    setImageFile(null);
                                    setResult(null);
                                }}
                                className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center"
                            >
                                <span className="material-symbols-outlined text-white text-xl">close</span>
                            </button>
                        </div>
                    ) : null}
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                />
                <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageSelect}
                    className="hidden"
                />

                {/* Analyze Button */}
                {imagePreview && !result && (
                    <div className="px-4 mb-4">
                        <button
                            onClick={handleAnalyze}
                            disabled={analyzing}
                            className="w-full bg-primary hover:bg-[#0fd60f] text-black font-bold py-4 rounded-xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {analyzing ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin">sync</span>
                                    Analyzing with AI...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">auto_awesome</span>
                                    Analyze with AI
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-red-600 text-sm flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">error</span>
                            {error}
                        </p>
                    </div>
                )}

                {/* Results Section */}
                {result && (
                    <div className="px-4 py-2 space-y-4">
                        {/* Meal Name Input */}
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                            <label className="text-xs text-gray-500 font-medium mb-1 block">Meal Name</label>
                            <input
                                type="text"
                                value={mealName}
                                onChange={(e) => setMealName(e.target.value)}
                                placeholder="Enter meal name..."
                                className="w-full text-lg font-bold bg-transparent border-none p-0 focus:ring-0 focus:outline-none"
                            />
                        </div>

                        {/* Stats Summary */}
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                                <div>
                                    <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Total</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-bold">{totals.calories}</span>
                                        <span className="text-primary font-bold">kcal</span>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-center">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] text-gray-500 font-medium">Protein</span>
                                    <span className="text-sm font-bold text-purple-600">{totals.protein}g</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] text-gray-500 font-medium">Carbs</span>
                                    <span className="text-sm font-bold text-amber-600">{totals.carbs}g</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] text-gray-500 font-medium">Fat</span>
                                    <span className="text-sm font-bold text-red-600">{totals.fat}g</span>
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] text-gray-500 font-medium">Fiber</span>
                                    <span className="text-sm font-bold text-green-600">{totals.fiber}g</span>
                                </div>
                            </div>
                        </div>

                        {/* Meal Type Selector - Moved above detected items */}
                        <div className="flex gap-2 py-2">
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

                        {/* Detected Items Header */}
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold">Detected Items</h3>
                            <button
                                onClick={() => saveStateAndNavigate('/catalog')}
                                className="text-primary text-sm font-semibold flex items-center gap-1 hover:opacity-80"
                            >
                                <span className="material-symbols-outlined text-[18px]">add</span>
                                Add Item
                            </button>
                        </div>

                        {/* Detected Items List */}
                        <div className="flex flex-col gap-3">
                            {result.items?.map((item) => (
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
                                                        onClick={() => {
                                                            // Save state and navigate to edit with item data
                                                            const stateToSave = {
                                                                result,
                                                                mealName,
                                                                selectedMealType,
                                                                imagePreview,
                                                                editingItemId: item.id // Track which item is being edited
                                                            };
                                                            sessionStorage.setItem('foodAnalysisState', JSON.stringify(stateToSave));
                                                            navigate('/catalog/new', {
                                                                state: {
                                                                    returnTo: '/analyze',
                                                                    editDetectedItem: item
                                                                }
                                                            });
                                                        }}
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
                                                <span className="text-purple-600 font-medium">P: {item.protein}g</span>
                                                <span className="text-amber-600 font-medium">C: {item.carbs}g</span>
                                                <span className="text-red-600 font-medium">F: {item.fat}g</span>
                                                <span className="text-green-600 font-medium">Fi: {item.fiber || 0}g</span>
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

                        {/* Search Manually Link */}
                        <div className="text-center py-2">
                            <p className="text-xs text-gray-400">
                                Is something missing? <button onClick={() => saveStateAndNavigate('/catalog')} className="text-primary hover:underline">Browse catalog to add</button>
                            </p>
                        </div>
                    </div>
                )}
            </main>

            {/* Fixed Footer with Save Button - Proper spacing above nav bar */}
            {result?.items?.length > 0 && (
                <div className="fixed bottom-20 left-0 right-0 z-30 px-4 pb-2">
                    <div className="max-w-md mx-auto bg-white rounded-xl border border-gray-200 shadow-lg p-3">
                        <button
                            onClick={handleSaveAsMeal}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 w-full h-12 bg-primary hover:bg-[#0fd60f] active:scale-[0.98] transition-all rounded-xl disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-black text-[20px]">check</span>
                            <span className="text-black font-bold text-base">
                                {loading ? 'Saving...' : 'Save as Meal'}
                            </span>
                        </button>
                    </div>
                </div>
            )}

            {/* Add Item Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowAddModal(false)}>
                    <div className="bg-white rounded-t-3xl w-full max-w-md max-h-[70vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-100">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-bold">Add Item</h3>
                                <button onClick={() => setShowAddModal(false)} className="p-1">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="Search for food..."
                                    autoFocus
                                    className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl border-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            {searching && (
                                <div className="text-center py-8 text-gray-400">
                                    <span className="material-symbols-outlined animate-spin text-2xl">sync</span>
                                    <p className="mt-2">Searching...</p>
                                </div>
                            )}
                            {!searching && searchResults.length === 0 && searchQuery.length >= 2 && (
                                <div className="text-center py-8 text-gray-400">
                                    <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
                                    <p>No results found</p>
                                    <Link to="/catalog/new" className="text-primary text-sm mt-2 inline-block">Create new product</Link>
                                </div>
                            )}
                            {!searching && searchResults.length > 0 && (
                                <div className="flex flex-col gap-2">
                                    {searchResults.map((product) => (
                                        <button
                                            key={product._id}
                                            onClick={() => addProductToItems(product)}
                                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 text-left"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-xl">
                                                {product.emoji || '🍽️'}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-sm">{product.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {product.nutrition?.calories || 0} kcal • {product.servingSize?.value || 100}{product.servingSize?.unit || 'g'}
                                                </p>
                                            </div>
                                            <span className="material-symbols-outlined text-primary">add_circle</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {!searching && searchQuery.length < 2 && (
                                <div className="text-center py-8 text-gray-400">
                                    <span className="material-symbols-outlined text-4xl mb-2">restaurant_menu</span>
                                    <p>Type to search your catalog</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Image Source Selection Modal */}
            {showImageSourceModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center">
                    <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold">Add Photo</h3>
                            <button
                                onClick={() => setShowImageSourceModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    setShowImageSourceModal(false);
                                    cameraInputRef.current?.click();
                                }}
                                className="flex items-center gap-4 p-4 bg-primary/10 rounded-2xl hover:bg-primary/20 transition-colors"
                            >
                                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-primary text-2xl">photo_camera</span>
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold">Take Photo</p>
                                    <p className="text-sm text-gray-500">Use your camera to capture food</p>
                                </div>
                            </button>
                            <button
                                onClick={() => {
                                    setShowImageSourceModal(false);
                                    fileInputRef.current?.click();
                                }}
                                className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl hover:bg-blue-100 transition-colors"
                            >
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-blue-600 text-2xl">photo_library</span>
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold">Upload Image</p>
                                    <p className="text-sm text-gray-500">Choose from your photo library</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

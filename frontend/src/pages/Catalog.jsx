import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getProducts, getMostUsedProducts, addFoodEntry, updateProduct } from '../services/api';
import { useDate } from '../context/DateContext';
import { PageLoading, Toast } from '../components/ui/UIComponents';

const MEAL_TYPES = [
    { id: 'breakfast', label: 'Breakfast', icon: 'egg_alt', color: 'bg-amber-100 text-amber-700 border-amber-300' },
    { id: 'lunch', label: 'Lunch', icon: 'lunch_dining', color: 'bg-orange-100 text-orange-700 border-orange-300' },
    { id: 'dinner', label: 'Dinner', icon: 'dinner_dining', color: 'bg-purple-100 text-purple-700 border-purple-300' },
    { id: 'snack', label: 'Snack', icon: 'cookie', color: 'bg-pink-100 text-pink-700 border-pink-300' },
];

const CATEGORIES = [
    { id: 'All', color: 'bg-gray-800 text-white' },
    { id: 'Meal', color: 'bg-orange-500 text-white' },
    { id: 'Fruit', color: 'bg-green-500 text-white' },
    { id: 'Coffee', color: 'bg-amber-700 text-white' },
    { id: 'Snack', color: 'bg-pink-500 text-white' },
    { id: 'Custom', color: 'bg-purple-500 text-white' },
];

export default function Catalog() {
    const navigate = useNavigate();
    const { selectedDate, isToday, formatDate, getDateString, changeDate } = useDate();
    const [pageLoading, setPageLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [mostUsed, setMostUsed] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [selectedMealType, setSelectedMealType] = useState('lunch');
    const [toast, setToast] = useState(null);
    const [addingProduct, setAddingProduct] = useState(null);
    const [longPressItem, setLongPressItem] = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const [mostUsedRes, allRes] = await Promise.all([
                    getMostUsedProducts(6),
                    getProducts({ category: activeCategory === 'All' ? undefined : activeCategory })
                ]);
                setMostUsed(mostUsedRes.data || []);
                setAllProducts(allRes.data || []);
            } catch (err) {
                console.error('Error fetching products:', err);
            } finally {
                setPageLoading(false);
            }
        };
        fetchProducts();
    }, [activeCategory]);

    const quickAddProduct = async (product) => {
        setAddingProduct(product._id || product.id);
        try {
            await addFoodEntry({
                productId: product._id,
                name: product.name,
                calories: product.nutrition?.calories || 0,
                protein: product.nutrition?.protein || 0,
                carbs: product.nutrition?.carbs || 0,
                fat: product.nutrition?.fat || 0,
                portion: product.servingSize?.value || 1,
                unit: product.servingSize?.unit || 'g',
                mealType: selectedMealType,
                date: isToday() ? undefined : getDateString()
            });
            setToast({ message: `${product.name} added to ${selectedMealType}!`, type: 'success' });
        } catch (err) {
            console.error('Error adding product:', err);
            setToast({ message: 'Failed to add product', type: 'error' });
        } finally {
            setAddingProduct(null);
        }
    };

    const handleLongPress = (product, isMostUsed) => {
        setLongPressItem({ product, isMostUsed });
    };

    const toggleMostUsed = async (add) => {
        if (!longPressItem) return;
        try {
            await updateProduct(longPressItem.product._id, {
                usageCount: add ? 100 : 0
            });
            setToast({ message: add ? 'Added to Most Used!' : 'Removed from Most Used', type: 'success' });
            // Refresh
            const [mostUsedRes] = await Promise.all([getMostUsedProducts(6)]);
            setMostUsed(mostUsedRes.data || []);
        } catch (err) {
            setToast({ message: 'Failed to update', type: 'error' });
        }
        setLongPressItem(null);
    };

    const filteredProducts = allProducts.filter(p =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (pageLoading) {
        return <PageLoading message="Loading catalog..." />;
    }

    return (
        <div className="flex-1 overflow-y-auto pb-24 bg-[#f6f8f6] animate-fade-in">
            {/* Toast */}
            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}

            {/* Long Press Menu */}
            {longPressItem && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setLongPressItem(null)}>
                    <div className="bg-white rounded-2xl p-4 w-full max-w-xs animate-scale-in" onClick={e => e.stopPropagation()}>
                        <h3 className="font-bold text-lg mb-3">{longPressItem.product.name}</h3>
                        {longPressItem.isMostUsed ? (
                            <button
                                onClick={() => toggleMostUsed(false)}
                                className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-semibold flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined">remove_circle</span>
                                Remove from Most Used
                            </button>
                        ) : (
                            <button
                                onClick={() => toggleMostUsed(true)}
                                className="w-full py-3 bg-primary/10 text-primary rounded-xl font-semibold flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined">add_circle</span>
                                Add to Most Used
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="sticky top-0 z-20 bg-[#f6f8f6]/95 backdrop-blur-md px-4 py-2 border-b border-gray-200">
                <div className="flex items-center justify-between h-14">
                    <button onClick={() => navigate(-1)} className="flex items-center justify-center size-10 rounded-full hover:bg-black/5 transition-colors">
                        <span className="material-symbols-outlined text-slate-900">arrow_back</span>
                    </button>
                    <h1 className="text-lg font-bold tracking-tight flex-1 text-center text-slate-900">Product Catalog</h1>
                    <Link to="/catalog/new" className="text-primary font-semibold text-base px-2 hover:opacity-80 transition-opacity">
                        Add
                    </Link>
                </div>
            </header>

            {/* Date Selector */}
            <div className="px-4 py-3">
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

            {/* Scan Button - Single Green */}
            <div className="px-4 pb-3">
                <Link
                    to="/analyze"
                    className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary text-black rounded-xl font-bold hover:bg-[#0fd60f] transition-colors shadow-md shadow-primary/20"
                >
                    <span className="material-symbols-outlined">photo_camera</span>
                    Scan Food with AI
                </Link>
            </div>

            {/* Meal Type Selector - Vibrant Colors */}
            <div className="px-4 pb-3">
                <div className="flex gap-2">
                    {MEAL_TYPES.map((meal) => (
                        <button
                            key={meal.id}
                            onClick={() => setSelectedMealType(meal.id)}
                            className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl transition-all border-2 ${selectedMealType === meal.id
                                    ? meal.color
                                    : 'bg-white border-gray-100 hover:border-gray-200'
                                }`}
                        >
                            <span className={`material-symbols-outlined text-[20px] ${selectedMealType === meal.id ? '' : 'text-gray-400'
                                }`}>{meal.icon}</span>
                            <span className={`text-xs font-medium ${selectedMealType === meal.id ? 'font-semibold' : 'text-gray-500'
                                }`}>{meal.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Search Bar */}
            <div className="px-4 pb-2">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors">search</span>
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-4 py-3 bg-white border-none rounded-xl text-slate-900 placeholder-gray-400 focus:ring-2 focus:ring-primary/50 shadow-sm transition-all"
                        placeholder="Search food, drinks..."
                    />
                </div>
            </div>

            {/* Categories - Color Coded */}
            <div className="w-full overflow-x-auto no-scrollbar pb-2 px-4">
                <div className="flex gap-2">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => cat.id === 'Custom' ? navigate('/catalog/category/new') : setActiveCategory(cat.id)}
                            className={`flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-all active:scale-95 ${activeCategory === cat.id ? cat.color : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {cat.id}
                        </button>
                    ))}
                </div>
            </div>

            {/* Most Used Section - 3x2 Grid, 30% Smaller */}
            {mostUsed.length > 0 && (
                <div className="pt-4 pb-2 px-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold text-slate-900 tracking-tight">Most Used</h2>
                        <span className="text-xs text-gray-500">Long-press to manage</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {mostUsed.slice(0, 6).map((product) => (
                            <div
                                key={product._id || product.id}
                                className="group relative flex flex-col bg-white p-2 rounded-xl shadow-sm border border-gray-100 active:scale-[0.98] transition-all duration-200"
                                onContextMenu={(e) => { e.preventDefault(); handleLongPress(product, true); }}
                                onTouchStart={() => {
                                    const timer = setTimeout(() => handleLongPress(product, true), 500);
                                    const clear = () => clearTimeout(timer);
                                    document.addEventListener('touchend', clear, { once: true });
                                }}
                            >
                                <Link
                                    to={`/catalog/edit/${product._id || product.id}`}
                                    className="relative w-full aspect-square rounded-lg overflow-hidden mb-2 bg-gray-100 flex items-center justify-center"
                                >
                                    {product.imageUrl ? (
                                        <div
                                            className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                                            style={{ backgroundImage: `url(${product.imageUrl})` }}
                                        />
                                    ) : (
                                        <span className="text-2xl">{product.emoji || '🍽️'}</span>
                                    )}
                                </Link>
                                <button
                                    onClick={() => quickAddProduct(product)}
                                    disabled={addingProduct === (product._id || product.id)}
                                    className="absolute top-1 right-1 size-6 bg-primary rounded-full flex items-center justify-center text-black shadow-md hover:bg-[#0fd60f] transition-colors disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'wght' 600" }}>
                                        {addingProduct === (product._id || product.id) ? 'hourglass_empty' : 'add'}
                                    </span>
                                </button>
                                <div className="min-h-[36px]">
                                    <h3 className="font-semibold text-slate-900 leading-tight text-xs line-clamp-1">{product.name}</h3>
                                    <p className="text-[10px] text-gray-500 font-medium">
                                        {product.nutrition?.calories || 0} kcal
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* All Products List */}
            <div className="pt-4 pb-24 px-4">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-3">All Products</h2>
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <span className="material-symbols-outlined text-4xl mb-2">inventory_2</span>
                        <p>No products found</p>
                        <Link to="/catalog/new" className="text-primary font-medium mt-2 inline-block">
                            Add your first product
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {filteredProducts.map((product) => (
                            <div
                                key={product._id || product.id}
                                className="group flex items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm"
                                onContextMenu={(e) => { e.preventDefault(); handleLongPress(product, false); }}
                                onTouchStart={() => {
                                    const timer = setTimeout(() => handleLongPress(product, false), 500);
                                    const clear = () => clearTimeout(timer);
                                    document.addEventListener('touchend', clear, { once: true });
                                }}
                            >
                                <Link
                                    to={`/catalog/edit/${product._id || product.id}`}
                                    className="size-12 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden"
                                >
                                    {product.imageUrl ? (
                                        <div
                                            className="w-full h-full bg-cover bg-center"
                                            style={{ backgroundImage: `url(${product.imageUrl})` }}
                                        />
                                    ) : (
                                        <span className="text-2xl">{product.emoji || '🍽️'}</span>
                                    )}
                                </Link>
                                <Link
                                    to={`/catalog/edit/${product._id || product.id}`}
                                    className="flex-1 ml-3 mr-2"
                                >
                                    <div className="flex justify-between items-baseline">
                                        <h3 className="font-semibold text-slate-900">{product.name}</h3>
                                        <span className="text-xs font-bold text-primary">
                                            {product.nutrition?.calories || 0} kcal
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {product.servingSize?.value}{product.servingSize?.unit} · P:{product.nutrition?.protein || 0}g C:{product.nutrition?.carbs || 0}g F:{product.nutrition?.fat || 0}g
                                    </p>
                                </Link>
                                <button
                                    onClick={() => quickAddProduct(product)}
                                    disabled={addingProduct === (product._id || product.id)}
                                    className="size-10 bg-primary rounded-full flex items-center justify-center text-black hover:bg-[#0fd60f] transition-colors disabled:opacity-50 shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {addingProduct === (product._id || product.id) ? 'hourglass_empty' : 'add'}
                                    </span>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

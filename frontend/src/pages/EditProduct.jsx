import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { createProduct, getProduct, updateProduct, analyzeFood, analyzeText, updateEntry } from '../services/api';
import { Toast } from '../components/ui/UIComponents';

const CATEGORIES = ['Meal', 'Fruit', 'Coffee', 'Snack', 'Custom'];
const UNITS = ['g', 'ml', 'pc'];

export default function EditProduct() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const fileInputRef = useRef(null);
    const isNew = !id;

    // Check if we're editing a food entry from ActivityLog
    const editFoodEntry = location.state?.editFoodEntry;
    const isEditingEntry = !!editFoodEntry;

    // Check if we're editing a detected item from FoodAnalysis
    const editDetectedItem = location.state?.editDetectedItem;
    const isEditingDetectedItem = !!editDetectedItem;

    // Check if coming from analyze page - use both location.state and sessionStorage
    const [returnTo, setReturnTo] = useState(null);

    useEffect(() => {
        // First check location.state
        if (location.state?.returnTo) {
            setReturnTo(location.state.returnTo);
            // Also save to sessionStorage as backup
            sessionStorage.setItem('editProductReturnTo', location.state.returnTo);
        } else {
            // Check sessionStorage as fallback
            const savedReturnTo = sessionStorage.getItem('editProductReturnTo');
            if (savedReturnTo) {
                setReturnTo(savedReturnTo);
            }
        }
    }, [location.state]);

    const [loading, setLoading] = useState(false);
    const [autoFilling, setAutoFilling] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [toast, setToast] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [aiPrompt, setAiPrompt] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        emoji: '🍽️',
        category: 'Meal',
        servingValue: 100,
        servingUnit: 'g',
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
    });

    // Base values for portion scaling
    const [baseValues, setBaseValues] = useState({
        portion: 100,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
    });

    useEffect(() => {
        // If editing a food entry from ActivityLog
        if (editFoodEntry) {
            setFormData({
                name: editFoodEntry.data?.name || '',
                emoji: '🍽️',
                category: 'Meal',
                servingValue: editFoodEntry.data?.portion || 100,
                servingUnit: editFoodEntry.data?.unit || 'g',
                calories: editFoodEntry.data?.calories || 0,
                protein: editFoodEntry.data?.protein || 0,
                carbs: editFoodEntry.data?.carbs || 0,
                fat: editFoodEntry.data?.fat || 0,
                fiber: editFoodEntry.data?.fiber || 0,
            });
            // Set base values for portion scaling
            setBaseValues({
                portion: editFoodEntry.data?.portion || 100,
                calories: editFoodEntry.data?.calories || 0,
                protein: editFoodEntry.data?.protein || 0,
                carbs: editFoodEntry.data?.carbs || 0,
                fat: editFoodEntry.data?.fat || 0,
                fiber: editFoodEntry.data?.fiber || 0,
            });
            return;
        }

        // If editing a detected item from FoodAnalysis
        if (editDetectedItem) {
            setFormData({
                name: editDetectedItem.name || '',
                emoji: '🍽️',
                category: 'Meal',
                servingValue: editDetectedItem.portion || 100,
                servingUnit: editDetectedItem.unit || 'g',
                calories: editDetectedItem.calories || 0,
                protein: editDetectedItem.protein || 0,
                carbs: editDetectedItem.carbs || 0,
                fat: editDetectedItem.fat || 0,
                fiber: editDetectedItem.fiber || 0,
            });
            // Set base values for portion scaling
            setBaseValues({
                portion: editDetectedItem.basePortion || editDetectedItem.portion || 100,
                calories: editDetectedItem.baseCalories || editDetectedItem.calories || 0,
                protein: editDetectedItem.baseProtein || editDetectedItem.protein || 0,
                carbs: editDetectedItem.baseCarbs || editDetectedItem.carbs || 0,
                fat: editDetectedItem.baseFat || editDetectedItem.fat || 0,
                fiber: editDetectedItem.baseFiber || editDetectedItem.fiber || 0,
            });
            return;
        }

        // If editing an existing product
        if (id) {
            const fetchProduct = async () => {
                try {
                    const res = await getProduct(id);
                    const p = res.data;
                    setFormData({
                        name: p.name || '',
                        emoji: p.emoji || '🍽️',
                        category: p.category || 'Meal',
                        servingValue: p.servingSize?.value || 100,
                        servingUnit: p.servingSize?.unit || 'g',
                        calories: p.nutrition?.calories || 0,
                        protein: p.nutrition?.protein || 0,
                        carbs: p.nutrition?.carbs || 0,
                        fat: p.nutrition?.fat || 0,
                        fiber: p.nutrition?.fiber || 0,
                    });
                    if (p.imageUrl) {
                        setImagePreview(p.imageUrl);
                    }
                    // Set base values for portion scaling
                    setBaseValues({
                        portion: p.servingSize?.value || 100,
                        calories: p.nutrition?.calories || 0,
                        protein: p.nutrition?.protein || 0,
                        carbs: p.nutrition?.carbs || 0,
                        fat: p.nutrition?.fat || 0,
                        fiber: p.nutrition?.fiber || 0,
                    });
                } catch (err) {
                    console.error('Error loading product:', err);
                    setToast({ message: 'Failed to load product', type: 'error' });
                }
            };
            fetchProduct();
        }
    }, [id, editFoodEntry, editDetectedItem]);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    // Handle portion change with macro recalculation
    const handlePortionChange = (newPortion) => {
        if (baseValues.portion === 0) return;
        const ratio = newPortion / baseValues.portion;
        setFormData(prev => ({
            ...prev,
            servingValue: newPortion,
            calories: Math.round(baseValues.calories * ratio),
            protein: Math.round(baseValues.protein * ratio),
            carbs: Math.round(baseValues.carbs * ratio),
            fat: Math.round(baseValues.fat * ratio),
            fiber: Math.round(baseValues.fiber * ratio),
        }));
    };

    const handleAutoFill = async () => {
        if (!imageFile) {
            setToast({ message: 'Please upload an image first', type: 'error' });
            return;
        }

        setAutoFilling(true);
        try {
            const response = await analyzeFood(imageFile);
            if (response.data.success && response.data.items?.length > 0) {
                const item = response.data.items[0];
                setFormData(prev => ({
                    ...prev,
                    name: item.name || prev.name,
                    calories: item.calories || 0,
                    protein: item.protein || 0,
                    carbs: item.carbs || 0,
                    fat: item.fat || 0,
                    servingValue: item.portion || 100,
                    servingUnit: item.unit || 'g'
                }));
                setToast({ message: 'Auto-filled from AI analysis!', type: 'success' });
            } else {
                setToast({ message: 'Could not analyze image', type: 'error' });
            }
        } catch (err) {
            console.error('Auto-fill error:', err);
            setToast({ message: 'Auto-fill failed', type: 'error' });
        } finally {
            setAutoFilling(false);
        }
    };

    // AI Text Prompt Analysis
    const handleAIPrompt = async () => {
        if (!aiPrompt.trim()) {
            setToast({ message: 'Please enter a description', type: 'error' });
            return;
        }

        setAnalyzing(true);
        try {
            const response = await analyzeText(aiPrompt);
            if (response.data.success && response.data.product) {
                const product = response.data.product;
                setFormData({
                    name: product.name || '',
                    emoji: product.emoji || '🍽️',
                    category: product.category || 'Meal',
                    servingValue: product.portion || 100,
                    servingUnit: product.unit || 'g',
                    calories: product.calories || 0,
                    protein: product.protein || 0,
                    carbs: product.carbs || 0,
                    fat: product.fat || 0,
                });
                setToast({ message: 'Product details filled from AI!', type: 'success' });
            } else {
                setToast({ message: 'Could not analyze description', type: 'error' });
            }
        } catch (err) {
            console.error('AI prompt error:', err);
            setToast({ message: 'AI analysis failed', type: 'error' });
        } finally {
            setAnalyzing(false);
            setAiPrompt('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setToast({ message: 'Please enter a product name', type: 'error' });
            return;
        }

        setLoading(true);
        try {
            // If editing a food entry from ActivityLog
            if (isEditingEntry && editFoodEntry) {
                const entryDate = new Date(editFoodEntry.time).toISOString().split('T')[0];
                await updateEntry(editFoodEntry._id, {
                    name: formData.name,
                    calories: formData.calories,
                    protein: formData.protein,
                    carbs: formData.carbs,
                    fat: formData.fat,
                    fiber: formData.fiber,
                    portion: formData.servingValue,
                    unit: formData.servingUnit
                }, entryDate);
                setToast({ message: 'Entry updated!', type: 'success' });
                setTimeout(() => navigate('/log'), 1000);
                return;
            }

            const productData = {
                name: formData.name,
                emoji: formData.emoji,
                category: formData.category,
                servingSize: {
                    value: formData.servingValue,
                    unit: formData.servingUnit
                },
                nutrition: {
                    calories: formData.calories,
                    protein: formData.protein,
                    carbs: formData.carbs,
                    fat: formData.fat,
                    fiber: formData.fiber
                }
            };

            // Convert imageFile to base64 and add to productData
            if (imageFile) {
                const reader = new FileReader();
                const base64Promise = new Promise((resolve) => {
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(imageFile);
                });
                productData.imageUrl = await base64Promise;
            } else if (imagePreview && !imagePreview.startsWith('blob:')) {
                // Keep existing image if it's a server URL
                productData.imageUrl = imagePreview;
            }

            if (isNew) {
                // If editing a detected item, replace it instead of creating product
                if (isEditingDetectedItem && returnTo === '/analyze') {
                    const existingState = sessionStorage.getItem('foodAnalysisState');
                    if (existingState) {
                        try {
                            const parsed = JSON.parse(existingState);
                            const editingItemId = parsed.editingItemId;
                            // Update the existing item in the list
                            const updatedItem = {
                                id: editDetectedItem.id, // Keep original ID
                                name: formData.name,
                                calories: formData.calories,
                                protein: formData.protein,
                                carbs: formData.carbs,
                                fat: formData.fat,
                                fiber: formData.fiber,
                                portion: formData.servingValue,
                                basePortion: formData.servingValue,
                                baseCalories: formData.calories,
                                baseProtein: formData.protein,
                                baseCarbs: formData.carbs,
                                baseFat: formData.fat,
                                baseFiber: formData.fiber,
                                unit: formData.servingUnit
                            };
                            // Replace the item with matching ID
                            parsed.result.items = parsed.result.items.map(item =>
                                item.id === editDetectedItem.id ? updatedItem : item
                            );
                            delete parsed.editingItemId; // Clean up
                            sessionStorage.setItem('foodAnalysisState', JSON.stringify(parsed));
                            setToast({ message: 'Item updated!', type: 'success' });
                        } catch (e) {
                            console.error('Error updating state:', e);
                        }
                    }
                    sessionStorage.removeItem('editProductReturnTo');
                    setTimeout(() => navigate('/analyze'), 1000);
                    return;
                }

                await createProduct(productData);
                setToast({ message: 'Product created!', type: 'success' });

                // If coming from analyze page (adding new item), add product to detected items
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
                                portion: formData.servingValue,
                                basePortion: formData.servingValue,
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
                    // Clear the returnTo from sessionStorage
                    sessionStorage.removeItem('editProductReturnTo');
                    setTimeout(() => navigate('/analyze'), 1000);
                    return;
                }
            } else {
                await updateProduct(id, productData);
                setToast({ message: 'Product updated!', type: 'success' });
            }
            setTimeout(() => navigate('/catalog'), 1000);
        } catch (err) {
            console.error('Save error:', err);
            setToast({ message: 'Failed to save', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

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
            <header className="flex items-center justify-between p-4 sticky top-0 z-10 bg-[#f6f8f6]/95 backdrop-blur-md border-b border-gray-100">
                <button onClick={() => {
                    sessionStorage.removeItem('editProductReturnTo');
                    navigate(returnTo || -1);
                }} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/5 transition-colors">
                    <span className="material-symbols-outlined text-2xl text-gray-900">arrow_back</span>
                </button>
                <h1 className="text-lg font-bold tracking-tight">{isNew ? 'New Product' : 'Edit Product'}</h1>
                <button onClick={handleSubmit} disabled={loading} className="text-primary font-bold text-base hover:opacity-80 transition-opacity disabled:opacity-50">
                    {loading ? '...' : 'Save'}
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto px-4 pb-24">
                {/* AI Prompt Section (New) */}
                {isNew && (
                    <div className="my-4 p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-primary">auto_awesome</span>
                            <h3 className="font-bold text-gray-800">Quick Add with AI</h3>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder='e.g., "1 large banana" or "cup of black coffee"'
                                className="flex-1 bg-white border border-gray-200 rounded-xl px-4 h-12 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                            />
                            <button
                                onClick={handleAIPrompt}
                                disabled={analyzing || !aiPrompt.trim()}
                                className="px-4 h-12 bg-primary hover:bg-[#0fd60f] text-black font-bold rounded-xl disabled:opacity-50 transition-colors flex items-center gap-1"
                            >
                                {analyzing ? (
                                    <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                                ) : (
                                    <span className="material-symbols-outlined text-lg">send</span>
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            AI will auto-fill name, category, portion, and macros
                        </p>
                    </div>
                )}

                {/* Product Photo */}
                <div className="flex flex-col items-center py-6">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="relative group cursor-pointer"
                    >
                        <div className="w-32 h-32 rounded-2xl bg-gray-100 shadow-lg border-4 border-white flex items-center justify-center overflow-hidden">
                            {imagePreview ? (
                                <img src={imagePreview} alt="Product" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-5xl">{formData.emoji}</span>
                            )}
                        </div>
                        <button className="absolute -bottom-2 -right-2 bg-primary text-black p-2 rounded-full shadow-md flex items-center justify-center hover:scale-105 transition-transform">
                            <span className="material-symbols-outlined text-xl">photo_camera</span>
                        </button>
                    </div>
                    <p className="mt-3 text-sm font-medium text-gray-500">Tap to {imagePreview ? 'change' : 'add'} photo</p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                    />
                </div>

                {/* Form */}
                <div className="space-y-6">
                    {/* Product Name */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700 ml-1">Product Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 h-14 text-base focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-gray-400"
                            placeholder="e.g., Banana Smoothie"
                        />
                    </div>

                    {/* Category */}
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700 ml-1">Category</label>
                        <div className="relative">
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 h-14 text-base focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                <span className="material-symbols-outlined">expand_more</span>
                            </span>
                        </div>
                    </div>

                    {/* Portion */}
                    <div className="flex gap-3">
                        <div className="flex-1 flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700 ml-1">Portion</label>
                            <input
                                type="number"
                                value={formData.servingValue}
                                onChange={(e) => handlePortionChange(parseInt(e.target.value) || 0)}
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 h-12 text-base focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                            />
                        </div>
                        <div className="w-24 flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700 ml-1">Unit</label>
                            <select
                                value={formData.servingUnit}
                                onChange={(e) => setFormData({ ...formData, servingUnit: e.target.value })}
                                className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 h-12 text-base focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                            >
                                {UNITS.map(unit => (
                                    <option key={unit} value={unit}>{unit}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Macros Grid */}
                    <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">
                                Macros <span className="text-sm font-normal text-gray-500 ml-1">(per serving)</span>
                            </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { key: 'calories', label: 'Calories', icon: 'local_fire_department', color: 'text-orange-500', unit: 'kcal' },
                                { key: 'protein', label: 'Protein', icon: 'fitness_center', color: 'text-blue-500', unit: 'g' },
                                { key: 'carbs', label: 'Carbs', icon: 'bakery_dining', color: 'text-amber-500', unit: 'g' },
                                { key: 'fat', label: 'Fat', icon: 'water_drop', color: 'text-yellow-500', unit: 'g' },
                            ].map((field) => (
                                <div key={field.key} className="p-3 rounded-xl bg-white border border-gray-200 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span className={`material-symbols-outlined ${field.color} text-lg`}>{field.icon}</span>
                                        <label className="text-xs font-semibold text-gray-500">{field.label}</label>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <input
                                            type="number"
                                            value={formData[field.key]}
                                            onChange={(e) => setFormData({ ...formData, [field.key]: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-transparent border-none p-0 text-2xl font-bold text-gray-900 focus:ring-0"
                                        />
                                        <span className="text-xs text-gray-400 font-medium">{field.unit}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer Action */}
            <div className="sticky bottom-0 left-0 right-0 p-4 bg-[#f6f8f6] border-t border-gray-100">
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-primary hover:bg-[#0fd60f] active:scale-[0.98] text-black font-bold text-lg h-14 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                    <span>{loading ? 'Saving...' : 'Save Product'}</span>
                    <span className="material-symbols-outlined text-xl">check</span>
                </button>
            </div>
        </div>
    );
}

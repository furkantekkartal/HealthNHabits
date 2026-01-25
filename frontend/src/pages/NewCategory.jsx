import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toast } from '../components/ui/UIComponents';

export default function NewCategory() {
    const navigate = useNavigate();
    const [categoryName, setCategoryName] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);

    const handleSave = async () => {
        if (!categoryName.trim()) {
            setToast({ message: 'Please enter a category name', type: 'error' });
            return;
        }

        setLoading(true);
        try {
            // For now, custom categories are stored in local storage
            // In a full implementation, this would be stored in the database
            const existingCategories = JSON.parse(localStorage.getItem('customCategories') || '[]');
            if (existingCategories.includes(categoryName.trim())) {
                setToast({ message: 'Category already exists', type: 'error' });
                setLoading(false);
                return;
            }
            existingCategories.push(categoryName.trim());
            localStorage.setItem('customCategories', JSON.stringify(existingCategories));

            setToast({ message: 'Category created!', type: 'success' });
            setTimeout(() => navigate('/catalog'), 1000);
        } catch (err) {
            console.error('Error creating category:', err);
            setToast({ message: 'Failed to create category', type: 'error' });
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
                <button onClick={() => navigate(-1)} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-black/5 transition-colors">
                    <span className="material-symbols-outlined text-2xl text-gray-900">close</span>
                </button>
                <h1 className="text-lg font-bold tracking-tight">New Category</h1>
                <button
                    onClick={handleSave}
                    disabled={loading || !categoryName.trim()}
                    className="text-primary font-bold text-base hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                    {loading ? '...' : 'Save'}
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6">
                <div className="space-y-6">
                    {/* Icon Preview */}
                    <div className="flex flex-col items-center py-6">
                        <div className="w-20 h-20 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-4xl">category</span>
                        </div>
                    </div>

                    {/* Category Name Input */}
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-gray-700 ml-1">Category Name</label>
                        <input
                            type="text"
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 h-14 text-base focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-gray-400"
                            placeholder="e.g., Breakfast, Drinks, Desserts..."
                            autoFocus
                        />
                        <p className="text-xs text-gray-500 ml-1">
                            This category will appear in the catalog filter and product creation form.
                        </p>
                    </div>

                    {/* Info */}
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-3">
                        <span className="material-symbols-outlined text-primary">info</span>
                        <div>
                            <p className="text-sm font-medium text-gray-800">Custom Categories</p>
                            <p className="text-xs text-gray-600 mt-1">
                                Create custom categories to organize your products. They will be available alongside the default categories.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer Action */}
            <div className="p-4 bg-[#f6f8f6] border-t border-gray-100">
                <button
                    onClick={handleSave}
                    disabled={loading || !categoryName.trim()}
                    className="w-full bg-primary hover:bg-[#0fd60f] active:scale-[0.98] text-black font-bold text-lg h-14 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                    <span className="material-symbols-outlined text-xl">add</span>
                    <span>{loading ? 'Creating...' : 'Create Category'}</span>
                </button>
            </div>
        </div>
    );
}

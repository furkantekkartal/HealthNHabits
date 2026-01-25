import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile, getTodayLog, addWeightEntry } from '../services/api';
import { PageLoading, Toast } from '../components/ui/UIComponents';
import { useAuth } from '../context/AuthContext';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

export default function Profile() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [todayWeight, setTodayWeight] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        profileImage: null,
        gender: 'male',
        birthYear: '',
        height: { value: '', unit: 'cm' },
        weight: { value: '', unit: 'kg' },
        activityLevel: 'lightly_active',
        dailyCalorieGoal: 2000,
        dailyWaterGoal: 2000,
        dailyStepsGoal: 10000,
    });

    // Image cropping state
    const [showCropModal, setShowCropModal] = useState(false);
    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({ unit: '%', width: 90, aspect: 1 });
    const [completedCrop, setCompletedCrop] = useState(null);
    const imgRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileRes, todayRes] = await Promise.all([
                    getProfile(),
                    getTodayLog()
                ]);
                const profile = profileRes.data;

                // Get today's weight from log if available
                const todayLog = todayRes.data;
                const weightEntry = todayLog?.entries?.find(e => e.type === 'weight');
                const currentTodayWeight = weightEntry?.data?.weight || todayLog?.summary?.weight || null;
                setTodayWeight(currentTodayWeight);

                setFormData({
                    name: profile.name || '',
                    profileImage: profile.profileImage || null,
                    gender: profile.gender || 'male',
                    birthYear: profile.birthYear || '',
                    height: profile.height || { value: '', unit: 'cm' },
                    weight: {
                        value: currentTodayWeight || profile.weight?.value || '',
                        unit: profile.weight?.unit || 'kg'
                    },
                    activityLevel: profile.activityLevel || 'lightly_active',
                    dailyCalorieGoal: profile.dailyCalorieGoal || 2000,
                    dailyWaterGoal: profile.dailyWaterGoal || 2000,
                    dailyStepsGoal: profile.dailyStepsGoal || 10000,
                });
            } catch (err) {
                console.error('Error fetching profile:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Handle image selection - opens crop modal
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                setToast({ message: 'Image size must be less than 10MB', type: 'error' });
                return;
            }
            if (!file.type.startsWith('image/')) {
                setToast({ message: 'Please select an image file', type: 'error' });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageSrc(reader.result);
                setShowCropModal(true);
            };
            reader.readAsDataURL(file);
        }
    };

    // Initialize crop when image loads
    const onImageLoaded = (image) => {
        if (!image) return;
        imgRef.current = image;
        const displayedWidth = image.width;
        const displayedHeight = image.height;
        const minDimension = Math.min(displayedWidth, displayedHeight);
        const cropSize = minDimension * 0.9;
        const x = (displayedWidth - cropSize) / 2;
        const y = (displayedHeight - cropSize) / 2;
        setCrop({
            unit: 'px',
            x,
            y,
            width: cropSize,
            height: cropSize,
            aspect: 1
        });
    };

    // Create cropped image at 128x128
    const getCroppedImg = async (image, crop) => {
        if (!image || !crop.width || !crop.height) return null;
        const canvas = document.createElement('canvas');
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(
            image,
            crop.x * scaleX,
            crop.y * scaleY,
            crop.width * scaleX,
            crop.height * scaleY,
            0,
            0,
            128,
            128
        );
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                if (!blob) { resolve(null); return; }
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            }, 'image/jpeg', 0.9);
        });
    };

    // Confirm crop and close modal
    const handleCropConfirm = async () => {
        if (!imgRef.current || !completedCrop) return;
        const croppedImage = await getCroppedImg(imgRef.current, completedCrop);
        if (croppedImage) {
            setFormData({ ...formData, profileImage: croppedImage });
            setShowCropModal(false);
            setImageSrc(null);
        }
    };

    // Cancel crop
    const handleCropCancel = () => {
        setShowCropModal(false);
        setImageSrc(null);
        setCrop({ unit: '%', width: 90, aspect: 1 });
        setCompletedCrop(null);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Save profile first
            await updateProfile(formData);

            // If weight was changed, also log it for today
            if (formData.weight.value && formData.weight.value !== todayWeight) {
                await addWeightEntry(formData.weight.value, formData.weight.unit || 'kg');
            }

            setToast({ message: 'Profile saved!', type: 'success' });
            setTimeout(() => navigate('/'), 1000);
        } catch (err) {
            console.error('Error saving profile:', err);
            setToast({ message: 'Error saving profile', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    // Updated activity levels with correct multipliers
    const activityLevels = [
        { value: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise, desk job', icon: 'chair', multiplier: 1.2 },
        { value: 'lightly_active', label: 'Lightly Active', desc: 'Light exercise 1-3 days/week', icon: 'directions_walk', multiplier: 1.35 },
        { value: 'active', label: 'Active', desc: 'Moderate exercise 3-5 days/week', icon: 'fitness_center', multiplier: 1.5 },
        { value: 'very_active', label: 'Very Active', desc: 'Hard exercise 6-7 days/week', icon: 'bolt', multiplier: 1.7 },
    ];

    // Calculate BMR preview
    const calculateBMR = () => {
        const weight = formData.weight.value || 70;
        const height = formData.height.value || 170;
        const age = formData.birthYear ? new Date().getFullYear() - formData.birthYear : 30;
        const isMale = formData.gender === 'male';
        return Math.round(isMale
            ? 10 * weight + 6.25 * height - 5 * age + 5
            : 10 * weight + 6.25 * height - 5 * age - 161);
    };

    const baseBmr = calculateBMR();
    const currentLevel = activityLevels.find(l => l.value === formData.activityLevel);
    const tdee = Math.round(baseBmr * (currentLevel?.multiplier || 1.35));

    if (loading) {
        return <PageLoading message="Loading your profile..." />;
    }

    return (
        <div className="flex flex-col min-h-full animate-fade-in bg-[#f6f8f6]">
            {/* Toast */}
            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}

            {/* Crop Modal */}
            {showCropModal && imageSrc && (
                <div
                    className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4"
                    onClick={handleCropCancel}
                >
                    <div
                        className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Crop Your Photo</h3>
                        <div className="flex justify-center mb-4">
                            <ReactCrop
                                crop={crop}
                                onChange={(c) => setCrop(c)}
                                onComplete={(c) => setCompletedCrop(c)}
                                aspect={1}
                                minWidth={50}
                                circularCrop
                            >
                                <img
                                    ref={imgRef}
                                    src={imageSrc}
                                    alt="Crop"
                                    onLoad={(e) => e.target && onImageLoaded(e.target)}
                                    style={{ maxWidth: '100%', maxHeight: '400px', display: 'block' }}
                                />
                            </ReactCrop>
                        </div>
                        <p className="text-xs text-gray-500 text-center mb-4">Drag to adjust the crop area</p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={handleCropCancel}
                                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCropConfirm}
                                className="px-5 py-2.5 rounded-xl bg-primary text-black font-bold hover:bg-[#0fd60f] transition-all"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#f6f8f6]/95 backdrop-blur-sm border-b border-gray-100">
                <div className="flex items-center p-4 h-16">
                    <button onClick={() => navigate(-1)} className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-black/5 active:scale-95 transition-all">
                        <span className="material-symbols-outlined text-[24px]">arrow_back</span>
                    </button>
                    <h1 className="text-lg font-bold leading-tight flex-1 text-center pr-8">Profile Settings</h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full max-w-md mx-auto p-4 flex flex-col gap-6 pb-24">
                {/* Profile Picture & Name */}
                <div className="flex flex-col items-center gap-4">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="relative cursor-pointer group"
                    >
                        <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-primary flex items-center justify-center overflow-hidden">
                            {formData.profileImage ? (
                                <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="material-symbols-outlined text-5xl text-gray-400">person</span>
                            )}
                        </div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-black text-[16px]">camera_alt</span>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                        />
                    </div>
                    <p className="text-xs text-gray-500">Tap to change photo</p>
                </div>

                {/* Name Field */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold">Name</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter your name"
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-gray-400"
                    />
                </div>

                {/* Gender Selector */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold">Gender</label>
                    <div className="flex p-1 bg-gray-100 rounded-xl">
                        {['male', 'female', 'other'].map((gender) => (
                            <label key={gender} className="flex-1 relative cursor-pointer">
                                <input
                                    type="radio"
                                    name="gender"
                                    value={gender}
                                    checked={formData.gender === gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    className="peer sr-only"
                                />
                                <div className={`py-2.5 px-3 rounded-lg text-center text-sm font-medium transition-all duration-200 ${formData.gender === gender
                                    ? 'bg-[#13ec13] shadow-sm text-black'
                                    : 'text-gray-500 hover:text-gray-900'
                                    }`}>
                                    {gender.charAt(0).toUpperCase() + gender.slice(1)}
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Birth Year */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold">Birth Year</label>
                    <input
                        type="number"
                        value={formData.birthYear}
                        onChange={(e) => setFormData({ ...formData, birthYear: parseInt(e.target.value) || '' })}
                        placeholder="YYYY"
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-base outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-gray-400"
                    />
                </div>

                {/* Height & Weight */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Height</label>
                        <div className="relative flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary transition-all">
                            <input
                                type="number"
                                value={formData.height.value}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    height: { ...formData.height, value: parseFloat(e.target.value) || '' }
                                })}
                                placeholder="175"
                                className="w-full bg-transparent border-none p-3.5 text-base outline-none placeholder:text-gray-400"
                            />
                            <span className="pr-3 text-gray-400 text-sm">{formData.height.unit}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold">Weight</label>
                        <div className="relative flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary transition-all">
                            <input
                                type="number"
                                value={formData.weight.value}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    weight: { ...formData.weight, value: parseFloat(e.target.value) || '' }
                                })}
                                placeholder="70"
                                className="w-full bg-transparent border-none p-3.5 text-base outline-none placeholder:text-gray-400"
                            />
                            <span className="pr-3 text-gray-400 text-sm">{formData.weight.unit}</span>
                        </div>
                    </div>
                </div>

                {/* Activity Level */}
                <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold">Activity Level</label>
                        <span className="text-xs text-gray-500">BMR × Multiplier = TDEE</span>
                    </div>
                    <div className="flex flex-col gap-3">
                        {activityLevels.map((level) => (
                            <label key={level.value} className="relative group cursor-pointer">
                                <input
                                    type="radio"
                                    name="activity"
                                    value={level.value}
                                    checked={formData.activityLevel === level.value}
                                    onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value })}
                                    className="peer sr-only"
                                />
                                <div className={`flex items-center p-4 bg-white border-2 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md ${formData.activityLevel === level.value
                                    ? 'border-primary/50 bg-primary/5'
                                    : 'border-transparent'
                                    }`}>
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 mr-4 transition-colors ${formData.activityLevel === level.value
                                        ? 'bg-[#13ec13]/20'
                                        : 'bg-gray-50'
                                        }`}>
                                        <span className="material-symbols-outlined text-[#13ec13]">{level.icon}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-sm">{level.label}</h3>
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">×{level.multiplier}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5">{level.desc}</p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.activityLevel === level.value
                                        ? 'border-primary bg-primary'
                                        : 'border-gray-300'
                                        }`}>
                                        {formData.activityLevel === level.value && (
                                            <div className="w-2 h-2 rounded-full bg-black"></div>
                                        )}
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* TDEE Preview Card */}
                <div className="bg-gradient-to-r from-primary/10 to-emerald-50 rounded-xl p-4 border border-primary/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined">calculate</span>
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-600 font-medium">Your Daily Energy (TDEE)</p>
                            <p className="text-xl font-bold text-gray-900">{tdee.toLocaleString()} <span className="text-sm font-normal text-gray-500">kcal/day</span></p>
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2">
                        Base BMR: {baseBmr} kcal × {currentLevel?.multiplier || 1.35} ({currentLevel?.label})
                    </p>
                </div>

                {/* Logout Button */}
                <div className="mt-6">
                    <button
                        onClick={() => {
                            logout();
                            navigate('/login');
                        }}
                        className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3.5 rounded-xl border border-red-200 transition-all flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-xl">logout</span>
                        Logout
                    </button>
                </div>
            </main>

            {/* Footer Action */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#f6f8f6]/80 backdrop-blur-md border-t border-gray-100 z-40">
                <div className="max-w-md mx-auto">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full bg-[#13ec13] hover:bg-[#0fd60f] active:scale-[0.98] text-black font-bold py-4 rounded-xl shadow-lg shadow-[#13ec13]/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <span>{saving ? 'Saving...' : 'Save Profile'}</span>
                        <span className="material-symbols-outlined text-[20px]">check</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

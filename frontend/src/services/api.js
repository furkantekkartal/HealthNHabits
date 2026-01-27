import axios from 'axios';

// Dynamically determine the API URL based on how the frontend is accessed
function getApiBaseUrl() {
    // If VITE_API_URL is set (from Cloudflare backend tunnel), use it
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    // If accessing via Cloudflare frontend, try to get backend URL from localStorage
    if (window.location.hostname.includes('.trycloudflare.com')) {
        const storedBackendUrl = localStorage.getItem('cloudflare_backend_url');
        if (storedBackendUrl) {
            return storedBackendUrl + '/api';
        }
        console.warn('⚠️ Cloudflare detected but no backend URL configured.');
    }

    // Use the same hostname as the frontend (works for both localhost and network access)
    const hostname = window.location.hostname; // e.g., "localhost" or "192.168.1.106"
    const port = window.location.port;

    // Backend always runs on port 5000 after PostgreSQL migration
    const backendPort = '5000';

    return `http://${hostname}:${backendPort}/api`;
}

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Dashboard
export const getDashboard = () => api.get('/dashboard');
export const getWeeklySummary = () => api.get('/dashboard/weekly');

// Profile
export const getProfile = () => api.get('/profile');
export const updateProfile = (data) => api.put('/profile', data);
export const getProfileCalculations = () => api.get('/profile/calculations');

// Products
export const getProducts = (params) => api.get('/products', { params });
export const getMostUsedProducts = (limit = 10) => api.get('/products/most-used', { params: { limit } });
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post('/products', data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);
export const reorderProducts = (productIds) => api.post('/products/reorder', { productIds });

// Daily Logs
export const getTodayLog = () => api.get('/logs/today');
export const getLogByDate = (date) => api.get(`/logs/date/${date}`);
export const addFoodEntry = (data) => api.post('/logs/food', data);
export const addWaterEntry = (amount, date) => api.post('/logs/water', { amount, date });
export const removeWaterEntry = (amount, date) => api.post('/logs/water/remove', { amount, date });
export const addStepsEntry = (steps, date) => api.post('/logs/steps', { steps, date });
export const addWeightEntry = (weight, weightUnit, date) => api.post('/logs/weight', { weight, weightUnit, date });
export const getWeightHistory = (days = 7) => api.get('/logs/weight/history', { params: { days } });
export const deleteEntry = (entryId, date) => api.delete(`/logs/entry/${entryId}`, { params: { date } });
export const updateEntry = (entryId, data, date) => api.put(`/logs/entry/${entryId}`, { data, date });

// AI Analysis
export const analyzeFood = (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    return api.post('/ai/analyze-food', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

// AI Text Analysis (prompt to product)
export const analyzeText = (description) => api.post('/ai/analyze-text', { description });

export default api;

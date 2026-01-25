import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DateProvider } from './context/DateContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Catalog from './pages/Catalog';
import EditProduct from './pages/EditProduct';
import NewCategory from './pages/NewCategory';
import FoodAnalysis from './pages/FoodAnalysis';
import Hydration from './pages/Hydration';
import Steps from './pages/Steps';
import Weight from './pages/Weight';
import Profile from './pages/Profile';
import ActivityLog from './pages/ActivityLog';
import EnergyInsights from './pages/EnergyInsights';
import Login from './pages/Login';
import Register from './pages/Register';
import { PageLoading } from './components/ui/UIComponents';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <PageLoading message="Loading..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public route wrapper (redirects to home if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <PageLoading message="Loading..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="catalog/new" element={<EditProduct />} />
        <Route path="catalog/edit/:id" element={<EditProduct />} />
        <Route path="catalog/category/new" element={<NewCategory />} />
        <Route path="analyze" element={<FoodAnalysis />} />
        <Route path="water" element={<Hydration />} />
        <Route path="steps" element={<Steps />} />
        <Route path="weight" element={<Weight />} />
        <Route path="profile" element={<Profile />} />
        <Route path="log" element={<ActivityLog />} />
        <Route path="energy" element={<EnergyInsights />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <DateProvider>
        <Router>
          <AppRoutes />
        </Router>
      </DateProvider>
    </AuthProvider>
  );
}

export default App;

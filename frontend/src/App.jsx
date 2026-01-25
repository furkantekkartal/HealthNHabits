import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DateProvider } from './context/DateContext';
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

function App() {
  return (
    <DateProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
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
      </Router>
    </DateProvider>
  );
}

export default App;

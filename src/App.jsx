import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Ticker from './components/Ticker';
import ProtectedRoute from './components/ProtectedRoute';
import InstallAppBanner from './components/InstallAppBanner';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import FarmerDashboard from './pages/FarmerDashboard';
import BuyerDashboard from './pages/BuyerDashboard';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <InstallAppBanner />
      <Ticker />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/farmer"
            element={
              <ProtectedRoute role="farmer">
                <FarmerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer"
            element={
              <ProtectedRoute role="buyer">
                <BuyerDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <footer className="border-t border-line py-6 text-center text-xs text-ink-soft">
        BHOOMI — built for Smart India Hackathon 2026 · Problem statement 26033
      </footer>
    </div>
  );
}

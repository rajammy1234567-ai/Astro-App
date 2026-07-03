import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Astrologers from './pages/Astrologers';
import AstrologerApplications from './pages/AstrologerApplications';
import Products from './pages/Products';
import Orders from './pages/Orders';
import Transactions from './pages/Transactions';
import Blogs from './pages/Blogs';
import News from './pages/News';
import Poojas from './pages/Poojas';
import GiftCards from './pages/GiftCards';
import Testimonials from './pages/Testimonials';
import SupportFaqs from './pages/SupportFaqs';
import FreeServices from './pages/FreeServices';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="login-page"><div className="table-loading">Loading...</div></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="astrologers" element={<Astrologers />} />
        <Route path="astrologer-applications" element={<AstrologerApplications />} />
        <Route path="products" element={<Products />} />
        <Route path="orders" element={<Orders />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="blogs" element={<Blogs />} />
        <Route path="news" element={<News />} />
        <Route path="poojas" element={<Poojas />} />
        <Route path="gift-cards" element={<GiftCards />} />
        <Route path="testimonials" element={<Testimonials />} />
        <Route path="support-faqs" element={<SupportFaqs />} />
        <Route path="free-services" element={<FreeServices />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ToastProvider>
  );
}
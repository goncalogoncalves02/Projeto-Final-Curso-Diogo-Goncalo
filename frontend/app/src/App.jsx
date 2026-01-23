import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SocialCallback from "./pages/SocialCallback";
import AdminUsers from "./pages/admin/Users";
import AdminCourses from "./pages/admin/Courses";
import AdminModules from "./pages/admin/Modules";
import AdminClassrooms from "./pages/admin/Classrooms";
import Profile from "./pages/Profile";
import Layout from "./components/Layout";
import { Link } from "react-router-dom";
import "./App.css";

// Componente para rotas protegidas
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div>A carregar...</div>;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 max-w-2xl">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600">
          Olá, {user?.full_name?.split(" ")[0] || user?.email}! 👋
        </h1>
        <p className="mt-4 text-xl text-gray-500">
          Bem-vindo ao painel de gestão da <strong>ATEC</strong>.
        </p>
        <div className="mt-8 p-4 bg-blue-50 rounded-lg text-blue-800 text-sm">
          <p>
            Usa a <strong>Barra Lateral</strong> à esquerda para navegar.
          </p>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/social-callback" element={<SocialCallback />} />

          {/* Rotas Protegidas com Sidebar (Layout) */}
          <Route
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/courses" element={<AdminCourses />} />
            <Route path="/admin/modules" element={<AdminModules />} />
            <Route path="/admin/classrooms" element={<AdminClassrooms />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

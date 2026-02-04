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
import AdminAvailability from "./pages/admin/AdminAvailability";
import AdminEnrollments from "./pages/admin/Enrollments";
import AdminModuleGrades from "./pages/admin/ModuleGrades";
import AdminSchedule from "./pages/admin/Schedule";
import AdminSearch from "./pages/admin/Search";
import Dashboard from "./pages/admin/Dashboard";
import Availability from "./pages/Availability";
import ScheduleView from "./pages/ScheduleView";
import Profile from "./pages/Profile";
import Layout from "./components/Layout";
import ChatBot from "./components/ChatBot";
import "./App.css";

// Componente para rotas protegidas
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div>A carregar...</div>;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Componente interno para mostrar ChatBot apenas quando autenticado
const ChatBotWrapper = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <ChatBot /> : null;
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
            <Route path="/admin/availability" element={<AdminAvailability />} />
            <Route path="/admin/enrollments" element={<AdminEnrollments />} />
            <Route
              path="/admin/module-grades"
              element={<AdminModuleGrades />}
            />
            <Route path="/admin/schedule" element={<AdminSchedule />} />
            <Route path="/admin/search" element={<AdminSearch />} />
            <Route path="/availability" element={<Availability />} />
            <Route path="/schedule" element={<ScheduleView />} />
          </Route>
        </Routes>
        <ChatBotWrapper />
      </Router>
    </AuthProvider>
  );
}

export default App;

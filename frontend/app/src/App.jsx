import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Routes
import PrivateRoute from "./routes/PrivateRoute";
import RoleRoute from "./routes/RoleRoute";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyEmail from "./pages/auth/VerifyEmail";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import SocialCallback from "./pages/auth/SocialCallback";

// Admin Pages
import AdminUsers from "./pages/admin/Users";
import AdminCourses from "./pages/admin/Courses";
import AdminModules from "./pages/admin/Modules";
import AdminClassrooms from "./pages/admin/Classrooms";
import AdminAvailability from "./pages/admin/Availability";
import AdminEnrollments from "./pages/admin/Enrollments";
import AdminModuleGrades from "./pages/admin/ModuleGrades";
import AdminSchedule from "./pages/admin/Schedule";

// Professor Pages
import ProfessorAvailability from "./pages/professor/Availability";

// Shared Pages
import Dashboard from "./pages/shared/Dashboard";
import Profile from "./pages/shared/Profile";
import ScheduleView from "./pages/shared/ScheduleView";

// Layout & Components
import Layout from "./components/layout/Layout";
import ChatBot from "./components/ChatBot";
import "./App.css";

// Componente interno para mostrar ChatBot apenas quando autenticado
import { useAuth } from "./context/AuthContext";
const ChatBotWrapper = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <ChatBot /> : null;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rotas Públicas (Autenticação) */}
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
            {/* Acessível a todos os autenticados */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/schedule" element={<ScheduleView />} />

            {/* Apenas Admin/Secretaria */}
            <Route path="/admin/users" element={
              <RoleRoute roles={["admin", "secretaria"]}>
                <AdminUsers />
              </RoleRoute>
            } />
            <Route path="/admin/courses" element={
              <RoleRoute roles={["admin", "secretaria"]}>
                <AdminCourses />
              </RoleRoute>
            } />
            <Route path="/admin/modules" element={
              <RoleRoute roles={["admin", "secretaria"]}>
                <AdminModules />
              </RoleRoute>
            } />
            <Route path="/admin/classrooms" element={
              <RoleRoute roles={["admin", "secretaria"]}>
                <AdminClassrooms />
              </RoleRoute>
            } />
            <Route path="/admin/availability" element={
              <RoleRoute roles={["admin", "secretaria"]}>
                <AdminAvailability />
              </RoleRoute>
            } />
            <Route path="/admin/enrollments" element={
              <RoleRoute roles={["admin", "secretaria"]}>
                <AdminEnrollments />
              </RoleRoute>
            } />
            <Route path="/admin/module-grades" element={
              <RoleRoute roles={["admin", "secretaria"]}>
                <AdminModuleGrades />
              </RoleRoute>
            } />
            <Route path="/admin/schedule" element={
              <RoleRoute roles={["admin", "secretaria"]}>
                <AdminSchedule />
              </RoleRoute>
            } />

            {/* Professor (+ Admin) */}
            <Route path="/availability" element={
              <RoleRoute roles={["admin", "professor"]}>
                <ProfessorAvailability />
              </RoleRoute>
            } />
          </Route>
        </Routes>
        <ChatBotWrapper />
      </Router>
    </AuthProvider>
  );
}

export default App;

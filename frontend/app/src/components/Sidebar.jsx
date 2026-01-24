import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LayoutDashboard, Users, LogOut, Settings, BookOpen, Layers, Monitor, Calendar } from "lucide-react";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path
      ? "bg-blue-700 text-white"
      : "text-blue-100 hover:bg-blue-600";
  };

  return (
    <div className="flex flex-col h-screen w-64 bg-blue-800 text-white shadow-xl transition-all duration-300">
      {/* Header / Logo */}
      <div className="flex items-center justify-center h-20 border-b border-blue-700">
        <h1 className="text-2xl font-bold tracking-wider">
          ATEC<span className="text-blue-300">Gestão</span>
        </h1>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <Link
          to="/"
          className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${isActive("/")}`}
        >
          <LayoutDashboard className="w-5 h-5 mr-3" />
          <span className="font-medium">Dashboard</span>
        </Link>

        {user?.is_superuser && (
          <>
            <div className="px-4 pt-4 pb-2 text-xs font-semibold text-blue-300 uppercase tracking-wider">
              Administração
            </div>
            
            <Link
              to="/admin/users"
              className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${isActive("/admin/users")}`}
            >
              <Users className="w-5 h-5 mr-3" />
              <span className="font-medium">Utilizadores</span>
            </Link>

            <Link
              to="/admin/courses"
              className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${isActive("/admin/courses")}`}
            >
              <BookOpen className="w-5 h-5 mr-3" />
              <span className="font-medium">Cursos</span>
            </Link>

            <Link
              to="/admin/modules"
              className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${isActive("/admin/modules")}`}
            >
              <Layers className="w-5 h-5 mr-3" />
              <span className="font-medium">Módulos</span>
            </Link>

            <Link
              to="/admin/classrooms"
              className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${isActive("/admin/classrooms")}`}
            >
              <Monitor className="w-5 h-5 mr-3" />
              <span className="font-medium">Salas</span>
            </Link>

            <Link
              to="/admin/availability"
              className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${isActive("/admin/availability")}`}
            >
              <Calendar className="w-5 h-5 mr-3" />
              <span className="font-medium">Horários Professores</span>
            </Link>

            <div className="border-t border-gray-700 my-4 mx-4"></div>
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              ACADÉMICO
            </p>

            <Link
              to="/admin/enrollments"
              className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${isActive("/admin/enrollments")}`}
            >
              <BookOpen className="w-5 h-5 mr-3" />
              <span className="font-medium">Inscrições</span>
            </Link>

            <Link
              to="/admin/module-grades"
              className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${isActive("/admin/module-grades")}`}
            >
              <BookOpen className="w-5 h-5 mr-3" />
              <span className="font-medium">Notas</span>
            </Link>
          </>
        )}

        {(user?.role === 'professor' || user?.is_superuser) && (
          <Link
            to="/availability"
            className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${isActive("/availability")}`}
          >
            <Calendar className="w-5 h-5 mr-3" />
            <span className="font-medium">Disponibilidade</span>
          </Link>
        )}
        
        <Link
          to="/profile"
          className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${isActive("/profile")}`}
        >
          <Settings className="w-5 h-5 mr-3" />
          <span className="font-medium">Configurações</span>
        </Link>
      </nav>

      {/* User & Footer */}
      <div className="p-4 border-t border-blue-700 bg-blue-900">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
            {user?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
          </div>
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-medium truncate">
              {user?.full_name || "Utilizador"}
            </p>
            <p className="text-xs text-blue-300 truncate">{user?.role}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Users,
  LogOut,
  Settings,
  BookOpen,
  Layers,
  Monitor,
  Calendar,
  Clock,
  Search,
  X,
} from "lucide-react";

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const linkClass = (path) =>
    `flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
      isActive(path)
        ? "bg-blue-600/20 text-white border-l-[3px] border-blue-400 pl-[13px]"
        : "text-slate-300 hover:bg-white/10 hover:text-white"
    }`;

  const handleLinkClick = () => {
    // Fechar sidebar em mobile ao clicar num link
    if (window.innerWidth < 768) {
      onClose?.();
    }
  };

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 bg-linear-to-b from-slate-900 via-slate-900 to-slate-800 text-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        {/* Header / Logo */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-white/10">
          <h1 className="text-2xl font-bold tracking-wider">
            ATEC<span className="text-blue-400">Gestão</span>
          </h1>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors md:hidden"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <Link to="/" className={linkClass("/")} onClick={handleLinkClick}>
            <LayoutDashboard className="w-5 h-5 mr-3 shrink-0" />
            <span className="font-medium">Dashboard</span>
          </Link>

          {(user?.is_superuser || user?.role === "admin") && (
            <>
              <div className="px-4 pt-5 pb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
                Administração
              </div>

              <Link
                to="/admin/users"
                className={linkClass("/admin/users")}
                onClick={handleLinkClick}
              >
                <Users className="w-5 h-5 mr-3 shrink-0" />
                <span className="font-medium">Utilizadores</span>
              </Link>

              <Link
                to="/admin/courses"
                className={linkClass("/admin/courses")}
                onClick={handleLinkClick}
              >
                <BookOpen className="w-5 h-5 mr-3 shrink-0" />
                <span className="font-medium">Cursos</span>
              </Link>

              <Link
                to="/admin/modules"
                className={linkClass("/admin/modules")}
                onClick={handleLinkClick}
              >
                <Layers className="w-5 h-5 mr-3 shrink-0" />
                <span className="font-medium">Módulos</span>
              </Link>

              <Link
                to="/admin/classrooms"
                className={linkClass("/admin/classrooms")}
                onClick={handleLinkClick}
              >
                <Monitor className="w-5 h-5 mr-3 shrink-0" />
                <span className="font-medium">Salas</span>
              </Link>

              <Link
                to="/admin/availability"
                className={linkClass("/admin/availability")}
                onClick={handleLinkClick}
              >
                <Calendar className="w-5 h-5 mr-3 shrink-0" />
                <span className="font-medium">Horários Professores</span>
              </Link>

              <div className="border-t border-white/10 my-4 mx-2"></div>
              <p className="px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                ACADÉMICO
              </p>

              <Link
                to="/admin/enrollments"
                className={linkClass("/admin/enrollments")}
                onClick={handleLinkClick}
              >
                <BookOpen className="w-5 h-5 mr-3 shrink-0" />
                <span className="font-medium">Inscrições</span>
              </Link>

              <Link
                to="/admin/module-grades"
                className={linkClass("/admin/module-grades")}
                onClick={handleLinkClick}
              >
                <BookOpen className="w-5 h-5 mr-3 shrink-0" />
                <span className="font-medium">Notas</span>
              </Link>

              <Link
                to="/admin/schedule"
                className={linkClass("/admin/schedule")}
                onClick={handleLinkClick}
              >
                <Clock className="w-5 h-5 mr-3 shrink-0" />
                <span className="font-medium">Gestão de Horários</span>
              </Link>
            </>
          )}

          {(user?.role === "professor" ||
            user?.is_superuser ||
            user?.role === "admin") && (
            <Link
              to="/availability"
              className={linkClass("/availability")}
              onClick={handleLinkClick}
            >
              <Calendar className="w-5 h-5 mr-3 shrink-0" />
              <span className="font-medium">Disponibilidade</span>
            </Link>
          )}

          {/* Link de Consultar Horários - Disponível para todos */}
          <Link
            to="/schedule"
            className={linkClass("/schedule")}
            onClick={handleLinkClick}
          >
            <Search className="w-5 h-5 mr-3 shrink-0" />
            <span className="font-medium">
              {user?.role === "estudante" && !user?.is_superuser
                ? "Meu Horário"
                : "Consultar Horários"}
            </span>
          </Link>

          <Link
            to="/profile"
            className={linkClass("/profile")}
            onClick={handleLinkClick}
          >
            <Settings className="w-5 h-5 mr-3 shrink-0" />
            <span className="font-medium">Configurações</span>
          </Link>
        </nav>

        {/* User & Footer */}
        <div className="p-4 border-t border-white/10 bg-slate-950/50">
          <div className="flex items-center mb-4">
            {user?.avatar_url ? (
              <img
                src={`http://localhost:8000/${user.avatar_url}`}
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-400/30"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
            ) : null}
            <div
              className={`w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-blue-600 items-center justify-center text-white font-bold text-sm ring-2 ring-blue-400/30 ${user?.avatar_url ? "hidden" : "flex"}`}
            >
              {user?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium truncate text-white">
                {user?.full_name || "Utilizador"}
              </p>
              <p className="text-xs text-slate-400 truncate capitalize">
                {user?.role}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-white bg-red-600/80 rounded-lg hover:bg-red-600 transition-all duration-200 hover:shadow-lg hover:shadow-red-600/20"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RoleRoute = ({ children, roles }) => {
  const { user } = useAuth();

  // Superusers têm acesso a tudo
  if (user?.is_superuser) return children;

  // Verificar se o role do user está na lista permitida
  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RoleRoute;

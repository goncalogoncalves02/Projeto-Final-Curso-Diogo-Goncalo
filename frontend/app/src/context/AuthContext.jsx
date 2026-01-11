import { createContext, useState, useEffect, useContext } from "react";
import api from "../api/axios";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          // Tentar obter dados do user com o token guardado
          const response = await api.get("/auth/me");
          setUser(response.data);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Sessão inválida", error);
          localStorage.removeItem("token");
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = async (email, password) => {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    // Nota: Como o backend retorna 202 via Exception, pode ser tratado como sucesso pelo axios.
    // Mas precisamos validar a resposta.
    const response = await api.post("/auth/login", formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      validateStatus: (status) => status < 500, // Aceitar 4xx para tratar manualmente se necessário, ou pelo menos aceitar 202
    });

    if (response.status === 202) {
      return { requires2FA: true, email: response.data.email };
    }

    if (response.status !== 200) {
      throw new Error("Login failed");
    }

    const { access_token } = response.data;
    localStorage.setItem("token", access_token);

    const userKwargs = await api.get("/auth/me");
    setUser(userKwargs.data);
    setIsAuthenticated(true);
    return { success: true };
  };

  const verify2FA = async (email, code) => {
    const response = await api.post("/auth/login/2fa", { email, code });
    const { access_token } = response.data;
    localStorage.setItem("token", access_token);

    const userKwargs = await api.get("/auth/me");
    setUser(userKwargs.data);
    setIsAuthenticated(true);
    return true;
  };

  const register = async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        verify2FA,
        loading,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

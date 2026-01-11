import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

const SocialCallback = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  useEffect(() => {
    const processLogin = async () => {
      if (token) {
        localStorage.setItem("token", token);
        try {
          // Validar token - se falhar vai para o catch
          await api.get("/auth/me");

          // O ideal é recarregar a página para o AuthProvider pegar o token novo
          window.location.href = "/";
        } catch {
          navigate("/login");
        }
      } else {
        navigate("/login");
      }
    };
    processLogin();
  }, [token, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-xl">A processar login com Google...</p>
    </div>
  );
};

export default SocialCallback;

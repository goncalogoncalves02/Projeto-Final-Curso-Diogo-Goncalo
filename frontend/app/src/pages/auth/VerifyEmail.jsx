import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState("A verificar...");
  const navigate = useNavigate();

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus("Token inválido.");
        return;
      }
      try {
        await api.post(`/auth/verify-email?token=${token}`);
        setStatus("Email verificado com sucesso! A redirecionar...");
        setTimeout(() => navigate("/login"), 3000);
      } catch {
        setStatus("Falha na verificação. O link pode ter expirado.");
      }
    };
    verify();
  }, [token, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative p-8 bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl w-full max-w-sm mx-4">
        <h2 className="text-2xl font-bold text-center text-blue-600">
          Verificação de Email
        </h2>
        <p className="mt-4 text-center text-gray-700">{status}</p>
      </div>
    </div>
  );
};

export default VerifyEmail;

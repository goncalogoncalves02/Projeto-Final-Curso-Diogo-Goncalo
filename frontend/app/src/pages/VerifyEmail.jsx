import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

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
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white shadow-lg rounded-lg">
        <h2 className="text-2xl font-bold text-center text-blue-600">
          Verificação de Email
        </h2>
        <p className="mt-4 text-center text-gray-700">{status}</p>
      </div>
    </div>
  );
};

export default VerifyEmail;

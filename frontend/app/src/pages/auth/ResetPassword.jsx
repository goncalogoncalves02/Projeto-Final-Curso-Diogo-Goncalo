import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [passwords, setPasswords] = useState({ password: "", confirm: "" });
  const [status, setStatus] = useState({ type: "", msg: "" });

  if (!token) return <div className="text-center mt-10">Token inválido.</div>;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (passwords.password !== passwords.confirm) {
      setStatus({ type: "error", msg: "As passwords não coincidem." });
      return;
    }

    setStatus({ type: "info", msg: "A atualizar password..." });

    try {
      await api.post("/auth/reset-password", {
        token: token,
        new_password: passwords.password,
      });
      setStatus({ type: "success", msg: "Password alterada com sucesso!" });
      setTimeout(() => navigate("/login"), 2000);
    } catch {
      setStatus({ type: "error", msg: "Token inválido ou expirado." });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="px-8 py-6 text-left bg-white shadow-lg rounded-lg w-96">
        <h3 className="text-2xl font-bold text-center text-blue-600">
          Nova Password
        </h3>

        <form onSubmit={handleSubmit} className="mt-4">
          <div>
            <label className="block">Nova Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
              value={passwords.password}
              onChange={(e) =>
                setPasswords({ ...passwords, password: e.target.value })
              }
            />
          </div>
          <div className="mt-4">
            <label className="block">Confirmar Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
              value={passwords.confirm}
              onChange={(e) =>
                setPasswords({ ...passwords, confirm: e.target.value })
              }
            />
          </div>

          {status.msg && (
            <p
              className={`mt-4 text-sm text-center ${status.type === "error" ? "text-red-600" : "text-green-600"}`}
            >
              {status.msg}
            </p>
          )}

          <button className="w-full px-6 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-900">
            Alterar Password
          </button>

          <div className="mt-4 text-center">
            <Link to="/login" className="text-sm text-blue-600 hover:underline">
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;

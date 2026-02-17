import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: "", msg: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "info", msg: "A enviar pedido..." });

    try {
      await api.post("/auth/forgot-password", { email });
      setStatus({
        type: "success",
        msg: "Se o email existir, receberás um link de recuperação.",
      });
    } catch {
      setStatus({ type: "error", msg: "Algo correu mal. Tenta novamente." });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative px-8 py-6 text-left bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl w-full max-w-sm mx-4">
        <h3 className="text-2xl font-bold text-center text-blue-600">
          Recuperar Password
        </h3>
        <p className="mt-2 text-sm text-gray-600 text-center">
          Introduz o teu email para redefinir a password.
        </p>

        <form onSubmit={handleSubmit} className="mt-4">
          <div>
            <label className="block">Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            Enviar Link
          </button>

          <div className="mt-4 text-center">
            <Link to="/login" className="text-sm text-blue-600 hover:underline">
              Voltar ao Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;

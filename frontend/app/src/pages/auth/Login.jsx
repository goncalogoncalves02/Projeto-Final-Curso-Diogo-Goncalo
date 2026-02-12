import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [requires2FA, setRequires2FA] = useState(false);
  const [notification, setNotification] = useState("");
  const [error, setError] = useState("");
  const { login, verify2FA } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNotification("");
    try {
      if (requires2FA) {
        await verify2FA(email, otpCode);
        navigate("/");
      } else {
        const result = await login(email, password);
        if (result.requires2FA) {
          setRequires2FA(true);
          setError("");
          setNotification("Código enviado para o teu email!");
        } else {
          navigate("/");
        }
      }
    } catch {
      setError(
        requires2FA
          ? "Código inválido ou expirado."
          : "Falha no login. Verifica as tuas credenciais.",
      );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative px-8 py-8 bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl w-full max-w-sm mx-4 animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold tracking-wider text-slate-800">
            ATEC<span className="text-blue-600">Gestão</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {requires2FA
              ? "Verificação de Segurança"
              : "Plataforma de Gestão Académica"}
          </p>
        </div>

        {!requires2FA && (
          <div className="mt-4">
            <a
              href="http://localhost:8000/auth/google/login"
              className="flex items-center justify-center w-full px-4 py-2.5 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all duration-200 hover:shadow-sm"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                className="w-5 h-5 mr-2"
                alt="Google"
              />
              <span className="text-sm font-medium">Entrar com Google</span>
            </a>
          </div>
        )}

        {!requires2FA && (
          <div className="relative flex items-center justify-center mt-6 border-t border-gray-200">
            <span className="absolute px-3 bg-white text-gray-400 text-xs font-medium">
              Ou continuar com email
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5">
          <div className="mt-4">
            {requires2FA ? (
              <div>
                <p className="text-sm text-gray-500 mb-4 text-center">
                  Insere o código de 6 dígitos enviado para{" "}
                  <strong className="text-gray-700">{email}</strong>.
                </p>
                <label className="block text-gray-600 font-medium text-sm mb-1.5">
                  Código de Verificação
                </label>
                <input
                  type="text"
                  placeholder="123456"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center tracking-[0.3em] text-xl font-semibold transition-all"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  required
                  maxLength={6}
                />
              </div>
            ) : (
              <>
                <div>
                  <label
                    className="block text-gray-600 font-medium text-sm mb-1.5"
                    htmlFor="email"
                  >
                    Email
                  </label>
                  <input
                    type="text"
                    placeholder="Email"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-gray-600 font-medium text-sm mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Password"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <div className="flex items-baseline justify-end mt-2">
                    <Link
                      to="/forgot-password"
                      className="text-xs text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                    >
                      Esqueceste-te da password?
                    </Link>
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-2.5 rounded-xl mt-4 text-center text-sm font-medium">
                {error}
              </div>
            )}

            {notification && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-2.5 rounded-xl mt-4 text-center text-sm font-medium">
                {notification}
              </div>
            )}

            <div className="mt-6">
              <button className="w-full px-6 py-3 text-white bg-linear-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 font-semibold shadow-lg shadow-blue-600/20 hover:shadow-blue-700/30 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]">
                {requires2FA ? "Validar Código" : "Entrar"}
              </button>
            </div>

            {!requires2FA && (
              <div className="mt-4 text-center">
                <Link
                  to="/register"
                  className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                  Não tens conta?{" "}
                  <span className="font-semibold text-blue-600">Registar</span>
                </Link>
              </div>
            )}

            {requires2FA && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setRequires2FA(false)}
                  className="text-sm text-gray-400 hover:text-gray-600 hover:underline transition-colors"
                >
                  ← Voltar ao Login
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

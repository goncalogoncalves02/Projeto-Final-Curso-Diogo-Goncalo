import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState(""); // Estado para código 2FA
  const [requires2FA, setRequires2FA] = useState(false); // Flag de estado
  const [notification, setNotification] = useState(""); // Novo estado para mensagens de sucesso

  const [error, setError] = useState("");
  const { login, verify2FA } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNotification("");
    try {
      if (requires2FA) {
        // Confirmar Código 2FA
        await verify2FA(email, otpCode);
        navigate("/");
      } else {
        // Login Normal
        const result = await login(email, password);
        if (result.requires2FA) {
          setRequires2FA(true);
          setError(""); // Limpar erros se houver
          setNotification("Código enviado para o teu email!"); // Substitui o alert
        } else {
          navigate("/"); // Redirecionar para dashboard
        }
      }
    } catch {
      setError(
        requires2FA
          ? "Código inválido ou expirado."
          : "Falha no login. Verifica as tuas credenciais."
      );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="px-8 py-6 mt-4 text-left bg-white shadow-lg rounded-lg w-96">
        <h3 className="text-2xl font-bold text-center text-blue-600">
          {requires2FA ? "Verificação 2FA" : "Login ATEC"}
        </h3>

        {!requires2FA && (
          <div className="mt-6">
            <a
              href="http://localhost:8000/auth/google/login"
              className="flex items-center justify-center w-full px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-100 transition-colors"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                className="w-5 h-5 mr-2"
                alt="Google"
              />
              <span>Entrar com Google</span>
            </a>
          </div>
        )}

        {!requires2FA && (
          <div className="relative flex items-center justify-center mt-6 border-t border-gray-300">
            <span className="absolute px-3 bg-white text-gray-500 text-sm">
              Ou continuar com email
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4">
          <div className="mt-4">
            {requires2FA ? (
              // Input para Código 2FA
              <div>
                <p className="text-sm text-gray-600 mb-4 text-center">
                  Insere o código de 6 dígitos enviado para{" "}
                  <strong>{email}</strong>.
                </p>
                <label className="block text-gray-700 font-bold mb-2">
                  Código de Verificação
                </label>
                <input
                  type="text"
                  placeholder="123456"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 text-center tracking-widest text-xl"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  required
                  maxLength={6}
                />
              </div>
            ) : (
              // Inputs Normais
              <>
                <div>
                  <label className="block" htmlFor="email">
                    Email
                  </label>
                  <input
                    type="text"
                    placeholder="Email"
                    className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mt-4">
                  <label className="block">Password</label>
                  <input
                    type="password"
                    placeholder="Password"
                    className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <div className="flex items-baseline justify-end mt-2">
                    <Link
                      to="/forgot-password"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Esqueceste-te da password?
                    </Link>
                  </div>
                </div>
              </>
            )}

            {error && (
              <p className="text-red-500 text-center text-sm mt-4 font-bold">
                {error}
              </p>
            )}

            {notification && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded relative mt-4 text-center text-sm">
                <span className="block sm:inline">{notification}</span>
              </div>
            )}

            <div className="flex items-baseline justify-between mt-6">
              <button className="w-full px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-900">
                {requires2FA ? "Validar Código" : "Login"}
              </button>
            </div>

            {!requires2FA && (
              <div className="mt-4 text-center">
                <Link
                  to="/register"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Registar conta
                </Link>
              </div>
            )}

            {requires2FA && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setRequires2FA(false)}
                  className="text-sm text-gray-500 hover:underline"
                >
                  Voltar ao Login
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

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const Register = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    role: "estudante",
  });
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNotification("");

    if (formData.password !== formData.confirmPassword) {
      setError("As passwords não coincidem.");
      return;
    }

    try {
      await register({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        role: formData.role,
      });
      setNotification("Conta criada com sucesso! Redirecionando...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch {
      setError("Erro ao criar conta. Tenta novamente.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative px-8 py-8 text-left bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl w-full max-w-sm mx-4">
        <h3 className="text-2xl font-bold text-center text-blue-600">
          Registar Conta
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="mt-4">
            <div>
              <label className="block">Nome Completo</label>
              <input
                type="text"
                name="full_name"
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                onChange={handleChange}
                required
              />
            </div>
            <div className="mt-4">
              <label className="block">Email</label>
              <input
                type="email"
                name="email"
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                onChange={handleChange}
                required
              />
            </div>
            <div className="mt-4">
              <label className="block">Tipo de Conta</label>
              <select
                name="role"
                onChange={handleChange}
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
              >
                <option value="estudante">Estudante</option>
                <option value="professor">Professor</option>
              </select>
            </div>
            <div className="mt-4">
              <label className="block">Password</label>
              <input
                type="password"
                name="password"
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                onChange={handleChange}
                required
              />
            </div>
            <div className="mt-4">
              <label className="block">Confirmar Password</label>
              <input
                type="password"
                name="confirmPassword"
                className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
                onChange={handleChange}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            {notification && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded relative mt-4 text-center text-sm">
                <span className="block sm:inline">{notification}</span>
              </div>
            )}
            <div className="flex items-baseline justify-between">
              <button className="px-6 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-900">
                Registar
              </button>
              <Link
                to="/login"
                className="text-sm text-blue-600 hover:underline"
              >
                Já tenho conta
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;

import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Profile = () => {
  const { user, setUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    is_2fa_enabled: false,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        password: "",
        confirmPassword: "",
        is_2fa_enabled: user.is_2fa_enabled || false,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (formData.password && formData.password !== formData.confirmPassword) {
      setError("As passwords não coincidem.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        full_name: formData.full_name,
        email: formData.email,
        is_2fa_enabled: formData.is_2fa_enabled,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      await api.put("/users/me", payload);

      // Se o utilizador alterou o email, o token antigo (que contém o email antigo) torna-se inválido.
      // Precisamos de forçar o logout para ele fazer login com o novo email.
      if (formData.email !== user.email) {
        alert(
          "Email alterado com sucesso! Por motivos de segurança, deves fazer login novamente.",
        );
        logout();
        return;
      }

      // Atualizar o contexto global do utilizador
      // O 'response.data' contém o utilizador atualizado vindo da API
      // Precisamos garantir que mantemos o token e outras info se existirem no state
      // Mas o setUser do AuthProvider normalmente espera o objeto user completo.
      // Vamos assumir que response.data é o objecto user completo.
      // MAS CUIDADO: O AuthProvider pode estar a ler do /auth/me ou do localStorage.
      // Idealmente atualizamos o user localmente para refletir as mudanças na UI imediatamente.
      // O setUser no AuthContext (dependendo da implementação) deve atualizar o state.

      // Vamos recarregar o perfil do endpoint /auth/me para garantir consistência
      const meResponse = await api.get("/auth/me");
      setUser(meResponse.data);

      setSuccess("Perfil atualizado com sucesso!");
      setFormData({ ...formData, password: "", confirmPassword: "" });
    } catch (err) {
      setError(err.response?.data?.detail || "Erro ao atualizar perfil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Configurações Pessoais
      </h1>

      <div className="bg-white shadow-md rounded-lg p-8">
        {success && (
          <div className="bg-green-100 text-green-700 p-4 rounded mb-6 border border-green-200">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded mb-6 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">
              Informação Básica
            </h2>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Nome Completo
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">
              Segurança
            </h2>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Nova Password (Opcional)
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Deixar em branco para manter a atual"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {formData.password && (
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Confirmar Nova Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="is_2fa_enabled"
                  checked={formData.is_2fa_enabled}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-3 text-gray-700 font-medium">
                  Ativar Autenticação de Dois Fatores (2FA)
                </span>
              </label>
              <p className="text-sm text-gray-500 mt-2 ml-8">
                Se ativado, receberás um código por email sempre que fizeres
                login.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-3 text-white font-medium rounded-lg shadow-md transition-colors ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "A guardar..." : "Guardar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;

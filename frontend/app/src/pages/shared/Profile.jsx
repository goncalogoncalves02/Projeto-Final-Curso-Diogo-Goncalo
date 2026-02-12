import { useState, useEffect } from "react";
import { Upload, User as UserIcon, Phone, Camera } from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";

const API_BASE = "http://localhost:8000";

const Profile = () => {
  const { user, setUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("perfil");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Avatar
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    password: "",
    confirmPassword: "",
    is_2fa_enabled: false,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        phone_number: user.phone_number || "",
        password: "",
        confirmPassword: "",
        is_2fa_enabled: user.is_2fa_enabled || false,
      });
    }
  }, [user]);

  // Limpar object URL ao desmontar
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleChange = (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Por favor seleciona uma imagem.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("A imagem deve ter no maximo 5MB.");
      return;
    }

    setError("");
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    setUploadingAvatar(true);
    setError("");
    setSuccess("");

    try {
      const data = new FormData();
      data.append("file", avatarFile);

      const response = await api.post("/users/me/avatar", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUser(response.data);
      setAvatarFile(null);
      setAvatarPreview(null);
      setSuccess("Foto de perfil atualizada com sucesso!");
    } catch (err) {
      setError(err.response?.data?.detail || "Erro ao enviar foto de perfil.");
    } finally {
      setUploadingAvatar(false);
    }
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
        phone_number: formData.phone_number,
        is_2fa_enabled: formData.is_2fa_enabled,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      await api.put("/users/me", payload);

      if (formData.email !== user.email) {
        alert(
          "Email alterado com sucesso! Por motivos de segurança, deves fazer login novamente.",
        );
        logout();
        return;
      }

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

  const avatarSrc = avatarPreview || (user?.avatar_url ? `${API_BASE}/${user.avatar_url}` : null);

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Configurações Pessoais
      </h1>

      <div className="bg-white shadow-md rounded-lg">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => { setActiveTab("perfil"); setSuccess(""); setError(""); }}
            className={`flex items-center gap-2 px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "perfil"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <UserIcon className="w-4 h-4" />
            Perfil
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("seguranca"); setSuccess(""); setError(""); }}
            className={`flex items-center gap-2 px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
              activeTab === "seguranca"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Segurança
          </button>
        </div>

        <div className="p-8">
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

          {/* Tab Perfil */}
          {activeTab === "perfil" && (
            <div>
              {/* Avatar Upload */}
              <div className="flex items-center gap-6 mb-8 pb-6 border-b border-gray-100">
                <div className="relative group">
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-24 h-24 rounded-full bg-blue-500 items-center justify-center text-white text-3xl font-bold border-4 border-blue-100 ${avatarSrc ? "hidden" : "flex"}`}
                  >
                    {user?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-6 h-6 text-white" />
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Foto de Perfil</h3>
                  <p className="text-sm text-gray-500 mb-3">JPEG, PNG, GIF ou WebP. Max 5MB.</p>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
                      <Upload className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-600 font-medium text-sm">
                        Escolher Foto
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                    {avatarFile && (
                      <button
                        type="button"
                        onClick={handleAvatarUpload}
                        disabled={uploadingAvatar}
                        className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${
                          uploadingAvatar
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700"
                        }`}
                      >
                        {uploadingAvatar ? "A enviar..." : "Guardar Foto"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Formulario Perfil */}
              <form onSubmit={handleSubmit}>
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
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    <span className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Numero de Telemovel
                    </span>
                  </label>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    placeholder="+351 912 345 678"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
          )}

          {/* Tab Seguranca */}
          {activeTab === "seguranca" && (
            <form onSubmit={handleSubmit}>
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

              <div className="mt-6 mb-6 p-4 bg-gray-50 rounded-md border border-gray-200">
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
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;

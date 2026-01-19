import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Estados do form para editar
  const [formData, setFormData] = useState({
    full_name: "",
    role: "estudante",
    is_active: true,
    is_superuser: false,
    is_2fa_enabled: false,
  });

  // Estados do form de criação
  const [createFormData, setCreateFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "estudante",
    is_active: true,
    is_superuser: false,
    is_2fa_enabled: false,
  });

  useEffect(() => {
    const controller = new AbortController();

    const fetchUsers = async () => {
      try {
        const response = await api.get("/users/");
        setUsers(response.data);
        setLoading(false);
      } catch (error) {
        if (error.name !== "CanceledError" && error.code !== "ERR_CANCELED") {
          setError("Erro ao carregar utilizadores.");
          setLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      controller.abort();
    };
  }, []);

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await api.delete(`/users/${userToDelete.id}`);
      setUsers(users.filter((u) => u.id !== userToDelete.id));
      setUserToDelete(null);
    } catch {
      alert("Erro ao eliminar utilizador.");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/users/", createFormData);
      setUsers([...users, response.data]);
      setIsCreating(false);
      setCreateFormData({
        email: "",
        password: "",
        full_name: "",
        role: "estudante",
        is_active: true,
        is_superuser: false,
        is_2fa_enabled: false,
      });
    } catch (error) {
      alert(error.response?.data?.detail || "Erro ao criar utilizador.");
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name || "",
      role: user.role,
      is_active: user.is_active,
      is_superuser: user.is_superuser,
      is_2fa_enabled: user.is_2fa_enabled,
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/users/${editingUser.id}`, formData);
      setUsers(users.map((u) => (u.id === editingUser.id ? response.data : u)));
      setEditingUser(null);
    } catch {
      alert("Erro ao atualizar utilizador.");
    }
  };

  if (loading) return <div className="p-8 text-center">A carregar...</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Gestão de Utilizadores
        </h1>
        <div className="space-x-4">
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow"
          >
            + Novo Utilizador
          </button>
          <Link
            to="/"
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Voltar à Dashboard
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome / Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Função
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  #{user.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {user.full_name || "Sem nome"}
                  </div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${
                                          user.role === "admin"
                                            ? "bg-purple-100 text-purple-800"
                                            : user.role === "professor"
                                              ? "bg-blue-100 text-blue-800"
                                              : user.role === "secretaria"
                                                ? "bg-orange-100 text-orange-800"
                                                : "bg-green-100 text-green-800"
                                        }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${user.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                  >
                    {user.is_active ? "Ativo" : "Inativo"}
                  </span>
                  {user.is_superuser && (
                    <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      SuperUser
                    </span>
                  )}
                  {user.otp_code && (
                    <div className="mt-1 text-xs text-gray-400">
                      OTP: {user.otp_code}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEditClick(user)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteClick(user)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Apagar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Edição */}
      {editingUser && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl w-96">
            <h2 className="text-xl font-bold mb-4">
              Editar Utilizador #{editingUser.id}
            </h2>
            <form onSubmit={handleUpdate}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Função
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="estudante">Estudante</option>
                  <option value="professor">Professor</option>
                  <option value="secretaria">Secretaria</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="mr-2"
                  />
                  <span className="text-sm">Conta Ativa</span>
                </label>
              </div>
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_superuser}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_superuser: e.target.checked,
                      })
                    }
                    className="mr-2"
                  />
                  <span className="text-sm">SuperUser (Acesso Total)</span>
                </label>
              </div>
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_2fa_enabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_2fa_enabled: e.target.checked,
                      })
                    }
                    className="mr-2"
                  />
                  <span className="text-sm">
                    Ativar Autenticação 2FA (Email)
                  </span>
                </label>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="mr-2 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Criação */}
      {isCreating && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl w-96">
            <h2 className="text-xl font-bold mb-4">Novo Utilizador</h2>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={createFormData.email}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      email: e.target.value,
                    })
                  }
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={createFormData.password}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      password: e.target.value,
                    })
                  }
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={createFormData.full_name}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      full_name: e.target.value,
                    })
                  }
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Função
                </label>
                <select
                  value={createFormData.role}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      role: e.target.value,
                    })
                  }
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="estudante">Estudante</option>
                  <option value="professor">Professor</option>
                  <option value="secretaria">Secretaria</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={createFormData.is_active}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        is_active: e.target.checked,
                      })
                    }
                    className="mr-2"
                  />
                  <span className="text-sm">Conta Ativa</span>
                </label>
              </div>
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={createFormData.is_superuser}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        is_superuser: e.target.checked,
                      })
                    }
                    className="mr-2"
                  />
                  <span className="text-sm">SuperUser</span>
                </label>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="mr-2 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-green-700"
                >
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Eliminação */}
      {userToDelete && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96 transform transition-all scale-100">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Eliminar Utilizador
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Tens a certeza que queres eliminar o utilizador{" "}
                <span className="font-bold text-gray-800">
                  {userToDelete.full_name || userToDelete.email}
                </span>
                ? <br />
                Esta ação é irreversível.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setUserToDelete(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 focus:outline-none transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none transition-colors shadow-lg"
                >
                  Sim, Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;

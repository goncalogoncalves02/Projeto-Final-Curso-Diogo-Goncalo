import { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";
import UserFilesModal from "../../components/UserFilesModal";
import Pagination from "../../components/ui/Pagination";
import SearchBar from "../../components/ui/SearchBar";
import TableLoading from "../../components/ui/TableLoading";
import TableEmpty from "../../components/ui/TableEmpty";
import ActionButton from "../../components/ui/ActionButton";
import ModalPortal from "../../components/ui/ModalPortal";
import {
  Pencil,
  Trash2,
  FolderOpen,
  FileText,
  Plus,
  UserPlus,
} from "lucide-react";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [userFilesView, setUserFilesView] = useState(null); // { id, full_name }

  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 20;

  // Estado de pesquisa
  const [searchQuery, setSearchQuery] = useState("");

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

  const fetchUsers = useCallback(async (page = 1, query = "") => {
    try {
      setLoading(true);
      const params = { page, limit: ITEMS_PER_PAGE };
      if (query && query.length >= 2) {
        params.q = query;
      }
      const response = await api.get("/users/", { params });
      setUsers(response.data.items || []);
      setTotalPages(response.data.pages || 1);
      setTotalItems(response.data.total || 0);
      setCurrentPage(response.data.page || 1);
    } catch (err) {
      if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
        setError("Erro ao carregar utilizadores.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(1, searchQuery);
  }, [fetchUsers]);

  const handlePageChange = (newPage) => {
    fetchUsers(newPage, searchQuery);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
    fetchUsers(1, query);
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
  };

  const handleExportPDF = async (user) => {
    try {
      const endpoint =
        user.role === "estudante"
          ? `/exports/student/${user.id}/pdf`
          : `/exports/professor/${user.id}/pdf`;

      const response = await api.get(endpoint, { responseType: "blob" });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const fichaType = user.role === "estudante" ? "estudante" : "professor";
      link.download = `ficha_${fichaType}_${user.full_name || user.id}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Erro ao exportar PDF.");
    }
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

  return (
    <div className="animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Gestão de Utilizadores
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerir contas e permissões
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-200 font-medium text-sm"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Novo Utilizador
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-5">
        <SearchBar
          onSearch={handleSearch}
          placeholder="Pesquisar por nome ou email..."
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4 border border-red-100">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-4 md:px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  ID
                </th>
                <th className="px-4 md:px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Nome / Email
                </th>
                <th className="px-4 md:px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Função
                </th>
                <th className="px-4 md:px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Estado
                </th>
                <th className="px-4 md:px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {loading ? (
                <TableLoading colSpan={5} />
              ) : users.length === 0 ? (
                <TableEmpty
                  colSpan={5}
                  message="Nenhum utilizador encontrado."
                />
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-400 hidden sm:table-cell">
                      #{user.id}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.full_name || "Sem nome"}
                      </div>
                      <div className="text-xs text-gray-400">{user.email}</div>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2.5 py-1 inline-flex text-xs leading-4 font-semibold rounded-full 
                          ${
                            user.role === "admin"
                              ? "bg-purple-50 text-purple-700"
                              : user.role === "professor"
                                ? "bg-blue-50 text-blue-700"
                                : user.role === "secretaria"
                                  ? "bg-orange-50 text-orange-700"
                                  : "bg-emerald-50 text-emerald-700"
                          }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm hidden md:table-cell">
                      <span
                        className={`px-2.5 py-1 inline-flex text-xs leading-4 font-semibold rounded-full 
                          ${user.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
                      >
                        {user.is_active ? "Ativo" : "Inativo"}
                      </span>
                      {user.is_superuser && (
                        <span className="ml-2 px-2.5 py-1 inline-flex text-xs leading-4 font-semibold rounded-full bg-amber-50 text-amber-700">
                          Super
                        </span>
                      )}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <ActionButton
                          icon={Pencil}
                          label="Editar"
                          variant="primary"
                          onClick={() => handleEditClick(user)}
                        />
                        <ActionButton
                          icon={FolderOpen}
                          label="Ficheiros"
                          variant="info"
                          onClick={() =>
                            setUserFilesView({
                              id: user.id,
                              full_name: user.full_name || user.email,
                            })
                          }
                        />
                        {(user.role === "estudante" ||
                          user.role === "professor") && (
                          <ActionButton
                            icon={FileText}
                            label="Ficha PDF"
                            variant="success"
                            onClick={() => handleExportPDF(user)}
                          />
                        )}
                        <ActionButton
                          icon={Trash2}
                          label="Apagar"
                          variant="danger"
                          onClick={() => handleDeleteClick(user)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={handlePageChange}
      />

      {/* Modal de Edição */}
      {editingUser && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
              <h2 className="text-xl font-bold mb-6 text-gray-800">
                Editar Utilizador #{editingUser.id}
              </h2>
              <form onSubmit={handleUpdate}>
                <div className="mb-4">
                  <label className="block text-gray-600 text-sm font-medium mb-1.5">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    className="border border-gray-200 rounded-xl w-full py-2.5 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-600 text-sm font-medium mb-1.5">
                    Função
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="border border-gray-200 rounded-xl w-full py-2.5 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="estudante">Estudante</option>
                    <option value="professor">Professor</option>
                    <option value="secretaria">Secretaria</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_active: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Conta Ativa</span>
                  </label>
                </div>
                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_superuser}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_superuser: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">
                      SuperUser (Acesso Total)
                    </span>
                  </label>
                </div>
                <div className="mb-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_2fa_enabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_2fa_enabled: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">
                      Ativar Autenticação 2FA (Email)
                    </span>
                  </label>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-5 py-2.5 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal de Criação */}
      {isCreating && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
              <h2 className="text-xl font-bold mb-6 text-gray-800">
                Novo Utilizador
              </h2>
              <form onSubmit={handleCreate}>
                <div className="mb-4">
                  <label className="block text-gray-600 text-sm font-medium mb-1.5">
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
                    className="border border-gray-200 rounded-xl w-full py-2.5 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-600 text-sm font-medium mb-1.5">
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
                    className="border border-gray-200 rounded-xl w-full py-2.5 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-600 text-sm font-medium mb-1.5">
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
                    className="border border-gray-200 rounded-xl w-full py-2.5 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-600 text-sm font-medium mb-1.5">
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
                    className="border border-gray-200 rounded-xl w-full py-2.5 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="estudante">Estudante</option>
                    <option value="professor">Professor</option>
                    <option value="secretaria">Secretaria</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createFormData.is_active}
                      onChange={(e) =>
                        setCreateFormData({
                          ...createFormData,
                          is_active: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">Conta Ativa</span>
                  </label>
                </div>
                <div className="mb-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createFormData.is_superuser}
                      onChange={(e) =>
                        setCreateFormData({
                          ...createFormData,
                          is_superuser: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">SuperUser</span>
                  </label>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-5 py-2.5 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
                  >
                    Criar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal de Confirmação de Eliminação */}
      {userToDelete && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-50 mb-4">
                  <Trash2 className="h-6 w-6 text-red-500" />
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
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setUserToDelete(null)}
                    className="px-5 py-2.5 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium text-sm shadow-sm"
                  >
                    Sim, Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal de Ficheiros */}
      {userFilesView && (
        <UserFilesModal
          userId={userFilesView.id}
          userName={userFilesView.full_name}
          onClose={() => setUserFilesView(null)}
        />
      )}
    </div>
  );
};

export default AdminUsers;

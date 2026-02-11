import { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";
import Pagination from "../../components/Pagination";
import SearchBar from "../../components/SearchBar";
import TableLoading from "../../components/TableLoading";
import TableEmpty from "../../components/TableEmpty";
import ActionButton from "../../components/ActionButton";
import ModalPortal from "../../components/ModalPortal";
import { Pencil, Trash2, Plus, Layers } from "lucide-react";

const AdminModules = () => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingModule, setEditingModule] = useState(null);
  const [moduleToDelete, setModuleToDelete] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 20;

  const [searchQuery, setSearchQuery] = useState("");

  const initialFormState = {
    name: "",
    area: "",
    default_duration_hours: 25,
  };

  const [formData, setFormData] = useState(initialFormState);
  const [createFormData, setCreateFormData] = useState(initialFormState);

  const fetchModules = useCallback(async (page = 1, query = "") => {
    try {
      setLoading(true);
      const params = { page, limit: ITEMS_PER_PAGE };
      if (query && query.length >= 2) {
        params.q = query;
      }
      const response = await api.get("/modules/", { params });
      setModules(response.data.items || []);
      setTotalPages(response.data.pages || 1);
      setTotalItems(response.data.total || 0);
      setCurrentPage(response.data.page || 1);
    } catch (err) {
      if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
        setError("Erro ao carregar módulos.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModules(1, searchQuery);
  }, [fetchModules]);

  const handlePageChange = (newPage) => {
    fetchModules(newPage, searchQuery);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
    fetchModules(1, query);
  };

  const handleDeleteClick = (module) => {
    setModuleToDelete(module);
  };

  const confirmDelete = async () => {
    if (!moduleToDelete) return;
    try {
      await api.delete(`/modules/${moduleToDelete.id}`);
      setModules(modules.filter((m) => m.id !== moduleToDelete.id));
      setModuleToDelete(null);
    } catch {
      alert("Erro ao eliminar módulo.");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/modules/", createFormData);
      setModules([...modules, response.data]);
      setIsCreating(false);
      setCreateFormData(initialFormState);
    } catch (error) {
      alert(error.response?.data?.detail || "Erro ao criar módulo.");
    }
  };

  const handleEditClick = (module) => {
    setEditingModule(module);
    setFormData({
      name: module.name,
      area: module.area || "",
      default_duration_hours: module.default_duration_hours,
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/modules/${editingModule.id}`, formData);
      setModules(
        modules.map((m) => (m.id === editingModule.id ? response.data : m)),
      );
      setEditingModule(null);
    } catch {
      alert("Erro ao atualizar módulo.");
    }
  };

  return (
    <div className="animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Gestão de Módulos (UCs)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Catálogo de unidades curriculares
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-200 font-medium text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Módulo
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-5">
        <SearchBar
          onSearch={handleSearch}
          placeholder="Pesquisar por nome ou área..."
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
                  Nome
                </th>
                <th className="px-4 md:px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Área
                </th>
                <th className="px-4 md:px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Duração
                </th>
                <th className="px-4 md:px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {loading ? (
                <TableLoading colSpan={5} />
              ) : modules.length === 0 ? (
                <TableEmpty colSpan={5} message="Nenhum módulo encontrado." />
              ) : (
                modules.map((module) => (
                  <tr
                    key={module.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-400 hidden sm:table-cell">
                      #{module.id}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {module.name}
                      </div>
                      <div className="text-xs text-gray-400 md:hidden">
                        {module.area || "-"}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                      {module.area || "-"}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-700 bg-blue-50 px-2.5 py-1 rounded-full">
                        {module.default_duration_hours}h
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <ActionButton
                          icon={Pencil}
                          label="Editar"
                          variant="primary"
                          onClick={() => handleEditClick(module)}
                        />
                        <ActionButton
                          icon={Trash2}
                          label="Apagar"
                          variant="danger"
                          onClick={() => handleDeleteClick(module)}
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
      {editingModule && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
              <h2 className="text-xl font-bold mb-6 text-gray-800">
                Editar Módulo #{editingModule.id}
              </h2>
              <form onSubmit={handleUpdate}>
                <div className="mb-4">
                  <label className="block text-gray-600 text-sm font-medium mb-1.5">
                    Nome
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="border border-gray-200 rounded-xl w-full py-2.5 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-600 text-sm font-medium mb-1.5">
                    Área
                  </label>
                  <input
                    type="text"
                    value={formData.area}
                    onChange={(e) =>
                      setFormData({ ...formData, area: e.target.value })
                    }
                    className="border border-gray-200 rounded-xl w-full py-2.5 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-gray-600 text-sm font-medium mb-1.5">
                    Duração (Horas)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.default_duration_hours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        default_duration_hours: parseInt(e.target.value) || 0,
                      })
                    }
                    className="border border-gray-200 rounded-xl w-full py-2.5 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingModule(null)}
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
                Novo Módulo
              </h2>
              <form onSubmit={handleCreate}>
                <div className="mb-4">
                  <label className="block text-gray-600 text-sm font-medium mb-1.5">
                    Nome
                  </label>
                  <input
                    type="text"
                    required
                    value={createFormData.name}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        name: e.target.value,
                      })
                    }
                    className="border border-gray-200 rounded-xl w-full py-2.5 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-600 text-sm font-medium mb-1.5">
                    Área
                  </label>
                  <input
                    type="text"
                    value={createFormData.area}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        area: e.target.value,
                      })
                    }
                    className="border border-gray-200 rounded-xl w-full py-2.5 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-gray-600 text-sm font-medium mb-1.5">
                    Duração (Horas)
                  </label>
                  <input
                    type="number"
                    required
                    value={createFormData.default_duration_hours}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        default_duration_hours: parseInt(e.target.value) || 0,
                      })
                    }
                    className="border border-gray-200 rounded-xl w-full py-2.5 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
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
      {moduleToDelete && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-50 mb-4">
                  <Trash2 className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Eliminar Módulo
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Tens a certeza que queres eliminar o módulo{" "}
                  <span className="font-bold text-gray-800">
                    {moduleToDelete.name}
                  </span>
                  ? <br />
                  Esta ação é irreversível.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setModuleToDelete(null)}
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
    </div>
  );
};

export default AdminModules;

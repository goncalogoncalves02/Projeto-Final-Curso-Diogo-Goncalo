import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import Pagination from "../../components/Pagination";

const AdminModules = () => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingModule, setEditingModule] = useState(null);
  const [moduleToDelete, setModuleToDelete] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 20;

  const initialFormState = {
    name: "",
    area: "",
    default_duration_hours: 25,
  };

  const [formData, setFormData] = useState(initialFormState);
  const [createFormData, setCreateFormData] = useState(initialFormState);

  const fetchModules = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const response = await api.get("/modules/", {
        params: { page, limit: ITEMS_PER_PAGE },
      });
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
    fetchModules(1);
  }, [fetchModules]);

  const handlePageChange = (newPage) => {
    fetchModules(newPage);
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

  if (loading) return <div className="p-8 text-center">A carregar...</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Gestão de Módulos (UCs)
        </h1>
        <div className="space-x-4">
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow"
          >
            + Novo Módulo
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
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Área
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duração (Horas)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {modules.map((module) => (
              <tr key={module.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  #{module.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {module.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {module.area || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {module.default_duration_hours}h
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEditClick(module)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteClick(module)}
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

      {/* Paginação */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={handlePageChange}
      />

      {/* Modal de Edição */}
      {editingModule && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl w-96">
            <h2 className="text-xl font-bold mb-4">
              Editar Módulo #{editingModule.id}
            </h2>
            <form onSubmit={handleUpdate}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Área
                </label>
                <input
                  type="text"
                  value={formData.area}
                  onChange={(e) =>
                    setFormData({ ...formData, area: e.target.value })
                  }
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
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
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setEditingModule(null)}
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
            <h2 className="text-xl font-bold mb-4">Novo Módulo</h2>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
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
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
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
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
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
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
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
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Eliminação */}
      {moduleToDelete && (
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
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setModuleToDelete(null)}
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

export default AdminModules;

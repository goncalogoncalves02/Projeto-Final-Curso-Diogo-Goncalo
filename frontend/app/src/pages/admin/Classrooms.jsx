import { useState, useEffect, useCallback } from "react";
import api from "../../api/axios";
import Pagination from "../../components/Pagination";
import SearchBar from "../../components/SearchBar";
import TableLoading from "../../components/TableLoading";
import TableEmpty from "../../components/TableEmpty";
import ActionButton from "../../components/ActionButton";
import ModalPortal from "../../components/ModalPortal";
import { Pencil, Trash2, Plus } from "lucide-react";

const AdminClassrooms = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingClassroom, setEditingClassroom] = useState(null);
  const [classroomToDelete, setClassroomToDelete] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 20;

  const [searchQuery, setSearchQuery] = useState("");

  const initialFormState = {
    name: "",
    type: "",
    capacity: 20,
    is_available: true,
  };

  const [formData, setFormData] = useState(initialFormState);
  const [createFormData, setCreateFormData] = useState(initialFormState);

  const fetchClassrooms = useCallback(async (page = 1, query = "") => {
    try {
      setLoading(true);
      const params = { page, limit: ITEMS_PER_PAGE };
      if (query && query.length >= 2) {
        params.q = query;
      }
      const response = await api.get("/classrooms/", { params });
      setClassrooms(response.data.items || []);
      setTotalPages(response.data.pages || 1);
      setTotalItems(response.data.total || 0);
      setCurrentPage(response.data.page || 1);
    } catch (err) {
      if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
        setError("Erro ao carregar salas.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClassrooms(1, searchQuery);
  }, [fetchClassrooms]);

  const handlePageChange = (newPage) => {
    fetchClassrooms(newPage, searchQuery);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
    fetchClassrooms(1, query);
  };

  const handleDeleteClick = (classroom) => {
    setClassroomToDelete(classroom);
  };

  const confirmDelete = async () => {
    if (!classroomToDelete) return;
    try {
      await api.delete(`/classrooms/${classroomToDelete.id}`);
      setClassrooms(classrooms.filter((c) => c.id !== classroomToDelete.id));
      setClassroomToDelete(null);
    } catch {
      alert("Erro ao eliminar sala.");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/classrooms/", createFormData);
      setClassrooms([...classrooms, response.data]);
      setIsCreating(false);
      setCreateFormData(initialFormState);
    } catch (error) {
      alert(error.response?.data?.detail || "Erro ao criar sala.");
    }
  };

  const handleEditClick = (classroom) => {
    setEditingClassroom(classroom);
    setFormData({
      name: classroom.name,
      type: classroom.type || "",
      capacity: classroom.capacity,
      is_available: classroom.is_available,
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(
        `/classrooms/${editingClassroom.id}`,
        formData,
      );
      setClassrooms(
        classrooms.map((c) =>
          c.id === editingClassroom.id ? response.data : c,
        ),
      );
      setEditingClassroom(null);
    } catch {
      alert("Erro ao atualizar sala.");
    }
  };

  return (
    <div className="animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Gestão de Salas
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerir salas e laboratórios
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-200 font-medium text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Sala
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-5">
        <SearchBar
          onSearch={handleSearch}
          placeholder="Pesquisar por nome ou tipo..."
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
                  Nome da Sala
                </th>
                <th className="px-4 md:px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Tipo
                </th>
                <th className="px-4 md:px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Capacidade
                </th>
                <th className="px-4 md:px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Disponibilidade
                </th>
                <th className="px-4 md:px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {loading ? (
                <TableLoading colSpan={6} />
              ) : classrooms.length === 0 ? (
                <TableEmpty colSpan={6} message="Nenhuma sala encontrada." />
              ) : (
                classrooms.map((classroom) => (
                  <tr
                    key={classroom.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-400 hidden sm:table-cell">
                      #{classroom.id}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {classroom.name}
                      </div>
                      <div className="text-xs text-gray-400 md:hidden">
                        {classroom.type || "-"}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                      {classroom.type || "-"}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-700 bg-blue-50 px-2.5 py-1 rounded-full">
                        {classroom.capacity} lugares
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm hidden sm:table-cell">
                      <span
                        className={`px-2.5 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${classroom.is_available ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
                      >
                        {classroom.is_available ? "Disponível" : "Indisponível"}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <ActionButton
                          icon={Pencil}
                          label="Editar"
                          variant="primary"
                          onClick={() => handleEditClick(classroom)}
                        />
                        <ActionButton
                          icon={Trash2}
                          label="Apagar"
                          variant="danger"
                          onClick={() => handleDeleteClick(classroom)}
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
      {editingClassroom && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
              <h2 className="text-xl font-bold mb-6 text-gray-800">
                Editar Sala #{editingClassroom.id}
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
                    Tipo
                  </label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    placeholder="Ex: Informática, Teórica"
                    className="border border-gray-200 rounded-xl w-full py-2.5 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-600 text-sm font-medium mb-1.5">
                    Capacidade
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capacity: parseInt(e.target.value) || 0,
                      })
                    }
                    className="border border-gray-200 rounded-xl w-full py-2.5 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="mb-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_available}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_available: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">
                      Sala Disponível
                    </span>
                  </label>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingClassroom(null)}
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
                Nova Sala
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
                    Tipo
                  </label>
                  <input
                    type="text"
                    value={createFormData.type}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        type: e.target.value,
                      })
                    }
                    placeholder="Ex: Informática, Teórica"
                    className="border border-gray-200 rounded-xl w-full py-2.5 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-600 text-sm font-medium mb-1.5">
                    Capacidade
                  </label>
                  <input
                    type="number"
                    required
                    value={createFormData.capacity}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        capacity: parseInt(e.target.value) || 0,
                      })
                    }
                    className="border border-gray-200 rounded-xl w-full py-2.5 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div className="mb-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createFormData.is_available}
                      onChange={(e) =>
                        setCreateFormData({
                          ...createFormData,
                          is_available: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-600">
                      Sala Disponível
                    </span>
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
      {classroomToDelete && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-50 mb-4">
                  <Trash2 className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Eliminar Sala
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Tens a certeza que queres eliminar a sala{" "}
                  <span className="font-bold text-gray-800">
                    {classroomToDelete.name}
                  </span>
                  ? <br />
                  Esta ação é irreversível.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setClassroomToDelete(null)}
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

export default AdminClassrooms;

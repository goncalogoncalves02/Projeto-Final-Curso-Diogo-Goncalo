import { useState, useEffect, useCallback, useRef } from "react";
import api from "../../api/axios";
import Pagination from "../../components/ui/Pagination";
import SearchBar from "../../components/ui/SearchBar";
import TableLoading from "../../components/ui/TableLoading";
import TableEmpty from "../../components/ui/TableEmpty";
import ActionButton from "../../components/ui/ActionButton";
import ModalPortal from "../../components/ui/ModalPortal";
import { Pencil, Trash2, Plus, Layers, X, Search } from "lucide-react";

const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 20;

  // Estado de pesquisa
  const [searchQuery, setSearchQuery] = useState("");

  // Estados de pesquisa para os selects de módulo/professor/sala
  const [moduleSearch, setModuleSearch] = useState("");
  const [showModuleSuggestions, setShowModuleSuggestions] = useState(false);
  const [trainerSearch, setTrainerSearch] = useState("");
  const [showTrainerSuggestions, setShowTrainerSuggestions] = useState(false);
  const [classroomSearch, setClassroomSearch] = useState("");
  const [showClassroomSuggestions, setShowClassroomSuggestions] =
    useState(false);
  const moduleSearchRef = useRef(null);
  const trainerSearchRef = useRef(null);
  const classroomSearchRef = useRef(null);

  // Click-outside para fechar sugestões
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        moduleSearchRef.current &&
        !moduleSearchRef.current.contains(e.target)
      )
        setShowModuleSuggestions(false);
      if (
        trainerSearchRef.current &&
        !trainerSearchRef.current.contains(e.target)
      )
        setShowTrainerSuggestions(false);
      if (
        classroomSearchRef.current &&
        !classroomSearchRef.current.contains(e.target)
      )
        setShowClassroomSuggestions(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Estados do form para editar e criar (inicializado com valores default)
  const initialFormState = {
    name: "",
    area: "",
    description: "",
    start_date: "",
    end_date: "",
    status: "planned",
    schedule_type: "day",
  };

  const [formData, setFormData] = useState(initialFormState);
  const [createFormData, setCreateFormData] = useState(initialFormState);

  const fetchCourses = useCallback(async (page = 1, query = "") => {
    try {
      setLoading(true);
      const params = { page, limit: ITEMS_PER_PAGE };
      if (query && query.length >= 2) {
        params.q = query;
      }
      const response = await api.get("/courses/", { params });
      setCourses(response.data.items || []);
      setTotalPages(response.data.pages || 1);
      setTotalItems(response.data.total || 0);
      setCurrentPage(response.data.page || 1);
    } catch (err) {
      if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
        setError("Erro ao carregar cursos.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses(1, searchQuery);
  }, [fetchCourses]);

  const handlePageChange = (newPage) => {
    fetchCourses(newPage, searchQuery);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
    fetchCourses(1, query);
  };

  const handleDeleteClick = (course) => {
    setCourseToDelete(course);
  };

  const confirmDelete = async () => {
    if (!courseToDelete) return;
    try {
      await api.delete(`/courses/${courseToDelete.id}`);
      setCourseToDelete(null);
      fetchCourses(currentPage, searchQuery);
    } catch {
      alert("Erro ao eliminar curso.");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/courses/", createFormData);
      setIsCreating(false);
      setCreateFormData(initialFormState);
      fetchCourses(currentPage, searchQuery);
    } catch (error) {
      alert(error.response?.data?.detail || "Erro ao criar curso.");
    }
  };

  const handleEditClick = (course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      area: course.area,
      description: course.description || "",
      start_date: course.start_date,
      end_date: course.end_date,
      status: course.status,
      schedule_type: course.schedule_type || "day",
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/courses/${editingCourse.id}`, formData);
      setEditingCourse(null);
      fetchCourses(currentPage, searchQuery);
    } catch {
      alert("Erro ao atualizar curso.");
    }
  };

  /* Logic for Managing Modules */
  const [managingCourse, setManagingCourse] = useState(null);
  const [courseModules, setCourseModules] = useState([]);
  const [availableModules, setAvailableModules] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  // Form for adding module to course
  const [addModuleForm, setAddModuleForm] = useState({
    module_id: "",
    trainer_id: "",
    classroom_id: "",
    total_hours: 25,
    order: 1,
  });
  const [editingModuleId, setEditingModuleId] = useState(null); // null = creating, id = editing
  const [moduleToDelete, setModuleToDelete] = useState(null); // For delete confirmation modal

  const handleManageModulesClick = async (course) => {
    setManagingCourse(course);
    try {
      // Parallel fetch for dependencies
      const [cModulesRes, allModulesRes, usersRes, classroomsRes] =
        await Promise.all([
          api.get(`/courses/${course.id}/modules`),
          api.get("/modules/?limit=100"),
          api.get("/users/?limit=100"),
          api.get("/classrooms/?limit=100"),
        ]);
      setCourseModules(cModulesRes.data);
      setAvailableModules(allModulesRes.data.items || allModulesRes.data);
      setTrainers(
        (usersRes.data.items || usersRes.data).filter(
          (u) => u.role === "professor",
        ),
      );
      setClassrooms(classroomsRes.data.items || classroomsRes.data);
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar dados dos módulos.");
    }
  };

  const handleModuleClick = (cm) => {
    // Populate form with existing data for editing
    setEditingModuleId(cm.id);
    setAddModuleForm({
      module_id: cm.module_id || cm.module?.id || "",
      trainer_id: cm.trainer_id || cm.trainer?.id || "",
      classroom_id: cm.classroom_id || "",
      total_hours: cm.total_hours || 25,
      order: cm.order || 1,
    });
  };

  const handleCancelEdit = () => {
    setEditingModuleId(null);
    setAddModuleForm({
      module_id: "",
      trainer_id: "",
      classroom_id: "",
      total_hours: 25,
      order: courseModules.length + 1,
    });
  };

  const handleSubmitModule = async (e) => {
    e.preventDefault();
    if (!managingCourse) return;

    try {
      const payload = {
        trainer_id: parseInt(addModuleForm.trainer_id),
        classroom_id: addModuleForm.classroom_id
          ? parseInt(addModuleForm.classroom_id)
          : null,
        total_hours: parseInt(addModuleForm.total_hours),
        order: parseInt(addModuleForm.order),
      };

      if (editingModuleId) {
        // UPDATE existing module
        const response = await api.put(
          `/courses/${managingCourse.id}/modules/${editingModuleId}`,
          payload,
        );
        setCourseModules(
          courseModules.map((cm) =>
            cm.id === editingModuleId ? response.data : cm,
          ),
        );
        setEditingModuleId(null);
      } else {
        // CREATE new module
        payload.module_id = parseInt(addModuleForm.module_id);
        const response = await api.post(
          `/courses/${managingCourse.id}/modules`,
          payload,
        );
        setCourseModules([...courseModules, response.data]);
      }

      // Reset form
      setAddModuleForm({
        module_id: "",
        trainer_id: "",
        classroom_id: "",
        total_hours: 25,
        order: courseModules.length + 2,
      });
    } catch (err) {
      console.error(err);
      alert(
        editingModuleId
          ? "Erro ao atualizar módulo."
          : "Erro ao adicionar módulo ao curso.",
      );
    }
  };

  const handleDeleteModule = async (moduleId) => {
    // Show confirmation modal instead of native confirm
    setModuleToDelete(moduleId);
  };

  const confirmDeleteModule = async () => {
    if (!moduleToDelete || !managingCourse) return;
    try {
      await api.delete(
        `/courses/${managingCourse.id}/modules/${moduleToDelete}`,
      );
      setCourseModules(courseModules.filter((cm) => cm.id !== moduleToDelete));
      if (editingModuleId === moduleToDelete) {
        handleCancelEdit();
      }
      setModuleToDelete(null);
    } catch (err) {
      console.error(err);
      alert("Erro ao remover módulo.");
      setModuleToDelete(null);
    }
  };

  // Loading is now handled inline, not with early return

  return (
    <div className="animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Gestão de Cursos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerir cursos e estrutura curricular
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-200 font-medium text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Curso
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

      <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-4 md:px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  ID
                </th>
                <th className="px-4 md:px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Curso
                </th>
                <th className="px-4 md:px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Datas
                </th>
                <th className="px-4 md:px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
              ) : courses.length === 0 ? (
                <TableEmpty colSpan={5} message="Nenhum curso encontrado." />
              ) : (
                courses.map((course) => (
                  <tr
                    key={course.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-400 hidden sm:table-cell">
                      #{course.id}
                    </td>
                    <td className="px-4 md:px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {course.name}
                      </div>
                      <div className="text-xs text-gray-400">{course.area}</div>
                      {course.description && (
                        <div className="text-xs text-gray-400 truncate max-w-xs mt-0.5">
                          {course.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                      <div className="text-xs">Início: {course.start_date}</div>
                      <div className="text-xs">Fim: {course.end_date}</div>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2.5 py-1 inline-flex text-xs leading-4 font-semibold rounded-full
                        ${
                          course.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : course.status === "finished"
                              ? "bg-gray-100 text-gray-700"
                              : course.status === "cancelled"
                                ? "bg-red-50 text-red-700"
                                : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {course.status === "active"
                          ? "Ativo"
                          : course.status === "finished"
                            ? "Terminado"
                            : course.status === "cancelled"
                              ? "Cancelado"
                              : "Planeado"}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <ActionButton
                          icon={Layers}
                          label="Módulos"
                          variant="info"
                          onClick={() => handleManageModulesClick(course)}
                        />
                        <ActionButton
                          icon={Pencil}
                          label="Editar"
                          variant="primary"
                          onClick={() => handleEditClick(course)}
                        />
                        <ActionButton
                          icon={Trash2}
                          label="Apagar"
                          variant="danger"
                          onClick={() => handleDeleteClick(course)}
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

      {/* Paginação */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={ITEMS_PER_PAGE}
        onPageChange={handlePageChange}
      />

      {/* Modal de Gestão de Módulos */}
      {managingCourse && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-4xl h-5/6 flex flex-col animate-scale-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">
                  Estrutura Curricular: {managingCourse.name}
                </h2>
                <button
                  onClick={() => setManagingCourse(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Esquerda: Lista Atual */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">
                    Módulos no Curso
                  </h3>
                  {courseModules.length === 0 ? (
                    <p className="text-gray-500 italic">
                      Nenhum módulo adicionado ainda.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {courseModules
                        .sort((a, b) => a.order - b.order)
                        .map((cm) => (
                          <li
                            key={cm.id}
                            onClick={() => handleModuleClick(cm)}
                            className={`bg-white p-3 rounded shadow-sm border cursor-pointer hover:border-blue-400 transition-colors ${
                              editingModuleId === cm.id
                                ? "border-blue-500 ring-2 ring-blue-200"
                                : "border-gray-200"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-bold text-blue-800">
                                  #{cm.order} - {cm.module?.name}
                                </span>
                                <div className="text-xs text-gray-600 mt-1">
                                  <span className="block">
                                    Professor: {cm.trainer?.full_name || "N/A"}
                                  </span>
                                  <span className="block">
                                    Sala: {cm.classroom_id || "N/A"}
                                  </span>
                                  <span className="block">
                                    Duração: {cm.total_hours}h
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteModule(cm.id);
                                }}
                                className="text-red-500 hover:text-red-700 text-xs"
                                title="Remover módulo"
                              >
                                ✕
                              </button>
                            </div>
                            <p className="text-xs text-blue-500 mt-2 italic">
                              Clique para editar
                            </p>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>

                {/* Direita: Adicionar/Editar */}
                <div className="bg-blue-50 p-4 rounded-lg h-fit">
                  <h3 className="font-bold text-blue-800 mb-4 border-b border-blue-200 pb-2">
                    {editingModuleId ? "Editar Módulo" : "Adicionar Módulo"}
                  </h3>
                  <form onSubmit={handleSubmitModule}>
                    <div className="mb-3">
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                        Selecione Módulo
                      </label>
                      <div className="relative" ref={moduleSearchRef}>
                        <div className="flex items-center border rounded overflow-hidden focus-within:ring-2 focus-within:ring-blue-400 bg-white">
                          <Search className="w-4 h-4 text-gray-400 ml-2 shrink-0" />
                          <input
                            type="text"
                            placeholder={
                              addModuleForm.module_id
                                ? availableModules.find(
                                    (m) =>
                                      m.id ===
                                      parseInt(addModuleForm.module_id),
                                  )?.name || "Pesquisar módulo..."
                                : "Pesquisar módulo..."
                            }
                            value={moduleSearch}
                            onChange={(e) => {
                              setModuleSearch(e.target.value);
                              setShowModuleSuggestions(true);
                            }}
                            onFocus={() => setShowModuleSuggestions(true)}
                            className="w-full px-2 py-2 text-sm focus:outline-none"
                          />
                          {addModuleForm.module_id && (
                            <button
                              type="button"
                              onClick={() => {
                                setAddModuleForm({
                                  ...addModuleForm,
                                  module_id: "",
                                  total_hours: 25,
                                });
                                setModuleSearch("");
                              }}
                              className="p-1 mr-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        {showModuleSuggestions && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                            {availableModules.filter(
                              (m) =>
                                !moduleSearch.trim() ||
                                m.name
                                  .toLowerCase()
                                  .includes(moduleSearch.toLowerCase()) ||
                                m.area
                                  ?.toLowerCase()
                                  .includes(moduleSearch.toLowerCase()),
                            ).length === 0 ? (
                              <div className="px-3 py-2 text-sm text-gray-400">
                                Nenhum módulo encontrado
                              </div>
                            ) : (
                              availableModules
                                .filter(
                                  (m) =>
                                    !moduleSearch.trim() ||
                                    m.name
                                      .toLowerCase()
                                      .includes(moduleSearch.toLowerCase()) ||
                                    m.area
                                      ?.toLowerCase()
                                      .includes(moduleSearch.toLowerCase()),
                                )
                                .map((m) => (
                                  <button
                                    type="button"
                                    key={m.id}
                                    onClick={() => {
                                      setAddModuleForm({
                                        ...addModuleForm,
                                        module_id: String(m.id),
                                        total_hours:
                                          m.default_duration_hours || 25,
                                      });
                                      setModuleSearch("");
                                      setShowModuleSuggestions(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                                      String(m.id) ===
                                      String(addModuleForm.module_id)
                                        ? "bg-blue-50 text-blue-700 font-medium"
                                        : "text-gray-700"
                                    }`}
                                  >
                                    <div className="font-medium">{m.name}</div>
                                    <div className="text-xs text-gray-400">
                                      {m.area} — {m.default_duration_hours}h
                                    </div>
                                  </button>
                                ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                        Professor
                      </label>
                      <div className="relative" ref={trainerSearchRef}>
                        <div className="flex items-center border rounded overflow-hidden focus-within:ring-2 focus-within:ring-blue-400 bg-white">
                          <Search className="w-4 h-4 text-gray-400 ml-2 shrink-0" />
                          <input
                            type="text"
                            placeholder={
                              addModuleForm.trainer_id
                                ? trainers.find(
                                    (t) =>
                                      String(t.id) ===
                                      String(addModuleForm.trainer_id),
                                  )?.full_name || "Pesquisar professor..."
                                : "Pesquisar professor..."
                            }
                            value={trainerSearch}
                            onChange={(e) => {
                              setTrainerSearch(e.target.value);
                              setShowTrainerSuggestions(true);
                            }}
                            onFocus={() => setShowTrainerSuggestions(true)}
                            className="w-full px-2 py-2 text-sm focus:outline-none"
                          />
                          {addModuleForm.trainer_id && (
                            <button
                              type="button"
                              onClick={() => {
                                setAddModuleForm({
                                  ...addModuleForm,
                                  trainer_id: "",
                                });
                                setTrainerSearch("");
                              }}
                              className="p-1 mr-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        {showTrainerSuggestions && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                            {trainers.filter(
                              (t) =>
                                !trainerSearch.trim() ||
                                t.full_name
                                  .toLowerCase()
                                  .includes(trainerSearch.toLowerCase()) ||
                                t.email
                                  ?.toLowerCase()
                                  .includes(trainerSearch.toLowerCase()),
                            ).length === 0 ? (
                              <div className="px-3 py-2 text-sm text-gray-400">
                                Nenhum professor encontrado
                              </div>
                            ) : (
                              trainers
                                .filter(
                                  (t) =>
                                    !trainerSearch.trim() ||
                                    t.full_name
                                      .toLowerCase()
                                      .includes(trainerSearch.toLowerCase()) ||
                                    t.email
                                      ?.toLowerCase()
                                      .includes(trainerSearch.toLowerCase()),
                                )
                                .map((t) => (
                                  <button
                                    type="button"
                                    key={t.id}
                                    onClick={() => {
                                      setAddModuleForm({
                                        ...addModuleForm,
                                        trainer_id: String(t.id),
                                      });
                                      setTrainerSearch("");
                                      setShowTrainerSuggestions(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                                      String(t.id) ===
                                      String(addModuleForm.trainer_id)
                                        ? "bg-blue-50 text-blue-700 font-medium"
                                        : "text-gray-700"
                                    }`}
                                  >
                                    <div className="font-medium">
                                      {t.full_name}
                                    </div>
                                    {t.email && (
                                      <div className="text-xs text-gray-400">
                                        ({t.email})
                                      </div>
                                    )}
                                  </button>
                                ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                          Ordem
                        </label>
                        <input
                          type="number"
                          className="w-full border rounded p-2 text-sm"
                          value={addModuleForm.order}
                          onChange={(e) =>
                            setAddModuleForm({
                              ...addModuleForm,
                              order: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                          Horas
                        </label>
                        <input
                          type="number"
                          className="w-full border rounded p-2 text-sm bg-gray-100 cursor-not-allowed"
                          value={addModuleForm.total_hours}
                          readOnly
                          title="Duração definida no módulo"
                        />
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                        Sala (Opcional)
                      </label>
                      <div className="relative" ref={classroomSearchRef}>
                        <div className="flex items-center border rounded overflow-hidden focus-within:ring-2 focus-within:ring-blue-400 bg-white">
                          <Search className="w-4 h-4 text-gray-400 ml-2 shrink-0" />
                          <input
                            type="text"
                            placeholder={
                              addModuleForm.classroom_id
                                ? classrooms.find(
                                    (c) =>
                                      String(c.id) ===
                                      String(addModuleForm.classroom_id),
                                  )?.name || "Pesquisar sala..."
                                : "Pesquisar sala..."
                            }
                            value={classroomSearch}
                            onChange={(e) => {
                              setClassroomSearch(e.target.value);
                              setShowClassroomSuggestions(true);
                            }}
                            onFocus={() => setShowClassroomSuggestions(true)}
                            className="w-full px-2 py-2 text-sm focus:outline-none"
                          />
                          {addModuleForm.classroom_id && (
                            <button
                              type="button"
                              onClick={() => {
                                setAddModuleForm({
                                  ...addModuleForm,
                                  classroom_id: "",
                                });
                                setClassroomSearch("");
                              }}
                              className="p-1 mr-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        {showClassroomSuggestions && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                            {classrooms.filter(
                              (c) =>
                                !classroomSearch.trim() ||
                                c.name
                                  .toLowerCase()
                                  .includes(classroomSearch.toLowerCase()) ||
                                c.type
                                  ?.toLowerCase()
                                  .includes(classroomSearch.toLowerCase()),
                            ).length === 0 ? (
                              <div className="px-3 py-2 text-sm text-gray-400">
                                Nenhuma sala encontrada
                              </div>
                            ) : (
                              classrooms
                                .filter(
                                  (c) =>
                                    !classroomSearch.trim() ||
                                    c.name
                                      .toLowerCase()
                                      .includes(
                                        classroomSearch.toLowerCase(),
                                      ) ||
                                    c.type
                                      ?.toLowerCase()
                                      .includes(classroomSearch.toLowerCase()),
                                )
                                .map((c) => (
                                  <button
                                    type="button"
                                    key={c.id}
                                    onClick={() => {
                                      setAddModuleForm({
                                        ...addModuleForm,
                                        classroom_id: String(c.id),
                                      });
                                      setClassroomSearch("");
                                      setShowClassroomSuggestions(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                                      String(c.id) ===
                                      String(addModuleForm.classroom_id)
                                        ? "bg-blue-50 text-blue-700 font-medium"
                                        : "text-gray-700"
                                    }`}
                                  >
                                    <div className="font-medium">{c.name}</div>
                                    <div className="text-xs text-gray-400">
                                      {c.type}
                                    </div>
                                  </button>
                                ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition"
                      >
                        {editingModuleId
                          ? "Guardar Alterações"
                          : "Adicionar ao Curso"}
                      </button>
                      {editingModuleId && (
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-4 py-2 bg-gray-300 text-gray-700 font-bold rounded hover:bg-gray-400 transition"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal de Edição */}
      {editingCourse && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
              <h2 className="text-xl font-bold mb-4">
                Editar Curso #{editingCourse.id}
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
                    required
                    value={formData.area}
                    onChange={(e) =>
                      setFormData({ ...formData, area: e.target.value })
                    }
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div className="mb-4 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Início
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.start_date}
                      onChange={(e) =>
                        setFormData({ ...formData, start_date: e.target.value })
                      }
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Fim
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.end_date}
                      onChange={(e) =>
                        setFormData({ ...formData, end_date: e.target.value })
                      }
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Estado
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  >
                    <option value="planned">Planeado</option>
                    <option value="active">Ativo</option>
                    <option value="finished">Terminado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Tipo de Horário
                  </label>
                  <select
                    value={formData.schedule_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        schedule_type: e.target.value,
                      })
                    }
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  >
                    <option value="day">Diurno (08h-15h)</option>
                    <option value="night">Noturno (16h-23h)</option>
                  </select>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingCourse(null)}
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
        </ModalPortal>
      )}

      {/* Modal de Criação */}
      {isCreating && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
              <h2 className="text-xl font-bold mb-4">Novo Curso</h2>
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
                    required
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
                    Descrição
                  </label>
                  <textarea
                    value={createFormData.description}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        description: e.target.value,
                      })
                    }
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                <div className="mb-4 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Início
                    </label>
                    <input
                      type="date"
                      required
                      value={createFormData.start_date}
                      onChange={(e) =>
                        setCreateFormData({
                          ...createFormData,
                          start_date: e.target.value,
                        })
                      }
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Fim
                    </label>
                    <input
                      type="date"
                      required
                      value={createFormData.end_date}
                      onChange={(e) =>
                        setCreateFormData({
                          ...createFormData,
                          end_date: e.target.value,
                        })
                      }
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Estado
                  </label>
                  <select
                    value={createFormData.status}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        status: e.target.value,
                      })
                    }
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  >
                    <option value="planned">Planeado</option>
                    <option value="active">Ativo</option>
                    <option value="finished">Terminado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Tipo de Horário
                  </label>
                  <select
                    value={createFormData.schedule_type}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        schedule_type: e.target.value,
                      })
                    }
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  >
                    <option value="day">Diurno (08h-15h)</option>
                    <option value="night">Noturno (16h-23h)</option>
                  </select>
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
        </ModalPortal>
      )}

      {/* Modal de Confirmação de Eliminação */}
      {courseToDelete && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in">
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
                  Eliminar Curso
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Tens a certeza que queres eliminar o curso{" "}
                  <span className="font-bold text-gray-800">
                    {courseToDelete.name}
                  </span>
                  ? <br />
                  Esta ação é irreversível.
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => setCourseToDelete(null)}
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
        </ModalPortal>
      )}

      {/* Modal de Confirmação de Eliminação de Módulo */}
      {moduleToDelete && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm animate-scale-in">
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
                  Remover Módulo
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Tens a certeza que queres remover este módulo do curso? <br />
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
                    onClick={confirmDeleteModule}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none transition-colors"
                  >
                    Remover
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

export default AdminCourses;

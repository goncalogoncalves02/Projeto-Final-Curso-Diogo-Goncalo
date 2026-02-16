import { useState, useEffect, useRef, useCallback } from "react";
import api from "../../api/axios";
import {
  BookOpen,
  UserPlus,
  Trash2,
  User,
  Search,
  X,
  Loader2,
} from "lucide-react";
import Modal from "../../components/ui/Modal";

const AdminEnrollments = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [enrollments, setEnrollments] = useState([]);

  // Searchable course select
  const [courseSearch, setCourseSearch] = useState("");
  const [showCourseSuggestions, setShowCourseSuggestions] = useState(false);
  const courseSearchRef = useRef(null);

  // Search bar state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // Cache of user details for displaying enrolled users
  const [userCache, setUserCache] = useState({});

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInfo, setModalInfo] = useState({
    title: "",
    message: "",
    type: "info",
    onConfirm: null,
  });

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get("/courses/?limit=100");
        setCourses(res.data.items || res.data);
      } catch (err) {
        console.error("Failed to load courses", err);
      }
    };
    fetchCourses();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (courseSearchRef.current && !courseSearchRef.current.contains(e.target)) {
        setShowCourseSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCourseChange = (e) => {
    const courseId = e.target.value;
    setSelectedCourse(courseId);
    if (courseId) {
      fetchEnrollments(courseId);
    } else {
      setEnrollments([]);
    }
    // Reset search when changing course
    resetSearch();
  };

  const resetSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedUser(null);
    setShowDropdown(false);
  };

  const showModal = (title, message, type = "info", onConfirm = null) => {
    setModalInfo({ title, message, type, onConfirm });
    setModalOpen(true);
  };

  const fetchEnrollments = async (courseId) => {
    try {
      const response = await api.get(`/enrollments/?course_id=${courseId}`);
      setEnrollments(response.data);

      // Fetch user details for enrolled users
      const userIds = response.data.map((e) => e.user_id);
      const uniqueIds = [...new Set(userIds)];
      const missing = uniqueIds.filter((id) => !userCache[id]);

      if (missing.length > 0) {
        const userPromises = missing.map((id) =>
          api
            .get(`/users/${id}`)
            .then((res) => res.data)
            .catch(() => null),
        );
        const users = await Promise.all(userPromises);
        const newCache = { ...userCache };
        users.forEach((u) => {
          if (u) newCache[u.id] = u;
        });
        setUserCache(newCache);
      }
    } catch (err) {
      console.error(err);
      showModal("Erro", "Erro ao carregar inscrições.");
    }
  };

  // Debounced search for students
  const searchStudents = useCallback(
    (query) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!query || query.length < 2) {
        setSearchResults([]);
        setShowDropdown(false);
        setSearching(false);
        return;
      }

      setSearching(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const res = await api.get(
            `/users/?q=${encodeURIComponent(query)}&role=estudante&limit=10`,
          );
          const results = res.data.items || res.data;

          // Filter out already enrolled students
          const enrolledUserIds = new Set(enrollments.map((e) => e.user_id));
          const filtered = results.filter((u) => !enrolledUserIds.has(u.id));

          setSearchResults(filtered);
          setShowDropdown(true);
        } catch (err) {
          console.error("Search failed", err);
          setSearchResults([]);
        } finally {
          setSearching(false);
        }
      }, 300);
    },
    [enrollments],
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSelectedUser(null);
    searchStudents(value);
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSearchQuery(user.full_name || user.email);
    setShowDropdown(false);
    setSearchResults([]);
  };

  const handleClearSearch = () => {
    resetSearch();
  };

  const handleEnroll = async (e) => {
    e.preventDefault();
    if (!selectedCourse || !selectedUser) return;

    try {
      const payload = {
        course_id: parseInt(selectedCourse),
        user_id: selectedUser.id,
        enrollment_date: new Date().toISOString().split("T")[0],
        status: "active",
      };
      const response = await api.post("/enrollments/", payload);
      setEnrollments([...enrollments, response.data]);

      // Add user to cache
      setUserCache((prev) => ({ ...prev, [selectedUser.id]: selectedUser }));

      resetSearch();
      showModal("Sucesso", "Aluno inscrito com sucesso!", "success");
    } catch (err) {
      console.error(err);
      showModal(
        "Erro",
        "Erro ao inscrever aluno. Verifica se já está inscrito.",
        "error",
      );
    }
  };

  const confirmDelete = (id) => {
    showModal(
      "Remover Inscrição",
      "Tem a certeza que quer remover esta inscrição? Esta ação não pode ser desfeita.",
      "destructive",
      () => handleDelete(id),
    );
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/enrollments/${id}`);
      setEnrollments(enrollments.filter((e) => e.id !== id));
      showModal("Sucesso", "Inscrição removida com sucesso.", "success");
    } catch (err) {
      console.error(err);
      showModal("Erro", "Erro ao remover inscrição.", "error");
    }
  };

  const getUserName = (userId) => {
    const user = userCache[userId];
    return user ? `${user.full_name || user.email}` : `User #${userId}`;
  };

  const getUserEmail = (userId) => {
    const user = userCache[userId];
    return user ? user.email : "";
  };

  return (
    <div className="container mx-auto p-6">
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalInfo.title}
        type={modalInfo.type}
        onConfirm={modalInfo.onConfirm}
        confirmText={modalInfo.type === "destructive" ? "Remover" : "Confirmar"}
      >
        {modalInfo.message}
      </Modal>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <BookOpen className="mr-3 w-8 h-8 text-blue-600" />
          Gestão de Inscrições
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Select Course */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            1. Selecionar Curso
          </label>
          <div className="relative" ref={courseSearchRef}>
            <div className="flex items-center bg-gray-50 border border-gray-300 rounded overflow-hidden focus-within:ring-2 focus-within:ring-blue-400 focus-within:bg-white">
              <Search className="w-4 h-4 text-gray-400 ml-3 shrink-0" />
              <input
                type="text"
                placeholder={
                  selectedCourse
                    ? courses.find((c) => c.id === parseInt(selectedCourse))?.name || "Pesquisar curso..."
                    : "Pesquisar curso..."
                }
                value={courseSearch}
                onChange={(e) => {
                  setCourseSearch(e.target.value);
                  setShowCourseSuggestions(true);
                }}
                onFocus={() => setShowCourseSuggestions(true)}
                className="w-full px-3 py-3 text-sm text-gray-700 focus:outline-none bg-transparent"
              />
              {selectedCourse && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCourse("");
                    setEnrollments([]);
                    setCourseSearch("");
                    resetSearch();
                  }}
                  className="p-1 mr-2 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {showCourseSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                {courses.filter(
                  (c) =>
                    !courseSearch.trim() ||
                    c.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
                    c.area?.toLowerCase().includes(courseSearch.toLowerCase())
                ).length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-400">
                    Nenhum curso encontrado
                  </div>
                ) : (
                  courses
                    .filter(
                      (c) =>
                        !courseSearch.trim() ||
                        c.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
                        c.area?.toLowerCase().includes(courseSearch.toLowerCase())
                    )
                    .map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => {
                          setSelectedCourse(String(c.id));
                          fetchEnrollments(String(c.id));
                          setCourseSearch("");
                          setShowCourseSuggestions(false);
                          resetSearch();
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                          String(c.id) === String(selectedCourse)
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "text-gray-700"
                        }`}
                      >
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-gray-400">{c.area}</div>
                      </button>
                    ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Enroll New Student - Search Bar */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            2. Inscrever Novo Aluno
          </label>
          <form onSubmit={handleEnroll} className="flex gap-2">
            <div className="relative flex-1" ref={searchRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowDropdown(true);
                  }}
                  disabled={!selectedCourse}
                  placeholder="Pesquisar aluno por nome ou email..."
                  className="block w-full bg-gray-50 border border-gray-300 text-gray-700 py-3 pl-10 pr-10 rounded leading-tight focus:outline-none focus:bg-white focus:border-blue-500 disabled:opacity-50"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
                )}
                {!searching && searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              {showDropdown && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      Nenhum aluno encontrado.
                    </div>
                  ) : (
                    searchResults.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleSelectUser(user)}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.full_name || "Sem nome"}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user.email}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!selectedCourse || !selectedUser}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 flex items-center transition-colors"
            >
              <UserPlus className="w-5 h-5" />
            </button>
          </form>
          {selectedUser && (
            <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
              <User className="w-3 h-3" />
              Selecionado:{" "}
              <strong>{selectedUser.full_name || selectedUser.email}</strong>
            </p>
          )}
        </div>
      </div>

      {/* Enrollments List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">
            Alunos Inscritos{" "}
            {selectedCourse &&
            courses.find((c) => c.id === parseInt(selectedCourse))?.name
              ? `- ${courses.find((c) => c.id === parseInt(selectedCourse)).name}`
              : ""}
          </h3>
        </div>

        {!selectedCourse ? (
          <div className="p-8 text-center text-gray-500">
            Selecione um curso para ver as inscrições.
          </div>
        ) : enrollments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Ainda não há alunos inscritos neste curso.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Inscrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {enrollments.map((enrollment) => (
                <tr key={enrollment.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center">
                    <User className="w-4 h-4 mr-2 text-gray-400" />
                    {getUserName(enrollment.user_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {getUserEmail(enrollment.user_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {enrollment.enrollment_date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        enrollment.status === "active"
                          ? "bg-green-100 text-green-800"
                          : enrollment.status === "dropped"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {enrollment.status === "active"
                        ? "Ativo"
                        : enrollment.status === "completed"
                          ? "Concluído"
                          : enrollment.status === "dropped"
                            ? "Desistente"
                            : enrollment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => confirmDelete(enrollment.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminEnrollments;

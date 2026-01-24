import { useState, useEffect } from "react";
import api from "../../api/axios";
import { BookOpen, UserPlus, Trash2, User } from "lucide-react";
import Modal from "../../components/Modal";

const AdminEnrollments = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [enrollments, setEnrollments] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalInfo, setModalInfo] = useState({ title: "", message: "", type: "info", onConfirm: null });

  useEffect(() => {
    // Fetch courses and users for dropdowns
    const fetchData = async () => {
      try {
        const [coursesRes, usersRes] = await Promise.all([
          api.get("/courses/?limit=100"),
          api.get("/users/?limit=100")
        ]);
        setCourses(coursesRes.data);
        setUsers(usersRes.data.filter(u => u.role === 'estudante' || u.role === 'student' || true));
      } catch (err) {
        console.log(err);
        console.error("Failed to load initial data");
      }
    };
    fetchData();
  }, []);

  const handleCourseChange = (e) => {
    const courseId = e.target.value;
    setSelectedCourse(courseId);
    if (courseId) {
      fetchEnrollments(courseId);
    } else {
      setEnrollments([]);
    }
  };

  const showModal = (title, message, type = "info", onConfirm = null) => {
      setModalInfo({ title, message, type, onConfirm });
      setModalOpen(true);
  };

  const fetchEnrollments = async (courseId) => {
    // setLoading(true);
    try {
      const response = await api.get(`/enrollments/?course_id=${courseId}`);
      setEnrollments(response.data);
    } catch (err) {
      console.error(err);
      showModal("Erro", "Erro ao carregar inscrições.");
    } finally {
      // setLoading(false);
    }
  };

  const handleEnroll = async (e) => {
    e.preventDefault();
    if (!selectedCourse || !selectedUser) return;

    try {
      const payload = {
        course_id: parseInt(selectedCourse),
        user_id: parseInt(selectedUser),
        enrollment_date: new Date().toISOString().split('T')[0], // Today YYYY-MM-DD
        status: "active"
      };
      const response = await api.post("/enrollments/", payload);
      setEnrollments([...enrollments, response.data]);
      setSelectedUser(""); // Reset selection
      showModal("Sucesso", "Aluno inscrito com sucesso!", "success");
    } catch (err) {
      console.error(err);
      showModal("Erro", "Erro ao inscrever aluno. Verifica se já está inscrito.", "error");
    }
  };

  const confirmDelete = (id) => {
      showModal(
          "Remover Inscrição", 
          "Tem a certeza que quer remover esta inscrição? Esta ação não pode ser desfeita.", 
          "destructive",
          () => handleDelete(id)
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

  // Helper to find user name by ID
  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.full_name || user.email}` : `User #${userId}`;
  };

  const getUserEmail = (userId) => {
     const user = users.find(u => u.id === userId);
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
          <select
            value={selectedCourse}
            onChange={handleCourseChange}
            className="block w-full bg-gray-50 border border-gray-300 text-gray-700 py-3 px-4 rounded leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
          >
            <option value="">Selecione um curso...</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.area})
              </option>
            ))}
          </select>
        </div>

        {/* Enroll New Student Form */}
        <div className="bg-white p-6 rounded-lg shadow-md">
           <label className="block text-gray-700 text-sm font-bold mb-2">
            2. Inscrever Novo Aluno
          </label>
          <form onSubmit={handleEnroll} className="flex gap-2">
            <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                disabled={!selectedCourse}
                className="block w-full bg-gray-50 border border-gray-300 text-gray-700 py-3 px-4 rounded leading-tight focus:outline-none focus:bg-white focus:border-blue-500 disabled:opacity-50"
            >
                <option value="">Selecione um aluno para inscrever...</option>
                {users.map((u) => (
                <option key={u.id} value={u.id}>
                    {u.full_name ? `${u.full_name} (${u.email})` : u.email}
                </option>
                ))}
            </select>
            <button
                type="submit"
                disabled={!selectedCourse || !selectedUser}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 flex items-center"
            >
                <UserPlus className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Enrollments List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900">
                Alunos Inscritos {selectedCourse && courses.find(c => c.id === parseInt(selectedCourse))?.name ? `- ${courses.find(c => c.id === parseInt(selectedCourse)).name}` : ""}
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
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        enrollment.status === 'active' ? 'bg-green-100 text-green-800' : 
                        enrollment.status === 'dropped' ? 'bg-red-100 text-red-800' : 
                        'bg-gray-100 text-gray-800'
                    }`}>
                        {enrollment.status}
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

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Estados do form para editar e criar (inicializado com valores default)
  const initialFormState = {
    name: "",
    area: "",
    description: "",
    start_date: "",
    end_date: "",
    status: "planeado",
  };

  const [formData, setFormData] = useState(initialFormState);
  const [createFormData, setCreateFormData] = useState(initialFormState);

  useEffect(() => {
    const controller = new AbortController();

    const fetchCourses = async () => {
      try {
        const response = await api.get("/courses/");
        setCourses(response.data);
        setLoading(false);
      } catch (error) {
        if (error.name !== "CanceledError" && error.code !== "ERR_CANCELED") {
          setError("Erro ao carregar cursos.");
          setLoading(false);
        }
      }
    };

    fetchCourses();

    return () => {
      controller.abort();
    };
  }, []);

  const handleDeleteClick = (course) => {
    setCourseToDelete(course);
  };

  const confirmDelete = async () => {
    if (!courseToDelete) return;
    try {
      await api.delete(`/courses/${courseToDelete.id}`);
      setCourses(courses.filter((c) => c.id !== courseToDelete.id));
      setCourseToDelete(null);
    } catch {
      alert("Erro ao eliminar curso.");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/courses/", createFormData);
      setCourses([...courses, response.data]);
      setIsCreating(false);
      setCreateFormData(initialFormState);
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
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put(`/courses/${editingCourse.id}`, formData);
      setCourses(courses.map((c) => (c.id === editingCourse.id ? response.data : c)));
      setEditingCourse(null);
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
      order: 1
  });
  const [editingModuleId, setEditingModuleId] = useState(null); // null = creating, id = editing
  const [moduleToDelete, setModuleToDelete] = useState(null); // For delete confirmation modal

  const handleManageModulesClick = async (course) => {
      setManagingCourse(course);
      try {
          // Parallel fetch for dependencies
          const [cModulesRes, allModulesRes, usersRes, classroomsRes] = await Promise.all([
              api.get(`/courses/${course.id}/modules`),
              api.get("/modules/?limit=100"),
              api.get("/users/?limit=100"),
              api.get("/classrooms/?limit=100")
          ]);
          setCourseModules(cModulesRes.data);
          setAvailableModules(allModulesRes.data);
          setTrainers(usersRes.data.filter(u => u.role === 'professor'));
          setClassrooms(classroomsRes.data);
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
          order: cm.order || 1
      });
  };

  const handleCancelEdit = () => {
      setEditingModuleId(null);
      setAddModuleForm({
          module_id: "",
          trainer_id: "",
          classroom_id: "",
          total_hours: 25,
          order: courseModules.length + 1
      });
  };

  const handleSubmitModule = async (e) => {
      e.preventDefault();
      if (!managingCourse) return;
      
      try {
          const payload = {
              trainer_id: parseInt(addModuleForm.trainer_id),
              classroom_id: addModuleForm.classroom_id ? parseInt(addModuleForm.classroom_id) : null,
              total_hours: parseInt(addModuleForm.total_hours),
              order: parseInt(addModuleForm.order)
          };
          
          if (editingModuleId) {
              // UPDATE existing module
              const response = await api.put(`/courses/${managingCourse.id}/modules/${editingModuleId}`, payload);
              setCourseModules(courseModules.map(cm => cm.id === editingModuleId ? response.data : cm));
              setEditingModuleId(null);
          } else {
              // CREATE new module
              payload.module_id = parseInt(addModuleForm.module_id);
              const response = await api.post(`/courses/${managingCourse.id}/modules`, payload);
              setCourseModules([...courseModules, response.data]);
          }
          
          // Reset form
          setAddModuleForm({ module_id: "", trainer_id: "", classroom_id: "", total_hours: 25, order: courseModules.length + 2 });
      } catch (err) {
          console.error(err);
          alert(editingModuleId ? "Erro ao atualizar módulo." : "Erro ao adicionar módulo ao curso.");
      }
  };

  const handleDeleteModule = async (moduleId) => {
      // Show confirmation modal instead of native confirm
      setModuleToDelete(moduleId);
  };

  const confirmDeleteModule = async () => {
      if (!moduleToDelete || !managingCourse) return;
      try {
          await api.delete(`/courses/${managingCourse.id}/modules/${moduleToDelete}`);
          setCourseModules(courseModules.filter(cm => cm.id !== moduleToDelete));
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


  if (loading) return <div className="p-8 text-center">A carregar...</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Gestão de Cursos
        </h1>
        <div className="space-x-4">
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow"
          >
            + Novo Curso
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
                Nome do Curso
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Área
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Datas
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
            {courses.map((course) => (
              <tr key={course.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  #{course.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {course.name}
                  </div>
                  <div className="text-sm text-gray-500 truncate w-64">{course.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {course.area}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>Início: {course.start_date}</div>
                  <div>Fim: {course.end_date}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${
                        course.status === "ativo"
                          ? "bg-green-100 text-green-800"
                          : course.status === "terminado"
                          ? "bg-gray-100 text-gray-800"
                          : course.status === "cancelado"
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                  >
                    {course.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleManageModulesClick(course)}
                    className="text-teal-600 hover:text-teal-900 mr-4 font-bold"
                  >
                    Módulos
                  </button>
                  <button
                    onClick={() => handleEditClick(course)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteClick(course)}
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

      {/* Modal de Gestão de Módulos */}
      {managingCourse && (
          <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50">
              <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl h-5/6 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold">
                          Estrutura Curricular: {managingCourse.name}
                      </h2>
                      <button 
                          onClick={() => setManagingCourse(null)}
                          className="text-gray-500 hover:text-gray-700 text-2xl"
                      >
                          &times;
                      </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                       {/* Esquerda: Lista Atual */}
                       <div className="bg-gray-50 p-4 rounded-lg">
                           <h3 className="font-bold text-gray-700 mb-4 border-b pb-2">Módulos no Curso</h3>
                           {courseModules.length === 0 ? (
                               <p className="text-gray-500 italic">Nenhum módulo adicionado ainda.</p>
                           ) : (
                               <ul className="space-y-3">
                                   {courseModules.sort((a,b) => a.order - b.order).map(cm => (
                                       <li 
                                           key={cm.id} 
                                           onClick={() => handleModuleClick(cm)}
                                           className={`bg-white p-3 rounded shadow-sm border cursor-pointer hover:border-blue-400 transition-colors ${
                                               editingModuleId === cm.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                                           }`}
                                       >
                                             <div className="flex justify-between items-start">
                                                 <div>
                                                     <span className="font-bold text-blue-800">#{cm.order} - {cm.module?.name}</span>
                                                     <div className="text-xs text-gray-600 mt-1">
                                                         <span className="block">Professor: {cm.trainer?.full_name || "N/A"}</span>
                                                         <span className="block">Sala: {cm.classroom_id || "N/A"}</span>
                                                         <span className="block">Duração: {cm.total_hours}h</span>
                                                     </div>
                                                 </div>
                                                 <button 
                                                     onClick={(e) => { e.stopPropagation(); handleDeleteModule(cm.id); }}
                                                     className="text-red-500 hover:text-red-700 text-xs"
                                                     title="Remover módulo"
                                                 >
                                                     ✕
                                                 </button>
                                             </div>
                                             <p className="text-xs text-blue-500 mt-2 italic">Clique para editar</p>
                                        </li>
                                   ))}
                               </ul>
                           )}
                       </div>

                       {/* Direita: Adicionar/Editar */}
                       <div className="bg-blue-50 p-4 rounded-lg h-fit">
                           <h3 className="font-bold text-blue-800 mb-4 border-b border-blue-200 pb-2">
                               {editingModuleId ? 'Editar Módulo' : 'Adicionar Módulo'}
                           </h3>
                           <form onSubmit={handleSubmitModule}>
                               <div className="mb-3">
                                   <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Selecione Módulo</label>
                                   <select
                                       className="w-full border rounded p-2 text-sm"
                                       value={addModuleForm.module_id}
                                       onChange={e => {
                                           const selectedModule = availableModules.find(m => m.id === parseInt(e.target.value));
                                           setAddModuleForm({
                                               ...addModuleForm, 
                                               module_id: e.target.value,
                                               total_hours: selectedModule?.default_duration_hours || 25
                                           });
                                       }}
                                       required
                                   >
                                       <option value="">-- Escolher Módulo --</option>
                                       {availableModules.map(m => (
                                           <option key={m.id} value={m.id}>{m.name} ({m.area}) - {m.default_duration_hours}h</option>
                                       ))}
                                   </select>
                               </div>

                               <div className="mb-3">
                                   <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Professor</label>
                                   <select
                                       className="w-full border rounded p-2 text-sm"
                                       value={addModuleForm.trainer_id}
                                       onChange={e => setAddModuleForm({...addModuleForm, trainer_id: e.target.value})}
                                       required
                                   >
                                       <option value="">-- Escolher Professor --</option>
                                       {trainers.map(t => (
                                           <option key={t.id} value={t.id}>{t.full_name}</option>
                                       ))}
                                   </select>
                               </div>

                               <div className="grid grid-cols-2 gap-2 mb-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Ordem</label>
                                        <input
                                            type="number"
                                            className="w-full border rounded p-2 text-sm"
                                            value={addModuleForm.order}
                                            onChange={e => setAddModuleForm({...addModuleForm, order: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Horas</label>
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
                                   <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Sala (Opcional)</label>
                                   <select
                                       className="w-full border rounded p-2 text-sm"
                                       value={addModuleForm.classroom_id}
                                       onChange={e => setAddModuleForm({...addModuleForm, classroom_id: e.target.value})}
                                   >
                                       <option value="">-- Sem sala definida --</option>
                                       {classrooms.map(c => (
                                           <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                                       ))}
                                   </select>
                               </div>

                               <div className="flex gap-2">
                                   <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 transition">
                                       {editingModuleId ? 'Guardar Alterações' : 'Adicionar ao Curso'}
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
      )}

      {/* Modal de Edição */}
      {editingCourse && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl w-96">
            <h2 className="text-xl font-bold mb-4">
              Editar Curso #{editingCourse.id}
            </h2>
            <form onSubmit={handleUpdate}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Nome</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Área</label>
                <input
                  type="text"
                  required
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="mb-4 grid grid-cols-2 gap-2">
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Início</label>
                    <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                </div>
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Fim</label>
                    <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Estado</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="planeado">Planeado</option>
                  <option value="ativo">Ativo</option>
                  <option value="terminado">Terminado</option>
                  <option value="cancelado">Cancelado</option>
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
      )}

      {/* Modal de Criação */}
      {isCreating && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl w-96">
            <h2 className="text-xl font-bold mb-4">Novo Curso</h2>
            <form onSubmit={handleCreate}>
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Nome</label>
                <input
                  type="text"
                  required
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Área</label>
                <input
                  type="text"
                  required
                  value={createFormData.area}
                  onChange={(e) => setCreateFormData({ ...createFormData, area: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Descrição</label>
                <textarea
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>
              <div className="mb-4 grid grid-cols-2 gap-2">
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Início</label>
                    <input
                    type="date"
                    required
                    value={createFormData.start_date}
                    onChange={(e) => setCreateFormData({ ...createFormData, start_date: e.target.value })}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                </div>
                <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Fim</label>
                    <input
                    type="date"
                    required
                    value={createFormData.end_date}
                    onChange={(e) => setCreateFormData({ ...createFormData, end_date: e.target.value })}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Estado</label>
                <select
                  value={createFormData.status}
                  onChange={(e) => setCreateFormData({ ...createFormData, status: e.target.value })}
                  className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                >
                  <option value="planeado">Planeado</option>
                  <option value="ativo">Ativo</option>
                  <option value="terminado">Terminado</option>
                  <option value="cancelado">Cancelado</option>
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
      )}

      {/* Modal de Confirmação de Eliminação */}
      {courseToDelete && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96 transform transition-all scale-100">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Eliminar Curso</h3>
              <p className="text-sm text-gray-500 mb-6">
                Tens a certeza que queres eliminar o curso <span className="font-bold text-gray-800">{courseToDelete.name}</span>? <br />
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
      )}

      {/* Modal de Confirmação de Eliminação de Módulo */}
      {moduleToDelete && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96 transform transition-all scale-100">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Remover Módulo</h3>
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
      )}
    </div>
  );
};

export default AdminCourses;

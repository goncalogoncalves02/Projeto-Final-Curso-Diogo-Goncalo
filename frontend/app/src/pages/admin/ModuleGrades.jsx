import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import Modal from "../../components/Modal";

const DEFAULT_GRADE = { grade: "", comments: "" };

const AdminModuleGrades = () => {
    const [courses, setCourses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState("");
    
    // Data dependents on selected course
    const [enrollments, setEnrollments] = useState([]);
    const [courseModules, setCourseModules] = useState([]);
    
    // UI State
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalInfo, setModalInfo] = useState({ title: "", message: "", type: "info" });
    
    // Grade Editing State
    const [selectedEnrollment, setSelectedEnrollment] = useState(null);
    const [grades, setGrades] = useState({}); // Map: `moduleId` -> { grade: number, comments: string, id?: number }
    const [loadingGrades, setLoadingGrades] = useState(false);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await api.get("/courses/");
                setCourses(res.data.filter(c => c.status === 'ativo' || c.status === 'planeado')); // Show active courses
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    // When course changes, fetch enrollments and modules
    useEffect(() => {
        if (!selectedCourseId) {
            setEnrollments([]);
            setCourseModules([]);
            return;
        }

        const fetchData = async () => {
            setLoadingGrades(true);
            try {
                const [enrollRes, modulesRes] = await Promise.all([
                    api.get(`/enrollments/?course_id=${selectedCourseId}`),
                    api.get(`/courses/${selectedCourseId}/modules`)
                ]);
                setEnrollments(enrollRes.data);
                setCourseModules(modulesRes.data);
            } catch (err) {
                console.error(err);
                showModal("Erro", "Erro ao carregar dados da turma.", "error");
            } finally {
                setLoadingGrades(false);
            }
        };
        fetchData();
    }, [selectedCourseId]);

    const handleStudentSelect = async (enrollment) => {
        setSelectedEnrollment(enrollment);
        setLoadingGrades(true);
        try {
            // Fetch existing grades for this student
            const res = await api.get(`/module_grades/?enrollment_id=${enrollment.id}`);
            const gradesMap = {};
            res.data.forEach(g => {
                gradesMap[g.course_module_id] = { 
                    grade: g.grade, 
                    comments: g.comments, 
                    id: g.id 
                };
            });
            setGrades(gradesMap);
        } catch (err) {
            console.error(err);
            showModal("Erro", "Erro ao carregar notas do aluno.", "error");
        } finally {
            setLoadingGrades(false);
        }
    };

    const handleSaveGrade = async (courseModuleId, gradeValue, comments) => {
        if (!selectedEnrollment) return;
        
        const existingGrade = grades[courseModuleId];
        const payload = {
            grade: parseFloat(gradeValue),
            comments: comments,
            evaluated_at: new Date().toISOString().split('T')[0] // Today
        };

        try {
            let savedGrade;
            if (existingGrade?.id) {
                // Update
                const res = await api.put(`/module_grades/${existingGrade.id}`, payload);
                savedGrade = res.data;
            } else {
                // Create
                const createPayload = {
                    ...payload,
                    enrollment_id: selectedEnrollment.id,
                    course_module_id: courseModuleId
                };
                const res = await api.post("/module_grades/", createPayload);
                savedGrade = res.data;
            }

            // Update local state
            setGrades(prev => ({
                ...prev,
                [courseModuleId]: { ...savedGrade }
            }));
            
            // showModal("Sucesso", "Nota guardada.", "success"); // Maybe too intrusive? let's use a toast later or just green border
        } catch (err) {
            console.error(err);
            showModal("Erro", "Erro ao guardar nota.", "error");
        }
    };

    const showModal = (title, message, type = "info") => {
        setModalInfo({ title, message, type });
        setModalOpen(true);
    };

    if (loading) return <div className="p-8 text-center text-gray-500">A carregar turmas...</div>;

    return (
        <div className="container mx-auto p-6 h-screen flex flex-col">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Lançamento de Notas</h1>
            
            {/* Top Bar: Course Selection */}
            <div className="bg-white p-4 rounded-lg shadow mb-6 flex items-center space-x-4">
                <label className="font-bold text-gray-700">Curso:</label>
                <select 
                    className="border p-2 rounded w-64"
                    value={selectedCourseId}
                    onChange={(e) => {
                        setSelectedCourseId(e.target.value);
                        setSelectedEnrollment(null);
                    }}
                >
                    <option value="">-- Selecione um Curso --</option>
                    {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                
                {courseModules.length > 0 && (
                    <span className="text-sm text-gray-500 ml-4">
                        {courseModules.length} módulos | {enrollments.length} alunos inscritos
                    </span>
                )}
            </div>

            {selectedCourseId && (
                <div className="flex flex-1 gap-6 overflow-hidden">
                    {/* Left Sidebar: Students List */}
                    <div className="w-1/4 bg-white rounded-lg shadow overflow-y-auto">
                        <h3 className="p-4 font-bold border-b bg-gray-50 text-gray-700 sticky top-0">Alunos</h3>
                        <ul>
                            {enrollments.map(enroll => (
                                <li 
                                    key={enroll.id}
                                    onClick={() => handleStudentSelect(enroll)}
                                    className={`p-4 border-b hover:bg-blue-50 cursor-pointer transition-colors
                                        ${selectedEnrollment?.id === enroll.id ? "bg-blue-100 border-l-4 border-l-blue-600" : ""}
                                    `}
                                >
                                    <div className="font-medium text-gray-800">{enroll.user?.full_name}</div>
                                    <div className="text-xs text-gray-500 truncate">{enroll.user?.email}</div>
                                </li>
                            ))}
                            {enrollments.length === 0 && (
                                <li className="p-4 text-gray-500 italic text-center">Nenhum aluno inscrito.</li>
                            )}
                        </ul>
                    </div>

                    {/* Main Area: Grades Form */}
                    <div className="flex-1 bg-white rounded-lg shadow overflow-hidden flex flex-col">
                        {selectedEnrollment ? (
                            <>
                                <div className="p-6 border-b bg-gray-50">
                                    <h2 className="text-xl font-bold text-blue-900">
                                        Notas: {selectedEnrollment.user?.full_name}
                                    </h2>
                                    <p className="text-sm text-gray-600">ID Inscrição: #{selectedEnrollment.id}</p>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-6">
                                    {loadingGrades && !grades ? (
                                         <p className="text-center text-gray-500">A carregar notas...</p>
                                    ) : (
                                        <table className="min-w-full">
                                            <thead>
                                                <tr className="text-left text-gray-500 text-sm border-b">
                                                    <th className="pb-2 pl-2">Ordem</th>
                                                    <th className="pb-2">Módulo</th>
                                                    <th className="pb-2">Professor</th>
                                                    <th className="pb-2 w-24">Nota (0-20)</th>
                                                    <th className="pb-2">Comentário</th>
                                                    <th className="pb-2 w-24">Ação</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm">
                                                {courseModules.sort((a,b)=>a.order-b.order).map(cm => {
                                                    const currentGrade = grades[cm.id] || { grade: "", comments: "" };
                                                    return (
                                                        <GradeRow 
                                                            key={cm.id} 
                                                            courseModule={cm} 
                                                            initialData={currentGrade}
                                                            onSave={handleSaveGrade}
                                                        />
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </>
                        ) : (
                             <div className="flex-1 flex items-center justify-center text-gray-400 flex-col">
                                 <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                                 <p className="text-lg">Selecione um aluno à esquerda para lançar notas.</p>
                             </div>
                        )}
                    </div>
                </div>
            )}

            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={modalInfo.title}
                type={modalInfo.type}
            >
                {modalInfo.message}
            </Modal>
        </div>
    );
};

// Sub-component for individual row logic
const GradeRow = ({ courseModule, initialData, onSave }) => {
    const [grade, setGrade] = useState(initialData.grade);
    const [comments, setComments] = useState(initialData.comments || "");
    const [isDirty, setIsDirty] = useState(false);

    // Update local state if prop changes (e.g. switching student)
    useEffect(() => {
        setGrade(initialData.grade);
        setComments(initialData.comments || "");
        setIsDirty(false);
    }, [initialData]);

    const handleSave = () => {
        if (grade === "" || grade < 0 || grade > 20) return alert("Nota inválida");
        onSave(courseModule.id, grade, comments);
        setIsDirty(false);
    };

    return (
        <tr className="border-b last:border-0 hover:bg-gray-50">
            <td className="py-3 pl-2 font-bold text-gray-500">#{courseModule.order}</td>
            <td className="py-3 font-medium text-gray-800">{courseModule.module?.name}</td>
            <td className="py-3 text-gray-600">{courseModule.trainer?.full_name || "-"}</td>
            <td className="py-3">
                <input 
                    type="number" 
                    min="0" max="20" 
                    className="border rounded p-1 w-20 text-center font-bold"
                    value={grade}
                    onChange={(e) => {
                        setGrade(e.target.value);
                        setIsDirty(true);
                    }}
                />
            </td>
            <td className="py-3">
                <input 
                    type="text" 
                    className="border rounded p-1 w-full text-gray-700"
                    placeholder="Feedback..."
                    value={comments}
                    onChange={(e) => {
                        setComments(e.target.value);
                        setIsDirty(true);
                    }}
                />
            </td>
            <td className="py-3">
                {isDirty && (
                    <button 
                        onClick={handleSave}
                        className="bg-green-600 text-white px-3 py-1 mx-2 rounded text-xs hover:bg-green-700 shadow animate-pulse"
                    >
                        Guardar
                    </button>
                )}
                {!isDirty && initialData.grade !== undefined && initialData.grade !== "" && (
                     <span className="text-green-600 text-xs font-bold px-2">Gravado</span>
                )}
            </td>
        </tr>
    );
};

export default AdminModuleGrades;

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addWeeks } from "date-fns";
import { pt } from "date-fns/locale";
import api from "../../api/axios";
import { Wand2, Search, X, Trash2 } from "lucide-react";
import Modal from "../../components/ui/Modal";
import ModalPortal from "../../components/ui/ModalPortal";
import Pagination from "../../components/ui/Pagination";
import "react-big-calendar/lib/css/react-big-calendar.css";

// Configurar localização para Português
const locales = { pt: pt };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // Segunda
  getDay,
  locales,
});

// Mensagens em Português para o calendário
const messages = {
  today: "Hoje",
  previous: "Anterior",
  next: "Seguinte",
  month: "Mês",
  week: "Semana",
  day: "Dia",
  agenda: "Agenda",
  date: "Data",
  time: "Hora",
  event: "Aula",
  noEventsInRange: "Não há aulas neste período.",
  showMore: (total) => `+ ${total} mais`,
};

const Schedule = () => {
  // Estado principal
  const [lessons, setLessons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [courseModules, setCourseModules] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado do calendário (controlado)
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState("week");

  // Estado do modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState(null);

  // Estado do formulário
  const [formData, setFormData] = useState({
    course_id: "",
    course_module_id: "",
    classroom_id: "",
    date: "",
    start_time: "",
    end_time: "",
    notes: "",
    is_recurring: false,
    recurrence_weeks: 4,
  });

  // Info de horas do módulo
  const [hoursInfo, setHoursInfo] = useState(null);

  // Estado da tabela de horas dos módulos
  const [modulesHours, setModulesHours] = useState([]);
  const [modulesHoursLoading, setModulesHoursLoading] = useState(false);
  const [modulesHoursPage, setModulesHoursPage] = useState(1);
  const MODULES_PER_PAGE = 5;

  // Estado de geração automática
  const [selectedCourseFilter, setSelectedCourseFilter] = useState("");
  const [courseSearchQuery, setCourseSearchQuery] = useState("");
  const [showCourseSuggestions, setShowCourseSuggestions] = useState(false);
  const courseSearchRef = useRef(null);
  const [autoGenModalOpen, setAutoGenModalOpen] = useState(false);
  const [autoGenPreview, setAutoGenPreview] = useState(null);
  const [autoGenLoading, setAutoGenLoading] = useState(false);
  const [autoGenStep, setAutoGenStep] = useState("preview"); // "preview" | "done"

  // Estado do botão "Apagar Todas as Aulas"
  const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);

  // Fechar sugestões ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        courseSearchRef.current &&
        !courseSearchRef.current.contains(e.target)
      ) {
        setShowCourseSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cursos filtrados pela pesquisa
  const filteredCourses = useMemo(() => {
    if (!courseSearchQuery.trim()) return courses;
    const q = courseSearchQuery.toLowerCase();
    return courses.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.area?.toLowerCase().includes(q),
    );
  }, [courses, courseSearchQuery]);

  // Nome do curso selecionado
  const selectedCourseName = useMemo(() => {
    if (!selectedCourseFilter) return "";
    const c = courses.find(
      (c) => String(c.id) === String(selectedCourseFilter),
    );
    return c ? c.name : "";
  }, [courses, selectedCourseFilter]);

  // Carregar dados
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [lessonsRes, coursesRes, classroomsRes] = await Promise.all([
        api.get("/lessons/"),
        api.get("/courses/"),
        api.get("/classrooms/"),
      ]);
      setLessons(lessonsRes.data);
      setCourses(coursesRes.data.items || coursesRes.data);
      setClassrooms(classroomsRes.data.items || classroomsRes.data);
    } catch (err) {
      setError(
        "Erro ao carregar dados: " +
          (err.response?.data?.detail || err.message),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Carregar horas dos módulos quando curso é selecionado
  const fetchModulesHours = useCallback(async () => {
    if (!selectedCourseFilter) {
      setModulesHours([]);
      return;
    }
    try {
      setModulesHoursLoading(true);
      const res = await api.get(`/courses/${selectedCourseFilter}/modules-hours`);
      setModulesHours(res.data);
      setModulesHoursPage(1);
    } catch (err) {
      console.error("Erro ao carregar horas dos módulos:", err);
    } finally {
      setModulesHoursLoading(false);
    }
  }, [selectedCourseFilter]);

  useEffect(() => {
    fetchModulesHours();
  }, [fetchModulesHours]);

  // Paginação client-side da tabela de horas
  const paginatedModulesHours = useMemo(() => {
    const start = (modulesHoursPage - 1) * MODULES_PER_PAGE;
    return modulesHours.slice(start, start + MODULES_PER_PAGE);
  }, [modulesHours, modulesHoursPage]);

  const modulesHoursTotalPages = Math.ceil(modulesHours.length / MODULES_PER_PAGE);

  // Carregar módulos quando o curso é selecionado
  useEffect(() => {
    const loadModules = async () => {
      if (!formData.course_id) {
        setCourseModules([]);
        return;
      }
      try {
        const res = await api.get(`/courses/${formData.course_id}/modules`);
        setCourseModules(res.data);
      } catch (err) {
        console.error("Erro ao carregar módulos:", err);
      }
    };
    loadModules();
  }, [formData.course_id]);

  // Carregar info de horas quando módulo é selecionado
  useEffect(() => {
    const loadHoursInfo = async () => {
      if (!formData.course_module_id) {
        setHoursInfo(null);
        return;
      }
      try {
        const res = await api.get(
          `/lessons/hours-info/${formData.course_module_id}`,
        );
        setHoursInfo(res.data);
      } catch (err) {
        console.error("Erro ao carregar info de horas:", err);
      }
    };
    loadHoursInfo();
  }, [formData.course_module_id]);

  // Converter lessons para eventos do calendário (filtrar por curso selecionado)
  const events = useMemo(() => {
    const filtered = selectedCourseFilter
      ? lessons.filter(
          (l) => String(l.course_id) === String(selectedCourseFilter),
        )
      : lessons;

    return filtered.map((lesson) => {
      const startDate = new Date(`${lesson.date}T${lesson.start_time}`);
      const endDate = new Date(`${lesson.date}T${lesson.end_time}`);

      return {
        id: lesson.id,
        title: `${lesson.module_name} - ${lesson.trainer_name}`,
        start: startDate,
        end: endDate,
        resource: lesson,
      };
    });
  }, [lessons, selectedCourseFilter]);

  // Handlers
  const handleSelectSlot = ({ start }) => {
    // Quando clica num slot vazio, abre modal para criar
    setEditingLesson(null);
    setFormData({
      course_id: "",
      course_module_id: "",
      classroom_id: "",
      date: format(start, "yyyy-MM-dd"),
      start_time: format(start, "HH:mm"),
      end_time: format(addWeeks(start, 0), "HH:mm"), // Manter mesma hora
      notes: "",
      is_recurring: false,
      recurrence_weeks: 4,
    });
    setModalOpen(true);
  };

  const handleSelectEvent = (event) => {
    // Quando clica num evento, abre modal para editar
    const lesson = event.resource;
    setEditingLesson(lesson);

    // Encontrar o curso a partir do course_id da lesson
    setFormData({
      course_id: lesson.course_id || "",
      course_module_id: lesson.course_module_id || "",
      classroom_id: lesson.classroom_id || "",
      date: lesson.date,
      start_time: lesson.start_time?.substring(0, 5) || "",
      end_time: lesson.end_time?.substring(0, 5) || "",
      notes: lesson.notes || "",
      is_recurring: false,
      recurrence_weeks: 4,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      if (editingLesson) {
        // Atualizar
        await api.put(`/lessons/${editingLesson.id}`, {
          date: formData.date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          classroom_id: formData.classroom_id
            ? parseInt(formData.classroom_id)
            : null,
          notes: formData.notes,
        });
      } else {
        // Criar
        await api.post("/lessons/", {
          course_module_id: parseInt(formData.course_module_id),
          classroom_id: formData.classroom_id
            ? parseInt(formData.classroom_id)
            : null,
          date: formData.date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          notes: formData.notes,
          is_recurring: formData.is_recurring,
          recurrence_weeks: formData.is_recurring
            ? parseInt(formData.recurrence_weeks)
            : null,
        });
      }

      setModalOpen(false);
      fetchData();
      fetchModulesHours();
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === "object" && detail.errors) {
        // Erros de conflito
        const errorMessages = detail.errors.map((e) => e.message).join("\n");
        setError(`${detail.message}\n${errorMessages}`);
      } else {
        setError(detail || "Erro ao guardar aula");
      }
    }
  };

  const handleDeleteClick = () => {
    setLessonToDelete(editingLesson);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!lessonToDelete) return;

    setDeleting(true);
    try {
      await api.delete(`/lessons/${lessonToDelete.id}`);
      setDeleteModalOpen(false);
      setModalOpen(false);
      fetchData();
      fetchModulesHours();
    } catch (err) {
      setError(
        "Erro ao eliminar: " + (err.response?.data?.detail || err.message),
      );
    } finally {
      setDeleting(false);
    }
  };

  // ===== Geração Automática de Horário =====
  const handleAutoGenPreview = async () => {
    if (!selectedCourseFilter) return;
    try {
      setAutoGenLoading(true);
      setAutoGenStep("preview");
      const res = await api.post(
        `/schedule-generator/${selectedCourseFilter}/preview`,
      );
      setAutoGenPreview(res.data);
      setAutoGenModalOpen(true);
    } catch (err) {
      alert(err.response?.data?.detail || "Erro ao pré-visualizar horário.");
    } finally {
      setAutoGenLoading(false);
    }
  };

  const handleAutoGenConfirm = async () => {
    if (!selectedCourseFilter) return;
    try {
      setAutoGenLoading(true);
      const res = await api.post(
        `/schedule-generator/${selectedCourseFilter}/generate`,
      );
      setAutoGenPreview(res.data);
      setAutoGenStep("done");
      fetchData();
      fetchModulesHours();
    } catch (err) {
      alert(err.response?.data?.detail || "Erro ao gerar horário.");
    } finally {
      setAutoGenLoading(false);
    }
  };

  // ===== Apagar todas as aulas do curso =====
  const handleDeleteAllLessons = async () => {
    if (!selectedCourseFilter) return;
    try {
      setDeleteAllLoading(true);
      await api.delete(`/lessons/by-course/${selectedCourseFilter}`);
      setDeleteAllModalOpen(false);
      fetchData();
      fetchModulesHours();
    } catch (err) {
      alert(err.response?.data?.detail || "Erro ao apagar aulas.");
    } finally {
      setDeleteAllLoading(false);
    }
  };

  // Estilos dos eventos (laranja = passada, azul = futura/a decorrer)
  const eventStyleGetter = (event) => {
    const now = new Date();
    const isPast = event.end < now;

    const color = isPast
      ? { bg: "#E8873B", border: "#C96A22" }   // laranja (passada)
      : { bg: "#3B82F6", border: "#2563EB" };   // azul (futura/a decorrer)

    return {
      style: {
        backgroundColor: color.bg,
        borderLeft: `4px solid ${color.border}`,
        borderRadius: "4px",
        color: "white",
        fontSize: "11px",
        padding: "2px 4px",
        overflow: "hidden",
      },
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Gestão de Horários
          </h1>
          <p className="text-gray-600">
            Clique num slot vazio para adicionar uma aula ou num evento
            existente para editar.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Searchbar de Cursos */}
          <div className="relative" ref={courseSearchRef}>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-400 bg-white">
              <Search className="w-4 h-4 text-gray-400 ml-3 shrink-0" />
              <input
                type="text"
                placeholder={
                  selectedCourseFilter
                    ? selectedCourseName
                    : "Pesquisar curso..."
                }
                value={courseSearchQuery}
                onChange={(e) => {
                  setCourseSearchQuery(e.target.value);
                  setShowCourseSuggestions(true);
                }}
                onFocus={() => setShowCourseSuggestions(true)}
                className="px-2 py-2 text-sm focus:outline-none w-56"
              />
              {selectedCourseFilter && (
                <button
                  onClick={() => {
                    setSelectedCourseFilter("");
                    setCourseSearchQuery("");
                  }}
                  className="p-1.5 mr-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Limpar filtro"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {/* Dropdown de sugestões */}
            {showCourseSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                {filteredCourses.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-400">
                    Nenhum curso encontrado
                  </div>
                ) : (
                  filteredCourses.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCourseFilter(String(c.id));
                        setCourseSearchQuery("");
                        setShowCourseSuggestions(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                        String(c.id) === String(selectedCourseFilter)
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
          {selectedCourseFilter && (
            <>
              <button
                onClick={handleAutoGenPreview}
                disabled={autoGenLoading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-sm hover:shadow-md transition-all duration-200 font-medium text-sm disabled:opacity-50"
              >
                <Wand2 className="w-4 h-4" />
                {autoGenLoading ? "A processar..." : "Auto-Gerar"}
              </button>
              <button
                onClick={() => setDeleteAllModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-sm hover:shadow-md transition-all duration-200 font-medium text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Apagar Todas
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 whitespace-pre-line">
          {error}
        </div>
      )}

      <div
        className="bg-white rounded-xl shadow-lg p-6 overflow-x-auto"
        style={{ height: "75vh" }}
      >
        <div style={{ minWidth: "800px", height: "100%" }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          messages={messages}
          culture="pt"
          // Estados controlados para navegação funcionar
          date={currentDate}
          onNavigate={(date) => setCurrentDate(date)}
          view={currentView}
          onView={(view) => setCurrentView(view)}
          views={["month", "week", "day", "agenda"]}
          // Formato 24h
          formats={{
            timeGutterFormat: "HH:mm",
            eventTimeRangeFormat: ({ start, end }) =>
              `${format(start, "HH:mm", { locale: pt })} - ${format(end, "HH:mm", { locale: pt })}`,
            agendaTimeRangeFormat: ({ start, end }) =>
              `${format(start, "HH:mm", { locale: pt })} - ${format(end, "HH:mm", { locale: pt })}`,
            dayHeaderFormat: (date) =>
              format(date, "EEEE, d MMMM", { locale: pt }),
          }}
          step={30}
          timeslots={2}
          min={new Date(2020, 0, 1, 7, 0)} // 07:00
          max={new Date(2020, 0, 1, 23, 59)} // 23:00
          style={{ height: "100%" }}
        />
        </div>
      </div>

      {/* Tabela de Horas dos Módulos */}
      {selectedCourseFilter && (
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Horas por Módulo — {selectedCourseName}
          </h2>

          {modulesHoursLoading ? (
            <div className="flex items-center justify-center h-24">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : modulesHours.length === 0 ? (
            <p className="text-gray-500 text-sm">
              Este curso não tem módulos configurados.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-600">
                      <th className="px-4 py-3 font-semibold">#</th>
                      <th className="px-4 py-3 font-semibold">Módulo</th>
                      <th className="px-4 py-3 font-semibold">Professor</th>
                      <th className="px-4 py-3 font-semibold text-center">Total (h)</th>
                      <th className="px-4 py-3 font-semibold text-center">Agendado (h)</th>
                      <th className="px-4 py-3 font-semibold text-center">Restante (h)</th>
                      <th className="px-4 py-3 font-semibold w-40">Progresso</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedModulesHours.map((mod) => {
                      const total = mod.total_hours || 0;
                      const pct = total > 0 ? Math.min(100, Math.round((mod.scheduled_hours / total) * 100)) : 0;
                      const barColor = pct >= 100 ? "bg-green-500" : pct >= 60 ? "bg-blue-500" : pct >= 30 ? "bg-yellow-500" : "bg-red-400";

                      return (
                        <tr key={mod.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-gray-500">{mod.order}</td>
                          <td className="px-4 py-3 font-medium text-gray-800">{mod.module_name}</td>
                          <td className="px-4 py-3 text-gray-600">{mod.trainer_name}</td>
                          <td className="px-4 py-3 text-center">{mod.total_hours}</td>
                          <td className="px-4 py-3 text-center">{mod.scheduled_hours}</td>
                          <td className="px-4 py-3 text-center font-semibold">
                            <span className={mod.remaining_hours === 0 ? "text-green-600" : mod.remaining_hours <= 6 ? "text-yellow-600" : "text-red-600"}>
                              {mod.remaining_hours}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                                <div
                                  className={`h-2.5 rounded-full ${barColor} transition-all`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 w-10 text-right">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={modulesHoursPage}
                totalPages={modulesHoursTotalPages}
                totalItems={modulesHours.length}
                itemsPerPage={MODULES_PER_PAGE}
                onPageChange={setModulesHoursPage}
              />
            </>
          )}
        </div>
      )}

      {/* Modal de Criar/Editar */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingLesson ? "Editar Aula" : "Nova Aula"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm whitespace-pre-line">
              {error}
            </div>
          )}

          {!editingLesson && (
            <>
              {/* Seleção de Curso */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Curso *
                </label>
                <select
                  value={formData.course_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      course_id: e.target.value,
                      course_module_id: "",
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecionar curso...</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Seleção de Módulo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Módulo *
                </label>
                <select
                  value={formData.course_module_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      course_module_id: e.target.value,
                    })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!formData.course_id}
                >
                  <option value="">Selecionar módulo...</option>
                  {courseModules.map((cm) => (
                    <option key={cm.id} value={cm.id}>
                      {cm.module?.name || `Módulo ${cm.module_id}`} (
                      {cm.total_hours}h)
                    </option>
                  ))}
                </select>
              </div>

              {/* Info de Horas */}
              {hoursInfo && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <strong>Horas do Módulo:</strong> {hoursInfo.total_hours}h
                    <span className="mx-2">|</span>
                    <strong>Agendado:</strong> {hoursInfo.scheduled_hours}h
                    <span className="mx-2">|</span>
                    <strong>Restante:</strong> {hoursInfo.remaining_hours}h
                  </div>
                  {hoursInfo.remaining_hours < 1 && (
                    <div className="mt-1 text-red-600 font-medium text-sm">
                      ⚠️ Este módulo já atingiu o limite de horas!
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Data */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora Início *
              </label>
              <select
                value={formData.start_time}
                onChange={(e) =>
                  setFormData({ ...formData, start_time: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Selecionar...</option>
                {Array.from({ length: 33 }, (_, i) => {
                  const hour = Math.floor(i / 2) + 7;
                  const minute = (i % 2) * 30;
                  const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
                  return (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora Fim *
              </label>
              <select
                value={formData.end_time}
                onChange={(e) =>
                  setFormData({ ...formData, end_time: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Selecionar...</option>
                {Array.from({ length: 33 }, (_, i) => {
                  const hour = Math.floor(i / 2) + 7;
                  const minute = (i % 2) * 30;
                  const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
                  return (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Seleção de Sala */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sala (substituir padrão do módulo)
            </label>
            <select
              value={formData.classroom_id}
              onChange={(e) =>
                setFormData({ ...formData, classroom_id: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Usar sala padrão do módulo</option>
              {classrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name} ({classroom.type})
                </option>
              ))}
            </select>
          </div>

          {/* Recorrência (só para criar) */}
          {!editingLesson && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="is_recurring"
                  checked={formData.is_recurring}
                  onChange={(e) =>
                    setFormData({ ...formData, is_recurring: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="is_recurring"
                  className="ml-2 text-sm font-medium text-gray-700"
                >
                  Aula recorrente (repetir nas próximas semanas)
                </label>
              </div>

              {formData.is_recurring && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Repetir por quantas semanas?
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="20"
                    value={formData.recurrence_weeks}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recurrence_weeks: e.target.value,
                      })
                    }
                    className="w-24 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">semanas</span>
                </div>
              )}
            </div>
          )}

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas / Sumário
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Conteúdo da aula, observações..."
            />
          </div>

          {/* Botões */}
          <div className="flex justify-between pt-4 border-t">
            {editingLesson && (
              <button
                type="button"
                onClick={handleDeleteClick}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                Eliminar
              </button>
            )}
            <div className="flex gap-2 ml-auto">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {editingLesson ? "Guardar" : "Criar Aula"}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmação de Delete */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Eliminar Aula"
      >
        <div className="text-center">
          <p className="text-gray-600 mb-6">
            Tem a certeza que deseja eliminar esta aula?
            <br />
            <strong className="text-red-600">
              Esta ação não pode ser desfeita.
            </strong>
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
            >
              {deleting ? "A eliminar..." : "Eliminar"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Auto-Geração de Horário */}
      {autoGenModalOpen && autoGenPreview && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-scale-in">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  {autoGenStep === "done"
                    ? "✅ Horário Gerado"
                    : "Pré-visualização do Horário"}
                </h2>
                <button
                  onClick={() => {
                    setAutoGenModalOpen(false);
                    setAutoGenPreview(null);
                    setAutoGenStep("preview");
                  }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Info do Curso */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm">
                  <strong>Curso:</strong> {autoGenPreview.course_name}
                </p>
                <p className="text-sm">
                  <strong>Tipo:</strong> {autoGenPreview.schedule_label}
                </p>
                <p className="text-sm">
                  <strong>Aulas geradas:</strong>{" "}
                  {autoGenPreview.lessons_created} (
                  {autoGenPreview.total_hours_scheduled}h)
                </p>
              </div>

              {/* Resumo dos Módulos */}
              <div className="flex-1 overflow-y-auto mb-4">
                <h3 className="text-sm font-bold text-gray-700 mb-2">
                  Resumo por Módulo
                </h3>
                <div className="space-y-2">
                  {autoGenPreview.modules_summary?.map((mod, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg border text-sm ${
                        mod.status === "complete"
                          ? "bg-green-50 border-green-200"
                          : mod.status === "partial"
                            ? "bg-yellow-50 border-yellow-200"
                            : "bg-red-50 border-red-200"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{mod.module_name}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            mod.status === "complete"
                              ? "bg-green-100 text-green-700"
                              : mod.status === "partial"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {mod.status === "complete"
                            ? "Completo"
                            : mod.status === "partial"
                              ? "Parcial"
                              : "Sem slots"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {mod.hours_total}h total | Já agendadas:{" "}
                        {mod.hours_already_scheduled}h | Novas: {mod.hours_new}h
                        | Faltam: {mod.hours_remaining}h
                      </p>
                    </div>
                  ))}
                </div>

                {/* Warnings */}
                {autoGenPreview.warnings?.length > 0 && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <h4 className="text-sm font-bold text-amber-700 mb-1">
                      ⚠️ Avisos
                    </h4>
                    <ul className="text-xs text-amber-600 space-y-1">
                      {autoGenPreview.warnings.map((w, i) => (
                        <li key={i}>• {w}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Preview das aulas (só no step preview) */}
                {autoGenStep === "preview" &&
                  autoGenPreview.lessons_preview?.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-bold text-gray-700 mb-2">
                        Aulas a criar ({autoGenPreview.lessons_preview.length})
                      </h3>
                      <div className="max-h-48 overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-2 py-1 text-left">Data</th>
                              <th className="px-2 py-1 text-left">Horário</th>
                              <th className="px-2 py-1 text-left">Módulo</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {autoGenPreview.lessons_preview.map((l, i) => (
                              <tr key={i} className="hover:bg-gray-50">
                                <td className="px-2 py-1">{l.date}</td>
                                <td className="px-2 py-1">
                                  {l.start_time} - {l.end_time}
                                </td>
                                <td className="px-2 py-1">{l.module_name}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setAutoGenModalOpen(false);
                    setAutoGenPreview(null);
                    setAutoGenStep("preview");
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                >
                  {autoGenStep === "done" ? "Fechar" : "Cancelar"}
                </button>
                {autoGenStep === "preview" && (
                  <button
                    onClick={handleAutoGenConfirm}
                    disabled={
                      autoGenLoading || autoGenPreview.lessons_created === 0
                    }
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                  >
                    {autoGenLoading
                      ? "A gerar..."
                      : `Confirmar (${autoGenPreview.lessons_created} aulas)`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal de Confirmação - Apagar Todas as Aulas */}
      {deleteAllModalOpen && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Apagar Todas as Aulas
              </h2>
              <p className="text-gray-600 mb-2">
                Tem a certeza que deseja apagar <strong>todas as aulas</strong> do curso:
              </p>
              <p className="font-semibold text-gray-800 mb-4">{selectedCourseName}</p>
              <p className="text-red-600 text-sm font-medium mb-6">
                Esta ação não pode ser desfeita.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteAllModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteAllLessons}
                  disabled={deleteAllLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  {deleteAllLoading ? "A apagar..." : "Apagar Todas"}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default Schedule;

import {
  useState,
  useEffect,
  useCallback as useCallbackReact,
  useMemo,
} from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addWeeks } from "date-fns";
import { pt } from "date-fns/locale";
import api from "../../api/axios";
import Modal from "../../components/Modal";
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

  // Carregar dados
  const fetchData = useCallbackReact(async () => {
    try {
      setLoading(true);
      const [lessonsRes, coursesRes, classroomsRes] = await Promise.all([
        api.get("/lessons/"),
        api.get("/courses/"),
        api.get("/classrooms/"),
      ]);
      setLessons(lessonsRes.data);
      setCourses(coursesRes.data);
      setClassrooms(classroomsRes.data);
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

  // Converter lessons para eventos do calendário
  const events = useMemo(() => {
    return lessons.map((lesson) => {
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
  }, [lessons]);

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
    } catch (err) {
      setError(
        "Erro ao eliminar: " + (err.response?.data?.detail || err.message),
      );
    } finally {
      setDeleting(false);
    }
  };

  // Estilos dos eventos
  const eventStyleGetter = (event) => {
    const colors = [
      { bg: "#3B82F6", border: "#2563EB" }, // blue
      { bg: "#10B981", border: "#059669" }, // green
      { bg: "#F59E0B", border: "#D97706" }, // amber
      { bg: "#EF4444", border: "#DC2626" }, // red
      { bg: "#8B5CF6", border: "#7C3AED" }, // purple
      { bg: "#EC4899", border: "#DB2777" }, // pink
    ];

    // Usar o module_id para determinar a cor
    const colorIndex = (event.resource.module_id || 0) % colors.length;
    const color = colors[colorIndex];

    return {
      style: {
        backgroundColor: color.bg,
        borderLeft: `4px solid ${color.border}`,
        borderRadius: "4px",
        color: "white",
        fontSize: "12px",
        padding: "2px 6px",
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestão de Horários</h1>
        <p className="text-gray-600">
          Clique num slot vazio para adicionar uma aula ou num evento existente
          para editar.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 whitespace-pre-line">
          {error}
        </div>
      )}

      <div
        className="bg-white rounded-xl shadow-lg p-6"
        style={{ height: "75vh" }}
      >
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
          max={new Date(2020, 0, 1, 23, 0)} // 23:00
          style={{ height: "100%" }}
        />
      </div>

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
    </div>
  );
};

export default Schedule;

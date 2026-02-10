import { useState, useEffect, useMemo } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import {
  format,
  parse,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  getDay,
} from "date-fns";
import { pt } from "date-fns/locale";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import Pagination from "../components/Pagination";
import "react-big-calendar/lib/css/react-big-calendar.css";

// Configurar localização para Português
const locales = { pt: pt };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

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

const ScheduleView = () => {
  const { user } = useAuth();

  // Estado de consulta
  const [viewMode, setViewMode] = useState("course"); // course, trainer, classroom
  const [selectedId, setSelectedId] = useState("");

  // Dados de referência
  const [courses, setCourses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [classrooms, setClassrooms] = useState([]);

  // Resultados
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estado do calendário (controlado)
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState("week");

  // Verificar perfil do utilizador
  const isStudent = user?.role === "estudante" && !user?.is_superuser;
  const isProfessor = user?.role === "professor" && !user?.is_superuser;
  const isAdmin = user?.is_superuser;

  // Para professores: marca se está a ver todas ou filtrado por turma
  const [showingAll, setShowingAll] = useState(true);

  // Paginação da tabela de aulas
  const [tablePage, setTablePage] = useState(1);
  const TABLE_ITEMS_PER_PAGE = 10;

  // Carregar dados de referência e aulas iniciais
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // PROFESSOR: Carregar seus cursos e aulas automaticamente
        if (isProfessor) {
          const [myCoursesRes, myScheduleRes] = await Promise.all([
            api.get("/lessons/my-courses"),
            api.get("/lessons/my-schedule"),
          ]);
          setCourses(myCoursesRes.data);
          setLessons(myScheduleRes.data);
          setShowingAll(true);
          // Professor não precisa de trainers e classrooms
          setTrainers([]);
          setClassrooms([]);
        }
        // ESTUDANTE: Carregar cursos inscritos
        else if (isStudent) {
          const enrollmentsRes = await api.get("/enrollments/");
          const enrolledIds = enrollmentsRes.data
            .filter((e) => e.status === "active")
            .map((e) => e.course_id);

          const coursesRes = await api.get("/courses/");
          const coursesData = coursesRes.data.items || coursesRes.data;
          const filteredCourses = coursesData.filter((c) =>
            enrolledIds.includes(c.id),
          );
          setCourses(filteredCourses);
          setTrainers([]);
          setClassrooms([]);
        }
        // ADMIN: Carregar tudo
        else if (isAdmin) {
          const [coursesRes, usersRes, classroomsRes] = await Promise.all([
            api.get("/courses/"),
            api.get("/users/"),
            api.get("/classrooms/"),
          ]);
          setCourses(coursesRes.data.items || coursesRes.data);
          const usersData = usersRes.data.items || usersRes.data;
          const profs = usersData.filter((u) => u.role === "professor");
          setTrainers(profs);
          setClassrooms(classroomsRes.data.items || classroomsRes.data);
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
        setError(
          "Erro ao carregar dados: " +
            (err.response?.data?.detail || err.message),
        );
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [isProfessor, isStudent, isAdmin]);

  // Carregar aulas quando filtros mudam
  useEffect(() => {
    setTablePage(1); // Reset pagination when filters change
    const loadLessons = async () => {
      // Para professor: se não tem turma selecionada, carregar todas
      if (isProfessor) {
        if (!selectedId) {
          // Recarregar todas as aulas
          try {
            setLoading(true);
            const res = await api.get("/lessons/my-schedule");
            setLessons(res.data);
            setShowingAll(true);
          } catch (err) {
            console.error("Erro ao carregar horário:", err);
            setError("Erro ao carregar horário");
          } finally {
            setLoading(false);
          }
          return;
        }

        // Filtrar por turma selecionada
        try {
          setLoading(true);
          const res = await api.get(
            `/lessons/my-schedule?course_id=${selectedId}`,
          );
          setLessons(res.data);
          setShowingAll(false);
        } catch (err) {
          console.error("Erro ao carregar horário:", err);
          setError("Erro ao carregar horário");
        } finally {
          setLoading(false);
        }
        return;
      }

      // Para estudante e admin: precisa de seleção
      if (!selectedId) {
        setLessons([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let url = "";

        switch (viewMode) {
          case "course":
            url = `/lessons/by-course/${selectedId}`;
            break;
          case "trainer":
            url = `/lessons/by-trainer/${selectedId}`;
            break;
          case "classroom":
            url = `/lessons/by-classroom/${selectedId}`;
            break;
          default:
            return;
        }

        const res = await api.get(url);
        setLessons(res.data);
      } catch (err) {
        setError(
          "Erro ao carregar horário: " +
            (err.response?.data?.detail || err.message),
        );
      } finally {
        setLoading(false);
      }
    };

    loadLessons();
  }, [viewMode, selectedId, isProfessor]);

  // Converter lessons para eventos do calendário
  const events = useMemo(() => {
    return lessons.map((lesson) => {
      const startDateTime = new Date(`${lesson.date}T${lesson.start_time}`);
      const endDateTime = new Date(`${lesson.date}T${lesson.end_time}`);

      let title = "";
      switch (viewMode) {
        case "course":
          title = `${lesson.module_name} - ${lesson.trainer_name}`;
          break;
        case "trainer":
          title = `${lesson.course_name}: ${lesson.module_name}`;
          break;
        case "classroom":
          title = `${lesson.course_name} - ${lesson.module_name}`;
          break;
        default:
          title = lesson.module_name;
      }

      return {
        id: lesson.id,
        title,
        start: startDateTime,
        end: endDateTime,
        resource: lesson,
      };
    });
  }, [lessons, viewMode]);

  // Estilos dos eventos
  const eventStyleGetter = (event) => {
    const colors = [
      { bg: "#3B82F6", border: "#2563EB" },
      { bg: "#10B981", border: "#059669" },
      { bg: "#F59E0B", border: "#D97706" },
      { bg: "#EF4444", border: "#DC2626" },
      { bg: "#8B5CF6", border: "#7C3AED" },
      { bg: "#EC4899", border: "#DB2777" },
    ];

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

  // Obter opções do select baseado no modo
  const getSelectOptions = () => {
    switch (viewMode) {
      case "course":
        return courses.map((c) => ({ id: c.id, name: c.name }));
      case "trainer":
        return trainers.map((t) => ({
          id: t.id,
          name: t.full_name || t.email,
        }));
      case "classroom":
        return classrooms.map((c) => ({
          id: c.id,
          name: `${c.name} (${c.type})`,
        }));
      default:
        return [];
    }
  };

  const getPlaceholder = () => {
    switch (viewMode) {
      case "course":
        return "Selecionar turma/curso...";
      case "trainer":
        return "Selecionar professor...";
      case "classroom":
        return "Selecionar sala...";
      default:
        return "Selecionar...";
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {isProfessor
            ? "O Meu Horário"
            : isStudent
              ? "Meu Horário"
              : "Consultar Horários"}
        </h1>
        <p className="text-gray-600">
          {isProfessor
            ? "Visualize todas as suas aulas e filtre por turma se necessário."
            : isStudent
              ? "Consulte o horário das turmas em que está inscrito."
              : "Consulte os horários por turma, professor ou sala."}
        </p>
        {isStudent && courses.length === 0 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
            <strong>Atenção:</strong> Não está inscrito em nenhum curso ativo.
            Contacte a secretaria para efetuar a sua inscrição.
          </div>
        )}
        {isProfessor && courses.length === 0 && !loading && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
            <strong>Atenção:</strong> Não tem módulos atribuídos. Contacte a
            coordenação para verificar as suas atribuições.
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Tipo de Consulta - Apenas para Admin */}
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Consulta
              </label>
              <div className="flex rounded-lg overflow-hidden border border-gray-300">
                <button
                  onClick={() => {
                    setViewMode("course");
                    setSelectedId("");
                  }}
                  className={`flex-1 px-3 py-2 text-sm font-medium transition ${
                    viewMode === "course"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Turma
                </button>
                <button
                  onClick={() => {
                    setViewMode("trainer");
                    setSelectedId("");
                  }}
                  className={`flex-1 px-3 py-2 text-sm font-medium transition ${
                    viewMode === "trainer"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Formador
                </button>
                <button
                  onClick={() => {
                    setViewMode("classroom");
                    setSelectedId("");
                  }}
                  className={`flex-1 px-3 py-2 text-sm font-medium transition ${
                    viewMode === "classroom"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Sala
                </button>
              </div>
            </div>
          )}

          {/* Seleção de Turma - Para Professor e Estudante (filtro opcional) */}
          {(isProfessor || isStudent) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isProfessor ? "Filtrar por Turma" : "Turma"}
              </label>
              <select
                value={selectedId}
                onChange={(e) => {
                  setSelectedId(e.target.value);
                  if (isProfessor) setShowingAll(e.target.value === "");
                }}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">
                  {isProfessor
                    ? "Todas as minhas turmas"
                    : "Selecionar turma..."}
                </option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Seleção para Admin */}
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {viewMode === "course" && "Turma/Curso"}
                {viewMode === "trainer" && "Professor"}
                {viewMode === "classroom" && "Sala"}
              </label>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{getPlaceholder()}</option>
                {getSelectOptions().map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Indicador para Professor */}
        {isProfessor && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-blue-700 text-sm">
            {showingAll
              ? "A mostrar todas as suas aulas. Use o filtro acima para ver apenas uma turma."
              : `A filtrar por turma selecionada.`}
          </div>
        )}
      </div>

      {/* Mensagens */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {!selectedId && !isProfessor && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
          Selecione uma opção acima para visualizar o horário.
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Calendário - Mostra sempre para professores, ou quando há seleção */}
      {!loading && (selectedId || isProfessor) && (
        <div
          className="bg-white rounded-xl shadow-lg p-6"
          style={{ height: "70vh" }}
        >
          <div className="mb-4 p-3 bg-gray-50 rounded-lg flex flex-wrap gap-4">
            {/* Cálculos dinâmicos baseados na vista */}
            {(() => {
              // Calcular limites baseados na vista atual
              let filteredLessons = lessons;
              let periodLabel = "";

              if (currentView === "month") {
                const monthStart = startOfMonth(currentDate);
                const monthEnd = endOfMonth(currentDate);
                filteredLessons = lessons.filter((l) => {
                  const lessonDate = new Date(l.date);
                  return lessonDate >= monthStart && lessonDate <= monthEnd;
                });
                periodLabel = `(${format(currentDate, "MMMM yyyy", { locale: pt })})`;
              } else if (currentView === "week") {
                const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
                const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
                filteredLessons = lessons.filter((l) => {
                  const lessonDate = new Date(l.date);
                  return lessonDate >= weekStart && lessonDate <= weekEnd;
                });
                periodLabel = `(${format(weekStart, "d MMM", { locale: pt })} - ${format(weekEnd, "d MMM", { locale: pt })})`;
              } else if (currentView === "day") {
                const dayStart = startOfDay(currentDate);
                const dayEnd = endOfDay(currentDate);
                filteredLessons = lessons.filter((l) => {
                  const lessonDate = new Date(l.date);
                  return lessonDate >= dayStart && lessonDate <= dayEnd;
                });
                periodLabel = `(${format(currentDate, "d MMMM yyyy", { locale: pt })})`;
              } else {
                // Agenda - mostra total
                periodLabel = "(Total)";
              }

              const totalHours = filteredLessons
                .reduce((sum, l) => sum + (l.duration_hours || 0), 0)
                .toFixed(1);

              return (
                <>
                  <span className="font-medium text-gray-700">
                    Aulas: {filteredLessons.length} {periodLabel}
                  </span>
                  {filteredLessons.length > 0 && (
                    <span className="text-gray-600">Horas: {totalHours}h</span>
                  )}
                </>
              );
            })()}
          </div>

          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
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
            style={{ height: "calc(100% - 60px)" }}
            popup
          />
        </div>
      )}

      {/* Tabela de detalhes */}
      {!loading &&
        selectedId &&
        lessons.length > 0 &&
        (() => {
          // Paginação local das aulas
          const totalTablePages = Math.ceil(
            lessons.length / TABLE_ITEMS_PER_PAGE,
          );
          const paginatedLessons = lessons.slice(
            (tablePage - 1) * TABLE_ITEMS_PER_PAGE,
            tablePage * TABLE_ITEMS_PER_PAGE,
          );

          return (
            <div className="mt-6 bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <h3 className="font-semibold text-gray-800">Lista de Aulas</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                        Data
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                        Horário
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                        Módulo
                      </th>
                      {viewMode !== "course" && (
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                          Curso
                        </th>
                      )}
                      {viewMode !== "trainer" && (
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                          Professor
                        </th>
                      )}
                      {viewMode !== "classroom" && (
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                          Sala
                        </th>
                      )}
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                        Duração
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paginatedLessons.map((lesson) => (
                      <tr key={lesson.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          {format(new Date(lesson.date), "dd/MM/yyyy", {
                            locale: pt,
                          })}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {lesson.start_time?.substring(0, 5)} -{" "}
                          {lesson.end_time?.substring(0, 5)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {lesson.module_name}
                        </td>
                        {viewMode !== "course" && (
                          <td className="px-4 py-3 text-sm">
                            {lesson.course_name}
                          </td>
                        )}
                        {viewMode !== "trainer" && (
                          <td className="px-4 py-3 text-sm">
                            {lesson.trainer_name}
                          </td>
                        )}
                        {viewMode !== "classroom" && (
                          <td className="px-4 py-3 text-sm">
                            {lesson.classroom_name || "-"}
                          </td>
                        )}
                        <td className="px-4 py-3 text-sm">
                          {lesson.duration_hours}h
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t">
                <Pagination
                  currentPage={tablePage}
                  totalPages={totalTablePages}
                  totalItems={lessons.length}
                  itemsPerPage={TABLE_ITEMS_PER_PAGE}
                  onPageChange={setTablePage}
                />
              </div>
            </div>
          );
        })()}
    </div>
  );
};

export default ScheduleView;

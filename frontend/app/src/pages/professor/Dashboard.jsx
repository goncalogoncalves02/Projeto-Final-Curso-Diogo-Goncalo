import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { getTodayStr, getWeekRange, formatDatePT } from "../../utils/dateHelpers";
import {
  GraduationCap,
  Calendar,
  Clock,
  BookOpen,
  MapPin,
  ChevronRight,
} from "lucide-react";

const ProfessorDashboard = () => {
  const { user } = useAuth();
  const [lessons, setLessons] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lessonsRes, coursesRes] = await Promise.all([
          api.get("/lessons/my-schedule"),
          api.get("/lessons/my-courses"),
        ]);
        setLessons(lessonsRes.data);
        setCourses(coursesRes.data);
      } catch (err) {
        console.error("Erro ao carregar dados do professor:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const todayStr = getTodayStr();
  const { monday, sunday } = getWeekRange();

  const todayLessons = useMemo(
    () => lessons
      .filter((l) => l.date === todayStr)
      .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [lessons, todayStr],
  );

  const upcomingLessons = useMemo(
    () => lessons
      .filter((l) => l.date > todayStr)
      .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
      .slice(0, 7),
    [lessons, todayStr],
  );

  const nextLesson = useMemo(() => {
    const now = new Date();
    const todayUpcoming = lessons
      .filter((l) => {
        if (l.date !== todayStr) return false;
        const endParts = l.end_time.split(":");
        const endDate = new Date();
        endDate.setHours(parseInt(endParts[0]), parseInt(endParts[1]), 0);
        return endDate > now;
      })
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
    if (todayUpcoming.length > 0) return todayUpcoming[0];
    return upcomingLessons[0] || null;
  }, [lessons, todayStr, upcomingLessons]);

  const hoursThisWeek = useMemo(
    () => lessons
      .filter((l) => {
        const d = new Date(l.date + "T00:00:00");
        return d >= monday && d <= sunday;
      })
      .reduce((sum, l) => sum + (l.duration_hours || 0), 0),
    [lessons, monday, sunday],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Olá, {user?.full_name?.split(" ")[0] || "Professor"}
        </h1>
        <p className="text-gray-500 mt-1 text-sm">Painel do Professor</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 animate-fade-in-up animate-delay-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Cursos Ativos</p>
              <p className="text-4xl font-bold text-gray-800 mt-2">{courses.length}</p>
            </div>
            <div className="p-4 bg-blue-100 rounded-xl">
              <GraduationCap className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 animate-fade-in-up animate-delay-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Próxima Aula</p>
              <p className="text-lg font-bold text-gray-800 mt-2">
                {nextLesson
                  ? `${formatDatePT(nextLesson.date)}`
                  : "Sem aulas"}
              </p>
              {nextLesson && (
                <p className="text-sm text-gray-500">
                  {nextLesson.start_time?.substring(0, 5)} - {nextLesson.end_time?.substring(0, 5)}
                </p>
              )}
            </div>
            <div className="p-4 bg-orange-100 rounded-xl">
              <Calendar className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 animate-fade-in-up animate-delay-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Horas Esta Semana</p>
              <p className="text-4xl font-bold text-gray-800 mt-2">{hoursThisWeek}h</p>
            </div>
            <div className="p-4 bg-green-100 rounded-xl">
              <Clock className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Today's Lessons + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Clock className="w-5 h-5 text-blue-500 mr-2" />
            Aulas de Hoje
          </h2>
          {todayLessons.length > 0 ? (
            <div className="space-y-3">
              {todayLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors"
                >
                  <div className="text-center shrink-0 w-16">
                    <p className="text-sm font-bold text-blue-600">
                      {lesson.start_time?.substring(0, 5)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {lesson.end_time?.substring(0, 5)}
                    </p>
                  </div>
                  <div className="h-10 w-0.5 bg-blue-300 rounded-full shrink-0"></div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-800 text-sm truncate">{lesson.module_name}</p>
                    <p className="text-xs text-gray-500 truncate">{lesson.course_name}</p>
                  </div>
                  {lesson.classroom_name && (
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full shrink-0 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {lesson.classroom_name}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>Sem aulas hoje</p>
            </div>
          )}
        </div>

        {/* Upcoming */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <BookOpen className="w-5 h-5 text-orange-500 mr-2" />
              Próximas Aulas
            </h2>
            <Link
              to="/schedule"
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Ver calendário <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {upcomingLessons.length > 0 ? (
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Data</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Hora</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Módulo</th>
                    <th className="text-left py-2 px-2 text-xs font-medium text-gray-500">Sala</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingLessons.map((lesson) => (
                    <tr key={lesson.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 px-2 text-sm text-gray-700">{formatDatePT(lesson.date)}</td>
                      <td className="py-2 px-2 text-sm text-gray-600">
                        {lesson.start_time?.substring(0, 5)}-{lesson.end_time?.substring(0, 5)}
                      </td>
                      <td className="py-2 px-2 text-sm font-medium text-gray-800 truncate max-w-[150px]">
                        {lesson.module_name}
                      </td>
                      <td className="py-2 px-2 text-sm text-gray-500">{lesson.classroom_name || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>Sem aulas agendadas</p>
            </div>
          )}
        </div>
      </div>

      {/* My Courses */}
      {courses.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <GraduationCap className="w-5 h-5 text-blue-500 mr-2" />
            Os Meus Cursos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => {
              const courseLessons = lessons.filter((l) => l.course_id === course.id);
              const totalHours = courseLessons.reduce((sum, l) => sum + (l.duration_hours || 0), 0);
              return (
                <div
                  key={course.id}
                  className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-gray-800 text-sm truncate">{course.name}</h3>
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {courseLessons.length} aulas
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {totalHours}h
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessorDashboard;

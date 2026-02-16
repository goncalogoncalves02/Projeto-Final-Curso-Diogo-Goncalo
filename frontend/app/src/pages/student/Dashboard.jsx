import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import { getTodayStr, formatDatePT } from "../../utils/dateHelpers";
import {
  GraduationCap,
  Calendar,
  Clock,
  BookOpen,
  ClipboardList,
  TrendingUp,
  MapPin,
  ChevronRight,
} from "lucide-react";

const StudentDashboard = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [allLessons, setAllLessons] = useState([]);
  const [grades, setGrades] = useState([]);
  const [courseModulesMap, setCourseModulesMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch enrollments + grades in parallel
        const [enrollRes, gradesRes] = await Promise.all([
          api.get("/enrollments/"),
          api.get("/module_grades/"),
        ]);

        const enrollData = enrollRes.data;
        const gradesData = gradesRes.data;
        setEnrollments(enrollData);
        setGrades(gradesData);

        // 2. For each active enrollment, fetch lessons and course modules
        const activeEnrollments = enrollData.filter((e) => e.status === "active");
        const courseIds = [...new Set(activeEnrollments.map((e) => e.course_id))];

        const [lessonsResults, modulesResults] = await Promise.all([
          Promise.all(courseIds.map((cid) => api.get(`/lessons/by-course/${cid}`))),
          Promise.all(courseIds.map((cid) => api.get(`/courses/${cid}/modules`))),
        ]);

        // Combine all lessons
        const combinedLessons = lessonsResults.flatMap((r) => r.data);
        setAllLessons(combinedLessons);

        // Build course_module_id -> module info map
        const modulesMap = {};
        modulesResults.forEach((r) => {
          r.data.forEach((cm) => {
            modulesMap[cm.id] = {
              moduleName: cm.module?.name || "N/A",
              order: cm.order,
              totalHours: cm.total_hours,
              courseId: cm.course_id || null,
            };
          });
        });
        setCourseModulesMap(modulesMap);
      } catch (err) {
        console.error("Erro ao carregar dados do estudante:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const todayStr = getTodayStr();

  const todayLessons = useMemo(
    () => allLessons
      .filter((l) => l.date === todayStr)
      .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [allLessons, todayStr],
  );

  const upcomingLessons = useMemo(
    () => allLessons
      .filter((l) => l.date > todayStr)
      .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
      .slice(0, 7),
    [allLessons, todayStr],
  );

  const nextLesson = useMemo(() => {
    const now = new Date();
    const todayUpcoming = allLessons
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
  }, [allLessons, todayStr, upcomingLessons]);

  const averageGrade = useMemo(() => {
    if (grades.length === 0) return null;
    const sum = grades.reduce((acc, g) => acc + g.grade, 0);
    return (sum / grades.length).toFixed(1);
  }, [grades]);

  // Group grades by course
  const gradesByCourse = useMemo(() => {
    const activeEnrollments = enrollments.filter((e) => e.status === "active");
    return activeEnrollments.map((enrollment) => {
      const courseGrades = grades.filter((g) => g.enrollment_id === enrollment.id);
      const courseAvg = courseGrades.length > 0
        ? (courseGrades.reduce((s, g) => s + g.grade, 0) / courseGrades.length).toFixed(1)
        : null;
      return {
        enrollment,
        courseName: enrollment.course?.name || `Curso #${enrollment.course_id}`,
        grades: courseGrades,
        average: courseAvg,
      };
    });
  }, [enrollments, grades]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const activeEnrollments = enrollments.filter((e) => e.status === "active");

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Olá, {user?.full_name?.split(" ")[0] || "Estudante"}
        </h1>
        <p className="text-gray-500 mt-1 text-sm">Painel do Estudante</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 animate-fade-in-up animate-delay-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Cursos Inscritos</p>
              <p className="text-4xl font-bold text-gray-800 mt-2">{activeEnrollments.length}</p>
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
              <p className="text-sm font-medium text-gray-500">Média de Notas</p>
              <p className={`text-4xl font-bold mt-2 ${
                averageGrade === null ? "text-gray-400"
                : parseFloat(averageGrade) >= 10 ? "text-green-600"
                : "text-red-600"
              }`}>
                {averageGrade !== null ? averageGrade : "-"}
              </p>
              {averageGrade !== null && (
                <p className="text-xs text-gray-500">{grades.length} módulos avaliados</p>
              )}
            </div>
            <div className="p-4 bg-green-100 rounded-xl">
              <TrendingUp className="w-8 h-8 text-green-600" />
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

      {/* Grades by Course */}
      {gradesByCourse.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <ClipboardList className="w-5 h-5 text-green-500 mr-2" />
            As Minhas Notas
          </h2>
          <div className="space-y-6">
            {gradesByCourse.map(({ enrollment, courseName, grades: courseGrades, average }) => (
              <div key={enrollment.id} className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 text-sm">{courseName}</h3>
                  {average !== null && (
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                      parseFloat(average) >= 10
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      Média: {average}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  {courseGrades.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {courseGrades.map((g) => {
                        const moduleInfo = courseModulesMap[g.course_module_id];
                        return (
                          <div
                            key={g.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-700 truncate">
                                {moduleInfo?.moduleName || `Módulo #${g.course_module_id}`}
                              </p>
                            </div>
                            <span className={`text-lg font-bold ml-3 ${
                              g.grade >= 10 ? "text-green-600" : "text-red-600"
                            }`}>
                              {g.grade}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-2">
                      Ainda sem notas lançadas
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;

import { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/axios";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import { GraduationCap, BookCheck, Users, Trophy } from "lucide-react";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
);

const Dashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/statistics/");
      setStats(response.data);
      setError(null);
    } catch (err) {
      console.error("Erro ao carregar estatísticas:", err);
      setError("Não foi possível carregar as estatísticas.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar dados quando a página é montada ou quando navega para ela
  useEffect(() => {
    if (user?.is_superuser) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [user, location.key, fetchStats]);

  // Se não é admin, mostra dashboard simples
  if (!user?.is_superuser) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 max-w-2xl">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600">
            Olá, {user?.full_name?.split(" ")[0] || user?.email}! 👋
          </h1>
          <p className="mt-4 text-xl text-gray-500">
            Bem-vindo ao painel de gestão da <strong>ATEC</strong>.
          </p>
          <div className="mt-8 p-4 bg-blue-50 rounded-lg text-blue-800 text-sm">
            <p>
              Usa a <strong>Barra Lateral</strong> à esquerda para navegar.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      </div>
    );
  }

  // Dados para gráfico de Cursos por Área
  const areaLabels = Object.keys(stats?.courses_by_area || {});
  const areaData = Object.values(stats?.courses_by_area || {});
  const areaColors = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#06B6D4",
    "#84CC16",
  ];

  const coursesByAreaData = {
    labels: areaLabels,
    datasets: [
      {
        label: "Cursos",
        data: areaData,
        backgroundColor: areaColors.slice(0, areaLabels.length),
        borderWidth: 0,
      },
    ],
  };

  // Dados para Top Formadores
  const topTrainersData = {
    labels:
      stats?.top_trainers?.map((t) => t.name?.split(" ")[0] || "N/A") || [],
    datasets: [
      {
        label: "Horas Lecionadas",
        data: stats?.top_trainers?.map((t) => t.hours) || [],
        backgroundColor: "#3B82F6",
        borderRadius: 8,
      },
    ],
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Dashboard de Estatísticas
        </h1>
        <p className="text-gray-500 mt-1">
          Visão geral do sistema de gestão escolar
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cursos Terminados */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Cursos Terminados
              </p>
              <p className="text-4xl font-bold text-gray-800 mt-2">
                {stats?.courses_finished || 0}
              </p>
            </div>
            <div className="p-4 bg-green-100 rounded-xl">
              <BookCheck className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Cursos a Decorrer */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Cursos a Decorrer
              </p>
              <p className="text-4xl font-bold text-gray-800 mt-2">
                {stats?.courses_active || 0}
              </p>
            </div>
            <div className="p-4 bg-blue-100 rounded-xl">
              <GraduationCap className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Formandos Ativos */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Formandos Ativos
              </p>
              <p className="text-4xl font-bold text-gray-800 mt-2">
                {stats?.students_active || 0}
              </p>
            </div>
            <div className="p-4 bg-purple-100 rounded-xl">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cursos por Área */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Cursos por Área
          </h2>
          <div className="h-64 flex items-center justify-center">
            {areaLabels.length > 0 ? (
              <Doughnut
                data={coursesByAreaData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "right",
                    },
                  },
                }}
              />
            ) : (
              <p className="text-gray-400">Sem dados de cursos</p>
            )}
          </div>
        </div>

        {/* Top 10 Formadores */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
            Top 10 Formadores (Horas)
          </h2>
          <div className="h-64">
            {stats?.top_trainers?.length > 0 ? (
              <Bar
                data={topTrainersData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  indexAxis: "y",
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    x: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-400">Sem dados de formadores</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabela Top Formadores Detalhada */}
      {stats?.top_trainers?.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Detalhes dos Formadores
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    #
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                    Nome
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
                    Horas Lecionadas
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.top_trainers.map((trainer, index) => (
                  <tr
                    key={trainer.id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                          index === 0
                            ? "bg-yellow-100 text-yellow-700"
                            : index === 1
                              ? "bg-gray-100 text-gray-700"
                              : index === 2
                                ? "bg-orange-100 text-orange-700"
                                : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-800">
                      {trainer.name}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                        {trainer.hours}h
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

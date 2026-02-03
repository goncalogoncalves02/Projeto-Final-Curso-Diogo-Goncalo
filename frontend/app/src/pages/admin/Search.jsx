import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";

const AdminSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("courses");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  // Debounce search
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const performSearch = async (query, type) => {
    if (query.length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setError("");
    setHasSearched(true);

    try {
      const response = await api.get(`/search/${type}`, {
        params: { q: query, limit: 50 },
      });
      setResults(response.data);
    } catch (err) {
      if (err.response?.status === 403) {
        setError("Não tens permissão para aceder a esta funcionalidade.");
      } else {
        setError("Erro ao pesquisar. Tenta novamente.");
      }
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((q, t) => performSearch(q, t), 300),
    [],
  );

  useEffect(() => {
    debouncedSearch(searchQuery, searchType);
  }, [searchQuery, searchType, debouncedSearch]);

  const handleTypeChange = (type) => {
    setSearchType(type);
    setResults([]);
    setHasSearched(false);
  };

  const renderResults = () => {
    if (loading) {
      return (
        <div className="text-center py-8 text-gray-500">A pesquisar...</div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>
      );
    }

    if (!hasSearched) {
      return (
        <div className="text-center py-8 text-gray-400">
          Escreve pelo menos 2 caracteres para pesquisar
        </div>
      );
    }

    if (results.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          Nenhum resultado encontrado para "{searchQuery}"
        </div>
      );
    }

    if (searchType === "courses") {
      return (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Área
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {results.map((course) => (
              <tr key={course.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  #{course.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {course.name}
                  </div>
                  {course.description && (
                    <div className="text-sm text-gray-500 truncate max-w-md">
                      {course.description}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {course.area || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${
                      course.status === "active"
                        ? "bg-green-100 text-green-800"
                        : course.status === "planned"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {course.status === "active"
                      ? "Ativo"
                      : course.status === "planned"
                        ? "Planeado"
                        : "Terminado"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    // Students and Trainers share similar structure
    return (
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nome / Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {results.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                #{user.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {user.full_name || "Sem nome"}
                </div>
                <div className="text-sm text-gray-500">{user.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                  ${user.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                >
                  {user.is_active ? "Ativo" : "Inativo"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Pesquisa</h1>
        <Link
          to="/"
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Voltar à Dashboard
        </Link>
      </div>

      {/* Search Input */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Pesquisar
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Escreve para pesquisar..."
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Tipo
            </label>
            <div className="flex rounded-lg overflow-hidden border shadow">
              <button
                onClick={() => handleTypeChange("courses")}
                className={`px-4 py-3 transition-colors ${
                  searchType === "courses"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                Cursos
              </button>
              <button
                onClick={() => handleTypeChange("students")}
                className={`px-4 py-3 transition-colors border-l ${
                  searchType === "students"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                Estudantes
              </button>
              <button
                onClick={() => handleTypeChange("trainers")}
                className={`px-4 py-3 transition-colors border-l ${
                  searchType === "trainers"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                Professores
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {renderResults()}
      </div>

      {/* Result count */}
      {hasSearched && results.length > 0 && (
        <div className="mt-4 text-sm text-gray-500 text-right">
          {results.length} resultado{results.length !== 1 ? "s" : ""} encontrado
          {results.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
};

export default AdminSearch;

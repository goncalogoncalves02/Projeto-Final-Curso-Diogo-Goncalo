import { useState, useEffect, useRef } from "react";
import api from "../../api/axios";
import { Calendar, Search, User, X } from "lucide-react";

const AdminAvailability = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [availabilities, setAvailabilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  const daysOfWeek = [
    { id: 1, name: "Domingo" },
    { id: 2, name: "Segunda-feira" },
    { id: 3, name: "Terça-feira" },
    { id: 4, name: "Quarta-feira" },
    { id: 5, name: "Quinta-feira" },
    { id: 6, name: "Sexta-feira" },
    { id: 7, name: "Sábado" },
  ];

  useEffect(() => {
    // Carregar utilizadores para o dropdown
    const fetchUsers = async () => {
      try {
        const response = await api.get("/users/?limit=100");
        const usersData = response.data.items || response.data;
        setUsers(usersData.filter((u) => u.role === "professor"));
      } catch (error) {
        console.error("Erro ao carregar utilizadores", error);
      }
    };
    fetchUsers();
  }, []);

  // Click-outside para fechar sugestões
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target))
        setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter users based on search term
  const filteredUsers = users.filter((user) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(term) ||
      user.full_name?.toLowerCase().includes(term)
    );
  });

  const handleSelectUser = (userId) => {
    setSelectedUser(userId);
    setSearchTerm("");
    setShowSuggestions(false);
    if (userId) {
      fetchAvailability(userId);
    } else {
      setAvailabilities([]);
    }
  };

  const fetchAvailability = async (userId) => {
    setLoading(true);
    try {
      const response = await api.get(`/availability/?trainer_id=${userId}`);
      const sorted = response.data.sort((a, b) => {
        if (a.specific_date && b.specific_date)
          return new Date(a.specific_date) - new Date(b.specific_date);
        if (a.is_recurring && !b.is_recurring) return 1;
        if (!a.is_recurring && b.is_recurring) return -1;
        return a.day_of_week - b.day_of_week;
      });
      setAvailabilities(sorted);
    } catch (error) {
      console.error(error);
      alert("Erro ao buscar disponibilidade.");
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (id) =>
    daysOfWeek.find((d) => d.id === id)?.name || "Desconhecido";

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <Calendar className="mr-3 w-8 h-8 text-blue-600" />
          Disponibilidade de Professores
        </h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <label className="flex text-gray-700 text-sm font-bold mb-2 items-center">
          <User className="w-4 h-4 mr-2" />
          Selecionar Professor
        </label>

        <div className="relative w-full sm:w-96" ref={searchRef}>
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-400 bg-white">
            <Search className="w-4 h-4 text-gray-400 ml-3 shrink-0" />
            <input
              type="text"
              placeholder={
                selectedUser
                  ? users.find((u) => String(u.id) === String(selectedUser))?.full_name || "Pesquisar professor..."
                  : "Pesquisar professor..."
              }
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className="w-full px-2 py-2 text-sm focus:outline-none"
            />
            {selectedUser && (
              <button
                type="button"
                onClick={() => handleSelectUser("")}
                className="p-1.5 mr-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                title="Limpar seleção"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
              {filteredUsers.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-400">
                  Nenhum professor encontrado
                </div>
              ) : (
                filteredUsers.map((u) => (
                  <button
                    type="button"
                    key={u.id}
                    onClick={() => handleSelectUser(String(u.id))}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                      String(u.id) === String(selectedUser)
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    <div className="font-medium">{u.full_name || u.email}</div>
                    <div className="text-xs text-gray-400">{u.email}</div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="text-center py-4">A carregar horários...</div>
      )}

      {selectedUser && !loading && availabilities.length === 0 && (
        <div className="text-center py-10 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 text-gray-500">
          Este professor ainda não definiu disponibilidades.
        </div>
      )}

      {selectedUser && availabilities.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dia / Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Horário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {availabilities.map((slot) => (
                <tr key={slot.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {slot.is_recurring
                      ? getDayName(slot.day_of_week)
                      : new Date(slot.specific_date).toLocaleDateString(
                          "pt-PT",
                        )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        slot.is_recurring
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {slot.is_recurring ? "Recorrente" : "Data Específica"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminAvailability;

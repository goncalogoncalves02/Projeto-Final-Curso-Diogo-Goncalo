import { useState, useEffect } from "react";
import api from "../../api/axios";
import { Calendar, Search, User } from "lucide-react";

const AdminAvailability = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [availabilities, setAvailabilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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
        setUsers(response.data.filter(u => u.role === 'professor'));
      } catch (error) {
        console.error("Erro ao carregar utilizadores", error);
      }
    };
    fetchUsers();
  }, []);

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(term) ||
      user.full_name?.toLowerCase().includes(term)
    );
  });

  const handleUserChange = (e) => {
    const userId = e.target.value;
    setSelectedUser(userId);
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
        if (a.specific_date && b.specific_date) return new Date(a.specific_date) - new Date(b.specific_date);
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

  const getDayName = (id) => daysOfWeek.find((d) => d.id === id)?.name || "Desconhecido";

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
        
        {/* Search Input */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-gray-50"
          />
        </div>

        <div className="relative">
          <select
            value={selectedUser}
            onChange={handleUserChange}
            className="block appearance-none w-full bg-gray-50 border border-gray-300 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
          >
            <option value="">Selecione um professor... ({filteredUsers.length} encontrados)</option>
            {filteredUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name || user.email} {user.full_name ? `(${user.email})` : ""}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
          </div>
        </div>
      </div>

      {loading && <div className="text-center py-4">A carregar horários...</div>}

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
                      : new Date(slot.specific_date).toLocaleDateString("pt-PT")}
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

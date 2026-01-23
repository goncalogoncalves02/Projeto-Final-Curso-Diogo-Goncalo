import { useState, useEffect } from "react";
import api from "../api/axios";
import { Trash2, Plus, Calendar } from "lucide-react";

const Availability = () => {
  const [availabilities, setAvailabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    day_of_week: 2, // Default: Segunda
    start_time: "09:00",
    end_time: "13:00",
    is_recurring: true,
    specific_date: "",
  });

  const daysOfWeek = [
    { id: 1, name: "Domingo" },
    { id: 2, name: "Segunda-feira" },
    { id: 3, name: "Terça-feira" },
    { id: 4, name: "Quarta-feira" },
    { id: 5, name: "Quinta-feira" },
    { id: 6, name: "Sexta-feira" },
    { id: 7, name: "Sábado" },
  ];

  // Fetch Availabilities
  const fetchAvailabilities = async () => {
    try {
      const response = await api.get("/availability/");
      const sorted = response.data.sort((a, b) => {
        // Sort rationale: Date first (asc), then Day of Week (asc)
        if (a.specific_date && b.specific_date) return new Date(a.specific_date) - new Date(b.specific_date);
        if (a.is_recurring && !b.is_recurring) return 1;
        if (!a.is_recurring && b.is_recurring) return -1;
        return a.day_of_week - b.day_of_week;
      });
      setAvailabilities(sorted);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Erro ao carregar disponibilidades.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailabilities();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        start_time: formData.start_time + ":00",
        end_time: formData.end_time + ":00",
        is_recurring: formData.is_recurring,
      };

      if (formData.is_recurring) {
        payload.day_of_week = parseInt(formData.day_of_week);
        payload.specific_date = null;
      } else {
        payload.day_of_week = null;
        payload.specific_date = formData.specific_date;
      }

      const response = await api.post("/availability/", payload);
      // Re-fetch to simpler sort logic or manual append
      fetchAvailabilities(); 
      setIsCreating(false);
    } catch (error) {
      console.error(error);
      alert("Erro ao criar disponibilidade. Valida os dados.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Tem a certeza que quer remover esta disponibilidade?")) return;
    try {
      await api.delete(`/availability/${id}`);
      setAvailabilities(availabilities.filter((a) => a.id !== id));
    } catch (error) {
      console.error(error);
      alert("Erro ao eliminar.");
    }
  };

  const getDayName = (id) => daysOfWeek.find((d) => d.id === id)?.name || "Desconhecido";

  if (loading) return <div className="p-8 text-center">A carregar...</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <Calendar className="mr-3 w-8 h-8 text-blue-600" />
            Minha Disponibilidade
          </h1>
          <p className="text-gray-500 mt-1">
            Define os horários em que podes dar aulas.
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Adicionar Horário
        </button>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {availabilities.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Ainda não tens disponibilidades definidas.
          </div>
        ) : (
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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
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
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDelete(slot.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isCreating && (
        <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h2 className="text-xl font-bold mb-4">Adicionar Disponibilidade</h2>
            <form onSubmit={handleCreate}>
              
              {/* Recurrence Toggle */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Tipo
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="radio"
                      className="form-radio text-blue-600"
                      name="recurrence"
                      checked={formData.is_recurring}
                      onChange={() => setFormData({ ...formData, is_recurring: true })}
                    />
                    <span className="ml-2">Semanal (Recorrente)</span>
                  </label>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="radio"
                      className="form-radio text-blue-600"
                      name="recurrence"
                      checked={!formData.is_recurring}
                      onChange={() => setFormData({ ...formData, is_recurring: false })}
                    />
                    <span className="ml-2">Data Específica</span>
                  </label>
                </div>
              </div>

              {/* Day of Week OR Specific Date Input */}
              {formData.is_recurring ? (
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Dia da Semana
                  </label>
                  <select
                    value={formData.day_of_week}
                    onChange={(e) =>
                      setFormData({ ...formData, day_of_week: e.target.value })
                    }
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
                  >
                    {daysOfWeek.map((day) => (
                      <option key={day.id} value={day.id}>
                        {day.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Data
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.specific_date}
                    onChange={(e) =>
                      setFormData({ ...formData, specific_date: e.target.value })
                    }
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* INÍCIO */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Início
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={formData.start_time.split(":")[0]}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          start_time: `${e.target.value}:${formData.start_time.split(":")[1]}`,
                        })
                      }
                      className="shadow border rounded w-full py-2 px-2 text-gray-700 focus:outline-none focus:shadow-outline"
                    >
                      {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                        <option key={h} value={h.toString().padStart(2, "0")}>
                          {h.toString().padStart(2, "0")}h
                        </option>
                      ))}
                    </select>
                    <select
                      value={formData.start_time.split(":")[1]}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          start_time: `${formData.start_time.split(":")[0]}:${e.target.value}`,
                        })
                      }
                      className="shadow border rounded w-full py-2 px-2 text-gray-700 focus:outline-none focus:shadow-outline"
                    >
                      {["00", "15", "30", "45"].map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* FIM */}
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Fim
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={formData.end_time.split(":")[0]}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          end_time: `${e.target.value}:${formData.end_time.split(":")[1]}`,
                        })
                      }
                      className="shadow border rounded w-full py-2 px-2 text-gray-700 focus:outline-none focus:shadow-outline"
                    >
                      {Array.from({ length: 24 }, (_, i) => i).map((h) => (
                        <option key={h} value={h.toString().padStart(2, "0")}>
                          {h.toString().padStart(2, "0")}h
                        </option>
                      ))}
                    </select>
                    <select
                      value={formData.end_time.split(":")[1]}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          end_time: `${formData.end_time.split(":")[0]}:${e.target.value}`,
                        })
                      }
                      className="shadow border rounded w-full py-2 px-2 text-gray-700 focus:outline-none focus:shadow-outline"
                    >
                      {["00", "15", "30", "45"].map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Availability;

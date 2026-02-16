import { useState, useEffect } from "react";
import api from "../../api/axios";
import { Trash2, Plus, Calendar } from "lucide-react";
import ModalPortal from "../../components/ui/ModalPortal";

const Availability = () => {
  const [availabilities, setAvailabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [slotToDelete, setSlotToDelete] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    day_of_week: 2, // Default: Segunda
    start_time: "08:00",
    end_time: "15:00",
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
      const response = await api.get("/availability/?my_only=true");
      // Calcula dia da semana efetivo (para pontuais, extrai da data)
      // JS getDay(): 0=Domingo → converter para 1=Domingo do nosso sistema (+1)
      const getDayKey = (slot) => {
        if (slot.is_recurring) return slot.day_of_week;
        if (slot.specific_date) return new Date(slot.specific_date).getDay() + 1;
        return 99;
      };
      const sorted = response.data.sort((a, b) => {
        const dayA = getDayKey(a);
        const dayB = getDayKey(b);
        if (dayA !== dayB) return dayA - dayB;
        // Mesmo dia: recorrentes primeiro
        if (a.is_recurring !== b.is_recurring) return a.is_recurring ? -1 : 1;
        // Mesmo tipo: ordenar por hora de início
        return a.start_time.localeCompare(b.start_time);
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

      await api.post("/availability/", payload);
      fetchAvailabilities();
      setIsCreating(false);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail || "Erro ao criar disponibilidade. Valida os dados.";
      setFormError(msg);
    }
  };

  const confirmDelete = async () => {
    if (!slotToDelete) return;
    try {
      await api.delete(`/availability/${slotToDelete.id}`);
      setSlotToDelete(null);
      fetchAvailabilities();
    } catch (err) {
      console.error(err);
      setSlotToDelete(null);
      setError("Erro ao eliminar disponibilidade.");
    }
  };

  const getDayName = (id) =>
    daysOfWeek.find((d) => d.id === id)?.name || "Desconhecido";

  if (loading) return <div className="p-8 text-center">A carregar...</div>;

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
            <Calendar className="mr-3 w-8 h-8 text-blue-600" />
            Minha Disponibilidade
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Define os horários em que podes dar aulas.
          </p>
        </div>
        <button
          onClick={() => { setFormError(""); setIsCreating(true); }}
          className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm hover:shadow-md transition-all duration-200 font-medium text-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
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
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setSlotToDelete(slot)}
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

      {/* Modal de Confirmação de Eliminação */}
      {slotToDelete && (
        <ModalPortal>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-50 mb-4">
                  <Trash2 className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Eliminar Disponibilidade
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Tens a certeza que queres eliminar a disponibilidade de{" "}
                  <span className="font-bold text-gray-800">
                    {slotToDelete.is_recurring
                      ? getDayName(slotToDelete.day_of_week)
                      : new Date(slotToDelete.specific_date).toLocaleDateString("pt-PT")}
                  </span>{" "}
                  ({slotToDelete.start_time.slice(0, 5)} - {slotToDelete.end_time.slice(0, 5)})?
                  <br />
                  Esta ação é irreversível.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setSlotToDelete(null)}
                    className="px-5 py-2.5 text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium text-sm shadow-sm"
                  >
                    Sim, Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {isCreating && (
        <ModalPortal>
          <div className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-96">
              <h2 className="text-xl font-bold mb-4">
                Adicionar Disponibilidade
              </h2>
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
                        onChange={() =>
                          setFormData({ ...formData, is_recurring: true })
                        }
                      />
                      <span className="ml-2">Semanal (Recorrente)</span>
                    </label>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="radio"
                        className="form-radio text-blue-600"
                        name="recurrence"
                        checked={!formData.is_recurring}
                        onChange={() =>
                          setFormData({ ...formData, is_recurring: false })
                        }
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
                        setFormData({
                          ...formData,
                          day_of_week: e.target.value,
                        })
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
                        setFormData({
                          ...formData,
                          specific_date: e.target.value,
                        })
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

                {formError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
                    {formError}
                  </div>
                )}

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
        </ModalPortal>
      )}
    </div>
  );
};

export default Availability;

/**
 * TableEmpty - Componente para estado vazio em tabelas
 * @param {number} colSpan - Número de colunas da tabela
 * @param {string} message - Mensagem quando não há dados
 */
const TableEmpty = ({
  colSpan = 5,
  message = "Nenhum resultado encontrado.",
}) => (
  <tr>
    <td colSpan={colSpan} className="px-6 py-8 text-center text-gray-500">
      <div className="flex flex-col items-center gap-2">
        <svg
          className="h-8 w-8 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <span>{message}</span>
      </div>
    </td>
  </tr>
);

export default TableEmpty;

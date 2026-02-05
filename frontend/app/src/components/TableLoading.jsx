/**
 * TableLoading - Componente para estado de loading em tabelas
 * @param {number} colSpan - Número de colunas da tabela
 * @param {string} message - Mensagem de loading
 */
const TableLoading = ({ colSpan = 5, message = "A carregar..." }) => (
  <tr>
    <td colSpan={colSpan} className="px-6 py-8 text-center text-gray-500">
      <div className="flex items-center justify-center gap-2">
        <svg
          className="animate-spin h-5 w-5 text-blue-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span>{message}</span>
      </div>
    </td>
  </tr>
);

export default TableLoading;

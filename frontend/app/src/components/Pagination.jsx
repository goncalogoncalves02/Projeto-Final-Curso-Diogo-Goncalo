import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Componente de paginação reutilizável.
 *
 * Props:
 * - currentPage: número da página atual
 * - totalPages: número total de páginas
 * - totalItems: número total de itens
 * - itemsPerPage: itens por página
 * - onPageChange: callback quando a página muda
 */
const Pagination = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}) => {
  // Não mostrar se só há uma página
  if (totalPages <= 1) {
    if (totalItems > 0) {
      return (
        <div className="mt-4 text-sm text-gray-500 text-right">
          {totalItems} resultado{totalItems !== 1 ? "s" : ""}
        </div>
      );
    }
    return null;
  }

  // Gerar números de página para exibir
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage);
    }
  };

  return (
    <div className="mt-6 flex items-center justify-between">
      <div className="text-sm text-gray-500">
        A mostrar {(currentPage - 1) * itemsPerPage + 1} -{" "}
        {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems}{" "}
        resultados
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg ${
            currentPage === 1
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {getPageNumbers().map((page, index) =>
          page === "..." ? (
            <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 rounded-lg transition-colors ${
                currentPage === page
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {page}
            </button>
          ),
        )}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg ${
            currentPage === totalPages
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;

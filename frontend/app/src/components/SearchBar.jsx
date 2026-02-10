import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

/**
 * SearchBar - Componente reutilizável de pesquisa com debounce
 * @param {function} onSearch - Callback chamado quando a pesquisa muda
 * @param {string} placeholder - Placeholder do input
 * @param {number} debounceMs - Tempo de debounce em ms (default: 300)
 * @param {number} minLength - Mínimo de caracteres para pesquisar (default: 2)
 */
const SearchBar = ({
  onSearch,
  placeholder = "Pesquisar...",
  debounceMs = 300,
  minLength = 2,
}) => {
  const [query, setQuery] = useState("");
  const debounceRef = useRef(null);
  const onSearchRef = useRef(onSearch);

  // Keep onSearch ref updated
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  // Handle input change with debounce
  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Set new debounce timeout
    debounceRef.current = setTimeout(() => {
      if (value === "" || value.length >= minLength) {
        onSearchRef.current(value);
      }
    }, debounceMs);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleClear = () => {
    setQuery("");
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    onSearchRef.current("");
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
      />
      {query && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          title="Limpar pesquisa"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;

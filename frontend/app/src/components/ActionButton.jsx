/**
 * ActionButton - Botão de ação reutilizável para tabelas
 * @param {React.ElementType} icon - Ícone do lucide-react
 * @param {string} label - Texto do tooltip
 * @param {string} variant - primary | danger | success | info
 * @param {function} onClick - Handler de clique
 * @param {string} className - Classes adicionais
 */
const variantStyles = {
  primary: "text-blue-600 hover:bg-blue-50 hover:text-blue-700",
  danger: "text-red-500 hover:bg-red-50 hover:text-red-700",
  success: "text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700",
  info: "text-violet-600 hover:bg-violet-50 hover:text-violet-700",
};

const ActionButton = ({
  icon: Icon,
  label,
  variant = "primary",
  onClick,
  className = "",
}) => {
  return (
    <button
      onClick={onClick}
      className={`group relative inline-flex items-center justify-center p-2 rounded-lg transition-all duration-200 ${variantStyles[variant] || variantStyles.primary} ${className}`}
      title={label}
    >
      <Icon className="w-[18px] h-[18px]" />
      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
        {label}
      </span>
    </button>
  );
};

export default ActionButton;

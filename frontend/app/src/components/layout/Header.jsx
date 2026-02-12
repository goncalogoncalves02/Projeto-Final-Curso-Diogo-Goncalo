import { Menu } from "lucide-react";

const Header = ({ onMenuToggle }) => {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 text-white shadow-lg">
      <div className="flex items-center justify-between px-4 h-16">
        <h1 className="text-xl font-bold tracking-wider">
          ATEC<span className="text-blue-400">Gestão</span>
        </h1>
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
};

export default Header;

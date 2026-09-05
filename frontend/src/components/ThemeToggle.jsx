import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = ({ className = '', showLabel = false, size = 20 }) => {
    const { isDark, toggleTheme } = useTheme();

    if (showLabel) {
        return (
            <button
                type="button"
                onClick={toggleTheme}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all select-none cursor-pointer active:scale-95 ${
                    isDark 
                        ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${className}`}
                title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            >
                {isDark ? <Sun size={size} className="text-yellow-400" /> : <Moon size={size} className="text-gray-600" />}
                <span>{isDark ? 'Modo Claro' : 'Modo Oscuro'}</span>
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={toggleTheme}
            className={`p-2.5 rounded-full shadow-sm active:scale-95 transition-all select-none cursor-pointer flex items-center justify-center ${
                isDark
                    ? 'bg-gray-800 text-yellow-400 border border-gray-700 hover:bg-gray-700'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            } ${className}`}
            title={isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            aria-label="Alternar modo oscuro"
        >
            {isDark ? <Sun size={size} className="text-yellow-400" /> : <Moon size={size} className="text-gray-600" />}
        </button>
    );
};

export default ThemeToggle;

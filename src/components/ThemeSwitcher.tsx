"use client";

import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon, Palette } from 'lucide-react';

const themeIcons: Record<string, React.ReactNode> = {
    light: <Sun className="w-4 h-4" />,
    dark: <Moon className="w-4 h-4" />,
    cupcake: <Palette className="w-4 h-4" />,
    cyberpunk: <Palette className="w-4 h-4 text-secondary" />,
};

const themeLabels: Record<string, string> = {
    light: 'Light',
    dark: 'Dark',
    cupcake: 'Cupcake',
    cyberpunk: 'Cyberpunk',
};

export function ThemeSwitcher() {
    const { theme, setTheme, themes } = useTheme();

    return (
        <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
                {themeIcons[theme]}
            </div>
            <ul
                tabIndex={0}
                className="dropdown-content z-[100] menu p-2 shadow-lg bg-base-100 rounded-box w-40 border border-base-300"
            >
                {themes.map((t) => (
                    <li key={t}>
                        <button
                            className={`flex items-center gap-2 ${theme === t ? 'active' : ''}`}
                            onClick={() => setTheme(t)}
                        >
                            {themeIcons[t]}
                            <span>{themeLabels[t]}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

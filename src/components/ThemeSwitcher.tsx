"use client";

import { useTheme } from '@/context/ThemeContext';
import { Palette } from 'lucide-react';

const themeLabels: Record<string, string> = {
    light: '☀️ Light',
    dark: '🌙 Dark',
    cupcake: '🧁 Cupcake',
    bumblebee: '🐝 Bumblebee',
    emerald: '💎 Emerald',
    corporate: '🏢 Corporate',
    synthwave: '🌆 Synthwave',
    retro: '📺 Retro',
    cyberpunk: '🤖 Cyberpunk',
    valentine: '💕 Valentine',
    halloween: '🎃 Halloween',
    garden: '🌷 Garden',
    forest: '🌲 Forest',
    aqua: '🌊 Aqua',
    lofi: '🎵 Lo-Fi',
    pastel: '🎨 Pastel',
    fantasy: '🧚 Fantasy',
    wireframe: '📐 Wireframe',
    black: '⚫ Black',
    luxury: '💎 Luxury',
    dracula: '🧛 Dracula',
    cmyk: '🖨️ CMYK',
    autumn: '🍂 Autumn',
    business: '💼 Business',
    acid: '🧪 Acid',
    lemonade: '🍋 Lemonade',
    night: '🌃 Night',
    coffee: '☕ Coffee',
    winter: '❄️ Winter',
    dim: '🔅 Dim',
    nord: '🏔️ Nord',
    sunset: '🌅 Sunset',
};

export function ThemeSwitcher() {
    const { theme, setTheme, themes } = useTheme();

    return (
        <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
                <Palette className="w-5 h-5" />
            </div>
            <ul
                tabIndex={0}
                className="dropdown-content z-[100] menu p-2 shadow-lg bg-base-100 rounded-box w-52 max-h-96 overflow-y-auto border border-base-300"
            >
                <li className="menu-title">
                    <span>Pilih Tema</span>
                </li>
                {themes.map((t) => (
                    <li key={t}>
                        <button
                            className={`flex items-center gap-2 ${theme === t ? 'active' : ''}`}
                            onClick={() => setTheme(t)}
                        >
                            <span>{themeLabels[t] || t}</span>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

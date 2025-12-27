"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme =
    | 'light' | 'dark' | 'cupcake' | 'bumblebee' | 'emerald' | 'corporate'
    | 'synthwave' | 'retro' | 'cyberpunk' | 'valentine' | 'halloween' | 'garden'
    | 'forest' | 'aqua' | 'lofi' | 'pastel' | 'fantasy' | 'wireframe'
    | 'black' | 'luxury' | 'dracula' | 'cmyk' | 'autumn' | 'business'
    | 'acid' | 'lemonade' | 'night' | 'coffee' | 'winter' | 'dim' | 'nord' | 'sunset';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    themes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'webfiresale-theme';
const AVAILABLE_THEMES: Theme[] = [
    'light', 'dark', 'cupcake', 'bumblebee', 'emerald', 'corporate',
    'synthwave', 'retro', 'cyberpunk', 'valentine', 'halloween', 'garden',
    'forest', 'aqua', 'lofi', 'pastel', 'fantasy', 'wireframe',
    'black', 'luxury', 'dracula', 'cmyk', 'autumn', 'business',
    'acid', 'lemonade', 'night', 'coffee', 'winter', 'dim', 'nord', 'sunset'
];

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('light');
    const [mounted, setMounted] = useState(false);

    // Load theme from localStorage on mount
    useEffect(() => {
        const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
        if (storedTheme && AVAILABLE_THEMES.includes(storedTheme)) {
            setThemeState(storedTheme);
        }
        setMounted(true);
    }, []);

    // Apply theme to document when theme changes
    useEffect(() => {
        if (mounted) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem(THEME_STORAGE_KEY, theme);
        }
    }, [theme, mounted]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    // Prevent hydration mismatch by not rendering until mounted
    if (!mounted) {
        return null;
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme, themes: AVAILABLE_THEMES }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

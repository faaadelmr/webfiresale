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

    // Load theme from localStorage on mount, then check server
    useEffect(() => {
        const initTheme = async () => {
            // Check for preview theme in URL (used by admin theme preview)
            const urlParams = new URLSearchParams(window.location.search);
            const previewTheme = urlParams.get('previewTheme') as Theme | null;

            if (previewTheme && AVAILABLE_THEMES.includes(previewTheme)) {
                // Preview mode - use the theme from URL and skip API call
                setThemeState(previewTheme);
                setMounted(true);
                return;
            }

            // First try to get from localStorage for immediate render if available
            const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
            if (storedTheme && AVAILABLE_THEMES.includes(storedTheme)) {
                setThemeState(storedTheme);
            }

            setMounted(true);

            // Then fetch global theme from server to enforce admin choice
            try {
                const res = await fetch('/api/settings/theme');
                if (res.ok) {
                    const data = await res.json();
                    if (data.theme && AVAILABLE_THEMES.includes(data.theme)) {
                        setThemeState(data.theme);
                        // Optional: Force update localStorage to match server
                        localStorage.setItem(THEME_STORAGE_KEY, data.theme);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch global theme:', error);
            }
        };

        initTheme();
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

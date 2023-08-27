export type Theme = 'dark' | 'light';

export type ThemeContextValue = { theme: Theme; setTheme: (theme: Theme) => void };

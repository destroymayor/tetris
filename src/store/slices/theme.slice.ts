import type { StateCreator } from 'zustand';

export const THEMES = ['light', 'dark'] as const;

export type Theme = (typeof THEMES)[number];

const STORAGE_KEY = 'tetris.theme';
const DEFAULT_THEME: Theme = 'light';

function loadTheme(): Theme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && (THEMES as readonly string[]).includes(raw)) {
      return raw as Theme;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME;
}

function persistTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = theme;
}

export interface ThemeSlice {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
}

export const createThemeSlice: StateCreator<ThemeSlice> = (set, get) => {
  const initial = loadTheme();
  applyTheme(initial);

  return {
    theme: initial,

    setTheme: (theme) => {
      applyTheme(theme);
      persistTheme(theme);
      set({ theme });
    },

    cycleTheme: () => {
      const next: Theme = get().theme === 'light' ? 'dark' : 'light';
      applyTheme(next);
      persistTheme(next);
      set({ theme: next });
    },
  };
};

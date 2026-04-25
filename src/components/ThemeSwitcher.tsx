import { memo, useCallback, useEffect } from 'react';
import { useAppStore } from '@/store';
import { THEMES, type Theme } from '@/store/slices/theme.slice';

const THEME_LABELS: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
};

export const ThemeSwitcher = memo(function ThemeSwitcher() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const cycleTheme = useAppStore((s) => s.cycleTheme);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 't' && e.key !== 'T') return;
      const target = e.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
      e.preventDefault();
      cycleTheme();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cycleTheme]);

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="flex items-center gap-1.5"
    >
      {THEMES.map((id) => (
        <ThemeChip
          key={id}
          id={id}
          active={theme === id}
          onSelect={setTheme}
        />
      ))}
    </div>
  );
});

interface ThemeChipProps {
  id: Theme;
  active: boolean;
  onSelect: (id: Theme) => void;
}

const ThemeChip = memo(function ThemeChip({
  id,
  active,
  onSelect,
}: ThemeChipProps) {
  const handleClick = useCallback(() => onSelect(id), [id, onSelect]);
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      aria-pressed={active}
      onClick={handleClick}
      className="theme-chip"
    >
      {THEME_LABELS[id]}
    </button>
  );
});

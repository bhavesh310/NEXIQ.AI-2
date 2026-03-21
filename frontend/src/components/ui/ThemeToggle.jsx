import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '../ui/button';
import { useThemeStore } from '../../store';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useThemeStore();
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="w-9 h-9"
      data-testid="theme-toggle"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </Button>
  );
};


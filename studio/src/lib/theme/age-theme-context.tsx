'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getTheme, themeFromGrade, type AgeTheme, type ThemeConfig, AGE_THEMES } from './age-theme';

interface AgeThemeContextValue {
  theme: ThemeConfig;
  ageTheme: AgeTheme;
  grade: string | null;
  setGrade: (grade: string) => void;
}

const AgeThemeContext = createContext<AgeThemeContextValue>({
  theme: AGE_THEMES['default'],
  ageTheme: 'default',
  grade: null,
  setGrade: () => {},
});

export function AgeThemeProvider({ children }: { children: ReactNode }) {
  const [grade, setGradeState] = useState<string | null>(null);

  // Hydrate from storage on mount
  useEffect(() => {
    const saved =
      sessionStorage.getItem('learningJourney.grade') ||
      localStorage.getItem('learningJourney.grade');
    if (saved) setGradeState(saved);
  }, []);

  const setGrade = (g: string) => {
    setGradeState(g);
    sessionStorage.setItem('learningJourney.grade', g);
    localStorage.setItem('learningJourney.grade', g);
  };

  const ageTheme = themeFromGrade(grade);
  const theme = getTheme(grade);

  return (
    <AgeThemeContext.Provider value={{ theme, ageTheme, grade, setGrade }}>
      <div className={theme.rootClass}>{children}</div>
    </AgeThemeContext.Provider>
  );
}

export function useAgeTheme() {
  return useContext(AgeThemeContext);
}

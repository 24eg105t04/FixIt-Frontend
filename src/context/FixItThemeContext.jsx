
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { FIXIT_THEMES } from "../theme/fixitThemes";

const STORAGE_KEY = "fixit-theme";
const DEFAULT_THEME = "obsidian-mist";

const FixItThemeContext = createContext(null);

export function FixItThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved && FIXIT_THEMES[saved]
        ? saved
        : DEFAULT_THEME;
    } catch {
      return DEFAULT_THEME;
    }
  });

  const theme = FIXIT_THEMES[themeId];

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, themeId);
    } catch {
      // Theme selection still works for this session.
    }
  }, [themeId]);

  return (
    <FixItThemeContext.Provider
      value={{ themeId, theme, setThemeId, themes: FIXIT_THEMES }}
    >
      {children}
    </FixItThemeContext.Provider>
  );
}

export function useFixItTheme() {
  const context = useContext(FixItThemeContext);

  if (!context) {
    throw new Error(
      "useFixItTheme must be used inside FixItThemeProvider"
    );
  }

  return context;
}

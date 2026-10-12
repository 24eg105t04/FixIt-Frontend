
import WarpGradient from "./WarpGradient";
import { useFixItTheme } from "../../context/FixItThemeContext";
import { useEffect } from "react";

export default function FixItThemeShell({ children }) {
  const { themeId, theme } = useFixItTheme();

  const cssVariables = {
    "--fixit-bg": theme.background,
    "--fixit-surface": theme.surface,
    "--fixit-surface-alt": theme.surfaceAlt,
    "--fixit-text": theme.text,
    "--fixit-muted": theme.muted,
    "--fixit-accent": theme.accent,
    "--fixit-accent-foreground": theme.accentForeground,
    "--fixit-border": theme.border,
    colorScheme: theme.colorScheme || "dark",
    "--bg": theme.background,
    "--surface": theme.surface,
    "--surface-sunken": theme.surfaceAlt,
    "--ink": theme.text,
    "--muted": theme.muted,
    "--border": theme.border,
    "--border-soft": theme.border,
    "--primary": theme.accent,
    "--primary-strong": theme.accent,
    "--primary-tint": `color-mix(in srgb, ${theme.accent} 13%, transparent)`,
    "--secondary": theme.accent,
    "--secondary-tint": `color-mix(in srgb, ${theme.accent} 13%, transparent)`,
  };

  useEffect(() => {
    const root = document.documentElement;
    const variables = {
      "--fixit-bg": theme.background,
      "--fixit-surface": theme.surface,
      "--fixit-surface-alt": theme.surfaceAlt,
      "--fixit-text": theme.text,
      "--fixit-muted": theme.muted,
      "--fixit-accent": theme.accent,
      "--fixit-accent-foreground": theme.accentForeground,
      "--fixit-border": theme.border,
      "--bg": theme.background,
      "--surface": theme.surface,
      "--surface-sunken": theme.surfaceAlt,
      "--ink": theme.text,
      "--muted": theme.muted,
      "--border": theme.border,
      "--border-soft": theme.border,
      "--primary": theme.accent,
      "--primary-strong": theme.accent,
      "--primary-tint": `color-mix(in srgb, ${theme.accent} 13%, transparent)`,
      "--secondary": theme.accent,
      "--secondary-tint": `color-mix(in srgb, ${theme.accent} 13%, transparent)`,
    };
    root.dataset.theme = themeId;
    Object.entries(variables).forEach(([name, value]) => {
      root.style.setProperty(name, value);
    });
    root.style.colorScheme = theme.colorScheme || "dark";
  }, [theme, themeId]);

  return (
    <div
      className="fixit-theme-root"
      data-theme={themeId}
      style={cssVariables}
    >
      <div className="fixit-shader-background" aria-hidden="true">
        <WarpGradient
          colors={theme.shaderColors}
          {...theme.shader}
          grain={0}
        />
      </div>

      <div className="fixit-theme-content">
        {children}
      </div>
    </div>
  );
}

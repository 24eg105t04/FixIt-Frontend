
import { useState } from "react";
import { useFixItTheme } from "../../context/FixItThemeContext";

const swatches = {
  "butter-cream": ["#FFF6D8", "#D9C48C", "#473835"],
  "liquid-gold": ["#0B0907", "#7A5B2A", "#D9B06A"],
  "wine-ash": ["#09080B", "#48283F", "#A75E85"],
  "cyber-violet": ["#050509", "#5427A8", "#B76BFF"],
  "midnight-tide": ["#04090F", "#1F5F72", "#6FB3C2"],
  "obsidian-mist": ["#101214", "#202429", "#929DA8"],
};

export default function FixItThemeSwitcher() {
  const { themeId, setThemeId, themes } = useFixItTheme();
  const [open, setOpen] = useState(false);
  const theme = themes[themeId];

  return (
    <div className="fixit-theme-menu">
      <button
        type="button"
        className="fixit-theme-trigger"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="fixit-theme-trigger-dot" />
        <span>Appearance</span>
        <span className="fixit-theme-current">{theme.label}</span>
        <span aria-hidden="true">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixit-theme-dismiss"
            aria-label="Close appearance menu"
            onClick={() => setOpen(false)}
          />

          <div className="fixit-theme-dropdown">
            <div className="fixit-theme-dropdown-title">
              Choose your FixIt theme
            </div>

            {Object.entries(themes).map(([id, item]) => (
              <button
                type="button"
                key={id}
                className="fixit-theme-option"
                aria-pressed={themeId === id}
                onClick={() => {
                  setThemeId(id);
                  setOpen(false);
                }}
              >
                <span className="fixit-theme-swatches">
                  {swatches[id].map((color) => (
                    <span
                      key={color}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </span>

                <span>{item.label}</span>

                {themeId === id && (
                  <span className="fixit-theme-check">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

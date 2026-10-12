
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

import { FixItThemeProvider } from "./context/FixItThemeContext.jsx";
import FixItThemeShell from "./components/ui/FixItThemeShell.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <FixItThemeProvider>
      <FixItThemeShell>
        <App />
      </FixItThemeShell>
    </FixItThemeProvider>
  </StrictMode>
);

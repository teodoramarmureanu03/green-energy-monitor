import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "./lib/theme.tsx";
import { TimezoneProvider } from "./lib/timezone.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <TimezoneProvider>
          <App />
        </TimezoneProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);

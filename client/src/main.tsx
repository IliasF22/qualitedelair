import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { SourcePreferenceProvider } from "./context/SourcePreferenceContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <SourcePreferenceProvider>
        <App />
      </SourcePreferenceProvider>
    </BrowserRouter>
  </StrictMode>
);

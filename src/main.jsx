import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./App.css";
import "rodal/lib/rodal.css";
import "bootstrap/dist/css/bootstrap.css";
import { StrictMode } from "react";
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

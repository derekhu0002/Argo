import React from "react";
import { createRoot } from "react-dom/client";
import AgenticEngineeringEvidenceMap from "./AgenticEngineeringEvidenceMap";
import "./styles.css";

const container = document.getElementById("industry-cases-root");

if (!container) {
  throw new Error("Missing #industry-cases-root");
}

createRoot(container).render(
  <React.StrictMode>
    <AgenticEngineeringEvidenceMap />
  </React.StrictMode>,
);

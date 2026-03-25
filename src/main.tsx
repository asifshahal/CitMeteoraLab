import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { loadTokenLogos } from "./lib/tokenLogos";

loadTokenLogos();

createRoot(document.getElementById("root")!).render(<App />);

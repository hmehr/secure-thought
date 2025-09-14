import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Register Passage Elements
import '@passageidentity/passage-elements/passage-auth';

createRoot(document.getElementById("root")!).render(<App />);

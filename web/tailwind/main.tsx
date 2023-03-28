import { createRoot } from "react-dom/client";
import "./index.css";

const App = () => (
  <div>
    <h1 className="text-3xl font-bold underline">Hello 123!</h1>
  </div>
);

const root = document.getElementById("root") as HTMLElement;
createRoot(root).render(<App />);

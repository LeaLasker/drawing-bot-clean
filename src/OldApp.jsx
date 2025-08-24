import { useRef, useState } from "react";
import PromptInput from "./components/PromptInput";
import { drawFromJson } from "./canvas/drawEngine";

function App() {
  const canvasRef = useRef(null);
  const [history, setHistory] = useState([]);

const handlePromptSubmit = async (prompt) => {
  const ctx = canvasRef.current.getContext("2d");

  try {
    const response = await fetch("http://localhost:5203/api/drawing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      throw new Error("Server error");
    }

    const drawingCommands = await response.json();
    setHistory((prev) => [...prev, drawingCommands]);
    drawFromJson(ctx, drawingCommands);
  } catch (err) {
    console.error(err);
    alert("Failed to draw. Server or GPT error.");
  }
};


  const handleClear = () => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    setHistory([]);
  };

  const handleUndo = () => {
    const ctx = canvasRef.current.getContext("2d");
    const newHistory = [...history];
    newHistory.pop();
    setHistory(newHistory);
    const lastDrawing = newHistory[newHistory.length - 1];
    drawFromJson(ctx, lastDrawing || []);
  };

  return (
    <div style={{ padding: "30px", fontFamily: "sans-serif" }}>
      <h1>
        <span role="img" aria-label="palette">🎨</span> Drawing Bot
      </h1>

      <PromptInput onSubmit={handlePromptSubmit} />

      <div style={{ marginTop: "15px" }}>
        <button onClick={handleUndo} style={{ marginRight: "10px" }}>Undo</button>
        <button onClick={handleClear}>Clear</button>
      </div>

      <div style={{ marginTop: "30px" }}>
        <canvas
          ref={canvasRef}
          width={500}
          height={400}
          style={{ border: "1px solid black" }}
        />
      </div>
    </div>
  );
}

export default App;

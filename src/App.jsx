import { useRef, useState, useEffect } from "react";
import { drawFromJson } from "./canvas/drawEngine";
import DrawingBotUI from "./components/DrawingBotUI";

export default function App() {
  const canvasRef = useRef(null);
  const [drawingData, setDrawingData] = useState([]);

  const handleDraw = (cmds) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    setDrawingData(cmds);
    drawFromJson(ctx, cmds);
  };

  useEffect(() => {
    const container = document.getElementById("canvas-area");
    if (container && !canvasRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = 1000;
      canvas.height = 700;
      canvas.className = "border rounded bg-white";
      container.appendChild(canvas);
      canvasRef.current = canvas;
    }
  }, []);

  return (
    <div className="h-screen w-screen">
      <DrawingBotUI onDraw={handleDraw} drawingData={drawingData} />
    </div>
  );
}

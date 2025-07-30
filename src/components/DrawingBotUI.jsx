import { useState, useRef, useEffect } from 'react';

const DrawingCanvasInChat = ({ drawing }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !drawing || drawing.length === 0) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let maxX = 0;
    let maxY = 0;
    drawing.forEach((item) => {
      const xVals = [item.x, item.x1, item.x2, item.x3].filter(Number.isFinite);
      const yVals = [item.y, item.y1, item.y2, item.y3].filter(Number.isFinite);
      const shapeMaxX = Math.max(...xVals.map((x) => x + (item.width || item.radius || 0)));
      const shapeMaxY = Math.max(...yVals.map((y) => y + (item.height || item.radius || 0)));
      maxX = Math.max(maxX, shapeMaxX);
      maxY = Math.max(maxY, shapeMaxY);
    });

    const scaleX = canvas.width / (maxX || canvas.width);
    const scaleY = canvas.height / (maxY || canvas.height);
    const scale = Math.min(scaleX, scaleY, 1);

    drawing.forEach((item) => {
      ctx.beginPath();
      ctx.lineWidth = item.lineWidth || 2;
      ctx.strokeStyle = item.color || "black";
      ctx.fillStyle = item.color || "black";

      const scaleVal = (val) => val * scale;

      switch (item.shape) {
        case "circle":
          ctx.arc(scaleVal(item.x), scaleVal(item.y), scaleVal(item.radius), 0, 2 * Math.PI);
          ctx.stroke();
          break;
        case "rect":
          ctx.strokeRect(
            scaleVal(item.x),
            scaleVal(item.y),
            scaleVal(item.width),
            scaleVal(item.height)
          );
          break;
        case "line":
          ctx.moveTo(scaleVal(item.x1), scaleVal(item.y1));
          ctx.lineTo(scaleVal(item.x2), scaleVal(item.y2));
          ctx.stroke();
          break;
        case "triangle":
          ctx.moveTo(scaleVal(item.x1), scaleVal(item.y1));
          ctx.lineTo(scaleVal(item.x2), scaleVal(item.y2));
          ctx.lineTo(scaleVal(item.x3), scaleVal(item.y3));
          ctx.closePath();
          ctx.stroke();
          break;
        case "text":
          ctx.font = item.font || "16px Arial";
          ctx.fillText(item.text, scaleVal(item.x), scaleVal(item.y));
          break;
        default:
          break;
      }
    });
  }, [drawing]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={400}
      className="mt-2 rounded-lg border border-gray-300"
    />
  );
};

const describeDrawingData = (drawing) => {
  const descriptions = [];

  drawing.forEach(item => {
    let type = null;
    if (item.shape === "circle" && item.color === "yellow") {
      type = "sun";
    } else if (item.shape === "rect" && item.width > 50 && item.height > 50) {
      type = "house";
    } else if (item.shape === "circle" && item.color === "green") {
      type = "tree";
    } else if (item.shape === "rect" && item.color === "blue") {
      type = "water";
    }

    if (type) {
      const x = item.x ?? item.x1 ?? 0;
      const y = item.y ?? item.y1 ?? 0;
      const xPos = x < 100 ? "left" : x > 300 ? "right" : "center";
      const yPos = y < 100 ? "top" : y > 300 ? "bottom" : "middle";
      descriptions.push(`${type} (${xPos}-${yPos})`);
    }
  });

  return `Currently drawn: ${descriptions.join(", ") || "nothing yet"}.`;
};

export default function DrawingBotUI() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [drawingData, setDrawingData] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [allInstructions, setAllInstructions] = useState([]);
  const [loadId, setLoadId] = useState("");
  const [allUserDrawings, setAllUserDrawings] = useState([]);
  

  const handleLoadDrawing = async () => {
    if (!loadId.trim()) return;

    try {
      const res = await fetch(`http://localhost:5203/api/drawingstorage/${loadId}`);
      if (!res.ok) throw new Error("Drawing not found");

      const drawing = await res.json();
      console.log("🎯 מה חזר מהשרת:", drawing);
      console.log("🎯 פקודות:", drawing.commands?.$values);

      setDrawingData(drawing.commands?.$values || []);
      setMessages([{ role: 'bot', content: `🎨 נטען ציור מזהה ${loadId}` }]);
      setUndoStack([]);
      setRedoStack([]);
    } catch (err) {
      console.error(err);
      alert("שגיאה בטעינת הציור");
    }
  };
  const handleLoadAllDrawings = async () => {
    try {
      const res = await fetch("http://localhost:5203/api/users/1/drawings");
      if (!res.ok) throw new Error("Failed to fetch drawings");
      const raw = await res.json();

      console.log("🎯 כל מה שהשרת החזיר:", raw);

      const drawings = raw?.$values || [];

      const validDrawings = drawings.filter(d =>
        d?.commands?.$values &&
        Array.isArray(d.commands.$values) &&
        d.commands.$values.length > 0
      );

      if (validDrawings.length === 0) {
        alert("לא נמצאו ציורים עם פקודות תקפות");
        return;
      }

      setAllUserDrawings(validDrawings);
      alert(`🎨 נמצאו ${validDrawings.length} ציורים`);
    } catch (err) {
      console.error(err);
      alert("שגיאה בטעינת כל הציורים");
    }
  };


  const userId = 1; // ניתן לשנות כשיהיה login


  const handleSaveDrawing = async () => {
    try {
      const res = await fetch("http://localhost:5203/api/drawingstorage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: userId,
          title: "My Drawing",
          commands: drawingData
        })
      });

      if (!res.ok) throw new Error("Failed to save drawing");

      const id = await res.json();
      alert(`🎉 הציור נשמר בהצלחה! מזהה: ${id}`);
    } catch (err) {
      console.error(err);
      alert("שגיאה בשמירת הציור.");
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      const guidance = `
You are a drawing assistant.

You are given:
1. A list of drawing instructions that were already executed.
2. A list of all shapes currently on the canvas (JSON array).
3. A new drawing instruction in natural language.

Your task is:
- Analyze the new instruction.
- Understand what kind of object is requested.
- Decide how to draw it using basic shapes (circle, rect, triangle, line, text).
- Choose a location on the canvas that avoids overlap with existing objects.
- Use realistic proportions and placement based on the requested object and prior context.
- Do not draw anything already requested before.
- Do not duplicate or overwrite existing shapes.

🎯 Return only a JSON array containing the new shape(s).
      `;

      const drawingDescription = describeDrawingData(drawingData);
      const fullPrompt = `${guidance.trim()}\n\n${drawingDescription.trim()}\n\nYour task is to draw exactly the following: ${input.trim()}`;
      console.log("📤 נשלח לשרת:", {
        previousInstructions: allInstructions,
        existingDrawing: drawingData,
        newInstruction: input.trim()
      });

      const response = await fetch("http://localhost:5203/api/drawing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          previousInstructions: allInstructions,
          existingDrawing: drawingData,
          newInstruction: input.trim()
        })
      });

      if (!response.ok) throw new Error("Server error");

      const drawingCommands = await response.json();
      setAllInstructions(prev => [...prev, input.trim()]);

      console.log("🎨 פקודות ציור שהתקבלו:", drawingCommands);

      setUndoStack(prev => [...prev, drawingCommands]);
      setRedoStack([]);
      setMessages((prev) => [...prev, { role: 'bot', content: '🎨 ציור נוסף בהצלחה!' }]);
      setDrawingData((prev) => [...prev, ...drawingCommands]);
    } catch (err) {
      console.error(err);
      alert("Failed to draw. Server or GPT error.");
    }
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [last, ...prev]);
    setDrawingData(prev => prev.slice(0, -last.length));
    setMessages(prev => prev.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const [first, ...rest] = redoStack;
    setUndoStack(prev => [...prev, first]);
    setRedoStack(rest);
    setMessages(prev => [...prev, { role: 'bot', content: '🎨 ציור נוסף (Redo)' }]);
    setDrawingData(prev => [...prev, ...first]);
  };

  const handleClear = () => {
    const allUndos = drawingData.slice();
    setUndoStack(prev => [...prev, allUndos]);
    setRedoStack([]);
    setDrawingData([]);
    setMessages([]);
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      <div className="w-full flex flex-col p-6 border-gray-200 bg-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-700">🎨 Drawing #1</h2>
          <div className="flex gap-2">
            <button className="bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700 transition" onClick={handleSend}>Send</button>
            <button onClick={handleSaveDrawing} className="bg-green-600 text-white px-3 py-1 text-sm rounded hover:bg-green-700">Save</button>
            <button onClick={handleUndo} className="bg-yellow-500 text-white px-3 py-1 text-sm rounded hover:bg-yellow-600">Undo</button>
            <button onClick={handleRedo} className="bg-gray-500 text-white px-3 py-1 text-sm rounded hover:bg-gray-600">Redo</button>
            <button onClick={handleClear} className="bg-red-500 text-white px-3 py-1 text-sm rounded hover:bg-red-600">Clear</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-neutral-100 rounded shadow-inner">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`px-4 py-2 max-w-[75%] rounded-2xl text-sm shadow-sm ${msg.role === 'user'
                  ? 'bg-green-100 text-gray-800 rounded-br-none'
                  : 'bg-white text-gray-800 rounded-bl-none'
                  }`}
              >
                <div>{msg.content}</div>
              </div>
            </div>
          ))}

          {drawingData.length > 0 && (
            <div className="mt-4">
              <DrawingCanvasInChat drawing={drawingData} />
            </div>
          )}
        </div>
        {allUserDrawings.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-700">🖼️ כל הציורים שלך:</h3>
            <div className="flex flex-wrap gap-2">
              {allUserDrawings.map((drawing) => (
                <button
                  key={drawing.id}
                  onClick={() => {
                    setDrawingData(drawing.commands.$values);
                    setMessages([{ role: 'bot', content: `🎨 נטען ציור מזהה ${drawing.id}` }]);
                    setUndoStack([]);
                    setRedoStack([]);
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-sm text-gray-800 px-3 py-1 rounded"
                >
                  ציור #{drawing.id}
                </button>
              ))}
            </div>
          </div>
        )}


        <div className="flex gap-2 mt-4">
          <input
            className="border border-gray-300 px-4 py-2 flex-1 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="כתוב מה לצייר..."
          />
          <button
            className="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 shadow transition"
            onClick={handleSend}
          >
            שלח
          </button>
        </div>
        <div className="flex gap-2 mt-2">
          <input
            type="number"
            className="border border-gray-300 px-3 py-1 rounded"
            value={loadId}
            onChange={(e) => setLoadId(e.target.value)}
            placeholder="מזהה ציור לטעינה"
          />
          <button
            onClick={handleLoadDrawing}
            className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
          >
            Load
          </button>
          <button
            onClick={handleLoadAllDrawings}
            className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
          >
            Load All
          </button>

        </div>

      </div>
    </div>
  );
}

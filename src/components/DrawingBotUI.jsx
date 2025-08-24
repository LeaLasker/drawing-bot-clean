// src/DrawingBotUI.jsx
import { useState, useEffect, useRef } from "react";

export default function DrawingBotUI({ onDraw, drawingData }) {
  // ====== Theme (גווני פסטל שקופים תואמים) ======
  const THEME = {
    user: {
      bg: "rgba(174, 241, 208, 0.55)",       // Mint
      hover: "rgba(174, 241, 208, 0.70)",
      border: "rgba(120, 219, 180, 0.45)",
      tail: "rgba(174, 241, 208, 0.55)",
    },
    // מערכת: תכלת‑בהיר מאוד (כמעט לבן)
    bot: {
      bg: "rgba(235, 246, 255, 0.72)",
      hover: "rgba(235, 246, 255, 0.85)",
      border: "rgba(186, 210, 228, 0.48)",
      tail: "rgba(235, 246, 255, 0.72)",
    },
    inputBorder: "rgba(187, 160, 255, 0.45)",
    glassBorder: "rgba(255,255,255,0.55)",
    glassShadow: "0 10px 28px rgba(0,0,0,0.08)",
    buttons: {
      main: "rgba(174, 241, 208, 0.45)",
      mainHover: "rgba(174, 241, 208, 0.65)",
      alt: "rgba(222, 206, 255, 0.45)",
      altHover: "rgba(222, 206, 255, 0.65)",
      border: "rgba(255,255,255,0.6)",
    },
  };

  const [email, setEmail] = useState(() => localStorage.getItem("userEmail") || "");
  const [input, setInput] = useState("");
  const [allInstructions, setAllInstructions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loadId, setLoadId] = useState("");
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [allDrawings, setAllDrawings] = useState([]);

  const chatScrollRef = useRef(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("userEmail", email || "");
  }, [email]);

  const isEmailValid = (v) => /\S+@\S+\.\S+/.test(v);

  async function handleSend() {
    if (!input.trim() || !isEmailValid(email)) return;

    const userMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);

    const res = await fetch("http://localhost:5203/api/drawing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        previousInstructions: allInstructions,
        existingDrawing: drawingData,
        newInstruction: input.trim(),
      }),
    });

    if (!res.ok) {
      setMessages((prev) => [...prev, { role: "bot", content: "❌ שגיאה בשרת" }]);
      return;
    }

    const cmds = await res.json();
    setAllInstructions((prev) => [...prev, input.trim()]);
    setInput("");

    setUndoStack((prev) => [...prev, drawingData]);
    setRedoStack([]);
    onDraw([...drawingData, ...cmds]);

    setMessages((prev) => [...prev, { role: "bot", content: "🎨 ציור נוסף בהצלחה!" }]);
  }

  async function handleSave() {
    if (!isEmailValid(email)) {
      setMessages((prev) => [...prev, { role: "bot", content: "⚠️ נא להזין אימייל תקין לפני שמירה" }]);
      return;
    }
    const res = await fetch("http://localhost:5203/api/drawingstorage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        title: "My Drawing",
        commands: drawingData,
      }),
    });
    if (!res.ok) {
      setMessages((prev) => [...prev, { role: "bot", content: "❌ שמירה נכשלה" }]);
      return;
    }
    const id = await res.json();
    setMessages((prev) => [...prev, { role: "bot", content: `✅ נשמר! מזהה ציור: ${id}` }]);
  }

  async function handleLoadAll() {
    if (!isEmailValid(email)) {
      setMessages((prev) => [...prev, { role: "bot", content: "⚠️ נא להזין אימייל תקין לפני טעינה" }]);
      return;
    }
    const res = await fetch(
      `http://localhost:5203/api/users/by-email/${encodeURIComponent(email.trim())}/drawings`
    );
    if (!res.ok) {
      setMessages((prev) => [...prev, { role: "bot", content: "❌ טעינה נכשלה" }]);
      return;
    }
    const list = await res.json();
    const safe = Array.isArray(list) ? list : [];
    setAllDrawings(safe);
    setMessages((prev) => [...prev, { role: "bot", content: `📂 נמצאו ${safe.length} ציורים לחשבון הזה` }]);
  }

  async function handleLoadById() {
    if (!loadId.trim()) return;
    const res = await fetch(
      `http://localhost:5203/api/drawingstorage/${loadId}?email=${encodeURIComponent(email.trim())}`
    );
    if (!res.ok) {
      setMessages((prev) => [...prev, { role: "bot", content: "❌ ציור לא נמצא" }]);
      return;
    }
    const drawing = await res.json();
    onDraw(drawing.commands || []);
    setMessages((prev) => [...prev, { role: "bot", content: `🎨 נטען ציור מזהה ${loadId}` }]);
  }

  function handleClear() {
    setUndoStack((prev) => [...prev, drawingData]);
    onDraw([]);
    setMessages((prev) => [...prev, { role: "bot", content: "🧹 הציור נוקה" }]);
  }

  function handleUndo() {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [drawingData, ...prev]);
    onDraw(last);
    setMessages((prev) => [...prev, { role: "bot", content: "↩️ ביטול פעולה אחרונה" }]);
  }

  function handleRedo() {
    if (redoStack.length === 0) return;
    const [first, ...rest] = redoStack;
    setRedoStack(rest);
    setUndoStack((prev) => [...prev, drawingData]);
    onDraw(first);
    setMessages((prev) => [...prev, { role: "bot", content: "↪️ החזרת פעולה" }]);
  }

  return (
    <div
      className="grid grid-cols-[2fr_1fr] h-screen w-screen relative"
      // רקע רך מאחורי הכול + טקסטורה עדינה
      style={{
        background:
          "linear-gradient(180deg,#fafcff 0%, #f6fbff 40%, #f3fff7 100%), radial-gradient(900px 600px at 15% -10%, rgba(174,241,208,0.28) 0%, transparent 60%), radial-gradient(900px 600px at 110% 30%, rgba(222,206,255,0.25) 0%, transparent 55%), repeating-linear-gradient(45deg, rgba(0,0,0,0.02) 0 10px, rgba(0,0,0,0.03) 10px 20px)"
      }}
    >
      {/* שמאל: הקנבס – פאנל Glass */}
      <div className="p-3">
        <div
          className="h-full w-full rounded-2xl border bg-white/55 backdrop-blur-md"
          style={{ borderColor: THEME.glassBorder, boxShadow: THEME.glassShadow }}
        >
          <div id="canvas-area" className="w-full h-full rounded-2xl"></div>
        </div>
      </div>

      {/* ימין: הצ'אט – פאנל Glass */}
      <div className="p-3 flex flex-col">
        <div
          className="flex flex-col h-full rounded-2xl border bg-white/65 backdrop-blur-md overflow-hidden"
          style={{ borderColor: THEME.glassBorder, boxShadow: THEME.glassShadow }}
        >
          {/* אימייל */}
          <div className="p-3 border-b bg-white/55 backdrop-blur"
            style={{ borderColor: THEME.glassBorder }}>
            <input
              className="w-full px-3 py-2 rounded-xl border bg-white/70 outline-none focus:ring-2"
              style={{ borderColor: THEME.inputBorder }}
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* הודעות */}
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
            style={{
              background:
                "linear-gradient(180deg, rgba(222,206,255,0.10), rgba(174,241,208,0.10))"
            }}
          >
            {messages.map((m, idx) => {
              const isUser = m.role === "user";
              const palette = isUser ? THEME.user : THEME.bot;

              return (
                // השורה – יישור קבוע: משתמשת ימין, מערכת שמאל
                <div key={idx} className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
                  {/* הבועה */}
                  <div
                    className="relative max-w-[78%] px-4 py-2 rounded-2xl border shadow"
                    style={{
                      background: palette.bg,
                      borderColor: palette.border,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
                    }}
                  >
                    {m.content}

                    {/* זנב בסגנון וואטסאפ */}
                    <div
                      className="absolute bottom-1 w-0 h-0"
                      style={{
                        [isUser ? "right" : "left"]: "-9px",
                        borderWidth: "8px",
                        borderStyle: "solid",
                        borderColor: isUser
                          ? `transparent transparent ${palette.bg} transparent`
                          : `transparent ${palette.bg} transparent transparent`
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* רשימת ציורים אחרי Load All */}
          {allDrawings.length > 0 && (
            <div className="px-4 py-3 border-t bg-white/55 backdrop-blur"
              style={{ borderColor: THEME.glassBorder }}>
              <div className="text-sm text-gray-700 mb-2">נמצאו {allDrawings.length} ציורים:</div>
              <div className="flex flex-wrap gap-2">
                {allDrawings.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => onDraw(d.commands || [])}
                    className="px-3 py-1 rounded-xl text-sm border backdrop-blur-md"
                    style={{
                      background: THEME.buttons.alt,
                      borderColor: THEME.buttons.border
                    }}
                    title={d.title || `Drawing #${d.id}`}
                  >
                    ציור #{d.id}{d.title ? ` — ${d.title}` : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* שורת פקודה + כפתורים */}
          <div className="p-3 border-t bg-white/55 backdrop-blur"
            style={{ borderColor: THEME.glassBorder }}>
            <div className="flex items-center gap-2">
              <input
                className="flex-1 px-4 py-2 rounded-full border bg-white/80 outline-none focus:ring-2"
                style={{ borderColor: THEME.inputBorder }}
                placeholder="כתוב הודעה..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button
                onClick={handleSend}
                disabled={!isEmailValid(email)}
                className="px-4 py-2 rounded-full border backdrop-blur-md disabled:opacity-50 transition-colors"
                style={{
                  background: THEME.buttons.main,
                  borderColor: THEME.buttons.border
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = THEME.buttons.mainHover)}
                onMouseLeave={(e) => (e.currentTarget.style.background = THEME.buttons.main)}
              >
                ➤
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {[
                { label: "Save", onClick: handleSave, disabled: !isEmailValid(email), tone: "main" },
                { label: "Load All", onClick: handleLoadAll, disabled: !isEmailValid(email), tone: "alt" },
              ].map((b) => (
                <button
                  key={b.label}
                  className="px-3 py-1 rounded-xl border backdrop-blur-md shadow disabled:opacity-50 transition-colors"
                  style={{
                    background: b.tone === "main" ? THEME.buttons.main : THEME.buttons.alt,
                    borderColor: THEME.buttons.border
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      b.tone === "main" ? THEME.buttons.mainHover : THEME.buttons.altHover)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      b.tone === "main" ? THEME.buttons.main : THEME.buttons.alt)
                  }
                  onClick={b.onClick}
                  disabled={b.disabled}
                >
                  {b.label}
                </button>
              ))}

              <div className="flex gap-2 items-center">
                <input
                  className="px-3 py-1 rounded-xl border bg-white/80"
                  style={{ borderColor: THEME.inputBorder }}
                  placeholder="מזהה ציור"
                  value={loadId}
                  onChange={(e) => setLoadId(e.target.value)}
                />
                <button
                  className="px-3 py-1 rounded-xl border backdrop-blur-md transition-colors"
                  style={{ background: THEME.buttons.alt, borderColor: THEME.buttons.border }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = THEME.buttons.altHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = THEME.buttons.alt)}
                  onClick={handleLoadById}
                >
                  Load by ID
                </button>
              </div>

              {[
                { label: "Undo", onClick: handleUndo },
                { label: "Redo", onClick: handleRedo },
                { label: "Clear", onClick: handleClear },
              ].map((b, i) => (
                <button
                  key={b.label}
                  className="px-3 py-1 rounded-xl border backdrop-blur-md shadow transition-colors"
                  style={{
                    background: i === 2 ? THEME.buttons.alt : THEME.buttons.main,
                    borderColor: THEME.buttons.border
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      i === 2 ? THEME.buttons.altHover : THEME.buttons.mainHover)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      i === 2 ? THEME.buttons.alt : THEME.buttons.main)
                  }
                  onClick={b.onClick}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

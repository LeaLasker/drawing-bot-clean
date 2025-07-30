import { useState } from "react";

function PromptInput({ onSubmit }) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = () => {
    if (prompt.trim() !== "") {
      onSubmit(prompt);
      setPrompt(""); // ננקה אחרי שליחה
    }
  };

  return (
    <div>
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe what to draw..."
        style={{ width: "300px", padding: "5px" }}
      />
      <button onClick={handleSubmit} style={{ marginLeft: "10px" }}>
        Draw
      </button>
    </div>
  );
}

export default PromptInput;
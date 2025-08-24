# Drawing Bot 🎨

This is a smart drawing assistant powered by GPT.

Just type something like:

> “Draw a tree next to a house with the sun above”

And it will create a simple sketch using basic shapes like circles, rectangles, and lines.

---

## 🧠 What it does
- Turns English prompts into schematic drawings
- Uses GPT to understand and generate drawing instructions
- Draws shapes on canvas with correct placement
- Remembers what was already drawn (no duplicates)
- Supports undo / redo / clear / save / load (per user)

---

## ▶️ How to run

1. Clone the project
This will download the full project to your machine.

bash
Copy
Edit
git clone https://github.com/LeaLasker/drawing-bot-clean.git
cd drawing-bot-clean

2. Start the client (React)
This runs the frontend on http://localhost:5173

bash
Copy
Edit
cd drawing-bot-client
npm install
npm run dev

3. Start the server (ASP.NET Core)
This runs the backend API on http://localhost:5203

bash
Copy
Edit
cd server
dotnet run
Make sure you have the .NET SDK installed.

🔐 OpenAI API Key
This project does not include an API key.
To add yours, create a file:

plaintext
Copy
Edit
server/appsettings.json
With this content:

json
Copy
Edit
{
  "OpenAI": {
    "ApiKey": "your-openai-api-key-here"
  }
}
You can get a key at: https://platform.openai.com/api-keys

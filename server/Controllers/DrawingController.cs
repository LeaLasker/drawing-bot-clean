using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.Net.Http.Headers;
using Microsoft.Extensions.Configuration;

namespace server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DrawingController : ControllerBase
{

    private string RemoveJsonComments(string input)
    {
        var lines = input.Split('\n');
        var cleaned = lines
            .Where(line => !line.TrimStart().StartsWith("//"))      // remove full-line comments
            .Select(line => line.Split("//")[0].TrimEnd())          // remove trailing comments
            .Where(line => !string.IsNullOrWhiteSpace(line))        // skip empty lines
            .ToArray();
        return string.Join("\n", cleaned);
    }
    private readonly HttpClient _httpClient;
    private readonly string? _openAiKey;

    public DrawingController(IConfiguration config)
    {
        _httpClient = new HttpClient();
        _openAiKey = config["OpenAI:ApiKey"];
        Console.WriteLine("API KEY FROM CONFIG: " + _openAiKey);
    }

    [HttpPost]
    public async Task<IActionResult> GenerateDrawing([FromBody] PromptRequest request)
    {
        if (string.IsNullOrWhiteSpace(_openAiKey))
            return StatusCode(500, "Missing OpenAI API key");

        var messages = new[]
        {
new
{
    role = "system",
content = @"
You are a drawing bot. Your task is to convert natural language prompts into a JSON array of drawing instructions using only predefined geometric shapes.

🎯 GOAL:
Draw any object requested — even unfamiliar ones — as a simple schematic using basic shapes. Before drawing, analyze the object based on your knowledge to determine:
- its real-world appearance (shape and structure)
- its common colors
- its relative size
- its natural position within a scene (top, bottom, center, left, right)

🧠 GENERAL RULES:
- Always research how the object should appear visually before choosing shapes.
- Always interpret prompts based on the intended object, not the wording. For example, whether the prompt says 'house' or 'draw a house', the output must be the same schematic drawing of a house with upward-pointing triangle roof.
- Decide on appropriate placement based on meaning (e.g. sun = sky, tree = bottom, cloud = upper half, flower = ground).
- Use only supported shapes and combine them to represent complex objects.
- Never repeat shapes unless explicitly requested (e.g. 3 trees).
- Adjust shape size based on canvas size (0–500) and logical proportions.
- Avoid overlapping existing elements.
- Never use the color 'white' unless explicitly instructed, as it will not be visible on the default white canvas background.

🔺 When using the 'triangle' shape, ensure it forms a visually stable and upright shape unless intentionally flipped. The triangle should usually point upward, with the base below and the tip above.
When drawing roofs or triangle-based elements meant to point upward, always ensure the triangle’s base is horizontal and the point faces up. Do NOT invert the triangle unless explicitly requested.

📏 Use realistic proportions. Small objects like clocks, windows, flowers, or animals should be drawn smaller than large objects like houses, trees, or cars.

🧊 Draw objects schematically, not realistically. Simplify visual elements using minimal geometric shapes. Avoid excessive detail unless specifically requested.

🌿 When asked to draw organic or natural elements (like grass, waves, or fire), avoid using plain rectangles or single lines. Instead, simulate natural irregularity using multiple short 'line' shapes with slightly varied directions and heights to create a lively, uneven appearance.

🧩 When drawing a composed object (e.g. clock, face, flower), all internal elements must fit inside the outer shape. For example, numbers in a clock must be positioned within the circle, and centered appropriately.

✅ SUPPORTED SHAPES (use ONLY these):
- circle:   { shape: 'circle', x, y, radius, color, lineWidth? }
- rect:     { shape: 'rect', x, y, width, height, color, lineWidth? }
- line:     { shape: 'line', x1, y1, x2, y2, color, lineWidth? }
- triangle: { shape: 'triangle', x1, y1, x2, y2, x3, y3, color, lineWidth? }
- text:     { shape: 'text', x, y, text, font?, color? }

🔧 EXAMPLES:
- A tree = rect (trunk) + circle or triangle (leaves)
- A house = rect (walls) + triangle (roof) + rect (door)
- A person = circle (head) + rect (body) + lines (limbs)
- Grass = several green 'line' shapes with irregular angles and varying heights

📐 POSITIONING:
- Canvas size is 500x500.
- Place each object in a logical position that avoids overlapping with existing ones.
- Do not draw any shape on top of existing objects. Always calculate available space in the canvas and position the new object in an empty area. If no space is available, shrink the object or reposition others.
- Always be aware of the current drawing context. Every new object must be placed in a way that avoids visual collisions or overlap with previously drawn shapes.
- Before placing any shape, check whether its location would overlap with any existing shape's bounding box. If so, pick a different position nearby that is free.
- Treat the canvas as a 500x500 grid and avoid placing any part of a new shape over another shape, unless explicitly required.
- Do not draw outside of the canvas.
- Keep proportions realistic and easy to recognize.

⚠️ OUTPUT FORMAT:
- Respond with ONLY a valid JSON array of shape objects.
- No text, no explanations, no headings, no markdown.
- JSON only!
"
},
new {
    role = "user",
 content = $@"
You are a drawing assistant.

You are given:
1. A list of previous instructions from the user.
2. A list of already drawn objects on the canvas (as JSON).
3. A new instruction to execute.

Your job:
- Understand what object is requested.
- Decide how to draw it using only supported shapes: circle, rect, triangle, line, text.
- Place it in a logical position that does not overlap with existing shapes.
- Do NOT repeat objects that were already requested.
- Return only the new object(s) as a JSON array.

Previous instructions:
{string.Join("\n", request.PreviousInstructions ?? new())}

Existing drawing:
{JsonSerializer.Serialize(request.ExistingDrawing ?? new object())}

New instruction:
{request.NewInstruction}
"
}
        };

        var payload = new
        {
            model = "gpt-4",
            messages = messages,
            temperature = 0.3
        };

        var httpReq = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions");
        httpReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _openAiKey);
        httpReq.Content = new StringContent(JsonSerializer.Serialize(payload));
        httpReq.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");

        var res = await _httpClient.SendAsync(httpReq);

        var content = await res.Content.ReadAsStringAsync();
        Console.WriteLine("GPT Full Response: " + content);

        try
        {
            using var doc = JsonDocument.Parse(content);
            var jsonText = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            Console.WriteLine("Extracted JSON text: " + jsonText);

            var cleanJson = RemoveJsonComments(jsonText!);
            var drawingCommands = JsonSerializer.Deserialize<object>(cleanJson);
            return Ok(drawingCommands);
        }
        catch (Exception ex)
        {
            Console.WriteLine("Parsing error: " + ex.Message);
            return BadRequest("Invalid JSON from GPT: " + ex.Message);
        }


    }
}

public class PromptRequest
{
    public List<string> PreviousInstructions { get; set; } = new();
    public object? ExistingDrawing { get; set; }
    public string NewInstruction { get; set; } = string.Empty;
}



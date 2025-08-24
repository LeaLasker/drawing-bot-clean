using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.Net.Http.Headers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class DrawingController : ControllerBase
{
    private readonly HttpClient _httpClient;
    private readonly string? _openAiKey;
    private readonly ILogger<DrawingController> _logger;

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public DrawingController(IConfiguration config, ILogger<DrawingController> logger)
    {
        _httpClient = new HttpClient();
        _openAiKey = config["OpenAI:ApiKey"];
        _logger = logger;
    }

    private static string RemoveJsonComments(string input)
    {
        var lines = input.Split('\n');
        var cleaned = lines
            .Where(line => !line.TrimStart().StartsWith("//"))
            .Select(line => line.Split("//")[0].TrimEnd())
            .Where(line => !string.IsNullOrWhiteSpace(line))
            .ToArray();
        return string.Join("\n", cleaned);
    }

    [HttpPost]
    public async Task<IActionResult> GenerateDrawing([FromBody] PromptRequest request)
    {
        if (string.IsNullOrWhiteSpace(_openAiKey))
            return StatusCode(500, new { error = "Missing OpenAI API key" });

        if (request is null || string.IsNullOrWhiteSpace(request.NewInstruction))
            return BadRequest(new { error = "Request body or NewInstruction is missing" });

        var systemPrompt = @"
You are a drawing bot. Convert natural-language prompts into a JSON array of drawing instructions using ONLY the predefined shapes listed below.

🎯 GOAL
- Draw only what the user explicitly requests, using schematic basic shapes.
- Analyze the requested object: structure, typical colors, size, and logical position in a scene.
- Keep the output minimal and clear.

🧠 GENERAL RULES
- Interpret the user’s intention, not wording nuances.
- Use only supported shapes; combine them to form complex objects if needed.
- Do not repeat objects unless explicitly requested.
- Everything must stay inside a 1000x700 canvas.
- Avoid overlaps: before placing a shape, ensure its bounding box does not collide with existing ones.
- Never use white unless explicitly asked.
- Triangles must be upright and stable unless explicitly requested otherwise.
- Organic elements (grass, fire, waves, clouds) = multiple short irregular lines, not a single rectangle.

✅ SUPPORTED SHAPES (exact schema)
- circle   { ""shape"": ""circle"", ""x"": int, ""y"": int, ""radius"": int, ""color"": string, ""lineWidth""?: int }
- rect     { ""shape"": ""rect"", ""x"": int, ""y"": int, ""width"": int, ""height"": int, ""color"": string, ""lineWidth""?: int }
- line     { ""shape"": ""line"", ""x1"": int, ""y1"": int, ""x2"": int, ""y2"": int, ""color"": string, ""lineWidth""?: int }
- triangle { ""shape"": ""triangle"", ""x1"": int, ""y1"": int, ""x2"": int, ""y2"": int, ""x3"": int, ""y3"": int, ""color"": string, ""lineWidth""?: int }
- text     { ""shape"": ""text"", ""x"": int, ""y"": int, ""text"": string, ""font""?: string, ""color""?: string }

📐 POSITIONING
- Ground objects (house, tree, flowers, grass, etc.) must share the SAME baseline near y ≈ 650.
- Sun/clouds/birds belong in the upper half.
- Do NOT add background elements unless explicitly requested.
- If sky requested: draw ONE wide light-blue rectangle at the top; clouds/birds go inside it.
- Never overlap with existing objects. Never draw outside the 1000x700 canvas.

⚠️ CRITICAL OUTPUT RULES
- Respond ONLY with a valid JSON array.
- No explanations, no markdown, no comments.
- Any non-JSON output is invalid.
";

        var userPrompt = $@"
Previous instructions:
{string.Join("\n", request.PreviousInstructions ?? new())}

Existing drawing:
{JsonSerializer.Serialize(request.ExistingDrawing ?? new object(), JsonOpts)}

New instruction:
{request.NewInstruction}";

        var messages = new object[]
        {
            new { role = "system", content = systemPrompt },
            new { role = "user",   content = userPrompt }
        };

        var payload = new
        {
            model = "gpt-5-mini",
            messages
        };

        var httpReq = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions")
        {
            Content = new StringContent(JsonSerializer.Serialize(payload, JsonOpts))
        };
        httpReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _openAiKey);
        httpReq.Content.Headers.ContentType = new MediaTypeHeaderValue("application/json");

        HttpResponseMessage res;
        try
        {
            res = await _httpClient.SendAsync(httpReq);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed calling OpenAI API");
            return StatusCode(502, new { error = "Upstream OpenAI call failed" });
        }

        var content = await res.Content.ReadAsStringAsync();

        if (!res.IsSuccessStatusCode)
        {
            _logger.LogError("OpenAI API error: {Status} {Body}", (int)res.StatusCode, content);
            return StatusCode(502, new { error = "OpenAI returned an error", status = (int)res.StatusCode });
        }

        try
        {
            using var doc = JsonDocument.Parse(content);
            var messageNode = doc.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message");

            if (!messageNode.TryGetProperty("content", out var contentNode))
                return BadRequest(new { error = "Missing content from OpenAI response" });

            var rawJson = contentNode.GetString();
            if (string.IsNullOrWhiteSpace(rawJson))
                return BadRequest(new { error = "Empty content from OpenAI response" });

            var cleanJson = RemoveJsonComments(rawJson);
            var drawingCommands = JsonSerializer.Deserialize<object>(cleanJson, JsonOpts);

            if (drawingCommands is null)
                return BadRequest(new { error = "Could not parse JSON content from OpenAI" });

            return Ok(drawingCommands);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed parsing OpenAI response");
            return BadRequest(new { error = "Invalid JSON from OpenAI" });
        }
    }
}

public class PromptRequest
{
    public List<string> PreviousInstructions { get; set; } = new();
    public object? ExistingDrawing { get; set; }
    public string NewInstruction { get; set; } = string.Empty;
}

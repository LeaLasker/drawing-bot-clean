using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Models;
using server.DTOs;

namespace server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class DrawingStorageController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<DrawingStorageController> _logger;

    public DrawingStorageController(AppDbContext context, ILogger<DrawingStorageController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // POST: api/drawingstorage
    [HttpPost]
    public async Task<IActionResult> SaveDrawing([FromBody] SaveDrawingRequest req)
    {
        if (req is null || string.IsNullOrWhiteSpace(req.Email))
            return BadRequest(new { error = "Email is required." });

        var email = req.Email.Trim().ToLowerInvariant();

        try
        {
            var user = await _context.Users.SingleOrDefaultAsync(u => u.Email == email);
            if (user == null)
            {
                user = new User { Email = email, Username = email };
                _context.Users.Add(user);
                await _context.SaveChangesAsync();
            }

            var commands = (req.Commands ?? new List<SaveDrawingCommand>())
                .Select(c => new DrawingCommand
                {
                    Shape = c.Shape,
                    Color = c.Color,
                    X = c.X,
                    Y = c.Y,
                    Radius = c.Radius,
                    Width = c.Width,
                    Height = c.Height,
                    X1 = c.X1,
                    Y1 = c.Y1,
                    X2 = c.X2,
                    Y2 = c.Y2,
                    X3 = c.X3,
                    Y3 = c.Y3,
                    LineWidth = c.LineWidth,
                    Text = c.Text,
                    Font = c.Font
                })
                .ToList();

            var drawing = new Drawing
            {
                Title = req.Title,
                UserId = user.Id,
                CreatedAt = DateTime.UtcNow,
                Commands = commands
            };

            _context.Drawings.Add(drawing);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetDrawing), new { id = drawing.Id }, drawing.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving drawing for {Email}", email);
            return StatusCode(500, new { error = "Server error while saving the drawing." });
        }
    }

    // GET: api/drawingstorage/{id}?email=...
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetDrawing(int id, [FromQuery] string? email = null)
    {
        try
        {
            var query = _context.Drawings
                .Include(d => d.Commands)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(email))
            {
                var e = email.Trim().ToLowerInvariant();
                query = query.Where(d => d.User != null && d.User.Email == e);
            }

            var drawing = await query.FirstOrDefaultAsync(d => d.Id == id);
            if (drawing == null) return NotFound();

            // החזרה כ-DTO “שטוח” כדי למנוע מעגלי סריאליזציה
            var dto = new
            {
                id = drawing.Id,
                title = drawing.Title,
                createdAt = drawing.CreatedAt,
                commands = drawing.Commands.Select(c => new
                {
                    id = c.Id,
                    shape = c.Shape,
                    color = c.Color,
                    x = c.X,
                    y = c.Y,
                    radius = c.Radius,
                    width = c.Width,
                    height = c.Height,
                    x1 = c.X1,
                    y1 = c.Y1,
                    x2 = c.X2,
                    y2 = c.Y2,
                    x3 = c.X3,
                    y3 = c.Y3,
                    lineWidth = c.LineWidth,
                    text = c.Text,
                    font = c.Font
                }).ToList()
            };

            return Ok(dto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading drawing with id {Id}", id);
            return StatusCode(500, new { error = "Server error while loading the drawing." });
        }
    }

    // GET: api/users/by-email/{email}/drawings
    [HttpGet("~/api/users/by-email/{email}/drawings")]
    public async Task<IActionResult> GetDrawingsByEmail(string email)
    {
        var e = email.Trim().ToLowerInvariant();

        try
        {
            var drawings = await _context.Drawings
                .Where(d => d.User != null && d.User.Email == e)
                .Include(d => d.Commands)
                .OrderByDescending(d => d.CreatedAt)
                .Select(d => new
                {
                    id = d.Id,
                    title = d.Title,
                    createdAt = d.CreatedAt,
                    commands = d.Commands.Select(c => new
                    {
                        id = c.Id,
                        shape = c.Shape,
                        color = c.Color,
                        x = c.X,
                        y = c.Y,
                        radius = c.Radius,
                        width = c.Width,
                        height = c.Height,
                        x1 = c.X1,
                        y1 = c.Y1,
                        x2 = c.X2,
                        y2 = c.Y2,
                        x3 = c.X3,
                        y3 = c.Y3,
                        lineWidth = c.LineWidth,
                        text = c.Text,
                        font = c.Font
                    }).ToList()
                })
                .ToListAsync();

            return Ok(drawings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error loading drawings for {Email}", e);
            return StatusCode(500, new { error = "Server error while loading drawings." });
        }
    }
}

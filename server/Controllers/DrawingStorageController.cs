using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Models;
using System.Text.Json;

namespace server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DrawingStorageController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DrawingStorageController(AppDbContext context)
        {
            _context = context;
        }

        // POST api/drawingstorage
        [HttpPost]
        public async Task<IActionResult> SaveDrawing([FromBody] Drawing drawing)
        {
            try
            {
                Console.WriteLine("📥 מתקבל ציור: " + JsonSerializer.Serialize(drawing));

                _context.Drawings.Add(drawing);
                await _context.SaveChangesAsync();

                return Ok(drawing.Id);
            }
            catch (Exception ex)
            {
                Console.WriteLine("❌ שגיאה בשמירה: " + ex.Message);

                if (ex.InnerException != null)
                {
                    Console.WriteLine("🧨 שגיאה פנימית: " + ex.InnerException.Message);
                }

                return StatusCode(500, "שגיאה בשרת: " + ex.Message);
            }

        }


        // GET api/drawingstorage/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetDrawing(int id)
        {
            try
            {
                Console.WriteLine($"📥 ניסיון לטעון ציור עם ID = {id}");

                var drawing = await _context.Drawings
                    .Include(d => d.Commands)
                    .FirstOrDefaultAsync(d => d.Id == id);

                if (drawing == null)
                {
                    Console.WriteLine("❌ לא נמצא ציור במסד הנתונים");
                    return NotFound();
                }

                Console.WriteLine("✅ ציור נטען בהצלחה");
                return Ok(drawing);
            }
            catch (Exception ex)
            {
                Console.WriteLine("❌ שגיאה בטעינה: " + ex.Message);
                if (ex.InnerException != null)
                    Console.WriteLine("🧨 פנימית: " + ex.InnerException.Message);
                return StatusCode(500, "שגיאה בשרת: " + ex.Message);
            }
        }


        // GET api/users/3/drawings
        [HttpGet("/api/users/{userId}/drawings")]
        public async Task<IActionResult> GetDrawingsByUser(int userId)
        {
            var drawings = await _context.Drawings
                .Where(d => d.UserId == userId)
                .Include(d => d.Commands)
                .ToListAsync();

            return Ok(drawings);
        }
    }
}

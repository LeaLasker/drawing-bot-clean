using Microsoft.EntityFrameworkCore;
using server.Models; // ודאי שזה תואם לשמות המרחבים שלך

namespace server.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {}

        public DbSet<User> Users { get; set; }
        public DbSet<Drawing> Drawings { get; set; }
        public DbSet<DrawingCommand> DrawingCommands { get; set; }
    }
}

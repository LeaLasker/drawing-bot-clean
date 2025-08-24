using Microsoft.EntityFrameworkCore;
using server.Models;

namespace server.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Drawing> Drawings { get; set; } = null!;
        public DbSet<DrawingCommand> DrawingCommands { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User -> Drawings (1..*)
            modelBuilder.Entity<Drawing>()
                .HasOne(d => d.User)
                .WithMany(u => u.Drawings)
                .HasForeignKey(d => d.UserId)
                .IsRequired()
                .OnDelete(DeleteBehavior.Restrict);

            // Drawing -> DrawingCommands (1..*)
            modelBuilder.Entity<DrawingCommand>()
                .HasOne(c => c.Drawing)
                .WithMany(d => d.Commands)
                .HasForeignKey(c => c.DrawingId)
                .IsRequired()
                .OnDelete(DeleteBehavior.Cascade);

            // Keys
            modelBuilder.Entity<User>().HasKey(x => x.Id);
            modelBuilder.Entity<Drawing>().HasKey(x => x.Id);
            modelBuilder.Entity<DrawingCommand>().HasKey(x => x.Id);

            // Unique index on Email
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique()
                .HasFilter("[Email] IS NOT NULL");
        }
    }
}

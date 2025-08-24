using server.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        o.JsonSerializerOptions.WriteIndented = false;
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowClient", p =>
        p.WithOrigins("http://localhost:5173")
         .AllowAnyHeader()
         .AllowAnyMethod());
});

var cs = builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=drawings.db";
builder.Services.AddDbContext<AppDbContext>(opt => opt.UseSqlite(cs));

var app = builder.Build();

app.UseCors("AllowClient");
app.MapControllers();
app.Run();

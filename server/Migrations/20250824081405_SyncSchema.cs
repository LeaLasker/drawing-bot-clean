using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class SyncSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Users",
                type: "TEXT",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Shape",
                table: "DrawingCommands",
                type: "TEXT",
                maxLength: 32,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Font",
                table: "DrawingCommands",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LineWidth",
                table: "DrawingCommands",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Text",
                table: "DrawingCommands",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<float>(
                name: "X1",
                table: "DrawingCommands",
                type: "REAL",
                nullable: true);

            migrationBuilder.AddColumn<float>(
                name: "X2",
                table: "DrawingCommands",
                type: "REAL",
                nullable: true);

            migrationBuilder.AddColumn<float>(
                name: "X3",
                table: "DrawingCommands",
                type: "REAL",
                nullable: true);

            migrationBuilder.AddColumn<float>(
                name: "Y1",
                table: "DrawingCommands",
                type: "REAL",
                nullable: true);

            migrationBuilder.AddColumn<float>(
                name: "Y2",
                table: "DrawingCommands",
                type: "REAL",
                nullable: true);

            migrationBuilder.AddColumn<float>(
                name: "Y3",
                table: "DrawingCommands",
                type: "REAL",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true,
                filter: "[Email] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_Email",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Font",
                table: "DrawingCommands");

            migrationBuilder.DropColumn(
                name: "LineWidth",
                table: "DrawingCommands");

            migrationBuilder.DropColumn(
                name: "Text",
                table: "DrawingCommands");

            migrationBuilder.DropColumn(
                name: "X1",
                table: "DrawingCommands");

            migrationBuilder.DropColumn(
                name: "X2",
                table: "DrawingCommands");

            migrationBuilder.DropColumn(
                name: "X3",
                table: "DrawingCommands");

            migrationBuilder.DropColumn(
                name: "Y1",
                table: "DrawingCommands");

            migrationBuilder.DropColumn(
                name: "Y2",
                table: "DrawingCommands");

            migrationBuilder.DropColumn(
                name: "Y3",
                table: "DrawingCommands");

            migrationBuilder.AlterColumn<string>(
                name: "Shape",
                table: "DrawingCommands",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "TEXT",
                oldMaxLength: 32);
        }
    }
}

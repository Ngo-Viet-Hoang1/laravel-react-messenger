using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MessengerApp.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDenormalizedMessageReactions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Reactions",
                table: "Messages",
                type: "jsonb",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "Messages",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Reactions",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "Messages");
        }
    }
}

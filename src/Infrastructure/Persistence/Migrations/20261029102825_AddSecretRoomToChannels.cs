using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MessengerApp.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSecretRoomToChannels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Content",
                table: "Messages",
                type: "character varying(65536)",
                maxLength: 65536,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(5000)",
                oldMaxLength: 5000);

            migrationBuilder.AddColumn<string>(
                name: "EncryptionSalt",
                table: "Channels",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsSecret",
                table: "Channels",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EncryptionSalt",
                table: "Channels");

            migrationBuilder.DropColumn(
                name: "IsSecret",
                table: "Channels");

            migrationBuilder.AlterColumn<string>(
                name: "Content",
                table: "Messages",
                type: "character varying(5000)",
                maxLength: 5000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(65536)",
                oldMaxLength: 65536);
        }
    }
}

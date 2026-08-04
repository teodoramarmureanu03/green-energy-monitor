using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CountryZones",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    IsoCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    ZoneCode = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CountryZones", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "EnergySources",
                columns: table => new
                {
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IsRenewable = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EnergySources", x => x.Code);
                });

            migrationBuilder.CreateTable(
                name: "GenerationChartPoints",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    IsoCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CountryName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PeriodType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    PeriodStart = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PeriodEnd = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Total = table.Column<double>(type: "double precision", nullable: false),
                    RenewableMw = table.Column<double>(type: "double precision", nullable: false),
                    RenewablePct = table.Column<double>(type: "double precision", nullable: false),
                    WindMw = table.Column<double>(type: "double precision", nullable: false),
                    SolarMw = table.Column<double>(type: "double precision", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GenerationChartPoints", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "GenerationRecords",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    IsoCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CountryName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FetchedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Total = table.Column<double>(type: "double precision", nullable: false),
                    RenewableMw = table.Column<double>(type: "double precision", nullable: false),
                    RenewablePct = table.Column<double>(type: "double precision", nullable: false),
                    BySourceJson = table.Column<string>(type: "text", nullable: false),
                    ZonesAggregatedJson = table.Column<string>(type: "text", nullable: false),
                    CountryIso = table.Column<string>(type: "text", nullable: false),
                    ZoneCode = table.Column<string>(type: "text", nullable: false),
                    EnergySourceCode = table.Column<string>(type: "text", nullable: false),
                    EnergySourceName = table.Column<string>(type: "text", nullable: false),
                    IsRenewable = table.Column<bool>(type: "boolean", nullable: false),
                    ValueMw = table.Column<double>(type: "double precision", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GenerationRecords", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Email = table.Column<string>(type: "text", nullable: false),
                    PasswordHash = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ViewerTimezonePreferences",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ClientId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CountryIso = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    TimeZone = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ViewerTimezonePreferences", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GenerationChartPoints_IsoCode_PeriodType_PeriodStart",
                table: "GenerationChartPoints",
                columns: new[] { "IsoCode", "PeriodType", "PeriodStart" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GenerationRecords_IsoCode_FetchedAt",
                table: "GenerationRecords",
                columns: new[] { "IsoCode", "FetchedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ViewerTimezonePreferences_ClientId",
                table: "ViewerTimezonePreferences",
                column: "ClientId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CountryZones");

            migrationBuilder.DropTable(
                name: "EnergySources");

            migrationBuilder.DropTable(
                name: "GenerationChartPoints");

            migrationBuilder.DropTable(
                name: "GenerationRecords");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "ViewerTimezonePreferences");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddSnapshotFieldsAndChartPoints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CountryName",
                table: "GenerationRecords",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ZonesAggregatedJson",
                table: "GenerationRecords",
                type: "text",
                nullable: false,
                defaultValue: "[]");

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

            migrationBuilder.CreateIndex(
                name: "IX_GenerationRecords_IsoCode_FetchedAt",
                table: "GenerationRecords",
                columns: new[] { "IsoCode", "FetchedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_GenerationChartPoints_IsoCode_PeriodType_PeriodStart",
                table: "GenerationChartPoints",
                columns: new[] { "IsoCode", "PeriodType", "PeriodStart" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GenerationChartPoints");

            migrationBuilder.DropIndex(
                name: "IX_GenerationRecords_IsoCode_FetchedAt",
                table: "GenerationRecords");

            migrationBuilder.DropColumn(
                name: "CountryName",
                table: "GenerationRecords");

            migrationBuilder.DropColumn(
                name: "ZonesAggregatedJson",
                table: "GenerationRecords");
        }
    }
}

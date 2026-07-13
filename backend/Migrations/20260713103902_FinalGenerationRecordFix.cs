using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class FinalGenerationRecordFix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ZonesAggregatedJson",
                table: "GenerationRecords",
                newName: "ZoneCode");

            migrationBuilder.RenameColumn(
                name: "CountryName",
                table: "GenerationRecords",
                newName: "EnergySourceName");

            migrationBuilder.AddColumn<string>(
                name: "CountryIso",
                table: "GenerationRecords",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "EnergySourceCode",
                table: "GenerationRecords",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsRenewable",
                table: "GenerationRecords",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "Timestamp",
                table: "GenerationRecords",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<double>(
                name: "ValueMw",
                table: "GenerationRecords",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CountryIso",
                table: "GenerationRecords");

            migrationBuilder.DropColumn(
                name: "EnergySourceCode",
                table: "GenerationRecords");

            migrationBuilder.DropColumn(
                name: "IsRenewable",
                table: "GenerationRecords");

            migrationBuilder.DropColumn(
                name: "Timestamp",
                table: "GenerationRecords");

            migrationBuilder.DropColumn(
                name: "ValueMw",
                table: "GenerationRecords");

            migrationBuilder.RenameColumn(
                name: "ZoneCode",
                table: "GenerationRecords",
                newName: "ZonesAggregatedJson");

            migrationBuilder.RenameColumn(
                name: "EnergySourceName",
                table: "GenerationRecords",
                newName: "CountryName");
        }
    }
}

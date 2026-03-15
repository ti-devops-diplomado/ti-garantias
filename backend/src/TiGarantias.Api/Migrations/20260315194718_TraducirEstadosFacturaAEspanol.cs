using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TiGarantias.Api.Migrations
{
    /// <inheritdoc />
    public partial class TraducirEstadosFacturaAEspanol : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE core."invoices" SET "Status" = 'Abierta' WHERE "Status" = 'Open';
                UPDATE core."invoices" SET "Status" = 'Por_Vencer' WHERE "Status" IN ('DueSoon', 'PorVencer');
                UPDATE core."invoices" SET "Status" = 'Vencida' WHERE "Status" = 'Overdue';
                UPDATE core."invoices" SET "Status" = 'Gestionada' WHERE "Status" = 'Managed';
                UPDATE core."invoices" SET "Status" = 'Cancelada' WHERE "Status" = 'Cancelled';
                """);

            migrationBuilder.UpdateData(
                schema: "core",
                table: "users",
                keyColumn: "Id",
                keyValue: new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAEHvxudDCL1c5alXkNOOWf9du4Hw/GfxkC61DIwSLJ8fgX7NFM3QqF77RvDNpXHEuVw==");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE core."invoices" SET "Status" = 'Open' WHERE "Status" = 'Abierta';
                UPDATE core."invoices" SET "Status" = 'DueSoon' WHERE "Status" = 'Por_Vencer';
                UPDATE core."invoices" SET "Status" = 'Overdue' WHERE "Status" = 'Vencida';
                UPDATE core."invoices" SET "Status" = 'Managed' WHERE "Status" = 'Gestionada';
                UPDATE core."invoices" SET "Status" = 'Cancelled' WHERE "Status" = 'Cancelada';
                """);

            migrationBuilder.UpdateData(
                schema: "core",
                table: "users",
                keyColumn: "Id",
                keyValue: new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAEG5ho+T49/AeJ6Jv15q+PDaDNN8UOHqbfyY8Jtzx+vRl/Q0nkvpPMgWCRp9Bs2vZ8g==");
        }
    }
}

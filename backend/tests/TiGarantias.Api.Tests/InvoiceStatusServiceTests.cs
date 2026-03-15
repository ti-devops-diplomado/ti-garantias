using TiGarantias.Api.Data;
using TiGarantias.Api.Domain.Enums;
using TiGarantias.Api.Services;

namespace TiGarantias.Api.Tests;

public sealed class InvoiceStatusServiceTests
{
    private readonly InvoiceStatusService _service = new();

    [Fact]
    public void DebeMarcarComoGestionadaCuandoExisteFechaDeGestion()
    {
        var invoice = new Invoice
        {
            GuaranteeRefundable = true,
            EstimatedRefundDate = new DateOnly(2026, 3, 20),
            RefundManagedDate = new DateOnly(2026, 3, 18)
        };

        var result = _service.CalculateStatus(invoice, new DateOnly(2026, 3, 15), 15);

        Assert.Equal(InvoiceStatus.Gestionada, result);
    }

    [Fact]
    public void DebeMarcarComoPorVencerCuandoEstaDentroDelUmbral()
    {
        var invoice = new Invoice
        {
            GuaranteeRefundable = true,
            EstimatedRefundDate = new DateOnly(2026, 3, 25)
        };

        var result = _service.CalculateStatus(invoice, new DateOnly(2026, 3, 15), 15);

        Assert.Equal(InvoiceStatus.Por_Vencer, result);
    }
}

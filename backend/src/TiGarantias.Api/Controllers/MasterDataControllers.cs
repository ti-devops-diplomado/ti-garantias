using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TiGarantias.Api.Contracts;
using TiGarantias.Api.Data;
using TiGarantias.Api.Services;

namespace TiGarantias.Api.Controllers;

[ApiController]
[Route("api/suppliers")]
[Authorize]
public sealed class SuppliersController(AppDbContext dbContext, IAuditService auditService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<Supplier>>> GetAll(CancellationToken cancellationToken) =>
        Ok(await dbContext.Suppliers.OrderBy(x => x.Name).ToListAsync(cancellationToken));

    [HttpPost]
    public async Task<ActionResult<Supplier>> Create([FromBody] SupplierRequest request, CancellationToken cancellationToken)
    {
        var validationError = await ValidateSupplierUniquenessAsync(request, null, cancellationToken);
        if (validationError is not null)
        {
            return ValidationProblem(validationError);
        }

        var supplier = new Supplier { Name = request.Name.Trim(), TaxId = request.TaxId.Trim(), ContactEmail = request.ContactEmail.Trim() };
        dbContext.Suppliers.Add(supplier);
        await dbContext.SaveChangesAsync(cancellationToken);
        await auditService.RecordAsync("supplier", supplier.Id.ToString(), "create", request, cancellationToken);
        return CreatedAtAction(nameof(GetAll), new { id = supplier.Id }, supplier);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<Supplier>> Update(Guid id, [FromBody] SupplierRequest request, CancellationToken cancellationToken)
    {
        var supplier = await dbContext.Suppliers.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (supplier is null)
        {
            return NotFound();
        }

        var validationError = await ValidateSupplierUniquenessAsync(request, id, cancellationToken);
        if (validationError is not null)
        {
            return ValidationProblem(validationError);
        }

        supplier.Name = request.Name.Trim();
        supplier.TaxId = request.TaxId.Trim();
        supplier.ContactEmail = request.ContactEmail.Trim();

        await dbContext.SaveChangesAsync(cancellationToken);
        await auditService.RecordAsync("supplier", supplier.Id.ToString(), "update", request, cancellationToken);
        return Ok(supplier);
    }

    private async Task<string?> ValidateSupplierUniquenessAsync(SupplierRequest request, Guid? currentSupplierId, CancellationToken cancellationToken)
    {
        var normalizedTaxId = request.TaxId.Trim();
        if (!string.IsNullOrWhiteSpace(normalizedTaxId))
        {
            var taxIdExists = await dbContext.Suppliers.AnyAsync(
                x => x.Id != currentSupplierId && x.TaxId == normalizedTaxId,
                cancellationToken);

            if (taxIdExists)
            {
                return "Ya existe un proveedor con el mismo NIT / ID.";
            }
        }

        var normalizedEmail = request.ContactEmail.Trim();
        if (!string.IsNullOrWhiteSpace(normalizedEmail))
        {
            var emailExists = await dbContext.Suppliers.AnyAsync(
                x => x.Id != currentSupplierId && x.ContactEmail.ToLower() == normalizedEmail.ToLower(),
                cancellationToken);

            if (emailExists)
            {
                return "Ya existe un proveedor con el mismo correo de contacto.";
            }
        }

        return null;
    }
}

[ApiController]
[Route("api/contracts")]
[Authorize]
public sealed class ContractsController(AppDbContext dbContext, IAuditService auditService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<Contract>>> GetAll(CancellationToken cancellationToken) =>
        Ok(await dbContext.Contracts.Include(x => x.Supplier).OrderBy(x => x.Title).ToListAsync(cancellationToken));

    [HttpPost]
    public async Task<ActionResult<Contract>> Create([FromBody] ContractRequest request, CancellationToken cancellationToken)
    {
        if (!await dbContext.Suppliers.AnyAsync(x => x.Id == request.SupplierId, cancellationToken))
        {
            return ValidationProblem("El proveedor no existe.");
        }

        var contract = new Contract
        {
            SupplierId = request.SupplierId,
            ContractNumber = request.ContractNumber.Trim(),
            Title = request.Title.Trim(),
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            RetentionPercentage = request.RetentionPercentage
        };

        dbContext.Contracts.Add(contract);
        await dbContext.SaveChangesAsync(cancellationToken);
        await auditService.RecordAsync("contract", contract.Id.ToString(), "create", request, cancellationToken);
        return CreatedAtAction(nameof(GetAll), new { id = contract.Id }, contract);
    }
}

[ApiController]
[Route("api/deliverables")]
[Authorize]
public sealed class DeliverablesController(AppDbContext dbContext, IAuditService auditService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<Deliverable>>> GetAll(CancellationToken cancellationToken) =>
        Ok(await dbContext.Deliverables.Include(x => x.Contract).OrderBy(x => x.Name).ToListAsync(cancellationToken));

    [HttpPost]
    public async Task<ActionResult<Deliverable>> Create([FromBody] DeliverableRequest request, CancellationToken cancellationToken)
    {
        if (!await dbContext.Contracts.AnyAsync(x => x.Id == request.ContractId, cancellationToken))
        {
            return ValidationProblem("El contrato no existe.");
        }

        var deliverable = new Deliverable
        {
            ContractId = request.ContractId,
            Name = request.Name.Trim(),
            Description = request.Description.Trim(),
            DueDate = request.DueDate
        };

        dbContext.Deliverables.Add(deliverable);
        await dbContext.SaveChangesAsync(cancellationToken);
        await auditService.RecordAsync("deliverable", deliverable.Id.ToString(), "create", request, cancellationToken);
        return CreatedAtAction(nameof(GetAll), new { id = deliverable.Id }, deliverable);
    }
}

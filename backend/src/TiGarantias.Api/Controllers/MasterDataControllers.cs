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
        var validationError = await ValidateContractRequestAsync(request, null, cancellationToken);
        if (validationError is not null)
        {
            return ValidationProblem(validationError);
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

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<Contract>> Update(Guid id, [FromBody] ContractRequest request, CancellationToken cancellationToken)
    {
        var contract = await dbContext.Contracts.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (contract is null)
        {
            return NotFound();
        }

        var validationError = await ValidateContractRequestAsync(request, contract, cancellationToken);
        if (validationError is not null)
        {
            return ValidationProblem(validationError);
        }

        contract.SupplierId = request.SupplierId;
        contract.ContractNumber = request.ContractNumber.Trim();
        contract.Title = request.Title.Trim();
        contract.StartDate = request.StartDate;
        contract.EndDate = request.EndDate;
        contract.RetentionPercentage = request.RetentionPercentage;

        await dbContext.SaveChangesAsync(cancellationToken);
        await auditService.RecordAsync("contract", contract.Id.ToString(), "update", request, cancellationToken);
        return Ok(contract);
    }

    private async Task<string?> ValidateContractRequestAsync(ContractRequest request, Contract? currentContract, CancellationToken cancellationToken)
    {
        if (!await dbContext.Suppliers.AnyAsync(x => x.Id == request.SupplierId, cancellationToken))
        {
            return "El proveedor no existe.";
        }

        if (request.EndDate.HasValue && request.EndDate.Value < request.StartDate)
        {
            return "La fecha de finalizacion no puede ser menor a la fecha de inicio.";
        }

        var normalizedContractNumber = request.ContractNumber.Trim();
        var currentContractId = currentContract?.Id;
        var contractNumberExists = await dbContext.Contracts.AnyAsync(
            x => x.Id != currentContractId && x.ContractNumber == normalizedContractNumber,
            cancellationToken);

        if (contractNumberExists)
        {
            return "Ya existe un contrato con el mismo numero.";
        }

        if (currentContract is not null
            && currentContract.SupplierId != request.SupplierId
            && await dbContext.Invoices.AnyAsync(x => x.ContractId == currentContract.Id, cancellationToken))
        {
            return "No se puede cambiar el proveedor de un contrato que ya tiene facturas asociadas.";
        }

        return null;
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

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<Deliverable>> Update(Guid id, [FromBody] DeliverableRequest request, CancellationToken cancellationToken)
    {
        var deliverable = await dbContext.Deliverables
            .Include(x => x.InvoiceDeliverables)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (deliverable is null)
        {
            return NotFound();
        }

        if (!await dbContext.Contracts.AnyAsync(x => x.Id == request.ContractId, cancellationToken))
        {
            return ValidationProblem("El contrato no existe.");
        }

        if (deliverable.ContractId != request.ContractId && deliverable.InvoiceDeliverables.Count != 0)
        {
            return ValidationProblem("No se puede cambiar el contrato de un entregable que ya esta asociado a facturas.");
        }

        deliverable.ContractId = request.ContractId;
        deliverable.Name = request.Name.Trim();
        deliverable.Description = request.Description.Trim();
        deliverable.DueDate = request.DueDate;

        await dbContext.SaveChangesAsync(cancellationToken);
        await auditService.RecordAsync("deliverable", deliverable.Id.ToString(), "update", request, cancellationToken);
        return Ok(deliverable);
    }
}

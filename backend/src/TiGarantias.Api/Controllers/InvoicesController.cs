using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TiGarantias.Api.Contracts;
using TiGarantias.Api.Data;
using TiGarantias.Api.Domain.Enums;
using TiGarantias.Api.Services;

namespace TiGarantias.Api.Controllers;

[ApiController]
[Route("api/invoices")]
[Authorize]
public sealed class InvoicesController(
    AppDbContext dbContext,
    ICurrentUserService currentUserService,
    IInvoiceStatusService invoiceStatusService,
    IAttachmentStorageService attachmentStorageService,
    IAuditService auditService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<InvoiceResponse>>> GetAll([FromQuery] string? scope, CancellationToken cancellationToken)
    {
        var query = dbContext.Invoices
            .Include(x => x.Contract)
            .Include(x => x.Supplier)
            .Include(x => x.CreatedByUser)
            .Include(x => x.RefundManagerUser)
            .Include(x => x.InvoiceDeliverables)
            .Include(x => x.Attachments)
            .AsQueryable();

        if (scope == "mine" && currentUserService.UserId.HasValue)
        {
            query = query.Where(x => x.CreatedByUserId == currentUserService.UserId.Value);
        }

        if (scope == "managed" && currentUserService.UserId.HasValue)
        {
            query = query.Where(x => x.RefundManagerUserId == currentUserService.UserId.Value
                && (x.Status == InvoiceStatus.DueSoon || x.Status == InvoiceStatus.Overdue));
        }

        var invoices = await query.OrderByDescending(x => x.CreatedAt).ToListAsync(cancellationToken);
        return Ok(invoices.Select(MapInvoice).ToArray());
    }

    [HttpPost]
    public async Task<ActionResult<InvoiceResponse>> Create([FromBody] InvoiceRequest request, CancellationToken cancellationToken)
    {
        if (!currentUserService.UserId.HasValue) return Unauthorized();

        var contract = await dbContext.Contracts.SingleOrDefaultAsync(x => x.Id == request.ContractId, cancellationToken);
        if (contract is null) return ValidationProblem("El contrato no existe.");
        if (contract.SupplierId != request.SupplierId) return ValidationProblem("El contrato no corresponde al proveedor indicado.");

        var deliverables = await dbContext.Deliverables.Where(x => request.DeliverableIds.Contains(x.Id)).ToListAsync(cancellationToken);
        if (deliverables.Any(x => x.ContractId != request.ContractId))
        {
            return ValidationProblem("Todos los entregables deben pertenecer al mismo contrato.");
        }

        var invoice = new Invoice
        {
            ContractId = request.ContractId,
            SupplierId = request.SupplierId,
            InvoiceNumber = request.InvoiceNumber.Trim(),
            InvoiceNumberNormalized = NormalizeInvoiceNumber(request.InvoiceNumber),
            InvoiceDate = request.InvoiceDate,
            InvoiceAmount = request.InvoiceAmount,
            PurchaseOrder = request.PurchaseOrder.Trim(),
            RetainedAmount = request.RetainedAmount,
            GuaranteeRefundable = request.GuaranteeRefundable,
            EstimatedRefundDate = request.EstimatedRefundDate,
            RefundManagerUserId = request.RefundManagerUserId,
            CreatedByUserId = currentUserService.UserId.Value,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        invoice.Status = invoiceStatusService.CalculateStatus(invoice, DateOnly.FromDateTime(DateTime.UtcNow), 15);

        dbContext.Invoices.Add(invoice);
        dbContext.InvoiceDeliverables.AddRange(deliverables.Select(x => new InvoiceDeliverable { InvoiceId = invoice.Id, DeliverableId = x.Id }));
        await dbContext.SaveChangesAsync(cancellationToken);
        await auditService.RecordAsync("invoice", invoice.Id.ToString(), "create", request, cancellationToken);

        var saved = await LoadInvoiceAsync(invoice.Id, cancellationToken);
        return CreatedAtAction(nameof(GetAll), new { id = saved.Id }, MapInvoice(saved));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<InvoiceResponse>> Update(Guid id, [FromBody] InvoiceRequest request, CancellationToken cancellationToken)
    {
        var invoice = await dbContext.Invoices.Include(x => x.InvoiceDeliverables).SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (invoice is null) return NotFound();

        var deliverables = await dbContext.Deliverables.Where(x => request.DeliverableIds.Contains(x.Id)).ToListAsync(cancellationToken);
        if (deliverables.Any(x => x.ContractId != request.ContractId))
        {
            return ValidationProblem("Todos los entregables deben pertenecer al mismo contrato.");
        }

        invoice.ContractId = request.ContractId;
        invoice.SupplierId = request.SupplierId;
        invoice.InvoiceNumber = request.InvoiceNumber.Trim();
        invoice.InvoiceNumberNormalized = NormalizeInvoiceNumber(request.InvoiceNumber);
        invoice.InvoiceDate = request.InvoiceDate;
        invoice.InvoiceAmount = request.InvoiceAmount;
        invoice.PurchaseOrder = request.PurchaseOrder.Trim();
        invoice.RetainedAmount = request.RetainedAmount;
        invoice.GuaranteeRefundable = request.GuaranteeRefundable;
        invoice.EstimatedRefundDate = request.EstimatedRefundDate;
        invoice.RefundManagerUserId = request.RefundManagerUserId;
        invoice.Status = invoiceStatusService.CalculateStatus(invoice, DateOnly.FromDateTime(DateTime.UtcNow), 15);
        invoice.UpdatedAt = DateTime.UtcNow;

        dbContext.InvoiceDeliverables.RemoveRange(invoice.InvoiceDeliverables);
        dbContext.InvoiceDeliverables.AddRange(deliverables.Select(x => new InvoiceDeliverable { InvoiceId = invoice.Id, DeliverableId = x.Id }));
        await dbContext.SaveChangesAsync(cancellationToken);
        await auditService.RecordAsync("invoice", invoice.Id.ToString(), "update", request, cancellationToken);

        invoice = await LoadInvoiceAsync(invoice.Id, cancellationToken);
        return Ok(MapInvoice(invoice));
    }

    [HttpPost("{id:guid}/manage-refund")]
    [Authorize(Roles = "Gestor,Admin")]
    public async Task<ActionResult<InvoiceResponse>> ManageRefund(Guid id, [FromBody] RefundManagementRequest request, CancellationToken cancellationToken)
    {
        var invoice = await dbContext.Invoices.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (invoice is null) return NotFound();

        invoice.RefundManagedDate = request.RefundManagedDate;
        invoice.RefundManagerUserId = currentUserService.UserId;
        invoice.Status = InvoiceStatus.Managed;
        invoice.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);
        await auditService.RecordAsync("invoice", invoice.Id.ToString(), "manage_refund", request, cancellationToken);

        invoice = await LoadInvoiceAsync(invoice.Id, cancellationToken);
        return Ok(MapInvoice(invoice));
    }

    [HttpPost("{id:guid}/attachments")]
    public async Task<ActionResult<AttachmentResponse>> UploadAttachment(Guid id, IFormFile file, CancellationToken cancellationToken)
    {
        if (!currentUserService.UserId.HasValue) return Unauthorized();

        var invoice = await dbContext.Invoices.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (invoice is null) return NotFound();

        var saved = await attachmentStorageService.SaveAsync(id, file, cancellationToken);
        var attachment = new Attachment
        {
            InvoiceId = id,
            OriginalFileName = Path.GetFileName(file.FileName),
            StoredFileName = saved.storedFileName,
            ContentType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
            RelativePath = saved.relativePath,
            SizeInBytes = saved.sizeInBytes,
            UploadedByUserId = currentUserService.UserId.Value,
            UploadedAt = DateTime.UtcNow
        };

        dbContext.Attachments.Add(attachment);
        await dbContext.SaveChangesAsync(cancellationToken);
        await auditService.RecordAsync("attachment", attachment.Id.ToString(), "upload", new { invoiceId = id, file = attachment.OriginalFileName }, cancellationToken);

        return Ok(new AttachmentResponse
        {
            Id = attachment.Id,
            OriginalFileName = attachment.OriginalFileName,
            ContentType = attachment.ContentType,
            SizeInBytes = attachment.SizeInBytes,
            UploadedAt = attachment.UploadedAt
        });
    }

    [HttpGet("attachments/{attachmentId:guid}")]
    public async Task<IActionResult> DownloadAttachment(Guid attachmentId, CancellationToken cancellationToken)
    {
        var attachment = await dbContext.Attachments.SingleOrDefaultAsync(x => x.Id == attachmentId, cancellationToken);
        if (attachment is null) return NotFound();

        var file = await attachmentStorageService.OpenReadAsync(attachment, cancellationToken);
        return File(file.stream, file.contentType, file.fileName);
    }

    private async Task<Invoice> LoadInvoiceAsync(Guid invoiceId, CancellationToken cancellationToken) =>
        await dbContext.Invoices
            .Include(x => x.Contract)
            .Include(x => x.Supplier)
            .Include(x => x.CreatedByUser)
            .Include(x => x.RefundManagerUser)
            .Include(x => x.InvoiceDeliverables)
            .Include(x => x.Attachments)
            .SingleAsync(x => x.Id == invoiceId, cancellationToken);

    private static string NormalizeInvoiceNumber(string invoiceNumber) => invoiceNumber.Replace("-", string.Empty, StringComparison.Ordinal);

    private static InvoiceResponse MapInvoice(Invoice invoice) => new()
    {
        Id = invoice.Id,
        ContractId = invoice.ContractId,
        ContractTitle = invoice.Contract.Title,
        SupplierId = invoice.SupplierId,
        SupplierName = invoice.Supplier.Name,
        InvoiceNumber = invoice.InvoiceNumber,
        InvoiceDate = invoice.InvoiceDate,
        InvoiceAmount = invoice.InvoiceAmount,
        PurchaseOrder = invoice.PurchaseOrder,
        RetainedAmount = invoice.RetainedAmount,
        GuaranteeRefundable = invoice.GuaranteeRefundable,
        EstimatedRefundDate = invoice.EstimatedRefundDate,
        RefundManagedDate = invoice.RefundManagedDate,
        RefundManagerUserId = invoice.RefundManagerUserId,
        RefundManagerName = invoice.RefundManagerUser?.FullName,
        Status = invoice.Status.ToString().ToUpperInvariant(),
        CreatedByUserId = invoice.CreatedByUserId,
        CreatedByUserName = invoice.CreatedByUser.FullName,
        CreatedAt = invoice.CreatedAt,
        UpdatedAt = invoice.UpdatedAt,
        DeliverableIds = invoice.InvoiceDeliverables.Select(x => x.DeliverableId).ToArray(),
        Attachments = invoice.Attachments.Select(x => new AttachmentResponse
        {
            Id = x.Id,
            OriginalFileName = x.OriginalFileName,
            ContentType = x.ContentType,
            SizeInBytes = x.SizeInBytes,
            UploadedAt = x.UploadedAt
        }).ToArray()
    };
}

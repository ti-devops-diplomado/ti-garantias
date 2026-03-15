using TiGarantias.Api.Domain.Enums;

namespace TiGarantias.Api.Data;

public sealed class Role
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}

public sealed class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}

public sealed class UserRole
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Guid RoleId { get; set; }
    public Role Role { get; set; } = null!;
}

public sealed class Supplier
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string TaxId { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<Contract> Contracts { get; set; } = new List<Contract>();
}

public sealed class Contract
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SupplierId { get; set; }
    public Supplier Supplier { get; set; } = null!;
    public string ContractNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public decimal RetentionPercentage { get; set; }
    public ICollection<Deliverable> Deliverables { get; set; } = new List<Deliverable>();
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}

public sealed class Deliverable
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ContractId { get; set; }
    public Contract Contract { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateOnly? DueDate { get; set; }
    public ICollection<InvoiceDeliverable> InvoiceDeliverables { get; set; } = new List<InvoiceDeliverable>();
}

public sealed class Invoice
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ContractId { get; set; }
    public Contract Contract { get; set; } = null!;
    public Guid SupplierId { get; set; }
    public Supplier Supplier { get; set; } = null!;
    public string InvoiceNumber { get; set; } = string.Empty;
    public string InvoiceNumberNormalized { get; set; } = string.Empty;
    public DateOnly InvoiceDate { get; set; }
    public decimal InvoiceAmount { get; set; }
    public string PurchaseOrder { get; set; } = string.Empty;
    public decimal RetainedAmount { get; set; }
    public bool GuaranteeRefundable { get; set; }
    public DateOnly? EstimatedRefundDate { get; set; }
    public DateOnly? RefundManagedDate { get; set; }
    public Guid? RefundManagerUserId { get; set; }
    public User? RefundManagerUser { get; set; }
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Abierta;
    public Guid CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<InvoiceDeliverable> InvoiceDeliverables { get; set; } = new List<InvoiceDeliverable>();
    public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
}

public sealed class InvoiceDeliverable
{
    public Guid InvoiceId { get; set; }
    public Invoice Invoice { get; set; } = null!;
    public Guid DeliverableId { get; set; }
    public Deliverable Deliverable { get; set; } = null!;
}

public sealed class Attachment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid InvoiceId { get; set; }
    public Invoice Invoice { get; set; } = null!;
    public string OriginalFileName { get; set; } = string.Empty;
    public string StoredFileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public string RelativePath { get; set; } = string.Empty;
    public long SizeInBytes { get; set; }
    public Guid UploadedByUserId { get; set; }
    public User UploadedByUser { get; set; } = null!;
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}

public sealed class NotificationLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid InvoiceId { get; set; }
    public Invoice Invoice { get; set; } = null!;
    public string NotificationType { get; set; } = string.Empty;
    public string SentTo { get; set; } = string.Empty;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public string MetadataJson { get; set; } = "{}";
}

public sealed class AuditEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string EntityType { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public Guid? UserId { get; set; }
    public User? User { get; set; }
    public string PayloadJson { get; set; } = "{}";
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
}

public sealed class Setting
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

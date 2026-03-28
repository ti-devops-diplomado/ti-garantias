using System.ComponentModel.DataAnnotations;

namespace TiGarantias.Api.Contracts;

public sealed class UserSummary
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public IReadOnlyCollection<string> Roles { get; set; } = Array.Empty<string>();
}

public sealed class LoginRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public sealed class AuthResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public DateTime ExpiresAtUtc { get; set; }
    public UserSummary User { get; set; } = new();
}

public sealed class UserUpsertRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string FullName { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;
    public string? Password { get; set; }
    public List<string> Roles { get; set; } = new();
}

public sealed class UserStatusUpdateRequest
{
    public bool IsActive { get; set; }
}

public sealed class UserPasswordResetRequest
{
    [Required]
    public string NewPassword { get; set; } = string.Empty;
}

public sealed class SupplierRequest
{
    [Required]
    public string Name { get; set; } = string.Empty;

    public string TaxId { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
}

public sealed class ContractRequest
{
    [Required]
    public Guid SupplierId { get; set; }

    [Required]
    public string ContractNumber { get; set; } = string.Empty;

    [Required]
    public string Title { get; set; } = string.Empty;

    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public decimal RetentionPercentage { get; set; }
}

public sealed class DeliverableRequest
{
    [Required]
    public Guid ContractId { get; set; }

    [Required]
    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;
    public DateOnly? DueDate { get; set; }
}

public sealed class InvoiceRequest
{
    [Required]
    public Guid ContractId { get; set; }

    [Required]
    public Guid SupplierId { get; set; }

    [Required]
    [RegularExpression(@"^\d{3}-\d{3}-\d{9}$", ErrorMessage = "El formato debe ser 999-999-999999999.")]
    public string InvoiceNumber { get; set; } = string.Empty;

    public DateOnly InvoiceDate { get; set; }
    public decimal InvoiceAmount { get; set; }
    public string PurchaseOrder { get; set; } = string.Empty;
    public decimal RetainedAmount { get; set; }
    public bool GuaranteeRefundable { get; set; }
    public DateOnly? EstimatedRefundDate { get; set; }
    public Guid? RefundManagerUserId { get; set; }
    public List<Guid> DeliverableIds { get; set; } = new();
}

public sealed class RefundManagementRequest
{
    [Required]
    public DateOnly RefundManagedDate { get; set; }
}

public sealed class AttachmentResponse
{
    public Guid Id { get; set; }
    public string OriginalFileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeInBytes { get; set; }
    public DateTime UploadedAt { get; set; }
}

public sealed class InvoiceResponse
{
    public Guid Id { get; set; }
    public Guid ContractId { get; set; }
    public string ContractTitle { get; set; } = string.Empty;
    public Guid SupplierId { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public string InvoiceNumber { get; set; } = string.Empty;
    public DateOnly InvoiceDate { get; set; }
    public decimal InvoiceAmount { get; set; }
    public string PurchaseOrder { get; set; } = string.Empty;
    public decimal RetainedAmount { get; set; }
    public bool GuaranteeRefundable { get; set; }
    public DateOnly? EstimatedRefundDate { get; set; }
    public DateOnly? RefundManagedDate { get; set; }
    public Guid? RefundManagerUserId { get; set; }
    public string? RefundManagerName { get; set; }
    public string Status { get; set; } = string.Empty;
    public Guid CreatedByUserId { get; set; }
    public string CreatedByUserName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public IReadOnlyCollection<Guid> DeliverableIds { get; set; } = Array.Empty<Guid>();
    public IReadOnlyCollection<AttachmentResponse> Attachments { get; set; } = Array.Empty<AttachmentResponse>();
}

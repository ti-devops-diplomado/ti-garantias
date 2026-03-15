using TiGarantias.Api.Contracts;
using TiGarantias.Api.Data;
using TiGarantias.Api.Domain.Enums;

namespace TiGarantias.Api.Services;

public interface IJwtTokenService
{
    AuthResponse CreateToken(User user, IReadOnlyCollection<string> roles);
}

public interface ICurrentUserService
{
    Guid? UserId { get; }
    IReadOnlyCollection<string> Roles { get; }
}

public interface IAuditService
{
    Task RecordAsync(string entityType, string entityId, string action, object payload, CancellationToken cancellationToken);
}

public interface IAttachmentStorageService
{
    Task<(string storedFileName, string relativePath, long sizeInBytes)> SaveAsync(Guid invoiceId, IFormFile file, CancellationToken cancellationToken);
    Task<(Stream stream, string contentType, string fileName)> OpenReadAsync(TiGarantias.Api.Data.Attachment attachment, CancellationToken cancellationToken);
}

public interface IInvoiceStatusService
{
    InvoiceStatus CalculateStatus(Invoice invoice, DateOnly today, int dueSoonThresholdDays);
}

public interface INotificationService
{
    Task SendAsync(string recipient, string subject, string body, CancellationToken cancellationToken);
}

public interface INotificationJobService
{
    Task RunDailyAsync(CancellationToken cancellationToken);
}

public interface IDatabaseInitializer
{
    Task InitializeAsync();
}

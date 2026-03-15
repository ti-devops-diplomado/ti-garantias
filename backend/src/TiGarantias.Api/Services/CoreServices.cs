using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Mail;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Hangfire.Annotations;
using Hangfire.Dashboard;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using TiGarantias.Api.Contracts;
using TiGarantias.Api.Data;
using TiGarantias.Api.Domain.Enums;
using TiGarantias.Api.Options;

namespace TiGarantias.Api.Services;

public sealed class JwtTokenService(IOptions<JwtOptions> options) : IJwtTokenService
{
    private readonly JwtOptions _options = options.Value;

    public AuthResponse CreateToken(User user, IReadOnlyCollection<string> roles)
    {
        var expiresAt = DateTime.UtcNow.AddMinutes(_options.ExpirationMinutes);
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.NameIdentifier, user.Id.ToString())
        };
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.Secret));
        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new AuthResponse
        {
            AccessToken = new JwtSecurityTokenHandler().WriteToken(token),
            ExpiresAtUtc = expiresAt,
            User = new UserSummary
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                IsActive = user.IsActive,
                Roles = roles
            }
        };
    }
}

public sealed class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    public Guid? UserId
    {
        get
        {
            var value = httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(value, out var id) ? id : null;
        }
    }

    public IReadOnlyCollection<string> Roles =>
        httpContextAccessor.HttpContext?.User.FindAll(ClaimTypes.Role).Select(x => x.Value).ToArray()
        ?? Array.Empty<string>();
}

public sealed class AuditService(AppDbContext dbContext, ICurrentUserService currentUser) : IAuditService
{
    public async Task RecordAsync(string entityType, string entityId, string action, object payload, CancellationToken cancellationToken)
    {
        dbContext.AuditEvents.Add(new AuditEvent
        {
            EntityType = entityType,
            EntityId = entityId,
            Action = action,
            UserId = currentUser.UserId,
            PayloadJson = JsonSerializer.Serialize(payload),
            OccurredAt = DateTime.UtcNow
        });
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}

public sealed class AttachmentStorageService(IOptions<StorageOptions> options) : IAttachmentStorageService
{
    private readonly StorageOptions _options = options.Value;

    public async Task<(string storedFileName, string relativePath, long sizeInBytes)> SaveAsync(Guid invoiceId, IFormFile file, CancellationToken cancellationToken)
    {
        Directory.CreateDirectory(_options.AttachmentsPath);
        var invoiceFolder = Path.Combine(_options.AttachmentsPath, invoiceId.ToString("N"));
        Directory.CreateDirectory(invoiceFolder);

        var safeFileName = Path.GetFileName(file.FileName);
        var storedFileName = $"{Guid.NewGuid():N}_{safeFileName}";
        var fullPath = Path.Combine(invoiceFolder, storedFileName);

        await using var stream = File.Create(fullPath);
        await file.CopyToAsync(stream, cancellationToken);
        return (storedFileName, Path.GetRelativePath(_options.AttachmentsPath, fullPath).Replace("\\", "/"), file.Length);
    }

    public Task<(Stream stream, string contentType, string fileName)> OpenReadAsync(TiGarantias.Api.Data.Attachment attachment, CancellationToken cancellationToken)
    {
        var fullPath = Path.Combine(_options.AttachmentsPath, attachment.RelativePath.Replace("/", Path.DirectorySeparatorChar.ToString()));
        Stream stream = File.OpenRead(fullPath);
        return Task.FromResult((stream, attachment.ContentType, attachment.OriginalFileName));
    }
}

public sealed class InvoiceStatusService : IInvoiceStatusService
{
    public InvoiceStatus CalculateStatus(Invoice invoice, DateOnly today, int dueSoonThresholdDays)
    {
        if (invoice.Status == InvoiceStatus.Cancelada) return InvoiceStatus.Cancelada;
        if (invoice.RefundManagedDate.HasValue) return InvoiceStatus.Gestionada;
        if (!invoice.GuaranteeRefundable || !invoice.EstimatedRefundDate.HasValue) return InvoiceStatus.Abierta;
        if (invoice.EstimatedRefundDate.Value < today) return InvoiceStatus.Vencida;
        return invoice.EstimatedRefundDate.Value <= today.AddDays(dueSoonThresholdDays) ? InvoiceStatus.Por_Vencer : InvoiceStatus.Abierta;
    }
}

public sealed class NotificationService(IOptions<SmtpOptions> options, ILogger<NotificationService> logger) : INotificationService
{
    private readonly SmtpOptions _options = options.Value;

    public async Task SendAsync(string recipient, string subject, string body, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_options.Host))
        {
            logger.LogInformation("SMTP no configurado. Notificación simulada para {Recipient}: {Subject}", recipient, subject);
            return;
        }

        using var message = new MailMessage(_options.From, recipient, subject, body);
        using var client = new SmtpClient(_options.Host, _options.Port)
        {
            EnableSsl = false,
            Credentials = string.IsNullOrWhiteSpace(_options.User)
                ? CredentialCache.DefaultNetworkCredentials
                : new NetworkCredential(_options.User, _options.Password)
        };

        await client.SendMailAsync(message, cancellationToken);
    }
}

public sealed class NotificationJobService(
    AppDbContext dbContext,
    IInvoiceStatusService invoiceStatusService,
    INotificationService notificationService,
    ILogger<NotificationJobService> logger) : INotificationJobService
{
    public async Task RunDailyAsync(CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var alert1 = await GetSettingAsync("alert_day_1", 15, cancellationToken);
        var alert2 = await GetSettingAsync("alert_day_2", 7, cancellationToken);
        var threshold = Math.Max(alert1, alert2);

        var invoices = await dbContext.Invoices
            .Include(x => x.CreatedByUser)
            .Include(x => x.RefundManagerUser)
            .ToListAsync(cancellationToken);

        foreach (var invoice in invoices)
        {
            invoice.Status = invoiceStatusService.CalculateStatus(invoice, today, threshold);
            invoice.UpdatedAt = DateTime.UtcNow;
        }
        await dbContext.SaveChangesAsync(cancellationToken);

        foreach (var invoice in invoices.Where(x => x.Status is InvoiceStatus.Por_Vencer or InvoiceStatus.Vencida && x.EstimatedRefundDate.HasValue))
        {
            var recipients = new[] { invoice.CreatedByUser.Email, invoice.RefundManagerUser?.Email }
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct()
                .ToArray();

            var daysToRefund = invoice.EstimatedRefundDate!.Value.DayNumber - today.DayNumber;
            var notificationType = daysToRefund == alert1 || daysToRefund == alert2
                ? $"DUE_SOON_{daysToRefund}"
                : "OVERDUE";

            foreach (var recipient in recipients)
            {
                var alreadySent = await dbContext.NotificationLogs.AnyAsync(
                    x => x.InvoiceId == invoice.Id
                        && x.NotificationType == notificationType
                        && x.SentTo == recipient
                        && (notificationType != "OVERDUE" || x.SentAt.Date == DateTime.UtcNow.Date),
                    cancellationToken);

                if (alreadySent) continue;

                var subject = notificationType == "OVERDUE"
                    ? $"Factura vencida sin gestión: {invoice.InvoiceNumber}"
                    : $"Factura por vencer: {invoice.InvoiceNumber}";
                var body = $"Factura {invoice.InvoiceNumber} con fecha estimada de devolución {invoice.EstimatedRefundDate:yyyy-MM-dd}.";

                await notificationService.SendAsync(recipient!, subject, body, cancellationToken);
                dbContext.NotificationLogs.Add(new NotificationLog
                {
                    InvoiceId = invoice.Id,
                    NotificationType = notificationType,
                    SentTo = recipient!,
                    SentAt = DateTime.UtcNow,
                    MetadataJson = JsonSerializer.Serialize(new { invoice.InvoiceNumber, invoice.EstimatedRefundDate })
                });
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Job diario ejecutado sobre {Count} facturas.", invoices.Count);
    }

    private async Task<int> GetSettingAsync(string key, int fallback, CancellationToken cancellationToken)
    {
        var value = await dbContext.Settings.Where(x => x.Key == key).Select(x => x.Value).SingleOrDefaultAsync(cancellationToken);
        return int.TryParse(value, out var parsed) ? parsed : fallback;
    }
}

public sealed class DatabaseInitializer(AppDbContext dbContext, ILogger<DatabaseInitializer> logger) : IDatabaseInitializer
{
    public async Task InitializeAsync()
    {
        const int maxAttempts = 10;
        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                await dbContext.Database.MigrateAsync();
                logger.LogInformation("Migraciones aplicadas correctamente.");
                return;
            }
            catch (Exception ex) when (attempt < maxAttempts)
            {
                logger.LogWarning(ex, "Intento {Attempt} de {MaxAttempts} falló al aplicar migraciones.", attempt, maxAttempts);
                await Task.Delay(TimeSpan.FromSeconds(5));
            }
        }
    }
}

public sealed class HangfireDashboardAuthorizationFilter : IDashboardAuthorizationFilter
{
    public bool Authorize([NotNull] DashboardContext context)
    {
        var httpContext = context.GetHttpContext();
        return httpContext.User.Identity?.IsAuthenticated == true && httpContext.User.IsInRole("Admin");
    }
}

using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using TiGarantias.Api.Domain.Enums;

namespace TiGarantias.Api.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<Contract> Contracts => Set<Contract>();
    public DbSet<Deliverable> Deliverables => Set<Deliverable>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceDeliverable> InvoiceDeliverables => Set<InvoiceDeliverable>();
    public DbSet<Attachment> Attachments => Set<Attachment>();
    public DbSet<NotificationLog> NotificationLogs => Set<NotificationLog>();
    public DbSet<AuditEvent> AuditEvents => Set<AuditEvent>();
    public DbSet<Setting> Settings => Set<Setting>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("core");

        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("roles");
            entity.HasIndex(x => x.Name).IsUnique();
            entity.Property(x => x.Name).HasMaxLength(64);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasIndex(x => x.Email).IsUnique();
            entity.Property(x => x.Email).HasMaxLength(256);
            entity.Property(x => x.FullName).HasMaxLength(256);
            entity.Property(x => x.PasswordHash).HasMaxLength(512);
        });

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.ToTable("user_roles");
            entity.HasKey(x => new { x.UserId, x.RoleId });
        });

        modelBuilder.Entity<Supplier>(entity =>
        {
            entity.ToTable("suppliers");
            entity.Property(x => x.Name).HasMaxLength(200);
            entity.Property(x => x.TaxId).HasMaxLength(50);
            entity.Property(x => x.ContactEmail).HasMaxLength(256);
        });

        modelBuilder.Entity<Contract>(entity =>
        {
            entity.ToTable("contracts");
            entity.HasIndex(x => x.ContractNumber).IsUnique();
            entity.Property(x => x.ContractNumber).HasMaxLength(80);
            entity.Property(x => x.Title).HasMaxLength(200);
            entity.Property(x => x.RetentionPercentage).HasPrecision(5, 2);
        });

        modelBuilder.Entity<Deliverable>(entity =>
        {
            entity.ToTable("deliverables");
            entity.Property(x => x.Name).HasMaxLength(200);
            entity.Property(x => x.Description).HasMaxLength(1000);
        });

        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.ToTable("invoices", table =>
            {
                table.HasCheckConstraint("ck_invoices_invoice_number_format", "\"InvoiceNumber\" ~ '^[0-9]{3}-[0-9]{3}-[0-9]{9}$'");
            });
            entity.HasIndex(x => new { x.SupplierId, x.InvoiceNumberNormalized }).IsUnique();
            entity.Property(x => x.InvoiceNumber).HasMaxLength(32);
            entity.Property(x => x.InvoiceNumberNormalized).HasMaxLength(32);
            entity.Property(x => x.PurchaseOrder).HasMaxLength(80);
            entity.Property(x => x.InvoiceAmount).HasPrecision(18, 2);
            entity.Property(x => x.RetainedAmount).HasPrecision(18, 2);
            entity.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
        });

        modelBuilder.Entity<InvoiceDeliverable>(entity =>
        {
            entity.ToTable("invoice_deliverables");
            entity.HasKey(x => new { x.InvoiceId, x.DeliverableId });
        });

        modelBuilder.Entity<Attachment>(entity =>
        {
            entity.ToTable("attachments");
            entity.Property(x => x.OriginalFileName).HasMaxLength(255);
            entity.Property(x => x.StoredFileName).HasMaxLength(255);
            entity.Property(x => x.ContentType).HasMaxLength(128);
            entity.Property(x => x.RelativePath).HasMaxLength(512);
        });

        modelBuilder.Entity<NotificationLog>(entity =>
        {
            entity.ToTable("notification_log");
            entity.Property(x => x.NotificationType).HasMaxLength(64);
            entity.Property(x => x.SentTo).HasMaxLength(512);
        });

        modelBuilder.Entity<AuditEvent>(entity =>
        {
            entity.ToTable("audit_events");
            entity.Property(x => x.EntityType).HasMaxLength(64);
            entity.Property(x => x.EntityId).HasMaxLength(128);
            entity.Property(x => x.Action).HasMaxLength(64);
        });

        modelBuilder.Entity<Setting>(entity =>
        {
            entity.ToTable("settings");
            entity.HasIndex(x => x.Key).IsUnique();
            entity.Property(x => x.Key).HasMaxLength(128);
            entity.Property(x => x.Value).HasMaxLength(256);
            entity.Property(x => x.Description).HasMaxLength(512);
        });

        Seed(modelBuilder);
    }

    private static void Seed(ModelBuilder modelBuilder)
    {
        var adminRoleId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var registradorRoleId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var gestorRoleId = Guid.Parse("33333333-3333-3333-3333-333333333333");
        var auditorRoleId = Guid.Parse("44444444-4444-4444-4444-444444444444");
        var adminUserId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

        var hasher = new PasswordHasher<User>();
        var adminUser = new User
        {
            Id = adminUserId,
            Email = "admin@demo.local",
            FullName = "Administrador Demo",
            IsActive = true,
            CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        };
        adminUser.PasswordHash = hasher.HashPassword(adminUser, "AdminTemporal123!");

        modelBuilder.Entity<Role>().HasData(
            new Role { Id = adminRoleId, Name = "Admin" },
            new Role { Id = registradorRoleId, Name = "Registrador" },
            new Role { Id = gestorRoleId, Name = "Gestor" },
            new Role { Id = auditorRoleId, Name = "Auditor" });

        modelBuilder.Entity<User>().HasData(adminUser);
        modelBuilder.Entity<UserRole>().HasData(new UserRole { UserId = adminUserId, RoleId = adminRoleId });

        modelBuilder.Entity<Setting>().HasData(
            new Setting
            {
                Id = Guid.Parse("55555555-5555-5555-5555-555555555555"),
                Key = "alert_day_1",
                Value = "15",
                Description = "Primer recordatorio de devolución."
            },
            new Setting
            {
                Id = Guid.Parse("66666666-6666-6666-6666-666666666666"),
                Key = "alert_day_2",
                Value = "7",
                Description = "Segundo recordatorio de devolución."
            });
    }
}

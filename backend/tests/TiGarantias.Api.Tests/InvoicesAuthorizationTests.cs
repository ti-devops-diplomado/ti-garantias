using Microsoft.AspNetCore.Authorization;
using System.Reflection;
using TiGarantias.Api.Controllers;
using TiGarantias.Api.Data;

namespace TiGarantias.Api.Tests;

public sealed class InvoicesAuthorizationTests
{
    [Fact]
    public void InvoicesController_requires_authenticated_users()
    {
        var authorizeAttribute = typeof(InvoicesController).GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true)
            .OfType<AuthorizeAttribute>()
            .Single();

        Assert.Null(authorizeAttribute.Roles);
    }

    [Theory]
    [InlineData(nameof(InvoicesController.Create), "Registrador,Admin")]
    [InlineData(nameof(InvoicesController.Update), "Registrador,Gestor,Admin")]
    [InlineData(nameof(InvoicesController.ManageRefund), "Gestor,Admin")]
    [InlineData(nameof(InvoicesController.UploadAttachment), "Registrador,Gestor,Admin")]
    public void Invoice_actions_require_expected_roles(string methodName, string expectedRoles)
    {
        var method = typeof(InvoicesController).GetMethod(methodName);

        Assert.NotNull(method);

        var authorizeAttribute = method!
            .GetCustomAttributes(typeof(AuthorizeAttribute), inherit: true)
            .OfType<AuthorizeAttribute>()
            .Single();

        Assert.Equal(expectedRoles, authorizeAttribute.Roles);
    }

    [Theory]
    [InlineData(null, "Registrador", true)]
    [InlineData("all", "Registrador", true)]
    [InlineData("mine", "Registrador", true)]
    [InlineData("managed", "Registrador", false)]
    [InlineData("managed", "Gestor", true)]
    [InlineData("all", "Gestor", false)]
    [InlineData("mine", "Admin", true)]
    [InlineData("managed", "Admin", true)]
    [InlineData("unexpected", "Admin", true)]
    [InlineData("unexpected", "Registrador", false)]
    public void Scope_access_requires_expected_roles(string? scope, string role, bool expected)
    {
        var result = InvokeStatic<bool>("CanAccessScope", scope, new[] { role });

        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("Admin", true, false, true)]
    [InlineData("Registrador", true, false, true)]
    [InlineData("Gestor", false, true, true)]
    [InlineData("Registrador", false, false, false)]
    [InlineData("Gestor", false, false, false)]
    public void Attachment_upload_requires_admin_creator_or_manager(string role, bool isCreator, bool isManager, bool expected)
    {
        var userId = Guid.NewGuid();
        var invoice = new Invoice
        {
            CreatedByUserId = isCreator ? userId : Guid.NewGuid(),
            RefundManagerUserId = isManager ? userId : Guid.NewGuid()
        };

        var result = InvokeStatic<bool>("CanUploadAttachment", invoice, userId, new[] { role });

        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("Admin", true, false, true)]
    [InlineData("Registrador", true, false, true)]
    [InlineData("Gestor", false, true, true)]
    [InlineData("Registrador", false, false, false)]
    [InlineData("Gestor", false, false, false)]
    public void Invoice_access_requires_admin_creator_or_assigned_manager(string role, bool isCreator, bool isManager, bool expected)
    {
        var userId = Guid.NewGuid();
        var invoice = new Invoice
        {
            CreatedByUserId = isCreator ? userId : Guid.NewGuid(),
            RefundManagerUserId = isManager ? userId : Guid.NewGuid()
        };

        var currentUserService = new CurrentUserStub
        {
            UserId = userId,
            Roles = new[] { role }
        };

        var controller = new InvoicesController(
            dbContext: null!,
            currentUserService,
            invoiceStatusService: null!,
            attachmentStorageService: null!,
            auditService: null!);

        var method = typeof(InvoicesController).GetMethod("CanAccessInvoice", BindingFlags.NonPublic | BindingFlags.Instance);

        Assert.NotNull(method);

        var result = (bool)method!.Invoke(controller, new object[] { invoice })!;

        Assert.Equal(expected, result);
    }

    private static T InvokeStatic<T>(string methodName, params object?[] args)
    {
        var method = typeof(InvoicesController).GetMethod(methodName, BindingFlags.NonPublic | BindingFlags.Static);

        Assert.NotNull(method);

        return (T)method!.Invoke(null, args)!;
    }
}

file sealed class CurrentUserStub : Services.ICurrentUserService
{
    public Guid? UserId { get; init; }

    public IReadOnlyCollection<string> Roles { get; init; } = Array.Empty<string>();
}

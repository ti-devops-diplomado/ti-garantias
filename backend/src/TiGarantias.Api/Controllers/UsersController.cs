using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TiGarantias.Api.Contracts;
using TiGarantias.Api.Data;
using TiGarantias.Api.Services;
using TiGarantias.Api.Utils;

namespace TiGarantias.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Admin")]
public sealed class UsersController(
    AppDbContext dbContext,
    PasswordHasher<User> passwordHasher,
    IAuditService auditService,
    ICurrentUserService currentUserService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<UserSummary>>> GetAll(CancellationToken cancellationToken)
    {
        var users = await dbContext.Users.Include(x => x.UserRoles).ThenInclude(x => x.Role).OrderBy(x => x.FullName).ToListAsync(cancellationToken);
        return Ok(users.Select(MapSummary).ToArray());
    }

    [HttpPost]
    public async Task<ActionResult<UserSummary>> Create([FromBody] UserUpsertRequest request, CancellationToken cancellationToken)
    {
        var normalizedEmail = EmailNormalizer.Normalize(request.Email);
        var emailExists = await dbContext.Users.AnyAsync(x => x.Email.ToLower() == normalizedEmail, cancellationToken);
        if (emailExists)
        {
            return Conflict("Ya existe un usuario con ese correo.");
        }

        var roles = await dbContext.Roles.Where(x => request.Roles.Contains(x.Name)).ToListAsync(cancellationToken);
        var user = new User
        {
            Email = normalizedEmail,
            FullName = request.FullName.Trim(),
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };
        user.PasswordHash = passwordHasher.HashPassword(user, string.IsNullOrWhiteSpace(request.Password) ? "Temporal123!" : request.Password);

        dbContext.Users.Add(user);
        dbContext.UserRoles.AddRange(roles.Select(role => new UserRole { UserId = user.Id, RoleId = role.Id }));
        await dbContext.SaveChangesAsync(cancellationToken);
        await auditService.RecordAsync("user", user.Id.ToString(), "create", request, cancellationToken);

        var saved = await dbContext.Users.Include(x => x.UserRoles).ThenInclude(x => x.Role).SingleAsync(x => x.Id == user.Id, cancellationToken);
        return CreatedAtAction(nameof(GetAll), new { id = user.Id }, MapSummary(saved));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<UserSummary>> Update(Guid id, [FromBody] UserUpsertRequest request, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.Include(x => x.UserRoles).ThenInclude(x => x.Role).SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (user is null) return NotFound();

        var normalizedEmail = EmailNormalizer.Normalize(request.Email);
        var emailExists = await dbContext.Users.AnyAsync(x => x.Id != id && x.Email.ToLower() == normalizedEmail, cancellationToken);
        if (emailExists)
        {
            return Conflict("Ya existe un usuario con ese correo.");
        }

        user.Email = normalizedEmail;
        user.FullName = request.FullName.Trim();
        user.IsActive = request.IsActive;
        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            user.PasswordHash = passwordHasher.HashPassword(user, request.Password);
        }

        dbContext.UserRoles.RemoveRange(user.UserRoles);
        var roles = await dbContext.Roles.Where(x => request.Roles.Contains(x.Name)).ToListAsync(cancellationToken);
        dbContext.UserRoles.AddRange(roles.Select(role => new UserRole { UserId = user.Id, RoleId = role.Id }));

        await dbContext.SaveChangesAsync(cancellationToken);
        await auditService.RecordAsync("user", user.Id.ToString(), "update", request, cancellationToken);

        user = await dbContext.Users.Include(x => x.UserRoles).ThenInclude(x => x.Role).SingleAsync(x => x.Id == user.Id, cancellationToken);
        return Ok(MapSummary(user));
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<UserSummary>> UpdateStatus(Guid id, [FromBody] UserStatusUpdateRequest request, CancellationToken cancellationToken)
    {
        if (currentUserService.UserId == id && !request.IsActive)
        {
            return BadRequest("No puedes desactivar tu propio usuario.");
        }

        var user = await dbContext.Users
            .Include(x => x.UserRoles)
            .ThenInclude(x => x.Role)
            .SingleOrDefaultAsync(x => x.Id == id, cancellationToken);

        if (user is null) return NotFound();

        user.IsActive = request.IsActive;
        await dbContext.SaveChangesAsync(cancellationToken);
        await auditService.RecordAsync("user", user.Id.ToString(), "status-update", request, cancellationToken);

        return Ok(MapSummary(user));
    }

    [HttpPost("{id:guid}/reset-password")]
    public async Task<ActionResult> ResetPassword(Guid id, [FromBody] UserPasswordResetRequest request, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (user is null) return NotFound();

        user.PasswordHash = passwordHasher.HashPassword(user, request.NewPassword);
        await dbContext.SaveChangesAsync(cancellationToken);
        await auditService.RecordAsync("user", user.Id.ToString(), "reset-password", new { Reset = true }, cancellationToken);

        return NoContent();
    }

    private static UserSummary MapSummary(User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        FullName = user.FullName,
        IsActive = user.IsActive,
        Roles = user.UserRoles.Select(x => x.Role.Name).ToArray()
    };
}

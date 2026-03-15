using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TiGarantias.Api.Contracts;
using TiGarantias.Api.Data;
using TiGarantias.Api.Services;

namespace TiGarantias.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(
    AppDbContext dbContext,
    PasswordHasher<User> passwordHasher,
    IJwtTokenService jwtTokenService,
    ICurrentUserService currentUserService) : ControllerBase
{
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var user = await dbContext.Users
            .Include(x => x.UserRoles)
            .ThenInclude(x => x.Role)
            .SingleOrDefaultAsync(x => x.Email == request.Email, cancellationToken);

        if (user is null || !user.IsActive)
        {
            return Unauthorized();
        }

        var result = passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (result == PasswordVerificationResult.Failed)
        {
            return Unauthorized();
        }

        return Ok(jwtTokenService.CreateToken(user, user.UserRoles.Select(x => x.Role.Name).ToArray()));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserSummary>> Me(CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId;
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var user = await dbContext.Users
            .Include(x => x.UserRoles)
            .ThenInclude(x => x.Role)
            .SingleAsync(x => x.Id == userId.Value, cancellationToken);

        return Ok(new UserSummary
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            IsActive = user.IsActive,
            Roles = user.UserRoles.Select(x => x.Role.Name).ToArray()
        });
    }
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TiGarantias.Api.Data;

namespace TiGarantias.Api.Controllers;

[ApiController]
[Route("api/settings")]
[Authorize(Roles = "Admin")]
public sealed class SettingsController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyCollection<Setting>>> GetAll(CancellationToken cancellationToken) =>
        Ok(await dbContext.Settings.OrderBy(x => x.Key).ToListAsync(cancellationToken));
}

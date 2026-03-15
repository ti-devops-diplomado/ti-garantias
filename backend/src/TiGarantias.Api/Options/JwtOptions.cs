namespace TiGarantias.Api.Options;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Secret { get; set; } = "CambiarEstaClaveTemporal1234567890";
    public string Issuer { get; set; } = "ti-garantias";
    public string Audience { get; set; } = "ti-garantias-clients";
    public int ExpirationMinutes { get; set; } = 480;
}

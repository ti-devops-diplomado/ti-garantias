using TiGarantias.Api.Utils;

namespace TiGarantias.Api.Tests;

public sealed class EmailNormalizerTests
{
    [Fact]
    public void DebeQuitarEspaciosYConvertirAMinusculas()
    {
        var result = EmailNormalizer.Normalize("  Usuario.Nuevo@Demo.Local  ");

        Assert.Equal("usuario.nuevo@demo.local", result);
    }
}

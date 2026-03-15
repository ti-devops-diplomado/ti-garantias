namespace TiGarantias.Api.Options;

public sealed class StorageOptions
{
    public const string SectionName = "Storage";

    public string AttachmentsPath { get; set; } = "/data/attachments";
}

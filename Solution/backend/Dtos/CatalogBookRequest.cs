namespace Shelved.Dtos;

public class CatalogBookRequest
{
    public string? ExternalGoogleBooksId { get; set; }
    public string Title { get; set; } = string.Empty;
    public List<string> Authors { get; set; } = new();
    public string Description { get; set; } = string.Empty;
    public string CoverImageUrl { get; set; } = string.Empty;
    public string? PublishedDate { get; set; }
    public List<string> Categories { get; set; } = new();
}

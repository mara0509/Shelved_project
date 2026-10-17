using Google.Cloud.Firestore;

namespace Shelved.Models;

[FirestoreData]
public class CatalogBook
{
    [FirestoreDocumentId]
    public string? Id { get; set; }

    [FirestoreProperty]
    public string? ExternalGoogleBooksId { get; set; }

    [FirestoreProperty]
    public string Title { get; set; } = string.Empty;

    [FirestoreProperty]
    public List<string> Authors { get; set; } = new();

    [FirestoreProperty]
    public string Description { get; set; } = string.Empty;

    [FirestoreProperty]
    public string CoverImageUrl { get; set; } = string.Empty;

    [FirestoreProperty]
    public string? PublishedDate { get; set; }

    [FirestoreProperty]
    public List<string> Categories { get; set; } = new();

    [FirestoreProperty]
    public DateTime DateAdded { get; set; }
}

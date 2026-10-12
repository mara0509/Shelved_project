using Google.Cloud.Firestore;

namespace Shelved.Models;

[FirestoreData]
public class Book
{
    [FirestoreDocumentId]
    public string? Id { get; set; }

    [FirestoreProperty]
    public string Title { get; set; } = string.Empty;

    [FirestoreProperty]
    public string Author { get; set; } = string.Empty;

    [FirestoreProperty]
    public string OwnerId { get; set; } = string.Empty;

    [FirestoreProperty]
    public string CoverUrl { get; set; } = string.Empty;
}


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

    [FirestoreProperty]
    public string Status { get; set; } = "To read";

    [FirestoreProperty]
    public int Rating { get; set; } = 0;

    [FirestoreProperty]
    public string Description { get; set; } = string.Empty;

    [FirestoreProperty]
    public int PageCount { get; set; } = 0;

    [FirestoreProperty]
    public int CurrentPage { get; set; } = 0;
}


using Google.Cloud.Firestore;

namespace Shelved.Models;

[FirestoreData]
public class ReadingList
{
    [FirestoreDocumentId]
    public string? Id { get; set; }

    [FirestoreProperty]
    public string OwnerId { get; set; } = string.Empty;

    [FirestoreProperty]
    public string Name { get; set; } = string.Empty;

    [FirestoreProperty]
    public string Description { get; set; } = string.Empty;

    [FirestoreProperty]
    public bool IsShared { get; set; } = false;

    [FirestoreProperty]
    public List<string> BookIds { get; set; } = new();

    [FirestoreProperty]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

using Google.Cloud.Firestore;

namespace Shelved.Models;

[FirestoreData]
public class User
{
    public const string ReaderRole = "Reader";
    public const string AdminRole = "Admin";
    public const string IdentityPasswordFormat = "AspNetCoreIdentityV3";

    public Guid Id { get; set; }

    [FirestoreDocumentId]
    public string? DocumentId { get; set; }

    [FirestoreProperty]
    public string Username { get; set; } = "";

    [FirestoreProperty]
    public string Email { get; set; } = "";

    [FirestoreProperty]
    public string Password { get; set; } = "";

    [FirestoreProperty]
    public string? PasswordFormat { get; set; }

    [FirestoreProperty]
    public string Role { get; set; } = ReaderRole;

    [FirestoreProperty]
    public int ReadingGoal { get; set; } = 12;

    public User()
    {
    }

}

public sealed record UserRecord(User User, DateTime? CreatedAt);

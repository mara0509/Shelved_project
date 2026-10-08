using Google.Cloud.Firestore;

namespace Shelved.Models;

[FirestoreData]
public class User
{
    public Guid Id { get; set; }

    [FirestoreProperty]
    public string Username { get; set; } = "";

    [FirestoreProperty]
    public string Email { get; set; } = "";

    [FirestoreProperty]
    public string Password { get; set; } = "";

    public User()
    {
    }
}
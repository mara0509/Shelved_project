using Google.Cloud.Firestore;
using Shelved.Models;

namespace Shelved.Repositories;

public class FirestoreUserRepository : IUserRepository
{
    private readonly FirestoreDb _db;

    public FirestoreUserRepository(FirestoreDb db)
    {
        _db = db;
    }

    public async Task<User?> FindByUsernameAsync(string username)
    {
        var query = _db.Collection("users")
            .WhereEqualTo("Username", username)
            .Limit(1);

        var snapshot = await query.GetSnapshotAsync();

        if (snapshot.Count == 0)
            return null;

        return snapshot.Documents[0].ConvertTo<User>();
    }

    public async Task<User?> FindByEmailAsync(string email)
    {
        var query = _db.Collection("users")
            .WhereEqualTo("Email", email)
            .Limit(1);

        var snapshot = await query.GetSnapshotAsync();

        if (snapshot.Count == 0)
            return null;

        return snapshot.Documents[0].ConvertTo<User>();
    }

    public async Task<bool> PasswordExistsAsync(string password)
    {
        var query = _db.Collection("users")
            .WhereEqualTo("Password", password)
            .Limit(1);

        var snapshot = await query.GetSnapshotAsync();

        return snapshot.Count > 0;
    }

    public async Task<User> AddAsync(
        string username,
        string email,
        string password)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = username,
            Email = email,
            Password = password
        };

        var document = _db.Collection("users").Document();

        await document.SetAsync(user);

        // Keep the actual Firestore document ID on the returned user.
        user.DocumentId = document.Id;

        return user;
    }
}

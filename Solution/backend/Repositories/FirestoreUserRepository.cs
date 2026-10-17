using Google.Cloud.Firestore;
using Microsoft.AspNetCore.Identity;
using Shelved.Models;

namespace Shelved.Repositories;

public class FirestoreUserRepository : IUserRepository
{
    private readonly FirestoreDb _db;
    private readonly IPasswordHasher<User> _passwordHasher;

    public FirestoreUserRepository(
        FirestoreDb db,
        IPasswordHasher<User> passwordHasher)
    {
        _db = db;
        _passwordHasher = passwordHasher;
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

    public async Task<List<UserRecord>> GetAllAsync()
    {
        var snapshot = await _db.Collection("users").GetSnapshotAsync();
        return snapshot.Documents
            .Select(document => new UserRecord(
                document.ConvertTo<User>(),
                document.CreateTime?.ToDateTime()))
            .ToList();
    }

    public async Task<bool> PasswordExistsAsync(string password)
    {
        var snapshot = await _db.Collection("users").GetSnapshotAsync();

        foreach (var document in snapshot.Documents)
        {
            var user = document.ConvertTo<User>();
            if (user.PasswordFormat is null &&
                string.Equals(user.Password, password, StringComparison.Ordinal))
            {
                return true;
            }

            if (user.PasswordFormat == User.IdentityPasswordFormat &&
                _passwordHasher.VerifyHashedPassword(
                    user,
                    user.Password,
                    password) != PasswordVerificationResult.Failed)
            {
                return true;
            }
        }

        return false;
    }

    public async Task<User> AddAsync(
        string username,
        string email,
        string passwordHash)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = username,
            Email = email,
            Password = passwordHash,
            PasswordFormat = User.IdentityPasswordFormat,
            Role = User.ReaderRole
        };

        var document = _db.Collection("users").Document();

        await document.SetAsync(user);

        // Keep the actual Firestore document ID on the returned user.
        user.DocumentId = document.Id;

        return user;
    }

    
    public async Task DeleteByDocumentIdAsync(string documentId)
    {
        await _db.Collection("users")
            .Document(documentId)
            .DeleteAsync();
    }

    public Task<UserManagementResult> DeleteSafelyAsync(string documentId)
    {
        var users = _db.Collection("users");
        var target = users.Document(documentId);

        return _db.RunTransactionAsync(async transaction =>
        {
            var account = await transaction.GetSnapshotAsync(target);

            if (!account.Exists)
                return UserManagementResult.NotFound;

            if (GetRole(account) == User.AdminRole)
            {
                var admins = await transaction.GetSnapshotAsync(
                    users.WhereEqualTo("Role", User.AdminRole));
                if (admins.Count <= 1)
                    return UserManagementResult.LastAdmin;
            }

            transaction.Delete(target);
            return UserManagementResult.Success;
        });
    }

    public async Task<User?> FindByDocumentIdAsync(string documentId)
    {
        var snapshot = await _db.Collection("users")
            .Document(documentId)
            .GetSnapshotAsync();

        return snapshot.Exists ? snapshot.ConvertTo<User>() : null;
    }

    public async Task SetRoleAsync(string documentId, string role)
    {
        await _db.Collection("users")
            .Document(documentId)
            .UpdateAsync("Role", role);
    }

    public Task<UserManagementResult> UpdateRoleSafelyAsync(
        string documentId,
        string role)
    {
        var users = _db.Collection("users");
        var target = users.Document(documentId);

        return _db.RunTransactionAsync(async transaction =>
        {
            var account = await transaction.GetSnapshotAsync(target);

            if (!account.Exists)
                return UserManagementResult.NotFound;

            var currentRole = GetRole(account);
            if (currentRole == User.AdminRole &&
                role != User.AdminRole)
            {
                var admins = await transaction.GetSnapshotAsync(
                    users.WhereEqualTo("Role", User.AdminRole));
                if (admins.Count <= 1)
                    return UserManagementResult.LastAdmin;
            }

            transaction.Update(target, "Role", role);
            return UserManagementResult.Success;
        });
    }

    public async Task UpdatePasswordAsync(
        string documentId,
        string passwordHash,
        string passwordFormat)
    {
        await _db.Collection("users")
            .Document(documentId)
            .UpdateAsync(new Dictionary<string, object>
            {
                ["Password"] = passwordHash,
                ["PasswordFormat"] = passwordFormat
            });
    }


    public async Task UpdateAccountAsync(
    string documentId,
    string username,
    string email,
    string? password,
    int readingGoal)
    {
        var updates = new Dictionary<string, object>
        {
            { "Username", username },
            { "Email", email },
            { "ReadingGoal", readingGoal }  
        };

        if (!string.IsNullOrWhiteSpace(password))
        {
            updates["Password"] = password;
            updates["PasswordFormat"] = User.IdentityPasswordFormat;
        }

        await _db.Collection("users")
            .Document(documentId)
            .UpdateAsync(updates);
    }

    private static string GetRole(DocumentSnapshot document) =>
        document.TryGetValue<string>("Role", out var role) &&
        !string.IsNullOrWhiteSpace(role)
            ? role
            : User.ReaderRole;
}

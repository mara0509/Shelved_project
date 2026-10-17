
using Shelved.Models;
using Microsoft.AspNetCore.Identity;

namespace Shelved.Repositories;

public class UserRepository : IUserRepository
{
    private readonly List<User> _users = [];
    private readonly IPasswordHasher<User> _passwordHasher;

    public UserRepository(IPasswordHasher<User> passwordHasher)
    {
        _passwordHasher = passwordHasher;
    }

    public Task<User?> FindByUsernameAsync(string username) =>
        Task.FromResult(_users.FirstOrDefault(u => u.Username == username));

    public Task<User?> FindByEmailAsync(string email) =>
        Task.FromResult(_users.FirstOrDefault(u => u.Email == email));

    public Task<List<UserRecord>> GetAllAsync() =>
        Task.FromResult(_users
            .Select(user => new UserRecord(user, null))
            .ToList());

    public Task<bool> PasswordExistsAsync(string password)
    {
        return Task.FromResult(_users.Any(user =>
            (user.PasswordFormat is null &&
             string.Equals(user.Password, password, StringComparison.Ordinal)) ||
            (user.PasswordFormat == User.IdentityPasswordFormat &&
             _passwordHasher.VerifyHashedPassword(
                 user,
                 user.Password,
                 password) != PasswordVerificationResult.Failed)));
    }

    public Task<User> AddAsync(
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

        _users.Add(user);
        return Task.FromResult(user);
    }

    public Task<User?> FindByDocumentIdAsync(string documentId) =>
        Task.FromResult(_users.FirstOrDefault(u => u.DocumentId == documentId));

    public Task SetRoleAsync(string documentId, string role)
    {
        var user = _users.FirstOrDefault(
            u => u.DocumentId == documentId);

        if (user is null)
        {
            throw new InvalidOperationException(
                "User not found.");
        }

        user.Role = role;
        return Task.CompletedTask;
    }

    public Task<UserManagementResult> DeleteSafelyAsync(string documentId)
    {
        var user = _users.FirstOrDefault(u => u.DocumentId == documentId);
        if (user is null)
            return Task.FromResult(UserManagementResult.NotFound);

        if (user.Role == User.AdminRole &&
            _users.Count(u => u.Role == User.AdminRole) <= 1)
        {
            return Task.FromResult(UserManagementResult.LastAdmin);
        }

        _users.Remove(user);
        return Task.FromResult(UserManagementResult.Success);
    }

    public Task UpdatePasswordAsync(
        string documentId,
        string passwordHash,
        string passwordFormat)
    {
        var user = _users.FirstOrDefault(
            u => u.DocumentId == documentId);

        if (user is null)
        {
            throw new InvalidOperationException(
                "User not found.");
        }

        user.Password = passwordHash;
        user.PasswordFormat = passwordFormat;
        return Task.CompletedTask;
    }

    public Task<UserManagementResult> UpdateRoleSafelyAsync(
        string documentId,
        string role)
    {
        var user = _users.FirstOrDefault(u => u.DocumentId == documentId);
        if (user is null)
            return Task.FromResult(UserManagementResult.NotFound);

        if (user.Role == User.AdminRole &&
            role != User.AdminRole &&
            _users.Count(u => u.Role == User.AdminRole) <= 1)
        {
            return Task.FromResult(UserManagementResult.LastAdmin);
        }

        user.Role = role;
        return Task.FromResult(UserManagementResult.Success);
    }

    public Task DeleteByDocumentIdAsync(string documentId)
    {
        var user = _users.FirstOrDefault(u => u.DocumentId == documentId);
        if (user is not null)
            _users.Remove(user);

        return Task.CompletedTask;
    }

    public Task UpdateAccountAsync(
    string documentId,
    string username,
    string email,
    string? password,
    int readingGoal)
    {
        var user = _users.FirstOrDefault(
            u => u.DocumentId == documentId);

        if (user is null)
        {
            throw new InvalidOperationException(
                "User not found.");
        }

        user.Username = username;
        user.Email = email;
        user.ReadingGoal = readingGoal;

        if (!string.IsNullOrWhiteSpace(password))
        {
            user.Password = password;
            user.PasswordFormat = User.IdentityPasswordFormat;
        }

        return Task.CompletedTask;
    }
}

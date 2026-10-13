
using Shelved.Models;

namespace Shelved.Repositories;

public class UserRepository : IUserRepository
{
    private readonly List<User> _users = [];

    public Task<User?> FindByUsernameAsync(string username) =>
        Task.FromResult(_users.FirstOrDefault(u => u.Username == username));

    public Task<User?> FindByEmailAsync(string email) =>
        Task.FromResult(_users.FirstOrDefault(u => u.Email == email));

    public Task<bool> PasswordExistsAsync(string password) =>
        Task.FromResult(_users.Any(u => u.Password == password));

    public Task<User> AddAsync(string username, string email, string password)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = username,
            Email = email,
            Password = password
        };

        _users.Add(user);
        return Task.FromResult(user);
    }

    public Task<User?> FindByDocumentIdAsync(string documentId) =>
        Task.FromResult(_users.FirstOrDefault(u => u.DocumentId == documentId));

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
        }

        return Task.CompletedTask;
    }
}

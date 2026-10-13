
using Shelved.Models;

namespace Shelved.Repositories;

public interface IUserRepository
{
    Task<User?> FindByUsernameAsync(string username);
    Task<User?> FindByEmailAsync(string email);
    Task<bool> PasswordExistsAsync(string password);
    Task<User> AddAsync(string username, string email, string password);
    Task DeleteByDocumentIdAsync(string documentId);
    Task<User?> FindByDocumentIdAsync(string documentId);
    Task UpdateAccountAsync(
    string documentId,
    string username,
    string email,
    string? password,
    int readingGoal);
}

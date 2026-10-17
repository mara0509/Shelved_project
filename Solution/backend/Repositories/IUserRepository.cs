
using Shelved.Models;

namespace Shelved.Repositories;

public interface IUserRepository
{
    Task<User?> FindByUsernameAsync(string username);
    Task<User?> FindByEmailAsync(string email);
    Task<List<UserRecord>> GetAllAsync();
    Task<bool> PasswordExistsAsync(string password);
    Task<User> AddAsync(string username, string email, string passwordHash);
    Task DeleteByDocumentIdAsync(string documentId);
    Task<UserManagementResult> DeleteSafelyAsync(string documentId);
    Task<User?> FindByDocumentIdAsync(string documentId);
    Task SetRoleAsync(string documentId, string role);
    Task<UserManagementResult> UpdateRoleSafelyAsync(
        string documentId,
        string role);
    Task UpdatePasswordAsync(
        string documentId,
        string passwordHash,
        string passwordFormat);
    Task UpdateAccountAsync(
    string documentId,
    string username,
    string email,
    string? password,
    int readingGoal);
}

public enum UserManagementResult
{
    Success,
    NotFound,
    LastAdmin
}

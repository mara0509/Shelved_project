
using Shelved.Models;

namespace Shelved.Repositories;

public interface IBookRepository
{
    Task<string> AddAsync(Book book);
    Task<(string Id, bool AlreadyExists)> AddCatalogBookAsync(
        Book book,
        string catalogBookId);
    Task<Book?> GetByIdAsync(string id);
    Task<List<Book>> GetAllAsync();
    Task<List<Book>> GetByOwnerIdAsync(string ownerId);
    Task UpdateAsync(string id, Book book);
    Task DeleteAsync(string id);
    Task DeleteByOwnerIdAsync(string ownerId);
}

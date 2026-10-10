
using Shelved.Models;

namespace Shelved.Repositories;

public interface IBookRepository
{
    Task<string> AddAsync(Book book);
    Task<Book?> GetByIdAsync(string id);
    Task UpdateAsync(string id, Book book);
    Task DeleteAsync(string id);
}

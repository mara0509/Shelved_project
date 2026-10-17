
using Shelved.Models;

namespace Shelved.Repositories;

public interface IReadingListRepository
{
    Task<string> AddAsync(ReadingList readingList);
    Task<ReadingList?> GetByIdAsync(string id);
    Task<List<ReadingList>> GetAllAsync();
    Task<List<ReadingList>> GetByOwnerIdAsync(string ownerId);
    Task UpdateAsync(string id, ReadingList readingList);
    Task DeleteAsync(string id);
    Task DeleteByOwnerIdAsync(string ownerId);
}

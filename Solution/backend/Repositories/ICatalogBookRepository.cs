using Shelved.Models;

namespace Shelved.Repositories;

public interface ICatalogBookRepository
{
    Task<List<CatalogBook>> GetAllAsync();
    Task<CatalogBook?> GetByIdAsync(string id);
    Task<CatalogBook?> GetByExternalGoogleBooksIdAsync(string externalGoogleBooksId);
    Task<string> AddAsync(CatalogBook book);
    Task UpdateAsync(string id, CatalogBook book);
    Task DeleteAsync(string id);
}

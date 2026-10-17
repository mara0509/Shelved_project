using Google.Cloud.Firestore;
using Shelved.Models;

namespace Shelved.Repositories;

public class FirestoreCatalogBookRepository : ICatalogBookRepository
{
    private readonly FirestoreDb _firestore;

    public FirestoreCatalogBookRepository(FirestoreDb firestore)
    {
        _firestore = firestore;
    }

    public async Task<List<CatalogBook>> GetAllAsync()
    {
        var snapshot = await _firestore
            .Collection("bookCatalog")
            .GetSnapshotAsync();

        return snapshot.Documents
            .Select(document => document.ConvertTo<CatalogBook>())
            .ToList();
    }

    public async Task<CatalogBook?> GetByIdAsync(string id)
    {
        var snapshot = await _firestore
            .Collection("bookCatalog")
            .Document(id)
            .GetSnapshotAsync();

        return snapshot.Exists
            ? snapshot.ConvertTo<CatalogBook>()
            : null;
    }

    public async Task<CatalogBook?> GetByExternalGoogleBooksIdAsync(
        string externalGoogleBooksId)
    {
        var snapshot = await _firestore
            .Collection("bookCatalog")
            .WhereEqualTo("ExternalGoogleBooksId", externalGoogleBooksId)
            .Limit(1)
            .GetSnapshotAsync();

        return snapshot.Documents
            .Select(document => document.ConvertTo<CatalogBook>())
            .FirstOrDefault();
    }

    public async Task<string> AddAsync(CatalogBook book)
    {
        var document = await _firestore
            .Collection("bookCatalog")
            .AddAsync(book);

        return document.Id;
    }

    public async Task UpdateAsync(string id, CatalogBook book)
    {
        await _firestore
            .Collection("bookCatalog")
            .Document(id)
            .SetAsync(book, SetOptions.MergeAll);
    }

    public async Task DeleteAsync(string id)
    {
        await _firestore
            .Collection("bookCatalog")
            .Document(id)
            .DeleteAsync();
    }
}

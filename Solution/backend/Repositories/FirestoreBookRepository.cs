
using Google.Cloud.Firestore;
using Shelved.Models;
using System.Security.Cryptography;
using System.Text;

namespace Shelved.Repositories;

public class FirestoreBookRepository : IBookRepository
{
    private readonly FirestoreDb _firestore;

    public FirestoreBookRepository(FirestoreDb firestore)
    {
        _firestore = firestore;
    }

    public async Task<string> AddAsync(Book book)
    {
        var document = await _firestore.Collection("books").AddAsync(book);
        return document.Id;
    }

    public Task<(string Id, bool AlreadyExists)> AddCatalogBookAsync(
        Book book,
        string catalogBookId)
    {
        var stableDocumentId = Convert.ToHexString(
            SHA256.HashData(
                Encoding.UTF8.GetBytes($"{book.OwnerId}\0{catalogBookId}")));
        var document = _firestore.Collection("books")
            .Document(stableDocumentId);
        book.Id = stableDocumentId;
        book.CatalogBookId = catalogBookId;

        return _firestore.RunTransactionAsync(async transaction =>
        {
            var existing = await transaction.GetSnapshotAsync(document);
            if (existing.Exists)
            {
                return (existing.Id, true);
            }

            transaction.Create(document, book);
            return (stableDocumentId, false);
        });
    }

    public async Task<Book?> GetByIdAsync(string id)
    {
        var snapshot = await _firestore.Collection("books")
            .Document(id)
            .GetSnapshotAsync();

        return snapshot.Exists ? snapshot.ConvertTo<Book>() : null;
    }

    public async Task<List<Book>> GetAllAsync()
    {
        var snapshot = await _firestore.Collection("books").GetSnapshotAsync();
        return snapshot.Documents
            .Select(document => document.ConvertTo<Book>())
            .ToList();
    }

    public async Task<List<Book>> GetByOwnerIdAsync(string ownerId)
    {
        var snapshot = await _firestore.Collection("books")
            .WhereEqualTo("OwnerId", ownerId)
            .GetSnapshotAsync();

        return snapshot.Documents
            .Select(document => document.ConvertTo<Book>())
            .ToList();
    }

    public async Task UpdateAsync(string id, Book book)
    {
        await _firestore.Collection("books")
            .Document(id)
            .SetAsync(book, SetOptions.MergeAll);
    }

    public async Task DeleteAsync(string id)
    {
        await _firestore.Collection("books")
            .Document(id)
            .DeleteAsync();
    }

    
    public async Task DeleteByOwnerIdAsync(string ownerId)
    {
        var snapshot = await _firestore.Collection("books")
            .WhereEqualTo("OwnerId", ownerId)
            .GetSnapshotAsync();

        // Firestore batches allow at most 500 operations.
        foreach (var chunk in snapshot.Documents.Chunk(400))
        {
            var batch = _firestore.StartBatch();

            foreach (var document in chunk)
            {
                batch.Delete(document.Reference);
            }

            await batch.CommitAsync();
        }
    }

}

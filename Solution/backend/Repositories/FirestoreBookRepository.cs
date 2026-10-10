
using Google.Cloud.Firestore;
using Shelved.Models;

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

    public async Task<Book?> GetByIdAsync(string id)
    {
        var snapshot = await _firestore.Collection("books")
            .Document(id)
            .GetSnapshotAsync();

        return snapshot.Exists ? snapshot.ConvertTo<Book>() : null;
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
}

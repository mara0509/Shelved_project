
using Google.Cloud.Firestore;
using Shelved.Models;

namespace Shelved.Repositories;

public class FirestoreReadingListRepository : IReadingListRepository
{
    private readonly FirestoreDb _firestore;

    public FirestoreReadingListRepository(FirestoreDb firestore)
    {
        _firestore = firestore;
    }

    public async Task<string> AddAsync(ReadingList readingList)
    {
        var document = await _firestore
            .Collection("readingLists")
            .AddAsync(readingList);

        return document.Id;
    }

    public async Task<ReadingList?> GetByIdAsync(string id)
    {
        var snapshot = await _firestore
            .Collection("readingLists")
            .Document(id)
            .GetSnapshotAsync();

        return snapshot.Exists
            ? snapshot.ConvertTo<ReadingList>()
            : null;
    }

    public async Task<List<ReadingList>> GetAllAsync()
    {
        var snapshot = await _firestore
            .Collection("readingLists")
            .GetSnapshotAsync();

        return snapshot.Documents
            .Select(document => document.ConvertTo<ReadingList>())
            .ToList();
    }

    public async Task<List<ReadingList>> GetByOwnerIdAsync(
        string ownerId)
    {
        var snapshot = await _firestore
            .Collection("readingLists")
            .WhereEqualTo("OwnerId", ownerId)
            .GetSnapshotAsync();

        return snapshot.Documents
            .Select(document => document.ConvertTo<ReadingList>())
            .ToList();
    }

    public async Task UpdateAsync(
        string id,
        ReadingList readingList)
    {
        await _firestore
            .Collection("readingLists")
            .Document(id)
            .SetAsync(readingList, SetOptions.MergeAll);
    }

    public async Task DeleteAsync(string id)
    {
        await _firestore
            .Collection("readingLists")
            .Document(id)
            .DeleteAsync();
    }

    public async Task DeleteByOwnerIdAsync(string ownerId)
    {
        var snapshot = await _firestore
            .Collection("readingLists")
            .WhereEqualTo("OwnerId", ownerId)
            .GetSnapshotAsync();

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

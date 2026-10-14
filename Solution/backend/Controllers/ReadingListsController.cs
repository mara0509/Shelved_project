using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shelved.Models;
using Shelved.Repositories;

namespace Shelved.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize]
public class ReadingListsController : ControllerBase
{
    private readonly IReadingListRepository _lists;
    private readonly IBookRepository _books;

    public ReadingListsController(
        IReadingListRepository lists,
        IBookRepository books)
    {
        _lists = lists;
        _books = books;
    }

    private string? CurrentOwnerId =>
        User.FindFirstValue(ClaimTypes.NameIdentifier);

    [HttpGet]
    public async Task<IActionResult> GetMyLists()
    {
        var ownerId = CurrentOwnerId;
        if (string.IsNullOrWhiteSpace(ownerId))
            return Forbid();

        var lists = await _lists.GetByOwnerIdAsync(ownerId);
        return Ok(lists);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetList(string id)
    {
        var ownerId = CurrentOwnerId;
        if (string.IsNullOrWhiteSpace(ownerId))
            return Forbid();

        var list = await _lists.GetByIdAsync(id);
        if (list is null)
            return NotFound();

        if (list.OwnerId != ownerId)
            return Forbid();

        var allBooks = await _books.GetByOwnerIdAsync(ownerId);
        var booksById = allBooks
            .Where(book => !string.IsNullOrWhiteSpace(book.Id))
            .ToDictionary(book => book.Id!);

        var listBooks = list.BookIds
            .Where(bookId => booksById.ContainsKey(bookId))
            .Select(bookId => booksById[bookId])
            .ToList();

        return Ok(new { list, books = listBooks });
    }

    public sealed class CreateReadingListRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsShared { get; set; }
    }

    [HttpPost]
    public async Task<IActionResult> CreateList(
        [FromBody] CreateReadingListRequest request)
    {
        var ownerId = CurrentOwnerId;
        if (string.IsNullOrWhiteSpace(ownerId))
            return Forbid();

        var name = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(name))
            return BadRequest(new { message = "List name is required." });

        if (name.Length > 100)
            return BadRequest(new { message = "List name must be 100 characters or fewer." });

        var list = new ReadingList
        {
            OwnerId = ownerId,
            Name = name,
            Description = request.Description?.Trim() ?? string.Empty,
            IsShared = request.IsShared,
            BookIds = new List<string>(),
            CreatedAt = DateTime.UtcNow
        };

        var id = await _lists.AddAsync(list);
        list.Id = id;

        return Ok(list);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateList(
        string id,
        [FromBody] CreateReadingListRequest request)
    {
        var ownerId = CurrentOwnerId;
        if (string.IsNullOrWhiteSpace(ownerId))
            return Forbid();

        var list = await _lists.GetByIdAsync(id);
        if (list is null)
            return NotFound();

        if (list.OwnerId != ownerId)
            return Forbid();

        var name = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(name))
            return BadRequest(new { message = "List name is required." });

        if (name.Length > 100)
            return BadRequest(new { message = "List name must be 100 characters or fewer." });

        list.Name = name;
        list.Description = request.Description?.Trim() ?? string.Empty;
        list.IsShared = request.IsShared;

        await _lists.UpdateAsync(id, list);
        return Ok(list);
    }

    [HttpPost("{id}/books/{bookId}")]
    public async Task<IActionResult> AddBook(string id, string bookId)
    {
        var ownerId = CurrentOwnerId;
        if (string.IsNullOrWhiteSpace(ownerId))
            return Forbid();

        var list = await _lists.GetByIdAsync(id);
        if (list is null)
            return NotFound();

        if (list.OwnerId != ownerId)
            return Forbid();

        var book = await _books.GetByIdAsync(bookId);
        if (book is null)
            return NotFound(new { message = "Book not found." });

        if (book.OwnerId != ownerId)
            return Forbid();

        if (!list.BookIds.Contains(bookId))
        {
            list.BookIds.Add(bookId);
            await _lists.UpdateAsync(id, list);
        }

        return Ok(list);
    }

    [HttpDelete("{id}/books/{bookId}")]
    public async Task<IActionResult> RemoveBook(string id, string bookId)
    {
        var ownerId = CurrentOwnerId;
        if (string.IsNullOrWhiteSpace(ownerId))
            return Forbid();

        var list = await _lists.GetByIdAsync(id);
        if (list is null)
            return NotFound();

        if (list.OwnerId != ownerId)
            return Forbid();

        list.BookIds.Remove(bookId);
        await _lists.UpdateAsync(id, list);

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteList(string id)
    {
        var ownerId = CurrentOwnerId;
        if (string.IsNullOrWhiteSpace(ownerId))
            return Forbid();

        var list = await _lists.GetByIdAsync(id);
        if (list is null)
            return NotFound();

        if (list.OwnerId != ownerId)
            return Forbid();

        await _lists.DeleteAsync(id);
        return NoContent();
    }
}
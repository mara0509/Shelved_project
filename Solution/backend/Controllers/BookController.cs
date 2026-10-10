
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shelved.Models;
using Shelved.Repositories;

namespace Shelved.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize]
public class BooksController : ControllerBase
{
    private readonly IBookRepository _books;

    public BooksController(IBookRepository books)
    {
        _books = books;
    }

    [HttpPost]
    public async Task<IActionResult> Create(Book book)
    {
        var ownerId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(ownerId))
            return Forbid();

        book.Id = null;
        book.OwnerId = ownerId;

        var id = await _books.AddAsync(book);

        return Ok(new { id, book.Title, book.Author, book.OwnerId });
    }

    
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, Book updatedBook)
    {
        var book = await _books.GetByIdAsync(id);

        if (book is null)
            return NotFound();

        var ownerId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (book.OwnerId != ownerId)
            return Forbid();

        book.Title = updatedBook.Title;
        book.Author = updatedBook.Author;

        await _books.UpdateAsync(id, book);

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var book = await _books.GetByIdAsync(id);

        if (book is null)
            return NotFound();

        var ownerId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (book.OwnerId != ownerId)
            return Forbid();

        await _books.DeleteAsync(id);

        return NoContent();
    }

}

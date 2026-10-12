
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shelved.Models;
using Shelved.Repositories;
using Shelved.Services;

namespace Shelved.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize]
public class BooksController : ControllerBase
{
    private readonly IBookRepository _books;
    private readonly GoogleBooksService _googleBooks;
    public BooksController(IBookRepository books, GoogleBooksService googleBooks)
    {
        _books = books;
        _googleBooks = googleBooks;
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

    
    [HttpGet]
    public async Task<IActionResult> GetMyBooks()
    {
        var ownerId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(ownerId))
            return Forbid();

        var books = await _books.GetByOwnerIdAsync(ownerId);

        return Ok(books);
    }

    
    [HttpGet("search")]
    public async Task<IActionResult> SearchBooks(
        [FromQuery] string q,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(q))
            return BadRequest(new { message = "Enter a book title or author." });

        try
        {
            var results = await _googleBooks.SearchAsync(q, cancellationToken);
            return Ok(results);
        }
        catch (HttpRequestException ex)
            when (ex.StatusCode ==
                System.Net.HttpStatusCode.TooManyRequests)
        {
            return StatusCode(429, new
            {
                message = "Book search is temporarily rate-limited. Please wait a moment and try again."
            });
        }
        catch (HttpRequestException)
        {
            return StatusCode(502, new
            {
                message = "The book search service is temporarily unavailable."
            });
        }
            }


}

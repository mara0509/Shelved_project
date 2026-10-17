
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
    private readonly ICatalogBookRepository _catalog;

    public BooksController(
        IBookRepository books,
        GoogleBooksService googleBooks,
        ICatalogBookRepository catalog)
    {
        _books = books;
        _googleBooks = googleBooks;
        _catalog = catalog;
    }


    [HttpPost]
    public async Task<IActionResult> Create(Book book)
    {
        var ownerId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(ownerId))
            return Forbid();

        book.Id = null;
        book.OwnerId = ownerId;
        book.CatalogBookId = null;

        book.Status = "To read";
        book.Rating = 0;
        book.CurrentPage = 0;

        if (book.PageCount < 0)
            return BadRequest("Page count cannot be negative.");

        var id = await _books.AddAsync(book);

        return Ok(new
        {
            id,
            book.Title,
            book.Author,
            book.CoverUrl,
            book.OwnerId
        });
    }

    [HttpPost("from-catalog/{catalogBookId}")]
    public async Task<IActionResult> AddFromCatalog(string catalogBookId)
    {
        var ownerId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(ownerId))
            return Forbid();

        var catalogBook = await _catalog.GetByIdAsync(catalogBookId);
        if (catalogBook is null)
            return NotFound(new { message = "Catalog book not found." });

        var book = new Book
        {
            OwnerId = ownerId,
            CatalogBookId = catalogBookId,
            ExternalGoogleBooksId = catalogBook.ExternalGoogleBooksId,
            Title = catalogBook.Title,
            Author = string.Join(", ", catalogBook.Authors),
            CoverUrl = catalogBook.CoverImageUrl,
            Description = catalogBook.Description,
            Status = "To read",
            Rating = 0,
            PageCount = 0,
            CurrentPage = 0
        };

        var (id, alreadyExists) = await _books.AddCatalogBookAsync(
            book,
            catalogBookId);

        return Ok(new
        {
            id,
            catalogBookId,
            title = book.Title,
            author = book.Author,
            coverUrl = book.CoverUrl,
            ownerId,
            status = book.Status,
            rating = book.Rating,
            description = book.Description,
            pageCount = book.PageCount,
            currentPage = book.CurrentPage,
            alreadyInLibrary = alreadyExists
        });
    }

    [HttpPost("{id}/import-details")]
    public async Task<IActionResult> ImportDetails(
        string id,
        CancellationToken cancellationToken)
    {
        var ownerId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(ownerId))
            return Forbid();

        var book = await _books.GetByIdAsync(id);
        if (book is null)
            return NotFound(new { message = "Book not found." });
        if (book.OwnerId != ownerId)
            return Forbid();

        try
        {
            var volumeInfo = await _googleBooks.GetBookDetailsAsync(
                book.ExternalGoogleBooksId,
                book.Title,
                book.Author,
                cancellationToken);

            if (volumeInfo is null)
            {
                return NotFound(new
                {
                    message = "No matching book details were found."
                });
            }

            if (string.IsNullOrWhiteSpace(book.Description) &&
                volumeInfo.Value.TryGetProperty("description", out var description) &&
                description.ValueKind == System.Text.Json.JsonValueKind.String)
            {
                book.Description = description.GetString() ?? string.Empty;
            }

            if (string.IsNullOrWhiteSpace(book.CoverUrl) &&
                volumeInfo.Value.TryGetProperty("imageLinks", out var imageLinks) &&
                imageLinks.ValueKind == System.Text.Json.JsonValueKind.Object)
            {
                if (imageLinks.TryGetProperty("thumbnail", out var thumbnail) &&
                    thumbnail.ValueKind == System.Text.Json.JsonValueKind.String)
                {
                    book.CoverUrl = thumbnail.GetString() ?? string.Empty;
                }
                else if (imageLinks.TryGetProperty(
                             "smallThumbnail",
                             out var smallThumbnail) &&
                         smallThumbnail.ValueKind ==
                             System.Text.Json.JsonValueKind.String)
                {
                    book.CoverUrl = smallThumbnail.GetString() ?? string.Empty;
                }
            }

            await _books.UpdateAsync(id, book);
            return Ok(new
            {
                id,
                description = book.Description,
                coverUrl = book.CoverUrl
            });
        }
        catch (HttpRequestException)
        {
            return StatusCode(StatusCodes.Status502BadGateway, new
            {
                message = "Google Books is temporarily unavailable. Please try again."
            });
        }
        catch (InvalidOperationException)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                message = "Book details are not configured on the server."
            });
        }
    }


    
    
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(
        string id,
        Book updatedBook)
    {
        var book = await _books.GetByIdAsync(id);

        if (book is null)
            return NotFound();

        var ownerId = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (string.IsNullOrWhiteSpace(ownerId) ||
            book.OwnerId != ownerId)
        {
            return Forbid();
        }

        book.Title = updatedBook.Title;
        book.Author = updatedBook.Author;
        book.CoverUrl = updatedBook.CoverUrl;
        book.Description = updatedBook.Description;
        book.PageCount = Math.Max(0, updatedBook.PageCount);

        book.CurrentPage = Math.Clamp(
            updatedBook.CurrentPage,
            0,
            book.PageCount > 0 ? book.PageCount : int.MaxValue);

        if (updatedBook.Status is "To read"
            or "Currently reading"
            or "Finished")
        {
            book.Status = updatedBook.Status;
        }

        if (updatedBook.Rating is >= 0 and <= 5)
        {
            book.Rating = updatedBook.Rating;
        }

        await _books.UpdateAsync(id, book);

        return Ok(book);
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
    [Authorize(Roles = Shelved.Models.User.AdminRole)]
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

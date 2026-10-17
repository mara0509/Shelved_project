using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shelved.Dtos;
using Shelved.Models;
using Shelved.Repositories;

namespace Shelved.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize]
public class BookCatalogController : ControllerBase
{
    private readonly ICatalogBookRepository _catalog;

    public BookCatalogController(ICatalogBookRepository catalog)
    {
        _catalog = catalog;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var books = await _catalog.GetAllAsync();
        return Ok(books);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var book = await _catalog.GetByIdAsync(id);
        return book is null ? NotFound() : Ok(book);
    }

    [HttpPost]
    [Authorize(Roles = Shelved.Models.User.AdminRole)]
    public async Task<IActionResult> Create(CatalogBookRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest(new { message = "Book title is required." });

        var book = CreateCatalogBook(request);
        if (book.ExternalGoogleBooksId is not null &&
            await _catalog.GetByExternalGoogleBooksIdAsync(
                book.ExternalGoogleBooksId) is not null)
        {
            return Conflict(new
            {
                message = "This Google Books title is already in the catalog."
            });
        }

        book.DateAdded = DateTime.UtcNow;

        var id = await _catalog.AddAsync(book);
        book.Id = id;

        return Ok(book);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = Shelved.Models.User.AdminRole)]
    public async Task<IActionResult> Update(
        string id,
        CatalogBookRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
            return BadRequest(new { message = "Book title is required." });

        var book = await _catalog.GetByIdAsync(id);
        if (book is null)
            return NotFound();

        var updatedBook = CreateCatalogBook(request);
        if (updatedBook.ExternalGoogleBooksId is not null)
        {
            var duplicate = await _catalog.GetByExternalGoogleBooksIdAsync(
                updatedBook.ExternalGoogleBooksId);

            if (duplicate is not null && duplicate.Id != book.Id)
            {
                return Conflict(new
                {
                    message = "This Google Books title is already in the catalog."
                });
            }
        }

        updatedBook.Id = book.Id;
        updatedBook.DateAdded = book.DateAdded;

        await _catalog.UpdateAsync(id, updatedBook);
        return Ok(updatedBook);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = Shelved.Models.User.AdminRole)]
    public async Task<IActionResult> Delete(string id)
    {
        var book = await _catalog.GetByIdAsync(id);
        if (book is null)
            return NotFound();

        await _catalog.DeleteAsync(id);
        return NoContent();
    }

    private static CatalogBook CreateCatalogBook(
        CatalogBookRequest request) =>
        new()
        {
            ExternalGoogleBooksId = NormalizeOptional(request.ExternalGoogleBooksId),
            Title = request.Title.Trim(),
            Authors = NormalizeList(request.Authors),
            Description = request.Description?.Trim() ?? string.Empty,
            CoverImageUrl = request.CoverImageUrl?.Trim() ?? string.Empty,
            PublishedDate = NormalizeOptional(request.PublishedDate),
            Categories = NormalizeList(request.Categories)
        };

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static List<string> NormalizeList(IEnumerable<string>? values) =>
        values?
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value.Trim())
            .ToList() ?? new List<string>();
}

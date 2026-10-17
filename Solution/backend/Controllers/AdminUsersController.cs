using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shelved.Models;
using Shelved.Repositories;

namespace Shelved.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize(Roles = Shelved.Models.User.AdminRole)]
public class AdminUsersController : ControllerBase
{
    private readonly IUserRepository _users;
    private readonly IBookRepository _books;
    private readonly IReadingListRepository _readingLists;
    private readonly IConfiguration _configuration;

    public AdminUsersController(
        IUserRepository users,
        IBookRepository books,
        IReadingListRepository readingLists,
        IConfiguration configuration)
    {
        _users = users;
        _books = books;
        _readingLists = readingLists;
        _configuration = configuration;
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        if (!await IsCurrentAdminAsync())
            return Forbid();

        var users = await _users.GetAllAsync();
        var books = await _books.GetAllAsync();
        var lists = await _readingLists.GetAllAsync();
        var bookCounts = books
            .Where(book => !string.IsNullOrWhiteSpace(book.OwnerId))
            .GroupBy(book => book.OwnerId)
            .ToDictionary(group => group.Key, group => group.Count());
        var listCounts = lists
            .Where(list => !string.IsNullOrWhiteSpace(list.OwnerId))
            .GroupBy(list => list.OwnerId)
            .ToDictionary(group => group.Key, group => group.Count());

        return Ok(users.Select(record =>
        {
            var user = record.User;
            var accountId = user.DocumentId ?? string.Empty;
            return new
            {
                accountId,
                username = user.Username,
                email = user.Email,
                role = NormalizeRole(user.Role),
                registrationDate = record.CreatedAt,
                personalBookCount = bookCounts.GetValueOrDefault(accountId),
                readingListCount = listCounts.GetValueOrDefault(accountId)
            };
        }));
    }

    [HttpGet("{accountId}")]
    public async Task<IActionResult> GetUser(string accountId)
    {
        if (!await IsCurrentAdminAsync())
            return Forbid();

        var user = await _users.FindByDocumentIdAsync(accountId);
        if (user is null)
            return NotFound(new { message = "User account not found." });

        var books = await _books.GetByOwnerIdAsync(accountId);
        var lists = await _readingLists.GetByOwnerIdAsync(accountId);
        var booksById = books
            .Where(book => !string.IsNullOrWhiteSpace(book.Id))
            .ToDictionary(book => book.Id!);

        return Ok(new
        {
            accountId,
            username = user.Username,
            email = user.Email,
            role = NormalizeRole(user.Role),
            personalBooks = books.Select(book => new
            {
                id = book.Id,
                title = book.Title,
                author = book.Author,
                coverUrl = book.CoverUrl,
                status = book.Status,
                rating = book.Rating,
                description = book.Description,
                pageCount = book.PageCount,
                currentPage = book.CurrentPage
            }),
            readingLists = lists.Select(list => new
            {
                id = list.Id,
                name = list.Name,
                description = list.Description,
                isShared = list.IsShared,
                createdAt = list.CreatedAt,
                books = (list.BookIds ?? [])
                    .Where(bookId => booksById.ContainsKey(bookId))
                    .Select(bookId => new
                    {
                        id = bookId,
                        title = booksById[bookId].Title
                    })
            })
        });
    }

    [HttpPut("{accountId}/role")]
    public async Task<IActionResult> UpdateRole(
        string accountId,
        [FromBody] UpdateUserRoleRequest request)
    {
        if (!await IsCurrentAdminAsync())
            return Forbid();

        if (request.Role is not (
            Shelved.Models.User.ReaderRole or Shelved.Models.User.AdminRole))
            return BadRequest(new { message = "Role must be Reader or Admin." });

        var user = await _users.FindByDocumentIdAsync(accountId);
        if (user is null)
            return NotFound(new { message = "User account not found." });

        var configuredAdminEmail = _configuration["Admin:Email"]?.Trim();
        if (request.Role == Shelved.Models.User.ReaderRole &&
            !string.IsNullOrWhiteSpace(configuredAdminEmail) &&
            string.Equals(
                user.Email.Trim(),
                configuredAdminEmail,
                StringComparison.OrdinalIgnoreCase))
        {
            return Conflict(new
            {
                message = "The configured administrator account cannot be changed to Reader."
            });
        }

        var result = await _users.UpdateRoleSafelyAsync(
            accountId,
            request.Role);

        if (result == UserManagementResult.NotFound)
            return NotFound(new { message = "User account not found." });
        if (result == UserManagementResult.LastAdmin)
            return Conflict(new
            {
                message = "Shelved must have at least one Admin. Promote another user before demoting this account."
            });

        return Ok(new { accountId, role = request.Role });
    }

    [HttpDelete("{accountId}")]
    public async Task<IActionResult> DeleteUser(string accountId)
    {
        if (!await IsCurrentAdminAsync())
            return Forbid();

        var currentAdminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.Equals(currentAdminId, accountId, StringComparison.Ordinal))
        {
            return Conflict(new
            {
                message = "You cannot delete your own account from User Management."
            });
        }

        var result = await _users.DeleteSafelyAsync(accountId);
        if (result == UserManagementResult.NotFound)
            return NotFound(new { message = "User account not found." });
        if (result == UserManagementResult.LastAdmin)
            return Conflict(new
            {
                message = "Shelved must have at least one Admin. Promote another user before deleting this account."
            });

        await _books.DeleteByOwnerIdAsync(accountId);
        await _readingLists.DeleteByOwnerIdAsync(accountId);

        return NoContent();
    }

    private static string NormalizeRole(string? role) =>
        role is Shelved.Models.User.ReaderRole or Shelved.Models.User.AdminRole
            ? role
            : Shelved.Models.User.ReaderRole;

    private async Task<bool> IsCurrentAdminAsync()
    {
        var accountId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(accountId))
            return false;

        var account = await _users.FindByDocumentIdAsync(accountId);
        return account?.Role == Shelved.Models.User.AdminRole;
    }

    public sealed class UpdateUserRoleRequest
    {
        public string Role { get; set; } = string.Empty;
    }
}

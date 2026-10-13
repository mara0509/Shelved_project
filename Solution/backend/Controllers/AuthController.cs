using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Shelved.Repositories;
using Shelved.Dtos;
using Shelved.Models;
using Microsoft.AspNetCore.Authorization;

namespace Shelved.Controllers;

[ApiController]
[Route("[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserRepository _repo;
    private readonly IConfiguration _configuration;
    private readonly IBookRepository _bookRepo;

    public AuthController(
    IUserRepository repo,
    IBookRepository bookRepo,
    IConfiguration configuration)
{
    _repo = repo;
    _bookRepo = bookRepo;
    _configuration = configuration;
}

    [HttpPost("Register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        if (await _repo.FindByUsernameAsync(dto.Username) is not null)
            return Conflict("Username is already taken.");

        if (await _repo.FindByEmailAsync(dto.Email) is not null)
            return Conflict("Email is already registered.");

        if (await _repo.PasswordExistsAsync(dto.Password))
            return Conflict("Password is already in use.");

        var user = await _repo.AddAsync(
            dto.Username,
            dto.Email,
            dto.Password);

        return Ok(new
        {
            username = user.Username,
            email = user.Email
        });
    }

    [HttpPost("Login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var user =
            await _repo.FindByUsernameAsync(dto.UsernameOrEmail)
            ?? await _repo.FindByEmailAsync(dto.UsernameOrEmail);

        if (user is null || user.Password != dto.Password)
            return Unauthorized("Invalid username/email or password.");

        if (string.IsNullOrWhiteSpace(user.DocumentId))
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                "The user account is missing its Firestore document ID.");

        var jwtKey = _configuration["Jwt:Key"];

        if (string.IsNullOrWhiteSpace(jwtKey))
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                "Authentication is not configured.");

        var claims = new[]
        {
            new Claim(
                ClaimTypes.NameIdentifier,
                user.DocumentId),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email)
        };

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtKey));

        var credentials = new SigningCredentials(
            key,
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: credentials);

        var tokenString = new JwtSecurityTokenHandler()
            .WriteToken(token);

        return Ok(new
        {
            token = tokenString,
            user = new
            {
                username = user.Username,
                email = user.Email
            }
        });
    }

    
    [Authorize]
    [HttpDelete("DeleteAccount")]
    public async Task<IActionResult> DeleteAccount()
    {
        var documentId = User.FindFirst(
            ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrWhiteSpace(documentId))
            return Unauthorized("Your session is invalid. Please log in again.");

        // Confirm that the account still exists.
        var account = await _repo.FindByDocumentIdAsync(documentId);

        if (account is null)
            return NotFound("The account was not found.");

        // Remove the account's books first, then its user document.
        await _bookRepo.DeleteByOwnerIdAsync(documentId);
        await _repo.DeleteByDocumentIdAsync(documentId);

        return NoContent();
    }

    
    [Authorize]
    [HttpPut("UpdateAccount")]
    public async Task<IActionResult> UpdateAccount(UpdateAccountDto dto)
    {
        var documentId = User.FindFirst(
            ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrWhiteSpace(documentId))
            return Unauthorized("Please log in again.");

        var username = dto.Username.Trim();
        var email = dto.Email.Trim();

        if (string.IsNullOrWhiteSpace(username) ||
            string.IsNullOrWhiteSpace(email))
        {
            return BadRequest("Username and email are required.");
        }

        // Validate the reading goal BEFORE saving anything.
        if (dto.ReadingGoal < 1 || dto.ReadingGoal > 365)
        {
            return BadRequest(
                "Reading goal must be between 1 and 365 books.");
        }

        var account = await _repo.FindByDocumentIdAsync(documentId);

        if (account is null)
            return NotFound("Account not found.");

        var existingUsername =
            await _repo.FindByUsernameAsync(username);

        if (existingUsername is not null &&
            existingUsername.DocumentId != documentId)
        {
            return Conflict("Username is already taken.");
        }

        var existingEmail =
            await _repo.FindByEmailAsync(email);

        if (existingEmail is not null &&
            existingEmail.DocumentId != documentId)
        {
            return Conflict("Email is already registered.");
        }

        await _repo.UpdateAccountAsync(
            documentId,
            username,
            email,
            string.IsNullOrWhiteSpace(dto.Password)
                ? null
                : dto.Password,
            dto.ReadingGoal);

        return Ok(new
        {
            username,
            email,
            readingGoal = dto.ReadingGoal
        });
    }


}

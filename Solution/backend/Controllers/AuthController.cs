using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Shelved.Repositories;
using Shelved.Dtos;
using Shelved.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;

namespace Shelved.Controllers;

[ApiController]
[Route("[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserRepository _repo;
    private readonly IConfiguration _configuration;
    private readonly IBookRepository _bookRepo;
    private readonly IReadingListRepository _readingListRepo;
    private readonly IPasswordHasher<User> _passwordHasher;

    public AuthController(
    IUserRepository repo,
    IBookRepository bookRepo,
    IReadingListRepository readingListRepo,
    IConfiguration configuration,
    IPasswordHasher<User> passwordHasher)
    {
        _repo = repo;
        _bookRepo = bookRepo;
        _readingListRepo = readingListRepo;
        _configuration = configuration;
        _passwordHasher = passwordHasher;
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

        var passwordHash = _passwordHasher.HashPassword(
            new User(),
            dto.Password);
        var user = await _repo.AddAsync(
            dto.Username,
            dto.Email,
            passwordHash);

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

        if (user is null)
            return Unauthorized("Invalid username/email or password.");

        PasswordVerificationResult verificationResult;
        var isLegacyPassword = user.PasswordFormat is null;

        if (isLegacyPassword)
        {
            verificationResult = string.Equals(
                user.Password,
                dto.Password,
                StringComparison.Ordinal)
                ? PasswordVerificationResult.SuccessRehashNeeded
                : PasswordVerificationResult.Failed;
        }
        else if (user.PasswordFormat == Shelved.Models.User.IdentityPasswordFormat)
        {
            verificationResult = _passwordHasher.VerifyHashedPassword(
                user,
                user.Password,
                dto.Password);
        }
        else
        {
            verificationResult = PasswordVerificationResult.Failed;
        }

        if (verificationResult == PasswordVerificationResult.Failed)
            return Unauthorized("Invalid username/email or password.");

        if (string.IsNullOrWhiteSpace(user.DocumentId))
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                "The user account is missing its Firestore document ID.");

        if (verificationResult == PasswordVerificationResult.SuccessRehashNeeded)
        {
            var passwordHash = _passwordHasher.HashPassword(user, dto.Password);
            await _repo.UpdatePasswordAsync(
                user.DocumentId,
                passwordHash,
                Shelved.Models.User.IdentityPasswordFormat);
            user.Password = passwordHash;
            user.PasswordFormat = Shelved.Models.User.IdentityPasswordFormat;
        }

        var jwtKey = _configuration["Jwt:Key"];

        if (string.IsNullOrWhiteSpace(jwtKey))
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                "Authentication is not configured.");

        var configuredAdminEmail = _configuration["Admin:Email"];
        var isConfiguredAdmin = !string.IsNullOrWhiteSpace(configuredAdminEmail) &&
                                string.Equals(
                                    user.Email.Trim(),
                                    configuredAdminEmail.Trim(),
                                    StringComparison.OrdinalIgnoreCase);
        var role = isConfiguredAdmin || user.Role == Shelved.Models.User.AdminRole
            ? Shelved.Models.User.AdminRole
            : Shelved.Models.User.ReaderRole;

        if (user.Role != role)
        {
            await _repo.SetRoleAsync(user.DocumentId, role);
            user.Role = role;
        }

        var claims = new[]
        {
            new Claim(
                ClaimTypes.NameIdentifier,
                user.DocumentId),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, role)
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
                email = user.Email,
                role = user.Role
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

        if (account.Role == Shelved.Models.User.AdminRole)
        {
            return Conflict(
                "Admin accounts cannot be deleted through self-service. Ask another Admin to manage this account.");
        }

        await _bookRepo.DeleteByOwnerIdAsync(documentId);
        await _readingListRepo.DeleteByOwnerIdAsync(documentId);
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

        var configuredAdminEmail = _configuration["Admin:Email"]?.Trim();
        if (!string.IsNullOrWhiteSpace(configuredAdminEmail) &&
            (string.Equals(
                 account.Email.Trim(),
                 configuredAdminEmail,
                 StringComparison.OrdinalIgnoreCase) ||
             string.Equals(
                 email,
                 configuredAdminEmail,
                 StringComparison.OrdinalIgnoreCase)) &&
            !string.Equals(
                account.Email.Trim(),
                email,
                StringComparison.OrdinalIgnoreCase))
        {
            return Conflict(
                "The configured administrator email cannot be changed while it is reserved for Admin provisioning.");
        }

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

        var passwordHash = string.IsNullOrWhiteSpace(dto.Password)
            ? null
            : _passwordHasher.HashPassword(account, dto.Password);

        await _repo.UpdateAccountAsync(
            documentId,
            username,
            email,
            passwordHash,
            dto.ReadingGoal);

        return Ok(new
        {
            username,
            email,
            readingGoal = dto.ReadingGoal
        });
    }


}

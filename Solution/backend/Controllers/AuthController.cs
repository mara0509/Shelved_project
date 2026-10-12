using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Shelved.Repositories;
using Shelved.Dtos;
using Shelved.Models;

namespace Shelved.Controllers;

[ApiController]
[Route("[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserRepository _repo;
    private readonly IConfiguration _configuration;

    public AuthController(
        IUserRepository repo,
        IConfiguration configuration)
    {
        _repo = repo;
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
}

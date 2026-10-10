using Microsoft.AspNetCore.Mvc;
using Shelved.Repositories;
using Shelved.Dtos;
using Shelved.Models;


namespace Shelved.Controllers;

[ApiController]
[Route("[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserRepository _repo;

    public AuthController(IUserRepository repo)
    {
        _repo = repo;
    }

    [HttpPost("Register")]//endpoint for registering a new user, the route is /Auth/Register
    public async Task<ActionResult<User>> Register(RegisterDto dto)
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

        return Ok(user);
    }

    [HttpPost("Login")]
    public async Task<ActionResult<User>> Login(LoginDto dto)
    {
        var user = await _repo.FindByUsernameAsync(dto.UsernameOrEmail)
                    ?? await _repo.FindByEmailAsync(dto.UsernameOrEmail);

        if (user is null)
            return Unauthorized("Invalid username/email or password.");

        if (user.Password != dto.Password)
            return Unauthorized("Invalid username/email or password.");

        return Ok(user);
    }
}
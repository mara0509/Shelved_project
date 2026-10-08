using System.ComponentModel.DataAnnotations;

namespace Shelved.Dtos;

public class LoginDto
{
    [Required]
    public string UsernameOrEmail { get; set; } = "";

    [Required]
    public string Password { get; set; } = "";
}
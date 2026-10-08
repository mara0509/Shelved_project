using System.ComponentModel.DataAnnotations;

namespace Shelved.Dtos;
//But RegisterDto represents the information the frontend sends when creating an account:
//It's just the shape of the data coming from the frontend.
public class RegisterDto
{
    [Required]
    public string Username { get; set; } = "";

    [Required]
    [EmailAddress]
    public string Email { get; set; } = "";

    [Required]
    public string Password { get; set; } = "";
}
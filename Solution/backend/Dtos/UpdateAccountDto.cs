namespace Shelved.Dtos;

public class UpdateAccountDto
{
    public string Username { get; set; } = "";
    public string Email { get; set; } = "";
    public string? Password { get; set; }
    public int ReadingGoal { get; set; } = 12;
}
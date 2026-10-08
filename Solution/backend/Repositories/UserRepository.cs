using Shelved.Models;

namespace Shelved.Repositories;
//how do we do it, how do we search if somthing is already there or we create it again
public class UserRepository : IUserRepository
{
    private readonly List<User> _users = [];

    //public User? FindByUsername(string username)
    public Task<User?> FindByUsernameAsync(string username)
    {
        //return _users.FirstOrDefault(u => u.Username == username);
        return Task.FromResult(
            _users.FirstOrDefault(u => u.Username == username));
    }

    //public User? FindByEmail(string email)
    public Task<User?> FindByEmailAsync(string email)
    {
        //return _users.FirstOrDefault(u => u.Email == email);
        return Task.FromResult(
            _users.FirstOrDefault(u => u.Email == email));
    }

    public Task<bool> PasswordExistsAsync(string password)
    {
        //return _users.Any(u => u.Password == password);
        return Task.FromResult(
            _users.Any(u => u.Password == password));
    }

    public Task<User> AddAsync(string username, string email, string password)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = username,
            Email = email,
            Password = password
        };

        _users.Add(user);

        return Task.FromResult(user);
    }
}
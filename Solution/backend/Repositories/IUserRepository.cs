using Shelved.Models;

namespace Shelved.Repositories;

//what can we do with the user repository? we can find a user by username, find a user by email, check if a password exists, and add a new user
public interface IUserRepository
{
    //find if we already have this username in the database
    //User? FindByUsername(string username);
    Task<User?> FindByUsernameAsync(string username);
//find if we already have the same email 
    //User? FindByEmail(string email);
    Task<User?> FindByEmailAsync(string email);
//two users cannot have the same password
    Task<bool> PasswordExistsAsync(string password);
//this creates a new user and returns the user object
    Task<User> AddAsync(string username, string email, string password);
}
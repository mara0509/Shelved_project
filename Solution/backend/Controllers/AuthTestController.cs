
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Shelved.Controllers;

[ApiController]
[Route("[controller]")]
[Authorize]
public class AuthTestController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok("You are authenticated!");
    }
}

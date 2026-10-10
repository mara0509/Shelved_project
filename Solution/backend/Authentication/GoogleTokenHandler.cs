using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace Shelved.Authentication;

public sealed class GoogleTokenHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    private readonly IHttpClientFactory _httpClientFactory;

    public GoogleTokenHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        System.Text.Encodings.Web.UrlEncoder encoder,
        IHttpClientFactory httpClientFactory)
        : base(options, logger, encoder)
    {
        _httpClientFactory = httpClientFactory;
    }

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var authorization = Request.Headers.Authorization.ToString();

        if (!AuthenticationHeaderValue.TryParse(authorization, out var header) ||
            !string.Equals(header.Scheme, "Bearer", StringComparison.OrdinalIgnoreCase) ||
            string.IsNullOrWhiteSpace(header.Parameter))
        {
            return AuthenticateResult.NoResult();
        }

        var client = _httpClientFactory.CreateClient();
        using var request = new HttpRequestMessage(
            HttpMethod.Get, "https://openidconnect.googleapis.com/v1/userinfo");
        request.Headers.Authorization =
            new AuthenticationHeaderValue("Bearer", header.Parameter);

        using var response = await client.SendAsync(request, Context.RequestAborted);

        if (!response.IsSuccessStatusCode)
            return AuthenticateResult.Fail("Google access token is invalid or expired.");

        using var json = await JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync(Context.RequestAborted));

        var root = json.RootElement;
        var claims = new List<Claim>();

        if (root.TryGetProperty("sub", out var sub))
            claims.Add(new Claim(ClaimTypes.NameIdentifier, sub.GetString() ?? ""));

        if (root.TryGetProperty("email", out var email))
            claims.Add(new Claim(ClaimTypes.Email, email.GetString() ?? ""));

        if (root.TryGetProperty("name", out var name))
            claims.Add(new Claim(ClaimTypes.Name, name.GetString() ?? ""));

        if (!claims.Any(c => c.Type == ClaimTypes.NameIdentifier))
            return AuthenticateResult.Fail("Google did not return a user identifier.");

        var identity = new ClaimsIdentity(claims, Scheme.Name);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, Scheme.Name);

        return AuthenticateResult.Success(ticket);
    }
}

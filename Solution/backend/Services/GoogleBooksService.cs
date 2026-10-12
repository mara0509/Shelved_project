using System.Text.Json;

namespace Shelved.Services;

public class GoogleBooksService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;

    public GoogleBooksService(HttpClient httpClient)
    {
        _httpClient = httpClient;

        _apiKey = Environment.GetEnvironmentVariable("GOOGLE_BOOKS_API_KEY")
            ?? string.Empty;
    }

    public async Task<JsonElement> SearchAsync(
        string query,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            throw new InvalidOperationException(
                "Google Books API key is missing. Set the GOOGLE_BOOKS_API_KEY environment variable.");
        }

        var url =
            $"https://www.googleapis.com/books/v1/volumes?q={Uri.EscapeDataString(query)}&maxResults=20&key={Uri.EscapeDataString(_apiKey)}";

        using var response = await _httpClient.GetAsync(url, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);

            Console.WriteLine($"Google Books HTTP status: {(int)response.StatusCode}");
            Console.WriteLine($"Google Books error: {errorBody}");

            response.EnsureSuccessStatusCode();
        }

        using var document = JsonDocument.Parse(
            await response.Content.ReadAsStringAsync(cancellationToken));

        return document.RootElement.Clone();
    }
}

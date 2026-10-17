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

    public async Task<JsonElement?> GetBookDetailsAsync(
        string? externalGoogleBooksId,
        string title,
        string author,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
        {
            throw new InvalidOperationException(
                "Google Books API key is missing. Set the GOOGLE_BOOKS_API_KEY environment variable.");
        }

        var url = !string.IsNullOrWhiteSpace(externalGoogleBooksId)
            ? $"https://www.googleapis.com/books/v1/volumes/{Uri.EscapeDataString(externalGoogleBooksId)}?key={Uri.EscapeDataString(_apiKey)}"
            : $"https://www.googleapis.com/books/v1/volumes?q={Uri.EscapeDataString($"intitle:{title} inauthor:{author}")}&maxResults=10&key={Uri.EscapeDataString(_apiKey)}";

        using var response = await _httpClient.GetAsync(url, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            response.EnsureSuccessStatusCode();
        }

        using var document = JsonDocument.Parse(
            await response.Content.ReadAsStringAsync(cancellationToken));
        var root = document.RootElement;

        if (!string.IsNullOrWhiteSpace(externalGoogleBooksId))
        {
            return root.TryGetProperty("volumeInfo", out var volumeInfo)
                ? volumeInfo.Clone()
                : null;
        }

        if (!root.TryGetProperty("items", out var items) ||
            items.ValueKind != JsonValueKind.Array)
        {
            return null;
        }

        var normalizedTitle = Normalize(title);
        var normalizedAuthor = Normalize(author);
        foreach (var item in items.EnumerateArray())
        {
            if (!item.TryGetProperty("volumeInfo", out var candidate) ||
                !candidate.TryGetProperty("title", out var candidateTitle) ||
                candidateTitle.ValueKind != JsonValueKind.String ||
                !string.Equals(
                    Normalize(candidateTitle.GetString() ?? string.Empty),
                    normalizedTitle,
                    StringComparison.Ordinal))
            {
                continue;
            }

            if (string.IsNullOrWhiteSpace(normalizedAuthor) ||
                !candidate.TryGetProperty("authors", out var authors) ||
                authors.ValueKind != JsonValueKind.Array ||
                authors.EnumerateArray().Any(candidateAuthor =>
                    candidateAuthor.ValueKind == JsonValueKind.String &&
                    string.Equals(
                        Normalize(candidateAuthor.GetString() ?? string.Empty),
                        normalizedAuthor,
                        StringComparison.Ordinal)))
            {
                return candidate.Clone();
            }
        }

        return null;
    }

    private static string Normalize(string value) =>
        string.Join(
            ' ',
            value.Split(
                (char[]?)null,
                StringSplitOptions.RemoveEmptyEntries))
        .Trim()
        .ToUpperInvariant();
}

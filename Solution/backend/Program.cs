using Microsoft.Extensions.Options;
using Shelved.Repositories;
using Google.Cloud.Firestore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Shelved.Authentication;
using Microsoft.AspNetCore.Authentication;

var builder = WebApplication.CreateBuilder(args);
//connection from the firebase to our backend, that between the () is the ID of the firebase project
//so the rest of the application can receive it through dependency injection.
//Hey, if any part of my application needs to talk to Firestore, here's the Firestore connection you should give it
// the part from create means = Create a C# FirestoreDb object that knows how to communicate with the Firestore database belonging to this Firebase project
builder.Services.AddSingleton<FirestoreDb>(_=>FirestoreDb.Create("shelved-f3e7d"));
// Add services to the container.

builder.Services.AddHttpClient();

builder.Services
    .AddAuthentication("Google")
    .AddScheme<AuthenticationSchemeOptions, GoogleTokenHandler>(
        "Google", _ => { });

builder.Services.AddAuthorization();
builder.Services.AddAuthorization();
builder.Services.AddSingleton<IBookRepository, FirestoreBookRepository>();




builder.Services.AddControllers();
builder.Services.AddSingleton<IUserRepository, FirestoreUserRepository>();

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
// Generate API documentation and provide an interactive Swagger UI.
builder.Services.AddEndpointsApiExplorer();



builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("GoogleOAuth", new OpenApiSecurityScheme
    {
        Type = SecuritySchemeType.OAuth2,
        Flows = new OpenApiOAuthFlows
        {
            AuthorizationCode = new OpenApiOAuthFlow
            {
                AuthorizationUrl = new Uri(
                    "https://accounts.google.com/o/oauth2/v2/auth"),
                TokenUrl = new Uri(
                    "https://oauth2.googleapis.com/token"),
                Scopes = new Dictionary<string, string>
                {
                    ["openid"] = "Sign in",
                    ["email"] = "View email",
                    ["profile"] = "View profile"
                }
            }
        }
    });

    options.AddSecurityRequirement(document =>
        new OpenApiSecurityRequirement
        {
            [new OpenApiSecuritySchemeReference("GoogleOAuth", document)] = []
        });
});




var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();

    app.UseSwaggerUI(options =>
    {
        options.OAuthClientId(
            "112097306200-0p5044qf2s23gn3g35bqideqc40i0k6u.apps.googleusercontent.com");

        options.OAuthUsePkce();
        options.OAuthScopes("openid", "email", "profile");
    });
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
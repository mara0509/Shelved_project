using Shelved.Repositories;
using Google.Cloud.Firestore;


var builder = WebApplication.CreateBuilder(args);
//connection from the firebase to our backend, that between the () is the ID of the firebase project
//so the rest of the application can receive it through dependency injection.
//Hey, if any part of my application needs to talk to Firestore, here's the Firestore connection you should give it
// the part from create means = Create a C# FirestoreDb object that knows how to communicate with the Firestore database belonging to this Firebase project
builder.Services.AddSingleton<FirestoreDb>(_=>FirestoreDb.Create("shelved-f3e7d"));
// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddSingleton<IUserRepository, FirestoreUserRepository>();

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
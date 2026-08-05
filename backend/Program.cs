using backend;

if (File.Exists(".env"))
{
    DotNetEnv.Env.Load();
}

Environment.SetEnvironmentVariable("DOTNET_HOSTBUILDER__RELOADCONFIGONCHANGE", "false");

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRenderForwardedHeaders();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddAppAuthentication(builder.Configuration);
builder.Services.AddAppDatabase(builder.Configuration);
builder.Services.AddAppServices();
builder.Services.AddAppEmail(builder.Configuration);
builder.Services.AddAppCors();

var app = builder.Build();

app.UseForwardedHeaders();
app.UseCors("AllowFrontend");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

await DatabaseBootstrap.InitializeAsync(app);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Run();

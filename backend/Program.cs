using backend;
using backend.Repositories;
using backend.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Npgsql;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

if (File.Exists(".env"))
{
    DotNetEnv.Env.Load();
}

// Render free tier hits Linux inotify limits; disable config file watching.
Environment.SetEnvironmentVariable("DOTNET_HOSTBUILDER__RELOADCONFIGONCHANGE", "false");

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();


var jwtSecret =
    builder.Configuration["JwtSettings:Secret"]
    ?? Environment.GetEnvironmentVariable("JWT_SECRET")
    ?? "green-energy-monitor-dev-jwt-key-change-me-32chars!";

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Keep claim types as emitted (ClaimTypes.Role / Name), don't remap.
        options.MapInboundClaims = false;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
            RoleClaimType = System.Security.Claims.ClaimTypes.Role,
            NameClaimType = System.Security.Claims.ClaimTypes.Name,
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var header = context.Request.Headers.Authorization.FirstOrDefault();
                if (
                    !string.IsNullOrWhiteSpace(header)
                    && header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                )
                {
                    context.Token = header["Bearer ".Length..].Trim();
                }
                else
                {
                    context.Token = context.Request.Cookies["jwt_token"];
                }

                return Task.CompletedTask;
            },
        };
    });

builder.Services.AddAuthorization(options =>
{
    // Any controller/action without [AllowAnonymous] requires a valid JWT.
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();

    options.AddPolicy(
        "AdminOnly",
        policy => policy.RequireRole(AuthService.AdminRole)
    );
});

builder.Services.AddDbContext<EnergyDbContext>(options =>
{
    var connectionString =
        builder.Configuration.GetConnectionString("DefaultConnection")
        ?? Environment.GetEnvironmentVariable("DATABASE_URL")
        ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");

    if (string.IsNullOrWhiteSpace(connectionString))
    {
        throw new InvalidOperationException(
            "Missing database connection. Set ConnectionStrings:DefaultConnection or DATABASE_URL."
        );
    }

    // Hosted Postgres (Railway/Render) often provides postgres:// URLs.
    if (
        connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase)
        || connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase)
    )
    {
        var uri = new Uri(connectionString);
        var userInfo = uri.UserInfo.Split(':', 2);
        var user = Uri.UnescapeDataString(userInfo[0]);
        var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
        var database = uri.AbsolutePath.Trim('/');
        connectionString =
            $"Host={uri.Host};Port={(uri.Port > 0 ? uri.Port : 5432)};Database={database};Username={user};Password={password};SSL Mode=Require;Trust Server Certificate=true";
    }

    options.UseNpgsql(connectionString);
    options.ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));
});

builder.Services.AddScoped<IGenerationRepository, GenerationRepository>();
builder.Services.AddScoped<IHistoryRepository, HistoryRepository>();
builder.Services.AddScoped<IPreferencesRepository, PreferencesRepository>();
builder.Services.AddScoped<GenerationService>();
builder.Services.AddScoped<HistoryService>();
builder.Services.AddScoped<PreferencesService>();
builder.Services.AddHttpClient<EntsoeService>();
builder.Services.AddHttpClient("mailjet");
builder.Services.AddHostedService<EntsoeDataSyncService>();
builder.Services.Configure<backend.Models.EmailOptions>(
    builder.Configuration.GetSection(backend.Models.EmailOptions.SectionName)
);
// Allow MAILJET_* / SMTP_* / FRONTEND_BASE_URL names as docker-compose /.env on Render.
builder.Services.PostConfigure<backend.Models.EmailOptions>(options =>
{
    static string? Env(string key) => Environment.GetEnvironmentVariable(key);

    var mailjetKey = Env("MAILJET_API_KEY") ?? Env("Email__MailjetApiKey");
    if (!string.IsNullOrWhiteSpace(mailjetKey))
    {
        options.MailjetApiKey = mailjetKey;
    }

    var mailjetSecret = Env("MAILJET_SECRET_KEY") ?? Env("Email__MailjetSecretKey");
    if (!string.IsNullOrWhiteSpace(mailjetSecret))
    {
        options.MailjetSecretKey = mailjetSecret;
    }

    if (string.IsNullOrWhiteSpace(options.Host))
    {
        options.Host = Env("SMTP_HOST") ?? Env("Email__Host") ?? options.Host;
    }

    if (Env("SMTP_PORT") is { Length: > 0 } portText && int.TryParse(portText, out var port))
    {
        options.Port = port;
    }

    if (Env("SMTP_USE_SSL") is { Length: > 0 } sslText
        && bool.TryParse(sslText, out var useSsl))
    {
        options.UseSsl = useSsl;
    }

    if (string.IsNullOrWhiteSpace(options.Username))
    {
        options.Username = Env("SMTP_USERNAME") ?? Env("Email__Username") ?? options.Username;
    }

    if (string.IsNullOrWhiteSpace(options.Password))
    {
        options.Password = Env("SMTP_PASSWORD") ?? Env("Email__Password") ?? options.Password;
    }

    var from = Env("SMTP_FROM") ?? Env("Email__FromAddress");
    if (!string.IsNullOrWhiteSpace(from))
    {
        options.FromAddress = from;
    }

    var fromName = Env("Email__FromName");
    if (!string.IsNullOrWhiteSpace(fromName))
    {
        options.FromName = fromName;
    }

    var frontend =
        Env("FRONTEND_BASE_URL")
        ?? Env("Email__FrontendBaseUrl");
    if (!string.IsNullOrWhiteSpace(frontend))
    {
        options.FrontendBaseUrl = frontend;
    }
});
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddSingleton<IEmailMailboxVerifier, EmailMailboxVerifier>();
builder.Services.AddSingleton<PasswordProtector>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowFrontend",
        policy =>
        {
            var origins = (Environment.GetEnvironmentVariable("ALLOWED_ORIGINS") ?? "")
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .ToList();

            // Local defaults when ALLOWED_ORIGINS is not set.
            if (origins.Count == 0)
            {
                origins.AddRange(
                    [
                        "http://localhost:5173",
                        "http://localhost:5174",
                        "http://localhost:3000",
                    ]
                );
            }

            policy
                .WithOrigins(origins.ToArray())
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        }
    );
});

var app = builder.Build();
app.UseCors("AllowFrontend");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<EnergyDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Startup");

    try
    {
        await db.Database.MigrateAsync();
    }
    catch (PostgresException ex) when (ex.SqlState is "42701" or "42P07")
    {
        // Handles databases where schema objects were created manually before migrations ran.
        await db.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
            VALUES ({"20260713131344_AddSnapshotFieldsAndChartPoints"}, {"9.0.4"})
            ON CONFLICT ("MigrationId") DO NOTHING
            """);
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Database MigrateAsync failed; continuing with Ensure* bootstrap.");
    }

    await EnsureViewerTimezoneTableAsync(db);
    await EnsureUsersTableAsync(db);
    await EnsurePendingRegistrationsTableAsync(db);
    await EnsureRefreshTokensTableAsync(db);
    await EnsureReferenceDataAsync(db);
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Run();

static async Task EnsureViewerTimezoneTableAsync(EnergyDbContext db)
{
    await db.Database.ExecuteSqlRawAsync("""
        CREATE TABLE IF NOT EXISTS "ViewerTimezonePreferences" (
            "Id" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            "ClientId" character varying(100) NOT NULL,
            "CountryIso" character varying(10) NOT NULL,
            "TimeZone" character varying(100) NOT NULL,
            "UpdatedAt" timestamp with time zone NOT NULL
        );

        CREATE UNIQUE INDEX IF NOT EXISTS "IX_ViewerTimezonePreferences_ClientId"
            ON "ViewerTimezonePreferences" ("ClientId");
        """);
}

static async Task EnsureUsersTableAsync(EnergyDbContext db)
{
    await db.Database.ExecuteSqlRawAsync("""
        CREATE TABLE IF NOT EXISTS "Users" (
            "Id" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            "Username" text NOT NULL DEFAULT '',
            "Email" text NOT NULL,
            "DisplayName" text NOT NULL DEFAULT '',
            "Gender" text NOT NULL DEFAULT 'Other',
            "PasswordHash" text NOT NULL,
            "Role" text NOT NULL DEFAULT 'Viewer',
            "CreatedAt" timestamp with time zone NOT NULL
        );

        CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_Email"
            ON "Users" ("Email");
        """);

    await db.Database.ExecuteSqlRawAsync("""
        DO $upgrade$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'Users' AND column_name = 'Role'
            ) THEN
                ALTER TABLE "Users" ADD COLUMN "Role" text;
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'Users' AND column_name = 'Username'
            ) THEN
                ALTER TABLE "Users" ADD COLUMN "Username" text;
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'Users' AND column_name = 'DisplayName'
            ) THEN
                ALTER TABLE "Users" ADD COLUMN "DisplayName" text;
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'Users' AND column_name = 'Gender'
            ) THEN
                ALTER TABLE "Users" ADD COLUMN "Gender" text;
            END IF;

            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'Users' AND column_name = 'IsAdmin'
            ) THEN
                EXECUTE $sql$
                    UPDATE "Users"
                    SET "Role" = CASE
                        WHEN COALESCE("IsAdmin", false) THEN 'Admin'
                        ELSE 'Viewer'
                    END
                    WHERE "Role" IS NULL OR btrim("Role") = ''
                $sql$;
            ELSE
                UPDATE "Users"
                SET "Role" = 'Viewer'
                WHERE "Role" IS NULL OR btrim("Role") = '';
            END IF;

            UPDATE "Users" SET "Role" = 'Viewer' WHERE "Role" IS NULL OR btrim("Role") = '';
            ALTER TABLE "Users" ALTER COLUMN "Role" SET DEFAULT 'Viewer';
            ALTER TABLE "Users" ALTER COLUMN "Role" SET NOT NULL;

            -- Fill missing usernames from email + id so values stay unique.
            UPDATE "Users"
            SET "Username" = lower(split_part("Email", '@', 1)) || '_' || "Id"::text
            WHERE "Username" IS NULL OR btrim("Username") = '';

            UPDATE "Users"
            SET "DisplayName" = COALESCE(NULLIF(btrim("DisplayName"), ''), "Username")
            WHERE "DisplayName" IS NULL OR btrim("DisplayName") = '';

            UPDATE "Users"
            SET "Gender" = 'Other'
            WHERE "Gender" IS NULL OR btrim("Gender") = '';

            ALTER TABLE "Users" ALTER COLUMN "Username" SET DEFAULT '';
            ALTER TABLE "Users" ALTER COLUMN "DisplayName" SET DEFAULT '';
            ALTER TABLE "Users" ALTER COLUMN "Gender" SET DEFAULT 'Other';
            ALTER TABLE "Users" ALTER COLUMN "Username" SET NOT NULL;
            ALTER TABLE "Users" ALTER COLUMN "DisplayName" SET NOT NULL;
            ALTER TABLE "Users" ALTER COLUMN "Gender" SET NOT NULL;

            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'Users' AND column_name = 'PasswordResetTokenHash'
            ) THEN
                ALTER TABLE "Users" ADD COLUMN "PasswordResetTokenHash" character varying(128);
            END IF;

            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'Users' AND column_name = 'PasswordResetTokenExpiresAt'
            ) THEN
                ALTER TABLE "Users" ADD COLUMN "PasswordResetTokenExpiresAt" timestamp with time zone;
            END IF;
        END
        $upgrade$;
        """);

    // Best-effort unique username index (ignore if duplicates still exist).
    try
    {
        await db.Database.ExecuteSqlRawAsync("""
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_Users_Username"
                ON "Users" ("Username");
            """);
    }
    catch (Exception)
    {
        // Keep running even if legacy data has duplicate usernames.
    }

    try
    {
        await db.Database.ExecuteSqlRawAsync("""
            CREATE INDEX IF NOT EXISTS "IX_Users_PasswordResetTokenHash"
                ON "Users" ("PasswordResetTokenHash");
            """);
    }
    catch (Exception)
    {
        // Ignore if index cannot be created.
    }
}

static async Task EnsurePendingRegistrationsTableAsync(EnergyDbContext db)
{
    await db.Database.ExecuteSqlRawAsync("""
        CREATE TABLE IF NOT EXISTS "PendingRegistrations" (
            "Id" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            "Username" text NOT NULL,
            "Email" text NOT NULL,
            "DisplayName" text NOT NULL,
            "Gender" text NOT NULL,
            "PasswordHash" text NOT NULL,
            "TokenHash" character varying(128) NOT NULL,
            "ExpiresAt" timestamp with time zone NOT NULL,
            "CreatedAt" timestamp with time zone NOT NULL
        );

        CREATE UNIQUE INDEX IF NOT EXISTS "IX_PendingRegistrations_Username"
            ON "PendingRegistrations" ("Username");

        CREATE UNIQUE INDEX IF NOT EXISTS "IX_PendingRegistrations_TokenHash"
            ON "PendingRegistrations" ("TokenHash");
        """);
}

static async Task EnsureRefreshTokensTableAsync(EnergyDbContext db)
{
    await db.Database.ExecuteSqlRawAsync("""
        CREATE TABLE IF NOT EXISTS "RefreshTokens" (
            "Id" integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            "UserId" integer NOT NULL,
            "TokenHash" character varying(128) NOT NULL,
            "ExpiresAt" timestamp with time zone NOT NULL,
            "CreatedAt" timestamp with time zone NOT NULL,
            "RevokedAt" timestamp with time zone NULL,
            CONSTRAINT "FK_RefreshTokens_Users_UserId"
                FOREIGN KEY ("UserId") REFERENCES "Users" ("Id") ON DELETE CASCADE
        );

        CREATE UNIQUE INDEX IF NOT EXISTS "IX_RefreshTokens_TokenHash"
            ON "RefreshTokens" ("TokenHash");

        CREATE INDEX IF NOT EXISTS "IX_RefreshTokens_UserId"
            ON "RefreshTokens" ("UserId");
        """);
}

static async Task EnsureReferenceDataAsync(EnergyDbContext db)
{
    var existingZones = await db.CountryZones
        .Select(zone => new { zone.IsoCode, zone.ZoneCode })
        .ToListAsync();

    var existingZoneKeys = existingZones
        .Select(zone => (zone.IsoCode.ToUpperInvariant(), zone.ZoneCode))
        .ToHashSet();

    foreach (var (iso, zoneCodes) in CountryCatalog.ZoneCodes)
    {
        foreach (var zoneCode in zoneCodes)
        {
            if (existingZoneKeys.Contains((iso, zoneCode)))
            {
                continue;
            }

            db.CountryZones.Add(new backend.Models.CountryZone
            {
                IsoCode = iso,
                ZoneCode = zoneCode,
            });
        }
    }

    var existingSourceCodes = await db.EnergySources
        .Select(source => source.Code)
        .ToListAsync();

    var existingSourceSet = existingSourceCodes
        .Select(code => code.ToUpperInvariant())
        .ToHashSet();

    foreach (var (code, source) in CountryCatalog.EnergySources)
    {
        if (existingSourceSet.Contains(code.ToUpperInvariant()))
        {
            continue;
        }

        db.EnergySources.Add(new backend.Models.EnergySource
        {
            Code = code,
            Name = source.Name,
            IsRenewable = source.Renewable,
        });
    }

    if (db.ChangeTracker.HasChanges())
    {
        await db.SaveChangesAsync();
    }
}

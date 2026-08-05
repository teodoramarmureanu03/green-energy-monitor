using System.Text;
using backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;

namespace backend;

public static class AuthExtensions
{
    public static IServiceCollection AddAppAuthentication(
        this IServiceCollection services,
        IConfiguration configuration
    )
    {
        var jwtSecret =
            configuration["JwtSettings:Secret"]
            ?? Environment.GetEnvironmentVariable("JWT_SECRET")
            ?? "green-energy-monitor-dev-jwt-key-change-me-32chars!";

        services
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

        services.AddAuthorization(options =>
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

        return services;
    }
}

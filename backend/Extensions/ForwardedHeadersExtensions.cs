using Microsoft.AspNetCore.HttpOverrides;

namespace backend;

public static class ForwardedHeadersExtensions
{
    /// <summary>
    /// Render (and similar PaaS) terminate TLS at the proxy and forward plain HTTP.
    /// Without this, Request.IsHttps is false → refresh cookie is SameSite=Lax
    /// and is not sent on cross-origin XHR from the frontend Static Site.
    /// </summary>
    public static IServiceCollection AddRenderForwardedHeaders(this IServiceCollection services)
    {
        services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders =
                ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
            options.KnownNetworks.Clear();
            options.KnownProxies.Clear();
        });

        return services;
    }
}

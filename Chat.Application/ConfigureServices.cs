using Microsoft.Extensions.DependencyInjection;

namespace Chat.Application
{
    public static class ConfigureServices
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
           
            //services.AddScoped<IService, Service>();
            return services;

        }
    }
}

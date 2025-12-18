using Chat.Application.Interfaces.Services.Chat;
using Chat.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Chat.Application
{
    public static class ConfigureServices
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {

            services.AddScoped<IChatService, ChatService>();
            services.AddScoped<IChatAdminService, ChatAdminService>();

            return services;

        }
    }
}

using Chat.Application.Mappings;
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
            services.AddAutoMapper(cfg => cfg.AddProfile<MappingProfile>());

            return services;

        }
    }
}

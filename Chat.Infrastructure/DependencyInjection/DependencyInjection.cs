using Chat.Application.Interfaces.Services;
using Chat.Infrastructure.Repositories;

namespace Chat.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

            services.AddScoped<IUnitOfWork, UnitOfWork>();
            services.AddScoped<IApplicationUserService, ApplicationUserService>();
            services.AddHostedService<Services.ChatTimeoutService>();


            return services;
        }
    }
}

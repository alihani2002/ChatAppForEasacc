using Chat.Infrastructure.Repositories;
using Chat.Infrastructure.SignalR;
using Microsoft.AspNetCore.SignalR;

namespace Chat.Infrastructure
{
    public static class ConfigureServices
    {
        public static IServiceCollection AddInfrastructureServices(this IServiceCollection services,
            IConfiguration configuration)
        {
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(
                    configuration.GetConnectionString("DefaultConnection"),
                    b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)
                ));

            // Register Infrastructure Dependencies
            services.AddScoped<IApplicationDbContext, ApplicationDbContext>();
            services.AddScoped<IUnitOfWork, UnitOfWork>();
            services.AddSingleton<IUserIdProvider, UserIdProvider>();


            return services;
        }
    }
}

using Chat.Application.Interfaces.Services;
using Chat.Infrastructure.Repositories;

namespace Chat.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            // ✅ Database Context
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

            // ✅ Unit of Work registration
            services.AddScoped<IUnitOfWork, UnitOfWork>();


            return services;
        }

        public static IServiceCollection AddApplication(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddScoped<IApplicationUserService, ApplicationUserService>();
           

            return services;
        }
    }
}

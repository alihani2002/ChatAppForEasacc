using Chat.Application.Interfaces.Services;
using Chat.Application.Mappings;
using Chat.Application.Services.Email;
using Chat.Core;
using Chat.infrastructure.Data;
using Chat.Infrastructure.SignalR;
using Chat.WebUI.Helper;
using Chat.WebUI.Services;
using Microsoft.AspNetCore.SignalR;

namespace Chat.WebUI
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddWebServices(this IServiceCollection services, WebApplicationBuilder builder)
        {
            // ==============================================
            // Register DbContext
            // ==============================================
            var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(connectionString));

            // ==============================================
            // Identity
            // ==============================================
            services.AddIdentity<ApplicationUser, IdentityRole>(options =>
            {
                options.User.RequireUniqueEmail = false;
                options.SignIn.RequireConfirmedEmail = false;

                options.Password.RequiredLength = 8;
                options.Password.RequireDigit = false;
                options.Password.RequireLowercase = false;
                options.Password.RequireUppercase = false;
                options.Password.RequireNonAlphanumeric = false;

                options.Lockout.MaxFailedAccessAttempts = 5;
            })
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();

            // ==============================================
            // Cookie
            // ==============================================
            services.ConfigureApplicationCookie(options =>
            {
                options.Cookie.HttpOnly = true;
                options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
                options.Cookie.SameSite = SameSiteMode.Strict;
                options.Cookie.Name = "Portfolio.Auth";

                options.ExpireTimeSpan = TimeSpan.FromMinutes(120);
                options.SlidingExpiration = true;

                options.LoginPath = "/Identity/Account/Login";
                options.AccessDeniedPath = "/Identity/Account/AccessDenied";
            });

            // ==============================================
            // AutoMapper
            // ==============================================
            services.AddAutoMapper(cfg => cfg.AddProfile<MappingProfile>());

            // ==============================================
            // File Service
            // ==============================================
            services.AddScoped<IFileServices, FileServices>();
            builder.Services.AddScoped<IEmailService, EmailService>();
            services.AddScoped<IFileService, FileService>();
            builder.Services.AddSingleton<IUserIdProvider, UserIdProvider>();


            return services;
        }
    }
}

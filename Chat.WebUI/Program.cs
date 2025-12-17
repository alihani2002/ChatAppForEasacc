using Chat.API.Seeds;
using Chat.Application;
using Chat.Core;
using Chat.infrastructure.Data;
using Chat.Infrastructure;
using Chat.WebUI;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);


// =======================================
// Services Registration
// =======================================

builder.Services
    .AddApplicationServices()
    .AddInfrastructure(builder.Configuration)
    .AddWebServices(builder);

// MVC
builder.Services.AddControllersWithViews(options =>
{
    options.Filters.Add(new AutoValidateAntiforgeryTokenAttribute());
});

builder.Services.AddRazorPages();

// SignalR (���� �����)
builder.Services.AddSignalR();

var app = builder.Build();

// =======================================
// Apply Seeds
// =======================================
using (var scope = app.Services.CreateScope())
{
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

    await DefaultRoles.SeedAsync(roleManager);
    await DefaultUsers.SeedAdminUserAsync(userManager);
}

// =======================================
// Middleware
// =======================================
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

// =======================================
// Endpoints
// =======================================
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.MapRazorPages();

// SignalR Hub
app.MapHub<ChatHub>("/chatHub");

app.Run();

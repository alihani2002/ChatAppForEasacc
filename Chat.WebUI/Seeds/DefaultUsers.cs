using Chat.Core;
namespace Chat.API.Seeds
{
    public static class DefaultUsers
    {
        public static async Task SeedAdminUserAsync(UserManager<ApplicationUser> userManager)
        {
            const string adminEmail = "admin@gmail.com";

            var user = await userManager.FindByEmailAsync(adminEmail);
            if (user != null) return;

            var admin = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FullName = "Admin",
                EmailConfirmed = true ,
                Role = "Admin",
            };

            var result = await userManager.CreateAsync(admin, "P@ssword123");

            if (!result.Succeeded)
                throw new Exception(string.Join(", ", result.Errors.Select(e => e.Description)));

            await userManager.AddToRoleAsync(admin, AppRoles.Admin);
        }
    }
}
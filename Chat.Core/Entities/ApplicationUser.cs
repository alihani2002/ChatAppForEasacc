namespace Chat.Core
{
    public class ApplicationUser : IdentityUser
    {
        [MaxLength(150)]
        public string? FirstName { get; set; } 
        [MaxLength(150)]
        public string? LastName { get; set; }
        public string? FullName { get; set; } 
        public bool? IsDeleted { get; set; }
        public DateTime CreatedOn { get; set; } = DateTime.Now;
        public string Role { get; set; } = null!;


    }
}

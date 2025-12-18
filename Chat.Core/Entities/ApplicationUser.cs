using Chat.Core.Entities;

namespace Chat.Core
{
    public class ApplicationUser : IdentityUser
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? FullName { get; set; }
        public bool? IsDeleted { get; set; }
        public DateTime CreatedOn { get; set; } = DateTime.Now;
        public string Role { get; set; } = null!;

        // 🔗 Relations
        public ICollection<ChatSession> UserChatSessions { get; set; } = new List<ChatSession>();
        public ICollection<ChatSession> AdminChatSessions { get; set; } = new List<ChatSession>();
        public ICollection<Message> Messages { get; set; } = new List<Message>();
    }

}

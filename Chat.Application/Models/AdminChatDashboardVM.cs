namespace Chat.Application.Models
{
    public class AdminChatDashboardVM
    {
        public IEnumerable<ChatSessionVM> Sessions { get; set; } = [];
        public int? ActiveSessionId { get; set; }
    }
}

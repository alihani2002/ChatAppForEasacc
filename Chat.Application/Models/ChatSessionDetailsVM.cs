using Chat.Application.Models;

namespace Chat.Application
{
    public class ChatSessionDetailsVM
    {

        public int SessionId { get; set; }

        public string UserId { get; set; } = null!;

        public bool IsClosed { get; set; }

        public List<MessageVM> Messages { get; set; } = new();
    }
}

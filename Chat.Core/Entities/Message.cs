

namespace Chat.Core.Entities
{
    public class Message : BaseEntity
    {
        public int ChatSessionId { get; set; }
        public ChatSession ChatSession { get; set; } = null!;

        public string SenderId { get; set; } = null!;
        public string Content { get; set; } = null!;

        public MessageType MessageType { get; set; }
        public MessageStatus Status { get; set; }
    }
}

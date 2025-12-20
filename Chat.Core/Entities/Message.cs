

namespace Chat.Core.Entities
{
    public class Message : BaseEntity
    {
        public int ChatSessionId { get; set; }
        public ChatSession ChatSession { get; set; } = null!;

        public string SenderId { get; set; } = null!;
        public ApplicationUser Sender { get; set; } = null!;

        public string? Content { get; set; }   // null في حالة الملفات
        public MessageType MessageType { get; set; }
        public MessageStatus Status { get; set; }

        public string? FileUrl { get; set; }
        public string? FileName { get; set; }

        // للصوت
        public int? VoiceDurationSeconds { get; set; }
    }
}

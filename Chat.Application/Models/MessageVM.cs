using Chat.Core.Enums;


namespace Chat.Application.Models
{
    public class MessageVM
    {
        public int Id { get; set; }

        public string SenderId { get; set; } = null!;

        public string? Content { get; set; }  // Nullable for file messages

        public MessageType MessageType { get; set; }

        public MessageStatus Status { get; set; }

        public DateTime CreatedOn { get; set; }

        // File message properties
        public string? FileUrl { get; set; }

        public string? FileName { get; set; }

        public int? VoiceDurationSeconds { get; set; }
    }
}

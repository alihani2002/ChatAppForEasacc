using Chat.Core.Enums;


namespace Chat.Application.Models
{
    public class MessageVM
    {
        public int Id { get; set; }

        public string SenderId { get; set; } = null!;

        public string Content { get; set; } = null!;

        public MessageType MessageType { get; set; }

        public MessageStatus Status { get; set; }

        public DateTime CreatedOn { get; set; }
    }
}

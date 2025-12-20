using Chat.Core.Enums;

namespace Chat.Application
{
    public class MessageStatusUpdateDto
    {
        public int MessageId { get; set; }
        public MessageStatus Status { get; set; }
    }
}
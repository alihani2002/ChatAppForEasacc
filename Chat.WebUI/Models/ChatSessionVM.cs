namespace Chat.WebUI.Models
{
    public class ChatSessionVM
    {
        public int Id { get; set; }
        public string UserId { get; set; } = null!;
        public bool IsClosed { get; set; }
        public int MessagesCount { get; set; }
    }
}

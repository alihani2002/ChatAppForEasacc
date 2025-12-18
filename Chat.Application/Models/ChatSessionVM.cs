namespace Chat.Application
{
    public class ChatSessionVM
    {
        public int Id { get; set; }
        public string UserId { get; set; } = null!;
        public bool IsClosed { get; set; }
        public int MessagesCount { get; set; }
         public DateTime CreatedOn { get; set; }
        public DateTime? LastMessageOn { get; set; }

    }
}

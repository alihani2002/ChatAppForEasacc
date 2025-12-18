namespace Chat.Core.Entities
{
    public class ChatSession : BaseEntity
    {
        public string UserId { get; set; } = null!;
        public ApplicationUser User { get; set; } = null!;

        public string? AdminId { get; set; }
        public ApplicationUser? Admin { get; set; }

        public bool IsClosed { get; set; }
        public DateTime? LastMessageOn { get; set; }

        public ICollection<Message> Messages { get; set; } = new List<Message>();
    }

}

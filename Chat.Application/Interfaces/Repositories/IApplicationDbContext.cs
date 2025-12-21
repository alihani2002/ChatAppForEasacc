namespace Chat.Application.Interfaces.Repositories
{
    public interface IApplicationDbContext
    {
        DbSet<ChatSession> ChatSessions { get; }
        DbSet<Message> Messages { get; }

        int SaveChanges();
    }

}

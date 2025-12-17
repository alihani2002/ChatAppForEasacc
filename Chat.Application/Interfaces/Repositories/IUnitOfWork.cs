using Chat.Core.Entities;

namespace Chat.Application.Interfaces.Repositories
{
    public interface IUnitOfWork : IDisposable
    {
        IBaseRepository<ApplicationUser> ApplicationUsers { get; }
        IBaseRepository<ChatSession> ChatSessions { get; }
        IBaseRepository<Message> Messages { get; }

        int Complete();
    }
}

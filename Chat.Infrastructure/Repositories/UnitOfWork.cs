using Chat.Core.Entities;

namespace Chat.Infrastructure.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly ApplicationDbContext _context;

        public UnitOfWork(ApplicationDbContext context)
        {
            _context = context;
        }

        public IBaseRepository<ApplicationUser> ApplicationUsers => new BaseRepository<ApplicationUser>(_context);

        public IBaseRepository<ChatSession> ChatSessions => new BaseRepository<ChatSession>(_context);

        public IBaseRepository<Message> Messages => new BaseRepository<Message>(_context);

        public int Complete() => _context.SaveChanges();

        public void Dispose() => _context.Dispose();
    }
}

using Chat.Core.Entities;

namespace Chat.infrastructure.Data
{
	public class ApplicationDbContext:  IdentityDbContext<ApplicationUser> , IApplicationDbContext

    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {

        }

        public DbSet<ChatSession> ChatSessions { get; set; } 

        public DbSet<Message> Messages { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

			base.OnModelCreating(modelBuilder);

        }
    }
}

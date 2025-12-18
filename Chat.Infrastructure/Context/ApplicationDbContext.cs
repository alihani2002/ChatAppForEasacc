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

        protected override void OnModelCreating(ModelBuilder builder)
        {
            builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

			base.OnModelCreating(builder);

            // ChatSession → User
            builder.Entity<ChatSession>()
                .HasOne(cs => cs.User)
                .WithMany(u => u.UserChatSessions)
                .HasForeignKey(cs => cs.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // ChatSession → Admin
            builder.Entity<ChatSession>()
                .HasOne(cs => cs.Admin)
                .WithMany(u => u.AdminChatSessions)
                .HasForeignKey(cs => cs.AdminId)
                .OnDelete(DeleteBehavior.Restrict);

            // Message → Sender
            builder.Entity<Message>()
                .HasOne(m => m.Sender)
                .WithMany(u => u.Messages)
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            // Message → ChatSession
            builder.Entity<Message>()
                .HasOne(m => m.ChatSession)
                .WithMany(cs => cs.Messages)
                .HasForeignKey(m => m.ChatSessionId);

        }
    }
}

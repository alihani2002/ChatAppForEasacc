using Chat.Core.Entities;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Chat.Infrastructure.Data.Configurations
{
    public class ChatSessionConfiguration : IEntityTypeConfiguration<ChatSession>
    {
        public void Configure(EntityTypeBuilder<ChatSession> builder)
        {
            builder.HasKey(x => x.Id);

            builder.Property(x => x.UserId)
                   .IsRequired();

            builder.Property(x => x.IsClosed)
                   .HasDefaultValue(false);

            builder.HasIndex(x => x.UserId);

            builder.HasMany(x => x.Messages)
                   .WithOne(x => x.ChatSession)
                   .HasForeignKey(x => x.ChatSessionId);
        }
    }
}

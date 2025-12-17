using Chat.Core.Entities;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
namespace Chat.Infrastructure.Data.Configurations
{
    public class MessageConfiguration : IEntityTypeConfiguration<Message>
    {
        public void Configure(EntityTypeBuilder<Message> builder)
        {
            builder.Property(x => x.Content)
                   .IsRequired()
                   .HasMaxLength(2000);

            builder.Property(x => x.SenderId)
                   .IsRequired();
        }
    }

}

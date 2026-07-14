using MessengerApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MessengerApp.Infrastructure.Persistence.Configurations;

public class ChannelConfiguration : IEntityTypeConfiguration<Channel>
{
    public void Configure(EntityTypeBuilder<Channel> builder)
    {
        builder.ToTable("Channels");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Name)
            .HasMaxLength(100);

        builder.Property(c => c.Description)
            .HasMaxLength(500);

        builder.Property(c => c.AvatarUrl)
            .HasMaxLength(1024);

        builder.Property(c => c.Type)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(c => c.IsSecret)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(c => c.EncryptionSalt)
            .HasMaxLength(64);

        builder.HasMany(c => c.Members)
            .WithOne(m => m.Channel)
            .HasForeignKey(m => m.ChannelId)
            .OnDelete(DeleteBehavior.Cascade);

        // Soft delete index
        builder.HasIndex(c => c.IsDeleted);
    }
}

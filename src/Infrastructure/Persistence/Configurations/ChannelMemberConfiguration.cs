using MessengerApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MessengerApp.Infrastructure.Persistence.Configurations;

public class ChannelMemberConfiguration : IEntityTypeConfiguration<ChannelMember>
{
    public void Configure(EntityTypeBuilder<ChannelMember> builder)
    {
        builder.ToTable("ChannelMembers");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.Role)
            .HasConversion<int>()
            .IsRequired();

        // Unique constraint: A user can only belong to a channel once
        builder.HasIndex(m => new { m.ChannelId, m.UserId })
            .IsUnique();

        builder.HasIndex(m => m.UserId);

        builder.HasOne(m => m.User)
            .WithMany()
            .HasForeignKey(m => m.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(m => !m.Channel.IsDeleted);
    }
}
